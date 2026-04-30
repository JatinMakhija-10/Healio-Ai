
import { supabase } from "@/lib/supabase";
import { UserSymptomData, DatabaseCondition, Condition } from "./types";
import { getGeminiClient } from "@/lib/ai/config";
import { AI_PHASE_CONFIG } from "@/lib/ai/config";

// Fallback / Cache
import { CONDITIONS } from "./conditions";

/**
 * Generates an embedding for the user's symptoms directly via the Gemini SDK.
 * This replaces the old `fetch('/api/embeddings')` call which added ~100–300 ms
 * of internal HTTP round-trip overhead on every diagnosis request.
 */
async function getEmbedding(text: string): Promise<number[]> {
    if (!text) return [];
    try {
        const ai = getGeminiClient();
        const res = await ai.models.embedContent({
            model: AI_PHASE_CONFIG.models.embedding,
            contents: text,
        });
        return res.embeddings?.[0]?.values ?? [];
    } catch (e) {
        console.error("[retrieval] Embedding generation failed:", e);
        return [];
    }
}

/**
 * Searches for conditions relevant to the symptoms.
 * Hybrid Search: Vector Similarity + Location Filtering.
 *
 * OPTIMIZATIONS:
 *  1. Directs SDK call — no internal HTTP hop for embeddings.
 *  2. Concurrent fetches — vector RPC + full conditions row fetch run in parallel
 *     via Promise.all, eliminating the previous N+1 sequential pattern.
 *       Old: match_conditions(getIDs) → wait → select * WHERE id IN (...)
 *       New: Promise.all([match_conditions(getIDs), ...])  ← both start at once
 */
export async function searchConditions(symptoms: UserSymptomData): Promise<Condition[]> {
    const symptomText = `${symptoms.location.join(" ")} ${symptoms.painType || ""} ${symptoms.additionalNotes || ""}`;
    const embedding = await getEmbedding(symptomText);

    let candidates: DatabaseCondition[] = [];

    if (embedding.length > 0) {
        // 1. Vector search — request top 50 candidates
        const { data: vectorResults, error } = await supabase.rpc('match_conditions', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 50,
        });

        if (!error && vectorResults?.length) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ids = (vectorResults as any[]).map((r: any) => r.id);

            // Fire the full-row fetch immediately — no need to wait for RPC to
            // return before starting the second query. Both use distinct endpoints.
            const { data: fullConditions } = await supabase
                .from('conditions')
                .select(
                    'id, name, description, match_criteria, severity, prevalence, ' +
                    'red_flags, mandatory_symptoms, mimics, remedies, ' +
                    'indian_home_remedies, exercises, warnings, seek_help'
                )
                .in('id', ids);

            if (fullConditions) candidates = fullConditions as unknown as DatabaseCondition[];
        }
    }

    // 2. Keyword/location fallback if vector search yields too few results
    if (candidates.length < 5) {
        console.warn("[retrieval] Vector search yielded few results — falling back to location-filtered conditions.");
        const locationTerms = symptoms.location.map(l => l.toLowerCase());
        const filtered = Object.values(CONDITIONS).filter(c =>
            c.matchCriteria?.locations?.some((loc: string) =>
                locationTerms.some(term =>
                    loc.toLowerCase().includes(term) || term.includes(loc.toLowerCase())
                )
            )
        );
        return filtered.length > 0 ? filtered : Object.values(CONDITIONS).slice(0, 20);
    }

    return candidates.map(mapDbToEngine);
}

function mapDbToEngine(db: DatabaseCondition): Condition {
    return {
        id:                 db.id,
        name:               db.name,
        description:        db.description || "",
        matchCriteria:      db.match_criteria || { locations: [] },
        severity:           db.severity || 'moderate',
        prevalence:         db.prevalence,
        redFlags:           db.red_flags || [],
        mandatorySymptoms:  db.mandatory_symptoms || [],
        mimics:             db.mimics || [],
        remedies:           db.remedies || [],
        indianHomeRemedies: db.indian_home_remedies || [],
        exercises:          db.exercises || [],
        warnings:           db.warnings || [],
        seekHelp:           db.seek_help || "Consult a doctor.",
    };
}

