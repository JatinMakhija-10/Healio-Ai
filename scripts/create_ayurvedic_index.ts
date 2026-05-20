/**
 * Creates halfvec HNSW index on ayurvedic_knowledge_embeddings directly via
 * pg (bypasses PostgREST/Supabase SQL Editor timeout completely).
 *
 * Usage: npx tsx scripts/create_ayurvedic_index.ts
 *
 * Requires: DATABASE_URL in .env.local
 *   e.g. DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
 *   Find it in: Supabase Dashboard → Settings → Database → URI
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { Client } from 'pg';
import * as dns from 'dns';

// Parse connection string robustly — handles special chars like # in passwords
// by splitting on the known URL structure rather than using URL parser
function parseConnectionString(cs: string): { host: string; port: number; user: string; password: string; database: string } {
    // Format: postgresql://user:password@host:port/database
    // We can't use URL() because # in password breaks it
    const withoutScheme = cs.replace(/^postgresql:\/\/|^postgres:\/\//, '');
    const atIdx = withoutScheme.lastIndexOf('@');
    const userPass = withoutScheme.slice(0, atIdx);
    const hostDbPart = withoutScheme.slice(atIdx + 1);

    const colonIdx = userPass.indexOf(':');
    const user = userPass.slice(0, colonIdx);
    const password = userPass.slice(colonIdx + 1);

    const slashIdx = hostDbPart.indexOf('/');
    const hostPort = hostDbPart.slice(0, slashIdx);
    const database = hostDbPart.slice(slashIdx + 1);

    const portSep = hostPort.lastIndexOf(':');
    const host = hostPort.slice(0, portSep);
    const port = parseInt(hostPort.slice(portSep + 1), 10);

    return { host, port, user: user.split('.')[0], password, database };
}

function buildConfig() {
    const rawCS = process.env.SUPABASE_DB_CONNECTION_STRING || process.env.DATABASE_URL;
    const pass   = process.env.SUPABASE_DB_PASSWORD;
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

    if (rawCS) {
        const parsed = parseConnectionString(rawCS);
        const password = pass || parsed.password;
        const ref = supaUrl.replace('https://', '').replace('.supabase.co', '');

        // Direct connection on port 5432 with forced IPv4 (avoids IPv6 ETIMEDOUT)
        return {
            host:     `db.${ref}.supabase.co`,
            port:     5432,
            user:     'postgres',
            password,
            database: 'postgres',
            ssl:      { rejectUnauthorized: false },
            family:   4,   // force IPv4
        };
    }
    console.error('❌  Set SUPABASE_DB_CONNECTION_STRING in .env.local');
    process.exit(1);
}

async function resolveIPv4(hostname: string): Promise<string> {
    return new Promise((resolve, reject) => {
        dns.resolve4(hostname, (err, addresses) => {
            if (err) reject(err);
            else resolve(addresses[0]);
        });
    });
}

async function main() {
    const config = buildConfig() as any;
    console.log(`🔍  Resolving ${config.host} to IPv4...`);
    try {
        const ipv4 = await resolveIPv4(config.host);
        console.log(`    → ${ipv4}\n`);
        config.host = ipv4;
    } catch {
        console.log('    (Could not resolve IPv4, proceeding with hostname)\n');
    }
    const client = new Client(config);
    await client.connect();
    console.log('✅  Connected to Postgres\n');

    console.log('🗑️   Dropping old index if exists...');
    await client.query('DROP INDEX IF EXISTS idx_ayurvedic_knowledge_halfvec_hnsw;');
    console.log('    Done.\n');

    console.log('⏳  Building halfvec HNSW index on ayurvedic_knowledge_embeddings (26K rows)...');
    console.log('    This takes 1-3 minutes. Do not interrupt.\n');

    const t0 = Date.now();
    await client.query(`
        CREATE INDEX idx_ayurvedic_knowledge_halfvec_hnsw
            ON ayurvedic_knowledge_embeddings
            USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops)
            WITH (m = 8, ef_construction = 32);
    `);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`✅  Index created in ${elapsed}s\n`);

    const { rows } = await client.query(`
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'ayurvedic_knowledge_embeddings';
    `);
    console.log('Current indexes on ayurvedic_knowledge_embeddings:');
    rows.forEach(r => console.log(`  - ${r.indexname}`));

    await client.end();
    console.log('\n✅  Done. Run "npm run eval:rag" to verify recall.\n');
}

main().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
