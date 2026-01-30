/**
 * Doshic Analysis Engine
 * 
 * Compares Prakriti (natural state) vs Vikriti (current state)
 * Generates therapeutic plans to restore balance
 */

import {
    DoshicAssessment,
    PrakritiProfile,
    VikritiProfile,
    DoshaScores,
    DoshaType,
    TherapeuticPlan
} from '../types';

/**
 * Analyze overall doshic health
 * @param prakriti Birth constitution (natural baseline)
 * @param vikriti Current doshic state
 * @returns Complete health assessment with balancing recommendations
 */
export function analyzeDoshicHealth(
    prakriti: PrakritiProfile,
    vikriti: VikritiProfile
): DoshicAssessment {
    // Calculate deviation (positive = excess, negative = deficiency)
    const deviation: DoshaScores = {
        vata: vikriti.scores.vata - prakriti.doshicTendencies.vata,
        pitta: vikriti.scores.pitta - prakriti.doshicTendencies.pitta,
        kapha: vikriti.scores.kapha - prakriti.doshicTendencies.kapha
    };

    // Determine health status
    const healthStatus = determineHealthStatus(deviation, vikriti.imbalanceSeverity);

    // Generate primary health goal
    const primaryGoal = generatePrimaryGoal(deviation, prakriti.prakriti);

    // Calculate overall confidence
    const overallConfidence = (prakriti.confidence + 0.9) / 2; // Vikriti assumed 90% confidence

    // Generate limitations/disclaimers
    const limitations = generateLimitations(overallConfidence);

    return {
        prakriti,
        vikriti,
        deviation,
        healthStatus,
        primaryGoal,
        overallConfidence,
        limitations
    };
}

/**
 * Determine health status based on deviation
 */
function determineHealthStatus(
    deviation: DoshaScores,
    imbalanceSeverity: number
): DoshicAssessment['healthStatus'] {
    const maxDeviation = Math.max(
        Math.abs(deviation.vata),
        Math.abs(deviation.pitta),
        Math.abs(deviation.kapha)
    );

    if (imbalanceSeverity <= 20 && maxDeviation <= 15) {
        return 'balanced';
    } else if (imbalanceSeverity <= 40 || maxDeviation <= 25) {
        return 'mild-imbalance';
    } else if (imbalanceSeverity <= 60 || maxDeviation <= 40) {
        return 'moderate-imbalance';
    } else {
        return 'severe-imbalance';
    }
}

/**
 * Generate primary health goal based on deviation
 */
function generatePrimaryGoal(
    deviation: DoshaScores,
    prakritiType: string
): string {
    // Find the most deviated dosha
    const deviations = Object.entries(deviation)
        .map(([dosha, value]) => ({ dosha: dosha as DoshaType, value, abs: Math.abs(value) }))
        .sort((a, b) => b.abs - a.abs);

    const primary = deviations[0];

    if (primary.abs <= 15) {
        return `Maintain current balance and return to your natural ${prakritiType} constitution`;
    }

    if (primary.value > 0) {
        // Excess (Vriddhi)
        return `Pacify excess ${primary.dosha.charAt(0).toUpperCase() + primary.dosha.slice(1)} (${primary.dosha} vriddhi) and restore balance`;
    } else {
        // Deficiency (Kshaya)
        return `Nourish depleted ${primary.dosha.charAt(0).toUpperCase() + primary.dosha.slice(1)} (${primary.dosha} kshaya) and restore balance`;
    }
}

/**
 * Generate limitations and disclaimers
 */
function generateLimitations(confidence: number): string[] {
    const limitations = [
        'This is a preliminary assessment based on self-reported characteristics',
        'True Prakriti determination requires pulse diagnosis (Nadi Pariksha) by a trained Vaidya',
        'Physical examination and family history provide additional accuracy'
    ];

    if (confidence < 0.7) {
        limitations.push(
            'Consider consulting an Ayurvedic physician for precise constitutional analysis',
            'Confidence in this assessment is moderate - more data would improve accuracy'
        );
    }

    limitations.push(
        'Recommendations are for educational purposes only',
        'Consult qualified practitioners before making significant health changes'
    );

    return limitations;
}

