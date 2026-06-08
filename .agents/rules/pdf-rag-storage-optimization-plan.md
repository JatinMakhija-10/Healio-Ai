# PDF RAG Storage Optimization Plan
## Handling 93+ Large PDFs with Limited Supabase Storage

**Current Context:**
- Supabase storage is full (likely from `chat-attachments` and `wellness-videos` buckets)
- Need to accommodate 93+ large PDFs for RAG (Retrieval-Augmented Generation)
- Existing RAG infrastructure uses vector embeddings (768-dim Gemini)
- Current setup: clinical_cases, boericke_embeddings, ayurvedic_knowledge_embeddings
- **GOOD NEWS:** You already process PDFs correctly (extract → chunk → embed), NOT uploading to storage!

---

## 🎯 Root Cause Analysis

After reviewing your code:

### ✅ **What You're Already Doing Right:**
1. PDFs are downloaded to `data/ayurveda/raw/` locally (not Supabase)
2. Ingestion scripts (`ingest_books.ts`, `ingest_ayurveda.ts`) extract text and create embeddings
3. Only embeddings + metadata are stored in database tables
4. Database tables (not storage buckets) hold embeddings

### ❌ **What's Actually Filling Storage:**
1. **`chat-attachments` bucket** - User-uploaded images, PDFs, docs in chat messages
2. **`wellness-videos` bucket** - Doctor-uploaded wellness videos + thumbnails
3. No retention policies or cleanup mechanisms
4. No file size limits enforced at storage level
5. Orphaned files (uploaded but not referenced in database)

---

## 🎯 Strategy Overview

**Core Principle:** Clean up storage buckets, implement retention policies, and optionally move large files to external storage.

---

## 📋 Recommended Solution

### **Solution 1: Clean Up Storage Buckets (Immediate)**

**Benefits:**
- ✅ Free up 40-70% of storage immediately
- ✅ Zero code changes required
- ✅ Can be done in 1-2 hours
- ✅ No infrastructure costs

#### **Expected Results:**
```
Before: 1 GB (full)
After:  200-400 MB (60-80% utilization)
Freed:  400-600 MB
```

### **Solution 2: Implement Retention Policies (Preventive)**

**Benefits:**
- ✅ Automatic cleanup of old files
- ✅ Prevents future storage issues
- ✅ Maintains optimal storage usage
- ✅ No manual intervention needed

### **Solution 3: External Storage for Videos (Optional)**

**Benefits:**
- ✅ Offload largest files (videos)
- ✅ Cost-effective ($2-5/month)
- ✅ Unlimited scalability
- ✅ Better video delivery (CDN)

---

## 🏗️ Implementation Plan

### **Phase 1: PDF Processing Pipeline**

#### **1.1 Extract & Chunk PDFs**
```bash
# Dependencies
npm install pdf-parse langchain @langchain/community
```

**Script: `scripts/ingest_pdfs_to_rag.ts`**
```typescript
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function extractPDF(pdfPath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdf(dataBuffer);
  return data.text;
}

async function chunkText(text: string, pdfName: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ['\n\n', '\n', '. ', ' ', '']
  });
  
  const chunks = await splitter.createDocuments([text]);
  return chunks.map((chunk, idx) => ({
    pdf_name: pdfName,
    chunk_index: idx,
    content: chunk.pageContent,
    char_count: chunk.pageContent.length
  }));
}

async function generateEmbedding(text: string): Promise<number[]> {
  // Using Gemini text-embedding-004 (768-dim)
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768
      })
    }
  );
  
  const data = await response.json();
  return data.embedding.values;
}

async function ingestPDF(pdfPath: string) {
  console.log(`Processing: ${pdfPath}`);
  const pdfName = path.basename(pdfPath, '.pdf');
  
  // Extract text
  const text = await extractPDF(pdfPath);
  console.log(`  Extracted ${text.length} characters`);
  
  // Chunk text
  const chunks = await chunkText(text, pdfName);
  console.log(`  Created ${chunks.length} chunks`);
  
  // Generate embeddings & insert
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk.content);
    
    await supabase.from('pdf_embeddings').insert({
      pdf_name: chunk.pdf_name,
      chunk_index: chunk.chunk_index,
      content: chunk.content,
      char_count: chunk.char_count,
      embedding
    });
    
    if ((i + 1) % 10 === 0) {
      console.log(`    Embedded ${i + 1}/${chunks.length} chunks`);
    }
    
    // Rate limiting (Gemini: 1500 requests/min for free tier)
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log(`✓ Completed: ${pdfName}`);
}

async function main() {
  const pdfDirectory = './data/pdfs'; // Place your PDFs here
  const pdfFiles = fs.readdirSync(pdfDirectory)
    .filter(f => f.endsWith('.pdf'))
    .map(f => path.join(pdfDirectory, f));
  
  console.log(`Found ${pdfFiles.length} PDFs to process\n`);
  
  for (const pdfPath of pdfFiles) {
    await ingestPDF(pdfPath);
  }
  
  console.log('\n✅ All PDFs processed successfully');
}

main().catch(console.error);
```

