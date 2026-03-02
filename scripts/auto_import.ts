/**
 * Automated SQL Import via Supabase Management API (HTTPS / IPv4 compatible!)
 * 
 * This script reads each SQL chunk and sends it to Supabase's Management API
 * over regular HTTPS, bypassing all IPv4/IPv6/pooler issues.
 * 
 * SETUP: You need a Supabase access token.
 *   1. Go to https://supabase.com/dashboard/account/tokens
 *   2. Click "Generate new token"
 *   3. Copy the token
 *   4. Add to .env.local: SUPABASE_ACCESS_TOKEN="your_token_here"
 * 
 * USAGE: npx tsx scripts/auto_import.ts
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CHUNKS_DIR = path.resolve(process.cwd(), 'sql_chunks');
const PROJECT_REF = 'jqtfqseimrqusumznnpv';
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

async function main() {
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

    if (!accessToken) {
        console.error("❌ Missing SUPABASE_ACCESS_TOKEN in .env.local");
        console.error("");
        console.error("To get your token:");
        console.error("1. Go to https://supabase.com/dashboard/account/tokens");
        console.error("2. Click 'Generate new token', give it a name like 'sql-import'");
        console.error("3. Copy the token");
        console.error("4. Add this line to your .env.local file:");
        console.error('   SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxxxxxxxxxx"');
        process.exit(1);
    }

    // Get all chunk files sorted
    const chunkFiles = fs.readdirSync(CHUNKS_DIR)
        .filter(f => f.startsWith('chunk_') && f.endsWith('.sql'))
        .sort();

    console.log(`Found ${chunkFiles.length} SQL chunks to import.`);
    console.log(`Using Supabase Management API (HTTPS/IPv4) ✅\n`);

    let successCount = 0;
    let failCount = 0;
    const failures: string[] = [];

    for (let i = 0; i < chunkFiles.length; i++) {
        const file = chunkFiles[i];
        const filePath = path.join(CHUNKS_DIR, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        const sizeKB = Math.round(Buffer.byteLength(sql, 'utf8') / 1024);

        process.stdout.write(`[${i + 1}/${chunkFiles.length}] ${file} (${sizeKB} KB)... `);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: sql }),
            });

            if (response.ok) {
                console.log('✅');
                successCount++;
            } else {
                const errorText = await response.text();
                console.log('❌');

                // Extract just the error message, not the full response
                let shortError = errorText.substring(0, 200);
                try {
                    const parsed = JSON.parse(errorText);
                    shortError = parsed.error || parsed.message || shortError;
                } catch { }

                console.log(`   Error: ${shortError}`);
                failures.push(`${file}: ${shortError}`);
                failCount++;
            }
        } catch (err: any) {
            console.log('❌ Network error');
            console.log(`   ${err.message}`);
            failures.push(`${file}: ${err.message}`);
            failCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Success: ${successCount}/${chunkFiles.length}`);
    if (failCount > 0) {
        console.log(`❌ Failed: ${failCount}`);
        console.log(`\nFailed chunks:`);
        failures.forEach(f => console.log(`  - ${f}`));
    } else {
        console.log(`\n🎉 ALL CHUNKS IMPORTED SUCCESSFULLY!`);
    }
}

main();
