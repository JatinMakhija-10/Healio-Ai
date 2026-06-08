import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// @ts-ignore
const pdfParse = require('pdf-parse');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const jinaKey = process.env.JINA_API_KEY!;

if (!supabaseUrl || !supabaseKey || !jinaKey) {
    console.error('❌ Missing env vars. Check NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JINA_API_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateJinaEmbedding(text: string, retries = 5, delay = 1000): Promise<number[]> {
    for (let i = 0; i < retries; i++) {
        const response = await fetch('https://api.jina.ai/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jinaKey}`,
            },
            body: JSON.stringify({
                model: 'jina-embeddings-v5-text-nano', // 768-dim, multilingual, confirmed active
                input: [text],
                dimensions: 768,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            return data.data[0].embedding;
        }

        if (response.status === 429) {
            console.log(`    ⚠️ Rate limited by Jina. Retrying in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
            continue;
        }

        if (response.status >= 500 || response.status === 422) {
            console.log(`    ⚠️ Jina error ${response.status}. Retrying in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
            continue;
        }

        throw new Error(`Jina API Error: ${response.status} ${response.statusText}`);
    }
    throw new Error('Jina API Error: Max retries reached');
}

// Helper to find all PDFs recursively
function findPdfs(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findPdfs(filePath, fileList);
        } else if (filePath.toLowerCase().endsWith('.pdf')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
        let end = i + chunkSize;
        if (end < text.length) {
            // Try to break at a newline or period
            const nextNewline = text.indexOf('\n', end - overlap);
            const nextPeriod = text.indexOf('. ', end - overlap);
            
            if (nextNewline !== -1 && nextNewline < end + overlap) {
                end = nextNewline + 1;
            } else if (nextPeriod !== -1 && nextPeriod < end + overlap) {
                end = nextPeriod + 2;
            }
        } else {
            end = text.length;
        }
        
        chunks.push(text.substring(i, end).trim());
        i = end - overlap;
        
        // Prevent infinite loops if no overlap progression
        if (i < 0 || end === text.length) break;
    }
    return chunks.filter(c => c.length > 50); // Filter out tiny fragments
}

async function ingestPdfs() {
    const rawDir = path.resolve(process.cwd(), 'NewBooks 2');
    const ocrDir = path.resolve(process.cwd(), 'NewBooks 2_needs_ocr');
    if (!fs.existsSync(ocrDir)) fs.mkdirSync(ocrDir, { recursive: true });

    const pdfFiles = findPdfs(rawDir);
    // Sort from smallest file to largest
    pdfFiles.sort((a, b) => fs.statSync(a).size - fs.statSync(b).size);

    console.log(`\n📚 Found ${pdfFiles.length} PDFs to ingest in NewBooks 2.\n`);

    let totalSucceeded = 0;
    let totalFailed = 0;

    for (let fIdx = 0; fIdx < pdfFiles.length; fIdx++) {
        const pdfPath = pdfFiles[fIdx];
        const fileName = path.basename(pdfPath);
        console.log(`[${fIdx + 1}/${pdfFiles.length}] Processing PDF: ${fileName}`);

        try {
            const dataBuffer = fs.readFileSync(pdfPath);
            const data = await pdfParse(dataBuffer);
            
            const rawText = data.text || '';
            const chunks = chunkText(rawText);

            if (chunks.length === 0 || (rawText.trim().length < 200 && data.numpages > 3)) {
                console.log(`  ⚠️  Looks like an image-only PDF (${rawText.length} chars over ${data.numpages} pages). Moving to OCR folder.`);
                fs.renameSync(pdfPath, path.join(ocrDir, fileName));
                continue;
            }
            
            console.log(`  -> Extracted ${data.numpages} pages, generated ${chunks.length} chunks.`);

            // Check database to resume/redo
            const { count } = await supabase
                .from('ayurvedic_pdf_embeddings')
                .select('*', { count: 'exact', head: true })
                .eq('source_file', fileName);

            if (count && count >= chunks.length - 2 && count <= chunks.length + 2) {
                console.log(`  -> Already fully ingested (${count} chunks found). Skipping.`);
                continue;
            } else if (count && count > 0) {
                console.log(`  -> Partial ingestion found (${count} chunks vs ${chunks.length} expected). Deleting old chunks to redo.`);
                await supabase.from('ayurvedic_pdf_embeddings').delete().eq('source_file', fileName);
            }

            let succeeded = 0;
            let failed = 0;

            for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
                const chunk = chunks[cIdx];
                
                try {
                    const embedding = await generateJinaEmbedding(chunk);

                    const { error } = await supabase
                        .from('ayurvedic_pdf_embeddings')
                        .insert({
                            source_file: fileName,
                            page_number: Math.floor((cIdx / chunks.length) * data.numpages) + 1, // rough estimate since pdf-parse strips page markers
                            chunk_text: chunk.replace(/\u0000/g, ''),
                            embedding,
                        });

                    if (error) {
                        console.error(`    ⚠️ Supabase error:`, error.message);
                        failed++;
                    } else {
                        succeeded++;
                    }
                } catch (e: any) {
                    // Only log occasional errors to avoid spamming console
                    if (failed < 5) console.error(`    ❌ Embedding error:`, e.message);
                    failed++;
                }

                // Respect Jina rate limits
                await new Promise(r => setTimeout(r, 200));
            }
            
            totalSucceeded += succeeded;
            totalFailed += failed;
            console.log(`  -> Finished ${fileName}: ${succeeded} chunks inserted, ${failed} failed.\n`);
            
        } catch (e: any) {
            console.error(`❌ Failed to parse PDF ${fileName}:`, e.message);
        }
    }

    console.log(`\n✅ PDF Ingestion Complete!`);
    console.log(`   Total chunks inserted: ${totalSucceeded}`);
    console.log(`   Total chunks failed: ${totalFailed}\n`);
}

ingestPdfs().catch(console.error);
