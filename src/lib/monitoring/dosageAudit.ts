/**
 * dosageAudit.ts — Dosage Claim Extractor
 *
 * Extracts dosage recommendations (e.g. "metformin 500mg", "paracetamol 650 mg")
 * from generated LLM responses to audit for potential dosing hallucinations.
 */

export interface DosageClaim {
    amount: number;
    unit: string;
    drug: string;
}

const COMMON_NON_DRUG_WORDS = new Set([
    'take', 'dose', 'water', 'every', 'daily', 'times', 'hours', 'with', 'after', 'before', 
    'morning', 'night', 'day', 'week', 'tablet', 'tablets', 'capsule', 'capsules', 'pill', 'pills',
    'drop', 'drops', 'spoon', 'spoons', 'glass', 'glasses', 'cup', 'cups', 'warm', 'cold', 'hot',
    'food', 'milk', 'meal', 'meals', 'about', 'approximately', 'maximum', 'minimum', 'recommended',
    'and', 'or', 'but', 'the', 'a', 'an', 'to', 'for', 'of', 'in', 'on', 'at', 'by', 'about',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'please', 'prescribe', 'recommend', 'from', 'this', 'that', 'these', 'those', 'then', 'than',
    'so', 'if', 'not', 'no', 'only', 'just'
]);

/**
 * Parses LLM response text and extracts structured dosage claims.
 * Matches patterns like "Metformin 500mg" or "500 mg of Metformin".
 */
export function extractDosageClaims(response: string): DosageClaim[] {
    const claims: DosageClaim[] = [];
    if (!response) return claims;

    // Regex 1: [drug] [amount][space]?[unit]
    // Regex 2: [amount][space]?[unit] of [drug]
    const dosageRegex = /\b([a-zA-Z]{3,25})\b\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|tablets?|capsules?|pills?|drops?|spoons?)\b/gi;
    const dosageOfRegex = /\b(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|tablets?|capsules?|pills?|drops?|spoons?)\s+of\s+\b([a-zA-Z]{3,25})\b/gi;

    let match;

    // Reset regex indices
    dosageRegex.lastIndex = 0;
    dosageOfRegex.lastIndex = 0;

    // Match [drug] [amount] [unit]
    while ((match = dosageRegex.exec(response)) !== null) {
        const drug = match[1];
        const amount = parseFloat(match[2]);
        const unit = match[3].toLowerCase();

        if (!COMMON_NON_DRUG_WORDS.has(drug.toLowerCase())) {
            claims.push({
                drug,
                amount,
                unit,
            });
        }
    }

    // Match [amount] [unit] of [drug]
    while ((match = dosageOfRegex.exec(response)) !== null) {
        const amount = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        const drug = match[3];

        if (!COMMON_NON_DRUG_WORDS.has(drug.toLowerCase())) {
            claims.push({
                drug,
                amount,
                unit,
            });
        }
    }

    return claims;
}
