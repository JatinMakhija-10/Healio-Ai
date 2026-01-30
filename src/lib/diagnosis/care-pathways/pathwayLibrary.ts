/**
 * Care Pathway Library
 * 
 * Pre-defined, evidence-based care pathways for common conditions
 */

import { CarePathway } from './types';

/**
 * Common Cold (Viral Upper Respiratory Infection) Pathway
 * 
 * Evidence Base:
 * - CDC Guidelines for Common Cold Management
 * - Cochrane Review: Vitamin C for preventing and treating the common cold
 * - Traditional Ayurvedic protocols for Pratishyaya (Nasal disorders)
 */
export const COMMON_COLD_PATHWAY: CarePathway = {
    conditionId: 'common_cold',
    conditionName: 'Common Cold (Viral Upper Respiratory Infection)',

    expectedDuration: {
        min: 5,
        max: 14,
        typical: 7
    },

    urgency: 'self-care',

    phases: [
        {
            name: 'Onset Phase',
            dayRange: { start: 1, end: 2 },
            description: 'Initial symptoms: scratchy throat, sneezing, mild fatigue',

            actions: [
                {
                    category: 'lifestyle',
                    priority: 'critical',
                    action: 'Rest at home',
                    frequency: 'Continuous',
                    notes: 'Avoid work/school to prevent spread and aid recovery'
                },
                {
                    category: 'diet',
                    priority: 'critical',
                    action: 'Hydration: Warm water, herbal teas',
                    frequency: 'Every 1-2 hours',
                    notes: '8-10 glasses total per day'
                },
                {
                    category: 'ayurvedic',
                    priority: 'important',
                    action: 'Ginger-honey tea',
                    frequency: '3x daily',
                    notes: 'Boil fresh ginger (1 inch), add 1 tsp honey when warm (not boiling)'
                },
                {
                    category: 'supplement',
                    priority: 'recommended',
                    action: 'Vitamin C',
                    frequency: 'Once daily',
                    dosage: '1000mg'
                },
                {
                    category: 'ayurvedic',
                    priority: 'recommended',
                    action: 'Turmeric-black pepper in warm milk',
                    frequency: 'At bedtime',
                    notes: '1/2 tsp turmeric + pinch black pepper boosts immunity'
                },
                {
                    category: 'monitoring',
                    priority: 'important',
                    action: 'Monitor temperature',
                    frequency: 'Twice daily (morning & evening)'
                }
            ],

            expectedChanges: [
                'Symptoms may plateau or worsen slightly',
                'Nasal congestion may begin',
                'Mild body aches possible',
                'Throat discomfort increasing'
            ],

            warningSigns: [
                'Fever > 101°F (38.3°C)',
                'Severe sore throat with difficulty swallowing',
                'Ear pain or pressure',
                'Severe headache'
            ]
        },

        {
            name: 'Peak Symptom Phase',
            dayRange: { start: 3, end: 5 },
            description: 'Maximum congestion, cough, fatigue - this is normal and expected',

            actions: [
                {
                    category: 'lifestyle',
                    priority: 'critical',
                    action: 'Continue rest',
                    frequency: 'Continuous',
                    notes: 'Body needs energy to fight infection - avoid pushing through'
                },
                {
                    category: 'diet',
                    priority: 'critical',
                    action: 'Continue hydration',
                    frequency: 'Every 1-2 hours',
                    notes: 'Warm fluids help thin mucus'
                },
                {
                    category: 'ayurvedic',
                    priority: 'important',
                    action: 'Steam inhalation with eucalyptus oil',
                    frequency: '2-3x daily',
                    duration: '10-15 minutes per session',
                    notes: 'Add 2-3 drops eucalyptus oil to hot water, inhale with towel over head'
                },
                {
                    category: 'ayurvedic',
                    priority: 'important',
                    action: 'Turmeric milk (Haldi Doodh)',
                    frequency: 'Once at bedtime',
                    notes: '1/2 tsp turmeric + pinch black pepper in warm milk (anti-inflammatory)'
                },
                {
                    category: 'diet',
                    priority: 'important',
                    action: 'Light, warm, easily digestible foods',
                    frequency: 'Three meals',
                    notes: 'Khichdi, soups, broths - avoid heavy, oily, or cold foods'
                },
                {
                    category: 'ayurvedic',
                    priority: 'recommended',
                    action: 'Gargle with warm salt water',
                    frequency: '3-4x daily',
                    notes: '1/2 tsp salt in warm water - soothes throat'
                },
                {
                    category: 'supplement',
                    priority: 'recommended',
                    action: 'Zinc lozenges',
                    frequency: 'Every 3-4 hours',
                    notes: 'May reduce duration if started early'
                }
            ],

            expectedChanges: [
                'Congestion at peak',
                'Cough may become productive (phlegm)',
                'Energy very low - this is normal',
                'Throat may feel better, nose worse',
                'Mild improvement in some symptoms possible toward end of phase'
            ],

            warningSigns: [
                'Difficulty breathing or shortness of breath',
                'Chest pain',
                'Coughing up blood or blood-tinged mucus',
                'Confusion or severe dizziness',
                'Persistent high fever > 103°F'
            ]
        },

        {
            name: 'Recovery Phase',
            dayRange: { start: 6, end: 7 },
            description: 'Gradual improvement, lingering mild symptoms normal',

            actions: [
                {
                    category: 'lifestyle',
                    priority: 'important',
                    action: 'Gradual return to light activity',
                    frequency: 'As tolerated',
                    notes: 'Avoid strenuous exercise for another 3-4 days'
                },
                {
                    category: 'diet',
                    priority: 'important',
                    action: 'Probiotic foods',
                    frequency: 'Daily',
                    notes: 'Yogurt, kefir, fermented foods to restore gut flora'
                },
                {
                    category: 'exercise',
                    priority: 'recommended',
                    action: 'Light walking',
                    frequency: 'Once daily',
                    duration: '10-15 minutes',
                    notes: 'Gentle movement aids recovery, clears lungs'
                },
                {
                    category: 'diet',
                    priority: 'important',
                    action: 'Continue hydration',
                    frequency: 'Throughout day',
                    notes: 'At least 6-8 glasses daily'
                },
                {
                    category: 'ayurvedic',
                    priority: 'recommended',
                    action: 'Tulsi (Holy Basil) tea',
                    frequency: '2x daily',
                    notes: 'Adaptogen - aids recovery and boosts immunity'
                }
            ],

            expectedChanges: [
                'Most symptoms resolved',
                'Mild lingering cough common (may last 1-2 more weeks)',
                'Energy returning to normal',
                'Nasal congestion clearing',
                'Appetite returning'
            ],

            warningSigns: [
                'Symptoms worsening instead of improving',
                'New fever appearing (may indicate secondary bacterial infection)',
                'Persistent cough with colored phlegm',
                'Facial pain or pressure (possible sinusitis)'
            ]
        }
    ],

    monitoring: {
        checkpoints: [
            {
                day: 3,
                description: 'Mid-course assessment',
                assessments: [
                    'Temperature (should be < 101°F)',
                    'Breathing quality (no difficulty)',
                    'Throat pain level (should not be severe)',
                    'Overall symptom trajectory (stable or mildly worsening is normal)'
                ],
                decisions: [
                    {
                        condition: 'Fever > 101°F for 3 consecutive days',
                        ifTrue: 'Consider bacterial superinfection - consult doctor for evaluation',
                        ifFalse: 'Continue home care as planned'
                    },
                    {
                        condition: 'Difficulty breathing or chest pain',
                        ifTrue: 'URGENT: Seek medical attention immediately',
                        ifFalse: 'Continue monitoring'
                    }
                ]
            },
            {
                day: 7,
                description: 'Recovery checkpoint',
                assessments: [
                    'Overall symptom improvement (should show clear improvement)',
                    'Energy level (should be returning)',
                    'Fever status (should be resolved)',
                    'Breathing (should be normal)',
                    'Appetite (should be returning)'
                ],
                decisions: [
                    {
                        condition: 'No improvement or worsening by Day 7',
                        ifTrue: 'Consult doctor - may need evaluation for complications or other causes',
                        ifFalse: 'Normal recovery trajectory - continue supportive care for lingering symptoms'
                    },
                    {
                        condition: 'New symptoms appearing (ear pain, facial pressure, productive colored cough)',
                        ifTrue: 'Possible secondary infection - consult doctor',
                        ifFalse: 'Recovery on track'
                    }
                ]
            }
        ],

        selfMonitoring: [
            {
                task: 'Temperature',
                frequency: 'twice-daily',
                method: 'Oral thermometer',
                normalRange: '< 100.4°F (38°C)'
            },
            {
                task: 'Symptom severity (1-10 scale)',
                frequency: 'daily',
                method: 'Self-assessment of overall severity'
            },
            {
                task: 'Hydration intake',
                frequency: 'daily',
                method: 'Count glasses of water/fluids'
            },
            {
                task: 'Energy level (1-10)',
                frequency: 'daily'
            }
        ]
    },

    redFlags: [
        {
            symptom: 'Difficulty breathing or shortness of breath',
            severity: 'emergency',
            action: 'Call emergency services (911) or go to ER immediately',
            timeframe: 'immediately',
            rationale: 'May indicate severe infection, pneumonia, or other serious complication'
        },
        {
            symptom: 'Fever > 103°F (39.4°C)',
            severity: 'urgent',
            action: 'Consult doctor',
            timeframe: 'within-24-hours',
            rationale: 'May indicate bacterial infection requiring antibiotics'
        },
        {
            symptom: 'Severe headache with neck stiffness or light sensitivity',
            severity: 'emergency',
            action: 'Go to ER immediately - possible meningitis',
            timeframe: 'immediately',
            rationale: 'These are hallmark signs of meningitis requiring immediate treatment'
        },
        {
            symptom: 'Coughing up blood or blood-tinged mucus',
            severity: 'urgent',
            action: 'Seek medical attention',
            timeframe: 'within-1-hour',
            rationale: 'May indicate severe infection or other pulmonary issue'
        },
        {
            symptom: 'Symptoms lasting > 10 days without improvement',
            severity: 'concerning',
            action: 'Consult doctor for evaluation',
            timeframe: 'within-2-3-days',
            rationale: 'May indicate bacterial sinusitis or other secondary infection'
        },
        {
            symptom: 'Symptoms improve then suddenly worsen (biphasic pattern)',
            severity: 'urgent',
            action: 'Consult doctor',
            timeframe: 'within-24-hours',
            rationale: 'Classic sign of bacterial superinfection'
        }
    ],

    selfCare: [
        {
            category: 'Hydration',
            instruction: 'Drink warm fluids every 1-2 hours throughout the day',
            rationale: 'Thins mucus, prevents dehydration, soothes irritated throat, supports immune function',
            frequency: '8-10 glasses daily'
        },
        {
            category: 'Rest',
            instruction: 'Sleep 8-10 hours at night, rest during day',
            rationale: 'Immune system works most effectively during sleep; conserves energy for healing',
            frequency: 'Continuous, especially Days 1-5'
        },
        {
            category: 'Nutrition',
            instruction: 'Eat light, warm, easily digestible meals',
            rationale: 'Preserves digestive energy for immune function, provides nutrients without burdening system',
            frequency: 'Three meals daily'
        },
        {
            category: 'Hygiene',
            instruction: 'Wash hands frequently, cover coughs and sneezes',
            rationale: 'Prevents spread to others, prevents re-infection or secondary infection'
        },
        {
            category: 'Environment',
            instruction: 'Keep room warm and humid (use humidifier if available)',
            rationale: 'Moist air soothes irritated airways, loosens mucus'
        }
    ],

    seekHelpCriteria: [
        'Symptoms persist > 10days without improvement',
        'Fever > 103°F or lasting > 5 days',
        'Difficulty breathing or shortness of breath',
        'Severe headache with neck stiffness',
        'Ear pain or drainage from ear',
        'Facial pain or pressure (possible sinusitis)',
        'Symptoms worsen after initial improvement',
        'Confusion or altered mental status',
        'Chest pain',
        'Coughing up blood'
    ],

    evidenceBase: [
        {
            type: 'guideline',
            citation: 'CDC. Common Cold and Runny Nose. 2023.',
            quality: 'high'
        },
        {
            type: 'meta-analysis',
            citation: 'Hemilä H, Chalker E. Vitamin C for preventing and treating the common cold. Cochrane Database Syst Rev. 2013.',
            quality: 'high'
        },
        {
            type: 'traditional-medicine',
            citation: 'Charaka Samhita - Pratishyaya Chikitsa (Nasal Disorder Treatment)',
            quality: 'moderate'
        },
        {
            type: 'clinical-trial',
            citation: 'Singh M, Das RR. Zinc for the common cold. Cochrane Database Syst Rev. 2013.',
            quality: 'high'
        }
    ],

    ayurvedicModifications: {
        prakritiModifications: {
            'vata': [
                {
                    phase: 'all',
                    modifications: {
                        add: [
                            {
                                category: 'ayurvedic',
                                priority: 'critical',
                                action: 'Warm sesame oil massage (Abhyanga) before bath',
                                frequency: 'Daily',
                                notes: 'Vata constitution needs extra grounding, warmth, and moisture'
                            }
                        ],
                        adjust: [
                            {
                                actionText: 'Steam inhalation',
                                newFrequency: '4x daily',
                                newNotes: 'Vata benefits from extra moist warmth - increase frequency'
                            }
                        ]
                    },
                    rationale: 'Vata Prakriti: Cold, dry, variable nature needs consistent warmth, oil, and routine'
                }
            ],
            'pitta': [
                {
                    phase: 'all',
                    modifications: {
                        add: [
                            {
                                category: 'ayurvedic',
                                priority: 'important',
                                action: 'Coconut water',
                                frequency: '2-3x daily',
                                notes: 'Cooling and hydrating for Pitta constitution'
                            }
                        ],
                        remove: ['Ginger-honey tea'],
                        adjust: [
                            {
                                actionText: 'Turmeric milk',
                                newNotes: 'Use coconut milk instead of regular milk for cooling effect'
                            }
                        ]
                    },
                    rationale: 'Pitta Prakriti: Hot nature needs cooling modifications - reduce ginger (heating)'
                }
            ],
            'kapha': [
                {
                    phase: 'all',
                    modifications: {
                        add: [
                            {
                                category: 'ayurvedic',
                                priority: 'important',
                                action: 'Dry brushing (Garshana)',
                                frequency: 'Daily before shower',
                                notes: 'Stimulates lymph, reduces congestion in Kapha types'
                            },
                            {
                                category: 'ayurvedic',
                                priority: 'important',
                                action: 'Trikatu (ginger-black pepper-long pepper)',
                                frequency: '3x daily',
                                notes: 'Heating spices reduce Kapha congestion'
                            }
                        ],
                        adjust: [
                            {
                                actionText: 'Steam inhalation',
                                newFrequency: '4-5x daily',
                                newNotes: 'Kapha needs maximum heat and drying - increase frequency'
                            }
                        ]
                    },
                    rationale: 'Kapha Prakriti: Cold, wet, heavy nature needs maximum warmth, drying, and stimulation'
                }
            ]
        },

        agniModifications: {
            'manda': [
                {
                    phase: 'all',
                    modifications: {
                        adjust: [
                            {
                                actionText: 'Light, warm, easily digestible foods',
                                newNotes: 'SMALLER portions essential - weak Agni cannot digest heavy meals. Favor spiced soups.'
                            }
                        ],
                        add: [
                            {
                                category: 'ayurvedic',
                                priority: 'critical',
                                action: 'Ginger tea before meals',
                                frequency: '3x daily',
                                notes: 'Kindles weak Agni - essential for Manda Agni types'
                            }
                        ]
                    },
                    rationale: 'Weak Agni (Manda): Cannot digest normally - needs smaller portions and digestive stimulants'
                }
            ],

            'tikshna': [
                {
                    phase: 'all',
                    modifications: {
                        remove: ['Ginger-honey tea'],
                        add: [
                            {
                                category: 'ayurvedic',
                                priority: 'important',
                                action: 'Cool herbal teas (mint, fennel)',
                                frequency: '3x daily',
                                notes: 'Cooling herbs soothe excessive digestive fire'
                            }
                        ]
                    },
                    rationale: 'Sharp Agni (Tikshna): Excessive heat - avoid heating spices like ginger'
                }
            ]
        },

        seasonalModifications: {
            'winter': [
                {
                    phase: 'all',
                    modifications: {
                        add: [
                            {
                                category: 'ayurvedic',
                                priority: 'important',
                                action: 'Chyawanprash (Ayurvedic jam)',
                                frequency: 'Once daily',
                                dosage: '1 teaspoon',
                                notes: 'Traditional winter immunity booster, warming and nourishing'
                            }
                        ]
                    },
                    rationale: 'Winter season: Cold accumulates Kapha - extra warming measures needed'
                }
            ],
            'spring': [
                {
                    phase: 'all',
                    modifications: {
                        add: [
                            {
                                category: 'diet',
                                priority: 'important',
                                action: 'Light, dry foods',
                                notes: 'Avoid heavy dairy and sweets in spring (Kapha season)'
                            }
                        ]
                    },
                    rationale: 'Spring season: Kapha accumulation - lighter diet prevents congestion'
                }
            ]
        }
    }
};

/**
 * Pathway Library Registry
 * Add new pathways here
 */
export const PATHWAY_LIBRARY: Record<string, CarePathway> = {
    'common_cold': COMMON_COLD_PATHWAY,
    // More pathways to be added...
};

/**
 * Get care pathway for a condition
 */
export function getPathwayForCondition(conditionId: string): CarePathway | null {
    return PATHWAY_LIBRARY[conditionId] || null;
}
