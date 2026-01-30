import { Condition } from "../types";

export const dentalConditions: Record<string, Condition> = {
    toothache: {
        id: 'toothache',
        name: 'Toothache',
        description: 'Pain in or around a tooth',
        matchCriteria: {
            locations: ['mouth', 'tooth', 'jaw', 'gum'],
            types: ['throbbing', 'sharp', 'sensitive', 'aching'],
            triggers: ['cold', 'hot', 'sweet', 'chewing', 'biting'],
            specialSymptoms: ['swollen gum', 'cavity', 'pain on biting']
        },
        severity: 'moderate',
        remedies: [
            {
                name: 'Salt Water Rinse',
                description: 'Disinfects and reduces swelling',
                ingredients: ['Salt', 'Warm water'],
                method: 'Swish for 30 seconds. Spit out.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Cold Compress',
                description: 'Numbs area',
                ingredients: ['Ice pack'],
                method: 'Apply to cheek outside painful area.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Clove Oil (Laung Ka Tel)',
                description: 'Natural anesthetic (Eugenol)',
                ingredients: ['Clove oil', 'Cotton ball'],
                method: 'Dab minimal oil on cotton. Place on tooth. Avoid gums if possible.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Whole Clove',
                description: 'Alternative to oil',
                ingredients: ['Clove'],
                method: 'Chew clove gently near the tooth.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Guava Leaves',
                description: 'Anti-inflammatory',
                ingredients: ['Fresh guava leaves'],
                method: 'Chew leaves or boil for mouthwash.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Avoid hot/cold foods', 'Do not place aspirin directly on gums'],
        seekHelp: 'See dentist ASAP. Infection can spread.'
    },
    mouth_ulcer: {
        id: 'mouth_ulcer',
        name: 'Mouth Ulcer / Canker Sore',
        description: 'Painful sores inside the mouth',
        matchCriteria: {
            locations: ['mouth', 'tongue', 'cheek', 'lip'],
            types: ['burning', 'stinging', 'sharp'],
            triggers: ['acidic food', 'stress', 'injury', 'spicy food'],
            specialSymptoms: ['white spot', 'red border', 'pain when eating']
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Salt Water Rinse',
                description: 'Promotes healing',
                ingredients: ['Salt', 'Water'],
                method: 'Rinse mouth gently.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Honey and Turmeric',
                description: 'Antimicrobial paste',
                ingredients: ['Honey', 'Turmeric'],
                method: 'Apply paste to ulcer.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ghee',
                description: 'Soothes and heals',
                ingredients: ['Clarified butter (Ghee)'],
                method: 'Apply on ulcer repeatedly.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Tulsi Leaves',
                description: 'Adaptogen and healing',
                ingredients: ['Tulsi leaves'],
                method: 'Chew leaves and keep paste on ulcer.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Avoid spicy/acidic foods'],
        seekHelp: 'If ulcer lasts > 2 weeks or is unusually large'
    },
    gingivitis: {
        id: 'gingivitis',
        name: 'Gingivitis (Gum Inflammation)',
        description: 'Early stage gum disease causing redness and bleeding',
        matchCriteria: {
            locations: ['gums', 'mouth'],
            types: ['sore', 'sensitive', 'bleeding'],
            triggers: ['brushing', 'flossing'],
            specialSymptoms: ['bleeding gums', 'red gums', 'swollen gums', 'bad breath']
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Better Oral Hygiene',
                description: 'Remove plaque',
                ingredients: ['Soft toothbrush', 'Floss'],
                method: 'Brush twice daily, floss daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Oil Pulling (Gandusha)',
                description: 'Draws out toxins',
                ingredients: ['Coconut or Sesame oil'],
                method: 'Swish 1 tbsp oil in mouth for 15 mins. Spit. Do not swallow.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Neem Twig/Datun',
                description: 'Natural toothbrush',
                ingredients: ['Neem twig'],
                method: 'Chew end to make bristles. Brush teeth and gums.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Turmeric Gel',
                description: 'Anti-inflammatory for gums',
                ingredients: ['Turmeric', 'Water/Oil'],
                method: 'Massage gums gently.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Do not stop brushing due to bleeding (brush gently)', 'See dentist for cleaning'],
        seekHelp: 'If gums are pulling away from teeth or teeth are loose'
    },

    dental_abscess: {
        id: 'dental_abscess',
        name: 'Dental Abscess',
        description: 'Pocket of pus from bacterial infection in tooth or gums.',
        matchCriteria: {
            locations: ['tooth', 'gum', 'jaw', 'face'],
            types: ['throbbing', 'severe', 'constant'],
            triggers: ['cavity', 'injury', 'gum disease'],
            specialSymptoms: ['severe toothache', 'swelling in face', 'fever', 'pus', 'bad taste', 'swollen lymph nodes']
        },
        severity: 'severe',
        prevalence: 'common',
        redFlags: ['fever with facial swelling', 'difficulty breathing or swallowing'],
        remedies: [
            {
                name: 'Salt Water Rinse',
                description: 'Draws pus to surface.',
                ingredients: ['Salt', 'Warm water'],
                method: 'Swish gently. Spit.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Clove Oil',
                description: 'Temporary pain relief.',
                ingredients: ['Clove oil', 'Cotton'],
                method: 'Apply to affected area.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Infection can spread to jaw, head, or neck.', 'Do NOT squeeze abscess.'],
        seekHelp: 'URGENTLY. Requires antibiotics and possibly drainage.'
    },

    tmj_disorder: {
        id: 'tmj_disorder',
        name: 'TMJ Disorder (Jaw Joint Pain)',
        description: 'Pain and dysfunction in the jaw joint and muscles.',
        matchCriteria: {
            locations: ['jaw', 'face', 'ear', 'head'],
            types: ['aching', 'clicking', 'locking', 'tender'],
            triggers: ['chewing', 'stress', 'teeth grinding', 'yawning'],
            specialSymptoms: ['jaw clicking', 'jaw locking', 'face pain', 'difficulty opening mouth']
        },
        severity: 'moderate',
        prevalence: 'common',
        remedies: [
            {
                name: 'Soft Diet',
                description: 'Rest jaw muscles.',
                ingredients: [],
                method: 'Avoid hard, chewy foods.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Warm/Cold Compress',
                description: 'Reduces pain and inflammation.',
                ingredients: ['Warm cloth', 'Ice pack'],
                method: 'Apply to jaw area.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Sesame Oil Massage',
                description: 'Relaxes jaw muscles.',
                ingredients: ['Warm sesame oil'],
                method: 'Gently massage jaw area.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Jaw Stretches',
                description: 'Gentle opening exercises.',
                duration: '5 mins',
                frequency: 'Daily'
            }
        ],
        warnings: ['Avoid gum chewing.', 'Manage stress (clenching).'],
        seekHelp: 'If jaw locks completely or severe pain.'
    }
};
