-- 1. Add avatar_url to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Update handle_new_user trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
  v_phone TEXT;
  v_avatar_url TEXT;
BEGIN
  -- Extract raw metadata or fallback
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_avatar_url := NEW.raw_user_meta_data->>'avatar_url';

  -- Insert into public.profiles
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

  -- If Doctor, ensure doctor record exists
  IF v_role = 'doctor' THEN
      INSERT INTO doctors (user_id, verification_status, verified, created_at)
      VALUES (NEW.id, 'pending', FALSE, NOW())
      ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Doctor Inbox View
DROP VIEW IF EXISTS doctor_inbox_view;
CREATE OR REPLACE VIEW doctor_inbox_view AS
SELECT
    a.id as appointment_id,
    a.doctor_id,
    a.patient_id,
    p.full_name as patient_name,
    p.avatar_url as patient_avatar,
    last_msg.content as last_message,
    last_msg.created_at as last_message_time,
    last_msg.type as last_message_type,
    COALESCE(unread_stats.unread_count, 0) as unread_count
FROM appointments a
JOIN doctors d ON d.id = a.doctor_id
JOIN profiles p ON p.id = a.patient_id
LEFT JOIN LATERAL (
    SELECT content, created_at, type
    FROM messages m
    WHERE m.appointment_id = a.id
    ORDER BY created_at DESC
    LIMIT 1
) last_msg ON TRUE
LEFT JOIN LATERAL (
    SELECT COUNT(*) as unread_count
    FROM messages m
    WHERE m.appointment_id = a.id
    AND m.is_read = FALSE
    AND m.sender_id != d.user_id
) unread_stats ON TRUE;

-- 4. Update Patient Inbox View
DROP VIEW IF EXISTS patient_inbox_view;
CREATE OR REPLACE VIEW patient_inbox_view WITH (security_invoker = true) AS
SELECT
    a.id as appointment_id,
    a.created_at as appointment_created_at,
    a.doctor_id,
    a.patient_id,
    p.full_name as doctor_name,
    p.avatar_url as doctor_avatar,
    last_msg.content as last_message,
    last_msg.created_at as last_message_time,
    last_msg.type as last_message_type,
    COALESCE(unread_stats.unread_count, 0) as unread_count,
    COALESCE(last_msg.created_at, a.created_at) as latest_activity_at
FROM appointments a
JOIN doctors d ON d.id = a.doctor_id
JOIN profiles p ON p.id = d.user_id
LEFT JOIN LATERAL (
    SELECT content, created_at, type
    FROM messages m
    WHERE m.appointment_id = a.id
    ORDER BY created_at DESC
    LIMIT 1
) last_msg ON TRUE
LEFT JOIN LATERAL (
    SELECT COUNT(*) as unread_count
    FROM messages m
    WHERE m.appointment_id = a.id
    AND m.is_read = FALSE
    AND m.sender_id != a.patient_id
) unread_stats ON TRUE;
