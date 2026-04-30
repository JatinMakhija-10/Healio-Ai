-- ============================================================
-- Healio.AI — Vector Index Optimization Script
-- Run this in the Supabase SQL editor (Settings > SQL Editor)
-- or via: supabase db push (if using migrations folder)
-- ============================================================

-- ── Step 1: Boericke Materia Medica embeddings (768-dim) ──────────────────────
-- Drop old index if it was created with defaults (lists=100 is often suboptimal)
DROP INDEX IF EXISTS idx_boericke_embeddings_ivfflat;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_boericke_embeddings_vector
    ON boericke_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
-- lists = 100 is good for up to ~1M rows. Tune to sqrt(n_rows) for larger tables.

-- ── Step 2: Ayurvedic knowledge embeddings (768-dim) ──────────────────────────
DROP INDEX IF EXISTS idx_ayurvedic_embeddings_ivfflat;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ayurvedic_knowledge_vector
    ON ayurvedic_knowledge_embeddings  -- adjust table name if different
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ── Step 3: Home remedy embeddings (3072-dim) ─────────────────────────────────
-- 3072-dim with lists=200 balances recall vs. probe cost well for ~1k–100k rows
DROP INDEX IF EXISTS idx_home_remedy_embeddings_ivfflat;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_home_remedy_embeddings_vector
    ON home_remedy_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 200);

-- ── Step 4: Condition embeddings (768-dim) ────────────────────────────────────
DROP INDEX IF EXISTS idx_condition_embeddings_ivfflat;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_condition_embeddings_vector
    ON condition_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ── Step 5: Tune probes at the function level ─────────────────────────────────
-- Add `SET LOCAL ivfflat.probes = 10;` inside each match_* RPC function body
-- to increase recall without a full sequential scan.
--
-- Example — add this line at the top of match_boericke_embeddings:
--
--   CREATE OR REPLACE FUNCTION match_boericke_embeddings(...)
--   RETURNS TABLE (...) AS $$
--   BEGIN
--     SET LOCAL ivfflat.probes = 10;   -- <-- add this
--     RETURN QUERY
--       SELECT ... FROM boericke_embeddings
--       ORDER BY embedding <=> query_embedding
--       LIMIT match_count;
--   END;
--   $$ LANGUAGE plpgsql;
--
-- The default is probes=1. Setting to 10 visits 10x more cells → better recall.
-- Cost: ~10x longer than probes=1, but still far faster than a sequential scan.

-- ── Step 6: VACUUM ANALYZE all embedding tables ───────────────────────────────
-- Forces the Postgres query planner to use the new index immediately.
VACUUM ANALYZE boericke_embeddings;
VACUUM ANALYZE home_remedy_embeddings;
VACUUM ANALYZE condition_embeddings;
-- VACUUM ANALYZE ayurvedic_knowledge_embeddings;  -- uncomment if table exists

-- ── Verification queries ──────────────────────────────────────────────────────
-- Run these after index creation to confirm the indexes exist:
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE indexname LIKE '%vector%'
   OR indexname LIKE '%ivfflat%'
ORDER BY tablename;
