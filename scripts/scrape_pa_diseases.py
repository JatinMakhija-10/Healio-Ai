"""
Healio.AI — Planet Ayurveda Disease Stealth Scraper
=====================================================
Scrapes all diseases from https://www.planetayurveda.com/diseases-a-to-z/
Uses Playwright (headless Chromium) to:
  - Bypass Cloudflare bot protection
  - Simulate human-like deep scrolling on every page
  - Fully extract all article content
  - Produce a .jsonl file compatible with ingest_books.ts

Usage:
    python scripts/scrape_pa_diseases.py

Output:
    data/ayurveda/processed/pa-diseases.jsonl
"""

import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')  # Fix Windows terminal encoding
import json
import os
import re
import random
import time
import hashlib
from pathlib import Path
from typing import Generator

from playwright.async_api import async_playwright, Page
from bs4 import BeautifulSoup

# ── Config ─────────────────────────────────────────────────────────────────────
INDEX_URL     = "https://www.planetayurveda.com/diseases-a-to-z/"
OUTPUT_DIR    = Path("data/ayurveda/processed")
OUTPUT_FILE   = OUTPUT_DIR / "pa-diseases.jsonl"
PROGRESS_FILE = OUTPUT_DIR / "pa-diseases-progress.json"

CHUNK_SIZE    = 800   # characters per chunk
CHUNK_OVERLAP = 150   # overlap between chunks
DELAY_MIN     = 2.5   # seconds, minimum delay between pages
DELAY_MAX     = 5.2   # seconds, maximum delay between pages

# Realistic browser headers to evade bot detection
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
]

# CSS selectors to SKIP (navigation, ads, sidebars)
JUNK_SELECTORS = [
    "header", "footer", "nav", ".navbar", ".menu", ".sidebar",
    ".widget", ".widget-area", "#sidebar", ".woocommerce",
    ".product", ".shop-now", ".consult", ".advertisement",
    ".breadcrumb", ".social-share", ".comments", "#comments",
    ".related", ".you-might-also-like", ".navigation",
    ".post-navigation", "script", "style", "noscript",
]

# ── Helpers ────────────────────────────────────────────────────────────────────

def make_id(disease_name: str, chunk_idx: int) -> str:
    slug = re.sub(r'[^a-z0-9]+', '_', disease_name.lower()).strip('_')
    return f"pa_disease_{slug}_{chunk_idx}"


def clean_text(raw: str) -> str:
    """Strip excess whitespace and common boilerplate phrases."""
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
    """Yield overlapping chunks of text."""
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


def extract_keywords(disease_name: str, text: str) -> list[str]:
    """Build a simple keyword list from the disease name and common Ayurvedic terms."""
    keywords = [w.lower() for w in disease_name.split() if len(w) > 3]
    ayur_terms = ["ayurveda", "ayurvedic", "herbal", "treatment", "remedy",
                  "dosha", "vata", "pitta", "kapha", "herb"]
    for term in ayur_terms:
        if term in text.lower():
            keywords.append(term)
    return list(set(keywords))[:10]


def detect_section(paragraph: str) -> str:
    """Heuristically detect what section a paragraph belongs to."""
    lower = paragraph.lower()
    if any(w in lower for w in ["symptom", "sign", "manifestation"]):
        return "Symptoms"
    if any(w in lower for w in ["cause", "etiology", "reason", "factor"]):
        return "Causes"
    if any(w in lower for w in ["treatment", "remedy", "medicine", "herb", "formulation", "therapy"]):
        return "Ayurvedic Treatment"
    if any(w in lower for w in ["diagnosis", "test", "investigation"]):
        return "Diagnosis"
    if any(w in lower for w in ["diet", "food", "nutrition", "eat"]):
        return "Diet & Lifestyle"
    return "Overview"


def load_progress() -> set[str]:
    """Load already-scraped URLs from the progress file."""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, 'r') as f:
            return set(json.load(f))
    return set()


def save_progress(done: set[str]):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(list(done), f)


# ── Playwright Core ────────────────────────────────────────────────────────────

async def human_scroll(page: Page):
    """Simulate organic human scrolling from top to bottom of the page."""
    # First, scroll to the top
    await page.evaluate("window.scrollTo(0, 0)")
    await asyncio.sleep(0.5)

    total_height = await page.evaluate("document.body.scrollHeight")
    viewport_height = await page.evaluate("window.innerHeight")
    current_pos = 0

    while current_pos < total_height:
        # Random scroll step between 300px and 600px (human-like)
        step = random.randint(300, 600)
        current_pos += step
        await page.evaluate(f"window.scrollBy(0, {step})")
        
        # Random pause between scrolls (0.1 to 0.4 seconds)
        await asyncio.sleep(random.uniform(0.1, 0.4))

        # Occasionally pause longer (simulating reading)
        if random.random() < 0.2:
            await asyncio.sleep(random.uniform(0.8, 2.0))

        # Re-check total height (in case lazy content loaded)
        total_height = await page.evaluate("document.body.scrollHeight")

    # Final pause at the bottom
    await asyncio.sleep(random.uniform(0.5, 1.2))


