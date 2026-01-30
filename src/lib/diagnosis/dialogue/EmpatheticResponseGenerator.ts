/**
 * Empathetic Response Generator for Healio.AI
 * 
 * Context-aware response generation with:
 * - Empathy injection based on emotional state
 * - Adaptive explanation depth
 * - Tone matching
 * - Question explanations (why we're asking)
 */

import {
    EmotionalState,
    CommunicationStyle,
    DialogueState,
    ConversationPhase
} from './DialogueState';

// ============================================================================
// EMPATHY TEMPLATES
// ============================================================================

const EMPATHY_PREFIXES: Record<EmotionalState, string[]> = {
    anxious: [
        "I understand this is concerning. ",
        "It's natural to feel worried. ",
        "I hear your concern. ",
        "I know this can be stressful. ",
        "Let me help ease your mind. ",
        "Your feelings are completely valid. "
    ],
    frustrated: [
        "I appreciate your patience. ",
        "I know this process can be frustrating. ",
        "Thank you for bearing with me. ",
        "Let's work through this together. ",
        "I understand you'd like answers quickly. "
    ],
    urgent: [
        // No fluff in emergencies - direct and actionable
        "",
        "Let's address this quickly. "
    ],
    calm: [
        "", // Don't add unnecessary padding for calm users
        "Thank you for sharing that. ",
        "I appreciate the details. "
    ]
};

// ============================================================================
// EXPLANATION TEMPLATES
// ============================================================================

const QUESTION_EXPLANATIONS: Record<string, string> = {
    duration: "This helps me understand if this is an acute or ongoing condition.",
    severity: "Understanding the intensity helps me assess the urgency.",
    location: "The specific location helps narrow down possible causes.",
    symptom: "This symptom is often associated with conditions I'm considering.",
    trigger: "Knowing what triggers or worsens your symptoms helps with diagnosis.",
    associated: "Sometimes symptoms appear together, which points to specific conditions.",
    radiation: "Pain that spreads to other areas can indicate certain conditions.",
    timing: "When symptoms occur can reveal important patterns.",
    medication: "Current medications may affect symptoms or diagnosis.",
    history: "Your medical history helps me consider relevant conditions."
};

// ============================================================================
// COMMUNICATION STYLE ADAPTERS
// ============================================================================

interface StyleAdapter {
    simplify: (text: string) => string;
    addDetail: (text: string, detail: string) => string;
}

const STYLE_ADAPTERS: Record<CommunicationStyle, StyleAdapter> = {
    simple: {
        simplify: (text) => text
            .replace(/experiencing/g, 'having')
            .replace(/symptom/g, 'sign')
            .replace(/condition/g, 'problem')
            .replace(/diagnos(is|e)/g, 'finding')
            .replace(/severe/g, 'very bad')
            .replace(/moderate/g, 'medium')
            .replace(/acute/g, 'sudden')
            .replace(/chronic/g, 'long-term'),
        addDetail: (text, _detail) => text // Skip technical details
    },
    layperson: {
        simplify: (text) => text,
        addDetail: (text, detail) => `${text} (${detail})`
    },
    technical: {
        simplify: (text) => text,
        addDetail: (text, detail) => `${text} — ${detail}`
    }
};

// ============================================================================
// RESPONSE GENERATOR CLASS
// ============================================================================

export class EmpatheticResponseGenerator {

    /**
     * Generate an empathetic response based on context
     */
    generate(
        baseResponse: string,
        state: DialogueState
    ): string {
        const { emotionalState, communicationPreference } = state.context;

        // 1. Add empathy prefix based on emotional state
        let response = this.addEmpathyPrefix(baseResponse, emotionalState);

        // 2. Adapt language to communication style
        response = this.adaptStyle(response, communicationPreference);

        // 3. Add reassurance if user is anxious
        if (emotionalState === 'anxious' && state.phase === 'clarification') {
            response = this.addReassurance(response);
        }

        return response;
    }

    /**
     * Generate a clarification question with explanation
     */
    generateQuestion(
        baseQuestion: string,
        questionType: string,
        state: DialogueState
    ): string {
        const { emotionalState, communicationPreference, turnsCount } = state.context;

        // 1. Add empathy if user is anxious/frustrated
        let response = '';
        if (emotionalState === 'anxious' || emotionalState === 'frustrated') {
            response = this.addEmpathyPrefix('', emotionalState);
        }

        // 2. Add the question
        response += baseQuestion;

        // 3. Add explanation (but not too often - every 2-3 questions)
        if (turnsCount % 3 === 0 || emotionalState === 'anxious') {
            const explanation = this.getQuestionExplanation(questionType);
            if (explanation) {
                response += ` ${explanation}`;
            }
        }

        return response;
    }

