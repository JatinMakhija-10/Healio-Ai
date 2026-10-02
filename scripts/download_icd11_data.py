import requests
import zipfile
import io
import json
import os
from pathlib import Path

OUT_DIR = Path(__file__).parent.parent / "data" / "icd11"
OUT_DIR.mkdir(parents=True, exist_ok=True)

zip_url = "https://icdcdn.who.int/static/releasefiles/2024-01/MorbidityTabulationList_en.zip"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

print(f"[INFO] Downloading official WHO ICD-11 MMS 2024-01 dataset from {zip_url}...")
resp = requests.get(zip_url, headers=headers, stream=True)

if resp.status_code == 200:
    print("[INFO] Successfully connected! Extracting ZIP archive contents...")
    z = zipfile.ZipFile(io.BytesIO(resp.content))
    z.extractall(OUT_DIR)
    extracted_files = [f for f in OUT_DIR.iterdir()]
    print(f"[SUCCESS] Extracted {len(extracted_files)} files to {OUT_DIR}:")
    for ef in extracted_files:
        print(f"  - {ef.name} ({ef.stat().st_size // 1024} KB)")
else:
    print(f"[ERROR] Failed to download ZIP: HTTP {resp.status_code}")
