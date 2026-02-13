-- =============================================
-- REPAIR SCRIPT: Fix Users with Missing Profiles
-- =============================================
-- Run this in Supabase SQL Editor to link 'auth.users'
-- to 'public.profiles' for accounts already created.

DO $$
DECLARE
    r RECORD;
    v_role TEXT;
BEGIN
    FOR r IN 
        SELECT id, email, raw_user_meta_data 
        FROM auth.users 
        WHERE id NOT IN (SELECT id FROM public.profiles)
    LOOP
        v_role := COALESCE(r.raw_user_meta_data->>'role', 'patient');
        
        RAISE NOTICE 'Repairing User: % (Role: %)', r.email, v_role;

        -- 1. Create Profile
        INSERT INTO public.profiles (id, email, role, full_name, created_at, updated_at)
        VALUES (
            r.id, 
            r.email, 
            v_role, 
            COALESCE(r.raw_user_meta_data->>'full_name', split_part(r.email, '@', 1)),
            NOW(),
            NOW()
        );

        -- 2. Create Doctor Record if applicable
        IF v_role = 'doctor' THEN
            INSERT INTO public.doctors (user_id, verification_status, verified, is_profile_complete, created_at)
            VALUES (r.id, 'approved', TRUE, TRUE, NOW())
            ON CONFLICT (user_id) DO NOTHING;
        END IF;

    END LOOP;
    
    RAISE NOTICE 'Repair Complete.';
END $$;
