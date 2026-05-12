/**
 * PersonaEngine Unit Tests
 *
 * Covers: BMI calculation, family history parsing, occupation classification,
 * diet/alcohol/sleep/exercise parsing, medication flags, comorbidity detection,
 * and full buildPersonaProfile integration.
 */
import { describe, it, expect } from 'vitest';
import {
    computeBMI,
    parseFamilyHistory,
    parseOccupationRisk,
    parseDietRisk,
    parseAlcohol,
    parseSleep,
    parseExercise,
    parseMedicationFlags,
    buildPersonaProfile,
} from '../PersonaEngine';

// ─── BMI Calculation ──────────────────────────────────────────────────────────

describe('computeBMI', () => {
    it('computes BMI from kg and cm correctly', () => {
        // 70 kg, 170 cm → 70 / (1.70^2) = 24.2
        const bmi = computeBMI('70', '170');
        expect(bmi).toBeCloseTo(24.2, 0);
    });

    it('handles string inputs with units', () => {
        const bmi = computeBMI('70kg', '170cm');
        expect(bmi).toBeCloseTo(24.2, 0);
    });

    it('handles feet/inches format', () => {
        // 70kg, 5'10" → 1.778m → 70 / (1.778^2) = 22.1
        const bmi = computeBMI(70, "5'10");
        expect(bmi).toBeCloseTo(22.1, 0);
    });

    it('detects obesity (BMI >= 30)', () => {
        // 100kg, 170cm → 34.6
        const bmi = computeBMI('100', '170');
        expect(bmi).not.toBeNull();
        expect(bmi!).toBeGreaterThanOrEqual(30);
    });

    it('detects underweight (BMI < 18.5)', () => {
        // 45kg, 170cm → 15.6
        const bmi = computeBMI('45', '170');
        expect(bmi).not.toBeNull();
        expect(bmi!).toBeLessThan(18.5);
    });

    it('returns null for missing weight', () => {
        expect(computeBMI(undefined, '170')).toBeNull();
    });

    it('returns null for missing height', () => {
        expect(computeBMI('70', undefined)).toBeNull();
    });

    it('returns null for invalid inputs', () => {
        expect(computeBMI('abc', '170')).toBeNull();
        expect(computeBMI('70', 'abc')).toBeNull();
    });

    it('auto-converts lbs if weight > 200 without kg suffix', () => {
        // 220 lbs → 99.8 kg, 170 cm → BMI ~34.5
        const bmi = computeBMI('220', '170');
        expect(bmi).not.toBeNull();
        expect(bmi!).toBeGreaterThan(30);
    });

    it('handles numeric inputs', () => {
        const bmi = computeBMI(75, 180);
        expect(bmi).toBeCloseTo(23.1, 0);
    });
});

// ─── Family History Parser ────────────────────────────────────────────────────

describe('parseFamilyHistory', () => {
    it('detects cardiac history', () => {
        const flags = parseFamilyHistory(['Heart disease', 'Father had heart attack']);
        expect(flags.cardiac).toBe(true);
    });

    it('detects diabetes history', () => {
        const flags = parseFamilyHistory('Mother has diabetes');
        expect(flags.diabetes).toBe(true);
    });

    it('detects cancer history', () => {
        const flags = parseFamilyHistory(['Cancer']);
        expect(flags.cancer).toBe(true);
    });

    it('detects mental health history', () => {
        const flags = parseFamilyHistory('Depression in family');
        expect(flags.mentalHealth).toBe(true);
    });

    it('detects stroke history', () => {
        const flags = parseFamilyHistory(['Grandfather had a stroke']);
        expect(flags.stroke).toBe(true);
    });

    it('detects hypertension history', () => {
        const flags = parseFamilyHistory('Blood pressure runs in family');
        expect(flags.hypertension).toBe(true);
    });

    it('detects thyroid history', () => {
        const flags = parseFamilyHistory(['Hypothyroid']);
        expect(flags.thyroid).toBe(true);
    });

    it('detects multiple conditions', () => {
        const flags = parseFamilyHistory(['Diabetes', 'Heart disease', 'Asthma']);
        expect(flags.diabetes).toBe(true);
        expect(flags.cardiac).toBe(true);
        expect(flags.asthma).toBe(true);
    });

    it('returns all false for empty input', () => {
        const flags = parseFamilyHistory(null);
        expect(Object.values(flags).every(v => v === false)).toBe(true);
    });
});

// ─── Occupation Classifier ────────────────────────────────────────────────────

