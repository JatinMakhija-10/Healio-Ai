"""
Healio.AI — Clinical Cases Ingestion Pipeline
==============================================

Downloads, normalizes, embeds, and uploads 4 free datasets into Supabase:

  Dataset          | Cases    | Download      | Format
  ─────────────────────────────────────────────────────────────────────
  PMC-Patients     | 167,000  | Hugging Face  | Free text narratives
  MIMIC-IV Demo    | ~2,700   | PhysioNet     | CSV tables (no auth)
  CUPCase          | 3,562    | Hugging Face  | Free text + diagnosis
  MultiCaRe        | 96,428   | Zenodo        | Free text + metadata

Usage:
  pip install datasets pandas requests tqdm google-generativeai supabase python-dotenv

  # Download and ingest all sources:
  python scripts/ingest_clinical_cases.py --all

  # Individual sources:
  python scripts/ingest_clinical_cases.py --source pmc_patients
  python scripts/ingest_clinical_cases.py --source mimic_demo
  python scripts/ingest_clinical_cases.py --source cupcase
  python scripts/ingest_clinical_cases.py --source multicare

  # Dry run (no upload):
  python scripts/ingest_clinical_cases.py --all --dry-run

  # Limit rows for testing:
  python scripts/ingest_clinical_cases.py --all --limit 500
"""

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Generator

# Force UTF-8 output on Windows (avoids cp1252 UnicodeEncodeError with emoji)
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr.encoding and sys.stderr.encoding.lower() != "utf-8":
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import pandas as pd
import requests
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()                      # .env
load_dotenv(".env.local", override=True)  # .env.local takes precedence (Next.js convention)

# ─── Config ───────────────────────────────────────────────────────────────────

SUPABASE_URL         = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
def _load_gemini_keys() -> list[str]:
    """
    Collect all Gemini API keys from env.
    Supports:
      GEMINI_API_KEYS  — comma-separated list (primary format)
      GEMINI_API_KEY   — single key fallback
      GEMINI_API_KEY_1 ... GEMINI_API_KEY_50  — numbered fallback
      GEMINI_KEY_1    ... GEMINI_KEY_50
      GOOGLE_AI_KEY_1 ... GOOGLE_AI_KEY_50
    """
    keys: list[str] = []

    # PRIMARY: comma-separated bulk key list
    bulk = os.getenv("GEMINI_API_KEYS", "").strip()
    if bulk:
        for k in bulk.split(","):
            k = k.strip()
            if k:
                keys.append(k)

    # FALLBACK: numbered / single keys
    patterns = ["GEMINI_API_KEY", "GEMINI_KEY", "GOOGLE_AI_KEY", "GOOGLE_API_KEY"]
    for base in patterns:
        v = os.getenv(base, "").strip()
        if v:
            keys.append(v)
        for i in range(1, 51):
            v = os.getenv(f"{base}_{i}", "").strip()
            if v:
                keys.append(v)

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique = []
    for k in keys:
        if k not in seen:
            seen.add(k)
            unique.append(k)
    return unique

GEMINI_KEYS          = _load_gemini_keys()
GEMINI_API_KEY       = GEMINI_KEYS[0] if GEMINI_KEYS else ""
_key_index           = 0   # round-robin cursor
_bad_keys: set[str]  = set()  # keys that returned 403 -- auto-skip

def _next_gemini_key() -> str:
    """Return the next working Gemini API key, skipping known-bad ones."""
    global _key_index
    if not GEMINI_KEYS:
        return ""
    # Try up to len(GEMINI_KEYS) times to find a non-blacklisted key
    for _ in range(len(GEMINI_KEYS)):
        key = GEMINI_KEYS[_key_index % len(GEMINI_KEYS)]
        _key_index += 1
        if key not in _bad_keys:
            return key
    # All keys bad -- return any (will fail, but that's logged)
    return GEMINI_KEYS[0]

def _blacklist_key(key: str) -> None:
    """Mark a key as permanently bad for this run."""
    _bad_keys.add(key)
    remaining = len(GEMINI_KEYS) - len(_bad_keys)
    print(f"  [key] Blacklisted ...{key[-6:]} (403). {remaining} working keys left.")

EMBED_MODEL   = "gemini-embedding-001"  # Gemini API; 768-dim via output_dimensionality
EMBED_DIM     = 768
BATCH_SIZE    = 50          # rows per Supabase upsert
EMBED_BATCH   = 20          # texts per Gemini embed call (safe with key rotation)
SLEEP_EMBED   = 0.1         # seconds between embed batches (21 keys = ~210 req/s budget)

