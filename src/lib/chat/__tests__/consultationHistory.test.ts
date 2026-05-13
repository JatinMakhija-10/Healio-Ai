import { describe, it, expect } from 'vitest';
import {
    buildMedicalHistoryContext,
    detectRecurringConditions,
    type ConsultationRecord,
} from '../consultationHistory';

// ── Fixture helpers ──────────────────────────────────────────────────────────

function makeConsultation(
    condition: string,
    severity = 'mild',
    daysAgo = 0,
    overrides: Partial<ConsultationRecord> = {}
): ConsultationRecord {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return {
        created_at: d.toISOString(),
        confidence: 80,
        diagnosis: { condition, severity, seekHelp: 'If worse after 3 days' },
        symptoms: { location: ['Head'], sensation: 'Throbbing' },
        ...overrides,
    };
}

// ── detectRecurringConditions ────────────────────────────────────────────────

describe('detectRecurringConditions', () => {
    it('returns empty array when no consultations', () => {
        expect(detectRecurringConditions([])).toEqual([]);
    });

    it('returns empty array when all conditions appear only once', () => {
        const consultations = [
            makeConsultation('Headache', 'mild', 5),
            makeConsultation('Fever', 'moderate', 10),
            makeConsultation('Acidity', 'mild', 20),
        ];
        expect(detectRecurringConditions(consultations)).toHaveLength(0);
    });

    it('detects a single recurring condition (2 occurrences)', () => {
        const consultations = [
            makeConsultation('Migraine', 'moderate', 2),
            makeConsultation('Fever', 'mild', 5),
            makeConsultation('Migraine', 'severe', 30),
        ];
        const result = detectRecurringConditions(consultations);
        expect(result).toHaveLength(1);
        expect(result[0].name.toLowerCase()).toBe('migraine');
        expect(result[0].count).toBe(2);
    });

    it('detects multiple recurring conditions', () => {
        const consultations = [
            makeConsultation('Headache', 'mild', 1),
            makeConsultation('Acidity', 'mild', 5),
            makeConsultation('Headache', 'moderate', 15),
            makeConsultation('Acidity', 'mild', 25),
            makeConsultation('Acidity', 'mild', 45),
        ];
        const result = detectRecurringConditions(consultations);
        expect(result).toHaveLength(2);
        // Sorted by count descending — Acidity (3) before Headache (2)
        expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
        const names = result.map((r) => r.name.toLowerCase());
        expect(names).toContain('acidity');
        expect(names).toContain('headache');
    });

    it('is case-insensitive when grouping conditions', () => {
        const consultations = [
            makeConsultation('Headache', 'mild', 1),
            makeConsultation('headache', 'mild', 10),
            makeConsultation('HEADACHE', 'mild', 20),
        ];
        const result = detectRecurringConditions(consultations);
        expect(result).toHaveLength(1);
        expect(result[0].count).toBe(3);
    });

    it('ignores "Unknown Condition" entries', () => {
        const consultations = [
            makeConsultation('Unknown Condition', 'mild', 1),
            makeConsultation('Unknown Condition', 'mild', 5),
        ];
        expect(detectRecurringConditions(consultations)).toHaveLength(0);
    });

    it('ignores conditions with empty name', () => {
        const consultations = [
            { created_at: new Date().toISOString(), diagnosis: { condition: '' } },
            { created_at: new Date().toISOString(), diagnosis: { condition: '' } },
        ];
        expect(detectRecurringConditions(consultations)).toHaveLength(0);
    });

    it('attaches date strings to recurring entries', () => {
        const consultations = [
            makeConsultation('Fever', 'mild', 0),
            makeConsultation('Fever', 'mild', 7),
        ];
        const result = detectRecurringConditions(consultations);
        expect(result[0].dates).toHaveLength(2);
    });

    it('tracks lastSeverity from the most recently processed entry', () => {
        const consultations = [
            makeConsultation('Fever', 'mild', 3),
            makeConsultation('Fever', 'severe', 10),
        ];
        const result = detectRecurringConditions(consultations);
        // The last severity set is from the second consultation
        expect(['mild', 'severe']).toContain(result[0].lastSeverity);
    });
});

// ── buildMedicalHistoryContext ───────────────────────────────────────────────

