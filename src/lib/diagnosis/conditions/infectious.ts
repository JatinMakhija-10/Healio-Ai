import { Condition } from "../types";

export const infectiousConditions: Record<string, Condition> = {
    dengue: {
        id: 'dengue',
        name: 'Dengue Fever (Dandaka Jvara)',
        description: 'Mosquito-borne viral infection causing high fever and severe bone pain.',
        matchCriteria: {
            locations: ['body', 'head', 'eyes', 'joints', 'back'],
            types: ['breaking', 'aching', 'severe', 'throbbing'],
            triggers: ['mosquito bite', 'rainy season'],
            specialSymptoms: ['pain behind eyes', 'rash', 'bleeding gums', 'high fever', 'severe joint pain', 'bone pain']
        },
        severity: 'severe',
        prevalence: 'uncommon',
        remedies: [
            {
                name: 'Hydration',
                description: 'Critical to maintain platelet count and blood volume',
                ingredients: ['ORS', 'Water', 'Coconut Water'],
                method: 'Drink fluids constantly. Monitor urine output.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Papaya Leaf Juice',
                description: 'Traditionally used to support platelet count',
                ingredients: ['Fresh papaya leaves'],
                method: 'Crush leaves to extract juice. Take 2 tbsp twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Giloy Juice',
                description: 'Immunity booster and fever reducer',
                ingredients: ['Giloy stem', 'Water'],
                method: 'Boil giloy stem in water or take juice. Drink daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Fenugreek Water',
                description: 'Helps reduce fever',
                ingredients: ['Fenugreek seeds', 'Water'],
                method: 'Soak seeds or boil lightly. Drink the water.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Complete Complete Rest',
                description: 'Do not exert at all',
                duration: 'Until recovered',
                frequency: 'Continuous'
            }
        ],
        warnings: ['Check platelet count daily', 'Watch for bleeding', 'No Aspirin/Ibuprofen (risk of bleeding)'],
        seekHelp: 'IMMEDIATELY if bleeding from gums/nose, persistent vomiting, or severe abdominal pain'
    },

    malaria: {
        id: 'malaria',
        name: 'Malaria (Vishama Jvara)',
        description: 'Mosquito-borne disease causing recurring fever and chills.',
        matchCriteria: {
            locations: ['body', 'head'],
            types: ['shivering', 'cold', 'hot', 'sweating'],
            triggers: ['mosquito bite', 'travel'],
            specialSymptoms: ['chills', 'shaking', 'cycles of fever', 'sweating', 'vomiting', 'headache']
        },
        severity: 'moderate-severe',
        remedies: [
            {
                name: 'Medical Treatment',
                description: 'Requires antimalarial medication',
                ingredients: ['Prescribed medication'],
                method: 'Complete the full course of prescribed antimalarials.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ginger and Raisin Decoction',
                description: 'Supports recovery',
                ingredients: ['Ginger', 'Raisins', 'Water'],
                method: 'Boil together until concentrated. Drink warm.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Holy Basil (Tulsi) Tea',
                description: 'Reduces fever severity',
                ingredients: ['Tulsi leaves', 'Black pepper'],
                method: 'Boil tulsi and pepper. Drink warm.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Complete full course of medication', 'Use mosquito nets'],
        seekHelp: 'If fever is very high, confusion, or dark urine occurs'
    },

    typhoid: {
        id: 'typhoid',
        name: 'Typhoid Fever',
        description: 'Bacterial infection causing high sustained fever and digestive issues.',
        matchCriteria: {
            locations: ['stomach', 'abdomen', 'head', 'body'],
            types: ['sustained', 'weak', 'achy'],
            triggers: ['contaminated food', 'water'],
            specialSymptoms: ['step-ladder fever', 'stomach pain', 'loss of appetite', 'weakness', 'rash (rose spots)']
        },
        severity: 'moderate-severe',
        remedies: [
            {
                name: 'Bland Diet',
                description: 'Easy to digest foods',
                ingredients: ['Rice', 'Yogurt', 'Boiled vegetables'],
                method: 'Eat small, frequent bland meals.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Rice Porridge (Kanji)',
                description: 'Provides energy without straining digestion',
                ingredients: ['Rice', 'Water', 'Salt'],
                method: 'Cook rice with excess water until very soft.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Banana and Yogurt',
                description: 'Probiotic and easy to digest',
                ingredients: ['Banana', 'Curd'],
                method: 'Mash banana in curd. Eat for energy.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Hydration is key', 'Avoid raw foods', 'Wash hands'],
        seekHelp: 'If fever persists despite meds, blood in stool, or severe dehydration'
    },

    food_poisoning: {
        id: 'food_poisoning',
        name: 'Food Poisoning',
        description: 'Illness caused by eating contaminated food.',
        matchCriteria: {
            locations: ['stomach', 'abdomen', 'intestines'],
            types: ['cramping', 'sharp', 'nauseous'],
            triggers: ['eating out', 'stale food', 'suspicious meal'],
            specialSymptoms: ['vomiting', 'diarrhea', 'nausea', 'stomach cramps', 'fever']
        },
        severity: 'mild-moderate',
        prevalence: 'common',
        remedies: [
            {
                name: 'Fluid Replacement',
                description: 'Replace lost electrolytes',
                ingredients: ['ORS', 'Sports drinks'],
                method: 'Sip small amounts frequently.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'BRAT Diet',
                description: 'Bananas, Rice, Applesauce, Toast',
                ingredients: ['Banana', 'Rice', 'Toast'],
                method: 'Start with these bland foods when vomiting stops.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Lemon and Ginger Water',
                description: 'Soothes nausea',
                ingredients: ['Lemon juice', 'Ginger juice', 'Warm water'],
                method: 'Sip slowly to settle stomach.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Cumin (Jeera) Water',
                description: 'Reduces inflammation and gas',
                ingredients: ['Cumin seeds', 'Water'],
                method: 'Boil cumin in water. Cool and sip.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Yogurt with Fenugreek',
                description: 'Probiotic and soothing',
                ingredients: ['Yogurt', 'Fenugreek powder'],
                method: 'Mix a pinch of roasted fenugreek in yogurt. Eat.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Do not take anti-diarrheal immediately (let toxins flush)', 'Hydrate'],
        seekHelp: 'If bloody diarrhea, signs of dehydration, or blurry vision'
    },

    chickenpox: {
        id: 'chickenpox',
        name: 'Chickenpox (Varicella)',
        description: 'Highly contagious viral infection causing itchy blister rash.',
        matchCriteria: {
            locations: ['skin', 'body', 'face', 'chest', 'back'],
            types: ['itchy', 'blistering'],
            triggers: ['virus', 'unvaccinated contact'],
            specialSymptoms: ['itchy blisters', 'rash spreading', 'fever', 'fatigue', 'headache before rash']
        },
        severity: 'moderate',
        prevalence: 'common',
        remedies: [
            {
                name: 'Calamine Lotion',
                description: 'Reduces itching.',
                ingredients: ['Calamine lotion'],
                method: 'Apply to blisters.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Oatmeal Bath',
                description: 'Soothes skin.',
                ingredients: ['Colloidal oatmeal'],
                method: 'Add to lukewarm bath.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Neem Leaf Bath',
                description: 'Antiviral and antipruritic.',
                ingredients: ['Neem leaves', 'Water'],
                method: 'Boil neem leaves. Add to bath water.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Keep nails trimmed to avoid scratching.', 'Isolate to prevent spread.'],
        seekHelp: 'If high fever, difficulty breathing, or infection at blister sites.'
    },

    mumps: {
        id: 'mumps',
        name: 'Mumps',
        description: 'Viral infection causing swelling of salivary glands.',
        matchCriteria: {
            locations: ['jaw', 'face', 'neck', 'cheeks'],
            types: ['swollen', 'tender', 'painful'],
            triggers: ['virus', 'unvaccinated contact'],
            specialSymptoms: ['swollen cheeks', 'pain chewing', 'fever', 'headache', 'muscle aches']
        },
        severity: 'moderate',
        prevalence: 'uncommon',
        remedies: [
            {
                name: 'Cold Compress',
                description: 'Reduces swelling.',
                ingredients: ['Cold pack'],
                method: 'Apply to swollen area.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ginger Tea',
                description: 'Anti-inflammatory.',
                ingredients: ['Ginger', 'Water', 'Honey'],
                method: 'Boil ginger, add honey, drink warm.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Eat soft foods.', 'Stay hydrated.'],
        seekHelp: 'If severe headache, neck stiffness, or abdominal pain.'
    },

    meningitis: {
        id: 'meningitis',
        name: 'Meningitis',
        description: 'Inflammation of brain and spinal cord membranes. MEDICAL EMERGENCY.',
        matchCriteria: {
            locations: ['head', 'neck', 'body'],
            types: ['severe', 'stiff'],
            triggers: ['virus', 'bacteria', 'infection'],
            specialSymptoms: ['stiff neck', 'severe headache', 'high fever', 'sensitivity to light', 'rash that doesnt fade', 'confusion']
        },
        severity: 'critical',
        prevalence: 'rare',
        redFlags: ['stiff neck with fever', 'rash that doesnt fade under glass', 'confusion with fever'],
        remedies: [
            {
                name: 'EMERGENCY - Hospital',
                description: 'No home treatment. Go to ER immediately.',
                ingredients: [],
                method: 'Call ambulance. Time is critical.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [],
        exercises: [],
        warnings: ['LIFE-THREATENING if bacterial.', 'Every minute counts.'],
        seekHelp: 'IMMEDIATELY. This is an emergency.'
    }
};
