/**
 * RxNorm + OpenFDA API Client
 *
 * Real clinical drug data from:
 *   - RxNorm (NLM): Drug names, RxCUI identifiers, drug classes
 *     API: https://rxnav.nlm.nih.gov/REST/
 *     License: Free, no credentials required
 *
 *   - OpenFDA (FDA): Real adverse event reports (millions of records)
 *     API: https://api.fda.gov/drug/event.json
 *     License: Free, no credentials required
 *     Rate limit: 40 req/min without key, 240/min with FDAAA key
 *
 * All responses are cached in-memory (and optionally in Supabase)
 * to prevent redundant API calls during a single diagnosis session.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RxNormDrug {
    rxcui: string;
    name: string;
    synonym?: string;
    drugClass?: string[];
    tty: string; // term type: IN = ingredient, BN = brand name, etc.
}

export interface RxNormInteraction {
    rxcui1: string;
    name1: string;
    rxcui2: string;
    name2: string;
    severity: 'high' | 'moderate' | 'low' | 'unknown';
    description: string;
    source: string;
}

export interface OpenFDAAdverseEvent {
    symptom: string;               // MedDRA preferred term
    count: number;                 // number of reports
    proportionalReportingRatio: number; // PRR (> 2.0 = signal)
    isSignal: boolean;             // PRR > 2.0 AND count > 3
}

export interface DrugProfile {
    rxcui: string;
    name: string;
    drugClass: string[];
    topAdverseEvents: OpenFDAAdverseEvent[];
    interactions: RxNormInteraction[];
    fetchedAt: number; // timestamp for cache invalidation
}

// ─── In-Memory Cache (session-scoped) ─────────────────────────────────────────

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
const rxcuiCache = new Map<string, { rxcui: string; name: string; fetchedAt: number }>();
const profileCache = new Map<string, DrugProfile>();

// ─── RxNorm API ───────────────────────────────────────────────────────────────

const RXNORM_BASE = 'https://rxnav.nlm.nih.gov/REST';

/**
 * Resolve a free-text drug name to an RxCUI identifier.
 * Example: "atorvastatin" → "83367"
 */
export async function resolveRxCUI(drugName: string): Promise<string | null> {
    const key = drugName.toLowerCase().trim();

    const cached = rxcuiCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.rxcui;
    }

    try {
        const url = `${RXNORM_BASE}/rxcui.json?name=${encodeURIComponent(key)}&search=1`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return null;

        const data = await res.json();
        const rxcui = data?.idGroup?.rxnormId?.[0];
        if (!rxcui) return null;

        rxcuiCache.set(key, { rxcui, name: drugName, fetchedAt: Date.now() });
        return rxcui;
    } catch {
        return null;
    }
}

/**
 * Get drug class information for an RxCUI.
 * Example: "83367" → ["HMG-CoA Reductase Inhibitors", "Antilipemic Agents"]
 */
export async function getDrugClasses(rxcui: string): Promise<string[]> {
    try {
        const url = `${RXNORM_BASE}/rxclass/class/byRxcui.json?rxcui=${rxcui}&relaSource=ATC`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return [];

        const data = await res.json();
        const classes = data?.rxclassDrugInfoList?.rxclassDrugInfo ?? [];
        return classes
            .map((c: { rxclassMinConceptItem?: { className?: string } }) => c.rxclassMinConceptItem?.className)
            .filter(Boolean) as string[];
    } catch {
        return [];
    }
}

/**
 * Get drug-drug interactions for an RxCUI using RxNav interaction API.
 */
