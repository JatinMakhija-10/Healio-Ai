import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

function findPdfs(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findPdfs(filePath, fileList);
        } else if (filePath.toLowerCase().endsWith('.pdf')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

async function runTests() {
    console.log("🔍 Running PDF Ingestion Verification Tests...\n");

    const rawDir = path.resolve(process.cwd(), 'NewBooks 2');
    const ocrDir = path.resolve(process.cwd(), 'NewBooks 2_needs_ocr');

    // 1. Get PDFs from file system
    const rawFiles = findPdfs(rawDir).map(f => path.basename(f));
    const ocrFiles = findPdfs(ocrDir).map(f => path.basename(f));
    
    console.log(`📁 Found ${rawFiles.length} PDFs in 'NewBooks 2' directory.`);
    console.log(`📁 Found ${ocrFiles.length} PDFs in 'NewBooks 2_needs_ocr' directory.`);

    // 2. Fetch unique source_files from database
    console.log(`\n⏳ Fetching ingestion stats from Supabase...`);
    
    let allData: any[] = [];
    let start = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('ayurvedic_pdf_embeddings')
            .select('source_file, id')
            .range(start, start + limit - 1);

        if (error) {
            console.error("❌ Error fetching from Supabase:", error);
            return;
        }

        if (data && data.length > 0) {
            allData = allData.concat(data);
            start += limit;
            if (data.length < limit) {
                hasMore = false;
            }
        } else {
            hasMore = false;
        }
    }

    const dbFilesMap = new Map<string, number>();
    for (const row of allData) {
        dbFilesMap.set(row.source_file, (dbFilesMap.get(row.source_file) || 0) + 1);
    }

    const dbFiles = Array.from(dbFilesMap.keys());
    console.log(`🗄️  Found ${dbFiles.length} unique PDFs in the database with a total of ${allData.length} chunks.`);

    // 3. Compare DB with filesystem
    const missingInDb = rawFiles.filter(f => !dbFiles.includes(f));
    const extraInDb = dbFiles.filter(f => !rawFiles.includes(f));

    console.log(`\n📊 Test Results:`);
    console.log(`--------------------------------------------------`);
    if (missingInDb.length === 0) {
        console.log(`✅ All ${rawFiles.length} PDFs in 'NewBooks 2' are present in the database.`);
    } else {
        console.log(`❌ Missing ${missingInDb.length} PDFs in the database:`);
        missingInDb.forEach(f => console.log(`   - ${f}`));
    }

    if (extraInDb.length > 0) {
        console.log(`⚠️ Found ${extraInDb.length} extra PDFs in the database not present in 'NewBooks 2':`);
        extraInDb.forEach(f => console.log(`   - ${f}`));
    }

    console.log(`--------------------------------------------------`);
    console.log(`Chunk Statistics (Top 5 & Bottom 5 by chunks):`);
    
    const sortedStats = Array.from(dbFilesMap.entries()).sort((a, b) => b[1] - a[1]);
    const top5 = sortedStats.slice(0, 5);
    const bottom5 = sortedStats.slice(-5);

    top5.forEach(([f, c]) => console.log(`   [High] ${f}: ${c} chunks`));
    console.log(`   ...`);
    bottom5.forEach(([f, c]) => console.log(`   [Low]  ${f}: ${c} chunks`));

    console.log(`\n✅ Tests complete!`);
}

runTests().catch(console.error);
