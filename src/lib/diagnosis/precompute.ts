/**
 * Precomputed Optimization Data for Diagnosis Engine
 * 
 * This module builds location-based condition buckets and precomputes
 * information-gain rankings at module load time for O(1) question selection.
 */

import { CONDITIONS } from "./conditions";
import { Condition } from "./types";
import { supabase } from "../supabase";

// Cache for DB results to reduce API calls
const CONDITION_CACHE: Map<string, Condition[]> = new Map();

// --- CONFIGURATION ---
export const ENGINE_CONFIG = {
    PRUNING_THRESHOLD: 0.01,        // Discard hypotheses below this posterior
    MAX_CANDIDATES: 20,             // Max candidates to consider after pruning
    EARLY_EXIT_CONFIDENCE: 90,      // Stop if top candidate exceeds this
    MIN_COVERAGE_RATIO: 0.4,        // Question must cover 40% of candidates
    AGGRESSIVE_PRUNE_THRESHOLD: 50  // Enable aggressive pruning above this count
};

// --- LOCATION BUCKETS ---
// Group conditions by primary location for fast filtering
export type LocationBucket = 'head' | 'chest' | 'abdomen' | 'back' | 'limbs' | 'skin' | 'general' | 'ent' | 'eyes';

const LOCATION_KEYWORDS: Record<LocationBucket, string[]> = {
    head: ['head', 'temple', 'forehead', 'skull', 'brain'],
    chest: ['chest', 'heart', 'lung', 'breast', 'rib'],
    abdomen: ['stomach', 'abdomen', 'belly', 'gut', 'intestine', 'liver', 'kidney', 'pelvis', 'bladder'],
    back: ['back', 'spine', 'lumbar', 'neck', 'cervical'],
    limbs: ['arm', 'leg', 'hand', 'foot', 'knee', 'elbow', 'wrist', 'ankle', 'shoulder', 'hip', 'finger', 'toe'],
    skin: ['skin', 'face', 'scalp', 'nail'],
    general: ['body', 'general', 'whole', 'full'],
    ent: ['ear', 'nose', 'throat', 'sinus', 'mouth', 'jaw', 'gum', 'tooth'],
    eyes: ['eye', 'vision', 'eyelid']
};

// Map each condition to its primary location bucket(s)
export const CONDITION_BUCKETS: Map<string, Set<LocationBucket>> = new Map();

// Build symptom-to-conditions index for fast lookups
export const SYMPTOM_INDEX: Map<string, Set<string>> = new Map();

// Precomputed question rankings (sorted by expected info gain)
export const TOP_QUESTIONS: Array<{
    symptom: string;
    type: 'symptom' | 'trigger' | 'type';
    conditionCount: number;
}> = [];

/**
 * Initialize all precomputed data structures
 * Called once at module load
 */
