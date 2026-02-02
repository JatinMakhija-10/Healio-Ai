-- =============================================
-- FINAL FIX: Auth Trigger Hardening
-- =============================================
-- 1. Sets search_path to public to prevent resolution errors
-- 2. Uses fully qualified names (public.profiles)
-- 3. Handles potential nulls safely

-- Recreate the function with strict search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public -- CRITICAL: Force public schema
AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
  v_phone TEXT;
BEGIN
  -- Safe extraction with defaults
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');

  -- Insert Profile (Always)
  INSERT INTO public.profiles (id, email, role, full_name, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    v_role,
    v_full_name,
    v_phone,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  -- Insert Doctor Record (If applicable)
  IF v_role = 'doctor' THEN
      INSERT INTO public.doctors (
          user_id, 
          verification_status, 
          verified, 
          is_profile_complete,
          created_at,
          updated_at
      )
      VALUES (
          NEW.id, 
          'pending', 
          FALSE, 
          FALSE,
          NOW(),
          NOW()
      )
      ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error (visible in Supabase logs) but don't break signup? 
  -- No, we MUST break signup if profile fails, otherwise app breaks.
  RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Rebind Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure Permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;
