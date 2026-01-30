/**
 * Prakriti & Vikriti Integration Module
 * 
 * This module serves as the bridge between the diagnosis engine
 * and the new separated Ayurvedic assessment system.
 * 
 * ARCHITECTURE:
 * - Prakriti (birth constitution) - assessed once, stored in profile
 * - Vikriti (current imbalance) - assessed dynamically based on symptoms
 * - Agni (digestive fire) - critical for treatment recommendations
 */

import {
    DoshicAssessment,
    PrakritiProfile,
    VikritiProfile,
    AgniAssessment,
    TherapeuticPlan
} from '../ayurveda/types';

import { assessPrakriti } from '../ayurveda/prakriti/prakritiEngine';
import { assessVikriti, VikritiAssessmentData } from '../ayurveda/vikriti/vikritiEngine';
import { analyzeDoshicHealth, generateBalancingPlan } from '../ayurveda/analysis/doshicAnalysis';
import { assessAgni, AgniAssessmentData } from '../ayurveda/agni/agniAssessment';

import { UserSymptomData, Condition, AyurvedicProfile } from './types';

interface OnboardingPrakritiData {
    bmiCategory?: string;
    age: string;
}

/**
 * Assess current Vikriti (doshic imbalance) from diagnosis symptoms
 * This runs during each diagnosis to understand current state
 */
export function assessVikritiFromSymptoms(
    symptoms: UserSymptomData,
    recentConditions: string[]
): VikritiProfile {
    // Map diagnosis symptoms to Vikriti assessment data
    const vikritiData: VikritiAssessmentData = {
        lifestyle: {
            sleepQuality: mapSleepQuality(symptoms),
            sleepDuration: mapSleepDuration(symptoms),
            exerciseFrequency: 'regular-moderate', // Would come from user profile
            stressLevel: mapStressLevel(symptoms),
            workType: 'sedentary' // Would come from user profile
        },

        diet: {
            mealRegularity: 'mostly-regular', // Would come from user profile
            predominantTastes: extractDietaryTastes(symptoms),
            foodTemperature: 'mixed',
            eatingSpeed: 'moderate',
            lateNightEating: 'occasional'
        },

        symptoms: {
            digestive: extractDigestiveSymptoms(symptoms),
            physical: extractPhysicalSymptoms(symptoms),
            mental: extractMentalSymptoms(symptoms),
            skin: extractSkinSymptoms(symptoms),
            sleep: extractSleepSymptoms(symptoms)
        },

        recentConditions,

        environment: {
            currentSeason: getCurrentSeason(),
            climate: 'moderate',
            location: { lat: 0, lon: 0 } // Would come from user location
        }
    };

    return assessVikriti(vikritiData);
}

/**
 * Assess Agni (digestive fire) from symptoms
 */
export function assessAgniFromSymptoms(symptoms: UserSymptomData): AgniAssessment {
    const agniData: AgniAssessmentData = {
        appetitePattern: mapAppetitePattern(symptoms),
        digestionSpeed: mapDigestionSpeed(symptoms),
        postMealFeeling: mapPostMealFeeling(symptoms),
        tongueCoating: 'thin-clear', // Would require visual assessment
        stoolQuality: mapStoolQuality(symptoms),
        gasAndBloating: hasGasOrBloating(symptoms) ? 'frequent' : 'none'
    };

    return assessAgni(agniData);
}

/**
 * Get Ayurvedic treatment modifiers based on Prakriti and Vikriti
 * This modifies treatment recommendations to suit individual constitution
 */
export function getAyurvedicTreatmentModifiers(
    prakriti: PrakritiProfile | null,
    vikriti: VikritiProfile,
    agni: AgniAssessment,
    condition: Condition
): {
    dietaryAdjustments: string[];
    lifestyleAdjustments: string[];
    herbalRecommendations: string[];
    warnings: string[];
} {
    const modifiers = {
        dietaryAdjustments: [] as string[],
        lifestyleAdjustments: [] as string[],
        herbalRecommendations: [] as string[],
        warnings: [] as string[]
    };

    // Agni-specific modifications (MOST IMPORTANT)
    if (agni.type === 'manda') {
        modifiers.dietaryAdjustments.push(
            'Reduce portion sizes - your weak Agni cannot digest heavy meals',
            'Emphasize warm, spiced, light foods',
            'Avoid: cold, heavy, oily foods'
        );
        modifiers.herbalRecommendations.push('Trikatu (ginger-black pepper-long pepper) before meals');
    } else if (agni.type === 'tikshna') {
        modifiers.dietaryAdjustments.push(
            'Cool, soothing foods to calm excess digestive fire',
            'Avoid: spicy, sour, fermented foods'
        );
        modifiers.herbalRecommendations.push('Aloe Vera juice or Amla before meals');
    } else if (agni.type === 'vishama') {
        modifiers.dietaryAdjustments.push(
            'CRITICAL: Establish regular meal times (same time every day)',
            'Warm, oily, cooked foods'
        );
        modifiers.warnings.push('Irregular Agni detected - prioritize meal regularity over everything else');
    }

    // Vikriti-specific modifications
    if (vikriti.primaryDosha === 'vata' && vikriti.imbalanceSeverity > 40) {
        modifiers.lifestyleAdjustments.push(
            'Prioritize routine and regularity',
            'Warm oil massage (Abhyanga) daily',
            'Avoid: travel, overstimulation, cold exposure'
        );
    } else if (vikriti.primaryDosha === 'pitta' && vikriti.imbalanceSeverity > 40) {
        modifiers.lifestyleAdjustments.push(
            'Cooling practices - avoid midday sun',
            'Reduce competitive/intense activities',
            'Practice forgiveness and letting go'
        );
    } else if (vikriti.primaryDosha === 'kapha' && vikriti.imbalanceSeverity > 40) {
        modifiers.lifestyleAdjustments.push(
            'Increase physical activity significantly',
            'Wake before 6 AM',
            'Avoid: daytime sleep, excessive sweet foods'
        );
    }

    return modifiers;
}

