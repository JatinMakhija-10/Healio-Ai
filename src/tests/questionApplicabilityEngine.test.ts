import { describe, it, expect } from 'vitest';
import {
    normalizeReproductiveContext,
    buildApplicabilityContext,
    isPregnancyApplicable,
    shouldAskPregnancyQuestion,
    resolveApplicableClauses,
    abdominalPainDangerClauses,
} from '../lib/diagnosis/QuestionApplicabilityEngine';

// ─────────────────────────────────────────────────────────────────────────────
// normalizeReproductiveContext — the normalization function
// ─────────────────────────────────────────────────────────────────────────────

describe('normalizeReproductiveContext', () => {
    describe('sexAtBirth normalization', () => {
        it('maps "male" → male', () => {
            expect(normalizeReproductiveContext({ gender: 'male' }).sexAtBirth).toBe('male');
        });
        it('maps "Male" (capitalized) → male [REGRESSION: case sensitivity bug]', () => {
            expect(normalizeReproductiveContext({ gender: 'Male' }).sexAtBirth).toBe('male');
        });
        it('maps "MALE" → male', () => {
            expect(normalizeReproductiveContext({ gender: 'MALE' }).sexAtBirth).toBe('male');
        });
        it('maps "m" → male', () => {
            expect(normalizeReproductiveContext({ gender: 'm' }).sexAtBirth).toBe('male');
        });
        it('maps "male " (trailing space) → male', () => {
            expect(normalizeReproductiveContext({ gender: 'male ' }).sexAtBirth).toBe('male');
        });
        it('maps "female" → female', () => {
            expect(normalizeReproductiveContext({ gender: 'female' }).sexAtBirth).toBe('female');
        });
        it('maps "Female" → female [REGRESSION: case sensitivity bug]', () => {
            expect(normalizeReproductiveContext({ gender: 'Female' }).sexAtBirth).toBe('female');
        });
        it('maps "f" → female', () => {
            expect(normalizeReproductiveContext({ gender: 'f' }).sexAtBirth).toBe('female');
        });
        it('maps "F" → female', () => {
            expect(normalizeReproductiveContext({ gender: 'F' }).sexAtBirth).toBe('female');
        });
        it('maps "woman" → female', () => {
            expect(normalizeReproductiveContext({ gender: 'woman' }).sexAtBirth).toBe('female');
        });
        it('maps "intersex" → intersex', () => {
            expect(normalizeReproductiveContext({ gender: 'intersex' }).sexAtBirth).toBe('intersex');
        });

        // Unknown inputs — all must map to 'unknown', never to a guessed sex
        it('maps null → unknown [REGRESSION: the original root cause]', () => {
            expect(normalizeReproductiveContext({ gender: null }).sexAtBirth).toBe('unknown');
        });
        it('maps undefined → unknown', () => {
            expect(normalizeReproductiveContext({}).sexAtBirth).toBe('unknown');
        });
        it('maps empty string → unknown', () => {
            expect(normalizeReproductiveContext({ gender: '' }).sexAtBirth).toBe('unknown');
        });
        it('maps malformed "xyz" → unknown', () => {
            expect(normalizeReproductiveContext({ gender: 'xyz' }).sexAtBirth).toBe('unknown');
        });
        it('prefers sexAtBirth over gender when both provided', () => {
            expect(
                normalizeReproductiveContext({ sexAtBirth: 'male', gender: 'female' }).sexAtBirth
            ).toBe('male');
        });
    });

    describe('pregnancyCapacity derivation — fail-closed logic', () => {
        it('male → not_applicable', () => {
            expect(normalizeReproductiveContext({ gender: 'male' }).pregnancyCapacity).toBe('not_applicable');
        });
        it('female → capable', () => {
            expect(normalizeReproductiveContext({ gender: 'female' }).pregnancyCapacity).toBe('capable');
        });
        it('intersex → capable (conservative default)', () => {
            expect(normalizeReproductiveContext({ gender: 'intersex' }).pregnancyCapacity).toBe('capable');
        });
        it('unknown → unknown (NEVER guess) [REGRESSION: original fail-open bug]', () => {
            expect(normalizeReproductiveContext({ gender: null }).pregnancyCapacity).toBe('unknown');
        });
        it('unknown → unknown when gender is undefined [REGRESSION]', () => {
            expect(normalizeReproductiveContext({}).pregnancyCapacity).toBe('unknown');
        });
    });

    describe('pregnancyStatus from legacy isPregnant field', () => {
        it('isPregnant=true → pregnant', () => {
            expect(
                normalizeReproductiveContext({ gender: 'female', isPregnant: true }).pregnancyStatus
            ).toBe('pregnant');
        });
        it('isPregnant=false → not_pregnant', () => {
            expect(
                normalizeReproductiveContext({ gender: 'female', isPregnant: false }).pregnancyStatus
            ).toBe('not_pregnant');
        });
        it('no isPregnant → unknown', () => {
            expect(
                normalizeReproductiveContext({ gender: 'female' }).pregnancyStatus
            ).toBe('unknown');
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// isPregnancyApplicable — the primary gate predicate
// ─────────────────────────────────────────────────────────────────────────────

describe('isPregnancyApplicable', () => {
    it('returns false for male profile', () => {
        const ctx = buildApplicabilityContext({ gender: 'male' });
        expect(isPregnancyApplicable(ctx)).toBe(false);
    });
    it('returns true for female profile', () => {
        const ctx = buildApplicabilityContext({ gender: 'female' });
        expect(isPregnancyApplicable(ctx)).toBe(true);
    });
    it('returns true for intersex profile', () => {
        const ctx = buildApplicabilityContext({ gender: 'intersex' });
        expect(isPregnancyApplicable(ctx)).toBe(true);
    });
    it('returns false for unknown gender [REGRESSION: original fail-open bug]', () => {
        const ctx = buildApplicabilityContext({ gender: null });
        expect(isPregnancyApplicable(ctx)).toBe(false);
    });
    it('returns false for undefined gender [REGRESSION]', () => {
        const ctx = buildApplicabilityContext({});
        expect(isPregnancyApplicable(ctx)).toBe(false);
    });
    it('returns false for capitalized "Male" [REGRESSION: case sensitivity]', () => {
        const ctx = buildApplicabilityContext({ gender: 'Male' });
        expect(isPregnancyApplicable(ctx)).toBe(false);
    });
    it('returns true for capitalized "Female" [REGRESSION: case sensitivity]', () => {
        const ctx = buildApplicabilityContext({ gender: 'Female' });
        expect(isPregnancyApplicable(ctx)).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// shouldAskPregnancyQuestion — more specific: also suppresses when status is known
// ─────────────────────────────────────────────────────────────────────────────

describe('shouldAskPregnancyQuestion', () => {
    it('female, status unknown → true (should ask)', () => {
        const ctx = buildApplicabilityContext({ gender: 'female' });
        expect(shouldAskPregnancyQuestion(ctx)).toBe(true);
    });
    it('female, already pregnant → false (no need to ask again)', () => {
        const ctx = buildApplicabilityContext({ gender: 'female', isPregnant: true });
        expect(shouldAskPregnancyQuestion(ctx)).toBe(false);
    });
    it('female, isPregnant=false → false (status already known)', () => {
        const ctx = buildApplicabilityContext({ gender: 'female', isPregnant: false });
        expect(shouldAskPregnancyQuestion(ctx)).toBe(false);
    });
    it('male → false', () => {
        const ctx = buildApplicabilityContext({ gender: 'male' });
        expect(shouldAskPregnancyQuestion(ctx)).toBe(false);
    });
    it('unknown gender → false (fail-closed)', () => {
        const ctx = buildApplicabilityContext({ gender: null });
        expect(shouldAskPregnancyQuestion(ctx)).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveApplicableClauses — full edge case matrix (audit Section 14)
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveApplicableClauses — abdominal pain danger signs', () => {
    const allClauseIds = abdominalPainDangerClauses.map((c) => c.id);
    const pregnancyClauseId = 'pregnancy_possibility';

    it('male: pregnancy clause EXCLUDED, universal clauses included', () => {
        const ctx = buildApplicabilityContext({ gender: 'male' });
        const { applicable, excluded, deferredForProfileCompletion } =
            resolveApplicableClauses(abdominalPainDangerClauses, ctx);

        const applicableIds = applicable.map((c) => c.id);
        expect(applicableIds).not.toContain(pregnancyClauseId);
        expect(excluded.map((c) => c.id)).toContain(pregnancyClauseId);
        expect(deferredForProfileCompletion).toHaveLength(0);

        // All other clauses should be applicable
        const universalIds = allClauseIds.filter((id) => id !== pregnancyClauseId);
        universalIds.forEach((id) => expect(applicableIds).toContain(id));
    });

    it('female, age=30, status=unknown: pregnancy clause INCLUDED', () => {
        const ctx = buildApplicabilityContext({ gender: 'female', age: 30 });
        const { applicable } = resolveApplicableClauses(abdominalPainDangerClauses, ctx);
        expect(applicable.map((c) => c.id)).toContain(pregnancyClauseId);
    });

    it('female, already pregnant: pregnancy clause EXCLUDED (status already known, do not re-ask)', () => {
        const ctx = buildApplicabilityContext({ gender: 'female', isPregnant: true });
        const { applicable } = resolveApplicableClauses(abdominalPainDangerClauses, ctx);
        expect(applicable.map((c) => c.id)).not.toContain(pregnancyClauseId);
    });

    it('female, isPregnant=false: pregnancy clause EXCLUDED (status already known)', () => {
        const ctx = buildApplicabilityContext({ gender: 'female', isPregnant: false });
        const { applicable } = resolveApplicableClauses(abdominalPainDangerClauses, ctx);
        expect(applicable.map((c) => c.id)).not.toContain(pregnancyClauseId);
    });

    it('intersex, capable, status=unknown: pregnancy clause INCLUDED', () => {
        const ctx = buildApplicabilityContext({ gender: 'intersex' });
        const { applicable } = resolveApplicableClauses(abdominalPainDangerClauses, ctx);
        expect(applicable.map((c) => c.id)).toContain(pregnancyClauseId);
    });

    it('unknown gender: pregnancy clause DEFERRED (not excluded, not asked) [REGRESSION: fail-open bug]', () => {
        const ctx = buildApplicabilityContext({ gender: null });
        const { applicable, deferredForProfileCompletion, excluded } =
            resolveApplicableClauses(abdominalPainDangerClauses, ctx);

        // Must NOT be in applicable (don't ask an unknown-gender patient)
        expect(applicable.map((c) => c.id)).not.toContain(pregnancyClauseId);
        // Must be deferred, not hard-excluded
        expect(deferredForProfileCompletion.map((c) => c.id)).toContain(pregnancyClauseId);
        expect(excluded.map((c) => c.id)).not.toContain(pregnancyClauseId);
    });

    it('"Male " (trailing space): pregnancy clause EXCLUDED [REGRESSION: trim]', () => {
        const ctx = buildApplicabilityContext({ gender: 'Male ' });
        const { applicable } = resolveApplicableClauses(abdominalPainDangerClauses, ctx);
        expect(applicable.map((c) => c.id)).not.toContain(pregnancyClauseId);
    });

    it('"MALE" (uppercase): pregnancy clause EXCLUDED [REGRESSION: case]', () => {
        const ctx = buildApplicabilityContext({ gender: 'MALE' });
        const { applicable } = resolveApplicableClauses(abdominalPainDangerClauses, ctx);
        expect(applicable.map((c) => c.id)).not.toContain(pregnancyClauseId);
    });
});
