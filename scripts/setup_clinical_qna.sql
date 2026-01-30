-- Clinical QnA Knowledge Base Schema

-- 1. Create Table
CREATE TABLE IF NOT EXISTS clinical_qna (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT CHECK (category IN ('general', 'cardiology', 'neurology', 'pediatrics', 'dermatology', 'other')),
    tags TEXT[],
    is_published BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE clinical_qna ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Admins can do everything
DROP POLICY IF EXISTS "Admins can manage clinical_qna" ON clinical_qna;
CREATE POLICY "Admins can manage clinical_qna"
    ON clinical_qna FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Doctors/Users can view published QnA (if we want them to)
DROP POLICY IF EXISTS "Public can view published qna" ON clinical_qna;
CREATE POLICY "Public can view published qna"
    ON clinical_qna FOR SELECT
    USING (is_published = true);

-- 4. Triggers
-- Auto update updated_at
DROP TRIGGER IF EXISTS update_clinical_qna_updated_at ON clinical_qna;
CREATE TRIGGER update_clinical_qna_updated_at
    BEFORE UPDATE ON clinical_qna
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Seed Data
INSERT INTO clinical_qna (question, answer, category, is_published, tags) VALUES
(
    'What are the standard protocols for hypertension management?',
    'Initial management includes lifestyle modifications such as diet and exercise. Pharmacological treatment should start with ACE inhibitors or ARBs for most patients.',
    'cardiology',
    true,
    ARRAY['hypertension', 'guidelines']
),
(
    'How to differentiate viral form bacterial tonsillitis?',
    'Centor criteria can be used. Bacterial suggests: absence of cough, swollen/tender anterior cervical nodes, temperature >38C, and tonsillar exudates.',
    'general',
    true,
    ARRAY['diagnosis', 'ent']
);
