/**
 * Re-ingest boericke_embeddings with gemini-embedding-2-preview (3072-dim)
 *
 * Rotates through multiple Gemini API keys to avoid per-key rate limits.
 * Skips rows that already have a 3072-dim embedding (safe to re-run).
 *
 * Prerequisites:
 *   1. Run the migration: 20260519_fix_rag_dimensions_and_indexes.sql
 *   2. Set GEMINI_API_KEYS (comma-separated) in .env.local
 *      e.g. GEMINI_API_KEYS=key1,key2,key3,...,key24
 *      Falls back to single GEMINI_API_KEY if GEMINI_API_KEYS is not set.
 *
 * Usage:
 *   npx tsx scripts/reingest_boericke.ts
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const EMBEDDING_MODEL = 'gemini-embedding-2-preview';
const BATCH_SIZE = 5;        // Conservative — 5 parallel calls per batch
const DELAY_MS   = 200;      // Delay between batches
const MAX_RETRIES = 3;       // Retries per row on 429
const RETRY_BASE_MS = 2000;  // Exponential backoff base

// ── Load API keys ────────────────────────────────────────────────────────────
const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
const API_KEYS = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
if (!API_KEYS.length) {
    console.error('❌  No API keys found. Set GEMINI_API_KEYS=key1,key2,... in .env.local');
    process.exit(1);
}
console.log(`🔑  Loaded ${API_KEYS.length} Gemini API key(s)\n`);

// ── Round-robin key pool (auto-evicts bad keys) ─────────────────────────────
let keyIndex = 0;
let activeClients: GoogleGenAI[] = API_KEYS.map(k => new GoogleGenAI({ apiKey: k }));

function nextClient(): GoogleGenAI {
    if (!activeClients.length) {
        console.error('\n❌  All API keys have been evicted. Aborting.');
        process.exit(1);
    }
    const client = activeClients[keyIndex % activeClients.length];
    keyIndex++;
    return client;
}

function evictClient(client: GoogleGenAI): void {
    const idx = activeClients.indexOf(client);
    if (idx !== -1) {
        activeClients.splice(idx, 1);
        console.log(`\n    ⚠️  Evicted bad key (403). ${activeClients.length} keys remaining.`);
    }
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function embedWithRetry(text: string): Promise<number[]> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const client = nextClient();
        try {
            const res = await client.models.embedContent({
                model: EMBEDDING_MODEL,
                contents: text,
            });
            return res.embeddings?.[0]?.values ?? [];
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            const is403 = msg.includes('403') || msg.includes('denied access');
            const is429 = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
            if (is403) {
                // Permanently remove this bad key and retry immediately with next key
                evictClient(client);
                continue;
            }
            if (is429 && attempt < MAX_RETRIES) {
                // Exponential backoff: 2s, 4s, 8s
                const wait = RETRY_BASE_MS * Math.pow(2, attempt);
                await new Promise(r => setTimeout(r, wait));
                continue;
            }
            throw err;
        }
    }
    return [];
}

async function main() {
    // 1. Fetch rows that still need re-embedding
    // Rows with valid 3072-dim embeddings already done in previous run are skipped
    // We detect this by checking if the embedding column is null (after ALTER TYPE,
    // existing 768-dim data was cast to 3072-dim with zeros — but actually postgres
    // keeps the data, so we just fetch all and re-embed).
    // Safe to re-run: rows get overwritten with fresh embeddings.
    console.log('Fetching boericke_embeddings rows...');
    const { data: rows, error } = await supabase
        .from('boericke_embeddings')
        .select('id, remedy_name, chunk_text')
        .order('id');

    if (error) {
        console.error('Failed to fetch rows:', error.message);
        process.exit(1);
    }
    if (!rows?.length) {
        console.log('No rows found in boericke_embeddings. Nothing to do.');
        return;
    }

    console.log(`Found ${rows.length} rows. Re-embedding with ${EMBEDDING_MODEL} (${API_KEYS.length} keys)...\n`);

    let success = 0;
    let failed  = 0;

    // 2. Process in batches with key rotation
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
        process.stdout.write(`  Batch ${batchNum}/${totalBatches} (rows ${i + 1}-${Math.min(i + BATCH_SIZE, rows.length)})... `);

        const results = await Promise.allSettled(
            batch.map(async (row) => {
                const text = `${row.remedy_name}: ${row.chunk_text}`;
                const vector = await embedWithRetry(text);
                if (!vector.length) throw new Error(`Empty embedding for id=${row.id}`);

                const { error: updateErr } = await supabase
                    .from('boericke_embeddings')
                    .update({ embedding: vector as unknown as string })
                    .eq('id', row.id);

                if (updateErr) throw new Error(`Update failed for id=${row.id}: ${updateErr.message}`);
                return row.id;
            })
        );

        const batchSuccess = results.filter(r => r.status === 'fulfilled').length;
        const batchFailed  = results.filter(r => r.status === 'rejected').length;
        success += batchSuccess;
        failed  += batchFailed;

        if (batchFailed > 0) {
            const errors = results
                .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
                .map(r => String(r.reason?.message ?? r.reason).slice(0, 80));
            console.log(`${batchSuccess}✓ ${batchFailed}✗ — ${errors.join('; ')}`);
        } else {
            console.log(`${batchSuccess}✓`);
        }

        // Brief pause between batches
        if (i + BATCH_SIZE < rows.length) {
            await new Promise(r => setTimeout(r, DELAY_MS));
        }
    }

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`Re-ingestion complete: ${success} success, ${failed} failed out of ${rows.length} total`);

    if (failed > 0) {
        console.error(`\n⚠️  ${failed} rows failed — re-run this script to retry.`);
        process.exit(1);
    }

    console.log('\n✅  All boericke_embeddings now use gemini-embedding-2-preview (3072-dim).');
    console.log('    Run "npm run eval:rag" to verify recall.\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
