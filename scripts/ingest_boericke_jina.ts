/**
 * Healio.AI — Boericke Ingestion with Jina Key Pool
 * ===================================================
 * Parses scripts/boericke.txt (679 remedy chunks) and ingests them into
 * boericke_embeddings using the Jina AI key pool (768-dim).
 *
 * This replaces the old Gemini-based ingest_boericke.ts.
 * Safe to re-run: existing rows are detected by remedy_name + chunk_text fingerprint.
 *
 * Usage:
 *   npx tsx scripts/ingest_boericke_jina.ts
 *   npx tsx scripts/ingest_boericke_jina.ts --force   (re-embed all)
 */

import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

// ── Constants ─────────────────────────────────────────────────────────────────
const JINA_MODEL  = 'jina-embeddings-v3';
const JINA_DIMS   = 768;
const BATCH_SIZE  = 8;
const DELAY_MS    = 300;
const MAX_RETRIES = 4;
const RETRY_BASE  = 2000;
const FORCE       = process.argv.includes('--force');

// ── Jina Key Pool ─────────────────────────────────────────────────────────────
const rawKeys = process.env.JINA_API_KEYS ?? process.env.JINA_API_KEY ?? '';
let jinaKeys  = rawKeys.split(',').map(k => k.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);

if (!jinaKeys.length) {
    console.error('❌  No Jina API keys. Set JINA_API_KEYS in .env.local');
    process.exit(1);
}

console.log(`\n🔑  Jina key pool: ${jinaKeys.length} key(s)`);
jinaKeys.forEach((k, i) => console.log(`     [${i + 1}] ...${k.slice(-12)}`));

let jinaIdx = 0;
function nextKey(): string {
    const k = jinaKeys[jinaIdx % jinaKeys.length]; jinaIdx++; return k;
}
function evict(key: string) {
    jinaKeys = jinaKeys.filter(k => k !== key);
    console.warn(`\n    ⚠️  Evicted key ...${key.slice(-8)}. ${jinaKeys.length} remaining.`);
    if (!jinaKeys.length) { console.error('❌  All keys evicted.'); process.exit(1); }
}

async function embed(text: string): Promise<number[]> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const apiKey = nextKey();
        try {
            const res = await fetch('https://api.jina.ai/v1/embeddings', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body:    JSON.stringify({ model: JINA_MODEL, input: [text], dimensions: JINA_DIMS }),
            });
            if (res.status === 403) { evict(apiKey); continue; }
            if (res.status === 429) {
                const wait = RETRY_BASE * Math.pow(2, attempt);
                console.warn(`\n    ⚡ Rate limited. Backing off ${wait}ms.`);
                await new Promise(r => setTimeout(r, wait));
                continue;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            const data = await res.json();
            return data.data[0].embedding as number[];
        } catch (e) {
            if (attempt === MAX_RETRIES) throw e;
            await new Promise(r => setTimeout(r, RETRY_BASE));
        }
    }
    return [];
}

// ── Supabase ──────────────────────────────────────────────────────────────────
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Boericke Parser ───────────────────────────────────────────────────────────
function parseBoerickeChunks(text: string): { name: string; text: string }[] {
    const chunks: { name: string; text: string }[] = [];
    const lines = text.split('\n');
    let currentRemedy = 'INTRODUCTION';
    let currentChunk  = '';

    for (const line of lines) {
        const trimmed = line.trim();
        // Remedy name heuristic: short, all-caps, no digits
        if (
            trimmed.length > 2 &&
            trimmed.length < 60 &&
            trimmed === trimmed.toUpperCase() &&
            !/[0-9]/.test(trimmed)
        ) {
            if (currentChunk.trim().length > 150) {
                chunks.push({ name: currentRemedy, text: currentChunk.trim() });
            }
            currentRemedy = trimmed;
            currentChunk  = '';
        } else {
            currentChunk += line + ' ';
        }
    }
    // Last chunk
    if (currentChunk.trim().length > 150) {
        chunks.push({ name: currentRemedy, text: currentChunk.trim() });
    }
    return chunks;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n' + '═'.repeat(70));
    console.log('📖  Boericke Materia Medica → boericke_embeddings (Jina 768-dim)');
    console.log('═'.repeat(70));

    // Find the boericke text
    const candidates = [
        path.resolve(__dirname, 'boericke.txt'),
        path.resolve(__dirname, '../data/boericke/boericke_full.txt'),
    ];
    const textFile = candidates.find(f => fs.existsSync(f));
    if (!textFile) {
        console.error('❌  boericke.txt not found. Expected at scripts/boericke.txt');
        process.exit(1);
    }
    console.log(`  Source: ${textFile}`);

    const rawText = fs.readFileSync(textFile, 'utf-8');
    const chunks  = parseBoerickeChunks(rawText);
    console.log(`  Parsed ${chunks.length} remedy chunks\n`);

    if (!chunks.length) {
        console.error('❌  No chunks parsed. Check file encoding.');
        process.exit(1);
    }

    // Load existing fingerprints to skip duplicates
    const existingKeys = new Set<string>();
    if (!FORCE) {
        let offset = 0;
        while (true) {
            const { data } = await supabase
                .from('boericke_embeddings')
                .select('remedy_name, chunk_text')
                .range(offset, offset + 999);
            if (!data?.length) break;
            data.forEach(d => existingKeys.add(`${d.remedy_name}|||${d.chunk_text.slice(0, 80)}`));
            offset += 1000;
        }
        console.log(`  ⚡ Loaded ${existingKeys.size} existing rows for dedup\n`);
    }

    const toProcess = FORCE
        ? chunks
        : chunks.filter(c => !existingKeys.has(`${c.name}|||${c.text.slice(0, 80)}`));

    console.log(`  Total: ${chunks.length} | Need ingesting: ${toProcess.length}\n`);
    if (!toProcess.length) { console.log('  ✅  All rows already ingested.'); return; }

    let success = 0, failed = 0;

    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
        const batch = toProcess.slice(i, i + BATCH_SIZE);

        await Promise.allSettled(batch.map(async (chunk) => {
            try {
                const text   = `${chunk.name}: ${chunk.text}`;
                const vector = await embed(text);
                if (!vector.length) throw new Error('Empty embedding');

                const { error } = await supabase.from('boericke_embeddings').insert({
                    remedy_name: chunk.name,
                    chunk_text:  chunk.text,
                    embedding:   vector as unknown as string,
                });

                if (error) throw new Error(error.message);
                success++;
            } catch (e: unknown) {
                failed++;
                console.error(`\n  ❌ ${chunk.name}: ${e instanceof Error ? e.message : String(e)}`);
            }
        }));

        const done = success + failed;
        const pct  = ((done / toProcess.length) * 100).toFixed(1);
        process.stdout.write(`\r  Progress: ${done}/${toProcess.length} (${pct}%) | ✓${success} ✗${failed}   `);

        if (i + BATCH_SIZE < toProcess.length) {
            await new Promise(r => setTimeout(r, DELAY_MS));
        }
    }

    console.log(`\n\n✅  Boericke ingestion complete — ${success} inserted, ${failed} failed`);
    if (failed > 0) {
        console.warn('  ⚠️  Re-run to retry failed rows.');
        process.exit(1);
    }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
