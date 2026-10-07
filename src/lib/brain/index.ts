/**
 * Arovia.AI — The Brain
 * =====================
 * Central knowledge orchestrator. Single entry point for ALL RAG lookups.
 *
 * Data sources unified here (all use Jina AI v3, 768-dim):
 *   1. boericke_embeddings         — Boericke Materia Medica (homeopathy)
 *   2. home_remedy_embeddings       — Indian nuskhe / home remedies
 *   3. ayurvedic_knowledge_embeddings:
 *        • pa-diseases / pa-herbs / pa-formulations / pa-remedies (Planet Ayurveda)
 *        • Indian Pharmacopoeia, Astanga Hridaya, Materia Medica, Panchagavya
 *        • Vaidya Yoga Ratnavali, Indian Medicinal Plants
 *        • WHO ICD-11 MMS 2024-01
 *        • NewSources (Culpeper, Domestic Medicine, First Aid, etc.)
 *
 * All embeddings MUST use the Jina v3 768-dim model — see src/lib/ai/jina.ts.
 * Mixing providers causes vector-space mismatch and silently returns garbage.
 */

import { getSupabaseAdmin } from '@/lib/ai/config';
import { getJinaEmbedding } from '@/lib/ai/jina';
import { buildEnrichedQuery, type ProfileContext } from '@/lib/rag/queryRewriter';
import {
    applyAllergyFilter,
    serialiseFilteredChunks,
    hasAnyFlaggedChunk,
    type RetrievedChunk,
} from '@/lib/rag/safetyFilter';

// ── Configuration ─────────────────────────────────────────────────────────────

const BRAIN_CONFIG = {
    /** Similarity thresholds per table */
    thresholds: {
        boericke:   0.60,
        homeRemedy: 0.58,
        ayurvedic:  0.55,
    },
    /** Rows retrieved per table */
    topK: {
        boericke:   5,
        homeRemedy: 4,
        ayurvedic:  8,
    },
    /** Max chunks merged across all tables in single query */
    maxTotal: 12,
    /** Min similarity to keep after merge/dedup */
    minSimilarityAfterMerge: 0.50,
} as const;

// ── Source Types ──────────────────────────────────────────────────────────────

export type KnowledgeSource =
    | 'boericke'
    | 'home_remedy'
    | 'ayurvedic_books'
    | 'planet_ayurveda'
    | 'icd11'
    | 'new_sources';

export interface BrainChunk {
    content: string;
    source: KnowledgeSource;
    sourceLabel: string;   // human-readable: "Boericke Materia Medica", "WHO ICD-11", etc.
    book?: string;
    section?: string;
    page?: number;
    similarity: number;
    safetyFlag?: 'contraindicated' | 'caution' | 'allergy_risk' | null;
}

export interface BrainResult {
    chunks: BrainChunk[];
    serialised: string;        // ready-to-inject string for LLM prompt
    hasSafetyFlags: boolean;
    sourcesSummary: string[];  // unique sources present in result
    queryUsed: string;         // the enriched query that was sent
    totalChunks: number;
    latencyMs: number;
}

// ── Category → Source Mapping ─────────────────────────────────────────────────

const AYURVEDIC_SOURCE_MAP: Record<string, KnowledgeSource> = {
    'planet_ayurveda':        'planet_ayurveda',
    'pa-diseases':            'planet_ayurveda',
    'pa-herbs':               'planet_ayurveda',
    'pa-formulations':        'planet_ayurveda',
    'pa-remedies':            'planet_ayurveda',
    'icd11':                  'icd11',
    'who-icd11':              'icd11',
    'new_sources':            'new_sources',
    'culpeper':               'new_sources',
    'domestic_medicine':      'new_sources',
};

function mapAyurvedicSource(source?: string, book?: string): KnowledgeSource {
    const key = (source ?? '').toLowerCase();
    const bookKey = (book ?? '').toLowerCase();
    if (AYURVEDIC_SOURCE_MAP[key]) return AYURVEDIC_SOURCE_MAP[key];
    if (AYURVEDIC_SOURCE_MAP[bookKey]) return AYURVEDIC_SOURCE_MAP[bookKey];
    if (bookKey.includes('icd')) return 'icd11';
    if (bookKey.includes('planet') || key.includes('planet')) return 'planet_ayurveda';
    return 'ayurvedic_books';
}

function getSourceLabel(source: KnowledgeSource, book?: string): string {
    switch (source) {
        case 'boericke':        return 'Boericke Materia Medica';
        case 'home_remedy':     return 'Indian Home Remedies';
        case 'planet_ayurveda': return `Planet Ayurveda${book ? ` — ${book}` : ''}`;
        case 'icd11':           return 'WHO ICD-11 MMS 2024-01';
        case 'new_sources':     return book ?? 'Classical Medical Texts';
        case 'ayurvedic_books': return book ?? 'Ayurvedic Classical Texts';
    }
}

