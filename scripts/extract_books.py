# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

"""
Healio.AI -- Extract & Structure Ayurvedic Books into JSON
==========================================================
Processes PDFs from the Books/ folder and extracts structured
text chunks for embedding into Supabase.

START WITH: indian-medicinal-plants.pdf (most important)

Install deps:
  pip install pymupdf

Run:
  python scripts/extract_books.py

Output: data/ayurveda/processed/<bookname>.json
Each chunk = { source, book, page, section, text, keywords }
"""

import re
import json
import time
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(".env.local")

try:
    from google import genai
    from google.genai import types as genai_types
    GEMINI_KEYS = [k.strip() for k in os.environ.get("GEMINI_API_KEYS", os.environ.get("GEMINI_API_KEY", "")).split(",") if k.strip()]
    HAS_GEMINI = bool(GEMINI_KEYS)
    _gemini_client = genai.Client(api_key=GEMINI_KEYS[0]) if HAS_GEMINI else None
except ImportError:
    HAS_GEMINI = False
    GEMINI_KEYS = []
    _gemini_client = None

current_key_idx = 0

try:
    import fitz  # PyMuPDF
except ImportError:
    print("[ERROR] Install PyMuPDF:  pip install pymupdf")
    sys.exit(1)

BOOKS_DIR  = Path(__file__).parent.parent / "Books"
OUT_DIR    = Path(__file__).parent.parent / "data" / "ayurveda" / "processed"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ── Process these books in priority order ─────────────────────────────────────
BOOKS = [
    {
        "file": "indian-medicinal-plants.pdf",
        "title": "Indian Medicinal Plants",
        "source": "PlanetAyurveda",
        "category": "medicinal_plants",
        "chunk_size": 800,   # chars per chunk
    },
    {
        "file": "materia-medica.pdf",
        "title": "Materia Medica",
        "source": "PlanetAyurveda",
        "category": "materia_medica",
        "chunk_size": 800,
    },
    {
        "file": "astanga-hridaya-sutrasthan-handbook.pdf",
        "title": "Ashtanga Hridaya Sutrasthan Handbook",
        "source": "PlanetAyurveda",
        "category": "classical_text",
        "chunk_size": 700,
    },
    {
        "file": "indian-pharmacopoea.pdf",
        "title": "Indian Pharmacopoeia",
        "source": "PlanetAyurveda",
        "category": "pharmacopoeia",
        "chunk_size": 700,
    },
    {
        "file": "vaidya-yoga-ratnavali.pdf",
        "title": "Vaidya Yoga Ratnavali",
        "source": "PlanetAyurveda",
        "category": "classical_text",
        "chunk_size": 700,
    },
    {
        "file": "panchagavya-importance.pdf",
        "title": "Panchagavya Importance",
        "source": "PlanetAyurveda",
        "category": "ayurveda_practice",
        "chunk_size": 800,
    },
]

# ── Ayurvedic keyword detector ────────────────────────────────────────────────
PLANT_KEYWORDS = [
    "herb", "plant", "leaf", "root", "bark", "seed", "flower", "fruit",
    "medicinal", "ayurveda", "Ayurvedic", "botanical", "therapeutic",
    "treatment", "remedy", "dose", "preparation", "decoction", "powder",
    "oil", "extract", "alkaloid", "phytochemical", "action", "properties",
    "contraindication", "uses", "indication", "dosha", "vata", "pitta", "kapha",
    "rasayana", "churna", "kwath", "arka", "taila", "ghrita", "lehya",
]

def detect_keywords(text: str) -> list:
    text_lower = text.lower()
    found = [kw for kw in PLANT_KEYWORDS if kw.lower() in text_lower]
    return list(set(found))[:10]

def detect_section(text: str, page_num: int) -> str:
    """Detect chapter/section heading from the text block."""
    lines = text.strip().split("\n")
    for line in lines[:4]:
        line = line.strip()
        # If short uppercase line it's likely a heading
        if 3 < len(line) < 80 and (line.isupper() or line.istitle()):
            return line
    return f"Page {page_num}"

def clean_text(text: str) -> str:
    """Remove excessive whitespace, fix common OCR artefacts."""
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)
    text = re.sub(r'[^\x00-\x7F\u0900-\u097F\u0A00-\u0A7F]', ' ', text)  # keep ASCII + Devanagari
    text = text.strip()
    return text

