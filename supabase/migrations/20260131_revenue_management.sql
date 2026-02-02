-- Revenue Management System
-- Creates tables for appointments, clinical notes, invoices, and transactions
-- Implements doctor revenue tracking and payment processing workflow

-- ============================================================================
-- APPOINTMENTS TABLE
-- ============================================================================

-- Drop existing table if it exists (clean migration)
DROP TABLE IF EXISTS appointments CASCADE;

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    diagnosis_ref_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    appointment_type TEXT DEFAULT 'video' CHECK (appointment_type IN ('video', 'chat', 'follow_up')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 30,
    consultation_fee DECIMAL(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_completed_at ON appointments(completed_at DESC);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Doctors can view their own appointments
DROP POLICY IF EXISTS "Doctors can view own appointments" ON appointments;
CREATE POLICY "Doctors can view own appointments"
    ON appointments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM doctors
            WHERE doctors.id = appointments.doctor_id
            AND doctors.user_id = auth.uid()
        )
    );

-- Policy: Patients can view their own appointments
DROP POLICY IF EXISTS "Patients can view own appointments" ON appointments;
CREATE POLICY "Patients can view own appointments"
    ON appointments FOR SELECT
    USING (auth.uid() = patient_id);

-- Policy: Doctors can update their own appointments
DROP POLICY IF EXISTS "Doctors can update own appointments" ON appointments;
CREATE POLICY "Doctors can update own appointments"
    ON appointments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM doctors
            WHERE doctors.id = appointments.doctor_id
            AND doctors.user_id = auth.uid()
        )
    );

-- Policy: Admins can view all appointments
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
CREATE POLICY "Admins can view all appointments"
    ON appointments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- CLINICAL NOTES TABLE
-- ============================================================================

-- Drop existing table if it exists (clean migration)
DROP TABLE IF EXISTS clinical_notes CASCADE;

CREATE TABLE clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- SOAP Format
    subjective TEXT, -- Patient's chief complaint and history
    objective TEXT, -- Doctor's observations and exam findings
    assessment TEXT, -- Final diagnosis
    plan TEXT, -- Treatment plan and follow-up
    -- Additional Fields
    prescriptions JSONB, -- Array of {medicine, dosage, duration, instructions}
    lab_tests JSONB, -- Array of recommended lab tests
    follow_up_date TIMESTAMPTZ,
    follow_up_notes TEXT,
    encrypted_data TEXT, -- For HIPAA/GDPR compliance
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_notes_appointment_id ON clinical_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_doctor_id ON clinical_notes(doctor_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient_id ON clinical_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_created_at ON clinical_notes(created_at DESC);

-- Enable RLS
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Doctors can view notes for their appointments
DROP POLICY IF EXISTS "Doctors can view own clinical notes" ON clinical_notes;
CREATE POLICY "Doctors can view own clinical notes"
    ON clinical_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM doctors
            WHERE doctors.id = clinical_notes.doctor_id
            AND doctors.user_id = auth.uid()
        )
    );

-- Policy: Patients can view their own clinical notes
DROP POLICY IF EXISTS "Patients can view own clinical notes" ON clinical_notes;
CREATE POLICY "Patients can view own clinical notes"
    ON clinical_notes FOR SELECT
    USING (auth.uid() = patient_id);

-- Policy: Doctors can insert/update their own clinical notes
DROP POLICY IF EXISTS "Doctors can manage own clinical notes" ON clinical_notes;
CREATE POLICY "Doctors can manage own clinical notes"
    ON clinical_notes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM doctors
            WHERE doctors.id = clinical_notes.doctor_id
            AND doctors.user_id = auth.uid()
        )
    );

-- Policy: Admins can view all clinical notes
DROP POLICY IF EXISTS "Admins can view all clinical notes" ON clinical_notes;
CREATE POLICY "Admins can view all clinical notes"
    ON clinical_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================

-- Drop existing table if it exists (clean migration)
DROP TABLE IF EXISTS invoices CASCADE;

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    clinical_notes_id UUID REFERENCES clinical_notes(id) ON DELETE SET NULL,
    -- Financial Details
    consultation_fee DECIMAL(10, 2) NOT NULL,
    platform_fee_percentage DECIMAL(5, 2) DEFAULT 20.00,
    platform_fee DECIMAL(10, 2) NOT NULL,
    doctor_payout DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    -- Invoice Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'cancelled')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    paid_at TIMESTAMPTZ,
    -- Admin Review
    admin_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_appointment_id ON invoices(appointment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_doctor_id ON invoices(doctor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_submitted_at ON invoices(submitted_at DESC);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Doctors can view their own invoices
DROP POLICY IF EXISTS "Doctors can view own invoices" ON invoices;
CREATE POLICY "Doctors can view own invoices"
    ON invoices FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM doctors
            WHERE doctors.id = invoices.doctor_id
            AND doctors.user_id = auth.uid()
        )
    );

-- Policy: Patients can view their own invoices
DROP POLICY IF EXISTS "Patients can view own invoices" ON invoices;
CREATE POLICY "Patients can view own invoices"
    ON invoices FOR SELECT
    USING (auth.uid() = patient_id);

