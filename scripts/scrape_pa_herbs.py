"""
Healio.AI — Planet Ayurveda Herbs A-Z Stealth Scraper
======================================================
Scrapes all herb pages from https://www.planetayurveda.com/herbs-a-to-z/

Usage:
    python scripts/scrape_pa_herbs.py

Output:
    data/ayurveda/processed/pa-herbs.jsonl
"""

import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re
import random
from pathlib import Path
from typing import Generator

from playwright.async_api import async_playwright, Page
from bs4 import BeautifulSoup

# ── Config ───────────────────────────────────────────────────────────────────
INDEX_URL     = "https://www.planetayurveda.com/herbs-a-to-z/"
OUTPUT_DIR    = Path("data/ayurveda/processed")
OUTPUT_FILE   = OUTPUT_DIR / "pa-herbs.jsonl"
PROGRESS_FILE = OUTPUT_DIR / "pa-herbs-progress.json"

CHUNK_SIZE    = 800
CHUNK_OVERLAP = 150
DELAY_MIN     = 2.5
DELAY_MAX     = 5.2

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
]

JUNK_SELECTORS = [
    "header", "footer", "nav", ".navbar", ".menu", ".sidebar",
    ".widget", ".widget-area", "#sidebar", ".woocommerce",
    ".product", ".shop-now", ".consult", ".advertisement",
    ".breadcrumb", ".social-share", ".comments", "#comments",
    ".related", ".you-might-also-like", ".navigation",
    ".post-navigation", "script", "style", "noscript",
]

# ── Helpers ──────────────────────────────────────────────────────────────────

def make_id(name: str, idx: int) -> str:
    slug = re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')
    return f"pa_herb_{slug}_{idx}"

def clean_text(raw: str) -> str:
    text = re.sub(r'\s+', ' ', raw).strip()
    for phrase in ["Planet Ayurveda", "Buy Now", "Consult Now", "Add to Cart",
                   "Ask Our Expert", "+91", "Read More", "Copyright", "All Rights Reserved"]:
        text = text.replace(phrase, '')
    return re.sub(r'\s+', ' ', text).strip()

def chunk_text(text: str) -> Generator[str, None, None]:
    if len(text) <= CHUNK_SIZE:
        if text.strip(): yield text.strip()
        return
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunk = text[start:end].strip()
        if chunk: yield chunk
        if end >= len(text): break
        start = end - CHUNK_OVERLAP
        if start >= len(text) - CHUNK_OVERLAP: break

def extract_keywords(name: str, text: str) -> list[str]:
    keywords = [w.lower() for w in name.split() if len(w) > 3]
    herb_terms = ["ayurveda", "ayurvedic", "herb", "medicinal", "botanical",
                  "dosha", "vata", "pitta", "kapha", "rasayana", "plant"]
    for term in herb_terms:
        if term in text.lower(): keywords.append(term)
    return list(set(keywords))[:10]

def detect_section(paragraph: str) -> str:
    lower = paragraph.lower()
    if any(w in lower for w in ["benefit", "medicinal", "therapeutic", "property"]):
        return "Medicinal Benefits"
    if any(w in lower for w in ["use", "usage", "application", "preparation"]):
        return "Uses & Preparation"
    if any(w in lower for w in ["dose", "dosage", "side effect", "contraindication"]):
        return "Dosage & Safety"
    if any(w in lower for w in ["botanical", "latin", "family", "origin", "habitat"]):
        return "Botanical Information"
    return "Overview"

def load_progress() -> set[str]:
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, 'r') as f:
            return set(json.load(f))
    return set()

def save_progress(done: set[str]):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(list(done), f)


# ── Playwright Core ───────────────────────────────────────────────────────────

async def human_scroll(page: Page):
    await page.evaluate("window.scrollTo(0, 0)")
    await asyncio.sleep(0.5)
    total_height = await page.evaluate("document.body.scrollHeight")
    current_pos = 0
    while current_pos < total_height:
        step = random.randint(300, 600)
        current_pos += step
        await page.evaluate(f"window.scrollBy(0, {step})")
        await asyncio.sleep(random.uniform(0.1, 0.4))
        if random.random() < 0.2:
            await asyncio.sleep(random.uniform(0.8, 2.0))
        total_height = await page.evaluate("document.body.scrollHeight")
    await asyncio.sleep(random.uniform(0.5, 1.2))

