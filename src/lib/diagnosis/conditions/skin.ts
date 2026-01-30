import { Condition } from "../types";

export const skinConditions: Record<string, Condition> = {
    acne: {
        id: 'acne',
        name: 'Acne / Pimples',
        description: 'Inflammatory skin condition causing pimples, blackheads, and cysts',
        matchCriteria: {
            locations: ['face', 'back', 'chest', 'shoulders', 'skin'],
            types: ['red', 'swollen', 'painful', 'itchy'],
            triggers: ['hormones', 'diet', 'oily skin', 'stress', 'sweat'],
            specialSymptoms: ['pimples', 'blackheads', 'cysts', 'whiteheads', 'oily skin']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Salicylic Acid Cleanser',
                description: 'Unclogs pores',
                ingredients: ['OTC Face wash'],
                method: 'Wash face twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Benzoyl Peroxide',
                description: 'Kills bacteria',
                ingredients: ['Gel or cream'],
                method: 'Apply spot treatment to pimples.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Neem Paste',
                description: 'Powerful antibacterial',
                ingredients: ['Fresh neem leaves', 'Water'],
                method: 'Grind leaves to paste. Apply to acne specific spots. Leave 20 mins.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Multani Mitti (Fuller\'s Earth)',
                description: 'Absorbs excess oil',
                ingredients: ['Multani mitti', 'Rose water'],
                method: 'Make face pack. Apply for 15 mins until dry. Wash off.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Turmeric & Honey',
                description: 'Anti-inflammatory and antimicrobial',
                ingredients: ['Turmeric powder', 'Honey'],
                method: 'Mix to paste. Apply as spot treatment.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Do not pop pimples', 'Avoid touching face'],
        seekHelp: 'If cystic acne is severe, causing scarring, or affecting self-esteem'
    },
    eczema: {
        id: 'eczema',
        name: 'Eczema / Atopic Dermatitis',
        description: 'Chronic itchy, inflamed, and irritated skin',
        matchCriteria: {
            locations: ['arms', 'legs', 'hands', 'neck', 'skin'],
            types: ['itchy', 'dry', 'scaly', 'red', 'rough'],
            triggers: ['allergens', 'stress', 'dry weather', 'detergents'],
            specialSymptoms: ['intense itching', 'red patches', 'cracked skin', 'blisters'],
            symptomWeights: {
                "intense itching": { sensitivity: 0.9, specificity: 0.8, weight: 2.0 },
                "red patches": { sensitivity: 0.8 },
                "dry cracked skin": { sensitivity: 0.7 }
            }
        },
        prevalence: 'very_common',
        severity: 'moderate',
        remedies: [
            {
                name: 'Moisturize',
                description: 'Repair skin barrier',
                ingredients: ['Fragrance-free moisturizer'],
                method: 'Apply immediately after bathing and throughout the day.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Oatmeal Bath',
                description: 'Soothes itching',
                ingredients: ['Colloidal oatmeal'],
                method: 'Soak in lukewarm water with oatmeal.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Coconut Oil',
                description: 'Natural antibacterial moisturizer',
                ingredients: ['Virgin coconut oil'],
                method: 'Apply gently to affected areas.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Aloe Vera Gel',
                description: 'Cooling and soothing',
                ingredients: ['Fresh aloe vera gel'],
                method: 'Apply directly to rash.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Avoid scratching', 'Use mild soaps'],
        seekHelp: 'If signs of infection (pus, warmth) or widespread severe rash'
    },
    psoriasis: {
        id: 'psoriasis',
        name: 'Psoriasis',
        description: 'Autoimmune disease causing rapid skin cell buildup (scales)',
        matchCriteria: {
            locations: ['elbows', 'knees', 'scalp', 'lower back'],
            types: ['scaly', 'silvery', 'itchy', 'thick'],
            triggers: ['stress', 'infection', 'cold', 'injury'],
            specialSymptoms: ['silvery scales', 'plagues', 'thick red patches', 'dry cracked skin']
        },
        severity: 'moderate-severe',
        remedies: [
            {
                name: 'Coal Tar',
                description: 'Slows skin cell growth',
                ingredients: ['Coal tar shampoo/ointment'],
                method: 'Apply as directed.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Turmeric (Curcumin)',
                description: 'Anti-inflammatory',
                ingredients: ['Turmeric powder', 'Warm water'],
                method: 'Consume internally or apply paste (be careful of staining).',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Flaxseeds',
                description: 'Omega-3 fatty acids help skin',
                ingredients: ['Ground flaxseeds'],
                method: 'Add to diet.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Avoid skin injury', 'Reduce stress'],
        seekHelp: 'If joint pain develops (psoriatic arthritis) or rash worsens'
    },
    hives: {
        id: 'hives',
        name: 'Hives (Urticaria)',
        description: 'Sudden outbreak of swollen, pale red bumps or plaques',
        matchCriteria: {
            locations: ['skin', 'body', 'face'],
            types: ['itchy', 'swollen', 'raised', 'red'],
            triggers: ['food allergy', 'medication', 'insect bite', 'stress', 'heat'],
            specialSymptoms: ['welts', ' blanching (turns white when pressed)']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Antihistamine',
                description: 'Blocks histamine reaction',
                ingredients: ['OTC Antihistamine'],
                method: 'Take oral tablet.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Cool Compresses',
                description: 'Reduces swelling and itch',
                ingredients: ['Ice pack', 'Cloth'],
                method: 'Apply to itchy areas.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Baking Soda Bath',
                description: 'Relieves itching',
                ingredients: ['Baking soda', 'Warm water'],
                method: 'Add cup to bath water. Soak.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ginger Juice',
                description: 'Reduces inflammation',
                ingredients: ['Ginger'],
                method: 'Apply juice to hives gently.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Identify and avoid allergen'],
        seekHelp: 'If difficulty breathing, tongue/throat swelling (Anaphylaxis - Emergency!)'
    },
    fungal_infection: {
        id: 'fungal_infection',
        name: 'Fungal Infection / Ringworm',
        description: 'Fungal skin infection causing ring-shaped rash',
        matchCriteria: {
            locations: ['skin', 'feet', 'groin', 'body'],
            types: ['itchy', 'red', 'circular', 'scaly'],
            triggers: ['sweat', 'humidity', 'sharing towels'],
            specialSymptoms: ['ring shape', 'athletes foot', 'jock itch', 'peeling skin']
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Antifungal Cream',
                description: 'Kills fungus',
                ingredients: ['OTC Clotrimazole/Terbinafine'],
                method: 'Apply twice daily until 1 week after rash clears.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Garlic Paste',
                description: 'Strong antifungal',
                ingredients: ['Garlic cloves', 'Olive oil'],
                method: 'Crush garlic, mix with oil. Apply. (May sting).',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Apple Cider Vinegar',
                description: 'Acidic environment kills fungus',
                ingredients: ['ACV', 'Water'],
                method: 'Dilute 1:1. Apply with cotton ball.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Keep area dry', 'Wash clothes in hot water'],
        seekHelp: 'If spots spread or do not improve after 2 weeks'
    },



    shingles: {
        id: 'shingles',
        name: 'Shingles (Herpes Zoster)',
        description: 'Painful rash caused by reactivation of chickenpox virus.',
        matchCriteria: {
            locations: ['skin', 'chest', 'back', 'face'],
            types: ['burning', 'stabbing', 'tingling'],
            triggers: ['stress', 'weakened immunity', 'aging'],
            specialSymptoms: ['painful rash one side', 'blisters', 'burning pain', 'tingling before rash']
        },
        severity: 'moderate-severe',
        prevalence: 'common',
        redFlags: ['shingles near eye'],
        remedies: [
            {
                name: 'Cool Compress',
                description: 'Soothes blisters.',
                ingredients: ['Cool wet cloth'],
                method: 'Apply gently to rash.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Calamine Lotion',
                description: 'Reduces itching.',
                ingredients: ['Calamine lotion'],
                method: 'Apply to rash.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Neem Leaf Bath',
                description: 'Antiviral properties.',
                ingredients: ['Neem leaves', 'Water'],
                method: 'Boil leaves. Add to bath water.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Keep rash covered.', 'Avoid contact with those who havent had chickenpox.'],
        seekHelp: 'IMMEDIATELY if near eye. Antivirals work best if started early.'
    },

    fungal_nail: {
        id: 'fungal_nail',
        name: 'Fungal Nail Infection (Onychomycosis)',
        description: 'Fungal infection causing thickened, discolored nails.',
        matchCriteria: {
            locations: ['nail', 'toe', 'finger'],
            types: ['discolored', 'thick', 'crumbly'],
            triggers: ['damp environments', 'athletes foot', 'nail injury'],
            specialSymptoms: ['yellow nail', 'thick nail', 'crumbly nail', 'nail separation']
        },
        severity: 'mild',
        prevalence: 'common',
        remedies: [
            {
                name: 'Antifungal Cream',
                description: 'OTC treatment.',
                ingredients: ['Antifungal cream'],
                method: 'Apply daily around nail.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Tea Tree Oil',
                description: 'Natural antifungal.',
                ingredients: ['Tea tree oil'],
                method: 'Apply directly to nail twice daily.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Apple Cider Vinegar Soak',
                description: 'Acidic environment.',
                ingredients: ['ACV', 'Water'],
                method: 'Soak nail for 15 mins daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Keep feet dry.', 'Change socks daily.'],
        seekHelp: 'If pain or spreading. Oral medication may be needed.'
    },

    boils: {
        id: "boils",
        name: "Boils (Furuncles)",
        description: "Painful, pus-filled bumps under the skin caused by infected hair follicles.",
        matchCriteria: {
            locations: ["skin", "face", "neck", "armpit", "buttock"],
            types: ["painful", "red", "swollen", "pus-filled"],
            triggers: ["sweat", "friction", "shaving", "poor hygiene"],
            specialSymptoms: ["painful lump", "white tip", "redness around bump"]
        },
        severity: "moderate",
        remedies: [
            {
                name: "Warm Compress",
                description: "Draws pus to surface.",
                ingredients: ["Warm cloth"],
                method: "Apply for 10-15 mins, 3-4 times daily."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Turmeric Paste",
                description: "Antibacterial and anti-inflammatory.",
                ingredients: ["Turmeric powder", "Water"],
                method: "Apply paste to boil and cover with bandage."
            }
        ],
        exercises: [],
        warnings: ["DO NOT SQUEEZE or pop.", "Keep clean."],
        seekHelp: "If on face, spine, or accompanied by fever."
    },

    pruritus: {
        id: "pruritus",
        name: "Generalized Itching (Pruritus)",
        description: "Itching skin without obvious rash, often due to dryness or allergy.",
        matchCriteria: {
            locations: ["skin", "body", "legs", "arms"],
            types: ["itchy", "scratchy"],
            triggers: ["dry skin", "winter", "hot water", "soap"],
            specialSymptoms: ["itching all over", "dry flakes", "urge to scratch"]
        },
        severity: "mild",
        remedies: [
            {
                name: "Moisturize",
                description: "Hydrate skin.",
                ingredients: ["Hypoallergenic lotion"],
                method: "Apply immediately after shower."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Coconut Oil",
                description: "Deep hydration.",
                ingredients: ["Coconut oil"],
                method: "Massage all over body before or after bath."
            }
        ],
        exercises: [],
        warnings: ["Avoid hot showers.", "Use mild soap."],
        seekHelp: "If itching is severe and unexplained (could be liver/kidney issue)."
    }
};
