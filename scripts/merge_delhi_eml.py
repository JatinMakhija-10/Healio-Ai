"""
Merge Essential_Medicines_List_2013_Delhi.xlsx into unified_medicines_database.json
Extracts medicine names from all 3 EML sheets, deduplicates, and merges into Allopathic bucket.
"""

import pandas as pd
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX_IN = os.path.join(BASE, "Essential_Medicines_List_2013_Delhi.xlsx")
DB_IN   = os.path.join(BASE, "data", "unified_medicines_database.json")
DB_OUT  = os.path.join(BASE, "data", "unified_medicines_database.json")

SHEETS = [
    'Dispensary EML',
    'Hospital EML - Outpatient',
    'Hospital EML - Inpatient',
]

def title_smart(name: str) -> str:
    words = name.strip().split()
    abbrevs = {"XR","SR","DT","IV","IM","SC","ER","CR","CD","LA","OD","BD","TDS",
               "QID","MR","PR","SF","LS","DS","PD","LB","RF","Q","HCL","BP","IP","USP"}
    return " ".join(w.upper() if w.upper() in abbrevs else w.capitalize() for w in words)

def get_letter(name: str) -> str:
    c = name.strip()[0].upper() if name.strip() else "#"
    return c if c.isalpha() else "#"

# ---------------------------------------------------------------------------
# Step 1: Extract all medicine names from xlsx
# ---------------------------------------------------------------------------
print("[1/4] Reading Delhi EML xlsx ...")
xl = pd.ExcelFile(XLSX_IN)
delhi_names = []

for sheet in SHEETS:
    df = xl.parse(sheet, header=None)
    # Row 0 is the title row, Row 1 is the header (S.No | Medicine Name | ...)
    # Medicine name is in column index 1
    # Category header rows have NaN in column 1 and text (category name) in col 0
    for _, row in df.iterrows():
        cell = row.iloc[1]  # Medicine Name column
        if pd.isna(cell):
            continue
        name = str(cell).strip()
        # Skip header row itself and pure numeric entries
        if name.lower() in {"medicine name", "s.no.", ""} or name.isdigit():
            continue
        # Strip trailing asterisks (used in xlsx for restricted/special medicines)
        name = name.rstrip('*').strip()
        if name:
            delhi_names.append(name)

print(f"   Extracted {len(delhi_names)} raw entries from Delhi EML.")

# Deduplicate preserving original casing, then title-smart format
seen_raw = set()
cleaned = []
for name in delhi_names:
    key = name.lower()
    if key not in seen_raw:
        seen_raw.add(key)
        cleaned.append(title_smart(name))

print(f"   After deduplication: {len(cleaned)} unique medicines.")
print(f"   First 10: {cleaned[:10]}")

# ---------------------------------------------------------------------------
# Step 2: Load existing unified database
# ---------------------------------------------------------------------------
print("\n[2/4] Loading existing unified_medicines_database.json ...")
with open(DB_IN, encoding="utf-8") as f:
    db = json.load(f)

before_count = sum(len(v) for v in db["Allopathic"].values())
print(f"   Current Allopathic count: {before_count:,}")

# ---------------------------------------------------------------------------
# Step 3: Merge Delhi EML into Allopathic bucket
# ---------------------------------------------------------------------------
print("\n[3/4] Merging Delhi EML into Allopathic bucket ...")

# Build a set of existing allopathic names (lowercased)
existing_keys = set()
for letter_list in db["Allopathic"].values():
    for m in letter_list:
        existing_keys.add(m.lower())

new_added = 0
for name in cleaned:
    key = name.lower()
    if key not in existing_keys:
        existing_keys.add(key)
        letter = get_letter(name)
        if letter not in db["Allopathic"]:
            db["Allopathic"][letter] = []
        db["Allopathic"][letter].append(name)
        new_added += 1

# Re-sort every letter bucket after adding
for letter in db["Allopathic"]:
    db["Allopathic"][letter] = sorted(db["Allopathic"][letter], key=lambda x: x.lower())

# Re-sort the letter keys
db["Allopathic"] = dict(sorted(db["Allopathic"].items()))

after_count = sum(len(v) for v in db["Allopathic"].values())
print(f"   Added {new_added} new unique medicines from Delhi EML.")
print(f"   Allopathic count: {before_count:,} -> {after_count:,}")

# ---------------------------------------------------------------------------
# Step 4: Write updated database
# ---------------------------------------------------------------------------
print(f"\n[4/4] Writing updated database to {DB_OUT} ...")
with open(DB_OUT, "w", encoding="utf-8") as f:
    json.dump(db, f, ensure_ascii=False, indent=2)

size_mb = os.path.getsize(DB_OUT) / (1024 * 1024)
print(f"Done! File size: {size_mb:.2f} MB")

print("\n=== FINAL COUNTS ===")
for cat, letters in db.items():
    total = sum(len(v) for v in letters.values())
    print(f"   {cat:15s}: {total:>7,} entries")

# Show some samples from Delhi EML that were actually added
print(f"\nSample medicines added from Delhi EML:")
sample_delhi = [n for n in cleaned if n.lower() in existing_keys][:20]
for m in sample_delhi:
    print(f"   {m}")
