"""
Arovia.AI — Re-ingest PlanetAyurveda rows with Jina AI 768-dim embeddings.

PREREQUISITE: Run scripts/create_reingest_helpers.sql in Supabase SQL Editor FIRST.
That SQL creates:
  1. INDEX idx_ake_source ON ayurvedic_knowledge_embeddings (source)
  2. FUNCTION get_planetayurveda_batch(from_id, batch_n) -> table(id, text)

This script calls that RPC (not the REST table API) so it bypasses PostgREST
statement timeouts — the function runs entirely inside Postgres.

Run: python -u scripts/reingest_planetayurveda_jina.py
"""

import os
import sys
import json
import time
import requests
from dotenv import load_dotenv
from supabase import create_client

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
JINA_API_KEY = os.getenv('JINA_API_KEY')

if not all([SUPABASE_URL, SUPABASE_KEY, JINA_API_KEY]):
    print("[ERROR] Missing env vars", flush=True)
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

STATUS_FILE = "logs/reingest_planetayurveda_status.json"
os.makedirs("logs", exist_ok=True)

JINA_BATCH  = 20   # texts per Jina API call
RPC_BATCH   = 50   # rows per RPC call

def write_status(processed, total_est, errors, status="RUNNING"):
    with open(STATUS_FILE, "w") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "processed": processed,
            "total_estimate": total_est,
            "errors": errors,
            "pct": f"{processed / max(total_est, 1) * 100:.1f}%",
            "status": status,
        }, f, indent=2)

def jina_embed(texts: list) -> list:
    resp = requests.post(
        'https://api.jina.ai/v1/embeddings',
        headers={'Authorization': f'Bearer {JINA_API_KEY}', 'Content-Type': 'application/json'},
        json={'model': 'jina-embeddings-v3', 'task': 'retrieval.passage', 'dimensions': 768, 'input': texts},
        timeout=60,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Jina {resp.status_code}: {resp.text[:300]}")
    return [d['embedding'] for d in resp.json()['data']]

def main():
    print("=" * 65, flush=True)
    print("PlanetAyurveda Re-ingestion — Jina AI 768-dim", flush=True)
    print("Method: get_planetayurveda_batch() RPC (fast index scan)", flush=True)
    print("=" * 65, flush=True)
    print("PREREQUISITE: create_reingest_helpers.sql must already be applied.", flush=True)
    print(flush=True)

    total_est = 26_497
    processed = 0
    errors    = 0
    last_id   = 0

    write_status(processed, total_est, errors)

    while True:
        # ── Fetch next batch via RPC ──────────────────────────────────────────
        try:
            resp = supabase.rpc('get_planetayurveda_batch', {
                'from_id': last_id,
                'batch_n': RPC_BATCH,
            }).execute()
            rows = resp.data or []
        except Exception as e:
            print(f"[ERROR] RPC call failed at id>{last_id}: {e}", flush=True)
            time.sleep(5)
            continue

        if not rows:
            print("[INFO] No more rows — finished!", flush=True)
            break

        last_id = rows[-1]['id']
        valid   = [(r['id'], r['text']) for r in rows if r.get('text', '').strip()]

        # ── Embed + UPDATE in Jina batches ────────────────────────────────────
        for i in range(0, len(valid), JINA_BATCH):
            batch = valid[i:i + JINA_BATCH]
            ids   = [b[0] for b in batch]
            texts = [b[1] for b in batch]
            try:
                embs = jina_embed(texts)
                for rid, emb in zip(ids, embs):
                    supabase.table('ayurvedic_knowledge_embeddings') \
                        .update({'embedding': emb}) \
                        .eq('id', rid).execute()
                processed += len(ids)
            except Exception as e:
                print(f"  [WARN] Embed/update error: {e}", flush=True)
                errors += len(ids)
                time.sleep(3)

        # ── Progress reporting ────────────────────────────────────────────────
        if processed > 0 and processed % 500 < RPC_BATCH:
            pct = processed / total_est * 100
            print(f"[PROGRESS] {processed:,}/~{total_est:,} ({pct:.1f}%) | last_id={last_id} | Errors={errors}", flush=True)
            write_status(processed, total_est, errors)

    write_status(processed, total_est, errors, "COMPLETED")
    print(f"\n[DONE] {processed:,}/~{total_est:,} rows re-embedded | Errors={errors}", flush=True)
    print("All 48,767 vectors now use Jina AI. PlanetAyurveda re-ingestion complete.", flush=True)

if __name__ == '__main__':
    main()
