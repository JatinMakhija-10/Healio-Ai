/**
 * Healio.AI — Master Brain Re-ingestion Script
 * =============================================
 * Re-ingests EVERY data source into Supabase using the Jina AI key pool.
 *
 * Sources covered (all → 768-dim Jina v3 embeddings):
 *
 *   TABLE: boericke_embeddings
 *     • data/boericke/boericke_full.txt
 *
 *   TABLE: home_remedy_embeddings
 *     • data/home_remedies/nuskhe.json
 *
 *   TABLE: ayurvedic_knowledge_embeddings
 *     • data/ayurveda/processed/*.jsonl  (14 files: PA diseases, herbs, formulations,
 *                                         remedies, Indian Pharmacopoeia, Materia Medica,
 *                                         Astanga Hridaya, Panchagavya, Vaidya Yoga Ratnavali,
 *                                         Indian Medicinal Plants)
 *     • data/icd11/icd11_mms_2024_01.jsonl  (WHO ICD-11 MMS 2024-01)
 *     • data/new_sources/processed/*.jsonl  (classical medical texts)
 *
 * Jina key pool: reads JINA_API_KEYS (comma-separated) from .env.local.
 * Keys rotate round-robin. 429 → exponential backoff. 403 → evict key.
 * ALL operations are idempotent: existing rows are detected and skipped.
 *
 * Usage:
 *   npx tsx scripts/brain_reingest_all.ts
 *   npx tsx scripts/brain_reingest_all.ts --source boericke
 *   npx tsx scripts/brain_reingest_all.ts --source ayurvedic
 *   npx tsx scripts/brain_reingest_all.ts --source home_remedies
 *   npx tsx scripts/brain_reingest_all.ts --source icd11
 *
 * Options:
 *   --source <name>   Run only one source group (boericke|ayurvedic|home_remedies|icd11)
 *   --force           Re-embed rows that already have embeddings (default: skip)
 *   --batch-size <n>  Parallel batch size (default: 8)
 *   --delay <ms>      Delay between batches in ms (default: 300)
 */

import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── Constants ─────────────────────────────────────────────────────────────────

const JINA_MODEL   = 'jina-embeddings-v3';
const JINA_DIMS    = 768;
const BATCH_SIZE   = parseInt(process.env.BRAIN_BATCH_SIZE ?? '8', 10);
const DELAY_MS     = parseInt(process.env.BRAIN_DELAY_MS ?? '300', 10);
const MAX_RETRIES  = 4;
const RETRY_BASE   = 2000;

// ── Jina Key Pool ─────────────────────────────────────────────────────────────

const rawKeys = process.env.JINA_API_KEYS ?? process.env.JINA_API_KEY ?? '';
let jinaKeys  = rawKeys.split(',').map(k => k.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);

if (!jinaKeys.length) {
    console.error('❌  No Jina API keys found. Set JINA_API_KEYS=key1,key2,... in .env.local');
    process.exit(1);
}

console.log(`\n🔑  Jina key pool: ${jinaKeys.length} key(s) loaded`);
jinaKeys.forEach((k, i) => console.log(`     [${i + 1}] ...${k.slice(-12)}`));
console.log('');

let jinaKeyIndex = 0;

function nextJinaKey(): string {
    if (!jinaKeys.length) { console.error('\n❌  All Jina keys evicted. Aborting.'); process.exit(1); }
    const key = jinaKeys[jinaKeyIndex % jinaKeys.length];
    jinaKeyIndex++;
    return key;
}

function evictJinaKey(key: string): void {
    jinaKeys = jinaKeys.filter(k => k !== key);
    console.warn(`\n    ⚠️  Evicted Jina key ...${key.slice(-8)}. ${jinaKeys.length} keys remaining.`);
    if (!jinaKeys.length) { console.error('\n❌  All Jina keys evicted. Aborting.'); process.exit(1); }
}

// ── Supabase ──────────────────────────────────────────────────────────────────

const supabase: SupabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Jina Embed with Retry ─────────────────────────────────────────────────────

