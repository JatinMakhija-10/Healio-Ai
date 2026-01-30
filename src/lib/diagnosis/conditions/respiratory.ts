import { Condition } from "../types";

export const respiratoryConditions: Record<string, Condition> = {
    common_cold: {
        id: 'common_cold',
        name: 'Common Cold',
        description: 'Viral infection causing runny nose, sneezing, and mild sore throat',
        matchCriteria: {
            locations: ['nose', 'throat', 'head'],
            types: ['congested', 'runny', 'scratchy', 'stuffy'],
            triggers: ['cold weather', 'exposure to sick person', 'low immunity'],
            specialSymptoms: ['runny nose', 'sneezing', 'sore throat', 'mild fever', 'watery eyes']
        },
        severity: 'mild',
        prevalence: 'very_common',
        remedies: [
            {
                name: 'Rest and Fluids',
                description: 'Allow body to fight infection',
                ingredients: ['Water', 'Soups', 'Herbal teas'],
                method: 'Rest and drink plenty of fluids.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Steam Inhalation',
                description: 'Clears nasal congestion',
                ingredients: ['Hot water', 'Towel'],
                method: 'Inhale steam for 10 minutes, 2-3 times daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Kadha (Herbal Decoction)',
                description: 'Traditional immunity booster',
                ingredients: ['Tulsi', 'Ginger', 'Black pepper', 'Cloves', 'Cinnamon', 'Jaggery'],
                method: 'Boil all spices in water for 10-15 mins. Strain and drink warm.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Steam with Eucalyptus/Ajwain',
                description: 'Clears sinuses naturally',
                ingredients: ['Ajwain or Eucalyptus oil', 'Hot water'],
                method: 'Add to hot water. Inhale steam under towel.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Honey and Ginger',
                description: 'Soothes throat and boosts immunity',
                ingredients: ['Ginger juice', 'Honey'],
                method: 'Mix equal parts. Take 1 tsp 2-3 times daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Light Walking',
                description: 'If energy permits, light movement helps',
                duration: '10-15 minutes',
                frequency: 'As tolerated'
            }
        ],
        warnings: ['Wash hands frequently', 'Avoid spreading to others'],
        seekHelp: 'If fever over 103°F, symptoms lasting over 10 days, or difficulty breathing'
    },

    cough: {
        id: 'cough',
        name: 'Cough (Dry/Productive)',
        description: 'Persistent coughing, may be dry or with mucus',
        matchCriteria: {
            locations: ['throat', 'chest'],
            types: ['irritating', 'tickling', 'persistent'],
            triggers: ['cold air', 'dust', 'smoke', 'allergies', 'infection'],
            specialSymptoms: ['dry cough', 'phlegm', 'mucus', 'wheezing', 'chest tightness']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Honey and Lemon',
                description: 'Soothes throat irritation',
                ingredients: ['Honey', 'Lemon', 'Warm water'],
                method: 'Mix honey and lemon in warm water. Drink 2-3 times daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Cough Lozenges',
                description: 'Temporary throat relief',
                ingredients: ['Throat lozenges'],
                method: 'Dissolve in mouth as needed.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Mulethi (Licorice) Tea',
                description: 'Soothes throat and reduces cough',
                ingredients: ['Mulethi powder or stick', 'Water', 'Honey'],
                method: 'Boil mulethi in water. Strain, add honey.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Turmeric Milk with Ghee',
                description: 'Coats throat and reduces irritation',
                ingredients: ['Turmeric', 'Milk', 'Ghee'],
                method: 'Boil turmeric in milk. Add ghee. Drink warm at night.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Betel Leaf (Paan) with Honey',
                description: 'Traditional cough remedy',
                ingredients: ['Betel leaf', 'Honey'],
                method: 'Apply honey on leaf. Chew slowly.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Deep Breathing',
                description: 'Opens airways gently',
                duration: '5 minutes',
                frequency: '3-4 times daily'
            }
        ],
        warnings: ['Stay hydrated', 'Avoid irritants like smoke'],
        seekHelp: 'If coughing blood, lasting over 3 weeks, or with high fever'
    },

    sinusitis: {
        id: 'sinusitis',
        name: 'Sinusitis',
        description: 'Inflammation of sinus cavities causing facial pain and congestion',
        matchCriteria: {
            locations: ['face', 'forehead', 'cheeks', 'around eyes', 'nose'],
            types: ['pressure', 'throbbing', 'congested', 'blocked'],
            triggers: ['cold', 'allergies', 'dry air', 'pollution'],
            specialSymptoms: ['facial pressure', 'blocked nose', 'post-nasal drip', 'reduced smell', 'green/yellow mucus']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Saline Nasal Spray',
                description: 'Clears nasal passages',
                ingredients: ['Saline spray or neti pot'],
                method: 'Use 2-3 times daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Warm Compress',
                description: 'Relieves facial pressure',
                ingredients: ['Warm towel'],
                method: 'Apply to face for 10-15 minutes.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Jal Neti (Nasal Irrigation)',
                description: 'Yogic practice for sinus cleaning',
                ingredients: ['Neti pot', 'Warm saline water'],
                method: 'Pour water through one nostril, let it exit from other.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Eucalyptus Steam',
                description: 'Opens blocked sinuses',
                ingredients: ['Eucalyptus oil', 'Hot water'],
                method: 'Add drops to water. Inhale steam.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Anulom Vilom (Alternate Nostril Breathing)',
                description: 'Clears nasal passages',
                duration: '5-10 minutes',
                frequency: '2 times daily'
            }
        ],
        warnings: ['Keep sinuses moist', 'Avoid allergens'],
        seekHelp: 'If symptoms last over 10 days, severe headache, or fever'
    },

    asthma: {
        id: 'asthma',
        name: 'Asthma (Shvasa Roga)',
        description: 'Chronic condition affecting airways, causing wheezing and breathlessness.',
        matchCriteria: {
            locations: ['chest', 'lungs', 'throat'],
            types: ['tight', 'constricted', 'wheezing', 'breathless'],
            triggers: ['dust', 'cold air', 'exercise', 'stress', 'allergens'],
            specialSymptoms: ['wheezing', 'shortness of breath', 'chest tightness', 'coughing at night', 'difficulty breathing'],
            symptomWeights: {
                "wheezing": { specificity: 0.9, weight: 1.4 },
                "shortness of breath": { sensitivity: 0.9, weight: 1.2 },
                "coughing at night": { specificity: 0.7 }
            }
        },
        severity: 'moderate-severe',
        remedies: [
            {
                name: 'Inhaler Use',
                description: 'Immediate relief for attacks',
                ingredients: ['Prescribed inhaler'],
                method: 'Use rescue inhaler as prescribed.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Breathing Exercises',
                description: 'Strengthens lungs',
                ingredients: [],
                method: 'Pursed lip breathing during attacks.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Mustard Oil Massage',
                description: 'Warms chest and clears congestion',
                ingredients: ['Mustard oil', 'Camphor'],
                method: 'Warm oil with camphor. Massage chest and back.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Adulsa (Vasaka) Syrup',
                description: 'Traditional bronchodilator',
                ingredients: ['Adulsa leaves/syrup'],
                method: 'Take 1 tsp syrup twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Coffee',
                description: 'Caffeine is a mild bronchodilator',
                ingredients: ['Black coffee'],
                method: 'Drink warm black coffee during mild tightness.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Pranayama',
                description: 'Controlled breathing',
                duration: '10 minutes',
                frequency: 'Daily (not during attack)'
            }
        ],
        warnings: ['Avoid triggers', 'Keep inhaler nearby', 'Monitor peak flow'],
        seekHelp: 'If inhaler doesn\'t work, lips turn blue, or unable to speak sentences'
    },

    pneumonia: {
        id: 'pneumonia',
        name: 'Pneumonia',
        description: 'Infection inflating air sacs in lungs, causing cough with phlegm.',
        matchCriteria: {
            locations: ['chest', 'lungs', 'back'],
            types: ['sharp', 'stabbing', 'heavy', 'painful'],
            triggers: ['infection', 'flu complication', 'cold'],
            specialSymptoms: ['productive cough', 'green phlegm', 'rusty sputum', 'high fever', 'chills', 'shortness of breath', 'sharp chest pain'],
            symptomWeights: {
                "rusty sputum": { specificity: 0.98, weight: 2.0 },
                "green phlegm": { specificity: 0.7 },
                "high fever": { sensitivity: 0.85 },
                "sharp chest pain": { specificity: 0.6 }
            }
        },
        severity: 'severe',
        remedies: [
            {
                name: 'Medical Treatment',
                description: 'Antibiotics/Antivirals required',
                ingredients: ['Prescribed medication'],
                method: 'Follow doctor\'s orders strictly.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Steam Inhalation',
                description: 'Loosens mucus',
                ingredients: ['Hot water', 'Eucalyptus oil'],
                method: 'Inhale steam carefully.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Garlic and Honey',
                description: 'Natural antibiotic properties',
                ingredients: ['Crushed garlic', 'Honey'],
                method: 'Mix and eat. Helps fight infection.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Rest completely', 'Do not suppress cough if productive (unless sleeping)'],
        seekHelp: 'IMMEDIATELY if difficulty breathing, confusion, or bluish lips'
    },

    tuberculosis: {
        id: 'tuberculosis',
        name: 'Tuberculosis (TB)',
        description: 'Infectious bacterial disease mainly affecting lungs.',
        matchCriteria: {
            locations: ['chest', 'lungs'],
            types: ['chronic', 'persistent'],
            triggers: ['contact with infected'],
            specialSymptoms: ['cough > 3 weeks', 'coughing blood', 'night sweats', 'weight loss', 'fever', 'fatigue'],
            symptomWeights: {
                "coughing blood": { specificity: 0.9, weight: 1.5 },
                "night sweats": { specificity: 0.8 },
                "weight loss": { specificity: 0.7 },
                "cough > 3 weeks": { sensitivity: 0.9 }
            }
        },
        severity: 'severe',
        remedies: [
            {
                name: 'DOTS Therapy',
                description: 'Directly Observed Treatment, Short-course',
                ingredients: ['Prescribed antibiotics'],
                method: 'Strict adherence to 6-month course.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'High Protein Diet',
                description: 'Essential for recovery',
                ingredients: ['Eggs', 'Paneer', 'Pulses'],
                method: 'Increase protein intake significantly.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Amla (Gooseberry)',
                description: 'Rich in Vitamin C/Immunity',
                ingredients: ['Amla juice/fruit'],
                method: 'Consume daily on empty stomach.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Complete full medication course', 'Isolate effectively'],
        seekHelp: 'If coughing blood or unexplained weight loss occurs'
    },

    covid19: {
        id: 'covid19',
        name: 'COVID-19',
        description: 'Viral respiratory illness caused by SARS-CoV-2.',
        matchCriteria: {
            locations: ['body', 'head', 'throat', 'chest'],
            types: ['aching', 'feverish', 'fatigued'],
            triggers: ['contact', 'travel'],
            specialSymptoms: ['loss of taste', 'loss of smell', 'fever', 'dry cough', 'fatigue', 'shortness of breath'],
            symptomWeights: {
                "loss of taste": { specificity: 0.95, weight: 1.5 },
                "loss of smell": { specificity: 0.95, weight: 1.5 },
                "fever": { sensitivity: 0.8 },
                "dry cough": { sensitivity: 0.8 }
            }
        },
        severity: 'moderate-severe',
        remedies: [
            {
                name: 'Isolation and Monitoring',
                description: 'Prevent spread',
                ingredients: ['Pulse oximeter', 'Thermometer'],
                method: 'Isolate for 5-7 days. Monitor O2 levels.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ayush Kwath',
                description: 'Ministry of Ayush recommended immunity booster',
                ingredients: ['Tulsi', 'Dalchini', 'Sunthi', 'Krishna Marich'],
                method: 'Boil all ingredients. Drink warm.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Steam Inhalation',
                description: 'Relieves congestion',
                ingredients: ['Hot water'],
                method: 'Twice daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Proning',
                description: 'Improves oxygenation',
                duration: '30 mins - 2 hours',
                frequency: 'Rotate positions if O2 drops'
            }
        ],
        warnings: ['Monitor Oxygen saturation', 'Wear mask'],
        seekHelp: 'If O2 < 92%, difficulty breathing, or persistent chest pain'
    },

    bronchitis: {
        id: 'bronchitis',
        name: 'Bronchitis',
        description: 'Inflammation of the bronchial tubes causing cough and mucus.',
        matchCriteria: {
            locations: ['chest', 'throat'],
            types: ['persistent', 'phlegmy', 'tight'],
            triggers: ['cold', 'virus', 'smoke', 'pollution'],
            specialSymptoms: ['productive cough', 'chest congestion', 'fatigue', 'low fever', 'wheezing']
        },
        severity: 'moderate',
        prevalence: 'common',
        remedies: [
            {
                name: 'Humidifier',
                description: 'Moistens airways.',
                ingredients: ['Humidifier/Steamer'],
                method: 'Use at night.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Honey and Warm Fluids',
                description: 'Soothes cough.',
                ingredients: ['Honey', 'Warm water/tea'],
                method: 'Drink frequently.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Adusa (Vasaka) Syrup',
                description: 'Traditional bronchial remedy.',
                ingredients: ['Adusa leaves/syrup'],
                method: 'Take 10ml twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Black Pepper and Honey',
                description: 'Clears phlegm.',
                ingredients: ['Black pepper powder', 'Honey'],
                method: 'Mix and take twice daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Avoid smoking.', 'Stay warm and hydrated.'],
        seekHelp: 'If cough lasts > 3 weeks or blood in mucus.'
    },

    copd: {
        id: 'copd',
        name: 'COPD (Chronic Obstructive Pulmonary Disease)',
        description: 'Chronic inflammatory lung disease causing obstructed airflow.',
        matchCriteria: {
            locations: ['chest', 'lungs'],
            types: ['chronic', 'wheezing', 'tight'],
            triggers: ['smoking', 'pollution', 'dust'],
            specialSymptoms: ['shortness of breath', 'chronic cough', 'wheezing', 'frequent infections', 'fatigue']
        },
        severity: 'severe',
        prevalence: 'common',
        remedies: [
            {
                name: 'Pulmonary Rehabilitation',
                description: 'Breathing exercises and training.',
                ingredients: [],
                method: 'Consult pulmonologist for program.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Quit Smoking',
                description: 'Most critical step.',
                ingredients: [],
                method: 'Seek cessation support.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Tulsi and Ginger Tea',
                description: 'Supports lung function.',
                ingredients: ['Tulsi', 'Ginger', 'Honey'],
                method: 'Drink warm twice daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Pursed Lip Breathing',
                description: 'Slows breathing, opens airways.',
                duration: '5-10 mins',
                frequency: 'Multiple times daily'
            }
        ],
        warnings: ['STOP SMOKING.', 'Avoid dust and pollution.'],
        seekHelp: 'If sudden worsening of symptoms or severe breathlessness.'
    }
};
