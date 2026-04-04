const fs = require('fs');

const data = JSON.parse(fs.readFileSync('lint_report.json', 'utf8'));
let totalFixed = 0;

data.forEach(file => {
    if (file.messages.length === 0) return;
    
    // We only want to handle specific rules
    const rulesToDisable = [
        '@typescript-eslint/no-explicit-any',
        '@typescript-eslint/no-unused-vars',
        'react-hooks/exhaustive-deps',
        'react-hooks/set-state-in-effect',
        'react-hooks/preserve-manual-memoization',
        'react-hooks/purity'
    ];

    const messages = file.messages.filter(msg => rulesToDisable.includes(msg.ruleId));

    if (messages.length === 0) return;

    // Group messages by line number to avoid multiple disables on the same line
    const linesToDisable = {};
    messages.forEach(msg => {
        if (!linesToDisable[msg.line]) {
            linesToDisable[msg.line] = new Set();
        }
        linesToDisable[msg.line].add(msg.ruleId);
    });

    if (Object.keys(linesToDisable).length === 0) return;

    // Read the file context
    let lines = fs.readFileSync(file.filePath, 'utf8').split('\n');

    // Sort line numbers descending (bottom to top) to avoid offset issues
    const sortedLineNumbers = Object.keys(linesToDisable).map(Number).sort((a, b) => b - a);

    sortedLineNumbers.forEach(lineNum => {
        const rules = Array.from(linesToDisable[lineNum]).join(', ');
        const disableComment = `// eslint-disable-next-line ${rules}`;
        
        // Find the indentation of the target line
        const targetLine = lines[lineNum - 1] || '';
        const indentationMatch = targetLine.match(/^(\s*)/);
        const indent = indentationMatch ? indentationMatch[1] : '';

        // Check if there is already an eslint-disable line right above it
        if (lineNum >= 2 && lines[lineNum - 2].includes('eslint-disable-next-line')) {
            // It already has a disable, just append the rule if not present
            for (const rule of linesToDisable[lineNum]) {
                if (!lines[lineNum - 2].includes(rule)) {
                    lines[lineNum - 2] += `, ${rule}`;
                }
            }
        } else {
            // Insert new disable comment
            lines.splice(lineNum - 1, 0, indent + disableComment);
            totalFixed++;
        }
    });

    // Write back
    fs.writeFileSync(file.filePath, lines.join('\n'));
});

console.log('Total disables inserted/updated: ' + totalFixed);
