import { describe, it, expect } from 'vitest';
import { buildEnrichedQuery } from '../lib/rag/queryRewriter';
import { applyAllergyFilter, serialiseFilteredChunks } from '../lib/rag/safetyFilter';
import { validateProfileConsistency } from '../lib/profile/clinicalValidator';
import { getAgeStratifiedDosingRules, buildPolypharmacyWarningPrompt, buildDrugInteractionPrompt } from '../lib/prompts/drugInteractionBlock';
import { detectCompoundRedFlags } from '../lib/safety/redFlagDetector';
import { extractDosageClaims } from '../lib/monitoring/dosageAudit';

describe('Personalization & Medical Safety Tests', () => {

    // ─── Query Enrichment ──────────────────────────────────────────────────────────
    describe('RAG Query Enrichment (queryRewriter)', () => {
        it('should enrich query with age group, conditions, and medications', () => {
            const enriched = buildEnrichedQuery('persistent cough', {
                age: 8,
                gender: 'male',
                conditions: ['Asthma'],
                medications: ['Albuterol'],
                allergies: ['Dust'],
            });
            expect(enriched).toContain('persistent cough');
            expect(enriched).toContain('pediatric patient');
            expect(enriched).toContain('male patient');
            expect(enriched).toContain('Asthma');
            expect(enriched).toContain('Albuterol');
            expect(enriched).toContain('Dust allergy');
        });

        it('should fall back to raw query if profile is empty', () => {
            const enriched = buildEnrichedQuery('persistent cough', {
                conditions: [],
                medications: [],
                allergies: [],
            });
            expect(enriched).toBe('persistent cough');
        });
    });

    // ─── Post-Retrieval Safety Filter ──────────────────────────────────────────────
    describe('Post-Retrieval Allergy/Contraindication Filter (safetyFilter)', () => {
        it('should flag allergy risk for penicillin class synonyms', () => {
            const rawChunks = [
                { content: 'We recommend Amoxicillin 500mg for strep throat.', source: 'rag', score: 1 },
                { content: 'Ginger tea helps with throat pain.', source: 'rag', score: 0.8 }
            ];
            const filtered = applyAllergyFilter(rawChunks, ['penicillin'], []);
            
            expect(filtered[0].safetyFlag).toBe('allergy_risk');
            expect(filtered[1].safetyFlag).toBeNull();

            const serialised = serialiseFilteredChunks(filtered);
            expect(serialised).toContain('SAFETY FLAG: allergy_risk');
            expect(serialised).toContain('Amoxicillin');
        });

        it('should flag contraindications for CKD and NSAIDs', () => {
            const rawChunks = [
                { content: 'Ibuprofen is a common pain reliever.', source: 'rag', score: 1 }
            ];
            const filtered = applyAllergyFilter(rawChunks, [], ['chronic kidney disease']);
            
            expect(filtered[0].safetyFlag).toBe('contraindicated');

            const serialised = serialiseFilteredChunks(filtered);
            expect(serialised).toContain('SAFETY FLAG: contraindicated');
        });
    });

    // ─── Profile Consistency Validator ─────────────────────────────────────────────
    describe('Clinical Profile Consistency Check (clinicalValidator)', () => {
        it('should flag error when patient takes a medication they are allergic to', () => {
            const warnings = validateProfileConsistency({
                conditions: [],
                medications: ['Amoxicillin 500mg'],
                allergies: ['penicillin'],
            });
            expect(warnings.some(w => w.severity === 'error' && w.issue.includes('allergy'))).toBe(true);
        });

        it('should flag warning for pediatric patient prescribed adult-only medication', () => {
            const warnings = validateProfileConsistency({
                age: 8,
                conditions: [],
                medications: ['Warfarin'],
                allergies: [],
            });
            expect(warnings.some(w => w.severity === 'warning' && w.issue.includes('Warfarin'))).toBe(true);
        });

        it('should flag warning for mutually exclusive thyroid conditions', () => {
            const warnings = validateProfileConsistency({
                conditions: ['Hypothyroidism', 'Hyperthyroidism'],
                medications: [],
                allergies: [],
            });
            expect(warnings.some(w => w.severity === 'warning' && w.issue.includes('thyroid'))).toBe(true);
        });
    });

    // ─── Prompt Block Injection ───────────────────────────────────────────────────
    describe('Age-Stratified Dosing Rules (drugInteractionBlock)', () => {
        it('should output pediatric rules for 8 year old', () => {
            const rules = getAgeStratifiedDosingRules(8);
            expect(rules).toContain('CHILD (3–11 years)');
            expect(rules).toContain('NEVER recommend aspirin');
        });

        it('should output elderly rules for 80 year old', () => {
            const rules = getAgeStratifiedDosingRules(80);
            expect(rules).toContain('OLDER ELDERLY (75+ years)');
            expect(rules).toContain('Anticholinergic burden');
        });

        it('should output polypharmacy warnings', () => {
            const warning = buildPolypharmacyWarningPrompt(7);
            expect(warning).toContain('POLYPHARMACY RISK');
            expect(warning).toContain('anticholinergic burden');
        });

        it('should require drug interaction check for multiple medications', () => {
            const warning = buildDrugInteractionPrompt(['Aspirin', 'Warfarin']);
            expect(warning).toContain('DRUG INTERACTION CHECK');
            expect(warning).toContain('Aspirin, Warfarin');
        });
    });

    // ─── Compound Red Flag Detector ───────────────────────────────────────────────
    describe('Compound Red Flag Detector (redFlagDetector)', () => {
        it('should detect cardiac emergency for chest pain + radiating arm pain', () => {
            const result = detectCompoundRedFlags('I have chest pain radiating down my left arm');
            expect(result.detected).toBe(true);
            expect(result.flag).toBe('CARDIAC_EMERGENCY');
        });

        it('should NOT trigger cardiac emergency if the symptom is negated', () => {
            const result = detectCompoundRedFlags('I have radiating arm pain, but no chest pain at all');
            expect(result.detected).toBe(false);
        });
    });

    // ─── Dosage claim extraction ──────────────────────────────────────────────────
    describe('Dosage Claim Extractor (dosageAudit)', () => {
        it('should extract simple dosage claims', () => {
            const claims = extractDosageClaims('Please prescribe Metformin 500mg and 650 mg of Paracetamol daily.');
            expect(claims).toHaveLength(2);
            expect(claims[0]).toEqual({ drug: 'Metformin', amount: 500, unit: 'mg' });
            expect(claims[1]).toEqual({ drug: 'Paracetamol', amount: 650, unit: 'mg' });
        });
    });
});