// ============== HELPER MAPPING FUNCTIONS ==============

function getAllSymptomText(data: UserSymptomData): string {
    return [
        ...(data.location || []),
        data.painType,
        data.triggers,
        data.additionalNotes,
        data.duration,
        data.frequency
    ].filter(Boolean).join(' ').toLowerCase();
}

function mapSleepQuality(symptoms: UserSymptomData): 'poor-irregular' | 'moderate' | 'good-regular' {
    const text = getAllSymptomText(symptoms);
    const sleepIssues = ['insomnia', 'difficulty sleeping', 'wake', 'waking', 'sleep'];
    const hasIssues = sleepIssues.some(s => text.includes(s));
    return hasIssues ? 'poor-irregular' : 'moderate';
}

function mapSleepDuration(symptoms: UserSymptomData): 'less-than-6hrs' | '6-8hrs' | 'more-than-8hrs' {
    const text = getAllSymptomText(symptoms);
    if (text.includes('sleep deprived') || text.includes('little sleep')) return 'less-than-6hrs';
    if (text.includes('oversleeping') || text.includes('too much sleep')) return 'more-than-8hrs';
    return '6-8hrs';
}

function mapStressLevel(symptoms: UserSymptomData): 'low' | 'moderate' | 'high' | 'severe' {
    const text = getAllSymptomText(symptoms);
    const stressKeywords = ['anxiety', 'stress', 'panic', 'overwhelmed', 'worry', 'tension'];

    // Count matches
    const matchCount = stressKeywords.reduce((count, keyword) =>
        text.includes(keyword) ? count + 1 : count, 0);

    if (matchCount >= 3) return 'severe';
    if (matchCount >= 2) return 'high';
    if (matchCount >= 1) return 'moderate';
    return 'low';
}

function extractDietaryTastes(symptoms: UserSymptomData): Array<'sweet' | 'sour' | 'salty' | 'pungent' | 'bitter' | 'astringent'> {
    const text = getAllSymptomText(symptoms);
    const tastes: Array<'sweet' | 'sour' | 'salty' | 'pungent' | 'bitter' | 'astringent'> = [];

    if (text.includes('sweet') || text.includes('sugar')) tastes.push('sweet');
    if (text.includes('salty') || text.includes('salt')) tastes.push('salty');
    if (text.includes('sour') || text.includes('acid')) tastes.push('sour');
    if (text.includes('spicy') || text.includes('hot')) tastes.push('pungent');
    if (text.includes('bitter')) tastes.push('bitter');

    // Default if none found (generic balanced)
    if (tastes.length === 0) return ['sweet', 'salty'];
    return tastes;
}

function extractDigestiveSymptoms(symptoms: UserSymptomData): string[] {
    const text = getAllSymptomText(symptoms);
    const digestiveKeywords = ['constipation', 'diarrhea', 'gas', 'bloating', 'acidity', 'heartburn', 'nausea', 'vomiting', 'stomach', 'abdomen'];
    return digestiveKeywords.filter(kw => text.includes(kw));
}

function extractPhysicalSymptoms(symptoms: UserSymptomData): string[] {
    const text = getAllSymptomText(symptoms);
    const physicalKeywords = ['fatigue', 'restless', 'heaviness', 'cold', 'heat', 'inflammation', 'pain', 'ache', 'weakness'];
    return physicalKeywords.filter(kw => text.includes(kw));
}

function extractMentalSymptoms(symptoms: UserSymptomData): string[] {
    const text = getAllSymptomText(symptoms);
    const mentalKeywords = ['anxiety', 'irritab', 'letharg', 'brain fog', 'depression', 'anger', 'mood', 'confusion'];
    return mentalKeywords.filter(kw => text.includes(kw));
}

function extractSkinSymptoms(symptoms: UserSymptomData): string[] {
    const text = getAllSymptomText(symptoms);
    const skinKeywords = ['dry skin', 'oily', 'rash', 'inflammation', 'itching', 'redness', 'acne'];
    return skinKeywords.filter(kw => text.includes(kw));
}

