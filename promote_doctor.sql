-- Promote a user to Doctor manually
-- Usage: Run this in Supabase SQL Editor

DO $$
DECLARE
    target_email TEXT := 'doctor_test@healio.ai';
    target_uid UUID;
BEGIN
    -- 1. Find User
    SELECT id INTO target_uid FROM auth.users WHERE email = target_email;

    IF target_uid IS NOT NULL THEN
        -- 2. Update Auth Metadata (Required for AuthContext routing)
        UPDATE auth.users
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{role}',
            '"doctor"'
        )
        WHERE id = target_uid;

        -- 3. Update Profile Role
        INSERT INTO public.profiles (id, email, role, full_name)
        VALUES (target_uid, target_email, 'doctor', 'Dr. Test')
        ON CONFLICT (id) DO UPDATE
        SET role = 'doctor';

        -- 4. Ensure Doctor Record Exists & Verified
        INSERT INTO public.doctors (
            user_id, 
            verification_status, 
            verified, 
            is_profile_complete
        )
        VALUES (
            target_uid, 
            'approved', 
            TRUE, 
            TRUE
        )
        ON CONFLICT (user_id) DO UPDATE
        SET 
            verification_status = 'approved', 
            verified = TRUE,
            is_profile_complete = TRUE;

        RAISE NOTICE 'User % promoted to Doctor successfully.', target_email;
    ELSE
        RAISE WARNING 'User % not found. Sign up first!', target_email;
    END IF;
END $$;
