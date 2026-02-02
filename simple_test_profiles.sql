-- =============================================
-- SIMPLE TEST PROFILES - Doctor and Patient
-- =============================================
-- Instructions:
-- 1. Replace 'YOUR_DOCTOR_USER_ID' and 'YOUR_PATIENT_USER_ID' with actual UUIDs from auth.users
-- 2. Run in Supabase SQL Editor
-- =============================================

-- =============================================
-- Option A: If you already have users in auth.users
-- =============================================
-- First, find existing user IDs:
-- SELECT id, email, raw_user_meta_data->>'role' as role FROM auth.users LIMIT 10;

-- Then use those IDs below

-- =============================================
-- DOCTOR PROFILE
-- =============================================
-- Replace 'YOUR_DOCTOR_USER_ID' with an actual UUID from auth.users

-- Create/Update Profile
INSERT INTO public.profiles (id, email, role, full_name, phone)
VALUES (
    'YOUR_DOCTOR_USER_ID'::uuid,
    'doctor.test@healio.ai',
    'doctor',
    'Dr. Test Doctor',
    '+91-9999999999'
) ON CONFLICT (id) DO UPDATE SET
    role = 'doctor',
    full_name = 'Dr. Test Doctor';

-- Create Doctor Record
INSERT INTO public.doctors (
    user_id,
    specialty,
    qualification,
    experience_years,
    bio,
    verified,
    verification_status,
    license_number,
    verified_at,
    availability,
    consultation_fee,
    consultation_duration,
    accepts_new_patients,
    total_consultations,
    rating,
    rating_count
) VALUES (
    'YOUR_DOCTOR_USER_ID'::uuid,
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
) ON CONFLICT (user_id) DO UPDATE SET
    verified = true,
    verification_status = 'approved',
    specialty = ARRAY['General Medicine', 'Ayurveda'];

-- =============================================
-- PATIENT PROFILE
-- =============================================
-- Replace 'YOUR_PATIENT_USER_ID' with an actual UUID from auth.users

INSERT INTO public.profiles (id, email, role, full_name, phone)
VALUES (
    'YOUR_PATIENT_USER_ID'::uuid,
    'patient.test@healio.ai',
    'patient',
    'Test Patient',
    '+91-8888888888'
) ON CONFLICT (id) DO UPDATE SET
    role = 'patient',
    full_name = 'Test Patient';

-- =============================================
-- VERIFICATION
-- =============================================
-- Check if profiles were created:
SELECT p.full_name, p.email, p.role 
FROM public.profiles p 
WHERE p.email LIKE '%test@healio.ai%';

-- Check doctor record:
SELECT d.*, p.full_name 
FROM public.doctors d
JOIN public.profiles p ON d.user_id = p.id
WHERE p.email LIKE '%doctor.test@healio.ai%';
