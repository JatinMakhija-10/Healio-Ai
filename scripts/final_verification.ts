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

async function finalVerification() {
    console.log("╔══════════════════════════════════════════════════════╗");
    console.log("║   FINAL DATABASE MIGRATION VERIFICATION              ║");
    console.log("╚══════════════════════════════════════════════════════╝\n");

    // 1. Get all unique IDs from local codebase
    const localConditions = Object.values(CONDITIONS) as Condition[];
    const localIdSet = new Set(localConditions.map(c => c.id));
    const localIds = Array.from(localIdSet).sort();

    console.log(`✓ Local Unique Condition IDs: ${localIds.length}`);

    // 2. Get all IDs from Supabase
    const { data: dbData, error: fetchError } = await supabase
        .from('conditions')
        .select('id, name');

    if (fetchError) {
        console.error("❌ Error fetching from Supabase:", fetchError.message);
        process.exit(1);
    }

    const dbIdSet = new Set(dbData.map(item => item.id));
    const dbIds = Array.from(dbIdSet).sort();

    console.log(`✓ Database Condition Rows: ${dbIds.length}`);

    // 3. Check for perfect match
    if (localIds.length === dbIds.length) {
        console.log("\n✓ COUNT MATCH: Both have same number of conditions\n");

        // 4. Verify every local ID exists in DB
        const missingInDb = localIds.filter(id => !dbIdSet.has(id));
        const extraInDb = dbIds.filter(id => !localIdSet.has(id));

        if (missingInDb.length === 0 && extraInDb.length === 0) {
            console.log("╔══════════════════════════════════════════════════════╗");
            console.log("║  ✅ MIGRATION COMPLETE & VERIFIED 100%               ║");
            console.log("╚══════════════════════════════════════════════════════╝\n");
            console.log(`All ${localIds.length} unique conditions from your codebase`);
            console.log("are successfully stored in Supabase!\n");

            // Show sample of uploaded conditions
            console.log("Sample conditions in database:");
            const sample = dbData.slice(0, 5);
            sample.forEach(item => console.log(`  - ${item.id}: ${item.name}`));
            console.log(`  ... and ${dbData.length - 5} more\n`);

            return true;
        } else {
            if (missingInDb.length > 0) {
                console.log(`\n⚠️  MISSING IN DATABASE (${missingInDb.length}):`);
                missingInDb.forEach(id => console.log(`  - ${id}`));
            }

            if (extraInDb.length > 0) {
                console.log(`\nℹ️  EXTRA IN DATABASE (${extraInDb.length}):`);
                console.log("(These may be from previous tests or manual additions)");
                extraInDb.forEach(id => console.log(`  - ${id}`));
            }

            return false;
        }
    } else {
        console.log(`\n❌ COUNT MISMATCH:`);
        console.log(`   Local: ${localIds.length}`);
        console.log(`   Database: ${dbIds.length}`);
        console.log(`   Difference: ${Math.abs(localIds.length - dbIds.length)}\n`);

        return false;
    }
}

finalVerification().then(success => {
    process.exit(success ? 0 : 1);
});
