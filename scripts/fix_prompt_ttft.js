const fs = require('fs');
const f = 'src/app/api/chat/route.ts';
let c = fs.readFileSync(f, 'utf8');

const promptSplitIdx = c.indexOf('=== FINAL DIAGNOSIS OUTPUT ===');
const endBacktick = c.indexOf('}\n```\n`;', promptSplitIdx);

if (promptSplitIdx === -1 || endBacktick === -1) {
    console.error("Could not find prompt split point");
    process.exit(1);
}

const promptEndIdx = endBacktick + 8;

const sysStartStr = `const SYSTEM_PROMPT = \``;
const sysStartIdx = c.indexOf(sysStartStr);

const basePrompt = c.substring(sysStartIdx, promptSplitIdx);
const finalDiagRules = c.substring(promptSplitIdx, promptEndIdx);

const oldDef = c.substring(sysStartIdx, promptEndIdx);
const newDef = basePrompt + '`;\n\nconst FINAL_DIAGNOSIS_RULES = `\n' + finalDiagRules;

c = c.replace(oldDef, newDef);

const oldUsage = `        let finalSystemPrompt = ragContext
            ? \`=== HEALIO MEDICAL KNOWLEDGE BASE (Sourced from Supabase) ===
The following data was retrieved from our verified databases. You MUST use this data to populate
the homeopathic_remedies, ayurvedic_remedies, and home_remedies sections in your final JSON output.
Do NOT ignore this data. Do NOT hallucinate remedies that contradict this data.

\${ragContext}

=== END OF KNOWLEDGE BASE ===

\${SYSTEM_PROMPT}\`
            : SYSTEM_PROMPT;
        
        if (personaContext) {
            finalSystemPrompt += personaContext;
        }`;

const newUsage = `        let finalSystemPrompt = ragContext
            ? \`=== HEALIO MEDICAL KNOWLEDGE BASE (Sourced from Supabase) ===
The following data was retrieved from our verified databases. You MUST use this data to populate
the homeopathic_remedies, ayurvedic_remedies, and home_remedies sections in your final JSON output.
Do NOT ignore this data. Do NOT hallucinate remedies that contradict this data.

\${ragContext}

=== END OF KNOWLEDGE BASE ===

\${SYSTEM_PROMPT}\`
            : SYSTEM_PROMPT;

        // ONLY append the massive 700-token JSON schema instruction if it's the final turn
        if (isFinalTurn) {
            finalSystemPrompt += '\\n\\n' + FINAL_DIAGNOSIS_RULES;
        }

        if (personaContext) {
            finalSystemPrompt += personaContext;
        }`;

c = c.replace(oldUsage, newUsage);

fs.writeFileSync(f, c, 'utf8');
console.log('Done pruning prompt.');
