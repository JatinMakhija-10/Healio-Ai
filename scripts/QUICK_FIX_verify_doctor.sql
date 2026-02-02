-- Quick Fix: Set Doctor as Verified
-- Run this in Supabase Dashboard > SQL Editor
-- Note: This bypasses the CHECK constraint, but the API expects 'verified'

UPDATE doctors
SET 
    verification_status = 'verified',
    verified = true,
    verified_at = NOW(),
    specialization = 'Ayurvedic Practitioner, General Physician',
    consultation_fee = 500
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'doctor_test@healio.ai'
);

-- Verify the change
SELECT 
    u.email,
    d.verification_status,
    d.verified,
    d.specialization,
    d.consultation_fee,
    p.full_name
FROM auth.users u
LEFT JOIN doctors d ON d.user_id = u.id
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'doctor_test@healio.ai';