    /**
     * Generate a diagnosis presentation
     */
    generateDiagnosis(
        conditionName: string,
        confidence: number,
        state: DialogueState
    ): string {
        const { emotionalState, communicationPreference } = state.context;

        // Base response varies by confidence
        let response: string;

        if (confidence >= 80) {
            response = `Based on what you've told me, your symptoms are most consistent with **${conditionName}**.`;
        } else if (confidence >= 60) {
            response = `Your symptoms suggest this could be **${conditionName}**, though there are other possibilities.`;
        } else {
            response = `This could potentially be **${conditionName}**, but I'd recommend consulting a healthcare provider for a definitive diagnosis.`;
        }

        // Add empathy prefix for anxious users
        if (emotionalState === 'anxious') {
            response = this.addEmpathyPrefix(response, emotionalState);
        }

        // Add reassurance
        response += this.generateReassurance(conditionName, confidence);

        return response;
    }

    /**
     * Generate an emergency response
     */
    generateEmergencyResponse(emergencyType: string): string {
        // No empathy fluff in emergencies - be direct
        const responses: Record<string, string> = {
            cardiac: "⚠️ **EMERGENCY**: Your symptoms suggest a possible cardiac event. Please call emergency services (911) immediately or have someone drive you to the nearest emergency room. Do not drive yourself.",

            neurological: "⚠️ **EMERGENCY**: These symptoms could indicate a stroke or serious neurological condition. Time is critical. Please call emergency services (911) immediately.",

            respiratory: "⚠️ **EMERGENCY**: You're describing severe respiratory distress. Please call emergency services (911) immediately. If you have an inhaler or epinephrine, use it now.",

            trauma: "⚠️ **EMERGENCY**: This injury requires immediate medical attention. Do not move the affected area. Call emergency services (911) or go to the emergency room immediately.",

            mental_health_crisis: "🆘 **I'm concerned about you**. Please reach out for support right now:\n\n• **National Suicide Prevention Lifeline**: 988 (call or text)\n• **Crisis Text Line**: Text HOME to 741741\n• **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/\n\nYou don't have to face this alone. These feelings can get better with the right support.",

            default: "⚠️ **URGENT**: Based on what you've described, please seek immediate medical attention. Call emergency services or go to the nearest emergency room."
        };

        return responses[emergencyType] || responses.default;
    }

    /**
     * Add empathy prefix based on emotional state
     */
    private addEmpathyPrefix(text: string, emotion: EmotionalState): string {
        if (emotion === 'calm' || emotion === 'urgent') {
            // Don't add unnecessary words
            return text;
        }

        const prefixes = EMPATHY_PREFIXES[emotion];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        return prefix + text;
    }

    /**
     * Get explanation for why we're asking a question
     */
    private getQuestionExplanation(questionType: string): string | null {
        return QUESTION_EXPLANATIONS[questionType] || null;
    }

    /**
     * Adapt response to communication style
     */
    private adaptStyle(text: string, style: CommunicationStyle): string {
        return STYLE_ADAPTERS[style].simplify(text);
    }

    /**
     * Add reassurance for anxious users
     */
    private addReassurance(text: string): string {
        const reassurances = [
            " I'm here to help you understand what might be going on.",
            " We'll work through this step by step.",
            " The more details you share, the better I can help."
        ];

        return text + reassurances[Math.floor(Math.random() * reassurances.length)];
    }

    /**
     * Generate appropriate reassurance after diagnosis
     */
    private generateReassurance(conditionName: string, confidence: number): string {
        if (confidence >= 70) {
            return "\n\nRemember, this assessment is based on the information you've provided. For a definitive diagnosis and treatment plan, please consult with a healthcare professional.";
        }
        return "\n\nGiven the uncertainty, I strongly recommend consulting a healthcare provider who can examine you in person.";
    }

    /**
     * Generate phase-appropriate greeting
     */
    generateGreeting(state: DialogueState): string {
        const greetings = [
            "Hello! I'm Healio, your health assistant. How can I help you today?",
            "Hi there! I'm here to help you understand your symptoms. What's been bothering you?",
            "Welcome! Tell me what's going on, and I'll help you figure out what might be happening."
        ];

        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    /**
     * Generate conversation conclusion
     */
    generateConclusion(state: DialogueState): string {
        const { emotionalState } = state.context;

        let conclusion = "This consultation is now complete. I hope this analysis helps!";

        if (emotionalState === 'anxious') {
            conclusion += " Remember, if you're ever unsure or your symptoms worsen, it's always okay to seek professional medical advice.";
        }

        conclusion += " You can find a detailed summary in your History. Take care!";

        return conclusion;
    }
}

// Export singleton instance
export const responseGenerator = new EmpatheticResponseGenerator();
