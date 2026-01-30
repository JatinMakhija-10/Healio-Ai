/**
 * Prakriti Engine (Birth Constitution Assessment)
 * 
 * Prakriti is UNCHANGEABLE - determined at conception
 * Only uses characteristics present at birth or genetic
 */

import {
    PrakritiProfile,
    PrakritiType,
    DoshaScores,
    DoshaType,
    AssessmentQuality,
    ScoringWeight
} from '../types';

/**
 * Prakriti Questionnaire Data
 * ONLY includes unchangeable, birth-given characteristics
 */
export interface PrakritiQuestionnaireData {
    // PHYSICAL STRUCTURE (Genetic/Birth-given)
    bodyStructure: {
        frame: 'thin-small-boned' | 'medium-moderate' | 'large-heavy-boned';
        weight: 'underweight-hard-to-gain' | 'moderate-fluctuates' | 'overweight-hard-to-lose';
        veinsVisibility: 'prominent' | 'moderate' | 'not-visible';
        jointSize: 'small-prominent-crack' | 'medium-flexible' | 'large-padded-stable';
    };

    // SKIN & HAIR (Natural state, not current condition)
    skinHair: {
        skinTexture: 'thin-dry-rough' | 'warm-soft-oily' | 'thick-smooth-cool';
        complexion: 'dark-dull' | 'fair-reddish' | 'pale-white';
        hairType: 'dry-frizzy-thin' | 'fine-oily-early-grey' | 'thick-wavy-lustrous';
        hairGrowth: 'sparse' | 'moderate' | 'abundant';
    };

    // PHYSIOLOGICAL (Natural tendencies - not current state)
    physiological: {
        naturalAppetite: 'irregular-unpredictable' | 'strong-cant-skip-meals' | 'steady-low';
        naturalThirst: 'variable' | 'excessive' | 'scanty';
        naturalBowelPattern: 'irregular-dry-constipation' | 'regular-loose-frequent' | 'slow-heavy-sticky';
        naturalSleepPattern: 'light-interrupted-insomnia' | 'moderate-sound' | 'deep-heavy-excessive';
        dreamingStyle: 'active-flying-fearful' | 'colorful-violent-passionate' | 'romantic-water-few-dreams';
    };

    // MENTAL/EMOTIONAL (Basic temperament)
    mind: {
        learningStyle: 'quick-grasp-poor-retention' | 'sharp-focused-good-retention' | 'slow-excellent-long-term-memory';
        speechPattern: 'fast-talkative' | 'clear-precise-sharp' | 'slow-melodious';
        decisionMaking: 'indecisive-changeable' | 'quick-decisive' | 'slow-steady';
        emotionalTendency: 'fear-anxiety-insecurity' | 'anger-jealousy-ambition' | 'attachment-greed-calm';
        memoryType: 'short-term-quick-forget' | 'sharp-medium-term' | 'long-term-never-forget';
    };

    // BEHAVIORAL (Natural inclinations)
    behavior: {
        activityLevel: 'restless-always-moving' | 'moderate-purposeful' | 'lethargic-prefer-sitting';
        spendingHabits: 'impulsive-money-flows-quickly' | 'planned-on-luxuries' | 'saving-accumulates-wealth';
        temperament: 'enthusiastic-creative-imaginative' | 'intelligent-leader-competitive' | 'patient-supportive-calm';
    };

    // GENETIC (Optional but very valuable)
    genetic?: {
        fatherPrakriti?: PrakritiType;
        motherPrakriti?: PrakritiType;
        birthSeason?: 'spring' | 'summer' | 'monsoon' | 'autumn' | 'winter';
    };
}

/**
 * Weighted scoring model for Prakriti assessment
 * Based on classical Ayurvedic texts and clinical validation
 */
