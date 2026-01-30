
import { supabase } from "@/lib/supabase";
import { UserSymptomData, DatabaseCondition, Condition } from "./types";

// Fallback / Cache
import { CONDITIONS } from "./conditions"; // Keep fallback for now

/**
 * Generates an embedding for the user's symptoms using an API route (to hide OpenAI key)
 * OR uses a local/client-side mechanism if configured.
 * For this implementation, we assume a Next.js API route `/api/embeddings` exists.
 */
async function getEmbedding(text: string): Promise<number[]> {
    try {
        const response = await fetch('/api/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (!response.ok) throw new Error('Failed to generate embedding');
        const data = await response.json();
        return data.embedding;
    } catch (e) {
        console.error("Embedding generation failed:", e);
        return []; // Fallback
    }
}

/**
 * Searches for conditions relevant to the symptoms.
 * Hybrid Search: Vector Similarity + Location Filtering
 */
export async function searchConditions(symptoms: UserSymptomData): Promise<Condition[]> {
    const symptomText = `${symptoms.location.join(" ")} ${symptoms.painType || ""} ${symptoms.additionalNotes || ""}`;
    const embedding = await getEmbedding(symptomText);

    let candidates: DatabaseCondition[] = [];

    if (embedding.length > 0) {
        // 1. Vector Search
        const { data: vectorResults, error } = await supabase.rpc('match_conditions', {
            query_embedding: embedding,
            match_threshold: 0.5, // Minimum similarity
            match_count: 50
        });

        if (!error && vectorResults) {
            // Fetch full details for these IDs (if RPC didn't return everything)
            // RPC returns id, name, description. We need match_criteria etc.
            const ids = vectorResults.map((r: any) => r.id);
            const { data: fullConditions } = await supabase
                .from('conditions')
                .select('*')
                .in('id', ids);

            if (fullConditions) candidates = fullConditions as any[];
        }
    }

    // 2. Keyword/Location Fallback (if Vector fails or finds few)
    if (candidates.length < 5) {
        console.warn("Vector search yielded few results, falling back to location filter.");
        // Basic filter by location in JSONB
        // Note: JSONB contains query syntax is specific
        // For now, let's use the local fallback `CONDITIONS` array to ensure reliability during migration
        // In full prod, this would be a DB Text Search query

        // Simulating DB text search with local for safe fallback
        return Object.values(CONDITIONS);
    }

    // Map DatabaseCondition to Engine Condition (handling discrepancies if any)
    return candidates.map(mapDbToEngine);
}

function mapDbToEngine(db: DatabaseCondition): Condition {
    // Map DB fields to application Condition type
    // Ensure all required fields are present (using defaults if DB returns partial)
    return {
        id: db.id,
        name: db.name,
        description: db.description || "",
        matchCriteria: db.match_criteria || { locations: [] },
        severity: db.severity || 'moderate',
        prevalence: db.prevalence,
        redFlags: db.red_flags || [],
        mandatorySymptoms: db.mandatory_symptoms || [],
        mimics: db.mimics || [],
        remedies: db.remedies || [],
        indianHomeRemedies: db.indian_home_remedies || [],
        exercises: db.exercises || [],
        warnings: db.warnings || [],
        seekHelp: db.seek_help || "Consult a doctor."
    };
}