DATA_DIR = Path("data/datasets")
DATA_DIR.mkdir(parents=True, exist_ok=True)

# ─── Symptom Normalizer ────────────────────────────────────────────────────────

SYMPTOM_VOCAB = {
    # pain
    r"chest pain|chest discomfort|chest tightness":          "chest_pain",
    r"abdominal pain|belly pain|stomach pain|epigastric":    "abdominal_pain",
    r"headache|head pain|cephalgia":                         "headache",
    r"back pain|backache|lumbar pain":                       "back_pain",
    r"joint pain|arthralgia|arthritis":                      "joint_pain",
    r"muscle pain|myalgia|muscle ache":                      "muscle_pain",
    # respiratory
    r"shortness of breath|dyspnea|breathlessness|sob":       "shortness_of_breath",
    r"cough|coughing":                                        "cough",
    r"wheezing|wheeze":                                       "wheeze",
    r"hemoptysis|coughing blood":                            "hemoptysis",
    # systemic
    r"fever|pyrexia|febrile|high temperature":               "fever",
    r"fatigue|tiredness|exhaustion|lethargy":                "fatigue",
    r"weight loss|losing weight":                            "weight_loss",
    r"weight gain|gaining weight":                           "weight_gain",
    r"night sweats|diaphoresis|sweating":                    "sweating",
    r"chills|rigors|shivering":                              "chills",
    # GI
    r"nausea|nauseated|feeling sick":                        "nausea",
    r"vomiting|vomit|emesis":                                "vomiting",
    r"diarrhea|diarrhoea|loose stools":                      "diarrhea",
    r"constipation|constipated":                             "constipation",
    r"jaundice|yellowing|icterus":                           "jaundice",
    r"dysphagia|difficulty swallowing":                      "dysphagia",
    # neuro
    r"confusion|altered mental|disoriented|delirium":        "confusion",
    r"dizziness|vertigo|lightheaded":                        "dizziness",
    r"seizure|convulsion|epileptic":                         "seizure",
    r"weakness|weak|paresis|paralysis":                      "weakness",
    r"tremor|trembling|shaking":                             "tremor",
    r"headache|migraine":                                    "headache",
    r"syncope|fainting|blackout|loss of consciousness":      "syncope",
    # cardiac
    r"palpitations|heart racing|tachycardia":                "palpitations",
    r"leg swelling|ankle swelling|edema|oedema":             "leg_swelling",
    # urological
    r"dysuria|painful urination|burning urination":          "dysuria",
    r"hematuria|blood in urine":                             "hematuria",
    r"polyuria|frequent urination|urinary frequency":        "polyuria",
    # skin
    r"rash|skin lesion|erythema|urticaria|hives":            "rash",
    r"itching|pruritus|itch":                                "pruritus",
}

def extract_symptoms(text: str) -> list[str]:
    if not text:
        return []
    lower = text.lower()
    found = set()
    for pattern, symptom in SYMPTOM_VOCAB.items():
        if re.search(pattern, lower):
            found.add(symptom)
    return sorted(found)


def age_group(age: int | None) -> str:
    if age is None:
        return "unknown"
    if age < 18:   return "pediatric"
    if age < 40:   return "young_adult"
    if age < 60:   return "middle_aged"
    if age < 75:   return "elderly"
    return "very_elderly"


def normalize_gender(raw: str | None) -> str:
    if not raw:
        return "unknown"
    r = raw.lower().strip()
    if r in ("m", "male", "man", "boy"):   return "male"
    if r in ("f", "female", "woman", "girl"): return "female"
    return "unknown"


def parse_age(raw) -> int | None:
    if raw is None:
        return None
    try:
        s = str(raw).lower().replace("year", "").replace("yo", "").strip()
        val = float(re.findall(r"[\d.]+", s)[0])
        # Convert months to years if < 3
        if "month" in str(raw).lower():
            val = val / 12
        return int(val) if 0 < val < 130 else None
    except (IndexError, ValueError):
        return None


# ─── Gemini Embedder ──────────────────────────────────────────────────────────

