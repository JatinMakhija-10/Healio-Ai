import { Condition } from "../types";

export const eyeConditions: Record<string, Condition> = {
    conjunctivitis: {
        id: 'conjunctivitis',
        name: 'Conjunctivitis / Pink Eye',
        description: 'Inflammation or infection of the transparent membrane lining the eyelid and eyeball',
        matchCriteria: {
            locations: ['eye'],
            types: ['itchy', 'gritty', 'burning', 'red'],
            triggers: ['bacteria', 'virus', 'allergy', 'dust'],
            specialSymptoms: ['red eye', 'discharge', 'crusty eyelids', 'tearing']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Warm/Cold Compress',
                description: 'Soothes discomfort',
                ingredients: ['Clean cloth', 'Water'],
                method: 'Use warm for infection (unclogs), cold for allergy (soothes).',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Artificial Tears',
                description: 'Lubrication',
                ingredients: ['Eye drops'],
                method: 'Apply as needed.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Triphala Water Wash',
                description: 'Ayurvedic eye wash',
                ingredients: ['Triphala powder', 'Water', 'Filter cloth'],
                method: 'Soak triphala overnight. Strain VERY well (no particles). Wash eyes.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Rose Water',
                description: 'Cooling',
                ingredients: ['Pure rose water'],
                method: 'Put 1-2 drops in eye (ensure purity).',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Highly contagious (if viral/bacterial) - Wash hands', 'Do not share towels'],
        seekHelp: 'If severe pain, vision loss, or sensitive to light'
    },
    stye: {
        id: 'stye',
        name: 'Stye',
        description: 'Red, painful lump near the edge of the eyelid',
        matchCriteria: {
            locations: ['eyelid', 'eye'],
            types: ['painful', 'tender', 'swollen'],
            triggers: ['bacteria', 'blocked gland', 'old makeup'],
            specialSymptoms: ['lump on eyelid', 'pimple on eyelid', 'redness']
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Warm Compress',
                description: 'Promotes drainage',
                ingredients: ['Clean warm cloth'],
                method: 'Apply for 10-15 mins, 4 times daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Turmeric Paste',
                description: 'Anti-inflammatory',
                ingredients: ['Turmeric', 'Water'],
                method: 'Apply EXTERNALLY on swelling (careful not to get in eye).',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Coriander Seed Wash',
                description: 'Reduces swelling',
                ingredients: ['Coriander seeds', 'Water'],
                method: 'Boil seeds. Strain. Use liquid to wash eye area.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Do not squeeze or pop', 'Discard old makeup'],
        seekHelp: 'If eye swells shut or vision changes'
    },
    dry_eyes: {
        id: 'dry_eyes',
        name: 'Dry Eyes',
        description: 'Eyes do not produce enough tears',
        matchCriteria: {
            locations: ['eye'],
            types: ['dry', 'gritty', 'burning', 'tired'],
            triggers: ['screens', 'wind', 'ac', 'aging'],
            specialSymptoms: ['feeling of sand in eye', 'redness', 'blurred vision']
        },
        severity: 'mild',
        remedies: [
            {
                name: '20-20-20 Rule',
                description: 'Reduces strain',
                ingredients: [],
                method: 'Every 20 mins, look 20 feet away for 20 seconds.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ghee in Eyes (Netra Tarpana)',
                description: 'Lubricates',
                ingredients: ['Pure cow ghee'],
                method: '1 drop in each eye at bedtime (Consult Ayurvedic doctor first).',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Cucumber Slices',
                description: 'Cools eyes',
                ingredients: ['Cucumber'],
                method: 'Place slices over closed eyes.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Blinking Exercises',
                description: 'Refresh tear film',
                duration: '1 minute',
                frequency: 'Hourly'
            }
        ],
        warnings: ['Limit screen time', 'Blink more often'],
        seekHelp: 'If persistent and damaging cornea'
    },

    eye_strain: {
        id: 'eye_strain',
        name: 'Digital Eye Strain (Computer Vision Syndrome)',
        description: 'Eye discomfort and vision problems from prolonged screen use.',
        matchCriteria: {
            locations: ['eye', 'head'],
            types: ['tired', 'strained', 'heavy', 'headache'],
            triggers: ['screens', 'computer', 'phone', 'reading'],
            specialSymptoms: ['eye fatigue', 'headache', 'blurred vision', 'neck pain', 'difficulty focusing']
        },
        severity: 'mild',
        prevalence: 'very_common',
        remedies: [
            {
                name: '20-20-20 Rule',
                description: 'Prevents strain buildup.',
                ingredients: [],
                method: 'Every 20 mins, look at something 20 ft away for 20 seconds.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Palming',
                description: 'Relaxes eye muscles.',
                ingredients: [],
                method: 'Rub palms together. Cup over closed eyes. Breathe deeply.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Rose Water',
                description: 'Cooling and refreshing.',
                ingredients: ['Pure rose water'],
                method: 'Apply with cotton pads on closed eyes.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Eye Circles',
                description: 'Relaxes eye muscles.',
                duration: '2 mins',
                frequency: 'Every hour of screen work'
            }
        ],
        warnings: ['Adjust screen brightness.', 'Use blue light filters.'],
        seekHelp: 'If persistent headaches or vision changes.'
    },

    glaucoma: {
        id: 'glaucoma',
        name: 'Glaucoma',
        description: 'Eye condition causing optic nerve damage, often from high eye pressure.',
        matchCriteria: {
            locations: ['eye'],
            types: ['pressure', 'painful'],
            triggers: ['genetics', 'age', 'high blood pressure'],
            specialSymptoms: ['tunnel vision', 'halos around lights', 'severe eye pain', 'nausea', 'red eye']
        },
        severity: 'severe',
        prevalence: 'common',
        redFlags: ['sudden severe eye pain with nausea', 'sudden vision loss', 'halos around lights'],
        remedies: [
            {
                name: 'Medical Treatment',
                description: 'Requires prescription eye drops.',
                ingredients: [],
                method: 'Consult ophthalmologist immediately. Cannot be treated at home.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Triphala Eye Wash (Preventive)',
                description: 'Traditional eye tonic.',
                ingredients: ['Triphala powder', 'Water'],
                method: 'Soak overnight, strain VERY WELL. Use as wash (consult doctor first).',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Regular eye checkups after 40.', 'Family history increases risk.'],
        seekHelp: 'IMMEDIATELY if sudden eye pain, vision loss, or halos. EMERGENCY.'
    },

    cataracts: {
        id: 'cataracts',
        name: 'Cataracts',
        description: 'Clouding of the eye lens causing blurry vision.',
        matchCriteria: {
            locations: ['eye'],
            types: ['blurry', 'foggy', 'dim'],
            triggers: ['aging', 'diabetes', 'smoking', 'UV exposure'],
            specialSymptoms: ['cloudy vision', 'difficulty with night vision', 'faded colors', 'sensitivity to glare']
        },
        severity: 'moderate-severe',
        prevalence: 'common',
        remedies: [
            {
                name: 'Surgery (Definitive)',
                description: 'Only cure is surgical lens replacement.',
                ingredients: [],
                method: 'Consult ophthalmologist when vision significantly impaired.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Triphala (Preventive)',
                description: 'May slow progression.',
                ingredients: ['Triphala powder', 'Water'],
                method: 'Soak overnight. Strain well. Use as eye wash or drink.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Wear sunglasses outdoors.', 'Manage diabetes.'],
        seekHelp: 'When vision affects daily activities like driving or reading.'
    }
};