async function embed(text: string): Promise<number[]> {
    if (!text.trim()) return [];
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const apiKey = nextJinaKey();
        try {
            const res = await fetch('https://api.jina.ai/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({ model: JINA_MODEL, input: [text], dimensions: JINA_DIMS }),
            });

            if (res.status === 403) { evictJinaKey(apiKey); continue; }
            if (res.status === 429) {
                const wait = RETRY_BASE * Math.pow(2, attempt);
                console.warn(`\n    ⚡ Rate limited (...${apiKey.slice(-8)}). Backing off ${wait}ms.`);
                await sleep(wait);
                continue;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

            const data = await res.json();
            return data.data[0].embedding as number[];
        } catch (e: unknown) {
            if (attempt === MAX_RETRIES) throw e;
            await sleep(RETRY_BASE);
        }
    }
    return [];
}

function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

// ── Progress Logger ───────────────────────────────────────────────────────────

interface Progress { success: number; skipped: number; failed: number; total: number; }

function logProgress(p: Progress, label: string) {
    const pct = p.total > 0 ? ((p.success + p.skipped) / p.total * 100).toFixed(1) : '0.0';
    process.stdout.write(`\r  ${label} — ${p.success + p.skipped}/${p.total} (${pct}%) | ✓${p.success} ⏭${p.skipped} ✗${p.failed}   `);
}

// ── ═══════════════════════════════════════════════════════════════════════════
//    SOURCE 1: BOERICKE MATERIA MEDICA → boericke_embeddings
// ── ═══════════════════════════════════════════════════════════════════════════

function parseBoerickeChunks(text: string): { name: string; text: string }[] {
    const chunks: { name: string; text: string }[] = [];
    const lines = text.split('\n');
    let currentRemedy = 'INTRODUCTION';
    let currentChunk  = '';

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 2 && trimmed.length < 60 && trimmed === trimmed.toUpperCase() && !/[0-9]/.test(trimmed)) {
            if (currentChunk.trim().length > 150) chunks.push({ name: currentRemedy, text: currentChunk.trim() });
            currentRemedy = trimmed;
            currentChunk  = '';
        } else {
            currentChunk += line + ' ';
        }
    }
    if (currentChunk.trim().length > 150) chunks.push({ name: currentRemedy, text: currentChunk.trim() });
    return chunks;
}

async function ingestBoericke(force = false) {
    console.log('\n\n' + '═'.repeat(70));
    console.log('📖  SOURCE 1: Boericke Materia Medica → boericke_embeddings');
    console.log('═'.repeat(70));

    // Find source text
    const candidates = [
        path.resolve(__dirname, 'boericke.txt'),
        path.resolve(__dirname, '../data/boericke/boericke_full.txt'),
    ];
    const textFile = candidates.find(f => fs.existsSync(f));
    if (!textFile) {
        console.error('  ❌ boericke.txt not found. Expected at scripts/boericke.txt');
        return;
    }

    const rawText = fs.readFileSync(textFile, 'utf-8');
    const chunks  = parseBoerickeChunks(rawText);
    console.log(`  Parsed ${chunks.length} remedy chunks from ${path.basename(textFile)}`);

    // Load existing fingerprints for dedup
    const existingKeys = new Set<string>();
    if (!force) {
        let offset = 0;
        while (true) {
            const { data } = await supabase.from('boericke_embeddings').select('remedy_name, chunk_text').range(offset, offset + 999);
            if (!data?.length) break;
            data.forEach(d => existingKeys.add(`${d.remedy_name}|||${d.chunk_text.slice(0, 80)}`));
            offset += 1000;
        }
        console.log(`  ⚡ Loaded ${existingKeys.size} existing rows for dedup`);
    }

    const toProcess = force
        ? chunks
        : chunks.filter(c => !existingKeys.has(`${c.name}|||${c.text.slice(0, 80)}`));

    console.log(`  Total: ${chunks.length} | Need ingesting: ${toProcess.length}`);
    if (!toProcess.length) { console.log('  ✅  All rows already ingested.'); return; }

    const prog: Progress = { success: 0, skipped: 0, failed: 0, total: toProcess.length };

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
                prog.success++;
            } catch (e: unknown) {
                prog.failed++;
                console.error(`\n  ❌ ${chunk.name}: ${e instanceof Error ? e.message : String(e)}`);
            }
        }));
        logProgress(prog, 'Boericke');
        if (i + BATCH_SIZE < toProcess.length) await sleep(DELAY_MS);
    }

    console.log(`\n  ✅  Boericke done — ${prog.success} inserted, ${prog.failed} failed`);
}

