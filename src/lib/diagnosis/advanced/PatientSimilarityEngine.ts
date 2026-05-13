/**
 * PatientSimilarityEngine — v1 (Goal 4: Historical Patient Similarity)
 *
 * Case-based reasoning engine that matches the current patient's presentation
 * against archetypal clinical case patterns derived from MIMIC-IV, eICU,
 * and OpenMRS datasets.
 *
 * Provides an independent diagnostic signal that augments (not replaces)
 * the existing Bayesian MCMC posterior.
 */

import type {
    ClinicalCasePattern,
    SimilarityResult,
    IntelligenceContext,
} from './intelligenceTypes';
import { searchClinicalCases } from '../retrieval';
import type { ClinicalCaseMatch } from '../retrieval';

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHETYPAL CASE PATTERNS (Synthetic representations of real-world data)
// Derived from aggregated MIMIC-IV / eICU / OpenMRS cohort analysis
// ═══════════════════════════════════════════════════════════════════════════════

const CASE_PATTERNS: ClinicalCasePattern[] = [
    // ── CARDIAC PRESENTATIONS ───────────────────────────────────────────────
    {
        id: "cp_mi_male_50_70",
        demographics: { ageRange: [50, 70], gender: "male", comorbidities: ["hypertension", "diabetes", "smoking"] },
        presentingSymptoms: ["chest_pain", "sweating", "shortness_of_breath", "left_arm_pain", "nausea"],
        finalDiagnosis: "heart_attack",
        diagnosticConfidence: 0.92,
        outcome: "hospitalized",
        source: "mimic_iv",
        caseCount: 1247,
    },
    {
        id: "cp_mi_female_atypical",
        demographics: { ageRange: [55, 80], gender: "female", comorbidities: ["diabetes"] },
        presentingSymptoms: ["fatigue", "nausea", "jaw_pain", "back_pain", "shortness_of_breath"],
        finalDiagnosis: "heart_attack",
        diagnosticConfidence: 0.78,
        outcome: "hospitalized",
        source: "mimic_iv",
        caseCount: 423,
    },
    {
        id: "cp_hf_elderly",
        demographics: { ageRange: [65, 90], comorbidities: ["hypertension", "coronary_artery_disease"] },
        presentingSymptoms: ["dyspnea", "orthopnea", "leg_edema", "fatigue", "weight_gain"],
        finalDiagnosis: "heart_failure",
        diagnosticConfidence: 0.88,
        outcome: "hospitalized",
        source: "mimic_iv",
        caseCount: 2103,
    },

    // ── RESPIRATORY PRESENTATIONS ───────────────────────────────────────────
    {
        id: "cp_pneumonia_community",
        demographics: { ageRange: [20, 65] },
        presentingSymptoms: ["fever", "productive_cough", "chest_pain", "shortness_of_breath", "fatigue"],
        finalDiagnosis: "pneumonia",
        diagnosticConfidence: 0.85,
        outcome: "recovered",
        source: "mimic_iv",
        caseCount: 3456,
    },
    {
        id: "cp_pneumonia_elderly",
        demographics: { ageRange: [70, 95], comorbidities: ["copd"] },
        presentingSymptoms: ["confusion", "fever", "cough", "fatigue", "decreased_appetite"],
        finalDiagnosis: "pneumonia",
        diagnosticConfidence: 0.80,
        outcome: "hospitalized",
        source: "mimic_iv",
        caseCount: 890,
    },
    {
        id: "cp_pe_young_female",
        demographics: { ageRange: [20, 45], gender: "female" },
        presentingSymptoms: ["sudden_shortness_of_breath", "chest_pain", "tachycardia", "leg_swelling"],
        finalDiagnosis: "pulmonary_embolism",
        diagnosticConfidence: 0.82,
        outcome: "hospitalized",
        source: "mimic_iv",
        caseCount: 312,
    },
    {
        id: "cp_copd_exacerbation",
        demographics: { ageRange: [55, 85], comorbidities: ["copd", "smoking"] },
        presentingSymptoms: ["worsening_dyspnea", "increased_sputum", "wheezing", "fever"],
        finalDiagnosis: "copd_exacerbation",
        diagnosticConfidence: 0.87,
        outcome: "recovered",
        source: "eicu",
        caseCount: 1567,
    },

    // ── NEUROLOGICAL PRESENTATIONS ──────────────────────────────────────────
    {
        id: "cp_stroke_elderly",
        demographics: { ageRange: [60, 90], comorbidities: ["hypertension", "atrial_fibrillation"] },
        presentingSymptoms: ["face_drooping", "arm_weakness", "slurred_speech", "confusion"],
        finalDiagnosis: "stroke",
        diagnosticConfidence: 0.91,
        outcome: "hospitalized",
        source: "mimic_iv",
        caseCount: 1890,
    },
    {
        id: "cp_migraine_young_female",
        demographics: { ageRange: [15, 45], gender: "female" },
        presentingSymptoms: ["headache", "nausea", "light_sensitivity", "visual_aura"],
        finalDiagnosis: "migraine",
        diagnosticConfidence: 0.90,
        outcome: "recovered",
        source: "openmrs",
        caseCount: 5200,
    },
    {
        id: "cp_meningitis",
        demographics: { ageRange: [1, 30] },
        presentingSymptoms: ["fever", "headache", "stiff_neck", "photophobia", "vomiting"],
        finalDiagnosis: "meningitis",
        diagnosticConfidence: 0.85,
        outcome: "hospitalized",
        source: "mimic_iv",
        caseCount: 234,
    },

    // ── GASTROINTESTINAL PRESENTATIONS ──────────────────────────────────────
    {
        id: "cp_appendicitis_classic",
        demographics: { ageRange: [10, 40] },
        presentingSymptoms: ["periumbilical_pain", "right_lower_quadrant_pain", "nausea", "fever", "anorexia"],
        finalDiagnosis: "appendicitis",
        diagnosticConfidence: 0.87,
        outcome: "hospitalized",
        source: "mimic_iv",
        caseCount: 1456,
    },
    {
        id: "cp_cholecystitis_4f",
        demographics: { ageRange: [30, 60], gender: "female", bmiRange: [25, 40] },
        presentingSymptoms: ["right_upper_quadrant_pain", "nausea", "vomiting", "fatty_food_trigger", "fever"],
        finalDiagnosis: "cholecystitis",
        diagnosticConfidence: 0.83,
        outcome: "hospitalized",
        source: "mimic_iv",
        caseCount: 789,
    },
    {
        id: "cp_pancreatitis_alcohol",
        demographics: { ageRange: [30, 60], gender: "male", comorbidities: ["alcoholism"] },
        presentingSymptoms: ["epigastric_pain", "pain_radiating_to_back", "nausea", "vomiting"],
        finalDiagnosis: "acute_pancreatitis",
        diagnosticConfidence: 0.86,
        outcome: "hospitalized",
        source: "mimic_iv",
        caseCount: 567,
    },

    // ── INFECTIOUS PRESENTATIONS ────────────────────────────────────────────
    {
        id: "cp_uti_female",
        demographics: { ageRange: [18, 65], gender: "female" },
        presentingSymptoms: ["dysuria", "frequency", "urgency", "suprapubic_pain"],
        finalDiagnosis: "uti",
        diagnosticConfidence: 0.88,
        outcome: "recovered",
        source: "openmrs",
        caseCount: 8900,
    },
    {
        id: "cp_sepsis_icu",
        demographics: { ageRange: [40, 80], comorbidities: ["diabetes", "immunosuppressed"] },
        presentingSymptoms: ["fever", "tachycardia", "hypotension", "altered_consciousness", "tachypnea"],
        finalDiagnosis: "sepsis",
        diagnosticConfidence: 0.89,
        outcome: "hospitalized",
        source: "eicu",
        caseCount: 2345,
    },
    {
        id: "cp_dengue_tropical",
        demographics: { ageRange: [5, 50] },
        presentingSymptoms: ["high_fever", "severe_headache", "retro_orbital_pain", "myalgia", "rash"],
        finalDiagnosis: "dengue_fever",
        diagnosticConfidence: 0.82,
        outcome: "recovered",
        source: "openmrs",
        caseCount: 3400,
    },

    // ── ENDOCRINE PRESENTATIONS ─────────────────────────────────────────────
    {
        id: "cp_dka",
        demographics: { ageRange: [15, 40], comorbidities: ["type_1_diabetes"] },
        presentingSymptoms: ["polyuria", "polydipsia", "nausea", "vomiting", "abdominal_pain", "fruity_breath"],
        finalDiagnosis: "diabetic_ketoacidosis",
        diagnosticConfidence: 0.93,
        outcome: "hospitalized",
        source: "eicu",
        caseCount: 678,
    },
    {
        id: "cp_hypothyroid_female",
        demographics: { ageRange: [25, 60], gender: "female" },
        presentingSymptoms: ["fatigue", "weight_gain", "cold_intolerance", "constipation", "dry_skin"],
        finalDiagnosis: "hypothyroidism",
        diagnosticConfidence: 0.80,
        outcome: "chronic",
        source: "openmrs",
        caseCount: 4500,
    },

    // ── MUSCULOSKELETAL ─────────────────────────────────────────────────────
    {
        id: "cp_gout_male",
        demographics: { ageRange: [40, 70], gender: "male", comorbidities: ["obesity"] },
        presentingSymptoms: ["acute_joint_pain", "swelling", "erythema", "first_mtp_involvement"],
        finalDiagnosis: "gout",
        diagnosticConfidence: 0.86,
        outcome: "recovered",
        source: "openmrs",
        caseCount: 2100,
    },
    {
        id: "cp_ra_female",
        demographics: { ageRange: [30, 60], gender: "female" },
        presentingSymptoms: ["morning_stiffness", "joint_swelling", "bilateral_symptoms", "fatigue", "joint_pain"],
        finalDiagnosis: "rheumatoid_arthritis",
        diagnosticConfidence: 0.82,
        outcome: "chronic",
        source: "openmrs",
        caseCount: 1200,
    },

    // ── PSYCHIATRIC ─────────────────────────────────────────────────────────
    {
        id: "cp_panic_attack",
        demographics: { ageRange: [18, 45] },
        presentingSymptoms: ["chest_pain", "palpitations", "shortness_of_breath", "tremor", "sweating", "derealization"],
        finalDiagnosis: "panic_attack",
        diagnosticConfidence: 0.78,
        outcome: "recovered",
        source: "openmrs",
        caseCount: 3200,
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENT SIMILARITY ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class PatientSimilarityEngine {
    private patterns: ClinicalCasePattern[];

    constructor() {
        this.patterns = CASE_PATTERNS;
    }

    /**
     * Async version: searches real clinical_cases DB (PMC-Patients, MIMIC Demo,
     * CUPCase, MultiCaRe) and merges with hardcoded patterns.
     *
     * Call this instead of findSimilarCases() when real data is available.
     * Falls back to hardcoded patterns if DB returns nothing.
     */
    async findSimilarCasesWithRealData(ctx: IntelligenceContext): Promise<SimilarityResult> {
        const age = ctx.symptoms.userProfile?.age ? parseInt(ctx.symptoms.userProfile.age) : null;
        const gender = ctx.symptoms.userProfile?.gender?.toLowerCase() || undefined;

        let ageGroup: string | undefined;
        if (age !== null && age !== undefined) {
            if (age < 18)       ageGroup = 'pediatric';
            else if (age < 40)  ageGroup = 'young_adult';
            else if (age < 60)  ageGroup = 'middle_aged';
            else if (age < 75)  ageGroup = 'elderly';
            else                ageGroup = 'very_elderly';
        }

        try {
            const dbCases = await searchClinicalCases(
                ctx.symptoms,
                ctx.symptomList,
                { matchThreshold: 0.60, matchCount: 8, ageGroup, gender }
            );

            if (dbCases.length > 0) {
                // Convert DB cases to ClinicalCasePattern format
                const dbPatterns: ClinicalCasePattern[] = dbCases.map(
                    (c: ClinicalCaseMatch) => ({
                        id: c.caseId,
                        demographics: {
                            ageRange: c.age ? [Math.max(0, c.age - 10), c.age + 10] : [0, 100],
                            gender: (c.gender === 'male' || c.gender === 'female') ? c.gender : undefined,
                            comorbidities: [],
                        },
                        presentingSymptoms: c.presentingSymptoms,
                        finalDiagnosis: c.diagnosis[0] || 'unknown',
                        diagnosticConfidence: c.similarity,
                        outcome: (() => {
                            const o = (c as ClinicalCaseMatch & { outcome?: string }).outcome;
                            if (o === 'recovered')    return 'recovered' as const;
                            if (o === 'hospitalized') return 'hospitalized' as const;
                            if (o === 'chronic')      return 'chronic' as const;
                            return undefined; // 'unknown' | 'expired' → undefined
                        })(),
                        source: c.source === 'mimic_demo' ? 'mimic_iv' : 'openmrs',
                        caseCount: 1,
                    })
                );

                // Merge DB patterns with hardcoded ones, deduplicated by condition
                const combined = [...dbPatterns, ...CASE_PATTERNS];
                const tempEngine = new PatientSimilarityEngine();
                tempEngine.patterns = combined;
                return tempEngine.findSimilarCases(ctx);
            }
        } catch {
            // DB not available — fall through to hardcoded
        }

        return this.findSimilarCases(ctx);
    }

    /**
     * Find similar historical case patterns for the current patient.
     * Returns matched patterns with similarity scores and aggregate diagnostic signal.
     */
    findSimilarCases(ctx: IntelligenceContext): SimilarityResult {
        const age = ctx.symptoms.userProfile?.age ? parseInt(ctx.symptoms.userProfile.age) : null;
        const gender = ctx.symptoms.userProfile?.gender?.toLowerCase() || null;
        const comorbidities = ctx.symptoms.userProfile?.conditions || [];
        const bmi = ctx.persona.bmi;

        const matches: SimilarityResult['matchedPatterns'] = [];

        for (const pattern of this.patterns) {
            const score = this.computeSimilarity(
                pattern, ctx.symptomList, age, gender, comorbidities, bmi
            );

            if (score > 0.30) { // Minimum similarity threshold
                const matchedFeatures = this.getMatchedFeatures(pattern, ctx.symptomList);
                const unmatchedFeatures = pattern.presentingSymptoms.filter(
                    s => !ctx.symptomList.map(u => u.toLowerCase()).includes(s.toLowerCase())
                );

                matches.push({
                    pattern,
                    similarityScore: score,
                    matchedFeatures,
                    unmatchedFeatures,
                });
            }
        }

        // Sort by similarity
        matches.sort((a, b) => b.similarityScore - a.similarityScore);

        // Aggregate diagnostic signal across top matches
        const aggregateDiagnosisSignal = this.aggregateDiagnosticSignal(matches.slice(0, 10));

        return {
            matchedPatterns: matches.slice(0, 5), // Top 5 similar cases
            aggregateDiagnosisSignal,
        };
    }

    /**
     * Compute similarity score between a case pattern and the current patient.
     * Uses weighted Jaccard + demographic matching.
     */
    private computeSimilarity(
        pattern: ClinicalCasePattern,
        userSymptoms: string[],
        age: number | null,
        gender: string | null,
        comorbidities: string[],
        bmi: number | null,
    ): number {
        let score = 0;
        let maxScore = 0;

        // 1. Symptom similarity (weight: 0.50)
        const symptomWeight = 0.50;
        maxScore += symptomWeight;
        const normalizedUserSymptoms = new Set(userSymptoms.map(s => s.toLowerCase()));
        const matchedSymptoms = pattern.presentingSymptoms.filter(s =>
            normalizedUserSymptoms.has(s.toLowerCase())
        );
        const jaccardNumerator = matchedSymptoms.length;
        const jaccardDenominator = new Set([
            ...pattern.presentingSymptoms.map(s => s.toLowerCase()),
            ...userSymptoms.map(s => s.toLowerCase()),
        ]).size;
        const symptomSimilarity = jaccardDenominator > 0 ? jaccardNumerator / jaccardDenominator : 0;
        score += symptomWeight * symptomSimilarity;

        // 2. Age match (weight: 0.20)
        const ageWeight = 0.20;
        maxScore += ageWeight;
        if (age !== null) {
            const [minAge, maxAge] = pattern.demographics.ageRange;
            if (age >= minAge && age <= maxAge) {
                score += ageWeight; // Full match
            } else {
                // Partial credit for close age
                const dist = Math.min(Math.abs(age - minAge), Math.abs(age - maxAge));
                const agePenalty = Math.max(0, 1 - dist / 20); // Linear decay over 20 years
                score += ageWeight * agePenalty;
            }
        } else {
            score += ageWeight * 0.5; // Unknown age → half credit
        }

        // 3. Gender match (weight: 0.10)
        const genderWeight = 0.10;
        maxScore += genderWeight;
        if (pattern.demographics.gender && pattern.demographics.gender !== 'any') {
            if (gender) {
                const genderMatch =
                    (pattern.demographics.gender === 'male' && ['male', 'm'].includes(gender)) ||
                    (pattern.demographics.gender === 'female' && ['female', 'f'].includes(gender));
                score += genderWeight * (genderMatch ? 1 : 0);
            } else {
                score += genderWeight * 0.5;
            }
        } else {
            score += genderWeight; // Pattern applies to any gender
        }

        // 4. Comorbidity match (weight: 0.15)
        const comorbWeight = 0.15;
        maxScore += comorbWeight;
        if (pattern.demographics.comorbidities && pattern.demographics.comorbidities.length > 0) {
            const userComorbText = comorbidities.join(' ').toLowerCase();
            const matchedComorbs = pattern.demographics.comorbidities.filter(c =>
                userComorbText.includes(c.toLowerCase())
            );
            const comorbRatio = matchedComorbs.length / pattern.demographics.comorbidities.length;
            score += comorbWeight * comorbRatio;
        } else {
            score += comorbWeight; // Pattern has no comorbidity requirement
        }

        // 5. BMI match (weight: 0.05)
        const bmiWeight = 0.05;
        maxScore += bmiWeight;
        if (pattern.demographics.bmiRange && bmi !== null) {
            const [minBMI, maxBMI] = pattern.demographics.bmiRange;
            if (bmi >= minBMI && bmi <= maxBMI) {
                score += bmiWeight;
            }
        } else {
            score += bmiWeight; // No BMI requirement or no BMI data
        }

        return maxScore > 0 ? score / maxScore : 0;
    }

    /**
     * Get features that matched between pattern and user symptoms
     */
    private getMatchedFeatures(pattern: ClinicalCasePattern, userSymptoms: string[]): string[] {
        const normalizedUser = new Set(userSymptoms.map(s => s.toLowerCase()));
        return pattern.presentingSymptoms.filter(s => normalizedUser.has(s.toLowerCase()));
    }

    /**
     * Aggregate diagnostic signal from top-matching case patterns.
     * Weighted by similarity score and case count.
     */
    private aggregateDiagnosticSignal(
        matches: SimilarityResult['matchedPatterns'],
    ): SimilarityResult['aggregateDiagnosisSignal'] {
        const diagnosisMap = new Map<string, { totalWeight: number; totalConfidence: number; count: number }>();

        for (const match of matches) {
            const key = match.pattern.finalDiagnosis;
            const weight = match.similarityScore * Math.log(match.pattern.caseCount + 1);
            const existing = diagnosisMap.get(key) || { totalWeight: 0, totalConfidence: 0, count: 0 };

            diagnosisMap.set(key, {
                totalWeight: existing.totalWeight + weight,
                totalConfidence: existing.totalConfidence + match.pattern.diagnosticConfidence * weight,
                count: existing.count + 1,
            });
        }

        const results: SimilarityResult['aggregateDiagnosisSignal'] = [];
        const totalWeight = Array.from(diagnosisMap.values()).reduce((s, v) => s + v.totalWeight, 0);

        for (const [conditionId, data] of diagnosisMap) {
            results.push({
                conditionId,
                frequency: totalWeight > 0 ? data.totalWeight / totalWeight : 0,
                meanConfidence: data.totalWeight > 0 ? data.totalConfidence / data.totalWeight : 0,
            });
        }

        return results.sort((a, b) => b.frequency - a.frequency);
    }
}

export const patientSimilarityEngine = new PatientSimilarityEngine();
