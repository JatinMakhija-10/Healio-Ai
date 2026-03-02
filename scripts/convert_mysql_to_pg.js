/**
 * Converts a MySQL SQL dump to PostgreSQL-compatible SQL and splits into chunks.
 * V2 — Handles all MySQL quirks found during the first import attempt.
 * 
 * USAGE: node scripts/convert_mysql_to_pg.js
 * OUTPUT: ./sql_chunks/chunk_001.sql, chunk_002.sql, ...
 */

const fs = require('fs');
const path = require('path');

const SQL_FILE = path.resolve(__dirname, '..', 'OpenHomeopath.sql', 'OpenHomeopath.sql');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'sql_chunks');
const MAX_CHUNK_BYTES = 700 * 1024; // 700KB per chunk

// Clean output directory
if (fs.existsSync(OUTPUT_DIR)) {
    fs.readdirSync(OUTPUT_DIR).forEach(f => fs.rmSync(path.join(OUTPUT_DIR, f)));
} else {
    fs.mkdirSync(OUTPUT_DIR);
}

console.log("Reading SQL file...");
const raw = fs.readFileSync(SQL_FILE, 'utf8');
console.log(`File size: ${Math.round(raw.length / 1024 / 1024)} MB — Converting MySQL → PostgreSQL (v2)...`);

function convertMySQLToPostgres(sql) {
    let result = sql;

    // ── Phase 1: Remove MySQL-only constructs ──

    // Remove /*!40101 ... */ style MySQL version-conditional comments
    result = result.replace(/\/\*!\d+[^*]*\*\//g, '');

    // Remove SET statements (SET NAMES, SET character_set, etc.)
    result = result.replace(/^SET\s+.*?;\s*$/gim, '');

    // Remove LOCK TABLES / UNLOCK TABLES
    result = result.replace(/^LOCK TABLES\s+.*?;\s*$/gim, '');
    result = result.replace(/^UNLOCK TABLES\s*;\s*$/gim, '');

    // Remove DROP TABLE IF EXISTS (let PG handle it with IF NOT EXISTS on CREATE)
    // Actually, keep DROP TABLE but fix syntax
    result = result.replace(/DROP TABLE IF EXISTS\s+`([^`]+)`\s*;/gi, 'DROP TABLE IF EXISTS "$1" CASCADE;');

    // ── Phase 2: Replace identifiers ──

    // Replace backtick identifiers with double-quotes
    result = result.replace(/`([^`]+)`/g, '"$1"');

    // ── Phase 3: Fix CREATE TABLE syntax ──

    // Remove ENGINE=... DEFAULT CHARSET=... at end of CREATE TABLE
    result = result.replace(/\)\s*ENGINE\s*=\s*[^;]+;/gi, ');');

    // Convert AUTO_INCREMENT columns
    result = result.replace(/\binteger\s+NOT\s+NULL\s+AUTO_INCREMENT/gi, 'SERIAL NOT NULL');
    result = result.replace(/\bint\(\d+\)\s+NOT\s+NULL\s+AUTO_INCREMENT/gi, 'SERIAL NOT NULL');
    result = result.replace(/\bAUTO_INCREMENT\s*=?\s*\d*/gi, '');

    // Remove ON UPDATE CURRENT_TIMESTAMP (not supported in PG)
    result = result.replace(/\s*ON\s+UPDATE\s+CURRENT_TIMESTAMP/gi, '');

    // Remove MySQL KEY declarations inside CREATE TABLE (non-PRIMARY KEY index hints)
    // Match: KEY "name" ("col1","col2"...)  or  UNIQUE KEY "name" (...)
    result = result.replace(/,\s*(?:UNIQUE\s+)?KEY\s+"[^"]*"\s*\([^)]*\)/gi, '');

    // ── Phase 4: Fix data types ──

    result = result.replace(/\bint\(\d+\)/gi, 'integer');
    result = result.replace(/\btinyint\(\d+\)/gi, 'smallint');
    result = result.replace(/\bsmallint\(\d+\)/gi, 'smallint');
    result = result.replace(/\bmediumint\(\d+\)/gi, 'integer');
    result = result.replace(/\bbigint\(\d+\)/gi, 'bigint');
    result = result.replace(/\bdouble\b/gi, 'double precision');
    result = result.replace(/\bfloat\(\d+,\d+\)/gi, 'real');
    result = result.replace(/\bdatetime\b/gi, 'timestamp');
    result = result.replace(/\b(tiny|medium|long)blob\b/gi, 'bytea');
    result = result.replace(/\b(tiny|medium|long)text\b/gi, 'text');
    result = result.replace(/\benum\s*\([^)]+\)/gi, 'text'); // enum → text
    result = result.replace(/\bset\s*\([^)]+\)/gi, 'text'); // set → text

    // Remove UNSIGNED (not supported in PG)
    result = result.replace(/\bUNSIGNED\b/gi, '');

    // Remove CHARACTER SET / COLLATE declarations
    result = result.replace(/\s*CHARACTER\s+SET\s+\w+/gi, '');
    result = result.replace(/\s*COLLATE\s+\w+/gi, '');
    result = result.replace(/\s*DEFAULT\s+CHARSET\s*=\s*\w+/gi, '');

    // Convert MySQL binary literals
    result = result.replace(/DEFAULT\s+b'0'/gi, "DEFAULT false");
    result = result.replace(/DEFAULT\s+b'1'/gi, "DEFAULT true");

    // ── Phase 5: Fix invalid date values ──

    // MySQL allows '0000-00-00 00:00:00' but PG does not
    result = result.replace(/'0000-00-00 00:00:00'/g, "'1970-01-01 00:00:00'");
    result = result.replace(/'0000-00-00'/g, "'1970-01-01'");

    // ── Phase 6: Fix INSERT escaping ──

    // MySQL uses \' for escaping inside strings, PG uses ''
    // This is tricky — we need to be careful not to break valid content
    // Replace escaped quotes in INSERT values: \' → ''
    result = result.replace(/\\'/g, "''");
    // Replace \\ → \ (MySQL double-escape)
    result = result.replace(/\\\\/g, "\\");

    // ── Phase 7: Clean up ──

    // Remove empty statements (just semicolons)
    result = result.replace(/^\s*;\s*$/gm, '');
    // Remove excessive blank lines
    result = result.replace(/(\n\s*){3,}/g, '\n\n');

    return result.trim();
}