// ── ═══════════════════════════════════════════════════════════════════════════
//    SOURCE 2: HOME REMEDIES → home_remedy_embeddings
// ── ═══════════════════════════════════════════════════════════════════════════

async function ingestHomeRemedies(force = false) {
    console.log('\n\n' + '═'.repeat(70));
    console.log('🌿  SOURCE 2: Home Remedies (nuskhe.json) → home_remedy_embeddings');
    console.log('═'.repeat(70));

    const dataPath = path.resolve(__dirname, '../data/home_remedies/nuskhe.json');
    if (!fs.existsSync(dataPath)) {
        console.error(`  ❌ Not found: ${dataPath}`);
        return;
    }

    type Remedy = { name: string; name_hindi?: string; ingredients?: string[]; method: string; method_hindi?: string; frequency?: string; indication?: string; contraindications?: string[]; age_safe?: string; };
    type NuskheEntry = { id: string; ailment: string; ailment_hindi: string; symptoms_keywords: string[]; remedies: Remedy[]; };

    const rawData: NuskheEntry[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Build all rows
    const allRows: { remedy_name: string; remedy_name_hindi: string | null; ailment: string; ailment_hindi: string; symptoms_keywords: string[]; chunk_text: string; }[] = [];
    for (const entry of rawData) {
        for (const remedy of entry.remedies) {
            const chunk_text = [
                `Ailment: ${entry.ailment} / ${entry.ailment_hindi}`,
                `Remedy: ${remedy.name}${remedy.name_hindi ? ` (${remedy.name_hindi})` : ''}`,
                `Ingredients: ${(remedy.ingredients ?? []).join(', ')}`,
                `Method: ${remedy.method}`,
                remedy.method_hindi ? `Hindi: ${remedy.method_hindi}` : '',
                `Frequency: ${remedy.frequency ?? 'As needed'}`,
                `Indication: ${remedy.indication ?? ''}`,
                `Contraindications: ${(remedy.contraindications ?? []).join(', ') || 'None'}`,
                `Age safe: ${remedy.age_safe ?? 'Adults'}`,
            ].filter(Boolean).join('\n');

            allRows.push({
                remedy_name:       remedy.name,
                remedy_name_hindi: remedy.name_hindi ?? null,
                ailment:           entry.ailment,
                ailment_hindi:     entry.ailment_hindi,
                symptoms_keywords: entry.symptoms_keywords,
                chunk_text,
            });
        }
    }

    // Fetch existing to skip duplicates (by chunk_text)
    const existingTexts = new Set<string>();
    let offset = 0;
    while (true) {
        const { data } = await supabase.from('home_remedy_embeddings').select('chunk_text').range(offset, offset + 999);
        if (!data?.length) break;
        data.forEach(d => existingTexts.add(d.chunk_text));
        offset += 1000;
    }
    console.log(`  Loaded ${existingTexts.size} existing home remedy rows`);

    const rows = force ? allRows : allRows.filter(r => !existingTexts.has(r.chunk_text));
    console.log(`  Total rows: ${allRows.length} | Need ingesting: ${rows.length}`);
    if (!rows.length) { console.log('  ✅  All rows already ingested.'); return; }

    const prog: Progress = { success: 0, skipped: 0, failed: 0, total: rows.length };

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(batch.map(async (row) => {
            try {
                const vector = await embed(row.chunk_text);
                if (!vector.length) throw new Error('Empty embedding');

                const { error } = await supabase.from('home_remedy_embeddings').insert({
                    ...row,
                    embedding: vector as unknown as string,
                });

                if (error) throw new Error(error.message);
                prog.success++;
            } catch (e: unknown) {
                prog.failed++;
                console.error(`\n  ❌ ${row.remedy_name}: ${e instanceof Error ? e.message : String(e)}`);
            }
        }));
        logProgress(prog, 'Home Remedies');
        if (i + BATCH_SIZE < rows.length) await sleep(DELAY_MS);
    }

    console.log(`\n  ✅  Home Remedies done — ${prog.success} embedded, ${prog.failed} failed`);
}

