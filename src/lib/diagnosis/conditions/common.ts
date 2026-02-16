/**
 * Common Conditions Database - Ayurvedic Enhanced
 * Contains frequently encountered health conditions with both modern and Ayurvedic perspectives
 */

import { Condition } from '../types';

export const COMMON_CONDITIONS: Record<string, Condition> = {
    // ============ DIGESTIVE CONDITIONS ============

    acidity: {
        id: 'acidity',
        name: 'Amlapitta (Acidity/Heartburn)',
        description: 'Excess stomach acid causing burning sensation, sour belching, and discomfort. Pitta dosha imbalance.',
        matchCriteria: {
            locations: ['stomach', 'chest', 'abdomen', 'throat'],
            types: ['burning', 'acidic', 'sour', 'sharp'],
            triggers: ['spicy food', 'irregular meals', 'stress', 'coffee', 'tea', 'alcohol', 'lying down after eating'],
            specialSymptoms: ['burning sensation', 'sour belching', 'heartburn', 'nausea', 'bad taste in mouth'],
            intensity: [3, 7],
            durationHint: 'any'
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Antacid Relief',
                description: 'Over-the-counter antacids can provide quick relief',
                ingredients: ['Antacid tablets or liquid'],
                method: 'Take as directed on package, usually after meals',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Fennel Seed Water',
                description: 'Cooling and digestive',
                ingredients: ['Fennel seeds (1 tsp)', 'Water (1 glass)'],
                method: 'Soak fennel seeds in cool water for 2 hours. Strain and drink.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Cold Milk',
                description: 'Immediate relief from burning',
                ingredients: ['Cold milk (1 glass)'],
                method: 'Drink cold milk slowly. Do not add sugar.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Banana or Soaked Raisins',
                description: 'Natural antacid',
                ingredients: ['Ripe banana or soaked raisins'],
                method: 'Eat a ripe banana or 10-15 soaked raisins in the morning.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Aloe Vera Juice',
                description: 'Soothes and cools digestive tract',
                ingredients: ['Fresh aloe vera gel (2 tbsp)', 'Water'],
                method: 'Mix fresh gel in water. Drink on empty stomach (small quantity).',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Vajrasana (Thunderbolt Pose)',
                description: 'Aids digestion, reduces acidity',
                duration: '5-10 minutes',
                frequency: 'After meals'
            },
            {
                name: 'Deep Breathing',
                description: 'Reduces stress-related acidity',
                duration: '5 minutes',
                frequency: '2-3 times daily'
            }
        ],
        warnings: ['Avoid spicy and fried food', 'No alcohol', 'Don\'t lie down immediately after eating', 'Eat meals on time'],
        seekHelp: 'If pain is persistent, vomiting blood, difficulty swallowing, or unexplained weight loss'
    },

    indigestion: {
        id: 'indigestion',
        name: 'Ajirna (Indigestion)',
        description: 'Poor digestion caused by overeating, heavy food, or weak digestive fire (Agni). Pitta-Kapha imbalance.',
        matchCriteria: {
            locations: ['stomach', 'abdomen', 'belly'],
            types: ['heavy', 'bloated', 'uncomfortable', 'full'],
            triggers: ['overeating', 'heavy food', 'late eating', 'stress', 'junk food'],
            specialSymptoms: ['bloating', 'fullness', 'gas', 'belching', 'nausea', 'loss of appetite'],
            intensity: [2, 6],
            durationHint: 'acute'
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Light Fasting',
                description: 'Give digestive system rest',
                ingredients: [],
                method: 'Skip one meal or eat very light (khichdi, soup) to reset digestion.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ginger Tea',
                description: 'Kindles digestive fire',
                ingredients: ['Fresh ginger (1 inch)', 'Water', 'Honey (optional)'],
                method: 'Boil ginger in water for 5 mins. Strain, add honey if needed. Drink warm.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Roasted Cumin Water',
                description: 'Aids digestion and reduces gas',
                ingredients: ['Cumin seeds (1 tsp)', 'Water'],
                method: 'Dry roast cumin, boil in water. Sip warm after meals.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ajwain (Carom Seeds)',
                description: 'Powerful digestive',
                ingredients: ['Ajwain (1/2 tsp)', 'Black salt'],
                method: 'Chew ajwain with black salt after heavy meals.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Walking After Meals',
                description: 'Stimulates digestion',
                duration: '10-15 minutes',
                frequency: 'After each main meal'
            },
            {
                name: 'Pavanamuktasana',
                description: 'Wind-relieving pose',
                duration: '5 minutes',
                frequency: 'When bloated'
            }
        ],
        warnings: ['Don\'t eat late at night', 'Avoid junk food', 'Eat smaller meals', 'Chew food properly'],
        seekHelp: 'If indigestion is persistent, accompanied by weight loss, or severe pain'
    },

    constipation: {
        id: 'constipation',
        name: 'Vibandha (Constipation)',
        description: 'Difficulty passing stools due to Vata imbalance - dryness in the colon.',
        matchCriteria: {
            locations: ['abdomen', 'stomach', 'lower abdomen', 'belly'],
            types: ['blocked', 'hard', 'dry', 'uncomfortable'],
            triggers: ['low fiber diet', 'dehydration', 'sedentary lifestyle', 'travel', 'stress'],
            specialSymptoms: ['hard stools', 'straining', 'bloating', 'incomplete evacuation', 'abdominal discomfort'],
            intensity: [2, 6],
            durationHint: 'any'
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Increase Fiber and Water',
                description: 'Basic constipation management',
                ingredients: ['Fiber-rich foods', 'Water (8+ glasses)'],
                method: 'Eat fruits, vegetables, whole grains. Drink plenty of water.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Warm Water Morning Routine',
                description: 'Stimulates bowel movement',
                ingredients: ['Warm water (2 glasses)'],
                method: 'Drink 2 glasses of warm water first thing in the morning on empty stomach.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Triphala',
                description: 'Gentle Ayurvedic laxative',
                ingredients: ['Triphala powder (1 tsp)', 'Warm water'],
                method: 'Take with warm water at bedtime. Start with low dose.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Soaked Flaxseeds',
                description: 'Natural fiber and lubrication',
                ingredients: ['Flaxseeds (1 tbsp)', 'Water'],
                method: 'Soak overnight. Eat seeds and drink water in morning.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ghee in Milk',
                description: 'Lubricates intestines (Vata-pacifying)',
                ingredients: ['Warm milk', 'Ghee (1 tsp)'],
                method: 'Add ghee to warm milk. Drink at bedtime.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Abdominal Massage',
                description: 'Stimulates bowel movement',
                duration: '5 minutes',
                frequency: 'Morning, clockwise direction'
            },
            {
                name: 'Squatting',
                description: 'Natural position for bowel movement',
                duration: 'During bowel movements',
                frequency: 'Use Indian toilet or squatty potty'
            }
        ],
        warnings: ['Avoid processed food', 'Don\'t ignore urge', 'Fixed toilet routine', 'Avoid excess tea'],
        seekHelp: 'If blood in stool, severe abdominal pain, or no bowel movement for several days'
    },

    gas_bloating: {
        id: 'gas_bloating',
        name: 'Adhmana (Gas/Bloating)',
        description: 'Excess gas in digestive system causing distension and discomfort. Vata imbalance.',
        matchCriteria: {
            locations: ['abdomen', 'stomach', 'belly'],
            types: ['bloated', 'distended', 'cramping', 'uncomfortable'],
            triggers: ['carbonated drinks', 'beans', 'fast eating', 'talking while eating', 'gas-producing foods'],
            specialSymptoms: ['bloating', 'flatulence', 'abdominal discomfort', 'burping', 'feeling of fullness'],
            intensity: [2, 5],
            durationHint: 'acute'
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Avoid Gas-Producing Foods',
                description: 'Dietary modification',
                ingredients: [],
                method: 'Limit beans, cabbage, carbonated drinks, and dairy if intolerant.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ajwain Water',
                description: 'Quick gas relief',
                ingredients: ['Ajwain (carom seeds)', 'Warm water'],
                method: 'Chew 1/2 tsp ajwain with warm water for immediate relief.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Hing (Asafoetida) Remedy',
                description: 'Powerful carminative',
                ingredients: ['Hing (pinch)', 'Warm water'],
                method: 'Dissolve a pinch of hing in warm water. Drink.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ginger-Lemon Shot',
                description: 'Stimulates digestion',
                ingredients: ['Ginger juice', 'Lemon juice', 'Black salt'],
                method: 'Mix equal parts ginger and lemon juice with black salt. Take before meals.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Pavanamuktasana',
                description: 'Wind-relieving pose - releases trapped gas',
                duration: '5 minutes',
                frequency: 'When bloated'
            },
            {
                name: 'Slow Mindful Eating',
                description: 'Prevents air swallowing',
                duration: 'During meals',
                frequency: 'Every meal'
            }
        ],
        warnings: ['Eat slowly', 'Don\'t talk while eating', 'Avoid carbonated drinks', 'Regular meal timing'],
        seekHelp: 'If severe pain, persistent bloating, or associated with weight loss'
    },

    diarrhea: {
        id: 'diarrhea',
        name: 'Atisara (Diarrhea)',
        description: 'Loose watery stools often due to infection, food poisoning, or Pitta-Vata imbalance.',
        matchCriteria: {
            locations: ['abdomen', 'stomach', 'intestines'],
            types: ['cramping', 'urgent', 'watery'],
            triggers: ['contaminated food', 'infection', 'stress', 'spicy food'],
            specialSymptoms: ['loose stools', 'abdominal cramps', 'urgency', 'dehydration', 'nausea'],
            intensity: [3, 7],
            durationHint: 'acute'
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Oral Rehydration',
                description: 'Prevent dehydration',
                ingredients: ['ORS powder or homemade solution'],
                method: 'Drink ORS or mix salt, sugar in water. Sip frequently.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Rice Water (Kanji)',
                description: 'Binding and hydrating',
                ingredients: ['Rice', 'Water', 'Salt'],
                method: 'Boil rice in excess water. Strain. Add salt to water. Drink.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Pomegranate Juice',
                description: 'Astringent and binding',
                ingredients: ['Fresh pomegranate'],
                method: 'Drink fresh diluted pomegranate juice.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Curd Rice',
                description: 'Probiotic and binding',
                ingredients: ['Curd', 'Rice', 'Salt'],
                method: 'Mix fresh curd with well-cooked rice. Add salt. Eat.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Complete Rest',
                description: 'Allow body to recover',
                duration: 'As needed',
                frequency: 'During illness'
            }
        ],
        warnings: ['Stay hydrated', 'Avoid spicy food', 'Rest', 'Wash hands frequently'],
        seekHelp: 'If blood in stool, high fever, severe dehydration, or symptoms persist beyond 2 days'
    },

    // ============ RESPIRATORY CONDITIONS ============

    common_cold: {
        id: 'common_cold',
        name: 'Pratishyaya (Common Cold)',
        description: 'Viral upper respiratory infection causing nasal congestion and mild symptoms. Kapha-Vata imbalance.',
        matchCriteria: {
            locations: ['nose', 'throat', 'head', 'chest'],
            types: ['congested', 'runny', 'blocked', 'scratchy'],
            triggers: ['cold exposure', 'weak immunity', 'viral infection', 'weather change'],
            specialSymptoms: ['runny nose', 'sneezing', 'nasal congestion', 'mild fever', 'sore throat'],
            intensity: [2, 5],
            durationHint: 'acute'
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Rest and Hydration',
                description: 'Basic cold care',
                ingredients: ['Warm fluids', 'Rest'],
                method: 'Get plenty of rest and drink warm fluids throughout the day.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ginger-Tulsi Tea',
                description: 'Immunity boosting and decongestant',
                ingredients: ['Ginger', 'Tulsi leaves', 'Honey'],
                method: 'Boil ginger and tulsi in water. Strain, add honey. Drink warm.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Steam Inhalation',
                description: 'Clears nasal passages',
                ingredients: ['Hot water', 'Towel'],
                method: 'Inhale steam from hot water. Cover head with towel. 5-10 mins.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Haldi Doodh (Golden Milk)',
                description: 'Anti-inflammatory immunity booster',
                ingredients: ['Milk', 'Turmeric', 'Pepper', 'Ghee'],
                method: 'Warm milk with turmeric, pinch of pepper, and ghee. Drink at bedtime.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Rest',
                description: 'Allow body to heal and conserve energy',
                duration: 'As needed',
                frequency: 'During illness'
            },
            {
                name: 'Kapalbhati (Gentle)',
                description: 'Mild rhythmic breathing to clear nasal passages and improve lung capacity',
                duration: '3-5 minutes',
                frequency: 'Once daily (when not feverish)'
            },
            {
                name: 'Surya Namaskar (Sun Salutation - Gentle)',
                description: 'Gentle rounds to boost circulation and stimulate immunity during recovery',
                duration: '5-10 minutes',
                frequency: 'During recovery phase'
            }
        ],
        warnings: ['Keep warm', 'Stay hydrated', 'Rest adequately', 'Avoid cold drinks'],
        seekHelp: 'If fever lasts more than 3 days, chest pain, or difficulty breathing'
    },

    cough: {
        id: 'cough',
        name: 'Kasa (Cough)',
        description: 'Reflex to clear airways - can be dry or productive. Kapha and Vata involvement.',
        matchCriteria: {
            locations: ['throat', 'chest', 'lungs'],
            types: ['dry', 'productive', 'tickling', 'persistent'],
            triggers: ['infection', 'allergy', 'pollution', 'smoking', 'cold air'],
            specialSymptoms: ['dry cough', 'productive cough', 'throat irritation', 'chest discomfort'],
            intensity: [2, 6],
            durationHint: 'any'
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Honey for Dry Cough',
                description: 'Natural cough suppressant',
                ingredients: ['Honey (1 tsp)'],
                method: 'Take 1 tsp honey directly or in warm water. Not for infants under 1 year.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Honey-Ginger',
                description: 'Soothes throat',
                ingredients: ['Honey', 'Fresh ginger juice'],
                method: 'Mix equal parts honey and ginger juice. Take 1 tsp 2-3 times daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Mulethi (Licorice) Tea',
                description: 'Soothes throat and reduces cough',
                ingredients: ['Mulethi stick or powder', 'Water'],
                method: 'Boil mulethi in water. Strain and drink warm.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Turmeric Milk',
                description: 'Anti-inflammatory',
                ingredients: ['Warm milk', 'Turmeric (1/2 tsp)', 'Honey'],
                method: 'Add turmeric to warm milk. Drink at bedtime.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Steam Inhalation',
                description: 'Loosens mucus',
                duration: '10 minutes',
                frequency: '2-3 times daily'
            }
        ],
        warnings: ['Avoid smoke', 'Stay hydrated', 'Use warm fluids', 'Voice rest'],
        seekHelp: 'If blood in sputum, cough lasting more than 3 weeks, or difficulty breathing'
    },

    sore_throat: {
        id: 'sore_throat',
        name: 'Galagraha (Sore Throat)',
        description: 'Pain and irritation in throat often due to infection or voice strain.',
        matchCriteria: {
            locations: ['throat', 'neck'],
            types: ['painful', 'scratchy', 'burning', 'dry'],
            triggers: ['infection', 'voice strain', 'cold air', 'allergy'],
            specialSymptoms: ['pain while swallowing', 'dry throat', 'hoarse voice', 'throat irritation'],
            intensity: [3, 7],
            durationHint: 'acute'
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Salt Water Gargle',
                description: 'Reduces inflammation',
                ingredients: ['Warm water', 'Salt (1/2 tsp)'],
                method: 'Dissolve salt in warm water. Gargle 3-4 times daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Honey-Ginger Syrup',
                description: 'Soothes and heals',
                ingredients: ['Honey', 'Ginger juice', 'Tulsi'],
                method: 'Mix honey with fresh ginger juice. Take 1 tsp multiple times daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Turmeric Gargle',
                description: 'Antiseptic and anti-inflammatory',
                ingredients: ['Warm water', 'Turmeric (1/2 tsp)', 'Salt'],
                method: 'Add turmeric and salt to warm water. Gargle 3-4 times daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Voice Rest',
                description: 'Avoid straining throat',
                duration: 'As needed',
                frequency: 'Until healed'
            }
        ],
        warnings: ['Voice rest', 'Warm fluids only', 'Avoid cold drinks', 'Don\'t strain voice'],
        seekHelp: 'If difficulty breathing, severe pain, or inability to swallow'
    },

    // ============ PAIN CONDITIONS ============

    headache: {
        id: 'headache',
        name: 'Shirashoola (Headache)',
        description: 'Pain in head region often due to stress, dehydration, or eye strain. Vata-Pitta involvement.',
        matchCriteria: {
            locations: ['head', 'forehead', 'temples', 'back of head'],
            types: ['throbbing', 'dull', 'pressure', 'aching'],
            triggers: ['stress', 'dehydration', 'eye strain', 'skipping meals', 'lack of sleep'],
            specialSymptoms: ['head pain', 'pressure sensation', 'irritability', 'light sensitivity'],
            intensity: [3, 8],
            durationHint: 'any'
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Hydration and Rest',
                description: 'Basic headache management',
                ingredients: ['Water', 'Dark quiet room'],
                method: 'Drink water, rest in a dark quiet room.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Head Massage with Oil',
                description: 'Calms Vata and relieves tension',
                ingredients: ['Sesame oil or coconut oil'],
                method: 'Gently massage scalp with warm oil. Focus on temples.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Peppermint Application',
                description: 'Cooling relief',
                ingredients: ['Peppermint oil (diluted)'],
                method: 'Apply diluted peppermint oil on temples and forehead.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ginger Tea',
                description: 'Anti-inflammatory',
                ingredients: ['Fresh ginger', 'Water', 'Honey'],
                method: 'Boil ginger in water. Strain, add honey. Drink warm.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Neck Stretches',
                description: 'Relieves tension headaches by loosening tight neck muscles',
                duration: '5 minutes',
                frequency: 'Several times daily'
            },
            {
                name: 'Eye Rest (20-20-20 Rule)',
                description: 'Look at something 20 feet away for 20 seconds every 20 minutes',
                duration: '20 seconds',
                frequency: 'Every 20 minutes during screen time'
            },
            {
                name: 'Anulom Vilom (Alternate Nostril Breathing)',
                description: 'Balances energy flow and calms the mind to relieve headaches',
                duration: '5-10 minutes',
                frequency: 'Morning and evening'
            },
            {
                name: 'Balasana (Child\'s Pose)',
                description: 'Gentle forward fold that relaxes the head and neck, reducing tension',
                duration: '2-5 minutes',
                frequency: 'When headache occurs'
            }
        ],
        warnings: ['Don\'t skip meals', 'Limit screen time', 'Stay hydrated', 'Regular sleep'],
        seekHelp: 'If sudden severe headache, vision changes, or accompanied by fever and stiff neck'
    },

    back_pain: {
        id: 'back_pain',
        name: 'Kati Shoola (Back Pain)',
        description: 'Pain in lower back often due to posture, strain, or Vata imbalance.',
        matchCriteria: {
            locations: ['back', 'lower back', 'spine', 'lumbar'],
            types: ['aching', 'stiff', 'sharp', 'dull'],
            triggers: ['poor posture', 'heavy lifting', 'prolonged sitting', 'injury'],
            specialSymptoms: ['stiffness', 'pain on movement', 'muscle spasm', 'restricted movement'],
            intensity: [3, 8],
            durationHint: 'any'
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Hot/Cold Therapy',
                description: 'Reduces pain and inflammation',
                ingredients: ['Hot pack or cold pack'],
                method: 'Apply cold for first 48 hours, then heat. 15-20 mins at a time.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Warm Oil Massage',
                description: 'Pacifies Vata, reduces stiffness',
                ingredients: ['Sesame oil or Mahanarayan oil', 'Warm'],
                method: 'Warm oil and massage lower back gently. Rest with hot water bottle.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Hot Fomentation',
                description: 'Relaxes muscles',
                ingredients: ['Hot water bottle or warm towel'],
                method: 'Apply heat to lower back for 15-20 minutes.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ginger-Turmeric Paste',
                description: 'Anti-inflammatory external application',
                ingredients: ['Ginger powder', 'Turmeric', 'Warm water'],
                method: 'Make paste, apply on back, cover with cloth. Leave 20 mins.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Marjaryasana-Bitilasana (Cat-Cow Stretch)',
                description: 'Gentle spinal mobilization that warms up the spine and releases tension',
                duration: '5 minutes',
                frequency: 'Morning and evening'
            },
            {
                name: 'Gentle Walking',
                description: 'Keeps back mobile and prevents stiffness',
                duration: '15-20 minutes',
                frequency: 'Daily'
            },
            {
                name: 'Bhujangasana (Cobra Pose)',
                description: 'Strengthens lower back muscles and improves spinal flexibility',
                duration: '30 seconds, 3-5 reps',
                frequency: 'Daily'
            },
            {
                name: 'Setu Bandhasana (Bridge Pose)',
                description: 'Strengthens glutes and core to support the lower back',
                duration: '30 seconds hold, 5 reps',
                frequency: 'Daily'
            }
        ],
        warnings: ['Correct posture', 'Don\'t lift heavy', 'Take breaks from sitting', 'Sleep on firm surface'],
        seekHelp: 'If pain radiates to legs, numbness, weakness, or loss of bladder control'
    },

    joint_pain: {
        id: 'joint_pain',
        name: 'Sandhi Shoola (Joint Pain)',
        description: 'Pain in joints due to wear, inflammation, or Vata imbalance.',
        matchCriteria: {
            locations: ['joints', 'knee', 'shoulder', 'elbow', 'wrist', 'ankle', 'hip'],
            types: ['aching', 'stiff', 'swollen', 'grinding'],
            triggers: ['overuse', 'weather change', 'aging', 'injury', 'cold exposure'],
            specialSymptoms: ['joint stiffness', 'pain on movement', 'swelling', 'crackling sound'],
            intensity: [3, 7],
            durationHint: 'any'
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Rest the Joint',
                description: 'Avoid aggravating activities',
                ingredients: [],
                method: 'Rest affected joint, apply compression if swollen.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Warm Oil Massage',
                description: 'Vata-pacifying',
                ingredients: ['Sesame oil or Mahanarayan oil'],
                method: 'Warm oil and massage around (not directly on) swollen joints.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Turmeric-Milk',
                description: 'Anti-inflammatory',
                ingredients: ['Warm milk', 'Turmeric', 'Pepper'],
                method: 'Add turmeric and pinch of pepper to warm milk. Drink daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Hot Fomentation',
                description: 'Relieves stiffness',
                ingredients: ['Hot water bottle'],
                method: 'Apply heat to stiff joints for 15-20 minutes.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Gentle Range of Motion',
                description: 'Maintains joint mobility',
                duration: '5-10 minutes',
                frequency: 'Daily'
            },
            {
                name: 'Swimming or Water Exercise',
                description: 'Low impact on joints',
                duration: '20-30 minutes',
                frequency: '3-4 times weekly'
            }
        ],
        warnings: ['Avoid cold exposure', 'Keep warm', 'Regular gentle movement', 'Maintain healthy weight'],
        seekHelp: 'If joint is red and hot, severe swelling, or accompanied by fever'
    },

    // ============ MENTAL/STRESS CONDITIONS ============

    anxiety: {
        id: 'anxiety',
        name: 'Chittodvega (Anxiety)',
        description: 'Restlessness, worry, and nervousness due to Vata imbalance in mind.',
        matchCriteria: {
            locations: ['mind', 'chest', 'stomach', 'head'],
            types: ['worried', 'restless', 'nervous', 'tense'],
            triggers: ['stress', 'overthinking', 'irregular routine', 'caffeine', 'lack of sleep'],
            specialSymptoms: ['restlessness', 'palpitations', 'worry', 'difficulty concentrating', 'racing thoughts'],
            intensity: [3, 8],
            durationHint: 'any'
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Deep Breathing',
                description: 'Activates relaxation response',
                ingredients: [],
                method: 'Breathe in for 4 counts, hold 4, exhale 6. Repeat 5-10 times.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ashwagandha',
                description: 'Adaptogen for stress and anxiety',
                ingredients: ['Ashwagandha powder (1/2 tsp)', 'Warm milk'],
                method: 'Mix ashwagandha in warm milk with honey. Take at bedtime.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Brahmi Tea',
                description: 'Calms the mind',
                ingredients: ['Brahmi leaves or powder', 'Water'],
                method: 'Steep brahmi in hot water. Drink in morning.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Warm Oil Abhyanga',
                description: 'Deeply calming self-massage',
                ingredients: ['Warm sesame oil'],
                method: 'Massage warm oil all over body before bath. Very Vata-pacifying.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Nadi Shodhana',
                description: 'Alternate nostril breathing - balances nervous system',
                duration: '5-10 minutes',
                frequency: 'Morning and evening'
            },
            {
                name: 'Yoga Nidra',
                description: 'Deep relaxation',
                duration: '20-30 minutes',
                frequency: 'Daily'
            }
        ],
        warnings: ['Limit caffeine', 'Regular routine', 'Adequate sleep', 'Limit screen time before bed'],
        seekHelp: 'If panic attacks, persistent anxiety affecting daily life, or thoughts of self-harm'
    },

    insomnia: {
        id: 'insomnia',
        name: 'Anidra (Insomnia)',
        description: 'Difficulty falling or staying asleep, often due to Vata imbalance.',
        matchCriteria: {
            locations: ['mind', 'head'],
            types: ['restless', 'wakeful', 'racing thoughts'],
            triggers: ['stress', 'irregular sleep schedule', 'screen time', 'caffeine', 'late meals'],
            specialSymptoms: ['difficulty sleeping', 'waking up frequently', 'not feeling rested', 'daytime fatigue'],
            intensity: [3, 7],
            durationHint: 'any'
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Sleep Hygiene',
                description: 'Establish healthy sleep habits',
                ingredients: [],
                method: 'Fixed bedtime, dark room, no screens 1 hour before bed.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Warm Milk with Nutmeg',
                description: 'Natural sleep inducer',
                ingredients: ['Warm milk', 'Nutmeg (pinch)', 'Ghee'],
                method: 'Add pinch of nutmeg and ghee to warm milk. Drink 30 mins before bed.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Foot Oil Massage',
                description: 'Calms Vata, promotes sleep',
                ingredients: ['Warm sesame or coconut oil'],
                method: 'Massage warm oil on soles of feet at bedtime.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ashwagandha Milk',
                description: 'Calms nervous system',
                ingredients: ['Ashwagandha powder', 'Warm milk'],
                method: 'Mix 1/2 tsp ashwagandha in warm milk. Take at bedtime.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Progressive Muscle Relaxation',
                description: 'Releases physical tension',
                duration: '10-15 minutes',
                frequency: 'At bedtime'
            },
            {
                name: 'Gentle Stretching',
                description: 'Relaxes body before sleep',
                duration: '5-10 minutes',
                frequency: 'Before bed'
            }
        ],
        warnings: ['No screens before bed', 'Avoid caffeine after noon', 'Fixed sleep schedule', 'Dark cool room'],
        seekHelp: 'If chronic insomnia affecting daily function or accompanied by depression'
    },

    fatigue: {
        id: 'fatigue',
        name: 'Klama (Fatigue)',
        description: 'Persistent tiredness and low energy, often due to Vata depletion or Ojas deficiency.',
        matchCriteria: {
            locations: ['body', 'mind'],
            types: ['tired', 'exhausted', 'weak', 'drained'],
            triggers: ['poor sleep', 'overwork', 'stress', 'illness', 'poor nutrition'],
            specialSymptoms: ['tiredness', 'low energy', 'difficulty concentrating', 'weakness'],
            intensity: [3, 7],
            durationHint: 'any'
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Rest and Nutrition',
                description: 'Basic fatigue management',
                ingredients: [],
                method: 'Prioritize sleep, eat nutritious meals, reduce stress.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Chyawanprash',
                description: 'Ojas-building rejuvenative',
                ingredients: ['Chyawanprash (1-2 tsp)', 'Warm milk'],
                method: 'Take chyawanprash with warm milk in the morning.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ashwagandha',
                description: 'Energy and vitality booster',
                ingredients: ['Ashwagandha powder', 'Warm milk', 'Honey'],
                method: 'Mix 1/2 tsp in warm milk. Take morning or evening.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Dates and Ghee',
                description: 'Nourishing and energizing',
                ingredients: ['Dates (2-3)', 'Ghee (1 tsp)'],
                method: 'Eat dates with ghee as a snack.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Gentle Walking',
                description: 'Boosts energy without exhausting',
                duration: '15-20 minutes',
                frequency: 'Daily'
            },
            {
                name: 'Surya Namaskar (Slow)',
                description: 'Energizing yoga flow',
                duration: '5-10 minutes',
                frequency: 'Morning'
            }
        ],
        warnings: ['Adequate sleep', 'Balanced diet', 'Don\'t overwork', 'Take breaks'],
        seekHelp: 'If fatigue is persistent, unexplained weight loss, or accompanied by other symptoms'
    }
};
