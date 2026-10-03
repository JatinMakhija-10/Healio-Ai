/**
 * Healio.AI — Jina AI Key Pool + Embedding Module
 * =================================================
 * Supports a pool of Jina API keys (JINA_API_KEYS env, comma-separated).
 * Keys rotate round-robin. On 429 → exponential backoff. On 403 → evict key.
 * Falls back gracefully to JINA_API_KEY (single key) if pool is not set.
 *
 * Provider → Table mapping (DO NOT MIX — vector space mismatch = garbage):
 *   Jina AI v3/v5 (768-dim) → boericke_embeddings
 *                            → home_remedy_embeddings
 *                            → ayurvedic_knowledge_embeddings (all sources)
 *
 * Sources unified under Jina embeddings:
 *   - Boericke Materia Medica (Homeopathic)
 *   - Home Remedies (Indian nuskhe DB)
 *   - Planet Ayurveda scraped content (diseases, herbs, formulations, remedies)
 *   - Ayurvedic PDFs (Indian Pharmacopoeia, Astanga Hridaya, Materia Medica, etc.)
 *   - WHO ICD-11 MMS 2024-01 disease ontology
 *   - New Sources (Culpeper, Domestic Medicine, First Aid, etc.)
 */

import { getGeminiClient, getGeminiApiKeys, disableGeminiApiKey, AI_PHASE_CONFIG } from '@/lib/ai/config';

// ── Jina Key Pool ─────────────────────────────────────────────────────────────

/** Parse comma-separated key string from environment */
function parseJinaKeys(): string[] {
    const seen = new Set<string>();
    const keys: string[] = [];
    const raw = process.env.JINA_API_KEYS ?? process.env.JINA_API_KEY ?? '';
    for (const rawKey of raw.split(',')) {
        const key = rawKey.trim().replace(/^['"]|['"]$/g, '');
        if (key && !seen.has(key)) {
            seen.add(key);
            keys.push(key);
        }
    }
    return keys;
}

/** Module-level mutable key pool (server runtime — safe) */
let _jinaKeys: string[] = [];
let _disabledJinaKeys = new Set<string>();
let _jinaKeyIndex = 0;

function getJinaPool(): string[] {
    if (_jinaKeys.length === 0) {
        _jinaKeys = parseJinaKeys();
    }
    return _jinaKeys.filter(k => !_disabledJinaKeys.has(k));
}

/** Returns the next Jina key in round-robin order */
export function nextJinaKey(): string {
    const pool = getJinaPool();
    if (pool.length === 0) return '';
    const key = pool[_jinaKeyIndex % pool.length];
    _jinaKeyIndex++;
    return key;
}

/** Permanently evict a bad (403) Jina key from the pool */
export function evictJinaKey(key: string): void {
    if (key) {
        _disabledJinaKeys.add(key);
        console.warn(`[jina-pool] ⚠️ Evicted key ...${key.slice(-8)}. ${getJinaPool().length} keys remaining.`);
    }
}

/** Reset pool state (for testing) */
export function resetJinaPool(): void {
    _jinaKeys = [];
    _disabledJinaKeys = new Set();
    _jinaKeyIndex = 0;
}

// ── Jina Embedding with Retry ─────────────────────────────────────────────────

const JINA_MODEL = 'jina-embeddings-v3';
const JINA_DIMS  = 768;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1500;

/**
 * Generates a Jina v3 768-dim embedding for `text`.
 * Rotates keys on every call, auto-evicts 403s, backs off on 429.
 */
export async function getJinaEmbedding(text: string): Promise<number[]> {
    if (!text?.trim()) return [];

    const pool = getJinaPool();
    if (pool.length === 0) {
        console.warn('[jina] No Jina API keys available. Set JINA_API_KEYS in .env.local');
        return [];
    }

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const apiKey = nextJinaKey();
        if (!apiKey) return [];

        try {
            const response = await fetch('https://api.jina.ai/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: JINA_MODEL,
                    input: [text],
                    dimensions: JINA_DIMS,
                }),
            });

            if (response.status === 403) {
                evictJinaKey(apiKey);
                continue; // try next key immediately
            }

            if (response.status === 429) {
                const wait = RETRY_BASE_MS * Math.pow(2, attempt);
                console.warn(`[jina] 429 rate limit hit on key ...${apiKey.slice(-8)}. Backing off ${wait}ms.`);
                await new Promise(r => setTimeout(r, wait));
                continue;
            }

            if (!response.ok) {
                console.warn(`[jina] API error ${response.status}: ${response.statusText}`);
                return [];
            }

            const data = await response.json();
            return data.data[0].embedding as number[];
        } catch (e) {
            if (attempt === MAX_RETRIES) {
                console.warn('[jina] Embedding request failed after retries:', e);
                return [];
            }
            await new Promise(r => setTimeout(r, RETRY_BASE_MS));
        }
    }
    return [];
}

/**
 * Batch embed multiple texts using the Jina key pool.
 * Returns an array of embeddings in same order as input texts.
 * Each text gets an independent key from the pool (maximises throughput).
 */
export async function batchJinaEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];
    const results = await Promise.allSettled(texts.map(t => getJinaEmbedding(t)));
    return results.map(r => (r.status === 'fulfilled' ? r.value : []));
}

// ── Gemini 768-dim Embeddings ─────────────────────────────────────────────────

/** Generates a Gemini 768-dim embedding (rotates Gemini key pool). */
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

// ── Parallel Embeddings (Query Time) ──────────────────────────────────────────

/**
 * Fires Jina and Gemini-768 embeddings in PARALLEL for a single query text.
 * Use at query time to fan-out across all vector tables simultaneously.
 *
 * @example
 *   const { jina, gemini768 } = await getParallelEmbeddings(text);
 *   // jina      → boericke_embeddings, home_remedy_embeddings, ayurvedic_knowledge_embeddings
 *   // gemini768 → (legacy path only, if any table still uses Gemini)
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

/** Returns status of the current Jina key pool (useful for diagnostics). */
export function getJinaPoolStatus(): { total: number; active: number; disabled: number } {
    const all = parseJinaKeys();
    const active = getJinaPool().length;
    return { total: all.length, active, disabled: all.length - active };
}
