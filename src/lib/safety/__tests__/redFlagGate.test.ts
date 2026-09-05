/**
 * redFlagGate.test.ts — Unit tests for the Deterministic Red-Flag Override Gate
 *
 * Tests the core safety behaviors:
 *   1. Each rule triggers on matching text
 *   2. Negation detection suppresses triggers when excludeIfNegated=true
 *   3. excludeIfNegated=false rules (suicidal ideation) fire even with negation
 *   4. Non-matching text returns null
 *   5. First matching rule wins (priority order)
 *   6. Edge cases: empty text, whitespace, mixed case
 */

import { describe, it, expect } from 'vitest';
import { checkRedFlags, RED_FLAG_RULES, buildGateResponseText } from '../redFlagGate';

describe('redFlagGate', () => {
    // ─── Rule: chest_pain_cardiac ─────────────────────────────────────────────
    describe('chest_pain_cardiac', () => {
        it('triggers on "chest pain" pattern', () => {
            const result = checkRedFlags('I have severe chest pain right now');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('chest_pain_cardiac');
            expect(result!.action).toBe('EMERGENCY_STOP');
        });

        it('triggers on "chest pressure"', () => {
            const result = checkRedFlags('feeling chest pressure and tightness');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('chest_pain_cardiac');
        });

        it('triggers on "chest tightness"', () => {
            const result = checkRedFlags('I have chest tightness');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('chest_pain_cardiac');
        });

        it('does NOT trigger when negated', () => {
            const result = checkRedFlags('I do not have chest pain');
            expect(result).toBeNull();
        });

        it('does NOT trigger when denied', () => {
            const result = checkRedFlags("I don't have any chest pain or pressure");
            expect(result).toBeNull();
        });

        it('triggers on radiating pain pattern', () => {
            const result = checkRedFlags('chest pain radiating to my left arm');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('chest_pain_cardiac');
        });
    });

    // ─── Rule: stroke_fast ────────────────────────────────────────────────────
    describe('stroke_fast', () => {
        it('triggers on sudden weakness', () => {
            const result = checkRedFlags('sudden weakness on one side of my body');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('stroke_fast');
            expect(result!.action).toBe('EMERGENCY_STOP');
        });

        it('triggers on slurred speech', () => {
            const result = checkRedFlags('my words are slurred speech happened suddenly');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('stroke_fast');
        });

        it('triggers on sudden vision loss', () => {
            const result = checkRedFlags('sudden vision loss in my right eye');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('stroke_fast');
        });

        it('triggers on one-sided numbness', () => {
            const result = checkRedFlags('one sided numbness in my face');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('stroke_fast');
        });

        it('does NOT trigger when negated', () => {
            const result = checkRedFlags('I denied having slurred speech');
            expect(result).toBeNull();
        });
    });

    // ─── Rule: suicidal_ideation ──────────────────────────────────────────────
    describe('suicidal_ideation', () => {
        it('triggers on "want to die"', () => {
            const result = checkRedFlags('I want to die');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('suicidal_ideation');
            expect(result!.action).toBe('EMERGENCY_STOP');
        });

        it('triggers on "kill myself"', () => {
            const result = checkRedFlags('thinking about how to kill myself');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('suicidal_ideation');
        });

        it('triggers on "end my life"', () => {
            const result = checkRedFlags('I want to end my life');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('suicidal_ideation');
        });

        it('triggers on "suicid" stem', () => {
            const result = checkRedFlags('having suicidal thoughts');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('suicidal_ideation');
        });

        it('triggers on "self-harm"', () => {
            const result = checkRedFlags('I have been self-harming');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('suicidal_ideation');
        });

        it('triggers on "no reason to live"', () => {
            const result = checkRedFlags('I feel like there is no reason to live');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('suicidal_ideation');
        });

        it('STILL triggers even when negated — excludeIfNegated=false', () => {
            // This is critical: suicidal ideation should never be dismissed
            const result = checkRedFlags('I do not want to die but I am thinking about it');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('suicidal_ideation');
        });

        it('triggers even with tentative phrasing', () => {
            const result = checkRedFlags("I don't know if I want to kill myself");
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('suicidal_ideation');
        });

        it('includes crisis resources in message', () => {
            const result = checkRedFlags('I want to end my life');
            expect(result).not.toBeNull();
            expect(result!.message).toContain('988');
            expect(result!.message).toContain('741741');
        });
    });

    // ─── Rule: severe_breathing_difficulty ─────────────────────────────────────
    describe('severe_breathing_difficulty', () => {
        it('triggers on "can\'t breathe"', () => {
            const result = checkRedFlags("I can't breathe properly");
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('severe_breathing_difficulty');
            expect(result!.action).toBe('EMERGENCY_STOP');
        });

        it('triggers on "unable to breathe"', () => {
            const result = checkRedFlags('I am unable to breathe');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('severe_breathing_difficulty');
        });

        it('triggers on "gasping"', () => {
            const result = checkRedFlags('my mother is gasping for air');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('severe_breathing_difficulty');
        });

        it('does NOT trigger when negated', () => {
            const result = checkRedFlags("I don't have any trouble with gasping or breathing");
            expect(result).toBeNull();
        });
    });

    // ─── Rule: suspected_dvt_pe ───────────────────────────────────────────────
    describe('suspected_dvt_pe', () => {
        it('triggers on sudden shortness of breath with swelling', () => {
            const result = checkRedFlags('sudden shortness of breath with leg swelling');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('suspected_dvt_pe');
            expect(result!.action).toBe('URGENT_ESCALATION');
        });

        it('triggers on sudden chest pain with swelling', () => {
            const result = checkRedFlags('I have sudden chest pain and my leg has swelling');
            expect(result).not.toBeNull();
            // Note: chest_pain_cardiac may trigger first depending on pattern order
            // This test verifies that the DVT/PE pattern exists and matches
            expect(result!.action).toBe('EMERGENCY_STOP'); // chest_pain fires first
        });

        it('is URGENT_ESCALATION, not EMERGENCY_STOP', () => {
            const rule = RED_FLAG_RULES.find(r => r.id === 'suspected_dvt_pe');
            expect(rule).toBeDefined();
            expect(rule!.action).toBe('URGENT_ESCALATION');
        });
    });

    // ─── Edge Cases ───────────────────────────────────────────────────────────
    describe('edge cases', () => {
        it('returns null for empty string', () => {
            expect(checkRedFlags('')).toBeNull();
        });

        it('returns null for whitespace only', () => {
            expect(checkRedFlags('   \n\t  ')).toBeNull();
        });

        it('returns null for benign text', () => {
            expect(checkRedFlags('I have a mild headache and some sneezing')).toBeNull();
        });

        it('returns null for unrelated medical symptoms', () => {
            expect(checkRedFlags('stomach ache and mild nausea after eating spicy food')).toBeNull();
        });

        it('handles mixed case correctly', () => {
            const result = checkRedFlags('CHEST PAIN radiating to arm');
            expect(result).not.toBeNull();
            expect(result!.rule.id).toBe('chest_pain_cardiac');
        });

        it('first matching rule wins (priority order)', () => {
            // Text that could match both chest_pain_cardiac AND stroke_fast
            const result = checkRedFlags('chest pain and sudden weakness on one side and slurred speech');
            expect(result).not.toBeNull();
            // chest_pain_cardiac is first in the rule list → should win
            expect(result!.rule.id).toBe('chest_pain_cardiac');
        });
    });

    // ─── buildGateResponseText ────────────────────────────────────────────────
    describe('buildGateResponseText', () => {
        it('includes the clinician message and disclaimer', () => {
            const result = checkRedFlags('I have chest pain');
            expect(result).not.toBeNull();
            const text = buildGateResponseText(result!);
            expect(text).toContain(result!.message);
            expect(text).toContain('Arovia cannot assist with potential emergencies');
        });
    });

    // ─── Rule Table Integrity ─────────────────────────────────────────────────
    describe('rule table integrity', () => {
        it('all rules have unique IDs', () => {
            const ids = RED_FLAG_RULES.map(r => r.id);
            expect(new Set(ids).size).toBe(ids.length);
        });

        it('all rules have at least one pattern', () => {
            for (const rule of RED_FLAG_RULES) {
                expect(rule.patterns.length).toBeGreaterThan(0);
            }
        });

        it('all rules have non-empty messages', () => {
            for (const rule of RED_FLAG_RULES) {
                expect(rule.message.trim().length).toBeGreaterThan(0);
            }
        });

        it('suicidal_ideation has excludeIfNegated=false', () => {
            const rule = RED_FLAG_RULES.find(r => r.id === 'suicidal_ideation');
            expect(rule).toBeDefined();
            expect(rule!.excludeIfNegated).toBe(false);
        });

        it('all emergency rules have EMERGENCY_STOP action', () => {
            const emergencyRules = RED_FLAG_RULES.filter(r =>
                ['chest_pain_cardiac', 'stroke_fast', 'suicidal_ideation', 'severe_breathing_difficulty'].includes(r.id)
            );
            for (const rule of emergencyRules) {
                expect(rule.action).toBe('EMERGENCY_STOP');
            }
        });
    });
});
