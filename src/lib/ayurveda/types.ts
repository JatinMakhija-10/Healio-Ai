/**
 * Core Type Definitions for Ayurvedic Dosha Assessment
 * 
 * CRITICAL DISTINCTION:
 * - Prakriti = Birth constitution (unchangeable)
 * - Vikriti = Current imbalance (changes with lifestyle/season/stress)
 */

export type DoshaType = 'vata' | 'pitta' | 'kapha';

/**
 * Quantified dosha scores (normalized 0-100)
 */
export interface DoshaScores {
    vata: number;
    pitta: number;
    kapha: number;
}

/**
 * Prakriti Types (Birth Constitution)
 * Based on classical Ayurvedic classification
 */
export type PrakritiType =
    // Single Dosha (Rare - ~10% of population)
    | 'vata'
    | 'pitta'
    | 'kapha'
    // Dual Dosha (Common - ~60% of population)
    | 'vata-pitta'
    | 'pitta-vata'
    | 'vata-kapha'
    | 'kapha-vata'
    | 'pitta-kapha'
    | 'kapha-pitta'
    // Tridoshic (Rare - ~1% of population)
    | 'tridoshic';

/**
 * Prakriti Profile (Birth Constitution)
 * This is STABLE and determined at conception
 */
export interface PrakritiProfile {
    prakriti: PrakritiType;

    /**
     * Detailed doshic proportions
     * Example: { vata: 50, pitta: 40, kapha: 10 } = Vata-Pitta
     */
    doshicTendencies: DoshaScores;

    /**
     * Confidence in this assessment (0-1)
     * Based on questionnaire completeness and answer consistency
     */
    confidence: number;

    /**
     * How this Prakriti was determined
     */
    assessmentMethod: 'questionnaire' | 'genetic' | 'pulse' | 'expert';

    /**
     * When this was assessed
     */
    assessedAt: Date;

    /**
     * Key characteristics that define this Prakriti
     */
    definingCharacteristics: {
        physical: string[];      // Body frame, skin, hair
        physiological: string[]; // Digestion, sleep, appetite
        mental: string[];        // Memory, learning, temperament
        behavioral: string[];    // Activity level, spending habits
    };
}

/**
 * Vikriti Profile (Current Doshic Imbalance)
 * This is DYNAMIC and changes constantly
 */
export interface VikritiProfile {
    /**
     * Current dominant dosha(s)
     */
    primaryDosha: DoshaType;
    secondaryDosha?: DoshaType;

    /**
     * Current dosha scores
     */
    scores: DoshaScores;

    /**
     * What's causing the current imbalance
     */
    contributingFactors: {
        lifestyle: string[];     // Sleep, exercise, stress
        diet: string[];          // Food choices, eating patterns
        seasonal: string[];      // Current season's influence
        emotional: string[];     // Stress, anxiety, anger
        environmental: string[]; // Climate, pollution
    };

    /**
     * Severity of imbalance (0-100)
     * 0-20: Balanced
     * 21-40: Mild imbalance
     * 41-60: Moderate imbalance
     * 61-80: Severe imbalance
     * 81-100: Critical imbalance (Panchakarma needed)
     */
    imbalanceSeverity: number;

    /**
     * When this state was assessed
     */
    assessedAt: Date;

    /**
     * Current symptoms indicating this imbalance
     */
    symptoms: string[];
}

/**
 * Complete Doshic Health Assessment
 * Compares Prakriti (natural state) vs Vikriti (current state)
 */
export interface DoshicAssessment {
    /**
     * Your birth constitution (stable reference point)
     */
    prakriti: PrakritiProfile;

    /**
     * Your current doshic state (what needs balancing)
     */
    vikriti: VikritiProfile;

    /**
     * Deviation from natural state
     * Positive = excess, Negative = deficiency
     */
    deviation: DoshaScores;

    /**
     * Overall health status based on deviation
     */
    healthStatus: 'balanced' | 'mild-imbalance' | 'moderate-imbalance' | 'severe-imbalance';

    /**
     * Primary health goal
     */
    primaryGoal: string;

    /**
     * Confidence in this entire assessment (0-1)
     */
    overallConfidence: number;

    /**
     * Limitations and disclaimers
     */
    limitations: string[];
}

/**
 * Agni (Digestive Fire) Types
 * MORE IMPORTANT than doshas for treatment
 */
export type AgniType =
    | 'sama'     // Balanced (ideal)
    | 'vishama'  // Irregular (Vata imbalance)
    | 'tikshna'  // Sharp/Excessive (Pitta imbalance)
    | 'manda';   // Weak/Slow (Kapha imbalance)

/**
 * Agni Assessment
 */
export interface AgniAssessment {
    type: AgniType;
    strength: number; // 1-10 scale

    characteristics: string[];

    /**
     * Specific recommendations to balance Agni
     */
    recommendations: {
        diet: string[];
        lifestyle: string[];
        herbs: string[];
        timing: string[]; // When to eat
    };

    /**
     * Signs of improvement to watch for
     */
    expectedImprovements: string[];
}

/**
 * Seasonal Dosha Influence (Ritucharya)
 */
export interface SeasonalDoshicInfluence {
    season: 'vasanta' | 'grishma' | 'varsha' | 'sharad' | 'hemanta' | 'shishira';
    westernSeason: 'spring' | 'summer' | 'monsoon' | 'autumn' | 'early-winter' | 'late-winter';

    /**
     * Which dosha accumulates during this season
     */
    doshaAccumulation: DoshaType;

    /**
     * Which dosha gets aggravated/provoked
     */
    doshaProvocation: DoshaType;

    /**
     * Which dosha naturally decreases
     */
    doshaAlleviation: DoshaType;

    /**
     * Season-specific recommendations
     */
    seasonalGuidance: {
        emphasize: string[];
        avoid: string[];
        herbs: string[];
    };
}

/**
 * Therapeutic Plan to Restore Balance
 */
export interface TherapeuticPlan {
    primaryGoal: string;
    timeframe: string;

    /**
     * Diet recommendations
     */
    diet: {
        emphasize: string[];
        avoid: string[];
        cookingMethods: string[];
        tastes: string[]; // Sweet, sour, salty, pungent, bitter, astringent
    };

    /**
     * Lifestyle modifications
     */
    lifestyle: {
        dailyRoutine: string[];    // Dinacharya
        exercise: string[];
        sleep: string[];
        stressManagement: string[];
    };

    /**
     * Herbal support
     */
    herbs: Array<{
        name: string;
        sanskrit?: string;
        purpose: string;
        dosage?: string;
    }>;

    /**
     * Seasonal adjustments
     */
    seasonal?: SeasonalDoshicInfluence;

    /**
     * When to reassess
     */
    monitoring: {
        reassessIn: string;
        trackSymptoms: string[];
        expectedChanges: string[];
    };

    /**
     * When to seek professional help
     */
    seekHelp?: string;
}

/**
 * Scoring weight for questionnaire factors
 */
export interface ScoringWeight {
    factor: string;
    weight: number;      // How important (0-1)
    confidence: number;  // How reliable (0-1)
}

/**
 * Validation case for algorithm testing
 */
export interface ValidationCase {
    id: string;
    questionnaire: any; // Will be defined in prakritiQuestionnaire.ts
    expertDiagnosis: PrakritiType;
    expertConfidence: number;
    notes?: string;
}

/**
 * Assessment quality metrics
 */
export interface AssessmentQuality {
    questionsAnswered: number;
    questionsTotal: number;
    completeness: number; // Percentage
    consistencyScore: number; // 0-1
    recommendation: string;
}
