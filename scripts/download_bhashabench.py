"""
Healio.AI — Download BhashaBench-Ayur from HuggingFace
=======================================================
Dataset: bharatgenai/BhashaBench-Ayur
14,963 validated Ayurvedic Q&A questions from 50+ govt exams (English + Hindi)
License: CC BY 4.0

⚠️  GATED DATASET — You MUST:
  1. Create a HuggingFace account at https://huggingface.co/join
  2. Visit https://huggingface.co/datasets/bharatgenai/BhashaBench-Ayur
  3. Click "Access repository" and accept the conditions
  4. Go to https://huggingface.co/settings/tokens and create a READ token
  5. Set it: set HF_TOKEN=hf_your_token_here   (Windows CMD)
             $env:HF_TOKEN="hf_your_token_here" (PowerShell)

Install deps:
  pip install huggingface_hub datasets pandas pyarrow

Run:
  python scripts/download_bhashabench.py
"""

import os
import json
import sys
from pathlib import Path

# ── Check deps ──────────────────────────────────────────────────────────────
try:
    from datasets import load_dataset
    import pandas as pd
except ImportError:
    print("❌ Missing dependencies. Please run:")
    print("   pip install huggingface_hub datasets pandas pyarrow")
    sys.exit(1)

# ── Config ───────────────────────────────────────────────────────────────────
HF_TOKEN    = os.environ.get("HF_TOKEN", "")
DATASET_ID  = "bharatgenai/BhashaBench-Ayur"
LANGUAGES   = ["English", "Hindi"]
SPLIT       = "test"
OUT_DIR     = Path(__file__).parent.parent / "data" / "ayurveda" / "raw" / "bhashabench"

# ── Validate token ────────────────────────────────────────────────────────────
if not HF_TOKEN:
    print("❌ HF_TOKEN environment variable is not set.")
    print("   1. Get your token from: https://huggingface.co/settings/tokens")
    print("   2. Run in PowerShell: $env:HF_TOKEN=\"hf_your_token_here\"")
    print("   3. Then re-run this script.")
    sys.exit(1)

print(f"✅ HF_TOKEN found: {HF_TOKEN[:8]}...")

# ── Create output directories ─────────────────────────────────────────────────
OUT_DIR.mkdir(parents=True, exist_ok=True)
print(f"📁 Output directory: {OUT_DIR}\n")

all_records = []

for lang in LANGUAGES:
    print(f"⬇️  Downloading {lang} subset...")
    try:
        dataset = load_dataset(
            DATASET_ID,
            data_dir=lang,
            split=SPLIT,
            token=HF_TOKEN,
        )

        # Convert to pandas then to list of dicts
        df = dataset.to_pandas()
        records = df.to_dict(orient="records")

        # Tag each record with language
        for r in records:
            r["language"] = lang

        # Save language-specific JSON
        lang_file = OUT_DIR / f"bhashabench_{lang.lower()}.json"
        with open(lang_file, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=2)

        print(f"  ✅ {len(records)} records saved → {lang_file.name}")
        all_records.extend(records)

    except Exception as e:
        print(f"  ❌ Error downloading {lang} subset: {e}")
        print("     Make sure you've accepted the dataset conditions on HuggingFace.")

# ── Save combined JSON ────────────────────────────────────────────────────────
if all_records:
    combined_file = OUT_DIR / "bhashabench_combined.json"
    with open(combined_file, "w", encoding="utf-8") as f:
        json.dump(all_records, f, ensure_ascii=False, indent=2)

    print(f"\n📦 Combined file: {combined_file.name}")
    print(f"   Total records : {len(all_records)}")

    # ── Print a sample record ─────────────────────────────────────────────────
    sample = all_records[0]
    print("\n📋 Sample record fields:")
    for key, val in sample.items():
        val_preview = str(val)[:80] + "..." if len(str(val)) > 80 else str(val)
        print(f"   {key}: {val_preview}")

    print("\n✅ BhashaBench-Ayur download complete!")
    print(f"   Next step: run  npx ts-node scripts/ingest_bhashabench.ts")

else:
    print("\n⚠️  No records were downloaded. Check the errors above.")
