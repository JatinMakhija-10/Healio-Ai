import fs from 'fs';
import path from 'path';
import postgres from 'postgres';

async function importSql() {
    const sqlFilePath = path.resolve(process.cwd(), 'OpenHomeopath.sql', 'OpenHomeopath.sql');

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
        // Postgres.js handles large query strings natively using the simple query protocol
        await sql.unsafe(fileContent);

        console.log("✅ Import successful!");
    } catch (err) {
        console.error("❌ Import failed:", err.message);
    } finally {
        await sql.end();
    }
}

importSql().catch(err => {
    console.error("FATAL ERROR:");
    console.error(err);
    process.exit(1);
});
