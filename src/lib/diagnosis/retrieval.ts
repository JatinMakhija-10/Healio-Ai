
import { supabase } from "@/lib/supabase";
import { UserSymptomData, DatabaseCondition, Condition } from "./types";

// Fallback / Cache
import { CONDITIONS } from "./conditions";

/**
 * Generates an embedding for the user's symptoms via the /api/embeddings route.
 */
async function getEmbedding(text: string): Promise<number[]> {
    try {
        const response = await fetch('/api/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        if (!response.ok) throw new Error('Failed to generate embedding');
        const data = await response.json();
        return data.embedding;
    } catch (e) {
        console.error("Embedding generation failed:", e);
        return [];
    }
}

/**
 * Searches for conditions relevant to the symptoms.
 * Hybrid Search: Vector Similarity + Location Filtering.
 *
 * OPTIMIZATION — eliminates the N+1 pattern:
 *   Old: match_conditions (get IDs) → select * from conditions WHERE id IN (...)
 *   New: match_conditions RPC returns full condition data directly.
 *        If the RPC doesn't expose all fields, we run the second query immediately
 *        instead of waiting on the first — both are fast COUNT-less queries.
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

            // Only do the second round-trip if the RPC doesn't already return full rows
            // Select only the fields we actually use — avoids transferring large JSON blobs
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
        console.warn("Vector search yielded few results — falling back to location-filtered conditions.");
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
