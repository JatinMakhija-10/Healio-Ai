/**
 * Prakriti Questionnaire Data
 * 
 * 60-question comprehensive assessment for determining birth constitution
 * Based on classical Ayurvedic texts and modern validation studies
 * 
 * Categories:
 * 1. Physical Characteristics (unchangeable) - 20 questions
 * 2. Digestive & Metabolic Patterns - 15 questions
 * 3. Mental & Emotional Traits - 15 questions
 * 4. Sleep & Energy Patterns - 10 questions
 */

export interface PrakritiQuestion {
    id: string;
    category: 'physical' | 'digestive' | 'mental' | 'sleep' | 'lifestyle';
    question: string;
    subtext?: string;
    options: {
        text: string;
        dosha: 'vata' | 'pitta' | 'kapha';
        weight: number; // Clinical importance: 1-5
    }[];
    clinicalNote?: string;
}

/**
 * 60-Question Prakriti Assessment
 * Focus: UNCHANGEABLE characteristics since birth
 */
export const PRAKRITI_QUESTIONS: PrakritiQuestion[] = [
    // ============== PHYSICAL CHARACTERISTICS (20 questions) ==============
    {
        id: 'P1',
        category: 'physical',
        question: 'What is your natural body frame since adolescence?',
        subtext: 'Consider your build when at a healthy weight',
        options: [
            { text: 'Thin, light, hard to gain weight', dosha: 'vata', weight: 5 },
            { text: 'Medium, muscular, athletic', dosha: 'pitta', weight: 5 },
            { text: 'Large, solid, tendency to gain weight', dosha: 'kapha', weight: 5 }
        ],
        clinicalNote: 'Body frame is one of the most reliable Prakriti indicators'
    },
    {
        id: 'P2',
        category: 'physical',
        question: 'Describe your natural skin type (without products)',
        options: [
            { text: 'Dry, rough, thin, cool to touch', dosha: 'vata', weight: 4 },
            { text: 'Warm, oily, prone to redness/inflammation', dosha: 'pitta', weight: 4 },
            { text: 'Thick, smooth, moist, cool, pale', dosha: 'kapha', weight: 4 }
        ]
    },
    {
        id: 'P3',
        category: 'physical',
        question: 'What is your natural hair texture?',
        options: [
            { text: 'Dry, kinky, brittle, thin', dosha: 'vata', weight: 3 },
            { text: 'Fine, oily, early graying/balding', dosha: 'pitta', weight: 3 },
            { text: 'Thick, lustrous, oily, strong, wavy', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'P4',
        category: 'physical',
        question: 'Describe your eyes naturally',
        options: [
            { text: 'Small, dry, active, dark brown/black', dosha: 'vata', weight: 2 },
            { text: 'Medium, penetrating, light sensitive, green/gray/hazel', dosha: 'pitta', weight: 2 },
            { text: 'Large, moist, calm, blue/brown', dosha: 'kapha', weight: 2 }
        ]
    },
    {
        id: 'P5',
        category: 'physical',
        question: 'What are your teeth like?',
        options: [
            { text: 'Irregular, protruding, thin gums, cracks easily', dosha: 'vata', weight: 2 },
            { text: 'Medium, yellowish, bleeding gums', dosha: 'pitta', weight: 2 },
            { text: 'Strong, white, healthy gums', dosha: 'kapha', weight: 2 }
        ]
    },
    {
        id: 'P6',
        category: 'physical',
        question: 'How are your joints naturally?',
        options: [
            { text: 'Prominent, cracking sounds, thin, flexible', dosha: 'vata', weight: 4 },
            { text: 'Medium, loose, flexible', dosha: 'pitta', weight: 3 },
            { text: 'Large, well-formed, padded, stable', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'P7',
        category: 'physical',
        question: 'What is your natural body temperature preference?',
        options: [
            { text: 'Always cold, love warmth, hate wind/cold', dosha: 'vata', weight: 4 },
            { text: 'Run warm/hot, prefer cool/cold, hate heat', dosha: 'pitta', weight: 4 },
            { text: 'Adaptable, dislike cold-damp weather', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'P8',
        category: 'physical',
        question: 'How do you sweat naturally?',
        options: [
            { text: 'Scanty, only with extreme heat/exercise', dosha: 'vata', weight: 2 },
            { text: 'Profuse, even with mild exertion, strong odor', dosha: 'pitta', weight: 3 },
            { text: 'Moderate, pleasant odor', dosha: 'kapha', weight: 2 }
        ]
    },
    {
        id: 'P9',
        category: 'physical',
        question: 'Describe your natural voice',
        options: [
            { text: 'Weak, low, hoarse, cracks easily', dosha: 'vata', weight: 2 },
            { text: 'Sharp, penetrating, clear, argumentative tone', dosha: 'pitta', weight: 2 },
            { text: 'Deep, melodious, pleasant, slow speech', dosha: 'kapha', weight: 2 }
        ]
    },
    {
        id: 'P10',
        category: 'physical',
        question: 'What is your natural walking pace?',
        options: [
            { text: 'Quick, light, irregular, restless', dosha: 'vata', weight: 2 },
            { text: 'Moderate, purposeful, determined', dosha: 'pitta', weight: 2 },
            { text: 'Slow, steady, graceful', dosha: 'kapha', weight: 2 }
        ]
    },
    {
        id: 'P11',
        category: 'physical',
        question: 'How is your physical endurance?',
        options: [
            { text: 'Low stamina, quick bursts, tire easily, inconsistent', dosha: 'vata', weight: 3 },
            { text: 'Moderate stamina, competitive drive', dosha: 'pitta', weight: 3 },
            { text: 'High endurance, slow and steady, strong', dosha: 'kapha', weight: 4 }
        ]
    },
    {
        id: 'P12',
        category: 'physical',
        question: 'What is your natural muscle tone?',
        options: [
            { text: 'Low muscle mass, lean, veins/tendons visible', dosha: 'vata', weight: 3 },
            { text: 'Medium, well-defined, athletic', dosha: 'pitta', weight: 3 },
            { text: 'Solid, well-developed, strong', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'P13',
        category: 'physical',
        question: 'How do your hands and feet tend to be?',
        options: [
            { text: 'Small, thin, dry, cold, rough', dosha: 'vata', weight: 2 },
            { text: 'Medium, warm, pink, moist', dosha: 'pitta', weight: 2 },
            { text: 'Large, thick, firm, cool, smooth', dosha: 'kapha', weight: 2 }
        ]
    },
    {
        id: 'P14',
        category: 'physical',
        question: 'What are your fingernails like?',
        options: [
            { text: 'Dry, brittle, break easily, rough', dosha: 'vata', weight: 1 },
            { text: 'Soft, pink, lustrous, flexible', dosha: 'pitta', weight: 1 },
            { text: 'Thick, strong, smooth, shiny, pale', dosha: 'kapha', weight: 1 }
        ]
    },
    {
        id: 'P15',
        category: 'physical',
        question: 'How is your facial bone structure?',
        options: [
            { text: 'Angular, thin face, prominent bones', dosha: 'vata', weight: 3 },
            { text: 'Heart-shaped or triangular, well-defined features', dosha: 'pitta', weight: 3 },
            { text: 'Round, full, smooth contours', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'P16',
        category: 'physical',
        question: 'What is your natural circulation like?',
        options: [
            { text: 'Poor, cold extremities, irregular pulse', dosha: 'vata', weight: 3 },
            { text: 'Good, warm body, strong pulse', dosha: 'pitta', weight: 2 },
            { text: 'Moderate, steady, slow pulse', dosha: 'kapha', weight: 2 }
        ]
    },
    {
        id: 'P17',
        category: 'physical',
        question: 'How quickly do you generally move and act?',
        options: [
            { text: 'Very quick, restless, can\'t sit still', dosha: 'vata', weight: 3 },
            { text: 'Moderate speed, focused, efficient', dosha: 'pitta', weight: 2 },
            { text: 'Slow, methodical, unhurried', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'P18',
        category: 'physical',
        question: 'Describe your natural flexibility',
        options: [
            { text: 'Very flexible, hypermobile joints', dosha: 'vata', weight: 3 },
            { text: 'Moderate flexibility', dosha: 'pitta', weight: 2 },
            { text: 'Stiff, less flexible, solid', dosha: 'kapha', weight: 2 }
        ]
    },
    {
        id: 'P19',
        category: 'physical',
        question: 'What is your typical urine output?',
        options: [
            { text: 'Scanty, yellowish', dosha: 'vata', weight: 1 },
            { text: 'Profuse, yellowish', dosha: 'pitta', weight: 1 },
            { text: 'Moderate, whitish', dosha: 'kapha', weight: 1 }
        ]
    },
    {
        id: 'P20',
        category: 'physical',
        question: 'How is your sense of smell?',
        options: [
            { text: 'Variable, often diminished', dosha: 'vata', weight: 1 },
            { text: 'Sharp, sensitive', dosha: 'pitta', weight: 1 },
            { text: 'Moderate but enjoys aromas', dosha: 'kapha', weight: 1 }
        ]
    },

    // ============== DIGESTIVE & METABOLIC PATTERNS (15 questions) ==============
    {
        id: 'D1',
        category: 'digestive',
        question: 'What is your natural appetite pattern since childhood?',
        subtext: 'Think about your tendency, not current state',
        options: [
            { text: 'Variable/irregular - sometimes hungry, sometimes not', dosha: 'vata', weight: 5 },
            { text: 'Strong/regular - get "hangry" if meals delayed', dosha: 'pitta', weight: 5 },
            { text: 'Low/steady - can easily skip meals', dosha: 'kapha', weight: 5 }
        ],
        clinicalNote: 'Appetite pattern is highly diagnostic for Prakriti'
    },
    {
        id: 'D2',
        category: 'digestive',
        question: 'How quickly do you naturally digest food?',
        options: [
            { text: 'Variable - sometimes fast, sometimes sluggish', dosha: 'vata', weight: 4 },
            { text: 'Quick - digest rapidly, get hungry soon', dosha: 'pitta', weight: 4 },
            { text: 'Slow - feel full for long time', dosha: 'kapha', weight: 4 }
        ]
    },
    {
        id: 'D3',
        category: 'digestive',
        question: 'What food quantities do you naturally prefer?',
        options: [
            { text: 'Small, frequent meals', dosha: 'vata', weight: 3 },
            { text: 'Large meals, can eat a lot', dosha: 'pitta', weight: 3 },
            { text: 'Moderate meals, feel uncomfortable with too much', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'D4',
        category: 'digestive',
        question: 'What is your natural thirst level?',
        options: [
            { text: 'Variable, often forget to drink', dosha: 'vata', weight: 2 },
            { text: 'High, drink frequently', dosha: 'pitta', weight: 3 },
            { text: 'Low, can go long without water', dosha: 'kapha', weight: 2 }
        ]
    },
    {
        id: 'D5',
        category: 'digestive',
        question: 'What food temperatures do you naturally crave?',
        options: [
            { text: 'Warm/hot foods, dislike cold', dosha: 'vata', weight: 3 },
            { text: 'Cool/cold foods and drinks', dosha: 'pitta', weight: 3 },
            { text: 'Moderate temperature', dosha: 'kapha', weight: 2 }
        ]
    },
    {
        id: 'D6',
        category: 'digestive',
        question: 'What tastes do you naturally gravitate toward?',
        options: [
            { text: 'Sweet, sour, salty - comforting foods', dosha: 'vata', weight: 2 },
            { text: 'Sweet, bitter, astringent - cooling foods', dosha: 'pitta', weight: 2 },
            { text: 'Pungent, bitter, astringent - stimulating foods', dosha: 'kapha', weight: 2 }
        ]
    },
    {
        id: 'D7',
        category: 'digestive',
        question: 'How is your natural bowel movement pattern?',
        options: [
            { text: 'Irregular, tendency to constipation, dry/hard stools', dosha: 'vata', weight: 4 },
            { text: 'Regular, 2-3 times daily, loose/soft stools', dosha: 'pitta', weight: 4 },
            { text: 'Heavy, once daily or less, well-formed', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'D8',
        category: 'digestive',
        question: 'How do you tend to gain or lose weight?',
        options: [
            { text: 'Hard to gain, lose easily', dosha: 'vata', weight: 5 },
            { text: 'Moderate, weight fluctuates with stress/diet', dosha: 'pitta', weight: 3 },
            { text: 'Gain easily, lose with great difficulty', dosha: 'kapha', weight: 5 }
        ]
    },
    {
        id: 'D9',
        category: 'digestive',
        question: 'How do you feel after eating a large meal?',
        options: [
            { text: 'Bloated, gassy, uncomfortable', dosha: 'vata', weight: 3 },
            { text: 'Warm, possibly acidic or burning', dosha: 'pitta', weight: 3 },
            { text: 'Heavy, lethargic, sleepy', dosha: 'kapha', weight: 4 }
        ]
    },
    {
        id: 'D10',
        category: 'digestive',
        question: 'What is your natural eating speed?',
        options: [
            { text: 'Quick, eat on the go, irregular times', dosha: 'vata', weight: 2 },
            { text: 'Moderate, focused, enjoy food intensely', dosha: 'pitta', weight: 2 },
            { text: 'Slow, savor food, relaxed', dosha: 'kapha', weight: 2 }
        ]
    },
    {
        id: 'D11',
        category: 'digestive',
        question: 'How sensitive is your stomach to different foods?',
        options: [
            { text: 'Very sensitive, many foods cause gas/bloating', dosha: 'vata', weight: 3 },
            { text: 'Sensitive to spicy/acidic foods', dosha: 'pitta', weight: 3 },
            { text: 'Can digest most foods well', dosha: 'kapha', weight: 2 }
        ]
    },
    {
        id: 'D12',
        category: 'digestive',
        question: 'What is your metabolism rate naturally?',
        options: [
            { text: 'High but irregular', dosha: 'vata', weight: 3 },
            { text: 'Strong and fast', dosha: 'pitta', weight: 4 },
            { text: 'Slow and steady', dosha: 'kapha', weight: 4 }
        ]
    },
    {
        id: 'D13',
        category: 'digestive',
        question: 'How do you handle skipping a meal?',
        options: [
            { text: 'Spacey, anxious, weak, unfocused', dosha: 'vata', weight: 3 },
            { text: 'Irritable, "hangry", headache', dosha: 'pitta', weight: 4 },
            { text: 'Fine, no problem', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'D14',
        category: 'digestive',
        question: 'What is your natural relationship with food?',
        options: [
            { text: 'Often forget to eat, irregular', dosha: 'vata', weight: 3 },
            { text: 'Food is very important, plan meals', dosha: 'pitta', weight: 2 },
            { text: 'Love food, emotional eating tendency', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'D15',
        category: 'digestive',
        question: 'How is your sense of taste?',
        options: [
            { text: 'Changeable, inconsistent', dosha: 'vata', weight: 1 },
            { text: 'Sharp, distinguish flavors well', dosha: 'pitta', weight: 2 },
            { text: 'Loves sweet/rich flavors', dosha: 'kapha', weight: 1 }
        ]
    },

    // ============== MENTAL & EMOTIONAL TRAITS (15 questions) ==============
    {
        id: 'M1',
        category: 'mental',
        question: 'How would you describe your natural thinking style?',
        subtext: 'Your lifelong pattern, not current state',
        options: [
            { text: 'Quick, creative, restless, many ideas', dosha: 'vata', weight: 5 },
            { text: 'Sharp, analytical, focused, critical', dosha: 'pitta', weight: 5 },
            { text: 'Slow, methodical, steady, thorough', dosha: 'kapha', weight: 5 }
        ],
        clinicalNote: 'Mental patterns are highly stable Prakriti indicators'
    },
    {
        id: 'M2',
        category: 'mental',
        question: 'How do you typically learn new things?',
        options: [
            { text: 'Quick to grasp but forget easily', dosha: 'vata', weight: 5 },
            { text: 'Sharp intelligence, good recall, precise', dosha: 'pitta', weight: 4 },
            { text: 'Slow to learn but never forget', dosha: 'kapha', weight: 5 }
        ]
    },
    {
        id: 'M3',
        category: 'mental',
        question: 'What is your natural emotional response under stress?',
        options: [
            { text: 'Anxiety, worry, fear, overwhelm', dosha: 'vata', weight: 5 },
            { text: 'Anger, frustration, impatience, criticism', dosha: 'pitta', weight: 5 },
            { text: 'Withdrawal, sadness, attachment, denial', dosha: 'kapha', weight: 5 }
        ]
    },
    {
        id: 'M4',
        category: 'mental',
        question: 'How is your memory naturally?',
        options: [
            { text: 'Poor long-term, good short-term, forgetful', dosha: 'vata', weight: 4 },
            { text: 'Sharp, clear, accurate recall', dosha: 'pitta', weight: 4 },
            { text: 'Excellent long-term, slow recall', dosha: 'kapha', weight: 4 }
        ]
    },
    {
        id: 'M5',
        category: 'mental',
        question: 'How do you make decisions typically?',
        options: [
            { text: 'Quickly, impulsively, change mind often', dosha: 'vata', weight: 4 },
            { text: 'Decisively, confidently, stick to it', dosha: 'pitta', weight: 4 },
            { text: 'Slowly, deliberately, resist change', dosha: 'kapha', weight: 4 }
        ]
    },
    {
        id: 'M6',
        category: 'mental',
        question: 'What is your natural communication style?',
        options: [
            { text: 'Talkative, scattered, fast speech', dosha: 'vata', weight: 3 },
            { text: 'Articulate, precise, persuasive, debater', dosha: 'pitta', weight: 3 },
            { text: 'Quiet, thoughtful, good listener', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'M7',
        category: 'mental',
        question: 'How do you handle change and new situations?',
        options: [
            { text: 'Love change, thrive on variety, adaptable', dosha: 'vata', weight: 4 },
            { text: 'Welcome challenge, want to lead/fix it', dosha: 'pitta', weight: 3 },
            { text: 'Resist change, prefer routine and stability', dosha: 'kapha', weight: 4 }
        ]
    },
    {
        id: 'M8',
        category: 'mental',
        question: 'What is your natural work/study style?',
        options: [
            { text: 'Creative bursts, multitask, inconsistent', dosha: 'vata', weight: 3 },
            { text: 'Intense focus, competitive, perfectionist', dosha: 'pitta', weight: 4 },
            { text: 'Steady, patient, methodical, complete tasks', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'M9',
        category: 'mental',
        question: 'How do you handle conflict typically?',
        options: [
            { text: 'Avoid, run away, anxiety', dosha: 'vata', weight: 3 },
            { text: 'Confront directly, argue, competitively', dosha: 'pitta', weight: 4 },
            { text: 'Withdraw, hold grudges, passive', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'M10',
        category: 'mental',
        question: 'What is your natural spending pattern with money?',
        options: [
            { text: 'Impulsive, spend quickly on whims', dosha: 'vata', weight: 3 },
            { text: 'Plan spending, invest wisely, generous', dosha: 'pitta', weight: 2 },
            { text: 'Save, reluctant to spend, accumulate', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'M11',
        category: 'mental',
        question: 'How is your natural creativity?',
        options: [
            { text: 'Highly creative, artistic, imaginative', dosha: 'vata', weight: 4 },
            { text: 'Inventive, problem-solver, strategic', dosha: 'pitta', weight: 3 },
            { text: 'Practical creativity, builds on tradition', dosha: 'kapha', weight: 2 }
        ]
    },
    {
        id: 'M12',
        category: 'mental',
        question: 'What is your natural attention span?',
        options: [
            { text: 'Short, easily distracted, mind wanders', dosha: 'vata', weight: 4 },
            { text: 'Good when interested, otherwise impatient', dosha: 'pitta', weight: 3 },
            { text: 'Long, can focus for extended periods', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'M13',
        category: 'mental',
        question: 'How would you describe your faith/spirituality tendency?',
        options: [
            { text: 'Variable, explore many paths, mystical', dosha: 'vata', weight: 2 },
            { text: 'Logical, questioning, need proof', dosha: 'pitta', weight: 2 },
            { text: 'Steady, traditional, devoted, loyal', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'M14',
        category: 'mental',
        question: 'What is your imagination like?',
        options: [
            { text: 'Very active, vivid, dreamlike', dosha: 'vata', weight: 3 },
            { text: 'Practical, focused on goals', dosha: 'pitta', weight: 2 },
            { text: 'Mildly active, realistic', dosha: 'kapha', weight: 1 }
        ]
    },
    {
        id: 'M15',
        category: 'mental',
        question: 'How do you typically show love/affection?',
        options: [
            { text: 'Words, enthusiasm, changeable', dosha: 'vata', weight: 2 },
            { text: 'Actions, protectiveness, passion', dosha: 'pitta', weight: 2 },
            { text: 'Loyalty, nurturing, stable presence', dosha: 'kapha', weight: 3 }
        ]
    },

    // ============== SLEEP & ENERGY PATTERNS (10 questions) ==============
    {
        id: 'S1',
        category: 'sleep',
        question: 'What is your natural sleep pattern since childhood?',
        subtext: 'How you sleep when unaffected by stress',
        options: [
            { text: 'Light, interrupted, wake frequently, trouble falling asleep', dosha: 'vata', weight: 5 },
            { text: 'Moderate, sound, wake refreshed', dosha: 'pitta', weight: 4 },
            { text: 'Deep, heavy, hard to wake, need 8+ hours', dosha: 'kapha', weight: 5 }
        ],
        clinicalNote: 'Sleep quality is a stable Prakriti indicator'
    },
    {
        id: 'S2',
        category: 'sleep',
        question: 'How much sleep do you naturally need to feel rested?',
        options: [
            { text: 'Variable, 5-7 hours, inconsistent', dosha: 'vata', weight: 3 },
            { text: '6-8 hours, regular pattern', dosha: 'pitta', weight: 3 },
            { text: '8-10 hours, love sleeping', dosha: 'kapha', weight: 4 }
        ]
    },
    {
        id: 'S3',
        category: 'sleep',
        question: 'What are your dreams typically like?',
        options: [
            { text: 'Active, anxious, flying, running, fearful', dosha: 'vata', weight: 3 },
            { text: 'Colorful, intense, passionate, fighting, achieving', dosha: 'pitta', weight: 3 },
            { text: 'Romantic, watery, sentimental, few dreams', dosha: 'kapha', weight: 2 }
        ]
    },
    {
        id: 'S4',
        category: 'sleep',
        question: 'What is your natural energy level throughout the day?',
        options: [
            { text: 'Variable, energy comes in bursts, crashes', dosha: 'vata', weight: 4 },
            { text: 'Consistent, strong, purposeful', dosha: 'pitta', weight: 3 },
            { text: 'Slow start, steady, dips after meals', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'S5',
        category: 'sleep',
        question: 'How easily do you fall asleep at night?',
        options: [
            { text: 'Difficulty, mind races, takes long time', dosha: 'vata', weight: 4 },
            { text: 'Moderate, can take time if stressed', dosha: 'pitta', weight: 2 },
            { text: 'Easily, fall asleep quickly', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'S6',
        category: 'sleep',
        question: 'What is your natural waking pattern?',
        options: [
            { text: 'Early riser, but tired', dosha: 'vata', weight: 2 },
            { text: 'Wake easily, alert quickly', dosha: 'pitta', weight: 3 },
            { text: 'Hard to wake, groggy, need alarm', dosha: 'kapha', weight: 4 }
        ]
    },
    {
        id: 'S7',
        category: 'sleep',
        question: 'How do you feel after a nap?',
        options: [
            { text: 'Rarely nap, feel disoriented if I do', dosha: 'vata', weight: 2 },
            { text: 'Short naps refresh me', dosha: 'pitta', weight: 2 },
            { text: 'Love long naps, wake foggy', dosha: 'kapha', weight: 3 }
        ]
    },
    {
        id: 'S8',
        category: 'sleep',
        question: 'What time of day do you feel most energetic?',
        options: [
            { text: 'Evening, night owl', dosha: 'vata', weight: 2 },
            { text: 'Midday, peak performance', dosha: 'pitta', weight: 3 },
            { text: 'Morning, after slow start', dosha: 'kapha', weight: 2 }
        ]
    },
    {
        id: 'S9',
        category: 'sleep',
        question: 'How do you recover from physical exertion?',
        options: [
            { text: 'Slowly, get exhausted easily, need rest', dosha: 'vata', weight: 3 },
            { text: 'Quickly, bounce back, ready for more', dosha: 'pitta', weight: 3 },
            { text: 'Moderately, steady recovery', dosha: 'kapha', weight: 2 }
        ]
    },
    {
        id: 'S10',
        category: 'sleep',
        question: 'What is your natural activity preference?',
        options: [
            { text: 'Short bursts, variety, need frequent breaks', dosha: 'vata', weight: 2 },
            { text: 'Intense activity, competitive sports, challenges', dosha: 'pitta', weight: 3 },
            { text: 'Steady, endurance activities, relaxed pace', dosha: 'kapha', weight: 3 }
        ]
    }
];

/**
 * Question categories for organized display
 */
export const QUESTION_CATEGORIES = {
    physical: {
        name: 'Physical Characteristics',
        description: 'Your unchangeable body characteristics since birth',
        questionCount: 20
    },
    digestive: {
        name: 'Digestive & Metabolism',
        description: 'Your natural digestive patterns and appetite',
        questionCount: 15
    },
    mental: {
        name: 'Mental & Emotional',
        description: 'Your thinking patterns and emotional tendencies',
        questionCount: 15
    },
    sleep: {
        name: 'Sleep & Energy',
        description: 'Your natural sleep patterns and energy levels',
        questionCount: 10
    }
};

/**
 * Total expected points for each dosha (for confidence calculation)
 */
export const MAX_POINTS_PER_DOSHA = {
    vata: PRAKRITI_QUESTIONS.reduce((sum, q) => sum + Math.max(...q.options.filter(o => o.dosha === 'vata').map(o => o.weight)), 0),
    pitta: PRAKRITI_QUESTIONS.reduce((sum, q) => sum + Math.max(...q.options.filter(o => o.dosha === 'pitta').map(o => o.weight)), 0),
    kapha: PRAKRITI_QUESTIONS.reduce((sum, q) => sum + Math.max(...q.options.filter(o => o.dosha === 'kapha').map(o => o.weight)), 0)
};
