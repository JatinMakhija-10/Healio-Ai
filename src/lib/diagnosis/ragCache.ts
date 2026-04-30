/**
 * ragCache.ts — In-memory TTL cache for RAG retrieval results.
 *
 * Lives in module scope, so it survives serverless warm re-use.
 * Identical (or near-identical) symptom queries skip the embed → RPC cycle
 * entirely and return cached context within microseconds.
 *
 * TTL: 5 minutes   Max entries: 200   Key: conditionName + symptom prefix
 */

interface CacheEntry {
    context: string;
    remediesFound: string[];
    ts: number;
}

const RAG_CACHE = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1_000; // 5 minutes
const MAX_ENTRIES = 200;

/**
 * Build a deterministic cache key from the primary diagnosis condition and
 * the first 120 chars of the symptom text.
 */
export function buildRagCacheKey(conditionName: string, symptomText: string): string {
    const normalized = `${conditionName.toLowerCase()}::${symptomText.slice(0, 120).toLowerCase().trim()}`;
    return normalized;
}

/** Returns a cached RAG result if still within TTL, otherwise null. */
export function getCachedRAG(key: string): { context: string; remediesFound: string[] } | null {
    const entry = RAG_CACHE.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > TTL_MS) {
        RAG_CACHE.delete(key);
        return null;
    }
    return { context: entry.context, remediesFound: entry.remediesFound };
}

/** Stores a RAG result in the cache, evicting the oldest entry if at capacity. */
export function setCachedRAG(
    key: string,
    data: { context: string; remediesFound: string[] }
): void {
    if (RAG_CACHE.size >= MAX_ENTRIES) {
        // Evict oldest (Map preserves insertion order)
        const firstKey = RAG_CACHE.keys().next().value;
        if (firstKey) RAG_CACHE.delete(firstKey);
    }
    RAG_CACHE.set(key, { ...data, ts: Date.now() });
}

/** Returns current cache size (for observability/debugging). */
export function getRagCacheStats(): { size: number; maxSize: number; ttlMs: number } {
    return { size: RAG_CACHE.size, maxSize: MAX_ENTRIES, ttlMs: TTL_MS };
}
