
const { createClient } = require('@supabase/supabase-js');

// Use the same anon key/url as seed script or from env if available
const supabaseUrl = "https://jqtfqseimrqusumznnpv.supabase.co";
const supabaseKey = "sb_publishable__KtyJoTKmxFgOtS0wQI9bw_rN17qGlM";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("--- Checking Doctors ---");
    const { data: doctors, error: docError } = await supabase
        .from('doctors')
        .select('*');

    if (docError) console.error("Error fetching doctors:", docError);
    else console.log(`Found ${doctors.length} doctors.`);

    if (doctors.length > 0) {
        // Check profiles for these doctors
        const userIds = doctors.map(d => d.user_id);
        console.log("Doctor User IDs:", userIds);

        const { data: profiles, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

        if (profError) console.error("Error fetching profiles:", profError);
        else {
            console.log(`Found ${profiles.length} matching profiles.`);
            profiles.forEach(p => {
                console.log(`Profile: ${p.id} | Name: ${p.full_name} | Role: ${p.role}`);
            });
        }

        // Check for orphans
        const profileIds = new Set(profiles.map(p => p.id));
        const orphans = doctors.filter(d => !profileIds.has(d.user_id));
        if (orphans.length > 0) {
            console.log(`WARNING: ${orphans.length} doctors have no profile record!`);
            orphans.forEach(o => console.log(`Orphan Doctor UserID: ${o.user_id}`));
        }
    }
}

checkData();
