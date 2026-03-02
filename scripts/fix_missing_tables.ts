/**
 * Fixes the missing tables by extracting just the CREATE TABLE statements
 * from the original MySQL dump and sending them directly to Supabase.
 * Then re-imports the INSERT data for those tables.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PROJECT_REF = 'jqtfqseimrqusumznnpv';
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
const CHUNKS_DIR = path.resolve(process.cwd(), 'sql_chunks');

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
    console.log("Step 1: Creating missing tables from scratch...\n");

    // Manually create the tables that failed (extracted from the original MySQL dump)
    const createTables = `
CREATE TABLE IF NOT EXISTS "sym_src" (
  "id" SERIAL NOT NULL,
  "chapter" integer NOT NULL DEFAULT 0,
  "book" integer NOT NULL DEFAULT 0,
  "page" integer NOT NULL DEFAULT 0,
  "addition" varchar(100) NOT NULL DEFAULT '',
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sym_stats" (
  "id" SERIAL NOT NULL,
  "user" varchar(50) NOT NULL DEFAULT '',
  "symptom" integer NOT NULL DEFAULT 0,
  "remedy" integer NOT NULL DEFAULT 0,
  "date" timestamp NOT NULL DEFAULT '1970-01-01 00:00:00',
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sym_status" (
  "id" SERIAL NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sym_synonyms" (
  "id" SERIAL NOT NULL,
  "symptom" integer NOT NULL DEFAULT 0,
  "lang" varchar(5) NOT NULL DEFAULT 'en',
  "synonym" text NOT NULL,
  "user" varchar(50) NOT NULL DEFAULT 'admin',
  "date" timestamp NOT NULL DEFAULT '1970-01-01 00:00:00',
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sym_translations" (
  "id" SERIAL NOT NULL,
  "symptom" integer NOT NULL DEFAULT 0,
  "lang" varchar(5) NOT NULL DEFAULT 'en',
  "translation" text NOT NULL,
  "user" varchar(50) NOT NULL DEFAULT 'admin',
  "date" timestamp NOT NULL DEFAULT '1970-01-01 00:00:00',
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "symptoms" (
  "id" SERIAL NOT NULL,
  "rubric" varchar(255) NOT NULL DEFAULT '',
  "parent" integer NOT NULL DEFAULT 0,
  "level" smallint NOT NULL DEFAULT 0,
  "repertory" varchar(20) NOT NULL DEFAULT '',
  "count_english" integer NOT NULL DEFAULT 0,
  "count_all" integer NOT NULL DEFAULT 0,
  "author" varchar(50) NOT NULL DEFAULT 'admin',
  "date" timestamp NOT NULL DEFAULT '1970-01-01 00:00:00',
  PRIMARY KEY ("id")
);
`;

    await runSQL(createTables, "Created all missing tables");

    console.log("\nStep 2: Re-importing INSERT data for chunks 144-159...\n");

    // Now re-run all the chunks that failed due to missing tables
    const failedChunks = [
        'chunk_144.sql', 'chunk_145.sql', 'chunk_146.sql', 'chunk_147.sql',
        'chunk_148.sql', 'chunk_149.sql', 'chunk_150.sql', 'chunk_151.sql',
        'chunk_152.sql', 'chunk_153.sql', 'chunk_154.sql', 'chunk_155.sql',
        'chunk_156.sql', 'chunk_157.sql', 'chunk_158.sql', 'chunk_159.sql'
    ];

    let success = 0;
    let fail = 0;

    for (let i = 0; i < failedChunks.length; i++) {
        const filename = failedChunks[i];
        const filePath = path.join(CHUNKS_DIR, filename);
        if (!fs.existsSync(filePath)) { console.log(`SKIPPED: ${filename} not found`); continue; }

        const sql = fs.readFileSync(filePath, 'utf8').replace(/\\'/g, "''").replace(/\\\\/g, "\\");
        const sizeKB = Math.round(Buffer.byteLength(sql, 'utf8') / 1024);
        process.stdout.write(`[${i + 1}/${failedChunks.length}] ${filename} (${sizeKB} KB)... `);

        const ok = await runSQL(sql, filename);
        if (ok) success++; else fail++;
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Success: ${success}/${failedChunks.length}`);
    if (fail === 0) console.log(`🎉 ALL DONE! Database is fully populated!`);
    else console.log(`❌ Failed: ${fail} — these chunks may have encoding issues in INSERT data.`);
}

main();
