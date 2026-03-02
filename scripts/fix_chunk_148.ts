import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PROJECT_REF = 'jqtfqseimrqusumznnpv';
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

async function runSQL(sql: string, label: string): Promise<boolean> {
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN!;
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql }),
    });

    if (response.ok) {
        console.log(`✅ ${label}`);
        return true;
    }
    const err = await response.text();
    let msg = err;
    try { msg = JSON.parse(err).error || JSON.parse(err).message || err; } catch { }
    console.log(`❌ ${label}: ${msg.substring(0, 200)}`);
    return false;
}

async function main() {
    console.log("Re-running chunk 148 without sym_xrefs...\n");
    const filePath = path.resolve(process.cwd(), 'sql_chunks/chunk_148.sql');
    let sql = fs.readFileSync(filePath, 'utf8');

    // Strip CREATE TABLE
    sql = sql.replace(/CREATE TABLE[^;]+;/g, '');

    // Strip sym_xrefs inserts
    sql = sql.replace(/INSERT INTO "sym_xrefs"[^;]+;/g, '');

    const sizeKB = Math.round(Buffer.byteLength(sql, 'utf8') / 1024);
    process.stdout.write(`chunk_148.sql (${sizeKB} KB)... `);

    const ok = await runSQL(sql, 'chunk_148_retry');
    if (ok) console.log("🎉 chunk 148 fixed!");
}

main();
