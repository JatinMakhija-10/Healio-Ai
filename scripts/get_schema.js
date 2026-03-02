const fs = require('fs');

const sql = fs.readFileSync('OpenHomeopath.sql/OpenHomeopath.sql', 'utf8');

const tables = [
    'sym_src',
    'sym_stats',
    'sym_status',
    'sym_synonyms',
    'sym_translations',
    'symptoms'
];

let output = '';

for (const t of tables) {
    const tableDefRegex = new RegExp("CREATE TABLE `" + t + "` \\(([\\s\\S]*?)\\)(?:\\s*ENGINE[\\s\\S]*?)?;", "m");
    const match = sql.match(tableDefRegex);
    if (match) {
        output += `--- Schema for ${t} ---\n`;
        output += `CREATE TABLE \`${t}\` (${match[1]});\n\n`;
    } else {
        output += `Could not find schema for ${t}\n\n`;
    }
}

fs.writeFileSync('schemas.txt', output, 'utf8');
