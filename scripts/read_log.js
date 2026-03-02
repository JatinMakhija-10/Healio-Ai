const fs = require('fs');
const path = require('path');
try {
    const logPath = path.join(__dirname, '../fix_log.txt');
    const buffer = fs.readFileSync(logPath);

    // Try utf16le first, if it looks like utf16le
    let content = '';
    if (buffer[0] === 0xff && buffer[1] === 0xfe) {
        content = buffer.toString('utf16le');
    } else {
        content = buffer.toString('utf8');
    }

    const lines = content.split('\n');
    const errors = lines.filter(l => l.includes('Failed') || l.includes('ERROR:'));
    console.log(`Found ${errors.length} errors.`);
    console.log('Last 20 errors:');
    console.log(errors.slice(-20).join('\n'));
} catch (e) {
    console.error(e);
}
