/**
 * Agni (Digestive Fire) Assessment Module
 * 
 * Agni is MORE IMPORTANT than doshas in Ayurvedic treatment.
 * ALL disease begins with impaired Agni.
 * 
 * "Agni is the Root of Life" - Charaka Samhita
 */

import {
    AgniAssessment,
    AgniType
} from '../types';

/**
 * Agni Assessment Input Data
 */
export interface AgniAssessmentData {
    appetitePattern: 'regular-strong' | 'irregular-variable' | 'excessive-burning' | 'weak-low';
    digestionSpeed: 'fast' | 'moderate' | 'slow';
    postMealFeeling: 'energized' | 'comfortable' | 'heavy-lethargic' | 'acidic-burning';
    tongueCoating: 'thin-clear' | 'white-thick' | 'yellow-sticky' | 'none-red';
    stoolQuality: 'formed-regular' | 'loose-frequent' | 'hard-constipated' | 'variable';
    gasAndBloating: 'none' | 'occasional' | 'frequent';
}

/**
 * Assess Agni (Digestive Fire)
 * @param data Agni assessment questionnaire responses
 * @returns Agni assessment with type and recommendations
 */
export function assessAgni(data: AgniAssessmentData): AgniAssessment {
    // Determine Agni type based on patterns
    const agniType = determineAgniType(data);

    // Calculate strength (1-10)
    const strength = calculateAgniStrength(data, agniType);

    // Get characteristics
    const characteristics = getAgniCharacteristics(agniType);

    // Generate recommendations
    const recommendations = generateAgniRecommendations(agniType); // Get expected improvements
    const expectedImprovements = getExpectedImprovements(agniType);

    return {
        type: agniType,
        strength,
        characteristics,
        recommendations,
        expectedImprovements
    };
}

/**
 * Determine Agni type from assessment data
 */
function determineAgniType(data: AgniAssessmentData): AgniType {
    let vataScore = 0;
    let pittaScore = 0;
    let kaphaScore = 0;

    // Appetite Pattern
    if (data.appetitePattern === 'irregular-variable') vataScore += 3;
    if (data.appetitePattern === 'excessive-burning') pittaScore += 3;
    if (data.appetitePattern === 'weak-low') kaphaScore += 3;
    if (data.appetitePattern === 'regular-strong') pittaScore += 2;

    // Digestion Speed
    if (data.digestionSpeed === 'fast') pittaScore += 2;
    if (data.digestionSpeed === 'slow') kaphaScore += 2;
    if (data.digestionSpeed === 'moderate') pittaScore += 1;

    // Post-Meal Feeling
    if (data.postMealFeeling === 'heavy-lethargic') kaphaScore += 3;
    if (data.postMealFeeling === 'acidic-burning') pittaScore += 3;
    if (data.postMealFeeling === 'comfortable') pittaScore += 2; // Balanced

    // Tongue Coating
    if (data.tongueCoating === 'white-thick') kaphaScore += 2;
    if (data.tongueCoating === 'yellow-sticky') pittaScore += 2;
    if (data.tongueCoating === 'thin-clear') pittaScore += 2; // Balanced
    if (data.tongueCoating === 'none-red') pittaScore += 1; // Could indicate excess Pitta

    // Stool Quality
    if (data.stoolQuality === 'loose-frequent') pittaScore += 2;
    if (data.stoolQuality === 'hard-constipated') vataScore += 2;
    if (data.stoolQuality === 'variable') vataScore += 3;
    if (data.stoolQuality === 'formed-regular') pittaScore += 2; // Balanced

    // Gas and Bloating
    if (data.gasAndBloating === 'frequent') {
        vataScore += 2;
        kaphaScore += 1;
    }

    // Determine Agni type
    const maxScore = Math.max(vataScore, pittaScore, kaphaScore);

    // Balanced Agni (Sama)
    if (data.appetitePattern === 'regular-strong' &&
        data.postMealFeeling === 'comfortable' &&
        data.stoolQuality === 'formed-regular' &&
        data.gasAndBloating === 'none') {
        return 'sama';
    }

    // Irregular Agni (Vishama) - Vata
    if (vataScore === maxScore) {
        return 'vishama';
    }

    // Sharp Agni (Tikshna) - Pitta
    if (pittaScore === maxScore && data.appetitePattern === 'excessive-burning') {
        return 'tikshna';
    }

    // Weak Agni (Manda) - Kapha
    if (kaphaScore === maxScore) {
        return 'manda';
    }

    // Default based on highest score
    if (pittaScore >= vataScore && pittaScore >= kaphaScore) return 'sama'; // Pitta Agni tends toward balanced
    if (kaphaScore > vataScore) return 'manda';
    return 'vishama';
}

