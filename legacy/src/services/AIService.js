/**
 * Healio.AI - AI Service
 * Emotion-aware response generation and pain classification
 */

import { SafetyService } from './SafetyService.js';
import { diagnoseCondition, getGeneralRecommendations } from './ConditionDatabase.js';

// Emotion patterns
const EMOTION_PATTERNS = {
    anxious: {
        keywords: ['worried', 'scared', 'afraid', 'anxious', 'nervous', 'fear', 'panic', 'stress'],
        tone: 'reassuring',
        prefix: "I understand this can feel worrying. Let me help you understand what's happening."
    },
    frustrated: {
        keywords: ['frustrated', 'angry', 'annoyed', 'tired of', 'fed up', 'hopeless', 'giving up'],
        tone: 'validating',
        prefix: "I hear your frustration, and it's completely valid. Dealing with pain is exhausting."
    },
    exhausted: {
        keywords: ['exhausted', 'tired', 'can\'t take', 'overwhelming', 'too much', 'draining'],
        tone: 'supportive',
        prefix: "That sounds exhausting. You've been through a lot. Let's take this one step at a time."
    },
    calm: {
        keywords: [],
        tone: 'clinical',
        prefix: ''
    }
};

// Pain classification categories
const PAIN_CATEGORIES = {
    acute: {
        indicators: ['sudden', 'new', 'just started', 'recent', 'few days'],
        description: 'Recently started pain'
    },
    chronic: {
        indicators: ['months', 'years', 'long time', 'always', 'ongoing', 'persistent'],
        description: 'Long-term pain'
    },
    neuropathic: {
        indicators: ['tingling', 'burning', 'electric', 'pins and needles', 'numbness'],
        description: 'Nerve-related pain'
    },
    musculoskeletal: {
        indicators: ['muscle', 'joint', 'movement', 'activity', 'exercise', 'lifting'],
        description: 'Muscle or joint pain'
    },
    inflammatory: {
        indicators: ['swelling', 'red', 'hot', 'stiff', 'morning', 'arthritis'],
        description: 'Inflammation-related pain'
    }
};

// AI Response templates
const RESPONSE_TEMPLATES = {
    greeting: [
        "Hi there. I'm here to help you understand your pain better.",
        "Hello. I'm glad you're here. Let's work through this together.",
        "Thank you for reaching out. I'm here to listen and guide you."
    ],

    acknowledgment: [
        "Thank you for sharing that with me.",
        "I appreciate you telling me this.",
        "That's helpful to know."
    ],

    empathy: [
        "That sounds really difficult.",
        "I can imagine that's been hard to deal with.",
        "That must be tough to manage."
    ],

    transition: [
        "Let's understand this better.",
        "To help you best, I'd like to ask a few more questions.",
        "This information helps me guide you better."
    ],

    reassurance: [
        "You're doing the right thing by looking into this.",
        "It's good that you're taking this seriously.",
        "You're not overreacting by seeking help."
    ]
};

export class AIService {
    constructor() {
        this.safetyService = new SafetyService();
        this.conversationContext = {
            emotionalState: 'calm',
            painData: {},
            messages: []
        };
    }

    /**
     * Detect emotional state from user input
     */
    detectEmotion(text) {
        const lowerText = text.toLowerCase();

        for (const [emotion, data] of Object.entries(EMOTION_PATTERNS)) {
            if (emotion === 'calm') continue; // Default fallback

            const hasEmotionKeywords = data.keywords.some(keyword =>
                lowerText.includes(keyword)
            );

            if (hasEmotionKeywords) {
                this.conversationContext.emotionalState = emotion;
                return emotion;
            }
        }

        this.conversationContext.emotionalState = 'calm';
        return 'calm';
    }

    /**
     * Classify pain type based on symptoms
     */
    classifyPain(painData) {
        const categories = [];
        const allText = JSON.stringify(painData).toLowerCase();

        for (const [category, data] of Object.entries(PAIN_CATEGORIES)) {
            const hasIndicators = data.indicators.some(indicator =>
                allText.includes(indicator)
            );

            if (hasIndicators) {
                categories.push({
                    type: category,
                    description: data.description
                });
            }
        }

        return categories;
    }

    /**
     * Get random item from array
     */
    getRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * Generate emotion-aware prefix
     */
    getEmotionPrefix() {
        const emotion = this.conversationContext.emotionalState;
        const pattern = EMOTION_PATTERNS[emotion];
        return pattern?.prefix || '';
    }

    /**
     * Generate AI response based on context
     */
    generateResponse(type, customContent = '') {
        const emotion = this.conversationContext.emotionalState;
        let prefix = '';

        // Add emotional acknowledgment if not calm
        if (emotion !== 'calm' && type !== 'greeting') {
            prefix = this.getEmotionPrefix() + ' ';
        }

        // Get template response
        const template = RESPONSE_TEMPLATES[type];
        const baseResponse = template ? this.getRandom(template) : '';

        // Combine prefix + base + custom content
        let response = prefix + baseResponse;
        if (customContent) {
            response = response ? `${response} ${customContent}` : customContent;
        }

        return response.trim();
    }

    /**
     * Check for safety concerns in user input
     */
    checkSafety(text) {
        return this.safetyService.scan(text);
    }

    /**
     * Store pain data in context
     */
    updatePainData(key, value) {
        this.conversationContext.painData[key] = value;
    }

    /**
     * Get current pain data
     */
    getPainData() {
        return this.conversationContext.painData;
    }

    /**
     * Add message to conversation history
     */
    addMessage(role, content) {
        this.conversationContext.messages.push({
            role,
            content,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Generate pain summary for doctor handoff
     */
    generateSummary() {
        const data = this.conversationContext.painData;
        return {
            location: data.location || 'Not specified',
            intensity: data.intensity || { value: 0, label: 'Not specified' },
            frequency: data.frequency || { title: 'Not specified' },
            type: data.type || { label: 'Not specified' },
            duration: data.duration || 'Not specified',
            triggers: data.triggers || 'Not specified',
            classification: this.classifyPain(data),
            emotionalState: this.conversationContext.emotionalState,
            diagnosis: this.diagnose()
        };
    }

    /**
     * Diagnose condition based on collected pain data
     */
    diagnose() {
        const data = this.conversationContext.painData;
        const results = diagnoseCondition(data);

        if (results.length === 0) {
            // Fallback to general recommendations
            return [getGeneralRecommendations(data.location)];
        }

        return results;
    }

    /**
     * Reset conversation context
     */
    reset() {
        this.conversationContext = {
            emotionalState: 'calm',
            painData: {},
            messages: []
        };
        this.safetyService.reset();
    }
}

export { EMOTION_PATTERNS, PAIN_CATEGORIES, RESPONSE_TEMPLATES };

