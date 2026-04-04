/**
 * fix_img_ternaries.js
 * Scans all TSX files and wraps ternary branches where a JSX eslint-disable comment
 * precedes an <img> tag directly (two children in a ternary arm = invalid JSX).
 * Wraps the pair in a React Fragment <> ... </>
 */
const fs = require('fs');
const path = require('path');

function walkTsx(dir) {
    let results = [];
    let entries;
    try { entries = fs.readdirSync(dir); } catch { return results; }
    for (const f of entries) {
        if (['node_modules', '.next', 'scripts', '.git'].includes(f)) continue;
        const full = path.join(dir, f);
        let stat;
        try { stat = fs.statSync(full); } catch { continue; }
        if (stat.isDirectory()) {
            results = results.concat(walkTsx(full));
        } else if (f.endsWith('.tsx')) {
            results.push(full);
        }
    }
    return results;
}

let fixed = 0;

for (const file of walkTsx('./src')) {
    let content = fs.readFileSync(file, 'utf8');
    const hasCRLF = content.includes('\r\n');
    if (hasCRLF) content = content.replace(/\r\n/g, '\n');

    const lines = content.split('\n');
    let changed = false;

    for (let i = 0; i < lines.length - 1; i++) {
        const cur = lines[i];
        const nxt = lines[i + 1];

        // Current line is a JSX eslint-disable comment: {/* eslint-disable-next-line ... */}
        const isComment = cur.trim().startsWith('{/*') && cur.includes('eslint-disable-next-line');
        // Next line is an <img element
        const isImg = nxt.trim().startsWith('<img');

        if (!isComment || !isImg) continue;

        // Previous non-empty line should end with ( to confirm bare ternary arm
        let prevLine = '';
        for (let k = i - 1; k >= 0; k--) {
            if (lines[k].trim() !== '') { prevLine = lines[k].trim(); break; }
        }
        if (!prevLine.endsWith('(')) continue;

        // Already wrapped?
        if (prevLine === '<>') continue;

        const indent = cur.match(/^(\s*)/)[1];

        // Find closing /> of the img tag (may span multiple lines)
        let j = i + 1;
        while (j < lines.length && !lines[j].trim().endsWith('/>')) j++;

        // Insert <> before comment and </> after img closing
        lines.splice(i, 0, indent + '<>');
        lines.splice(j + 2, 0, indent + '</>');
        changed = true;
        fixed++;
        i = j + 2; // advance past what we fixed
    }

    if (changed) {
        let out = lines.join('\n');
        if (hasCRLF) out = out.replace(/\n/g, '\r\n');
        fs.writeFileSync(file, out);
        console.log('Fixed: ' + path.relative('.', file));
    }
}

console.log('\nTotal ternary fragment fixes: ' + fixed);