def chunk_text(text: str, size: int):
    """Generator: yield overlapping text chunks with guaranteed forward progress."""
    overlap = min(100, size // 4)  # never let overlap >= chunk
    start   = 0
    length  = len(text)
    while start < length:
        end = min(start + size, length)
        if end < length:
            boundary = text.rfind(". ", start, end)
            if boundary > start + size // 2:
                end = boundary + 1
        chunk = text[start:end].strip()
        if len(chunk) > 80:
            yield chunk
        next_start = end - overlap
        if next_start <= start:   # guard: must always advance
            next_start = end
        start = next_start
        if start >= length:
            break

def get_max_extracted_page(filepath: Path) -> int:
    max_p = -1
    if filepath.exists() and filepath.stat().st_size > 0:
        with open(filepath, "r", encoding="utf-8") as fin:
            for line in fin:
                try:
                    data = json.loads(line)
                    if "page" in data and data["page"] > max_p:
                        max_p = data["page"]
                except:
                    pass
    return max_p

def extract_book(book: dict) -> int:
    """Stream-extract a PDF page by page, writing JSONL to avoid MemoryError."""
    pdf_path = BOOKS_DIR / book["file"]
    if not pdf_path.exists():
        print(f"  [MISSING] {pdf_path.name}")
        return 0

    out_file = OUT_DIR / f"{Path(book['file']).stem}.jsonl"
    print(f"\n[EXTRACT] {book['title']}  ({pdf_path.stat().st_size // 1024} KB)")

    doc         = fitz.open(str(pdf_path))
    num_pages   = len(doc)
    chunk_count = 0
    
    max_page = get_max_extracted_page(out_file)
    if max_page >= num_pages:
        print(f"  [DONE] Already fully extracted ({num_pages} pages)")
        return chunk_count
    
    if max_page > 0:
        print(f"  [RESUME] Found existing progress up to page {max_page}")

    with open(out_file, "a", encoding="utf-8") as fout:
        for page_num in range(num_pages):
            if (page_num + 1) <= max_page:
                continue

            try:
                page = doc.load_page(page_num)
                raw  = page.get_text("text")
            except ValueError:
                # Reopen if PyMuPDF randomly closes the document on large files
                doc = fitz.open(str(pdf_path))
                page = doc.load_page(page_num)
                raw  = page.get_text("text")

            if not raw or len(raw.strip()) < 50:
                if HAS_GEMINI:
                    sys.stdout.write(f"\r  ... OCR page {page_num+1}/{num_pages} ... ")
                    sys.stdout.flush()
                    
                    pix = page.get_pixmap(dpi=150)
                    img_bytes = pix.tobytes("png")
                    
                    ocr_success = False
                    global current_key_idx, _gemini_client
                    for attempt in range(len(GEMINI_KEYS) + 1):
                        try:
                            resp = _gemini_client.models.generate_content(
                                model='gemini-2.5-flash',
                                contents=[
                                    "Extract ONLY the text from this ancient book page. No markdown formatting, just the raw text. Do not add any conversational preamble.",
                                    genai_types.Part.from_bytes(data=img_bytes, mime_type="image/png"),
                                ]
                            )
                            raw = resp.text
                            ocr_success = True
                            time.sleep(2)  # Respect free tier RPM
                            break
                        except Exception as e:
                            sys.stdout.write(f"\n[KEY SWAP] Error: {e}. Swapping to key {current_key_idx+1}\n")
                            current_key_idx = (current_key_idx + 1) % len(GEMINI_KEYS)
                            _gemini_client = genai.Client(api_key=GEMINI_KEYS[current_key_idx])
                            time.sleep(1)
                    
                    if not ocr_success or not raw or len(raw.strip()) < 50:
                        continue
                    
                    if page_num % 100 == 1:
                        # Print a sample snippet so we can verify extracting worked!
                        print(f"\n[SAMPLE EXTRACT] Page {page_num+1}:\n{raw[:250]}...\n")
                else:
                    continue

            text    = clean_text(raw)
            section = detect_section(text, page_num + 1)

            for i, chunk in enumerate(chunk_text(text, book["chunk_size"])):
                record = {
                    "id":        f"{book['category']}_{page_num+1}_{i}",
                    "source":    book["source"],
                    "book":      book["title"],
                    "category":  book["category"],
                    "page":      page_num + 1,
                    "section":   section,
                    "text":      chunk,
                    "keywords":  detect_keywords(chunk),
                    "char_count": len(chunk),
                }
                fout.write(json.dumps(record, ensure_ascii=False) + "\n")
                fout.flush()
                chunk_count += 1

            if (page_num + 1) % 50 == 0:
                print(f"  ... page {page_num+1}/{num_pages} — {chunk_count} chunks")

    try:
        doc.close()
    except:
        pass
    size_kb = out_file.stat().st_size // 1024
    print(f"  [DONE] {num_pages} pages -> {chunk_count} chunks -> {out_file.name} ({size_kb} KB)")
    return chunk_count

def main():
    all_stats = []

    for book in BOOKS:
        n = extract_book(book)
        if not n:
            continue
            
        out_file = OUT_DIR / f"{Path(book['file']).stem}.jsonl"
        all_stats.append({
            "book":    book["title"],
            "chunks":  n,
            "size_kb": out_file.stat().st_size // 1024,
            "file":    out_file.name,
        })

    print("\n========= EXTRACTION SUMMARY =========")
    total_chunks = 0
    for s in all_stats:
        print(f"  {s['book']}: {s['chunks']} chunks -> {s['file']} ({s['size_kb']} KB)")
        total_chunks += s['chunks']
    print(f"\n  TOTAL: {total_chunks} chunks across {len(all_stats)} books")
    print(f"  Ready for: npx ts-node scripts/ingest_books.ts")

if __name__ == "__main__":
    start = time.time()
    main()
    print(f"\n  Time: {time.time() - start:.1f}s")
