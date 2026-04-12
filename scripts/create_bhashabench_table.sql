-- ═══════════════════════════════════════════════════════════════════════════
-- Healio.AI — Ayurvedic Q&A Embeddings Table (BhashaBench-Ayur)
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Main table ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ayurvedic_qna_embeddings (
    id              BIGSERIAL PRIMARY KEY,
    question_id     TEXT,
    question        TEXT        NOT NULL,
    answer          TEXT,
    explanation     TEXT,
    domain          TEXT,           -- e.g. "Dravyaguna", "Panchakarma"
    difficulty      TEXT,           -- Easy | Medium | Hard
    question_type   TEXT,           -- MCQ | Fill in the blanks | etc.
    language        TEXT,           -- English | Hindi
    chunk_text      TEXT,           -- full text sent to the embedding model
    embedding       vector(3072),   -- Gemini/API embedding dimension
    source          TEXT DEFAULT 'BhashaBench-Ayur',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Note: standard pgvector HNSW limits dimensions to 2000. 
-- Since we have 3072 dimensions, we will rely on Exact K-NN (sequential search)
-- which is perfectly fast for < 100,000 rows.
-- CREATE INDEX IF NOT EXISTS ayurvedic_qna_embeddings_embedding_idx
--     ON ayurvedic_qna_embeddings
--     USING hnsw (embedding vector_cosine_ops)
--     WITH (m = 16, ef_construction = 64);

-- Fast filter by domain & language
CREATE INDEX IF NOT EXISTS ayurvedic_qna_domain_idx
    ON ayurvedic_qna_embeddings (domain);

CREATE INDEX IF NOT EXISTS ayurvedic_qna_language_idx
    ON ayurvedic_qna_embeddings (language);

CREATE INDEX IF NOT EXISTS ayurvedic_qna_difficulty_idx
    ON ayurvedic_qna_embeddings (difficulty);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE ayurvedic_qna_embeddings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to READ (for RAG lookups)
DROP POLICY IF EXISTS "Allow authenticated read" ON ayurvedic_qna_embeddings;
CREATE POLICY "Allow authenticated read"
    ON ayurvedic_qna_embeddings
    FOR SELECT
    TO authenticated
    USING (true);

-- Only service_role can INSERT / UPDATE / DELETE (for ingestion scripts)
DROP POLICY IF EXISTS "Allow service_role all" ON ayurvedic_qna_embeddings;
CREATE POLICY "Allow service_role all"
    ON ayurvedic_qna_embeddings
    FOR ALL
    TO service_role
    USING (true);

-- ── Semantic search function ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_ayurvedic_qna (
    query_embedding vector(3072),
    match_threshold FLOAT    DEFAULT 0.70,
    match_count     INT      DEFAULT 10,
    filter_language TEXT     DEFAULT NULL,
    filter_domain   TEXT     DEFAULT NULL
)
RETURNS TABLE (
    id            BIGINT,
    question      TEXT,
    answer        TEXT,
    explanation   TEXT,
    domain        TEXT,
    difficulty    TEXT,
    language      TEXT,
    similarity    FLOAT
)
LANGUAGE sql STABLE AS $$
    SELECT
        id,
        question,
        answer,
        explanation,
        domain,
        difficulty,
        language,
        1 - (embedding <=> query_embedding) AS similarity
    FROM  ayurvedic_qna_embeddings
    WHERE
        (filter_language IS NULL OR language = filter_language)
        AND (filter_domain IS NULL OR domain = filter_domain)
        AND 1 - (embedding <=> query_embedding) > match_threshold
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;
