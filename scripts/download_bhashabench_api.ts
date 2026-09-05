import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const hfToken = process.env.HF_TOKEN || '';
const outDir = path.resolve(process.cwd(), 'data', 'ayurveda', 'raw', 'bhashabench');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

type QnARow = {
    id: string;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    question_type: string;
    question_level: string;
    topic: string;
    subject_domain: string;
    language: string;
};

async function fetchWithRetry(url: string, token: string, maxRetries = 8): Promise<Response> {
    let delay = 10000; // start with 10s delay on 429
    for (let i = 0; i < maxRetries; i++) {
        const resp = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resp.status === 429) {
            console.log(`\n⏳ HuggingFace rate limited (429). Pausing ${delay / 1000}s before retry ${i + 1}/${maxRetries}...`);
            await new Promise(r => setTimeout(r, delay));
            delay = Math.min(delay * 1.5, 60000); // capped at 60s
            continue;
        }

        return resp;
    }
    throw new Error('HTTP 429 rate limit max retries reached');
}

async function downloadConfig(config: string, existingRecords: QnARow[] = []): Promise<QnARow[]> {
    console.log(`\n⬇️ Downloading ${config} dataset from Hugging Face Datasets API...`);
    const records: QnARow[] = [...existingRecords];
    const seenIds = new Set(records.map(r => r.id));
    let offset = records.length;
    const length = 100;
    let hasMore = true;

    while (hasMore) {
        const url = `https://datasets-server.huggingface.co/rows?dataset=bharatgenai%2FBhashaBench-Ayur&config=${encodeURIComponent(config)}&split=test&offset=${offset}&length=${length}`;
        
        let resp: Response;
        try {
            resp = await fetchWithRetry(url, hfToken);
        } catch (e: any) {
            console.error(`\n❌ Failed fetching offset ${offset}: ${e.message}`);
            break;
        }

        if (!resp.ok) {
            const errText = await resp.text();
            console.error(`\n❌ Failed at offset ${offset}: HTTP ${resp.status} - ${errText.slice(0, 200)}`);
            break;
        }

        const data = await resp.json();
        const rows = data.rows || [];
        if (rows.length === 0) {
            hasMore = false;
            break;
        }

        for (const item of rows) {
            const row = item.row as QnARow;
            if (!seenIds.has(row.id)) {
                seenIds.add(row.id);
                records.push(row);
            }
        }

        const total = data.num_rows_total || 0;
        process.stdout.write(`\r  Downloaded ${records.length} / ${total} rows (${Math.round((records.length / (total || 1)) * 100)}%)`);

        offset += length;
        if (offset >= total || rows.length < length) {
            hasMore = false;
        }

        // 500ms pacing between successful row pages
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n✅ Finished ${config}: ${records.length} records ready.`);
    return records;
}

function loadExisting(filePath: string): QnARow[] {
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch { }
    }
    return [];
}

async function main() {
    console.log('🚀 Starting BhashaBench-Ayur dataset downloader...');
    
    const engPath = path.join(outDir, 'bhashabench_english.json');
    const hinPath = path.join(outDir, 'bhashabench_hindi.json');
    const combPath = path.join(outDir, 'bhashabench_combined.json');

    const engExisting = loadExisting(engPath);
    const hinExisting = loadExisting(hinPath);

    console.log(`📌 Loaded existing local cache: ${engExisting.length} English, ${hinExisting.length} Hindi`);

    const englishRecords = await downloadConfig('English', engExisting);
    fs.writeFileSync(engPath, JSON.stringify(englishRecords, null, 2));

    const hindiRecords = await downloadConfig('Hindi', hinExisting);
    fs.writeFileSync(hinPath, JSON.stringify(hindiRecords, null, 2));

    const combined = [...englishRecords, ...hindiRecords];
    fs.writeFileSync(combPath, JSON.stringify(combined, null, 2));

    console.log(`\n🎉 Download Complete! Saved to:`);
    console.log(`   - English: ${engPath} (${englishRecords.length} items)`);
    console.log(`   - Hindi:   ${hinPath} (${hindiRecords.length} items)`);
    console.log(`   - Combined: ${combPath} (${combined.length} items)`);
}

main().catch(err => {
    console.error('Fatal download error:', err);
    process.exit(1);
});
