/**
 * Vikriti Engine (Current Doshic Imbalance Assessment)
 * 
 * Vikriti is DYNAMIC - changes with lifestyle, season, stress
 * Uses current symptoms, habits, and environmental factors
 */

import {
    VikritiProfile,
    DoshaScores,
    DoshaType,
    SeasonalDoshicInfluence
} from '../types';

/**
 * Vikriti Assessment Data
 * ONLY current state - lifestyle, symptoms, stress
 */
export interface VikritiAssessmentData {
    // CURRENT LIFESTYLE
    lifestyle: {
        sleepQuality: 'poor-irregular' | 'moderate' | 'good-regular';
        sleepDuration: 'less-than-6hrs' | '6-8hrs' | 'more-than-8hrs';
        exerciseFrequency: 'none' | 'occasional' | 'regular-moderate' | 'intense-daily';
        stressLevel: 'low' | 'moderate' | 'high' | 'severe';
        workType: 'sedentary' | 'moderate-activity' | 'physical-labor';
    };

    // CURRENT DIET PATTERNS
    diet: {
        mealRegularity: 'irregular-skips-meals' | 'mostly-regular' | 'very-regular';
        predominantTastes: Array<'sweet' | 'sour' | 'salty' | 'pungent' | 'bitter' | 'astringent'>;
        foodTemperature: 'mostly-cold-raw' | 'mixed' | 'mostly-warm-cooked';
        eatingSpeed: 'very-fast' | 'moderate' | 'slow-mindful';
        lateNightEating: 'frequent' | 'occasional' | 'rare';
    };

    // CURRENT SYMPTOMS (Recent 2 weeks)
    symptoms: {
        digestive: string[];      // gas, bloating, constipation, loose stools, acidity
        physical: string[];       // fatigue, restlessness, heaviness, coldness, heat
        mental: string[];         // anxiety, irritability, lethargy, brain fog
        skin: string[];           // dryness, oiliness, rashes, inflammation
        sleep: string[];          // insomnia, waking up, oversleeping
    };

    // RECENT CONDITIONS (Past 3 months)
    recentConditions: string[]; // IDs of diagnosed conditions

    // CURRENT ENVIRONMENTAL FACTORS
    environment: {
        currentSeason: 'spring' | 'summer' | 'monsoon' | 'autumn' | 'winter';
        climate: 'cold-dry' | 'hot-dry' | 'hot-humid' | 'cool-humid' | 'moderate';
        location: {
            lat: number;
            lon: number;
        };
    };
}

/**
 * Seasonal Dosha Influences (Ritucharya)
 * Based on classical Ayurvedic seasonal science
 */
const RITUCHARYA: Record<string, SeasonalDoshicInfluence> = {
    spring: {
        season: 'vasanta',
        westernSeason: 'spring',
        doshaAccumulation: 'kapha',
        doshaProvocation: 'kapha', // Accumulated winter Kapha liquefies
        doshaAlleviation: 'pitta',
        seasonalGuidance: {
            emphasize: ['Light foods', 'Bitter greens', 'Barley', 'Honey', 'Fasting'],
            avoid: ['Heavy dairy', 'Fried foods', 'Sweets', 'Daytime sleep'],
            herbs: ['Turmeric', 'Ginger', 'Triphala', 'Trikatu']
        }
    },

    summer: {
        season: 'grishma',
        westernSeason: 'summer',
        doshaAccumulation: 'vata',
        doshaProvocation: 'pitta', // Heat aggravates Pitta
        doshaAlleviation: 'kapha',
        seasonalGuidance: {
            emphasize: ['Cool foods', 'Sweet fruits', 'Coconut water', 'Ghee', 'Cucumber'],
            avoid: ['Spicy foods', 'Sour/fermented', 'Alcohol', 'Hot spices', 'Excessive sun'],
            herbs: ['Aloe Vera', 'Coriander', 'Fennel', 'Mint', 'Sandalwood']
        }
    },

    monsoon: {
        season: 'varsha',
        westernSeason: 'monsoon',
        doshaAccumulation: 'vata',
        doshaProvocation: 'vata', // Humidity + cold aggravate Vata
        doshaAlleviation: 'pitta',
        seasonalGuidance: {
            emphasize: ['Warm cooked foods', 'Soups', 'Ginger tea', 'Easily digestible meals'],
            avoid: ['Raw foods', 'Cold drinks', 'Heavy foods', 'Leafy vegetables'],
            herbs: ['Ginger', 'Black pepper', 'Cumin', 'Asafoetida']
        }
    },

    autumn: {
        season: 'sharad',
        westernSeason: 'autumn',
        doshaAccumulation: 'pitta',
        doshaProvocation: 'pitta', // Summer heat manifests as Pitta
        doshaAlleviation: 'vata',
        seasonalGuidance: {
            emphasize: ['Bitter foods', 'Ghee', 'Sweet rice', 'Cooling herbs'],
            avoid: ['Sour/salty/spicy', 'Yogurt', 'Mustard oil'],
            herbs: ['Neem', 'Amalaki', 'Shatavari', 'Guduchi']
        }
    },

    winter: {
        season: 'hemanta',
        westernSeason: 'early-winter',
        doshaAccumulation: 'kapha',
        doshaProvocation: 'vata', // Cold and dryness
        doshaAlleviation: 'pitta',
        seasonalGuidance: {
            emphasize: ['Oily/heavy foods', 'Warming spices', 'Ghee', 'Sesame oil'],
            avoid: ['Cold foods', 'Raw foods', 'Excessive fasting'],
            herbs: ['Ashwagandha', 'Bala', 'Shatavari', 'Gokshura']
        }
    }
};

