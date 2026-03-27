/**
 * Healio.AI — Ingest cure_minor.xlsx into Supabase
 *
 * Reads cure_minor.xlsx, splits remedies inside it by comma, generates Gemini
 * embeddings for each unique remedy/instruction, and inserts into the
 * home_remedy_embeddings table.
 *
 * Run: npx ts-node --esm scripts/ingest_cure_minor.ts
 */

import * as xlsx from 'xlsx';
import * as fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// xlsx set fs removed as it is not needed for readFile

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const geminiKey = process.env.GEMINI_API_KEY!;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
  console.error(
    '❌ Missing env vars. Check NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY in .env.local'
  );
  process.exit(1);
}

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

function buildChunkText(ailment: string, remedyInstruction: string): string {
  const lines = [
    `Ailment: ${ailment}`,
    `Remedy Name: Minor Home Treatment`,
    `Method: ${remedyInstruction.trim()}`,
    `Frequency: As needed`,
    `Indication: Minor ailment remedy`,
    `Safe for age: Adults and appropriately for others based on common sense`,
  ];
  return lines.filter(Boolean).join('\n');
}

async function ingest() {
  const filePath = path.resolve(process.cwd(), 'cure_minor.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Cannot find file at ${filePath}`);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const workbook = xlsx.read(fileBuffer);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // Read with header 1 so we get arrays of values per row
  const rawData: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const rows: {
    remedy_name: string;
    remedy_name_hindi: string | null;
    ailment: string;
    ailment_hindi: string;
    symptoms_keywords: string[];
    chunk_text: string;
  }[] = [];

  // Assuming top row might be headers or not. We'll just process everything that looks like [string, string].
  for (const record of rawData) {
    if (record.length < 2) continue;
    const ailmentRaw = record[0];
    const remediesRaw = record[1];

    if (typeof ailmentRaw !== 'string' || typeof remediesRaw !== 'string') continue;

    const ailment = ailmentRaw.trim();
    if (!ailment || ailment.toLowerCase() === 'ailment/disease name' || ailment.toLowerCase() === 'disease') {
      continue;
    }

    // Split remedies by comma to create individual instructions if needed, 
    // or keep them as one big chunk. Keeping them separate is usually better for semantic search.
    const remedyInstructions = remediesRaw.split(',').map(r => r.trim()).filter(Boolean);
    
    // If the comma separation creates too many fragments, we might just ingest the whole string.
    // Let's create one chunk per distinct instruction.
    for (const instruction of remedyInstructions) {
      if (instruction.length < 5) continue; // skip tiny fragments
      
      rows.push({
        remedy_name: "Minor Home Treatment",
        remedy_name_hindi: null,
        ailment: ailment,
        ailment_hindi: "", // Not provided in cure_minor
        symptoms_keywords: [ailment.toLowerCase()],
        chunk_text: buildChunkText(ailment, instruction),
      });
    }
  }

  console.log(`\n🌿 Starting Minor Home Remedy ingestion — ${rows.length} instructions to embed...\n`);

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    console.log(`[${i + 1}/${rows.length}] Embedding: ${row.ailment} - Instruction length: ${row.chunk_text.length}`);

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
    } catch (e: any) {
      console.error(`  ❌ Embedding error for ${row.ailment}:`, e.message);
      failed++;
    }

    // Respect Gemini rate limits (60 requests/min free tier => wait 1.1s)
    await new Promise(r => setTimeout(r, 1100));
  }

  console.log(`\n✅ Ingestion complete — ${succeeded} succeeded, ${failed} failed`);
}

ingest().catch(console.error);
