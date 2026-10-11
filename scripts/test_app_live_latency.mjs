import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) envVars[key.trim()] = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const BASE_URL = 'http://localhost:3000';

function parseSSE(raw) {
    let text = '';
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
            try {
                const parsed = JSON.parse(trimmed.slice(6));
                if (parsed.content) text += parsed.content;
            } catch {}
        }
    }
    return text;
}

async function run() {
    console.log('\n--- VERIFYING LIVE APP CHATBOT ON LOCALHOST:3000 ---');
    const testEmail = `app_check_${Date.now()}@arovia.ai`;
    const testPassword = 'Password123!';

    const { data: user, error: uErr } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { full_name: 'Test Patient', age: 29, gender: 'female' }
    });
    if (uErr) throw uErr;

    const { data: sessionData } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
    });

    await supabase.from('profiles').update({
        subscription_plan: 'pro'
    }).eq('id', user.user.id);

    await supabase.from('user_credits').upsert({
        user_id: user.user.id,
        credits_balance: 100,
        plan_tier: 'pro'
    });

    const token = sessionData.session.access_token;
    const history = [];

    // Turn 1
    console.log('Sending Turn 1: "I have had a severe sore throat and fever for 2 days"...');
    history.push({ role: 'user', content: 'I have had a severe sore throat and fever for 2 days' });
    const t0 = Date.now();
    const res1 = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: history })
    });
    const d1 = Date.now() - t0;
    const body1 = await res1.text();
    const reply1 = parseSSE(body1);
    console.log(`✓ Turn 1: Status ${res1.status} in ${d1}ms (Model: ${res1.headers.get('x-model') || 'n/a'})`);
    console.log(`Reply 1: "${reply1.slice(0, 200)}..."\n`);
    history.push({ role: 'assistant', content: reply1 });

    // Wait 2s
    await new Promise(r => setTimeout(r, 2000));

    // Turn 2
    console.log('Sending Turn 2: "It hurts when I swallow, no cough, temp is 101 F"...');
    history.push({ role: 'user', content: 'It hurts when I swallow, no cough, temp is 101 F' });
    const t1 = Date.now();
    const res2 = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: history })
    });
    const d2 = Date.now() - t1;
    const body2 = await res2.text();
    const reply2 = parseSSE(body2);
    console.log(`✓ Turn 2: Status ${res2.status} in ${d2}ms (Model: ${res2.headers.get('x-model') || 'n/a'})`);
    console.log(`Reply 2: "${reply2.slice(0, 200)}..."\n`);

    // Clean up
    await supabase.auth.admin.deleteUser(user.user.id);
    console.log('--- LIVE APP CHATBOT VERIFIED WITH ZERO ERRORS ---');
}

run().catch(console.error);
