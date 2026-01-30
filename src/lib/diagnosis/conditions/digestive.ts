import { Condition } from "../types";

export const digestiveConditions: Record<string, Condition> = {
    acid_reflux: {
        id: 'acid_reflux',
        name: 'Acidity / Acid Reflux (GERD)',
        description: 'Burning sensation in chest or upper stomach due to stomach acid rising',
        matchCriteria: {
            locations: ['chest', 'stomach', 'throat', 'upper abdomen'],
            types: ['burning', 'sour', 'acidic', 'sharp'],
            triggers: ['spicy food', 'oily food', 'lying down', 'after meals', 'coffee', 'alcohol'],
            specialSymptoms: ['heartburn', 'burping', 'sour taste', 'regurgitation'],
            symptomWeights: {
                "heartburn": { sensitivity: 0.9, weight: 1.2 },
                "sour taste": { specificity: 0.8 },
                "regurgitation": { specificity: 0.8 }
            }
        },
        severity: 'mild-moderate',
        prevalence: 'very_common',
        remedies: [
            {
                name: 'Antacids',
                description: 'Over-the-counter acid neutralizers',
                ingredients: ['Antacid tablets/liquid'],
                method: 'Take as directed, usually after meals.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Elevate Head While Sleeping',
                description: 'Prevents acid from rising',
                ingredients: ['Extra pillows or bed wedge'],
                method: 'Elevate head 6-8 inches while sleeping.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Cold Milk',
                description: 'Neutralizes stomach acid instantly',
                ingredients: ['Cold milk (1 glass)'],
                method: 'Drink cold milk without sugar when acidity strikes.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Jeera Water',
                description: 'Aids digestion and reduces gas',
                ingredients: ['Cumin seeds', 'Water'],
                method: 'Boil cumin in water. Strain and drink warm.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Fennel Seeds (Saunf)',
                description: 'Natural antacid',
                ingredients: ['Fennel seeds'],
                method: 'Chew a teaspoon of fennel seeds after meals.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Walking After Meals',
                description: 'Aids digestion',
                duration: '10-15 minutes',
                frequency: 'After each meal'
            }
        ],
        warnings: ['Avoid lying down immediately after eating', 'Limit spicy/oily foods'],
        seekHelp: 'If symptoms persist daily or you have difficulty swallowing'
    },

    indigestion: {
        id: 'indigestion',
        name: 'Indigestion / Dyspepsia',
        description: 'Discomfort in upper abdomen, bloating, and nausea after eating',
        matchCriteria: {
            locations: ['stomach', 'upper abdomen', 'belly'],
            types: ['bloated', 'heavy', 'uncomfortable', 'full'],
            triggers: ['overeating', 'rich food', 'eating fast', 'stress'],
            specialSymptoms: ['bloating', 'gas', 'nausea', 'belching']
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Ginger Tea',
                description: 'Stimulates digestion',
                ingredients: ['Fresh ginger', 'Hot water', 'Lemon'],
                method: 'Steep ginger in hot water for 10 mins. Add lemon.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ajwain (Carom Seeds)',
                description: 'Instant relief from bloating and gas',
                ingredients: ['Ajwain seeds', 'Black salt', 'Warm water'],
                method: 'Mix ajwain with black salt. Take with warm water.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Hing Water',
                description: 'Traditional digestive aid',
                ingredients: ['Asafoetida (hing)', 'Warm water'],
                method: 'Mix a pinch of hing in warm water. Drink after meals.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Vajrasana (Thunderbolt Pose)',
                description: 'Yoga pose that aids digestion',
                duration: '5-10 minutes',
                frequency: 'After meals'
            }
        ],
        warnings: ['Eat slowly', 'Avoid overeating'],
        seekHelp: 'If accompanied by severe pain, vomiting blood, or weight loss'
    },

    constipation: {
        id: 'constipation',
        name: 'Constipation',
        description: 'Infrequent bowel movements or difficulty passing stool',
        matchCriteria: {
            locations: ['stomach', 'abdomen', 'lower belly'],
            types: ['cramping', 'bloated', 'uncomfortable'],
            triggers: ['low fiber', 'dehydration', 'sedentary', 'travel'],
            specialSymptoms: ['hard stool', 'straining', 'incomplete evacuation', 'fewer than 3 bowel movements per week']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Increase Fiber Intake',
                description: 'Bulk up stool for easier passage',
                ingredients: ['Whole grains', 'Fruits', 'Vegetables'],
                method: 'Aim for 25-30g of fiber daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Hydration',
                description: 'Softens stool',
                ingredients: ['Water (8+ glasses daily)'],
                method: 'Drink water throughout the day.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Triphala Churna',
                description: 'Classic Ayurvedic remedy for bowel regularity',
                ingredients: ['Triphala powder', 'Warm water'],
                method: 'Take 1 tsp Triphala with warm water before bed.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Isabgol (Psyllium Husk)',
                description: 'Natural fiber supplement',
                ingredients: ['Isabgol', 'Warm milk or water'],
                method: 'Mix 1-2 tsp in liquid. Drink before bed.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Warm Lemon Water',
                description: 'Stimulates bowel movement',
                ingredients: ['Lemon', 'Warm water', 'Honey'],
                method: 'Drink first thing in the morning on empty stomach.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Walking',
                description: 'Stimulates intestinal movement',
                duration: '20-30 minutes',
                frequency: 'Daily'
            },
            {
                name: 'Pawanmuktasana (Wind-Relieving Pose)',
                description: 'Yoga pose for digestive relief',
                duration: '5 minutes',
                frequency: 'Morning'
            }
        ],
        warnings: ['Do not ignore urge to defecate', 'Avoid prolonged laxative use'],
        seekHelp: 'If blood in stool, severe pain, or no bowel movement for a week'
    },

    diarrhea: {
        id: 'diarrhea',
        name: 'Diarrhea / Loose Motions',
        description: 'Frequent loose or watery bowel movements, often with cramping',
        matchCriteria: {
            locations: ['stomach', 'abdomen', 'lower belly'],
            types: ['cramping', 'gurgling', 'urgent'],
            triggers: ['food poisoning', 'infection', 'contaminated water', 'stress', 'spicy food'],
            specialSymptoms: ['loose stools', 'watery stools', 'urgency', 'frequent bathroom visits', 'stomach cramps', 'nausea']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Oral Rehydration Solution',
                description: 'Replace lost fluids and electrolytes',
                ingredients: ['Water', 'ORS packets', 'Salt', 'Sugar'],
                method: 'Sip ORS solution throughout the day.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'BRAT Diet',
                description: 'Bland foods easy on stomach',
                ingredients: ['Bananas', 'Rice', 'Applesauce', 'Toast'],
                method: 'Eat only these foods until symptoms improve.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Pomegranate Juice (Anar)',
                description: 'Astringent properties help firm stools',
                ingredients: ['Fresh pomegranate', 'Salt (pinch)'],
                method: 'Drink 1 glass of fresh pomegranate juice 2-3 times daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Curd Rice (Dahi Chawal)',
                description: 'Probiotics restore gut balance',
                ingredients: ['Plain curd (yogurt)', 'Cooked rice', 'Salt'],
                method: 'Mix curd with cool rice. Add salt. Eat as meals.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Kutaja (Kurchi) Powder',
                description: 'Classical Ayurvedic remedy for diarrhea',
                ingredients: ['Kutaja bark powder', 'Honey'],
                method: 'Take 1/2 tsp with honey, twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Raw Banana (Kachcha Kela)',
                description: 'Binding effect on loose stools',
                ingredients: ['Raw banana', 'Curd', 'Salt'],
                method: 'Boil raw banana. Mash and mix with curd. Eat twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Bael Fruit (Bilva) Juice',
                description: 'Traditional remedy for digestive issues',
                ingredients: ['Bael fruit pulp', 'Jaggery', 'Water'],
                method: 'Mix bael pulp with water and jaggery. Drink twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ginger-Honey Mix',
                description: 'Antimicrobial and digestive aid',
                ingredients: ['Fresh ginger juice', 'Honey'],
                method: 'Mix 1 tsp ginger juice with 1 tsp honey. Take 2-3 times daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Rest',
                description: 'Allow body to recover',
                duration: 'As needed',
                frequency: 'N/A'
            }
        ],
        warnings: ['Stay hydrated - dehydration is main risk', 'Avoid milk (except curd)', 'Avoid spicy/oily food'],
        seekHelp: 'If blood in stool, high fever, severe dehydration, or symptoms persist beyond 2 days'
    },

    nausea_vomiting: {
        id: 'nausea_vomiting',
        name: 'Nausea / Vomiting',
        description: 'Feeling of sickness with urge to vomit',
        matchCriteria: {
            locations: ['stomach', 'throat', 'head'],
            types: ['queasy', 'sick', 'nauseous'],
            triggers: ['food', 'motion', 'pregnancy', 'infection', 'smell', 'anxiety'],
            specialSymptoms: ['nausea', 'vomiting', 'dizziness', 'loss of appetite', 'salivation']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Clear Fluids',
                description: 'Stay hydrated with gentle fluids',
                ingredients: ['Water', 'Clear broths', 'Ice chips'],
                method: 'Sip small amounts frequently.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ginger (Adrak) Slices',
                description: 'Powerful anti-nausea remedy',
                ingredients: ['Fresh ginger', 'Salt', 'Lemon juice'],
                method: 'Chew small piece of ginger with salt and lemon before meals.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Mint (Pudina) Tea',
                description: 'Calms stomach and reduces nausea',
                ingredients: ['Fresh mint leaves', 'Water', 'Honey'],
                method: 'Boil mint leaves in water. Strain and add honey.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Clove (Laung)',
                description: 'Traditional remedy for vomiting sensation',
                ingredients: ['Whole cloves'],
                method: 'Keep 1-2 cloves in mouth and suck slowly.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Cardamom (Elaichi)',
                description: 'Aromatic spice that settles stomach',
                ingredients: ['Cardamom pods'],
                method: 'Chew 1-2 cardamom pods when feeling nauseous.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Lemon Water with Black Salt',
                description: 'Refreshing anti-nausea drink',
                ingredients: ['Lemon', 'Water', 'Black salt (Kala namak)'],
                method: 'Mix lemon juice in water with black salt. Sip slowly.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Coriander Seed Water',
                description: 'Cooling remedy for nausea',
                ingredients: ['Coriander seeds', 'Water'],
                method: 'Soak 1 tbsp seeds overnight. Strain and drink in morning.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Fresh Air',
                description: 'Step outside or open windows',
                duration: '10-15 minutes',
                frequency: 'As needed'
            },
            {
                name: 'Deep Slow Breathing',
                description: 'Helps reduce nausea',
                duration: '5 minutes',
                frequency: 'When feeling nauseous'
            }
        ],
        warnings: ['Avoid strong smells', 'Eat small portions', 'Avoid lying flat after eating'],
        seekHelp: 'If vomiting persists more than 24 hours, blood in vomit, or signs of severe dehydration'
    },

    gas_bloating: {
        id: 'gas_bloating',
        name: 'Gas / Bloating',
        description: 'Excessive gas accumulation causing discomfort and distension',
        matchCriteria: {
            locations: ['stomach', 'abdomen', 'belly'],
            types: ['bloated', 'distended', 'cramping', 'pressure'],
            triggers: ['beans', 'carbonated drinks', 'eating fast', 'dairy', 'fiber'],
            specialSymptoms: ['flatulence', 'belching', 'abdominal distension', 'passing gas', 'feeling full']
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Peppermint Tea',
                description: 'Relaxes digestive muscles',
                ingredients: ['Peppermint tea bag or leaves', 'Hot water'],
                method: 'Steep and drink after meals.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Hing Water (Asafoetida)',
                description: 'Instant gas relief - most effective remedy',
                ingredients: ['Asafoetida (hing)', 'Warm water'],
                method: 'Mix a pinch of hing in warm water. Drink immediately.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ajwain (Carom Seeds) with Black Salt',
                description: 'Digestive powerhouse',
                ingredients: ['Ajwain seeds', 'Black salt', 'Warm water'],
                method: 'Chew 1/2 tsp ajwain with black salt. Follow with warm water.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Jeera Water (Cumin)',
                description: 'Promotes digestion and reduces gas',
                ingredients: ['Cumin seeds', 'Water'],
                method: 'Boil 1 tsp cumin in water for 5 mins. Strain and drink.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Sonth (Dry Ginger) Powder',
                description: 'Carminative and digestive',
                ingredients: ['Dry ginger powder', 'Warm water', 'Honey'],
                method: 'Mix 1/2 tsp sonth in warm water with honey. Drink after meals.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Triphala Churna',
                description: 'Balances digestive system',
                ingredients: ['Triphala powder', 'Warm water'],
                method: 'Take 1 tsp with warm water before bed.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Fennel Seeds (Saunf)',
                description: 'Natural digestive and breath freshener',
                ingredients: ['Fennel seeds'],
                method: 'Chew 1 tsp fennel seeds after every meal.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Vajrasana After Meals',
                description: 'Yoga pose that aids digestion',
                duration: '5-10 minutes',
                frequency: 'After each meal'
            },
            {
                name: 'Pawanmuktasana (Wind-Relieving Pose)',
                description: 'Specifically releases trapped gas',
                duration: '3-5 minutes',
                frequency: 'When bloated'
            },
            {
                name: 'Walking',
                description: 'Gentle movement helps gas pass',
                duration: '10-15 minutes',
                frequency: 'After meals'
            }
        ],
        warnings: ['Eat slowly', 'Avoid carbonated drinks', 'Identify trigger foods'],
        seekHelp: 'If accompanied by severe pain, bloody stools, or unexplained weight loss'
    },

    ibs: {
        id: 'ibs',
        name: 'Irritable Bowel Syndrome (IBS) / Grahani',
        description: 'Chronic condition affecting the large intestine with cramping, abdominal pain, bloating, gas, and diarrhea or constipation.',
        matchCriteria: {
            locations: ['stomach', 'abdomen', 'intestines'],
            types: ['cramping', 'bloated', 'alternating'],
            triggers: ['stress', 'dairy', 'wheat', 'citrus', 'carbonated drinks'],
            specialSymptoms: ['alternating diarrhea constipation', 'mucus in stool', 'relief after bowel movement', 'bloating'],
            symptomWeights: {
                "relief after bowel movement": { specificity: 0.8, weight: 1.3 },
                "alternating diarrhea constipation": { specificity: 0.8, weight: 1.5 },
                "bloating": { sensitivity: 0.7 }
            }
        },
        severity: 'moderate',
        prevalence: 'common',
        remedies: [
            {
                name: 'Low FODMAP Diet',
                description: 'Reduces fermentable carbs',
                ingredients: ['Rice', 'Potatoes', 'Bananas', 'Blueberries'],
                method: 'Avoid high FODMAP foods like onions, garlic, and wheat for a few weeks.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Buttermilk (Takra) with Hing',
                description: 'Probiotic and digestive aid',
                ingredients: ['Buttermilk', 'Asafoetida (Hing)', 'Cumin powder'],
                method: 'Drink fresh buttermilk with pinch of hing and cumin after lunch.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Pomegranate Peel Decoction',
                description: 'Astringent for loose motions',
                ingredients: ['Dry pomegranate peel', 'Water', 'Honey'],
                method: 'Boil peel in water. Strain and drink with honey.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Yoga Nidra',
                description: 'Deep relaxation to reduce stress trigger',
                duration: '20 minutes',
                frequency: 'Daily'
            }
        ],
        warnings: ['Manage stress levels', 'Keep a food diary'],
        seekHelp: 'If sudden weight loss, rectal bleeding, or iron deficiency anemia'
    },

    hemorrhoids: {
        id: 'hemorrhoids',
        name: 'Hemorrhoids (Piles) / Arsha',
        description: 'Swollen veins in lower rectum and anus causing pain, itching, and bleeding.',
        matchCriteria: {
            locations: ['rectum', 'anus'],
            types: ['itchy', 'painful', 'burning', 'bleeding'],
            triggers: ['constipation', 'straining', 'pregnancy', 'heavy lifting'],
            specialSymptoms: ['blood in stool', 'itchy anus', 'pain sitting', 'lump around anus'],
            symptomWeights: {
                "blood in stool": { specificity: 0.7, weight: 1.5 },
                "lump around anus": { specificity: 0.95, weight: 2.0 },
                "itchy anus": { specificity: 0.6 }
            }
        },
        severity: 'mild-moderate',
        prevalence: 'very_common',
        remedies: [
            {
                name: 'Sitz Bath',
                description: 'Soaks area to relieve pain',
                ingredients: ['Warm water', 'Tub'],
                method: 'Sit in warm water for 10-15 minutes, 2-3 times a day.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'High Fiber Diet',
                description: 'Softens stool',
                ingredients: ['Psyllium husk', 'Vegetables', 'Fruits'],
                method: 'Increase fiber intake gradually.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Triphala Guggulu',
                description: 'Ayurvedic formulation for piles',
                ingredients: ['Triphala Guggulu tablets'],
                method: 'Take as prescribed by Ayurvedic practitioner.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Aloe Vera Gel',
                description: 'Soothing application',
                ingredients: ['Fresh Aloe Vera'],
                method: 'Apply gel externally for cooling relief.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Ashwini Mudra',
                description: 'Strengthens anal sphincter',
                duration: '5 minutes',
                frequency: 'Daily'
            }
        ],
        warnings: ['Avoid straining', 'Do not delay bowel movement'],
        seekHelp: 'If extensive bleeding, dizziness, or excruciating pain'
    },

    gastritis: {
        id: 'gastritis',
        name: 'Gastritis',
        description: 'Inflammation of the protective lining of the stomach.',
        matchCriteria: {
            locations: ['upper abdomen', 'stomach'],
            types: ['burning', 'gnawing', 'aching'],
            triggers: ['painkillers', 'alcohol', 'spicy food', 'bacteria'],
            specialSymptoms: ['burning ache in upper stomach', 'nausea', 'vomiting', 'fullness after eating']
        },
        severity: 'moderate',
        prevalence: 'common',
        remedies: [
            {
                name: 'Avoid Irritants',
                description: 'Stop alcohol and NSAIDs',
                ingredients: [],
                method: 'Discontinue use of pain relievers and alcohol.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Coconut Water',
                description: 'Cools stomach lining',
                ingredients: ['Fresh coconut water'],
                method: 'Drink twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Licorice (Mulethi) Tea',
                description: 'Soothing for stomach lining',
                ingredients: ['Mulethi powder', 'Water'],
                method: 'Boil and drink warm.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Eat smaller meals', 'Avoid acidic foods'],
        seekHelp: 'If vomiting blood or black tarry stools'
    },

    appendicitis: {
        id: 'appendicitis',
        name: 'Appendicitis',
        description: 'Inflammation of the appendix. A MEDICAL EMERGENCY.',
        matchCriteria: {
            locations: ['abdomen', 'lower right abdomen', 'belly button'],
            types: ['sharp', 'severe', 'migrating'],
            triggers: ['unknown', 'infection'],
            specialSymptoms: ['pain shifting to lower right', 'rebound tenderness', 'fever', 'nausea', 'vomiting', 'loss of appetite'],
            symptomWeights: {
                "rebound tenderness": { specificity: 0.95, weight: 2.0 },
                "pain shifting to lower right": { specificity: 0.9, weight: 1.5 },
                "loss of appetite": { sensitivity: 0.8 },
                "fever": { sensitivity: 0.7 }
            }
        },
        severity: 'critical',
        prevalence: 'uncommon',
        redFlags: ['pain shifting from navel to lower right', 'rebound tenderness', 'severe abdominal pain with fever'],
        remedies: [
            {
                name: 'EMERGENCY SURGERY',
                description: 'Requires immediate hospital visit',
                ingredients: [],
                method: 'Go to ER immediately. Do not eat, drink, or use heating pads.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [],
        exercises: [],
        warnings: ['DO NOT TAKE LAXATIVES or ANTACIDS', 'DO NOT USE HEAT PAD (can cause rupture)'],
        seekHelp: 'IMMEDIATELY. Go to Emergency Room.'
    }
};
