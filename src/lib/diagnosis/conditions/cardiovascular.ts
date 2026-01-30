import { Condition } from "../types";

export const cardiovascularConditions: Record<string, Condition> = {
    hypertension: {
        id: "hypertension",
        name: "High Blood Pressure (Rakta Gata Vata)",
        description: "Elevated blood pressure, often symptomless but may cause headaches or palpitations.",
        matchCriteria: {
            locations: ["head", "chest", "whole body"],
            types: ["pulsating", "heavy", "dizziness"],
            triggers: ["stress", "salt", "exertion"],
            specialSymptoms: ["palpitations", "shortness of breath", "nosebleeds", "flushing"],
            durationHint: "chronic"
        },
        severity: "moderate-severe",
        remedies: [
            {
                name: "DASH Diet",
                description: "Dietary Approaches to Stop Hypertension.",
                ingredients: ["Fruits", "Vegetables", "Low sodium"],
                method: "Focus on potassium-rich foods and reduce salt intake."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Arjuna Bark Tea",
                description: "Cardiotonic herb.",
                ingredients: ["Arjuna bark powder", "Milk", "Water"],
                method: "Boil 1 tsp powder in milk and water mix. Drink morning and evening."
            },
            {
                name: "Garlic",
                description: "Lowers blood pressure.",
                ingredients: ["Garlic clove"],
                method: "Eat one raw clove of garlic daily on empty stomach (if digestion permits)."
            }
        ],
        exercises: [
            {
                name: "Shavasana",
                description: "Corpse pose for deep relaxation.",
                duration: "10-15 minutes",
                frequency: "Daily"
            }
        ],
        warnings: ["Monitor BP regularly.", "Reduce stress."],
        seekHelp: "If chest pain, severe headache, or vision problems occur."
    },
    palpitations: {
        id: "palpitations",
        name: "Heart Palpitations (Hrid Dravatva)",
        description: "Sensation of rapid, fluttering, or pounding heartbeats.",
        matchCriteria: {
            locations: ["chest", "heart"],
            types: ["fluttering", "pounding", "racing", "skipped beat"],
            triggers: ["anxiety", "caffeine", "stress", "exertion"],
            specialSymptoms: ["dizziness", "shortness of breath", "anxiety"],
            durationHint: "acute"
        },
        severity: "moderate",
        remedies: [
            {
                name: "Vagal Maneuvers",
                description: "Reset heart rhythm.",
                ingredients: ["Cold water"],
                method: "Splash cold water on face or cough forcefully."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Rose Petal Jam (Gulkand)",
                description: "Cooling and calming.",
                ingredients: ["Gulkand"],
                method: "1 tsp daily to reduce Pitta in the heart."
            }
        ],
        exercises: [
            {
                name: "Deep Breathing",
                description: "Calm the nervous system.",
                duration: "5 minutes",
                frequency: "During episodes"
            }
        ],
        warnings: ["Limit caffeine and alcohol."],
        seekHelp: "If accompanied by chest pain, fainting, or history of heart disease."
    },

    angina: {
        id: "angina",
        name: "Angina Pectoris (Hrid Shoola)",
        description: "Chest pain caused by reduced blood flow to the heart muscles.",
        matchCriteria: {
            locations: ["chest", "center of chest"],
            types: ["squeezing", "pressure", "heavy", "tightness"],
            triggers: ["exertion", "stress", "cold weather", "heavy meal"],
            specialSymptoms: ["chest pain on exertion", "relief with rest", "shortness of breath", "fatigue"]
        },
        severity: "severe",
        prevalence: "common",
        remedies: [
            {
                name: "Rest Immediately",
                description: "Stop activity to reduce heart load.",
                ingredients: [],
                method: "Sit or lie down until pain subsides."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Ginger and Garlic",
                description: "Improves circulation.",
                ingredients: ["Ginger juice", "Garlic juice"],
                method: "Mix equal parts. Take 1 tsp daily (preventative)."
            }
        ],
        exercises: [],
        warnings: ["Stop smoking.", "Manage cholesterol."],
        seekHelp: "If pain lasts > 5 mins or doesn't stop with rest (could be heart attack)."
    },

    heart_attack: {
        id: "heart_attack",
        name: "Myocardial Infarction (Heart Attack)",
        description: "Blockage of blood flow to the heart. A MEDICAL EMERGENCY.",
        matchCriteria: {
            locations: ["chest", "left arm", "jaw", "back"],
            types: ["crushing", "squeezing", "heavy weight"],
            triggers: ["exertion", "stress", "unknown"],
            specialSymptoms: ["pain radiating to left arm", "sweating", "nausea", "shortness of breath", "feeling of doom", "jaw pain"],
            onset: "sudden",
            progression: "worsening",
            symptomWeights: {
                "chest pain": { sensitivity: 0.95, weight: 1.5 },
                "pain radiating to left arm": { specificity: 0.98, weight: 2.0 },
                "sweating": { sensitivity: 0.7, specificity: 0.6 },
                "shortness of breath": { sensitivity: 0.8 }
            }
        },
        severity: "critical",
        prevalence: "uncommon",
        mandatorySymptoms: ["chest"],
        mimics: ["angina", "gerd", "panic_attack", "anxiety"],
        redFlags: ["crushing chest pain > 10 mins", "pain radiating to arm/jaw", "chest pain with sweating/nausea"],
        remedies: [
            {
                name: "CALL AMBULANCE",
                description: "Immediate emergency care required.",
                ingredients: [],
                method: "Call emergency services. Chew an aspirin if not allergic."
            }
        ],
        indianHomeRemedies: [],
        exercises: [],
        warnings: ["Time is muscle - act fast.", "Do not drive yourself."],
        seekHelp: "IMMEDIATELY. Go to Emergency Room."
    }
};
