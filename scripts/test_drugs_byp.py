import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')
import re
import random
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
]

async def main():
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
        try:
            print("Fetching drugs.com...")
            response = await page.goto('https://www.drugs.com/drug_information.html', wait_until="domcontentloaded", timeout=30000)
            print("Status:", response.status)
            await asyncio.sleep(2)
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')
            title = soup.find('title')
            print("Title:", title.text if title else "No Title")
            
            # Extract A-Z links
            az_links = []
            nav = soup.find('nav', class_=re.compile(r'ddc-paging'))
            if nav:
                for a in nav.find_all('a', href=True):
                    href = a['href']
                    if not href.startswith('http'): 
                        href = "https://www.drugs.com" + href
                    az_links.append(href)
            print(f"Found {len(az_links)} A-Z links:", az_links[:5])
        except Exception as e:
            print("Error:", e)
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
