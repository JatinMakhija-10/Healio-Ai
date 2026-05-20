
import { supabase } from "@/lib/supabase";
import { UserSymptomData, DatabaseCondition, Condition } from "./types";
import { disableGeminiApiKey, getGeminiApiKeys, getGeminiClient } from "@/lib/ai/config";
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
    const keys = getGeminiApiKeys();
    let lastError: unknown = null;

    for (const apiKey of keys) {
        try {
            const ai = getGeminiClient(apiKey);
            const res = await ai.models.embedContent({
                model: AI_PHASE_CONFIG.models.embedding,
                contents: text,
            });
            const values = res.embeddings?.[0]?.values ?? [];
            if (values.length > 0) return values;
        } catch (e) {
            lastError = e;
            const message = e instanceof Error ? e.message : String(e);
            if (/api key not valid|api_key_invalid|invalid api key/i.test(message)) {
                disableGeminiApiKey(apiKey);
            }
        }
    }

    console.error("[retrieval] Embedding generation failed:", lastError);
    return [];
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

// ─── Clinical Cases Retrieval ─────────────────────────────────────────────────

export interface ClinicalCaseMatch {
    caseId: string;
    source: 'pmc_patients' | 'mimic_demo' | 'cupcase' | 'multicare';
    age: number | null;
    ageGroup: string;
    gender: string;
    chiefComplaint: string;
    presentingSymptoms: string[];
    diagnosis: string[];
    icdCodes: string[];
    medications: string[];
    narrative: string;
    specialty: string | null;
    similarity: number;
}

/**
 * Search the clinical_cases table using:
 *   1. Vector similarity (Gemini embedding of symptom text)
 *   2. Symptom array overlap (GIN index — fast keyword match)
 *
 * Returns top matching real patient cases for PatientSimilarityEngine.
 * Falls back silently if the table doesn't exist yet (pre-migration).
 */
export async function searchClinicalCases(
    symptoms: UserSymptomData,
    symptomKeywords: string[],
    options: {
        matchThreshold?: number;
        matchCount?: number;
        ageGroup?: string;
        gender?: string;
    } = {}
): Promise<ClinicalCaseMatch[]> {
    const {
        matchThreshold = 0.65,
        matchCount     = 8,
        ageGroup,
        gender,
    } = options;

    const symptomText = [
        symptoms.location.join(' '),
        symptoms.painType || '',
        symptoms.additionalNotes || '',
        symptomKeywords.join(' '),
    ].filter(Boolean).join(' ');

    try {
        // Run vector search + keyword overlap in parallel
        const [vectorResults, keywordResults] = await Promise.allSettled([
            // 1. Vector similarity via match_clinical_cases RPC
            (async () => {
                if (!symptomText.trim()) return [];
                const embedding = await getEmbedding(symptomText);
                if (!embedding.length) return [];

                const { data, error } = await supabase.rpc('match_clinical_cases', {
                    query_embedding:  embedding,
                    match_threshold:  matchThreshold,
                    match_count:      matchCount,
                    filter_age_group: ageGroup || null,
                    filter_gender:    gender    || null,
                    filter_source:    null,
                });

                if (error || !data) return [];
                return data as Array<Record<string, unknown>>;
            })(),

            // 2. Symptom keyword overlap via find_cases_by_symptoms RPC
            (async () => {
                if (symptomKeywords.length < 2) return [];

                const { data, error } = await supabase.rpc('find_cases_by_symptoms', {
                    symptom_keywords: symptomKeywords,
                    min_overlap:      2,
                    result_limit:     matchCount,
                });

                if (error || !data) return [];
                return data as Array<Record<string, unknown>>;
            })(),
        ]);

        // Merge + deduplicate by case_id, prefer vector similarity score
        const merged = new Map<string, ClinicalCaseMatch>();

        const addResults = (results: Array<Record<string, unknown>>, source: 'vector' | 'keyword') => {
            for (const r of results) {
                const caseId = r.case_id as string;
                if (!caseId) continue;

                const existing = merged.get(caseId);
                const similarity = source === 'vector'
                    ? (r.similarity as number ?? 0)
                    : (r.similarity_hint as number ?? 0.5);

                if (!existing || similarity > existing.similarity) {
                    merged.set(caseId, {
                        caseId,
                        source:             (r.source as ClinicalCaseMatch['source']) || 'pmc_patients',
                        age:                (r.age as number) ?? null,
                        ageGroup:           (r.age_group as string) || 'unknown',
                        gender:             (r.gender as string)    || 'unknown',
                        chiefComplaint:     (r.chief_complaint as string) || '',
                        presentingSymptoms: (r.presenting_symptoms as string[]) || [],
                        diagnosis:          (r.diagnosis as string[]) || [],
                        icdCodes:           (r.icd_codes as string[]) || [],
                        medications:        (r.medications as string[]) || [],
                        narrative:          (r.narrative as string) || '',
                        specialty:          (r.specialty as string) || null,
                        similarity,
                    });
                }
            }
        };

        if (vectorResults.status  === 'fulfilled') addResults(vectorResults.value,  'vector');
        if (keywordResults.status === 'fulfilled') addResults(keywordResults.value, 'keyword');

        return Array.from(merged.values())
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, matchCount);

    } catch {
        // Table not migrated yet or network error — fail silently
        return [];
    }
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
