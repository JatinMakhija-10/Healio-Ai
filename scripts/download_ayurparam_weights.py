import os
import sys
from pathlib import Path

# Force UTF-8 stdout for Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Load .env.local if present
env_local = Path(__file__).parent.parent / ".env.local"
if env_local.exists():
    for line in env_local.read_text(encoding="utf-8").splitlines():
        if line.startswith("HF_TOKEN="):
            os.environ["HF_TOKEN"] = line.split("=", 1)[1].strip()

try:
    from huggingface_hub import hf_hub_download
except ImportError:
    print("[ERROR] huggingface_hub not installed. Run: pip install huggingface_hub")
    sys.exit(1)

HF_TOKEN = os.environ.get("HF_TOKEN", "")
REPO_ID = "bharatgenai/AyurParam"
DEST_DIR = Path(__file__).parent.parent / "data" / "models" / "AyurParam"

DEST_DIR.mkdir(parents=True, exist_ok=True)

# The 3 large weight shards (~4.9GB each)
WEIGHT_FILES = [
    "model-00001-of-00003.safetensors",
    "model-00002-of-00003.safetensors",
    "model-00003-of-00003.safetensors",
]

print(f"[INFO] Downloading AyurParam weight shards file-by-file to {DEST_DIR}...")

for filename in WEIGHT_FILES:
    dest_file = DEST_DIR / filename
    if dest_file.exists() and dest_file.stat().st_size > 1_000_000_000:
        size_gb = dest_file.stat().st_size / (1024**3)
        print(f"[SKIP] {filename} already exists ({size_gb:.2f} GB)")
        continue

    print(f"\n[DOWNLOADING] {filename}...")
    try:
        hf_hub_download(
            repo_id=REPO_ID,
            filename=filename,
            local_dir=DEST_DIR,
            token=HF_TOKEN,
            resume_download=True,
        )
        if dest_file.exists():
            size_gb = dest_file.stat().st_size / (1024**3)
            print(f"[DONE] {filename} successfully downloaded ({size_gb:.2f} GB)")
    except Exception as e:
        print(f"[ERROR] Failed downloading {filename}: {e}")

print("\n[COMPLETE] All AyurParam weight shards process finished.")
