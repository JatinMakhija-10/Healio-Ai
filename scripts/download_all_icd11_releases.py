import requests
import zipfile
import io
import os
from pathlib import Path

OUT_DIR = Path(__file__).parent.parent / "data" / "icd11"
OUT_DIR.mkdir(parents=True, exist_ok=True)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

# Potential WHO ICD-11 2024-01 release URLs
possible_files = [
    "SimpleTabulationList_en.zip",
    "SimpleTabulationList_en.xlsx",
    "ICD11_MMS_2024-01_en.zip",
    "ICD11_MMS_2024-01_en.xlsx",
    "SimpleTabulationList_en.pdf",
    "MMS_2024-01_en.zip",
    "MMS_2024-01_en.xlsx",
    "MorbidityTabulationList_en.xlsx",
    "ICD11-MMS-2024-01.zip",
    "ICD11-MMS-2024-01-en.zip",
    "ICD11_MMS_Linearization_en.zip"
]

base_url = "https://icdcdn.who.int/static/releasefiles/2024-01/"

print(f"[INFO] Scanning WHO ICD-11 CDN for release files at {base_url}...")

for fn in possible_files:
    url = f"{base_url}{fn}"
    try:
        resp = requests.head(url, headers=headers, allow_redirects=True)
        if resp.status_code == 200:
            content_len = int(resp.headers.get("content-length", 0))
            print(f"  [FOUND] {fn} ({content_len // 1024} KB)")
            # Download file
            r = requests.get(url, headers=headers)
            dest = OUT_DIR / fn
            if fn.endswith(".zip"):
                try:
                    z = zipfile.ZipFile(io.BytesIO(r.content))
                    z.extractall(OUT_DIR)
                    print(f"    -> Extracted ZIP contents to {OUT_DIR}")
                except Exception as e:
                    dest.write_bytes(r.content)
            else:
                dest.write_bytes(r.content)
        else:
            pass
    except Exception as e:
        pass

print("\n[INFO] Files in data/icd11:")
for f in OUT_DIR.iterdir():
    print(f"  - {f.name} ({f.stat().st_size // 1024} KB)")
