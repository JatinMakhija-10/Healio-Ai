-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create the boericke_embeddings table
create table if not exists boericke_embeddings (
  id bigint primary key generated always as identity,
  remedy_name text not null,
  chunk_text text not null,
  -- text-embedding-004 output is 768 dimensions
  embedding vector(768)
);

-- Note: The OpenHomeopath tables will be created by importing the OpenHomeopath.sql file directly.
-- For the embeddings, we'll create an index to speed up vector similarity searches.
create index if not exists boericke_embeddings_embedding_idx on boericke_embeddings using hnsw (embedding vector_cosine_ops);

-- Set up row level security (RLS)
alter table boericke_embeddings enable row level security;

-- Allow public read access to embeddings for the anon API key
create policy "Allow public read access to boericke_embeddings"
  on boericke_embeddings for select using (true);

-- Allow authenticated admins to insert (or use service_role key which bypasses RLS)
-- The ingestion script will use the service_role key, so this is just in case.
