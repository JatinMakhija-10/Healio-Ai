const { Client } = require('pg');

async function testConnection() {
    const url = "postgresql://postgres:Jatin#123OP@db.jqtfqseimrqusumznnpv.supabase.co:5432/postgres";

    // Try raw string first
    let client = new Client({ connectionString: url });

    try {
        await client.connect();
        console.log("SUCCESS! Connected with raw string.");
        await client.end();
        return;
    } catch (err) {
        console.error("Failed with raw string:", err.message);
    }

    // Now try parsed
    try {
        console.log("Trying parsed connection...");
        const client2 = new Client({
            user: "postgres",
            password: "Jatin#123OP",
            host: "db.jqtfqseimrqusumznnpv.supabase.co",
            port: 5432,
            database: "postgres",
            ssl: { rejectUnauthorized: false }
        });
        await client2.connect();
        console.log("SUCCESS! Connected with parsed params.");
        await client2.end();
    } catch (e) {
        console.error("Failed with parsed params:", e.message);
    }
}

testConnection();
