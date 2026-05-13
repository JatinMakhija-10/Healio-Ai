-- ─── Clinical Cases Table ─────────────────────────────────────────────────────
-- Stores de-identified real patient case data ingested from:
--   • PMC-Patients  (167k cases, PubMed Central)
--   • MIMIC-IV Demo (100 patients, structured EHR)
--   • CUPCase       (3,562 cases, BMC open access)
--   • MultiCaRe     (96k cases, PubMed Central)
--
-- Each row = one patient case, with a 768-dim Gemini embedding of the narrative.
-- Used by PatientSimilarityEngine and the RAG pipeline for case-based retrieval.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS clinical_cases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Source tracking
    case_id             TEXT UNIQUE NOT NULL,           -- e.g. "pmc_PMC12345_0"
    source              TEXT NOT NULL CHECK (source IN (
                            'pmc_patients', 'mimic_demo', 'cupcase', 'multicare'
                        )),
    source_url          TEXT,                           -- original article URL if available
    -- Demographics (de-identified)
    age                 INTEGER,
    age_group           TEXT,                           -- 'pediatric','young_adult','middle_aged','elderly','very_elderly'
    gender              TEXT CHECK (gender IN ('male', 'female', 'unknown')),
    -- Clinical content
    chief_complaint     TEXT,                           -- what patient complained of
    presenting_symptoms TEXT[],                         -- normalized symptom keyword array
    clinical_findings   TEXT,                           -- examination / investigation findings
    diagnosis           TEXT[],                         -- final diagnosis names
    icd_codes           TEXT[],                         -- ICD-10 codes if available
    medications         TEXT[],                         -- prescribed medications
    treatment_summary   TEXT,                           -- treatment/management summary
    outcome             TEXT,                           -- recovered, hospitalized, expired, unknown
    -- Full narrative for RAG
    narrative           TEXT NOT NULL,                  -- full case text, used for embedding
    embedding           VECTOR(768),                    -- Gemini text-embedding-004
    -- Metadata
    specialty           TEXT,                           -- cardiology, neurology, etc.
    publication_year    INTEGER,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- Primary vector similarity search (HNSW — fast approximate)
CREATE INDEX IF NOT EXISTS clinical_cases_embedding_hnsw
    ON clinical_cases USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Source filter (for analytics / per-source queries)
CREATE INDEX IF NOT EXISTS clinical_cases_source_idx ON clinical_cases (source);

-- Symptom array search (GIN for array containment queries)
CREATE INDEX IF NOT EXISTS clinical_cases_symptoms_gin
    ON clinical_cases USING gin (presenting_symptoms);

-- Diagnosis array search
CREATE INDEX IF NOT EXISTS clinical_cases_diagnosis_gin
    ON clinical_cases USING gin (diagnosis);

-- Age + gender for demographic filtering
CREATE INDEX IF NOT EXISTS clinical_cases_demographics_idx
    ON clinical_cases (age_group, gender);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE clinical_cases ENABLE ROW LEVEL SECURITY;

-- Public read (anon key can query for diagnosis)
CREATE POLICY "Public read clinical cases"
    ON clinical_cases FOR SELECT USING (true);

-- Service role insert (ingestion script uses service_role key)
-- RLS is bypassed for service_role — no explicit policy needed.

-- ─── Vector Search Function ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION match_clinical_cases(
    query_embedding     VECTOR(768),
    match_threshold     FLOAT    DEFAULT 0.65,
    match_count         INT      DEFAULT 10,
    filter_age_group    TEXT     DEFAULT NULL,
    filter_gender       TEXT     DEFAULT NULL,
    filter_source       TEXT     DEFAULT NULL
)
RETURNS TABLE (
    id                  UUID,
    case_id             TEXT,
    source              TEXT,
    age                 INTEGER,
    age_group           TEXT,
    gender              TEXT,
    chief_complaint     TEXT,
    presenting_symptoms TEXT[],
    diagnosis           TEXT[],
    icd_codes           TEXT[],
    medications         TEXT[],
    narrative           TEXT,
    specialty           TEXT,
    similarity          FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cc.id,
        cc.case_id,
        cc.source,
        cc.age,
        cc.age_group,
        cc.gender,
        cc.chief_complaint,
        cc.presenting_symptoms,
        cc.diagnosis,
        cc.icd_codes,
        cc.medications,
        cc.narrative,
        cc.specialty,
        1 - (cc.embedding <=> query_embedding) AS similarity
    FROM clinical_cases cc
    WHERE
        1 - (cc.embedding <=> query_embedding) > match_threshold
        AND (filter_age_group IS NULL OR cc.age_group = filter_age_group)
        AND (filter_gender    IS NULL OR cc.gender     = filter_gender)
        AND (filter_source    IS NULL OR cc.source     = filter_source)
    ORDER BY cc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ─── Symptom Array Search Function ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION find_cases_by_symptoms(
    symptom_keywords    TEXT[],
    min_overlap         INT  DEFAULT 2,
    result_limit        INT  DEFAULT 20
)
RETURNS TABLE (
    case_id             TEXT,
    source              TEXT,
    age_group           TEXT,
    gender              TEXT,
    diagnosis           TEXT[],
    medications         TEXT[],
    overlap_count       BIGINT,
    similarity_hint     FLOAT
)
LANGUAGE sql
AS $$
    SELECT
        sub.case_id,
        sub.source,
        sub.age_group,
        sub.gender,
        sub.diagnosis,
        sub.medications,
        sub.overlap_count,
        sub.similarity_hint
    FROM (
        SELECT
            cc.case_id,
            cc.source,
            cc.age_group,
            cc.gender,
            cc.diagnosis,
            cc.medications,
            cardinality(
                ARRAY(
                    SELECT unnest(cc.presenting_symptoms)
                    INTERSECT
                    SELECT unnest(symptom_keywords)
                )
            )::BIGINT AS overlap_count,
            cardinality(
                ARRAY(
                    SELECT unnest(cc.presenting_symptoms)
                    INTERSECT
                    SELECT unnest(symptom_keywords)
                )
            )::FLOAT / GREATEST(cardinality(cc.presenting_symptoms), 1)::FLOAT AS similarity_hint
        FROM clinical_cases cc
        WHERE cc.presenting_symptoms && symptom_keywords   -- GIN index hit
    ) sub
    WHERE sub.overlap_count >= min_overlap
    ORDER BY sub.overlap_count DESC, sub.similarity_hint DESC
    LIMIT result_limit;
$$;

-- ─── Stats View ───────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW clinical_cases_stats AS
SELECT
    source,
    COUNT(*)                                     AS total_cases,
    COUNT(*) FILTER (WHERE embedding IS NOT NULL) AS embedded_cases,
    COUNT(*) FILTER (WHERE age IS NOT NULL)       AS cases_with_age,
    COUNT(*) FILTER (WHERE gender != 'unknown')   AS cases_with_gender,
    COUNT(*) FILTER (WHERE icd_codes IS NOT NULL
                       AND icd_codes != '{}')     AS cases_with_icd,
    COUNT(*) FILTER (WHERE medications IS NOT NULL
                       AND medications != '{}')   AS cases_with_meds,
    MIN(publication_year)                         AS earliest_year,
    MAX(publication_year)                         AS latest_year
FROM clinical_cases
GROUP BY source;