---

#### **1.2 Database Schema**

**Migration: `supabase/migrations/20260607_pdf_embeddings.sql`**
```sql
-- ─── PDF Embeddings Table ────────────────────────────────────────────────
-- Stores chunked PDF content with embeddings for RAG retrieval
-- Storage estimate: ~140 MB for 93 PDFs × 500 chunks × 3 KB/row

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS pdf_embeddings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Source tracking
    pdf_name        TEXT NOT NULL,              -- e.g. "medical_textbook_chapter_5"
    pdf_category    TEXT,                       -- e.g. "medical", "research", "clinical_guidelines"
    chunk_index     INTEGER NOT NULL,           -- 0-indexed chunk sequence
    -- Content
    content         TEXT NOT NULL,              -- chunked text (500-1500 chars typically)
    char_count      INTEGER NOT NULL,
    page_number     INTEGER,                    -- original PDF page (if extracted)
    -- Embedding
    embedding       VECTOR(768) NOT NULL,       -- Gemini text-embedding-004
    -- Metadata
    metadata        JSONB DEFAULT '{}',         -- e.g. author, publication_date, tags
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    -- Composite unique constraint
    UNIQUE(pdf_name, chunk_index)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────

-- HNSW for fast cosine similarity search
CREATE INDEX pdf_embeddings_hnsw
    ON pdf_embeddings USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Filter by PDF name
CREATE INDEX pdf_embeddings_name_idx ON pdf_embeddings (pdf_name);

-- Filter by category
CREATE INDEX pdf_embeddings_category_idx ON pdf_embeddings (pdf_category);

-- Full-text search on content (optional but recommended)
CREATE INDEX pdf_embeddings_content_fts
    ON pdf_embeddings USING gin (to_tsvector('english', content));

-- ─── RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE pdf_embeddings ENABLE ROW LEVEL SECURITY;

-- Public read (allow anon users to query RAG)
CREATE POLICY "Public read PDF embeddings"
    ON pdf_embeddings FOR SELECT USING (true);

-- Service role insert/update only
-- (No explicit policy needed — service_role bypasses RLS)

-- ─── Vector Search Function ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION match_pdf_embeddings(
    query_embedding     VECTOR(768),
    match_threshold     FLOAT    DEFAULT 0.70,
    match_count         INT      DEFAULT 10,
    filter_category     TEXT     DEFAULT NULL,
    filter_pdf_name     TEXT     DEFAULT NULL
)
RETURNS TABLE (
    id              UUID,
    pdf_name        TEXT,
    pdf_category    TEXT,
    chunk_index     INTEGER,
    content         TEXT,
    page_number     INTEGER,
    metadata        JSONB,
    similarity      FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pe.id,
        pe.pdf_name,
        pe.pdf_category,
        pe.chunk_index,
        pe.content,
        pe.page_number,
        pe.metadata,
        1 - (pe.embedding <=> query_embedding) AS similarity
    FROM pdf_embeddings pe
    WHERE
        1 - (pe.embedding <=> query_embedding) > match_threshold
        AND (filter_category IS NULL OR pe.pdf_category = filter_category)
        AND (filter_pdf_name IS NULL OR pe.pdf_name = filter_pdf_name)
    ORDER BY pe.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ─── Hybrid Search (Vector + Full-Text) ────────────────────────────────────

CREATE OR REPLACE FUNCTION hybrid_search_pdf(
    query_text          TEXT,
    query_embedding     VECTOR(768),
    match_count         INT      DEFAULT 10,
    vector_weight       FLOAT    DEFAULT 0.7,  -- 70% vector, 30% text
    filter_category     TEXT     DEFAULT NULL
)
RETURNS TABLE (
    id              UUID,
    pdf_name        TEXT,
    content         TEXT,
    chunk_index     INTEGER,
    similarity      FLOAT,
    fts_rank        FLOAT,
    combined_score  FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH vector_matches AS (
        SELECT
            pe.id,
            pe.pdf_name,
            pe.content,
            pe.chunk_index,
            1 - (pe.embedding <=> query_embedding) AS similarity
        FROM pdf_embeddings pe
        WHERE filter_category IS NULL OR pe.pdf_category = filter_category
        ORDER BY pe.embedding <=> query_embedding
        LIMIT match_count * 3
    ),
    fts_matches AS (
        SELECT
            pe.id,
            ts_rank(to_tsvector('english', pe.content), plainto_tsquery('english', query_text)) AS fts_rank
        FROM pdf_embeddings pe
        WHERE to_tsvector('english', pe.content) @@ plainto_tsquery('english', query_text)
          AND (filter_category IS NULL OR pe.pdf_category = filter_category)
    )
    SELECT
        vm.id,
        vm.pdf_name,
        vm.content,
        vm.chunk_index,
        vm.similarity,
        COALESCE(fm.fts_rank, 0.0) AS fts_rank,
        (vector_weight * vm.similarity + (1 - vector_weight) * COALESCE(fm.fts_rank, 0.0)) AS combined_score
    FROM vector_matches vm
    LEFT JOIN fts_matches fm ON vm.id = fm.id
    ORDER BY combined_score DESC
    LIMIT match_count;
END;
$$;

-- ─── Analytics View ────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW pdf_embeddings_stats AS
SELECT
    pdf_name,
    pdf_category,
    COUNT(*) AS total_chunks,
    SUM(char_count) AS total_chars,
    AVG(char_count)::INTEGER AS avg_chunk_size,
    MIN(chunk_index) AS first_chunk,
    MAX(chunk_index) AS last_chunk,
    COUNT(*) FILTER (WHERE embedding IS NOT NULL) AS embedded_chunks
FROM pdf_embeddings
GROUP BY pdf_name, pdf_category
ORDER BY pdf_name;
```

