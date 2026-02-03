
const { createClient } = require('@supabase/supabase-js');

// Hardcoded from .env.local view (Step 236)
const supabaseUrl = "https://jqtfqseimrqusumznnpv.supabase.co";
const supabaseKey = "sb_publishable__KtyJoTKmxFgOtS0wQI9bw_rN17qGlM";

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDoctors() {
    console.log('--- Debugging Doctor Data ---');

    // 1. Fetch all doctors
    const { data: doctors, error: docError } = await supabase
        .from('doctors')
        .select('*');

    if (docError) {
        console.error('Error fetching doctors:', docError);
        return;
    }
    console.log(`Found ${doctors.length} doctor records.`);

    if (doctors.length === 0) return;

    // 2. Extract IDs
    const userIds = doctors.map(d => d.user_id);
    // console.log('Doctor User IDs:', userIds);

    // 3. Fetch corresponding profiles
    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', userIds);

    if (profError) {
        console.error('Error fetching profiles:', profError);
        return;
    }
    console.log(`Found ${profiles.length} matching profiles.`);

    // 4. Analyze Mismatches
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    doctors.forEach(d => {
        const p = profileMap.get(d.user_id);
        if (!p) {
            console.error(`[CRITICAL] Doctor (ID: ${d.id}) has user_id ${d.user_id} BUT NO PROFILE found.`);
        } else {
            console.log(`[OK] Doctor ${d.id} -> Profile: ${p.full_name} (${p.role})`);
            if (!p.full_name) console.warn(`  [WARN] Profile exists but full_name is empty/null.`);
        }
    });
}

debugDoctors();
