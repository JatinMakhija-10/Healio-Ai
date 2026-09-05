/**
 * ruleRegistry.test.ts — Unit tests for the Clinical Rule Registry (c1.md §I.3 item 6)
 *
 * Covers:
 *  1. RULE_REGISTRY exports and structure
 *  2. validateRuleRegistry() passes on the default registry
 *  3. validateRuleRegistry() throws for each governance violation type
 *  4. getRuleById() lookup behaviour
 *  5. Unique IDs across all entries
 *  6. All entries have valid evidence grades
 *  7. All entries have non-empty citations
 *  8. All entries have positive versions
 */

import { describe, it, expect } from 'vitest';
import {
    RULE_REGISTRY,
    validateRuleRegistry,
    getRuleById,
    type VersionedClinicalRule,
} from '../clinicalRuleRegistry';

describe('RULE_REGISTRY structure', () => {
    it('exports a non-empty array', () => {
        expect(Array.isArray(RULE_REGISTRY)).toBe(true);
        expect(RULE_REGISTRY.length).toBeGreaterThan(0);
    });

    it('contains all expected calculator IDs', () => {
        const ids = RULE_REGISTRY.map((r) => r.id);
        expect(ids).toContain('wells_dvt');
        expect(ids).toContain('curb65_pneumonia');
        expect(ids).toContain('cha2ds2vasc_stroke');
        expect(ids).toContain('centor_strep');
        expect(ids).toContain('qsofa_sepsis');
        expect(ids).toContain('perc_pe');
        expect(ids).toContain('heart_score');
        expect(ids).toContain('nexus_cspine');
        expect(ids).toContain('ottawa_ankle');
    });

    it('all IDs are unique', () => {
        const ids = RULE_REGISTRY.map((r) => r.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('all entries have non-empty sourceCitation', () => {
        for (const rule of RULE_REGISTRY) {
            expect(rule.sourceCitation.trim()).not.toBe('');
        }
    });

    it('all entries have a positive version number', () => {
        for (const rule of RULE_REGISTRY) {
            expect(rule.version).toBeGreaterThanOrEqual(1);
        }
    });

    it('all entries have a non-empty lastReviewedDate', () => {
        for (const rule of RULE_REGISTRY) {
            expect(rule.lastReviewedDate.trim()).not.toBe('');
        }
    });

    it('all entries have at least one changeLog entry', () => {
        for (const rule of RULE_REGISTRY) {
            expect(rule.changeLog.length).toBeGreaterThan(0);
        }
    });

    it('all entries have valid evidenceGrade values', () => {
        const validGrades = new Set(['A', 'B', 'C', 'expert-consensus']);
        for (const rule of RULE_REGISTRY) {
            expect(validGrades.has(rule.evidenceGrade)).toBe(true);
        }
    });

    it('all validated clinical calculators have evidenceGrade A', () => {
        const gradeAIds = ['curb65_pneumonia', 'cha2ds2vasc_stroke', 'centor_strep', 'qsofa_sepsis', 'wells_dvt'];
        for (const id of gradeAIds) {
            const rule = RULE_REGISTRY.find((r) => r.id === id);
            expect(rule).toBeDefined();
            expect(rule!.evidenceGrade).toBe('A');
        }
    });

    it('citations for known rules contain expected PMIDs', () => {
        const expected: Record<string, string> = {
            curb65_pneumonia: '12728155',
            cha2ds2vasc_stroke: '19762550',
            centor_strep: '11033707',
            qsofa_sepsis: '26903335',
            wells_dvt: '9428249',
        };
        for (const [id, pmid] of Object.entries(expected)) {
            const rule = RULE_REGISTRY.find((r) => r.id === id);
            expect(rule?.sourceCitation).toContain(pmid);
        }
    });
});

describe('validateRuleRegistry()', () => {
    it('passes validation on the default RULE_REGISTRY', () => {
        expect(() => validateRuleRegistry()).not.toThrow();
    });

    it('throws when any rule has a blank sourceCitation', () => {
        const bad: VersionedClinicalRule[] = [
            {
                id: 'test_rule',
                displayName: 'Test Rule',
                version: 1,
                evidenceGrade: 'A',
                sourceCitation: '',  // ← blank
                lastReviewedBy: 'dr.test',
                lastReviewedDate: '2026-09-05',
                changeLog: [{ version: 1, date: '2026-09-05', author: 'eng', summary: 'init' }],
            },
        ];
        expect(() => validateRuleRegistry(bad)).toThrow(/sourceCitation is blank/);
    });

    it('throws when any rule has a blank lastReviewedBy', () => {
        const bad: VersionedClinicalRule[] = [
            {
                id: 'test_rule_2',
                displayName: 'Test Rule 2',
                version: 1,
                evidenceGrade: 'B',
                sourceCitation: 'DOI:10.1000/test',
                lastReviewedBy: '',  // ← blank
                lastReviewedDate: '2026-09-05',
                changeLog: [{ version: 1, date: '2026-09-05', author: 'eng', summary: 'init' }],
            },
        ];
        expect(() => validateRuleRegistry(bad)).toThrow(/lastReviewedBy is blank/);
    });

    it('throws when version is 0 or negative', () => {
        const bad: VersionedClinicalRule[] = [
            {
                id: 'test_rule_3',
                displayName: 'Test Rule 3',
                version: 0,  // ← invalid
                evidenceGrade: 'A',
                sourceCitation: 'PMID 12345678',
                lastReviewedBy: 'dr.test',
                lastReviewedDate: '2026-09-05',
                changeLog: [{ version: 0, date: '2026-09-05', author: 'eng', summary: 'init' }],
            },
        ];
        expect(() => validateRuleRegistry(bad)).toThrow(/version must be a positive integer/);
    });

    it('throws when changeLog is empty', () => {
        const bad: VersionedClinicalRule[] = [
            {
                id: 'test_rule_4',
                displayName: 'Test Rule 4',
                version: 1,
                evidenceGrade: 'A',
                sourceCitation: 'PMID 12345678',
                lastReviewedBy: 'dr.test',
                lastReviewedDate: '2026-09-05',
                changeLog: [],  // ← empty
            },
        ];
        expect(() => validateRuleRegistry(bad)).toThrow(/changeLog is empty/);
    });

    it('throws when duplicate IDs exist', () => {
        const entry: VersionedClinicalRule = {
            id: 'duplicate_id',
            displayName: 'Dup',
            version: 1,
            evidenceGrade: 'A',
            sourceCitation: 'PMID 12345',
            lastReviewedBy: 'dr.test',
            lastReviewedDate: '2026-09-05',
            changeLog: [{ version: 1, date: '2026-09-05', author: 'eng', summary: 'init' }],
        };
        expect(() => validateRuleRegistry([entry, entry])).toThrow(/Duplicate rule id/);
    });

    it('reports ALL violations when multiple rules fail', () => {
        const bad: VersionedClinicalRule[] = [
            {
                id: 'bad_a',
                displayName: 'Bad A',
                version: 1,
                evidenceGrade: 'A',
                sourceCitation: '',
                lastReviewedBy: '',
                lastReviewedDate: '2026-09-05',
                changeLog: [],
            },
        ];
        let errorMsg = '';
        try { validateRuleRegistry(bad); } catch (e) { errorMsg = (e as Error).message; }
        expect(errorMsg).toContain('sourceCitation is blank');
        expect(errorMsg).toContain('lastReviewedBy is blank');
        expect(errorMsg).toContain('changeLog is empty');
    });

    it('passes validation for a correctly formed custom registry', () => {
        const good: VersionedClinicalRule[] = [
            {
                id: 'good_rule',
                displayName: 'Good Rule',
                version: 2,
                evidenceGrade: 'B',
                sourceCitation: 'Smith J et al. JAMA. 2020;323(1):10-15. PMID 31901234',
                lastReviewedBy: 'dr.jane.smith',
                lastReviewedDate: '2026-01-15',
                changeLog: [
                    { version: 2, date: '2026-01-15', author: 'dr.jane.smith', summary: 'Updated weight' },
                    { version: 1, date: '2025-06-01', author: 'engineering', summary: 'Initial' },
                ],
            },
        ];
        expect(() => validateRuleRegistry(good)).not.toThrow();
    });
});

describe('getRuleById()', () => {
    it('returns the correct rule for a known ID', () => {
        const rule = getRuleById('wells_dvt');
        expect(rule).toBeDefined();
        expect(rule!.id).toBe('wells_dvt');
    });

    it('returns undefined for an unknown ID', () => {
        expect(getRuleById('nonexistent_rule_xyz')).toBeUndefined();
    });

    it('is case-sensitive', () => {
        expect(getRuleById('WELLS_DVT')).toBeUndefined();
        expect(getRuleById('wells_dvt')).toBeDefined();
    });
});
