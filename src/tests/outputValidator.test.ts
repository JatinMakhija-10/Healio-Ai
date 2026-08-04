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
            expect(result.sanitizedJson?.warnings).toHaveLength(1);
            expect(result.sanitizedJson?.warnings[0]).toBe('Drink plenty of fluids.');

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
    });

    // ─── Pediatric Aspirin Safety Tests ──────────────────────────────────────────
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
            expect(result.violations.some(v => v.includes('Aspirin'))).toBe(true);
        });
    });

    // ─── Dynamic Question Schema Sex-Trait Gating ────────────────────────────────
    describe('SymptomQuestionSchemas Sex-Trait Gating', () => {
        const abdSchema = SYMPTOM_QUESTION_SCHEMAS.find(s => s.id === 'abdominal_pain')!;
        const dangerField = abdSchema.fields.find(f => f.key === 'abdominal_pain.danger_signs')!;

        it('should omit pregnancy check from danger signs for male profile', () => {
            const maleProfile = { gender: 'male', age: 30 };
            const question = getFormattedFieldQuestion(dangerField, maleProfile);

            expect(question).toBe('Any severe worsening, rigid belly, fainting, or blood in stool or vomit?');
            expect(question).not.toContain('pregnancy');
        });

        it('should append pregnancy check to danger signs for female profile', () => {
            const femaleProfile = { gender: 'female', age: 28 };
            const question = getFormattedFieldQuestion(dangerField, femaleProfile);

            expect(question).toContain('Could there also be any possibility of pregnancy?');
        });
    });
});
