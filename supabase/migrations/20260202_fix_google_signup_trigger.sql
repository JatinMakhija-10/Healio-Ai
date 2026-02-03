-- Fix handle_new_user trigger to be more robust for Google Sign-in

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
  v_phone TEXT;
  v_avatar_url TEXT;
BEGIN
  -- Extract raw metadata or fallback
  -- Google often uses 'picture' or 'avatar_url'
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_avatar_url := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture');

  -- Insert into public.profiles
  BEGIN
    INSERT INTO profiles (id, email, role, full_name, phone, avatar_url, created_at)
    VALUES (
      NEW.id,
      NEW.email,
      v_role,
      v_full_name,
      v_phone,
      v_avatar_url,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      avatar_url = EXCLUDED.avatar_url;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction (or maybe fallback to basic profile?)
    -- Detailed error logging isn't easy here without a logs table, but raising a warning helps debugging
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    -- Fallback attempt: Try inserting only ID and email if full insert failed (e.g. invalid text)
    INSERT INTO profiles (id, email, role, created_at)
    VALUES (NEW.id, NEW.email, 'patient', NOW())
    ON CONFLICT (id) DO NOTHING;
  END;

  -- If Doctor, ensure doctor record exists
  IF v_role = 'doctor' THEN
      INSERT INTO doctors (user_id, verification_status, verified, created_at)
      VALUES (NEW.id, 'pending', FALSE, NOW())
      ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
