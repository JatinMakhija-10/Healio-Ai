const fs = require('fs');
const path = require('path');
try {
    const logPath = path.join(__dirname, '../fix_log.txt');
    const buffer = fs.readFileSync(logPath);

    let content = buffer.toString('utf16le');
    if (content.indexOf('chunk') === -1) {
        content = buffer.toString('utf8');
    }

    const lines = content.replace(/\r\n/g, '\n').split('\n');
    const errors = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Failed') || lines[i].includes('ERROR') || lines[i].includes('LINE')) {
            errors.push(lines[i].trim());
        }
    }
    fs.writeFileSync(path.join(__dirname, '../parsed_errors.txt'), errors.join('\n'), 'utf8');
    console.log('Wrote parsed_errors.txt');
} catch (e) {
    console.error(e);
}
