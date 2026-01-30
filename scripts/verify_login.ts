
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuth() {
    const email = 'doctor_test@healio.ai';
    const password = 'Doctor123!@#';

    console.log(`\n--- Debugging Auth for ${email} ---`);

    // 1. Try Login
    console.log('1. Attempting Login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (!loginError) {
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('User ID:', loginData.user.id);
        console.log('Role:', loginData.user.user_metadata?.role);
        return;
    }

    console.log('❌ Login Failed:', loginError.message);

    // 2. Try Signup if login failed
    if (loginError.message === 'Invalid login credentials') {
        console.log('\n2. Attempting Signup (Recreation)...');

        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: 'doctor',
                    full_name: 'Test Doctor',
                    doctor_verified: true
                }
            }
        });

        if (signupError) {
            console.error('❌ SIGNUP FAILED:', signupError);
            console.error('Message:', signupError.message);
            // Check for specific database errors
            if (signupError.message.includes('Database error')) {
                console.log('Note: This implies a trigger or RLS policy failed.');
            }
        } else {
            console.log('✅ SIGNUP RESPONSE RECEIVED');
            console.log('User:', signupData.user ? 'Created (ID: ' + signupData.user.id + ')' : 'NULL');
            console.log('Session:', signupData.session ? 'Active' : 'NULL (Email confirmation likely required)');

            if (signupData.user && !signupData.session) {
                console.log('\n!!! IMPORTANT !!!');
                console.log('The user was created but no session was returned.');
                console.log('This usually means EMAIL CONFIRMATION is enabled in your Supabase project.');
                console.log('You must check the email for ' + email + ' or manually verify the user in Supabase dashboard.');
            }
        }
    }
}

debugAuth();
