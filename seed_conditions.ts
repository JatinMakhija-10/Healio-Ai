
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { CONDITIONS } from './src/lib/diagnosis/conditions';
import { Condition } from './src/lib/diagnosis/types';

// Load env vars from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading env from: ${envPath}`);

if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_project_id') || supabaseKey.includes('YOUR_SUPABASE')) {
    console.error("Error: Missing or Invalid Supabase keys in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
    console.log("Starting Comprehensive Seed Process...");

    // Use the exact source of truth from the app
    const allConditions = Object.values(CONDITIONS) as Condition[];
    console.log(`Found total ${allConditions.length} conditions in codebase.`);

    let success = 0;
    let fail = 0;

    for (const condition of allConditions) {
        const payload = {
            id: condition.id,
            name: condition.name,
            locations: condition.matchCriteria?.locations || [],
            content: condition
        };

        const { error } = await supabase.from('conditions').upsert(payload);

        if (error) {
            console.error(`❌ Failed: ${condition.name} (${error.message})`);
            fail++;
        } else {
            success++;
            if (success % 10 === 0) process.stdout.write('.'); // Progress feedback
        }
    }

    console.log(`\n\n=== COMPLETED ===`);
    console.log(`✅ Success: ${success}`);
    console.log(`❌ Failed:  ${fail}`);

    if (fail === 0) {
        console.log("ALL DISEASES UPLOADED SUCCESSFULLY!");
    } else {
        console.warn("Some diseases failed to upload. Check errors above.");
    }
}

seedDatabase();
