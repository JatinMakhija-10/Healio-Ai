-- =============================================================================
-- Healio.AI — RAG Critical Fix: Dimension Mismatch + RPC fixes
-- 
-- PROBLEM 1: boericke_embeddings uses vector(768) but gemini-embedding-2-preview
--            outputs 3072-dim vectors → RPC silently fails (function signature mismatch)
-- PROBLEM 2: ayurvedic_knowledge_embeddings (26K rows) seq scan times out at ~8.8s
-- PROBLEM 3: match_home_remedy_embeddings RPC doesn't return ailment/hindi columns
--
-- NOTE: pgvector on this Supabase instance caps HNSW/IVFFlat at 2000 dims.
--       For 3072-dim vectors we rely on sequential scans, which are fine for
--       Boericke (637 rows) and Home Remedies (1,051 rows).
--       For Ayurvedic (26K rows) we switch the RPC to plpgsql and raise
--       statement_timeout to 15 s so the seq scan completes reliably.
--
-- Run in: Supabase Dashboard → SQL Editor
-- After running this, run the re-ingestion script: npx tsx scripts/reingest_boericke.ts
-- =============================================================================

-- ── FIX 1: Boericke — widen vector column to 3072 ──────────────────────────
-- Existing embeddings are from text-embedding-004 (different vector space) —
-- the re-ingestion script will re-populate them with gemini-embedding-2-preview.

-- Drop old indexes first (they reference the 768-dim column)
DROP INDEX IF EXISTS boericke_embeddings_embedding_idx;
DROP INDEX IF EXISTS idx_boericke_embeddings_vector;
DROP INDEX IF EXISTS idx_boericke_embeddings_ivfflat;

ALTER TABLE boericke_embeddings 
    ALTER COLUMN embedding TYPE vector(3072);

-- Recreate the RPC to accept vector(3072)
DROP FUNCTION IF EXISTS match_boericke_embeddings(vector, float, int);
CREATE OR REPLACE FUNCTION match_boericke_embeddings(
    query_embedding    vector(3072),
    match_threshold    float DEFAULT 0.72,
    match_count        int   DEFAULT 10
)
RETURNS TABLE(
    id            bigint,
    remedy_name   text,
    chunk_text    text,
    similarity    float
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    -- 637 rows — sequential scan is instant, no index needed
    RETURN QUERY
    SELECT
        be.id,
        be.remedy_name,
        be.chunk_text,
        (1 - (be.embedding <=> query_embedding))::float AS similarity
    FROM boericke_embeddings be
    WHERE 1 - (be.embedding <=> query_embedding) > match_threshold
    ORDER BY be.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;


-- ── FIX 2: Ayurvedic — halfvec HNSW index + updated RPC ────────────────────
-- pgvector ≥ 0.7 (Supabase default since early 2024) supports halfvec HNSW
-- which bypasses the 2000-dim limit for full-precision vectors.
-- Casting vector(3072) → halfvec(3072) at index time uses half-precision
-- storage (2 bytes/dim vs 4), allowing HNSW on 3072-dim columns.
-- Index creation on 26K rows takes ~60-120 s — run outside a transaction if needed.

DROP INDEX IF EXISTS idx_ayurvedic_knowledge_vector;
DROP INDEX IF EXISTS idx_ayurvedic_embeddings_ivfflat;
DROP INDEX IF EXISTS idx_ayurvedic_knowledge_halfvec_hnsw;

-- Build HNSW index on halfvec cast of the embedding column
CREATE INDEX idx_ayurvedic_knowledge_halfvec_hnsw
    ON ayurvedic_knowledge_embeddings
    USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops)
    WITH (m = 16, ef_construction = 64);

DROP FUNCTION IF EXISTS search_ayurvedic_knowledge(vector, float, int, text, text);

CREATE OR REPLACE FUNCTION search_ayurvedic_knowledge (
    query_embedding vector(3072),
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
        (1 - (ake.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)))::float AS similarity
    FROM ayurvedic_knowledge_embeddings ake
    WHERE
        (filter_category IS NULL OR ake.category = filter_category)
        AND (filter_book IS NULL OR ake.book = filter_book)
        AND 1 - (ake.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)) > match_threshold
    ORDER BY ake.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)
    LIMIT match_count;
END;
$$;


-- ── FIX 3: Home Remedy RPC — return missing columns ────────────────────────
-- The chat route accesses row.ailment, row.ailment_hindi, row.remedy_name_hindi
-- but the previous RPC only returned id, remedy_name, chunk_text, similarity

-- Drop old indexes (3072 dims, can't use HNSW)
DROP INDEX IF EXISTS home_remedy_embeddings_vector_idx;
DROP INDEX IF EXISTS idx_home_remedy_embeddings_vector;
DROP INDEX IF EXISTS idx_home_remedy_embeddings_ivfflat;

DROP FUNCTION IF EXISTS match_home_remedy_embeddings(vector, float, int);
CREATE OR REPLACE FUNCTION match_home_remedy_embeddings(
    query_embedding    vector(3072),
    match_threshold    float DEFAULT 0.58,
    match_count        int   DEFAULT 8
)
RETURNS TABLE(
    id                 bigint,
    remedy_name        text,
    remedy_name_hindi  text,
    ailment            text,
    ailment_hindi      text,
    chunk_text         text,
    similarity         float
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    -- 1,051 rows — sequential scan is fast, no index needed
    RETURN QUERY
    SELECT
        hre.id,
        hre.remedy_name,
        hre.remedy_name_hindi,
        hre.ailment,
        hre.ailment_hindi,
        hre.chunk_text,
        (1 - (hre.embedding <=> query_embedding))::float AS similarity
    FROM home_remedy_embeddings hre
    WHERE 1 - (hre.embedding <=> query_embedding) > match_threshold
    ORDER BY hre.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;


-- ── Planner stats ────────────────────────────────────────────────────────────
-- VACUUM ANALYZE cannot run inside a transaction block (Supabase SQL Editor).
-- Run these separately if needed, or let auto-vacuum handle it:
--   VACUUM ANALYZE boericke_embeddings;
--   VACUUM ANALYZE ayurvedic_knowledge_embeddings;
--   VACUUM ANALYZE home_remedy_embeddings;
ANALYZE boericke_embeddings;
ANALYZE ayurvedic_knowledge_embeddings;
ANALYZE home_remedy_embeddings;
