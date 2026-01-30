import { Condition } from "../types";

export const entConditions: Record<string, Condition> = {
    ear_infection: {
        id: 'ear_infection',
        name: 'Ear Infection (Otitis Media)',
        description: 'Infection in the middle ear causing pain',
        matchCriteria: {
            locations: ['ear', 'head', 'jaw'],
            types: ['sharp', 'dull', 'pressure', 'blocked'],
            triggers: ['cold', 'flu', 'water'],
            specialSymptoms: ['ear pain', 'fluid drainage', 'reduced hearing', 'fever']
        },
        severity: 'moderate',
        remedies: [
            {
                name: 'Warm Compress',
                description: 'Relieves pain',
                ingredients: ['Warm towel'],
                method: 'Hold against ear for 10-15 mins.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'OTC Pain Relief',
                description: 'Reduces pain and fever',
                ingredients: ['Paracetamol/Ibuprofen'],
                method: 'Take as directed.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Garlic Oil',
                description: 'Antimicrobial drops',
                ingredients: ['Garlic', 'Mustard oil/Sesame oil'],
                method: 'Heat garlic in oil. Cool to warm. 1-2 drops in ear. (ONLY if eardrum not perforated).',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Basil (Tulsi) Juice',
                description: 'Relieves earache',
                ingredients: ['Fresh tulsi leaves'],
                method: 'Crush leaves for juice. Apply AROUND ear (not inside usually).',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Do not put objects in ear', 'Do not use oil if discharge is present (ruptured eardrum risk)'],
        seekHelp: 'If severe pain, high fever, or fluid/blood draining from ear'
    },
    sore_throat: {
        id: 'sore_throat',
        name: 'Sore Throat / Pharyngitis',
        description: 'Pain, scratchiness or irritation of the throat',
        matchCriteria: {
            locations: ['throat', 'neck'],
            types: ['scratchy', 'raw', 'burning', 'painful'],
            triggers: ['swallowing', 'talking', 'cold air'],
            specialSymptoms: ['pain on swallowing', 'red throat', 'swollen glands', 'hoarseness']
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Salt Water Gargle',
                description: 'Reduces swelling and kills bacteria',
                ingredients: ['Salt', 'Warm water'],
                method: 'Gargle for 30 seconds, 3-4 times daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Lozenges',
                description: 'Keeps throat moist',
                ingredients: ['Throat lozenges'],
                method: 'Dissolve in mouth.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ginger Honey Juice',
                description: 'Soothes inflammation',
                ingredients: ['Ginger juice', 'Honey'],
                method: 'Mix and swallow slowly.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Turmeric Gargle',
                description: 'Antiseptic gargle',
                ingredients: ['Turmeric', 'Salt', 'Warm water'],
                method: 'Gargle deeply.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Mulethi (Licorice)',
                description: 'Coats throat',
                ingredients: ['Mulethi stick'],
                method: 'Chew on stick.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Stay hydrated', 'Avoid smoke'],
        seekHelp: 'If difficulty breathing, drooling, or high fever'
    },
    nosebleed: {
        id: 'nosebleed',
        name: 'Nosebleed (Epistaxis)',
        description: 'Bleeding from the nose',
        matchCriteria: {
            locations: ['nose'],
            types: ['bleeding'],
            triggers: ['dry air', 'picking', 'injury', 'blowing nose'],
            specialSymptoms: ['blood from nose']
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Pinch and Lean',
                description: 'Stops blood flow',
                ingredients: [],
                method: 'Lean FORWARD (not back). Pinch soft part of nose for 10-15 mins.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ice Pack',
                description: 'Constricts blood vessels',
                ingredients: ['Ice'],
                method: 'Apply to bridge of nose.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Cold Water',
                description: 'Quick constriction',
                ingredients: ['Cold water'],
                method: 'Splash cold water on face and head.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Onion Juice',
                description: 'Folk remedy for clotting',
                ingredients: ['Onion juice'],
                method: 'Inhale smell of cut onion (said to help clot).',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Do not lie down', 'Do not tilt head back (swallowing blood causes nausea)'],
        seekHelp: 'If bleeding lasts > 20 mins or heavy blood loss'
    },

    sinusitis: {
        id: 'sinusitis',
        name: 'Sinusitis',
        description: 'Inflammation of the sinuses causing facial pain and congestion.',
        matchCriteria: {
            locations: ['face', 'forehead', 'nose', 'cheeks'],
            types: ['pressure', 'aching', 'throbbing', 'blocked'],
            triggers: ['cold', 'allergies', 'pollution'],
            specialSymptoms: ['facial pain', 'blocked nose', 'colored mucus', 'reduced smell', 'pain when bending forward']
        },
        severity: 'moderate',
        prevalence: 'very_common',
        remedies: [
            {
                name: 'Steam Inhalation',
                description: 'Opens sinuses.',
                ingredients: ['Hot water', 'Towel'],
                method: 'Inhale steam for 10-15 mins, 3 times daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Saline Rinse',
                description: 'Clears mucus.',
                ingredients: ['Saline solution', 'Neti pot'],
                method: 'Flush each nostril gently.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ajwain Steam',
                description: 'Potent for sinus blockage.',
                ingredients: ['Ajwain seeds', 'Hot water'],
                method: 'Add ajwain to boiling water. Inhale steam.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Eucalyptus Oil',
                description: 'Clears congestion.',
                ingredients: ['Eucalyptus oil', 'Hot water'],
                method: 'Add drops to hot water. Inhale.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Stay hydrated.', 'Avoid allergens.'],
        seekHelp: 'If symptoms last > 10 days or high fever.'
    },

    tonsillitis: {
        id: 'tonsillitis',
        name: 'Tonsillitis',
        description: 'Inflammation of the tonsils, usually due to infection.',
        matchCriteria: {
            locations: ['throat', 'neck'],
            types: ['painful', 'swollen'],
            triggers: ['infection', 'virus', 'bacteria'],
            specialSymptoms: ['swollen tonsils', 'white patches on tonsils', 'difficulty swallowing', 'fever', 'bad breath']
        },
        severity: 'moderate',
        prevalence: 'common',
        remedies: [
            {
                name: 'Warm Fluids',
                description: 'Soothes throat.',
                ingredients: ['Warm water', 'Honey', 'Lemon'],
                method: 'Sip throughout the day.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Turmeric Milk',
                description: 'Reduces inflammation.',
                ingredients: ['Milk', 'Turmeric', 'Pepper'],
                method: 'Boil and drink warm at night.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Fenugreek Gargle',
                description: 'Antibacterial.',
                ingredients: ['Fenugreek seeds', 'Water'],
                method: 'Boil seeds in water. Cool. Gargle.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Rest your voice.', 'Avoid cold drinks.'],
        seekHelp: 'If difficulty breathing or persistent high fever.'
    },

    tinnitus: {
        id: 'tinnitus',
        name: 'Tinnitus (Ringing in Ears)',
        description: 'Perception of ringing, buzzing, or humming in the ears without external source.',
        matchCriteria: {
            locations: ['ear', 'head'],
            types: ['ringing', 'buzzing', 'hissing'],
            triggers: ['loud noise', 'stress', 'ear wax'],
            specialSymptoms: ['ringing in ears', 'buzzing sound', 'hearing issues']
        },
        severity: 'mild-moderate',
        prevalence: 'common',
        remedies: [
            {
                name: 'Sound Therapy',
                description: 'Masks tinnitus.',
                ingredients: ['White noise machine', 'Fan'],
                method: 'Use background noise to reduce perception of ringing.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Sesame Oil Drops',
                description: 'Ayurvedic remedy for ear health.',
                ingredients: ['Warm sesame oil'],
                method: '1-2 drops in ear at night. (Only if no infection/perforation).',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Protect ears from loud sounds.', 'Manage stress.'],
        seekHelp: 'If accompanies hearing loss or affects one ear only.'
    }
};
