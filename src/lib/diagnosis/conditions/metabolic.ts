import { Condition } from "../types";

export const metabolicConditions: Record<string, Condition> = {
    diabetes_type2: {
        id: 'diabetes_type2',
        name: 'Type 2 Diabetes (Madhumeha)',
        description: 'Chronic metabolic condition characterized by high blood sugar levels.',
        matchCriteria: {
            locations: ['body', 'feet', 'eyes'],
            types: ['numb', 'tingling', 'tired', 'thirsty'],
            triggers: ['eating sugar', 'stress', 'obesity', 'sedentary lifestyle'],
            specialSymptoms: ['frequent urination', 'excessive thirst', 'extreme hunger', 'blurry vision', 'slow healing sores']
        },
        severity: 'moderate-severe',
        remedies: [
            {
                name: 'Dietary Changes',
                description: 'Low glycemic index diet',
                ingredients: ['Vegetables', 'Whole grains', 'Lean protein'],
                method: 'Reduce sugar and refined carbs. Eat frequent small meals.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Regular Exercise',
                description: 'Improves insulin sensitivity',
                ingredients: [],
                method: '30 mins of moderate activity daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Methi (Fenugreek) Water',
                description: 'Improves glucose tolerance',
                ingredients: ['Fenugreek seeds', 'Water'],
                method: 'Soak seeds overnight. Drink water in morning.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Karela (Bitter Gourd) Juice',
                description: 'Naturally lowers blood sugar',
                ingredients: ['Bitter gourd'],
                method: 'Drink 30ml fresh juice on empty stomach.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Jamun Seed Powder',
                description: 'Traditional diabetes remedy',
                ingredients: ['Dry jamun seeds'],
                method: 'Powder seeds. Take 1 tsp daily with water.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Brisk Walking',
                description: 'Best exercise for blood sugar control',
                duration: '30-45 minutes',
                frequency: 'Daily'
            },
            {
                name: 'Mandukasana (Frog Pose)',
                description: 'Stimulates pancreas',
                duration: '5 minutes',
                frequency: 'Daily'
            }
        ],
        warnings: ['Monitor blood sugar', 'Check feet for cuts', 'Yearly eye exam'],
        seekHelp: 'If fruit-smelling breath, confusion, or loss of consciousness'
    },

    anemia: {
        id: 'anemia',
        name: 'Anemia (Pandu Roga)',
        description: 'Deficiency of red blood cells or hemoglobin leading to fatigue.',
        matchCriteria: {
            locations: ['body', 'head', 'chest'],
            types: ['weak', 'dizzy', 'pale', 'tired'],
            triggers: ['exertion', 'menstruation', 'poor diet', 'standing'],
            specialSymptoms: ['paleness', 'fatigue', 'shortness of breath', 'dizziness', 'cold hands/feet', 'brittle nails']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Iron Supplementation',
                description: 'Restores iron levels',
                ingredients: ['Iron tablets'],
                method: 'Take as prescribed, often with Vitamin C.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Beetroot and Pomegranate',
                description: 'Blood builders',
                ingredients: ['Fresh juice'],
                method: 'Drink fresh mixed juice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Black Raisins and Dates',
                description: 'Rich in iron',
                ingredients: ['Raisins', 'Dates'],
                method: 'Soak overnight and eat in morning.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Jaggery and Peanuts/Chana',
                description: 'Traditional iron-rich snack',
                ingredients: ['Jaggery', 'Roasted chickapeas'],
                method: 'Snack on this combo daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Light Aerobics',
                description: 'As tolerated to improve stamina',
                duration: '10-15 minutes',
                frequency: '3-4 times per week'
            }
        ],
        warnings: ['Avoid tea/coffee with meals (blocks iron absorption)', 'Vitamin C helps absorption'],
        seekHelp: 'If chest pain, rapid heartbeat, or fainting occurs'
    }
};