// ── ═══════════════════════════════════════════════════════════════════════════
//    SOURCE 3: AYURVEDIC KNOWLEDGE → ayurvedic_knowledge_embeddings
//    (processed .jsonl files — Planet Ayurveda + books)
// ── ═══════════════════════════════════════════════════════════════════════════

type AyurvedaChunk = {
    id?: string;
    source?: string;
    book?: string;
    category?: string;
    page?: number;
    section?: string;
    text: string;
    keywords?: string[];
};

async function ingestJsonlFile(
    filePath: string,
    source: string,
    existingTexts: Set<string>,
    prog: Progress,
    force: boolean,
) {
    if (!fs.existsSync(filePath)) {
        console.log(`  [SKIP] Not found: ${path.basename(filePath)}`);
        return;
    }

    const rl = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });

    for await (const line of rl) {
        if (!line.trim()) continue;
        prog.total++;

        let rec: AyurvedaChunk;
        try {
            rec = JSON.parse(line);
        } catch {
            prog.failed++;
            continue;
        }

        if (!rec.text?.trim()) { prog.skipped++; continue; }

        if (!force && existingTexts.has(rec.text)) {
            prog.skipped++;
            continue;
        }

        try {
            const chunkText = [
                rec.book     ? `Book: ${rec.book}`       : '',
                rec.section  ? `Section: ${rec.section}` : '',
                rec.keywords?.length ? `Keywords: ${rec.keywords.join(', ')}` : '',
                `Content: ${rec.text}`,
            ].filter(Boolean).join('\n');

            const vector = await embed(chunkText);
            if (!vector.length) throw new Error('Empty embedding');

            const { error } = await supabase.from('ayurvedic_knowledge_embeddings').insert({
                source:    rec.source ?? source,
                book:      rec.book   ?? source,
                category:  rec.category ?? null,
                page:      rec.page   ?? null,
                section:   rec.section ?? null,
                text:      rec.text,
                keywords:  rec.keywords ?? [],
                embedding: vector as unknown as string,
            });

            if (error) throw new Error(error.message);
            existingTexts.add(rec.text);
            prog.success++;
        } catch (e: unknown) {
            prog.failed++;
        }

        logProgress(prog, `Ayurvedic [${path.basename(filePath, '.jsonl')}]`);
    }
}

