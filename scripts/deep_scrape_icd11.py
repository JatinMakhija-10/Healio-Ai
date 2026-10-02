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

            print("[INFO] Fetching fresh token from WHO GT endpoint...", flush=True)
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Referer': 'https://icd.who.int/browse/2024-01/mms/en'
            }
            res = requests.get('https://icd.who.int/browse/gt', headers=headers, timeout=15)
            if res.status_code == 200:
                t_enc = res.json()['res']
                self.token = self.decode_token(t_enc)
                self.expiry_time = now + 1600
                print(f"[SUCCESS] WHO token active (len={len(self.token)})", flush=True)
                return self.token
            else:
                raise Exception(f"Failed to fetch WHO token: {res.status_code} {res.text}")

token_mgr = WHOTokenManager()

def write_status(stage, scraped_count, queue_len, inserted_count):
    status = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "stage": stage,
        "scraped_count": scraped_count,
        "queue_len": queue_len,
        "inserted_count": inserted_count,
        "status": "RUNNING"
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
            return None

        data = r.json()
        data['_fetched_url'] = entity_url
        data['_parent_path'] = parent_path
        return data
    except Exception as e:
        return None

def extract_text_val(val):
    if not val: return ""
    if isinstance(val, dict): return val.get('@value', '')
    if isinstance(val, list): return "; ".join([extract_text_val(x) for x in val if x])
    return str(val)

def parse_entity_to_record(entity):
    code = entity.get('code', '')
    title = extract_text_val(entity.get('title', ''))
    definition = extract_text_val(entity.get('definition', ''))
    diagnostic_criteria = extract_text_val(entity.get('diagnosticCriteria', ''))
    
    inclusions = [extract_text_val(inc.get('label')) for inc in entity.get('inclusion', []) if extract_text_val(inc.get('label'))]
    exclusions = [extract_text_val(exc.get('label')) for exc in entity.get('exclusion', []) if extract_text_val(exc.get('label'))]
    index_terms = [extract_text_val(idx.get('label')) for idx in entity.get('indexTerm', []) if extract_text_val(idx.get('label'))]

    parent_path = entity.get('_parent_path', '')
    uri = entity.get('@id', entity.get('_fetched_url', ''))

    text_parts = []
    if code: text_parts.append(f"ICD-11 Code: {code}")
    text_parts.append(f"Title: {title}")
    if parent_path: text_parts.append(f"Classification Hierarchy: {parent_path}")
    if definition: text_parts.append(f"Definition: {definition}")
    if diagnostic_criteria: text_parts.append(f"Diagnostic Criteria: {diagnostic_criteria}")
    if inclusions: text_parts.append(f"Inclusions: {', '.join(inclusions)}")
    if exclusions: text_parts.append(f"Exclusions: {', '.join(exclusions)}")
    if index_terms: text_parts.append(f"Synonyms: {', '.join(index_terms[:10])}")

    full_text = "\n".join(text_parts)
    keywords = list(set([title] + inclusions + index_terms[:10]))
    if code: keywords.append(code)

    category = parent_path.split(' > ')[0] if parent_path else "WHO ICD-11 MMS"

    return {
        "uri": uri,
        "code": code,
        "title": title,
        "category": category,
        "parent_path": parent_path,
        "full_text": full_text,
        "keywords": keywords
    }

def generate_embeddings(texts):
    url = 'https://api.jina.ai/v1/embeddings'
    headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {JINA_API_KEY}'}
    payload = {'model': 'jina-embeddings-v3', 'task': 'retrieval.passage', 'dimensions': 768, 'input': texts}
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    if resp.status_code == 200:
        return [item['embedding'] for item in resp.json()['data']]
    else:
        raise Exception(f"Jina API error: {resp.status_code}")