/**
 * Assess Vikriti (Current Doshic State)
 * @param data Current lifestyle, diet, symptoms, environment
 * @returns Current dosha imbalance profile
 */
export function assessVikriti(data: VikritiAssessmentData): VikritiProfile {
    // Calculate dosha scores from current factors
    const scores = calculateVikritiScores(data);

    // Determine primary and secondary doshas
    const sorted = Object.entries(scores)
        .sort(([, a], [, b]) => b - a) as [DoshaType, number][];

    const primaryDosha = sorted[0][0];
    const secondaryDosha = sorted[1][1] > 25 ? sorted[1][0] : undefined;

    // Calculate imbalance severity
    const imbalanceSeverity = calculateImbalanceSeverity(scores);

    // Identify contributing factors
    const factors = identifyContributingFactors(data, primaryDosha);

    // Extract current symptoms
    const symptoms = extractSymptoms(data);

    return {
        primaryDosha,
        secondaryDosha,
        scores,
        contributingFactors: factors,
        imbalanceSeverity,
        assessedAt: new Date(),
        symptoms
    };
}

/**
 * Calculate Vikriti dosha scores from current state
 */
function calculateVikritiScores(data: VikritiAssessmentData): DoshaScores {
    const scores: DoshaScores = { vata: 0, pitta: 0, kapha: 0 };

    // LIFESTYLE FACTORS

    // Sleep quality (irregular/poor = Vata)
    if (data.lifestyle.sleepQuality === 'poor-irregular') {
        scores.vata += 15;
    }
    if (data.lifestyle.sleepDuration === 'less-than-6hrs') {
        scores.vata += 10;
    }
    if (data.lifestyle.sleepDuration === 'more-than-8hrs') {
        scores.kapha += 10;
    }

    // Exercise (none = Kapha, intense = Vata/Pitta)
    if (data.lifestyle.exerciseFrequency === 'none') {
        scores.kapha += 12;
    }
    if (data.lifestyle.exerciseFrequency === 'intense-daily') {
        scores.vata += 8;
        scores.pitta += 8;
    }

    // Stress (Vata/Pitta)
    if (data.lifestyle.stressLevel === 'high' || data.lifestyle.stressLevel === 'severe') {
        scores.vata += 15;
        scores.pitta += 10;
    }

    // DIET FACTORS

    // Meal irregularity (Vata)
    if (data.diet.mealRegularity === 'irregular-skips-meals') {
        scores.vata += 12;
    }

    // Predominant tastes
    data.diet.predominantTastes.forEach(taste => {
        switch (taste) {
            case 'sweet':
                scores.kapha += 3;
                break;
            case 'sour':
            case 'salty':
                scores.pitta += 4;
                break;
            case 'pungent':
                scores.pitta += 5;
                scores.vata += 3;
                break;
            case 'bitter':
            case 'astringent':
                scores.vata += 4;
                break;
        }
    });

    // Food temperature (cold/raw = Vata)
    if (data.diet.foodTemperature === 'mostly-cold-raw') {
        scores.vata += 10;
    }

    // Eating speed (fast = Vata/Pitta)
    if (data.diet.eatingSpeed === 'very-fast') {
        scores.vata += 8;
        scores.pitta += 6;
    }

    // Late night eating (Kapha/Pitta)
    if (data.diet.lateNightEating === 'frequent') {
        scores.kapha += 10;
        scores.pitta += 8;
    }

    // SYMPTOMS

    // Digestive symptoms
    if (data.symptoms.digestive.includes('constipation') || data.symptoms.digestive.includes('gas')) {
        scores.vata += 10;
    }
    if (data.symptoms.digestive.includes('loose-stools') || data.symptoms.digestive.includes('acidity')) {
        scores.pitta += 10;
    }
    if (data.symptoms.digestive.includes('heaviness') || data.symptoms.digestive.includes('bloating')) {
        scores.kapha += 8;
    }

    // Physical symptoms
    if (data.symptoms.physical.includes('restlessness') || data.symptoms.physical.includes('coldness')) {
        scores.vata += 8;
    }
    if (data.symptoms.physical.includes('heat') || data.symptoms.physical.includes('inflammation')) {
        scores.pitta += 10;
    }
    if (data.symptoms.physical.includes('heaviness') || data.symptoms.physical.includes('lethargy')) {
        scores.kapha += 10;
    }

    // Mental symptoms
    if (data.symptoms.mental.includes('anxiety') || data.symptoms.mental.includes('fear')) {
        scores.vata += 12;
    }
    if (data.symptoms.mental.includes('irritability') || data.symptoms.mental.includes('anger')) {
        scores.pitta += 12;
    }
    if (data.symptoms.mental.includes('lethargy') || data.symptoms.mental.includes('depression')) {
        scores.kapha += 10;
    }

    // SEASONAL INFLUENCE
    const seasonalInfluence = RITUCHARYA[data.environment.currentSeason];
    if (seasonalInfluence) {
        // Add weight to the dosha that gets provoked in this season
        scores[seasonalInfluence.doshaProvocation] += 15;
    }

    // Normalize to percentage
    const total = scores.vata + scores.pitta + scores.kapha;
    return {
        vata: Math.round((scores.vata / total) * 100),
        pitta: Math.round((scores.pitta / total) * 100),
        kapha: Math.round((scores.kapha / total) * 100)
    };
}

