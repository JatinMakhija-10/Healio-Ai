# Healio.AI — RAG + LLM Retrieval Engine: Complete Teaching Guide

> **Goal:** Explain how Healio figures out what remedies to suggest — in plain English.  
> **Audience:** Anyone. No coding background needed.

---

## Table of Contents

1. [The Big Picture — What is RAG?](#1-the-big-picture--what-is-rag)
2. [The Three Knowledge Libraries](#2-the-three-knowledge-libraries)
3. [How "Understanding" Works — Embeddings Explained](#3-how-understanding-works--embeddings-explained)
4. [The Database — Where Knowledge is Stored](#4-the-database--where-knowledge-is-stored)
5. [The Search Function — How Healio Finds Relevant Info](#5-the-search-function--how-healio-finds-relevant-info)
6. [The Full Journey — Step by Step](#6-the-full-journey--step-by-step)
7. [Multi-Query RAG — Casting a Wider Net](#7-multi-query-rag--casting-a-wider-net)
8. [The LLM — The Doctor Brain](#8-the-llm--the-doctor-brain)
9. [The Cache — Healio's Short-Term Memory](#9-the-cache--healios-short-term-memory)
10. [Similarity Scores — How Sure is Healio?](#10-similarity-scores--how-sure-is-healio)
11. [Fallback Chain — What if Something Breaks?](#11-fallback-chain--what-if-something-breaks)
12. [Key Numbers at a Glance](#12-key-numbers-at-a-glance)
13. [Q&A — Every Common Question Answered](#13-qa--every-common-question-answered)

---

## 1. The Big Picture — What is RAG?

**RAG** stands for **Retrieval-Augmented Generation**.

Imagine you asked a doctor a question. There are two types of doctors:

| Type | How they answer |
|------|----------------|
| **Plain LLM (no RAG)** | Answers entirely from what they memorized in medical school. Good, but can hallucinate, be outdated, or miss specific regional remedies. |
| **RAG-powered (Healio)** | Before answering, quickly looks up the most relevant pages from a medical textbook, then gives you an answer based on both their knowledge AND those pages. |

Healio uses RAG so that **every response is grounded in actual medical/Ayurvedic/homeopathic source texts**, not just guessed from training data.

**In one sentence:** User describes symptoms → Healio searches its medical libraries → injects the most relevant passages into the AI's context → AI answers using those real sources.

---

## 2. The Three Knowledge Libraries

Healio has **three separate knowledge libraries** stored in its database:

### Library A — Boericke's Materia Medica (Homeopathic)
- **What it is:** The most authoritative homeopathic reference book ever written (by Dr. William Boericke).
- **What's stored:** 637 text chunks — each chunk describes a homeopathic remedy, its indications, symptoms it treats, and characteristic signs.
- **Example entry:** "Belladonna — throbbing headache worse on right side, face flushed, pupils dilated, sudden onset..."
- **File in DB:** `boericke_embeddings` table.

### Library B — Ayurvedic Classical Texts
- **What it is:** Formal Ayurvedic medical knowledge from Planet Ayurveda books, CCRAS (Central Council for Research in Ayurvedic Sciences) e-books, and classical Sanskrit texts.
- **What's stored:** ~26,000 text chunks — herbs, formulations (like Triphala, Ashwagandha, Sitopaladi Churna), decoctions, and their therapeutic uses.
- **Important:** These are pharmacy-grade Ayurvedic medicines — NOT kitchen items.
- **File in DB:** `ayurvedic_knowledge_embeddings` table.

### Library C — Dadi-Nani ke Nuskhe (Home Remedies)
- **What it is:** 1,051 traditional Indian household remedies — the wisdom of grandmothers.
- **What's stored:** Kitchen-shelf ingredients: haldi (turmeric), adrak (ginger), tulsi, shahad (honey), nimbu (lemon), ajwain, jeera, pudina, lahsun.
- **Important:** These require NO pharmacy. You already have these at home.
- **File in DB:** `home_remedy_embeddings` table.
- **Source file:** `nuskhe.json`.

### Bonus — Clinical Cases Database
- **What it is:** Real (de-identified) patient case records from four medical research datasets.
- **Sources:** PMC-Patients (167k cases), MIMIC-IV Demo (100 EHR records), CUPCase (3,562 BMC cases), MultiCaRe (96k cases from PubMed).
- **Used by:** The `PatientSimilarityEngine` — finds real patient histories that match what the current user is describing.
- **File in DB:** `clinical_cases` table.

---

## 3. How "Understanding" Works — Embeddings Explained

### The Problem
A computer doesn't understand language. It can't know that "throbbing head pain" and "migraine" are related unless you tell it explicitly.

### The Solution: Embeddings
An **embedding** is a list of numbers (a vector) that represents the *meaning* of a piece of text. Two texts with similar meaning will have vectors that point in similar directions in mathematical space.

Think of it like GPS coordinates, but for meaning:
- "headache on the right side" → `[0.23, -0.11, 0.87, ...]` (3072 numbers)
- "migraine with aura" → `[0.21, -0.09, 0.85, ...]` (very similar numbers!)
- "broken leg" → `[-0.45, 0.67, -0.12, ...]` (very different numbers)

### Healio's Embedding Models
Healio uses **Google Gemini** to generate embeddings. Two different models are used for different libraries:

| Model | Dimensions | Used for |
|-------|-----------|---------|
| `gemini-embedding-2-preview` | 3072 numbers | Boericke (homeopathic) + Ayurvedic + Conditions search |
| `gemini-embedding-001` | 3072 numbers | Home Remedies (must match the model used when ingesting data) |

> **Why does the model have to match?** When the database was built, each knowledge chunk was converted to numbers using a specific model. When searching, you must use the same model — otherwise the "number language" won't match and you'll get garbage results.

### Timeout Protection
Both embedding calls have hard timeouts:
- Main embedding: **8 seconds** max (`embed-768-timeout` internal label)
- Home remedy embedding: **3 seconds** max (`embed-3072-timeout`)

If Gemini is slow, these timeouts prevent the entire consultation from hanging.

---

## 4. The Database — Where Knowledge is Stored

Healio uses **Supabase** (a cloud database) with the **pgvector** extension.

### What is pgvector?
pgvector is a plugin for PostgreSQL (the database) that lets you store vectors (lists of numbers) and search for the *closest* ones. Think of it as adding GPS-distance-search capability to a regular database.

### The Tables

#### `boericke_embeddings`
```
id          — auto-generated number
remedy_name — e.g. "Belladonna"
chunk_text  — the actual text passage from the book
embedding   — vector(3072) — 3072 numbers representing this chunk's meaning
```
- 637 rows
- No index needed — sequential scan on 637 rows is instant

#### `ayurvedic_knowledge_embeddings`
```
id        — auto-generated number
source    — book name
book      — e.g. "Charaka Samhita"
category  — e.g. "respiratory"
section   — e.g. "Shwas Roga (Respiratory Disorders)"
text      — the actual text passage
embedding — vector(3072) — with halfvec HNSW index for fast search
```
- ~26,000 rows
- Has a **HNSW index** (see below) because 26K rows is too many to scan one by one

#### `home_remedy_embeddings`
```
id               — auto-generated number
remedy_name      — e.g. "Haldi Doodh"
remedy_name_hindi — e.g. "हल्दी दूध"
ailment          — e.g. "common cold"
ailment_hindi    — e.g. "सर्दी-जुकाम"
chunk_text       — preparation instructions + benefits
embedding        — vector(3072)
```
- 1,051 rows
- Sequential scan is fast enough

#### `clinical_cases`
```
case_id             — unique ID e.g. "pmc_PMC12345_0"
source              — 'pmc_patients' | 'mimic_demo' | 'cupcase' | 'multicare'
age, age_group      — patient demographics (de-identified)
gender              — male / female / unknown
chief_complaint     — what the patient came in for
presenting_symptoms — array of normalized keywords
diagnosis           — array of final diagnoses
icd_codes           — ICD-10 codes
medications         — what was prescribed
narrative           — full case text (what embeddings are built from)
embedding           — vector(768) — Gemini text-embedding-004
```
- Sourced from 4 public medical datasets
- Has HNSW vector index + GIN indexes on symptom arrays

### What is an HNSW Index?
HNSW stands for **Hierarchical Navigable Small World**. It's a type of index that makes approximate nearest-neighbor search fast for large datasets.

**Analogy:** Imagine finding a specific face in a city of 26,000 people. Without a system, you'd check every face (slow). With HNSW, it's like a structured social network — you jump to the "neighborhood" that looks right, then zoom in. Much faster.

The Ayurvedic table uses a special **halfvec** HNSW index. Since pgvector can only index vectors up to 2,000 dimensions normally, and Ayurvedic vectors are 3,072-dimensional, Healio casts them to `halfvec` (half-precision) before indexing — cutting memory in half while keeping search accurate.

---

## 5. The Search Function — How Healio Finds Relevant Info

### The RPC Functions (Remote Procedure Calls)

Instead of running SQL directly from the app, Healio calls **stored functions** inside the database. These are called RPCs. Each library has one:

#### `match_boericke_embeddings`
```
Input:  query_embedding (3072 numbers), match_threshold (0.72), match_count (10)
Output: id, remedy_name, chunk_text, similarity_score
Logic:  Finds all rows where cosine similarity > 0.72, returns top 10 closest
```

#### `search_ayurvedic_knowledge`
```
Input:  query_embedding (3072 numbers), match_threshold (0.60), match_count (12)
Output: id, source, book, section, text, similarity_score
Logic:  Uses halfvec HNSW index, returns top 12 most semantically similar passages
        Can optionally filter by category or book name
```

#### `match_home_remedy_embeddings`
```
Input:  query_embedding (3072 numbers), match_threshold (0.58), match_count (8)
Output: id, remedy_name, remedy_name_hindi, ailment, ailment_hindi, chunk_text, similarity
Logic:  Sequential scan on 1,051 rows, returns top 8 matches
```

#### `match_conditions` (for initial condition search)
```
Input:  query_embedding, match_threshold (0.5), match_count (50)
Output: condition IDs ranked by similarity
Logic:  First pass — finds which medical conditions are most likely
```

#### `match_clinical_cases`
```
Input:  query_embedding (768 numbers), match_threshold (0.65), match_count (8),
        plus optional filters: age_group, gender, source
Output: Matching patient cases with similarity scores
```

#### `find_cases_by_symptoms`
```
Input:  symptom_keywords (array of words), min_overlap (2), result_limit (8)
Output: Cases where at least 2 of the symptom keywords match
Logic:  Uses GIN index for fast array-overlap search (no embedding needed)
```

### What is Cosine Similarity?
It's a number between 0.0 and 1.0 that measures how similar two vectors are:
- **1.0** = identical meaning
- **0.9+** = nearly the same
- **0.7** = quite related
- **0.5** = somewhat related
- **0.3** = barely related
- **0.0** = completely unrelated

Healio's thresholds by library:
- Boericke: **0.72** (strict — homeopathic matching must be precise)
- Ayurvedic: **0.60** (slightly looser — Ayurvedic language is more descriptive)
- Home Remedies: **0.58** (loosest — folk remedies described in varied ways)
- Conditions: **0.50** (broad net for initial diagnosis pass)

---

## 6. The Full Journey — Step by Step

Here is exactly what happens when you type "I have a severe headache on the right side with nausea and sensitivity to light" into Healio:

### Step 1: Message arrives at `/api/chat`
The user's message hits the chat API. Healio checks:
- Is this a short follow-up message (< 40 characters)? → Skip RAG (saves time)
- Is it the final diagnosis turn? → Always do RAG
- Is it a mid-conversation symptom message? → Do RAG

### Step 2: Two embeddings generated in parallel
```
"severe headache on the right side with nausea and sensitivity to light"
        ↓ (Gemini API call #1 — 8s timeout)              ↓ (Gemini API call #2 — 3s timeout)
  [0.23, -0.11, 0.87, ...]                         [0.19, -0.08, 0.91, ...]
  3072-dim vector                                   3072-dim vector
  → for Boericke + Ayurvedic                       → for Home Remedies
```
Both calls fire **at the same time** (parallel). No waiting for one to finish before starting the other.

### Step 3: Three database searches fire in parallel
With both embeddings ready, three RPCs fire simultaneously:

```
Embedding 1 → match_boericke_embeddings  (threshold 0.72, up to 10 chunks)
Embedding 1 → search_ayurvedic_knowledge (threshold 0.60, up to 12 chunks)
Embedding 2 → match_home_remedy_embeddings (threshold 0.58, up to 8 chunks)
```
All three run at the same time — total wait = slowest of the three, not sum of all three.

### Step 4: Deduplication
Results come back. Some remedies might appear in multiple chunks. Healio keeps only the **highest-scoring chunk per remedy**:
- If Belladonna appears 3 times with similarities 0.81, 0.76, 0.74 → keep only 0.81
- If Ashwagandha appears in 2 Ayurvedic chunks → keep the better match

### Step 5: Context string assembled
Three labeled sections are built:

```
[SECTION A: HOMEOPATHIC — Boericke's Materia Medica]
[1] REMEDY: Belladonna | relevance: 84%
Throbbing headache, right-sided...

[2] REMEDY: Sanguinaria | relevance: 79%
...

[SECTION B: AYURVEDIC CLASSICAL MEDICINE — Planet Ayurveda / CCRAS]
[1] SOURCE: Charaka Samhita | SECTION: Shiroroga | relevance: 71%
...

[SECTION C: DADI-NANI KE NUSKHE — Household Kitchen Remedies]
[1] AILMENT: headache (सिरदर्द) | NUSKHA: Adrak Chai | relevance: 63%
...
```

### Step 6: Context injected into LLM prompt
The assembled context + the system prompt (Healio's doctor persona) + the conversation history are combined into a single prompt for the LLM:

```
=== KNOWLEDGE BASE START ===
[Section A]...
[Section B]...
[Section C]...
=== END OF KNOWLEDGE BASE ===

[ROLE IDENTITY]
You are Healio — a senior holistic physician...
```

### Step 7: LLM generates the answer
The LLM receives the full prompt and generates a streaming response. The RAG context anchors the answer — the AI can't suggest a remedy that isn't supported by the retrieved passages.

---

## 7. Multi-Query RAG — Casting a Wider Net

For the `/api/diagnose` route (structured diagnosis endpoint), Healio uses **Multi-Query RAG**.

### The Problem with Single-Query RAG
If the user says "my head hurts really bad on the right", the embedding captures the symptom description but might miss remedy-specific passages that use more formal language.

### The Solution: Two Queries
Healio builds **two queries simultaneously**:

1. **Raw symptom text:** `"severe headache on the right side with nausea and sensitivity to light"`
2. **Condition-specific query:** `"Migraine headache light sensitivity homeopathy remedy symptoms indications"`

Both are embedded → both search the Boericke and Ayurvedic databases → results are merged and deduplicated.

### Why This Works Better
- Query 1 matches chunks that describe symptoms in plain language
- Query 2 matches chunks that use medical/homeopathic terminology
- Together they retrieve more relevant information than either alone

### The `/api/rag/multi-query` Endpoint
There is a dedicated API endpoint for this:
```
POST /api/rag/multi-query
Body: {
  "queries": ["symptom text", "condition + keywords query"],
  "matchCount": 3,
  "matchThreshold": 0.65
}
Response: {
  "combinedContext": "=== BOERICKE MATERIA MEDICA ===...",
  "remediesFound": ["Belladonna", "Sanguinaria", "Iris Versicolor"],
  "chunkCount": 7,
  "queriesProcessed": 2
}
```

---

## 8. The LLM — The Doctor Brain

### What LLM Does Healio Use?

Healio runs on a **two-model system** with automatic fallback:

| Role | Model | Provider | When used |
|------|-------|----------|-----------|
| Fast Q&A | `llama-3.1-8b-instant` | Groq | Mid-conversation clarifying questions |
| Full Diagnosis | `llama-3.3-70b-versatile` | Groq | Final diagnosis turn (larger, smarter model) |
| Fallback | `gemini-2.5-flash` | Google | If Groq is down or returns an error |

### Why Two Groq Models?
- **8B model** (8 billion parameters) → faster, cheaper, good for "does this feel like a stomach ache or chest pain?" type questions
- **70B model** (70 billion parameters) → slower, more capable, used only when generating the final diagnosis JSON with remedies, dosages, red flags — where precision matters most

### The Temperature Setting
Healio uses `temperature: 0.15` — extremely low.

Temperature controls how "creative" or "random" the AI is:
- `0.0` = completely deterministic (same input → same output every time)
- `0.5` = somewhat creative
- `1.0` = very creative / unpredictable

**0.15 is near-deterministic on purpose.** Medical advice should NOT be creative or unpredictable. Healio wants consistent, clinically grounded answers.

### The System Prompt
Every conversation starts with Healio's persona injected as a system prompt:
> "You are Healio — a senior holistic physician with deep expertise in homeopathy, Ayurveda, and integrative medicine. You speak with clinical authority and deep human warmth, like a trusted family doctor who has studied classical medicine for 30 years. Never break this persona."

When RAG context is available, it's injected **before** this system prompt so it carries maximum weight in the model's attention.

### Retry + Fallback Logic
- Groq gets **1 retry** before fallback
- Retry wait: **1 second** (doubles to 2s on rate-limit 429 errors)
- Total timeout: **30 seconds**
- If Groq fails after retry → automatic switch to Gemini 2.5 Flash

---

## 9. The Cache — Healio's Short-Term Memory

### Why Cache?
Generating embeddings + querying the database takes 500ms–2s. If two users describe the same symptoms within minutes of each other, it's wasteful to repeat all that work.

### The RAG Cache (`ragCache.ts`)

| Property | Value |
|----------|-------|
| Storage | In-memory JavaScript `Map` |
| Lifetime | Survives server restarts via serverless warm re-use |
| TTL (Time-to-Live) | **5 minutes** — entries expire after 5 min |
| Max entries | **200** — oldest entry evicted when full |
| Key format | `conditionName::symptomText[first 120 chars]` (lowercase, normalized) |

### The Chat-Level RAG Cache
The `/api/chat` route has its own separate RAG cache:
- Key: SHA-style hash of `symptomSummary + skipHomeRemedies flag`
- Max entries: **50**
- TTL: **5 minutes**

### How Eviction Works
When the cache hits 200 entries, Healio removes the **oldest entry** (JavaScript Map preserves insertion order, so the first key inserted is the first to be evicted — FIFO policy).

### What Gets Cached
```
{
  context: "[SECTION A]... [SECTION B]... [SECTION C]...",
  remediesFound: ["Belladonna", "Sanguinaria"],
  ts: 1716141234567  // timestamp when stored
}
```

### Cache Hit in Logs
When a cache hit occurs, you'll see in server logs:
```
[RAG] Cache HIT — skipping embed + RPC cycle
```
This means: zero embedding API calls + zero database queries for that request.

---

## 10. Similarity Scores — How Sure is Healio?

Every chunk retrieved from the database comes with a **similarity score**. This is displayed to the LLM in the context:

```
[1] REMEDY: Belladonna | relevance: 84%
[2] REMEDY: Sanguinaria | relevance: 79%
[3] REMEDY: Iris Versicolor | relevance: 73%
```

The LLM is instructed to use these relevance numbers to weigh how strongly to recommend each remedy.

### What the Scores Mean Practically

| Score | What it means |
|-------|--------------|
| 90%+ | Near-perfect match — this remedy is a very strong candidate |
| 80–89% | Strong match — highly relevant |
| 72–79% | Good match — relevant but with some uncertainty |
| 65–71% | Borderline — included but LLM should use cautiously |
| < 65% | Filtered out — never shown to LLM |

### Why Different Thresholds for Different Libraries?

- **Boericke (0.72):** Homeopathic matching is highly specific — the "constitutional picture" must closely match. Loose matches here would lead to wrong remedies.
- **Ayurvedic (0.60):** Ayurvedic texts describe conditions in poetic, elaborate language. The same condition might be described very differently across texts — so a wider net is needed.
- **Home Remedies (0.58):** Folk remedies are described casually ("ginger tea for stomach problems") — even semantically distant descriptions might be genuinely useful. Wider net = more useful suggestions.

---

## 11. Fallback Chain — What if Something Breaks?

Healio is designed so that **no single failure kills the response**. Every stage has a graceful fallback:

```
User submits symptoms
        ↓
Try generate embeddings (Gemini)
   ✅ Success → proceed to RAG
   ❌ Timeout/error → return empty context, proceed without RAG
        ↓
Try match_boericke_embeddings
   ✅ Success → add Section A to context
   ❌ DB error → Section A = empty string (not shown to LLM)
        ↓
Try search_ayurvedic_knowledge
   ✅ Success → add Section B to context
   ❌ DB error → Section B = empty string
        ↓
Try match_home_remedy_embeddings
   ✅ Success → add Section C to context
   ❌ DB error → Section C = empty string
        ↓
Build prompt (with whatever context survived)
        ↓
Try Groq (llama-3.3-70b or llama-3.1-8b)
   ✅ Success → stream response to user
   ❌ Fail → retry once after 1s
   ❌ Fail again → switch to Gemini 2.5 Flash
        ↓
Try Gemini 2.5 Flash
   ✅ Success → stream response to user
   ❌ Fail → return error to user
```

For the `/api/diagnose` route, there's also a **single-query fallback** if multi-query RAG fails:
```
Multi-query RAG fails
        ↓
Single-query RAG (just the raw symptom text)
   ✅ Some results → use them
   ❌ No results → return empty context
```

---

## 12. Key Numbers at a Glance

| Item | Value |
|------|-------|
| Boericke chunks | 637 rows |
| Ayurvedic chunks | ~26,000 rows |
| Home remedy chunks | 1,051 rows |
| Clinical cases | 367k+ records (4 datasets) |
| Embedding dimensions (main) | 3,072 |
| Embedding model (main) | `gemini-embedding-2-preview` |
| Embedding model (home remedy) | `gemini-embedding-001` |
| Boericke similarity threshold | 0.72 |
| Ayurvedic similarity threshold | 0.60 |
| Home remedy similarity threshold | 0.58 |
| Max chunks in final context | 7 (Boericke) + 6 (Ayurvedic) + 5 (Home) |
| RAG cache TTL | 5 minutes |
| RAG cache max size | 200 entries |
| Chat RAG cache max size | 50 entries |
| Embedding timeout | 8s (main), 3s (home remedy) |
| LLM temperature | 0.15 |
| LLM primary (fast Q&A) | `llama-3.1-8b-instant` via Groq |
| LLM primary (full diagnosis) | `llama-3.3-70b-versatile` via Groq |
| LLM fallback | `gemini-2.5-flash` |
| LLM max tokens output | 1,500 (Q&A) / 2,000 (final diagnosis) |
| LLM total timeout | 30 seconds |
| LLM retries | 1 |

---

## 13. Q&A — Every Common Question Answered

---

**Q: What is RAG and why does Healio use it?**

RAG is a technique where the AI looks up relevant information from a database BEFORE answering. Healio uses it because a generic AI doesn't have Boericke's Materia Medica or traditional Indian nuskhe memorized with precision. By fetching exact text passages and feeding them to the AI, every answer is grounded in real medical sources.

---

**Q: Where does Healio's medical knowledge come from?**

Three sources:
1. **Boericke's Materia Medica** — the gold standard homeopathic reference (637 indexed passages)
2. **Ayurvedic classical texts** — Planet Ayurveda, CCRAS, Sanskrit texts (~26,000 passages)
3. **Traditional home remedies (nuskhe.json)** — 1,051 folk remedies from Indian household tradition

---

**Q: What is an embedding and why does it need to be the same model for search?**

An embedding is a list of 3,072 numbers that represents the "meaning" of a text. The numbers are generated by a specific AI model. If you store data using Model A (which generates numbers in a certain number-space) and then search using Model B (which uses a different number-space), the comparisons are meaningless — like comparing temperatures in Celsius vs Fahrenheit without converting. That's why `gemini-embedding-001` is used for home remedies (because that's what was used when building the database) and `gemini-embedding-2-preview` for Boericke/Ayurvedic.

---

**Q: How does Healio decide which remedies are relevant?**

It uses **cosine similarity** — a math formula that measures the angle between two vectors (lists of numbers). The closer the angle to 0°, the more similar the meanings. Healio filters out anything below a similarity threshold (0.58–0.72 depending on the library) to avoid suggesting irrelevant remedies.

---

**Q: What is the HNSW index and why does only the Ayurvedic table have it?**

HNSW (Hierarchical Navigable Small World) is a fast search algorithm for large vector databases. With 637 rows (Boericke) or 1,051 rows (Home Remedies), a simple full-table scan takes milliseconds — no index needed. But with 26,000 Ayurvedic rows, a full scan takes 8+ seconds (too slow). The HNSW index lets Healio find the nearest neighbors in milliseconds even with 26,000 rows.

---

**Q: What's the difference between Section A (Homeopathic), Section B (Ayurvedic), and Section C (Home Remedies)?**

- **Section A:** Formal homeopathic medicines (Belladonna, Nux Vomica, etc.) — need to be purchased from a homeopathic pharmacy.
- **Section B:** Formal Ayurvedic formulations (Triphala, Sitopaladi, Ashwagandha capsules) — need to be purchased from an Ayurvedic pharmacy.
- **Section C:** Kitchen-shelf items (turmeric milk, ginger tea, honey-lemon water) — available in any Indian household right now.

The AI is explicitly told in its prompt which section maps to which output field, so it never mixes them up.

---

**Q: Why does Healio use two different LLMs (8B and 70B)?**

Speed vs. quality tradeoff:
- During a conversation (asking follow-up questions), the **8B model** (llama-3.1-8b-instant) responds in under 1 second. It's fast and cheap — perfect for "where exactly is the pain?" type questions.
- When generating the final diagnosis (with remedy names, dosages, red flags, confidence scores), the **70B model** (llama-3.3-70b-versatile) takes 2–5 seconds but is significantly smarter and more accurate for complex medical reasoning.

---

**Q: What does "temperature 0.15" mean?**

Temperature controls how random/creative the AI is. At 0.15 (nearly 0), the AI always picks the most statistically likely next word — very deterministic. This is intentional: you want medical advice to be consistent, not random. The AI won't "get creative" and invent treatments.

---

**Q: How does the cache work? What if my symptoms are unique?**

The cache stores RAG results for 5 minutes, keyed by the condition name + first 120 characters of symptom text. If your exact symptom description was recently searched, you get a near-instant response. If your symptoms are unique, the cache misses and the full embedding + database search runs fresh. The cache only stores results — it never affects the quality of the response.

---

**Q: What happens if the Gemini embedding API is down?**

The embedding call has a timeout (8 seconds). If it fails, `generateEmbedding()` returns `null`. The `fetchAllContext()` function checks for null and returns an empty context string. The LLM still answers — just without the RAG knowledge base. The answer will be based on the LLM's training data only (still useful, just less precisely grounded).

---

**Q: What happens if Groq (the LLM API) goes down?**

The system tries Groq once, waits 1 second, tries once more. If both attempts fail, it automatically falls back to **Gemini 2.5 Flash** (Google's model). The user won't notice — the response just comes from a different model. If Gemini also fails, the user gets an error message.

---

**Q: Can Healio suggest the wrong remedy?**

Yes, it's possible. RAG reduces hallucinations but doesn't eliminate them. Reasons a wrong suggestion could happen:
1. The similarity score was borderline (e.g. 0.73) and the chunk was tangentially related
2. The LLM creatively combined valid chunks in an invalid way
3. The user's symptom description was ambiguous

This is why Healio always includes red flags ("seek immediate care if...") and recommends consulting a real doctor for serious conditions.

---

**Q: Why is the Ayurvedic similarity threshold (0.60) lower than Boericke (0.72)?**

Ayurvedic texts were written in Sanskrit or formal Hindi and translated — the language is often poetic and descriptive ("Kapha-aggravating disorders of the chest"). The same condition might be described in dozens of different ways across 26,000 chunks. Setting a strict threshold would miss many genuinely relevant passages. Homeopathic text (Boericke) is more standardized and clinical — strict matching is more reliable there.

---

**Q: What is Multi-Query RAG and when does it kick in?**

Multi-Query RAG is used in the `/api/diagnose` structured diagnosis flow. Instead of one database search with the raw symptom text, Healio generates two queries:
1. The raw symptom description
2. A formatted medical query: "Migraine headache light sensitivity homeopathy remedy symptoms"

Both queries search the database independently, then results are merged. This catches more relevant passages — especially remedy-specific passages that use clinical terminology the user wouldn't use themselves.

---

**Q: What are the 4 clinical case databases and why are they used?**

- **PMC-Patients:** 167,000 cases from published medical papers in PubMed Central
- **MIMIC-IV Demo:** 100 real ICU/hospital records from MIT's public dataset
- **CUPCase:** 3,562 unusual/rare case reports from BMC Open Access journals
- **MultiCaRe:** 96,000 cases from multiple PubMed Central collections

These are used by the `PatientSimilarityEngine` — when you describe symptoms, Healio finds real historical patient cases with similar presentations and uses them to validate or strengthen the diagnosis. "A 35-year-old with similar symptoms was diagnosed with X in 45 similar historical cases."

---

**Q: Why are the home remedy results shown in both English and Hindi?**

Because the source data (`nuskhe.json`) contains both. The `ailment_hindi` and `remedy_name_hindi` fields are returned by the `match_home_remedy_embeddings` RPC and displayed in the context so the AI can reference them in the appropriate language based on what language the user is speaking in.

---

*Last updated: May 2026 | Based on codebase at `c:\Users\JATIN\Desktop\Healio.AI`*
