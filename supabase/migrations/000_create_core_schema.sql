-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Basic policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Create doctors table
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

-- Enable RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Doctors policies
DROP POLICY IF EXISTS "Doctors can view own entry" ON doctors;
CREATE POLICY "Doctors can view own entry" 
    ON doctors FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Doctors can update own entry" ON doctors;
CREATE POLICY "Doctors can update own entry" 
    ON doctors FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can view verified doctors" ON doctors;
CREATE POLICY "Authenticated users can view verified doctors" 
    ON doctors FOR SELECT 
    USING (verified = true);