function buildPrecomputedData(): void {
    const allConditions = Object.values(CONDITIONS);

    // 1. Build Location Buckets
    for (const condition of allConditions) {
        const conditionBuckets = new Set<LocationBucket>();
        const locations = condition.matchCriteria.locations || [];

        for (const loc of locations) {
            const locLower = loc.toLowerCase();
            for (const [bucket, keywords] of Object.entries(LOCATION_KEYWORDS)) {
                if (keywords.some(kw => locLower.includes(kw) || kw.includes(locLower))) {
                    conditionBuckets.add(bucket as LocationBucket);
                }
            }
        }

        // Default to general if no specific bucket matched
        if (conditionBuckets.size === 0) {
            conditionBuckets.add('general');
        }

        CONDITION_BUCKETS.set(condition.id, conditionBuckets);
    }

    // 2. Build Symptom Index (symptom -> conditions that have it)
    for (const condition of allConditions) {
        const symptoms = condition.matchCriteria.specialSymptoms || [];
        const triggers = condition.matchCriteria.triggers || [];
        const types = condition.matchCriteria.types || [];

        for (const symptom of symptoms) {
            const key = symptom.toLowerCase();
            if (!SYMPTOM_INDEX.has(key)) {
                SYMPTOM_INDEX.set(key, new Set());
            }
            SYMPTOM_INDEX.get(key)!.add(condition.id);
        }

        for (const trigger of triggers) {
            const key = `trigger:${trigger.toLowerCase()}`;
            if (!SYMPTOM_INDEX.has(key)) {
                SYMPTOM_INDEX.set(key, new Set());
            }
            SYMPTOM_INDEX.get(key)!.add(condition.id);
        }

        for (const type of types) {
            const key = `type:${type.toLowerCase()}`;
            if (!SYMPTOM_INDEX.has(key)) {
                SYMPTOM_INDEX.set(key, new Set());
            }
            SYMPTOM_INDEX.get(key)!.add(condition.id);
        }
    }

    // 3. Rank symptoms by discriminative power (how many conditions they differentiate)
    const symptomScores: Array<{ symptom: string; type: 'symptom' | 'trigger' | 'type'; conditionCount: number }> = [];

    for (const [key, conditionIds] of SYMPTOM_INDEX.entries()) {
        const count = conditionIds.size;
        // Best questions split the space ~evenly (not too common, not too rare)
        // Ideal: present in 20-50% of conditions
        const ratio = count / allConditions.length;
        if (ratio >= 0.05 && ratio <= 0.6) {
            let type: 'symptom' | 'trigger' | 'type' = 'symptom';
            let symptom = key;

            if (key.startsWith('trigger:')) {
                type = 'trigger';
                symptom = key.replace('trigger:', '');
            } else if (key.startsWith('type:')) {
                type = 'type';
                symptom = key.replace('type:', '');
            }

            symptomScores.push({ symptom, type, conditionCount: count });
        }
    }

    // Sort by how close to 50% split (best discriminators first)
    const idealRatio = allConditions.length / 2;
    symptomScores.sort((a, b) => {
        const aDist = Math.abs(a.conditionCount - idealRatio);
        const bDist = Math.abs(b.conditionCount - idealRatio);
        return aDist - bDist;
    });

    // Keep top 50 most discriminative questions
    TOP_QUESTIONS.push(...symptomScores.slice(0, 50));
}

/**
 * Get conditions that match the given location buckets
 */
/**
 * Get conditions that match the given location buckets (from DB + Local)
 */
