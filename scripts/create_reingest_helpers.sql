-- ============================================================
-- Healio.AI: Helper RPC for PlanetAyurveda re-ingestion
-- Returns a batch of rows by ID range, for use by the
-- Python re-ingestion script to avoid PostgREST timeouts.
-- 
-- Run once in Supabase SQL Editor before running the script.
-- ============================================================

-- Index on source column to make source-filtered queries fast
CREATE INDEX IF NOT EXISTS idx_ake_source
    ON ayurvedic_knowledge_embeddings (source);

-- Analyze so planner uses the new index immediately
ANALYZE ayurvedic_knowledge_embeddings;

-- RPC: fetch a batch of PlanetAyurveda rows for re-embedding
-- Returns id + text only (minimal payload) for a given ID range.
CREATE OR REPLACE FUNCTION get_planetayurveda_batch(
    from_id  BIGINT DEFAULT 0,
    batch_n  INT    DEFAULT 50
)
RETURNS TABLE (id BIGINT, text TEXT)
LANGUAGE sql STABLE AS $$
    SELECT ake.id, ake.text
    FROM ayurvedic_knowledge_embeddings ake
    WHERE ake.source = 'PlanetAyurveda'
      AND ake.id > from_id
      AND ake.text IS NOT NULL
      AND ake.text <> ''
    ORDER BY ake.id
    LIMIT batch_n;
$$;
