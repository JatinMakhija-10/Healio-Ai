-- Migration to manually verify doctor@healio_test

-- 1. Update the 'doctors' table to set verification_status to 'verified' for the corresponding user_id
UPDATE doctors
SET verification_status = 'verified',
    updated_at = NOW()
FROM auth.users
WHERE doctors.user_id = auth.users.id
  AND auth.users.email = 'doctor@healio_test';

-- 2. Update auth.users metadata to reflect the verified status (optional but recommended for consistency)
UPDATE auth.users
SET raw_user_meta_data = 
    CASE 
        WHEN raw_user_meta_data IS NULL THEN '{"doctor_verified": true}'::jsonb
        ELSE raw_user_meta_data || '{"doctor_verified": true}'::jsonb
    END
WHERE email = 'doctor@healio_test';
