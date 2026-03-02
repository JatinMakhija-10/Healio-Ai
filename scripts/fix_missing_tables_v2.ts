/**
 * Fixes the missing tables by dropping the incorrectly generated ones
 * and using the exact original schema from OpenHomeopath.sql.
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
    console.log("Step 1: Dropping wrong tables and creating correct ones...\n");

    const fixTablesSQL = `
DROP TABLE IF EXISTS "sym_src" CASCADE;
DROP TABLE IF EXISTS "sym_stats" CASCADE;
DROP TABLE IF EXISTS "sym_status" CASCADE;
DROP TABLE IF EXISTS "sym_synonyms" CASCADE;
DROP TABLE IF EXISTS "sym_translations" CASCADE;
DROP TABLE IF EXISTS "symptoms" CASCADE;

CREATE TABLE "sym_src" (
  "sym_id" integer NOT NULL,
  "src_id" varchar(12) NOT NULL,
  "src_page" smallint NOT NULL,
  "extra" text NOT NULL,
  "kuenzli" smallint NOT NULL DEFAULT 0,
  "username" varchar(30) NOT NULL,
  "timestamp" timestamp NOT NULL DEFAULT '1970-01-01 00:00:00'
);

CREATE TABLE "sym_stats" (
  "sym_table" varchar(255) NOT NULL,
  "sym_base_table" varchar(15) NOT NULL,
  "sym_count" integer NOT NULL,
  "username" varchar(30) NOT NULL,
  "timestamp" timestamp NOT NULL DEFAULT '1970-01-01 00:00:00',
  PRIMARY KEY ("sym_table")
);

CREATE TABLE "sym_status" (
  "status_id" smallint NOT NULL,
  "status_de" varchar(64) NOT NULL,
  "status_en" varchar(64) NOT NULL,
  "status_symbol" char(2) NOT NULL,
  "status_grade" smallint NOT NULL,
  PRIMARY KEY ("status_id")
);

CREATE TABLE "sym_synonyms" (
  "syn_id" integer NOT NULL,
  PRIMARY KEY ("syn_id")
);

CREATE TABLE "sym_translations" (
  "sym_id" integer NOT NULL,
  "symptom" text NOT NULL,
  "lang_id" varchar(6) NOT NULL,
  "username" varchar(30) NOT NULL,
  "timestamp" timestamp NOT NULL DEFAULT '1970-01-01 00:00:00',
  PRIMARY KEY ("sym_id","lang_id")
);

CREATE TABLE "symptoms" (
  "sym_id" integer NOT NULL,
  "symptom" text NOT NULL,
  "pid" integer NOT NULL DEFAULT 0,
  "rubric_id" smallint NOT NULL,
  "lang_id" varchar(6) NOT NULL,
  "translation" smallint NOT NULL DEFAULT 0,
  "syn_id" integer NOT NULL DEFAULT 0,
  "xref_id" integer NOT NULL DEFAULT 0,
  "username" varchar(30) NOT NULL,
  "timestamp" timestamp NOT NULL DEFAULT '1970-01-01 00:00:00',
  PRIMARY KEY ("sym_id")
);
`;

    await runSQL(fixTablesSQL, "Recreated all missing tables with proper schema");

    console.log("\nStep 2: Re-importing INSERT data for chunks 144-159...\n");

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

        let sql = fs.readFileSync(filePath, 'utf8');
        // Let's pass the raw SQL directly, our convert_mysql_to_pg script already did replacing \' -> '' and \\ -> \.
        // Doing it again here will corrupt strings if they already have ''!
        // So we will just use the sql verbatim.

        // Wait, the chunk_148.sql had a syntax error.
        // LINE 18:   PRIMARY KEY ("sym_id"),"rubric_id","lang_id","translation")),
        // That came from UNIQUE KEY "sym_rubric_lang" ("symptom"(326),"rubric_id","lang_id","translation"),
        // But chunk_148 contains a CREATE TABLE "symptoms" ... we JUST created it!
        // We probably don't need chunk_148 to recreate the table, since we just did it.
        // We'll strip CREATE TABLE statements from these chunks just in case to avoid re-creation errors.

        sql = sql.replace(/CREATE TABLE[^;]+;/g, '');

        const sizeKB = Math.round(Buffer.byteLength(sql, 'utf8') / 1024);
        process.stdout.write(`[${i + 1}/${failedChunks.length}] ${filename} (${sizeKB} KB)... `);

        if (sql.trim().length === 0) {
            console.log("Empty chunk after stripping CREATE TABLE. Skipping.");
            continue;
        }

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
