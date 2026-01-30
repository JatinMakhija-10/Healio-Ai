
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceUpdate() {
    const email = 'doctor_test@healio.ai';
    const password = 'Doctor123!@#';

    console.log(`Force updating user: ${email}`);

    // 1. Sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (signInError) {
        console.error('Login failed:', signInError.message);
        return;
    }

    // 2. Update metadata
    const { data, error } = await supabase.auth.updateUser({
        data: {
            role: 'doctor',
            doctor_verified: true,
            full_name: 'Dr. Test'
        }
    });

    if (error) {
        console.error('Update failed:', error.message);
    } else {
        console.log('✅ User updated successfully.');
        console.log('Role:', data.user.user_metadata.role);
        console.log('Verified:', data.user.user_metadata.doctor_verified);
    }
}

forceUpdate();