def get_embeddings(texts: list[str]) -> list[list[float] | None]:
    """
    Embed texts using Gemini text-embedding-004.
    Uses google.genai (new SDK). Round-robins across all available keys.
    Returns None for any failed item.
    """
    if not GEMINI_KEYS:
        return [None] * len(texts)

    try:
        from google import genai
        from google.genai import types as genai_types

        results: list[list[float] | None] = []
        for i in range(0, len(texts), EMBED_BATCH):
            batch = texts[i:i + EMBED_BATCH]
            embedded = False
            # Retry up to 3 times (handles key blacklisting + transient errors)
            for attempt in range(3):
                key = _next_gemini_key()
                try:
                    client = genai.Client(api_key=key)
                    response = client.models.embed_content(
                        model=EMBED_MODEL,
                        contents=batch,
                        config=genai_types.EmbedContentConfig(
                            task_type="RETRIEVAL_DOCUMENT",
                            output_dimensionality=768,
                        ),
                    )
                    for emb in response.embeddings:
                        results.append(emb.values if emb.values else None)
                    embedded = True
                    break
                except Exception as e:
                    err_str = str(e)
                    if "403" in err_str or "PERMISSION_DENIED" in err_str:
                        _blacklist_key(key)
                        continue  # retry with next key immediately
                    print(f"  [embed] Batch {i//EMBED_BATCH} (key ...{key[-6:]}) failed: {e}")
                    break  # non-403 error -- don't retry
            if not embedded:
                results.extend([None] * len(batch))
            time.sleep(SLEEP_EMBED)
        return results

    except ImportError:
        print("  [embed] google-genai not installed. Run: pip install google-genai")
        return [None] * len(texts)


# ─── Supabase Uploader ────────────────────────────────────────────────────────

def upload_to_supabase(rows: list[dict], dry_run: bool = False) -> int:
    if dry_run:
        print(f"  [dry-run] Would upload {len(rows)} rows")
        return len(rows)

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("  [upload] Supabase credentials missing -- saving to JSON fallback")
        fallback_path = DATA_DIR / "clinical_cases_pending.jsonl"
        with open(fallback_path, "a") as f:
            for row in rows:
                f.write(json.dumps(row) + "\n")
        return len(rows)

    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        uploaded = 0
        for i in range(0, len(rows), BATCH_SIZE):
            batch = rows[i:i + BATCH_SIZE]
            # Remove embedding if None (Supabase rejects null vectors)
            clean_batch = []
            for row in batch:
                r = {k: v for k, v in row.items() if v is not None}
                clean_batch.append(r)

            try:
                client.table("clinical_cases").upsert(
                    clean_batch,
                    on_conflict="case_id"
                ).execute()
                uploaded += len(clean_batch)
            except Exception as e:
                print(f"  [upload] Batch {i//BATCH_SIZE} failed: {e}")

        return uploaded
    except ImportError:
        print("  [upload] supabase package not installed")
        return 0


# ─── Source 1: PMC-Patients ───────────────────────────────────────────────────

# Known working Hugging Face IDs (verified May 2026)
PMC_PATIENTS_HF_IDS = [
    "zhengyun21/PMC-Patients",          # primary (author's repo)
    "ncats/PMC-Patients",               # NCATS mirror
    "pmc_patients",                     # alternate slug
]
# Figshare direct download fallback (no HF account needed)
PMC_PATIENTS_FIGSHARE = "https://figshare.com/ndownloader/files/40543031"
PMC_PATIENTS_JSONL    = DATA_DIR / "pmc_patients.jsonl"


def _download_pmc_figshare() -> bool:
    """Download PMC-Patients JSONL directly from Figshare."""
    if PMC_PATIENTS_JSONL.exists():
        return True
    print("  Downloading PMC-Patients from Figshare (~300 MB)...")
    try:
        r = requests.get(PMC_PATIENTS_FIGSHARE, stream=True, timeout=60,
                         allow_redirects=True)
        r.raise_for_status()
        with open(PMC_PATIENTS_JSONL, "wb") as f:
            for chunk in tqdm(r.iter_content(8192), desc="  Downloading", unit="KB"):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"  [WARN] Figshare download failed: {e}")
        return False


