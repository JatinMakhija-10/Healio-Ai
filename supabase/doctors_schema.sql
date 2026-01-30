-- =============================================
-- HEALIO.AI - Priority 1: Foundation Schema
-- =============================================
-- This schema extends the existing Healio.AI database to support:
-- 1. Doctor profiles and verification
-- 2. Appointment booking linked to AI diagnosis sessions
-- 3. Transaction ledger for the marketplace

-- =============================================
-- 1. USER PROFILES (Extended for Roles)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 2. DOCTORS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Professional Info
  specialty TEXT[] NOT NULL DEFAULT '{}',
  qualification TEXT NOT NULL,
  experience_years INTEGER DEFAULT 0,
  bio TEXT,
  
  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'more_info_required')),
  license_number TEXT,
  license_document_url TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  
  -- Availability (JSONB for flexibility)
  -- Format: { "mon": ["09:00-12:00", "14:00-17:00"], "tue": [...] }
  availability JSONB DEFAULT '{}',
  consultation_fee DECIMAL(10, 2) DEFAULT 500.00,
  consultation_duration INTEGER DEFAULT 30, -- minutes
  
  -- Settings
  accepts_new_patients BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Stats
  total_consultations INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Doctors can view and edit their own profile
CREATE POLICY "Doctors can manage own profile"
  ON doctors FOR ALL
  USING (auth.uid() = user_id);

-- Patients can view verified doctors
CREATE POLICY "Patients can view verified doctors"
  ON doctors FOR SELECT
  USING (verified = TRUE);

-- Admins can view and manage all doctors
CREATE POLICY "Admins can manage all doctors"
  ON doctors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 3. APPOINTMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participants
  patient_id UUID NOT NULL REFERENCES auth.users(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  
  -- Link to AI Diagnosis (The "Handshake")
  diagnosis_ref_id UUID, -- References the diagnosis session ID from localStorage/future table
  diagnosis_snapshot JSONB, -- Frozen context at booking time
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled_by_patient',
    'cancelled_by_doctor',
    'no_show'
  )),
  
  -- Communication
  meeting_link TEXT,
  notes_for_doctor TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = patient_id);

-- Patients can create appointments
CREATE POLICY "Patients can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Doctors can view appointments where they are the doctor
CREATE POLICY "Doctors can view their appointments"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doctors WHERE doctors.id = appointments.doctor_id AND doctors.user_id = auth.uid()
    )
  );

-- Doctors can update their appointments
CREATE POLICY "Doctors can update their appointments"
  ON appointments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM doctors WHERE doctors.id = appointments.doctor_id AND doctors.user_id = auth.uid()
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all appointments"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 4. TRANSACTIONS TABLE (Financial Ledger)
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  appointment_id UUID REFERENCES appointments(id),
  patient_id UUID NOT NULL REFERENCES auth.users(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  
  -- Amounts
  gross_amount DECIMAL(10, 2) NOT NULL, -- Total paid by patient
  platform_fee DECIMAL(10, 2) NOT NULL, -- Our commission (20%)
  net_amount DECIMAL(10, 2) NOT NULL,   -- Amount to doctor
  
  -- Payment Info
  payment_provider TEXT DEFAULT 'stripe',
  payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending',
    'processing',
    'succeeded',
    'failed',
    'refunded',
    'partially_refunded'
  )),
  
  -- Payout to Doctor
  payout_status TEXT DEFAULT 'held' CHECK (payout_status IN (
    'held',
    'scheduled',
    'processing',
    'released',
    'failed'
  )),
  payout_scheduled_at TIMESTAMPTZ,
  payout_released_at TIMESTAMPTZ,
  
  -- Metadata
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Patients can view their own transactions
CREATE POLICY "Patients can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = patient_id);

-- Doctors can view transactions where they are the doctor
CREATE POLICY "Doctors can view their transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doctors WHERE doctors.id = transactions.doctor_id AND doctors.user_id = auth.uid()
    )
  );

-- Admins can view and manage all transactions
CREATE POLICY "Admins can manage all transactions"
  ON transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 5. CLINICAL NOTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  
  -- SOAP Note Structure
  subjective TEXT,  -- Patient's words
  objective TEXT,   -- Doctor's findings
  assessment TEXT,  -- Final diagnosis
  plan TEXT,        -- Rx and instructions
  
  -- Security
  encrypted_content TEXT, -- For HIPAA compliance (future)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;

-- Only the doctor of the appointment can manage notes
CREATE POLICY "Doctors can manage their notes"
  ON clinical_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = clinical_notes.appointment_id AND d.user_id = auth.uid()
    )
  );

-- =============================================
-- 6. PLATFORM SETTINGS (Commission, etc.)
-- =============================================
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Seed default commission rate
INSERT INTO platform_settings (key, value) VALUES
  ('commission_rate', '{"percentage": 20}')
ON CONFLICT (key) DO NOTHING;

-- Only admins can manage settings
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage platform settings"
  ON platform_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Anyone can read settings
CREATE POLICY "Anyone can read platform settings"
  ON platform_settings FOR SELECT
  USING (TRUE);

-- =============================================
-- 7. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_doctors_verified ON doctors(verified);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors USING GIN(specialty);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_transactions_patient ON transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_transactions_doctor ON transactions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payout_status ON transactions(payout_status);

-- =============================================
-- 8. TRIGGER: Auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_notes_updated_at BEFORE UPDATE ON clinical_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
