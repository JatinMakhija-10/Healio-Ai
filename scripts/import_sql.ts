import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function importSql() {
    const sqlFilePath = path.resolve(process.cwd(), 'OpenHomeopath.sql', 'OpenHomeopath.sql');

    if (!fs.existsSync(sqlFilePath)) {
        console.error(`SQL file not found at ${sqlFilePath}`);
        process.exit(1);
    }

    // CONNECTION_STRING should be in the format: postgres://postgres.[PROJECT-ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
    const connectionString = process.env.SUPABASE_DB_CONNECTION_STRING;

    if (!connectionString) {
        console.error("Missing SUPABASE_DB_CONNECTION_STRING in .env.local");
        console.log("Please add your connection string to .env.local:");
        console.log('SUPABASE_DB_CONNECTION_STRING="postgres://postgres.[YOUR-ID]:[YOUR-PASSWORD].../postgres"');
        process.exit(1);
    }

    console.log("Connecting to Supabase...");
    let dbConfig: any = { ssl: { rejectUnauthorized: false } };

    // We parse the string manually to handle passwords with #, ?, [, ] 
    // Format: postgresql://user:pass@host:port/db
    try {
        // Strip prefix
        const str = connectionString.replace('postgresql://', '').replace('postgres://', '');

        // Split at the LAST @ symbol (in case password has an @)
        const atIndex = str.lastIndexOf('@');
        if (atIndex === -1) throw new Error("Invalid format");

        const credentials = str.substring(0, atIndex);
        const serverInfo = str.substring(atIndex + 1);

        // Extract user and pass (split at FIRST colon)
        const colonIndex1 = credentials.indexOf(':');
        const user = credentials.substring(0, colonIndex1);
        let password = credentials.substring(colonIndex1 + 1);

        // URL ENCODE THE PASSWORD to prevent ERR_INVALID_URL inside pg constructor
        password = encodeURIComponent(password);

        // Extract host, port, db
        const slashIndex = serverInfo.indexOf('/');
        const hostPort = serverInfo.substring(0, slashIndex);
        const database = serverInfo.substring(slashIndex + 1);

        const [host, portStr] = hostPort.split(':');

        dbConfig = {
            user: user,
            password: password, // Raw password, no decoding needed for pg client
            host: host,
            port: parseInt(portStr, 10),
            database: database,
            ssl: false, // Disabling SSL entirely to test if it's an SSL handshake failure
            connectionTimeoutMillis: 10000
        };
        console.log("Parsed connection string securely.");
    } catch (e) {
        console.log("Failed to parse manually, reverting to raw pg string parser...");
        dbConfig.connectionString = connectionString;
    }

    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log("Connected! Reading SQL file...");

        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        console.log("Executing SQL (this may take a few minutes)...");
        await client.query(sql);

        console.log("✅ Import successful!");
    } catch (err) {
        console.error("❌ Import failed:");
        console.error(err);
        console.error("Config used:", { ...dbConfig, password: "***" });
    } finally {
        await client.end();
    }
}

importSql();
