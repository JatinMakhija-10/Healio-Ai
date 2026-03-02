const fs = require('fs');
const path = require('path');

const chunkPath = path.join(__dirname, '../sql_chunks/chunk_144.sql');
const content = fs.readFileSync(chunkPath, 'utf8');

const regex = /\((\d+),'([^']*)','([^']*)','([^']*)','([^']*)'\)/g;
let match;
let count = 0;
while ((match = regex.exec(content)) !== null) {
    count++;
    if (match[2].includes('tief > Liegen, besser')) {
        console.log(`Found match at index ${match.index}:`);
        console.log(match[0]);
        // Print characters around this match to see the context
        console.log('Context before:');
        console.log(content.substring(match.index - 100, match.index));
        console.log('Context after:');
        console.log(content.substring(match.index, match.index + 100));
    }
}
console.log(`Parsed ${count} tuples.`);

// Let's also search for the exact string to see if it exists without quotes
const exactStr = "tief > Liegen, besser";
const exactIndex = content.indexOf(exactStr);
if (exactIndex !== -1) {
    console.log(`Found exact string at index ${exactIndex}. Context:`);
    console.log(content.substring(exactIndex - 100, exactIndex + 100));
} else {
    console.log('Exact string not found.');
}
