import os
import sys
import json
import time
import queue
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from dotenv import load_dotenv
from supabase import create_client

# Force unbuffered output
sys.stdout.reconfigure(encoding='utf-8')

load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
JINA_API_KEY = os.getenv('JINA_API_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] Supabase credentials missing in .env.local", flush=True)
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

RAW_DATA_PATH = "data/icd11/icd11_mms_2024_01.jsonl"
STATUS_FILE = "logs/icd11_status.json"
os.makedirs("data/icd11", exist_ok=True)
os.makedirs("logs", exist_ok=True)

class WHOTokenManager:
    def __init__(self):
        self.token = None
        self.expiry_time = 0
        self.lock = threading.Lock()

    def decode_token(self, t):
        key_char_code = ord(t[13])
        offset = (key_char_code - 48) % 70 % 14
        s = ''
        for i in range(13):
            s += chr(ord(t[i]) - offset)
        for i in range(14, len(t)):
            s += chr(ord(t[i]) - offset)
        return s

    def get_token(self):
        with self.lock:
            now = time.time()
            if self.token and now < self.expiry_time - 120:
                return self.token

            print("[INFO] Fetching new token from WHO GT endpoint...", flush=True)
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Referer': 'https://icd.who.int/browse/2024-01/mms/en'
            }
            res = requests.get('https://icd.who.int/browse/gt', headers=headers, timeout=15)
            if res.status_code == 200:
                t_enc = res.json()['res']
                self.token = self.decode_token(t_enc)
                self.expiry_time = now + 1600 # Valid for ~30 mins
                print(f"[SUCCESS] WHO token retrieved successfully (len={len(self.token)})", flush=True)
                return self.token
            else:
                raise Exception(f"Failed to fetch WHO token: {res.status_code} {res.text}")

token_mgr = WHOTokenManager()

def write_status(stage, scraped_count, queue_len, inserted_count, total_to_insert):
    status = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "stage": stage,
        "scraped_count": scraped_count,
        "queue_len": queue_len,
        "inserted_count": inserted_count,
        "total_to_insert": total_to_insert,
        "status": "RUNNING" if stage != "COMPLETE" else "COMPLETED"
    }
    with open(STATUS_FILE, "w", encoding="utf-8") as f:
        json.dump(status, f, indent=2)

def fetch_icd_entity(entity_url, parent_path=""):
    token = token_mgr.get_token()
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json',
        'API-Version': 'v2',
        'Accept-Language': 'en',
        'User-Agent': 'Mozilla/5.0'
    }

    try:
        r = requests.get(entity_url, headers=headers, timeout=15)
        if r.status_code == 401:
            token_mgr.token = None
            token = token_mgr.get_token()
            headers['Authorization'] = f'Bearer {token}'
            r = requests.get(entity_url, headers=headers, timeout=15)

        if r.status_code != 200:
            print(f"[WARN] Failed fetching {entity_url}: {r.status_code}", flush=True)
            return None

        data = r.json()
        data['_fetched_url'] = entity_url
        data['_parent_path'] = parent_path
        return data
    except Exception as e:
        print(f"[ERROR] Exception fetching {entity_url}: {e}", flush=True)
        return None

def extract_text_val(val):
    if not val:
        return ""
    if isinstance(val, dict):
        return val.get('@value', '')
    if isinstance(val, list):
        return "; ".join([extract_text_val(x) for x in val if x])
    return str(val)

