-- Migration: Create personas table for family profiles
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relation TEXT DEFAULT 'Self' CHECK (relation IN ('Self', 'Spouse', 'Child', 'Parent', 'Sibling', 'Other')),
    age INTEGER CHECK (age >= 0 AND age <= 150),
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    conditions TEXT[] DEFAULT '{}',
    allergies TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- Users can only see their own personas
DROP POLICY IF EXISTS "Users can view own personas" ON personas;
CREATE POLICY "Users can view own personas"
    ON personas FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own personas
DROP POLICY IF EXISTS "Users can insert own personas" ON personas;
CREATE POLICY "Users can insert own personas"
    ON personas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own personas
DROP POLICY IF EXISTS "Users can update own personas" ON personas;
CREATE POLICY "Users can update own personas"
    ON personas FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own personas
DROP POLICY IF EXISTS "Users can delete own personas" ON personas;
CREATE POLICY "Users can delete own personas"
    ON personas FOR DELETE
    USING (auth.uid() = user_id);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);