def ingest_pmc_patients(limit: int | None = None, dry_run: bool = False) -> int:
    """
    PMC-Patients: 167k patient narratives from PubMed Central case reports.
    Primary:  huggingface.co/datasets/zhengyun21/PMC-Patients
    Fallback: figshare.com/articles/dataset/PMC-Patients/22655571
    """
    print("\n[PMC] PMC-Patients (Hugging Face -> Figshare fallback)")

    ds = None
    try:
        from datasets import load_dataset
        for hf_id in PMC_PATIENTS_HF_IDS:
            try:
                print(f"  Trying HF id: {hf_id} ...")
                ds = load_dataset(hf_id, split="train")
                print(f"  [OK] Loaded from {hf_id}")
                break
            except Exception as e:
                print(f"  [FAIL] {hf_id}: {e}")
    except ImportError:
        print("  Install: pip install datasets")
        return 0

    # Fallback: read from Figshare JSONL
    if ds is None:
        print("  All HF ids failed -- trying Figshare direct download...")
        if not _download_pmc_figshare():
            print("  [FAIL] PMC-Patients unavailable -- skipping")
            return 0

        # Parse JSONL manually
        rows_raw = []
        with open(PMC_PATIENTS_JSONL, encoding="utf-8") as f:
            for i, line in enumerate(f):
                if limit and i >= limit:
                    break
                try:
                    rows_raw.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
        print(f"  Loaded {len(rows_raw):,} cases from Figshare JSONL")
        return _process_pmc_rows(rows_raw, dry_run)

    if limit:
        ds = ds.select(range(min(limit, len(ds))))

    print(f"  Loaded {len(ds):,} cases from Hugging Face")
    items = list(ds)
    return _process_pmc_rows(items, dry_run)


def _process_pmc_rows(items: list, dry_run: bool) -> int:
    """Shared processor for PMC-Patients regardless of download source."""
    rows = []
    for i, item in enumerate(tqdm(items, desc="  Processing")):
        # Field names vary slightly across HF repos and JSONL
        narrative = (
            item.get("patient") or
            item.get("text") or
            item.get("abstract") or
            item.get("case_text") or ""
        )
        if len(narrative) < 50:
            continue

        uid      = item.get("patient_uid") or item.get("uid") or str(i)
        age_val  = parse_age(item.get("age"))
        gender   = normalize_gender(item.get("gender"))
        symptoms = extract_symptoms(narrative)

        rows.append({
            "case_id":             f"pmc_{uid}",
            "source":              "pmc_patients",
            "source_url":          f"https://pubmed.ncbi.nlm.nih.gov/{str(uid).split('-')[0]}/",
            "age":                 age_val,
            "age_group":           age_group(age_val),
            "gender":              gender,
            "chief_complaint":     narrative[:200],
            "presenting_symptoms": symptoms,
            "clinical_findings":   None,
            "diagnosis":           [],
            "icd_codes":           [],
            "medications":         [],
            "treatment_summary":   None,
            "outcome":             "unknown",
            "narrative":           narrative[:3000],
            "specialty":           None,
            "publication_year":    None,
            "metadata":            json.dumps({"pmid": uid}),
        })

    print(f"  Embedding {len(rows)} narratives...")
    embeddings = get_embeddings([r["narrative"] for r in rows])
    for row, emb in zip(rows, embeddings):
        if emb:
            row["embedding"] = emb

    uploaded = upload_to_supabase(rows, dry_run)
    print(f"  [OK] PMC-Patients: {uploaded:,} rows uploaded")
    return uploaded


# ─── Source 2: MIMIC-IV Demo ──────────────────────────────────────────────────

MIMIC_DEMO_FILES = {
    # v2.2 (latest stable -- no auth needed)
    "admissions":    "https://physionet.org/files/mimic-iv-demo/2.2/hosp/admissions.csv.gz",
    "diagnoses":     "https://physionet.org/files/mimic-iv-demo/2.2/hosp/diagnoses_icd.csv.gz",
    "prescriptions": "https://physionet.org/files/mimic-iv-demo/2.2/hosp/prescriptions.csv.gz",
    "patients":      "https://physionet.org/files/mimic-iv-demo/2.2/hosp/patients.csv.gz",
    "d_icd":         "https://physionet.org/files/mimic-iv-demo/2.2/hosp/d_icd_diagnoses.csv.gz",
}
# v2.0 fallback URLs if v2.2 is unavailable
MIMIC_DEMO_FILES_V20 = {
    "admissions":    "https://physionet.org/files/mimic-iv-demo/2.0/hosp/admissions.csv.gz",
    "diagnoses":     "https://physionet.org/files/mimic-iv-demo/2.0/hosp/diagnoses_icd.csv.gz",
    "prescriptions": "https://physionet.org/files/mimic-iv-demo/2.0/hosp/prescriptions.csv.gz",
    "patients":      "https://physionet.org/files/mimic-iv-demo/2.0/hosp/patients.csv.gz",
    "d_icd":         "https://physionet.org/files/mimic-iv-demo/2.0/hosp/d_icd_diagnoses.csv.gz",
}