def parse_entity_to_record(entity):
    code = entity.get('code', '')
    title = extract_text_val(entity.get('title', ''))
    definition = extract_text_val(entity.get('definition', ''))
    diagnostic_criteria = extract_text_val(entity.get('diagnosticCriteria', ''))
    
    inclusions = []
    for inc in entity.get('inclusion', []):
        t = extract_text_val(inc.get('label'))
        if t: inclusions.append(t)

    exclusions = []
    for exc in entity.get('exclusion', []):
        t = extract_text_val(exc.get('label'))
        if t: exclusions.append(t)

    index_terms = []
    for idx in entity.get('indexTerm', []):
        t = extract_text_val(idx.get('label'))
        if t: index_terms.append(t)

    parent_path = entity.get('_parent_path', '')
    uri = entity.get('@id', entity.get('_fetched_url', ''))

    # Format narrative text for embedding & database
    text_parts = []
    if code:
        text_parts.append(f"ICD-11 Code: {code}")
    text_parts.append(f"Title: {title}")
    if parent_path:
        text_parts.append(f"Classification Hierarchy: {parent_path}")
    if definition:
        text_parts.append(f"Definition: {definition}")
    if diagnostic_criteria:
        text_parts.append(f"Diagnostic Criteria: {diagnostic_criteria}")
    if inclusions:
        text_parts.append(f"Inclusions: {', '.join(inclusions)}")
    if exclusions:
        text_parts.append(f"Exclusions: {', '.join(exclusions)}")
    if index_terms:
        text_parts.append(f"Synonyms & Index Terms: {', '.join(index_terms[:10])}")

    full_text = "\n".join(text_parts)

    keywords = list(set([title] + inclusions + index_terms[:10]))
    if code:
        keywords.append(code)

    category = parent_path.split(' > ')[0] if parent_path else "WHO ICD-11 MMS"

    return {
        "uri": uri,
        "code": code,
        "title": title,
        "category": category,
        "parent_path": parent_path,
        "full_text": full_text,
        "keywords": keywords,
        "raw_json": entity
    }

def generate_embeddings(texts):
    if not JINA_API_KEY:
        raise Exception("JINA_API_KEY environment variable missing!")

    url = 'https://api.jina.ai/v1/embeddings'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {JINA_API_KEY}'
    }
    payload = {
        'model': 'jina-embeddings-v3',
        'task': 'retrieval.passage',
        'late_chunking': False,
        'dimensions': 768,
        'embedding_type': 'float',
        'input': texts
    }

    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    if resp.status_code == 200:
        res_data = resp.json()
        return [item['embedding'] for item in res_data['data']]
    else:
        raise Exception(f"Jina API error: {resp.status_code} {resp.text}")

