/**
 * Long-conversation cutoff test for Arovia AI Chat API.
 *
 * Simulates a full 7-turn diagnostic conversation (user→assistant→user→...),
 * then verifies the final response is:
 *   1. Not truncated (contains closing ```json and ```)
 *   2. Contains a valid JSON diagnosis card
 *   3. Has all required fields populated
 *   4. finish_reason is NOT "length"
 *
 * Usage:
 *   node test_long_chat.mjs
 *
 * Requires:
 *   - The dev server running on localhost:3000
 *   - A valid Supabase session token (HEALIO_TEST_TOKEN env var or .env.local)
 */

import fs from 'fs';
import path from 'path';

// Load .env.local for SUPABASE creds if HEALIO_TEST_TOKEN not set
const envPath = path.resolve('.env.local');
const envVars = {};
try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
        const [key, ...rest] = line.split('=');
        if (key && rest.length) envVars[key.trim()] = rest.join('=').trim();
    }
} catch { /* ignore */ }

const BASE_URL = process.env.HEALIO_BASE_URL || 'http://localhost:3000';

// Simulated multi-turn conversation — designed to reach the final diagnosis turn
const CONVERSATION_TURNS = [
    { role: 'user', content: 'I have been having a headache since yesterday' },
    { role: 'assistant', content: 'I\'m sorry you\'re dealing with a headache since yesterday. How would you rate the intensity right now, on a scale of 1 to 10?\n{"ui_hint": {"type": "slider", "min": 1, "max": 10, "question_type": "severity"}}' },
    { role: 'user', content: '7' },
    { role: 'assistant', content: 'A 7 is quite intense. Where exactly do you feel the headache most — is it all over, one-sided, behind your eyes, at the temples, or at the back?\n{"ui_hint": {"type": "chips", "options": ["All over", "One-sided", "Behind eyes", "Temples", "Back of head", "Forehead", "Other - I\'ll type it"], "question_type": "sensation"}}' },
    { role: 'user', content: 'Behind eyes and temples, it feels throbbing' },
    { role: 'assistant', content: 'That throbbing behind the eyes and temples sounds very uncomfortable. Is there anything that makes it worse — like light, noise, bending down, or screen time?\n{"ui_hint": {"type": "chips", "options": ["Light sensitivity", "Noise sensitivity", "Bending down", "Screen time", "Stress", "Physical activity", "Nothing specific", "Other - I\'ll type it"], "question_type": "aggravation"}}' },
    { role: 'user', content: 'Yes, light and screen time make it much worse. Also I feel nauseous sometimes' },
    { role: 'assistant', content: 'Light sensitivity and nausea alongside a throbbing headache is an important pattern. Does anything give you relief — like resting in a dark room, cold compress, or painkillers?\n{"ui_hint": {"type": "chips", "options": ["Dark room / rest", "Cold compress", "Paracetamol", "Ibuprofen", "Sleep", "Nothing helps", "Other - I\'ll type it"], "question_type": "amelioration"}}' },
    { role: 'user', content: 'Resting in a dark room helps a bit, I also took paracetamol but it only reduced it slightly' },
    { role: 'assistant', content: 'Understood — partial relief with rest and only slight improvement with paracetamol. Can you recall how this started — any stress, lack of sleep, dietary change, or eye strain before it began?\n{"ui_hint": {"type": "chips", "options": ["Work stress", "Poor sleep", "Skipped meals", "Eye strain / screen overuse", "Weather change", "Hormonal", "Don\'t know", "Other - I\'ll type it"], "question_type": "history"}}' },
    { role: 'user', content: 'I have been working long hours on laptop and sleeping only 4-5 hours for the last week' },
];

// Turn 7 should trigger isFinalTurn (7 user turns, intake mostly complete)
// We add one more user turn to force diagnosis
const FINAL_USER_MESSAGE = 'Give me my diagnosis please, I have answered enough questions';

function parseSSE(rawText) {
    const events = [];
    for (const line of rawText.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
            events.push({ done: true });
        } else {
            try {
                events.push(JSON.parse(data));
            } catch {
                events.push({ parseError: true, raw: data });
            }
        }
    }
    return events;
}

// Auth helper — caches the token and its expiry
let _cachedToken = null;
let _tokenExpiry = 0;

