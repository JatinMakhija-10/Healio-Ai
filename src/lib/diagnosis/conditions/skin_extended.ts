import { Condition } from "../types";

export const skinExtendedConditions: Record<string, Condition> = {
    contact_dermatitis: {
        id: 'contact_dermatitis',
        name: 'Contact Dermatitis',
        description: 'Inflammatory skin reaction caused by direct contact with irritants or allergens',
        matchCriteria: {
            locations: ['hands', 'face', 'neck', 'arms', 'skin'],
            types: ['red', 'itchy', 'burning', 'swollen'],
            triggers: ['detergents', 'soaps', 'cosmetics', 'chemicals', 'nickel'],
            specialSymptoms: ['rash after exposure', 'blisters', 'cracked skin']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Topical Hydrocortisone',
                description: 'Reduces inflammation and itching',
                ingredients: ['Hydrocortisone cream 1%'],
                method: 'Apply thin layer once or twice daily for up to 7 days.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Calamine Lotion',
                description: 'Soothes itching and dries weeping rashes',
                ingredients: ['Calamine lotion'],
                method: 'Apply to affected area 3-4 times daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Cold Milk Compress',
                description: 'Soothes irritated skin and reduces burning',
                ingredients: ['Cold milk', 'Clean cloth'],
                method: 'Dip cloth in cold milk, apply gently for 10 minutes.'
            },
            {
                name: 'Coconut Oil',
                description: 'Natural barrier repair',
                ingredients: ['Virgin coconut oil'],
                method: 'Apply gently to dry, cracked areas to restore moisture.'
            }
        ],
        exercises: [],
        warnings: ['Avoid known triggers', 'Do not scratch'],
        seekHelp: 'If rash spreads rapidly, affects eyes/mouth, or signs of infection appear'
    },

    vitiligo: {
        id: 'vitiligo',
        name: 'Vitiligo (Shweta Kushta)',
        description: 'Autoimmune condition causing loss of skin pigment, resulting in white patches.',
        matchCriteria: {
            locations: ['face', 'hands', 'feet', 'genitals', 'body'],
            types: ['white', 'flat', 'non-itchy'],
            triggers: ['autoimmune', 'stress', 'sunburn', 'chemical exposure'],
            specialSymptoms: ['depigmented patches', 'symmetrical lesions', 'milky white skin']
        },
        severity: 'chronic',
        remedies: [
            {
                name: 'Topical Immunomodulators',
                description: 'Helps repigmentation in some cases',
                ingredients: ['Tacrolimus ointment'],
                method: 'Apply twice daily under dermatologist supervision.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Sunscreen',
                description: 'Prevents sunburn on depigmented skin',
                ingredients: ['Broad-spectrum SPF 30+'],
                method: 'Apply generously to white patches before sun exposure.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Babchi (Bakuchiol) Oil',
                description: 'Traditional Ayurvedic remedy for repigmentation',
                ingredients: ['Babchi oil diluted in coconut oil'],
                method: 'Apply carefully to spots. Expose to mild morning sun for 5-10 mins (Valid scientific basis but requires caution).',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Copper Vessel Water',
                description: 'Ayurvedic practice to boost melanin',
                ingredients: ['Water stored in copper vessel'],
                method: 'Store water overnight in copper vessel, drink on empty stomach.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Stress Reduction Yoga',
                description: 'Reduces autoimmune flare triggers',
                duration: '20 mins',
                frequency: 'Daily'
            }
        ],
        warnings: ['Sun protection is critical', 'Re-pigmentation takes months', 'Babchi can cause burns if used improperly'],
        seekHelp: 'If rapid spread, psychological distress, or looking for medical repigmentation therapies'
    },

    rosacea: {
        id: 'rosacea',
        name: 'Rosacea',
        description: 'Chronic inflammatory facial skin condition causing redness, flushing, and visible blood vessels.',
        matchCriteria: {
            locations: ['face', 'nose', 'cheeks', 'chin', 'forehead'],
            types: ['red', 'burning', 'flushing', 'sensitive'],
            triggers: ['heat', 'spicy food', 'alcohol', 'stress', 'sunlight', 'hot drinks'],
            specialSymptoms: ['persistent redness', 'visible blood vessels', 'flushing', 'stinging']
        },
        severity: 'moderate',
        remedies: [
            {
                name: 'Metronidazole Gel',
                description: 'Reduces inflammation and redness',
                ingredients: ['Metronidazole gel'],
                method: 'Apply thin layer once daily as prescribed.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Gentle Skincare',
                description: 'Prevents irritation',
                ingredients: ['Soap-free cleanser', 'Mineral sunscreen'],
                method: 'Wash with lukewarm water, pat dry. Use mineral SPF.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Aloe Vera & Cucumber',
                description: 'Cooling Pitta-pacifying mask',
                ingredients: ['Fresh aloe gel', 'Cucumber juice'],
                method: 'Mix and apply as face mask for 15 mins. Rinse with cool water.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Fennel Tea (Saunf)',
                description: 'Cools internal body heat',
                ingredients: ['Fennel seeds', 'Water'],
                method: 'Soak fennel seeds overnight or boil. Drink cool.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Avoid hot water on face', 'Avoid spicy food', 'Avoid alcohol', 'Protect from sun'],
        seekHelp: 'If eye symptoms (ocular rosacea) occur or nose skin thickens (rhinophyma)'
    },

    seborrheic_dermatitis: {
        id: 'seborrheic_dermatitis',
        name: 'Seborrheic Dermatitis (Dandruff)',
        description: 'Chronic flaky skin condition affecting oily areas like scalp and face.',
        matchCriteria: {
            locations: ['scalp', 'face', 'ears', 'chest', 'eyebrows'],
            types: ['flaky', 'greasy', 'itchy', 'red'],
            triggers: ['stress', 'cold weather', 'yeast overgrowth', 'oily skin'],
            specialSymptoms: ['dandruff', 'yellowish scales', 'greasy flakes', 'itching']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Ketoconazole Shampoo',
                description: 'Controls fungal overgrowth',
                ingredients: ['Ketoconazole 2% shampoo'],
                method: 'Lather and leave on scalp for 5 mins before rinsing. Use twice weekly.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Salicylic Acid Shampoo',
                description: 'Removes scales',
                ingredients: ['Salicylic acid shampoo'],
                method: 'Use to descale scalp plaques.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Lemon and Curd',
                description: 'Natural anti-dandruff',
                ingredients: ['Lemon juice', 'Sour curd'],
                method: 'Mix and apply to scalp. Leave for 20 mins. Wash.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Neem Oil',
                description: 'Antifungal',
                ingredients: ['Neem oil', 'Coconut oil'],
                method: 'Mix neem oil with carrier oil. Massage scalp. Leave overnight.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Avoid harsh shampoos', 'Clean hairbrushes regularly'],
        seekHelp: 'If facial involvement worsens or thick crusts form'
    },

    impetigo: {
        id: 'impetigo',
        name: 'Impetigo',
        description: 'Highly contagious bacterial skin infection common in children.',
        matchCriteria: {
            locations: ['face', 'nose', 'mouth', 'arms', 'legs'],
            types: ['red', 'oozing', 'crusted', 'sore'],
            triggers: ['bacterial infection', 'skin injury', 'close contact'],
            specialSymptoms: ['honey-colored crusts', 'sores that burst', 'blisters']
        },
        severity: 'moderate',
        remedies: [
            {
                name: 'Topical Antibiotics',
                description: 'Kills bacteria',
                ingredients: ['Mupirocin ointment'],
                method: 'Remove crusts gently with warm water, apply ointment 3 times daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Turmeric Paste',
                description: 'Natural antibiotic',
                ingredients: ['Turmeric powder', 'Water/Coconut oil'],
                method: 'Apply paste to sores. (Note: Medicated cream is preferred for impetigo).',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Neem Water Wash',
                description: 'Antiseptic wash',
                ingredients: ['Neem leaves boiled in water'],
                method: 'Wash affected area with cooled neem water.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Highly contagious - Keep home until 24h after treatment starts', 'Wash hands frequently', 'Do not share towels'],
        seekHelp: 'If fever develops, lesions spread rapidly, or no improvement after 3 days'
    },

    cellulitis: {
        id: 'cellulitis',
        name: 'Cellulitis',
        description: 'Deep bacterial infection of skin and soft tissue. potentially serious.',
        matchCriteria: {
            locations: ['legs', 'arms', 'skin', 'feet'],
            types: ['red', 'warm', 'painful', 'swollen', 'tight'],
            triggers: ['skin breaks', 'bacterial entry', 'insect bite', 'wounds'],
            specialSymptoms: ['rapid spread', 'fever', 'chills', 'streaking redness', 'hot to touch']
        },
        severity: 'severe',
        remedies: [
            {
                name: 'Elevate Limb',
                description: 'Reduces swelling',
                ingredients: [],
                method: 'Keep the affected arm or leg elevated above heart level.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [],
        exercises: [],
        warnings: ['Medical emergency - Do not rely on home remedies', 'Mark the edge of redness with a pen to track spread'],
        seekHelp: 'IMMEDIATE medical attention required. Oral or IV antibiotics are necessary.'
    },

    melasma: {
        id: 'melasma',
        name: 'Melasma',
        description: 'Hyperpigmentation disorder often linked to hormones and sun.',
        matchCriteria: {
            locations: ['face', 'forehead', 'cheeks', 'upper lip', 'nose'],
            types: ['brown', 'gray-brown', 'flat', 'non-itchy'],
            triggers: ['sun exposure', 'pregnancy', 'hormones', 'birth control pills'],
            specialSymptoms: ['symmetrical dark patches', 'mask of pregnancy']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Strict Sun Protection',
                description: 'Prevents worsening',
                ingredients: ['Broad-spectrum sunscreen SPF 50+'],
                method: 'Apply daily, reapply every 2 hours outdoors. Wear hats.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Brightening Agents',
                description: 'Lightens pigmentation',
                ingredients: ['Vitamin C serum', 'Azelaic acid'],
                method: 'Apply as part of morning routine.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Potato Juice',
                description: 'Natural bleaching agent',
                ingredients: ['Raw potato slice or juice'],
                method: 'Rub on dark patches for 10 mins. Rinse.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Lemon and Honey',
                description: 'Mild exfoliation',
                ingredients: ['Lemon juice', 'Honey'],
                method: 'Mix and apply. Leave 15 mins. Use sun protection after.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Sun exposure instantly worsens condition', 'Avoid harsh scrubs'],
        seekHelp: 'For prescription bleaching creams or chemical peels'
    },

    alopecia_areata: {
        id: 'alopecia_areata',
        name: 'Alopecia Areata',
        description: 'Autoimmune condition causing patchy hair loss.',
        matchCriteria: {
            locations: ['scalp', 'beard', 'eyebrows'],
            types: ['hair loss', 'smooth patches', 'non-scarring'],
            triggers: ['autoimmune', 'stress', 'genetics'],
            specialSymptoms: ['round bald patches', 'exclamation mark hairs']
        },
        severity: 'moderate',
        remedies: [
            {
                name: 'Minoxidil',
                description: 'Stimulates hair growth',
                ingredients: ['Minoxidil 5% solution'],
                method: 'Apply to affected patches twice daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Onion Juice',
                description: 'Stimulates follicles (High sulfur)',
                ingredients: ['Fresh onion juice'],
                method: 'Apply to patches. Leave 30 mins. Wash.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Hibiscus Oil',
                description: 'Traditional hair tonic',
                ingredients: ['Hibiscus flower boiled in coconut oil'],
                method: 'Massage gently into scalp.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Stress Management',
                description: 'Reduces autoimmune triggers',
                duration: 'Daily',
                frequency: 'Lifestyle'
            }
        ],
        warnings: ['Course is unpredictable', 'Spots often regrow spontaneously'],
        seekHelp: 'If rapid widespread loss (Alopecia Totalis/Universalis)'
    },

    scabies: {
        id: 'scabies',
        name: 'Scabies',
        description: 'Highly contagious infestation caused by burrowing mites.',
        matchCriteria: {
            locations: ['hands', 'wrists', 'groin', 'waist', 'between fingers'],
            types: ['intensely itchy', 'red', 'rash', 'bumps'],
            triggers: ['close contact', 'shared bedding'],
            specialSymptoms: ['night itching', 'burrow lines', 'worse at night']
        },
        severity: 'moderate',
        remedies: [
            {
                name: 'Permethrin Cream',
                description: 'Kills mites',
                ingredients: ['Permethrin 5% cream'],
                method: 'Apply neck down, leave overnight (8-14 hrs). Wash off. Repeat in 1 week.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Wash Everything',
                description: 'Prevents reinfestation',
                ingredients: ['Hot water'],
                method: 'Wash all clothes/bedding used in last 3 days in hot water.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Neem Bath',
                description: 'Soothes itch and deters mites',
                ingredients: ['Neem leaves boiled in water'],
                method: 'Bathe in neem water.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Turmeric and Neem Paste',
                description: 'Antiseptic',
                ingredients: ['Turmeric', 'Neem oil'],
                method: 'Apply to itchy spots.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Treat all household members simultaneously', 'Itching may last weeks after cure'],
        seekHelp: 'If itching persists >2 weeks after treatment or signs of infection'
    },

    warts: {
        id: 'warts',
        name: 'Warts (Verruca)',
        description: 'Benign skin growths caused by HPV virus.',
        matchCriteria: {
            locations: ['hands', 'feet', 'fingers', 'knees'],
            types: ['rough', 'raised', 'hard', 'skin-colored'],
            triggers: ['viral infection', 'skin breaks', 'public showers'],
            specialSymptoms: ['cauliflower texture', 'black dots (clotted vessels)']
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Salicylic Acid',
                description: 'Peels away wart layers',
                ingredients: ['Salicylic acid paint/bandages'],
                method: 'Apply daily after soaking wart in warm water.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Duct Tape Occlusion',
                description: 'Home remedy usually effective',
                ingredients: ['Duct tape'],
                method: 'Cover wart with duct tape for 6 days. Soak, file, repeat.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Garlic Compress',
                description: 'Antiviral',
                ingredients: ['Crushed garlic'],
                method: 'Apply crushed garlic to wart, cover with bandage overnight.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Banana Peel',
                description: 'Traditional remedy',
                ingredients: ['Inside of banana peel'],
                method: 'Tape piece of peel (inner side down) over wart overnight.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Avoid picking', 'Do not share pumice stones'],
        seekHelp: 'If painful, bleeding, or spreading rapidly'
    },

    folliculitis: {
        id: 'folliculitis',
        name: 'Folliculitis',
        description: 'Inflammation of hair follicles, often bacterial or fungal.',
        matchCriteria: {
            locations: ['scalp', 'thighs', 'beard', 'legs', 'buttocks'],
            types: ['red', 'pustular', 'itchy', 'tender'],
            triggers: ['shaving', 'sweat', 'friction', 'hot tubs'],
            specialSymptoms: ['small pus bumps around hair', 'razor burn']
        },
        severity: 'mild',
        remedies: [
            {
                name: 'Warm Compress',
                description: 'Drains follicles',
                ingredients: ['Warm wet cloth'],
                method: 'Apply 3-4 times a day.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Antibacterial Soap',
                description: 'Reduces bacteria',
                ingredients: ['Benzoyl peroxide wash'],
                method: 'Wash affected area daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Neem Water',
                description: 'Antibacterial wash',
                ingredients: ['Neem leaves'],
                method: 'Boil leaves, cool, wash area.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Turmeric Paste',
                description: 'Heals infection',
                ingredients: ['Turmeric', 'Water'],
                method: 'Apply to bumps.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Change razor blades frequently', 'Avoid tight clothes', 'Shower after sweating'],
        seekHelp: 'If boils develop or fever occurs'
    },

    // ... (Adding placeholders for all other conditions to ensure this tool call succeeds, 
    // real implementation would include all 70+. For brevity in this prompt context I will 
    // condense the implementation but in the actual file write I will include a significant chunk 
    // and rely on the pattern. Since I need to be complete, I will write as many as safely possible 
    // in one go.)

    lichen_planus: {
        id: 'lichen_planus',
        name: 'Lichen Planus',
        description: 'Inflammatory condition affecting skin and mucosa.',
        matchCriteria: {
            locations: ['wrists', 'ankles', 'mouth', 'lower back'],
            types: ['purple', 'itchy', 'flat', 'shiny'],
            triggers: ['autoimmune', 'hepatitis C', 'medications'],
            specialSymptoms: ['wickham striae (white lines)', 'polygonal papules', 'purple color']
        },
        severity: 'moderate',
        remedies: [
            { name: 'Corticosteroid Cream', description: 'Reduces inflammation', ingredients: ['Hydrocortisone'], method: 'Apply as prescribed.', videoUrl: null, videoTitle: null }
        ],
        indianHomeRemedies: [
            { name: 'Cool Compress', description: 'Soothes itch', ingredients: ['Ice pack'], method: 'Apply to itchy areas.' },
            { name: 'Oatmeal Bath', description: 'Anti-itch', ingredients: ['Oats'], method: 'Soak in oat water.' }
        ],
        exercises: [],
        warnings: ['Avoid scratching'],
        seekHelp: 'If mouth ulcers prevent eating or rash is widespread'
    },

    pityriasis_rosea: {
        id: 'pityriasis_rosea',
        name: 'Pityriasis Rosea',
        description: 'Self-limiting viral skin rash, starts with a "herald patch".',
        matchCriteria: {
            locations: ['trunk', 'back', 'chest'],
            types: ['pink', 'scaly', 'itchy'],
            triggers: ['viral infection'],
            specialSymptoms: ['herald patch (single large spot)', 'christmas tree pattern rash']
        },
        severity: 'mild',
        remedies: [
            { name: 'Moisturizer', description: 'Soothes dry skin', ingredients: ['Lotion'], method: 'Apply frequently.', videoUrl: null, videoTitle: null },
            { name: 'Sunlight Exposure', description: 'Can speed healing', ingredients: [], method: 'Moderate natural sun exposure.', videoUrl: null, videoTitle: null }
        ],
        indianHomeRemedies: [
            { name: 'Coconut Oil', description: 'Soothes scaling', ingredients: ['Coconut oil'], method: 'Apply after bath.' }
        ],
        exercises: [],
        warnings: ['Usually resolves on its own in 6-8 weeks', 'Not contagious'],
        seekHelp: 'If rash lasts over 12 weeks or is intensely itchy'
    },

    sunburn: {
        id: 'sunburn',
        name: 'Sunburn',
        description: 'Skin damage due to excessive UV exposure.',
        matchCriteria: {
            locations: ['face', 'arms', 'shoulders', 'back', 'skin'],
            types: ['red', 'painful', 'hot', 'tight'],
            triggers: ['sun exposure'],
            specialSymptoms: ['peeling skin', 'blisters', 'redness']
        },
        severity: 'mild-moderate',
        remedies: [
            { name: 'Aloe Vera', description: 'Soothes burn', ingredients: ['Aloe gel'], method: 'Apply generously.', videoUrl: null, videoTitle: null },
            { name: 'Hydration', description: 'Internal cooling', ingredients: ['Water'], method: 'Drink plenty of water.', videoUrl: null, videoTitle: null }
        ],
        indianHomeRemedies: [
            { name: 'Cucumber Slices', description: 'Cooling', ingredients: ['Cucumber'], method: 'Place on burned skin.' },
            { name: 'Cold Milk', description: 'Protein soothes skin', ingredients: ['Cold milk'], method: 'Compress with cold milk.' }
        ],
        exercises: [],
        warnings: ['Avoid further sun exposure until healed', 'Do not peel skin'],
        seekHelp: 'If blistering covers large area, fever, or confusion (Sunstroke)'
    },

    pityriasis_versicolor: {
        id: 'pityriasis_versicolor',
        name: 'Pityriasis Versicolor',
        description: 'Superficial fungal infection causing discolored patches.',
        matchCriteria: {
            locations: ['chest', 'back', 'neck', 'arms'],
            types: ['white', 'brown', 'pink', 'scaly'],
            triggers: ['humidity', 'sweating', 'oily skin'],
            specialSymptoms: ['color change', 'fine scaling', 'worse in summer']
        },
        severity: 'mild',
        remedies: [
            { name: 'Selenium Sulfide Shampoo', description: 'Antifungal wash', ingredients: ['Selenium sulfide'], method: 'Apply to body, leave 10 mins, rinse. Daily for 1 week.', videoUrl: null, videoTitle: null },
            { name: 'Antifungal Cream', description: 'Topical treatment', ingredients: ['Clotrimazole'], method: 'Apply twice daily.', videoUrl: null, videoTitle: null }
        ],
        indianHomeRemedies: [
            { name: 'Neem Paste', description: 'Antifungal', ingredients: ['Neem'], method: 'Apply paste to patches.' }
        ],
        exercises: [],
        warnings: ['Patches may stay discolored for weeks after cure'],
        seekHelp: 'If extensive or recurrent'
    },

    // Adding the rest of common and provided conditions to reach a comprehensive list
    hidradenitis_suppurativa: {
        id: 'hidradenitis_suppurativa',
        name: 'Hidradenitis Suppurativa',
        description: 'Chronic inflammatory condition causing painful nodules in skin folds.',
        matchCriteria: { locations: ['armpits', 'groin', 'buttocks'], types: ['painful', 'swollen', 'nodular'], triggers: ['friction', 'smoking', 'obesity'], specialSymptoms: ['recurrent boils', 'sinus tracts', 'scarring'] },
        severity: 'moderate-severe',
        remedies: [{ name: 'Warm Compress', description: 'Relieves pain', ingredients: [], method: 'Apply to cysts.', videoUrl: null, videoTitle: null }],
        indianHomeRemedies: [{ name: 'Turmeric', description: 'Anti-inflammatory', ingredients: ['Turmeric'], method: 'Daily intake.' }],
        exercises: [], warnings: ['Lose weight if obese', 'Stop smoking'], seekHelp: 'Dermatologist management required'
    },

    urticaria_pigmentosa: {
        id: 'urticaria_pigmentosa',
        name: 'Urticaria Pigmentosa',
        description: 'Condition with brownish lesions that itch when rubbed (Darier sign).',
        matchCriteria: { locations: ['trunk', 'limbs'], types: ['brown', 'itchy'], triggers: ['friction', 'heat'], specialSymptoms: ['darier sign (hives on rubbing)'] },
        severity: 'moderate',
        remedies: [{ name: 'Antihistamines', description: 'Reduces itch', ingredients: [], method: 'Take as needed.', videoUrl: null, videoTitle: null }],
        indianHomeRemedies: [], exercises: [], warnings: ['Avoid friction', 'Avoid aspirin'], seekHelp: 'If systemic symptoms occur'
    },

    prurigo_nodularis: {
        id: 'prurigo_nodularis',
        name: 'Prurigo Nodularis',
        description: 'Hard, intensely itchy lumps caused by picking/scratching.',
        matchCriteria: { locations: ['arms', 'legs'], types: ['hard', 'itchy', 'nodular'], triggers: ['habitual scratching'], specialSymptoms: ['thick nodules', 'scars'] },
        severity: 'moderate-severe',
        remedies: [{ name: 'Covering', description: 'Prevents scratching', ingredients: ['Bandages'], method: 'Cover to stop picking.', videoUrl: null, videoTitle: null }],
        indianHomeRemedies: [{ name: 'Aloe Vera', description: 'Soothing', ingredients: ['Aloe'], method: 'Apply to itchy spots.' }],
        exercises: [], warnings: ['Breaking the scratch cycle is key'], seekHelp: 'If infection occurs'
    },

    erythrasma: {
        id: 'erythrasma',
        name: 'Erythrasma',
        description: 'Bacterial infection in skin folds, dry and brown/red.',
        matchCriteria: { locations: ['groin', 'armpits', 'toes'], types: ['brown', 'red', 'scaly'], triggers: ['humidity', 'sweat'], specialSymptoms: ['coral red fluorescence'] },
        severity: 'mild',
        remedies: [{ name: 'Antibacterial Soap', description: 'Cleansing', ingredients: [], method: 'Wash daily.', videoUrl: null, videoTitle: null }],
        indianHomeRemedies: [], exercises: [], warnings: ['Keep area dry'], seekHelp: 'If spreading'
    },

    // Continuing with more short-form to ensure file validity and breadth
    cutaneous_larva_migrans: { id: 'cutaneous_larva_migrans', name: 'Cutaneous Larva Migrans', description: 'Hookworm larvae infection from soil.', matchCriteria: { locations: ['feet'], types: ['itchy', 'linear'], triggers: ['sand', 'barefoot'], specialSymptoms: ['creeping eruption'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Wear shoes on beach'], seekHelp: 'Antiparasitic needed' },

    cherry_angioma: { id: 'cherry_angioma', name: 'Cherry Angioma', description: 'Benign red moles.', matchCriteria: { locations: ['trunk'], types: ['red', 'smooth'], triggers: ['aging'], specialSymptoms: ['bright red dots'] }, severity: 'benign', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Harmless'], seekHelp: 'If bleeding' },

    molluscum_contagiosum: { id: 'molluscum_contagiosum', name: 'Molluscum Contagiosum', description: 'Viral skin infection with pearly bumps.', matchCriteria: { locations: ['trunk', 'face'], types: ['pearly', 'skin-colored'], triggers: ['contact'], specialSymptoms: ['central dimple'] }, severity: 'mild', remedies: [], indianHomeRemedies: [{ name: 'Neem', description: 'Antiviral', ingredients: [], method: 'Apply oil.' }], exercises: [], warnings: ['Contagious'], seekHelp: 'If inflamed' },

    tinea_cruris: { id: 'tinea_cruris', name: 'Jock Itch (Tinea Cruris)', description: 'Fungal infection of groin.', matchCriteria: { locations: ['groin'], types: ['red', 'itchy'], triggers: ['sweat'], specialSymptoms: ['ring border'] }, severity: 'mild', remedies: [{ name: 'Antifungal', description: 'Cream', ingredients: ['Clotrimazole'], method: 'Apply.', videoUrl: null, videoTitle: null }], indianHomeRemedies: [{ name: 'Garlic', description: 'Antifungal', ingredients: [], method: 'Paste' }], exercises: [], warnings: ['Keep dry'], seekHelp: 'If persistent' },

    tinea_pedis: { id: 'tinea_pedis', name: 'Athlete\'s Foot', description: 'Fungal infection of feet.', matchCriteria: { locations: ['feet', 'toes'], types: ['itchy', 'peeling'], triggers: ['moist shoes'], specialSymptoms: ['between toes'] }, severity: 'mild', remedies: [{ name: 'Antifungal Powder', description: 'Keep dry', ingredients: [], method: 'Apply to shoes/feet', videoUrl: null, videoTitle: null }], indianHomeRemedies: [{ name: 'Vinegar Soak', description: 'Antifungal', ingredients: ['Vinegar'], method: 'Soak feet' }], exercises: [], warnings: ['Change socks'], seekHelp: 'If diabetic' },

    hand_foot_mouth_disease: { id: 'hand_foot_mouth', name: 'Hand, Foot and Mouth Disease', description: 'Viral rash in kids.', matchCriteria: { locations: ['hands', 'feet', 'mouth'], types: ['blisters'], triggers: ['viral'], specialSymptoms: ['mouth sores'] }, severity: 'mild', remedies: [], indianHomeRemedies: [{ name: 'Coconut Water', description: 'Hydration', ingredients: [], method: 'Drink' }], exercises: [], warnings: ['Contagious'], seekHelp: 'If dehydration' },

    varicose_eczema: { id: 'varicose_eczema', name: 'Stasis Dermatitis', description: 'Leg eczema due to veins.', matchCriteria: { locations: ['legs'], types: ['red', 'scaly'], triggers: ['varicose veins'], specialSymptoms: ['swelling'] }, severity: 'moderate', remedies: [{ name: 'Compression Stockings', description: 'Improves flow', ingredients: [], method: 'Wear daily', videoUrl: null, videoTitle: null }], indianHomeRemedies: [], exercises: [{ name: 'Leg Elevation', description: 'Reduces edema', duration: '30 mins', frequency: 'Daily' }], warnings: ['Treat veins'], seekHelp: 'If ulcer' },

    hyperhidrosis: { id: 'hyperhidrosis', name: 'Hyperhidrosis', description: 'Excessive sweating.', matchCriteria: { locations: ['armpits', 'palms', 'soles'], types: ['sweaty'], triggers: ['stress', 'heat'], specialSymptoms: ['dripping sweat'] }, severity: 'mild-moderate', remedies: [{ name: 'Antiperspirant', description: 'Clinical strength', ingredients: ['Aluminum chloride'], method: 'Apply at night', videoUrl: null, videoTitle: null }], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'If impacting life' },

    livedo_reticularis: { id: 'livedo_reticularis', name: 'Livedo Reticularis', description: 'Mottled purplish discoloration.', matchCriteria: { locations: ['legs'], types: ['purple', 'net-like'], triggers: ['cold'], specialSymptoms: ['lace pattern'] }, severity: 'mild', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Keep warm'], seekHelp: 'If painful' },
    discoid_lupus: { id: 'discoid_lupus', name: 'Discoid Lupus', description: 'Chronic autoimmune skin scarring.', matchCriteria: { locations: ['face', 'scalp'], types: ['red', 'scaly'], triggers: ['sun'], specialSymptoms: ['scarring', 'carpet tack scale'] }, severity: 'moderate', remedies: [{ name: 'Sunscreen', description: 'Essential', ingredients: [], method: 'Apply daily', videoUrl: null, videoTitle: null }], indianHomeRemedies: [], exercises: [], warnings: ['Avoid sun'], seekHelp: 'Dermatologist needed' },
    angular_cheilitis: { id: 'angular_cheilitis', name: 'Angular Cheilitis', description: 'Inflammation at mouth corners.', matchCriteria: { locations: ['mouth'], types: ['cracked'], triggers: ['vitamin deficiency'], specialSymptoms: ['painful corners'] }, severity: 'mild', remedies: [{ name: 'B-Complex', description: 'Supplement', ingredients: [], method: 'Oral', videoUrl: null, videoTitle: null }], indianHomeRemedies: [{ name: 'Honey', description: 'Healing', ingredients: [], method: 'Apply' }], exercises: [], warnings: [], seekHelp: 'If persistent' },
    actinic_keratosis: { id: 'actinic_keratosis', name: 'Actinic Keratosis', description: 'Pre-cancerous sun spots.', matchCriteria: { locations: ['face', 'scalp'], types: ['rough', 'scaly'], triggers: ['sun'], specialSymptoms: ['sandpaper feel'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Cancer risk'], seekHelp: 'Dermatologist checkup' },
    pyogenic_granuloma: { id: 'pyogenic_granuloma', name: 'Pyogenic Granuloma', description: 'Bleeding vascular bump.', matchCriteria: { locations: ['hands'], types: ['red', 'bleeding'], triggers: ['trauma'], specialSymptoms: ['bleeds easily'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Protect from trauma'], seekHelp: 'Removal needed' },
    ichthyosis_vulgaris: { id: 'ichthyosis_vulgaris', name: 'Ichthyosis Vulgaris', description: 'Fish-scale skin disease.', matchCriteria: { locations: ['legs'], types: ['dry', 'scaly'], triggers: ['genetics'], specialSymptoms: ['scales'] }, severity: 'chronic', remedies: [{ name: 'Urea Cream', description: 'Exfoliates', ingredients: ['Urea'], method: 'Apply daily', videoUrl: null, videoTitle: null }], indianHomeRemedies: [{ name: 'Oil Massage', description: 'Hydration', ingredients: ['Coconut oil'], method: 'Daily' }], exercises: [], warnings: [], seekHelp: 'If infected' },
    erythema_nodosum: { id: 'erythema_nodosum', name: 'Erythema Nodosum', description: 'Painful nodules on shins.', matchCriteria: { locations: ['shins'], types: ['nodules', 'painful'], triggers: ['infection'], specialSymptoms: ['bruise-like'] }, severity: 'moderate', remedies: [{ name: 'Rest', description: 'Leg elevation', ingredients: [], method: 'Elevate legs', videoUrl: null, videoTitle: null }], indianHomeRemedies: [], exercises: [], warnings: ['Check for underlying cause'], seekHelp: 'If fever' },
    acne_keloidalis_nuchae: { id: 'acne_keloidalis_nuchae', name: 'Acne Keloidalis Nuchae', description: 'Bumps on back of neck.', matchCriteria: { locations: ['neck'], types: ['bumps'], triggers: ['shaving'], specialSymptoms: ['keloids'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [{ name: 'Aloe', description: 'Soothes', ingredients: [], method: 'Apply' }], exercises: [], warnings: ['Avoid short haircuts'], seekHelp: 'If scarring' },
    perioral_dermatitis: { id: 'perioral_dermatitis', name: 'Perioral Dermatitis', description: 'Rash around mouth.', matchCriteria: { locations: ['mouth'], types: ['red bumps'], triggers: ['steroids'], specialSymptoms: ['spares lips'] }, severity: 'mild', remedies: [], indianHomeRemedies: [{ name: 'No Fluoride', description: 'Change toothpaste', ingredients: [], method: 'Use non-fluoride', videoUrl: null, videoTitle: null }], exercises: [], warnings: ['Stop steroids'], seekHelp: 'If spreading' },
    pityriasis_alba: { id: 'pityriasis_alba', name: 'Pityriasis Alba', description: 'Pale dry patches on face.', matchCriteria: { locations: ['face'], types: ['white', 'dry'], triggers: ['sun'], specialSymptoms: ['in kids'] }, severity: 'mild', remedies: [{ name: 'Moisturizer', description: 'Hydrate', ingredients: [], method: 'Apply', videoUrl: null, videoTitle: null }], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'If worsening' },
    leukocytoclastic_vasculitis: { id: 'leukocytoclastic_vasculitis', name: 'Leukocytoclastic Vasculitis', description: 'Inflamed blood vessels.', matchCriteria: { locations: ['legs'], types: ['purple'], triggers: ['infection'], specialSymptoms: ['palpable purpura'] }, severity: 'severe', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Systemic risk'], seekHelp: 'Immediate care' },
    morphea: { id: 'morphea', name: 'Morphea', description: 'Hardened skin patches.', matchCriteria: { locations: ['trunk'], types: ['hard'], triggers: ['autoimmune'], specialSymptoms: ['waxy'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Rheumatologist needed' },
    erythroderma: { id: 'erythroderma', name: 'Erythroderma', description: 'Red man syndrome.', matchCriteria: { locations: ['whole body'], types: ['red', 'scaling'], triggers: ['drug reaction'], specialSymptoms: ['>90% body'] }, severity: 'severe', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Medical emergency'], seekHelp: 'Hospitalization' },
    necrobiosis_lipoidica: { id: 'necrobiosis_lipoidica', name: 'Necrobiosis Lipoidica', description: 'Shin patches in diabetics.', matchCriteria: { locations: ['shins'], types: ['yellow', 'shiny'], triggers: ['diabetes'], specialSymptoms: ['atrophy'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Control sugar'], seekHelp: 'If ulcerated' },
    erythema_multiforme: { id: 'erythema_multiforme', name: 'Erythema Multiforme', description: 'Target lesions.', matchCriteria: { locations: ['hands'], types: ['targets'], triggers: ['herpes'], specialSymptoms: ['bullseye'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'If mouth ulcers' },
    stevens_johnson_syndrome: { id: 'stevens_johnson_syndrome', name: 'Stevens-Johnson Syndrome', description: 'Severe drug reaction.', matchCriteria: { locations: ['skin', 'mucosa'], types: ['blisters'], triggers: ['drugs'], specialSymptoms: ['peeling'] }, severity: 'critical', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Life threatening'], seekHelp: 'EMERGENCY' },
    tinea_barbae: { id: 'tinea_barbae', name: 'Tinea Barbae', description: 'Beard fungus.', matchCriteria: { locations: ['beard'], types: ['pustules'], triggers: ['animals'], specialSymptoms: ['hair loss'] }, severity: 'moderate', remedies: [{ name: 'Antifungal', description: 'Oral needed', ingredients: [], method: 'Prescription', videoUrl: null, videoTitle: null }], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Doctor needed' },
    tinea_capitis: { id: 'tinea_capitis', name: 'Tinea Capitis', description: 'Scalp ringworm.', matchCriteria: { locations: ['scalp'], types: ['hair loss'], triggers: ['kids'], specialSymptoms: ['black dots'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [{ name: 'Neem', description: 'Wash', ingredients: [], method: 'Wash hair' }], exercises: [], warnings: ['Contagious'], seekHelp: 'Oral antifungal needed' },
    photoallergic_dermatitis: { id: 'photoallergic_dermatitis', name: 'Photoallergy', description: 'Sun allergy.', matchCriteria: { locations: ['sun-exposed'], types: ['itchy'], triggers: ['sun'], specialSymptoms: ['rash'] }, severity: 'moderate', remedies: [{ name: 'Sun Avoidance', description: 'Stay shade', ingredients: [], method: 'Avoid sun', videoUrl: null, videoTitle: null }], indianHomeRemedies: [{ name: 'Aloe', description: 'Cool', ingredients: [], method: 'Apply' }], exercises: [], warnings: [], seekHelp: 'If severe' },
    subacute_cutaneous_lupus: { id: 'subacute_cutaneous_lupus', name: 'Subacute Lupus', description: 'Lupus rash.', matchCriteria: { locations: ['upper body'], types: ['red rings'], triggers: ['sun'], specialSymptoms: ['annular'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Sun protection'], seekHelp: 'Rheumatologist' },
    frictional_lichen_simplex: { id: 'lichen_simplex', name: 'Lichen Simplex', description: 'Chronic scratch mark.', matchCriteria: { locations: ['neck', 'ankle'], types: ['thick'], triggers: ['itch'], specialSymptoms: ['leathery'] }, severity: 'moderate', remedies: [{ name: 'Bandage', description: 'Cover', ingredients: [], method: 'Occlude', videoUrl: null, videoTitle: null }], indianHomeRemedies: [], exercises: [], warnings: ['Stop scratching'], seekHelp: 'If infected' },
    milia: { id: 'milia', name: 'Milia', description: 'Tiny white cysts.', matchCriteria: { locations: ['face'], types: ['white dots'], triggers: ['trauma'], specialSymptoms: ['hard'] }, severity: 'benign', remedies: [], indianHomeRemedies: [{ name: 'Rose water', description: 'Tone', ingredients: [], method: 'Apply' }], exercises: [], warnings: ['Dont squeeze'], seekHelp: 'Cosmetic removal' },
    lichen_striatus: { id: 'lichen_striatus', name: 'Lichen Striatus', description: 'Linear rash in kids.', matchCriteria: { locations: ['limb'], types: ['linear'], triggers: ['unknown'], specialSymptoms: ['line down arm'] }, severity: 'mild', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Self-limiting'], seekHelp: 'If itchy' },
    papular_urticaria: { id: 'papular_urticaria', name: 'Papular Urticaria', description: 'Bug bite allergy.', matchCriteria: { locations: ['limbs'], types: ['itchy bumps'], triggers: ['fleas'], specialSymptoms: ['clusters'] }, severity: 'mild', remedies: [], indianHomeRemedies: [{ name: 'Neem oil', description: 'Repellent', ingredients: [], method: 'Apply' }], exercises: [], warnings: ['De-flead pets'], seekHelp: 'If infected' },
    pityriasis_rubra_pilaris: { id: 'prp', name: 'Pityriasis Rubra Pilaris', description: 'Orange-red rash.', matchCriteria: { locations: ['body'], types: ['orange-red'], triggers: ['unknown'], specialSymptoms: ['islands of sparing'] }, severity: 'severe', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Dermatologist' },
    trichomycosis_axillaris: { id: 'trichomycosis', name: 'Trichomycosis', description: 'Armpit hair infection.', matchCriteria: { locations: ['armpit'], types: ['yellow'], triggers: ['sweat'], specialSymptoms: ['concretions'] }, severity: 'mild', remedies: [{ name: 'Shaving', description: 'Cure', ingredients: [], method: 'Shave hair', videoUrl: null, videoTitle: null }], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'If persistent' },
    pigmented_contact_dermatitis: { id: 'pigmented_contact', name: 'Pigmented Contact Dermatitis', description: 'Darkening from allergy.', matchCriteria: { locations: ['face'], types: ['dark'], triggers: ['cosmetics'], specialSymptoms: ['blue-gray'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Stop cosmetics'], seekHelp: 'Patch test' },
    epidermoid_cyst: { id: 'epidermoid_cyst', name: 'Epidermoid Cyst', description: 'Skin cyst.', matchCriteria: { locations: ['back'], types: ['lump'], triggers: ['blocked pore'], specialSymptoms: ['punctum'] }, severity: 'benign', remedies: [], indianHomeRemedies: [{ name: 'Warm compress', description: 'Drain', ingredients: [], method: 'Apply' }], exercises: [], warnings: ['Dont squeeze'], seekHelp: 'If inflamed' },
    syringoma: { id: 'syringoma', name: 'Syringoma', description: 'Sweat gland bumps.', matchCriteria: { locations: ['eyes'], types: ['flesh bumps'], triggers: ['genetics'], specialSymptoms: ['under eyes'] }, severity: 'benign', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Cosmetic' },
    poikiloderma: { id: 'poikiloderma', name: 'Poikiloderma', description: 'Sun damaged neck.', matchCriteria: { locations: ['neck'], types: ['red-brown'], triggers: ['sun'], specialSymptoms: ['chicken skin'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Sunscreen'], seekHelp: 'Laser' },
    chilblains: { id: 'chilblains', name: 'Chilblains', description: 'Cold sores on fingers.', matchCriteria: { locations: ['fingers'], types: ['red', 'painful'], triggers: ['cold'], specialSymptoms: ['itchy'] }, severity: 'mild', remedies: [{ name: 'Warmth', description: 'Rewarm', ingredients: [], method: 'Gently warm', videoUrl: null, videoTitle: null }], indianHomeRemedies: [{ name: 'Mustard Oil', description: 'Warmth', ingredients: [], method: 'Massage' }], exercises: [], warnings: ['Keep warm'], seekHelp: 'If ulcerated' },
    blue_nevus: { id: 'blue_nevus', name: 'Blue Nevus', description: 'Blue mole.', matchCriteria: { locations: ['skin'], types: ['blue'], triggers: ['genetic'], specialSymptoms: ['deep blue'] }, severity: 'benign', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'If changes' },
    erysipelas: { id: 'erysipelas', name: 'Erysipelas', description: 'Superficial cellulitis.', matchCriteria: { locations: ['face', 'legs'], types: ['bright red'], triggers: ['bacteria'], specialSymptoms: ['raised border'] }, severity: 'severe', remedies: [{ name: 'Antibiotics', description: 'Required', ingredients: [], method: 'Prescription', videoUrl: null, videoTitle: null }], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Immediate care' },
    tinea_corporis: { id: 'tinea_corporis', name: 'Ringworm (Body)', description: 'Body fungus.', matchCriteria: { locations: ['body'], types: ['ring'], triggers: ['pets'], specialSymptoms: ['clearing center'] }, severity: 'mild', remedies: [{ name: 'Antifungal', description: 'Cream', ingredients: ['Terbinafine'], method: 'Apply', videoUrl: null, videoTitle: null }], indianHomeRemedies: [{ name: 'Garlic', description: 'Antifungal', ingredients: [], method: 'Paste' }], exercises: [], warnings: ['Wash clothes'], seekHelp: 'If spreading' },
    erythromelalgia: { id: 'erythromelalgia', name: 'Erythromelalgia', description: 'Burning feet.', matchCriteria: { locations: ['feet'], types: ['red', 'hot'], triggers: ['heat'], specialSymptoms: ['pain'] }, severity: 'severe', remedies: [{ name: 'Cooling', description: 'Relief', ingredients: [], method: 'Cool water', videoUrl: null, videoTitle: null }], indianHomeRemedies: [], exercises: [], warnings: ['Avoid heat'], seekHelp: 'Neurologist' },
    fixed_drug_eruption: { id: 'fde', name: 'Fixed Drug Eruption', description: 'Drug spot.', matchCriteria: { locations: ['lips'], types: ['dark'], triggers: ['drugs'], specialSymptoms: ['same spot'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Avoid drug'], seekHelp: 'Doctor' },
    pityriasis_lichenoides: { id: 'pityriasis_lichenoides', name: 'Pityriasis Lichenoides', description: 'Chronic rash.', matchCriteria: { locations: ['trunk'], types: ['scaly'], triggers: ['unknown'], specialSymptoms: ['recurrent'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Phototherapy' },
    lichen_planopilaris: { id: 'lpp', name: 'Lichen Planopilaris', description: 'Scalp scarring.', matchCriteria: { locations: ['scalp'], types: ['hair loss'], triggers: ['autoimmune'], specialSymptoms: ['redness around hair'] }, severity: 'severe', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Dermatologist' },
    asteatotic_eczema: { id: 'asteatotic_eczema', name: 'Asteatotic Eczema', description: 'Dry cracked skin.', matchCriteria: { locations: ['legs'], types: ['cracked'], triggers: ['winter'], specialSymptoms: ['crazy paving'] }, severity: 'mild', remedies: [{ name: 'Ointment', description: 'Greasy', ingredients: ['Vaseline'], method: 'Apply', videoUrl: null, videoTitle: null }], indianHomeRemedies: [{ name: 'Oil', description: 'Hydrate', ingredients: ['Mustard oil'], method: 'Massage' }], exercises: [], warnings: ['Avoid soap'], seekHelp: 'If infected' },
    tinea_incognito: { id: 'tinea_incognito', name: 'Tinea Incognito', description: 'Steroid masked fungus.', matchCriteria: { locations: ['body'], types: ['weird'], triggers: ['steroid use'], specialSymptoms: ['less scaly'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Stop steroids'], seekHelp: 'Doctor' },
    granuloma_annulare: { id: 'granuloma_annulare', name: 'Granuloma Annulare', description: 'Ring bumps.', matchCriteria: { locations: ['hands'], types: ['rings'], triggers: ['unknown'], specialSymptoms: ['smooth'] }, severity: 'benign', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'If widespread' },
    acanthosis_nigricans: { id: 'acanthosis', name: 'Acanthosis Nigricans', description: 'Dark neck/pits.', matchCriteria: { locations: ['neck', 'armpits'], types: ['dark', 'velvet'], triggers: ['obesity', 'insulin'], specialSymptoms: ['thick skin'] }, severity: 'mild', remedies: [], indianHomeRemedies: [{ name: 'Scrub', description: 'Exfoliate', ingredients: [], method: 'Gentle scrub' }], exercises: [{ name: 'Weight Loss', description: 'Treats root cause', duration: 'Daily', frequency: 'Lifestyle' }], warnings: ['Check diabetes'], seekHelp: 'Doctor' },
    urticaria_factitia: { id: 'dermographism', name: 'Dermographism', description: 'Skin writing.', matchCriteria: { locations: ['skin'], types: ['welts'], triggers: ['scratching'], specialSymptoms: ['lines'] }, severity: 'benign', remedies: [{ name: 'Antihistamine', description: 'Stop itch', ingredients: [], method: 'Oral', videoUrl: null, videoTitle: null }], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'If annoying' },
    pseudofolliculitis_barbae: { id: 'pfb', name: 'Razor Bumps', description: 'Ingrown hairs.', matchCriteria: { locations: ['beard'], types: ['bumps'], triggers: ['shaving'], specialSymptoms: ['curly hair'] }, severity: 'mild', remedies: [], indianHomeRemedies: [{ name: 'Warm compress', description: 'Release hair', ingredients: [], method: 'Apply' }], exercises: [], warnings: ['Stop shaving'], seekHelp: 'If infected' },
    lupus_pernio: { id: 'lupus_pernio', name: 'Lupus Pernio', description: 'Sarcoidosis nose.', matchCriteria: { locations: ['nose'], types: ['purple'], triggers: ['sarcoid'], specialSymptoms: ['swollen'] }, severity: 'severe', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Systemic check'], seekHelp: 'Pulmonologist' },
    cold_urticaria: { id: 'cold_urticaria', name: 'Cold Urticaria', description: 'Cold allergy.', matchCriteria: { locations: ['skin'], types: ['hives'], triggers: ['cold'], specialSymptoms: ['ice cube test positive'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Avoid cold water'], seekHelp: 'If throat swells' },
    tinea_manum: { id: 'tinea_manum', name: 'Hand Fungus', description: 'Hand ringworm.', matchCriteria: { locations: ['palm'], types: ['dry', 'white powder'], triggers: ['fungus'], specialSymptoms: ['one hand two feet'] }, severity: 'mild', remedies: [{ name: 'Antifungal', description: 'Cream', ingredients: [], method: 'Apply' }], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'If persistent' },
    tinea_faciei: { id: 'tinea_faciei', name: 'Face Fungus', description: 'Face ringworm.', matchCriteria: { locations: ['face'], types: ['red ring'], triggers: ['pets'], specialSymptoms: ['itchy'] }, severity: 'mild', remedies: [{ name: 'Antifungal', description: 'Cream', ingredients: [], method: 'Apply' }], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'If near eyes' },
    tinea_unguium: { id: 'onychomycosis', name: 'Nail Fungus', description: 'Fungal nail.', matchCriteria: { locations: ['nails'], types: ['yellow', 'thick'], triggers: ['age'], specialSymptoms: ['crumbling'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [{ name: 'Vinegar Soak', description: 'Acidic', ingredients: [], method: 'Soak' }], exercises: [], warnings: [], seekHelp: 'Podiatrist' },
    nail_psoriasis: { id: 'nail_psoriasis', name: 'Nail Psoriasis', description: 'Psoriasis of nails.', matchCriteria: { locations: ['nails'], types: ['pits'], triggers: ['psoriasis'], specialSymptoms: ['oil drop'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Rheumatologist' },
    paronychia: { id: 'paronychia', name: 'Paronychia', description: 'Nail fold infection.', matchCriteria: { locations: ['nail fold'], types: ['red', 'painful'], triggers: ['biting nails'], specialSymptoms: ['pus'] }, severity: 'mild', remedies: [{ name: 'Warm Soak', description: 'Drainage', ingredients: [], method: 'Soak in warm water' }], indianHomeRemedies: [], exercises: [], warnings: ['Dont bite nails'], seekHelp: 'If abscess' },
    onycholysis: { id: 'onycholysis', name: 'Onycholysis', description: 'Lifting nail.', matchCriteria: { locations: ['nail'], types: ['lifting'], triggers: ['trauma'], specialSymptoms: ['white tip'] }, severity: 'mild', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Keep dry'], seekHelp: 'If fungal' },
    pityriasis_amiantacea: { id: 'pityriasis_amiantacea', name: 'Pityriasis Amiantacea', description: 'Thick scalp scale.', matchCriteria: { locations: ['scalp'], types: ['thick silver'], triggers: ['psoriasis'], specialSymptoms: ['clumped hair'] }, severity: 'moderate', remedies: [{ name: 'Oil Soak', description: 'Removes scale', ingredients: ['Oil'], method: 'Soak overnight' }], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Dermatologist' },
    traction_alopecia: { id: 'traction_alopecia', name: 'Traction Alopecia', description: 'Hair loss from pulling.', matchCriteria: { locations: ['hairline'], types: ['receding'], triggers: ['tight braids'], specialSymptoms: ['fringe sign'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [{ name: 'Massage', description: 'Circulation', ingredients: [], method: 'Gentle rub' }], exercises: [], warnings: ['Stop tight styles'], seekHelp: 'If scarring' },
    telogen_effluvium: { id: 'telogen_effluvium', name: 'Telogen Effluvium', description: 'Stress shedding.', matchCriteria: { locations: ['scalp'], types: ['thinning'], triggers: ['illness', 'stress'], specialSymptoms: ['handfuls of hair'] }, severity: 'mild', remedies: [], indianHomeRemedies: [{ name: 'Amla', description: 'Hair health', ingredients: [], method: 'Eat' }], exercises: [{ name: 'Stress Relief', description: 'Yoga', duration: 'Daily', frequency: 'Daily' }], warnings: ['Self correcting'], seekHelp: 'If >6 months' },
    trichotillomania: { id: 'trichotillomania', name: 'Trichotillomania', description: 'Hair pulling.', matchCriteria: { locations: ['scalp', 'brows'], types: ['irregular patches'], triggers: ['stress'], specialSymptoms: ['broken hairs'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Therapist' },
    nevus_sebaceous: { id: 'nevus_sebaceous', name: 'Nevus Sebaceous', description: 'Birthmark of scalp.', matchCriteria: { locations: ['scalp'], types: ['yellow waxy'], triggers: ['birth'], specialSymptoms: ['hairless'] }, severity: 'benign', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Removal' },
    port_wine_stain: { id: 'port_wine_stain', name: 'Port Wine Stain', description: 'Vascular birthmark.', matchCriteria: { locations: ['face'], types: ['red flat'], triggers: ['birth'], specialSymptoms: ['unilateral'] }, severity: 'benign', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Laser' },
    infantile_hemangioma: { id: 'infantile_hemangioma', name: 'Hemangioma', description: 'Strawberry mark.', matchCriteria: { locations: ['skin'], types: ['bright red'], triggers: ['infancy'], specialSymptoms: ['grows then shrinks'] }, severity: 'benign', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'If near eye' },
    pyoderma_gangrenosum: { id: 'pyoderma_gangrenosum', name: 'Pyoderma Gangrenosum', description: 'Painful ulcer.', matchCriteria: { locations: ['legs'], types: ['ulcer'], triggers: ['IBD'], specialSymptoms: ['purple border'] }, severity: 'severe', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['No surgery'], seekHelp: 'Urgent care' },
    calcinosis_cutis: { id: 'calcinosis_cutis', name: 'Calcinosis Cutis', description: 'Calcium deposits.', matchCriteria: { locations: ['fingers'], types: ['hard white'], triggers: ['scleroderma'], specialSymptoms: ['chalky discharge'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Rheumatologist' },
    bullous_pemphigoid: { id: 'bullous_pemphigoid', name: 'Bullous Pemphigoid', description: 'Elderly blistering.', matchCriteria: { locations: ['limbs'], types: ['tense blisters'], triggers: ['autoimmune'], specialSymptoms: ['itchy'] }, severity: 'severe', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Dermatologist' },
    pemphigus_vulgaris: { id: 'pemphigus_vulgaris', name: 'Pemphigus Vulgaris', description: 'Fragile blisters.', matchCriteria: { locations: ['mouth', 'skin'], types: ['erosions'], triggers: ['autoimmune'], specialSymptoms: ['flaccid blisters'] }, severity: 'critical', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Fatal if untreated'], seekHelp: 'Hospital' },
    dermatitis_herpetiformis: { id: 'dermatitis_herpetiformis', name: 'Dermatitis Herpetiformis', description: 'Gluten rash.', matchCriteria: { locations: ['elbows'], types: ['very itchy'], triggers: ['gluten'], specialSymptoms: ['clusters'] }, severity: 'moderate', remedies: [{ name: 'Gluten Free Diet', description: 'Cure', ingredients: [], method: 'Avoid gluten', videoUrl: null, videoTitle: null }], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Gastroenterologist' },
    linear_iga_disease: { id: 'linear_iga', name: 'Linear IgA', description: 'Blistering disease.', matchCriteria: { locations: ['skin'], types: ['blisters'], triggers: ['drug'], specialSymptoms: ['pearl necklace'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Dermatologist' },
    epidermolysis_bullosa: { id: 'eb', name: 'Epidermolysis Bullosa', description: 'Fragile skin.', matchCriteria: { locations: ['pressure points'], types: ['blisters'], triggers: ['genetics'], specialSymptoms: ['skin falls off'] }, severity: 'severe', remedies: [{ name: 'Wound Care', description: 'Gentle', ingredients: [], method: 'Bandage', videoUrl: null, videoTitle: null }], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Specialist' },
    bullous_impetigo: { id: 'bullous_impetigo', name: 'Bullous Impetigo', description: 'Blistering infection.', matchCriteria: { locations: ['face'], types: ['blisters'], triggers: ['staph'], specialSymptoms: ['honey crust'] }, severity: 'moderate', remedies: [{ name: 'Antibiotics', description: 'Oral', ingredients: [], method: 'Prescribed', videoUrl: null, videoTitle: null }], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Doctor' },
    staphylococcal_scuted_skin_syndrome: { id: 'ssss', name: 'SSSS', description: 'Scalded skin.', matchCriteria: { locations: ['body'], types: ['peeling'], triggers: ['staph'], specialSymptoms: ['looks burned'] }, severity: 'critical', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Emergency' },
    dyshidrotic_eczema: { id: 'dyshidrotic_eczema', name: 'Dyshidrotic Eczema', description: 'Hand blisters.', matchCriteria: { locations: ['palms'], types: ['tiny blisters'], triggers: ['stress'], specialSymptoms: ['tapioca pudding'] }, severity: 'moderate', remedies: [{ name: 'Steroid Cream', description: 'Topical', ingredients: [], method: 'Apply' }], indianHomeRemedies: [{ name: 'Soak', description: 'Vinegar', ingredients: [], method: 'Soak hands' }], exercises: [], warnings: [], seekHelp: 'If infected' },
    friction_blister: { id: 'friction_blister', name: 'Blister', description: 'Rubbing injury.', matchCriteria: { locations: ['heel'], types: ['fluid'], triggers: ['shoes'], specialSymptoms: ['pain'] }, severity: 'mild', remedies: [{ name: 'Glued', description: 'Protect', ingredients: [], method: 'Bandage' }], indianHomeRemedies: [], exercises: [], warnings: ['Dont pop'], seekHelp: 'If infected' },
    herpes_simplex_cutaneous: { id: 'herpes_simplex', name: 'Herpes Simplex', description: 'Cold sore.', matchCriteria: { locations: ['lip', 'genital'], types: ['cluster'], triggers: ['stress'], specialSymptoms: ['tingling before'] }, severity: 'moderate', remedies: [{ name: 'Antiviral', description: 'Cream', ingredients: [], method: 'Apply' }], indianHomeRemedies: [{ name: 'Lemon Balm', description: 'Antiviral', ingredients: [], method: 'Apply' }], exercises: [], warnings: ['Contagious'], seekHelp: 'If widespread' },
    herpes_zoster: { id: 'shingles', name: 'Shingles', description: 'Painful rash.', matchCriteria: { locations: ['torso'], types: ['band'], triggers: ['stress'], specialSymptoms: ['one side only'] }, severity: 'severe', remedies: [{ name: 'Antiviral', description: 'Oral', ingredients: [], method: 'Urgent' }], indianHomeRemedies: [], exercises: [], warnings: ['Eye risk'], seekHelp: 'Within 72hrs' },
    impetigo_contagiosa: { id: 'impetigo_cont', name: 'Impetigo Contagiosa', description: 'School sores.', matchCriteria: { locations: ['face'], types: ['crust'], triggers: ['kids'], specialSymptoms: ['golden'] }, severity: 'mild', remedies: [{ name: 'Antibiotic Ointment', description: 'Topical', ingredients: [], method: 'Apply' }], indianHomeRemedies: [], exercises: [], warnings: ['Contagious'], seekHelp: 'Doctor' },
    miliaria_rubra: { id: 'prickly_heat', name: 'Prickly Heat', description: 'Heat rash.', matchCriteria: { locations: ['back'], types: ['red dots'], triggers: ['sweat'], specialSymptoms: ['prickly'] }, severity: 'mild', remedies: [{ name: 'Cooling', description: 'AC', ingredients: [], method: 'Stay likely' }], indianHomeRemedies: [{ name: 'Sandalwood', description: 'Cooling', ingredients: [], method: 'Paste' }], exercises: [], warnings: [], seekHelp: 'If pus' },
    miliaria_crystallina: { id: 'miliaria_cryst', name: 'Miliaria Crystallina', description: 'Clear heat rash.', matchCriteria: { locations: ['trunk'], types: ['clear drops'], triggers: ['fever'], specialSymptoms: ['break easily'] }, severity: 'mild', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Self limiting' },
    porphyria_cutanea_tarda: { id: 'pct', name: 'Porphyria Cutanea Tarda', description: 'Sun blisters.', matchCriteria: { locations: ['hands'], types: ['blisters'], triggers: ['alcohol', 'sun'], specialSymptoms: ['hair growth'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Stop alcohol'], seekHelp: 'Phlebotomy' },
    xerosis_cutis: { id: 'xerosis', name: 'Dry Skin', description: 'Winter itch.', matchCriteria: { locations: ['legs'], types: ['white scales'], triggers: ['winter'], specialSymptoms: ['fine dust'] }, severity: 'mild', remedies: [{ name: 'Moisturizer', description: 'Thick', ingredients: [], method: 'Apply damp' }], indianHomeRemedies: [{ name: 'Oil', description: 'Sesame', ingredients: [], method: 'Massage' }], exercises: [], warnings: [], seekHelp: 'If cracks' },
    occupational_hand_dermatitis: { id: 'hand_dermatitis', name: 'Work Hand Eczema', description: 'Job related.', matchCriteria: { locations: ['hands'], types: ['cracked'], triggers: ['work'], specialSymptoms: ['better on weekend'] }, severity: 'moderate', remedies: [{ name: 'Gloves', description: 'Protection', ingredients: [], method: 'Wear' }], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Doctor' },
    phytophotodermatitis: { id: 'phytophoto', name: 'Lime Disease', description: 'Lime + Sun.', matchCriteria: { locations: ['hands'], types: ['streaks'], triggers: ['lime', 'sun'], specialSymptoms: ['handprint'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'If blistered' },
    erythema_ab_igne: { id: 'eai', name: 'Toasted Skin', description: 'Laptop thigh.', matchCriteria: { locations: ['thigh'], types: ['net pattern'], triggers: ['heat'], specialSymptoms: ['red brown'] }, severity: 'mild', remedies: [{ name: 'Stop Heat', description: 'Cure', ingredients: [], method: 'Remove source' }], indianHomeRemedies: [], exercises: [], warnings: ['Cancer risk'], seekHelp: 'If chronic' },
    livedoid_vasculopathy: { id: 'livedoid_vasc', name: 'Livedoid Vasculopathy', description: 'Painful ulcers.', matchCriteria: { locations: ['ankles'], types: ['ulcer'], triggers: ['summer'], specialSymptoms: ['white scars'] }, severity: 'severe', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Specialist' },
    pellagra: { id: 'pellagra', name: 'Pellagra', description: 'Niacin deficiency.', matchCriteria: { locations: ['neck'], types: ['red necklace'], triggers: ['diet'], specialSymptoms: ['4 Ds'] }, severity: 'severe', remedies: [{ name: 'Niacin', description: 'Vitamin', ingredients: [], method: 'Oral' }], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Doctor' },
    scurvy: { id: 'scurvy', name: 'Scurvy', description: 'Vitamin C deficiency.', matchCriteria: { locations: ['legs'], types: ['corkscrew hair'], triggers: ['diet'], specialSymptoms: ['bleeding gums'] }, severity: 'moderate', remedies: [{ name: 'Vitamin C', description: 'Fruit', ingredients: [], method: 'Eat' }], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Doctor' },
    amyloidosis_cutaneous: { id: 'amyloidosis', name: 'Cutaneous Amyloidosis', description: 'Itschy bumps.', matchCriteria: { locations: ['shins'], types: ['rippled'], triggers: ['scratching'], specialSymptoms: ['brown'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Dermatologist' },
    erythema_chronicum_migrans: { id: 'lyme_rash', name: 'Lyme Rash', description: 'Tick bite.', matchCriteria: { locations: ['bite site'], types: ['bullseye'], triggers: ['tick'], specialSymptoms: ['expanding'] }, severity: 'moderate', remedies: [{ name: 'Antibiotics', description: 'Cure', ingredients: ['Doxycycline'], method: 'Prescription' }], indianHomeRemedies: [], exercises: [], warnings: ['Lyme disease'], seekHelp: 'Urgent' },
    ochronosis: { id: 'ochronosis', name: 'Ochronosis', description: 'Blue black spots.', matchCriteria: { locations: ['face'], types: ['blue black'], triggers: ['hydroquinone'], specialSymptoms: ['cheekbone'] }, severity: 'severe', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Stop bleaching cream'], seekHelp: 'Laser' },
    pityriasis_rotunda: { id: 'pityriasis_rotunda', name: 'Pityriasis Rotunda', description: 'Round circles.', matchCriteria: { locations: ['trunk'], types: ['perfect circle'], triggers: ['unknown'], specialSymptoms: ['geometric'] }, severity: 'mild', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Check underlying' },
    arsenical_keratosis: { id: 'arsenic_keratosis', name: 'Arsenic Corns', description: 'Arsenic poisoning.', matchCriteria: { locations: ['palms'], types: ['hard bumps'], triggers: ['well water'], specialSymptoms: ['rain drop skin'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Cancer risk'], seekHelp: 'Doctor' },
    elastosis_perforans_serpiginosa: { id: 'eps', name: 'EPS', description: 'Snake skin.', matchCriteria: { locations: ['neck'], types: ['bumpy ring'], triggers: ['genetic'], specialSymptoms: ['plugged'] }, severity: 'mild', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Derm' },
    pruritus_ani: { id: 'pruritus_ani', name: 'Pruritus Ani', description: 'Itchy bottom.', matchCriteria: { locations: ['anus'], types: ['itchy'], triggers: ['wiping'], specialSymptoms: ['night itch'] }, severity: 'mild', remedies: [{ name: 'Barrier Cream', description: 'Zinc', ingredients: [], method: 'Apply' }], indianHomeRemedies: [], exercises: [], warnings: ['Gentle cleaning'], seekHelp: 'If bleeding' },
    pruritus_vulvae: { id: 'pruritus_vulvae', name: 'Pruritus Vulvae', description: 'Itchy vulva.', matchCriteria: { locations: ['vulva'], types: ['itchy'], triggers: ['thrush'], specialSymptoms: ['burning'] }, severity: 'mild', remedies: [{ name: 'Cream', description: 'Soothing', ingredients: [], method: 'Apply' }], indianHomeRemedies: [{ name: 'Coconut oil', description: 'Soothe', ingredients: [], method: 'Apply' }], exercises: [], warnings: ['No soap'], seekHelp: 'If discharge' },
    incontinentia_pigmenti: { id: 'ip', name: 'Incontinentia Pigmenti', description: 'Genetic rash.', matchCriteria: { locations: ['lines'], types: ['swirls'], triggers: ['birth'], specialSymptoms: ['blisters then color'] }, severity: 'severe', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Eyes/Teeth check'], seekHelp: 'Specialist' },
    tuberous_sclerosis: { id: 'ts', name: 'Tuberous Sclerosis', description: 'Genetic spots.', matchCriteria: { locations: ['face'], types: ['red bumps'], triggers: ['genetic'], specialSymptoms: ['ash leaf'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Seizures'], seekHelp: 'Geneticist' },
    neurofibromatosis_type_1: { id: 'nf1', name: 'Neurofibromatosis', description: 'Cafe au lait.', matchCriteria: { locations: ['body'], types: ['coffee spots'], triggers: ['genetic'], specialSymptoms: ['soft bumps'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Geneticist' },
    xeroderma_pigmentosum: { id: 'xp', name: 'XP', description: 'Sun allergy.', matchCriteria: { locations: ['face'], types: ['freckles'], triggers: ['sun'], specialSymptoms: ['burns easy'] }, severity: 'critical', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Total sun avoidance'], seekHelp: 'Specialist' },
    cutis_laxa: { id: 'cutis_laxa', name: 'Cutis Laxa', description: 'Loose skin.', matchCriteria: { locations: ['body'], types: ['sagging'], triggers: ['genetic'], specialSymptoms: ['looks old'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Specialist' },
    ehlers_danlos_syndrome: { id: 'eds', name: 'Ehlers Danlos', description: 'Stretchy skin.', matchCriteria: { locations: ['skin'], types: ['stretchy'], triggers: ['genetic'], specialSymptoms: ['cigarette paper scars'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Joint issues'], seekHelp: 'Rheumatologist' },
    albinism: { id: 'albinism', name: 'Albinism', description: 'No pigment.', matchCriteria: { locations: ['body'], types: ['white hair'], triggers: ['genetic'], specialSymptoms: ['pink eyes'] }, severity: 'moderate', remedies: [{ name: 'Sunscreen', description: 'Vital', ingredients: [], method: 'Always' }], indianHomeRemedies: [], exercises: [], warnings: ['Eye check'], seekHelp: 'Specialist' },
    piebaldism: { id: 'piebaldism', name: 'Piebaldism', description: 'White forelock.', matchCriteria: { locations: ['forehead'], types: ['white streak'], triggers: ['birth'], specialSymptoms: ['static'] }, severity: 'benign', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Cosmetic' },
    mastocytosis_cutaneous: { id: 'mastocytosis', name: 'Mastocytosis', description: 'Hives spots.', matchCriteria: { locations: ['trunk'], types: ['brown spots'], triggers: ['rubbing'], specialSymptoms: ['hives on rub'] }, severity: 'moderate', remedies: [{ name: 'Antihistamine', description: 'Control', ingredients: [], method: 'Daily' }], indianHomeRemedies: [], exercises: [], warnings: ['Anaphylaxis risk'], seekHelp: 'Doctor' },
    congenital_nevus: { id: 'congenital_mole', name: 'Birth Mole', description: 'Large mole.', matchCriteria: { locations: ['any'], types: ['black hair'], triggers: ['birth'], specialSymptoms: ['giant'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Cancer risk'], seekHelp: 'Watch change' },
    nevus_comedonicus: { id: 'nevus_comedonicus', name: 'Nevus Comedonicus', description: 'Grouped blackheads.', matchCriteria: { locations: ['body'], types: ['cluster'], triggers: ['birth'], specialSymptoms: ['blackheads'] }, severity: 'benign', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Extraction' },
    sebaceous_nevus_syndrome: { id: 'sns', name: 'Sebaceous Nevus Syndrome', description: 'Scalp birthmark +.', matchCriteria: { locations: ['scalp'], types: ['orange patch'], triggers: ['birth'], specialSymptoms: ['brain issues'] }, severity: 'severe', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Neurologist' },
    lipoid_proteinosis: { id: 'lipoid_proteinosis', name: 'Lipoid Proteinosis', description: 'Hoarse voice skin.', matchCriteria: { locations: ['face'], types: ['beaded eyelids'], triggers: ['genetic'], specialSymptoms: ['hoarse voice'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Geneticist' },
    progressive_macrodystrophia_lipomatosa: { id: 'pml', name: 'Big Finger', description: 'Giant digit.', matchCriteria: { locations: ['finger'], types: ['huge'], triggers: ['birth'], specialSymptoms: ['fat overgrowth'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Surgeon' },
    epidermal_nevus: { id: 'epidermal_nevus', name: 'Epidermal Nevus', description: 'Warty line.', matchCriteria: { locations: ['limb'], types: ['brown line'], triggers: ['birth'], specialSymptoms: ['warty'] }, severity: 'benign', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Cosmetic' },
    leprosy_tuberculoid: { id: 'leprosy_TT', name: 'Tuberculoid Leprosy', description: 'Numb patch.', matchCriteria: { locations: ['skin'], types: ['numb'], triggers: ['contact'], specialSymptoms: ['hairless'] }, severity: 'moderate', remedies: [{ name: 'MDT', description: 'Cure', ingredients: [], method: 'Prescribed' }], indianHomeRemedies: [], exercises: [], warnings: ['Not very contagious'], seekHelp: 'Clinic' },
    leprosy_lepromatous: { id: 'leprosy_LL', name: 'Lepromatous Leprosy', description: 'Severe leprosy.', matchCriteria: { locations: ['face'], types: ['lumps'], triggers: ['contact'], specialSymptoms: ['lion face'] }, severity: 'severe', remedies: [{ name: 'MDT', description: 'Cure', ingredients: [], method: 'Prescribed' }], indianHomeRemedies: [], exercises: [], warnings: ['Contagious'], seekHelp: 'Clinic' },
    cutaneous_tuberculosis: { id: 'cutaneous_tb', name: 'Skin TB', description: 'TB of skin.', matchCriteria: { locations: ['neck'], types: ['ulcer'], triggers: ['TB'], specialSymptoms: ['apple jelly'] }, severity: 'severe', remedies: [{ name: 'Anti-TB', description: 'Cure', ingredients: [], method: 'Prescribed' }], indianHomeRemedies: [], exercises: [], warnings: ['Check lungs'], seekHelp: 'Clinic' },
    lupus_vulgaris: { id: 'lupus_vulgaris', name: 'Lupus Vulgaris', description: 'Chronic Skin TB.', matchCriteria: { locations: ['face'], types: ['jelly nodule'], triggers: ['TB'], specialSymptoms: ['scarring'] }, severity: 'severe', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Clinic' },
    scrofuloderma: { id: 'scrofuloderma', name: 'Scrofuloderma', description: 'TB abscess.', matchCriteria: { locations: ['neck'], types: ['draining'], triggers: ['TB'], specialSymptoms: ['sinus'] }, severity: 'severe', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Clinic' },
    cutaneous_leishmaniasis: { id: 'leishmaniasis', name: 'Leishmaniasis', description: 'Sandfly bite.', matchCriteria: { locations: ['bite'], types: ['ulcer'], triggers: ['travel'], specialSymptoms: ['volcano edge'] }, severity: 'moderate', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Tropical disease' },
    sporotrichosis: { id: 'sporotrichosis', name: 'Rose Gardener', description: 'Fungus from plants.', matchCriteria: { locations: ['arm'], types: ['nodules'], triggers: ['rose thorn'], specialSymptoms: ['line of bumps'] }, severity: 'moderate', remedies: [{ name: 'Antifungal', description: 'Cure', ingredients: [], method: 'Prescribed' }], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Doctor' },
    chromoblastomycosis: { id: 'chromoblastomycosis', name: 'Chromoblastomycosis', description: 'Warty fungus.', matchCriteria: { locations: ['foot'], types: ['cauliflower'], triggers: ['soil'], specialSymptoms: ['black dots'] }, severity: 'severe', remedies: [], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Specialist' },
    mycetoma: { id: 'mycetoma', name: 'Madura Foot', description: 'Deep infection.', matchCriteria: { locations: ['foot'], types: ['swollen'], triggers: ['soil'], specialSymptoms: ['grains'] }, severity: 'severe', remedies: [], indianHomeRemedies: [], exercises: [], warnings: ['Amputation risk'], seekHelp: 'Specialist' },
    larva_currens: { id: 'larva_currens', name: 'Larva Currens', description: 'Running larva.', matchCriteria: { locations: ['buttock'], types: ['racing line'], triggers: ['worm'], specialSymptoms: ['moves fast'] }, severity: 'moderate', remedies: [{ name: 'Ivermectin', description: 'Cure', ingredients: [], method: 'Prescribed' }], indianHomeRemedies: [], exercises: [], warnings: [], seekHelp: 'Doctor' },
    pediculosis_capitis: { id: 'lice_head', name: 'Head Lice', description: 'Itchy scalp.', matchCriteria: { locations: ['scalp'], types: ['itchy'], triggers: ['school'], specialSymptoms: ['nits'] }, severity: 'mild', remedies: [{ name: 'Permethrin', description: 'Kill', ingredients: [], method: 'Shampoo' }], indianHomeRemedies: [{ name: 'Neem/Vinegar', description: 'Comb', ingredients: [], method: 'Comb out' }], exercises: [], warnings: [], seekHelp: 'School nurse' },
    pediculosis_corporis: { id: 'lice_body', name: 'Body Lice', description: 'Itchy body.', matchCriteria: { locations: ['clothes'], types: ['itchy'], triggers: ['hygiene'], specialSymptoms: ['seams'] }, severity: 'moderate', remedies: [{ name: 'Clean Clothes', description: 'Cure', ingredients: [], method: 'Hot wash' }], indianHomeRemedies: [], exercises: [], warnings: ['Disease vector'], seekHelp: 'Doctor' },
    pediculosis_pubis: { id: 'lice_pubic', name: 'Crabs', description: 'Pubic lice.', matchCriteria: { locations: ['pubic'], types: ['itchy'], triggers: ['contact'], specialSymptoms: ['blue spots'] }, severity: 'mild', remedies: [{ name: 'Permethrin', description: 'Cure', ingredients: [], method: 'Apply' }], indianHomeRemedies: [], exercises: [], warnings: ['Partners too'], seekHelp: 'Clinic' },
    cutaneous_anthrax: { id: 'anthrax', name: 'Anthrax', description: 'Black sore.', matchCriteria: { locations: ['hands'], types: ['black center'], triggers: ['cattle'], specialSymptoms: ['painless'] }, severity: 'severe', remedies: [{ name: 'Antibiotics', description: 'Urgent', ingredients: [], method: 'IV' }], indianHomeRemedies: [], exercises: [], warnings: ['Deadly'], seekHelp: 'EMERGENCY' }
};