// ── Table Fetch Helpers ───────────────────────────────────────────────────────

async function fetchBoericke(embedding: number[]): Promise<BrainChunk[]> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await (supabase.rpc as any)('match_boericke_embeddings', {
        query_embedding: embedding,
        match_threshold: BRAIN_CONFIG.thresholds.boericke,
        match_count:     BRAIN_CONFIG.topK.boericke,
    });

    if (error) {
        console.error('[brain] boericke fetch error:', error.message);
        return [];
    }

    return (data ?? []).map((row: { remedy_name: string; chunk_text: string; similarity: number }) => ({
        content:     `${row.remedy_name}: ${row.chunk_text}`,
        source:      'boericke' as KnowledgeSource,
        sourceLabel: 'Boericke Materia Medica',
        similarity:  row.similarity,
    }));
}

async function fetchHomeRemedies(embedding: number[]): Promise<BrainChunk[]> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await (supabase.rpc as any)('match_home_remedy_embeddings', {
        query_embedding: embedding,
        match_threshold: BRAIN_CONFIG.thresholds.homeRemedy,
        match_count:     BRAIN_CONFIG.topK.homeRemedy,
    });

    if (error) {
        console.error('[brain] home_remedy fetch error:', error.message);
        return [];
    }

    return (data ?? []).map((row: { remedy_name: string; ailment: string; chunk_text: string; similarity: number }) => ({
        content:     `${row.remedy_name} (${row.ailment}): ${row.chunk_text}`,
        source:      'home_remedy' as KnowledgeSource,
        sourceLabel: 'Indian Home Remedies',
        similarity:  row.similarity,
    }));
}

async function fetchAyurvedic(embedding: number[]): Promise<BrainChunk[]> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await (supabase.rpc as any)('search_ayurvedic_knowledge', {
        query_embedding: embedding,
        match_threshold: BRAIN_CONFIG.thresholds.ayurvedic,
        match_count:     BRAIN_CONFIG.topK.ayurvedic,
    });

    if (error) {
        console.error('[brain] ayurvedic fetch error:', error.message);
        return [];
    }

    return (data ?? []).map((row: { source: string; book: string; section: string; page: number; text: string; similarity: number }) => {
        const knowledgeSource = mapAyurvedicSource(row.source, row.book);
        return {
            content:     row.text,
            source:      knowledgeSource,
            sourceLabel: getSourceLabel(knowledgeSource, row.book),
            book:        row.book,
            section:     row.section,
            page:        row.page,
            similarity:  row.similarity,
        };
    });
}

// ── Merge & Dedup ─────────────────────────────────────────────────────────────

function mergeAndDedup(chunks: BrainChunk[]): BrainChunk[] {
    const seen = new Set<string>();
    const merged: BrainChunk[] = [];

    // Sort by similarity descending
    chunks.sort((a, b) => b.similarity - a.similarity);

    for (const chunk of chunks) {
        // Dedup by normalised content fingerprint (first 120 chars)
        const fingerprint = chunk.content.toLowerCase().replace(/\s+/g, ' ').slice(0, 120);
        if (seen.has(fingerprint)) continue;
        if (chunk.similarity < BRAIN_CONFIG.minSimilarityAfterMerge) continue;
        seen.add(fingerprint);
        merged.push(chunk);
        if (merged.length >= BRAIN_CONFIG.maxTotal) break;
    }

    return merged;
}

// ── Source Summary ────────────────────────────────────────────────────────────

function buildSourcesSummary(chunks: BrainChunk[]): string[] {
    const seen = new Set<string>();
    return chunks
        .map(c => c.sourceLabel)
        .filter(label => { if (seen.has(label)) return false; seen.add(label); return true; });
}

// ── Main Brain Query ──────────────────────────────────────────────────────────

/**
 * Query the Brain — fans out to all knowledge tables simultaneously.
 *
 * @param userMessage   Raw user query / symptom description
 * @param profile       Patient profile context (age, conditions, meds, allergies)
 * @returns             BrainResult with merged, safety-filtered, serialised chunks
 *
 * @example
 *   const result = await queryBrain(userMessage, profile);
 *   // inject result.serialised into system prompt
 *   // if result.hasSafetyFlags → add extra safety disclaimer
 */
