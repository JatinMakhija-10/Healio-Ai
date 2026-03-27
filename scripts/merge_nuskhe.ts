import * as fs from 'fs';
import * as xlsx from 'xlsx';
import path from 'path';

// Types from existing nuskhe.json
type Remedy = {
    name: string;
    name_hindi?: string;
    ingredients?: string[];
    method: string;
    method_hindi?: string;
    frequency?: string;
    indication?: string;
    contraindications?: string[];
    age_safe?: string;
};

type NuskheEntry = {
    id: string;
    ailment: string;
    ailment_hindi: string;
    symptoms_keywords: string[];
    remedies: Remedy[];
};

function main() {
    // 1. Read existing nuskhe.json
    const jsonPath = path.resolve(process.cwd(), 'data', 'home_remedies', 'nuskhe.json');
    let existingData: NuskheEntry[] = [];
    if (fs.existsSync(jsonPath)) {
        existingData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    } else {
        console.error(`❌ Could not find nuskhe.json at ${jsonPath}`);
        process.exit(1);
    }

    // 2. Read cure_minor.xlsx
    const excelPath = path.resolve(process.cwd(), 'cure_minor.xlsx');
    if (!fs.existsSync(excelPath)) {
        console.error(`❌ Could not find excel file at ${excelPath}`);
        process.exit(1);
    }

    const fileBuffer = fs.readFileSync(excelPath);
    const workbook = xlsx.read(fileBuffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let addedCount = 0;

    // 3. Process and merge
    for (const record of rawData) {
        if (record.length < 2) continue;
        const ailmentRaw = record[0];
        const remediesRaw = record[1];

        if (typeof ailmentRaw !== 'string' || typeof remediesRaw !== 'string') continue;

        const ailment = ailmentRaw.trim();
        if (!ailment || ailment.toLowerCase() === 'ailment/disease name' || ailment.toLowerCase() === 'disease') {
            continue;
        }

        const id = ailment.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        
        let targetEntry = existingData.find(e => e.id === id || e.ailment.toLowerCase() === ailment.toLowerCase());
        
        let isNewEntry = false;
        if (!targetEntry) {
            targetEntry = {
                id,
                ailment: ailment,
                ailment_hindi: "", // Not provided
                symptoms_keywords: [ailment.toLowerCase()],
                remedies: []
            };
            isNewEntry = true;
        }

        const remedyInstructions = remediesRaw.split(',').map(r => r.trim()).filter(Boolean);
        
        for (const instruction of remedyInstructions) {
            if (instruction.length < 5) continue;
            
            // Check if remedy already exists to avoid duplicates
            const exists = targetEntry.remedies.some(r => r.method === instruction);
            if (!exists) {
                targetEntry.remedies.push({
                    name: "Minor Home Treatment",
                    method: instruction,
                    frequency: "As needed",
                    indication: "Minor ailment remedy",
                    age_safe: "Adults and appropriately for others"
                });
                addedCount++;
            }
        }

        if (isNewEntry && targetEntry.remedies.length > 0) {
            existingData.push(targetEntry);
        }
    }

    // 4. Save merged nuskhe.json
    fs.writeFileSync(jsonPath, JSON.stringify(existingData, null, 2), 'utf-8');
    console.log(`✅ Successfully merged cure_minor.xlsx into nuskhe.json. Added ${addedCount} new remedy instructions.`);
}

main();
