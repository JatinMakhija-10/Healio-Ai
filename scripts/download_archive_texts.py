# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

"""
Healio.AI -- Download Classical Ayurveda Texts from Internet Archive
====================================================================
Downloads the primary classical Ayurvedic texts (Charaka Samhita,
Sushruta Samhita, Ashtanga Hridayam, etc.) from archive.org which
hosts public domain versions freely and reliably.

Run:
  pip install requests internetarchive
  python scripts/download_archive_texts.py
"""

import time
from pathlib import Path

try:
    import requests
except ImportError:
    print("[ERROR] Run: pip install requests")
    sys.exit(1)

OUT_DIR = Path(__file__).parent.parent / "data" / "ayurveda" / "raw" / "classical_texts"
OUT_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {"User-Agent": "Mozilla/5.0 Healio-AI-Research/1.0 (educational use)"}

# All are public domain texts on Internet Archive
# Format: (filename, archive_identifier, preferred_file_pattern)
ARCHIVE_TEXTS = [
    (
        "Charaka_Samhita_English_PV_Sharma",
        "CharakaSamhitaTextWithEnglishTanslationP.V.Sharma",
        ".pdf",
    ),
    (
        "Charaka_Samhita_Sanskrit_Dipika_Commentary",
        "jTZt_charaka-samhita-sanskrit-of-agnivesha-with-ayurveda-dipika-commentary-ed.-by-vai",
        ".pdf",
    ),
    (
        "Charaka_Samhita_Vol1_Gulabkunverba",
        "in.ernet.dli.2015.326549",
        ".pdf",
    ),
]

# Direct URLs for texts not easily on archive.org
DIRECT_PDFS = [
    # Sushruta & Ashtanga from Internet Archive directs
    ("Sushruta_Samhita_KL_Bhishagratna_Vol1",
     "https://archive.org/download/b30463250/b30463250.pdf"),
    ("Sushruta_Samhita_KL_Bhishagratna_Vol3",
     "https://archive.org/download/b30463273/b30463273.pdf"),
    ("Ashtanga_Hridayam_KM_Nadkarni",
     "https://archive.org/download/ashtangahridayam00vagb/ashtangahridayam00vagb.pdf"),
    # Charaka direct alternative
    ("Charaka_Samhita_Complete_4Vol",
     "https://archive.org/download/CharakaSamhita4Volumes/CharakaSamhita4Volumes.pdf"),
    # Homeopathy classical texts (Boericke) - as reference
    ("Dravyaguna_Vijnana_PV_Sharma",
     "https://archive.org/download/dravyagunav1pvsharma/dravyagunav1pvsharma.pdf"),
]


def download_direct(name: str, url: str) -> bool:
    dest = OUT_DIR / f"{name}.pdf"
    if dest.exists() and dest.stat().st_size > 50_000:
        print(f"  [SKIP] {name}")
        return True
    print(f"  [DL] {name}")
    print(f"       {url}")
    try:
        resp = requests.get(url, headers=HEADERS, stream=True, timeout=60)
        resp.raise_for_status()
        with open(dest, "wb") as f:
            downloaded = 0
            for chunk in resp.iter_content(65536):
                f.write(chunk)
                downloaded += len(chunk)
                if downloaded % (5 * 1024 * 1024) < 65536:
                    print(f"       ... {downloaded // 1_048_576} MB")
        size_mb = dest.stat().st_size / 1_048_576
        print(f"  [OK] {size_mb:.1f} MB  -- {name}")
        return True
    except Exception as e:
        print(f"  [FAIL] {name}: {str(e)[:120]}")
        if dest.exists():
            dest.unlink()
        return False


def download_from_archive(name: str, identifier: str, ext: str) -> bool:
    """
    Fetch file list from archive.org API and download the best matching file.
    """
    dest = OUT_DIR / f"{name}.pdf"
    if dest.exists() and dest.stat().st_size > 50_000:
        print(f"  [SKIP] {name}")
        return True

    # Get file list via archive.org metadata API
    meta_url = f"https://archive.org/metadata/{identifier}"
    print(f"  [META] Fetching metadata: {identifier}")
    try:
        resp = requests.get(meta_url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"  [FAIL] Metadata fetch failed: {e}")
        return False

    files = data.get("files", [])
    # Find the best PDF (prefer full document over thumbnails)
    pdf_files = [f for f in files if f.get("name", "").lower().endswith(ext)]
    if not pdf_files:
        print(f"  [WARN] No {ext} files found in {identifier}")
        return False

    # Pick largest PDF (most likely complete document)
    pdf_files.sort(key=lambda x: int(x.get("size", 0)), reverse=True)
    chosen = pdf_files[0]
    file_url = f"https://archive.org/download/{identifier}/{chosen['name']}"
    size_mb  = int(chosen.get("size", 0)) / 1_048_576

    print(f"  [DL] {chosen['name']} ({size_mb:.1f} MB)")
    return download_direct(name, file_url)


def main():
    print("Archive.org Classical Ayurveda Text Downloader -- Healio.AI\n")
    print(f"[DIR] Saving to: {OUT_DIR}\n")

    ok = fail = 0

    print("=== Internet Archive texts ===")
    for name, identifier, ext in ARCHIVE_TEXTS:
        if download_from_archive(name, identifier, ext):
            ok += 1
        else:
            fail += 1
        time.sleep(2)

    print("\n=== Direct PDF downloads ===")
    for name, url in DIRECT_PDFS:
        if download_direct(name, url):
            ok += 1
        else:
            fail += 1
        time.sleep(2)

    print(f"\n[DONE] {ok} succeeded, {fail} failed")
    files = sorted(OUT_DIR.glob("*.pdf"))
    total_mb = sum(f.stat().st_size for f in files) / 1_048_576
    print(f"[DIR]  {len(files)} PDFs, {total_mb:.1f} MB total")
    for f in files:
        print(f"  {f.stat().st_size // 1024:>6} KB  {f.name}")


if __name__ == "__main__":
    main()