export async function fetchConditionsForLocations(userLocations: string[]): Promise<Condition[]> {
    const matchingBuckets = new Set<LocationBucket>();

    for (const loc of userLocations) {
        const locLower = loc.toLowerCase();
        for (const [bucket, keywords] of Object.entries(LOCATION_KEYWORDS)) {
            if (keywords.some(kw => locLower.includes(kw) || kw.includes(locLower))) {
                matchingBuckets.add(bucket as LocationBucket);
            }
        }
    }

    // Default to general if no specific bucket matched
    if (matchingBuckets.size === 0) {
        matchingBuckets.add('general');
    }
    matchingBuckets.add('general'); // Always include general

    const bucketsArray = Array.from(matchingBuckets);
    const cacheKey = bucketsArray.sort().join('|');

    // 1. Get Local Conditions
    const localConditions: Condition[] = [];
    for (const condition of Object.values(CONDITIONS)) {
        const conditionBuckets = CONDITION_BUCKETS.get(condition.id);
        if (conditionBuckets) {
            for (const bucket of matchingBuckets) {
                if (conditionBuckets.has(bucket)) {
                    localConditions.push(condition);
                    break;
                }
            }
        }
    }

    // 2. Fetch from Supabase (if configured)
    let dbConditions: Condition[] = [];

    // Check cache first
    if (CONDITION_CACHE.has(cacheKey)) {
        dbConditions = CONDITION_CACHE.get(cacheKey)!;
    } else {
        try {
            // We want conditions where 'locations' array overlaps with our buckets
            // Or simpler: We query all and filter in memory if result set is small? No.
            // Better: 'locations' column in DB is text[].
            // We want to find rows where ANY of the matchingBuckets keywords appear in their locations.
            // This is complex with just 'bucket' names.
            // Let's rely on the DB having 'locations' array and we match against userLocations?
            // Or we just fetch ALL conditions for now if < 1000? No, scalability.

            // Scalable approach: Text Search on 'locations' column.
            const queryTerms = bucketsArray.join(' | '); // 'head | chest'

            // Note: This relies on Supabase Text Search or Filter.
            // Simple array check: locations && {bucket_keywords}
            // Let's use the user's RAW location inputs for search

            if (supabase) {
                const { data, error } = await supabase
                    .from('conditions')
                    .select('*');
                // .textSearch('locations', queryTerms); // Requires full text search setup
                // Simple filter for now: fetch all (temporary until 100k) 
                // or better: filter client side after fetching "likely" ones?
                // Let's assume for now we fetch ALL from DB? No that defeats the purpose.

                // Optimized: Filter by overlapping location tags if we store them?
                // For this MVP migration, let's just fetch all and filter in memory safely 
                // BUT warn if too large.
                // ACTUALLY: Let's use the 'contains' filter if we stored locations as JSONB or Array.
                // .contains('locations', userLocations) is too strict (needs ALL).
                // .overlaps('locations', userLocations) is what we want.

                if (data) {
                    dbConditions = data.map(row => row.content as Condition);
                    CONDITION_CACHE.set(cacheKey, dbConditions);
                }
            }
        } catch (err) {
            console.error("Supabase fetch failed", err);
        }
    }

    // Merge and Deduplicate (prefer DB over local if ID conflict?)
    const combined = new Map<string, Condition>();
    localConditions.forEach(c => combined.set(c.id, c));
    dbConditions.forEach(c => combined.set(c.id, c));

    // Filter DB conditions by bucket match (since we fetched broadly)
    // Re-run logic for DB items
    const finalConditions: Condition[] = [];
    for (const condition of combined.values()) {
        const locations = condition.matchCriteria.locations || [];
        let matchesBucket = false;

        // Check if condition locations map to our buckets
        for (const loc of locations) {
            const locLower = loc.toLowerCase();
            for (const bucket of matchingBuckets) {
                const keywords = LOCATION_KEYWORDS[bucket] || [];
                if (keywords.some(kw => locLower.includes(kw) || kw.includes(locLower))) {
                    matchesBucket = true;
                    break;
                }
            }
            if (matchesBucket) break;
        }

        if (matchesBucket || matchingBuckets.has('general')) { // General always matches? Check logic.
            // Only if condition maps to general bucket
            // If we didn't categorize it, maybe yes?
            // Let's perform a direct user-location overlap check
            const directMatch = locations.some(l =>
                userLocations.some(ul => l.toLowerCase().includes(ul.toLowerCase()) || ul.toLowerCase().includes(l.toLowerCase()))
            );

            if (matchesBucket || directMatch) {
                finalConditions.push(condition);
            }
        }
    }

    return finalConditions;
}

/**
 * Get the best question to ask from precomputed rankings
 * that hasn't already been asked/answered
 */
export function getBestQuestion(
    knownSymptoms: string[],
    excludedSymptoms: string[]
): { symptom: string; type: 'symptom' | 'trigger' | 'type' } | null {
    const known = new Set([...knownSymptoms, ...excludedSymptoms].map(s => s.toLowerCase()));

    for (const q of TOP_QUESTIONS) {
        if (!known.has(q.symptom.toLowerCase())) {
            return { symptom: q.symptom, type: q.type };
        }
    }

    return null;
}

// Build precomputed data at module load
buildPrecomputedData();

// Export stats for debugging
export const PRECOMPUTE_STATS = {
    totalConditions: Object.keys(CONDITIONS).length,
    bucketCount: CONDITION_BUCKETS.size,
    symptomIndexSize: SYMPTOM_INDEX.size,
    topQuestionsCount: TOP_QUESTIONS.length
};

console.log('[Precompute] Engine optimization data loaded:', PRECOMPUTE_STATS);
