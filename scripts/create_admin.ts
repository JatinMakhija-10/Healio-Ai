/**
 * Healio.AI — Admin Seed Script
 * Creates an admin account in Supabase Auth + ensures profile has role=admin
 * 
 * Usage: npx ts-node scripts/create_admin.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL    = 'admin@healio.ai';
const ADMIN_PASSWORD = 'HealioAdmin@2024';
const ADMIN_NAME     = 'Healio Admin';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
    console.log('\n🔐 Healio.AI — Admin Account Setup\n');

    // 1. Try to create the auth user
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email:          ADMIN_EMAIL,
        password:       ADMIN_PASSWORD,
        email_confirm:  true,
        user_metadata:  { role: 'admin', full_name: ADMIN_NAME },
    });

    let userId: string;

    if (createError) {
        if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
            console.log(`⚠️  Auth user ${ADMIN_EMAIL} already exists — fetching existing user...`);
            const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
            if (listErr) throw listErr;
            const existing = users.find(u => u.email === ADMIN_EMAIL);
            if (!existing) throw new Error('Could not locate existing admin user');
            userId = existing.id;
            console.log(`✅ Found existing auth user: ${userId}`);
        } else {
            throw createError;
        }
    } else {
        userId = createData.user!.id;
        console.log(`✅ Created auth user: ${userId}`);
    }

    // 2. Upsert profile with role=admin
    const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
            id:         userId,
            email:      ADMIN_EMAIL,
            role:       'admin',
            full_name:  ADMIN_NAME,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

    if (profileErr) throw profileErr;
    console.log(`✅ Profile upserted with role=admin`);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Admin account ready!');
    console.log(`   Email    : ${ADMIN_EMAIL}`);
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    console.log(`   Login at : http://localhost:3000/login`);
    console.log('='.repeat(50) + '\n');
}

main().catch(err => {
    console.error('❌ Fatal:', err.message);
    process.exit(1);
});
