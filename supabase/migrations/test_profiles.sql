-- =============================================
-- TEST PROFILES: Doctor and Patient Data
-- =============================================
-- This script creates realistic test profiles for:
-- 1. Two complete doctor profiles (verified, with availability and specializations)
-- 2. Two patient profiles
-- These can be used to test the doctor-patient interface
-- 
-- IMPORTANT: Run this in your Supabase SQL Editor
-- Make sure to replace the UUIDs with actual auth.users IDs if needed
-- =============================================

-- =============================================
-- STEP 1: Create Test Auth Users (Manual Step)
-- =============================================
-- NOTE: You need to create these users manually through Supabase Auth UI first
-- or use the signup endpoints, then use their UUIDs below.
-- 
-- For testing, we'll use placeholder UUIDs - replace these with actual ones:
-- Doctor 1 UUID: '11111111-1111-1111-1111-111111111111'
-- Doctor 2 UUID: '22222222-2222-2222-2222-222222222222'
-- Patient 1 UUID: '33333333-3333-3333-3333-333333333333'
-- Patient 2 UUID: '44444444-4444-4444-4444-444444444444'

-- =============================================
-- STEP 2: Create Profiles
-- =============================================

-- Doctor 1 Profile: Dr. Priya Sharma (Cardiologist)
INSERT INTO public.profiles (id, email, role, full_name, phone, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'dr.priya.sharma@healio.test',
    'doctor',
    'Dr. Priya Sharma',
    '+91-9876543210',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;

-- Doctor 2 Profile: Dr. Rajesh Kumar (General Physician & Ayurveda Specialist)
INSERT INTO public.profiles (id, email, role, full_name, phone, created_at, updated_at)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'dr.rajesh.kumar@healio.test',
    'doctor',
    'Dr. Rajesh Kumar',
    '+91-9876543211',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;

-- Patient 1 Profile: Anjali Verma
INSERT INTO public.profiles (id, email, role, full_name, phone, created_at, updated_at)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'anjali.verma@patient.test',
    'patient',
    'Anjali Verma',
    '+91-9876543212',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;

-- Patient 2 Profile: Vikram Singh
INSERT INTO public.profiles (id, email, role, full_name, phone, created_at, updated_at)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    'vikram.singh@patient.test',
    'patient',
    'Vikram Singh',
    '+91-9876543213',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;

-- =============================================
-- STEP 3: Create Doctor Records
-- =============================================

-- Doctor 1: Dr. Priya Sharma - Cardiologist
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
    is_featured,
    total_consultations,
    rating,
    rating_count,
    created_at,
    updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    ARRAY['Cardiology', 'Internal Medicine'],
    'MBBS, MD (Cardiology), Fellowship in Interventional Cardiology',
    12,
    'Dr. Priya Sharma is a highly experienced cardiologist with over 12 years of experience in treating heart conditions. She specializes in preventive cardiology, heart failure management, and interventional procedures. She believes in a holistic approach combining modern medicine with lifestyle modifications.',
    true,
    'approved',
    'MCI-12345-CARD-2012',
    NOW() - INTERVAL '30 days',
    '{
        "monday": ["09:00-13:00", "15:00-18:00"],
        "tuesday": ["09:00-13:00", "15:00-18:00"],
        "wednesday": ["09:00-13:00"],
        "thursday": ["09:00-13:00", "15:00-18:00"],
        "friday": ["09:00-13:00", "15:00-18:00"],
        "saturday": ["10:00-14:00"]
    }'::jsonb,
    1200.00,
    30,
    true,
    true,
    156,
    4.7,
    89,
    NOW() - INTERVAL '2 years',
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    specialty = EXCLUDED.specialty,
    qualification = EXCLUDED.qualification,
    experience_years = EXCLUDED.experience_years,
    bio = EXCLUDED.bio,
    verified = EXCLUDED.verified,
    verification_status = EXCLUDED.verification_status,
    license_number = EXCLUDED.license_number,
    availability = EXCLUDED.availability,
    consultation_fee = EXCLUDED.consultation_fee,
    total_consultations = EXCLUDED.total_consultations,
    rating = EXCLUDED.rating,
    rating_count = EXCLUDED.rating_count;

