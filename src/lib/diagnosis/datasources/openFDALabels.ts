/**
 * OpenFDA Drug Labels Client
 *
 * Source: FDA Drug Label API (api.fda.gov/drug/label.json)
 * License: Free, public domain — no API key required
 * Rate limit: 240 req/min with key, 40/min without
 *
 * Provides REAL FDA-approved prescribing information:
 *   - Black box warnings
 *   - Contraindications
 *   - Drug-drug interactions (from actual label text)
 *   - Adverse reactions (clinical trial data)
 *   - Indications and usage
 *   - Warnings and precautions
 *   - Use in specific populations (pregnancy, pediatric, geriatric)
 */

const OPENFDA_LABEL_BASE = 'https://api.fda.gov/drug/label.json';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FDADrugLabel {
    genericName: string;
    brandNames: string[];
    manufacturer: string;
    // Clinical content (raw text from FDA label)
    blackBoxWarning?: string;
    contraindications?: string;
    warningsAndPrecautions?: string;
    adverseReactions?: string;
    drugInteractions?: string;
    indicationsAndUsage?: string;
    // Specific populations
    pregnancyWarning?: string;
    pediatricUse?: string;
    geriatricUse?: string;
    renalImpairment?: string;
    hepaticImpairment?: string;
    // Parsed structured data
    hasBlackBoxWarning: boolean;
    interactingDrugs: string[];        // extracted from drugInteractions text
    contraindicated: string[];         // extracted condition names
    fetchedAt: number;
}

export interface FDALabelCheckResult {
    drug: string;
    labelFound: boolean;
    hasBlackBoxWarning: boolean;
    contraindications: string[];
    keyInteractions: string[];
    pregnancySafe: boolean | null;     // null = no data
    renalCaution: boolean;
    hepaticCaution: boolean;
    rawLabel?: FDADrugLabel;
}

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

const labelCache = new Map<string, FDADrugLabel>();

// ─── Text Parsers ─────────────────────────────────────────────────────────────

/**
 * Extract drug names mentioned in interaction text.
 * Looks for capitalized drug names and known patterns.
 */
function extractInteractingDrugs(text: string): string[] {
    if (!text) return [];
    const drugs: string[] = [];

    // Match drug names: CYP3A4 inhibitors list, specific named drugs
    const patterns = [
        /\b(warfarin|aspirin|clopidogrel|metformin|digoxin|lithium|phenytoin|carbamazepine|rifampin|ketoconazole|fluconazole|amiodarone|methotrexate|cyclosporine|tacrolimus|sirolimus|simvastatin|atorvastatin|clarithromycin|erythromycin|azithromycin|ciprofloxacin|fluoxetine|paroxetine|sertraline|venlafaxine|haloperidol|clozapine|risperidone|olanzapine|alcohol|MAO\s*inhibitor|MAOI|SSRI|SNRI|TCA|NSAIDs?\b)/gi,
    ];

    for (const pattern of patterns) {
        const matches = text.match(pattern) || [];
        drugs.push(...matches.map(m => m.toLowerCase()));
    }

    return [...new Set(drugs)].slice(0, 15);
}

/**
 * Extract contraindicated conditions/states from contraindication text.
 */
function extractContraindications(text: string): string[] {
    if (!text) return [];
    const conditions: string[] = [];

    const patterns = [
        /hypersensitivity/gi,
        /pregnancy/gi,
        /breastfeeding|lactation/gi,
        /hepatic\s+impairment|liver\s+disease/gi,
        /renal\s+impairment|kidney\s+disease|CKD/gi,
        /heart\s+failure/gi,
        /QT\s+prolongation/gi,
        /myopathy|rhabdomyolysis/gi,
        /bleeding\s+disorder/gi,
        /thrombocytopenia/gi,
        /severe\s+hypertension/gi,
        /glaucoma/gi,
        /porphyria/gi,
        /angle-closure\s+glaucoma/gi,
    ];

    for (const pattern of patterns) {
        if (pattern.test(text)) {
            conditions.push(
                pattern.source
                    .replace(/\\s\+/g, ' ')
                    .replace(/\|/g, '/')
                    .replace(/\(.*?\)/g, '')
                    .trim()
                    .toLowerCase()
            );
        }
    }

    return [...new Set(conditions)];
}

/**
 * Check if pregnancy is flagged as unsafe in label.
 */
function checkPregnancySafety(text?: string): boolean | null {
    if (!text) return null;
    const lower = text.toLowerCase();
    if (/contraindicated.*pregnant|avoid.*pregnant|do not use.*pregnant|category\s+[dx]/i.test(lower)) return false;
    if (/generally considered safe|category\s+[ab]/i.test(lower)) return true;
    return null;
}

// ─── Main Fetcher ─────────────────────────────────────────────────────────────

/**
 * Fetch FDA drug label for a given drug name.
 * Tries generic name first, then brand name.
 */