describe('parseOccupationRisk', () => {
    it('classifies desk_job enum', () => {
        expect(parseOccupationRisk('desk_job')).toBe('desk');
    });

    it('classifies sedentary enum', () => {
        expect(parseOccupationRisk('sedentary')).toBe('desk');
    });

    it('classifies active enum as manual', () => {
        expect(parseOccupationRisk('active')).toBe('manual');
    });

    it('classifies highly_active enum as outdoor', () => {
        expect(parseOccupationRisk('highly_active')).toBe('outdoor');
    });

    it('classifies free text: software engineer', () => {
        expect(parseOccupationRisk('Software Engineer')).toBe('desk');
    });

    it('classifies free text: nurse', () => {
        expect(parseOccupationRisk('Nurse at hospital')).toBe('healthcare');
    });

    it('classifies free text: farmer', () => {
        expect(parseOccupationRisk('Farmer')).toBe('outdoor');
    });

    it('classifies student', () => {
        expect(parseOccupationRisk('College student')).toBe('student');
    });

    it('classifies homemaker', () => {
        expect(parseOccupationRisk('Housewife')).toBe('homemaker');
    });

    it('returns unknown for null', () => {
        expect(parseOccupationRisk(null)).toBe('unknown');
    });
});

// ─── Diet Risk ────────────────────────────────────────────────────────────────

describe('parseDietRisk', () => {
    it('detects vegetarian', () => {
        expect(parseDietRisk('vegetarian').isVegetarian).toBe(true);
    });

    it('detects vegan (also sets vegetarian)', () => {
        const flags = parseDietRisk('vegan');
        expect(flags.isVegan).toBe(true);
        expect(flags.isVegetarian).toBe(true);
    });

    it('detects mixed as high-fat', () => {
        expect(parseDietRisk('mixed').isHighFat).toBe(true);
    });

    it('returns defaults for null', () => {
        const flags = parseDietRisk(null);
        expect(flags.isHighFat).toBe(false);
        expect(flags.isVegetarian).toBe(false);
    });
});

// ─── Alcohol Parser ───────────────────────────────────────────────────────────

describe('parseAlcohol', () => {
    it('none → not a user', () => {
        expect(parseAlcohol('none')).toEqual({ isUser: false, isHeavy: false });
    });

    it('occasional → user but not heavy', () => {
        const { isUser, isHeavy } = parseAlcohol('occasional');
        expect(isUser).toBe(true);
        expect(isHeavy).toBe(false);
    });

    it('heavy → heavy drinker', () => {
        const { isUser, isHeavy } = parseAlcohol('heavy');
        expect(isUser).toBe(true);
        expect(isHeavy).toBe(true);
    });

    it('null → not a user', () => {
        expect(parseAlcohol(null)).toEqual({ isUser: false, isHeavy: false });
    });
});

// ─── Sleep Parser ─────────────────────────────────────────────────────────────

describe('parseSleep', () => {
    it('< 5h → low sleep', () => {
        expect(parseSleep('< 5h')).toBe(true);
    });

    it('5-6h → low sleep', () => {
        expect(parseSleep('5-6h')).toBe(true);
    });

    it('7-8h → normal', () => {
        expect(parseSleep('7-8h')).toBe(false);
    });

    it('> 8h → normal', () => {
        expect(parseSleep('> 8h')).toBe(false);
    });

    it('insomnia → low sleep', () => {
        expect(parseSleep('insomnia')).toBe(true);
    });

    it('null → false (unknown = assume fine)', () => {
        expect(parseSleep(null)).toBe(false);
    });
});

// ─── Exercise Parser ──────────────────────────────────────────────────────────

describe('parseExercise', () => {
    it('none → sedentary', () => {
        expect(parseExercise('none')).toEqual({ isSedentary: true, isVigorous: false });
    });

    it('moderate → neither', () => {
        expect(parseExercise('moderate')).toEqual({ isSedentary: false, isVigorous: false });
    });

    it('intense → vigorous', () => {
        expect(parseExercise('intense')).toEqual({ isSedentary: false, isVigorous: true });
    });

    it('null → neither', () => {
        expect(parseExercise(null)).toEqual({ isSedentary: false, isVigorous: false });
    });
});

// ─── Medication Flags ─────────────────────────────────────────────────────────