/**
 * Calculate imbalance severity (0-100)
 */
function calculateImbalanceSeverity(scores: DoshaScores): number {
    const sorted = Object.values(scores).sort((a, b) => b - a);
    const dominance = sorted[0];
    const balance = sorted[2];

    // Severity = how far the dominant dosha is from balance (33.33%)
    const deviation = Math.abs(dominance - 33.33);

    // Scale: 0-20 = balanced, 21-40 = mild, 41-60 = moderate, 61-80 = severe, 81-100 = critical
    return Math.min(100, deviation * 2);
}

/**
 * Identify contributing factors to current imbalance
 */
function identifyContributingFactors(
    data: VikritiAssessmentData,
    primaryDosha: DoshaType
): VikritiProfile['contributingFactors'] {
    const factors: VikritiProfile['contributingFactors'] = {
        lifestyle: [],
        diet: [],
        seasonal: [],
        emotional: [],
        environmental: []
    };

    // Lifestyle factors
    if (data.lifestyle.sleepQuality === 'poor-irregular') {
        factors.lifestyle.push('Irregular sleep pattern');
    }
    if (data.lifestyle.stressLevel === 'high' || data.lifestyle.stressLevel === 'severe') {
        factors.lifestyle.push('High stress levels');
        factors.emotional.push('Chronic stress');
    }
    if (data.lifestyle.exerciseFrequency === 'none') {
        factors.lifestyle.push('Sedentary lifestyle');
    }

    // Diet factors
    if (data.diet.mealRegularity === 'irregular-skips-meals') {
        factors.diet.push('Irregular meal times');
    }
    if (data.diet.foodTemperature === 'mostly-cold-raw') {
        factors.diet.push('Excessive cold/raw foods');
    }
    if (data.diet.lateNightEating === 'frequent') {
        factors.diet.push('Late night eating');
    }

    // Seasonal factors
    const seasonalInfluence = RITUCHARYA[data.environment.currentSeason];
    if (seasonalInfluence && seasonalInfluence.doshaProvocation === primaryDosha) {
        factors.seasonal.push(`Current season (${seasonalInfluence.westernSeason}) aggravates ${primaryDosha}`);
    }

    return factors;
}

/**
 * Extract and categorize current symptoms
 */
function extractSymptoms(data: VikritiAssessmentData): string[] {
    const allSymptoms: string[] = [];

    Object.values(data.symptoms).forEach(categorySymptoms => {
        allSymptoms.push(...categorySymptoms);
    });

    return allSymptoms;
}

/**
 * Get seasonal recommendations for current season
 */
export function getSeasonalGuidance(season: string): SeasonalDoshicInfluence {
    return RITUCHARYA[season] || RITUCHARYA.spring;
}
