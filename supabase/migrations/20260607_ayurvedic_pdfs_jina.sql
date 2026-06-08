-- Create the new table for Jina-embedded Ayurveda PDFs
CREATE TABLE IF NOT EXISTS ayurvedic_pdf_embeddings (
    id BIGSERIAL PRIMARY KEY,
    source_file TEXT,
    page_number INTEGER,
    chunk_text TEXT,
    embedding vector(768)
);

-- Enable RLS
ALTER TABLE ayurvedic_pdf_embeddings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS ayurvedic_pdf_embeddings_select_policy ON ayurvedic_pdf_embeddings;
DROP POLICY IF EXISTS ayurvedic_pdf_embeddings_insert_policy ON ayurvedic_pdf_embeddings;

-- Public read access
CREATE POLICY ayurvedic_pdf_embeddings_select_policy 
    ON ayurvedic_pdf_embeddings FOR SELECT 
    USING (true);

-- Service role insert access
CREATE POLICY ayurvedic_pdf_embeddings_insert_policy 
    ON ayurvedic_pdf_embeddings FOR INSERT 
    WITH CHECK (true);

-- Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_ayurvedic_pdf_embeddings_vector 
    ON ayurvedic_pdf_embeddings 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- RPC function for searching the PDFs
CREATE OR REPLACE FUNCTION match_ayurvedic_pdfs (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id bigint,
  source_file text,
  page_number integer,
  chunk_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ayurvedic_pdf_embeddings.id,
    ayurvedic_pdf_embeddings.source_file,
    ayurvedic_pdf_embeddings.page_number,
    ayurvedic_pdf_embeddings.chunk_text,
    1 - (ayurvedic_pdf_embeddings.embedding <=> query_embedding) AS similarity
  FROM ayurvedic_pdf_embeddings
  WHERE 1 - (ayurvedic_pdf_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY ayurvedic_pdf_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
