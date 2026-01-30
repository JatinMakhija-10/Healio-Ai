
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const result = dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectUser() {
    const email = 'doctor_test@healio.ai';
    const password = 'Doctor123!@#';

    console.log(`Inspecting user: ${email}`);

    // Login to get the user object
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Login failed:', error.message);
        return;
    }

    const user = data.user;
    console.log('User ID:', user.id);
    console.log('User Metadata:', JSON.stringify(user.user_metadata, null, 2));

    const role = user.user_metadata?.role;
    console.log('Current Role:', role);

    if (role !== 'doctor') {
        console.log('❌ Role is NOT doctor! Attempting to fix...');

        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
            data: { role: 'doctor' }
        });

        if (updateError) {
            console.error('Failed to update role:', updateError.message);
        } else {
            console.log('✅ Role updated to doctor via updateUser.');
            console.log('New Metadata:', JSON.stringify(updateData.user.user_metadata, null, 2));
        }
    } else {
        console.log('✅ Role is correctly set to doctor.');
    }
}

inspectUser();
