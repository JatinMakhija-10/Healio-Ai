/**
 * Healio.AI — Ingest Ayurvedic Herbs into Supabase
 * 
 * Reads data/ayurvedic/herbs.json, generates Gemini embeddings for each
 * herb entry, and inserts into the ayurvedic_embeddings table.
 * 
 * Run: npx ts-node scripts/ingest_ayurveda.ts
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

type Preparation = {
    form: string;
    dose: string;
    notes?: string;
};

type HerbEntry = {
    id: string;
    herb_name: string;
    hindi_name: string;
    latin_name: string;
    common_names: string[];
    parts_used: string[];
    rasa: string[];
    guna: string[];
    virya: string;
    vipaka: string;
    dosha_effect: string;
    primary_actions: string[];
    conditions: string[];
    symptoms_keywords: string[];
    preparations: Preparation[];
    contraindications: string[];
    safety: string;
    age_safe: string;
};

async function generateEmbedding(text: string): Promise<number[]> {
    const res = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
    });
    if (!res.embeddings?.[0]?.values) throw new Error('Empty embedding response');
    return res.embeddings[0].values;
}

function buildChunkText(herb: HerbEntry): string {
    const preps = herb.preparations
        .map(p => `  - ${p.form}: ${p.dose}${p.notes ? ` (${p.notes})` : ''}`)
        .join('\n');

    return [
        `Herb: ${herb.herb_name} (${herb.hindi_name}) — ${herb.latin_name}`,
        `Common names: ${herb.common_names.join(', ')}`,
        `Parts used: ${herb.parts_used.join(', ')}`,
        `Rasa (taste): ${herb.rasa.join(', ')}`,
        `Guna (qualities): ${herb.guna.join(', ')}`,
        `Virya (potency): ${herb.virya}`,
        `Vipaka (post-digest): ${herb.vipaka}`,
        `Dosha effect: ${herb.dosha_effect}`,
        `Actions: ${herb.primary_actions.join(', ')}`,
        `Conditions treated: ${herb.conditions.join(', ')}`,
        `Preparations & Doses:\n${preps}`,
        `Contraindications: ${herb.contraindications.join(', ') || 'None known'}`,
        `Safety: ${herb.safety}`,
        `Safe for age: ${herb.age_safe}`,
    ].join('\n');
}

async function ingest() {
    const dataPath = path.resolve(process.cwd(), 'data', 'ayurvedic', 'herbs.json');
    const herbs: HerbEntry[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log(`\n🌱 Starting Ayurvedic herb ingestion — ${herbs.length} herbs to embed...\n`);

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < herbs.length; i++) {
        const herb = herbs[i];
        const chunk = buildChunkText(herb);
        console.log(`[${i + 1}/${herbs.length}] Embedding: ${herb.herb_name} (${herb.hindi_name})`);

        try {
            const embedding = await generateEmbedding(chunk);

            const { error } = await supabase
                .from('ayurvedic_embeddings')
                .insert({
                    herb_name: herb.herb_name,
                    herb_name_hindi: herb.hindi_name,
                    conditions: herb.conditions,
                    symptoms_keywords: herb.symptoms_keywords,
                    chunk_text: chunk,
                    embedding,
                });

            if (error) {
                console.error(`  ⚠️  Supabase insert error:`, error.message);
                failed++;
            } else {
                console.log(`  ✅ Inserted`);
                succeeded++;
            }
        } catch (e: any) {
            console.error(`  ❌ Error for ${herb.herb_name}:`, e.message);
            failed++;
        }

        // Gemini free-tier rate limit: 60 req/min
        await new Promise(r => setTimeout(r, 1100));
    }

    console.log(`\n✅ Ingestion complete — ${succeeded} succeeded, ${failed} failed`);
}

ingest().catch(console.error);
