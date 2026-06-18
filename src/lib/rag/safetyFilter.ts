/**
 * safetyFilter.ts — Post-Retrieval Allergy & Contraindication Filter
 *
 * Applied to RAG chunks AFTER retrieval, BEFORE prompt assembly.
 * Flags chunks that match patient allergens or known contraindications,
 * annotating them so the LLM is instructed to warn rather than recommend.
 *
 * This moves allergy safety from soft prompt-level instructions
 * to hard retrieval-time enforcement.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RetrievedChunk {
    content: string;
    source: string;
    score: number;
    safetyFlag?: 'contraindicated' | 'caution' | 'allergy_risk' | null;
}

// ─── Drug Class Mappings ──────────────────────────────────────────────────────
// Maps known allergens to drug class synonyms that should also be flagged.

const ALLERGY_CLASS_EXPANSIONS: Record<string, string[]> = {
    penicillin: ['amoxicillin', 'ampicillin', 'piperacillin', 'cloxacillin', 'flucloxacillin', 'co-amoxiclav', 'augmentin'],
    sulfa:      ['sulfamethoxazole', 'trimethoprim', 'bactrim', 'septran', 'sulfadiazine', 'sulfonamide'],
    aspirin:    ['nsaid', 'ibuprofen', 'naproxen', 'diclofenac', 'ketorolac', 'indomethacin', 'celecoxib'],
    codeine:    ['tramadol', 'morphine', 'opioid', 'fentanyl', 'hydrocodone', 'oxycodone'],
    latex:      ['banana', 'avocado', 'kiwi', 'chestnut'],   // latex-fruit syndrome
};

// ─── Condition-Based Contraindication Rules ──────────────────────────────────
// Maps known conditions to substance classes that should be flagged.

interface ContraRule {
    conditionPattern: RegExp;
    flaggedTerms: string[];
    severity: 'contraindicated' | 'caution';
}

const CONTRAINDICATION_RULES: ContraRule[] = [
    {
        conditionPattern: /kidney|ckd|renal|chronic kidney/i,
        flaggedTerms: ['nsaid', 'ibuprofen', 'naproxen', 'diclofenac', 'aspirin high.?dose', 'nephrotoxic'],
        severity: 'contraindicated',
    },
    {
        conditionPattern: /liver|hepat|cirrhosis|fatty liver/i,
        flaggedTerms: ['paracetamol high.?dose', 'acetaminophen', 'methotrexate', 'statins', 'hepatotoxic'],
        severity: 'caution',
    },
    {
        conditionPattern: /pregnant|pregnancy/i,
        flaggedTerms: ['nsaid', 'ibuprofen', 'tetracycline', 'doxycycline', 'warfarin', 'methotrexate', 'thalidomide'],
        severity: 'contraindicated',
    },
    {
        conditionPattern: /diabetes|diabetic/i,
        flaggedTerms: ['corticosteroid', 'steroid', 'prednisolone', 'dexamethasone'],
        severity: 'caution',
    },
    {
        conditionPattern: /hypertension|high blood pressure/i,
        flaggedTerms: ['licorice', 'mulethi', 'decongestant', 'pseudoephedrine', 'phenylephrine'],
        severity: 'caution',
    },
    {
        conditionPattern: /epilepsy|seizure|epileptic/i,
        flaggedTerms: ['tramadol', 'bupropion', 'mefloquine', 'quinolone', 'fluoroquinolone'],
        severity: 'caution',
    },
    {
        conditionPattern: /gout|uric acid/i,
        flaggedTerms: ['aspirin low.?dose', 'thiazide', 'diuretic', 'loop diuretic', 'furosemide'],
        severity: 'caution',
    },
];

// ─── Core Filter Functions ────────────────────────────────────────────────────

/**
 * Expands an allergen string to include class-related synonyms.
 * e.g. "penicillin" → ["penicillin", "amoxicillin", "ampicillin", ...]
 */
function expandAllergen(allergen: string): string[] {
    const base = allergen.toLowerCase().trim();
    const expansions = ALLERGY_CLASS_EXPANSIONS[base] || [];
    return [base, ...expansions];
}

/**
 * Checks whether a chunk's content contains any contraindicated terms
 * for the patient's known conditions.
 */
function checkContraindications(
    chunkContent: string,
    conditions: string[]
): 'contraindicated' | 'caution' | null {
    if (!conditions.length) return null;

    const lower = chunkContent.toLowerCase();
    const conditionText = conditions.join(' ');

    for (const rule of CONTRAINDICATION_RULES) {
        if (!rule.conditionPattern.test(conditionText)) continue;
        for (const term of rule.flaggedTerms) {
            if (new RegExp(term, 'i').test(lower)) {
                return rule.severity;
            }
        }
    }
    return null;
}

/**
 * Main filter — annotates each retrieved chunk with a safetyFlag.
 *
 * Flagged chunks are NOT removed from the context.
 * They are passed to the LLM with an explicit [SAFETY FLAG] annotation
 * so the model knows to warn rather than recommend.
 *
 * @param chunks      Retrieved knowledge base chunks.
 * @param allergies   Patient's known allergens.
 * @param conditions  Patient's known conditions.
 */
export function applyAllergyFilter(
    chunks: RetrievedChunk[],
    allergies: string[],
    conditions: string[]
): RetrievedChunk[] {
    if (!chunks.length) return chunks;

    const expandedAllergens = allergies.flatMap(expandAllergen);

    return chunks.map(chunk => {
        const lower = chunk.content.toLowerCase();

        // Check allergy risk first (highest priority)
        const hasAllergyMatch = expandedAllergens.some(term =>
            lower.includes(term.toLowerCase())
        );
        if (hasAllergyMatch) {
            return { ...chunk, safetyFlag: 'allergy_risk' };
        }

        // Check condition-based contraindications
        const contraFlag = checkContraindications(chunk.content, conditions);
        if (contraFlag) {
            return { ...chunk, safetyFlag: contraFlag };
        }

        return { ...chunk, safetyFlag: null };
    });
}

/**
 * Serialises filtered chunks to a string for injection into the system prompt.
 * Flagged chunks receive a prominent [SAFETY FLAG] header so the LLM
 * treats them as warnings, not recommendations.
 */
export function serialiseFilteredChunks(chunks: RetrievedChunk[]): string {
    return chunks
        .map(chunk => {
            if (!chunk.safetyFlag) return chunk.content;

            const flagHeader =
                chunk.safetyFlag === 'allergy_risk'
                    ? '[SAFETY FLAG: allergy_risk — This chunk describes a substance that matches the patient\'s known allergens. Do NOT recommend it. Use it only to explain why it is avoided and suggest a safe alternative.]'
                    : chunk.safetyFlag === 'contraindicated'
                        ? '[SAFETY FLAG: contraindicated — This treatment is contraindicated by the patient\'s medical conditions. Flag this risk explicitly. Do NOT recommend without physician approval.]'
                        : '[SAFETY FLAG: caution — Use this information carefully. Mention the caution to the patient and recommend they verify with their physician before use.]';

            return `${flagHeader}\n${chunk.content}`;
        })
        .join('\n\n---\n\n');
}

/**
 * Quick helper — returns true if any chunk in the set is flagged.
 * Useful for deciding whether to inject an extra safety disclaimer.
 */
export function hasAnyFlaggedChunk(chunks: RetrievedChunk[]): boolean {
    return chunks.some(c => c.safetyFlag != null && c.safetyFlag !== null);
}
