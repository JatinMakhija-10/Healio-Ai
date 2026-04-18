const fs = require('fs');
const f = 'src/app/api/chat/route.ts';
let code = fs.readFileSync(f, 'utf8');

const regex = /const MAX_MESSAGES = 15;[\s\S]*?\: messages;/;

const newCode = `// Token overflow protection & dynamic history limit for TTFT
        // Early turns only need the last few messages. Final diagnosis needs more history.
        let dynamicMaxMessages = 15;
        const userTurnsEarly = messages.filter(m => m.role === 'user').length;
        if (userTurnsEarly <= 2) dynamicMaxMessages = 4;        // ~2 turns of history
        else if (userTurnsEarly <= 5) dynamicMaxMessages = 8;   // ~4 turns of history

        let processedMessages = messages;
        if (messages.length > dynamicMaxMessages) {
            // CRITICAL: Always keep messages[0] which contains the user's initial 
            // language and introductory context so the LLM doesn't break character or speak natively!
            processedMessages = [
                messages[0], 
                ...messages.slice(messages.length - dynamicMaxMessages + 1)
            ];
        }`;

if (regex.test(code)) {
    code = code.replace(regex, newCode);
    fs.writeFileSync(f, code, 'utf8');
    console.log('Fixed slice logic.');
} else {
    console.warn('Could not find RegExp match.');
}
