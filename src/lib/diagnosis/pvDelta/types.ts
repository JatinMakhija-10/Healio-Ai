/**
 * Prakriti–Vikriti Delta (Δ) Types
 *
 * The Δ-pipeline step computes the algebraic gap between:
 *   • Prakriti — the patient's stable birth constitution (baseline reference)
 *   • Vikriti  — the patient's current doshic state inferred from symptoms
 *
 * A positive Δ for a dosha means that dosha is AGGRAVATED (vriddhi).
 * A negative Δ means that dosha is DEPLETED (kshaya).
 *
 * The delta then drives:
 *   1. Confidence-score modulation — remedies aligned with the Δ get a boost
 *   2. Herb filtering — herbs are ranked by their doshic compatibility with the Δ
 *   3. UI narrative — a concise Ayurvedic summary personalised to the patient
 */

export type DoshaType = 'vata' | 'pitta' | 'kapha';

/** Percentage scores for each of the three doshas (must sum ≈ 100) */
export interface DoshaScores {
    vata: number;
    pitta: number;
    kapha: number;
}

/**
 * Δ = Vikriti − Prakriti for each dosha.
 * Positive ⇒ excess (vriddhi), Negative ⇒ deficiency (kshaya)
 */
export interface DoshicDelta {
    vata: number;   // +excess / −deficiency
    pitta: number;
    kapha: number;
    /** The dosha with the largest absolute deviation */
    primaryDeviation: DoshaType;
    /** Direction of the primary deviation */
    primaryDirection: 'excess' | 'deficiency';
    /** Magnitude of the primary deviation (0-100) */
    deviationMagnitude: number;
}

/** Severity classification of the Δ imbalance */
export type ImbalanceSeverity = 'balanced' | 'mild' | 'moderate' | 'severe';

/** A scored herb entry after Δ-based compatibility scoring */
export interface DeltaScoredHerb {
    id: string;
    name: string;
    hindiName?: string;
    latinName?: string;
    doshaEffect: string;
    /** How well this herb addresses the computed Δ (0-1) */
    compatibilityScore: number;
    /** Which doshas this herb pacifies */
    pacifies: DoshaType[];
    /** Which doshas this herb may aggravate */
    mayAggravate: DoshaType[];
    /** Preparation instructions (first listed preparation) */
    primaryPreparation?: string;
    /** Brief clinical rationale for why this herb is recommended */
    rationale: string;
    /** Safety notes */
    contraindications: string[];
    conditions: string[];
}

/**
 * The full Prakriti–Vikriti Delta assessment result.
 * Attached to the OrchestratedResult and forwarded to the UI.
 */
export interface PVDeltaAssessment {
    /** Prakriti (birth constitution) derived from user profile */
    prakriti: {
        primaryDosha: DoshaType;
        secondaryDosha: DoshaType | null;
        scores: DoshaScores;
        assessmentSource: 'profile_stored' | 'bmi_age_heuristic' | 'default';
    };

    /** Vikriti (current imbalance) derived from symptom analysis */
    vikriti: {
        primaryDosha: DoshaType;
        secondaryDosha: DoshaType | null;
        scores: DoshaScores;
        imbalanceSeverity: number;   // 0-100 raw score
        contributingSymptoms: string[];
    };

    /** Δ = Vikriti − Prakriti */
    delta: DoshicDelta;

    /** Severity classification */
    imbalanceSeverity: ImbalanceSeverity;

    /** Herbs ranked by Δ compatibility (top 5) */
    recommendedHerbs: DeltaScoredHerb[];

    /**
     * Confidence modifier for the overall diagnosis score (+/− percentage points)
     * Remedies aligned with the Δ get a positive boost.
     */
    confidenceModifier: number;

    /** Narrative summary in plain language */
    summary: string;

    /** Detailed Ayurvedic therapeutic guidance */
    therapeuticGuidance: {
        dietEmphasis: string[];
        dietAvoid: string[];
        lifestyle: string[];
        practices: string[];   // yoga, pranayama, etc.
    };

    /** Season at assessment time */
    currentSeason: 'spring' | 'summer' | 'monsoon' | 'autumn' | 'winter';

    /** When this assessment was computed */
    assessedAt: string;
}