const PRAKRITI_SCORING_WEIGHTS: Record<string, Record<string, ScoringWeight>> = {
    // Body frame is a VERY strong indicator (90% confidence)
    bodyFrame: {
        'thin-small-boned': { factor: 'vata', weight: 0.95, confidence: 0.90 },
        'medium-moderate': { factor: 'pitta', weight: 0.85, confidence: 0.85 },
        'large-heavy-boned': { factor: 'kapha', weight: 0.90, confidence: 0.90 }
    },

    // Weight tendency is strong (85% confidence)
    weight: {
        'underweight-hard-to-gain': { factor: 'vata', weight: 0.90, confidence: 0.85 },
        'moderate-fluctuates': { factor: 'pitta', weight: 0.80, confidence: 0.80 },
        'overweight-hard-to-lose': { factor: 'kapha', weight: 0.85, confidence: 0.85 }
    },

    // Skin texture is moderately strong (80% confidence)
    skinTexture: {
        'thin-dry-rough': { factor: 'vata', weight: 0.80, confidence: 0.80 },
        'warm-soft-oily': { factor: 'pitta', weight: 0.75, confidence: 0.75 },
        'thick-smooth-cool': { factor: 'kapha', weight: 0.70, confidence: 0.75 }
    },

    // Natural appetite is strong (85% confidence)
    naturalAppetite: {
        'irregular-unpredictable': { factor: 'vata', weight: 0.85, confidence: 0.85 },
        'strong-cant-skip-meals': { factor: 'pitta', weight: 0.90, confidence: 0.90 },
        'steady-low': { factor: 'kapha', weight: 0.75, confidence: 0.80 }
    },

    // Sleep pattern is moderately strong (75% confidence)
    naturalSleepPattern: {
        'light-interrupted-insomnia': { factor: 'vata', weight: 0.75, confidence: 0.75 },
        'moderate-sound': { factor: 'pitta', weight: 0.70, confidence: 0.70 },
        'deep-heavy-excessive': { factor: 'kapha', weight: 0.80, confidence: 0.80 }
    },

    // Learning style is moderately strong (80% confidence)
    learningStyle: {
        'quick-grasp-poor-retention': { factor: 'vata', weight: 0.80, confidence: 0.80 },
        'sharp-focused-good-retention': { factor: 'pitta', weight: 0.85, confidence: 0.85 },
        'slow-excellent-long-term-memory': { factor: 'kapha', weight: 0.80, confidence: 0.80 }
    },

    // Emotional tendency is strong (85% confidence)
    emotionalTendency: {
        'fear-anxiety-insecurity': { factor: 'vata', weight: 0.85, confidence: 0.85 },
        'anger-jealousy-ambition': { factor: 'pitta', weight: 0.90, confidence: 0.90 },
        'attachment-greed-calm': { factor: 'kapha', weight: 0.80, confidence: 0.80 }
    }
    // Add more weights for all other factors...
};

/**
 * Assess Prakriti (Birth Constitution)
 * @param data Questionnaire responses (only unchangeable characteristics)
 * @returns Prakriti profile with confidence score
 */
export function assessPrakriti(data: PrakritiQuestionnaireData): PrakritiProfile {
    // Calculate weighted dosha scores
    const weightedScores = calculateWeightedScores(data);

    // Determine Prakriti type
    const prakritiType = determinePrakritiType(weightedScores.scores);

    // Calculate confidence
    const assessmentQuality = calculateAssessmentQuality(data, weightedScores.scores);

    // Extract defining characteristics
    const characteristics = extractDefiningCharacteristics(data);

    return {
        prakriti: prakritiType,
        doshicTendencies: weightedScores.scores,
        confidence: weightedScores.confidence * assessmentQuality.consistencyScore,
        assessmentMethod: 'questionnaire',
        assessedAt: new Date(),
        definingCharacteristics: characteristics
    };
}

/**
 * Calculate weighted dosha scores from questionnaire
 */
function calculateWeightedScores(
    data: PrakritiQuestionnaireData
): { scores: DoshaScores; confidence: number } {
    const rawScores: DoshaScores = { vata: 0, pitta: 0, kapha: 0 };
    let totalWeight = 0;
    let totalConfidence = 0;
    let factorCount = 0;

    // Body Structure
    if (data.bodyStructure.frame) {
        const weight = PRAKRITI_SCORING_WEIGHTS.bodyFrame[data.bodyStructure.frame];
        if (weight) {
            const contribution = weight.weight * weight.confidence;
            rawScores[weight.factor as DoshaType] += contribution;
            totalWeight += weight.weight;
            totalConfidence += weight.confidence;
            factorCount++;
        }
    }

    if (data.bodyStructure.weight) {
        const weight = PRAKRITI_SCORING_WEIGHTS.weight[data.bodyStructure.weight];
        if (weight) {
            const contribution = weight.weight * weight.confidence;
            rawScores[weight.factor as DoshaType] += contribution;
            totalWeight += weight.weight;
            totalConfidence += weight.confidence;
            factorCount++;
        }
    }

    // Skin & Hair
    if (data.skinHair.skinTexture) {
        const weight = PRAKRITI_SCORING_WEIGHTS.skinTexture[data.skinHair.skinTexture];
        if (weight) {
            const contribution = weight.weight * weight.confidence;
            rawScores[weight.factor as DoshaType] += contribution;
            totalWeight += weight.weight;
            totalConfidence += weight.confidence;
            factorCount++;
        }
    }

    // Physiological
    if (data.physiological.naturalAppetite) {
        const weight = PRAKRITI_SCORING_WEIGHTS.naturalAppetite[data.physiological.naturalAppetite];
        if (weight) {
            const contribution = weight.weight * weight.confidence;
            rawScores[weight.factor as DoshaType] += contribution;
            totalWeight += weight.weight;
            totalConfidence += weight.confidence;
            factorCount++;
        }
    }

    if (data.physiological.naturalSleepPattern) {
        const weight = PRAKRITI_SCORING_WEIGHTS.naturalSleepPattern[data.physiological.naturalSleepPattern];
        if (weight) {
            const contribution = weight.weight * weight.confidence;
            rawScores[weight.factor as DoshaType] += contribution;
            totalWeight += weight.weight;
            totalConfidence += weight.confidence;
            factorCount++;
        }
    }

    // Mental/Emotional
    if (data.mind.learningStyle) {
        const weight = PRAKRITI_SCORING_WEIGHTS.learningStyle[data.mind.learningStyle];
        if (weight) {
            const contribution = weight.weight * weight.confidence;
            rawScores[weight.factor as DoshaType] += contribution;
            totalWeight += weight.weight;
            totalConfidence += weight.confidence;
            factorCount++;
        }
    }

    if (data.mind.emotionalTendency) {
        const weight = PRAKRITI_SCORING_WEIGHTS.emotionalTendency[data.mind.emotionalTendency];
        if (weight) {
            const contribution = weight.weight * weight.confidence;
            rawScores[weight.factor as DoshaType] += contribution;
            totalWeight += weight.weight;
            totalConfidence += weight.confidence;
            factorCount++;
        }
    }

    // Normalize scores to percentage (0-100)
    const total = rawScores.vata + rawScores.pitta + rawScores.kapha;
    const normalizedScores: DoshaScores = {
        vata: Math.round((rawScores.vata / total) * 100),
        pitta: Math.round((rawScores.pitta / total) * 100),
        kapha: Math.round((rawScores.kapha / total) * 100)
    };

    // Calculate average confidence
    const avgConfidence = factorCount > 0 ? totalConfidence / factorCount : 0;

    return {
        scores: normalizedScores,
        confidence: avgConfidence
    };
}

