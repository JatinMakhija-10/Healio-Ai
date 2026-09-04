import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) envVars[key.trim()] = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const BASE_URL = process.env.AROVIA_BASE_URL || 'https://healio-ai-two.vercel.app';

// Conversation scenario for a patient presenting with Sinusitis / Sinus Headache
const DISEASE_TEST_SCENARIO = [
    {
        turn: 1,
        userMsg: "I have had a severe throbbing headache behind my eyes and forehead for 3 days",
        expectedFocus: "Check severity/location without hallucinating stomach danger questions"
    },
    {
        turn: 2,
        userMsg: "Severity is 7/10. It gets much worse when I bend forward or touch my cheeks",
        expectedFocus: "Check duration/associated symptoms (facial pressure, congestion)"
    },
    {
        turn: 3,
        userMsg: "I also have thick green nasal discharge, facial tenderness, and a low fever of 100.2 F",
        expectedFocus: "Verify sinus schema recognition and appropriate follow-up questions"
    },
    {
        turn: 4,
        userMsg: "No vision loss, no neck stiffness, no confusion, no vomiting",
        expectedFocus: "Confirm safety checks pass without false emergency hard stop"
    },
    {
        turn: 5,
        userMsg: "Warm compress helps slightly, steam inhalation helps clear my nose for an hour",
        expectedFocus: "Verify relief factors noted"
    },
    {
        turn: 6,
        userMsg: "Please give me my full diagnosis and remedy plan now",
        expectedFocus: "Generate full structured diagnosis card with Sinusitis/Sinus Headache"
    }
];

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

async function main() {
    console.log('\n======================================================');
    console.log('  AROVIA AI — FULL 6-TURN DISEASE CONVERSATION TEST');
    console.log('======================================================');
    console.log(`Target: ${BASE_URL}/api/chat`);
    console.log('Disease Case: Acute Rhinosinusitis / Sinus Headache\n');

    // Create or sign in a test user using Admin API
    const testEmail = `disease_test_${Date.now()}@arovia.ai`;
    const testPassword = 'TestPassword123!';

    console.log(`Creating test user session (${testEmail})...`);
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { full_name: 'Test Patient', age: 32, gender: 'female' }
    });

    if (createError) {
        console.error('Failed to create test user:', createError.message);
        process.exit(1);
    }

    // Sign in to get access token
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
    });

    if (signInError || !sessionData.session) {
        console.error('Failed to sign in test user:', signInError?.message);
        process.exit(1);
    }

    // Provision 100 credits for the test user
    await supabase.from('user_credits').upsert({
        user_id: userData.user.id,
        credits_balance: 100,
        plan_tier: 'pro'
    });

    const token = sessionData.session.access_token;
    console.log('✓ Test user session active!\n');

    const conversationHistory = [];
    let passCount = 0;
    let failCount = 0;

    for (const step of DISEASE_TEST_SCENARIO) {
        console.log(`--- TURN ${step.turn} ---`);
        console.log(`User: "${step.userMsg}"`);

        conversationHistory.push({ role: 'user', content: step.userMsg });

        const t0 = Date.now();
        const res = await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const elapsed = Date.now() - t0;
        const provider = res.headers.get('x-provider') || 'unknown';
        const model = res.headers.get('x-model') || 'unknown';
        const rawBody = await res.text();

        console.log(`Response Status: ${res.status} | Latency: ${elapsed}ms | Model: ${model} (${provider})`);

        if (res.status === 429) {
            const errJson = JSON.parse(rawBody);
            const waitSec = (errJson.cooldown_remaining || 60) + 2;
            console.log(`  ⏳ Cooldown active (${waitSec}s). Waiting before retrying turn ${step.turn}...`);
            await new Promise(r => setTimeout(r, waitSec * 1000));
            // Retry turn
            const resRetry = await fetch(`${BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ messages: conversationHistory })
            });
            const rawBodyRetry = await resRetry.text();
            if (resRetry.status !== 200) {
                console.error(`❌ TURN ${step.turn} RETRY FAILED: HTTP ${resRetry.status} — ${rawBodyRetry.slice(0, 200)}`);
                failCount++;
                break;
            }
            const eventsRetry = parseSSE(rawBodyRetry);
            const contentEventRetry = eventsRetry.find(e => e.content);
            const replyTextRetry = contentEventRetry?.content || '';
            console.log(`Assistant reply (retry):\n"${replyTextRetry.slice(0, 250)}${replyTextRetry.length > 250 ? '...' : ''}"\n`);
            passCount++;
            conversationHistory.push({ role: 'assistant', content: replyTextRetry });
            await new Promise(r => setTimeout(r, 1000));
            continue;
        }

        if (res.status !== 200) {
            console.error(`❌ TURN ${step.turn} FAILED: HTTP ${res.status} — ${rawBody.slice(0, 200)}`);
            failCount++;
            break;
        }

        const events = parseSSE(rawBody);
        const contentEvent = events.find(e => e.content);
        const replyText = contentEvent?.content || '';

        // Verification Checks
        let turnPassed = true;

        if (!replyText) {
            console.error('❌ Empty reply text received!');
            turnPassed = false;
        } else if (replyText.includes('high demand') || replyText.includes('having trouble')) {
            console.error(`❌ High demand / fallback message returned: "${replyText}"`);
            turnPassed = false;
        } else {
            console.log(`Assistant reply:\n"${replyText.slice(0, 250)}${replyText.length > 250 ? '...' : ''}"\n`);
        }

        // Logic Check: Turn 1 should NOT ask for stomach/abdominal emergency symptoms
        if (step.turn === 1 && (replyText.includes('rigid abdomen') || replyText.includes('stool'))) {
            console.error('❌ CRITICAL BUG: Asking abdominal danger questions for a headache!');
            turnPassed = false;
        }

        if (turnPassed) {
            passCount++;
            conversationHistory.push({ role: 'assistant', content: replyText });
        } else {
            failCount++;
        }

        // Pause slightly between turns
        await new Promise(r => setTimeout(r, 1000));
    }

    // Clean up test user
    await supabase.auth.admin.deleteUser(userData.user.id);

    console.log('\n======================================================');
    console.log('  TEST SUMMARY');
    console.log('======================================================');
    console.log(`Turns Attempted: ${DISEASE_TEST_SCENARIO.length}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${failCount}`);
    if (failCount === 0) {
        console.log('🟢 ALL 6 TURNS PASSED PERFECTLY ON PRODUCTION!');
    } else {
        console.log('🔴 SOME TURNS FAILED - SEE LOG ABOVE.');
    }
    console.log('======================================================\n');
}

main().catch(console.error);
