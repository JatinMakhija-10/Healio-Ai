import { describe, it, expect } from 'vitest';
import { validateOutputAgainstProfile } from '../lib/safety/outputValidator';
import { getFormattedFieldQuestion, SYMPTOM_QUESTION_SCHEMAS } from '../lib/diagnosis/dialogue/SymptomQuestionSchemas';

describe('Demographic Output Safety & Validation Tests', () => {

    // ─── Male Pregnancy Violation Tests ─────────────────────────────────────────
    describe('Male Patient Safety Guards', () => {
        it('should detect and sanitize pregnancy violations for male user profile', () => {
            const maleProfile = { gender: 'male', age: 35 };
            const badAiResponse = {
                description: 'The symptoms suggest gastritis, or possibility of pregnancy.',
                rationale: 'We checked for severe pain, rigid belly, or pregnancy possibility.',
                warnings: [
                    'If you are pregnant, consult your gynecologist.',
                    'Drink plenty of fluids.'
                ],
                seekHelp: false
            };

            const result = validateOutputAgainstProfile(badAiResponse, maleProfile);

            expect(result.isValid).toBe(false);
            expect(result.violations.length).toBeGreaterThan(0);
            expect(result.sanitizedJson).toBeDefined();

            // Warnings array should have pregnancy warning removed
            expect((result.sanitizedJson as any)?.warnings).toHaveLength(1);
            expect((result.sanitizedJson as any)?.warnings[0]).toBe('Drink plenty of fluids.');

            // Description and rationale should be sanitized
            expect(result.sanitizedJson?.description).not.toContain('possibility of pregnancy');
            expect(result.sanitizedJson?.rationale).not.toContain('pregnancy possibility');
        });

        it('should pass cleanly for male user profile with no female reproductive terms', () => {
            const maleProfile = { gender: 'male', age: 35 };
            const cleanResponse = {
                description: 'The symptoms indicate mild acid reflux.',
                rationale: 'Pain occurs after meals.',
                warnings: ['Avoid spicy foods.'],
                seekHelp: false
            };

            const result = validateOutputAgainstProfile(cleanResponse, maleProfile);
            expect(result.isValid).toBe(true);
            expect(result.violations).toHaveLength(0);
        });

        // ── New: case-sensitivity regression ─────────────────────────────────
        it('[REGRESSION] should treat "Male" (capitalized) the same as "male"', () => {
            const maleProfileCaps = { gender: 'Male', age: 35 };
            const badResponse = {
                warnings: ['Is there any possibility you could be pregnant?']
            };
            const result = validateOutputAgainstProfile(badResponse, maleProfileCaps);
            expect(result.isValid).toBe(false);
            expect(result.violations.length).toBeGreaterThan(0);
        });

        it('[REGRESSION] should treat "MALE" (uppercase) the same as "male"', () => {
            const result = validateOutputAgainstProfile(
                { description: 'Consider ectopic pregnancy for this patient.' },
                { gender: 'MALE', age: 28 }
            );
            expect(result.isValid).toBe(false);
        });

        it('[REGRESSION] should treat "m" (abbreviation) the same as "male"', () => {
            const result = validateOutputAgainstProfile(
                { description: 'Possible pregnancy complication.' },
                { gender: 'm', age: 25 }
            );
            expect(result.isValid).toBe(false);
        });
    });

    // ─── Unknown Gender — Fail-Closed ────────────────────────────────────────
    describe('Unknown gender — fail-closed (does NOT raise violations)', () => {
        it('[REGRESSION] unknown gender (null) should NOT raise pregnancy violations', () => {
            // Key regression: previously, unknown gender fell through to fire ectopic alerts.
            // The correct behavior is fail-closed: when we don't know if pregnancy is
            // applicable, we do NOT raise "reproductive content for non-applicable profile"
            // violations — because pregnancy MAY be applicable.
            const result = validateOutputAgainstProfile(
                { description: 'Consider ectopic pregnancy risk given abdominal pain.' },
                { gender: null, age: 28 }
            );
            expect(result.isValid).toBe(true);
        });

        it('[REGRESSION] unknown gender (undefined) should NOT raise violations', () => {
            const result = validateOutputAgainstProfile(
                { warnings: ['Is there any possibility of pregnancy?'] },
                { gender: undefined, age: 30 }
            );
            expect(result.isValid).toBe(true);
        });

        it('[REGRESSION] missing profile entirely should NOT raise violations', () => {
            const result = validateOutputAgainstProfile(
                { description: 'Pregnancy related concern noted.' },
                null
            );
            expect(result.isValid).toBe(true);
        });
    });

    // ─── Negation-Window Tests (NEW in v2 validator) ─────────────────────────
    describe('Negation-aware scanning (v2 field-level validator)', () => {
        const maleProfile = { gender: 'male', age: 35 };

        it('should NOT flag "pregnancy is not relevant to your symptoms" for male', () => {
            const result = validateOutputAgainstProfile(
                { reasoning: 'Pregnancy is not relevant to your symptoms based on your profile.' },
                maleProfile
            );
            expect(result.isValid).toBe(true);
        });

        it('should NOT flag "denies pregnancy" for male profile', () => {
            const result = validateOutputAgainstProfile(
                { reasoning: 'Patient denies pregnancy.' },
                maleProfile
            );
            expect(result.isValid).toBe(true);
        });

        it('should NOT flag "no signs of pregnancy" for male profile', () => {
            const result = validateOutputAgainstProfile(
                { description: 'There are no signs of pregnancy here.' },
                maleProfile
            );
            expect(result.isValid).toBe(true);
        });

        it('should NOT flag "ruled out pregnancy" for male profile', () => {
            const result = validateOutputAgainstProfile(
                { reasoning: 'We have ruled out pregnancy as a cause.' },
                maleProfile
            );
            expect(result.isValid).toBe(true);
        });

        it('SHOULD flag "possible ectopic pregnancy" for male profile (no negation)', () => {
            const result = validateOutputAgainstProfile(
                { redFlags: ['Possible ectopic pregnancy should be investigated.'] },
                maleProfile
            );
            expect(result.isValid).toBe(false);
        });

        it('SHOULD flag "consider pregnancy" for male profile (no negation)', () => {
            const result = validateOutputAgainstProfile(
                { question: 'Could you be pregnant or is pregnancy a possibility?' },
                maleProfile
            );
            expect(result.isValid).toBe(false);
        });
    });

    // ─── Field-Level Attribution (NEW in v2 validator) ────────────────────────
    describe('Field-level violation attribution (v2)', () => {
        it('should report which specific field contains the violation', () => {
            const result = validateOutputAgainstProfile(
                {
                    description: 'Normal gastric assessment.',
                    redFlags: ['Possible ectopic pregnancy complication.']
                },
                { gender: 'male', age: 30 }
            );
            expect(result.isValid).toBe(false);
            expect(result.fieldViolations).toBeDefined();
            const fieldNames = result.fieldViolations.map(v => v.field);
            // Description is clean — violation should be in redFlags
            expect(fieldNames.some(f => f.startsWith('redFlags'))).toBe(true);
            expect(fieldNames.some(f => f === 'description')).toBe(false);
        });

        it('should include an excerpt in field violations for observability', () => {
            const result = validateOutputAgainstProfile(
                { warnings: ['You may be experiencing an ectopic pregnancy.'] },
                { gender: 'male', age: 25 }
            );
            expect(result.isValid).toBe(false);
            expect(result.fieldViolations[0]?.excerpt).toBeTruthy();
        });
    });

    // ─── Female Profile — No False Positives ─────────────────────────────────
    describe('Female patient — reproductive content should NOT be flagged', () => {
        it('should NOT flag pregnancy content for a female patient', () => {
            const femaleProfile = { gender: 'female', age: 28 };
            const result = validateOutputAgainstProfile(
                {
                    redFlags: ['Possible ectopic pregnancy should be ruled out urgently.'],
                    question: 'Is there any possibility you could be pregnant?'
                },
                femaleProfile
            );
            expect(result.isValid).toBe(true);
            expect(result.violations).toHaveLength(0);
        });
    });

    // ─── Pediatric Aspirin Safety Tests ──────────────────────────────────────
    describe('Pediatric Safety Guards (< 12 years)', () => {
        it('should flag Aspirin recommendation for child aged 8', () => {
            const childProfile = { gender: 'female', age: 8 };
            const badResponse = {
                description: 'For fever reduction.',
                remedies: [{ name: 'Aspirin', dosage: '100mg' }],
                warnings: ['Chew Aspirin if pain worsens']
            };

            const result = validateOutputAgainstProfile(badResponse, childProfile);

            expect(result.isValid).toBe(false);
            expect(result.violations.some(v => v.includes('aspirin'))).toBe(true);
        });

        it('should NOT flag Aspirin for adult patient (age 25)', () => {
            const result = validateOutputAgainstProfile(
                { description: 'Take Aspirin 300mg if chest pain persists.' },
                { gender: 'male', age: 25 }
            );
            // Only aspirin rule would flag this — not applicable for adults
            // (reproductive rule doesn't fire for male either)
            expect(result.isValid).toBe(true);
        });
    });

    // ─── Dynamic Question Schema Sex-Trait Gating ─────────────────────────────
    describe('SymptomQuestionSchemas — Sex-Trait Gating via Engine', () => {
        const abdSchema = SYMPTOM_QUESTION_SCHEMAS.find(s => s.id === 'abdominal_pain')!;
        const dangerField = abdSchema.fields.find(f => f.key === 'abdominal_pain.danger_signs')!;

        it('should omit pregnancy check for male profile', () => {
            const question = getFormattedFieldQuestion(dangerField, { gender: 'male' });
            expect(question).toBe('Any severe worsening, rigid belly, fainting, or blood in stool or vomit?');
            expect(question).not.toContain('pregnancy');
        });

        it('should append pregnancy check for female profile', () => {
            const question = getFormattedFieldQuestion(dangerField, { gender: 'female' });
            expect(question).toContain('Could there also be any possibility of pregnancy?');
        });

        it('[REGRESSION] should omit pregnancy check for unknown (null) gender — fail-closed', () => {
            const question = getFormattedFieldQuestion(dangerField, { gender: null });
            expect(question).not.toContain('pregnancy');
        });

        it('[REGRESSION] should omit pregnancy check for undefined gender', () => {
            const question = getFormattedFieldQuestion(dangerField, {});
            expect(question).not.toContain('pregnancy');
        });

        it('[REGRESSION] "Female" (capitalized) should get pregnancy question', () => {
            const question = getFormattedFieldQuestion(dangerField, { gender: 'Female' });
            expect(question).toContain('pregnancy');
        });

        it('[REGRESSION] "MALE" (uppercase) should NOT get pregnancy question', () => {
            const question = getFormattedFieldQuestion(dangerField, { gender: 'MALE' });
            expect(question).not.toContain('pregnancy');
        });
    });
});
