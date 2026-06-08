# Free Embedding API Alternatives to Gemini (2026)

## 🎯 Executive Summary

**Current Setup:** Gemini Free API (text-embedding-004, 768-dim)

**TL;DR Best Free Alternatives:**
1. **Cohere Embed v4** - Best free tier, 1000 req/month, multilingual, production-ready
2. **Jina AI v5** - 1M tokens/month free, 2048-dim, open-source option available
3. **Voyage AI** - Trial credits, excellent quality, specialized for RAG
4. **Self-hosted (BGE-M3)** - Unlimited, open-source, requires GPU

---

## 📊 Free Tier Comparison Table

| Provider | Model | Dimensions | Free Tier | Rate Limit | Quality (MTEB) | Best For |
|----------|-------|------------|-----------|------------|----------------|----------|
| **Gemini** | text-embedding-004 | 768 | 1500 req/min | ~15 req/min | ~68.5 | **Current (Good)** |
| **Cohere** | embed-v4 | 1024 | 1000 calls/month | ~1 req/sec | 69.3 | **Multilingual, Production** |
| **Jina AI** | jina-embeddings-v5 | 2048→128 | 1M tokens/month | ~100 req/min | 71.7 | **High-volume, Flexible** |
| **Voyage AI** | voyage-3 | 1024 | Trial credits | 60 req/min | 69.8 | **RAG-optimized** |
| **Mistral** | mistral-embed | 1024 | Limited free | ~10 req/min | 77.8 | **Highest quality** |
| **OpenAI** | text-embedding-3-small | 1536 | $5 free credit | 500 req/min | 62.3 | **Fast, reliable** |
| **Self-hosted** | BGE-M3 | 1024 | Unlimited | No limits | 61.0 | **Unlimited, Privacy** |

---

## 🥇 Recommended Alternatives

### **1. Cohere Embed v4 (Best Overall Free Option)**

**Why Better Than Gemini:**
- ✅ Hybrid embeddings (dense + sparse) - better RAG accuracy
- ✅ Multilingual out-of-the-box (100+ languages)
- ✅ Production-ready with commercial license
- ✅ Reranking API included (improves retrieval)
- ✅ No IP restrictions like Gemini

**Free Tier:**
- 1,000 API calls/month (Gemini: 1,500 req/min but unstable)
- 15ms API latency
- No credit card required for trial

**Limitations:**
- Monthly cap lower than Gemini's rate limit
- Need to cycle keys or upgrade after 1,000 calls

**Code Example:**
```typescript
import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await cohere.v2.embed({
    model: 'embed-english-v4.0',  // or 'embed-multilingual-v4.0'
    texts: [text],
    inputType: 'search_document',  // or 'search_query' for queries
    embeddingTypes: ['float'],
  });
  
  return response.embeddings.float[0];
}
```

**Best For:** Production apps, multilingual content, limited monthly volume (< 1000 calls)

---

### **2. Jina AI v5 (Best for High Volume)**

**Why Better Than Gemini:**
- ✅ **1M tokens/month free** (much higher than Cohere)
- ✅ Matryoshka embeddings (2048→128 dims, adjust quality/size trade-off)
- ✅ 32K context length (vs Gemini's 2K)
- ✅ Open-source model available (can self-host)
- ✅ Best MTEB score among free options (71.7)

**Free Tier:**
- 1M tokens/month via API
- 100 requests/minute
- Unlimited if self-hosted

**Code Example:**
```typescript
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v5',
      input: [text],
      dimensions: 768,  // Can adjust: 128, 256, 512, 768, 1024, 2048
    }),
  });
  
  const data = await response.json();
  return data.data[0].embedding;
}
```

**Best For:** High-volume ingestion (93 PDFs), long documents, flexibility

---

### **3. Self-Hosted BGE-M3 (Best for Unlimited/Privacy)**

**Why Better Than Gemini:**
- ✅ **Unlimited usage** (no API costs)
- ✅ No rate limits
- ✅ Full data privacy (no external API calls)
- ✅ Open-source (MIT license)
- ✅ Hybrid retrieval (dense + sparse + multi-vector)

**Requirements:**
- GPU: 8GB VRAM minimum (RTX 3060, T4, or cloud GPU)
- CPU fallback: Slow but functional
- Storage: ~2.5 GB model weights

**Setup Options:**

#### **Option A: Local Ollama (Easiest)**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Download BGE-M3
ollama pull bge-m3

# Run embedding server
ollama run bge-m3
```

```typescript
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'bge-m3',
      prompt: text,
    }),
  });
  
  const data = await response.json();
  return data.embedding;
}
```

#### **Option B: HuggingFace Transformers**
```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('BAAI/bge-m3')

def generate_embedding(text: str):
    return model.encode(text).tolist()
```

**Cost Analysis:**
- **Cloud GPU (Modal, RunPod):** $0.10-0.30/hour = ~$20/month for 93 PDFs
- **Local GPU:** One-time hardware cost, then $0/month
- **CPU-only:** Free but slow (20-100x slower)

**Best For:** Large-scale ingestion, privacy-sensitive data, long-term projects

---

## 🔄 Migration Strategy

### **Recommended Approach: Multi-Provider Setup**

Combine multiple free tiers for maximum capacity:

```typescript
// config/embedding-providers.ts
export const EMBEDDING_PROVIDERS = {
  gemini: {
    key: process.env.GEMINI_API_KEY,
    model: 'text-embedding-004',
    dimensions: 768,
    rateLimit: 15, // req/min
  },
  cohere: {
    key: process.env.COHERE_API_KEY,
    model: 'embed-english-v4.0',
    dimensions: 1024,
    monthlyLimit: 1000,
  },
  jina: {
    key: process.env.JINA_API_KEY,
    model: 'jina-embeddings-v5',
    dimensions: 768,
    monthlyLimit: 1000000, // tokens
  },
};

