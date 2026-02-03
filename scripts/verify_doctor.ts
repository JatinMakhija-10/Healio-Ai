
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyDoctor() {
    const email = 'doctor@healio_test';
    console.log(`Looking for user with email: ${email}`);

    // 1. Get User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error(`User with email ${email} not found.`);
        return;
    }

    console.log(`Found user: ${user.id}`);

    // 2. Update Auth Metadata
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { user_metadata: { ...user.user_metadata, doctor_verified: true, role: 'doctor' } }
    );

    if (updateError) {
        console.error('Error updating user metadata:', updateError);
        return;
    }

    console.log('User metadata updated.');

    // 3. Update Doctors Table
    // Check if doctor record exists
    const { data: doctor, error: doctorFetchError } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (doctorFetchError && doctorFetchError.code !== 'PGRST116') { // PGRST116 is "Results contain 0 rows"
        console.error('Error checking doctor record:', doctorFetchError);
    }

    let error;
    if (!doctor) {
        console.log('Doctor record not found, creating one...');
        // Creating a minimal doctor record if it doesn't exist
        const { error: insertError } = await supabase
            .from('doctors')
            .insert({
                user_id: user.id,
                verification_status: 'verified',
                verified: true,
                specialty: ['General Medicine'], // Default
                consultation_fee: 500,
                experience_years: 5,
                qualification: 'MBBS',
                bio: 'Verified by Healio Admin',
                updated_at: new Date().toISOString()
            });
        error = insertError;
    } else {
        console.log('Doctor record found, updating status...');
        const { error: updateDbError } = await supabase
            .from('doctors')
            .update({
                verification_status: 'verified',
                verified: true,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
        error = updateDbError;
    }

    if (error) {
        console.error('Error updating doctors table:', error);
    } else {
        console.log(`Successfully verified doctor: ${email}`);
    }
}

verifyDoctor().catch(console.error);
