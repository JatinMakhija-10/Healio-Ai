
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn('Warning loading .env.local (might not matter if vars are in process):', result.error.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

console.log('Supabase URL found:', !!supabaseUrl);
console.log('Supabase Key found:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    console.error('Available keys:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestDoctor() {
    const email = 'doctor_test@healio.ai';
    const password = 'Doctor123!@#'; // Strong password

    console.log(`Creating test doctor: ${email}`);

    // 1. Sign up
    const { data, error } = await supabase.auth.signUp({
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

    if (error) {
        console.warn('Signup returned error:', error.message);
        // If already registered, try to login to verify
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
            console.log('User already exists. Trying login...');
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (loginError) {
                console.error('Login failed:', loginError.message);
            } else {
                console.log('Login successful for existing user!');
                if (loginData.user) {
                    console.log('User ID:', loginData.user.id);
                    console.log('User Role:', loginData.user.user_metadata?.role);
                }
            }
        }
        return;
    }

    console.log('Signup successful!');
    if (data.user) {
        console.log('User ID:', data.user.id);
        console.log('Role:', data.user.user_metadata?.role);
    }

    if (data.session) {
        console.log('Session created.');
        console.log('Credentials:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    } else if (data.user && !data.session) {
        console.log('User created. Email confirmation might be required.');
        console.log('Credentials:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    }
}

createTestDoctor();