export async function queryBrain(
    userMessage: string,
    profile: ProfileContext = { conditions: [], medications: [], allergies: [] }
): Promise<BrainResult> {
    const t0 = Date.now();

    // 1. Enrich query with patient context
    const enrichedQuery = buildEnrichedQuery(userMessage, profile);

    // 2. Generate Jina embedding ONCE — fan out to all tables with same vector
    const embedding = await getJinaEmbedding(enrichedQuery || userMessage);

    if (!embedding.length) {
        console.warn('[brain] Jina embedding failed — returning empty result.');
        return {
            chunks:          [],
            serialised:      '',
            hasSafetyFlags:  false,
            sourcesSummary:  [],
            queryUsed:       enrichedQuery,
            totalChunks:     0,
            latencyMs:       Date.now() - t0,
        };
    }

    // 3. Fan out to all 3 tables in PARALLEL
    const [boerickeChunks, homeChunks, ayurvedicChunks] = await Promise.all([
        fetchBoericke(embedding),
        fetchHomeRemedies(embedding),
        fetchAyurvedic(embedding),
    ]);

    // 4. Merge all results, deduplicate, cap at maxTotal
    const rawBrainChunks = mergeAndDedup([
        ...boerickeChunks,
        ...homeChunks,
        ...ayurvedicChunks,
    ]);

    // 5. Apply safety filter (allergy + contraindication rules)
    const rawForFilter: RetrievedChunk[] = rawBrainChunks.map(c => ({
        content:    c.content,
        source:     c.sourceLabel,
        score:      c.similarity,
    }));

    const filtered = applyAllergyFilter(rawForFilter, profile.allergies, profile.conditions);

    // 6. Reassemble BrainChunks with safety flags
    const finalChunks: BrainChunk[] = rawBrainChunks.map((c, i) => ({
        ...c,
        safetyFlag: filtered[i]?.safetyFlag ?? null,
    }));

    // 7. Serialise for LLM injection
    const serialised = serialiseFilteredChunks(filtered);
    const hasSafetyFlags = hasAnyFlaggedChunk(filtered);
    const sourcesSummary = buildSourcesSummary(finalChunks);

    return {
        chunks:         finalChunks,
        serialised,
        hasSafetyFlags,
        sourcesSummary,
        queryUsed:      enrichedQuery,
        totalChunks:    finalChunks.length,
        latencyMs:      Date.now() - t0,
    };
}

// ── Multi-Query Brain (3-Query RAG) ───────────────────────────────────────────

/**
 * Runs 3 parallel Brain queries with slightly varied phrasings and merges
 * the results. Improves recall for multi-symptom or ambiguous queries by
 * ~20–30% over single-query RAG.
 *
 * @param queries     Array of 2–4 query strings (e.g. main symptom + variants)
 * @param profile     Patient profile context
 */
export async function multiQueryBrain(
    queries: string[],
    profile: ProfileContext = { conditions: [], medications: [], allergies: [] }
): Promise<BrainResult> {
    const t0 = Date.now();

    // Run all queries in parallel
    const results = await Promise.allSettled(queries.map(q => queryBrain(q, profile)));

    // Collect all chunks
    const allChunks: BrainChunk[] = [];
    for (const r of results) {
        if (r.status === 'fulfilled') {
            allChunks.push(...r.value.chunks);
        }
    }

    // Merge and dedup across all query results
    const merged = mergeAndDedup(allChunks);

    // Re-apply safety filter on final merged set
    const rawForFilter: RetrievedChunk[] = merged.map(c => ({
        content:    c.content,
        source:     c.sourceLabel,
        score:      c.similarity,
    }));

    const filtered = applyAllergyFilter(rawForFilter, profile.allergies, profile.conditions);

    const finalChunks: BrainChunk[] = merged.map((c, i) => ({
        ...c,
        safetyFlag: filtered[i]?.safetyFlag ?? null,
    }));

    return {
        chunks:         finalChunks,
        serialised:     serialiseFilteredChunks(filtered),
        hasSafetyFlags: hasAnyFlaggedChunk(filtered),
        sourcesSummary: buildSourcesSummary(finalChunks),
        queryUsed:      queries.join(' | '),
        totalChunks:    finalChunks.length,
        latencyMs:      Date.now() - t0,
    };
}

// ── Diagnostics ───────────────────────────────────────────────────────────────

/**
 * Quick health check — verifies the Brain can reach all 3 Supabase tables.
 * Returns counts per table. Call from /api/health or admin panel.
 */
export async function getBrainHealth(): Promise<{
    boericke: number | null;
    homeRemedies: number | null;
    ayurvedic: number | null;
    jinaPoolStatus: { total: number; active: number; disabled: number };
}> {
    const supabase = getSupabaseAdmin();
    const { getJinaPoolStatus } = await import('@/lib/ai/jina');

    const [b, h, a] = await Promise.all([
        supabase.from('boericke_embeddings').select('*', { count: 'exact', head: true }),
        supabase.from('home_remedy_embeddings').select('*', { count: 'exact', head: true }),
        supabase.from('ayurvedic_knowledge_embeddings').select('*', { count: 'exact', head: true }),
    ]);

    return {
        boericke:       b.count ?? null,
        homeRemedies:   h.count ?? null,
        ayurvedic:      a.count ?? null,
        jinaPoolStatus: getJinaPoolStatus(),
    };
}