/**
 * Calculate Agni strength (1-10 scale)
 */
function calculateAgniStrength(data: AgniAssessmentData, type: AgniType): number {
    switch (type) {
        case 'sama':
            return 9; // Excellent strength

        case 'tikshna':
            return 8; // Very strong but excessive

        case 'vishama':
            // Variable - assess based on current state
            if (data.postMealFeeling === 'comfortable') return 6;
            if (data.gasAndBloating === 'frequent') return 4;
            return 5; // Moderate but unreliable

        case 'manda':
            // Weak
            if (data.appetitePattern === 'weak-low') return 3;
            if (data.postMealFeeling === 'heavy-lethargic') return 4;
            return 5;

        default:
            return 5;
    }
}

/**
 * Get characteristics for each Agni type
 */
function getAgniCharacteristics(type: AgniType): string[] {
    const characteristics: Record<AgniType, string[]> = {
        sama: [
            'Regular appetite at consistent times',
            'Comfortable digestion, no gas or bloating',
            'Formed stool, once daily (ideally in morning)',
            'Feels energized and light after eating',
            'Tongue is pink with thin white coating',
            'Can digest variety of foods without issues'
        ],

        vishama: [
            'Appetite comes and goes unpredictably',
            'Sometimes digests well, sometimes bloating/gas',
            'Constipation or variable bowel movements',
            'May skip meals due to lack of appetite',
            'Gas, burping, irregular elimination',
            'Symptoms worsen with stress or irregular schedule'
        ],

        tikshna: [
            'Intense hunger, becomes "hangry" if meal delayed',
            'Burns through food quickly',
            'Acidity, heartburn, or burning sensation',
            'Loose stools or frequent bowel movements',
            'Can eat large quantities',
            'Feels irritable when hungry'
        ],

        manda: [
            'Little to no appetite, even when hungry',
            'Feels full easily, heavy after eating',
            'Sluggish digestion, may skip meals',
            'White thick tongue coating',
            'Sticky, heavy stools or infrequent elimination',
            'Lethargy and sleepiness after meals'
        ]
    };

    return characteristics[type];
}

/**
 * Generate Agni-specific recommendations
 */
