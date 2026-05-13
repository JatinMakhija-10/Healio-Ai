/**
 * ClinicalTrials.gov API Client
 *
 * Source: ClinicalTrials.gov REST API v2 (clinicaltrials.gov/api/v2)
 * License: Free, public domain — no API key required
 * Rate limit: Generous (NIH public API)
 *
 * Used for:
 *   1. Condition symptom enrichment — eligibility criteria describe
 *      presenting symptoms in precise clinical language
 *   2. Condition synonym lookup — trials use both common and ICD names
 *   3. Age/sex prevalence hints — inclusion criteria reveal who gets it
 *   4. Comorbidity associations — exclusion criteria reveal dangerous combos
 */

const CT_BASE = 'https://clinicaltrials.gov/api/v2/studies';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClinicalTrialSummary {
    nctId: string;
    title: string;
    conditions: string[];
    inclusionKeywords: string[];    // symptom/sign keywords from inclusion criteria
    exclusionKeywords: string[];    // dangerous combos / contraindications
    minimumAge?: string;
    maximumAge?: string;
    sex?: 'ALL' | 'FEMALE' | 'MALE';
    phase?: string;
    status: string;
}

export interface ConditionTrialProfile {
    conditionQuery: string;
    trialCount: number;
    synonyms: string[];             // all names used across trials
    commonInclusionSymptoms: string[];
    commonExclusionConditions: string[];
    ageProfile: {
        pediatricTrials: number;
        adultTrials: number;
        elderlyTrials: number;
    };
    fetchedAt: number;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const ctCache = new Map<string, ConditionTrialProfile>();

// ─── Clinical Term Extractor ──────────────────────────────────────────────────

const SYMPTOM_TERMS_SET = new Set([
    'pain', 'fever', 'fatigue', 'weakness', 'nausea', 'vomiting', 'dyspnea',
    'cough', 'headache', 'dizziness', 'syncope', 'palpitations', 'edema',
    'rash', 'jaundice', 'confusion', 'tremor', 'seizure', 'dysphagia',
    'bleeding', 'bruising', 'pallor', 'cyanosis', 'tachycardia', 'bradycardia',
    'hypertension', 'hypotension', 'weight loss', 'anorexia', 'insomnia',
    'arthralgia', 'myalgia', 'pruritus', 'urticaria', 'lymphadenopathy',
]);

function extractSymptomKeywords(text: string): string[] {
    if (!text) return [];
    const lower = text.toLowerCase();
    return Array.from(SYMPTOM_TERMS_SET).filter(t => lower.includes(t));
}

function extractExclusionConditions(text: string): string[] {
    if (!text) return [];
    const lower = text.toLowerCase();

    const DANGEROUS_COMBOS = [
        'hepatic impairment', 'renal impairment', 'liver failure',
        'kidney failure', 'heart failure', 'pregnancy', 'breastfeeding',
        'active bleeding', 'thrombocytopenia', 'neutropenia', 'anemia',
        'uncontrolled hypertension', 'uncontrolled diabetes', 'stroke',
        'myocardial infarction', 'pulmonary embolism', 'deep vein thrombosis',
        'active malignancy', 'immunocompromised', 'hiv', 'tuberculosis',
        'sepsis', 'seizure disorder', 'dementia', 'psychiatric disorder',
    ];

    return DANGEROUS_COMBOS.filter(c => lower.includes(c));
}

function parseAgeCategory(ageStr?: string): 'pediatric' | 'adult' | 'elderly' | null {
    if (!ageStr) return null;
    const match = ageStr.match(/(\d+)\s*(year|month)/i);
    if (!match) return null;
    const years = parseInt(match[1]) * (match[2].toLowerCase().startsWith('month') ? 1/12 : 1);
    if (years < 18) return 'pediatric';
    if (years >= 65) return 'elderly';
    return 'adult';
}

// ─── Main Fetcher ─────────────────────────────────────────────────────────────

/**
 * Fetch clinical trial metadata for a condition.
 * Returns symptom patterns derived from eligibility criteria.
 */
export async function fetchConditionTrialProfile(
    conditionName: string,
    limit = 20,
): Promise<ConditionTrialProfile | null> {
    const key = conditionName.toLowerCase().trim();

    const cached = ctCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached;
    }