ICD_PREFIX_TO_NAME = {
    "I21": "Myocardial Infarction", "I50": "Heart Failure",
    "I48": "Atrial Fibrillation",  "I63": "Ischemic Stroke",
    "J18": "Pneumonia",            "J44": "COPD",
    "A41": "Sepsis",               "N18": "Chronic Kidney Disease",
    "E11": "Type 2 Diabetes",      "I10": "Hypertension",
    "K92": "GI Bleed",             "N39": "Urinary Tract Infection",
    "I26": "Pulmonary Embolism",   "K80": "Cholelithiasis",
    "G35": "Multiple Sclerosis",   "E05": "Hyperthyroidism",
    "K35": "Appendicitis",         "M05": "Rheumatoid Arthritis",
}

CONDITION_SYMPTOMS = {
    "Myocardial Infarction": ["chest_pain", "sweating", "shortness_of_breath", "nausea"],
    "Heart Failure":         ["shortness_of_breath", "leg_swelling", "fatigue"],
    "Atrial Fibrillation":   ["palpitations", "dizziness", "shortness_of_breath"],
    "Ischemic Stroke":       ["weakness", "confusion", "dizziness", "syncope"],
    "Pneumonia":             ["fever", "cough", "shortness_of_breath", "fatigue"],
    "COPD":                  ["shortness_of_breath", "cough", "wheeze"],
    "Sepsis":                ["fever", "chills", "confusion", "weakness"],
    "Type 2 Diabetes":       ["polyuria", "fatigue", "weight_loss"],
    "GI Bleed":              ["abdominal_pain", "vomiting", "weakness"],
    "Urinary Tract Infection": ["dysuria", "polyuria", "fever"],
    "Pulmonary Embolism":    ["shortness_of_breath", "chest_pain", "leg_swelling"],
    "Appendicitis":          ["abdominal_pain", "fever", "nausea", "vomiting"],
}

def download_mimic_demo(force: bool = False) -> Path:
    """Download MIMIC-IV Demo files (no authentication required)."""
    demo_dir = DATA_DIR / "mimic_demo"
    demo_dir.mkdir(exist_ok=True)

    headers = {"User-Agent": "Mozilla/5.0 (compatible; HealioAI/1.0; +https://healio.ai)"}

    for name in MIMIC_DEMO_FILES:
        dest = demo_dir / f"{name}.csv.gz"
        if dest.exists() and not force:
            continue
        print(f"  Downloading {name}...")
        downloaded = False
        for url_map in [MIMIC_DEMO_FILES, MIMIC_DEMO_FILES_V20]:
            try:
                r = requests.get(url_map[name], stream=True, timeout=30,
                                 headers=headers, allow_redirects=True)
                r.raise_for_status()
                with open(dest, "wb") as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
                downloaded = True
                break
            except Exception as e:
                print(f"  [WARN] {url_map[name]}: {e}")
        if not downloaded:
            print(f"  [FAIL] Could not download {name} -- will skip MIMIC Demo")

    return demo_dir


