
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

console.log("=== HEALIO.AI SETUP DIAGNOSTIC ===\n");

const cwd = process.cwd();
const files = ['.env.local', '.env'];
let foundValid = false;

files.forEach(file => {
    const filePath = path.resolve(cwd, file);
    console.log(`Checking ${file}...`);

    if (fs.existsSync(filePath)) {
        console.log(`  [OK] File exists.`);
        const content = fs.readFileSync(filePath, 'utf8');
        const config = dotenv.parse(content);

        const url = config.NEXT_PUBLIC_SUPABASE_URL;
        const key = config.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key) {
            console.log(`  [FAIL] Missing keys in ${file}.`);
        } else if (url.includes('your_project_id') || key.includes('YOUR_SUPABASE')) {
            console.log(`  [FAIL] Keys match placeholders in ${file}. Please replace them.`);
        } else {
            console.log(`  [SUCCESS] Valid keys found in ${file}.`);
            foundValid = true;
        }
    } else {
        console.log(`  [INFO] File not found (this is okay if .env.local exists).`);
    }
    console.log("");
});

if (foundValid) {
    console.log(">>> SETUP LOOKS GOOD! You can run the seed script now.");
} else {
    console.warn(">>> SETUP INCOMPLETE. Please edit .env.local with your Supabase keys.");
}
