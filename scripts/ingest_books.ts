/**
 * Healio.AI — Ingest Ayurvedic Books into Supabase
 * ========================================================
 * Reads pre-processed `.jsonl` chunks from data/ayurveda/processed/
 * Generates Gemini embeddings and inserts into ayurvedic_knowledge_embeddings
 *
 * First run:
 *   Supabase Dashboard -> SQL -> Run `scripts/create_books_table.sql`
 * Then:
 *   npx ts-node scripts/ingest_books.ts
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const jinaKey = process.env.JINA_API_KEY;

if (!supabaseUrl || !supabaseKey || !jinaKey) {
    console.error('❌ Missing env vars. Check .env.local for JINA_API_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Types ────────────────────────────────────────────────────────────────────
type BookChunk = {
    id:         string;
    source:     string;
    book:       string;
    category:   string;
    page:       number;
    section:    string;
    text:       string;
    keywords:   string[];
    char_count: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
async function generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch('https://api.jina.ai/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jinaKey}`,
        },
        body: JSON.stringify({
            model: 'jina-embeddings-v5',
            input: [text],
            dimensions: 768,
        }),
    });
    
    if (!response.ok) {
        throw new Error(`Jina API Error: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data[0].embedding;
}

function buildChunkText(rec: BookChunk): string {
    return [
        `Book: ${rec.book}`,
        `Section: ${rec.section}`,
        `Keywords: ${rec.keywords.join(', ')}`,
        `Page: ${rec.page}`,
        `Content:`,
        rec.text
    ].join('\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function ingestFile(filename: string, existingTexts: Set<string>) {
    const filePath = path.resolve(process.cwd(), 'data', 'ayurveda', 'processed', filename);
    if (!fs.existsSync(filePath)) {
        console.log(`  [SKIP] File not found: ${filename}`);
        return;
    }

    console.log(`\n📚 Starting ingestion for ${filename}...\n`);
    
    let succeeded = 0;
    let failed    = 0;
    let lineCount = 0;

    const skipLines = filename === 'indian-medicinal-plants.jsonl' ? parseInt(process.argv[2] || '0', 10) : 0;
    if (skipLines > 0) {
        console.log(`  ⏩ Fast-forwarding ${filename}: Skipping the first ${skipLines} lines...`);
    }

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (!line.trim()) continue;
        lineCount++;
        
        if (lineCount < skipLines) {
            continue;
        }
        
        let rec: BookChunk;
        let chunk: string;
        try {
            rec = JSON.parse(line);
            chunk = buildChunkText(rec);
        } catch (err: any) {
            console.error(`  ❌ JSON Parse error line ${lineCount}:`, err.message);
            failed++;
            continue;
        }
        
        try {
            // Check memory cache first (instant)
            if (existingTexts.has(rec.text)) {
                if (lineCount % 1000 === 0) {
                    console.log(`  [${lineCount}] [FAST-SKIP] Continuously skipping cached chunks...`);
                }
                succeeded++;
                continue;
            }

            console.log(`  [${lineCount}] Pg ${rec.page} - ${rec.section.slice(0, 40)}`);

            const embedding = await generateEmbedding(chunk);

            const { error } = await supabase
                .from('ayurvedic_knowledge_embeddings')
                .insert({
                    source:      rec.source,
                    book:        rec.book,
                    category:    rec.category,
                    page:        rec.page,
                    section:     rec.section,
                    text:        rec.text,
                    keywords:    rec.keywords,
                    embedding,
                });

            if (error) {
                console.error(`  ⚠️ Supabase error:`, error.message);
                failed++;
            } else {
                succeeded++;
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            console.error(`  ❌ Error processing line ${lineCount}:`, String(e.message || e));
            failed++;
        }

        // Respect Jina rate limits: ~100 req/min
        await new Promise(r => setTimeout(r, 600));

        if (lineCount % 50 === 0) {
            console.log(`\n── Checkpoint: ${succeeded} ok, ${failed} failed so far ──\n`);
        }
    }

    console.log(`\n✅ Finished ${filename} — ${succeeded} succeeded, ${failed} failed`);
}

async function main() {
    const processedDir = path.resolve(process.cwd(), 'data', 'ayurveda', 'processed');
    if (!fs.existsSync(processedDir)) {
        console.error(`❌ Processed directory not found: ${processedDir}`);
        process.exit(1);
    }
    
    console.log("Loading existing DB records into memory to fast-skip duplicates...");
    const existingTexts = new Set<string>();
    let offset = 0;
    while (true) {
        const { data, error } = await supabase
            .from('ayurvedic_knowledge_embeddings')
            .select('text')
            .range(offset, offset + 999);
        if (error || !data || data.length === 0) break;
        data.forEach(d => existingTexts.add(d.text));
        offset += 1000;
    }
    console.log(`⚡ Loaded ${existingTexts.size} existing chunks. Skips will now happen in nanoseconds!\n`);

    // We start with Indian Medicinal Plants since it's the priority
    const priorityFile = 'indian-medicinal-plants.jsonl';
    await ingestFile(priorityFile, existingTexts);
    
    // Process other files listed in the directory
    const files = fs.readdirSync(processedDir).filter(f => f.endsWith('.jsonl') && f !== priorityFile);
    for (const f of files) {
        await ingestFile(f, existingTexts);
    }
}

main().catch(console.error);