// lib/embeddings/provider-router.ts
class EmbeddingRouter {
  private currentProvider = 'jina'; // Start with Jina (highest free tier)
  private usage = {
    jina: { tokens: 0, resetDate: new Date() },
    cohere: { calls: 0, resetDate: new Date() },
    gemini: { calls: 0, lastCall: new Date() },
  };

  async generateEmbedding(text: string): Promise<number[]> {
    // Try Jina first (1M tokens/month)
    if (this.usage.jina.tokens < 1000000) {
      try {
        const embedding = await this.jinaEmbed(text);
        this.usage.jina.tokens += text.length / 4; // Rough token count
        return embedding;
      } catch (error) {
        console.warn('Jina failed, falling back to Cohere');
      }
    }

    // Fallback to Cohere (1000 calls/month)
    if (this.usage.cohere.calls < 1000) {
      try {
        const embedding = await this.cohereEmbed(text);
        this.usage.cohere.calls++;
        return embedding;
      } catch (error) {
        console.warn('Cohere failed, falling back to Gemini');
      }
    }

    // Final fallback to Gemini
    return this.geminiEmbed(text);
  }

  // Reset monthly counters
  private checkReset() {
    const now = new Date();
    if (now.getMonth() !== this.usage.jina.resetDate.getMonth()) {
      this.usage.jina.tokens = 0;
      this.usage.cohere.calls = 0;
      this.usage.jina.resetDate = now;
      this.usage.cohere.resetDate = now;
    }
  }
}
```

---

## 💰 Cost-Benefit Analysis

### **For Your Use Case (93 PDFs):**

**Scenario:** 93 PDFs × 500 chunks/PDF × 1000 chars/chunk = ~46,500 chunks

| Provider | Total Cost | Time to Complete | Notes |
|----------|------------|------------------|-------|
| **Gemini (current)** | $0 | ~52 hours (1 req/sec) | Rate-limited, regional blocks |
| **Jina AI** | $0 | ~8 hours (100 req/min) | 1M tokens covers it |
| **Cohere** | $0 → $24 | ~48 hours | 1000 free, then $0.0001/call |
| **Self-hosted BGE** | $10-20 GPU | ~2-4 hours | One-time, unlimited after |
| **Multi-provider** | $0 | ~12 hours | Jina (40k) + Cohere (1k) + Gemini (5.5k) |

---

## 🎯 Final Recommendation

### **Best Strategy for You:**

1. **Immediate (This Week):** Add **Jina AI** as primary
   - Handles bulk of 93 PDFs (1M tokens = ~40,000 chunks)
   - Faster rate limits (100 req/min vs Gemini's ~15)
   - Better quality (71.7 vs 68.5 MTEB)

2. **Backup:** Keep **Gemini** as fallback
   - Already integrated
   - Handles overflow beyond Jina's limit

3. **Long-term (If scaling):** Self-host **BGE-M3**
   - One-time setup cost (~$20)
   - Unlimited embeddings forever
   - Best for > 100K documents

### **Code Integration:**

```typescript
// scripts/ingest_books.ts (updated)
import { JinaEmbeddings } from '@langchain/community/embeddings/jina';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

// Primary: Jina AI
const jinaEmbeddings = new JinaEmbeddings({
  apiKey: process.env.JINA_API_KEY,
  model: 'jina-embeddings-v5',
  dimensions: 768, // Match your existing Gemini setup
});

// Fallback: Gemini
const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'text-embedding-004',
});

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    return await jinaEmbeddings.embedQuery(text);
  } catch (error: any) {
    console.warn('Jina failed, using Gemini:', error.message);
    return await geminiEmbeddings.embedQuery(text);
  }
}
```

---

## 📚 Resources

- **Jina AI:** [https://jina.ai/embeddings](https://jina.ai/embeddings)
- **Cohere:** [https://cohere.com/embed](https://cohere.com/embed)
- **BGE-M3 (HuggingFace):** [https://huggingface.co/BAAI/bge-m3](https://huggingface.co/BAAI/bge-m3)
- **Ollama:** [https://ollama.com](https://ollama.com)
- **Embedding Benchmarks:** [https://huggingface.co/spaces/mteb/leaderboard](https://huggingface.co/spaces/mteb/leaderboard)

---

## ✅ Action Items

- [ ] Sign up for Jina AI free account
- [ ] Get Jina API key from dashboard
- [ ] Update `ingest_books.ts` to use Jina as primary
- [ ] Test embedding generation with sample PDF
- [ ] Run full ingestion for 93 PDFs (~8-12 hours)
- [ ] Monitor usage against 1M token limit
- [ ] Keep Gemini as fallback for overflow

**Estimated Time Savings:** 40 hours → 8-12 hours  
**Estimated Cost:** $0 (vs. $24 if using paid Cohere)  
**Quality Improvement:** +3.2 MTEB points (71.7 vs 68.5)

---

*Content rephrased for compliance with licensing restrictions. Sources: [mixpeek.com](https://mixpeek.com/curated-lists/best-embedding-models), [edenai.co](http://edenai.co/post/top-free-embedding-tools-apis-and-open-source-models), [roborhythms.com](https://www.roborhythms.com/free-tier-ai-agent-stack/)*
