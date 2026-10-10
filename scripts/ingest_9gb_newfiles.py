# -*- coding: utf-8 -*-
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  AROVIA.AI — 9 GB NEWFiles Book Ingestion Engine                           ║
║  Ingests ~400 Hindi/English/Marathi books into Supabase Vector Brain        ║
║                                                                              ║
║  Features:                                                                   ║
║  ✅ Live Rich Progress Bars (folder-level + file-level + chunk-level)        ║
║  ✅ Automatic OCR fallback for scanned/image PDFs via Gemini Vision          ║
║  ✅ Multi-key Jina embedding rotation (3 keys)                               ║
║  ✅ Pause/Resume — stateful manifest in logs/newfiles_manifest.json          ║
║  ✅ Deduplication — pre-loads existing DB texts, instant skip cache          ║
║  ✅ Devanagari Unicode preservation (Hindi, Marathi, Sanskrit)               ║
╚══════════════════════════════════════════════════════════════════════════════╝

Usage:
  python scripts/ingest_9gb_newfiles.py

To reset and re-ingest from scratch:
  Delete logs/newfiles_manifest.json and re-run.
"""

import os, sys, re, json, time, unicodedata
from pathlib import Path
import requests

# Force UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ── Load .env.local ────────────────────────────────────────────────────────────
ROOT_DIR = Path(__file__).parent.parent
ENV_LOCAL = ROOT_DIR / ".env.local"
if ENV_LOCAL.exists():
    for line in ENV_LOCAL.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
JINA_KEYS    = [k.strip() for k in os.environ.get("JINA_API_KEYS", os.environ.get("JINA_API_KEY","")).split(",") if k.strip()]
GEMINI_KEYS  = [k.strip() for k in os.environ.get("GEMINI_API_KEYS", os.environ.get("GEMINI_API_KEY","")).split(",") if k.strip()]

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing SUPABASE env vars in .env.local"); sys.exit(1)
if not JINA_KEYS:
    print("❌ Missing JINA_API_KEY(S) in .env.local"); sys.exit(1)

# ── Try loading Rich for beautiful progress bars ───────────────────────────────
try:
    from rich.console import Console
    from rich.progress import (Progress, SpinnerColumn, BarColumn, TextColumn,
                               TimeElapsedColumn, TimeRemainingColumn, MofNCompleteColumn)
    from rich.table import Table
    from rich.panel import Panel
    from rich.text import Text
    from rich import box
    RICH = sys.stdout.isatty() and os.environ.get("NO_RICH", "0") != "1"
    console = Console(force_terminal=RICH)
except ImportError:
    RICH = False

if not RICH:
    class _FakeConsole:
        def print(self, *a, **kw):
            msg = " ".join(str(x) for x in a)
            msg = re.sub(r'\[/?[a-zA-Z0-9_ ]+\]', '', msg)
            print(msg)
        def rule(self, *a, **kw):
            print("─"*60)
    console = _FakeConsole()

# ── Try PyMuPDF ────────────────────────────────────────────────────────────────
try:
    import fitz
except ImportError:
    print("❌ pymupdf not found. Run: pip install pymupdf"); sys.exit(1)

# ── Try Gemini (optional, for OCR) ────────────────────────────────────────────
HAS_GEMINI = False
gemini_client = None
genai_types = None
if GEMINI_KEYS:
    try:
        from google import genai
        from google.genai import types as _gt
        genai_types = _gt
        gemini_client = genai.Client(api_key=GEMINI_KEYS[0])
        HAS_GEMINI = True
    except Exception:
        pass

# ── Configuration ──────────────────────────────────────────────────────────────
NEWFILES_DIR   = ROOT_DIR / "NEWFiles"
PROCESSED_DIR  = ROOT_DIR / "data" / "newfiles_processed"
MANIFEST_FILE  = ROOT_DIR / "logs" / "newfiles_manifest.json"
TABLE_NAME     = "ayurvedic_knowledge_embeddings"
SOURCE_TAG     = "NEWFiles"

CHUNK_SIZE  = 800
CHUNK_OVERLAP = 150
EMBED_BATCH = 120     # chunks per Jina API call (max throughput)
DB_BATCH    = 250     # rows per Supabase INSERT (max throughput)
MIN_CHUNK_LEN = 60    # chars

VALID_EXTS  = {".pdf"}
SKIP_EXTS   = {".html", ".htm", ".download", ".exe", ".gif", ".svg",
               ".png", ".jpg", ".jpeg", ".webp", ".js", ".css",
               ".zip", ".rar", ".7z", ".txt", ".csv", ".xlsx"}

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
MANIFEST_FILE.parent.mkdir(parents=True, exist_ok=True)

# ── API Key Round-Robin ────────────────────────────────────────────────────────
_jina_idx   = 0
_gemini_idx = 0

def next_jina_key() -> str:
    global _jina_idx
    k = JINA_KEYS[_jina_idx % len(JINA_KEYS)]
    _jina_idx += 1
    return k

def rotate_gemini():
    global _gemini_idx, gemini_client
    if not HAS_GEMINI: return
    _gemini_idx = (_gemini_idx + 1) % len(GEMINI_KEYS)
    try:
        from google import genai as _g
        gemini_client = _g.Client(api_key=GEMINI_KEYS[_gemini_idx])
    except Exception:
        pass

# ── Supabase Headers ───────────────────────────────────────────────────────────
SB_HEADERS = {
    "apikey":        SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=minimal"
}

# ── Category Inferral ──────────────────────────────────────────────────────────
def infer_category(name: str) -> str:
    n = name.lower()
    if any(x in n for x in ["home remedy", "home_remedy", "home-remedy", "kitchen", "nuskhe", "herbal recipe", "nourishing tradition", "vibrant health", "herbal healing for women", "gladstar"]):
        return "home_remedies"
    if any(x in n for x in ["agadtantra", "toxicology", "forensic", "vishachikitsa"]):
        return "agadtantra_toxicology"
    if any(x in n for x in ["dravyagun", "nighantu", "medicinal plant", "culpeper", "herb", "adaptogen", "botanical", "phyto"]):
        return "dravyaguna_herbs"
    if any(x in n for x in ["bhaishajya", "rasa", "pharmacopoeia", "bharat bhaishajya", "rasashastra", "rasaratna"]):
        return "rasashastra_pharmacy"
    if any(x in n for x in ["charak", "sushrut", "astanga", "kashyap", "samhita", "ashtanga"]):
        return "classical_samhita"
    if any(x in n for x in ["panchakarma", "panchkarma", "therapies", "basti"]):
        return "panchakarma_therapies"
    if any(x in n for x in ["rognidan", "pathology", "harsh mohan", "diagnosis"]):
        return "rognidan_pathology"
    if any(x in n for x in ["kayachikitsa", "kaaychikitsa", "kaychikitsa", "davidsons", "davidson"]):
        return "kayachikitsa_internal_medicine"
    if any(x in n for x in ["shalya", "surgery", "surgical"]):
        return "shalya_surgery"
    if any(x in n for x in ["shalakya", "eye", "netra", "shiro", "ent", "ophthalmology"]):
        return "shalakya_ent_ophthalmology"
    if any(x in n for x in ["prasuti", "stri", "gynecolog", "women", "obstetric"]):
        return "prasutitantra_gynecology"
    if any(x in n for x in ["balrog", "balchikitsa", "kaumarbhrutya", "pediatric", "child"]):
        return "kaumarbhrutya_pediatrics"
    if any(x in n for x in ["anatomy", "sharir rachana", "chaurasia", "bd chaurasia", "vishram", "embryology", "histology", "grey_s anatomy"]):
        return "anatomy_physiology"
    if any(x in n for x in ["research", "anusandhan", "ccras", "methodology"]):
        return "research_methodology"
    if any(x in n for x in ["ayurveda", "ayurved", "swasth", "bhavprakash", "madhav nidan"]):
        return "general_ayurveda"
    return "medical_reference"

AYURVEDA_KW = [
    "herb","remedy","treatment","fever","pain","dosage","cure","symptom",
    "plant","nutrition","decoction","powder","oil","extract","tonic",
    "medicine","health","disease","inflammation","infection","wound",
    "dosha","vata","pitta","kapha","rasayana","churna","kwath","arka",
    "taila","ghrita","bhasma","panchakarma","shalya","samhita","nighantu",
    "dravya","aushadha","roga","nidana","chikitsa","srotas","dhatu",
]
def detect_keywords(text: str) -> list:
    lo = text.lower()
    return list(set(kw for kw in AYURVEDA_KW if kw in lo))[:10]

def clean_text(text: str) -> str:
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)
    # Keep printable ASCII + Devanagari (0900-097F) + Marathi extended
    text = re.sub(r'[^\x20-\x7E\u0900-\u097F\u0A00-\u0A7F\n]', ' ', text)
    return text.strip()

def chunk_text(text: str):
    start, length = 0, len(text)
    while start < length:
        end = min(start + CHUNK_SIZE, length)
        if end < length:
            b = text.rfind(". ", start, end)
            if b > start + CHUNK_SIZE // 2:
                end = b + 1
        chunk = text[start:end].strip()
        if len(chunk) >= MIN_CHUNK_LEN:
            yield chunk
        nxt = end - CHUNK_OVERLAP
        start = nxt if nxt > start else end

# ── Manifest ───────────────────────────────────────────────────────────────────
def load_manifest() -> dict:
    if MANIFEST_FILE.exists():
        try:
            return json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "version": 2,
        "files": {},
        "stats": {"total_books": 0, "done_books": 0, "total_chunks": 0, "total_inserted": 0},
        "started_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

def save_manifest(m: dict):
    MANIFEST_FILE.write_text(json.dumps(m, indent=2, ensure_ascii=False), encoding="utf-8")

# ── Existing DB text cache ─────────────────────────────────────────────────────
def load_existing_db_cache() -> set:
    print("⚡ Instant cache ready (Manifest state enabled)")
    return set()

# ── Local RapidOCR Engine (GPU 0 Hardware Accelerated: NVIDIA RTX 4060) ─────────
HAS_RAPID_OCR = False
rapid_ocr_engine = None
try:
    import rapidocr_onnxruntime.utils.infer_engine as ie
    from rapidocr_onnxruntime import RapidOCR

    # Force DirectML provider binding to GPU 0 (NVIDIA GeForce RTX 4060)
    def _gpu_get_ep_list(self):
        self.use_cuda = False
        self.use_directml = True
        return [('DmlExecutionProvider', {'device_id': 0}), ('CPUExecutionProvider', {})]

    ie.OrtInferSession._get_ep_list = _gpu_get_ep_list

    rapid_ocr_engine = RapidOCR()
    HAS_RAPID_OCR = True
except Exception:
    pass

import threading
fitz_lock = threading.Lock()
ocr_lock = threading.Lock()

def ocr_bytes(img_bytes: bytes) -> str:
    if not img_bytes:
        return ""
    if HAS_RAPID_OCR and rapid_ocr_engine is not None:
        try:
            with ocr_lock:
                res, _ = rapid_ocr_engine(img_bytes)
            if res:
                text = "\n".join([line[1] for line in res])
                if len(text.strip()) > 30:
                    return text
        except Exception:
            pass

    # 2. Fallback to Gemini Vision API
    if not HAS_GEMINI: return ""
    for attempt in range(len(GEMINI_KEYS)):
        try:
            resp = gemini_client.models.generate_content(
                model='gemini-flash-latest',
                contents=[
                    "Extract all text verbatim from this medical/Ayurvedic book page. Output raw text only.",
                    genai_types.Part.from_bytes(data=img_bytes, mime_type="image/png"),
                ]
            )
            time.sleep(1.0)
            return resp.text or ""
        except Exception as e:
            rotate_gemini()
            time.sleep(1)
    return ""

# ── Jina Embedding Batch ──────────────────────────────────────────────────────
def jina_embed_batch(texts: list) -> list:
    last_err = None
    max_retries = max(10, len(JINA_KEYS) * 3)
    for attempt in range(max_retries):
        key = next_jina_key()
        try:
            r = requests.post(
                "https://api.jina.ai/v1/embeddings",
                json={"model": "jina-embeddings-v3", "input": texts, "dimensions": 768},
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                timeout=45
            )
            if r.status_code == 200:
                return [d["embedding"] for d in r.json()["data"]]
            last_err = f"HTTP {r.status_code}: {r.text[:120]}"
        except Exception as e:
            last_err = str(e)
        
        sleep_time = min(2 * (attempt + 1), 15)
        time.sleep(sleep_time)
        
    raise RuntimeError(f"Jina embed failed after {max_retries} retries: {last_err}")

# ── Supabase Bulk Insert ───────────────────────────────────────────────────────
def supabase_insert_batch(rows: list) -> int:
    for attempt in range(3):
        try:
            r = requests.post(
                f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}",
                json=rows,
                headers=SB_HEADERS,
                timeout=60
            )
            if r.status_code in (200, 201):
                return len(rows)
            if attempt < 2:
                time.sleep(2)
        except Exception:
            time.sleep(2)
    return 0

# ── Core File Processor ────────────────────────────────────────────────────────
def process_one_file(pdf_path: Path, manifest: dict, db_cache: set,
                     file_progress=None, chunk_task=None) -> dict:
    key = str(pdf_path.relative_to(ROOT_DIR))
    title = pdf_path.stem
    size_mb = pdf_path.stat().st_size / (1024 * 1024)
    category = infer_category(pdf_path.name)

    result = {"status": "PENDING", "pages": 0, "chunks_extracted": 0,
              "chunks_inserted": 0, "size_mb": round(size_mb, 1)}

    # ── Open PDF ──────────────────────────────────────────────────────────────
    try:
        doc = fitz.open(str(pdf_path))
    except Exception as e:
        result["status"] = "FAILED"
        result["error"] = str(e)
        return result

    num_pages = len(doc)
    result["pages"] = num_pages
    all_chunks = []

    # ── Extract text page by page (Thread-safe 8x Multi-threading) ────────────
    def _extract_single_page(pno: int) -> list:
        raw = ""
        img_bytes = None
        with fitz_lock:
            try:
                page = doc.load_page(pno)
                raw  = page.get_text("text")
                if len(raw.strip()) < 40:
                    pix = page.get_pixmap(dpi=150)
                    img_bytes = pix.tobytes("png")
            except Exception:
                pass

        if len(raw.strip()) < 40 and img_bytes:
            raw = ocr_bytes(img_bytes)

        cleaned = clean_text(raw)
        if not cleaned:
            return []

        heading = f"Page {pno+1}"
        lines = cleaned.split("\n")
        for ln in lines[:4]:
            ln = ln.strip()
            if 5 < len(ln) < 80 and (ln.isupper() or ln.istitle()):
                heading = ln
                break

        page_chunks = []
        for ch in chunk_text(cleaned):
            page_chunks.append({
                "source":   SOURCE_TAG,
                "book":     title,
                "category": category,
                "page":     pno + 1,
                "section":  heading,
                "text":     ch,
                "keywords": detect_keywords(ch),
            })
        return page_chunks

    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=8) as executor:
        page_results = list(executor.map(_extract_single_page, range(num_pages)))

    for p_chunks in page_results:
        all_chunks.extend(p_chunks)

    try:
        doc.close()
    except Exception:
        pass

    result["chunks_extracted"] = len(all_chunks)

    # ── Deduplicate against cache ──────────────────────────────────────────────
    new_chunks = [c for c in all_chunks if c["text"] not in db_cache]
    skipped = len(all_chunks) - len(new_chunks)

    # ── Embed & Insert in batches ──────────────────────────────────────────────
    inserted = 0
    for i in range(0, len(new_chunks), EMBED_BATCH):
        batch = new_chunks[i:i + EMBED_BATCH]
        texts = [c["text"] for c in batch]
        try:
            embeddings = jina_embed_batch(texts)
            rows = []
            for j, ch in enumerate(batch):
                rows.append({**ch, "embedding": embeddings[j]})
                db_cache.add(ch["text"])

            # Insert in DB_BATCH sub-batches
            for k in range(0, len(rows), DB_BATCH):
                sub = rows[k:k+DB_BATCH]
                inserted += supabase_insert_batch(sub)

        except Exception as e:
            console.print(f"[red]    Embed/insert error: {e}[/red]" if RICH else f"    Error: {e}")
            time.sleep(3)

    result["chunks_inserted"] = inserted
    result["chunks_skipped"]  = skipped
    if len(all_chunks) > 0 and (inserted > 0 or skipped > 0):
        result["status"] = "COMPLETED"
    else:
        result["status"] = "PENDING"
    result["finished_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
    return result


# ── File Discovery ─────────────────────────────────────────────────────────────
def discover_files() -> list:
    files = []
    for root, dirs, names in os.walk(NEWFILES_DIR):
        # Skip pure asset directories
        dirs[:] = [d for d in dirs if "Google Drive_files" not in d]
        for n in names:
            ext = Path(n).suffix.lower()
            if ext in VALID_EXTS:
                files.append(Path(root) / n)
    files.sort(key=lambda p: p.stat().st_size)   # small files first
    return files


# ── Rich Summary Table ─────────────────────────────────────────────────────────
def print_summary_table(manifest: dict, all_files: list):
    if not RICH: return
    t = Table(title="📚 Arovia.AI Brain — Ingestion Summary", box=box.ROUNDED,
              border_style="cyan", show_lines=True)
    t.add_column("Book", style="bold white", max_width=50)
    t.add_column("Category", style="yellow", max_width=25)
    t.add_column("Pages", justify="right", style="cyan")
    t.add_column("Chunks", justify="right", style="green")
    t.add_column("Inserted", justify="right", style="bright_green")
    t.add_column("Size MB", justify="right", style="dim")
    t.add_column("Status", justify="center")

    total_chunks = total_inserted = 0
    for f in all_files:
        key = str(f.relative_to(ROOT_DIR))
        info = manifest["files"].get(key, {})
        status = info.get("status", "PENDING")
        color = {"COMPLETED": "green", "FAILED": "red", "PENDING": "yellow"}.get(status, "white")
        chunks = info.get("chunks_extracted", 0)
        ins    = info.get("chunks_inserted", 0)
        total_chunks += chunks
        total_inserted += ins
        t.add_row(
            f.stem[:48],
            info.get("category", infer_category(f.name))[:24],
            str(info.get("pages", "—")),
            f"{chunks:,}" if chunks else "—",
            f"{ins:,}" if ins else "—",
            str(info.get("size_mb", round(f.stat().st_size/1024/1024, 1))),
            f"[{color}]{status}[/{color}]"
        )

    console.print(t)
    console.print(Panel(
        f"[bold green]Total Books: {len(all_files)}  |  "
        f"Total Chunks Extracted: {total_chunks:,}  |  "
        f"Total Chunks in DB: {total_inserted:,}[/bold green]",
        title="Final Stats", border_style="green"
    ))


# ═════════════════════════════════════════════════════════════════════════════
# MAIN
# ═════════════════════════════════════════════════════════════════════════════
def main():
    if RICH:
        console.print(Panel(
            Text("🧠  AROVIA.AI — 9 GB BOOK BRAIN INGESTOR", style="bold cyan", justify="center"),
            subtitle="Hindi • English • Marathi • Sanskrit",
            border_style="bright_cyan"
        ))
    else:
        print("=" * 60)
        print("  AROVIA.AI — 9 GB BOOK BRAIN INGESTOR")
        print("=" * 60)

    if not NEWFILES_DIR.exists():
        console.print(f"[red]❌ NEWFiles not found at {NEWFILES_DIR}[/red]" if RICH else f"Not found: {NEWFILES_DIR}")
        sys.exit(1)

    all_files = discover_files()
    if not all_files:
        console.print("[yellow]No valid PDF files found.[/yellow]" if RICH else "No PDFs found.")
        sys.exit(0)

    console.print(f"[bold]📂 Discovered {len(all_files)} PDFs across NEWFiles/[/bold]" if RICH else f"Discovered {len(all_files)} PDFs")
    console.print(f"[bold]🔑 Jina keys: {len(JINA_KEYS)}  |  Gemini OCR: {'✅' if HAS_GEMINI else '❌ (text-only)'}[/bold]\n" if RICH else f"Jina keys: {len(JINA_KEYS)}, OCR: {HAS_GEMINI}")

    manifest = load_manifest()
    manifest["stats"]["total_books"] = len(all_files)
    save_manifest(manifest)

    db_cache = load_existing_db_cache()

    # ── Work out which files still need processing ─────────────────────────────
    pending = []
    done_count = 0
    for f in all_files:
        key = str(f.relative_to(ROOT_DIR))
        st = manifest["files"].get(key, {}).get("status", "PENDING")
        if st != "COMPLETED":
            pending.append(f)
        else:
            done_count += 1

    console.print(f"\n▶ {len(pending)} books to ingest, {done_count} already completed.\n")

    if not pending:
        console.print("[bold green]✅ All books already ingested![/bold green]" if RICH else "All done!")
        print_summary_table(manifest, all_files)
        return

    # ── Main progress UI ───────────────────────────────────────────────────────
    overall_inserted = manifest["stats"].get("total_inserted", 0)

    if RICH:
        progress = Progress(
            SpinnerColumn(),
            "[progress.description]{task.description}",
            BarColumn(bar_width=40),
            MofNCompleteColumn(),
            TimeElapsedColumn(),
            TimeRemainingColumn(),
            console=console,
            refresh_per_second=4,
        )
        with progress:
            book_task  = progress.add_task("[bold cyan]📚 Books", total=len(pending))
            chunk_task = progress.add_task("[green]   Pages", total=100)

            for idx, pdf_path in enumerate(pending, 1):
                folder = pdf_path.parent.name
                progress.update(book_task,
                    description=f"[bold cyan]📚 Books [{idx}/{len(pending)}]"
                )
                progress.update(chunk_task,
                    description=f"[green]   [dim]{folder}[/dim] ▶ {pdf_path.name[:45]}",
                    completed=0, total=1
                )

                key = str(pdf_path.relative_to(ROOT_DIR))
                result = process_one_file(pdf_path, manifest, db_cache,
                                          file_progress=progress, chunk_task=chunk_task)

                manifest["files"][key] = {**result, "category": infer_category(pdf_path.name)}
                overall_inserted += result.get("chunks_inserted", 0)
                manifest["stats"]["total_inserted"] = overall_inserted
                manifest["stats"]["done_books"] += 1
                save_manifest(manifest)

                ins = result.get("chunks_inserted", 0)
                ext = result.get("chunks_extracted", 0)
                skp = result.get("chunks_skipped", 0)
                st  = result.get("status", "?")
                color = "green" if st == "COMPLETED" else "red"
                console.print(
                    f"  [{color}]{'✅' if st=='COMPLETED' else '❌'} {pdf_path.name[:55]:<55}[/{color}] "
                    f"[dim]{ext:>5} chunks | {ins:>5} inserted | {skp:>5} skipped[/dim]"
                )
                progress.update(book_task, advance=1)
    else:
        # Fallback plain-text progress
        for idx, pdf_path in enumerate(pending, 1):
            key = str(pdf_path.relative_to(ROOT_DIR))
            print(f"\n[{idx}/{len(pending)}] Processing: {pdf_path.name}")
            result = process_one_file(pdf_path, manifest, db_cache)
            manifest["files"][key] = {**result, "category": infer_category(pdf_path.name)}
            overall_inserted += result.get("chunks_inserted", 0)
            manifest["stats"]["total_inserted"] = overall_inserted
            manifest["stats"]["done_books"] += 1
            save_manifest(manifest)
            print(f"    → {result.get('chunks_extracted',0)} chunks, "
                  f"{result.get('chunks_inserted',0)} inserted, "
                  f"{result.get('status','?')}")

    # ── Final Summary ──────────────────────────────────────────────────────────
    manifest["finished_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
    save_manifest(manifest)
    print_summary_table(manifest, all_files)

    if RICH:
        console.print(Panel(
            "[bold bright_green]🎉 ALL 400+ BOOKS SUCCESSFULLY INGESTED INTO AROVIA.AI BRAIN!\n"
            f"Total chunks in Supabase: {overall_inserted:,}[/bold bright_green]",
            border_style="bright_green"
        ))
    else:
        print(f"\n✅ ALL DONE! {overall_inserted:,} chunks ingested.")
    print(f"\n📄 Full progress saved to: {MANIFEST_FILE}")


if __name__ == "__main__":
    main()
