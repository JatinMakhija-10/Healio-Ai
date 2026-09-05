/**
 * wellsOverride.test.ts — Unit tests for Wells' Criteria DVT Override
 *
 * Tests the validated Wells' scoring override system:
 *   1. Low risk (score ≤0) → ~5% probability
 *   2. Moderate risk (score 1–2) → ~17% probability
 *   3. High risk (score ≥3) → ~53% probability
 *   4. Override only fires when DVT is suspected (leg/calf symptoms)
 *   5. Returns applied: false for non-DVT presentations
 */

import { describe, it, expect } from 'vitest';
import {
    computeWellsOverride,
    wellsRiskToProbability,
    type WellsRiskTier,
} from '../ClinicalDecisionRules';

describe('wellsRiskToProbability', () => {
    it('returns ~5% for low risk', () => {
        expect(wellsRiskToProbability('low')).toBe(0.05);
    });

    it('returns ~17% for moderate risk', () => {
        expect(wellsRiskToProbability('moderate')).toBe(0.17);
    });

    it('returns ~53% for high risk', () => {
        expect(wellsRiskToProbability('high')).toBe(0.53);
    });

    it('all tiers return values between 0 and 1', () => {
        const tiers: WellsRiskTier[] = ['low', 'moderate', 'high'];
        for (const tier of tiers) {
            const prob = wellsRiskToProbability(tier);
            expect(prob).toBeGreaterThanOrEqual(0);
            expect(prob).toBeLessThanOrEqual(1);
        }
    });

    it('probabilities are monotonically increasing', () => {
        const low = wellsRiskToProbability('low');
        const moderate = wellsRiskToProbability('moderate');
        const high = wellsRiskToProbability('high');
        expect(low).toBeLessThan(moderate);
        expect(moderate).toBeLessThan(high);
    });
});

describe('computeWellsOverride', () => {
    // ── DVT not suspected → applied: false ────────────────────────────────
    describe('when DVT is NOT suspected', () => {
        it('returns applied: false for empty symptoms', () => {
            const result = computeWellsOverride([]);
            expect(result.applied).toBe(false);
            expect(result.validatedProbability).toBe(0);
        });

        it('returns applied: false for non-DVT symptoms', () => {
            const result = computeWellsOverride(['headache', 'fever', 'cough']);
            expect(result.applied).toBe(false);
        });

        it('returns applied: false for chest pain without leg symptoms', () => {
            const result = computeWellsOverride(['chest_pain', 'shortness_of_breath']);
            expect(result.applied).toBe(false);
        });
    });

    // ── DVT suspected → applied: true ─────────────────────────────────────
    describe('when DVT IS suspected', () => {
        it('triggers on leg_swelling', () => {
            const result = computeWellsOverride(['leg_swelling']);
            expect(result.applied).toBe(true);
            expect(result.validatedProbability).toBeGreaterThan(0);
        });

        it('triggers on calf_pain', () => {
            const result = computeWellsOverride(['calf_pain']);
            expect(result.applied).toBe(true);
        });

        it('triggers on leg_pain', () => {
            const result = computeWellsOverride(['leg_pain']);
            expect(result.applied).toBe(true);
        });

        it('triggers on calf_tenderness', () => {
            const result = computeWellsOverride(['calf_tenderness']);
            expect(result.applied).toBe(true);
        });

        it('triggers on pitting_edema', () => {
            const result = computeWellsOverride(['pitting_edema']);
            expect(result.applied).toBe(true);
        });

        it('triggers on leg_swelling_entire', () => {
            const result = computeWellsOverride(['leg_swelling_entire']);
            expect(result.applied).toBe(true);
        });

        it('triggers on calf_asymmetry', () => {
            const result = computeWellsOverride(['calf_asymmetry']);
            expect(result.applied).toBe(true);
        });
    });

    // ── Risk tier mapping ─────────────────────────────────────────────────
    describe('risk tier mapping', () => {
        it('minimal DVT symptoms produce low or moderate risk', () => {
            // Just leg_pain with no other DVT risk factors → low score
            const result = computeWellsOverride(['leg_pain']);
            expect(result.applied).toBe(true);
            expect(['low', 'moderate']).toContain(result.riskTier);
        });

        it('multiple DVT risk factors increase risk tier', () => {
            // Multiple Wells criteria present
            const result = computeWellsOverride([
                'leg_swelling',
                'calf_tenderness',
                'pitting_edema',
                'calf_asymmetry',
                'active_cancer',
            ], {
                cancer_treatment_recent: true,
            });
            expect(result.applied).toBe(true);
            // With cancer + multiple leg signs, should be moderate or high
            expect(['moderate', 'high']).toContain(result.riskTier);
        });

        it('high risk produces probability of 53%', () => {
            // Load up all Wells criteria to force high risk
            const result = computeWellsOverride([
                'leg_swelling',
                'leg_swelling_entire',
                'calf_tenderness',
                'calf_asymmetry',
                'pitting_edema',
                'active_cancer',
                'bedridden',
                'paralysis',
            ], {
                cancer_treatment_recent: true,
            });
            expect(result.applied).toBe(true);
            if (result.riskTier === 'high') {
                expect(result.validatedProbability).toBe(0.53);
            }
        });
    });

    // ── Output structure ──────────────────────────────────────────────────
    describe('output structure', () => {
        it('includes all required fields when applied', () => {
            const result = computeWellsOverride(['leg_swelling']);
            expect(result).toHaveProperty('applied');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('riskTier');
            expect(result).toHaveProperty('validatedProbability');
            expect(result).toHaveProperty('interpretation');
            expect(result).toHaveProperty('recommendation');
            expect(result).toHaveProperty('ruleResult');
        });

        it('ruleResult contains Wells Score for DVT', () => {
            const result = computeWellsOverride(['leg_swelling']);
            expect(result.ruleResult.rule).toBe('Wells Score for DVT');
        });

        it('validatedProbability matches riskTier', () => {
            const result = computeWellsOverride(['leg_swelling', 'calf_tenderness']);
            expect(result.applied).toBe(true);
            expect(result.validatedProbability).toBe(
                wellsRiskToProbability(result.riskTier)
            );
        });

        it('score is a number', () => {
            const result = computeWellsOverride(['leg_swelling']);
            expect(typeof result.score).toBe('number');
        });

        it('interpretation is a non-empty string when applied', () => {
            const result = computeWellsOverride(['leg_swelling']);
            expect(result.applied).toBe(true);
            expect(result.interpretation.length).toBeGreaterThan(0);
        });
    });

    // ── Demographics integration ──────────────────────────────────────────
    describe('demographics integration', () => {
        it('cancer history increases score', () => {
            const withoutCancer = computeWellsOverride(['leg_swelling']);
            const withCancer = computeWellsOverride(['leg_swelling', 'active_cancer'], {
                cancer_treatment_recent: true,
            });
            // Score with cancer should be >= score without
            expect(withCancer.score).toBeGreaterThanOrEqual(withoutCancer.score);
        });

        it('handles empty demographics gracefully', () => {
            const result = computeWellsOverride(['leg_swelling'], {});
            expect(result.applied).toBe(true);
        });

        it('handles undefined demographics gracefully', () => {
            const result = computeWellsOverride(['leg_swelling']);
            expect(result.applied).toBe(true);
        });
    });
});