def ingest_mimic_demo(limit: int | None = None, dry_run: bool = False) -> int:
    """
    MIMIC-IV Demo: 100 patients, structured EHR (no auth needed).
    Download: physionet.org/content/mimic-iv-demo/
    """
    print("\n[MIM] MIMIC-IV Demo (PhysioNet -- no auth)")

    demo_dir = download_mimic_demo()

    try:
        admissions   = pd.read_csv(demo_dir / "admissions.csv.gz",
                                    usecols=["hadm_id", "subject_id", "admission_type",
                                             "discharge_location", "hospital_expire_flag"])
        diagnoses    = pd.read_csv(demo_dir / "diagnoses.csv.gz",
                                    usecols=["hadm_id", "icd_code", "icd_version"])
        prescriptions= pd.read_csv(demo_dir / "prescriptions.csv.gz",
                                    usecols=["hadm_id", "drug"], low_memory=False)
        patients     = pd.read_csv(demo_dir / "patients.csv.gz",
                                    usecols=["subject_id", "gender", "anchor_age"])
        d_icd        = pd.read_csv(demo_dir / "d_icd.csv.gz",
                                    usecols=["icd_code", "icd_version", "long_title"])
    except Exception as e:
        print(f"  [WARN] Could not load MIMIC Demo files: {e}")
        print("     Run without --source mimic_demo if files are missing")
        return 0

    # Merge patient demographics
    adm = admissions.merge(patients, on="subject_id", how="left")

    # ICD code -> readable name
    icd_map = d_icd.set_index("icd_code")["long_title"].to_dict()

    rows = []
    hadm_ids = adm["hadm_id"].unique()
    if limit:
        hadm_ids = hadm_ids[:limit]

    for hadm_id in tqdm(hadm_ids, desc="  Processing"):
        adm_row   = adm[adm["hadm_id"] == hadm_id].iloc[0]
        diag_rows = diagnoses[diagnoses["hadm_id"] == hadm_id]
        presc_rows= prescriptions[prescriptions["hadm_id"] == hadm_id]

        # Collect diagnoses
        icd_codes   = diag_rows["icd_code"].tolist()
        diag_names  = [icd_map.get(c, c) for c in icd_codes[:5]]

        # Infer symptoms from diagnoses
        symptoms = []
        for code in icd_codes:
            prefix = str(code)[:3]
            cond   = ICD_PREFIX_TO_NAME.get(prefix)
            if cond and cond in CONDITION_SYMPTOMS:
                symptoms.extend(CONDITION_SYMPTOMS[cond])
        symptoms = list(set(symptoms))

        # Medications
        meds = presc_rows["drug"].dropna().str.lower().unique().tolist()[:10]

        age_val = parse_age(adm_row.get("anchor_age"))
        gender  = normalize_gender(adm_row.get("gender"))

        # Build narrative
        outcome_raw = "expired" if adm_row.get("hospital_expire_flag") == 1 else "discharged"
        narrative = (
            f"Patient: {gender}, age {age_val or 'unknown'}. "
            f"Admission type: {adm_row.get('admission_type', 'unknown')}. "
            f"Diagnoses: {', '.join(diag_names[:3]) or 'unknown'}. "
            f"Presenting symptoms: {', '.join(symptoms) or 'unknown'}. "
            f"Medications: {', '.join(meds[:5]) or 'none documented'}. "
            f"Outcome: {outcome_raw}."
        )

        rows.append({
            "case_id":             f"mimic_demo_{hadm_id}",
            "source":              "mimic_demo",
            "source_url":          "https://physionet.org/content/mimic-iv-demo/",
            "age":                 age_val,
            "age_group":           age_group(age_val),
            "gender":              gender,
            "chief_complaint":     f"Admitted with {diag_names[0] if diag_names else 'unknown condition'}",
            "presenting_symptoms": symptoms,
            "clinical_findings":   None,
            "diagnosis":           diag_names[:5],
            "icd_codes":           icd_codes[:5],
            "medications":         meds,
            "treatment_summary":   None,
            "outcome":             outcome_raw,
            "narrative":           narrative,
            "specialty":           None,
            "publication_year":    None,
            "metadata":            json.dumps({"hadm_id": int(hadm_id)}),
        })

    print(f"  Embedding {len(rows)} records...")
    embeddings = get_embeddings([r["narrative"] for r in rows])
    for row, emb in zip(rows, embeddings):
        if emb:
            row["embedding"] = emb

    uploaded = upload_to_supabase(rows, dry_run)
    print(f"  [OK] MIMIC Demo: {uploaded:,} rows uploaded")
    return uploaded


# ─── Source 3: CUPCase ────────────────────────────────────────────────────────

