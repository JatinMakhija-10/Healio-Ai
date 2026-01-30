/**
 * Simplified Prakriti Assessment for Onboarding
 * 
 * 12 highest-weighted questions from the full 60-question assessment
 * Focuses on most diagnostic indicators for quick but authentic assessment
 */

import { PrakritiQuestion } from './prakritiQuestionnaire';

/**
 * Top 12 Prakriti questions (weight 4-5) for onboarding
 * Covers all critical categories with highest clinical importance
 */
export const ONBOARDING_PRAKRITI_QUESTIONS: PrakritiQuestion[] = [
    // Physical - Body Frame (weight: 5)
    {
        id: 'P1',
        category: 'physical',
        question: 'What is your natural body frame since adolescence?',
        subtext: 'Consider your build when at a healthy weight',
        options: [
            { text: 'Thin, light, hard to gain weight', dosha: 'vata', weight: 5 },
            { text: 'Medium, muscular, athletic', dosha: 'pitta', weight: 5 },
            { text: 'Large, solid, tendency to gain weight', dosha: 'kapha', weight: 5 }
        ]
    },
    // Physical - Skin (weight: 4)
    {
        id: 'P2',
        category: 'physical',
        question: 'Describe your natural skin type',
        options: [
            { text: 'Dry, rough, thin, cool to touch', dosha: 'vata', weight: 4 },
            { text: 'Warm, oily, prone to redness', dosha: 'pitta', weight: 4 },
            { text: 'Thick, smooth, moist, cool, pale', dosha: 'kapha', weight: 4 }
        ]
    },
    // Physical - Joints (weight: 4)
    {
        id: 'P6',
        category: 'physical',
        question: 'How are your joints naturally?',
        options: [
            { text: 'Prominent, cracking sounds, thin', dosha: 'vata', weight: 4 },
            { text: 'Medium, loose, flexible', dosha: 'pitta', weight: 3 },
            { text: 'Large, well-formed, padded, stable', dosha: 'kapha', weight: 3 }
        ]
    },
    // Physical - Temperature (weight: 4)
    {
        id: 'P7',
        category: 'physical',
        question: 'What is your natural body temperature preference?',
        options: [
            { text: 'Always cold, love warmth, hate wind/cold', dosha: 'vata', weight: 4 },
            { text: 'Run warm/hot, prefer cool, hate heat', dosha: 'pitta', weight: 4 },
            { text: 'Adaptable, dislike cold-damp weather', dosha: 'kapha', weight: 3 }
        ]
    },
    // Digestive - Appetite (weight: 5) - CRITICAL
    {
        id: 'D1',
        category: 'digestive',
        question: 'What is your natural appetite pattern since childhood?',
        subtext: 'Think about your tendency, not current state',
        options: [
            { text: 'Variable/irregular - sometimes hungry, sometimes not', dosha: 'vata', weight: 5 },
            { text: 'Strong/regular - get "hangry" if meals delayed', dosha: 'pitta', weight: 5 },
            { text: 'Low/steady - can easily skip meals', dosha: 'kapha', weight: 5 }
        ]
    },
    // Digestive - Digestion Speed (weight: 4)
    {
        id: 'D2',
        category: 'digestive',
        question: 'How quickly do you naturally digest food?',
        options: [
            { text: 'Variable - sometimes fast, sometimes slow', dosha: 'vata', weight: 4 },
            { text: 'Quick - digest rapidly, hungry soon', dosha: 'pitta', weight: 4 },
            { text: 'Slow - feel full for long time', dosha: 'kapha', weight: 4 }
        ]
    },
    // Digestive - Bowel Pattern (weight: 4)
    {
        id: 'D7',
        category: 'digestive',
        question: 'How is your natural bowel movement pattern?',
        options: [
            { text: 'Irregular, tendency to constipation', dosha: 'vata', weight: 4 },
            { text: 'Regular, 2-3 times daily, loose stools', dosha: 'pitta', weight: 4 },
            { text: 'Heavy, once daily or less, well-formed', dosha: 'kapha', weight: 3 }
        ]
    },
    // Digestive - Weight Tendency (weight: 5) - CRITICAL
    {
        id: 'D8',
        category: 'digestive',
        question: 'How do you tend to gain or lose weight?',
        options: [
            { text: 'Hard to gain, lose easily', dosha: 'vata', weight: 5 },
            { text: 'Moderate, fluctuates with stress/diet', dosha: 'pitta', weight: 3 },
            { text: 'Gain easily, lose with great difficulty', dosha: 'kapha', weight: 5 }
        ]
    },
    // Mental - Thinking Style (weight: 5) - CRITICAL
    {
        id: 'M1',
        category: 'mental',
        question: 'How would you describe your natural thinking style?',
        subtext: 'Your lifelong pattern',
        options: [
            { text: 'Quick, creative, restless, many ideas', dosha: 'vata', weight: 5 },
            { text: 'Sharp, analytical, focused, critical', dosha: 'pitta', weight: 5 },
            { text: 'Slow, methodical, steady, thorough', dosha: 'kapha', weight: 5 }
        ]
    },
    // Mental - Learning (weight: 5) - CRITICAL
    {
        id: 'M2',
        category: 'mental',
        question: 'How do you typically learn new things?',
        options: [
            { text: 'Quick to grasp but forget easily', dosha: 'vata', weight: 5 },
            { text: 'Sharp intelligence, good recall', dosha: 'pitta', weight: 4 },
            { text: 'Slow to learn but never forget', dosha: 'kapha', weight: 5 }
        ]
    },
    // Mental - Emotional Response (weight: 5) - CRITICAL
    {
        id: 'M3',
        category: 'mental',
        question: 'What is your natural emotional response under stress?',
        options: [
            { text: 'Anxiety, worry, fear, overwhelm', dosha: 'vata', weight: 5 },
            { text: 'Anger, frustration, impatience', dosha: 'pitta', weight: 5 },
            { text: 'Withdrawal, sadness, attachment', dosha: 'kapha', weight: 5 }
        ]
    },
    // Sleep - Sleep Pattern (weight: 5) - CRITICAL
    {
        id: 'S1',
        category: 'sleep',
        question: 'What is your natural sleep pattern since childhood?',
        subtext: 'How you sleep when unaffected by stress',
        options: [
            { text: 'Light, interrupted, wake frequently', dosha: 'vata', weight: 5 },
            { text: 'Moderate, sound, wake refreshed', dosha: 'pitta', weight: 4 },
            { text: 'Deep, heavy, hard to wake, need 8+ hours', dosha: 'kapha', weight: 5 }
        ]
    }
];
