/**
 * Healio.AI — Ingest BhashaBench-Ayur Q&A into Supabase
 * ========================================================
 * Reads data/ayurveda/raw/bhashabench/bhashabench_combined.json
 * Generates Gemini embeddings and inserts into ayurvedic_qna_embeddings table.
 *
 * Run AFTER download_bhashabench.py has completed:
 *   npx ts-node scripts/ingest_bhashabench.ts
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const geminiKey   = process.env.GEMINI_API_KEY!;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error('❌ Missing env vars. Check .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenAI({ apiKey: geminiKey });

// ── Types ────────────────────────────────────────────────────────────────────
// Actual field names depend on the dataset schema, normalised here
type BBARecord = {
    question_id?:  string | number;
    question:      string;
    option_a?:     string;
    option_b?:     string;
    option_c?:     string;
    option_d?:     string;
    answer?:       string;
    correct_option?: string;
    explanation?:  string;
    subject?:      string;
    domain?:       string;
    difficulty?:   string;
    question_type?: string;
    language:      string;
    [key: string]: unknown;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
async function generateEmbedding(text: string): Promise<number[]> {
    const res = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
    });
    if (!res.embeddings?.[0]?.values) throw new Error('Empty embedding response');
    return res.embeddings[0].values;
}

/**
 * Build a natural-language chunk from a Q&A record so the model
 * understands the question, options, and answer in context.
 */
function buildChunkText(rec: BBARecord): string {
    const parts: string[] = [];

    if (rec.domain || rec.subject) {
        parts.push(`Domain: ${rec.domain || rec.subject}`);
    }
    if (rec.difficulty) parts.push(`Difficulty: ${rec.difficulty}`);
    if (rec.question_type) parts.push(`Type: ${rec.question_type}`);

    parts.push(`Question: ${rec.question}`);

    const options = [
        rec.option_a ? `A) ${rec.option_a}` : null,
        rec.option_b ? `B) ${rec.option_b}` : null,
        rec.option_c ? `C) ${rec.option_c}` : null,
        rec.option_d ? `D) ${rec.option_d}` : null,
    ].filter(Boolean);

    if (options.length) parts.push(`Options: ${options.join(' | ')}`);

    const answer = rec.answer ?? rec.correct_option;
    if (answer) parts.push(`Answer: ${answer}`);
    if (rec.explanation) parts.push(`Explanation: ${rec.explanation}`);
    if (rec.language) parts.push(`Language: ${rec.language}`);

    return parts.join('\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function ingest() {
    const dataPath = path.resolve(
        process.cwd(),
        'data', 'ayurveda', 'raw', 'bhashabench', 'bhashabench_combined.json'
    );

    if (!fs.existsSync(dataPath)) {
        console.error(`❌ Data file not found: ${dataPath}`);
        console.error('   Run download_bhashabench.py first.');
        process.exit(1);
    }

    const records: BBARecord[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`\n📚 Starting BhashaBench-Ayur ingestion — ${records.length} records...\n`);

    // Print first record so we can verify field names
    console.log('📋 First record fields:', Object.keys(records[0]));
    console.log('');

    let succeeded = 0;
    let failed    = 0;

    // Process in batches to stay within Gemini rate limits (60 req/min on free tier)
    for (let i = 0; i < records.length; i++) {
        const rec   = records[i];
        const chunk = buildChunkText(rec);

        console.log(`[${i + 1}/${records.length}] ${rec.language} | ${(rec.domain ?? rec.subject ?? 'Unknown domain').slice(0, 40)}`);

        try {
            const embedding = await generateEmbedding(chunk);

            const { error } = await supabase
                .from('ayurvedic_qna_embeddings')
                .insert({
                    question_id:   String(rec.question_id ?? `bba-${i}`),
                    question:      rec.question,
                    answer:        rec.answer ?? rec.correct_option ?? '',
                    explanation:   rec.explanation ?? '',
                    domain:        rec.domain ?? rec.subject ?? '',
                    difficulty:    rec.difficulty ?? '',
                    question_type: rec.question_type ?? '',
                    language:      rec.language,
                    chunk_text:    chunk,
                    embedding,
                    source:        'BhashaBench-Ayur',
                });

            if (error) {
                console.error(`  ⚠️  Supabase error:`, error.message);
                failed++;
            } else {
                console.log(`  ✅ Inserted`);
                succeeded++;
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            console.error(`  ❌ Error:`, e.message);
            failed++;
        }

        // Respect Gemini free-tier: 60 req/min → 1 req/sec
        await new Promise(r => setTimeout(r, 1100));

        // Progress checkpoint every 100 records
        if ((i + 1) % 100 === 0) {
            console.log(`\n── Checkpoint: ${succeeded} ok, ${failed} failed so far ──\n`);
        }
    }

    console.log(`\n✅ Ingestion complete — ${succeeded} succeeded, ${failed} failed`);
}

ingest().catch(console.error);
