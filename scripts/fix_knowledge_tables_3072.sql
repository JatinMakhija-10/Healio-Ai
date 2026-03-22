-- =============================================================================
-- Healio.AI — FIX: Recreate knowledge tables with correct vector(3072)
-- gemini-embedding-001 outputs 3072 dimensions, not 768.
-- ivfflat max is 2000 dims — use hnsw instead (supports up to 2000 dims too,
-- but for small datasets <1000 rows no index is needed — seq scan is instant).
-- 
-- Run this AFTER running create_knowledge_tables.sql
-- (or run this alone if the first migration partially ran)
-- =============================================================================

-- ── Drop & recreate home_remedy_embeddings ────────────────────────────────────
DROP TABLE IF EXISTS home_remedy_embeddings CASCADE;

CREATE TABLE home_remedy_embeddings (
    id                 bigserial PRIMARY KEY,
    remedy_name        text NOT NULL,
    remedy_name_hindi  text,
    ailment            text,
    ailment_hindi      text,
    symptoms_keywords  text[],
    chunk_text         text NOT NULL,
    embedding          vector(3072),
    created_at         timestamptz DEFAULT now()
);

-- Cosine similarity search — no ANN index needed for small dataset (<500 rows)
CREATE OR REPLACE FUNCTION match_home_remedy_embeddings(
    query_embedding    vector(3072),
    match_threshold    float DEFAULT 0.75,
    match_count        int   DEFAULT 3
)
RETURNS TABLE(
    id                 bigint,
    remedy_name        text,
    chunk_text         text,
    similarity         float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        id,
        remedy_name,
        chunk_text,
        1 - (embedding <=> query_embedding) AS similarity
    FROM home_remedy_embeddings
    WHERE 1 - (embedding <=> query_embedding) > match_threshold
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;

-- RLS
ALTER TABLE home_remedy_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Home remedy embeddings are publicly readable"
    ON home_remedy_embeddings FOR SELECT
    USING (true);


-- ── Drop & recreate ayurvedic_embeddings ──────────────────────────────────────
DROP TABLE IF EXISTS ayurvedic_embeddings CASCADE;

CREATE TABLE ayurvedic_embeddings (
    id                 bigserial PRIMARY KEY,
    herb_name          text NOT NULL,
    herb_name_hindi    text,
    conditions         text[],
    symptoms_keywords  text[],
    chunk_text         text NOT NULL,
    embedding          vector(3072),
    created_at         timestamptz DEFAULT now()
);

-- Cosine similarity search
CREATE OR REPLACE FUNCTION match_ayurvedic_embeddings(
    query_embedding    vector(3072),
    match_threshold    float DEFAULT 0.75,
    match_count        int   DEFAULT 3
)
RETURNS TABLE(
    id                 bigint,
    herb_name          text,
    chunk_text         text,
    similarity         float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        id,
        herb_name,
        chunk_text,
        1 - (embedding <=> query_embedding) AS similarity
    FROM ayurvedic_embeddings
    WHERE 1 - (embedding <=> query_embedding) > match_threshold
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;

-- RLS
ALTER TABLE ayurvedic_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ayurvedic embeddings are publicly readable"
    ON ayurvedic_embeddings FOR SELECT
    USING (true);
