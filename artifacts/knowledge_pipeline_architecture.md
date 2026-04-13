# Healio.AI: The Medical Knowledge Pipeline Architecture

This document maps out the entire lifecycle of how raw, scattered medical intelligence was aggregated, translated, vectorized, and injected into the Healio.AI brain.

## 1. The Raw Sources (Where the data came from)
To build a world-class RAG (Retrieval-Augmented Generation) brain, we pulled data from three distinct avenues:

### A. Your Supplied Master Texts
You provided several massive, foundational Ayurvedic and Homeopathic textbooks. These were the heaviest files in the project and required aggressive parsing:
*   `Materia_Medica.pdf` (Homeopathic foundation)
*   `Bhaishajya_Ratnavali_...pdf` (Multiple volumes)
*   `Bhavprakash_Madhya_Khanda.pdf`
*   `Chikitsa_Sara_Sangraha_Vangasena.pdf`
*   `all_medicine databased.csv` (Your unified 225k+ medicine database)

### B. AI-Discovered Literature (CCRAS)
To supplement your books with modern, government-verified clinical trials, I researched and injected official documents from the **Central Council for Research in Ayurvedic Sciences (CCRAS)**:
*   *Glimpse of North East India*
*   *Nutritional Advocacy Ayurveda*
*   *Ayurveda Focus Research Development*

### C. Live Web Scraping (Planet Ayurveda)
To ensure Healio possessed modern clinical treatment pathways and symptom mapping, we built custom Python web-scrapers (`scripts/scrape_pa_herbs.py`, `scrape_pa_diseases.py`, etc.). These robots crawled the **Planet Ayurveda** website to extract structured data on:
*   Botanical Herbs
*   Modern Disease Correlations
*   Ayurvedic Remedies & Formulations

---

## 2. The Extraction Engine (How it was processed)
Raw PDFs and HTML cannot be searched by an AI easily. We had to break them down into digestible "chunks".

**The Script:** `scripts/extract_books.py` and the scraping scripts.
*   **Standard Text:** We used Python's `PyMuPDF` to rip raw text natively from digital files.
*   **The Problem:** Books like *Materia Medica* were essentially scanned photographs of old paper. Standard parsers saw them as blank images.
*   **The AI OCR Solution:** We integrated **Gemini 2.5 Flash Vision**. The script literally took screenshots of every single page and asked Gemini to translate the ancient visual script back into clean English text.
*   **Output:** Everything was chopped into ~500-character medical paragraphs and saved into **14 local `.jsonl` files** inside `data/ayurveda/processed/` (Totaling exactly **26,828 chunks** of data).

---

## 3. The Vectorization Engine (The Brain Mapping)
Once we had 26,828 lines of medical text, we had to teach the AI what they *meant* mathematically.

**The Script:** `scripts/ingest_books.ts`
*   **The Model:** We used `gemini-embedding-2-preview`. This model takes an English paragraph and converts it into a **768-dimensional mathematical coordinate** (an "Embedding"). 
*   **The Bottleneck:** Extracting 26,000 vectors requires a massive amount of API usage. Google limits free accounts.
*   **The Solution:** You provided **24 separate Gemini API keys** in your `.env.local` file. The TypeScript engine was designed to load all 24 keys into memory. Every time Google blocked one key for hitting a rate limit, the script dynamically hot-swapped to the next key in milliseconds, ensuring continuous uploading without ever stopping.

---

## 4. The Supabase Destination (Where it lives)
All this data culminated in a single, high-performance vector vault.

**The Database:** Supabase Postgres
**The Table:** `ayurvedic_knowledge_embeddings`

This table is the heart of Healio's intelligence. Every row contains:
1.  **`book` / `source`**: Where the text came from.
2.  **`page`**: The exact page number for citations.
3.  **`text`**: The raw medical paragraph.
4.  **`embedding`**: The 768-D mathematical vector representing the *meaning* of the text.

### How it works in real-time today:
When a patient types: *"I have a severe burning throat and nausea"*
1.  `chat/route.ts` converts that symptom into its own 768-D mathematical coordinate.
2.  Supabase performs a **Cosine Similarity Search** in the `ayurvedic_knowledge_embeddings` table.
3.  It instantly finds the closest mathematical matches (which will perfectly pull up your scraped Planet Ayurveda remedies or Materia Medica throat entries).
4.  The Bayesian Engine evaluates the results, and the Groq LLM formats it into a beautiful medical answer.
