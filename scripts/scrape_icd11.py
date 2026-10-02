import requests
import re
from bs4 import BeautifulSoup

url = "https://icd.who.int/browse/2024-01/mms/en"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
}

resp = requests.get(url, headers=headers)
soup = BeautifulSoup(resp.text, 'html.parser')

print("Page Title:", soup.title.string if soup.title else "No Title")

# Find all script tags
scripts = soup.find_all('script')
print(f"Found {len(scripts)} script tags.")

for idx, s in enumerate(scripts):
    if s.string:
        # Search for API URLs or endpoints in JavaScript
        matches = re.findall(r'["\'](/browse[^\'\"]+|/icd[^\'\"]+|https://id\.who\.int[^\'\"]+)["\']', s.string)
        if matches:
            print(f"Script #{idx} matches:", set(matches))
            
    if s.get('src'):
        src = s.get('src')
        if not src.startswith('http'):
            src = f"https://icd.who.int{src}"
        try:
            r = requests.get(src, headers=headers, timeout=5)
            matches = re.findall(r'["\'](/browse[^\'\"]+|/icd[^\'\"]+|https://id\.who\.int[^\'\"]+|Json[a-zA-Z]+|Get[a-zA-Z]+)["\']', r.text)
            if matches:
                print(f"External script {src} matches:", set(matches)[:10])
        except Exception as e:
            pass

# Also look for category links in the HTML body
cat_links = soup.find_all('a', href=True)
print(f"Found {len(cat_links)} links in HTML.")
sample_links = [a['href'] for a in cat_links if 'mms' in a['href'] or 'browse' in a['href'] or 'id' in a['href']]
print("Sample links:", sample_links[:10])