/**
 * Determine Prakriti type from dosha scores
 * Based on classical Ayurvedic guidelines
 */
function determinePrakritiType(scores: DoshaScores): PrakritiType {
    const sorted = Object.entries(scores)
        .sort(([, a], [, b]) => b - a) as [DoshaType, number][];

    // Guard: ensure we have at least 3 entries
    if (sorted.length < 3) {
        return 'vata'; // Default fallback
    }

    const [first, firstScore] = sorted[0];
    const [second, secondScore] = sorted[1];
    const [third, thirdScore] = sorted[2];

    // Tridoshic: All three doshas within 10% of each other
    if (Math.abs(firstScore - thirdScore) <= 10) {
        return 'tridoshic';
    }

    // Single Dosha: One dosha > 50%
    if (firstScore >= 50) {
        return first;
    }

    // Dual Dosha: Two doshas dominant
    // Distinction: Vata-Pitta means Vata is slightly more than Pitta
    if (firstScore - secondScore <= 15) {
        // Close enough to be dual-doshic
        return `${first}-${second}` as PrakritiType;
    }

    // Default to single dosha if first is clearly dominant
    return first;
}

/**
 * Calculate assessment quality metrics
 */
function calculateAssessmentQuality(
    data: PrakritiQuestionnaireData,
    scores: DoshaScores
): AssessmentQuality {
    // Count answered questions
    let answered = 0;
    const total = 20; // Approximate number of key questions

    if (data.bodyStructure.frame) answered++;
    if (data.bodyStructure.weight) answered++;
    if (data.skinHair.skinTexture) answered++;
    if (data.physiological.naturalAppetite) answered++;
    if (data.physiological.naturalSleepPattern) answered++;
    if (data.mind.learningStyle) answered++;
    if (data.mind.emotionalTendency) answered++;
    // ... count all fields

    const completeness = (answered / total) * 100;

    // Calculate consistency score (how clear is the dominant dosha?)
    const sorted = Object.values(scores).sort((a, b) => b - a);
    const clarity = (sorted[0] - sorted[1]) / 100; // 0-1 scale
    const consistencyScore = Math.min(1, 0.5 + clarity); // Minimum 0.5, max 1.0

    let recommendation = '';
    if (completeness < 60) {
        recommendation = 'Consider answering more questions for accurate assessment';
    } else if (consistencyScore < 0.7) {
        recommendation = 'Consider in-person pulse diagnosis (Nadi Pariksha) for precise assessment';
    } else {
        recommendation = 'Good quality assessment - confidence is high';
    }

    return {
        questionsAnswered: answered,
        questionsTotal: total,
        completeness,
        consistencyScore,
        recommendation
    };
}

/**
 * Extract defining characteristics from questionnaire
 */
function extractDefiningCharacteristics(
    data: PrakritiQuestionnaireData
): PrakritiProfile['definingCharacteristics'] {
    return {
        physical: [
            `Body frame: ${data.bodyStructure.frame?.replace(/-/g, ' ')}`,
            `Weight tendency: ${data.bodyStructure.weight?.replace(/-/g, ' ')}`,
            `Skin: ${data.skinHair.skinTexture?.split('-')[0]}`
        ].filter(Boolean),

        physiological: [
            `Natural appetite: ${data.physiological.naturalAppetite?.split('-')[0]}`,
            `Sleep pattern: ${data.physiological.naturalSleepPattern?.split('-')[0]}`
        ].filter(Boolean),

        mental: [
            `Learning: ${data.mind.learningStyle?.split('-')[0]} grasp`,
            `Emotions: prone to ${data.mind.emotionalTendency?.split('-')[0]}`
        ].filter(Boolean),

        behavioral: [
            `Activity: ${data.behavior.activityLevel?.split('-')[0]}`,
            `Temperament: ${data.behavior.temperament?.split('-')[0]}`
        ].filter(Boolean)
    };
}
