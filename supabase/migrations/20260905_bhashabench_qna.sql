-- ═══════════════════════════════════════════════════════════════════════════
-- Healio.AI — BhashaBench-Ayur Ayurvedic Q&A Embeddings Table & RPC
-- File: supabase/migrations/20260905_bhashabench_qna.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS vector;

-- ── Main Table ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ayurvedic_qna_embeddings (
    id              BIGSERIAL PRIMARY KEY,
    question_id     TEXT,
    question        TEXT NOT NULL,
    options         TEXT[],
    answer          TEXT,
    correct_option  TEXT,
    explanation     TEXT,
    domain          TEXT,
    difficulty      TEXT,
    question_type   TEXT,
    language        TEXT,
    chunk_text      TEXT NOT NULL,
    embedding       vector(768),
    source          TEXT DEFAULT 'BhashaBench-Ayur',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ayurvedic_qna_vector 
    ON ayurvedic_qna_embeddings 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_ayurvedic_qna_domain ON ayurvedic_qna_embeddings (domain);
CREATE INDEX IF NOT EXISTS idx_ayurvedic_qna_language ON ayurvedic_qna_embeddings (language);

-- ── RLS Policies ──────────────────────────────────────────────────────────────
ALTER TABLE ayurvedic_qna_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ayurvedic_qna_public_read" ON ayurvedic_qna_embeddings;
CREATE POLICY "ayurvedic_qna_public_read"
    ON ayurvedic_qna_embeddings FOR SELECT USING (true);

DROP POLICY IF EXISTS "ayurvedic_qna_service_insert" ON ayurvedic_qna_embeddings;
CREATE POLICY "ayurvedic_qna_service_insert"
    ON ayurvedic_qna_embeddings FOR ALL WITH CHECK (true);

-- ── Search Function for RAG ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_ayurvedic_qna (
    query_embedding vector(768),
    match_threshold FLOAT    DEFAULT 0.55,
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
    chunk_text    TEXT,
    similarity    FLOAT
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    SELECT
        qna.id,
        qna.question,
        qna.answer,
        qna.explanation,
        qna.domain,
        qna.difficulty,
        qna.language,
        qna.chunk_text,
        (1 - (qna.embedding <=> query_embedding))::float AS similarity
    FROM ayurvedic_qna_embeddings qna
    WHERE
        (filter_language IS NULL OR qna.language = filter_language)
        AND (filter_domain IS NULL OR qna.domain = filter_domain)
        AND 1 - (qna.embedding <=> query_embedding) > match_threshold
    ORDER BY qna.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
