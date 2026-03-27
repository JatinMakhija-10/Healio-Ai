import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const geminiKey   = process.env.GEMINI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenAI({ apiKey: geminiKey });

async function generateEmbedding(text: string): Promise<number[]> {
    const res = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
    });
    if (!res.embeddings?.[0]?.values) throw new Error('Empty embedding response');
    return res.embeddings[0].values;
}

function buildChunkText(ailment: string, ailment_hindi: string, remedy: any): string {
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

async function run() {
    const dataPath = path.resolve(process.cwd(), 'data', 'home_remedies', 'nuskhe.json');
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Find one of the 197 newly added ones
    let testEntry = null;
    let testRemedy = null;
    for (const entry of rawData) {
        for (const remedy of entry.remedies) {
            if (remedy.name === "Minor Home Treatment") {
                testEntry = entry;
                testRemedy = remedy;
                break;
            }
        }
        if (testEntry) break;
    }

    if (!testEntry) {
        console.log("No newly added remedies found.");
        return process.exit(0);
    }

    const chunk_text = buildChunkText(testEntry.ailment, testEntry.ailment_hindi, testRemedy);
    console.log("Chunk Text:", chunk_text);
    
    try {
        const embedding = await generateEmbedding(chunk_text);
        
        const { error } = await supabase
            .from('home_remedy_embeddings')
            .insert({
                remedy_name: testRemedy.name,
                remedy_name_hindi: testRemedy.name_hindi || null,
                ailment: testEntry.ailment,
                ailment_hindi: testEntry.ailment_hindi || null,
                symptoms_keywords: testEntry.symptoms_keywords || [],
                chunk_text: chunk_text,
                embedding: embedding,
            });

        if (error) {
            console.error("SUPABASE ERROR:", error);
        } else {
            console.log("Insert Success!");
        }
    } catch(e) {
        console.error("API ERROR:", e);
    }
    process.exit(0);
}

run();
