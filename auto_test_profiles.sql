-- =============================================
-- AUTO TEST DATA SETUP
-- =============================================
-- 1. Signs up 'doctor.test@healio.ai' and 'patient.test@healio.ai' automatically
--    (if they don't exist in auth.users)
-- 2. Creates their profiles and doctor details
-- 
-- UUIDS USED:
-- Doctor:  a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
-- Patient: b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22
-- =============================================

DO $$
DECLARE
    v_doctor_uuid UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    v_patient_uuid UUID := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22';
    v_doctor_email TEXT := 'doctor.test@healio.ai';
    v_patient_email TEXT := 'patient.test@healio.ai';
BEGIN
    -- 1. Create Auth Users (if not exist)
    -- NOTE: Providing a dummy hash. Login might require 'Forgot Password' flow 
    -- or creating the user manually in Auth UI if this insert fails/is insufficient.
    -- Ideally, create these users in Supabase Dashboard first!
    
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES 
    (
        v_doctor_uuid, 
        '00000000-0000-0000-0000-000000000000', 
        'authenticated', 
        'authenticated', 
        v_doctor_email, 
        '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0123456789', -- Dummy hash
        NOW(), 
        NOW(), 
        NOW(), 
        '{"provider":"email","providers":["email"]}', 
        '{"role":"doctor","full_name":"Dr. Test Doctor"}', 
        NOW(), 
        NOW(), 
        '', 
        '', 
        '', 
        ''
    )
    ON CONFLICT (id) DO NOTHING; -- If UUID exists, do nothing
    
    -- Handle case where email exists but UUID is different (manually created users)
    -- We switch to updating the profile for the EXISTING user found by email
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_doctor_email AND id != v_doctor_uuid) THEN
        SELECT id INTO v_doctor_uuid FROM auth.users WHERE email = v_doctor_email;
    END IF;

    -- Repeat for Patient
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES 
    (
        v_patient_uuid, 
        '00000000-0000-0000-0000-000000000000', 
        'authenticated', 
        'authenticated', 
        v_patient_email, 
        '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0123456789', 
        NOW(), 
        NOW(), 
        NOW(), 
        '{"provider":"email","providers":["email"]}', 
        '{"role":"patient","full_name":"Test Patient"}', 
        NOW(), 
        NOW(), 
        '', 
        '', 
        '', 
        ''
    )
    ON CONFLICT (id) DO NOTHING;

    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_patient_email AND id != v_patient_uuid) THEN
        SELECT id INTO v_patient_uuid FROM auth.users WHERE email = v_patient_email;
    END IF;

    -- 2. CREATE PROFILES
    RAISE NOTICE 'Setting up Doctor: % (ID: %)', v_doctor_email, v_doctor_uuid;
    
    INSERT INTO public.profiles (id, email, role, full_name, phone)
    VALUES (v_doctor_uuid, v_doctor_email, 'doctor', 'Dr. Test Doctor', '+91-9999999999')
    ON CONFLICT (id) DO UPDATE SET role = 'doctor', full_name = 'Dr. Test Doctor';

    RAISE NOTICE 'Setting up Patient: % (ID: %)', v_patient_email, v_patient_uuid;
    
    INSERT INTO public.profiles (id, email, role, full_name, phone)
    VALUES (v_patient_uuid, v_patient_email, 'patient', 'Test Patient', '+91-8888888888')
    ON CONFLICT (id) DO UPDATE SET role = 'patient', full_name = 'Test Patient';

    -- 3. CREATE DOCTOR DETAILS
    INSERT INTO public.doctors (
        user_id, specialty, qualification, experience_years, bio, 
        verified, verification_status, license_number, verified_at, 
        availability, consultation_fee, consultation_duration, 
        accepts_new_patients, total_consultations, rating, rating_count
    ) VALUES (
        v_doctor_uuid,
        ARRAY['General Medicine', 'Ayurveda'],
        'MBBS, BAMS',
        5,
        'Test doctor profile for development and testing.',
        true,
        'approved',
        'TEST-LIC-12345',
        NOW(),
        '{
            "monday": ["09:00-17:00"],
            "tuesday": ["09:00-17:00"],
            "wednesday": ["09:00-17:00"],
            "thursday": ["09:00-17:00"],
            "friday": ["09:00-17:00"]
        }'::jsonb,
        500.00,
        30,
        true,
        50,
        4.5,
        25
    )
    ON CONFLICT (user_id) DO UPDATE SET
        verified = true, verification_status = 'approved',
        availability = EXCLUDED.availability;

END $$;
