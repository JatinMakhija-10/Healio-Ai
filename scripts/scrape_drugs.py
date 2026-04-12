"""
Healio.AI — Drugs.com Medicine Index Scraper
==============================================
Scrapes the A-Z list of all medicines from https://www.drugs.com/drug_information.html
to build the all medicines database for the Persona page combobox.

NOTE: Drugs.com actively blocks basic headless browsers (HTTP 403).
To run this successfully, you may need to run it in headed mode 
("headless=False") so you can manually solve a CAPTCHA if prompted,
or run it through a residential proxy.

Usage:
    python scripts/scrape_drugs.py

Output:
    data/medicines_database.json
"""

import asyncio
import sys
import json
import random
from pathlib import Path

# Fix Windows terminal encoding
sys.stdout.reconfigure(encoding='utf-8')

from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

# ── Config ─────────────────────────────────────────────────────────────────────
BASE_URL      = "https://www.drugs.com"
INDEX_URL     = f"{BASE_URL}/drug_information.html"
OUTPUT_DIR    = Path("data")
OUTPUT_FILE   = OUTPUT_DIR / "medicines_database.json"

DELAY_MIN     = 2.0
DELAY_MAX     = 5.0

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
]

# ── Helpers ────────────────────────────────────────────────────────────────────
async def human_scroll(page):
    """Simulate organic human scrolling to evade basic bot detection."""
    await page.evaluate("window.scrollTo(0, 0)")
    await asyncio.sleep(0.5)
    total_height = await page.evaluate("document.body.scrollHeight")
    current_pos = 0

    while current_pos < total_height:
        step = random.randint(300, 600)
        current_pos += step
        await page.evaluate(f"window.scrollBy(0, {step})")
        await asyncio.sleep(random.uniform(0.1, 0.4))
        total_height = await page.evaluate("document.body.scrollHeight")
    await asyncio.sleep(random.uniform(0.5, 1.2))

async def scrape_letter_page(page, url):
    """Scrape a page of medicines and handle pagination."""
    medicines = set()
    next_page_url = url
    page_num = 1
    
    while next_page_url:
        print(f"    - Fetching page {page_num}: {next_page_url}")
        try:
            response = await page.goto(next_page_url, wait_until="domcontentloaded", timeout=60000)
            if response.status == 403:
                print("      [WARN] Blocked by 403 Forbidden. Manual CAPTCHA solve required.")
                # Wait a long time to allow a user to manually solve the CAPTCHA if running headed
                await asyncio.sleep(15)
                # Try reloading after potential manual solve
                html = await page.content()
            else:
                await human_scroll(page)
                html = await page.content()
        except Exception as e:
            print(f"      [ERR] Failed to load {next_page_url}: {e}")
            break

        soup = BeautifulSoup(html, 'html.parser')
        
        # Extract drug names from the lists. Drugs.com typically uses ul.ddc-list-column-2 or similar
        # Fallback: grab any link inside .contentBox or main container that looks like a drug.
        content_box = soup.find('div', class_='contentBox') or soup.find('main')
        if content_box:
            # Often structured in ul lists
            uls = content_box.find_all('ul', class_=lambda x: x and 'ddc-list' in x)
            for ul in uls:
                for a in ul.find_all('a'):
                    drug_name = a.get_text(strip=True)
                    if len(drug_name) > 2 and not drug_name.startswith("Review"):
                        medicines.add(drug_name)
        
        # Check for pagination (e.g. Next ->)
        next_page = soup.find('a', text=lambda t: t and 'Next' in t, class_='ddc-paging-item')
        if not next_page:
            # Try alternative selectors
            nav = soup.find('nav', class_=lambda x: x and 'ddc-paging' in x)
            if nav:
                next_page = nav.find('a', string="Next")

        if next_page and next_page.get('href'):
            href = next_page['href']
            next_page_url = f"{BASE_URL}{href}" if not href.startswith('http') else href
            page_num += 1
            delay = random.uniform(DELAY_MIN, DELAY_MAX)
            await asyncio.sleep(delay)
        else:
            next_page_url = None

    return list(medicines)

# ── Main ───────────────────────────────────────────────────────────────────────
async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    all_medicines = set()

    ua = random.choice(USER_AGENTS)
    async with async_playwright() as p:
        print("[INFO] Launching browser...")
        # NOTE: headless=False is recommended to manually solve Cloudflare blocks on first visit
        browser = await p.chromium.launch(
            headless=False, 
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
            ]
        )

        context = await browser.new_context(
            user_agent=ua,
            viewport={"width": 1366, "height": 768},
            extra_http_headers={"Accept-Language": "en-US,en;q=0.9"}
        )

        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        """)

        page = await context.new_page()

        print(f"[INFO] Accessing Index URL: {INDEX_URL}")
        try:
            response = await page.goto(INDEX_URL, wait_until="domcontentloaded")
            if response.status == 403:
                print("====================================")
                print("ACTION REQUIRED: HTTP 403 Forbidden.")
                print("Please complete the Cloudflare challenge in the headed browser window.")
                print("Script will pause for 15 seconds...\n")
                await asyncio.sleep(15)
            else:
                await asyncio.sleep(2)
        except Exception as e:
            print(f"Failed to reach index: {e}")
            await browser.close()
            return
            
        await human_scroll(page)
        soup = BeautifulSoup(await page.content(), 'html.parser')

        # 1. Grab all A-Z index links (A, B, C...)
        az_links = []
        nav = soup.find('nav', class_=lambda x: x and 'ddc-paging' in x)
        if nav:
            for a in nav.find_all('a', href=True):
                href = a['href']
                if not href.startswith('http'):
                    href = f"{BASE_URL}{href}"
                az_links.append(href)
        
        # Deduplicate
        az_links = list(dict.fromkeys(az_links))
        print(f"[OK] Found {len(az_links)} A-Z alphabetical index links.")

        # 2. Iterate each letter page to grab drug names
        for i, url in enumerate(az_links):
            print(f"\n[{i+1}/{len(az_links)}] Scraping Category URL: {url}")
            medicines = await scrape_letter_page(page, url)
            
            print(f"  [+] Scraped {len(medicines)} medicines from this category.")
            all_medicines.update(medicines)
            
            # Save intermediate progress
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(sorted(list(all_medicines)), f, indent=2)
                
            delay = random.uniform(DELAY_MIN, DELAY_MAX)
            print(f"  [WAIT] {delay:.1f}s before next category...")
            await asyncio.sleep(delay)

        await browser.close()

    print(f"\n{'='*60}")
    print("[DONE] Scraping Complete!")
    print(f"Total medicines extracted: {len(all_medicines)}")
    print(f"Output saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    asyncio.run(main())
