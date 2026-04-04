import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Setup clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Needed for bypassing RLS during insert
const geminiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !geminiKey) {
    console.error("Missing required environment variables. Please check .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!);
const ai = new GoogleGenAI({ apiKey: geminiKey });

async function downloadBoerickeText() {
    const url = 'https://archive.org/download/pocketmanualhom00boergoog/pocketmanualhom00boergoog_djvu.txt';
    const destPath = path.resolve(process.cwd(), 'scripts', 'boericke.txt');

    if (fs.existsSync(destPath)) {
        console.log("Boericke text already downloaded.");
        return fs.readFileSync(destPath, 'utf8');
    }

    console.log("Downloading Boericke text from archive.org...");
    const response = await fetch(url);
    const text = await response.text();
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, text);
    return text;
}

// Very basic chunking by remedy (remedies in Boericke are usually all caps at the start of a line)
function parseChunks(text: string) {
    const chunks: { name: string; text: string }[] = [];

    // The DJVU text from archive.org is messy OCR.
    // We'll split by double newlines and treat large blocks as chunks.
    // In a production app, we would parse the exact remedy names perfectly.
    const lines = text.split('\n');
    let currentRemedy = "INTRODUCTION";
    let currentChunk = "";

    // Very simplistic parsing block:
    for (const line of lines) {
        // If line is short and all caps, it MIGHT be a remedy name
        if (line.trim().length > 2 && line.trim().length < 30 && line === line.toUpperCase() && !(/[0-9]/.test(line))) {
            if (currentChunk.length > 200) { // Only save if we gathered enough text
                chunks.push({ name: currentRemedy, text: currentChunk.trim() });
            }
            currentRemedy = line.trim();
            currentChunk = "";
        } else {
            currentChunk += line + " ";
        }
    }

    // push last chunk
    if (currentChunk.length > 200) {
        chunks.push({ name: currentRemedy, text: currentChunk.trim() });
    }

    return chunks;
}

async function ingest() {
    try {
        const rawText = await downloadBoerickeText();
        const chunks = parseChunks(rawText);

        console.log(`Parsed ${chunks.length} chunks from Boericke text.`);

        console.log(`Processing all ${chunks.length} chunks...`);

        const chunksToProcess = chunks;

        for (let i = 0; i < chunksToProcess.length; i++) {
            const chunk = chunksToProcess[i];
            console.log(`[${i + 1}/${chunksToProcess.length}] Embedding ${chunk.name}...`);

            try {
                // The @google/genai SDK v1 might need explicitly 'gemini-embedding-001'
                const response = await ai.models.embedContent({
                    model: 'gemini-embedding-001',
                    contents: chunk.text, // The unified SDK accepts strings natively here! Let's pass string.
                });

                if (!response.embeddings || !response.embeddings[0]) throw new Error("No embedding returned");
                const embedding = response.embeddings[0].values;

                const { error } = await supabase
                    .from('boericke_embeddings')
                    .insert({
                        remedy_name: chunk.name,
                        chunk_text: chunk.text,
                        embedding: embedding
                    });

                if (error) {
                    console.error("Error inserting to Supabase:", error);
                }

                // Sleep to avoid rate limits
                await new Promise(r => setTimeout(r, 1000));
            } catch (e) {
                console.error(`Failed to embed ${chunk.name}:`, e);
            }
        }

        console.log("Ingestion complete!");
    } catch (error) {
        console.error("Ingestion failed:", error);
    }
}

ingest();