describe('parseMedicationFlags', () => {
    it('detects steroids (Wysolone)', () => {
        const flags = parseMedicationFlags(['Wysolone 10mg', 'Paracetamol']);
        expect(flags.onSteroids).toBe(true);
        expect(flags.onAnticoagulants).toBe(false);
    });

    it('detects immunosuppressants (Azathioprine)', () => {
        const flags = parseMedicationFlags(['Azathioprine']);
        expect(flags.onImmunosuppressants).toBe(true);
    });

    it('detects thyroid meds (Thyronorm)', () => {
        const flags = parseMedicationFlags(['Thyronorm 25mcg']);
        expect(flags.onThyroidMeds).toBe(true);
    });

    it('detects antidepressants (Nexito)', () => {
        const flags = parseMedicationFlags('Nexito 10mg');
        expect(flags.onAntidepressants).toBe(true);
    });

    it('detects statins (Atorvastatin)', () => {
        const flags = parseMedicationFlags(['Atorvastatin 20mg']);
        expect(flags.onStatins).toBe(true);
    });

    it('detects insulin', () => {
        const flags = parseMedicationFlags(['Lantus SoloStar']);
        expect(flags.onInsulin).toBe(true);
    });

    it('detects anticoagulants (Acitrom)', () => {
        const flags = parseMedicationFlags(['Acitrom 2mg']);
        expect(flags.onAnticoagulants).toBe(true);
    });

    it('returns all false for empty', () => {
        const flags = parseMedicationFlags(null);
        expect(Object.values(flags).every(v => v === false)).toBe(true);
    });
});

// ─── Full buildPersonaProfile ─────────────────────────────────────────────────

describe('buildPersonaProfile', () => {
    it('builds complete profile from onboarding medical_profile', () => {
        const profile = buildPersonaProfile({
            conditions: ['Diabetes', 'Asthma'],
            medications: ['Thyronorm 50mcg', 'Metformin'],
            familyHistory: ['Heart disease', 'Cancer'],
            lifestyle: {
                smoking: 'never',
                alcohol: 'occasional',
                diet: 'vegetarian',
                exercise: 'none',
                sleepPattern: '5-6h',
                occupation: 'desk_job',
            },
            vitals: {
                height: '170',
                weight: '95',
                gender: 'male',
                age: '45',
            },
        });

        // BMI: 95 / (1.70^2) = 32.9 → obese
        expect(profile.bmi).toBeCloseTo(32.9, 0);
        expect(profile.isObese).toBe(true);
        expect(profile.isUnderweight).toBe(false);

        // Lifestyle
        expect(profile.isAlcoholUser).toBe(true);
        expect(profile.isHeavyDrinker).toBe(false);
        expect(profile.isSedentary).toBe(true);
        expect(profile.hasLowSleep).toBe(true);

        // Family history
        expect(profile.familyHistory.cardiac).toBe(true);
        expect(profile.familyHistory.cancer).toBe(true);

        // Occupation
        expect(profile.occupation).toBe('desk');

        // Diet
        expect(profile.dietRisk.isVegetarian).toBe(true);

        // Medications
        expect(profile.medicationFlags.onThyroidMeds).toBe(true);

        // Comorbidities
        expect(profile.hasAsthma).toBe(true);
    });

    it('returns empty profile for null input', () => {
        const profile = buildPersonaProfile(null);
        expect(profile.bmi).toBeNull();
        expect(profile.isObese).toBe(false);
        expect(profile.familyHistory.cardiac).toBe(false);
        expect(profile.occupation).toBe('unknown');
    });

    it('uses topLevel fallbacks for vitals', () => {
        const profile = buildPersonaProfile(
            {}, // empty medical_profile
            { age: '30', gender: 'female', weight: '60', height: '165' }
        );
        // BMI: 60 / (1.65^2) = 22.0
        expect(profile.bmi).toBeCloseTo(22.0, 0);
        expect(profile.isObese).toBe(false);
    });

    it('detects PCOS from conditions', () => {
        const profile = buildPersonaProfile({
            conditions: ['PCOS', 'Migraine'],
        });
        expect(profile.hasPCOS).toBe(true);
    });

    it('detects depression from conditions', () => {
        const profile = buildPersonaProfile({
            conditions: ['Depression', 'Anxiety'],
        });
        expect(profile.hasDepression).toBe(true);
    });

    it('detects heavy alcohol from lifestyle', () => {
        const profile = buildPersonaProfile({
            lifestyle: { alcohol: 'heavy' },
        });
        expect(profile.isHeavyDrinker).toBe(true);
        expect(profile.isAlcoholUser).toBe(true);
    });

    it('detects vigorous exercise', () => {
        const profile = buildPersonaProfile({
            lifestyle: { exercise: 'intense' },
        });
        expect(profile.isVigorousExercise).toBe(true);
        expect(profile.isSedentary).toBe(false);
    });
});
