-- ── Migration: P0-1 RPC Guard, P1-5 Confidence Ranking & P0-9 Audit Logs ────
-- Date: 2026-08-14
-- Author: Healio.AI Security & Engineering
-- Audit Ref: P0-1, P1-5, P1-6, P0-9

-- ── 1. Secure & Ranked Medical Facts RPC ──────────────────────────────────────

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
    -- P0-1 Fix: Explicitly check caller identity against p_user_id to prevent RLS bypass via RPC
    IF p_user_id IS NULL OR (auth.uid() IS NOT NULL AND p_user_id != auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: cross-patient medical fact lookup forbidden (auth.uid=% vs p_user_id=%)',
            auth.uid(), p_user_id;
    END IF;

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
    -- P1-5 Fix: Factor in confidence alongside immutability and vector similarity
    ORDER BY f.immutable DESC, f.confidence DESC, (1 - (f.embedding <=> query_embedding)) DESC, f.created_at DESC
    LIMIT match_count;
END;
$$;

-- ── 2. P1-6 Soft-Deletion Protection for Superseded Facts ───────────────────

CREATE OR REPLACE FUNCTION prevent_superseded_fact_reactivation()
RETURNS TRIGGER AS $$
BEGIN
    -- When a fact that superseded older facts is deleted, update any records pointing to it
    -- so they don't revert to active (superseded_by IS NULL) by ON DELETE SET NULL.
    IF TG_OP = 'DELETE' THEN
        UPDATE user_medical_facts
        SET deleted_at = NOW()
        WHERE superseded_by = OLD.id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_fact_reactivation ON user_medical_facts;
CREATE TRIGGER trg_prevent_fact_reactivation
    BEFORE DELETE ON user_medical_facts
    FOR EACH ROW
    EXECUTE FUNCTION prevent_superseded_fact_reactivation();

-- ── 3. P0-9 Audit Logs Table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consultation_id UUID,
    event_type TEXT NOT NULL CHECK (
        event_type IN ('diagnostic_run', 'ddi_check', 'emergency_triage', 'llm_call', 'fact_mutation')
    ),
    input_summary JSONB DEFAULT '{}'::jsonb,
    decision_output JSONB DEFAULT '{}'::jsonb,
    bayesian_scores JSONB DEFAULT '{}'::jsonb,
    ddi_blocked JSONB DEFAULT '[]'::jsonb,
    mcmc_diagnostics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user/consultation audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_event
    ON audit_logs (user_id, event_type, created_at DESC);

-- RLS: Strict security policy
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs"
    ON audit_logs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own audit logs" ON audit_logs;
CREATE POLICY "Users can insert own audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);