async function ingestAyurvedicKnowledge(force = false) {
    console.log('\n\n' + '═'.repeat(70));
    console.log('🕉️   SOURCE 3: Ayurvedic Knowledge → ayurvedic_knowledge_embeddings');
    console.log('═'.repeat(70));

    // Load all existing texts into memory for fast dedup
    console.log('  Loading existing records for deduplication...');
    const existingTexts = new Set<string>();
    let offset = 0;
    while (true) {
        const { data } = await supabase
            .from('ayurvedic_knowledge_embeddings')
            .select('text')
            .range(offset, offset + 999);
        if (!data?.length) break;
        data.forEach(d => existingTexts.add(d.text));
        offset += 1000;
    }
    console.log(`  ⚡ Loaded ${existingTexts.size} existing records. Duplicates will be skipped instantly.\n`);

    const processedDir = path.resolve(__dirname, '../data/ayurveda/processed');
    const jsonlFiles = fs.existsSync(processedDir)
        ? fs.readdirSync(processedDir).filter(f => f.endsWith('.jsonl'))
        : [];

    const prog: Progress = { success: 0, skipped: 0, failed: 0, total: 0 };

    // ── 3a. Planet Ayurveda + Book files ──────────────────────────────────────
    console.log(`  Found ${jsonlFiles.length} .jsonl files in data/ayurveda/processed/\n`);
    for (const file of jsonlFiles) {
        console.log(`\n  📄 Processing: ${file}`);
        await ingestJsonlFile(
            path.join(processedDir, file),
            file.replace('.jsonl', ''),
            existingTexts,
            prog,
            force,
        );
    }

    // ── 3b. WHO ICD-11 ────────────────────────────────────────────────────────
    const icd11Path = path.resolve(__dirname, '../data/icd11/icd11_mms_2024_01.jsonl');
    if (fs.existsSync(icd11Path)) {
        console.log('\n  📄 Processing: WHO ICD-11 MMS 2024-01');
        await ingestJsonlFile(icd11Path, 'icd11', existingTexts, prog, force);
    } else {
        console.log('  [SKIP] data/icd11/icd11_mms_2024_01.jsonl not found');
    }

    // ── 3c. New Sources (classical medical texts) ─────────────────────────────
    const newSourcesDir = path.resolve(__dirname, '../data/new_sources/processed');
    if (fs.existsSync(newSourcesDir)) {
        const newFiles = fs.readdirSync(newSourcesDir).filter(f => f.endsWith('.jsonl'));
        console.log(`\n  Found ${newFiles.length} .jsonl files in data/new_sources/processed/`);
        for (const file of newFiles) {
            console.log(`\n  📄 Processing: ${file}`);
            await ingestJsonlFile(
                path.join(newSourcesDir, file),
                file.replace('.jsonl', ''),
                existingTexts,
                prog,
                force,
            );
        }
    } else {
        console.log('  [SKIP] data/new_sources/processed/ not found');
    }

    console.log(`\n\n  ✅  Ayurvedic Knowledge done — ${prog.success} embedded, ${prog.skipped} skipped, ${prog.failed} failed`);
}

// ── ═══════════════════════════════════════════════════════════════════════════
//    MAIN ORCHESTRATOR
// ── ═══════════════════════════════════════════════════════════════════════════

async function main() {
    const args = process.argv.slice(2);
    const sourceArg = args.includes('--source') ? args[args.indexOf('--source') + 1] : 'all';
    const force     = args.includes('--force');

    console.log('\n' + '█'.repeat(70));
    console.log('  HEALIO.AI — BRAIN MASTER RE-INGESTION');
    console.log('█'.repeat(70));
    console.log(`  Source filter : ${sourceArg}`);
    console.log(`  Force re-embed: ${force}`);
    console.log(`  Batch size    : ${BATCH_SIZE}`);
    console.log(`  Delay (ms)    : ${DELAY_MS}`);
    console.log(`  Jina keys     : ${jinaKeys.length}`);
    console.log(`  Supabase URL  : ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    console.log('');

    const t0 = Date.now();

    if (sourceArg === 'all' || sourceArg === 'boericke') {
        await ingestBoericke(force);
    }

    if (sourceArg === 'all' || sourceArg === 'home_remedies') {
        await ingestHomeRemedies(force);
    }

    if (sourceArg === 'all' || sourceArg === 'ayurvedic' || sourceArg === 'icd11') {
        await ingestAyurvedicKnowledge(force);
    }

    const elapsedMin = ((Date.now() - t0) / 60000).toFixed(1);
    console.log('\n\n' + '█'.repeat(70));
    console.log(`  ✅  BRAIN RE-INGESTION COMPLETE — ${elapsedMin} minutes`);
    console.log(`  Jina keys remaining: ${jinaKeys.length}`);
    console.log('█'.repeat(70));
    console.log('\nNext steps:');
    console.log('  1. Verify counts in Supabase Dashboard → Table Editor');
    console.log('  2. Run index creation (see supabase/migrations/20260607_jina_768dim.sql)');
    console.log('  3. Run: npm run eval:rag  to verify recall\n');
}

main().catch(err => {
    console.error('\n❌  Fatal error:', err);
    process.exit(1);
});
