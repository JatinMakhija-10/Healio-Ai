
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { CONDITIONS } from './src/lib/diagnosis/conditions';
import { Condition } from './src/lib/diagnosis/types';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase keys.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log("=== UPLOAD VERIFICATION ===");

    // 1. Get Local IDs (from the actual objects, not just keys)
    const localConditions = Object.values(CONDITIONS) as Condition[];
    const localIdSet = new Set(localConditions.map(c => c.id));
    console.log(`Local Unique IDs Count: ${localIdSet.size}`);
    console.log(`Local Object Keys Count: ${Object.keys(CONDITIONS).length}`);

    // 2. Get DB Count
    const { count, error } = await supabase
        .from('conditions')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("Failed to check Supabase:", error.message);
        return;
    }

    console.log(`Database Rows Count:    ${count}`);

    // 3. Detailed Check
    if (count !== localIdSet.size) {
        console.warn("\n⚠️ Mismatch detected!");

        const { data: dbItems, error: fetchError } = await supabase
            .from('conditions')
            .select('id');

        if (fetchError) {
            console.error("Could not fetch IDs:", fetchError.message);
            return;
        }

        const dbIdSet = new Set(dbItems.map(i => i.id));

        // Check for missing in DB
        const missingInDb = Array.from(localIdSet).filter(id => !dbIdSet.has(id));
        if (missingInDb.length > 0) {
            console.error(`\n❌ MISSING IN DB (${missingInDb.length}):`);
            missingInDb.forEach(id => console.log(` - ${id}`));
        }

        // Check for extra in DB
        const extraInDb = Array.from(dbIdSet).filter(id => !localIdSet.has(id));
        if (extraInDb.length > 0) {
            console.log(`\nℹ️ EXTRA IN DB (not in local codebase) (${extraInDb.length}):`);
            extraInDb.forEach(id => console.log(` - ${id}`));
        }
    } else {
        console.log("\n✅ PERFECT MATCH! All unique IDs are in the database.");

        // Check if any object keys are different from their IDs (informative)
        const renamed = Object.entries(CONDITIONS).filter(([key, cond]) => key !== (cond as Condition).id);
        if (renamed.length > 0) {
            console.log(`\nNote: ${renamed.length} items use local keys that differ from their database IDs.`);
        }
    }
}

verify();
