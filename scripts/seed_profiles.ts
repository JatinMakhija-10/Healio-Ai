
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const states = [
    'Maharashtra', 'Delhi', 'Kerala', 'Karnataka', 'Tamil Nadu',
    'Uttar Pradesh', 'Gujarat', 'West Bengal', 'Rajasthan', 'Telangana',
    'Andhra Pradesh', 'Madhya Pradesh', 'Bihar', 'Punjab', 'Haryana',
    'Odisha', 'Jammu and Kashmir', 'Jharkhand', 'Chhattisgarh', 'Assam'
];

async function seedProfiles() {
    console.log('Fetching profiles...');
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, state');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log(`Found ${profiles.length} profiles.`);

    let updatedCount = 0;
    for (const profile of profiles) {
        if (!profile.state) {
            const randomState = states[Math.floor(Math.random() * states.length)];
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ state: randomState })
                .eq('id', profile.id);

            if (updateError) {
                console.error(`Failed to update profile ${profile.id}:`, updateError);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`Updated ${updatedCount} profiles with random states.`);
}

seedProfiles();