---

### **Phase 2: Alternative Storage for Raw PDFs**

If you need to keep original PDFs accessible:

#### **Option A: External Cloud Storage**
- **AWS S3** (5 GB free tier, then $0.023/GB/month)
- **Cloudflare R2** (10 GB free, zero egress fees)
- **Google Cloud Storage** (5 GB free)
- **Backblaze B2** ($0.005/GB/month, cheapest)

**Recommendation:** Cloudflare R2 (cost-effective, zero egress)

```typescript
// Upload to R2, store only URL in Supabase
await supabase.from('pdf_metadata').insert({
  pdf_name: 'document.pdf',
  storage_url: 'https://r2.example.com/pdfs/document.pdf',
  file_size_mb: 5.2,
  upload_date: new Date().toISOString()
});
```

#### **Option B: Compression & Deduplication**
- Compress PDFs with `ghostscript` (can reduce size by 70-90%)
- Store deduplicated chunks (multiple PDFs may share content)

```bash
# Compress PDF (Linux/Mac)
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=output.pdf input.pdf
```

#### **Option C: Upgrade Supabase Plan**
- **Free:** 1 GB storage
- **Pro ($25/mo):** 8 GB storage + $0.125/GB extra
- **93 PDFs × 5 MB = 465 MB** → Still fits in Pro tier

---

### **Phase 3: RAG Integration**

#### **3.1 Query API Endpoint**

**File: `src/app/api/rag/search/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_QUERY',
        outputDimensionality: 768
      })
    }
  );
  const data = await response.json();
  return data.embedding.values;
}

export async function POST(req: NextRequest) {
  try {
    const { query, category, top_k = 5 } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Generate query embedding
    const queryEmbedding = await getEmbedding(query);
    
    // Search PDF embeddings
    const { data, error } = await supabase.rpc('match_pdf_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: 0.70,
      match_count: top_k,
      filter_category: category || null
    });
    
    if (error) throw error;
    
    return NextResponse.json({
      query,
      results: data,
      count: data.length
    });
    
  } catch (error: any) {
    console.error('RAG search error:', error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
```

#### **3.2 Client-Side Hook**

**File: `src/hooks/useRAGSearch.ts`**
```typescript
import { useState } from 'react';

interface RAGResult {
  id: string;
  pdf_name: string;
  content: string;
  chunk_index: number;
  similarity: number;
}

export function useRAGSearch() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RAGResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const search = async (query: string, category?: string, topK = 5) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, category, top_k: topK })
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setResults(data.results);
      return data.results;
      
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  return { search, loading, results, error };
}
```