async function getTestToken(forceRefresh = false) {
    // If explicit token, use it
    if (process.env.HEALIO_TEST_TOKEN && !forceRefresh) return process.env.HEALIO_TEST_TOKEN;

    // Return cached token if still valid (with 60s buffer)
    if (_cachedToken && !forceRefresh && Date.now() < _tokenExpiry - 60_000) {
        return _cachedToken;
    }

    // Try to get one from Supabase
    const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Set HEALIO_TEST_TOKEN env var, or ensure .env.local has NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    // Read test creds
    const testEmail = process.env.HEALIO_TEST_EMAIL || envVars.TEST_EMAIL;
    const testPassword = process.env.HEALIO_TEST_PASSWORD || envVars.TEST_PASSWORD;

    if (!testEmail || !testPassword) {
        throw new Error('Set HEALIO_TEST_EMAIL + HEALIO_TEST_PASSWORD env vars or TEST_EMAIL + TEST_PASSWORD in .env.local');
    }

    console.log(`  Authenticating as ${testEmail}${forceRefresh ? ' (token refresh)' : ''}...`);
    const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
        },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
    });

    if (!authRes.ok) {
        const body = await authRes.text();
        throw new Error(`Auth failed: ${authRes.status} — ${body.slice(0, 200)}`);
    }

    const authData = await authRes.json();
    _cachedToken = authData.access_token;
    // JWT tokens typically have 1 hour expiry; use expires_in if provided
    _tokenExpiry = Date.now() + (authData.expires_in ? authData.expires_in * 1000 : 3600_000);
    return _cachedToken;
}

async function sendChatTurn(token, messages, retryOnAuth = true) {
    const start = Date.now();
    const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages }),
    });

    const elapsed = Date.now() - start;
    const headers = {};
    for (const [k, v] of res.headers.entries()) {
        if (k.startsWith('x-')) headers[k] = v;
    }

    // Auto-refresh token on 401 and retry once
    if (res.status === 401 && retryOnAuth) {
        console.log('  ⚠ Token expired, refreshing...');
        const newToken = await getTestToken(true);
        return sendChatTurn(newToken, messages, false);
    }

    const rawBody = await res.text();
    return { status: res.status, elapsed, headers, rawBody, token };
}

function extractJsonFromResponse(content) {
    const match = content.match(/```json\n([\s\S]*?)\n```/);
    if (!match) return null;
    try {
        return JSON.parse(match[1]);
    } catch {
        return null;
    }
}

