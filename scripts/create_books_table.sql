-- ═══════════════════════════════════════════════════════════════════════════
-- Healio.AI — Ayurvedic Knowledge Embeddings Table (Books & Classical Texts)
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Main table ───────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS ayurvedic_knowledge_embeddings;

CREATE TABLE IF NOT EXISTS ayurvedic_knowledge_embeddings (
    id              BIGSERIAL PRIMARY KEY,
    source          TEXT NOT NULL,  -- e.g. "PlanetAyurveda", "InternetArchive"
    book            TEXT NOT NULL,  -- e.g. "Indian Medicinal Plants"
    category        TEXT NOT NULL,  -- e.g. "medicinal_plants", "classical_text"
    page            INT,            -- page number
    section         TEXT,           -- chapter or section heading
    text            TEXT NOT NULL,  -- the extracted chunk
    keywords        TEXT[],         -- detected keywords
    embedding       vector(3072),   -- Gemini/API embedding dimension
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    -- Optional: a unique constraint to avoid duplicates if ingestion is re-run
    UNIQUE(book, page, id)  
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Note: standard pgvector HNSW limits dimensions to 2000. 
-- Since we have 3072 dimensions, we will rely on Exact K-NN (sequential search) 
-- which is perfectly fast for < 100,000 rows.
-- CREATE INDEX IF NOT EXISTS ayurvedic_knowledge_embeddings_idx
--     ON ayurvedic_knowledge_embeddings
--     USING hnsw (embedding vector_cosine_ops)
--     WITH (m = 16, ef_construction = 64);

-- Fast filter by book & category
CREATE INDEX IF NOT EXISTS ayurvedic_knowledge_book_idx
    ON ayurvedic_knowledge_embeddings (book);

CREATE INDEX IF NOT EXISTS ayurvedic_knowledge_category_idx
    ON ayurvedic_knowledge_embeddings (category);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE ayurvedic_knowledge_embeddings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to READ (for RAG lookups)
DROP POLICY IF EXISTS "Allow authenticated read" ON ayurvedic_knowledge_embeddings;
CREATE POLICY "Allow authenticated read"
    ON ayurvedic_knowledge_embeddings
    FOR SELECT
    TO authenticated
    USING (true);

-- Only service_role can INSERT / UPDATE / DELETE (for ingestion scripts)
DROP POLICY IF EXISTS "Allow service_role all" ON ayurvedic_knowledge_embeddings;
CREATE POLICY "Allow service_role all"
    ON ayurvedic_knowledge_embeddings
    FOR ALL
    TO service_role
    USING (true);

-- ── Semantic search function ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_ayurvedic_knowledge (
    query_embedding vector(3072),
    match_threshold FLOAT    DEFAULT 0.70,
    match_count     INT      DEFAULT 10,
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
LANGUAGE sql STABLE AS $$
    SELECT
        id,
        source,
        book,
        category,
        page,
        section,
        text,
        keywords,
        1 - (embedding <=> query_embedding) AS similarity
    FROM ayurvedic_knowledge_embeddings
    WHERE
        (filter_category IS NULL OR category = filter_category)
        AND (filter_book IS NULL OR book = filter_book)
        AND 1 - (embedding <=> query_embedding) > match_threshold
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;