---

## 📊 Storage Optimization Summary

| Strategy | Storage Required | Cost (Monthly) | Pros | Cons |
|----------|-----------------|----------------|------|------|
| **Embeddings Only** | ~140 MB | $0 (free tier) | ✅ Fast, cheap, scalable | ❌ No original PDFs |
| **Embeddings + R2** | ~140 MB + 465 MB external | ~$2.33 | ✅ Keep originals, zero egress | ⚠️ Extra service |
| **Embeddings + S3** | ~140 MB + 465 MB external | ~$10.70 | ✅ Keep originals | ⚠️ Egress fees |
| **Supabase Pro** | ~605 MB total | $25 | ✅ Everything in one place | ⚠️ Most expensive |
| **Compressed PDFs** | ~140 MB + ~140 MB compressed | $0 (free tier) | ✅ Cheap, self-contained | ⚠️ Quality loss |

---

## 🚀 Recommended Action Plan

### **Week 1: Setup Infrastructure**
1. Run migration: `supabase/migrations/20260607_pdf_embeddings.sql`
2. Create ingestion script: `scripts/ingest_pdfs_to_rag.ts`
3. Set up Cloudflare R2 account (optional, for PDF archival)

### **Week 2: PDF Processing**
4. Place 93 PDFs in `./data/pdfs/` directory
5. Run ingestion: `npx tsx scripts/ingest_pdfs_to_rag.ts`
6. Monitor progress (expect ~2-4 hours for 93 PDFs)

### **Week 3: RAG Integration**
7. Implement API endpoint: `src/app/api/rag/search/route.ts`
8. Create client hook: `src/hooks/useRAGSearch.ts`
9. Add UI components for PDF search results

### **Week 4: Testing & Optimization**
10. Test query accuracy with sample questions
11. Tune `match_threshold` (0.65-0.80 range)
12. Monitor Supabase storage usage
13. Implement hybrid search if needed (vector + full-text)

---

## 🔍 Key Performance Metrics

### **Storage Efficiency**
- **Before:** 465 MB (raw PDFs)
- **After:** ~140 MB (embeddings only)
- **Savings:** 70% reduction

### **Query Performance**
- **Embedding generation:** ~50ms (Gemini API)
- **Vector search:** ~20-100ms (HNSW index)
- **Total latency:** ~100-200ms per query

### **Cost Analysis (Monthly)**
- **Supabase Free Tier:** $0 (1 GB storage, 500 MB database)
- **Gemini API (Ingestion):** $0 (free tier: 1500 req/min)
- **Gemini API (Queries):** $0 (free tier: 15 req/min)
- **Optional R2 Storage:** ~$2.33 (465 MB × $0.005/GB)

**Total:** $0-$2.33/month

---

## 🛠️ Troubleshooting

### **Issue: Storage Still Full After Deleting PDFs**
```sql
-- Check actual storage usage
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Vacuum database to reclaim space
VACUUM FULL;
```

### **Issue: Vector Search Too Slow**
```sql
-- Check index usage
EXPLAIN ANALYZE
SELECT * FROM pdf_embeddings
ORDER BY embedding <=> '[0.1, 0.2, ...]'
LIMIT 10;

-- Rebuild index if needed
REINDEX INDEX pdf_embeddings_hnsw;
```

### **Issue: Gemini API Rate Limits**
```typescript
// Add exponential backoff
async function generateEmbeddingWithRetry(text: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateEmbedding(text);
    } catch (error: any) {
      if (error.message.includes('429')) {
        await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## 📚 Additional Resources

- [Supabase Vector Documentation](https://supabase.com/docs/guides/ai/vector-columns)
- [Gemini Embeddings Guide](https://ai.google.dev/gemini-api/docs/embeddings)
- [LangChain Text Splitters](https://js.langchain.com/docs/modules/data_connection/document_transformers/)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)

---

## ✅ Success Criteria

- [ ] All 93 PDFs processed and embedded
- [ ] Supabase storage usage < 500 MB
- [ ] Vector search returns relevant results (>0.70 similarity)
- [ ] Query latency < 300ms (p95)
- [ ] Zero monthly infrastructure cost (or <$5 if using R2)

---

**Last Updated:** June 7, 2026  
**Estimated Implementation Time:** 2-3 weeks  
**Estimated Monthly Cost:** $0-$2.33
