
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envPath = path.resolve(process.cwd(), 'backend', '.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in environment variables.');
    console.error('URL:', supabaseUrl);
    // Don't print the key for security, just check if it exists
    console.error('Key exists:', !!supabaseServiceKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugInbox() {
    console.log('--- Debugging Doctor Inbox ---');

    // 1. Fetch all appointments
    const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select('*');

    if (aptError) {
        console.error('Error fetching appointments:', aptError);
        return;
    }
    console.log(`Found ${appointments.length} appointments.`);

    // 2. Fetch all profiles
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, role');
    const profileMap = new Map(profiles?.map(p => [p.id, p]));

    // 3. Fetch doctors
    const { data: doctors } = await supabase.from('doctors').select('id, user_id');
    const doctorMap = new Map(doctors?.map(d => [d.id, d.user_id]));

    console.log('\n--- Appointment Analysis ---');
    for (const apt of appointments) {
        const doctorUserId = doctorMap.get(apt.doctor_id);
        const patientProfile = profileMap.get(apt.patient_id);
        const doctorProfile = profileMap.get(doctorUserId);

        // Simple heuristic to check if it's the specific case the user is seeing
        const isSuspect = doctorUserId === apt.patient_id;
        const status = isSuspect ? '⚠️ SELF-BOOKING' : 'OK';

        console.log(`Appointment ${apt.id} [${status}]:`);
        console.log(`  Doctor: ${doctorProfile?.full_name} (${doctorUserId})`);
        console.log(`  Patient: ${patientProfile?.full_name} (${apt.patient_id})`);
    }

    // 4. Fetch Doctor Inbox View
    console.log('\n--- Doctor Inbox View Dump ---');
    const { data: inboxView, error: viewError } = await supabase
        .from('doctor_inbox_view')
        .select('*');

    if (viewError) {
        console.error('Error fetching view:', viewError);
    } else {
        console.log(`View has ${inboxView.length} rows.`);
        inboxView.forEach(row => {
            console.log(`Row: Patient Name: "${row.patient_name}", Doctor Name Logic (if applicable): ???`);
            // console.log(JSON.stringify(row, null, 2));
        });
    }
}

debugInbox();
