import os
import sys
import re
import json
import time
import glob
import requests
from pathlib import Path

# Force UTF-8 stdout for Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Load .env.local
env_local = Path(__file__).parent.parent / ".env.local"
if env_local.exists():
    for line in env_local.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip().strip('"').strip("'")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
JINA_KEY = os.environ.get("JINA_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not JINA_KEY:
    print("[ERROR] Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or JINA_API_KEY in .env.local", flush=True)
    sys.exit(1)

NEW_SOURCES_DIR = Path(__file__).parent.parent / "New Sources"
PROCESSED_DIR = Path(__file__).parent.parent / "data" / "new_sources" / "processed"
STATUS_FILE = Path(__file__).parent.parent / "logs" / "new_sources_status.json"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

JINA_HEADERS = {
    "Authorization": f"Bearer {JINA_KEY}",
    "Content-Type": "application/json"
}

MEDICAL_KEYWORDS = [
    "herb", "remedy", "treatment", "fever", "pain", "dosage", "cure", "symptom",
    "plant", "first aid", "emergency", "nutrition", "decoction", "powder", "oil",
    "extract", "tonic", "medicine", "health", "disease", "inflammation", "infection",
    "stomach", "headache", "cold", "cough", "skin", "wound", "ointment", "tincture"
]

def write_status(current_file, file_idx, total_files, current_chunks, inserted_rows, total_added):
    status = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "current_file": current_file,
        "file_progress": f"{file_idx}/{total_files}",
        "current_chunks": current_chunks,
        "inserted_rows": inserted_rows,
        "total_added": total_added,
        "status": "RUNNING" if file_idx <= total_files else "COMPLETED"
    }
    with open(STATUS_FILE, "w", encoding="utf-8") as f:
        json.dump(status, f, indent=2)

def detect_keywords(text: str) -> list:
    text_lower = text.lower()
    found = [kw for kw in MEDICAL_KEYWORDS if kw in text_lower]
    return list(set(found))[:10]

def parse_header_metadata(filepath: Path):
    title = filepath.stem
    author = "Unknown Author"
    category = "medical_home_care"
    
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            header_lines = [f.readline() for _ in range(50)]
            header_text = "".join(header_lines)
            
            t_match = re.search(r"Title:\s*(.*)", header_text, re.IGNORECASE)
            if t_match:
                title = t_match.group(1).strip()
            
            a_match = re.search(r"Author:\s*(.*)", header_text, re.IGNORECASE)
            if a_match:
                author = a_match.group(1).strip()
    except Exception as e:
        print(f"  ⚠️ Error reading metadata for {filepath.name}: {e}", flush=True)
        
    if "herbal" in title.lower() or "culpeper" in title.lower() or "weeds" in title.lower():
        category = "herbal_remedies"
    elif "first aid" in title.lower() or "accidents" in title.lower() or "emergencies" in title.lower():
        category = "first_aid_emergency"
    elif "remedies" in title.lower() or "domestic medicine" in title.lower():
        category = "home_remedies"
    elif "fasting" in title.lower() or "diet" in title.lower():
        category = "natural_health_wellness"

    return title, author, category

def clean_and_strip_gutenberg(text: str) -> str:
    # Strip Gutenberg Start disclaimer
    start_match = re.search(r"\*\*\*\s*START OF TH(IS|E) PROJECT GUTENBERG EBOOK.*?\*\*\*", text, re.IGNORECASE | re.DOTALL)
    if start_match:
        text = text[start_match.end():]
        
    # Strip Gutenberg End disclaimer
    end_match = re.search(r"\*\*\*\s*END OF TH(IS|E) PROJECT GUTENBERG EBOOK", text, re.IGNORECASE)
    if end_match:
        text = text[:end_match.start()]
        
    text = re.sub(r"\r\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()

def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150):
    start = 0
    length = len(text)
    while start < length:
        end = min(start + chunk_size, length)
        if end < length:
            boundary = text.rfind(". ", start, end)
            if boundary > start + chunk_size // 2:
                end = boundary + 1
        chunk = text[start:end].strip()
        if len(chunk) > 100:
            yield chunk
        next_start = end - overlap
        if next_start <= start:
            next_start = end
        start = next_start

def get_existing_db_texts():
    print("[INFO] Fetching existing knowledge chunk texts from Supabase to skip duplicates...", flush=True)
    existing = set()
    offset = 0
    limit = 2000
    while True:
        url = f"{SUPABASE_URL}/rest/v1/ayurvedic_knowledge_embeddings?select=text&source=eq.NewSources&limit={limit}&offset={offset}"
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code != 200:
            break
        data = resp.json()
        if not data:
            break
        for row in data:
            existing.add(row["text"])
        if len(data) < limit:
            break
        offset += limit
    print(f"[INFO] Loaded {len(existing)} existing NewSources chunks from database.\n", flush=True)
    return existing