export async function fetchFDALabel(drugName: string): Promise<FDADrugLabel | null> {
    const key = drugName.toLowerCase().trim();

    const cached = labelCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached;
    }

    try {
        // Try generic name search first, then brand name
        const queries = [
            `openfda.generic_name:"${encodeURIComponent(key)}"`,
            `openfda.brand_name:"${encodeURIComponent(key)}"`,
            `openfda.substance_name:"${encodeURIComponent(key)}"`,
        ];

        let labelData: Record<string, string[]> | null = null;
        let openfdaMeta: Record<string, string[]> = {};

        for (const q of queries) {
            const url = `${OPENFDA_LABEL_BASE}?search=${q}&limit=1`;
            const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
            if (!res.ok) continue;

            const data = await res.json();
            if (data?.results?.[0]) {
                labelData = data.results[0];
                openfdaMeta = data.results[0].openfda || {};
                break;
            }
        }

        if (!labelData) return null;

        const label: FDADrugLabel = {
            genericName: (openfdaMeta.generic_name?.[0] || key).toLowerCase(),
            brandNames: openfdaMeta.brand_name || [],
            manufacturer: openfdaMeta.manufacturer_name?.[0] || 'Unknown',
            blackBoxWarning: (labelData.boxed_warning || []).join(' ').slice(0, 2000) || undefined,
            contraindications: (labelData.contraindications || []).join(' ').slice(0, 2000) || undefined,
            warningsAndPrecautions: (labelData.warnings_and_cautions || labelData.warnings || []).join(' ').slice(0, 2000) || undefined,
            adverseReactions: (labelData.adverse_reactions || []).join(' ').slice(0, 2000) || undefined,
            drugInteractions: (labelData.drug_interactions || []).join(' ').slice(0, 2000) || undefined,
            indicationsAndUsage: (labelData.indications_and_usage || []).join(' ').slice(0, 1000) || undefined,
            pregnancyWarning: (labelData.pregnancy || labelData.teratogenic_effects || []).join(' ').slice(0, 500) || undefined,
            pediatricUse: (labelData.pediatric_use || []).join(' ').slice(0, 500) || undefined,
            geriatricUse: (labelData.geriatric_use || []).join(' ').slice(0, 500) || undefined,
            renalImpairment: (labelData.renal_impairment || []).join(' ').slice(0, 500) || undefined,
            hepaticImpairment: (labelData.hepatic_impairment || []).join(' ').slice(0, 500) || undefined,
            hasBlackBoxWarning: !!(labelData.boxed_warning?.length),
            interactingDrugs: extractInteractingDrugs(
                (labelData.drug_interactions || []).join(' ')
            ),
            contraindicated: extractContraindications(
                (labelData.contraindications || []).join(' ')
            ),
            fetchedAt: Date.now(),
        };

        labelCache.set(key, label);
        return label;

    } catch {
        return null;
    }
}

/**
 * Check a drug against a user's conditions and current medications.
 * Returns a structured safety report from real FDA label data.
 */
export async function checkDrugSafety(
    drugName: string,
    userConditions: string[],
    userMedications: string[],
    isPregnant?: boolean,
): Promise<FDALabelCheckResult> {
    const label = await fetchFDALabel(drugName);

    if (!label) {
        return {
            drug: drugName,
            labelFound: false,
            hasBlackBoxWarning: false,
            contraindications: [],
            keyInteractions: [],
            pregnancySafe: null,
            renalCaution: false,
            hepaticCaution: false,
        };
    }

    // Check if user's conditions are contraindicated
    const activeContraindications = userConditions.filter(cond =>
        label.contraindicated.some(ci => ci.includes(cond.toLowerCase()) || cond.toLowerCase().includes(ci))
    );

    // Check if user's medications interact
    const activeInteractions = userMedications.filter(med =>
        label.interactingDrugs.some(intDrug =>
            med.toLowerCase().includes(intDrug) || intDrug.includes(med.toLowerCase())
        )
    );

    // Pregnancy flag
    const pregnancySafe = isPregnant
        ? checkPregnancySafety(label.pregnancyWarning)
        : null;

    // Renal/hepatic caution
    const renalCaution = !!(label.renalImpairment &&
        /caution|reduce|avoid|contraindicated/i.test(label.renalImpairment));
    const hepaticCaution = !!(label.hepaticImpairment &&
        /caution|reduce|avoid|contraindicated/i.test(label.hepaticImpairment));

    return {
        drug: drugName,
        labelFound: true,
        hasBlackBoxWarning: label.hasBlackBoxWarning,
        contraindications: activeContraindications,
        keyInteractions: activeInteractions,
        pregnancySafe,
        renalCaution,
        hepaticCaution,
        rawLabel: label,
    };
}

/**
 * Batch check multiple drugs in parallel.
 */
export async function batchCheckDrugSafety(
    drugs: string[],
    userConditions: string[],
    userMedications: string[],
    isPregnant?: boolean,
): Promise<FDALabelCheckResult[]> {
    const results = await Promise.allSettled(
        drugs.map(d => checkDrugSafety(d, userConditions, userMedications, isPregnant))
    );

    return results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<FDALabelCheckResult>).value);
}
