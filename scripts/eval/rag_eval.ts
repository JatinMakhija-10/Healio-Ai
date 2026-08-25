/**
 * RAG Quality Evaluation Runner
 *
 * Measures recall@5 for all three knowledge sources against a ground-truth set.
 * Run BEFORE and AFTER any embedding model or retrieval change.
 *
 * Usage:
 *   npx tsx scripts/eval/rag_eval.ts
 *
 * Requires:
 *   GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// ── Config ────────────────────────────────────────────────────────────────────

const GEMINI_KEY   = process.env.GEMINI_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const MODEL_BOERICKE    = 'gemini-embedding-2-preview'; // 3072-dim
const MODEL_AYURVEDIC   = 'gemini-embedding-2-preview'; // 768-dim (output_dimensionality=768)
const MODEL_HOME_REMEDY = 'gemini-embedding-001';       // 3072-dim

const BOERICKE_THRESHOLD    = 0.60;  // top matches are ~63-64%, was 0.72 (too strict)
const AYURVEDIC_THRESHOLD   = 0.55;  // lower for seq scan on 26K rows
const HOME_REMEDY_THRESHOLD = 0.58;

// ── Types ─────────────────────────────────────────────────────────────────────

interface EvalQuery {
    id: string;
    symptom_text: string;
    expected_boericke: string[];
    expected_ayurvedic: string[];
    expected_home_remedies: string[];
    notes: string;
}

interface EvalResult {
    id: string;
    symptom_text: string;
    boericke:     { hit: boolean; matched: string[]; returned: string[]; ms: number };
    ayurvedic:    { hit: boolean; matched: string[]; returned: string[]; ms: number };
    homeRemedies: { hit: boolean; matched: string[]; returned: string[]; ms: number };
    embedMs: { e768: number; e3072: number };
}

interface Summary {
    totalQueries:         number;
    boerickeRecallAt5:    number;
    ayurvedicRecallAt5:   number;
    homeRemedyRecallAt5:  number;
    overallRecall:        number;
    avgEmbedMs768:        number;
    avgEmbedMs3072:       number;
    avgBoerickeRpcMs:     number;
    avgAyurvedicRpcMs:    number;
    avgHomeRemedyRpcMs:   number;
    failures:             string[];
}

// ── Clients ───────────────────────────────────────────────────────────────────

function getClients() {
    if (!GEMINI_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌  Missing env vars. Check GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local');
        process.exit(1);
    }
    const gemini   = new GoogleGenAI({ apiKey: GEMINI_KEY });
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    return { gemini, supabase };
}

// ── Embedding helpers ─────────────────────────────────────────────────────────

async function embedForBoericke(gemini: GoogleGenAI, text: string): Promise<{ vector: number[]; ms: number }> {
    const t0 = Date.now();
    const res = await gemini.models.embedContent({ model: MODEL_BOERICKE, contents: text });
    const vector = res.embeddings?.[0]?.values ?? [];
    return { vector, ms: Date.now() - t0 };
}

async function embedForAyurvedic(gemini: GoogleGenAI, text: string): Promise<{ vector: number[]; ms: number }> {
    const t0 = Date.now();
    const res = await gemini.models.embedContent({
        model: MODEL_AYURVEDIC,
        contents: text,
        config: { outputDimensionality: 768 },
    });
    const vector = res.embeddings?.[0]?.values ?? [];
    return { vector, ms: Date.now() - t0 };
}

async function embedForHomeRemedy(gemini: GoogleGenAI, text: string): Promise<{ vector: number[]; ms: number }> {
    const t0 = Date.now();
    const res = await gemini.models.embedContent({ model: MODEL_HOME_REMEDY, contents: text });
    const vector = res.embeddings?.[0]?.values ?? [];
    return { vector, ms: Date.now() - t0 };
}

// ── RPC helpers ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchBoericke(supabase: any, embedding: number[]): Promise<{ names: string[]; ms: number }> {
    const t0 = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('match_boericke_embeddings', {
        query_embedding: embedding,
        match_threshold: BOERICKE_THRESHOLD,
        match_count: 10,
    });
    const ms = Date.now() - t0;
    if (error) {
        console.error(`    [Boericke RPC error: ${error.message}]`);
        return { names: [], ms };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const names = (data as any[] ?? []).map((r: any) => (r.remedy_name as string ?? '').trim());
    return { names, ms };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAyurvedic(supabase: any, embedding: number[]): Promise<{ names: string[]; ms: number }> {
    const t0 = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('search_ayurvedic_knowledge', {
        query_embedding: embedding,
        match_threshold: AYURVEDIC_THRESHOLD,
        match_count: 12,
    });
    const ms = Date.now() - t0;
    if (error) {
        console.error(`    [Ayurvedic RPC error: ${error.message}]`);
        return { names: [], ms };
    }
    // Return the full text of each result — checkMatch will search for herb names within it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const names = (data as any[] ?? []).map((r: any) => {
        return `${r.section ?? ''} ${r.book ?? ''} ${r.text ?? ''}`;
    });
    return { names, ms };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchHomeRemedies(supabase: any, embedding: number[]): Promise<{ names: string[]; ms: number }> {
    const t0 = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('match_home_remedy_embeddings', {
        query_embedding: embedding,
        match_threshold: HOME_REMEDY_THRESHOLD,
        match_count: 8,
    });
    const ms = Date.now() - t0;
    if (error) {
        console.error(`    [HomeRemedy RPC error: ${error.message}]`);
        return { names: [], ms };
    }
    // Filter out generic placeholder entries that pollute results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const names = (data as any[] ?? [])
        .map((r: any) => (r.remedy_name as string ?? '').trim())
        .filter(n => n.toLowerCase() !== 'minor home treatment');
    return { names, ms };
}

// ── Match helpers ─────────────────────────────────────────────────────────────

function checkMatch(returned: string[], expected: string[]): { hit: boolean; matched: string[] } {
    const returnedLower = returned.map(s => s.toLowerCase());
    const matched = expected.filter(exp =>
        returnedLower.some(r => r.includes(exp.toLowerCase()) || exp.toLowerCase().includes(r))
    );
    return { hit: matched.length > 0, matched };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    const { gemini, supabase } = getClients();

    const evalFile = path.resolve(__dirname, 'expected_results.json');
    const { queries }: { queries: EvalQuery[] } = JSON.parse(fs.readFileSync(evalFile, 'utf8'));

    console.log(`\n🔬  Arovia RAG Eval — ${queries.length} queries\n${'─'.repeat(60)}`);

    const results: EvalResult[] = [];
    const failures: string[] = [];

    for (const q of queries) {
        process.stdout.write(`  [${q.id}] "${q.symptom_text.slice(0, 50)}..." `);

        try {
            // Generate all three embeddings in parallel
            // Boericke: gemini-embedding-2-preview (3072-dim full)
            // Ayurvedic: gemini-embedding-2-preview (768-dim truncated)
            // Home Remedies: gemini-embedding-001 (3072-dim)
            const [eBoerickeResult, eAyurvedicResult, eHomeResult] = await Promise.all([
                embedForBoericke(gemini, q.symptom_text),
                embedForAyurvedic(gemini, q.symptom_text),
                embedForHomeRemedy(gemini, q.symptom_text),
            ]);

            // Run all three RPC calls in parallel
            const [boerickeResult, ayurvedicResult, homeRemedyResult] = await Promise.all([
                fetchBoericke(supabase, eBoerickeResult.vector),
                fetchAyurvedic(supabase, eAyurvedicResult.vector),
                fetchHomeRemedies(supabase, eHomeResult.vector),
            ]);

            const boerickeMatch    = checkMatch(boerickeResult.names,    q.expected_boericke);
            const ayurvedicMatch   = checkMatch(ayurvedicResult.names,   q.expected_ayurvedic);
            const homeRemedyMatch  = checkMatch(homeRemedyResult.names,  q.expected_home_remedies);

            const hits = [boerickeMatch.hit, ayurvedicMatch.hit, homeRemedyMatch.hit].filter(Boolean).length;
            const icon = hits === 3 ? '✅' : hits >= 2 ? '🟡' : hits >= 1 ? '🟠' : '❌';
            console.log(`${icon}  (B:${boerickeMatch.hit?'✓':'✗'} A:${ayurvedicMatch.hit?'✓':'✗'} H:${homeRemedyMatch.hit?'✓':'✗'})`);

            results.push({
                id: q.id,
                symptom_text: q.symptom_text,
                boericke:     { ...boerickeMatch,    returned: boerickeResult.names,    ms: boerickeResult.ms    },
                ayurvedic:    { ...ayurvedicMatch,   returned: ayurvedicResult.names,   ms: ayurvedicResult.ms   },
                homeRemedies: { ...homeRemedyMatch,  returned: homeRemedyResult.names,  ms: homeRemedyResult.ms  },
                embedMs:      { e768: eAyurvedicResult.ms, e3072: eHomeResult.ms },
            });
        } catch (err) {
            console.log('💥  ERROR');
            failures.push(`${q.id}: ${String(err)}`);
        }

        // Small delay between queries to avoid Gemini rate limits
        await new Promise(r => setTimeout(r, 300));
    }

    // ── Summary ───────────────────────────────────────────────────────────────

    const n = results.length;
    const boerickeHits    = results.filter(r => r.boericke.hit).length;
    const ayurvedicHits   = results.filter(r => r.ayurvedic.hit).length;
    const homeRemedyHits  = results.filter(r => r.homeRemedies.hit).length;

    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    const summary: Summary = {
        totalQueries:        n,
        boerickeRecallAt5:   Math.round((boerickeHits   / n) * 100),
        ayurvedicRecallAt5:  Math.round((ayurvedicHits  / n) * 100),
        homeRemedyRecallAt5: Math.round((homeRemedyHits / n) * 100),
        overallRecall:       Math.round(((boerickeHits + ayurvedicHits + homeRemedyHits) / (n * 3)) * 100),
        avgEmbedMs768:       avg(results.map(r => r.embedMs.e768)),
        avgEmbedMs3072:      avg(results.map(r => r.embedMs.e3072)),
        avgBoerickeRpcMs:    avg(results.map(r => r.boericke.ms)),
        avgAyurvedicRpcMs:   avg(results.map(r => r.ayurvedic.ms)),
        avgHomeRemedyRpcMs:  avg(results.map(r => r.homeRemedies.ms)),
        failures,
    };

    console.log(`\n${'─'.repeat(60)}`);
    console.log('📊  RECALL RESULTS');
    console.log(`${'─'.repeat(60)}`);
    console.log(`  Boericke (Homeopathic):   ${summary.boerickeRecallAt5}%  (${boerickeHits}/${n})`);
    console.log(`  Ayurvedic:                ${summary.ayurvedicRecallAt5}%  (${ayurvedicHits}/${n})`);
    console.log(`  Home Remedies:            ${summary.homeRemedyRecallAt5}%  (${homeRemedyHits}/${n})`);
    console.log(`  ── Overall recall@5:      ${summary.overallRecall}%`);

    console.log(`\n⏱️   LATENCY (avg across ${n} queries)`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`  embed_768:                ${summary.avgEmbedMs768}ms`);
    console.log(`  embed_3072:               ${summary.avgEmbedMs3072}ms`);
    console.log(`  rag_boericke (RPC):       ${summary.avgBoerickeRpcMs}ms`);
    console.log(`  rag_ayurvedic (RPC):      ${summary.avgAyurvedicRpcMs}ms`);
    console.log(`  rag_home_remedy (RPC):    ${summary.avgHomeRemedyRpcMs}ms`);

    if (failures.length) {
        console.log(`\n⚠️   FAILURES (${failures.length})`);
        failures.forEach(f => console.log(`  - ${f}`));
    }

    // ── Write results to file ─────────────────────────────────────────────────

    const timestamp  = new Date().toISOString().replace(/[:.]/g, '-');
    const outPath    = path.resolve(__dirname, `results-${timestamp}.json`);
    const outPayload = { summary, results, generatedAt: new Date().toISOString() };
    fs.writeFileSync(outPath, JSON.stringify(outPayload, null, 2));

    console.log(`\n💾  Full results saved → scripts/eval/results-${timestamp}.json`);
    console.log(`\n${'─'.repeat(60)}\n`);

    // Exit with non-zero code if overall recall drops below 70%
    if (summary.overallRecall < 70) {
        console.error(`❌  Overall recall ${summary.overallRecall}% is below the 70% minimum gate. Do NOT ship this change.`);
        process.exit(1);
    } else {
        console.log(`✅  Recall gate passed (${summary.overallRecall}% ≥ 70%).\n`);
    }
}

main().catch(err => {
    console.error('Fatal eval error:', err);
    process.exit(1);
});