function generateAgniRecommendations(type: AgniType): AgniAssessment['recommendations'] {
    const recommendations: Record<AgniType, AgniAssessment['recommendations']> = {
        sama: {
            diet: [
                'Maintain current balanced diet',
                'Continue eating at regular times',
                'Include all six tastes (sweet, sour, salty, pungent, bitter, astringent)',
                'Seasonal, local, fresh foods'
            ],
            lifestyle: [
                'Continue current healthy routine',
                'Gentle walk after meals aids digestion',
                'Avoid overeating or under-eating'
            ],
            herbs: [
                'Triphala at bedtime for gentle maintenance',
                'Seasonal cleansing 1-2x per year (Panchakarma)'
            ],
            timing: [
                'Largest meal at midday (Pitta time 10 AM - 2 PM)',
                'Light dinner before sunset',
                'Avoid snacking between meals'
            ]
        },

        vishama: {
            diet: [
                'WARM, COOKED, OILY foods (this is medicine)',
                'Ghee with every meal (start with 1 tsp, up to 1-2 tbsp)',
                'Favor: Sweet, Sour, Salty tastes',
                'Avoid: Cold, raw, dry, light foods',
                'Soups, stews, kitchari, warm milk with spices'
            ],
            lifestyle: [
                'CRITICAL: Eat at THE SAME TIME every single day',
                'Create strict routine (sleep, wake, meals)',
                'Warm oil massage (Abhyanga) before bath',
                'Avoid: Travel, multitasking while eating, rushing'
            ],
            herbs: [
                'Ginger tea 30 min before meals',
                'Hingvastak churna (carminative formula)',
                'Triphala at bedtime to regulate bowels',
                'Ashwagandha for grounding'
            ],
            timing: [
                'SAME TIME every day is THE priority',
                'Breakfast: 7-8 AM',
                'Lunch: 12-1 PM',
                'Dinner: 6-7 PM',
                'Never skip meals'
            ]
        },

        tikshna: {
            diet: [
                'COOL, SOOTHING foods',
                'Favor: Sweet, Bitter, Astringent tastes',
                'Ghee and coconut oil',
                'Avoid: Spicy, sour, salty, fermented foods',
                'Avoid: Alcohol, coffee, vinegar, citrus (excess)',
                'Cool milk, sweet fruits, leafy greens'
            ],
            lifestyle: [
                'Never skip meals (makes Pitta worse)',
                'Eat slower, in peaceful environment',
                'Cool showers, avoid excess heat',
                'Reduce competitive activities'
            ],
            herbs: [
                'Aloe Vera juice before meals',
                'Amla (Amalaki) powder in water',
                'Shatavari for cooling',
                'Neem or Guduchi for cleansing heat'
            ],
            timing: [
                'Eat smaller, more frequent meals',
                'Never delay meals past hunger',
                'Avoid eating when angry or upset',
                'Cool drinks between meals'
            ]
        },

        manda: {
            diet: [
                'LIGHT, DRY, WARM, SPICED foods',
                'Favor: Pungent, Bitter, Astringent tastes',
                'Use heating spices liberally (ginger, black pepper, mustard)',
                'Avoid: Heavy, oily, cold, dairy, sweets',
                'Smaller portions - LESS IS MORE',
                'Beans, legumes, vegetables, quinoa'
            ],
            lifestyle: [
                'Skip breakfast OR light breakfast only',
                'Fasting or intermittent fasting can help',
                'Exercise BEFORE eating to stimulate Agni',
                'Avoid: Daytime sleep, sedentary lifestyle'
            ],
            herbs: [
                'Trikatu (ginger-black pepper-long pepper) before meals',
                'Chitrak for kindling Agni',
                'Guggulu for removing ama (toxins)',
                'Triphala for gentle detox'
            ],
            timing: [
                'Skip dinner or make it very light',
                'Allow 12-14 hour fasting window overnight',
                'Eat only when truly hungry',
                'No snacking between meals'
            ]
        }
    };

    return recommendations[type];
}

/**
 * Get expected improvements for each Agni type
 */
function getExpectedImprovements(type: AgniType): string[] {
    const improvements: Record<AgniType, string[]> = {
        sama: [
            'Maintain excellent health',
            'Strong immunity',
            'Mental clarity',
            'Steady energy throughout day'
        ],

        vishama: [
            'Regular appetite at meal times',
            'Reduced gas and bloating',
            'Daily bowel movements (ideally morning)',
            'Better energy and focus',
            'Less anxiety and restlessness',
            'Improved sleep quality'
        ],

        tikshna: [
            'Reduced acidity and heartburn',
            'Calmer hunger (not "hangry")',
            'Better emotional regulation',
            'Reduced skin inflammation',
            'Cooler body temperature',
            'Ability to skip a meal without irritation'
        ],

        manda: [
            'Return of natural appetite',
            'Lighter feeling after meals',
            'Increased energy and motivation',
            'Weight normalization',
            'Mental clarity and alertness',
            'Reduced congestion and mucus'
        ]
    };

    return improvements[type];
}
