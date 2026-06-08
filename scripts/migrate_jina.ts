import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function importSql() {
    const sqlFilePath = path.resolve(process.cwd(), 'supabase', 'migrations', '20260607_ayurvedic_pdfs_jina.sql');

    if (!fs.existsSync(sqlFilePath)) {
        console.error(`SQL file not found at ${sqlFilePath}`);
        process.exit(1);
    }

    console.log("Connecting using Postgres.js (object config)...");
    const sql = postgres({
        host: "aws-0-ap-south-1.pooler.supabase.com",
        port: 6543,
        database: "postgres",
        username: "postgres.jqtfqseimrqusumznnpv",
        password: "Jatin#123OP",
        ssl: 'require',
        max: 1
    });

    try {
        console.log("Connected! Reading SQL file...");
        const fileContent = fs.readFileSync(sqlFilePath, 'utf8');

        console.log("Executing SQL (this will take a few minutes)...");
        await sql.unsafe(fileContent);

        console.log("✅ Migration successful!");
    } catch (err) {
        console.error("❌ Migration failed:");
        console.error(err);
    } finally {
        await sql.end();
    }
}

importSql().catch(err => {
    console.error("FATAL ERROR:");
    console.error(err);
    process.exit(1);
});
