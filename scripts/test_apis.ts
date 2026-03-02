import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const groqKey = process.env.GROQ_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

if (!groqKey || !geminiKey) {
    console.error('❌ Missing API keys in .env.local');
    process.exit(1);
}

async function testGroq() {
    console.log('Testing Groq API...');
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: 'Say "Groq is working!"' }],
                max_tokens: 10
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Groq Success! Response: "${data.choices[0].message.content}"`);
        } else {
            console.error('❌ Groq Error:', response.status, await response.text());
        }
    } catch (e) {
        console.error('❌ Groq Exception:', e);
    }
}

async function testGemini() {
    console.log('\nTesting Gemini API (Completions)...');
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Say "Gemini is working!"' }] }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No text';
            console.log(`✅ Gemini Success! Response: "${text.trim()}"`);
        } else {
            console.error('❌ Gemini Error:', response.status, await response.text());
        }
    } catch (e) {
        console.error('❌ Gemini Exception:', e);
    }
}

async function main() {
    await testGroq();
    await testGemini();
}

main();
