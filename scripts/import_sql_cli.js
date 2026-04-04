const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function importSql() {
    const sqlFilePath = path.resolve(process.cwd(), 'OpenHomeopath.sql', 'OpenHomeopath.sql');

    if (!fs.existsSync(sqlFilePath)) {
        console.error(`SQL file not found at ${sqlFilePath}`);
        process.exit(1);
    }

    // The direct IPv4 connection string we found from the CLI docs
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const connectionString = "postgres://postgres.jqtfqseimrqusumznnpv:Jatin#123OP@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

    console.log("Starting psql import...");

    try {
        // psql is the most reliable way to pipe a 164MB sql file
        // We wrap password in PGPASSWORD env var to avoid command line parsing issues
        execSync(`psql -h aws-0-ap-southeast-1.pooler.supabase.com -p 6543 -U postgres.jqtfqseimrqusumznnpv -d postgres -f "${sqlFilePath}"`, {
            env: { ...process.env, PGPASSWORD: "Jatin#123OP" },
            stdio: 'inherit'
        });
        console.log("✅ Import successful!");
    } catch (err) {
        console.error("❌ Import failed:", err.message);
    }
}

importSql();
