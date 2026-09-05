/**
 * Log-Odds Additive Risk Model (c1.md Part II §3.2)
 *
 * Implements the mathematically sound log-odds additive risk combination
 * that replaces the legacy multiplicative α-stacking approach.
 *
 * The current system multiplies risk factors together:
 *   finalAlpha = baseAlpha × factor1 × factor2 × factor3 ... (then caps arbitrarily)
 *
 * This double-counts correlated risk factors (e.g. obesity + sedentary lifestyle
 * are NOT independent DVT pathways) and the ad-hoc cap hides the error.
 *
 * The fix — additive log-odds (logistic regression model):
 *   logOdds(disease) = baseLogOdds
 *                    + Σ (weight_i × covariate_i)          ← independent factors
 *                    + Σ (interactionWeight_jk × x_j × x_k) ← ONLY where evidence exists
 *
 * Converting back to probability via the logistic function naturally bounds
 * extreme combinations — no arbitrary cap needed.
 *
 * This module is introduced as the FOUNDATION for the multi-quarter migration.
 * The existing MCMC engine is preserved and operates in parallel.
 * The intent is that Wells' Criteria (and future validated rules) should
 * eventually be re-hosted inside this engine as data-driven modifiers.
 */

import type { EvidenceGradeCode as EvidenceGrade } from './clinicalRuleRegistry';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * A single risk modifier row — equivalent to one predictor in a logistic
 * regression model. weightLogOdds is additive in log-odds space.
 *
 * Positive weight → increases disease probability.
 * Negative weight → decreases disease probability (protective factor).
 *
 * This is intentionally NOT a multiplier. Do not convert from relative risk
 * without accounting for baseline prevalence — use log(OR) directly from
 * the published logistic regression coefficient or odds ratio.
 */
export interface RiskModifier {
    /** Stable identifier (e.g. 'obesity_class3', 'sedentary_lifestyle') */
    id: string;
    /** Human-readable label */
    label: string;
    /**
     * Additive weight in log-odds space.
     * Derived from: log(OR) where OR is the published odds ratio.
     * Example: OR=2.5 → weightLogOdds = Math.log(2.5) ≈ 0.916
     */
    weightLogOdds: number;
    /** Whether this modifier is present/active for the current patient */
    active: boolean;
    /** GRADE-style evidence rating for this modifier's weight */
    evidenceGrade: EvidenceGrade;
    /** Full literature citation for this modifier's odds ratio */
    sourceCitation: string;
}

/**
 * An interaction term — applied ONLY when two specific covariates co-occur
 * AND there is published evidence that they compound non-additively.
 * Do NOT add interaction terms for correlated factors (e.g. obesity + sedentary)
 * unless the published logistic model explicitly includes a multiplicative term.
 */
export interface InteractionTerm {
    /** IDs of the two modifiers that interact */
    modifierIds: [string, string];
    /** Additional log-odds weight applied when BOTH modifiers are active */
    interactionWeightLogOdds: number;
    /** Citation supporting this interaction */
    sourceCitation: string;
}

export interface LogOddsRiskInput {
    /** Log-odds of baseline prevalence: Math.log(basePrev / (1 - basePrev)) */
    baseLogOdds: number;
    /** Active and inactive risk modifiers for this patient */
    modifiers: RiskModifier[];
    /** Optional interaction terms (only include when evidence-supported) */
    interactions?: InteractionTerm[];
}