async def get_links(page: Page) -> list[tuple[str, str]]:
    print(f"\n[INFO] Loading herbs index: {INDEX_URL}")
    await page.goto(INDEX_URL, wait_until="domcontentloaded", timeout=60000)
    await asyncio.sleep(3)
    await human_scroll(page)
    html = await page.content()
    soup = BeautifulSoup(html, 'html.parser')
    links, seen = [], set()
    for a in soup.find_all('a', href=True):
        href, name = a['href'], a.get_text(strip=True)
        if '/library/' in href and href not in seen and len(name) > 2:
            seen.add(href)
            if not href.startswith('http'):
                href = f"https://www.planetayurveda.com{href}"
            links.append((name, href))
    print(f"[OK] Found {len(links)} unique herb links")
    return links

async def scrape_page(page: Page, name: str, url: str) -> list[dict]:
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        await asyncio.sleep(2)
        await human_scroll(page)
        html = await page.content()
    except Exception as e:
        print(f"  [FAIL] {url}: {e}")
        return []

    soup = BeautifulSoup(html, 'html.parser')
    for sel in JUNK_SELECTORS:
        for el in soup.select(sel): el.decompose()

    article = (
        soup.find('article') or
        soup.find('div', class_='entry-content') or
        soup.find('div', class_='post-content') or
        soup.find('div', class_=re.compile(r'entry|post|article|content', re.I)) or
        soup.find('div', id=re.compile(r'content|main|primary', re.I)) or
        soup.find('main') or soup.body
    )
    if not article:
        print(f"  [WARN] No body found for: {name}")
        return []

    chunks_out, chunk_idx, current_section, text_buffer = [], 0, "Overview", ""

    for el in article.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'li']):
        text = clean_text(el.get_text(separator=' '))
        if not text or len(text) < 30: continue

        if el.name in ('h1', 'h2', 'h3', 'h4'):
            if text_buffer.strip():
                for chunk in chunk_text(text_buffer):
                    chunks_out.append({
                        "id": make_id(name, chunk_idx), "source": "PlanetAyurveda",
                        "book": "Herbs A-Z", "category": "herb",
                        "page": 1, "section": f"{name} — {current_section}",
                        "text": chunk, "keywords": extract_keywords(name, chunk),
                        "char_count": len(chunk),
                    })
                    chunk_idx += 1
                text_buffer = ""
            current_section = text
        else:
            detected = detect_section(text)
            if detected != "Overview" and current_section == "Overview":
                current_section = detected
            text_buffer += " " + text

    if text_buffer.strip():
        for chunk in chunk_text(text_buffer):
            chunks_out.append({
                "id": make_id(name, chunk_idx), "source": "PlanetAyurveda",
                "book": "Herbs A-Z", "category": "herb",
                "page": 1, "section": f"{name} — {current_section}",
                "text": chunk, "keywords": extract_keywords(name, chunk),
                "char_count": len(chunk),
            })
            chunk_idx += 1

    return chunks_out


# ── Main ─────────────────────────────────────────────────────────────────────

async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    done_urls, total_chunks, failed_urls = load_progress(), 0, []
    ua = random.choice(USER_AGENTS)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=[
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox", "--disable-dev-shm-usage",
        ])
        context = await browser.new_context(
            user_agent=ua, viewport={"width": 1366, "height": 768}, locale="en-US",
            extra_http_headers={
                "Accept-Language": "en-US,en;q=0.9",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Referer": "https://www.google.com/", "DNT": "1",
            }
        )
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            window.chrome = { runtime: {} };
        """)

        page = await context.new_page()
        links = await get_links(page)

        with open(OUTPUT_FILE, 'a', encoding='utf-8') as out_f:
            for i, (name, url) in enumerate(links):
                if url in done_urls:
                    print(f"  [SKIP] {name}")
                    continue
                print(f"\n[{i+1}/{len(links)}] {name}")
                chunks = await scrape_page(page, name, url)
                if chunks:
                    for c in chunks: out_f.write(json.dumps(c, ensure_ascii=False) + '\n')
                    out_f.flush()
                    total_chunks += len(chunks)
                    print(f"  [OK] {len(chunks)} chunks")
                else:
                    failed_urls.append(url)
                    print(f"  [WARN] No content")
                done_urls.add(url)
                save_progress(done_urls)
                delay = random.uniform(DELAY_MIN, DELAY_MAX)
                print(f"  [WAIT] {delay:.1f}s")
                await asyncio.sleep(delay)

        await browser.close()

    print(f"\n{'='*60}")
    print(f"[DONE] Herbs A-Z complete! {total_chunks} chunks -> {OUTPUT_FILE}")
    if failed_urls:
        print(f"[WARN] {len(failed_urls)} failed URLs")
    print("[NEXT] npx ts-node scripts/ingest_books.ts")

if __name__ == "__main__":
    asyncio.run(main())
