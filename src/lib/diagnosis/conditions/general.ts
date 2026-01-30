import { Condition } from "../types";

export const generalConditions: Record<string, Condition> = {
    tension_headache: {
        id: 'tension_headache',
        name: 'Tension Headache',
        description: 'Headache caused by muscle tension, often from stress or posture',
        matchCriteria: {
            locations: ['head', 'forehead', 'temples', 'back of head'],
            types: ['dull', 'aching', 'pressure', 'tight band'],
            triggers: ['stress', 'screen', 'posture', 'fatigue'],
            intensity: [1, 2, 3, 4, 5, 6]
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Peppermint Oil Massage',
                description: 'Cooling effect reduces tension',
                ingredients: ['Peppermint oil', 'Carrier oil'],
                method: 'Massage on temples and neck.',
                videoUrl: 'https://www.youtube.com/watch?v=XHvCkVzKEzY',
                videoTitle: 'Headache Relief Massage'
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ginger Tea (Adrak Chai)',
                description: 'Relieves stress and improves circulation',
                ingredients: ['Fresh ginger', 'Water', 'Tea leaves'],
                method: 'Boil crushed ginger. Inhale steam while sipping.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Chandan (Sandalwood) Paste',
                description: 'Cooling effect for forehead tension',
                ingredients: ['Sandalwood powder', 'Rose water'],
                method: 'Make paste. Apply on forehead. Let dry.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Neck Stretches',
                description: 'Release neck tension',
                duration: '3-5 minutes',
                frequency: 'Every 2 hours',
                videoUrl: 'https://www.youtube.com/watch?v=wQylqaCl8Zo',
                videoTitle: 'Neck Stretches'
            }
        ],
        warnings: ['Reduce screen time', 'Stay hydrated'],
        seekHelp: 'If headache is sudden and extremely severe ("thunderclap")'
    },

    migraine: {
        id: 'migraine',
        name: 'Migraine',
        description: 'Severe throbbing headache, often one-sided, with sensitivity',
        matchCriteria: {
            locations: ['head', 'one side'],
            types: ['throbbing', 'pulsating', 'pounding'],
            triggers: ['light', 'sound', 'smell', 'hormones', 'weather'],
            intensity: [6, 7, 8, 9, 10],
            specialSymptoms: ['nausea', 'vomiting', 'aura', 'light sensitivity']
        },
        severity: 'moderate-severe',
        remedies: [
            {
                name: 'Dark Room Rest',
                description: 'Sensory deprivation',
                ingredients: [],
                method: 'Lie in dark, quiet room.',
                videoUrl: 'https://www.youtube.com/watch?v=3khknaruqiE',
                videoTitle: 'Managing Migraine'
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Desi Ghee Nasya',
                description: 'Ayurvedic practice of nasal drops',
                ingredients: ['Pure Cow Ghee (warmed)'],
                method: 'Put 1-2 drops of warm ghee in each nostril. Lie back.',
                videoUrl: 'https://www.youtube.com/watch?v=LinkToNasya',
                videoTitle: 'Nasya Technique'
            },
            {
                name: 'Cold Clay Pack',
                description: 'Natural cooling for heat-induced migraine',
                ingredients: ['Multani Mitti (Fullers Earth)', 'Rose water'],
                method: 'Apply paste on forehead.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Rest (Avoid Exercise)',
                description: 'Physical activity often worsens migraine',
                duration: 'Until recovered',
                frequency: 'N/A'
            }
        ],
        warnings: ['Identify triggers', 'Keep hydration up'],
        seekHelp: 'If new pattern or accompanied by neurological symptoms'
    },

    general_body_pain: {
        id: 'general_body_pain',
        name: 'General Fatigue / Viral Aches',
        description: 'Widespread body aches often associated with viral infections or fatigue',
        matchCriteria: {
            locations: ['body', 'all over', 'legs', 'arms'],
            types: ['aching', 'weak', 'heavy', 'sore'],
            triggers: ['fever', 'flu', 'virus', 'stress', 'overexertion'],
            frequency: ['constant']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Turmeric Milk',
                description: 'Anti-inflammatory booster',
                ingredients: ['Turmeric', 'Warm milk', 'Black pepper'],
                method: 'Drink warm before bed.',
                videoUrl: 'https://www.youtube.com/watch?v=rJjZTYlm7Dk',
                videoTitle: 'Golden Milk Recipe'
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Haldi Doodh (Golden Milk)',
                description: 'Classic immunity and recovery booster',
                ingredients: ['Turmeric powder', 'Milk', 'Black pepper', 'Honey'],
                method: 'Boil milk with turmeric and pepper. Drink warm at night.',
                videoUrl: 'https://www.youtube.com/watch?v=rJjZTYlm7Dk',
                videoTitle: 'Authentic Haldi Doodh'
            },
            {
                name: 'Tulsi & Ginger Tea',
                description: 'Builds immunity and fights subtle infections',
                ingredients: ['Tulsi leaves', 'Ginger', 'Honey'],
                method: 'Boil tulsi and ginger in water. Strain and add honey.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Rest',
                description: 'Focus on recovery',
                duration: 'As needed',
                frequency: 'N/A'
            }
        ],
        warnings: ['Monitor temperature', 'Hydrate well'],
        seekHelp: 'If high fever persists or breathing difficulty occurs'
    },

    dehydration: {
        id: 'dehydration',
        name: 'Dehydration',
        description: 'Inadequate fluid levels causing fatigue and dizziness',
        matchCriteria: {
            locations: ['body', 'head'],
            types: ['weak', 'dizzy', 'tired', 'dry'],
            triggers: ['heat', 'exercise', 'illness', 'not drinking enough', 'diarrhea'],
            specialSymptoms: ['dark urine', 'dry mouth', 'headache', 'fatigue', 'thirst']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Oral Rehydration',
                description: 'Replace lost fluids and electrolytes',
                ingredients: ['Water', 'ORS packets or sports drinks'],
                method: 'Sip fluids continuously throughout the day.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Nimbu Pani (Lemon Water)',
                description: 'Refreshing electrolyte drink',
                ingredients: ['Lemon', 'Water', 'Salt', 'Sugar'],
                method: 'Mix lemon juice, pinch of salt, sugar in water.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Coconut Water',
                description: 'Natural electrolyte replenisher',
                ingredients: ['Fresh coconut water'],
                method: 'Drink 1-2 glasses.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Buttermilk (Chaas)',
                description: 'Hydrating and cooling',
                ingredients: ['Yogurt', 'Water', 'Salt', 'Cumin'],
                method: 'Blend yogurt with water. Add salt and roasted cumin.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Rest in Cool Area',
                description: 'Prevent further fluid loss',
                duration: 'Until recovered',
                frequency: 'N/A'
            }
        ],
        warnings: ['Avoid caffeine and alcohol', 'Stay in shade during hot weather'],
        seekHelp: 'If confusion, rapid heartbeat, fainting, or no urination for 8+ hours'
    },

    insomnia: {
        id: 'insomnia',
        name: 'Insomnia / Sleep Issues',
        description: 'Difficulty falling asleep, staying asleep, or poor sleep quality',
        matchCriteria: {
            locations: ['head', 'body'],
            types: ['tired', 'restless', 'exhausted'],
            triggers: ['stress', 'anxiety', 'screen time', 'caffeine', 'irregular schedule'],
            specialSymptoms: ['difficulty falling asleep', 'waking up at night', 'daytime fatigue', 'irritability']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Sleep Hygiene',
                description: 'Consistent sleep practices',
                ingredients: [],
                method: 'Fixed bedtime, dark room, no screens 1 hour before bed.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Relaxation Techniques',
                description: 'Calm the mind before sleep',
                ingredients: [],
                method: 'Deep breathing, meditation, or gentle stretching.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Warm Milk with Nutmeg',
                description: 'Traditional sleep inducer',
                ingredients: ['Warm milk', 'Nutmeg (pinch)', 'Honey'],
                method: 'Add nutmeg to warm milk. Drink before bed.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ashwagandha',
                description: 'Ayurvedic adaptogen for stress and sleep',
                ingredients: ['Ashwagandha powder', 'Warm milk'],
                method: 'Mix 1/2 tsp in warm milk. Drink at night.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Brahmi Tea',
                description: 'Calms the nervous system',
                ingredients: ['Brahmi powder or leaves', 'Water', 'Honey'],
                method: 'Steep in hot water. Strain and add honey.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Yoga Nidra',
                description: 'Yogic sleep meditation',
                duration: '20-30 minutes',
                frequency: 'Before bed'
            },
            {
                name: 'Shavasana (Corpse Pose)',
                description: 'Deep relaxation',
                duration: '10-15 minutes',
                frequency: 'Before bed'
            }
        ],
        warnings: ['Limit caffeine after 2 PM', 'Avoid heavy meals before bed'],
        seekHelp: 'If insomnia lasts over 3 weeks or significantly impacts daily life'
    },

    menstrual_cramps: {
        id: 'menstrual_cramps',
        name: 'Menstrual Cramps (Dysmenorrhea)',
        description: 'Painful cramping in lower abdomen during menstruation',
        matchCriteria: {
            locations: ['lower abdomen', 'lower back', 'pelvis'],
            types: ['cramping', 'throbbing', 'dull', 'aching'],
            triggers: ['menstruation', 'period', 'monthly cycle'],
            specialSymptoms: ['menstrual pain', 'period pain', 'lower back pain during period', 'nausea during period']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Heat Therapy',
                description: 'Relaxes uterine muscles',
                ingredients: ['Heating pad', 'Hot water bottle'],
                method: 'Apply to lower abdomen for 15-20 minutes.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Over-the-counter Pain Relief',
                description: 'NSAIDs can reduce cramps',
                ingredients: ['Ibuprofen or similar'],
                method: 'Take as directed, preferably before cramps start.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ajwain Water',
                description: 'Relieves cramping and bloating',
                ingredients: ['Ajwain seeds', 'Water'],
                method: 'Boil ajwain in water. Drink warm.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ginger-Jaggery Tea',
                description: 'Warms body and reduces pain',
                ingredients: ['Ginger', 'Jaggery', 'Water'],
                method: 'Boil ginger. Add jaggery. Drink 2-3 times daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Sesame Seeds (Til)',
                description: 'Rich in nutrients for period health',
                ingredients: ['Sesame seeds', 'Jaggery'],
                method: 'Eat a spoonful of roasted sesame with jaggery.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Gentle Yoga (Cat-Cow, Child Pose)',
                description: 'Relieves tension in lower back and abdomen',
                duration: '10-15 minutes',
                frequency: 'As needed'
            },
            {
                name: 'Walking',
                description: 'Light movement can help',
                duration: '15-20 minutes',
                frequency: 'Daily during period'
            }
        ],
        warnings: ['Stay hydrated', 'Avoid excessive salt and caffeine'],
        seekHelp: 'If pain is severe enough to interfere with daily activities or symptoms worsen over time'
    },

    fever: {
        id: 'fever',
        name: 'Fever',
        description: 'Elevated body temperature, often a sign of infection or illness',
        matchCriteria: {
            locations: ['body', 'head', 'forehead'],
            types: ['hot', 'burning', 'chills', 'sweating'],
            triggers: ['infection', 'virus', 'bacteria', 'cold', 'flu'],
            specialSymptoms: ['chills', 'sweating', 'body aches', 'headache', 'weakness', 'high temperature']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Rest and Hydration',
                description: 'Essential for recovery',
                ingredients: ['Water', 'Electrolyte drinks'],
                method: 'Rest in bed and drink plenty of fluids.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Cool Compress',
                description: 'Helps reduce temperature',
                ingredients: ['Wet towel', 'Cool water'],
                method: 'Apply cool (not cold) compress to forehead and neck.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Giloy Kadha (Guduchi)',
                description: 'Powerful Ayurvedic immunity booster and fever reducer',
                ingredients: ['Giloy stem or powder', 'Tulsi leaves', 'Black pepper', 'Water'],
                method: 'Boil giloy stem with tulsi and pepper for 15 mins. Strain and drink twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Tulsi-Ginger-Honey Tea',
                description: 'Traditional fever remedy',
                ingredients: ['Tulsi leaves (10-12)', 'Ginger (1 inch)', 'Honey', 'Water'],
                method: 'Boil tulsi and ginger in water for 10 mins. Add honey when warm. Drink 2-3 times daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Coriander Seed Water',
                description: 'Cooling remedy for fever',
                ingredients: ['Coriander seeds (Dhania)', 'Water'],
                method: 'Soak 2 tbsp coriander seeds overnight. Strain and drink in morning.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Raisin Water (Kishmish Pani)',
                description: 'Traditional fever remedy for children and adults',
                ingredients: ['Raisins (25-30)', 'Water', 'Lime juice'],
                method: 'Soak raisins in water overnight. Crush and strain. Add lime juice and drink.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Fenugreek Tea (Methi)',
                description: 'Reduces fever and body aches',
                ingredients: ['Fenugreek seeds', 'Water', 'Honey', 'Lemon'],
                method: 'Boil 1 tbsp fenugreek seeds in water. Strain. Add honey and lemon.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Complete Rest',
                description: 'Allow body to fight infection',
                duration: 'Until fever subsides',
                frequency: 'N/A'
            }
        ],
        warnings: ['Monitor temperature regularly', 'Stay in light clothing', 'Keep room ventilated'],
        seekHelp: 'If fever exceeds 103°F, lasts more than 3 days, or accompanied by severe symptoms'
    },

    common_flu: {
        id: 'common_flu',
        name: 'Common Cold / Flu',
        description: 'Viral infection affecting respiratory system with multiple symptoms',
        matchCriteria: {
            locations: ['nose', 'throat', 'head', 'chest', 'body'],
            types: ['congested', 'runny', 'scratchy', 'achy'],
            triggers: ['virus', 'cold weather', 'weak immunity', 'contact with infected person'],
            specialSymptoms: ['runny nose', 'blocked nose', 'sore throat', 'cough', 'body ache', 'mild fever', 'sneezing']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Steam Inhalation',
                description: 'Clears nasal congestion',
                ingredients: ['Hot water', 'Towel'],
                method: 'Inhale steam for 10-15 minutes, 2-3 times daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Immunity Kadha (Traditional Decoction)',
                description: 'Comprehensive immunity booster and cold remedy',
                ingredients: ['Tulsi (10 leaves)', 'Ginger (1 inch)', 'Black pepper (5)', 'Cloves (3)', 'Cinnamon (1 stick)', 'Jaggery'],
                method: 'Boil all ingredients in 2 cups water until reduced to 1 cup. Add jaggery. Drink warm twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Mulethi (Licorice) with Honey',
                description: 'Soothes throat and reduces cough',
                ingredients: ['Mulethi powder', 'Honey'],
                method: 'Mix 1/2 tsp mulethi powder with 1 tsp honey. Take 2-3 times daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Pippali (Long Pepper) with Honey',
                description: 'Traditional Ayurvedic cold remedy',
                ingredients: ['Pippali powder', 'Honey'],
                method: 'Mix 1/4 tsp pippali powder with honey. Take before meals.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Sitopladi Churna',
                description: 'Classical Ayurvedic formulation for cough and cold',
                ingredients: ['Sitopladi churna (available in Ayurvedic stores)', 'Honey'],
                method: 'Take 1/2 tsp with honey, 2-3 times daily after food.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ajwain Steam',
                description: 'Clears sinuses and relieves congestion',
                ingredients: ['Ajwain seeds', 'Hot water'],
                method: 'Add ajwain to boiling water. Inhale steam with towel over head.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Haldi Doodh (Golden Milk)',
                description: 'Immunity booster and throat soother',
                ingredients: ['Turmeric', 'Milk', 'Black pepper', 'Ghee'],
                method: 'Boil turmeric in milk. Add pepper and ghee. Drink warm at bedtime.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Light Walking',
                description: 'If energy permits',
                duration: '10 minutes',
                frequency: 'As tolerated'
            },
            {
                name: 'Pranayama (Light Breathing)',
                description: 'Gentle Anulom Vilom after recovery begins',
                duration: '5 minutes',
                frequency: 'Once daily when feeling better'
            }
        ],
        warnings: ['Rest adequately', 'Stay hydrated', 'Avoid cold foods and drinks'],
        seekHelp: 'If symptoms worsen after 7 days, high fever develops, or breathing becomes difficult'
    },

    stress_anxiety: {
        id: 'stress_anxiety',
        name: 'Stress / Anxiety',
        description: 'Mental tension causing physical symptoms like headaches, fatigue, and restlessness',
        matchCriteria: {
            locations: ['head', 'chest', 'stomach', 'body'],
            types: ['tense', 'tight', 'racing', 'restless', 'nervous'],
            triggers: ['work', 'deadlines', 'worry', 'overthinking', 'life changes', 'pressure'],
            specialSymptoms: ['racing thoughts', 'difficulty concentrating', 'irritability', 'muscle tension', 'sleep issues', 'fatigue', 'nervousness']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Deep Breathing',
                description: 'Activates calming response',
                ingredients: [],
                method: 'Breathe in for 4 counts, hold for 4, exhale for 6. Repeat 10 times.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Progressive Muscle Relaxation',
                description: 'Releases physical tension',
                ingredients: [],
                method: 'Tense and release each muscle group from toes to head.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ashwagandha Milk',
                description: 'Premier Ayurvedic adaptogen for stress relief',
                ingredients: ['Ashwagandha powder', 'Warm milk', 'Honey'],
                method: 'Mix 1/2 tsp ashwagandha in warm milk. Add honey. Drink at bedtime.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Brahmi Tea',
                description: 'Calms mind and improves mental clarity',
                ingredients: ['Brahmi powder or leaves', 'Hot water', 'Honey'],
                method: 'Steep brahmi in hot water for 10 mins. Strain and add honey.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Jatamansi (Spikenard)',
                description: 'Traditional nervine tonic',
                ingredients: ['Jatamansi powder', 'Warm water or milk'],
                method: 'Take 1/4 tsp with warm water before bed.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Shankhpushpi',
                description: 'Ayurvedic brain tonic for mental calmness',
                ingredients: ['Shankhpushpi powder', 'Honey', 'Milk'],
                method: 'Mix 1/2 tsp with honey or in warm milk. Take twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Chamomile-Tulsi Tea',
                description: 'Soothing blend for anxiety',
                ingredients: ['Chamomile flowers', 'Tulsi leaves', 'Honey'],
                method: 'Steep both in hot water. Add honey. Drink in evening.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Shirodhara Oil Application',
                description: 'Self-massage technique for calming',
                ingredients: ['Brahmi oil or Sesame oil (warm)'],
                method: 'Gently massage warm oil on scalp and forehead before bed.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Yoga Nidra',
                description: 'Deep relaxation meditation',
                duration: '20-30 minutes',
                frequency: 'Daily, especially before sleep'
            },
            {
                name: 'Anulom Vilom (Alternate Nostril Breathing)',
                description: 'Balances nervous system',
                duration: '10-15 minutes',
                frequency: 'Morning and evening'
            },
            {
                name: 'Meditation',
                description: 'Quiets racing mind',
                duration: '10-20 minutes',
                frequency: 'Daily'
            },
            {
                name: 'Walking in Nature',
                description: 'Grounding and calming',
                duration: '20-30 minutes',
                frequency: 'Daily'
            }
        ],
        warnings: ['Limit caffeine', 'Maintain regular sleep schedule', 'Limit social media and news'],
        seekHelp: 'If anxiety is severe, panic attacks occur, or symptoms significantly impact daily life'
    },

    hypothyroidism: {
        id: "hypothyroidism",
        name: "Hypothyroidism (Underactive Thyroid)",
        description: "Thyroid gland does not produce enough hormone causing metabolism to slow down.",
        matchCriteria: {
            locations: ["neck", "throat", "body"],
            types: ["fatigued", "heavy", "swollen"],
            triggers: ["stress", "autoimmune", "iodine deficiency"],
            specialSymptoms: ["weight gain", "cold sensitivity", "hair loss", "dry skin", "constipation", "fatigue", "puffy face"]
        },
        severity: "mild-moderate",
        prevalence: "common",
        remedies: [
            {
                name: "Iodine Rich Foods",
                description: "Supports thyroid function.",
                ingredients: ["Iodized salt", "Dairy", "Seafood"],
                method: "Include in daily diet."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Coriander Seed Water",
                description: "Stimulates thyroid.",
                ingredients: ["Coriander seeds", "Water"],
                method: "Boil 2 tsp seeds in water. Strain and drink morning and evening."
            },
            {
                name: "Kanchanar Guggulu",
                description: "Ayurvedic thyroid support.",
                ingredients: ["Kanchanar Guggulu tablets"],
                method: "Take as prescribed by Ayurvedic doctor."
            }
        ],
        exercises: [
            {
                name: "Sarvangasana (Shoulder Stand)",
                description: "Stimulates throat chakra/thyroid.",
                duration: "1-2 mins",
                frequency: "Daily (avoid if neck pain)"
            }
        ],
        warnings: ["Avoid raw goitrogens (cabbage, cauliflower) in excess.", "Take medication on empty stomach."],
        seekHelp: "If severe fatigue, depression, or goiter (swelling in neck)."
    },

    hyperthyroidism: {
        id: "hyperthyroidism",
        name: "Hyperthyroidism (Overactive Thyroid)",
        description: "Thyroid gland produces too much hormone causing metabolism to speed up.",
        matchCriteria: {
            locations: ["neck", "throat", "body"],
            types: ["jittery", "hot", "restless"],
            triggers: ["stress", "autoimmune"],
            specialSymptoms: ["weight loss", "heat intolerance", "tremors", "anxiety", "palpitations", "bulging eyes"]
        },
        severity: "moderate",
        prevalence: "uncommon",
        remedies: [
            {
                name: "Stress Management",
                description: "Reduces symptom severity.",
                ingredients: [],
                method: "Meditation and calming activities."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Amla Juice",
                description: "Cooling effect.",
                ingredients: ["Amla juice"],
                method: "Drink 20ml daily."
            }
        ],
        exercises: [
            {
                name: "Sheetali Pranayama",
                description: "Cooling breath.",
                duration: "5-10 mins",
                frequency: "Daily"
            }
        ],
        warnings: ["Avoid iodine supplements.", "Limit caffeine."],
        seekHelp: "If heart rate is very high or irregular."
    }
};
