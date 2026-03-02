const fs = require('fs');
let buf = fs.readFileSync('fix_log_v2.txt');
let str = buf.toString('utf16le');
if (!str.includes('chunk_148')) {
    str = buf.toString('utf8');
}
const lines = str.split('\n');
for (let line of lines) {
    if (line.includes('chunk_148')) {
        console.log(line);
    }
}
