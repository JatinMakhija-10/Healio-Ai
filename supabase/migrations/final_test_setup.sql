-- =============================================
-- FINAL TEST DATA SETUP (Run this ONE file)
-- =============================================
-- FIXED VERSION: Matches the actual database schema
-- =============================================

DO $$
DECLARE
    v_doctor_uuid UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    v_patient_uuid UUID := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22';
BEGIN
    -- ---------------------------------------------------------
    -- 1. DOCTOR SETUP
    -- ---------------------------------------------------------
    -- Create Auth User
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES (
        v_doctor_uuid, 
        '00000000-0000-0000-0000-000000000000', 
        'authenticated', 
        'authenticated', 
        'doctor.test@healio.ai', 
        '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0123456789', -- Dummy hash
        NOW(), NOW(), NOW(), 
        '{"provider":"email","providers":["email"]}', 
        '{"role":"doctor","full_name":"Dr. Test Doctor"}', 
        NOW(), NOW(), '', '', '', ''
    ) ON CONFLICT (id) DO NOTHING;

    -- Create/Update Profile
    INSERT INTO public.profiles (id, email, role, full_name, phone)
    VALUES (v_doctor_uuid, 'doctor.test@healio.ai', 'doctor', 'Dr. Test Doctor', '+91-9999999999')
    ON CONFLICT (id) DO UPDATE SET role = 'doctor', full_name = 'Dr. Test Doctor';

    -- Create Doctor Details (Using CORRECT columns from schema)
    -- Schema has: specialization (text), experience_years, bio, consultation_fee, verification_status, verified
    INSERT INTO public.doctors (
        user_id, 
        specialization,     -- Changed from specialty (array) to specialization (text)
        experience_years, 
        bio, 
        verified, 
        verification_status, 
        license_number, 
        consultation_fee
    ) VALUES (
        v_doctor_uuid,
        'General Medicine, Ayurveda',
        5,
        'Test doctor profile for development and testing.',
        true,
        'approved',
        'TEST-LIC-12345',
        500.00
    ) ON CONFLICT (user_id) DO UPDATE SET 
        verified = true, 
        verification_status = 'approved',
        specialization = 'General Medicine, Ayurveda';

    -- ---------------------------------------------------------
    -- 2. PATIENT SETUP
    -- ---------------------------------------------------------
    -- Create Auth User
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES (
        v_patient_uuid, 
        '00000000-0000-0000-0000-000000000000', 
        'authenticated', 
        'authenticated', 
        'patient.test@healio.ai', 
        '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0123456789', -- Dummy hash
        NOW(), NOW(), NOW(), 
        '{"provider":"email","providers":["email"]}', 
        '{"role":"patient","full_name":"Test Patient"}', 
        NOW(), NOW(), '', '', '', ''
    ) ON CONFLICT (id) DO NOTHING;

    -- Create/Update Profile
    INSERT INTO public.profiles (id, email, role, full_name, phone)
    VALUES (v_patient_uuid, 'patient.test@healio.ai', 'patient', 'Test Patient', '+91-8888888888')
    ON CONFLICT (id) DO UPDATE SET role = 'patient', full_name = 'Test Patient';

    RAISE NOTICE 'SUCCESS: Test users created (Schema Adjusted)!';
END $$;
