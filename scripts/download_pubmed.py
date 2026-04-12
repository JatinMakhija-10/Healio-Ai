# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

"""
Healio.AI -- Download PubMed Ayurveda Abstracts via NCBI E-utilities API
=========================================================================
Fetches open-access Ayurveda research paper abstracts using the NCBI
Entrez API (free, no API key required for low volume -- add your key
for higher rate limits).

Saves structured JSON to: data/ayurveda/raw/pubmed/ayurveda_pubmed.json

NCBI API docs: https://www.ncbi.nlm.nih.gov/books/NBK25501/

Install deps:
  pip install requests

Run:
  python scripts/download_pubmed.py
"""

import json
import time
from pathlib import Path

try:
    import requests
except ImportError:
    print("[ERROR] Missing dependencies. Run: pip install requests")
    sys.exit(1)

# -- Config -------------------------------------------------------------------
# Add your NCBI API key here for 10 req/s instead of 3 req/s:
# Get one at: https://www.ncbi.nlm.nih.gov/account/
NCBI_API_KEY   = ""         # Optional but recommended
MAX_RESULTS    = 5000       # Total papers to fetch (Ayurveda has ~25k on PubMed)
BATCH_SIZE     = 200        # Papers per API call
DELAY_SEC      = 0.4        # Delay between requests (free: 3/s, with key: 10/s)
OUT_DIR        = Path(__file__).parent.parent / "data" / "ayurveda" / "raw" / "pubmed"

SEARCH_QUERIES = [
    "Ayurveda[Title/Abstract]",
    "Ayurvedic medicine herb remedy[Title/Abstract]",
    "ethnopharmacology India traditional[Title/Abstract]",
    "home remedy India herb[Title/Abstract]",
    "Charaka Sushruta Ashtanga[Title/Abstract]",
    "Ashwagandha Turmeric Triphala Neem biological activity[Title/Abstract]",
]

BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def build_params(extra: dict) -> dict:
    base = {"db": "pubmed", "retmode": "json"}
    if NCBI_API_KEY:
        base["api_key"] = NCBI_API_KEY
    return {**base, **extra}


def esearch(query: str, retmax: int = MAX_RESULTS) -> list:
    pmids: list = []
    retstart = 0
    print(f"  [SEARCH] {query[:60]}...")

    while retstart < retmax:
        batch = min(BATCH_SIZE, retmax - retstart)
        params = build_params({
            "term":     query,
            "rettype":  "uilist",
            "retstart": retstart,
            "retmax":   batch,
        })
        try:
            resp = requests.get(f"{BASE_URL}/esearch.fcgi", params=params, timeout=20)
            resp.raise_for_status()
            data = resp.json()
            ids  = data.get("esearchresult", {}).get("idlist", [])
            if not ids:
                break
            pmids.extend(ids)
            count = int(data["esearchresult"].get("count", 0))
            print(f"    {len(pmids)}/{min(retmax, count)} IDs fetched...")
            if len(pmids) >= min(retmax, count):
                break
            retstart += batch
            time.sleep(DELAY_SEC)
        except Exception as e:
            print(f"  [FAIL] Search error: {e}")
            break

    return pmids


def efetch_abstracts(pmids: list) -> list:
    records: list = []
    print(f"\n  [FETCH] Fetching abstracts for {len(pmids)} papers...")

    for i in range(0, len(pmids), BATCH_SIZE):
        batch_ids = pmids[i: i + BATCH_SIZE]
        params    = build_params({
            "id":      ",".join(batch_ids),
            "rettype": "abstract",
            "retmode": "xml",
        })

        try:
            resp = requests.get(f"{BASE_URL}/efetch.fcgi", params=params, timeout=40)
            resp.raise_for_status()

            xml      = resp.text
            articles = xml.split("<PubmedArticle>")[1:]

            for art_xml in articles:
                pmid     = extract_between(art_xml, '<PMID Version="1">', "</PMID>") or \
                           extract_between(art_xml, "<PMID>", "</PMID>")
                title    = extract_between(art_xml, "<ArticleTitle>", "</ArticleTitle>")
                abstract = extract_between(art_xml, "<AbstractText>", "</AbstractText>")
                journal  = extract_between(art_xml, "<Title>", "</Title>")
                year     = extract_between(art_xml, "<Year>", "</Year>")
                doi_raw  = extract_between(art_xml, '<ArticleId IdType="doi">', "</ArticleId>")

                if pmid and title:
                    records.append({
                        "pmid":     pmid.strip(),
                        "title":    clean_xml_tags(title).strip(),
                        "abstract": clean_xml_tags(abstract).strip() if abstract else "",
                        "journal":  clean_xml_tags(journal).strip() if journal else "",
                        "year":     year.strip() if year else "",
                        "doi":      doi_raw.strip() if doi_raw else "",
                        "url":      f"https://pubmed.ncbi.nlm.nih.gov/{pmid.strip()}/",
                        "source":   "PubMed",
                    })

            done = min(i + BATCH_SIZE, len(pmids))
            print(f"    {done}/{len(pmids)} processed ({len(records)} w/ titles)...")
            time.sleep(DELAY_SEC)

        except Exception as e:
            print(f"  [FAIL] Fetch error (batch {i}): {e}")
            time.sleep(2)

    return records


def extract_between(text: str, start: str, end: str) -> str:
    try:
        s = text.index(start) + len(start)
        e = text.index(end, s)
        return text[s:e]
    except ValueError:
        return ""


def clean_xml_tags(text: str) -> str:
    import re
    return re.sub(r"<[^>]+>", " ", text).strip()


def main():
    print("PubMed Ayurveda Downloader -- Healio.AI\n")

    all_pmids: list = []
    seen_pmids: set = set()

    for query in SEARCH_QUERIES:
        ids     = esearch(query, retmax=MAX_RESULTS // len(SEARCH_QUERIES))
        new_ids = [x for x in ids if x not in seen_pmids]
        seen_pmids.update(new_ids)
        all_pmids.extend(new_ids)
        print(f"  -> {len(new_ids)} new unique IDs (total: {len(all_pmids)})")
        time.sleep(DELAY_SEC * 2)

    print(f"\n[STATS] Total unique PMIDs: {len(all_pmids)}")

    records = efetch_abstracts(all_pmids)

    out_file = OUT_DIR / "ayurveda_pubmed.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"\n[DONE] {len(records)} records saved to {out_file.name}")
    print(f"   File size: {out_file.stat().st_size // 1024} KB")

    if records:
        s = records[0]
        print(f"\n[SAMPLE]")
        print(f"   PMID    : {s['pmid']}")
        print(f"   Title   : {s['title'][:80]}...")
        print(f"   Journal : {s['journal']}")
        print(f"   Year    : {s['year']}")
        print(f"   Abstract: {s['abstract'][:120]}...")


if __name__ == "__main__":
    main()
