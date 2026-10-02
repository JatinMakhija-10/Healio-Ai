import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function main() {
    const sqlFilePath = path.join(__dirname, 'create_reingest_helpers.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    console.log('Testing direct IPv6 address string...');
    const pwd = encodeURIComponent(process.env.SUPABASE_DB_PASSWORD || '');
    const connStr = `postgresql://postgres:${pwd}@[2406:da1a:6b0:f61f:da9a:2d79:6e4d:6257]:5432/postgres`;

    const sql = postgres(connStr, {
        ssl: { rejectUnauthorized: false },
        max: 1,
        idle_timeout: 5,
        connect_timeout: 8
    });

    try {
        console.log('Connecting to [2406:da1a:6b0:f61f:da9a:2d79:6e4d:6257]:5432...');
        await sql.unsafe(sqlContent);
        console.log('\n======================================================');
        console.log('✅ SUCCESS! Executed SQL helper script via direct IPv6 IP!');
        console.log('======================================================\n');
        await sql.end();
        process.exit(0);
    } catch (err: any) {
        console.error('FAILED:', err.message || err);
        await sql.end().catch(() => {});
        process.exit(1);
    }
}

main();
