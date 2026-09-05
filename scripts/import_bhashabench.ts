/**
 * Arovia.AI / Healio.AI — BhashaBench-Ayur Import & Ingestion Pipeline
 * =================================================═════════════════
 * Dataset: bharatgenai/BhashaBench-Ayur (HuggingFace Gated Dataset)
 * 
 * Usage:
 *   1. Set HF_TOKEN in .env.local OR pass as argument:
 *      npx tsx scripts/import_bhashabench.ts --token=hf_your_token_here
 * 
 *   2. Or if you have a local JSON file:
 *      npx tsx scripts/import_bhashabench.ts --file=data/ayurveda/raw/bhashabench/bhashabench_combined.json
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const jinaKey = process.env.JINA_API_KEY!;
const geminiKey = process.env.GEMINI_API_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CLI flags
const args = process.argv.slice(2);
let hfToken = process.env.HF_TOKEN || '';
let localFilePath = '';

for (const arg of args) {
    if (arg.startsWith('--token=')) hfToken = arg.split('=')[1].trim();
    if (arg.startsWith('--file=')) localFilePath = arg.split('=')[1].trim();
}

type QnARecord = {
    question_id?: string | number;
    question: string;
    option_a?: string;
    option_b?: string;
    option_c?: string;
    option_d?: string;
    options?: string[];
    answer?: string;
    correct_option?: string;
    explanation?: string;
    domain?: string;
    subject?: string;
    difficulty?: string;
    question_type?: string;
    language?: string;
    [key: string]: unknown;
};

// ── Embedding Generator (Jina AI primary, Gemini fallback) ───────────────────
async function generate768Embedding(text: string, retries = 5, delay = 1000): Promise<number[]> {
    if (jinaKey) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch('https://api.jina.ai/v1/embeddings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${jinaKey}`,
                    },
                    body: JSON.stringify({
                        model: 'jina-embeddings-v5-text-nano',
                        input: [text],
                        dimensions: 768,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.data[0].embedding;
                }

                if (response.status === 429 || response.status >= 500) {
                    await new Promise(r => setTimeout(r, delay));
                    delay *= 2;
                    continue;
                }
            } catch {
                await new Promise(r => setTimeout(r, delay));
                delay *= 2;
            }
        }
    }

    // Fallback: Gemini Embedding API
    if (geminiKey) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiKey}`;
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/gemini-embedding-001',
                content: { parts: [{ text }] },
            }),
        });
        if (resp.ok) {
            const data = await resp.json();
            return data.embedding.values;
        }
    }

    throw new Error('Failed to generate embedding with Jina & Gemini APIs');
}

// ── Build chunk text ─────────────────────────────────────────────────────────
function buildChunkText(rec: QnARecord, lang: string): string {
    const parts: string[] = [];
    const domainStr = rec.subject_domain || rec.topic || rec.domain || rec.subject || 'Ayurvedic Sciences';
    const diffStr = rec.question_level || rec.difficulty;
    parts.push(`Domain: ${domainStr}`);
    if (diffStr) parts.push(`Difficulty: ${diffStr}`);
    parts.push(`Language: ${lang}`);
    parts.push(`Question: ${rec.question}`);

    let optsList: string[] = [];
    if (Array.isArray(rec.options)) {
        optsList = rec.options;
    } else {
        if (rec.option_a) optsList.push(`A) ${rec.option_a}`);
        if (rec.option_b) optsList.push(`B) ${rec.option_b}`);
        if (rec.option_c) optsList.push(`C) ${rec.option_c}`);
        if (rec.option_d) optsList.push(`D) ${rec.option_d}`);
    }
    if (optsList.length) parts.push(`Options: ${optsList.join(' | ')}`);

    const ans = rec.correct_answer || rec.answer || rec.correct_option;
    if (ans) parts.push(`Correct Answer: ${ans}`);
    if (rec.explanation) parts.push(`Explanation: ${rec.explanation}`);

    return parts.join('\n');
}

// ── Fetch rows from Hugging Face Datasets API ─────────────────────────────────
async function fetchHFRows(config: string, split: string, token: string): Promise<QnARecord[]> {
    const records: QnARecord[] = [];
    let offset = 0;
    const length = 100;
    let hasMore = true;

    console.log(`📡 Fetching config="${config}", split="${split}" from Hugging Face...`);

    while (hasMore) {
        const url = `https://datasets-server.huggingface.co/rows?dataset=bharatgenai%2FBhashaBench-Ayur&config=${encodeURIComponent(config)}&split=${encodeURIComponent(split)}&offset=${offset}&length=${length}`;
        const resp = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`HF API HTTP ${resp.status}: ${errText}`);
        }

        const data = await resp.json();
        const rows = data.rows || [];
        if (rows.length === 0) {
            hasMore = false;
            break;
        }

        for (const item of rows) {
            records.push({
                ...item.row,
                language: config,
            });
        }

        console.log(`  Fetched ${records.length} / ${data.num_rows_total || '?'} rows (offset ${offset})`);
        offset += length;
        if (offset >= (data.num_rows_total || 0) || rows.length < length) {
            hasMore = false;
        }

        // Avoid hammering API
        await new Promise(r => setTimeout(r, 200));
    }

    return records;
}

// ── Main Import Process ──────────────────────────────────────────────────────
async function runImport() {
    let allRecords: { record: QnARecord; lang: string }[] = [];

    // Mode A: Load from local JSON if provided or available
    const defaultLocalPath = path.resolve(process.cwd(), 'data', 'ayurveda', 'raw', 'bhashabench', 'bhashabench_combined.json');
    const targetFile = localFilePath || (fs.existsSync(defaultLocalPath) ? defaultLocalPath : '');

    if (targetFile && fs.existsSync(targetFile)) {
        console.log(`📂 Loading local dataset file: ${targetFile}`);
        const raw = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
        const list = Array.isArray(raw) ? raw : (raw.records || []);
        allRecords = list.map((r: QnARecord) => ({ record: r, lang: String(r.language || 'English') }));
    } else {
        // Mode B: Fetch directly from Hugging Face Serverless API
        if (!hfToken) {
            console.error('\n❌ Hugging Face access token is missing!');
            console.error('Please either:');
            console.error('  1. Add HF_TOKEN=hf_your_token_here to .env.local');
            console.error('  2. Run: npx tsx scripts/import_bhashabench.ts --token=hf_your_token_here\n');
            process.exit(1);
        }

        console.log('🌐 Connected to Hugging Face API with user token.');
        const configs = ['English', 'Hindi'];
        for (const cfg of configs) {
            try {
                const rows = await fetchHFRows(cfg, 'test', hfToken);
                rows.forEach(r => allRecords.push({ record: r, lang: cfg }));
            } catch (err: any) {
                console.error(`⚠️ Could not fetch config "${cfg}":`, err.message);
            }
        }
    }

    if (allRecords.length === 0) {
        console.error('❌ No records found to import.');
        process.exit(1);
    }

    console.log(`\n📚 Total ${allRecords.length} Ayurvedic Q&A records ready for ingestion.`);
    console.log('🔍 Checking existing entries in Supabase to enable instant resume...');

    // Fetch existing question_ids from Supabase to skip already inserted rows
    const existingIds = new Set<string>();
    let fetchOffset = 0;
    const fetchLimit = 1000;
    let fetching = true;

    while (fetching) {
        const { data: page, error } = await supabase
            .from('ayurvedic_qna_embeddings')
            .select('question_id')
            .range(fetchOffset, fetchOffset + fetchLimit - 1);

        if (error || !page || page.length === 0) {
            fetching = false;
            break;
        }

        for (const row of page) {
            if (row.question_id) existingIds.add(row.question_id);
        }

        if (page.length < fetchLimit) fetching = false;
        fetchOffset += fetchLimit;
    }

    console.log(`📌 Found ${existingIds.size} already ingested records in Supabase. Skipping those...\n`);
    console.log('⚡ Generating 768-dim embeddings and inserting remaining into Supabase...\n');

    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < allRecords.length; i++) {
        const { record: rec, lang } = allRecords[i];
        const qId = String(rec.question_id || rec.id || `bba-${i + 1}`);

        if (existingIds.has(qId)) {
            skipped++;
            continue;
        }

        const chunkText = buildChunkText(rec, lang);
        process.stdout.write(`[${i + 1}/${allRecords.length}] Processing ID:${qId} (${lang})... `);

        try {
            const embedding = await generate768Embedding(chunkText);

            const optionsArr: string[] = Array.isArray(rec.options)
                ? rec.options
                : [rec.option_a, rec.option_b, rec.option_c, rec.option_d].filter(Boolean) as string[];

            const { error } = await supabase
                .from('ayurvedic_qna_embeddings')
                .insert({
                    question_id: qId,
                    question: rec.question,
                    options: optionsArr,
                    answer: String(rec.correct_answer || rec.answer || rec.correct_option || ''),
                    correct_option: String(rec.correct_answer || rec.correct_option || rec.answer || ''),
                    explanation: String(rec.explanation || ''),
                    domain: String(rec.subject_domain || rec.topic || rec.domain || rec.subject || 'Ayurvedic Sciences'),
                    difficulty: String(rec.question_level || rec.difficulty || 'Medium'),
                    question_type: String(rec.question_type || 'MCQ'),
                    language: lang,
                    chunk_text: chunkText,
                    embedding,
                    source: 'BhashaBench-Ayur',
                });

            if (error) {
                console.log(`❌ Supabase Insert Error: ${error.message}`);
                failed++;
            } else {
                console.log(`✅ Success`);
                succeeded++;
            }
        } catch (err: any) {
            console.log(`❌ Embedding Error: ${err.message}`);
            failed++;
        }

        // Small delay to respect rate limits
        await new Promise(r => setTimeout(r, 150));
    }

    console.log(`\n🎉 Ingestion finished: ${succeeded} succeeded, ${failed} failed.`);
}

runImport().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