def ingest_cupcase(limit: int | None = None, dry_run: bool = False) -> int:
    """
    CUPCase: 3,562 real BMC case reports with open-ended diagnoses.
    Download: huggingface.co/datasets/ofir408/CupCase
    """
    print("\n[CUP] CUPCase (Hugging Face)")

    try:
        from datasets import load_dataset
    except ImportError:
        print("  Install: pip install datasets")
        return 0

    print("  Downloading CUPCase from Hugging Face...")
    ds = None
    for cup_id in ["ofir408/CupCase", "ofir408/cupcase", "CupCase"]:
        for split_name in ["train", "test", "validation", None]:
            try:
                if split_name:
                    ds = load_dataset(cup_id, split=split_name)
                else:
                    raw = load_dataset(cup_id)
                    # pick any available split
                    split_name = list(raw.keys())[0]
                    ds = raw[split_name]
                print(f"  [OK] Loaded CUPCase from {cup_id} (split={split_name})")
                break
            except Exception:
                pass
        if ds is not None:
            break

    if ds is None:
        print("  [FAIL] CUPCase unavailable on HuggingFace -- skipping")
        return 0

    if limit:
        ds = ds.select(range(min(limit, len(ds))))

    print(f"  Loaded {len(ds):,} cases")

    rows = []
    for i, item in enumerate(tqdm(ds, desc="  Processing")):
        # CUPCase actual schema (ofir408/CupCase):
        #   clean_case_presentation, correct_diagnosis,
        #   distractor1, distractor2, distractor3
        presentation = (
            item.get("clean_case_presentation") or
            item.get("case_presentation") or
            item.get("presentation") or
            item.get("text") or
            item.get("case_text") or ""
        )
        diagnosis_raw = (
            item.get("correct_diagnosis") or
            item.get("final_diagnosis") or
            item.get("diagnosis") or
            item.get("answer") or ""
        )

        if len(presentation) < 50:
            continue

        diagnosis = [diagnosis_raw.strip()] if isinstance(diagnosis_raw, str) and diagnosis_raw else []
        symptoms  = extract_symptoms(presentation)

        narrative = f"Clinical case: {presentation[:2000]}"
        if diagnosis:
            narrative += f" Final diagnosis: {diagnosis[0]}."

        rows.append({
            "case_id":             f"cupcase_{i}",
            "source":              "cupcase",
            "source_url":          "https://huggingface.co/datasets/ofir408/CupCase",
            "age":                 parse_age(item.get("age")),
            "age_group":           age_group(parse_age(item.get("age"))),
            "gender":              normalize_gender(item.get("gender") or item.get("sex")),
            "chief_complaint":     presentation[:200],
            "presenting_symptoms": symptoms,
            "clinical_findings":   item.get("clinical_findings", None),
            "diagnosis":           diagnosis,
            "icd_codes":           [],
            "medications":         [],
            "treatment_summary":   item.get("treatment") or item.get("management") or None,
            "outcome":             item.get("outcome") or "unknown",
            "narrative":           narrative,
            "specialty":           item.get("specialty") or None,
            "publication_year":    parse_age(item.get("year")),
            "metadata":            json.dumps({}),
        })

    print(f"  Embedding {len(rows)} cases...")
    embeddings = get_embeddings([r["narrative"] for r in rows])
    for row, emb in zip(rows, embeddings):
        if emb:
            row["embedding"] = emb

    uploaded = upload_to_supabase(rows, dry_run)
    print(f"  [OK] CUPCase: {uploaded:,} rows uploaded")
    return uploaded


# ─── Source 4: MultiCaRe ──────────────────────────────────────────────────────

# cases.parquet is the clean structured file -- 152 MB, no zip needed
MULTICARE_ZENODO_URL  = "https://zenodo.org/records/10079370/files/cases.parquet"
MULTICARE_PARQUET     = DATA_DIR / "multicare_cases.parquet"

