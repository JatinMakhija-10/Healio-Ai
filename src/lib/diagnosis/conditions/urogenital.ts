import { Condition } from "../types";

export const urogenitalConditions: Record<string, Condition> = {
    uti: {
        id: "uti",
        name: "Urinary Tract Infection (Mutrakrichra)",
        description: "Infection in the urinary system causing painful urination.",
        matchCriteria: {
            locations: ["bladder", "urinary tract", "lower abdomen"],
            types: ["burning", "stinging", "painful"],
            triggers: ["dehydration", "holding urine", "hygiene"],
            specialSymptoms: ["frequent urination", "cloudy urine", "urge to urinate", "fever"],
            durationHint: "acute"
        },
        severity: "moderate",
        remedies: [
            {
                name: "Hydration",
                description: "Flush out bacteria.",
                ingredients: ["Water", "Coconut water"],
                method: "Drink at least 3-4 liters of fluids daily."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Coriander Water",
                description: "Cooling diuretic.",
                ingredients: ["Coriander seeds", "Water"],
                method: "Soak 2 tbsp seeds overnight, crush/strain and drink."
            },
            {
                name: "Barley Water",
                description: "Cleanses urinary tract.",
                ingredients: ["Pearl barley", "Water"],
                method: "Boil barley in water until soft, strain and drink the water."
            }
        ],
        exercises: [],
        warnings: ["Avoid spicy and sour foods.", "Don't hold urine for long."],
        seekHelp: "See a doctor immediately if fever, back pain, or blood in urine."
    },
    dysmenorrhea: {
        id: "dysmenorrhea",
        name: "Painful Menstruation (Kashtartava)",
        description: "Severe cramping pain during menstruation.",
        matchCriteria: {
            locations: ["lower abdomen", "lower back", "pelvis"],
            types: ["cramping", "spasmodic", "aching"],
            triggers: ["menstruation", "cold", "stress"],
            specialSymptoms: ["nausea", "headache", "fatigue", "bloating"],
            durationHint: "any"
        },
        severity: "moderate",
        remedies: [
            {
                name: "Heat Therapy",
                description: "Relieve muscle cramps.",
                ingredients: ["Hot water bottle"],
                method: "Apply heat to lower abdomen/back."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Ajwain Tea",
                description: "Relieves spasms.",
                ingredients: ["Ajwain seeds", "Jaggery", "Water"],
                method: "Boil ajwain and jaggery in water, drink warm."
            },
            {
                name: "Ginger Tea",
                description: "Reduces inflammation.",
                ingredients: ["Ginger"],
                method: "Drink warm ginger tea."
            }
        ],
        exercises: [
            {
                name: "Child's Pose",
                description: "Restorative pose.",
                duration: "5-10 minutes",
                frequency: "As needed"
            }
        ],
        warnings: ["Avoid cold foods.", "Rest adequately."],
        seekHelp: "If pain is incapacitating or bleeding is excessively heavy."
    },
    kidney_stones: {
        id: "kidney_stones",
        name: "Kidney Stones (Ashmari)",
        description: "Hard deposits made of minerals and salts that form inside your kidneys.",
        matchCriteria: {
            locations: ["kidney", "side", "back", "lower abdomen"],
            types: ["severe", "sharp", "fluctuating", "colicky"],
            triggers: ["dehydration", "diet"],
            specialSymptoms: ["pink/red urine", "nausea", "vomiting", "fever", "chills"],
            durationHint: "acute"
        },
        severity: "severe",
        remedies: [
            {
                name: "Hydration",
                description: "Help pass small stones.",
                ingredients: ["Water"],
                method: "Drink extensive amounts of water."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Lemon Juice & Olive Oil",
                description: "May help lubricate passage.",
                ingredients: ["Lemon juice", "Olive oil"],
                method: "Mix 2 tbsp of each and drink (consult doctor)."
            },
            {
                name: "Horse Gram Soup (Kulthi)",
                description: "Known to dissolve stones.",
                ingredients: ["Horse gram", "Water"],
                method: "Boil horse gram, make a soup and consume."
            }
        ],
        exercises: [],
        warnings: ["Seek immediate medical attention for severe pain.", "Limit oxalate-rich foods."],
        seekHelp: "Go to ER if pain is unbearable or accompanied by fever."
    },

    prostatitis: {
        id: "prostatitis",
        name: "Prostatitis (Prostate Inflammation)",
        description: "Swelling and inflammation of the prostate gland.",
        matchCriteria: {
            locations: ["pelvis", "groin", "lower back", "genital"],
            types: ["aching", "burning", "pressure"],
            triggers: ["infection", "stress", "sitting long"],
            specialSymptoms: ["painful urination", "frequent urination", "pelvic pain", "pain ejaculation"]
        },
        severity: "moderate",
        prevalence: "common",
        remedies: [
            {
                name: "Warm Sitz Bath",
                description: "Relieves pelvic muscle tension.",
                ingredients: ["Warm water", "Tub"],
                method: "Sit in warm water for 15-20 mins."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Varuna (Crataeva nurvala)",
                description: "Ayurvedic herb for urinary/prostate health.",
                ingredients: ["Varuna bark extract"],
                method: "Take as prescribed by practitioner."
            }
        ],
        exercises: [
            {
                name: "Kegel Exercises",
                description: "Strengthens pelvic floor.",
                duration: "10 reps",
                frequency: "3 times daily"
            }
        ],
        warnings: ["Avoid prolonged sitting.", "Stay hydrated."],
        seekHelp: "If high fever, inability to urinate, or severe pain."
    },

    pcos: {
        id: "pcos",
        name: "Polycystic Ovary Syndrome (PCOS)",
        description: "Hormonal disorder common among women of reproductive age.",
        matchCriteria: {
            locations: ["pelvis", "ovary", "abdomen"],
            types: ["irregular", "hormonal"],
            triggers: ["genetics", "insulin resistance", "inflammation"],
            specialSymptoms: ["irregular periods", "excess hair growth", "acne", "weight gain", "difficulty conceiving"]
        },
        severity: "moderate",
        prevalence: "common",
        remedies: [
            {
                name: "Lifestyle Changes",
                description: "Core management for PCOS.",
                ingredients: [],
                method: "Exercise regularly. Maintain healthy weight. Low GI diet."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Shatavari",
                description: "Supports female hormonal balance.",
                ingredients: ["Shatavari powder", "Milk"],
                method: "Mix 1 tsp in warm milk. Drink daily."
            },
            {
                name: "Fenugreek Seeds (Methi)",
                description: "Helps regulate menstrual cycle.",
                ingredients: ["Fenugreek seeds", "Water"],
                method: "Soak seeds overnight. Drink water and eat seeds."
            }
        ],
        exercises: [
            {
                name: "Yoga",
                description: "Helps regulate hormones.",
                duration: "30 mins",
                frequency: "Daily"
            }
        ],
        warnings: ["Manage stress.", "Monitor blood sugar levels."],
        seekHelp: "If experiencing prolonged amenorrhea or fertility issues."
    }
};
