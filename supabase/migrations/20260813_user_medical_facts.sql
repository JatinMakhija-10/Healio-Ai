-- ── Migration: User Medical Facts & Memory Table ─────────────────────────────
-- Date: 2026-08-13
-- Author: Healio.AI Engineering
-- Audit Ref: Forensic Audit §8, F5, Inconsistency #2, Section 10
--
-- Description:
--   Creates a transactional, pgvector-backed memory store (user_medical_facts)
--   with:
--     1. superseded_by self-reference — enables recency/version-based conflict
--        resolution (fixes F5 where score-sorted dedup preferred stale facts)
--     2. provenance classification — distinguishes user_stated facts from llm_inferred
--     3. immutable flag — prevents accidental overwrite of critical allergies
--     4. deleted_at — soft deletion for Indian DPDP Act compliance
--     5. Supabase RLS — strict user-level data isolation (auth.uid() = user_id)

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS user_medical_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Fact content & vector embedding (768-dim Jina/Gemini standard)
    fact_text TEXT NOT NULL,
    embedding vector(768),
    
    -- Structured clinical metadata
    category TEXT NOT NULL CHECK (
        category IN ('allergy', 'chronic_condition', 'medication', 'symptom_history', 'other')
    ),
    provenance TEXT NOT NULL CHECK (
        provenance IN ('user_stated', 'llm_inferred', 'system_inferred', 'clinician_confirmed')
    ),
    confidence NUMERIC(3, 2) DEFAULT 1.00 CHECK (confidence >= 0.00 AND confidence <= 1.00),
    immutable BOOLEAN DEFAULT FALSE,
    
    -- Conflict resolution (Fixes Audit F5):
    -- When a fact is updated or corrected, superseded_by links to the new fact's UUID.
    -- Active queries filter WHERE superseded_by IS NULL.
    superseded_by UUID REFERENCES user_medical_facts(id) ON DELETE SET NULL,
    
    -- Timestamps & soft deletion (DPDP compliance)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

-- Fast user lookup for active (non-superseded, non-deleted) facts
CREATE INDEX IF NOT EXISTS idx_user_medical_facts_user_active
    ON user_medical_facts (user_id, category)
    WHERE superseded_by IS NULL AND deleted_at IS NULL;

-- Vector similarity search index (Cosine distance)
CREATE INDEX IF NOT EXISTS idx_user_medical_facts_embedding
    ON user_medical_facts USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE user_medical_facts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own medical facts" ON user_medical_facts;
CREATE POLICY "Users can view own medical facts"
    ON user_medical_facts FOR SELECT
    USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can insert own medical facts" ON user_medical_facts;
CREATE POLICY "Users can insert own medical facts"
    ON user_medical_facts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own medical facts" ON user_medical_facts;
CREATE POLICY "Users can update own medical facts"
    ON user_medical_facts FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can soft-delete own medical facts" ON user_medical_facts;
CREATE POLICY "Users can soft-delete own medical facts"
    ON user_medical_facts FOR DELETE
    USING (auth.uid() = user_id);

-- ── RPC Helper: Match Active User Medical Facts ─────────────────────────────

CREATE OR REPLACE FUNCTION match_user_medical_facts(
    p_user_id UUID,
    query_embedding vector(768),
    match_threshold FLOAT DEFAULT 0.60,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    fact_text TEXT,
    category TEXT,
    provenance TEXT,
    confidence NUMERIC(3, 2),
    immutable BOOLEAN,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.fact_text,
        f.category,
        f.provenance,
        f.confidence,
        f.immutable,
        1 - (f.embedding <=> query_embedding) AS similarity
    FROM user_medical_facts f
    WHERE f.user_id = p_user_id
      AND f.superseded_by IS NULL
      AND f.deleted_at IS NULL
      AND f.embedding IS NOT NULL
      AND (1 - (f.embedding <=> query_embedding)) >= match_threshold
    ORDER BY f.immutable DESC, (1 - (f.embedding <=> query_embedding)) DESC, f.created_at DESC
    LIMIT match_count;
END;
$$;
