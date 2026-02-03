
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../backend/.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in environment variables.');
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

        console.log(`Appointment ${apt.id}:`);
        console.log(`  Doctor ID: ${apt.doctor_id} (User: ${doctorUserId}) -> Name: ${doctorProfile?.full_name}`);
        console.log(`  Patient ID: ${apt.patient_id} -> Name: ${patientProfile?.full_name}`);

        if (doctorUserId === apt.patient_id) {
            console.warn('  ⚠️ SELF-BOOKING DETECTED: Doctor and Patient are the same user.');
        }
    }

    // 4. Fetch Doctor Inbox View
    console.log('\n--- Doctor Inbox View Dump ---');
    const { data: inboxView, error: viewError } = await supabase
        .from('doctor_inbox_view')
        .select('*');

    if (viewError) {
        console.error('Error fetching view:', viewError);
    } else {
        inboxView.forEach(row => {
            console.log(`Row: Patient Name: "${row.patient_name}", Appointment: ${row.appointment_id}`);
        });
    }
}

debugInbox();
