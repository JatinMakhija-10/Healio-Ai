# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

"""
Healio.AI -- Download CCRAS E-Books & Monographs
================================================
Downloads Ayurvedic handbooks, monographs, and documents from CCRAS (Central
Council for Research in Ayurvedic Sciences) — the official Government of India
Ayurveda research body.

Sources:
  https://ccras.nic.in/e-books/
  https://ccras.nic.in/publication/ayurveda-handboooks/
  https://ccras.nic.in/content/medicinal-plants

Saves PDFs to: data/ayurveda/raw/ccras/

Install deps:
  pip install requests beautifulsoup4

Run:
  python scripts/download_ccras.py
"""

import re
import time
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("❌ Missing dependencies. Run:")
    print("   pip install requests beautifulsoup4")
    sys.exit(1)

# ── Config ────────────────────────────────────────────────────────────────────
TARGET_PAGES = [
    "https://ccras.nic.in/e-books/",
    "https://ccras.nic.in/publication/ayurveda-handboooks/",
    "https://ccras.nic.in/research-journals/",
]
OUT_DIR   = Path(__file__).parent.parent / "data" / "ayurveda" / "raw" / "ccras"
DELAY_SEC = 2
HEADERS   = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
}

OUT_DIR.mkdir(parents=True, exist_ok=True)


def sanitize_filename(name: str) -> str:
    name = re.sub(r'[^\w\s\-.]', '_', name)
    name = re.sub(r'\s+', '_', name.strip())
    return name[:120]


def download_file(url: str, dest: Path, session: requests.Session) -> bool:
    if dest.exists() and dest.stat().st_size > 1024:  # noqa
        print(f"  [SKIP] Already exists: {dest.name}")
        return True
    try:
        resp = session.get(url, headers=HEADERS, stream=True, timeout=40)
        resp.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in resp.iter_content(8192):
                f.write(chunk)
        size_kb = dest.stat().st_size // 1024
        print(f"  [OK] {size_kb} KB -> {dest.name}")
        return True
    except Exception as e:
        print(f"  [FAIL] Failed: {e}")
        if dest.exists():
            dest.unlink()
        return False


def scrape_page_for_pdfs(page_url: str, session: requests.Session) -> list[tuple[str, str]]:
    """Return list of (filename, absolute_url) for all PDFs found on the page."""
    print(f"\n[SCAN] Scanning: {page_url}")
    results: list[tuple[str, str]] = []
    try:
        resp = session.get(page_url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
    except Exception as e:
        print(f"  [FAIL] Cannot reach page: {e}")
        return results

    soup = BeautifulSoup(resp.text, "html.parser")

    seen_urls: set[str] = set()

    for a_tag in soup.find_all("a", href=True):
        href: str = a_tag["href"]

        # Accept direct PDFs or anything labelled as download
        is_pdf    = href.lower().endswith(".pdf") or ".pdf" in href.lower()
        link_text = a_tag.get_text(" ", strip=True)
        is_doc    = any(ext in href.lower() for ext in [".doc", ".docx", ".ppt", ".xlsx"])

        if not (is_pdf or is_doc):
            continue

        abs_url = urljoin(page_url, href)
        if abs_url in seen_urls:
            continue
        seen_urls.add(abs_url)

        # Build filename from link text or URL
        if link_text and len(link_text) > 3:
            base_name = sanitize_filename(link_text)
        else:
            base_name = urlparse(abs_url).path.split("/")[-1]
            base_name = sanitize_filename(base_name)

        ext = ".pdf" if is_pdf else Path(urlparse(abs_url).path).suffix
        if not base_name.endswith(ext):
            base_name += ext

        results.append((base_name, abs_url))
        print(f"  [FOUND] {link_text or base_name}")

    return results


def main():
    session = requests.Session()

    all_links: list[tuple[str, str]] = []
    seen: set[str] = set()

    for page_url in TARGET_PAGES:
        links = scrape_page_for_pdfs(page_url, session)
        for fname, url in links:
            if url not in seen:
                seen.add(url)
                all_links.append((fname, url))

    print(f"\n[INFO] Total unique resources found: {len(all_links)}")
    if not all_links:
        print("[WARN] No PDFs found -- CCRAS site may require JS rendering.")
        print("   Tip: Manually download from https://ccras.nic.in/e-books/")
        print(f"   and place files in: {OUT_DIR}")
        return

    succeeded = 0
    failed    = 0

    for fname, url in all_links:
        dest = OUT_DIR / fname
        print(f"\n[DL] {fname}")
        ok = download_file(url, dest, session)
        if ok:
            succeeded += 1
        else:
            failed += 1
        time.sleep(DELAY_SEC)

    print(f"\n[DONE] CCRAS download complete: {succeeded} ok, {failed} failed")
    print(f"[DIR] Saved to: {OUT_DIR}")

    all_files = list(OUT_DIR.iterdir())
    print(f"\n[FILES] Files in output directory ({len(all_files)}):")
    for f in sorted(all_files):
        print(f"   {f.stat().st_size // 1024:>6} KB — {f.name}")


if __name__ == "__main__":
    main()
