-- Fix Schema Constraint Issue
-- The API expects 'verified' but the schema only allows: pending, approved, rejected, more_info_required

-- Step 1: Drop the old constraint
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_verification_status_check;

-- Step 2: Add new constraint that includes 'verified'
ALTER TABLE doctors ADD CONSTRAINT doctors_verification_status_check 
CHECK (verification_status IN ('pending', 'approved', 'verified', 'rejected', 'more_info_required'));

-- Step 3: Now update the doctor to verified
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

-- Step 4: Verify the change
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
