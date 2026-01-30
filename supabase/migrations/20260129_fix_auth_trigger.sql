-- =============================================
-- FIX SCRIPT: Doctor Signup & Auth Trigger
-- =============================================
-- Run this script in the Supabase SQL Editor to fix the 
-- "Database error saving new user" issue.
-- =============================================

-- 1. Ensure tables exist (Safe if they already exist)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    specialization TEXT,
    license_number TEXT,
    experience_years INTEGER,
    bio TEXT,
    consultation_fee DECIMAL(10, 2),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'more_info_required')),
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add potential missing columns required by the trigger
-- (It's safe to run these even if columns exist)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- 3. Reset the Auth Trigger
-- We drop and recreate it to ensure it matches the table schema perfectly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 4. Recreate the Handler Function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
  v_phone TEXT;
BEGIN
  -- Extract metadata from the sign-up event
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_phone := NEW.raw_user_meta_data->>'phone';
  
  -- Create profile entry
  INSERT INTO profiles (id, email, role, full_name, phone, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    v_role,
    v_full_name,
    v_phone,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;
  
  -- If user is a doctor, create the doctor entry
  IF v_role = 'doctor' THEN
    INSERT INTO doctors (
      user_id,
      verification_status,
      verified,
      is_profile_complete,
      onboarding_step,
      created_at
    )
    VALUES (
      NEW.id,
      'pending',
      FALSE,
      FALSE,
      0,
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recreate the Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. Grant permissions (just in case)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