const converted = convertMySQLToPostgres(raw);
console.log("Conversion done! Splitting into chunks...\n");

// Split by semicolons (statement boundaries)
let chunkIndex = 0;
let currentChunk = '';
let writtenChunks = 0;
let totalStatements = 0;

function writeChunk(content) {
    const trimmed = content.trim();
    if (!trimmed || trimmed === ';') return;
    chunkIndex++;
    const chunkFilename = `chunk_${String(chunkIndex).padStart(3, '0')}.sql`;
    const chunkPath = path.join(OUTPUT_DIR, chunkFilename);
    fs.writeFileSync(chunkPath, trimmed, 'utf8');
    const sizeKB = Math.round(Buffer.byteLength(trimmed, 'utf8') / 1024);
    process.stdout.write(`  ✅ ${chunkFilename} (${sizeKB} KB)\n`);
    writtenChunks++;
}

// Use a streaming approach to split by semicolons
// We need to be careful about semicolons inside string literals
let inString = false;
let stringChar = '';
let statementStart = 0;

for (let i = 0; i < converted.length; i++) {
    const ch = converted[i];
    const prev = i > 0 ? converted[i - 1] : '';

    if (!inString) {
        if (ch === "'" || ch === '"') {
            inString = true;
            stringChar = ch;
        } else if (ch === ';') {
            const statement = converted.substring(statementStart, i + 1).trim();
            statementStart = i + 1;

            if (statement && statement !== ';') {
                currentChunk += statement + '\n';
                totalStatements++;

                if (Buffer.byteLength(currentChunk, 'utf8') >= MAX_CHUNK_BYTES) {
                    writeChunk(currentChunk);
                    currentChunk = '';
                }
            }
        }
    } else {
        // Inside a string
        if (ch === stringChar && prev !== '\\') {
            inString = false;
        }
    }
}

// Write remaining content
if (currentChunk.trim()) {
    writeChunk(currentChunk);
}

console.log(`\nTotal SQL statements: ${totalStatements}`);
console.log(`🎉 Done! Created ${writtenChunks} PostgreSQL-compatible chunks in ./sql_chunks/`);
console.log("\nNow run: npx tsx scripts/auto_import.ts");
