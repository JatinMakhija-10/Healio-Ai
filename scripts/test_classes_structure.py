import asyncio
import sys
import random
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
        )
        context = await browser.new_context(user_agent=random.choice(USER_AGENTS))
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', { get: () => undefined });")
        page = await context.new_page()

        print("Fetching classes...")
        try:
            res = await page.goto('https://www.drugs.com/drug-classes.html', wait_until="domcontentloaded", timeout=60000)
            if res.status == 403:
                print("403! Please solve CAPTCHA in 15 seconds.")
                await asyncio.sleep(15)
            
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            classes = []
            box = soup.find('div', class_='contentBox') or soup.find('main')
            if box:
                # Find all links that look like drug classes
                for a in box.find_all('a', href=True):
                    href = a['href']
                    if '/drug-class/' in href or '/cg/' in href or 'condition' in href or 'classes' in href:
                         classes.append((a.get_text(strip=True), href))
            
            print(f"Found {len(classes)} potential class links. Here are a few:")
            for c in classes[:10]:
                print(c)
                
            # If we go into one link, what does it look like?
            if classes:
                test_url = "https://www.drugs.com" + classes[0][1] if not classes[0][1].startswith("http") else classes[0][1]
                print(f"Fetching sub-page: {test_url}")
                await page.goto(test_url, wait_until="domcontentloaded")
                sub_html = await page.content()
                sub_soup = BeautifulSoup(sub_html, 'html.parser')
                sub_box = sub_soup.find('div', class_='contentBox') or sub_soup.find('main')
                if sub_box:
                    print("Sub-page links:")
                    sub_links = sub_box.find_all('table')
                    if sub_links:
                         print("Found tables in sub-page!")
                    else:
                         uls = sub_box.find_all('ul')
                         print(f"Found {len(uls)} lists in sub-page.")
                         
        except Exception as e:
            print("Error:", e)
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
