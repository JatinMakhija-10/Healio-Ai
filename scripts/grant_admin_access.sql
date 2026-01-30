-- Grant admin access to jatinmakhija2007@gmail.com
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'jatinmakhija2007@gmail.com';

    IF target_user_id IS NOT NULL THEN
        -- Upsert profile (Insert if not exists, Update if exists)
        INSERT INTO public.profiles (id, email, role, full_name)
        VALUES (target_user_id, 'jatinmakhija2007@gmail.com', 'admin', 'Admin User')
        ON CONFLICT (id) DO UPDATE
        SET role = 'admin';
        
        RAISE NOTICE 'SUCCESS: User % (jatinmakhija2007@gmail.com) is now an admin.', target_user_id;
    ELSE
        RAISE NOTICE 'ERROR: User jatinmakhija2007@gmail.com not found in auth.users. Please sign up first.';
    END IF;
END $$;

-- Verify the result
SELECT p.id, p.role, p.email
FROM profiles p
WHERE p.email = 'jatinmakhija2007@gmail.com';
