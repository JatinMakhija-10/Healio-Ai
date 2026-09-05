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
    from huggingface_hub import snapshot_download
except ImportError:
    print("[ERROR] huggingface_hub not installed. Run: pip install huggingface_hub")
    sys.exit(1)

HF_TOKEN = os.environ.get("HF_TOKEN", "")
REPO_ID = "bharatgenai/AyurParam"
DEST_DIR = Path(__file__).parent.parent / "data" / "models" / "AyurParam"

DEST_DIR.mkdir(parents=True, exist_ok=True)

print(f"[INFO] Starting download of {REPO_ID}...")
print(f"[INFO] Destination: {DEST_DIR}")
print(f"[INFO] Using HF Token: {HF_TOKEN[:8]}...\n")

try:
    local_path = snapshot_download(
        repo_id=REPO_ID,
        local_dir=DEST_DIR,
        token=HF_TOKEN,
        max_workers=4,
    )
    print(f"\n[SUCCESS] AyurParam model weights downloaded to:\n  {local_path}")
except Exception as e:
    print(f"\n[ERROR] Download failed: {e}")
    sys.exit(1)