-- Policy: Doctors can create invoices for their appointments
DROP POLICY IF EXISTS "Doctors can create own invoices" ON invoices;
CREATE POLICY "Doctors can create own invoices"
    ON invoices FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM doctors
            WHERE doctors.id = invoices.doctor_id
            AND doctors.user_id = auth.uid()
        )
    );

-- Policy: Admins can manage all invoices
DROP POLICY IF EXISTS "Admins can manage all invoices" ON invoices;
CREATE POLICY "Admins can manage all invoices"
    ON invoices FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================

-- Drop existing table if it exists (clean migration)
DROP TABLE IF EXISTS transactions CASCADE;

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT UNIQUE NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Transaction Details
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'payout', 'refund', 'fee')),
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    -- Payment Gateway
    payment_method TEXT, -- 'stripe', 'razorpay', 'mock', etc.
    gateway_transaction_id TEXT,
    gateway_response JSONB,
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    processed_at TIMESTAMPTZ,
    failed_reason TEXT,
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice_id ON transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_doctor_id ON transactions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_patient_id ON transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_processed_at ON transactions(processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Doctors can view their own transactions
DROP POLICY IF EXISTS "Doctors can view own transactions" ON transactions;
CREATE POLICY "Doctors can view own transactions"
    ON transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM doctors
            WHERE doctors.id = transactions.doctor_id
            AND doctors.user_id = auth.uid()
        )
    );

-- Policy: Patients can view their own transactions
DROP POLICY IF EXISTS "Patients can view own transactions" ON transactions;
CREATE POLICY "Patients can view own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = patient_id);

-- Policy: Admins can manage all transactions
DROP POLICY IF EXISTS "Admins can manage all transactions" ON transactions;
CREATE POLICY "Admins can manage all transactions"
    ON transactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Auto-generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Format: INV-YYYYMMDD-XXXX
    SELECT COUNT(*) INTO counter
    FROM invoices
    WHERE DATE(created_at) = CURRENT_DATE;
    
    new_number := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((counter + 1)::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-generate transaction ID
CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
BEGIN
    -- Format: TXN-TIMESTAMP-RANDOM
    new_id := 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8);
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate platform fee and doctor payout
CREATE OR REPLACE FUNCTION calculate_invoice_amounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate platform fee (default 20%)
    NEW.platform_fee := (NEW.consultation_fee * NEW.platform_fee_percentage / 100);
    
    -- Calculate doctor payout (80%)
    NEW.doctor_payout := NEW.consultation_fee - NEW.platform_fee;
    
    -- Set total amount
    NEW.total_amount := NEW.consultation_fee;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Auto-generate invoice number
CREATE OR REPLACE FUNCTION set_invoice_number_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invoice_number ON invoices;
CREATE TRIGGER set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number_trigger();

-- Trigger: Auto-generate transaction ID
CREATE OR REPLACE FUNCTION set_transaction_id_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_id IS NULL OR NEW.transaction_id = '' THEN
        NEW.transaction_id := generate_transaction_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_transaction_id ON transactions;
CREATE TRIGGER set_transaction_id
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION set_transaction_id_trigger();

-- Trigger: Calculate invoice amounts
DROP TRIGGER IF EXISTS calculate_invoice_amounts_trigger ON invoices;
CREATE TRIGGER calculate_invoice_amounts_trigger
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION calculate_invoice_amounts();

-- Trigger: Auto-update updated_at for appointments
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at for clinical_notes
DROP TRIGGER IF EXISTS update_clinical_notes_updated_at ON clinical_notes;
CREATE TRIGGER update_clinical_notes_updated_at
    BEFORE UPDATE ON clinical_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at for invoices
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at for transactions
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- View: Doctor Revenue Summary
CREATE OR REPLACE VIEW doctor_revenue_summary AS
SELECT 
    d.id as doctor_id,
    d.user_id,
    COUNT(DISTINCT a.id) as total_consultations,
    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_consultations,
    COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.doctor_payout ELSE 0 END), 0) as total_revenue,
    COALESCE(SUM(CASE WHEN i.status = 'pending' THEN i.doctor_payout ELSE 0 END), 0) as pending_revenue,
    COALESCE(SUM(CASE WHEN i.status = 'approved' THEN i.doctor_payout ELSE 0 END), 0) as approved_revenue
FROM doctors d
LEFT JOIN appointments a ON a.doctor_id = d.id
LEFT JOIN invoices i ON i.doctor_id = d.id
GROUP BY d.id, d.user_id;

-- View: Platform Revenue Summary
CREATE OR REPLACE VIEW platform_revenue_summary AS
SELECT 
    COUNT(DISTINCT i.id) as total_invoices,
    COUNT(DISTINCT CASE WHEN i.status = 'paid' THEN i.id END) as paid_invoices,
    COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.platform_fee ELSE 0 END), 0) as total_platform_revenue,
    COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END), 0) as total_transaction_volume,
    COALESCE(SUM(CASE WHEN i.status = 'pending' THEN i.platform_fee ELSE 0 END), 0) as pending_platform_revenue
FROM invoices i;
