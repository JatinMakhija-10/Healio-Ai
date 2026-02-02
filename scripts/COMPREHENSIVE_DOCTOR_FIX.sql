-- COMPREHENSIVE FIX for Doctor Visibility
-- Run this entire script in Supabase Dashboard > SQL Editor

-- ====================================================================
-- Step 1: Fix the schema constraint to allow 'verified' status
-- ====================================================================
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_verification_status_check;

ALTER TABLE doctors ADD CONSTRAINT doctors_verification_status_check 
CHECK (verification_status IN ('pending', 'approved', 'verified', 'rejected', 'more_info_required'));

-- ====================================================================
-- Step 2: Find and verify the existing doctor account
-- ====================================================================
-- First, let's see what we have
SELECT 
    u.id as user_id,
    u.email,
    d.id as doctor_id,
    d.verification_status,
    d.verified,
    d.specialization,
    d.consultation_fee,
    p.full_name,
    p.role as profile_role
FROM auth.users u
LEFT JOIN doctors d ON d.user_id = u.id
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'doctor_test@healio.ai';

-- ====================================================================
-- Step 3: Update doctor record to verified (if it exists)
-- ====================================================================
UPDATE doctors
SET 
    verification_status = 'verified',
    verified = true,
    verified_at = NOW(),
    specialization = COALESCE(specialization, 'Ayurvedic Practitioner'),
    consultation_fee = COALESCE(consultation_fee, 500),
    bio = COALESCE(bio, 'Experienced doctor specializing in holistic wellness'),
    experience_years = COALESCE(experience_years, 5)
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'doctor_test@healio.ai'
);

-- ====================================================================
-- Step 4: Ensure profile exists and has correct role
-- ====================================================================
UPDATE profiles
SET role = 'doctor'
WHERE id = (SELECT id FROM auth.users WHERE email = 'doctor_test@healio.ai')
AND role != 'doctor';

-- ====================================================================
-- Step 5: Verify the changes
-- ====================================================================
SELECT 
    u.email,
    d.verification_status,
    d.verified,
    d.specialization,
    d.consultation_fee,
    d.bio,
    p.full_name,
    p.role
FROM auth.users u
JOIN doctors d ON d.user_id = u.id
JOIN profiles p ON p.id = u.id
WHERE u.email = 'doctor_test@healio.ai';

-- ====================================================================
-- Step 6: Test the API query (what patient search uses)
-- ====================================================================
SELECT 
    d.*,
    p.full_name
FROM doctors d
LEFT JOIN profiles p ON p.id = d.user_id
WHERE d.verification_status = 'verified';
