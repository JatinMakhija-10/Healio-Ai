-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Drop existing table if it exists to ensure clean slate for the new schema
drop table if exists conditions;

create table conditions (
  id uuid primary key default gen_random_uuid(),
  code text unique, -- ICD-10 code or internal ID
  name text not null,
  description text,
  
  -- Structured Match Criteria
  -- Stores: { locations: [], symptoms: [], symptomWeights: {}, ... }
  match_criteria jsonb, 
  
  -- Metadata
  prevalence text, -- 'common', 'rare', etc.
  severity text,
  
  -- Clinical Data
  red_flags text[],
  mandatory_symptoms text[],
  mimics text[],
  
  -- Content
  remedies jsonb,         -- Array of Remedy objects
  indian_home_remedies jsonb, -- Array of Remedy objects
  exercises jsonb,        -- Array of Exercise objects
  warnings text[],
  seek_help text,
  
  -- Vector Embedding (OpenAI 1536d)
  embedding vector(1536),
  
  -- Search Text (for keyword fallback)
  -- Generated column combining name and description for Full Text Search
  search_text tsvector generated always as (to_tsvector('english', name || ' ' || coalesce(description, ''))) stored,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create an index for faster vector similarity search
-- lists = 100 is a good starting point for < 1M rows
create index on conditions using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create an index for keyword search
create index conditions_search_text_idx on conditions using gin (search_text);

-- Enable Row Level Security (RLS)
alter table conditions enable row level security;

-- Policy: Public read access
create policy "Public conditions are viewable by everyone"
  on conditions for select
  using ( true );

-- Policy: Service role only for insert/update (or authenticated admin)
-- For development seeding, you might temporarily allow public, but standard is service_role.
create policy "Service role can upload conditions"
  on conditions for insert
  with check ( auth.role() = 'service_role' );

create policy "Service role can update conditions"
  on conditions for update
  using ( auth.role() = 'service_role' );

-- RPC Function for Similarity Search
create or replace function match_conditions (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  code text,
  name text,
  description text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    conditions.id,
    conditions.code,
    conditions.name,
    conditions.description,
    1 - (conditions.embedding <=> query_embedding) as similarity
  from conditions
  where 1 - (conditions.embedding <=> query_embedding) > match_threshold
  order by conditions.embedding <=> query_embedding
  limit match_count;
end;
$$;
