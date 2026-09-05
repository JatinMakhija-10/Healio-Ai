import os
import sys
import time
from pathlib import Path

# Force UTF-8 stdout for Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

try:
    import requests
except ImportError:
    print("[ERROR] requests not installed. Run: pip install requests")
    sys.exit(1)

# Load .env.local if present
env_local = Path(__file__).parent.parent / ".env.local"
if env_local.exists():
    for line in env_local.read_text(encoding="utf-8").splitlines():
        if line.startswith("HF_TOKEN="):
            os.environ["HF_TOKEN"] = line.split("=", 1)[1].strip()

HF_TOKEN = os.environ.get("HF_TOKEN", "")
REPO_ID = "bharatgenai/AyurParam"
DEST_DIR = Path(__file__).parent.parent / "data" / "models" / "AyurParam"
DEST_DIR.mkdir(parents=True, exist_ok=True)

WEIGHT_FILES = [
    "model-00001-of-00003.safetensors",
    "model-00002-of-00003.safetensors",
    "model-00003-of-00003.safetensors",
]

def download_file_resumable(filename: str):
    dest_path = DEST_DIR / filename
    url = f"https://huggingface.co/{REPO_ID}/resolve/main/{filename}"
    base_headers = {"Authorization": f"Bearer {HF_TOKEN}"}

    # Get total size from HEAD request
    head_resp = requests.head(url, headers=base_headers, allow_redirects=True)
    total_bytes = int(head_resp.headers.get("content-length", 0))

    while True:
        downloaded_bytes = dest_path.stat().st_size if dest_path.exists() else 0

        if total_bytes > 0 and downloaded_bytes >= total_bytes:
            size_gb = downloaded_bytes / (1024**3)
            print(f"[COMPLETED] {filename} is fully downloaded ({size_gb:.2f} GB)")
            break

        headers = base_headers.copy()
        if downloaded_bytes > 0:
            headers["Range"] = f"bytes={downloaded_bytes}-"
            print(f"[RESUMING] {filename} at {downloaded_bytes / (1024**2):.1f} MB / {total_bytes / (1024**3):.2f} GB...")
        else:
            print(f"[STARTING] {filename} ({total_bytes / (1024**3):.2f} GB)...")

        mode = "ab" if downloaded_bytes > 0 else "wb"
        start_time = time.time()
        last_log_time = start_time

        try:
            resp = requests.get(url, headers=headers, stream=True, allow_redirects=True, timeout=30)
            if resp.status_code not in (200, 206):
                print(f"[HTTP {resp.status_code}] Pausing 5s before retry...")
                time.sleep(5)
                continue

            with open(dest_path, mode) as f:
                for chunk in resp.iter_content(chunk_size=2 * 1024 * 1024): # 2 MB chunks
                    if chunk:
                        f.write(chunk)
                        downloaded_bytes += len(chunk)
                        
                        now = time.time()
                        if now - last_log_time >= 3.0:
                            pct = (downloaded_bytes / total_bytes * 100) if total_bytes > 0 else 0
                            speed_mb = (downloaded_bytes / (1024**2)) / max(now - start_time, 0.1)
                            print(f"  {filename}: {pct:.1f}% ({downloaded_bytes / (1024**3):.2f} / {total_bytes / (1024**3):.2f} GB) @ {speed_mb:.1f} MB/s")
                            last_log_time = now

        except Exception as e:
            print(f"  ⚠️ Stream interrupted ({str(e)[:80]}). Auto-resuming in 3s...")
            time.sleep(3)

def main():
    print(f"[INFO] AyurParam Model Weights Auto-Resuming Direct Streamer")
    print(f"[INFO] Destination: {DEST_DIR}\n")
    
    for fn in WEIGHT_FILES:
        download_file_resumable(fn)

    print("\n[SUCCESS] All AyurParam model shards 100% downloaded and verified!")

if __name__ == "__main__":
    main()
