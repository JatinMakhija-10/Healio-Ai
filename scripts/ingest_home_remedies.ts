/**
 * Healio.AI — Ingest Home Remedies into Supabase
 * 
 * Reads data/home_remedies/nuskhe.json, generates Gemini embeddings for each
 * remedy, and inserts into the home_remedy_embeddings table.
 * 
 * Run: npx ts-node scripts/ingest_home_remedies.ts
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
    console.error('❌ Missing env vars. Check NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenAI({ apiKey: geminiKey });

type Remedy = {
    name: string;
    name_hindi?: string;
    ingredients?: string[];
    method: string;
    method_hindi?: string;
    frequency?: string;
    indication?: string;
    contraindications?: string[];
    age_safe?: string;
};

type NuskheEntry = {
    id: string;
    ailment: string;
    ailment_hindi: string;
    symptoms_keywords: string[];
    remedies: Remedy[];
};

async function generateEmbedding(text: string): Promise<number[]> {
    const res = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
    });
    if (!res.embeddings?.[0]?.values) throw new Error('Empty embedding response');
    return res.embeddings[0].values;
}

function buildChunkText(ailment: string, ailment_hindi: string, remedy: Remedy): string {
    const lines = [
        `Ailment: ${ailment} / ${ailment_hindi}`,
        `Remedy Name: ${remedy.name}${remedy.name_hindi ? ` (${remedy.name_hindi})` : ''}`,
        `Ingredients: ${(remedy.ingredients || []).join(', ')}`,
        `Method: ${remedy.method}`,
        remedy.method_hindi ? `Hindi Method: ${remedy.method_hindi}` : '',
        `Frequency: ${remedy.frequency || 'As needed'}`,
        `Indication: ${remedy.indication || ''}`,
        `Contraindications: ${(remedy.contraindications || []).join(', ') || 'None known'}`,
        `Safe for age: ${remedy.age_safe || 'Adults'}`,
    ];
    return lines.filter(Boolean).join('\n');
}

async function ingest() {
    const dataPath = path.resolve(process.cwd(), 'data', 'home_remedies', 'nuskhe.json');
    const rawData: NuskheEntry[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Flatten: one database row per remedy (not per ailment)
    const rows: {
        remedy_name: string;
        remedy_name_hindi: string | null;
        ailment: string;
        ailment_hindi: string;
        symptoms_keywords: string[];
        chunk_text: string;
    }[] = [];

    for (const entry of rawData) {
        for (const remedy of entry.remedies) {
            rows.push({
                remedy_name: remedy.name,
                remedy_name_hindi: remedy.name_hindi || null,
                ailment: entry.ailment,
                ailment_hindi: entry.ailment_hindi,
                symptoms_keywords: entry.symptoms_keywords,
                chunk_text: buildChunkText(entry.ailment, entry.ailment_hindi, remedy),
            });
        }
    }

    console.log(`\n🌿 Starting Home Remedy ingestion — ${rows.length} remedies to embed...\n`);

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        console.log(`[${i + 1}/${rows.length}] Embedding: ${row.remedy_name} (${row.ailment})`);

        try {
            const embedding = await generateEmbedding(row.chunk_text);

            const { error } = await supabase
                .from('home_remedy_embeddings')
                .insert({
                    remedy_name: row.remedy_name,
                    remedy_name_hindi: row.remedy_name_hindi,
                    ailment: row.ailment,
                    ailment_hindi: row.ailment_hindi,
                    symptoms_keywords: row.symptoms_keywords,
                    chunk_text: row.chunk_text,
                    embedding,
                });

            if (error) {
                console.error(`  ⚠️  Supabase insert error:`, error.message);
                failed++;
            } else {
                console.log(`  ✅ Inserted`);
                succeeded++;
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            console.error(`  ❌ Embedding error for ${row.remedy_name}:`, e.message);
            failed++;
        }

        // Respect Gemini rate limits (60 requests/min free tier)
        await new Promise(r => setTimeout(r, 1100));
    }

    console.log(`\n✅ Ingestion complete — ${succeeded} succeeded, ${failed} failed`);
}

ingest().catch(console.error);
