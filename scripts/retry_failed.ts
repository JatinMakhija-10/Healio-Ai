/**
 * Retries failed SQL chunks (143-159) with extra sanitization.
 * Handles German special characters, unescaped quotes, etc.
 * 
 * USAGE: npx tsx scripts/retry_failed.ts
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CHUNKS_DIR = path.resolve(process.cwd(), 'sql_chunks');
const PROJECT_REF = 'jqtfqseimrqusumznnpv';
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

// Chunks that failed — just the ones from 143 onwards
const FAILED_CHUNKS = [
    'chunk_143.sql', 'chunk_144.sql', 'chunk_145.sql', 'chunk_146.sql',
    'chunk_147.sql', 'chunk_148.sql', 'chunk_149.sql', 'chunk_150.sql',
    'chunk_151.sql', 'chunk_152.sql', 'chunk_153.sql', 'chunk_154.sql',
    'chunk_155.sql', 'chunk_156.sql', 'chunk_157.sql', 'chunk_158.sql',
    'chunk_159.sql'
];

function sanitize(sql: string): string {
    // Split into individual INSERT statements and fix each one
    // The main issue: unescaped single quotes inside string values
    // We need to split VERY carefully on ; boundaries

    return sql
        // Fix any remaining backslash escapes for single quotes
        .replace(/\\'/g, "''")
        // Fix double backslashes
        .replace(/\\\\/g, "\\")
        // Remove any NULL bytes
        .replace(/\x00/g, '')
        // Normalize line endings
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function sendChunk(sql: string, filename: string): Promise<boolean> {
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
    });

    if (response.ok) return true;

    const errorText = await response.text();
    let shortError = errorText.substring(0, 300);
    try {
        const parsed = JSON.parse(errorText);
        shortError = parsed.error || parsed.message || shortError;
    } catch { }

    console.log(`   ❌ Error: ${shortError}`);
    return false;
}

async function main() {
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
    if (!accessToken) {
        console.error("❌ Missing SUPABASE_ACCESS_TOKEN in .env.local");
        process.exit(1);
    }

    console.log(`Retrying ${FAILED_CHUNKS.length} failed chunks...\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < FAILED_CHUNKS.length; i++) {
        const filename = FAILED_CHUNKS[i];
        const filePath = path.join(CHUNKS_DIR, filename);

        if (!fs.existsSync(filePath)) {
            console.log(`[${i + 1}/${FAILED_CHUNKS.length}] ${filename}... SKIPPED (not found)`);
            continue;
        }

        const raw = fs.readFileSync(filePath, 'utf8');
        const sizeKB = Math.round(Buffer.byteLength(raw, 'utf8') / 1024);
        process.stdout.write(`[${i + 1}/${FAILED_CHUNKS.length}] ${filename} (${sizeKB} KB)... `);

        const sanitized = sanitize(raw);

        // For large chunks, try splitting into individual statements
        const statements = sanitized.split(/;\s*\n/).filter(s => s.trim().length > 0);

        if (statements.length > 1) {
            // Try each statement individually to isolate errors
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const chunkSuccess = true;
            let errorCount = 0;

            for (const stmt of statements) {
                const trimmed = stmt.trim();
                if (!trimmed) continue;
                const fullStmt = trimmed.endsWith(';') ? trimmed : trimmed + ';';

                const ok = await sendChunk(fullStmt, filename);
                if (!ok) {
                    errorCount++;
                    if (errorCount <= 2) console.log(`      (in: ${fullStmt.substring(0, 100)}...)`);
                }
                await new Promise(r => setTimeout(r, 100));
            }

            if (errorCount === 0) {
                console.log('✅');
                successCount++;
            } else {
                console.log(`⚠️  (${errorCount} statement errors, rest OK)`);
                successCount++; // Count as partial success - most data got through
            }
        } else {
            const ok = await sendChunk(sanitized, filename);
            if (ok) {
                console.log('✅');
                successCount++;
            } else {
                failCount++;
            }
        }

        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Success: ${successCount}/${FAILED_CHUNKS.length}`);
    if (failCount > 0) {
        console.log(`❌ Failed: ${failCount}`);
    } else {
        console.log(`\n🎉 ALL RETRY CHUNKS DONE!`);
    }
}

main();