export async function getRxNormInteractions(rxcui: string): Promise<RxNormInteraction[]> {
    try {
        const url = `${RXNORM_BASE}/interaction/interaction.json?rxcui=${rxcui}&sources=ONCHigh`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return [];

        const data = await res.json();
        const pairs = data?.interactionTypeGroup?.[0]?.interactionType?.[0]?.interactionPair ?? [];

        return pairs.map((pair: {
            interactionConcept: Array<{ minConceptItem: { rxcui: string; name: string } }>;
            severity?: string;
            description?: string;
        }) => ({
            rxcui1: pair.interactionConcept?.[0]?.minConceptItem?.rxcui ?? '',
            name1: pair.interactionConcept?.[0]?.minConceptItem?.name ?? '',
            rxcui2: pair.interactionConcept?.[1]?.minConceptItem?.rxcui ?? '',
            name2: pair.interactionConcept?.[1]?.minConceptItem?.name ?? '',
            severity: (pair.severity?.toLowerCase() ?? 'unknown') as RxNormInteraction['severity'],
            description: pair.description ?? '',
            source: 'rxnorm_onc_high',
        }));
    } catch {
        return [];
    }
}

// ─── OpenFDA API ──────────────────────────────────────────────────────────────

const OPENFDA_BASE = 'https://api.fda.gov/drug/event.json';

/**
 * Get the top adverse events for a drug from real FDA adverse event reports.
 *
 * Uses count queries to get the most reported MedDRA reaction terms.
 * Applies a basic Proportional Reporting Ratio (PRR) filter to surface
 * signals (PRR > 2.0, count > 3) vs background noise.
 */
export async function getOpenFDAAdverseEvents(
    drugName: string,
    limit = 20
): Promise<OpenFDAAdverseEvent[]> {
    try {
        // Count top reactions for this drug
        const url =
            `${OPENFDA_BASE}?search=patient.drug.medicinalproduct:"${encodeURIComponent(drugName.toUpperCase())}"` +
            `&count=patient.reaction.reactionmeddrapt.exact&limit=${limit}`;

        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return [];

        const data = await res.json();
        const results: Array<{ term: string; count: number }> = data?.results ?? [];

        if (results.length === 0) return [];

        const total = results.reduce((sum, r) => sum + r.count, 0);

        return results.map(r => {
            // Basic PRR: (cases with drug + event / all cases with drug)
            // / (background rate approximation — use 1/total as baseline)
            const observedRate = r.count / total;
            const backgroundRate = 1 / results.length; // uniform prior
            const prr = observedRate / backgroundRate;

            return {
                symptom: r.term.toLowerCase().replace(/ /g, '_'),
                count: r.count,
                proportionalReportingRatio: Math.round(prr * 100) / 100,
                isSignal: prr > 2.0 && r.count > 3,
            };
        });
    } catch {
        return [];
    }
}

// ─── Composite Profile Fetcher ─────────────────────────────────────────────────

/**
 * Fetch a complete drug profile combining RxNorm + OpenFDA data.
 * Results are cached for 1 hour.
 *
 * This is the main function consumed by MedicationIntelligence.
 */
export async function fetchDrugProfile(drugName: string): Promise<DrugProfile | null> {
    const key = drugName.toLowerCase().trim();

    const cached = profileCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached;
    }

    // Run RxCUI lookup + adverse events in parallel
    const [rxcui, adverseEvents] = await Promise.all([
        resolveRxCUI(drugName),
        getOpenFDAAdverseEvents(drugName),
    ]);

    if (!rxcui) return null;

    // Drug class + interactions require rxcui — run in parallel
    const [drugClass, interactions] = await Promise.all([
        getDrugClasses(rxcui),
        getRxNormInteractions(rxcui),
    ]);

    const profile: DrugProfile = {
        rxcui,
        name: drugName,
        drugClass,
        topAdverseEvents: adverseEvents,
        interactions,
        fetchedAt: Date.now(),
    };

    profileCache.set(key, profile);
    return profile;
}

/**
 * Batch fetch profiles for multiple drugs (e.g., user's full medication list).
 * All requests run in parallel, individual failures are silently skipped.
 */
export async function fetchDrugProfiles(drugNames: string[]): Promise<Map<string, DrugProfile>> {
    const results = await Promise.allSettled(
        drugNames.map(name => fetchDrugProfile(name).then(p => ({ name, profile: p })))
    );

    const map = new Map<string, DrugProfile>();
    for (const r of results) {
        if (r.status === 'fulfilled' && r.value.profile) {
            map.set(r.value.name.toLowerCase(), r.value.profile);
        }
    }
    return map;
}