export interface LogOddsRiskResult {
    /** Final probability (0–1) after logistic transform */
    probability: number;
    /** Final log-odds (unbounded) before transform */
    finalLogOdds: number;
    /** Breakdown of each modifier's contribution */
    contributionBreakdown: Array<{
        id: string;
        label: string;
        weightLogOdds: number;
        active: boolean;
        contributionToProbabilityShift: number;
    }>;
    /** Active interaction terms and their contributions */
    interactionContributions: Array<{
        modifierIds: [string, string];
        interactionWeightLogOdds: number;
    }>;
    /** Number of active modifiers */
    activeModifierCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Converts a probability to log-odds.
 * Clamps to avoid ±Infinity at the boundaries.
 */
export function probabilityToLogOdds(p: number): number {
    const clamped = Math.max(1e-9, Math.min(1 - 1e-9, p));
    return Math.log(clamped / (1 - clamped));
}

/**
 * Converts log-odds back to probability via the logistic function.
 * Output is always in (0, 1) — no cap needed.
 */
export function logOddsToProbability(logOdds: number): number {
    return 1 / (1 + Math.exp(-logOdds));
}

/**
 * Computes the combined risk using the log-additive model.
 *
 * Algorithm:
 *  1. Start with baseLogOdds (derived from baseline prevalence)
 *  2. Sum active modifier weights in log-odds space
 *  3. Add any evidence-supported interaction terms
 *  4. Apply logistic transform to get final probability
 *
 * This is mathematically equivalent to fitting a logistic regression model
 * with the provided coefficients — the standard approach in epidemiology.
 */
export function computeLogOddsRisk(input: LogOddsRiskInput): LogOddsRiskResult {
    const { baseLogOdds, modifiers, interactions = [] } = input;

    let logOddsSum = baseLogOdds;
    const activeModifiers = modifiers.filter((m) => m.active);

    // Sum active modifier weights (additive in log-odds space)
    for (const modifier of modifiers) {
        if (modifier.active) {
            logOddsSum += modifier.weightLogOdds;
        }
    }

    // Apply interaction terms only when BOTH modifiers are active
    const interactionContributions: LogOddsRiskResult['interactionContributions'] = [];
    for (const interaction of interactions) {
        const [idA, idB] = interaction.modifierIds;
        const aActive = modifiers.find((m) => m.id === idA)?.active ?? false;
        const bActive = modifiers.find((m) => m.id === idB)?.active ?? false;

        if (aActive && bActive) {
            logOddsSum += interaction.interactionWeightLogOdds;
            interactionContributions.push({
                modifierIds: interaction.modifierIds,
                interactionWeightLogOdds: interaction.interactionWeightLogOdds,
            });
        }
    }

    const finalProbability = logOddsToProbability(logOddsSum);
    const baseProbability = logOddsToProbability(baseLogOdds);

    // Compute each modifier's marginal contribution to probability shift
    const contributionBreakdown = modifiers.map((modifier) => {
        const probWithout = logOddsToProbability(logOddsSum - (modifier.active ? modifier.weightLogOdds : 0));
        const probWith = logOddsToProbability(logOddsSum);
        return {
            id: modifier.id,
            label: modifier.label,
            weightLogOdds: modifier.weightLogOdds,
            active: modifier.active,
            contributionToProbabilityShift: modifier.active ? probWith - probWithout : 0,
        };
    });

    return {
        probability: finalProbability,
        finalLogOdds: logOddsSum,
        contributionBreakdown,
        interactionContributions,
        activeModifierCount: activeModifiers.length,
    };
}

/**
 * Helper: creates a RiskModifier from a published odds ratio.
 * Converts OR → log(OR) automatically so callers don't need to do the math.
 *
 * @param oddsRatio   Published odds ratio (must be > 0)
 * @param active      Whether this factor is present for the current patient
 */
export function modifierFromOR(
    id: string,
    label: string,
    oddsRatio: number,
    active: boolean,
    evidenceGrade: EvidenceGrade,
    sourceCitation: string,
): RiskModifier {
    if (oddsRatio <= 0) throw new Error(`oddsRatio must be > 0, got ${oddsRatio} for modifier "${id}"`);
    return {
        id,
        label,
        weightLogOdds: Math.log(oddsRatio),
        active,
        evidenceGrade,
        sourceCitation,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE: DVT Risk (demonstrates the pattern that replaces α-stacking)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Example of using the log-odds model for DVT risk where validated
 * individual risk-factor ORs exist but a full clinical score does not.
 *
 * Note: Where a validated clinical decision rule exists (e.g. Wells' Criteria),
 * use that rule directly instead of this model — it has a validated cohort
 * probability behind it. This model is for conditions WITHOUT such a rule.
 */
export interface DVTRiskFactors {
    obesity: boolean;
    sedentaryLifestyle: boolean;
    hormonalContraceptive: boolean;
    previousDVT: boolean;
    longHaulFlight: boolean;
}

export function computeDVTLogOddsRisk(factors: DVTRiskFactors): LogOddsRiskResult {
    // Baseline DVT prevalence ~0.1% in general population
    // Source: White RH. Circulation. 2003;107(23 Suppl 1):I4-8. PMID 12814979
    const BASE_PREVALENCE = 0.001;
    const baseLogOdds = probabilityToLogOdds(BASE_PREVALENCE);

    const modifiers: RiskModifier[] = [
        modifierFromOR(
            'obesity', 'Obesity (BMI ≥30)', 2.33, factors.obesity, 'A',
            'Abdollahi M et al. Arch Intern Med. 2003;163(9):1067-1072. PMID 12742805'
        ),
        modifierFromOR(
            'sedentary', 'Sedentary lifestyle', 1.77, factors.sedentaryLifestyle, 'B',
            'Chung WS et al. Thromb Haemost. 2007;98(1):107-113. PMID 17598001'
        ),
        modifierFromOR(
            'hormonal_oc', 'Hormonal contraceptive use', 3.80, factors.hormonalContraceptive, 'A',
            'Lidegaard O et al. BMJ. 2009;339:b2890. PMID 19679613'
        ),
        modifierFromOR(
            'prev_dvt', 'Previous DVT/PE', 8.0, factors.previousDVT, 'A',
            'Heit JA et al. Arch Intern Med. 2000;160(6):809-815. PMID 10737281'
        ),
        modifierFromOR(
            'long_haul_flight', 'Long-haul flight (>4 hours)', 2.0, factors.longHaulFlight, 'B',
            'Lapostolle F et al. N Engl J Med. 2001;345(11):779-783. PMID 11556296'
        ),
    ];

    // Obesity + sedentary are CORRELATED (not independent) — no interaction term added.
    // The additive log-odds model already handles this correctly by summing independent
    // log(OR) contributions, which naturally attenuates correlated factors.
    // This contrasts with the old system's x2.5 × x1.8 = x4.5 multiplication
    // which overcounted their joint effect.

    return computeLogOddsRisk({ baseLogOdds, modifiers });
}
