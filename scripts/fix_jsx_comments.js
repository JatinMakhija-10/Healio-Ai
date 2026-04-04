const fs = require('fs');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules' || file === '.next') return;
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx')) results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
let fixed = 0;

files.forEach(f => {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    let changed = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.match(/^\s*\/\/\s*eslint-disable-next-line/)) {
            // Check if next line is JSX tag or expression
            let j = i + 1;
            while (j < lines.length && lines[j].trim() === '') j++;
            
            const nextLine = lines[j] || "";
            // If next line starts with < or { 
            if (nextLine.match(/^\s*(<|{)/)) {
                const indent = line.match(/^\s*/)[0];
                const comment = line.trim().replace(/^\/\/\s*/, '').trim();
                lines[i] = `${indent}{/* ${comment} */}`;
                changed = true;
                fixed++;
            }
        }
    }
    if (changed) {
        fs.writeFileSync(f, lines.join('\n'));
    }
});

console.log('Fixed ' + fixed + ' JSX comment syntax errors.');
