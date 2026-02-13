-- ========================================================
-- DEBUG SCRIPT V2: Test Real Trigger Execution
-- ========================================================
-- This script inserts a dummy user into auth.users.
-- This WILL trigger the 'on_auth_user_created' trigger.
-- If this succeeds, the signup logic is perfect.
-- ========================================================

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email TEXT := 'debug_' || substr(md5(random()::text), 1, 6) || '@healio.ai';
BEGIN
  RAISE NOTICE 'Attempting to create Auth User: %', v_email;

  -- 1. Insert into auth.users (requires Admin privileges in SQL Editor)
  -- This mimics a real signup
  INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at, 
    role, 
    aud
  )
  VALUES (
    v_user_id, 
    v_email, 
    '$2a$10$abcdef...', -- Fake hash 
    NOW(), 
    '{"provider": "email", "providers": ["email"]}', 
    '{"role": "doctor", "full_name": "Debug User V2", "phone": "555-9999"}', 
    NOW(), 
    NOW(), 
    'authenticated', 
    'authenticated'
  );

  RAISE NOTICE 'Auth User Inserted. Checking Trigger Results...';

  -- 2. Verify Profile Creation
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
     RAISE NOTICE 'SUCCESS: Profile table entry found.';
  ELSE
     RAISE EXCEPTION 'FAILURE: Profile Missing! Trigger did not fire or failed.';
  END IF;

  -- 3. Verify Doctor Creation
  IF EXISTS (SELECT 1 FROM public.doctors WHERE user_id = v_user_id) THEN
     RAISE NOTICE 'SUCCESS: Doctor table entry found.';
  ELSE
     RAISE EXCEPTION 'FAILURE: Doctor Missing! Trigger logic for doctor failed.';
  END IF;

  -- 4. Cleanup (Auth user deletion usually cascades to profiles/doctors)
  DELETE FROM auth.users WHERE id = v_user_id;
  RAISE NOTICE 'TEST COMPLETE: Test data cleaned up.';

END $$;
