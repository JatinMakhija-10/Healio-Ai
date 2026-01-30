import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use Service Role for ingestion
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_API_KEY) {
    console.error("Missing Environment Variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or OPENAI_API_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// --- TYPES ---
interface RawCondition {
    code: string;
    name: string;
    description: string;
    prevalence?: string;
    severity?: string;
    symptoms_text: string; // Used to generate embedding
    match_criteria: any;
    red_flags?: string[];
}

// --- UTILS ---
async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small", // Cost effective, 1536d
            input: text.replace(/\n/g, ' '),
        });
        return response.data[0].embedding;
    } catch (e) {
        console.error("Error generating embedding:", e);
        throw e;
    }
}

// --- INGESTION LOGIC ---
async function ingestConditions(filePath: string) {
    console.log(`Starting ingestion from ${filePath}...`);

    // In a real scenario, stream this file or parse CSV
    // specific implementation depends on file format (JSON for now)
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const conditions: RawCondition[] = JSON.parse(rawData);

    console.log(`Found ${conditions.length} conditions.`);

    let successCount = 0;
    let errorCount = 0;

    for (const [index, con] of conditions.entries()) {
        try {
            console.log(`Processing [${index + 1}/${conditions.length}] ${con.name}...`);

            // 1. Generate Embedding
            // Combine critical fields for semantic search
            const embeddingText = `${con.name}: ${con.description}. Symptoms: ${con.symptoms_text}`;
            const embedding = await generateEmbedding(embeddingText);

            // 2. Upsert to Supabase
            const { error } = await supabase.from('conditions').upsert({
                code: con.code,
                name: con.name,
                description: con.description,
                match_criteria: con.match_criteria,
                prevalence: con.prevalence,
                severity: con.severity,
                red_flags: con.red_flags,
                embedding: embedding
            }, { onConflict: 'code' });

            if (error) throw error;

            successCount++;
        } catch (err) {
            console.error(`Failed to ingest ${con.code}:`, err);
            errorCount++;
        }
    }

    console.log(`\nIngestion Complete.`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

// --- EXECUTION ---
// Example usage: npx tsx scripts/ingest_conditions.ts data/icd10_subset.json
const dataFile = process.argv[2];
if (!dataFile) {
    console.log("Usage: npx tsx scripts/ingest_conditions.ts <path-to-json-file>");
    // Initial Test / Dry Run if no file provided?
    console.log("No file provided. Exiting.");
} else {
    ingestConditions(dataFile);
}
