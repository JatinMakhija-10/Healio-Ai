import os
import sys
import time
import json
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
LOG_FILE = Path(__file__).parent.parent / "logs" / "model_download_status.json"

DEST_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

WEIGHT_FILES = [
    "model-00001-of-00003.safetensors",
    "model-00002-of-00003.safetensors",
    "model-00003-of-00003.safetensors",
]

def update_status(filename, pct, downloaded_gb, total_gb, speed_mb):
    status = {
        "current_file": filename,
        "progress_percent": round(pct, 1),
        "downloaded_gb": round(downloaded_gb, 2),
        "total_gb": round(total_gb, 2),
        "speed_mbps": round(speed_mb * 8, 1),
        "speed_mb_s": round(speed_mb, 2),
        "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    try:
        LOG_FILE.write_text(json.dumps(status, indent=2), encoding="utf-8")
    except Exception:
        pass

def download_file_resumable(filename: str):
    dest_path = DEST_DIR / filename
    url = f"https://huggingface.co/{REPO_ID}/resolve/main/{filename}"
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}

    print(f"[{time.strftime('%H:%M:%S')}] Connecting to Hugging Face for {filename}...", flush=True)
    head_resp = requests.head(url, headers=headers, allow_redirects=True)
    total_bytes = int(head_resp.headers.get("content-length", 0))

    while True:
        downloaded_bytes = dest_path.stat().st_size if dest_path.exists() else 0

        if total_bytes > 0 and downloaded_bytes >= total_bytes:
            size_gb = downloaded_bytes / (1024**3)
            print(f"[{time.strftime('%H:%M:%S')}] [COMPLETED] {filename} ({size_gb:.2f} GB)", flush=True)
            update_status(filename, 100.0, size_gb, size_gb, 0.0)
            break

        req_headers = headers.copy()
        if downloaded_bytes > 0:
            req_headers["Range"] = f"bytes={downloaded_bytes}-"
            print(f"[{time.strftime('%H:%M:%S')}] [RESUMING] {filename} at {downloaded_bytes / (1024**2):.1f} MB / {total_bytes / (1024**3):.2f} GB...", flush=True)
        else:
            print(f"[{time.strftime('%H:%M:%S')}] [STARTING] {filename} ({total_bytes / (1024**3):.2f} GB)...", flush=True)

        mode = "ab" if downloaded_bytes > 0 else "wb"
        start_time = time.time()
        last_log_time = start_time
        downloaded_in_session = 0

        try:
            resp = requests.get(url, headers=req_headers, stream=True, allow_redirects=True, timeout=30)
            if resp.status_code not in (200, 206):
                print(f"[{time.strftime('%H:%M:%S')}] HTTP {resp.status_code}. Retrying in 5s...", flush=True)
                time.sleep(5)
                continue

            with open(dest_path, mode) as f:
                for chunk in resp.iter_content(chunk_size=4 * 1024 * 1024): # 4MB chunks
                    if chunk:
                        f.write(chunk)
                        downloaded_bytes += len(chunk)
                        downloaded_in_session += len(chunk)

                        now = time.time()
                        if now - last_log_time >= 3.0:
                            elapsed = max(now - start_time, 0.1)
                            speed_mb = (downloaded_in_session / (1024**2)) / elapsed
                            pct = (downloaded_bytes / total_bytes * 100) if total_bytes > 0 else 0
                            downloaded_gb = downloaded_bytes / (1024**3)
                            total_gb = total_bytes / (1024**3)

                            update_status(filename, pct, downloaded_gb, total_gb, speed_mb)
                            print(f"[{time.strftime('%H:%M:%S')}] {filename}: {pct:.1f}% ({downloaded_gb:.2f}/{total_gb:.2f} GB) @ {speed_mb:.2f} MB/s ({speed_mb*8:.1f} Mbps)", flush=True)
                            last_log_time = now

        except Exception as e:
            print(f"[{time.strftime('%H:%M:%S')}] Stream interrupted ({str(e)[:80]}). Resuming in 3s...", flush=True)
            time.sleep(3)

def main():
    print(f"[{time.strftime('%H:%M:%S')}] Starting Authenticated AyurParam Downloader")
    print(f"[{time.strftime('%H:%M:%S')}] Target: {DEST_DIR}\n", flush=True)

    for fn in WEIGHT_FILES:
        download_file_resumable(fn)

    print(f"\n[{time.strftime('%H:%M:%S')}] [SUCCESS] All AyurParam model shards 100% downloaded!", flush=True)

if __name__ == "__main__":
    main()
