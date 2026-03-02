import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PROJECT_REF = 'jqtfqseimrqusumznnpv';
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

async function getCount(table: string) {
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN!;
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `SELECT count(*) FROM "${table}";` }),
    });

    if (response.ok) {
        const data = await response.json();
        console.log(`Count for ${table}:`, data);
    } else {
        console.log(`Error getting count for ${table}:`, await response.text());
    }
}

async function main() {
    await getCount('symptoms');
    await getCount('sym_translations');
    await getCount('sym_src');
    await getCount('sym_xrefs');
}

main();
