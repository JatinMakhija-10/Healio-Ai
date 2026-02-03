-- Upsert and Verify Dr. Mittal (doctor@healio_test)
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    target_email TEXT := 'doctor@healio_test';
    target_uid UUID;
BEGIN
    -- 1. Find User
    SELECT id INTO target_uid FROM auth.users WHERE email = target_email;

    IF target_uid IS NOT NULL THEN
        RAISE NOTICE 'Found user with ID: %', target_uid;

        -- 2. Update Auth Metadata (Verified & Role)
        UPDATE auth.users
        SET raw_user_meta_data = 
            COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            '{"role": "doctor", "doctor_verified": true, "full_name": "Dr. Mittal"}'::jsonb
        WHERE id = target_uid;

        -- 3. Upsert Profile
        INSERT INTO public.profiles (id, email, role, full_name, avatar_url)
        VALUES (
            target_uid, 
            target_email, 
            'doctor', 
            'Dr. Mittal',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Mittal' -- Placeholder avatar
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            role = 'doctor',
            full_name = 'Dr. Mittal';

        -- 4. Upsert Doctor Record (Verified & Approved)
        INSERT INTO public.doctors (
            user_id, 
            specialty,
            qualification,
            experience_years,
            bio,
            consultation_fee,
            verification_status, 
            verified, 
            is_profile_complete,
            availability
        )
        VALUES (
            target_uid, 
            ARRAY['General Medicine', 'Ayurveda'],
            'MBBS, MD',
            10,
            'Senior specialist with expertise in integrative medicine.',
            800,
            'approved', -- Setting to approved just in case 
            TRUE, 
            TRUE,
            '{"mon": ["09:00", "17:00"]}'::jsonb
        )
        ON CONFLICT (user_id) DO UPDATE
        SET 
            verification_status = 'approved', 
            verified = TRUE,
            is_profile_complete = TRUE;

        RAISE NOTICE 'SUCCESS: % has been fully promoted and verified.', target_email;
    ELSE
        RAISE WARNING 'ERROR: User % not found. Please Sign Up first in the app!', target_email;
    END IF;
END $$;