/**
 * Generate therapeutic plan to restore doshic balance
 * @param assessment Complete doshic assessment
 * @param currentSeason Current season for seasonal adjustments
 * @returns Personalized balancing plan
 */
export function generateBalancingPlan(
    assessment: DoshicAssessment,
    currentSeason: string
): TherapeuticPlan {
    // Determine which dosha needs balancing most
    const deviations = Object.entries(assessment.deviation)
        .map(([dosha, value]) => ({ dosha: dosha as DoshaType, value, abs: Math.abs(value) }))
        .sort((a, b) => b.abs - a.abs);

    const primaryDeviation = deviations[0];
    const doshaToBalance = primaryDeviation.dosha;
    const isExcess = primaryDeviation.value > 0;

    // Generate diet recommendations
    const diet = generateDietGuidance(doshaToBalance, isExcess);

    // Generate lifestyle recommendations
    const lifestyle = generateLifestyleGuidance(doshaToBalance, isExcess);

    // Generate herbal recommendations
    const herbs = generateHerbalRecommendations(doshaToBalance, isExcess);

    // Determine timeframe based on severity
    const timeframe = assessment.healthStatus === 'balanced'
        ? 'Maintain current practices'
        : assessment.healthStatus === 'mild-imbalance'
            ? '2-4 weeks for noticeable improvement'
            : assessment.healthStatus === 'moderate-imbalance'
                ? '4-8 weeks for significant improvement'
                : '8-12 weeks + consider Panchakarma consultation';

    return {
        primaryGoal: assessment.primaryGoal,
        timeframe,
        diet,
        lifestyle,
        herbs,
        monitoring: {
            reassessIn: assessment.healthStatus === 'severe-imbalance' ? '2 weeks' : '4 weeks',
            trackSymptoms: getRelevantSymptoms(doshaToBalance),
            expectedChanges: getExpectedImprovements(doshaToBalance, isExcess)
        },
        seekHelp: assessment.healthStatus === 'severe-imbalance'
            ? 'Consider consulting an Ayurvedic physician for Panchakarma evaluation'
            : undefined
    };
}

/**
 * Generate diet guidance for specific dosha imbalance
 */
function generateDietGuidance(
    dosha: DoshaType,
    isExcess: boolean
): TherapeuticPlan['diet'] {
    if (dosha === 'vata' && isExcess) {
        return {
            emphasize: [
                'Warm, cooked, oily foods',
                'Sweet, sour, and salty tastes',
                'Ghee and sesame oil',
                'Warm milk with spices',
                'Cooked grains (rice, oats)'
            ],
            avoid: [
                'Cold, raw, dry foods',
                'Excessive bitter, pungent, astringent tastes',
                'Beans (except mung)',
                'Carbonated drinks',
                'Irregular meal times'
            ],
            cookingMethods: ['Steaming', 'Sautéing in ghee', 'Slow cooking'],
            tastes: ['sweet', 'sour', 'salty']
        };
    }

    if (dosha === 'pitta' && isExcess) {
        return {
            emphasize: [
                'Cool, refreshing foods',
                'Sweet, bitter, and astringent tastes',
                'Ghee and coconut oil',
                'Sweet fruits (melons, grapes)',
                'Leafy greens, cucumber'
            ],
            avoid: [
                'Spicy, sour, salty foods',
                'Fermented foods',
                'Alcohol and coffee',
                'Red meat',
                'Hot spices (chili, garlic)'
            ],
            cookingMethods: ['Steaming', 'Light sautéing', 'Raw (in moderation)'],
            tastes: ['sweet', 'bitter', 'astringent']
        };
    }

    if (dosha === 'kapha' && isExcess) {
        return {
            emphasize: [
                'Light, dry, warm foods',
                'Pungent, bitter, and astringent tastes',
                'Legumes and beans',
                'Spicy vegetables',
                'Warming spices (ginger, black pepper)'
            ],
            avoid: [
                'Heavy, oily, cold foods',
                'Excessive sweet, sour, salty tastes',
                'Dairy (especially cold)',
                'Fried foods',
                'Overeating'
            ],
            cookingMethods: ['Baking', 'Grilling', 'Light sautéing without excess oil'],
            tastes: ['pungent', 'bitter', 'astringent']
        };
    }

    // Default (should not reach here)
    return {
        emphasize: ['Balanced, seasonal foods'],
        avoid: ['Processed foods'],
        cookingMethods: ['Home cooking'],
        tastes: ['all six tastes in balance']
    };
}