    try {
        const params = new URLSearchParams({
            'query.cond': conditionName,
            'fields': 'NCTId,BriefTitle,Condition,EligibilityCriteria,MinimumAge,MaximumAge,Sex,Phase,OverallStatus',
            'pageSize': String(limit),
            'format': 'json',
            'filter.overallStatus': 'COMPLETED,RECRUITING',
        });

        const url = `${CT_BASE}?${params.toString()}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return null;

        const data = await res.json();
        const studies: Array<{ protocolSection: Record<string, Record<string, unknown>> }> = data?.studies || [];

        if (studies.length === 0) return null;

        const allInclusionSymptoms: string[] = [];
        const allExclusionConditions: string[] = [];
        const synonymSet = new Set<string>();
        const ageProfile = { pediatricTrials: 0, adultTrials: 0, elderlyTrials: 0 };

        for (const study of studies) {
            const proto = study.protocolSection;
            const eligibility = proto?.eligibilityModule as Record<string, string> | undefined;
            const identification = proto?.identificationModule as Record<string, string[]> | undefined;

            // Collect condition synonyms
            const conditions = identification?.conditions || [];
            conditions.forEach((c: string) => synonymSet.add(c.toLowerCase()));

            if (eligibility) {
                const criteria = (eligibility.eligibilityCriteria as string) || '';

                // Split by inclusion/exclusion
                const inclusionPart = criteria.split(/exclusion criteria/i)[0] || criteria;
                const exclusionPart = criteria.split(/exclusion criteria/i)[1] || '';

                allInclusionSymptoms.push(...extractSymptomKeywords(inclusionPart));
                allExclusionConditions.push(...extractExclusionConditions(exclusionPart));

                // Age categorization
                const minAge = eligibility.minimumAge as string | undefined;
                const maxAge = eligibility.maximumAge as string | undefined;
                const minCat = parseAgeCategory(minAge);
                const maxCat = parseAgeCategory(maxAge);

                if (minCat === 'pediatric' || maxCat === 'pediatric') ageProfile.pediatricTrials++;
                else if (minCat === 'elderly' || maxCat === 'elderly') ageProfile.elderlyTrials++;
                else ageProfile.adultTrials++;
            }
        }

        // Count frequencies
        const inclusionFreq: Record<string, number> = {};
        allInclusionSymptoms.forEach(s => { inclusionFreq[s] = (inclusionFreq[s] || 0) + 1; });

        const exclusionFreq: Record<string, number> = {};
        allExclusionConditions.forEach(c => { exclusionFreq[c] = (exclusionFreq[c] || 0) + 1; });

        const topInclusion = Object.entries(inclusionFreq)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([k]) => k);

        const topExclusion = Object.entries(exclusionFreq)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([k]) => k);

        const profile: ConditionTrialProfile = {
            conditionQuery: conditionName,
            trialCount: studies.length,
            synonyms: Array.from(synonymSet).slice(0, 10),
            commonInclusionSymptoms: topInclusion,
            commonExclusionConditions: topExclusion,
            ageProfile,
            fetchedAt: Date.now(),
        };

        ctCache.set(key, profile);
        return profile;

    } catch {
        return null;
    }
}

/**
 * Batch fetch trial profiles for multiple conditions.
 */
export async function batchFetchTrialProfiles(
    conditions: string[],
): Promise<Map<string, ConditionTrialProfile>> {
    const results = new Map<string, ConditionTrialProfile>();

    await Promise.allSettled(
        conditions.map(async cond => {
            const profile = await fetchConditionTrialProfile(cond);
            if (profile) results.set(cond.toLowerCase(), profile);
        })
    );

    return results;
}
