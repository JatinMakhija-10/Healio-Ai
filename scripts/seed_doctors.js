
const { createClient } = require('@supabase/supabase-js');

// Hardcoded creds (Service Role needed for creating users, or we simulate by just inserting to Public tables if RLS allows, but proper way is Admin Auth)
// Since we don't have Service Role readily available in env vars usually (it's hidden), we will try to use the ANON key but we might hit RLS issues if we try to create users.
// HOWEVER, we can just insert into 'profiles' and 'doctors' if we generate random UUIDs ourselves, IF RLS allows insert for anon/authenticated.
// Use the credentials we found earlier.

const supabaseUrl = "https://jqtfqseimrqusumznnpv.supabase.co";
const supabaseKey = "sb_publishable__KtyJoTKmxFgOtS0wQI9bw_rN17qGlM"; // This is likely ANON key. 

// NOTE: Creating users in auth.users requires Service Role. With Anon key we can only signUp.
// We will use signUp in a loop.

const supabase = createClient(supabaseUrl, supabaseKey);

const SPECIALIZATIONS = [
    "Ayurveda",
    "General Medicine",
    "Dermatology",
    "Cardiology",
    "Gynecology",
    "Pediatrics",
    "Neurology",
    "Orthopedics",
    "Psychiatry",
    "Nutrition & Dietetics",
    "Homeopathy",
    "Physiotherapy",
    "Dentistry"
];

const NAMES = [
    { first: "Aditi", last: "Sharma", gender: "female" },
    { first: "Rahul", last: "Verma", gender: "male" },
    { first: "Priya", last: "Patel", gender: "female" },
    { first: "Amit", last: "Kumar", gender: "male" },
    { first: "Sneha", last: "Reddy", gender: "female" },
    { first: "Vikram", last: "Singh", gender: "male" },
    { first: "Anjali", last: "Gupta", gender: "female" },
    { first: "Rohan", last: "Mehta", gender: "male" }
];

async function seedDoctors() {
    console.log("--- Seeding Doctors ---");

    for (const person of NAMES) {
        const email = `${person.first.toLowerCase()}.${person.last.toLowerCase()}.${Math.floor(Math.random() * 1000)}@healio.test`;
        const password = "password123";
        const fullName = `Dr. ${person.first} ${person.last}`;
        const specialization = SPECIALIZATIONS[Math.floor(Math.random() * SPECIALIZATIONS.length)];

        console.log(`Creating: ${fullName} (${specialization}) - ${email}`);

        // 1. Sign Up (Creates auth user + trigger creates profile)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: 'doctor',
                    // Random Avatar
                    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.first}${person.last}`
                }
            }
        });

        if (authError) {
            console.error(`  Error creating user: ${authError.message}`);
            // If user already exists, we might want to proceed to update checks
            if (!authError.message.includes("User already registered")) {
                continue;
            }
        }

        const userId = authData.user?.id;
        if (!userId) {
            console.error("  No user ID returned.");
            continue;
        }

        console.log(`  User created/found: ${userId}`);

        // 1.5 Explicitly Ensure Profile Exists (Trigger might have failed)
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                full_name: fullName,
                role: 'doctor',
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.first}${person.last}`,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (profileError) {
            console.error(`  Error upserting profile: ${profileError.message}`);
        } else {
            console.log(`  Profile ensure/updated.`);
        }

        // 2. Update Doctor Details (Trigger might have created empty doctor)
        // We update it with specific details
        const { error: docError } = await supabase
            .from('doctors')
            .upsert({
                user_id: userId,
                specialty: [specialization],
                qualification: "MBBS, MD",
                experience_years: Math.floor(Math.random() * 15) + 5,
                bio: `Experienced ${specialization} with a focus on holistic patient care.`,
                consultation_fee: (Math.floor(Math.random() * 15) + 5) * 100, // 500-2000
                verification_status: 'verified', // Auto-verify
                verified: true,
                availability: {
                    "monday": ["09:00-17:00"],
                    "tuesday": ["09:00-17:00"],
                    "wednesday": ["09:00-17:00"],
                    "thursday": ["09:00-17:00"],
                    "friday": ["09:00-17:00"]
                }
            }, { onConflict: 'user_id' });

        if (docError) {
            console.error(`  Error updating doctor details: ${docError.message}`);
        } else {
            console.log(`  Doctor details updated.`);
        }

        // Wait a bit to avoid rate limits
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log("--- Seeding Complete ---");
}

seedDoctors();
