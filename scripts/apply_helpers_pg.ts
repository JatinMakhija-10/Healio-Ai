import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function main() {
    const sqlFilePath = path.join(__dirname, 'create_reingest_helpers.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    const poolers = [
        { host: 'aws-0-ap-south-1.pooler.supabase.com', port: 5432 },
        { host: 'aws-0-ap-south-1.pooler.supabase.com', port: 6543 },
        { host: 'aws-0-ap-southeast-1.pooler.supabase.com', port: 5432 },
        { host: 'aws-0-ap-southeast-1.pooler.supabase.com', port: 6543 },
        { host: 'aws-0-us-east-1.pooler.supabase.com', port: 5432 },
        { host: 'aws-0-us-east-1.pooler.supabase.com', port: 6543 },
        { host: 'aws-0-eu-central-1.pooler.supabase.com', port: 5432 },
        { host: 'aws-0-eu-central-1.pooler.supabase.com', port: 6543 },
    ];

    for (const p of poolers) {
        console.log(`Trying pooler ${p.host}:${p.port}...`);
        const client = new Client({
            host: p.host,
            port: p.port,
            user: 'postgres.jqtfqseimrqusumznnpv',
            password: process.env.SUPABASE_DB_PASSWORD || '',
            database: 'postgres',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000
        });

        try {
            await client.connect();
            console.log('\n======================================================');
            console.log(`✅ CONNECTED to ${p.host}:${p.port}! Executing SQL...`);
            await client.query(sqlContent);
            console.log('✅ SUCCESS! Executed SQL helper script!');
            console.log('======================================================\n');
            await client.end();
            process.exit(0);
        } catch (err: any) {
            console.log(` -> Failed: ${err.message || err}`);
            await client.end().catch(() => {});
        }
    }
    console.log('All IPv4 pooler attempts completed.');
    process.exit(1);
}

main();