/**
 * Generate lifestyle guidance for specific dosha imbalance
 */
function generateLifestyleGuidance(
    dosha: DoshaType,
    isExcess: boolean
): TherapeuticPlan['lifestyle'] {
    if (dosha === 'vata' && isExcess) {
        return {
            dailyRoutine: [
                'Regular sleep schedule (bed by 10 PM)',
                'Warm oil self-massage (Abhyanga) before bath',
                'Meditation or calming practices',
                'Avoid screens 1 hour before bed'
            ],
            exercise: [
                'Gentle yoga (avoid vinyasa)',
                'Walking in nature',
                'Tai Chi or Qi Gong',
                'Avoid excessive/jarring exercise'
            ],
            sleep: [
                '7-8 hours minimum',
                'Same bedtime daily',
                'Warm milk with nutmeg before bed',
                'Calming music or white noise'
            ],
            stressManagement: [
                'Pranayama (Nadi Shodhana - alternate nostril breathing)',
                'Grounding practices (walking barefoot)',
                'Warm baths with essential oils',
                'Minimize travel and overscheduling'
            ]
        };
    }

    if (dosha === 'pitta' && isExcess) {
        return {
            dailyRoutine: [
                'Cool morning routine',
                'Coconut oil self-massage',
                'Avoid midday sun (10 AM - 2 PM)',
                'Moonlight walks in evening'
            ],
            exercise: [
                'Swimming',
                'Moderate yoga (avoid hot yoga)',
                'Walking in cool hours',
                'Avoid competitive/intense sports'
            ],
            sleep: [
                'Keep bedroom cool',
                '7-8 hours',
                'Avoid working late nights',
                'Aloe vera juice before bed'
            ],
            stressManagement: [
                'Shitali Pranayama (cooling breath)',
                'Forgiveness practices',
                'Spend time near water',
                'Let go of perfectionism'
            ]
        };
    }

    if (dosha === 'kapha' && isExcess) {
        return {
            dailyRoutine: [
                'Wake before 6 AM',
                'Dry brushing before shower',
                'Skip breakfast or light breakfast only',
                'Most active in morning hours'
            ],
            exercise: [
                'Vigorous exercise daily',
                'Running, cycling, or aerobics',
                'Power yoga or vinyasa',
                'Longer duration (45-60 min)'
            ],
            sleep: [
                '6-7 hours (avoid oversleeping)',
                'No daytime naps',
                'Wake early',
                'Get sunlight immediately upon waking'
            ],
            stressManagement: [
                'Bhastrika Pranayama (bellows breath)',
                'New experiences and variety',
                'Social activities',
                'Challenge comfort zone'
            ]
        };
    }

    return {
        dailyRoutine: ['Maintain consistent schedule'],
        exercise: ['Regular moderate exercise'],
        sleep: ['7-8 hours'],
        stressManagement: ['Meditation and breathwork']
    };
}

/**
 * Generate herbal recommendations for dosha imbalance
 */
