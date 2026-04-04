/**
 * Splits a large MySQL/PostgreSQL SQL file into smaller chunks by statement boundary.
 * Each chunk ends at a semicolon, making every chunk a valid, runnable SQL script.
 * 
 * USAGE: node scripts/split_sql.js
 * OUTPUT: ./sql_chunks/chunk_001.sql, chunk_002.sql, ...
 */

const fs = require('fs');
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const readline = require('readline');

// --- Config ---
const SQL_FILE = path.resolve(__dirname, '..', 'OpenHomeopath.sql', 'OpenHomeopath.sql');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'sql_chunks');
const MAX_CHUNK_SIZE = 800 * 1024; // 800 KB per chunk (Supabase editor limit is ~1MB)

// Ensure output directory exists and is empty
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
} else {
    // Delete old chunks
    fs.readdirSync(OUTPUT_DIR).forEach(f => fs.rmSync(path.join(OUTPUT_DIR, f)));
}

console.log(`Reading SQL file: ${SQL_FILE}`);
console.log(`File size: ${Math.round(fs.statSync(SQL_FILE).size / 1024 / 1024)} MB`);
console.log("Splitting by statement boundaries (semicolons)...\n");

let chunkIndex = 0;
let currentChunk = '';
let writtenChunks = 0;

function writeChunk(content) {
    chunkIndex++;
    const chunkFilename = `chunk_${String(chunkIndex).padStart(3, '0')}.sql`;
    const chunkPath = path.join(OUTPUT_DIR, chunkFilename);
    fs.writeFileSync(chunkPath, content.trim(), 'utf8');
    const sizeKB = Math.round(Buffer.byteLength(content, 'utf8') / 1024);
    console.log(`  ✅ ${chunkFilename} (${sizeKB} KB)`);
    writtenChunks++;
}

// Stream the file to handle 160MB without loading all at once
const fileStream = fs.createReadStream(SQL_FILE, { encoding: 'utf8' });

let buffer = '';

fileStream.on('data', (data) => {
    buffer += data;

    // Process complete statements from the buffer
    let semicolonIndex;
    while ((semicolonIndex = buffer.indexOf(';')) !== -1) {
        const statement = buffer.substring(0, semicolonIndex + 1);
        buffer = buffer.substring(semicolonIndex + 1);

        currentChunk += statement + '\n';

        // If chunk is large enough, write it out
        if (Buffer.byteLength(currentChunk, 'utf8') >= MAX_CHUNK_SIZE) {
            writeChunk(currentChunk);
            currentChunk = '';
        }
    }
});

fileStream.on('end', () => {
    // Write remaining content
    if (buffer.trim()) {
        currentChunk += buffer;
    }
    if (currentChunk.trim()) {
        writeChunk(currentChunk);
    }

    console.log(`\n🎉 Done! Split into ${writtenChunks} chunks in ./sql_chunks/`);
    console.log("\n📋 HOW TO IMPORT INTO SUPABASE:");
    console.log("1. Go to Supabase → SQL Editor");
    console.log("2. Paste chunk_001.sql and click RUN");
    console.log("3. Wait for success, then paste chunk_002.sql");
    console.log("4. Repeat until all chunks are done!");
    console.log("\n⚠️  If a chunk fails, check the error. You may need to skip MySQL-specific syntax.");
});

fileStream.on('error', (err) => {
    console.error("Error reading file:", err.message);
});
