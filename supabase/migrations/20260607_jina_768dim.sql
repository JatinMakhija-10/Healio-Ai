-- =============================================================================
-- Healio.AI — Jina AI v5 Migration
-- Change embedding dimensions from 3072 (Gemini) to 768 (Jina AI Matryoshka)
-- =============================================================================

-- ── 1. Boericke Embeddings ──────────────────────────────────────────────────
DROP INDEX IF EXISTS boericke_embeddings_embedding_idx;
DROP INDEX IF EXISTS idx_boericke_embeddings_vector;
DROP INDEX IF EXISTS idx_boericke_embeddings_ivfflat;

ALTER TABLE boericke_embeddings 
    ALTER COLUMN embedding TYPE vector(768) USING NULL;

DROP FUNCTION IF EXISTS match_boericke_embeddings(vector, float, int);
CREATE OR REPLACE FUNCTION match_boericke_embeddings(
    query_embedding    vector(768),
    match_threshold    float DEFAULT 0.60,
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


-- ── 2. Home Remedy Embeddings ───────────────────────────────────────────────
DROP INDEX IF EXISTS home_remedy_embeddings_vector_idx;
DROP INDEX IF EXISTS idx_home_remedy_embeddings_vector;
DROP INDEX IF EXISTS idx_home_remedy_embeddings_ivfflat;

ALTER TABLE home_remedy_embeddings 
    ALTER COLUMN embedding TYPE vector(768) USING NULL;

DROP FUNCTION IF EXISTS match_home_remedy_embeddings(vector, float, int);
CREATE OR REPLACE FUNCTION match_home_remedy_embeddings(
    query_embedding    vector(768),
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


-- Note: ayurvedic_knowledge_embeddings was already migrated to 768-dim in 
-- 20260519_ayurvedic_768dim.sql. No dimension changes needed, but ensure 
-- the query parameter accepts vector(768).

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
