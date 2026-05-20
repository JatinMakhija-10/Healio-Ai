-- =============================================================================
-- Healio.AI — Ayurvedic: downgrade to 768-dim for indexability
--
-- Supabase free tier direct connections are IPv6-only; we can't build HNSW
-- indexes on 3072-dim from outside. By truncating to 768-dim via
-- gemini-embedding-2-preview's output_dimensionality=768, we can create a
-- proper HNSW index within pgvector's 2000-dim limit.
--
-- Steps:
--   1. Run THIS file in Supabase SQL Editor (fast)
--   2. Run: npx tsx scripts/reingest_ayurvedic.ts
--   3. Run the CREATE INDEX block below in a new SQL Editor tab
-- =============================================================================

-- ── Step 1: Widen column to 768-dim (nulls existing embeddings) ──────────────
DROP INDEX IF EXISTS idx_ayurvedic_knowledge_halfvec_hnsw;
DROP INDEX IF EXISTS idx_ayurvedic_knowledge_vector;
DROP INDEX IF EXISTS idx_ayurvedic_embeddings_ivfflat;

ALTER TABLE ayurvedic_knowledge_embeddings
    ALTER COLUMN embedding TYPE vector(768) USING NULL;

-- ── Step 2: Recreate RPC for vector(768) ─────────────────────────────────────
DROP FUNCTION IF EXISTS search_ayurvedic_knowledge(vector, float, int, text, text);

CREATE OR REPLACE FUNCTION search_ayurvedic_knowledge (
    query_embedding vector(768),
    match_threshold FLOAT    DEFAULT 0.55,
    match_count     INT      DEFAULT 12,
    filter_category TEXT     DEFAULT NULL,
    filter_book     TEXT     DEFAULT NULL
)
RETURNS TABLE (
    id            BIGINT,
    source        TEXT,
    book          TEXT,
    category      TEXT,
    page          INT,
    section       TEXT,
    text          TEXT,
    keywords      TEXT[],
    similarity    FLOAT
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    SELECT
        ake.id,
        ake.source,
        ake.book,
        ake.category,
        ake.page,
        ake.section,
        ake.text,
        ake.keywords,
        (1 - (ake.embedding <=> query_embedding))::float AS similarity
    FROM ayurvedic_knowledge_embeddings ake
    WHERE
        (filter_category IS NULL OR ake.category = filter_category)
        AND (filter_book IS NULL OR ake.book = filter_book)
        AND 1 - (ake.embedding <=> query_embedding) > match_threshold
    ORDER BY ake.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ── Step 3: Run AFTER re-ingestion completes ──────────────────────────────────
-- Run this separately once npx tsx scripts/reingest_ayurvedic.ts finishes:
--
-- CREATE INDEX idx_ayurvedic_knowledge_hnsw
--     ON ayurvedic_knowledge_embeddings
--     USING hnsw (embedding vector_cosine_ops)
--     WITH (m = 16, ef_construction = 64);