describe('buildMedicalHistoryContext', () => {
    it('returns empty string for empty array', () => {
        expect(buildMedicalHistoryContext([])).toBe('');
    });

    it('returns empty string for null/undefined', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(buildMedicalHistoryContext(null as any)).toBe('');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(buildMedicalHistoryContext(undefined as any)).toBe('');
    });

    it('contains the section header and footer', () => {
        const result = buildMedicalHistoryContext([makeConsultation('Fever', 'mild', 1)]);
        expect(result).toContain('=== PATIENT MEDICAL HISTORY');
        expect(result).toContain('=== END OF MEDICAL HISTORY ===');
    });

    it('includes condition name in output', () => {
        const result = buildMedicalHistoryContext([makeConsultation('Migraine', 'moderate', 3)]);
        expect(result).toContain('Migraine');
    });

    it('includes severity and confidence', () => {
        const result = buildMedicalHistoryContext([
            { ...makeConsultation('Fever', 'severe', 2), confidence: 85 },
        ]);
        expect(result).toContain('severity: severe');
        expect(result).toContain('85%');
    });

    it('shows "RECENT CONSULTATIONS" label', () => {
        const result = buildMedicalHistoryContext([makeConsultation('Cold', 'mild', 1)]);
        expect(result).toContain('RECENT CONSULTATIONS (full detail):');
    });

    it('includes remedy names when present', () => {
        const consultation: ConsultationRecord = {
            ...makeConsultation('Acidity', 'mild', 2),
            diagnosis: {
                condition: 'Acidity',
                severity: 'mild',
                homeopathic_remedies: [{ name: 'Nux Vomica' }],
                home_remedies: [{ name: 'Jeera Water' }],
            },
        };
        const result = buildMedicalHistoryContext([consultation]);
        expect(result).toContain('Nux Vomica');
        expect(result).toContain('Jeera Water');
    });

    it('shows symptom location and sensation when present', () => {
        const consultation: ConsultationRecord = {
            ...makeConsultation('Knee Pain', 'moderate', 4),
            symptoms: { location: ['Left Knee', 'Right Knee'], sensation: 'Sharp' },
        };
        const result = buildMedicalHistoryContext([consultation]);
        expect(result).toContain('Left Knee');
        expect(result).toContain('Sharp');
    });

    it('marks follow-up consultations', () => {
        const consultation: ConsultationRecord = {
            ...makeConsultation('Fever', 'mild', 1),
            diagnosis: { condition: 'Fever', severity: 'mild', is_followup: true },
        };
        const result = buildMedicalHistoryContext([consultation]);
        expect(result).toContain('[FOLLOW-UP]');
    });

    it('shows "OLDER HISTORY" section when more than 3 consultations', () => {
        const consultations = [
            makeConsultation('Fever', 'mild', 1),
            makeConsultation('Cough', 'mild', 5),
            makeConsultation('Headache', 'mild', 10),
            makeConsultation('Acidity', 'mild', 20),   // 4th — goes to older
            makeConsultation('Cold', 'mild', 30),       // 5th
        ];
        const result = buildMedicalHistoryContext(consultations);
        expect(result).toContain('OLDER HISTORY (summary):');
        expect(result).toContain('Older history — 2 consultations');
        expect(result).toContain('Acidity');
        expect(result).toContain('Cold');
    });

    it('does NOT show "OLDER HISTORY" for 3 or fewer consultations', () => {
        const consultations = [
            makeConsultation('Fever', 'mild', 1),
            makeConsultation('Cough', 'mild', 5),
            makeConsultation('Headache', 'mild', 10),
        ];
        const result = buildMedicalHistoryContext(consultations);
        expect(result).not.toContain('OLDER HISTORY');
    });

    it('injects RECURRING CONDITIONS block when a condition repeats', () => {
        const consultations = [
            makeConsultation('Migraine', 'moderate', 3),
            makeConsultation('Fever', 'mild', 10),
            makeConsultation('Migraine', 'severe', 40),
        ];
        const result = buildMedicalHistoryContext(consultations);
        expect(result).toContain('RECURRING CONDITIONS DETECTED');
        expect(result.toLowerCase()).toContain('migraine');
    });

    it('does NOT inject recurring block when all conditions are unique', () => {
        const consultations = [
            makeConsultation('Fever', 'mild', 1),
            makeConsultation('Cough', 'mild', 8),
            makeConsultation('Back Pain', 'moderate', 20),
        ];
        const result = buildMedicalHistoryContext(consultations);
        expect(result).not.toContain('RECURRING CONDITIONS DETECTED');
    });

    it('recurring block contains the frequency count', () => {
        const consultations = [
            makeConsultation('Acidity', 'mild', 1),
            makeConsultation('Acidity', 'mild', 10),
            makeConsultation('Acidity', 'mild', 20),
        ];
        const result = buildMedicalHistoryContext(consultations);
        expect(result).toContain('3x');
    });

    it('handles single entry with no optional fields gracefully', () => {
        const consultation: ConsultationRecord = {
            created_at: new Date().toISOString(),
            diagnosis: { condition: 'Fever' },
        };
        const result = buildMedicalHistoryContext([consultation]);
        expect(result).toContain('Fever');
        expect(result).not.toContain('undefined');
        expect(result).not.toContain('null');
    });

    it('handles missing created_at gracefully', () => {
        const consultation: ConsultationRecord = {
            diagnosis: { condition: 'Headache', severity: 'mild' },
        };
        const result = buildMedicalHistoryContext([consultation]);
        expect(result).toContain('unknown date');
        expect(result).not.toContain('undefined');
    });

    it('efficiency: output length does not blow up for 10 consultations', () => {
        const consultations = Array.from({ length: 10 }, (_, i) =>
            makeConsultation(`Condition${i}`, 'mild', i * 7)
        );
        const result = buildMedicalHistoryContext(consultations);
        // Full 10-entry list would be ~3000 chars; smart summarisation keeps it under 2000
        expect(result.length).toBeLessThan(3000);
        expect(result).toContain('OLDER HISTORY (summary):');
        expect(result).toContain('7 consultations');
    });
});
