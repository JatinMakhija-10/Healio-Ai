# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

"""
Healio.AI -- Download PlanetAyurveda Classical Texts (Free E-Books)
====================================================================
Downloads classical Ayurvedic texts from planetayurveda.com/ayurveda-e-books/
Saves PDFs to: data/ayurveda/raw/planet_ayurveda/

Install deps:
  pip install requests beautifulsoup4

Run:
  python scripts/download_planet_ayurveda.py
"""

import re
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("[ERROR] Missing dependencies. Run:")
    print("   pip install requests beautifulsoup4")
    sys.exit(1)

# -- Config -------------------------------------------------------------------
BASE_URL  = "https://www.planetayurveda.com/ayurveda-e-books/"
OUT_DIR   = Path(__file__).parent.parent / "data" / "ayurveda" / "raw" / "planet_ayurveda"
HEADERS   = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}
DELAY_SEC = 2   # Be polite -- 2 second delay between downloads

FALLBACK_PDFS: list = []

OUT_DIR.mkdir(parents=True, exist_ok=True)


def sanitize_filename(name: str) -> str:
    name = re.sub(r'[^\w\s\-.]', '_', name)
    name = re.sub(r'\s+', '_', name.strip())
    return name[:100]


def download_pdf(url: str, dest: Path, session: requests.Session) -> bool:
    if dest.exists():
        print(f"  [SKIP] Already exists: {dest.name}")
        return True

    try:
        resp = session.get(url, headers=HEADERS, stream=True, timeout=30)
        resp.raise_for_status()

        content_type = resp.headers.get("Content-Type", "")
        if "pdf" not in content_type.lower() and not url.lower().endswith(".pdf"):
            print(f"  [WARN] Not a PDF ({content_type}): {url}")
            return False

        with open(dest, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)

        size_kb = dest.stat().st_size // 1024
        print(f"  [OK] Saved ({size_kb} KB): {dest.name}")
        return True

    except requests.exceptions.RequestException as e:
        print(f"  [FAIL] Download failed: {e}")
        return False


def scrape_pdf_links(session: requests.Session) -> list:
    print(f"[SCAN] Scraping PDF links from {BASE_URL}...")
    try:
        resp = session.get(BASE_URL, headers=HEADERS, timeout=20)
        resp.raise_for_status()
    except Exception as e:
        print(f"  [FAIL] Could not reach {BASE_URL}: {e}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    found: list = []

    for a_tag in soup.find_all("a", href=True):
        href = a_tag["href"]
        if href.lower().endswith(".pdf") or "pdf" in href.lower():
            abs_url  = urljoin(BASE_URL, href)
            path_part = urlparse(abs_url).path
            raw_name  = path_part.split("/")[-1]
            filename  = sanitize_filename(raw_name) if raw_name else sanitize_filename(a_tag.get_text())
            if not filename.lower().endswith(".pdf"):
                filename += ".pdf"
            found.append((filename, abs_url))

    for a_tag in soup.find_all("a", href=True):
        href = a_tag["href"]
        text = a_tag.get_text(" ", strip=True).lower()
        if any(kw in text for kw in ["download", "samhita", "ayurveda", "charaka", "sushruta"]):
            abs_url = urljoin(BASE_URL, href)
            if abs_url not in [u for _, u in found]:
                raw_name = urlparse(abs_url).path.split("/")[-1]
                filename = sanitize_filename(raw_name or a_tag.get_text()) + ".html"
                if "planetayurveda.com" in abs_url:
                    found.append((filename, abs_url))

    return found


def main():
    session = requests.Session()
    session.headers.update(HEADERS)

    pdf_links = scrape_pdf_links(session)

    if not pdf_links:
        print("\n[WARN] No PDFs found via scraping. Checking fallback list...")
        pdf_links = FALLBACK_PDFS

    if not pdf_links:
        print("[FAIL] No PDFs found. The page structure may have changed.")
        print(f"   Visit {BASE_URL} manually and update FALLBACK_PDFS in this script.")
        print("\n[INFO] Listing all classic texts we are targeting:")
        targets = [
            "Charaka Samhita", "Sushruta Samhita", "Ashtanga Hridayam",
            "Bhavaprakasha", "Madhava Nidana", "Sharangdhara Samhita",
            "Kashyapa Samhita", "Harita Samhita", "Rasa Ratna Samuchaya",
        ]
        for t in targets:
            print(f"   - {t}")
        return

    print(f"\n[INFO] Found {len(pdf_links)} resources. Starting downloads...\n")

    succeeded = 0
    failed    = 0

    for filename, url in pdf_links:
        dest = OUT_DIR / filename
        print(f"[DL] {filename}")
        print(f"   {url}")

        ok = download_pdf(url, dest, session)
        if ok:
            succeeded += 1
        else:
            failed += 1

        time.sleep(DELAY_SEC)

    print(f"\n[DONE] Downloads complete: {succeeded} succeeded, {failed} failed")
    print(f"[DIR] Files saved to: {OUT_DIR}")

    pdfs = list(OUT_DIR.glob("*.pdf"))
    if pdfs:
        print(f"\n[FILES] Downloaded PDFs ({len(pdfs)}):")
        for p in sorted(pdfs):
            size_kb = p.stat().st_size // 1024
            print(f"   {size_kb:>6} KB -- {p.name}")


if __name__ == "__main__":
    main()
