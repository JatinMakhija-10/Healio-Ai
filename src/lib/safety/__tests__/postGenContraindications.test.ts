/**
 * postGenContraindications.test.ts — Extensive unit tests for Post-Generation Contraindication Scanning
 *
 * Covers:
 *   1. Allergy filtering across all remedy arrays (remedies, ayurvedic_remedies, home_remedies, indianHomeRemedies)
 *   2. Allergy mentions in free text / prose fields
 *   3. DDI blocked remedy enforcement across all remedy arrays and prose
 *   4. Pediatric aspirin contraindication (< 12 years old)
 *   5. Reproductive applicability rules (female/male/unknown) & negation handling
 *   6. Edge cases: empty arrays, case sensitivity, partial matches, multi-allergen profiles
 */

import { describe, it, expect } from 'vitest';
import { validateOutputAgainstProfile } from '../outputValidator';

describe('Post-Generation Contraindication Scan', () => {
    // ── 1. Allergy Cross-Check Safety Rule ────────────────────────────────────
    describe('Allergy Cross-Check (c1.md §I.3.2)', () => {
        it('detects and sanitizes allergen in standard remedies array', () => {
            const output = {
                remedies: [
                    { name: 'Amoxicillin', dose: '500mg' },
                    { name: 'Paracetamol', dose: '500mg' }
                ],
                summary: 'Take medication after food.'
            };

            const result = validateOutputAgainstProfile(output, { allergies: ['Amoxicillin'] });

            expect(result.isValid).toBe(false);
            expect(result.fieldViolations).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        field: 'remedies[0]',
                        term: 'allergy:Amoxicillin'
                    })
                ])
            );

            // Sanitized JSON should have filtered out Amoxicillin
            const sanitizedRemedies = result.sanitizedJson?.remedies as Array<{ name: string }>;
            expect(sanitizedRemedies).toHaveLength(1);
            expect(sanitizedRemedies[0].name).toBe('Paracetamol');
        });

        it('detects and sanitizes allergen in ayurvedic_remedies and home_remedies arrays', () => {
            const output = {
                ayurvedic_remedies: [{ name: 'Ashwagandha powder', description: 'Take with milk' }],
                home_remedies: [{ name: 'Ginger Tea', description: 'Fresh ginger root tea' }],
                indianHomeRemedies: [{ name: 'Turmeric Milk', description: 'Warm milk with haldi' }]
            };

            const result = validateOutputAgainstProfile(output, { allergies: ['Ginger', 'Haldi'] });

            expect(result.isValid).toBe(false);

            const sanitizedHome = result.sanitizedJson?.home_remedies as Array<{ name: string }>;
            const sanitizedIndian = result.sanitizedJson?.indianHomeRemedies as Array<{ name: string }>;
            const sanitizedAyurvedic = result.sanitizedJson?.ayurvedic_remedies as Array<{ name: string }>;

            expect(sanitizedHome).toHaveLength(0);
            expect(sanitizedIndian).toHaveLength(0);
            expect(sanitizedAyurvedic).toHaveLength(1); // Ashwagandha remains
        });

        it('handles case-insensitive and partial string allergy matching', () => {
            const output = {
                remedies: [
                    { name: ' Ibuprofen 400mg ', dose: '1 tab' }
                ]
            };

            const result = validateOutputAgainstProfile(output, { allergies: ['ibuprofen'] });

            expect(result.isValid).toBe(false);
            const sanitizedRemedies = result.sanitizedJson?.remedies as Array<{ name: string }>;
            expect(sanitizedRemedies).toHaveLength(0);
        });

        it('detects allergy mentions in prose fields', () => {
            const output = {
                description: 'We recommend trying Penicillin for the infection.',
                remedies: [{ name: 'Paracetamol' }]
            };

            const result = validateOutputAgainstProfile(output, { allergies: ['Penicillin'] });

            expect(result.isValid).toBe(false);
            expect(result.fieldViolations).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        field: 'response_text',
                        term: 'allergy:Penicillin'
                    })
                ])
            );
        });

        it('passes cleanly when patient has no allergies', () => {
            const output = {
                remedies: [{ name: 'Amoxicillin' }, { name: 'Paracetamol' }]
            };

            const result = validateOutputAgainstProfile(output, { allergies: [] });
            expect(result.isValid).toBe(true);
            expect(result.fieldViolations).toHaveLength(0);
        });

        it('passes cleanly when remedies do not match any known allergies', () => {
            const output = {
                remedies: [{ name: 'Paracetamol' }]
            };

            const result = validateOutputAgainstProfile(output, { allergies: ['Sulfa drugs', 'Penicillin'] });
            expect(result.isValid).toBe(true);
        });
    });

    // ── 2. DDI Blocked Remedies Safety Rule ──────────────────────────────────
    describe('DDI Blocked Remedies (P0-3)', () => {
        it('flags and strips remedies listed in blockedRemedies', () => {
            const output = {
                remedies: [
                    { name: 'Warfarin 5mg' },
                    { name: 'Acetaminophen 500mg' }
                ]
            };

            const result = validateOutputAgainstProfile(output, { blockedRemedies: ['Warfarin'] });

            expect(result.isValid).toBe(false);
            const sanitizedRemedies = result.sanitizedJson?.remedies as Array<{ name: string }>;
            expect(sanitizedRemedies).toHaveLength(1);
            expect(sanitizedRemedies[0].name).toBe('Acetaminophen 500mg');
        });

        it('flags blocked remedy appearing in text response prose', () => {
            const output = {
                rationale: 'Avoid taking Warfarin with garlic supplements due to bleeding risk.'
            };

            const result = validateOutputAgainstProfile(output, { blockedRemedies: ['Warfarin'] });

            expect(result.isValid).toBe(false);
            expect(result.fieldViolations).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        field: 'response_text',
                        term: 'blocked_remedy:Warfarin'
                    })
                ])
            );
        });
    });

    // ── 3. Pediatric Aspirin Contraindication ─────────────────────────────────
    describe('Pediatric Aspirin Rule', () => {
        it('flags aspirin in output for children under 12 years old', () => {
            const output = {
                description: 'Give aspirin 100mg for fever reduction.'
            };

            const result = validateOutputAgainstProfile(output, { age: 8, gender: 'male' });

            expect(result.isValid).toBe(false);
            expect(result.fieldViolations).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        field: 'full_response',
                        term: 'aspirin'
                    })
                ])
            );
        });

        it('allows aspirin for adult patients (age >= 12)', () => {
            const output = {
                description: 'Adult low-dose aspirin 81mg may be considered.'
            };

            const result = validateOutputAgainstProfile(output, { age: 45, gender: 'male' });

            expect(result.isValid).toBe(true);
        });

        it('flags acetylsalicylic acid as alias for aspirin in children', () => {
            const output = {
                remedies: [{ name: 'Acetylsalicylic acid 300mg' }]
            };

            const result = validateOutputAgainstProfile(output, { age: 5 });

            expect(result.isValid).toBe(false);
            expect(result.fieldViolations[0].term).toBe('aspirin');
        });
    });

    // ── 4. Female Reproductive Content Applicability & Negation ───────────────
    describe('Reproductive Applicability Engine Integration', () => {
        it('flags pregnancy questions for male profile', () => {
            const output = {
                question: 'Could there be any possibility you are pregnant?'
            };

            const result = validateOutputAgainstProfile(output, { gender: 'male', age: 30 });

            expect(result.isValid).toBe(false);
            expect(result.fieldViolations).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        field: 'question',
                        term: 'pregnant/pregnancy'
                    })
                ])
            );
        });

        it('does NOT flag pregnancy terms when negated in context', () => {
            const output = {
                description: 'Patient denies any possibility of pregnancy.',
                rationale: 'Pregnancy is not relevant to this acute tension headache presentation.'
            };

            const result = validateOutputAgainstProfile(output, { gender: 'male', age: 30 });

            expect(result.isValid).toBe(true);
        });

        it('allows pregnancy questions for female profile of childbearing age', () => {
            const output = {
                question: 'Are you currently pregnant or breastfeeding?'
            };

            const result = validateOutputAgainstProfile(output, { gender: 'female', age: 28 });

            expect(result.isValid).toBe(true);
        });
    });

    // ── 5. Edge Cases & Robustness ─────────────────────────────────────────────
    describe('Edge Cases', () => {
        it('handles null, undefined, or empty object gracefully', () => {
            expect(validateOutputAgainstProfile(null as any).isValid).toBe(true);
            expect(validateOutputAgainstProfile({}).isValid).toBe(true);
        });

        it('handles simultaneous DDI, allergy, pediatric, and gender violations', () => {
            const output = {
                question: 'Are you pregnant?',
                remedies: [
                    { name: 'Aspirin' },
                    { name: 'Warfarin' },
                    { name: 'Amoxicillin' }
                ]
            };

            const result = validateOutputAgainstProfile(output, {
                gender: 'male',
                age: 10,
                blockedRemedies: ['Warfarin'],
                allergies: ['Amoxicillin']
            });

            expect(result.isValid).toBe(false);
            expect(result.fieldViolations.length).toBeGreaterThanOrEqual(4);
        });
    });
});
