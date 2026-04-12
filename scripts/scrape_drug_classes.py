"""
Healio.AI — Drugs.com Drug Classes Scraper
==============================================
Scrapes all drug classes from https://www.drugs.com/drug-classes.html
and dynamically extracts the medicines inside each class hyperlink.

NOTE: If drugs.com displays a 403 Forbidden Cloudflare page, the script
will pause for 15 seconds to allow you to manually solve the CAPTCHA
in the open browser window.

Usage:
    python scripts/scrape_drug_classes.py

Output:
    data/drug_classes_database.json
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

BASE_URL      = "https://www.drugs.com"
INDEX_URL     = f"{BASE_URL}/drug-classes.html"
OUTPUT_DIR    = Path("data")
OUTPUT_FILE   = OUTPUT_DIR / "drug_classes_database.json"

DELAY_MIN     = 1.5
DELAY_MAX     = 3.5

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
]

async def human_scroll(page):
    await page.evaluate("window.scrollTo(0, 0)")
    await asyncio.sleep(0.5)
    total_height = await page.evaluate("document.body.scrollHeight")
    current_pos = 0

    while current_pos < total_height:
        step = random.randint(300, 600)
        current_pos += step
        await page.evaluate(f"window.scrollBy(0, {step})")
        await asyncio.sleep(random.uniform(0.1, 0.3))
        total_height = await page.evaluate("document.body.scrollHeight")
    await asyncio.sleep(random.uniform(0.5, 1.0))

async def scrape_class_page(page, url):
    """Scrapes medicines from a specific drug class page."""
    try:
        response = await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        if response.status == 403:
            print("      [WARN] Blocked by 403. Waiting 15s for manual CAPTCHA solving...")
            await asyncio.sleep(15)
            # Re-fetch HTML after potential manual solve
            html = await page.content()
        else:
            await human_scroll(page)
            html = await page.content()
    except Exception as e:
        print(f"      [ERR] Failed to load {url}: {e}")
        return []

    soup = BeautifulSoup(html, 'html.parser')
    drugs = []

    # Strategy 1: Look for data tables (often class='data-list', 'ddc-table', etc.)
    tables = soup.find_all('table')
    if tables:
        for table in tables:
            for row in table.find_all('tr'):
                # Heuristic: the drug name is usually an <a> tag in the first cell or class contains 'd-block'/'condition-table__drug-name'
                cell = row.find('td')
                if cell:
                    a = cell.find('a')
                    if a and href_is_drug(a.get('href', '')):
                        drugs.append(a.get_text(strip=True))

    # Strategy 2: Look for basic ul/li lists if tables are not present (e.g. sub-categories might exist)
    if not drugs:
        uls = soup.find_all('ul', class_=lambda x: x and 'ddc-list' in x)
        for ul in uls:
            for a in ul.find_all('a'):
                if href_is_drug(a.get('href', '')):
                    drugs.append(a.get_text(strip=True))

    return list(dict.fromkeys(drugs))  # unique list

def href_is_drug(href: str) -> bool:
    """Filter links that point to other classes, search, or generic UI elements."""
    exclude = ['/drug-class/', '/cg/', 'search.php', 'alpha/', '#']
    return not any(x in href for x in exclude)

async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    results = {}

    # Load existing progress to resume
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            results = json.load(f)

    ua = random.choice(USER_AGENTS)
    async with async_playwright() as p:
        print("[INFO] Launching browser...")
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

        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', { get: () => undefined });")
        page = await context.new_page()

        print(f"[INFO] Accessing Drug Classes Index: {INDEX_URL}")
        try:
            response = await page.goto(INDEX_URL, wait_until="domcontentloaded")
            if response.status == 403:
                print("ACTION REQUIRED: HTTP 403 Forbidden. Solve CAPTCHA now! Script pausing for 15s...")
                await asyncio.sleep(15)
        except Exception as e:
            print(f"Failed to reach index: {e}")
            await browser.close()
            return

        await human_scroll(page)
        soup = BeautifulSoup(await page.content(), 'html.parser')

        classes = []
        content_box = soup.find('div', class_='contentBox') or soup.find('main')
        if content_box:
            for a in content_box.find_all('a', href=True):
                href = a['href']
                if '/drug-class/' in href and not href.startswith('#'):
                    full_url = href if href.startswith('http') else BASE_URL + href
                    if not full_url in [cls[1] for cls in classes]:
                        name = a.get_text(strip=True)
                        if len(name) > 2:
                            classes.append((name, full_url))

        print(f"[OK] Found {len(classes)} Drug Classes.")

        for i, (cls_name, url) in enumerate(classes):
            if cls_name in results and len(results[cls_name]) > 0:
                print(f"[{i+1}/{len(classes)}] Skipping '{cls_name}' (already extracted: {len(results[cls_name])} drugs)")
                continue

            print(f"\n[{i+1}/{len(classes)}] Scraping Class: {cls_name}")
            print(f"          URL: {url}")
            
            drugs_in_class = await scrape_class_page(page, url)
            print(f"  [+] Extracted {len(drugs_in_class)} drugs in this class.")
            
            results[cls_name] = drugs_in_class

            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2)

            delay = random.uniform(DELAY_MIN, DELAY_MAX)
            print(f"  [WAIT] {delay:.1f}s before next class...")
            await asyncio.sleep(delay)

        await browser.close()

    print(f"\n{'='*60}")
    print("[DONE] Drug Classes Scraping Complete!")
    print(f"Output saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    asyncio.run(main())