def main():
    print("=" * 70, flush=True)
    print("WHO ICD-11 MMS Deep Ontology Tree Crawler & Embedder", flush=True)
    print("=" * 70, flush=True)

    # 1. Load existing database sections to fast-skip
    db_res = supabase.table('ayurvedic_knowledge_embeddings').select('section').eq('source', 'WHO ICD-11 MMS 2024-01').execute()
    existing_db_sections = set(r['section'] for r in db_res.data) if db_res.data else set()
    print(f"[INFO] Found {len(existing_db_sections)} ICD-11 entities already in Supabase.", flush=True)

    # 2. Load jsonl cached records
    scraped_uris = set()
    if os.path.exists(RAW_DATA_PATH):
        with open(RAW_DATA_PATH, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    try:
                        rec = json.loads(line)
                        scraped_uris.add(rec['uri'])
                    except: pass
    print(f"[INFO] Loaded {len(scraped_uris)} cached entity URIs from JSONL.", flush=True)

    # Root chapters
    root_url = "https://id.who.int/icd/release/11/2024-01/mms"
    root_entity = fetch_icd_entity(root_url, "")
    if not root_entity:
        print("[ERROR] Could not fetch root entity!", flush=True)
        return

    work_queue = [(u, "WHO ICD-11 MMS") for u in root_entity.get('child', [])]
    visited_urls = set(scraped_uris)

    jsonl_file = open(RAW_DATA_PATH, 'a', encoding='utf-8')
    total_inserted = len(existing_db_sections)
    unembedded_batch = []

    print(f"[INFO] Starting deep traversal with 8 worker threads...", flush=True)

    with ThreadPoolExecutor(max_workers=8) as executor:
        while work_queue:
            current_batch = work_queue[:40]
            work_queue = work_queue[40:]

            futures = {}
            for url, parent_path in current_batch:
                if url in visited_urls: continue
                visited_urls.add(url)
                futures[executor.submit(fetch_icd_entity, url, parent_path)] = (url, parent_path)

            for future in as_completed(futures):
                url, parent_path = futures[future]
                entity = future.result()
                if not entity: continue

                rec = parse_entity_to_record(entity)
                jsonl_file.write(json.dumps(rec, ensure_ascii=False) + "\n")
                jsonl_file.flush()

                title = rec['title']
                code_str = f"[{rec['code']}] " if rec['code'] else ""
                current_path = f"{parent_path} > {code_str}{title}" if parent_path else f"{code_str}{title}"
                sec_str = f"Code: {rec['code']} | Title: {rec['title']}" if rec['code'] else rec['title']

                # Queue child nodes for deeper traversal
                for child_u in entity.get('child', []):
                    if child_u not in visited_urls:
                        work_queue.append((child_u, current_path))

                if sec_str not in existing_db_sections:
                    unembedded_batch.append((rec, sec_str))

                # Batch embed & insert into Supabase every 16 items
                if len(unembedded_batch) >= 16:
                    chunk_recs = [r[0] for r in unembedded_batch]
                    texts = [r['full_text'] for r in chunk_recs]
                    try:
                        embs = generate_embeddings(texts)
                        rows = []
                        for idx_i, (r_obj, e_vec) in enumerate(zip(chunk_recs, embs)):
                            rows.append({
                                "source": "WHO ICD-11 MMS 2024-01",
                                "book": "WHO ICD-11 MMS (2024-01 Release)",
                                "category": r_obj['category'][:255],
                                "page": total_inserted + idx_i + 1,
                                "section": unembedded_batch[idx_i][1][:255],
                                "text": r_obj['full_text'],
                                "keywords": r_obj['keywords'][:15],
                                "embedding": e_vec
                            })
                        supabase.table('ayurvedic_knowledge_embeddings').insert(rows).execute()
                        total_inserted += len(rows)
                        for r_item in unembedded_batch:
                            existing_db_sections.add(r_item[1])
                        print(f"[EMBEDDED & INGESTED] +{len(rows)} vectors into Supabase (Total ICD-11 in DB: {total_inserted}, Queue length: {len(work_queue)})", flush=True)
                        write_status("CRAWLING_AND_EMBEDDING", len(visited_urls), len(work_queue), total_inserted)
                    except Exception as ex:
                        print(f"[ERROR] Batch insertion failed: {ex}", flush=True)
                    unembedded_batch = []

    jsonl_file.close()
    print(f"\n[COMPLETE] Deep ICD-11 Crawling and Ingestion completed! Total ICD-11 vectors in DB: {total_inserted}", flush=True)

if __name__ == '__main__':
    main()
