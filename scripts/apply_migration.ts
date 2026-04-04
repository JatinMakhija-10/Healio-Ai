/**
 * Patches the boericke_embeddings table via the Supabase Management API
 * Changes the vector dimension to 3072 to support gemini-embedding-001
 * Drops the HNSW index because pgvector restricts index dimensions to 2000.
 * For a dataset of ~1000 remedies, seq-scan exact search is completely fine.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    console.log("Patching boericke_embeddings table to 3072 dimensions directly...");

    const sql = `
      DROP TABLE IF EXISTS "boericke_embeddings";
      CREATE TABLE "boericke_embeddings" (
          id bigint primary key generated always as identity,
          remedy_name text not null,
          chunk_text text not null,
          embedding vector(3072)
      );
    `; // no vector index since dims > 2000

    await runSQL(sql, 'Create Vector Table (no index)');
}

main();
