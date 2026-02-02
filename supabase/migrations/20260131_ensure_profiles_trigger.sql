-- =============================================
-- FIX: Ensure Profile Creation Trigger Exists
-- =============================================
-- This script guarantees the trigger to create 'profiles' matches the 'auth.users' insert.

-- 1. Create Tables if missing
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Function to handle new user insertion
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
  v_phone TEXT;
BEGIN
  -- Extract raw metadata or fallback
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_phone := NEW.raw_user_meta_data->>'phone';
  
  -- Insert into public.profiles
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
    
  -- If Doctor, ensure doctor record exists
  IF v_role = 'doctor' THEN
      INSERT INTO doctors (user_id, verification_status, verified, created_at)
      VALUES (NEW.id, 'pending', FALSE, NOW())
      ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-bind the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Grant Permissions (Fixes RLS issues)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