-- Doctor 2: Dr. Rajesh Kumar - General Physician & Ayurveda Specialist
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
    is_featured,
    total_consultations,
    rating,
    rating_count,
    created_at,
    updated_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    ARRAY['General Medicine', 'Ayurveda', 'Prakriti Analysis'],
    'MBBS, BAMS (Bachelor of Ayurvedic Medicine and Surgery)',
    8,
    'Dr. Rajesh Kumar is a unique practitioner who combines modern allopathic medicine with traditional Ayurveda. With 8 years of experience, he specializes in chronic disease management, digestive disorders, and personalized Prakriti-based treatment plans. He is particularly skilled in integrating AI-driven Prakriti analysis with traditional diagnostic methods.',
    true,
    'approved',
    'MCI-67890-GEN-2016',
    NOW() - INTERVAL '60 days',
    '{
        "monday": ["10:00-14:00", "16:00-20:00"],
        "tuesday": ["10:00-14:00", "16:00-20:00"],
        "wednesday": ["10:00-14:00", "16:00-20:00"],
        "thursday": ["10:00-14:00"],
        "friday": ["10:00-14:00", "16:00-20:00"],
        "saturday": ["11:00-15:00"],
        "sunday": ["11:00-13:00"]
    }'::jsonb,
    800.00,
    45,
    true,
    false,
    234,
    4.9,
    142,
    NOW() - INTERVAL '3 years',
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    specialty = EXCLUDED.specialty,
    qualification = EXCLUDED.qualification,
    experience_years = EXCLUDED.experience_years,
    bio = EXCLUDED.bio,
    verified = EXCLUDED.verified,
    verification_status = EXCLUDED.verification_status,
    license_number = EXCLUDED.license_number,
    availability = EXCLUDED.availability,
    consultation_fee = EXCLUDED.consultation_fee,
    total_consultations = EXCLUDED.total_consultations,
    rating = EXCLUDED.rating,
    rating_count = EXCLUDED.rating_count;

-- =============================================
-- STEP 4: Create Sample Appointments
-- =============================================

-- Get doctor IDs
DO $$
DECLARE
    doctor1_id UUID;
    doctor2_id UUID;
BEGIN
    SELECT id INTO doctor1_id FROM public.doctors WHERE user_id = '11111111-1111-1111-1111-111111111111';
    SELECT id INTO doctor2_id FROM public.doctors WHERE user_id = '22222222-2222-2222-2222-222222222222';

    -- Appointment 1: Anjali with Dr. Priya (Upcoming)
    INSERT INTO public.appointments (
        patient_id,
        doctor_id,
        scheduled_at,
        duration_minutes,
        status,
        meeting_link,
        notes_for_doctor,
        created_at
    ) VALUES (
        '33333333-3333-3333-3333-333333333333',
        doctor1_id,
        NOW() + INTERVAL '2 days' + INTERVAL '10 hours',
        30,
        'confirmed',
        'https://meet.healio.ai/session-abc123',
        'Patient experiencing occasional chest discomfort and wants preventive cardiology advice.',
        NOW()
    ) ON CONFLICT DO NOTHING;

    -- Appointment 2: Vikram with Dr. Rajesh (Completed)
    INSERT INTO public.appointments (
        patient_id,
        doctor_id,
        scheduled_at,
        duration_minutes,
        status,
        meeting_link,
        notes_for_doctor,
        created_at,
        started_at,
        ended_at
    ) VALUES (
        '44444444-4444-4444-4444-444444444444',
        doctor2_id,
        NOW() - INTERVAL '5 days',
        45,
        'completed',
        'https://meet.healio.ai/session-xyz789',
        'Patient seeking Ayurvedic consultation for digestive issues and Prakriti analysis.',
        NOW() - INTERVAL '7 days',
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '5 days' + INTERVAL '45 minutes'
    ) ON CONFLICT DO NOTHING;

    -- Appointment 3: Anjali with Dr. Rajesh (Upcoming)
    INSERT INTO public.appointments (
        patient_id,
        doctor_id,
        scheduled_at,
        duration_minutes,
        status,
        notes_for_doctor,
        created_at
    ) VALUES (
        '33333333-3333-3333-3333-333333333333',
        doctor2_id,
        NOW() + INTERVAL '5 days' + INTERVAL '16 hours',
        45,
        'scheduled',
        'Follow-up on AI Prakriti diagnosis - wants detailed dietary recommendations.',
        NOW()
    ) ON CONFLICT DO NOTHING;
END $$;

-- =============================================
-- VERIFICATION QUERY
-- =============================================
-- Run this to verify the test data was inserted correctly:

-- Check Profiles
SELECT 
    p.full_name,
    p.email,
    p.role,
    p.phone
FROM public.profiles p
WHERE p.id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
)
ORDER BY p.role, p.full_name;

-- Check Doctors
SELECT 
    d.id,
    p.full_name,
    d.specialty,
    d.qualification,
    d.experience_years,
    d.consultation_fee,
    d.rating,
    d.total_consultations,
    d.verified
FROM public.doctors d
JOIN public.profiles p ON d.user_id = p.id
WHERE d.user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
)
ORDER BY p.full_name;

-- Check Appointments
SELECT 
    a.id,
    pp.full_name as patient_name,
    pd.full_name as doctor_name,
    a.scheduled_at,
    a.status,
    a.duration_minutes
FROM public.appointments a
JOIN public.profiles pp ON a.patient_id = pp.id
JOIN public.doctors d ON a.doctor_id = d.id
JOIN public.profiles pd ON d.user_id = pd.id
WHERE a.patient_id IN (
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
)
ORDER BY a.scheduled_at DESC;
