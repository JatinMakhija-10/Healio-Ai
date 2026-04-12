"""
Healio.AI — Planet Ayurveda Home Remedies Stealth Scraper
==========================================================
Scrapes all home remedies from https://www.planetayurveda.com/home-remedies/
Uses Playwright (headless Chromium) to:
  - Bypass Cloudflare anti-bot detection
  - Simulate human-like deep scrolling on every page
  - Fully extract all article content
  - Produce a .jsonl file compatible with ingest_books.ts

Usage:
    python scripts/scrape_pa_remedies.py

Output:
    data/ayurveda/processed/pa-remedies.jsonl
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

# ── Config ─────────────────────────────────────────────────────────────────────
INDEX_URL     = "https://www.planetayurveda.com/home-remedies/"
OUTPUT_DIR    = Path("data/ayurveda/processed")
OUTPUT_FILE   = OUTPUT_DIR / "pa-remedies.jsonl"
PROGRESS_FILE = OUTPUT_DIR / "pa-remedies-progress.json"

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

# ── Helpers ────────────────────────────────────────────────────────────────────

def make_id(name: str, chunk_idx: int) -> str:
    slug = re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')
    return f"pa_remedy_{slug}_{chunk_idx}"


def clean_text(raw: str) -> str:
    text = re.sub(r'\s+', ' ', raw).strip()
    boilerplate = [
        "Planet Ayurveda", "Buy Now", "Consult Now", "Add to Cart",
        "Ask Our Expert", "Call us", "+91", "Read More", "View More",
        "Copyright", "All Rights Reserved",
    ]
    for phrase in boilerplate:
        text = text.replace(phrase, '')
    return re.sub(r'\s+', ' ', text).strip()


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> Generator[str, None, None]:
    if len(text) <= size:
        if text.strip():
            yield text.strip()
        return
    start = 0
    while start < len(text):
        end = start + size
        chunk = text[start:end].strip()
        if chunk:
            yield chunk
        if end >= len(text):
            break
        start = end - overlap
        if start >= len(text) - overlap:
            break


def extract_keywords(remedy_name: str, text: str) -> list[str]:
    keywords = [w.lower() for w in remedy_name.split() if len(w) > 3]
    home_terms = ["home remedy", "natural", "ayurvedic", "herbal", "ingredient",
                  "dosha", "vata", "pitta", "kapha", "remedy", "cure"]
    for term in home_terms:
        if term in text.lower():
            keywords.append(term)
    return list(set(keywords))[:10]


def detect_section(paragraph: str) -> str:
    lower = paragraph.lower()
    if any(w in lower for w in ["symptom", "sign", "manifestation"]):
        return "Symptoms"
    if any(w in lower for w in ["cause", "etiology", "reason", "factor"]):
        return "Causes"
    if any(w in lower for w in ["remedy", "remedies", "home remedy", "natural cure", "ingredient"]):
        return "Home Remedies"
    if any(w in lower for w in ["treatment", "medicine", "herb", "formulation", "therapy"]):
        return "Ayurvedic Treatment"
    if any(w in lower for w in ["diet", "food", "nutrition", "eat"]):
        return "Diet & Lifestyle"
    return "Overview"


def load_progress() -> set[str]:
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, 'r') as f:
            return set(json.load(f))
    return set()


def save_progress(done: set[str]):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(list(done), f)


# ── Playwright Core ────────────────────────────────────────────────────────────

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


async def get_remedy_links(page: Page) -> list[tuple[str, str]]:
    print(f"\n[INFO] Loading home remedies index: {INDEX_URL}")
    await page.goto(INDEX_URL, wait_until="domcontentloaded", timeout=60000)
    await asyncio.sleep(3)
    await human_scroll(page)

    html = await page.content()
    soup = BeautifulSoup(html, 'html.parser')

    links = []
    seen_urls = set()
    for a_tag in soup.find_all('a', href=True):
        href = a_tag['href']
        name = a_tag.get_text(strip=True)
        if '/library/' in href and href not in seen_urls and len(name) > 2:
            seen_urls.add(href)
            if not href.startswith('http'):
                href = f"https://www.planetayurveda.com{href}"
            links.append((name, href))

    print(f"[OK] Found {len(links)} unique home remedy links")
    return links


async def scrape_remedy_page(page: Page, remedy_name: str, url: str) -> list[dict]:
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        await asyncio.sleep(2)
        await human_scroll(page)
        html = await page.content()
    except Exception as e:
        print(f"  [FAIL] Could not load {url}: {e}")
        return []

    soup = BeautifulSoup(html, 'html.parser')

    for selector in JUNK_SELECTORS:
        for el in soup.select(selector):
            el.decompose()

    article = (
        soup.find('article') or
        soup.find('div', class_='entry-content') or
        soup.find('div', class_='post-content') or
        soup.find('div', class_='article-content') or
        soup.find('div', class_='content-area') or
        soup.find('div', class_=re.compile(r'entry|post|article|content', re.I)) or
        soup.find('div', id=re.compile(r'content|main|primary', re.I)) or
        soup.find('main') or
        soup.find('div', id='primary') or
        soup.body  # Last resort: whole body (junk already stripped above)
    )

    if not article:
        print(f"  [WARN] No article body found for: {remedy_name}")
        return []

    chunks_out = []
    chunk_idx  = 0
    current_section = "Overview"
    text_buffer = ""

    elements = article.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'li'])

    for el in elements:
        tag = el.name
        text = clean_text(el.get_text(separator=' '))

        if not text or len(text) < 30:
            continue

        if tag in ('h1', 'h2', 'h3', 'h4'):
            if text_buffer.strip():
                for chunk in chunk_text(text_buffer):
                    chunks_out.append({
                        "id":         make_id(remedy_name, chunk_idx),
                        "source":     "PlanetAyurveda",
                        "book":       "Home Remedies",
                        "category":   "home_remedy",
                        "page":       1,
                        "section":    f"{remedy_name} — {current_section}",
                        "text":       chunk,
                        "keywords":   extract_keywords(remedy_name, chunk),
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
                "id":         make_id(remedy_name, chunk_idx),
                "source":     "PlanetAyurveda",
                "book":       "Home Remedies",
                "category":   "home_remedy",
                "page":       1,
                "section":    f"{remedy_name} — {current_section}",
                "text":       chunk,
                "keywords":   extract_keywords(remedy_name, chunk),
                "char_count": len(chunk),
            })
            chunk_idx += 1

    return chunks_out


# ── Main ───────────────────────────────────────────────────────────────────────

async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    done_urls    = load_progress()
    total_chunks = 0
    failed_urls  = []

    ua = random.choice(USER_AGENTS)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
            ]
        )

        context = await browser.new_context(
            user_agent=ua,
            viewport={"width": 1366, "height": 768},
            locale="en-US",
            extra_http_headers={
                "Accept-Language": "en-US,en;q=0.9",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Referer": "https://www.google.com/",
                "DNT": "1",
            }
        )

        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            window.chrome = { runtime: {} };
        """)

        page = await context.new_page()
        links = await get_remedy_links(page)

        with open(OUTPUT_FILE, 'a', encoding='utf-8') as out_f:
            for i, (name, url) in enumerate(links):
                if url in done_urls:
                    print(f"  [SKIP] {name} — already done")
                    continue

                print(f"\n[{i+1}/{len(links)}] Scraping: {name}")
                print(f"            URL: {url}")

                chunks = await scrape_remedy_page(page, name, url)

                if chunks:
                    for chunk in chunks:
                        out_f.write(json.dumps(chunk, ensure_ascii=False) + '\n')
                    out_f.flush()
                    total_chunks += len(chunks)
                    print(f"  [OK] Extracted {len(chunks)} chunks")
                else:
                    failed_urls.append(url)
                    print(f"  [WARN] No content extracted for {name}")

                done_urls.add(url)
                save_progress(done_urls)

                delay = random.uniform(DELAY_MIN, DELAY_MAX)
                print(f"  [WAIT] {delay:.1f}s before next page...")
                await asyncio.sleep(delay)

        await browser.close()

    print(f"\n{'='*60}")
    print("[DONE] Home Remedies Scraping Complete!")
    print(f"   Total remedies processed : {len(done_urls)}")
    print(f"   Total chunks extracted   : {total_chunks}")
    print(f"   Output file              : {OUTPUT_FILE}")
    if failed_urls:
        print(f"\n[WARN] Failed URLs ({len(failed_urls)}):")
        for u in failed_urls:
            print(f"   - {u}")
    print(f"\n[NEXT] Run: npx ts-node scripts/ingest_books.ts")


if __name__ == "__main__":
    asyncio.run(main())
