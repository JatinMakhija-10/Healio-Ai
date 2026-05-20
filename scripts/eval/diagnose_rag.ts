/**
 * RAG Diagnostic — tests a single query with lowered thresholds to see
 * what each RPC actually returns. Run with: npx tsx scripts/eval/diagnose_rag.ts
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const gemini   = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const TEST_QUERY = 'I have a cold with runny nose and sneezing since 2 days';

async function main() {
    console.log(`\n🔍  Diagnosing RAG for: "${TEST_QUERY}"\n${'─'.repeat(60)}\n`);

    // ── Boericke+Ayurvedic embedding (gemini-embedding-2-preview, 3072-dim) ────
    console.log('Generating embedding for Boericke+Ayurvedic (gemini-embedding-2-preview)...');
    const e768 = await gemini.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: TEST_QUERY,
    });
    const vec768 = e768.embeddings?.[0]?.values ?? [];
    console.log(`  ✓ vector length: ${vec768.length} (should be 3072)\n`);

    // ── Home Remedy embedding (gemini-embedding-001, 3072-dim) ────────────────
    console.log('Generating embedding for Home Remedies (gemini-embedding-001)...');
    const e3072 = await gemini.models.embedContent({
        model: 'gemini-embedding-001',
        contents: TEST_QUERY,
    });
    const vec3072 = e3072.embeddings?.[0]?.values ?? [];
    console.log(`  ✓ vector length: ${vec3072.length} (should be 3072)\n`);

    // ── Boericke RPC (very low threshold to see any matches at all) ──────────
    console.log('─── BOERICKE (threshold=0.1, count=10) ───');
    const { data: bData, error: bErr } = await (supabase as any).rpc('match_boericke_embeddings', {
        query_embedding: vec768,
        match_threshold: 0.1,
        match_count: 10,
    });
    if (bErr) {
        console.log('  ❌ RPC ERROR:', bErr.message);
    } else if (!bData?.length) {
        console.log('  ⚠️  0 rows returned even at threshold=0.3');
    } else {
        console.log(`  ${bData.length} rows returned:`);
        for (const row of bData) {
            console.log(`    [${((row.similarity ?? 0) * 100).toFixed(1)}%] remedy_name="${row.remedy_name}" | chunk_text="${(row.chunk_text ?? '').slice(0, 80)}..."`);
        }
    }

    // ── Check if the boericke_embeddings table even has rows ──────────────────
    console.log('\n─── BOERICKE TABLE CHECK ───');
    const { count: bCount } = await supabase.from('boericke_embeddings').select('*', { count: 'exact', head: true });
    console.log(`  Total rows in boericke_embeddings: ${bCount}`);

    // ── Check embedding dimension in DB ───────────────────────────────────────
    const { data: sampleRow } = await supabase.from('boericke_embeddings').select('embedding').limit(1);
    if (sampleRow?.[0]?.embedding) {
        const dbDim = Array.isArray(sampleRow[0].embedding) ? sampleRow[0].embedding.length : 'unknown (stored as pgvector)';
        console.log(`  DB embedding dimension: ${dbDim}`);
    } else {
        console.log('  Could not read sample embedding (may be pgvector binary)');
    }

    // ── Ayurvedic RPC (lowered threshold) ────────────────────────────────────
    console.log('\n─── AYURVEDIC (threshold=0.1, count=5) ───');
    const t0ay = Date.now();
    const { data: aData, error: aErr } = await (supabase as any).rpc('search_ayurvedic_knowledge', {
        query_embedding: vec768,
        match_threshold: 0.1,
        match_count: 5,
    });
    console.log(`  RPC took ${Date.now() - t0ay}ms`);
    if (aErr) {
        console.log('  ❌ RPC ERROR:', aErr.message);
    } else if (!aData?.length) {
        console.log('  ⚠️  0 rows returned even at threshold=0.3');
    } else {
        console.log(`  ${aData.length} rows returned:`);
        for (const row of aData) {
            console.log(`    [${((row.similarity ?? 0) * 100).toFixed(1)}%] book="${row.book}" | section="${row.section}" | text="${(row.text ?? '').slice(0, 80)}..."`);
        }
    }

    // ── Check ayurvedic table ─────────────────────────────────────────────────
    console.log('\n─── AYURVEDIC TABLE CHECK ───');
    const { count: aCount } = await supabase.from('ayurvedic_knowledge_embeddings').select('*', { count: 'exact', head: true });
    console.log(`  Total rows in ayurvedic_knowledge_embeddings: ${aCount}`);

    // ── Home Remedies RPC (lowered threshold 0.3) ─────────────────────────────
    console.log('\n─── HOME REMEDIES (threshold=0.3, count=8) ───');
    const { data: hData, error: hErr } = await (supabase as any).rpc('match_home_remedy_embeddings', {
        query_embedding: vec3072,
        match_threshold: 0.3,
        match_count: 8,
    });
    if (hErr) {
        console.log('  ❌ RPC ERROR:', hErr.message);
    } else if (!hData?.length) {
        console.log('  ⚠️  0 rows returned even at threshold=0.3');
    } else {
        console.log(`  ${hData.length} rows returned:`);
        for (const row of hData) {
            console.log(`    [${((row.similarity ?? 0) * 100).toFixed(1)}%] ailment="${row.ailment}" | remedy_name="${row.remedy_name}" | chunk="${(row.chunk_text ?? '').slice(0, 60)}..."`);
        }
    }

    // ── Check home_remedy_embeddings table ────────────────────────────────────
    console.log('\n─── HOME REMEDY TABLE CHECK ───');
    const { count: hCount } = await supabase.from('home_remedy_embeddings').select('*', { count: 'exact', head: true });
    console.log(`  Total rows in home_remedy_embeddings: ${hCount}`);

    // ── Check existing indexes ────────────────────────────────────────────────
    console.log('\n─── VECTOR INDEXES ───');
    const { data: indexes } = await supabase.rpc('pg_indexes_info' as any).select('*');
    if (indexes) {
        console.log('  Found indexes via rpc');
    } else {
        console.log('  (Could not query indexes via RPC — check manually in Supabase SQL Editor)');
    }

    console.log(`\n${'─'.repeat(60)}\nDone.\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
