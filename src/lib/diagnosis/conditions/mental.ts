import { Condition } from "../types";

export const mentalConditions: Record<string, Condition> = {
    anxiety: {
        id: 'anxiety',
        name: 'Anxiety',
        description: 'Persistent worry, nervousness, or unease',
        matchCriteria: {
            locations: ['mind', 'chest', 'stomach'],
            types: ['worried', 'nervous', 'tense', 'scared'],
            triggers: ['stress', 'uncertainty', 'caffeine', 'social situations'],
            specialSymptoms: ['rapid heartbeat', 'sweating', 'trembling', 'racing thoughts']
        },
        severity: 'mild-moderate',
        remedies: [
            {
                name: 'Deep Breathing (Box Breathing)',
                description: 'Calms nervous system',
                ingredients: [],
                method: 'Inhale 4s, Hold 4s, Exhale 4s, Hold 4s.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Grounding Technique (5-4-3-2-1)',
                description: 'Returns focus to present',
                ingredients: [],
                method: 'Identify 5 things you see, 4 feel, 3 hear, 2 smell, 1 taste.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ashwagandha',
                description: 'Reduces cortisol (stress hormone)',
                ingredients: ['Ashwagandha powder', 'Warm milk'],
                method: 'Drink warm milk with ashwagandha at night.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Brahmi',
                description: 'Enhances cognitive calmness',
                ingredients: ['Brahmi supplement/tea'],
                method: 'Daily consumption.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Chamomile Tea',
                description: 'Mild sedative effect',
                ingredients: ['Chamomile tea'],
                method: 'Drink warm.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Meditation',
                description: 'Mindfulness practice',
                duration: '10-20 mins',
                frequency: 'Daily'
            }
        ],
        warnings: ['Limit caffeine/alcohol', 'Get enough sleep'],
        seekHelp: 'If anxiety interferes with daily life or panic attacks are frequent'
    },
    panic_attack: {
        id: 'panic_attack',
        name: 'Panic Attack',
        description: 'Sudden episode of intense fear and physical reactions',
        matchCriteria: {
            locations: ['chest', 'body', 'head'],
            types: ['terrified', 'dying', 'tight', 'dizzy'],
            triggers: ['phobia', 'stress', 'unknown'],
            specialSymptoms: ['chest pain', 'shortness of breath', 'doom sensation', 'numbness']
        },
        severity: 'moderate-severe',
        remedies: [
            {
                name: 'Controlled Breathing',
                description: 'Hyperventilation control',
                ingredients: [],
                method: 'Breathe slowly into a paper bag or cupped hands.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Cold Water Shock',
                description: 'Resets vagus nerve',
                ingredients: ['Ice water'],
                method: 'Splash ice cold water on face/wrists.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Deep Belly Breathing (Pranayama)',
                description: 'Regulates system',
                ingredients: [],
                method: 'Long deep inhales into belly.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [],
        warnings: ['Remember: It will pass', 'You are not dying'],
        seekHelp: 'If chest pain is new/uncertain (rule out heart attack)'
    },
    mild_depression: {
        id: 'mild_depression',
        name: 'Mild Depression / Low Mood',
        description: 'Persistent feeling of sadness and loss of interest',
        matchCriteria: {
            locations: ['mind', 'body'],
            types: ['sad', 'empty', 'hopeless', 'tired'],
            triggers: ['loss', 'stress', 'chemical imbalance', 'winter'],
            specialSymptoms: ['loss of interest', 'sleep changes', 'appetite changes', 'low energy']
        },
        severity: 'moderate',
        remedies: [
            {
                name: 'Routine and Structure',
                description: 'Provides stability',
                ingredients: [],
                method: 'Keep a regular schedule.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Sunlight Exposure',
                description: 'Boosts serotonin',
                ingredients: [],
                method: 'Get morning sunlight for 15-30 mins.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Saffron (Kesar) Milk',
                description: 'Mood elevator',
                ingredients: ['Saffron strands', 'Warm milk'],
                method: 'Add pinch of saffron to milk.',
                videoUrl: null,
                videoTitle: null
            },
            {
                name: 'Yoga and Pranayama',
                description: 'Mind-body connection',
                ingredients: [],
                method: 'Practice Surya Namaskar.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Aerobic Exercise',
                description: 'Releases endorphins',
                duration: '30 mins',
                frequency: 'Daily'
            }
        ],
        warnings: ['Avoid isolation', 'Avoid alcohol'],
        seekHelp: 'If thoughts of self-harm or suicide (Emergency!)'
    },

    ocd: {
        id: 'ocd',
        name: 'OCD (Obsessive-Compulsive Disorder)',
        description: 'Unwanted repetitive thoughts (obsessions) and/or behaviors (compulsions).',
        matchCriteria: {
            locations: ['mind'],
            types: ['intrusive', 'repetitive', 'anxious'],
            triggers: ['stress', 'uncertainty', 'contamination fears'],
            specialSymptoms: ['intrusive thoughts', 'compulsive behaviors', 'excessive cleaning', 'checking repeatedly', 'need for symmetry']
        },
        severity: 'moderate-severe',
        prevalence: 'uncommon',
        remedies: [
            {
                name: 'Exposure and Response Prevention (ERP)',
                description: 'Gold standard therapy.',
                ingredients: [],
                method: 'Requires trained therapist. Gradually face fears without compulsions.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Brahmi and Ashwagandha',
                description: 'Calms nervous system.',
                ingredients: ['Brahmi', 'Ashwagandha'],
                method: 'Take as supplement (supportive, not cure).',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Mindfulness Meditation',
                description: 'Observe thoughts without acting.',
                duration: '15-20 mins',
                frequency: 'Daily'
            }
        ],
        warnings: ['Compulsions provide temporary relief but worsen OCD long-term.'],
        seekHelp: 'Professional therapy is essential for OCD management.'
    },

    ptsd: {
        id: 'ptsd',
        name: 'PTSD (Post-Traumatic Stress Disorder)',
        description: 'Mental health condition triggered by experiencing or witnessing a traumatic event.',
        matchCriteria: {
            locations: ['mind', 'body'],
            types: ['flashbacks', 'nightmares', 'anxious', 'numb'],
            triggers: ['trauma reminder', 'loud noises', 'stress'],
            specialSymptoms: ['flashbacks', 'nightmares', 'avoidance', 'hypervigilance', 'emotional numbness']
        },
        severity: 'severe',
        prevalence: 'uncommon',
        remedies: [
            {
                name: 'Grounding Techniques',
                description: 'During flashbacks.',
                ingredients: [],
                method: '5-4-3-2-1 technique. Focus on present sensations.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Jatamansi',
                description: 'Ayurvedic nervine.',
                ingredients: ['Jatamansi powder'],
                method: 'Take before bed for sleep support.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Yoga (Trauma-Sensitive)',
                description: 'Body-based healing.',
                duration: '30 mins',
                frequency: 'As tolerated'
            }
        ],
        warnings: ['Avoid self-medicating with alcohol.', 'Seek support groups.'],
        seekHelp: 'Professional trauma therapy (EMDR, CBT) is highly recommended.'
    },

    burnout: {
        id: 'burnout',
        name: 'Burnout',
        description: 'State of chronic stress leading to physical and emotional exhaustion.',
        matchCriteria: {
            locations: ['mind', 'body'],
            types: ['exhausted', 'detached', 'ineffective'],
            triggers: ['overwork', 'lack of control', 'unfair treatment', 'unclear expectations'],
            specialSymptoms: ['chronic fatigue', 'cynicism', 'reduced performance', 'detachment', 'physical symptoms']
        },
        severity: 'moderate',
        prevalence: 'common',
        remedies: [
            {
                name: 'Set Boundaries',
                description: 'Protect personal time.',
                ingredients: [],
                method: 'Learn to say no. Define work hours.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        indianHomeRemedies: [
            {
                name: 'Ashwagandha',
                description: 'Adaptogen for stress.',
                ingredients: ['Ashwagandha powder', 'Milk'],
                method: 'Take daily.',
                videoUrl: null,
                videoTitle: null
            }
        ],
        exercises: [
            {
                name: 'Nature Walks',
                description: 'Restorative.',
                duration: '30 mins',
                frequency: 'Daily'
            }
        ],
        warnings: ['Burnout is not laziness.', 'Rest is productive.'],
        seekHelp: 'If affecting physical health or relationships.'
    }
};