def ingest_multicare(limit: int | None = None, dry_run: bool = False) -> int:
    """
    MultiCaRe: 96,428 clinical cases from PubMed Central 1990-2023.
    Download: zenodo.org/records/10079370  (cases.parquet -- 152 MB)
    """
    print("\n[MCR] MultiCaRe (Zenodo -- cases.parquet)")

    # Download parquet if not cached
    if not MULTICARE_PARQUET.exists():
        print("  Downloading cases.parquet from Zenodo (~152 MB)...")
        try:
            r = requests.get(MULTICARE_ZENODO_URL, stream=True, timeout=120,
                             allow_redirects=True)
            r.raise_for_status()
            total = int(r.headers.get("content-length", 0))
            with open(MULTICARE_PARQUET, "wb") as f, \
                 tqdm(total=total, unit="B", unit_scale=True, desc="  Downloading") as bar:
                for chunk in r.iter_content(65536):
                    f.write(chunk)
                    bar.update(len(chunk))
        except Exception as e:
            print(f"  [WARN] Download failed: {e}")
            print("     Manually download cases.parquet from: https://zenodo.org/records/10079370")
            print(f"     Save to: {MULTICARE_PARQUET}")
            return 0

    print("  Loading parquet...")
    try:
        df = pd.read_parquet(MULTICARE_PARQUET)
    except Exception as e:
        print(f"  [WARN] Could not read parquet: {e}")
        return 0

    print(f"  Columns: {list(df.columns)}")

    # MultiCaRe parquet structure: each row = one article with a nested
    # 'cases' column (numpy array of dicts).
    # Explode into individual case rows.
    import numpy as np
    all_cases: list[dict] = []
    for _, art_row in df.iterrows():
        article_id = art_row.get("article_id", "")
        cases_col  = art_row.get("cases")
        if cases_col is None:
            continue
        # cases_col is numpy.ndarray of dicts (or a list)
        cases_list = cases_col.tolist() if isinstance(cases_col, np.ndarray) else cases_col
        if not isinstance(cases_list, list):
            cases_list = [cases_list]
        for c in cases_list:
            if isinstance(c, dict):
                c["_article_id"] = article_id
                all_cases.append(c)

    print(f"  Exploded to {len(all_cases):,} individual cases")
    if limit:
        all_cases = all_cases[:limit]
    print(f"  Processing {len(all_cases):,} cases...")

    def col(item: dict, candidates: list[str]):
        for c in candidates:
            v = item.get(c)
            if v is not None and str(v).strip() not in ("", "nan", "None"):
                return str(v).strip()
        return None

    rows = []
    count = 0
    for item in tqdm(all_cases, desc="  Processing"):
        narrative = item.get("case_text") or ""
        if len(narrative) < 50:
            continue

        case_id_raw  = item.get("case_id") or item.get("_article_id") or str(count)
        age_val      = parse_age(item.get("age"))
        gender_raw   = col(item, ["gender", "sex"])
        symptoms     = extract_symptoms(narrative)
        pmcid        = str(case_id_raw).split("_")[0] if case_id_raw else ""

        rows.append({
            "case_id":             f"multicare_{case_id_raw}",
            "source":              "multicare",
            "source_url":          f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/",
            "age":                 age_val,
            "age_group":           age_group(age_val),
            "gender":              normalize_gender(gender_raw),
            "chief_complaint":     narrative[:200],
            "presenting_symptoms": symptoms,
            "clinical_findings":   None,
            "diagnosis":           [],
            "icd_codes":           [],
            "medications":         [],
            "treatment_summary":   None,
            "outcome":             "unknown",
            "narrative":           narrative[:3000],
            "specialty":           None,
            "publication_year":    None,
            "metadata":            json.dumps({"case_id": case_id_raw, "article_id": item.get("_article_id", "")}),
        })
        count += 1

        # Upload in batches to avoid memory issues
        if len(rows) >= 500:
            print(f"  Embedding batch of {len(rows)}...")
            embeddings = get_embeddings([r["narrative"] for r in rows])
            for row2, emb in zip(rows, embeddings):
                if emb:
                    row2["embedding"] = emb
            upload_to_supabase(rows, dry_run)
            rows = []

    # Upload remaining
    if rows:
        print(f"  Embedding final batch of {len(rows)}...")
        embeddings = get_embeddings([r["narrative"] for r in rows])
        for row2, emb in zip(rows, embeddings):
            if emb:
                row2["embedding"] = emb
        upload_to_supabase(rows, dry_run)

    print(f"  [OK] MultiCaRe: {count:,} rows processed")
    return count


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Ingest free clinical datasets into Healio.AI Supabase"
    )
    parser.add_argument("--all",      action="store_true", help="Run all sources")
    parser.add_argument("--source",   choices=["pmc_patients", "mimic_demo", "cupcase", "multicare"])
    parser.add_argument("--limit",    type=int, default=None, help="Max rows per source (for testing)")
    parser.add_argument("--dry-run",  action="store_true",    help="Skip Supabase upload")
    args = parser.parse_args()

    if not args.all and not args.source:
        parser.print_help()
        sys.exit(1)

    if not GEMINI_KEYS:
        print("[WARN] No GEMINI_API_KEY found -- embeddings will be skipped")
        print("   Rows will still be uploaded without embeddings\n")
    else:
        print(f"[OK] {len(GEMINI_KEYS)} Gemini API key(s) loaded -- round-robin embedding enabled\n")

    total = 0
    sources_to_run = (
        ["pmc_patients", "mimic_demo", "cupcase", "multicare"]
        if args.all else [args.source]
    )

    for source in sources_to_run:
        if source == "pmc_patients":
            total += ingest_pmc_patients(args.limit, args.dry_run)
        elif source == "mimic_demo":
            total += ingest_mimic_demo(args.limit, args.dry_run)
        elif source == "cupcase":
            total += ingest_cupcase(args.limit, args.dry_run)
        elif source == "multicare":
            total += ingest_multicare(args.limit, args.dry_run)

    print(f"\n{'─'*60}")
    print(f"[DONE] Total rows ingested: {total:,}")
    print(f"   Supabase table:      clinical_cases")
    print(f"   Run migration first: supabase/migrations/20260513_clinical_cases.sql")
    print(f"{'─'*60}")


if __name__ == "__main__":
    main()
