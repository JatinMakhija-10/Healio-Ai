const fs = require('fs');
const path = require('path');

const dataPath = path.resolve(__dirname, '..', 'data', 'home_remedies', 'nuskhe.json');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

let dupCount = 0;
for (const entry of rawData) {
    const seen = new Set();
    for (const remedy of entry.remedies) {
        if (seen.has(remedy.name)) {
            dupCount++;
        }
        seen.add(remedy.name);
    }
}

console.log(`Total duplicate (ailment, remedy_name) pairs: ${dupCount}`);