def generate_jina_embeddings_batch(texts: list) -> list:
    payload = {
        "model": "jina-embeddings-v3",
        "input": texts,
        "dimensions": 768
    }
    resp = requests.post("https://api.jina.ai/v1/embeddings", json=payload, headers=JINA_HEADERS, timeout=60)
    if resp.status_code != 200:
        raise Exception(f"Jina API Error {resp.status_code}: {resp.text}")
    data = resp.json()
    return [d["embedding"] for d in data["data"]]

def process_file(filepath: Path, existing_texts: set, file_idx: int, total_files: int, total_added_ref: list):
    title, author, category = parse_header_metadata(filepath)
    print(f"\n=======================================================", flush=True)
    print(f"📖 [{file_idx}/{total_files}] Processing: {title}", flush=True)
    print(f"   Author: {author} | Category: {category} | File: {filepath.name}", flush=True)
    print(f"=======================================================", flush=True)
    
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        full_text = f.read()
        
    clean_text = clean_and_strip_gutenberg(full_text)
    chunks = list(chunk_text(clean_text, chunk_size=800, overlap=150))
    print(f"[INFO] Extracted {len(chunks)} text chunks.", flush=True)
    
    # Save structured jsonl chunk file locally
    jsonl_out = PROCESSED_DIR / f"{filepath.stem}.jsonl"
    with open(jsonl_out, "w", encoding="utf-8") as json_file:
        for idx, ch in enumerate(chunks):
            record = {
                "id": f"{filepath.stem}_{idx}",
                "source": "NewSources",
                "book": title,
                "author": author,
                "category": category,
                "page": (idx // 3) + 1,
                "section": f"Chapter / Part {(idx // 10) + 1}",
                "text": ch,
                "keywords": detect_keywords(ch),
                "char_count": len(ch)
            }
            json_file.write(json.dumps(record, ensure_ascii=False) + "\n")

    # Batch embedding & Supabase ingestion
    batch_size = 20
    new_chunks = [ch for ch in chunks if ch not in existing_texts]
    skipped = len(chunks) - len(new_chunks)
    if skipped > 0:
        print(f"[FAST-SKIP] {skipped} chunks already present in Supabase.", flush=True)
        
    print(f"[INGESTING] Ingesting {len(new_chunks)} new chunks in batches of {batch_size}...", flush=True)
    
    inserted_count = 0
    write_status(title, file_idx, total_files, len(new_chunks), 0, total_added_ref[0])

    for i in range(0, len(new_chunks), batch_size):
        batch = new_chunks[i:i + batch_size]
        try:
            embeddings = generate_jina_embeddings_batch(batch)
            rows = []
            for j, ch in enumerate(batch):
                idx = i + j
                rows.append({
                    "source": "NewSources",
                    "book": title,
                    "category": category,
                    "page": (idx // 3) + 1,
                    "section": f"Author: {author}",
                    "text": ch,
                    "keywords": detect_keywords(ch),
                    "embedding": embeddings[j]
                })
                
            resp = requests.post(f"{SUPABASE_URL}/rest/v1/ayurvedic_knowledge_embeddings", json=rows, headers=HEADERS)
            if resp.status_code in (200, 201):
                inserted_count += len(batch)
                total_added_ref[0] += len(batch)
                print(f"   [{i + len(batch)}/{len(new_chunks)}] Ingested batch into Supabase... ({inserted_count} rows added for file)", flush=True)
                write_status(title, file_idx, total_files, len(new_chunks), inserted_count, total_added_ref[0])
            else:
                print(f"   ⚠️ Supabase Insert Error ({resp.status_code}): {resp.text[:150]}", flush=True)
        except Exception as e:
            print(f"   ❌ Batch Ingestion Error: {e}", flush=True)
            time.sleep(2)
            
    print(f"[DONE] {title}: {inserted_count} new vector rows added to Supabase!", flush=True)

def main():
    print("[START] Arovia.AI New Sources Parser & Knowledge Ingester", flush=True)
    txt_files = sorted(list(NEW_SOURCES_DIR.glob("*.txt")))
    print(f"[INFO] Found {len(txt_files)} source files in 'New Sources' directory.\n", flush=True)
    
    existing_texts = get_existing_db_texts()
    total_added_ref = [0]
    
    for idx, filepath in enumerate(txt_files, 1):
        process_file(filepath, existing_texts, idx, len(txt_files), total_added_ref)
        
    write_status("ALL_DONE", len(txt_files), len(txt_files), 0, total_added_ref[0], total_added_ref[0])
    print("\n=======================================================", flush=True)
    print("🎉 ALL NEW SOURCES PARSED AND INGESTED INTO DATABASE!", flush=True)
    print("=======================================================", flush=True)

if __name__ == "__main__":
    main()
