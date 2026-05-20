/**
 * Re-ingest ayurvedic_knowledge_embeddings with 768-dim embeddings
 * (gemini-embedding-2-preview, output_dimensionality=768)
 *
 * Prerequisites:
 *   1. Run migration: 20260519_ayurvedic_768dim.sql in Supabase SQL Editor
 *   2. Set GEMINI_API_KEYS=key1,key2,...,key24 in .env.local
 *
 * Usage: npx tsx scripts/reingest_ayurvedic.ts
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const EMBEDDING_MODEL  = 'gemini-embedding-2-preview';
const OUTPUT_DIM       = 768;
const BATCH_SIZE       = 5;
const DELAY_MS         = 150;
const MAX_RETRIES      = 4;
const RETRY_BASE_MS    = 2000;
const PAGE_SIZE        = 500;   // fetch rows in pages to avoid huge payloads

const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
const API_KEYS = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
if (!API_KEYS.length) {
    console.error('❌  No API keys. Set GEMINI_API_KEYS=key1,key2,... in .env.local');
    process.exit(1);
}
console.log(`🔑  Loaded ${API_KEYS.length} Gemini API key(s)\n`);

let keyIndex = 0;
let activeClients: GoogleGenAI[] = API_KEYS.map(k => new GoogleGenAI({ apiKey: k }));

function nextClient(): GoogleGenAI {
    if (!activeClients.length) { console.error('\n❌  All keys evicted.'); process.exit(1); }
    const c = activeClients[keyIndex % activeClients.length];
    keyIndex++;
    return c;
}
function evictClient(c: GoogleGenAI) {
    const i = activeClients.indexOf(c);
    if (i !== -1) {
        activeClients.splice(i, 1);
        console.log(`\n    ⚠️  Evicted bad key. ${activeClients.length} remaining.`);
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
                config: { outputDimensionality: OUTPUT_DIM },
            });
            return res.embeddings?.[0]?.values ?? [];
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes('403') || msg.includes('denied access')) {
                evictClient(client); continue;
            }
            if ((msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) && attempt < MAX_RETRIES) {
                await new Promise(r => setTimeout(r, RETRY_BASE_MS * Math.pow(2, attempt)));
                continue;
            }
            throw err;
        }
    }
    return [];
}

async function main() {
    console.log('Counting remaining rows (embedding IS NULL)...');
    const { count: remaining } = await supabase
        .from('ayurvedic_knowledge_embeddings')
        .select('*', { count: 'exact', head: true })
        .is('embedding', null);

    const { count: totalCount } = await supabase
        .from('ayurvedic_knowledge_embeddings')
        .select('*', { count: 'exact', head: true });

    const total = remaining ?? 0;
    console.log(`Total rows: ${totalCount ?? 0} | Already done: ${(totalCount ?? 0) - total} | Remaining: ${total}`);
    if (total === 0) {
        console.log('\n✅  All rows already have embeddings. Nothing to do.');
        return;
    }
    console.log(`\nRe-embedding ${total} remaining rows with ${EMBEDDING_MODEL} (dim=${OUTPUT_DIM})...\n`);

    let success = 0;
    let failed  = 0;
    let page    = 0;

    while (true) {
        const from = page * PAGE_SIZE;
        const to   = from + PAGE_SIZE - 1;
        const { data: rows, error } = await supabase
            .from('ayurvedic_knowledge_embeddings')
            .select('id, book, section, text')
            .is('embedding', null)   // only unprocessed rows
            .range(from, to)
            .order('id');

        if (error) { console.error('Fetch error:', error.message); process.exit(1); }
        if (!rows?.length) break;

        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch     = rows.slice(i, i + BATCH_SIZE);
            const absStart  = from + i + 1;
            const absEnd    = Math.min(from + i + BATCH_SIZE, from + rows.length);
            const batchNum  = Math.floor((from + i) / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(total / BATCH_SIZE);
            // Note: success+failed counts progress within this run (not total DB rows)
            process.stdout.write(`  Batch ${batchNum}/${totalBatches} (rows ${absStart}-${absEnd})... `);

            const results = await Promise.allSettled(
                batch.map(async (row) => {
                    const text  = `${row.book ?? ''} ${row.section ?? ''}: ${row.text ?? ''}`.trim();
                    const vector = await embedWithRetry(text);
                    if (!vector.length) throw new Error(`Empty embedding id=${row.id}`);

                    const { error: upErr } = await supabase
                        .from('ayurvedic_knowledge_embeddings')
                        .update({ embedding: vector as unknown as string })
                        .eq('id', row.id);

                    if (upErr) throw new Error(`Update failed id=${row.id}: ${upErr.message}`);
                    return row.id;
                })
            );

            const bOk  = results.filter(r => r.status === 'fulfilled').length;
            const bErr = results.filter(r => r.status === 'rejected').length;
            success += bOk;
            failed  += bErr;

            if (bErr > 0) {
                const errs = results
                    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
                    .map(r => String(r.reason?.message ?? r.reason).slice(0, 60));
                console.log(`${bOk}✓ ${bErr}✗ — ${errs.join('; ')}`);
            } else {
                console.log(`${bOk}✓`);
            }

            if (i + BATCH_SIZE < rows.length) {
                await new Promise(r => setTimeout(r, DELAY_MS));
            }
        }

        page++;
        if (rows.length < PAGE_SIZE) break;
    }

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`Re-ingestion complete: ${success} success, ${failed} failed out of ${total} total`);

    if (failed > 0) {
        console.error(`\n⚠️  ${failed} rows failed — re-run to retry.`);
        process.exit(1);
    }

    console.log('\n✅  Done. Now run in Supabase SQL Editor:');
    console.log('    CREATE INDEX idx_ayurvedic_knowledge_hnsw');
    console.log('        ON ayurvedic_knowledge_embeddings');
    console.log('        USING hnsw (embedding vector_cosine_ops)');
    console.log("        WITH (m = 16, ef_construction = 64);\n");
    console.log('    Then run: npm run eval:rag\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
