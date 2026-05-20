import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function parseKeyPool(...envNames: string[]): string[] {
    const seen = new Set<string>();
    const keys: string[] = [];

    for (const envName of envNames) {
        const value = process.env[envName];
        if (!value) continue;
        for (const rawKey of value.split(',')) {
            const key = rawKey.trim().replace(/^['"]|['"]$/g, '');
            if (!key || seen.has(key)) continue;
            seen.add(key);
            keys.push(key);
        }
    }

    return keys;
}

function compactBody(body: string): string {
    return body.replace(/\s+/g, ' ').slice(0, 260);
}

async function testGroq() {
    const keys = parseKeyPool('GROQ_API_KEYS', 'GROQ_API_KEY');
    const models = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];

    if (keys.length === 0) {
        console.error('Groq: no keys configured');
        return false;
    }

    let allOk = true;
    for (const model of models) {
        let modelOk = false;
        for (let i = 0; i < keys.length; i++) {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${keys[i]}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: 'Say "Groq is working!"' }],
                    max_tokens: 10,
                }),
            });

            const body = await response.text();
            if (response.ok) {
                console.log(`Groq ${model}: OK with key #${i + 1}`);
                modelOk = true;
                break;
            }

            console.error(`Groq ${model}: ${response.status} with key #${i + 1} ${compactBody(body)}`);
        }
        allOk &&= modelOk;
    }

    return allOk;
}

async function testGeminiGeneration() {
    const keys = parseKeyPool('GEMINI_API_KEY', 'GEMINI_API_KEYS');
    const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

    if (keys.length === 0) {
        console.error('Gemini: no keys configured');
        return false;
    }

    for (const model of models) {
        for (let i = 0; i < keys.length; i++) {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keys[i]}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: 'Say "Gemini is working!"' }] }],
                        generationConfig: { maxOutputTokens: 12 },
                    }),
                }
            );

            const body = await response.text();
            if (response.ok) {
                console.log(`Gemini generation ${model}: OK with key #${i + 1}`);
                return true;
            }

            console.error(`Gemini generation ${model}: ${response.status} with key #${i + 1} ${compactBody(body)}`);
        }
    }

    return false;
}

async function testGeminiEmbedding() {
    const keys = parseKeyPool('GEMINI_API_KEY', 'GEMINI_API_KEYS');
    const models = ['gemini-embedding-2-preview', 'gemini-embedding-001'];

    if (keys.length === 0) return false;

    let allOk = true;
    for (const model of models) {
        let modelOk = false;
        for (let i = 0; i < keys.length; i++) {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${keys[i]}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: { parts: [{ text: 'headache nausea' }] } }),
                }
            );

            const body = await response.text();
            if (response.ok) {
                console.log(`Gemini embedding ${model}: OK with key #${i + 1}`);
                modelOk = true;
                break;
            }

            console.error(`Gemini embedding ${model}: ${response.status} with key #${i + 1} ${compactBody(body)}`);
        }
        allOk &&= modelOk;
    }

    return allOk;
}

async function main() {
    const [groqOk, geminiGenerationOk, geminiEmbeddingOk] = await Promise.all([
        testGroq(),
        testGeminiGeneration(),
        testGeminiEmbedding(),
    ]);

    if (!groqOk || !geminiGenerationOk || !geminiEmbeddingOk) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
