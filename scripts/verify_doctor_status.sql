-- Fix Doctor Verification Status
-- This script sets the doctor_test@healio.ai account to verified status

-- First, find the doctor's user_id
SELECT 
    u.id as user_id,
    u.email,
    d.id as doctor_id,
    d.verification_status,
    d.verified,
    p.full_name,
    p.role
FROM auth.users u
LEFT JOIN doctors d ON d.user_id = u.id
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'doctor_test@healio.ai';

-- Update the doctor record to set verification_status to 'verified'
UPDATE doctors
SET 
    verification_status = 'verified',
    verified = true,
    verified_at = NOW()
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'doctor_test@healio.ai'
);

-- Verify the update
SELECT 
    u.email,
    d.verification_status,
    d.verified,
    d.specialty,
    d.consultation_fee
FROM auth.users u
JOIN doctors d ON d.user_id = u.id
WHERE u.email = 'doctor_test@healio.ai';