def main():
    print("=" * 70, flush=True)
    print("WHO ICD-11 2024-01 MMS Live Scraper & Supabase Embedder", flush=True)
    print("=" * 70, flush=True)

    # Load existing scraped URIs from jsonl
    scraped_uris = set()
    scraped_records = []
    if os.path.exists(RAW_DATA_PATH):
        with open(RAW_DATA_PATH, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    try:
                        rec = json.loads(line)
                        scraped_uris.add(rec['uri'])
                        scraped_records.append(rec)
                    except:
                        pass
        print(f"[INFO] Loaded {len(scraped_records)} previously scraped records from {RAW_DATA_PATH}", flush=True)

    write_status("SCRAPING", len(scraped_records), 0, 0, 0)

    # Step 1: Scrape WHO ICD-11 tree starting from root
    root_url = "https://id.who.int/icd/release/11/2024-01/mms"
    root_entity = fetch_icd_entity(root_url, "")
    if not root_entity:
        print("[ERROR] Failed to fetch root entity!", flush=True)
        return

    child_urls = [(u, "WHO ICD-11 MMS") for u in root_entity.get('child', [])]
    print(f"[INFO] Found {len(child_urls)} main chapters.", flush=True)

    queue_urls = list(child_urls)
    visited_urls = set(scraped_uris)

    # Open jsonl for appending new scraped records
    jsonl_file = open(RAW_DATA_PATH, 'a', encoding='utf-8')

    max_workers = 6
    print(f"[INFO] Beginning tree traversal with {max_workers} threads...", flush=True)

    new_scraped_count = 0
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        while queue_urls:
            batch = queue_urls[:50]
            queue_urls = queue_urls[50:]

            futures = {}
            for url, parent_path in batch:
                if url in visited_urls:
                    continue
                visited_urls.add(url)
                futures[executor.submit(fetch_icd_entity, url, parent_path)] = (url, parent_path)

            for future in as_completed(futures):
                url, parent_path = futures[future]
                entity = future.result()
                if not entity:
                    continue

                rec = parse_entity_to_record(entity)
                jsonl_file.write(json.dumps(rec, ensure_ascii=False) + "\n")
                jsonl_file.flush()

                scraped_records.append(rec)
                new_scraped_count += 1

                title = rec['title']
                code_str = f"[{rec['code']}] " if rec['code'] else ""
                current_path = f"{parent_path} > {code_str}{title}" if parent_path else f"{code_str}{title}"

                # Add children to queue
                for child_u in entity.get('child', []):
                    if child_u not in visited_urls:
                        queue_urls.append((child_u, current_path))

                if new_scraped_count % 20 == 0:
                    print(f"[PROGRESS] Scraped {new_scraped_count} new entities (Total loaded: {len(scraped_records)}, Queue size: {len(queue_urls)})", flush=True)
                    write_status("SCRAPING", len(scraped_records), len(queue_urls), 0, 0)

    jsonl_file.close()
    print(f"[SUCCESS] Scraping completed. Total entities: {len(scraped_records)}", flush=True)

    # Step 2: Ingest & Embed into Supabase
    print("\n[INFO] Checking Supabase for already ingested ICD-11 records...", flush=True)
    db_res = supabase.table('ayurvedic_knowledge_embeddings').select('section').eq('source', 'WHO ICD-11 MMS 2024-01').execute()
    ingested_sections = set()
    if db_res.data:
        for r in db_res.data:
            if r.get('section'):
                ingested_sections.add(r['section'])
    print(f"[INFO] Found {len(ingested_sections)} entities already in Supabase.", flush=True)

    to_ingest = []
    for r in scraped_records:
        sec_title = f"Code: {r['code']} | Title: {r['title']}" if r.get('code') else r.get('title', '')
        if sec_title not in ingested_sections:
            to_ingest.append(r)

    print(f"[INFO] {len(to_ingest)} entities remaining to embed & insert into Supabase.", flush=True)

    batch_size = 16
    inserted_count = 0
    write_status("EMBEDDING", len(scraped_records), 0, 0, len(to_ingest))

    for i in range(0, len(to_ingest), batch_size):
        chunk = to_ingest[i:i + batch_size]
        texts = [c['full_text'] for c in chunk]

        try:
            embeddings = generate_embeddings(texts)
            rows_to_insert = []
            for idx_in_chunk, (rec, emb) in enumerate(zip(chunk, embeddings)):
                sec_str = f"Code: {rec['code']} | Title: {rec['title']}" if rec['code'] else rec['title']
                rows_to_insert.append({
                    "source": "WHO ICD-11 MMS 2024-01",
                    "book": "WHO ICD-11 MMS (2024-01 Release)",
                    "category": rec['category'][:255],
                    "page": i + idx_in_chunk + 1,  # Page is an INTEGER column in Postgres
                    "section": sec_str[:255],
                    "text": rec['full_text'],
                    "keywords": rec['keywords'][:15],
                    "embedding": emb
                })

            ins_res = supabase.table('ayurvedic_knowledge_embeddings').insert(rows_to_insert).execute()
            inserted_count += len(rows_to_insert)
            print(f"[EMBED & INSERT] Batch {i//batch_size + 1}/{(len(to_ingest) + batch_size - 1)//batch_size} inserted ({inserted_count}/{len(to_ingest)} records)", flush=True)
            write_status("EMBEDDING", len(scraped_records), 0, inserted_count, len(to_ingest))
        except Exception as e:
            print(f"[ERROR] Failed embedding/inserting batch {i}: {e}", flush=True)
            time.sleep(2)

    write_status("COMPLETE", len(scraped_records), 0, inserted_count, len(to_ingest))
    print(f"\n[COMPLETE] Scraping and Ingestion process finished successfully! Total inserted: {inserted_count}", flush=True)

if __name__ == '__main__':
    main()