function generateHerbalRecommendations(
    dosha: DoshaType,
    isExcess: boolean
): TherapeuticPlan['herbs'] {
    if (dosha === 'vata' && isExcess) {
        return [
            { name: 'Ashwagandha', sanskrit: 'अश्वगंधा', purpose: 'Grounding, nourishing, calms anxiety', dosage: '500mg twice daily' },
            { name: 'Triphala', sanskrit: 'त्रिफला', purpose: 'Regulates bowels, nourishes tissues', dosage: '1-2 tablets at bedtime' },
            { name: 'Brahmi', sanskrit: 'ब्राह्मी', purpose: 'Calms mind, improves memory', dosage: '500mg daily' },
            { name: 'Shatavari', sanskrit: 'शतावरी', purpose: 'Nourishes, moistens, builds resilience', dosage: '500mg twice daily' }
        ];
    }

    if (dosha === 'pitta' && isExcess) {
        return [
            { name: 'Amalaki (Amla)', sanskrit: 'आमलकी', purpose: 'Cooling, reduces acidity, vitamin C', dosage: '500mg twice daily' },
            { name: 'Shatavari', sanskrit: 'शतावरी', purpose: 'Cooling, soothing to digestive tract', dosage: '500mg twice daily' },
            { name: 'Guduchi', sanskrit: 'गुडूची', purpose: 'Cooling, immunity, liver support', dosage: '500mg daily' },
            { name: 'Brahmi', sanskrit: 'ब्राह्मी', purpose: 'Calms mind, reduces irritability', dosage: '500mg daily' }
        ];
    }

    if (dosha === 'kapha' && isExcess) {
        return [
            { name: 'Trikatu', sanskrit: 'त्रिकटु', purpose: 'Stimulates digestion, burns ama (toxins)', dosage: '500mg before meals' },
            { name: 'Guggulu', sanskrit: 'गुग्गु लु', purpose: 'Reduces cholesterol, clears congestion', dosage: '500mg twice daily' },
            { name: 'Triphala', sanskrit: 'त्रिफला', purpose: 'Gentle detox, weight management', dosage: '1-2 tablets at bedtime' },
            { name: 'Punarnava', sanskrit: 'पुनर्नवा', purpose: 'Reduces water retention, rejuvenates', dosage: '500mg daily' }
        ];
    }

    return [
        { name: 'Triphala', sanskrit: 'त्रिफला', purpose: 'Balances all three doshas', dosage: '1-2 tablets at bedtime' }
    ];
}

/**
 * Get relevant symptoms to track for each dosha
 */
function getRelevantSymptoms(dosha: DoshaType): string[] {
    const symptoms: Record<DoshaType, string[]> = {
        vata: [
            'Anxiety levels',
            'Sleep quality',
            'Constipation/gas',
            'Joint pain/stiffness',
            'Dry skin',
            'Restlessness'
        ],
        pitta: [
            'Irritability/anger',
            'Skin inflammation/rashes',
            'Acidity/heartburn',
            'Loose stools',
            'Eye redness',
            'Body heat'
        ],
        kapha: [
            'Energy levels',
            'Weight changes',
            'Congestion/mucus',
            'Heaviness after eating',
            'Mental fog',
            'Motivation'
        ]
    };

    return symptoms[dosha];
}

/**
 * Get expected improvements for each dosha
 */
function getExpectedImprovements(dosha: DoshaType, isExcess: boolean): string[] {
    if (!isExcess) return ['Overall nourishment and strength', 'Better energy', 'Improved resilience'];

    const improvements: Record<DoshaType, string[]> = {
        vata: [
            'Better sleep quality',
            'Reduced anxiety and restlessness',
            'Regular bowel movements',
            'Calmer mind',
            'Improved focus'
        ],
        pitta: [
            'Reduced irritability',
            'Better stress tolerance',
            'Clearer skin',
            'Improved digestion',
            'Cooler body temperature'
        ],
        kapha: [
            'Increased energy and motivation',
            'Reduced heaviness',
            'Clearer sinuses',
            'Better mental clarity',
            'Healthy weight management'
        ]
    };

    return improvements[dosha];
}