function extractSleepSymptoms(symptoms: UserSymptomData): string[] {
    const text = getAllSymptomText(symptoms);
    const sleepKeywords = ['insomnia', 'oversleeping', 'waking', 'difficulty sleeping', 'tired', 'fatigue'];
    return sleepKeywords.filter(kw => text.includes(kw));
}

function getCurrentSeason(): 'spring' | 'summer' | 'monsoon' | 'autumn' | 'winter' {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 6) return 'summer';
    if (month >= 7 && month <= 8) return 'monsoon';
    if (month >= 9 && month <= 10) return 'autumn';
    return 'winter';
}

function mapAppetitePattern(symptoms: UserSymptomData): AgniAssessmentData['appetitePattern'] {
    const text = getAllSymptomText(symptoms);
    if (text.includes('loss of appetite') || text.includes('no appetite')) return 'weak-low';
    if (text.includes('excessive hunger') || text.includes('hungry')) return 'excessive-burning';
    return 'regular-strong';
}

function mapDigestionSpeed(symptoms: UserSymptomData): 'fast' | 'moderate' | 'slow' {
    const text = getAllSymptomText(symptoms);
    if (text.includes('slow digestion') || text.includes('constipation')) return 'slow';
    if (text.includes('fast digestion') || text.includes('diarrhea')) return 'fast';
    return 'moderate';
}

function mapPostMealFeeling(symptoms: UserSymptomData): AgniAssessmentData['postMealFeeling'] {
    const text = getAllSymptomText(symptoms);
    if (text.includes('heaviness') || text.includes('bloating')) return 'heavy-lethargic';
    if (text.includes('acidity') || text.includes('heartburn') || text.includes('burning')) return 'acidic-burning';
    return 'comfortable';
}

function mapStoolQuality(symptoms: UserSymptomData): AgniAssessmentData['stoolQuality'] {
    const text = getAllSymptomText(symptoms);
    if (text.includes('constipation') || text.includes('hard stool')) return 'hard-constipated';
    if (text.includes('diarrhea') || text.includes('loose')) return 'loose-frequent';
    return 'formed-regular';
}

function hasGasOrBloating(symptoms: UserSymptomData): boolean {
    const text = getAllSymptomText(symptoms);
    return text.includes('gas') || text.includes('bloating');
}

// Compatibility function for Onboarding Wizard
export function determinePrakriti(data: OnboardingPrakritiData): AyurvedicProfile {
    // Basic heuristic based on BMI and body type
    // This is a simplified estimation until the full questionnaire is integrated

    const scores = { vata: 33, pitta: 33, kapha: 34 };

    // Weight/BMI influence
    if (data.bmiCategory === 'Underweight') scores.vata += 20;
    else if (data.bmiCategory === 'Normal weight') scores.pitta += 20;
    else if (data.bmiCategory === 'Overweight' || data.bmiCategory === 'Obesity') scores.kapha += 20;

    // Age influence (Childhood=Kapha, Adult=Pitta, Elderly=Vata)
    const age = parseInt(data.age) || 30;
    if (age < 16) scores.kapha += 10;
    else if (age > 60) scores.vata += 10;
    else scores.pitta += 10;

    // Normalize
    const total = scores.vata + scores.pitta + scores.kapha;
    scores.vata = Math.round((scores.vata / total) * 100);
    scores.pitta = Math.round((scores.pitta / total) * 100);
    scores.kapha = Math.round((scores.kapha / total) * 100);

    // Determine dominant dosha
    let primary: 'vata' | 'pitta' | 'kapha' = 'pitta';
    if (scores.vata >= scores.pitta && scores.vata >= scores.kapha) primary = 'vata';
    else if (scores.kapha >= scores.pitta && scores.kapha >= scores.vata) primary = 'kapha';

    // Determine secondary
    let secondary: 'vata' | 'pitta' | 'kapha' | null = null;
    if (primary === 'vata') secondary = scores.pitta > scores.kapha ? 'pitta' : 'kapha';
    else if (primary === 'pitta') secondary = scores.vata > scores.kapha ? 'vata' : 'kapha';
    else secondary = scores.pitta > scores.vata ? 'pitta' : 'vata';

    // If secondary is weak (< 20% difference), keep it, otherwise null if very dominant (not implemented here for simplicity)

    return {
        prakriti: primary === secondary ? primary : `${primary}-${secondary}`,
        primaryDosha: primary,
        secondaryDosha: secondary,
        doshicTendencies: scores,
        characteristics: [`Likely ${primary} dominant constitution`],
        strengths: [],
        vulnerabilities: [],
        dietaryRecommendations: [],
        lifestyleRecommendations: [],
        balancingHerbs: [],
        balancingPractices: []
    };
}

// Export types for use in other modules
export type {
    DoshicAssessment,
    PrakritiProfile,
    VikritiProfile,
    AgniAssessment,
    TherapeuticPlan
};

// Re-export core functions for easy access
export {
    assessPrakriti,
    assessVikriti,
    analyzeDoshicHealth,
    generateBalancingPlan
};
