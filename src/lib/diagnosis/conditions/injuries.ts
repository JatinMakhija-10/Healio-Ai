import { Condition } from "../types";

export const injuryConditions: Record<string, Condition> = {
    minor_burn: {
        id: 'minor_burn',
        name: 'Minor Burn (First Degree)',
        description: 'Red, painful skin from heat, sun, or friction',
        matchCriteria: {
            locations: ['skin', 'hand', 'finger'],
            types: ['burning', 'stinging', 'hot'],
            triggers: ['stove', 'hot water', 'iron', 'sun'],
            specialSymptoms: ['redness', 'no blisters (or small)', 'pain']
        },
        severity: 'moderate',
        remedies: [
            {
                name: 'Cool Water (Not Ice)',
                description: 'Stops burning process',
                ingredients: ['Cool tap water'],
                method: 'Run cool water over burn for 10-20 minutes IMMEDIATELY.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Aloe Vera',
                description: 'Soothes and moisturizes',
                ingredients: ['Aloe gel'],
                method: 'Apply after cooling the burn.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Honey',
                description: 'Antibacterial barrier',
                ingredients: ['Raw honey'],
                method: 'Apply layer over cooled burn. Cover loosely.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Potato Slice',
                description: 'Absorbs heat',
                ingredients: ['Raw potato'],
                method: 'Place slice on burn.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Do NOT apply ice', 'Do not break blisters', 'Do not apply butter/toothpaste'],
        seekHelp: 'If burn is large, on face/groin/hands, or charred (3rd degree)'
    },
    cut_abrasion: {
        id: 'cut_abrasion',
        name: 'Cut / Abrasion',
        description: 'Broken skin causing bleeding',
        matchCriteria: {
            locations: ['skin', 'finger', 'knee', 'arm'],
            types: ['bleeding', 'stinging', 'sharp'],
            triggers: ['knife', 'fall', 'paper'],
            specialSymptoms: ['bleeding', 'open wound']
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Clean and Cover',
                description: 'Prevent infection',
                ingredients: ['Water', 'Mild soap', 'Bandage'],
                method: 'Wash with soap/water. Apply pressure to stop bleed. Cover.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Antibiotic Ointment',
                description: 'Prevents infection',
                ingredients: ['Neosporin etc.'],
                method: 'Apply thin layer.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Turmeric Powder',
                description: 'Stops bleeding and antiseptic',
                ingredients: ['Turmeric powder'],
                method: 'Apply powder directly to small cuts to stop bleeding.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Honey',
                description: 'Wound healing',
                ingredients: ['Honey'],
                method: 'Apply on clean wound.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Check tetanus status', 'Keep dry'],
        seekHelp: 'If stitches needed (deep/gaping), heavy bleeding, or rusty object'
    },
    bruise: {
        id: 'bruise',
        name: 'Bruise (Contusion)',
        description: 'Discoloration of skin due to internal bleeding from impact',
        matchCriteria: {
            locations: ['skin', 'leg', 'arm', 'body'],
            types: ['tender', 'aching'],
            triggers: ['bump', 'fall', 'impact'],
            specialSymptoms: ['blue/purple mark', 'swelling', 'tenderness']
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Ice Pack',
                description: 'Reduces bleeding/swelling',
                ingredients: ['Ice'],
                method: 'Apply for 15 mins several times first 24h.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Elevation',
                description: 'Reduces pooling',
                ingredients: [],
                method: 'Elevate area above heart.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Turmeric & Salt Paste',
                description: 'Reduces swelling',
                ingredients: ['Turmeric', 'Salt', 'Water'],
                method: 'Apply paste on bruise.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Arnica',
                description: 'Homeopathic remedy',
                ingredients: ['Arnica gel/cream'],
                method: 'Apply gently.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Do not massage forcefully'],
        seekHelp: 'If unexplained bruising often, or huge lump (hematoma)'
    },
    fracture: {
        id: 'fracture',
        name: 'Bone Fracture (Broken Bone)',
        description: 'A crack or break in a bone, usually from trauma.',
        matchCriteria: {
            locations: ['arm', 'leg', 'wrist', 'ankle', 'finger', 'toe', 'rib', 'hip', 'shoulder', 'bone'],
            types: ['intense pain', 'sharp', 'throbbing', 'break', 'crack'],
            triggers: ['fall', 'impact', 'accident', 'sports injury', 'trauma', 'crash'],
            specialSymptoms: [
                'visible deformity',
                'inability to move',
                'grating sensation',
                'severe swelling',
                'bruising',
                'bone protruding through skin',
                'inability to bear weight',
                'snapping sound'
            ],
            symptomWeights: {
                "visible deformity": { specificity: 0.99, weight: 4.0 },
                "bone protruding through skin": { specificity: 1.0, weight: 6.0 },
                "inability to move": { specificity: 0.95, weight: 2.5 },
                "grating sensation": { specificity: 0.98, weight: 3.0 },
                "inability to bear weight": { specificity: 0.9, weight: 2.5 },
                "snapping sound": { specificity: 0.95, weight: 2.5 }
            },
            durationHint: 'acute'
        },
        mimics: ['sprain', 'dislocation'],
        severity: 'severe',
        prevalence: 'common',
        remedies: [
            {
                name: 'Immobilization',
                description: 'Keep the bone from moving',
                ingredients: ['Splint', 'Sling', 'Cushion'],
                method: 'Do not try to realign the bone. Use a splint or sling to keep it still.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Turmeric Milk (Haldi Doodh)',
                description: 'Promotes healing and reduces inflammation',
                ingredients: ['Turmeric', 'Warm milk'],
                method: 'Drink warm turmeric milk twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Hadjor (Cissus quadrangularis)',
                description: 'Traditional herb for bone healing',
                ingredients: ['Hadjor powder/capsules'],
                method: 'Consult an Ayurvedic practitioner for dosage.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: [
            'Do NOT try to push a protruding bone back',
            'Do NOT move the person if a spinal or neck fracture is suspected',
            'Keep movement to an absolute minimum'
        ],
        seekHelp: 'Fractures ALWAYS require emergency medical evaluation and X-rays.'
    }
}