async def get_disease_links(page: Page) -> list[tuple[str, str]]:
    """
    Scrape the index page and return a list of (disease_name, url) tuples.
    Only grabs links in the /library/ path to avoid navigation links.
    """
    print(f"\n[INFO] Loading disease index: {INDEX_URL}")
    await page.goto(INDEX_URL, wait_until="domcontentloaded", timeout=60000)
    await asyncio.sleep(3)  # Let JS render the full link list
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
            # Ensure it's an absolute URL
            if not href.startswith('http'):
                href = f"https://www.planetayurveda.com{href}"
            links.append((name, href))

    print(f"[OK] Found {len(links)} unique disease links")
    return links


async def scrape_disease_page(page: Page, disease_name: str, url: str) -> list[dict]:
    """
    Scrape a single disease page and return a list of structured chunk dicts.
    """
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        await asyncio.sleep(2)  # Let article content render
        await human_scroll(page)
        html = await page.content()
    except Exception as e:
        print(f"  ❌ Failed to load {url}: {e}")
        return []

    soup = BeautifulSoup(html, 'html.parser')

    # Remove all junk selectors
    for selector in JUNK_SELECTORS:
        for el in soup.select(selector):
            el.decompose()

    # Target the main article content area
    article = (
        soup.find('article') or
        soup.find('div', class_=re.compile(r'entry-content|post-content|article-content|content-area', re.I)) or
        soup.find('div', id=re.compile(r'content|main', re.I)) or
        soup.find('main')
    )

    if not article:
        print(f"  [WARN] No article body found for {disease_name}")
        return []

    chunks_out = []
    chunk_idx  = 0

    # Extract headings and paragraphs — preserving document order
    elements = article.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'li', 'ul', 'ol'])
    
    current_section = "Overview"
    text_buffer = ""

    for el in elements:
        tag = el.name
        text = clean_text(el.get_text(separator=' '))
        
        if not text or len(text) < 30:
            continue

        # Headings update the current section context
        if tag in ('h1', 'h2', 'h3', 'h4'):
            # Flush buffer before switching section
            if text_buffer.strip():
                for chunk in chunk_text(text_buffer):
                    chunks_out.append({
                        "id":         make_id(disease_name, chunk_idx),
                        "source":     "PlanetAyurveda",
                        "book":       "Diseases A-Z",
                        "category":   "disease_treatment",
                        "page":       1,
                        "section":    f"{disease_name} — {current_section}",
                        "text":       chunk,
                        "keywords":   extract_keywords(disease_name, chunk),
                        "char_count": len(chunk),
                    })
                    chunk_idx += 1
                text_buffer = ""
            current_section = text
        else:
            # Detect section from paragraph content as fallback
            detected = detect_section(text)
            if detected != "Overview" and current_section == "Overview":
                current_section = detected
            
            text_buffer += " " + text

    # Flush the final remaining buffer
    if text_buffer.strip():
        for chunk in chunk_text(text_buffer):
            chunks_out.append({
                "id":         make_id(disease_name, chunk_idx),
                "source":     "PlanetAyurveda",
                "book":       "Diseases A-Z",
                "category":   "disease_treatment",
                "page":       1,
                "section":    f"{disease_name} — {current_section}",
                "text":       chunk,
                "keywords":   extract_keywords(disease_name, chunk),
                "char_count": len(chunk),
            })
            chunk_idx += 1

    return chunks_out


# ── Main ───────────────────────────────────────────────────────────────────────

async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    done_urls   = load_progress()
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

        # Inject stealth JS to hide navigator.webdriver property
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            window.chrome = { runtime: {} };
        """)

        page = await context.new_page()

        # ── Step 1: Get all disease links ──
        links = await get_disease_links(page)

        # Open the output file in append mode (resume-safe)
        with open(OUTPUT_FILE, 'a', encoding='utf-8') as out_f:
            for i, (name, url) in enumerate(links):
                if url in done_urls:
                    print(f"  [SKIP] {name} — already done")
                    continue

                print(f"\n[{i+1}/{len(links)}] Scraping: {name}")
                print(f"            URL: {url}")

                chunks = await scrape_disease_page(page, name, url)

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

                # Human-like delay between pages
                delay = random.uniform(DELAY_MIN, DELAY_MAX)
                print(f"  [WAIT] {delay:.1f}s before next page...")
                await asyncio.sleep(delay)

        await browser.close()

    # ── Summary ──
    print(f"\n{'='*60}")
    print("[DONE] Scraping Complete!")
    print(f"   Total diseases processed : {len(done_urls)}")
    print(f"   Total chunks extracted   : {total_chunks}")
    print(f"   Output file              : {OUTPUT_FILE}")
    if failed_urls:
        print(f"\n[WARN] Failed URLs ({len(failed_urls)}):")
        for u in failed_urls:
            print(f"   - {u}")
    print(f"\n▶ Next step: npx ts-node scripts/ingest_books.ts")


if __name__ == "__main__":
    asyncio.run(main())
