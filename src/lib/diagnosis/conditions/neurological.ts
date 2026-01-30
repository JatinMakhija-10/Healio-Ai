import { Condition } from "../types";

export const neurologicalConditions: Record<string, Condition> = {
    migraine_vata: {
        id: "migraine_vata",
        name: "Vata Type Migraine (Vataja Shirashoola)",
        description: "Intense, throbbing headache often triggered by stress, irregular sleep, or dry/cold weather.",
        matchCriteria: {
            locations: ["head", "temples", "forehead"],
            types: ["throbbing", "pulsating", "intense", "splitting"],
            triggers: ["stress", "noise", "light", "irregular sleep", "fasting", "cold wind"],
            specialSymptoms: ["anxiety", "dizziness", "constipation", "dry skin", "ringing in ears", "light sensitivity", "nausea"],
            symptomWeights: {
                "light sensitivity": { sensitivity: 0.9, weight: 1.4 },
                "nausea": { sensitivity: 0.8 },
                "throbbing": { sensitivity: 0.85, weight: 1.2 } // Matches painType, but good to reinforce
            },
            absentSymptoms: [], // If not a Vata type, absent symptoms would differ
            durationHint: "acute",
            onset: "gradual"
        },
        severity: "moderate-severe",
        mimics: ["tension_headache", "cluster_headache"],
        remedies: [
            {
                name: "Warm Oil Massage",
                description: "Massage warm sesame oil on the scalp and temples.",
                ingredients: ["Sesame oil", "Warm towel"],
                method: "Apply warm oil to scalp and massage gently for 10 minutes. Wrap head in warm towel."
            },
            {
                name: "Ginger Tea",
                description: "Calms Vata and improves circulation.",
                ingredients: ["Fresh ginger", "Hot water", "Honey"],
                method: "Boil ginger in water for 5 mins, strain, and drink warm."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Nasya",
                description: "Application of ghee in nostrils.",
                ingredients: ["Warm Ghee"],
                method: "Put 2 drops of warm ghee in each nostril in the morning."
            }
        ],
        exercises: [
            {
                name: "Pawanmuktasana",
                description: "Wind relieving pose to reduce Vata.",
                duration: "5 minutes",
                frequency: "Daily morning"
            }
        ],
        warnings: ["Seek help if vision changes occur.", "Consult if headache is worst of your life."],
        seekHelp: "Consult a neurologist if headaches are frequent or severe."
    },
    migraine_pitta: {
        id: "migraine_pitta",
        name: "Pitta Type Migraine (Pittaja Shirashoola)",
        description: "Burning, piercing headache often triggered by heat, sun, or skipping meals.",
        matchCriteria: {
            locations: ["head", "eyes", "temples"],
            types: ["burning", "piercing", "sharp", "shooting"],
            triggers: ["sunlight", "heat", "spicy food", "anger", "hunger"],
            specialSymptoms: ["red eyes", "light sensitivity", "nausea", "irritability", "burning sensation"],
            symptomWeights: {
                "burning section": { sensitivity: 0.8 }, // Note: typo in list "burning sensation" vs "section"? Assuming sensation
                "burning sensation": { sensitivity: 0.9, weight: 1.3 },
                "red eyes": { specificity: 0.8 }
            },
            durationHint: "acute"
        },
        severity: "moderate-severe",
        remedies: [
            {
                name: "Cooling Compress",
                description: "Apply cool sandalwood paste or cool water cloth.",
                ingredients: ["Sandalwood powder", "Rose water"],
                method: "Mix sandalwood and rose water, apply paste to forehead."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Coriander Water",
                description: "Cooling drink to reduce Pitta.",
                ingredients: ["Coriander seeds", "Water", "Sugar candy"],
                method: "Soak crushed coriander seeds overnight, strain and drink in morning."
            }
        ],
        exercises: [
            {
                name: "Sheetali Pranayama",
                description: "Cooling breath technique.",
                duration: "5 minutes",
                frequency: "During headache onset"
            }
        ],
        warnings: ["Avoid triggers like alcohol and spicy food."],
        seekHelp: "See a doctor if accompanied by vomiting or visual aura."
    },
    tension_headache: {
        id: "tension_headache",
        name: "Tension Headache",
        description: "Dull, squeezing pain like a band around the head, often due to stress or posture.",
        matchCriteria: {
            locations: ["head", "back of head", "neck"],
            types: ["dull", "aching", "pressure", "tightness", "squeezing"],
            triggers: ["stress", "posture", "screen time", "fatigue"],
            specialSymptoms: ["neck stiffness", "shoulder tension", "fatigue"],
            symptomWeights: {
                "neck stiffness": { sensitivity: 0.8 },
                "shoulder tension": { specificity: 0.7 }
            },
            absentSymptoms: ["light sensitivity", "nausea", "vomiting", "aura"], // Differentiation from Migraine
            durationHint: "any",
            onset: "gradual",
            progression: "stable"
        },
        severity: "mild-moderate",
        mimics: ["migraine_vata", "migraine_pitta", "cervical_spondylosis"],
        remedies: [
            {
                name: "Neck Stretches",
                description: "Relieve muscle tension.",
                ingredients: [],
                method: "Gently tilt head side to side and forward/back."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Brahmi Oil Application",
                description: "Soothing herb for nerves.",
                ingredients: ["Brahmi oil"],
                method: "Massage forehead with Brahmi oil at bedtime."
            }
        ],
        exercises: [
            {
                name: "Shoulder Rolls",
                description: "Release upper back tension.",
                duration: "2 minutes",
                frequency: "Every hour of desk work"
            }
        ],
        warnings: ["Monitor screen time.", "Establish regular sleep schedule."],
        seekHelp: "If daily or unresponsive to OTC meds."
    },
    sciatica: {
        id: "sciatica",
        name: "Sciatica (Gridhrasi)",
        description: "Pain radiating from lower back down the leg along the sciatic nerve.",
        matchCriteria: {
            locations: ["lower back", "hip", "leg", "buttock"],
            types: ["shooting", "radiating", "burning", "numbness", "tingling"],
            triggers: ["sitting", "lifting", "bending"],
            specialSymptoms: ["leg numbness", "weakness in leg", "pain on one side"],
            symptomWeights: {
                "leg numbness": { specificity: 0.85, weight: 1.5 },
                "pain on one side": { specificity: 0.8 },
                "weakness in leg": { sensitivity: 0.7 }
            },
            durationHint: "chronic"
        },
        severity: "moderate-severe",
        remedies: [
            {
                name: "Gentle Stretching",
                description: "Relieve nerve compression.",
                ingredients: [],
                method: "Gentle yoga poses like Cobra or Child's pose."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Castor Oil",
                description: "Natural purgative to balance Vata.",
                ingredients: ["Castor oil", "Warm milk"],
                method: "1 tsp castor oil in warm milk before bed (consult expert first)."
            },
            {
                name: "Garlic Milk",
                description: "Anti-inflammatory.",
                ingredients: ["Garlic cloves", "Milk", "Water"],
                method: "Boil crushed garlic in milk and water, reduce to half, drink warm."
            }
        ],
        exercises: [
            {
                name: "Bhujangasana",
                description: "Cobra pose strengthens spine.",
                duration: "Hold 30 secs",
                frequency: "Daily"
            }
        ],
        warnings: ["Avoid heavy lifting.", "Don't sit on soft sofas for long."],
        seekHelp: "If bladder/bowel control is lost (medical emergency)."
    },

    vertigo: {
        id: "vertigo",
        name: "Vertigo (BPPV) / Bhrama",
        description: "Sensation of spinning or swaying, often caused by inner ear issues.",
        matchCriteria: {
            locations: ["head", "ears"],
            types: ["spinning", "dizzy", "off-balance"],
            triggers: ["head movement", "lying down", "turning over in bed", "stress"],
            specialSymptoms: ["spinning sensation", "nausea", "vomiting", "loss of balance", "ringing in ears"]
        },
        severity: "moderate",
        prevalence: "common",
        remedies: [
            {
                name: "Epley Maneuver",
                description: "Repositioning head movements.",
                ingredients: ["Bed/Table"],
                method: "Perform specific head movements to clear inner ear crystals (consult doctor first)."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Amla and Coriander",
                description: "Cooling remedy for dizziness.",
                ingredients: ["Amla powder", "Coriander seeds", "Water"],
                method: "Soak overnight. Strain and drink in morning."
            },
            {
                name: "Almonds and Milk",
                description: "Nourishes nervous system.",
                ingredients: ["Almonds", "Milk", "Pumpkin seeds", "Wheat"],
                method: "Soak almonds/seeds, grind into paste, boil with milk."
            }
        ],
        exercises: [
            {
                name: "Brandt-Daroff Exercises",
                description: "Habituation exercises for vertigo.",
                duration: "10 minutes",
                frequency: "3 times daily"
            }
        ],
        warnings: ["Fall risk - move slowly.", "Avoid driving."],
        seekHelp: "If accompanied by double vision, slurred speech, or weakness (Stroke signs)."
    },

    cluster_headache: {
        id: "cluster_headache",
        name: "Cluster Headache (Suryavarta)",
        description: "Excruciatingly painful headaches occurring in clusters, usually on one side around the eye.",
        matchCriteria: {
            locations: ["head", "one side", "around eye"],
            types: ["severe", "piercing", "burning", "excruciating"],
            triggers: ["alcohol", "smoking", "strong smells", "seasonal changes"],
            specialSymptoms: ["pain on one side", "tearing eye", "runny nose", "red eye", "restlessness", "drooping eyelid"],
            symptomWeights: {
                "tearing eye": { specificity: 0.95, weight: 2.0 },
                "drooping eyelid": { specificity: 0.95, weight: 2.0 },
                "runny nose": { specificity: 0.7 },
                "pain on one side": { sensitivity: 1.0 }
            }
        },
        severity: "severe",
        prevalence: "rare",
        remedies: [
            {
                name: "Oxygen Therapy",
                description: "High flow oxygen often stops attack.",
                ingredients: ["Medical Oxygen"],
                method: "Prescribed medical treatment during attacks."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Ghee Nasya",
                description: "Lubricates nasal passages.",
                ingredients: ["Cow Ghee"],
                method: "Put 2 drops of warm ghee in nostrils during pain-free period."
            }
        ],
        exercises: [],
        warnings: ["Avoid alcohol completely during cluster periods."],
        seekHelp: "If pain is unbearable or pattern changes significantly."
    },

    insomnia: {
        id: "insomnia",
        name: "Insomnia (Anidra)",
        description: "Difficulty falling asleep or staying asleep.",
        matchCriteria: {
            locations: ["head", "mind"],
            types: ["restless", "fatigued"],
            triggers: ["stress", "caffeine", "screens", "irregular schedule"],
            specialSymptoms: ["can't sleep", "waking up tired", "difficulty falling asleep", "waking up early"]
        },
        severity: "mild-moderate",
        prevalence: "very_common",
        remedies: [
            {
                name: "Sleep Hygiene",
                description: "Routine for better sleep.",
                ingredients: [],
                method: "Fixed wake up time, cool dark room, no screens 1 hour before bed."
            }
        ],
        indianHomeRemedies: [
            {
                name: "Warm Milk with Nutmeg",
                description: "Natural sedative.",
                ingredients: ["Warm milk", "Nutmeg powder"],
                method: "Drink warm milk with a pinch of nutmeg before bed."
            },
            {
                name: "Ashwagandha",
                description: "Reduces stress and promotes sleep.",
                ingredients: ["Ashwagandha root powder", "Milk"],
                method: "Mix 1 tsp in warm milk. Drink at night."
            }
        ],
        exercises: [
            {
                name: "Yoga Nidra",
                description: "Body scan meditation.",
                duration: "20 minutes",
                frequency: "At bedtime"
            }
        ],
        warnings: ["Avoid caffeine after 2 PM.", "Avoid daytime naps."],
        seekHelp: "If affecting daily, safe functioning (e.g., driving)."
    }
};
