/**
 * Healio.AI — Dual-Provider Embedding Module
 * ============================================
 * Each DB table was ingested with a specific provider. Queries MUST use
 * the same provider as ingestion — mixing providers causes vector space
 * mismatch and silently returns garbage similarity scores.
 *
 * Provider → Table mapping:
 *   Jina AI v5 (768-dim) → boericke_embeddings, home_remedy_embeddings
 *   Gemini     (768-dim) → ayurvedic_knowledge_embeddings
 *   OpenAI    (1536-dim) → conditions  (via /api/embeddings route)
 *
 * At query time, Jina and Gemini fire in PARALLEL for maximum speed.
 */

import { getGeminiClient, getGeminiApiKeys, disableGeminiApiKey, AI_PHASE_CONFIG } from '@/lib/ai/config';

// ── Jina AI v5 — for Boericke + Home Remedies ────────────────────────────────
export async function getJinaEmbedding(text: string): Promise<number[]> {
    if (!text) return [];

    const jinaKey = process.env.JINA_API_KEY;
    if (!jinaKey) {
        console.warn('[jina] JINA_API_KEY is not set.');
        return [];
    }

    const response = await fetch('https://api.jina.ai/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jinaKey}`,
        },
        body: JSON.stringify({
            model: 'jina-embeddings-v5',
            input: [text],
            dimensions: 768,
        }),
    });

    if (!response.ok) {
        throw new Error(`Jina API Error: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}

// ── Gemini 768-dim — for Ayurvedic Knowledge Base ────────────────────────────
export async function getGeminiEmbedding768(text: string): Promise<number[] | null> {
    if (!text) return null;
    const keys = getGeminiApiKeys();
    if (!keys.length) return null;

    for (const apiKey of keys) {
        try {
            const ai = getGeminiClient(apiKey);
            const res = await ai.models.embedContent({
                model: AI_PHASE_CONFIG.models.embedding,
                contents: text,
                config: { outputDimensionality: 768 },
            });
            const values = res.embeddings?.[0]?.values ?? [];
            if (values.length > 0) return values;
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            if (/api key not valid|api_key_invalid|invalid api key/i.test(message)) {
                disableGeminiApiKey(apiKey);
            }
        }
    }
    return null;
}

/**
 * Fires Jina and Gemini-768 embeddings in PARALLEL for a single query text.
 * Returns both results simultaneously so callers can fan-out to all DB tables
 * at once without any sequential waiting.
 *
 * Usage:
 *   const [jinaEmb, geminiEmb] = await getParallelEmbeddings(text);
 *   // jinaEmb  → query boericke_embeddings, home_remedy_embeddings
 *   // geminiEmb → query ayurvedic_knowledge_embeddings
 */
export async function getParallelEmbeddings(text: string): Promise<{
    jina: number[] | null;
    gemini768: number[] | null;
}> {
    const [jinaResult, geminiResult] = await Promise.allSettled([
        getJinaEmbedding(text),
        getGeminiEmbedding768(text),
    ]);

    return {
        jina:      jinaResult.status  === 'fulfilled' && jinaResult.value.length  > 0 ? jinaResult.value  : null,
        gemini768: geminiResult.status === 'fulfilled' && geminiResult.value !== null   ? geminiResult.value : null,
    };
}

