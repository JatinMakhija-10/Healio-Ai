import { Condition } from "../types";

export const musculoskeletalConditions: Record<string, Condition> = {
    muscle_strain: {
        id: 'muscle_strain',
        name: 'Muscle Strain',
        description: 'Overuse or injury to muscle fibers causing pain and stiffness',
        matchCriteria: {
            locations: ['back', 'lower back', 'upper back', 'neck', 'shoulder', 'leg', 'calf', 'arm', 'thigh'],
            types: ['aching', 'sharp', 'throbbing', 'stiff', 'tender'],
            triggers: ['lifting', 'movement', 'exercise', 'activity', 'bending', 'twisting', 'sitting', 'gym', 'overuse'],
            frequency: ['constant', 'intermittent'],
            specialSymptoms: ['muscle stiffness', 'tenderness', 'muscle spasm', 'swelling'],
            symptomWeights: {
                "muscle stiffness": { sensitivity: 0.8, weight: 1.2 },
                "tenderness": { sensitivity: 0.7 },
                "muscle spasm": { specificity: 0.8, weight: 1.5 },
                "swelling": { sensitivity: 0.5 }
            },
            durationHint: 'acute'
        },
        mimics: ['sprain', 'fracture', 'fibromyalgia'],
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Hot and Cold Therapy',
                description: 'Apply ice pack for first 48 hours, then switch to heat',
                ingredients: ['Ice pack', 'Hot water bag', 'Towel'],
                method: 'Ice: 15 mins, 4-6 times daily for first 2 days. Heat: 20 mins after 48 hours.',
                videoUrl: 'https://www.youtube.com/watch?v=6wdmhF_mzRE',
                videoTitle: 'Hot vs Cold Therapy'
            },
            {
                name: 'Epsom Salt Bath',
                description: 'Magnesium helps relax tense muscles',
                ingredients: ['Epsom salt (2 cups)', 'Warm water'],
                method: 'Soak affected area for 20-30 minutes.',
                videoUrl: 'https://www.youtube.com/watch?v=RK8SHBdEOVo',
                videoTitle: 'Epsom Salt Bath Benefits'
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Turmeric Paste (Haldi Lep)',
                description: 'Strong anti-inflammatory for local application',
                ingredients: ['Turmeric powder', 'Warm water/oil', 'Pinch of salt'],
                method: 'Mix to paste. Apply on affected area. Wrap with cloth. Leave for 30 mins.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Potli Massage',
                description: 'Herbal chemical-free heat therapy',
                ingredients: ['Ajwain/Rock salt', 'Cotton cloth'],
                method: 'Roast ingredients safely. Tie in cloth. Apply gentle heat.',
                videoUrl: 'https://www.youtube.com/watch?v=8XZ4Z6Z6Z6Z',
                videoTitle: 'Potli Massage Technique'
            }
        ],
        exercises: [
            {
                name: 'Gentle Stretching',
                description: 'Light stretches to maintain mobility',
                duration: '5-10 minutes',
                frequency: '2-3 times daily',
                videoUrl: 'https://www.youtube.com/watch?v=g_tea8ZNk5A',
                videoTitle: 'Gentle Stretches'
            }
        ],
        warnings: ['Rest for 2-3 days if severe', 'Avoid heavy lifting'],
        seekHelp: 'If pain persists beyond 2 weeks or prevents movement'
    },

    sciatica: {
        id: 'sciatica',
        name: 'Sciatica / Nerve Compression',
        description: 'Pain radiating from lower back down through the leg, often with numbness',
        matchCriteria: {
            locations: ['lower back', 'back', 'leg', 'hip', 'buttock'],
            types: ['shooting', 'burning', 'electric', 'sharp', 'radiating'],
            triggers: ['sitting', 'bending', 'lifting', 'coughing', 'sneezing'],
            specialSymptoms: ['numbness', 'tingling', 'pins and needles', 'weakness', 'down leg', 'radiates']
        },
        severity: 'moderate-severe',
        remedies: [
            {
                name: 'Cold Then Heat Therapy',
                description: 'Ice first, then heat after 48-72 hours',
                ingredients: ['Ice pack', 'Heating pad'],
                method: 'Ice for 20 mins initially. Switch to moist heat later.',
                videoUrl: 'https://www.youtube.com/watch?v=6wdmhF_mzRE',
                videoTitle: 'Hot vs Cold for Sciatica'
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Nirgundi Oil Massage',
                description: 'Traditional Ayurvedic oil for nerve pain',
                ingredients: ['Nirgundi oil (available in pharmacy)'],
                method: 'Gently massage lower back and leg path. Do not rub hard.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Garlic Milk (Lasun Kheer)',
                description: 'Believed to reduce nerve inflammation (Vata)',
                ingredients: ['Garlic cloves (crushed)', 'Milk', 'Turmeric'],
                method: 'Boil crushed garlic in milk. Drink warm.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Piriformis Stretch',
                description: 'Stretches muscle that may compress sciatic nerve',
                duration: 'Hold 30 seconds',
                frequency: '3-4 times daily',
                videoUrl: 'https://www.youtube.com/watch?v=XJ-KkC9V4fU',
                videoTitle: 'Piriformis Stretch'
            }
        ],
        warnings: ['Avoid heavy lifting', 'Do not sit for long periods'],
        seekHelp: 'Seek immediate care if you have loss of bladder/bowel control or leg weakness.'
    },

    arthritis: {
        id: 'arthritis',
        name: 'Arthritis (General)',
        description: 'Joint inflammation causing stiffness, swelling, and pain',
        matchCriteria: {
            locations: ['joints', 'knee', 'fingers', 'wrist', 'hip', 'ankle'],
            types: ['stiff', 'swollen', 'aching', 'sharp'],
            triggers: ['cold weather', 'morning', 'inactivity', 'overuse'],
            specialSymptoms: ['morning stiffness', 'reduced mobility', 'joint swelling', 'creaking joints']
        },
        severity: 'moderate',
        remedies: [
            {
                name: 'Hot/Cold Therapy',
                description: 'Reduces inflammation and stiffness',
                ingredients: ['Heat pad', 'Ice pack'],
                method: 'Apply heat for stiffness, cold for swelling.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Joint-Friendly Exercise',
                description: 'Maintains mobility',
                ingredients: [],
                method: 'Low-impact activities like swimming or cycling.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Mahanarayan Oil Massage',
                description: 'Traditional Ayurvedic joint oil',
                ingredients: ['Mahanarayan oil'],
                method: 'Warm oil slightly. Massage affected joints gently.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Ginger-Turmeric Tea',
                description: 'Anti-inflammatory combination',
                ingredients: ['Ginger', 'Turmeric', 'Black pepper', 'Honey'],
                method: 'Boil ginger and turmeric. Add pepper and honey.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Sesame Oil (Til Ka Tel) Massage',
                description: 'Warms and lubricates joints',
                ingredients: ['Sesame oil (warmed)'],
                method: 'Apply warm oil. Massage in circular motions.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Range of Motion Exercises',
                description: 'Maintains joint flexibility',
                duration: '10-15 minutes',
                frequency: 'Daily'
            },
            {
                name: 'Swimming/Water Aerobics',
                description: 'Low-impact on joints',
                duration: '30 minutes',
                frequency: '2-3 times per week'
            }
        ],
        warnings: ['Avoid high-impact activities', 'Maintain healthy weight'],
        seekHelp: 'If joint is hot, red, or extremely swollen'
    },

    knee_pain: {
        id: 'knee_pain',
        name: 'Knee Pain',
        description: 'Pain in or around the knee joint from various causes',
        matchCriteria: {
            locations: ['knee', 'leg'],
            types: ['aching', 'sharp', 'grinding', 'stiff'],
            triggers: ['climbing stairs', 'squatting', 'running', 'standing long', 'sitting long'],
            specialSymptoms: ['clicking', 'locking', 'giving way', 'swelling around knee']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'RICE Method',
                description: 'Rest, Ice, Compression, Elevation',
                ingredients: ['Ice pack', 'Bandage'],
                method: 'Rest, apply ice 20 mins, compress, elevate.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Castor Oil (Arandi Tel) Pack',
                description: 'Reduces inflammation',
                ingredients: ['Castor oil', 'Cloth', 'Heating pad'],
                method: 'Soak cloth in oil. Apply to knee. Cover with heat.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Fenugreek (Methi) Seeds',
                description: 'Anti-inflammatory properties',
                ingredients: ['Fenugreek seeds', 'Water'],
                method: 'Soak overnight. Eat seeds in morning or make paste for topical use.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Quadriceps Strengthening',
                description: 'Supports knee joint',
                duration: '10 minutes',
                frequency: 'Daily'
            },
            {
                name: 'Straight Leg Raises',
                description: 'Low-impact knee exercise',
                duration: '10 reps each leg',
                frequency: '2-3 times daily'
            }
        ],
        warnings: ['Avoid deep squats', 'Use proper footwear'],
        seekHelp: 'If knee locks, gives way, or has severe swelling after injury'
    },

    sprain: {
        id: 'sprain',
        name: 'Sprain / Ligament Injury',
        description: 'Stretched or torn ligament causing pain, swelling, and bruising',
        matchCriteria: {
            locations: ['ankle', 'wrist', 'knee', 'finger', 'foot', 'shoulder', 'elbow'],
            types: ['sharp', 'throbbing', 'swollen', 'tender'],
            triggers: ['fall', 'twist', 'sports injury', 'sudden movement'],
            specialSymptoms: ['swelling', 'bruising', 'instability', 'popping sound at injury'],
            symptomWeights: {
                "popping sound at injury": { specificity: 0.9, weight: 2.0 },
                "instability": { specificity: 0.85, weight: 1.5 },
                "bruising": { sensitivity: 0.7 },
                "swelling": { sensitivity: 0.9 }
            }
        },
        mimics: ['fracture', 'muscle_strain'],
        severity: 'moderate',
        remedies: [
            {
                name: 'RICE Protocol',
                description: 'Standard sprain treatment',
                ingredients: ['Ice', 'Elastic bandage', 'Pillows'],
                method: 'Rest, Ice 20 mins/hour, Compress, Elevate above heart.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Turmeric Paste (Haldi Lep)',
                description: 'Reduces swelling',
                ingredients: ['Turmeric', 'Lime juice', 'Salt'],
                method: 'Make paste. Apply thick layer. Wrap with cloth.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Onion Poultice',
                description: 'Traditional anti-inflammatory',
                ingredients: ['Onion (chopped)', 'Cloth'],
                method: 'Wrap chopped onion in cloth. Apply to sprain.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Gentle Range of Motion',
                description: 'After initial healing phase',
                duration: '5 minutes',
                frequency: 'Several times daily after swelling reduces'
            }
        ],
        warnings: ['Do not walk on severe sprains', 'Avoid heat for first 48-72 hours'],
        seekHelp: 'If unable to bear weight, severe pain, or no improvement after few days'
    },

    cervical_spondylosis: {
        id: "cervical_spondylosis",
        name: "Cervical Spondylosis (Neck Arthritis)",
        description: "Wear and tear of neck discs causing pain and stiffness.",
        matchCriteria: {
            locations: ["neck", "shoulders", "arm", "back of head"],
            types: ["stiff", "aching", "radiating", "numbness"],
            triggers: ["computer work", "looking down", "sleeping wrong", "stress"],
            specialSymptoms: ["neck stiffness", "pain radiating to arm", "numbness in fingers", "grinding noise in neck"],
            symptomWeights: {
                "neck stiffness": { sensitivity: 0.9, weight: 1.2 },
                "pain radiating to arm": { specificity: 0.85, weight: 1.5 },
                "numbness in fingers": { specificity: 0.8 },
                "grinding noise in neck": { specificity: 0.9 }
            }
        },
        mimics: ["tension_headache", "frozen_shoulder", "carpal_tunnel"],
        severity: "moderate",
        prevalence: "very_common",
        remedies: [
            {
                name: "Ergonomic Adjustment",
                description: "Fix posture.",
                ingredients: ["Monitor stand", "Chair"],
                method: "Keep screen at eye level. Take breaks every 30 mins."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Mahanarayan Oil",
                description: "Ayurvedic oil for joint pain.",
                ingredients: ["Mahanarayan Thailam"],
                method: "Gentle massage on neck and shoulders twice daily."
            }
        ],
        exercises: [
            {
                name: "Neck Isometrics",
                description: "Strengthening without movement.",
                duration: "5 mins",
                frequency: "Daily"
            }
        ],
        warnings: ["Don't crack your neck.", "Avoid thick pillows."],
        seekHelp: "If significant weakness in arms or loss of coordination."
    },

    frozen_shoulder: {
        id: "frozen_shoulder",
        name: "Frozen Shoulder (Adhesive Capsulitis)",
        description: "Stiffness and pain in the shoulder joint.",
        matchCriteria: {
            locations: ["shoulder", "upper arm"],
            types: ["stiff", "aching", "limited motion"],
            triggers: ["cold weather", "diabetes", "previous injury"],
            specialSymptoms: ["inability to lift arm", "pain at night", "shoulder stiffness"],
            symptomWeights: {
                "inability to lift arm": { specificity: 0.9, weight: 2.0 },
                "shoulder stiffness": { sensitivity: 0.95, weight: 1.5 },
                "pain at night": { specificity: 0.7 }
            }
        },
        mimics: ["cervical_spondylosis", "muscle_strain"],
        severity: "moderate",
        prevalence: "common",
        remedies: [
            {
                name: "Pendulum Exercises",
                description: "Mobilize joint.",
                ingredients: [],
                method: "Lean forward and let arm dangle and swing gently."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Parijat Leaf Decoction",
                description: "Reduces inflammation.",
                ingredients: ["Parijat (Night Jasmine) leaves", "Water"],
                method: "Boil leaves, strain, and drink warm."
            }
        ],
        exercises: [
            {
                name: "Wall Crawl",
                description: "Finger walk up the wall.",
                duration: "5 mins",
                frequency: "Twice daily"
            }
        ],
        warnings: ["Keep moving it gently within pain limits.", "Keep warm."],
        seekHelp: "If pain is unmanageable."
    },

    plantar_fasciitis: {
        id: "plantar_fasciitis",
        name: "Plantar Fasciitis (Heel Pain)",
        description: "Inflammation of tissue on bottom of foot causing heel pain.",
        matchCriteria: {
            locations: ["heel", "foot", "sole"],
            types: ["sharp", "stabbing"],
            triggers: ["first step in morning", "standing long time", "running"],
            specialSymptoms: ["pain in morning", "pain after rest", "heel pain"],
            symptomWeights: {
                "pain in morning": { specificity: 0.95, weight: 2.0 },
                "heel pain": { sensitivity: 1.0 },
                "pain after rest": { specificity: 0.9 }
            }
        },
        severity: "mild-moderate",
        prevalence: "common",
        remedies: [
            {
                name: "Frozen Water Bottle Roll",
                description: "Ice massage for foot.",
                ingredients: ["Frozen water bottle"],
                method: "Roll foot over bottle for 10 mins."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Castor Oil Massage",
                description: "Lubricates tissues.",
                ingredients: ["Castor oil"],
                method: "Massage heel and sole before bed."
            }
        ],
        exercises: [
            {
                name: "Calf Stretch",
                description: "Loosens posterior chain.",
                duration: "30 secs",
                frequency: "3 times daily"
            }
        ],
        warnings: ["Wear supportive shoes.", "Avoid walking barefoot."],
        seekHelp: "If no improvement after 2 weeks."
    },

    tennis_elbow: {
        id: "tennis_elbow",
        name: "Tennis Elbow (Lateral Epicondylitis)",
        description: "Pain on the outside of the elbow caused by overuse of forearm muscles.",
        matchCriteria: {
            locations: ["elbow", "outer elbow", "forearm"],
            types: ["burning", "aching", "sharp"],
            triggers: ["gripping", "twisting", "lifting", "mouse use"],
            specialSymptoms: ["weak grip", "pain when lifting", "elbow stiffness"],
            symptomWeights: {
                "pain when lifting": { specificity: 0.8 },
                "weak grip": { sensitivity: 0.7 }
            }
        },
        severity: "mild-moderate",
        prevalence: "common",
        remedies: [
            {
                name: "Brace/Strap",
                description: "Reduces strain on tendon.",
                ingredients: ["Elbow brace"],
                method: "Wear just below the elbow joint during activity."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Potato Pack",
                description: "Reduces inflammation.",
                ingredients: ["Grated potato"],
                method: "Apply grated potato pack on elbow for 15-20 mins."
            }
        ],
        exercises: [],
        warnings: ["Rest the arm.", "Avoid repetitive gripping."],
        seekHelp: "If pain persists or arm becomes swollen."
    },

    carpal_tunnel: {
        id: "carpal_tunnel",
        name: "Carpal Tunnel Syndrome",
        description: "Numbness and tingling in the hand and arm caused by a pinched nerve in the wrist.",
        matchCriteria: {
            locations: ["wrist", "hand", "fingers", "palm"],
            types: ["numbness", "tingling", "electric", "burning"],
            triggers: ["typing", "phone use", "driving", "night time"],
            specialSymptoms: ["numbness in thumb/index/middle finger", "weakness in hand", "dropping objects"],
            symptomWeights: {
                "numbness in thumb/index/middle finger": { specificity: 0.98, weight: 2.5 },
                "weakness in hand": { sensitivity: 0.7 },
                "dropping objects": { specificity: 0.8 }
            }
        },
        mimics: ["cervical_spondylosis"],
        severity: "moderate",
        prevalence: "common",
        remedies: [
            {
                name: "Wrist Splint",
                description: "Keeps wrist neutral.",
                ingredients: ["Wrist splint"],
                method: "Wear at night to prevent bending."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Mustard Oil Massage",
                description: "Improves circulation.",
                ingredients: ["Warm mustard oil"],
                method: "Gentle massage of wrist and forearm."
            }
        ],
        exercises: [
            {
                name: "Wrist Flexor Stretch",
                description: "Stretches forearm.",
                duration: "30 secs",
                frequency: "Hourly during work"
            }
        ],
        warnings: ["Take breaks from typing.", "Ergonomic setup."],
        seekHelp: "If muscles waste away or constant numbness."
    },

    back_pain_lower: {
        id: "back_pain_lower",
        name: "Lower Back Pain (Lumbago)",
        description: "Pain in the lumbar region, often from strain or posture.",
        matchCriteria: {
            locations: ["lower back", "waist", "lumbar"],
            types: ["aching", "stiff", "sharp", "dull"],
            triggers: ["lifting", "bending", "sitting", "standing"],
            specialSymptoms: ["stiffness", "muscle spasm", "pain radiating to buttock"]
        },
        severity: "moderate",
        prevalence: "very_common",
        remedies: [
            {
                name: "Heat Therapy",
                description: "Relaxes muscles.",
                ingredients: ["Heating pad"],
                method: "Apply for 20 mins."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Ginger Paste",
                description: "Anti-inflammatory.",
                ingredients: ["Ginger powder", "Water"],
                method: "Apply paste to back. Leave for 20 mins."
            }
        ],
        exercises: [
            {
                name: "Cat-Cow Pose",
                description: "Mobilizes spine.",
                duration: "2 mins",
                frequency: "Daily"
            }
        ],
        warnings: ["Lift with knees.", "Avoid soft mattresses."],
        seekHelp: "If numbness in legs or bladder issues."
    },

    back_pain_upper: {
        id: "back_pain_upper",
        name: "Upper Back Pain / Posture Pain",
        description: "Pain between shoulder blades or upper back, often from slouching.",
        matchCriteria: {
            locations: ["upper back", "shoulder blades", "thoracic spine"],
            types: ["aching", "burning", "knot"],
            triggers: ["slouching", "hunching", "looking down", "computer"],
            specialSymptoms: ["muscle knots", "rounded shoulders", "stiffness"]
        },
        severity: "mild-moderate",
        remedies: [
            {
                name: "Foam Rolling",
                description: "Release knots.",
                ingredients: ["Foam roller"],
                method: "Roll upper back gently."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Salt Potli",
                description: "Heat therapy.",
                ingredients: ["Rock salt", "Cloth"],
                method: "Heat salt, tie in cloth, apply to painful area."
            }
        ],
        exercises: [
            {
                name: "Wall Angels",
                description: "Corrects posture.",
                duration: "10 reps",
                frequency: "Daily"
            }
        ],
        warnings: ["Correct your posture.", "Bring phone to eye level."],
        seekHelp: "If breathing is painful."
    },

    leg_cramps: {
        id: "leg_cramps",
        name: "Leg Cramps (Charley Horse)",
        description: "Sudden, involuntary muscle contractions.",
        matchCriteria: {
            locations: ["leg", "calf", "foot", "thigh"],
            types: ["cramping", "tight", "painful knot"],
            triggers: ["night", "dehydration", "exercise", "pregnancy"],
            specialSymptoms: ["hard lump of muscle", "sudden pain"]
        },
        severity: "mild",
        remedies: [
            {
                name: "Stretch and Massage",
                description: "Releases cramp.",
                ingredients: [],
                method: "Forcefully stretch muscle (e.g., pull toes up for calf) and massage."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Lemon Water and Salt",
                description: "Electrolytes.",
                ingredients: ["Lemon", "Water", "Salt"],
                method: "Drink immediately."
            }
        ],
        exercises: [],
        warnings: ["Stay hydrated.", "Eat magnesium-rich foods."],
        seekHelp: "If frequent and disrupting sleep."
    }
};