// ── Main test ──────────────────────────────────────────────────────────
async function main() {
    console.log('\n=== Arovia AI Long Conversation Cutoff Test ===\n');
    console.log(`Target: ${BASE_URL}/api/chat`);
    console.log(`Turns:  ${Math.floor(CONVERSATION_TURNS.length / 2) + 1} user messages + 1 final diagnosis request\n`);

    let token;
    try {
        token = await getTestToken();
        console.log('  ✓ Token obtained\n');
    } catch (e) {
        console.error(`  ✗ ${e.message}`);
        console.log('\n  To run this test, set a valid session token:');
        console.log('    HEALIO_TEST_TOKEN=<jwt> node test_long_chat.mjs\n');
        process.exit(1);
    }

    // Phase 1: Run through the initial turns
    const fullMessages = [];
    let turnNum = 0;

    for (const msg of CONVERSATION_TURNS) {
        fullMessages.push(msg);
        if (msg.role === 'user') {
            turnNum++;
            console.log(`Turn ${turnNum} [user]: "${msg.content.slice(0, 60)}${msg.content.length > 60 ? '...' : ''}"`);

            const result = await sendChatTurn(token, fullMessages);
            // Update token in case it was refreshed
            if (result.token) token = result.token;

            console.log(`  → ${result.status} in ${result.elapsed}ms | provider=${result.headers['x-provider'] || '?'} model=${result.headers['x-model'] || '?'} finish=${result.headers['x-finish-reason'] || '?'}`);

            if (result.status !== 200) {
                console.error(`  ✗ Non-200 response at turn ${turnNum}: ${result.rawBody.slice(0, 200)}`);
                process.exit(1);
            }

            // Parse the SSE content
            const events = parseSSE(result.rawBody);
            const contentEvent = events.find(e => e.content);
            const assistantContent = contentEvent?.content || '';

            if (!assistantContent) {
                console.error(`  ✗ Empty assistant response at turn ${turnNum}`);
                process.exit(1);
            }

            // Check for timeout/error messages from the server
            if (assistantContent.includes('taking longer than usual') ||
                assistantContent.includes('having trouble') ||
                assistantContent.includes('high demand')) {
                console.log(`  ⚠ Server returned a timeout/error message: "${assistantContent.slice(0, 80)}..."`);
                console.log(`  ⚠ This indicates the previous timeout fixes helped but need more tuning.\n`);
                // Don't abort — continue testing to see if subsequent turns recover
            } else {
                console.log(`  ← Assistant: "${assistantContent.split('\n')[0].slice(0, 70)}..."\n`);
            }
        }
    }

    // Phase 2: Send the final "give me diagnosis" message
    turnNum++;
    console.log(`Turn ${turnNum} [user — FINAL]: "${FINAL_USER_MESSAGE}"`);
    console.log('  ⏳ Waiting for full diagnosis response (may take 20-40s)...\n');

    fullMessages.push({ role: 'user', content: FINAL_USER_MESSAGE });

    const finalStart = Date.now();
    const finalResult = await sendChatTurn(token, fullMessages);
    const finalElapsed = Date.now() - finalStart;

    console.log(`  Response: ${finalResult.status} in ${finalElapsed}ms`);
    console.log(`  Headers:  provider=${finalResult.headers['x-provider'] || '?'} model=${finalResult.headers['x-model'] || '?'} finish=${finalResult.headers['x-finish-reason'] || '?'}`);

    if (finalResult.status !== 200) {
        console.error(`  ✗ Non-200 response on final turn: ${finalResult.rawBody.slice(0, 300)}`);
        process.exit(1);
    }

    // Parse SSE
    const finalEvents = parseSSE(finalResult.rawBody);
    const hasDone = finalEvents.some(e => e.done);
    const contentEvent = finalEvents.find(e => e.content);
    const fullContent = contentEvent?.content || '';

    console.log(`  Content length: ${fullContent.length} chars`);
    console.log(`  SSE [DONE]: ${hasDone ? '✓' : '✗'}`);

    // ── Cutoff checks ──────────────────────────────────────────────────
    const results = [];
    const fail = (msg) => { results.push(`✗ FAIL: ${msg}`); };
    const pass = (msg) => { results.push(`✓ PASS: ${msg}`); };

    // Check 1: Did we get a non-empty response?
    if (fullContent.length > 50) {
        pass(`Non-empty response (${fullContent.length} chars)`);
    } else {
        fail(`Response too short (${fullContent.length} chars) — likely cut off`);
    }

    // Check 2: finish_reason !== 'length'
    const finishReason = finalResult.headers['x-finish-reason'] || '';
    if (finishReason === 'length') {
        fail(`finish_reason="length" — token budget was exceeded, response truncated`);
    } else if (finishReason === 'length-fallback-card') {
        fail(`finish_reason="length-fallback-card" — truncated, fell back to generic card`);
    } else {
        pass(`finish_reason="${finishReason}" (not truncated)`);
    }

    // Check 3: SSE [DONE] marker received
    if (hasDone) {
        pass('SSE [DONE] marker received — stream completed');
    } else {
        fail('No SSE [DONE] marker — stream may have been cut');
    }

    // Check 4: Not a server error/timeout message
    if (fullContent.includes('taking longer than usual') ||
        fullContent.includes('having trouble') ||
        fullContent.includes('high demand')) {
        fail(`Server returned an error/timeout message instead of diagnosis`);
    } else {
        pass('Response is not an error/timeout message');
    }

    // Check 5: Contains valid fenced JSON
    const parsedJson = extractJsonFromResponse(fullContent);
    if (parsedJson) {
        pass('Contains valid fenced ```json``` block');
    } else {
        fail('No valid fenced JSON block found — diagnosis card missing or truncated');
    }

    // Check 6: JSON has required fields
    if (parsedJson) {
        const requiredFields = [
            'concern_summary', 'escalation_level', 'name', 'description',
            'severity', 'confidence', 'homeopathic_remedies', 'care_plan',
            'when_to_consult', 'disclaimer'
        ];
        const missing = requiredFields.filter(f => !(f in parsedJson));
        if (missing.length === 0) {
            pass(`All ${requiredFields.length} required fields present in diagnosis card`);
        } else {
            fail(`Missing fields in diagnosis card: ${missing.join(', ')}`);
        }

        // Check remedy arrays are populated (not empty)
        const homeo = parsedJson.homeopathic_remedies;
        if (Array.isArray(homeo) && homeo.length > 0) {
            pass(`homeopathic_remedies populated (${homeo.length} remedies)`);
        } else {
            fail('homeopathic_remedies is empty — remedies not generated');
        }

        // Check confidence is reasonable
        if (typeof parsedJson.confidence === 'number' && parsedJson.confidence > 0) {
            pass(`confidence = ${parsedJson.confidence}%`);
        } else {
            fail(`confidence missing or zero`);
        }
    }

    // Check 7: Response time within Vercel limits
    if (finalElapsed < 55000) {
        pass(`Response time ${(finalElapsed / 1000).toFixed(1)}s — within Vercel 60s limit`);
    } else {
        fail(`Response time ${(finalElapsed / 1000).toFixed(1)}s — dangerously close to Vercel 60s wall`);
    }

    // ── Summary ────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════');
    console.log('  CUTOFF TEST RESULTS');
    console.log('══════════════════════════════════════════════');
    for (const r of results) {
        console.log(`  ${r}`);
    }

    const failures = results.filter(r => r.startsWith('✗'));
    console.log('──────────────────────────────────────────────');
    if (failures.length === 0) {
        console.log('  🟢 ALL CHECKS PASSED — No cutoff detected');
    } else {
        console.log(`  🔴 ${failures.length} CHECK(S) FAILED — Cutoff risk remains`);
    }
    console.log('══════════════════════════════════════════════\n');

    // Preview the first/last parts of the response
    if (fullContent.length > 0) {
        console.log('── Response Preview (first 300 chars) ──');
        console.log(fullContent.slice(0, 300));
        console.log('\n── Response Preview (last 300 chars) ──');
        console.log(fullContent.slice(-300));
    }

    process.exit(failures.length > 0 ? 1 : 0);
}

main().catch(e => {
    console.error('Unhandled error:', e);
    process.exit(1);
});
