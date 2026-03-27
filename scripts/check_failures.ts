import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const dataPath = path.resolve(process.cwd(), 'data', 'home_remedies', 'nuskhe.json');
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    const { data: dbRows, error } = await supabase.from('home_remedy_embeddings').select('ailment, remedy_name');
    if (error) {
        console.error("DB error", error);
        return;
    }

    const dbSet = new Set(dbRows.map(r => `${r.ailment}|${r.remedy_name}`));
    
    let missingCount = 0;
    let dupNameCount = 0;
    for (const entry of rawData) {
        const remedyNamesInAilment = new Set();
        for (const remedy of entry.remedies) {
            if (remedyNamesInAilment.has(remedy.name)) {
                dupNameCount++;
            }
            remedyNamesInAilment.add(remedy.name);

            if (!dbSet.has(`${entry.ailment}|${remedy.name}`)) {
                missingCount++;
                if (missingCount <= 5) {
                    console.log(`Missing: ${entry.ailment} -> ${remedy.name}`);
                }
            }
        }
    }
    console.log(`Total missing: ${missingCount}`);
    console.log(`Duplicate names within same ailment in JSON: ${dupNameCount}`);
}

check();
