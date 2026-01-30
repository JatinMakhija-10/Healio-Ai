-- Create consultations table for tracking patient diagnosis history
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Symptom details
    symptoms JSONB NOT NULL,
    
    -- Diagnosis result
    diagnosis JSONB NOT NULL,
    confidence DECIMAL(5,2),
    
    -- Metadata
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own consultations
DROP POLICY IF EXISTS "Users can view own consultations" ON consultations;
CREATE POLICY "Users can view own consultations"
    ON consultations FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own consultations
DROP POLICY IF EXISTS "Users can insert own consultations" ON consultations;
CREATE POLICY "Users can insert own consultations"
    ON consultations FOR INSERT
    WITH CHECK (auth.uid() = user_id);
