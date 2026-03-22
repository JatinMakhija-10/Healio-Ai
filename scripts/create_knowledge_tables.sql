-- =============================================================================
-- Healio.AI — New Knowledge Base Tables
-- Run this migration in Supabase SQL Editor
-- =============================================================================

-- ── 1. Ayurvedic Herb Embeddings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ayurvedic_embeddings (
    id                 bigserial PRIMARY KEY,
    herb_name          text NOT NULL,
    herb_name_hindi    text,
    conditions         text[],
    symptoms_keywords  text[],
    chunk_text         text NOT NULL,
    embedding          vector(768),   -- Gemini gemini-embedding-001 output dimension
    created_at         timestamptz DEFAULT now()
);

-- Cosine similarity search function for Ayurvedic herbs
CREATE OR REPLACE FUNCTION match_ayurvedic_embeddings(
    query_embedding    vector(768),
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

-- Index for fast ANN search
CREATE INDEX IF NOT EXISTS ayurvedic_embeddings_vector_idx
    ON ayurvedic_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 50);

-- RLS: Public read (these are knowledge base entries, not user data)
ALTER TABLE ayurvedic_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ayurvedic embeddings are publicly readable"
    ON ayurvedic_embeddings FOR SELECT
    USING (true);


-- ── 2. Home Remedy Embeddings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS home_remedy_embeddings (
    id                 bigserial PRIMARY KEY,
    remedy_name        text NOT NULL,
    remedy_name_hindi  text,
    ailment            text,
    ailment_hindi      text,
    symptoms_keywords  text[],
    chunk_text         text NOT NULL,          -- Full preparation text for RAG injection
    embedding          vector(768),             -- Gemini gemini-embedding-001 output dimension
    created_at         timestamptz DEFAULT now()
);

-- Cosine similarity search function for home remedies
CREATE OR REPLACE FUNCTION match_home_remedy_embeddings(
    query_embedding    vector(768),
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

-- Index for fast ANN search
CREATE INDEX IF NOT EXISTS home_remedy_embeddings_vector_idx
    ON home_remedy_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 50);

-- RLS: Public read
ALTER TABLE home_remedy_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Home remedy embeddings are publicly readable"
    ON home_remedy_embeddings FOR SELECT
    USING (true);


-- ── 3. Personas Table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personas (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name               text NOT NULL,
    relationship       text NOT NULL DEFAULT 'Self',
    date_of_birth      date,
    sex                text,
    conditions         text[],      -- ['Diabetes', 'Hypertension']
    medications        text[],
    allergies          text[],
    notes              text,
    is_self            boolean DEFAULT false,
    created_at         timestamptz DEFAULT now(),
    updated_at         timestamptz DEFAULT now()
);

ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own personas"
    ON personas FOR ALL
    USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_personas_updated_at
    BEFORE UPDATE ON personas
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();


-- ── 4. Freemium: Add columns to profiles ─────────────────────────────────────
-- (Add to existing profiles table — skip if they already exist)
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS is_premium            boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS premium_since         timestamptz,
    ADD COLUMN IF NOT EXISTS premium_expires_at    timestamptz,
    ADD COLUMN IF NOT EXISTS monthly_chat_count    integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS chat_count_reset_at   timestamptz DEFAULT date_trunc('month', now()),
    ADD COLUMN IF NOT EXISTS stripe_customer_id    text;

-- Atomic usage counter increment (race-condition safe)
CREATE OR REPLACE FUNCTION increment_usage(p_user_id uuid)
RETURNS void AS $$
    UPDATE profiles
    SET
        monthly_chat_count = CASE
            WHEN chat_count_reset_at < date_trunc('month', now())
            THEN 1  -- Reset and start at 1 for new month
            ELSE monthly_chat_count + 1
        END,
        chat_count_reset_at = CASE
            WHEN chat_count_reset_at < date_trunc('month', now())
            THEN date_trunc('month', now())
            ELSE chat_count_reset_at
        END
    WHERE id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;


-- ── 5. Safety Audit Log (for emergency redirects) ────────────────────────────
CREATE TABLE IF NOT EXISTS safety_events (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type         text NOT NULL DEFAULT 'emergency_redirect',
    trigger_keywords   text[],
    message_snippet    text,       -- first 200 chars of user message
    country_code       text,
    created_at         timestamptz DEFAULT now()
);

ALTER TABLE safety_events ENABLE ROW LEVEL SECURITY;
-- Only admins can read safety events
CREATE POLICY "Service role can insert safety events"
    ON safety_events FOR INSERT
    WITH CHECK (true);
