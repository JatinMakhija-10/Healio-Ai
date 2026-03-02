const { Client } = require('pg');

async function test() {
    console.log("Testing connection with IPv4 pooler config...");
    const client = new Client({
        user: "postgres.jqtfqseimrqusumznnpv",
        password: "Jatin#123OP",
        host: "aws-0-ap-southeast-1.pooler.supabase.com",
        port: 6543,
        database: "postgres",
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Success! Connected to Supabase Pooler IPv4.");
        await client.end();
    } catch (e) {
        console.log("FAIL:", e.message);
    }
}

test();
