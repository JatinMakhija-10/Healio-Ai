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
        "I understand this is concerning. ", "It's natural to feel worried. ", "I hear your concern. ",
        "I know this can be stressful. ", "Let me help ease your mind. ", "Your feelings are completely valid. "
    ],
    frustrated: [
        "I appreciate your patience. ", "I know this process can be frustrating. ", "Thank you for bearing with me. ",
        "Let's work through this together. ", "I understand you'd like answers quickly. "
    ],
    urgent: ["", "Let's address this quickly. "],
    calm: ["", "Thank you for sharing that. ", "I appreciate the details. "]
};

const EMPATHY_PREFIXES_HI: Record<EmotionalState, string[]> = {
    anxious: [
        "मैं समझ सकता हूँ कि यह चिंताजनक है। ", "परेशान होना स्वाभाविक है। ", "आपकी चिंता वाजिब है। ",
        "मुझे पता है यह तनावपूर्ण हो सकता है। ", "चलिए मैं आपकी मदद करता हूँ। "
    ],
    frustrated: [
        "आपके धैर्य के लिए धन्यवाद। ", "मुझे पता है यह प्रक्रिया निराशाजनक हो सकती है। ",
        "मेरा साथ देने के लिए धन्यवाद। ", "आइए इसे मिलकर सुलझाएं। "
    ],
    urgent: ["", "चलिए इसे जल्दी ठीक करते हैं। "],
    calm: ["", "जानकारी देने के लिए धन्यवाद। ", "इन बातों को बताने के लिए शुक्रिया। "]
};

const EMPATHY_PREFIXES_HINGLISH: Record<EmotionalState, string[]> = {
    anxious: [
        "Main samajh sakta hu ye concerning hai. ", "Pareshan hona natural hai. ", "Aapki tension main samajh raha hu. ",
        "Mujhe pata hai ye stressful ho sakta hai. ", "Chaliye main help karta hu. "
    ],
    frustrated: [
        "Aapke patience ke liye thanks. ", "Mujhe pata hai ye frustrating ho sakta hai. ",
        "Sath dene ke liye thank you. ", "Aaiye milkar solve karte hain. "
    ],
    urgent: ["", "Chaliye isey jaldi address karte hain. "],
    calm: ["", "Share karne ke liye thank you. ", "Details batane ke liye shukriya. "]
};

// ============================================================================
// EXPLANATION TEMPLATES
// ============================================================================

const QUESTION_EXPLANATIONS: Record<'en' | 'hi' | 'hinglish', Record<string, string>> = {
    en: {
        duration: "This helps me understand if this is an acute or ongoing condition.",
        severity: "Understanding the intensity helps me assess the urgency.",
        location: "The specific location helps narrow down possible causes.",
        symptom: "This symptom is often associated with conditions I'm considering.",
        trigger: "Knowing what triggers or worsens your symptoms helps with diagnosis.",
        associated: "Sometimes symptoms appear together, which points to specific conditions."
    },
    hi: {
        duration: "यह समझने में मदद करता है कि क्या यह नई समस्या है या बहुत पुरानी।",
        severity: "दर्द या समस्या की तीव्रता से गंभीरता का पता चलता है।",
        location: "सही जगह जानने से सही बीमारी का पता लगाने में मदद मिलती है।",
        symptom: "यह लक्षण उन बीमारियों से जुड़ा है जिनके बारे में मैं सोच रहा हूँ।",
        trigger: "यह जानने से बीमारी का पता लगाने में आसानी होती है कि इससे लक्षण क्यों बढ़ जाते हैं।",
        associated: "कभी-कभी कई लक्षण एक साथ आते हैं, जो किसी खास बीमारी का संकेत देते हैं।"
    },
    hinglish: {
        duration: "Isse mujhe pata chalega ki problem nayi hai ya purani.",
        severity: "Intensity janne se urgency samajhne mein help milti hai.",
        location: "Exact jagah pata hone se bimari identify karne mein asani hoti hai.",
        symptom: "Ye symptom un conditions se related hai jo main consider kar raha hu.",
        trigger: "Kya cheez problem badhati hai, ye janne se diagnosis mein help milti hai.",
        associated: "Kabhi kabhi symptoms sath mein aate hain, jo specific condition ki taraf ishara karte hain."
    }
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
        const { emotionalState, turnsCount, detectedLanguage = 'en' } = state.context;

        // 1. Add empathy if user is anxious/frustrated
        let response = '';
        if (emotionalState === 'anxious' || emotionalState === 'frustrated') {
            response = this.addEmpathyPrefix('', emotionalState, detectedLanguage);
        }

        // 2. Add the question
        response += baseQuestion;

        // 3. Add explanation (but not too often - every 2-3 questions)
        if (turnsCount % 3 === 0 || emotionalState === 'anxious') {
            const explanation = this.getQuestionExplanation(questionType, detectedLanguage);
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
        const { emotionalState, communicationPreference, detectedLanguage = 'en' } = state.context;

        // Base response varies by confidence and language
        let response: string = '';

        if (detectedLanguage === 'hi') {
            if (confidence >= 80) {
                response = `आपने जो बताया है उसके आधार पर, आपकी समस्या **${conditionName}** से सबसे अधिक मेल खाती है।`;
            } else if (confidence >= 60) {
                response = `आपके लक्षणों से लगता है कि यह **${conditionName}** हो सकता है, हालाँकि कुछ अन्य संभावनाएँ भी हैं।`;
            } else {
                response = `यह संभावित रूप से **${conditionName}** हो सकता है, लेकिन पक्के निदान के लिए डॉक्टर से बात करना बेहतर होगा।`;
            }
        } else if (detectedLanguage === 'hinglish') {
            if (confidence >= 80) {
                response = `Aapne jo details di hain, uske hisaab se yeh condition **${conditionName}** lag rahi hai.`;
            } else if (confidence >= 60) {
                response = `Aapke symptoms se lagta hai ki yeh **${conditionName}** ho sakta hai, though kuch aur possibilities bhi hain.`;
            } else {
                response = `Yeh shayad **${conditionName}** ho sakta hai, par final diagnosis ke liye doctor ko dikhana best rahega.`;
            }
        } else {
            if (confidence >= 80) {
                response = `Based on what you've told me, your symptoms are most consistent with **${conditionName}**.`;
            } else if (confidence >= 60) {
                response = `Your symptoms suggest this could be **${conditionName}**, though there are other possibilities.`;
            } else {
                response = `This could potentially be **${conditionName}**, but I'd recommend consulting a healthcare provider for a definitive diagnosis.`;
            }
        }

        // Add empathy prefix for anxious users
        if (emotionalState === 'anxious') {
            response = this.addEmpathyPrefix(response, emotionalState, detectedLanguage);
        }

        // Add reassurance
        response += this.generateReassurance(conditionName, confidence, detectedLanguage);

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
    addEmpathyPrefix(text: string, emotion: EmotionalState, language: 'en' | 'hi' | 'hinglish' = 'en'): string {
        if (emotion === 'calm' || emotion === 'urgent') {
            return text;
        }

        const prefixes = language === 'hi' ? EMPATHY_PREFIXES_HI[emotion] :
            language === 'hinglish' ? EMPATHY_PREFIXES_HINGLISH[emotion] :
                EMPATHY_PREFIXES[emotion];

        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        return prefix + text;
    }

    /**
     * Get explanation for why we're asking a question
     */
    private getQuestionExplanation(questionType: string, language: 'en' | 'hi' | 'hinglish' = 'en'): string | null {
        return QUESTION_EXPLANATIONS[language][questionType] || null;
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
    private generateReassurance(conditionName: string, confidence: number, language: 'en' | 'hi' | 'hinglish' = 'en'): string {
        if (language === 'hi') {
            if (confidence >= 70) {
                return "\n\nयाद रखें, यह मूल्यांकन आपके द्वारा दी गई जानकारी पर आधारित है। उचित इलाज के लिए डॉक्टर से बात करें।";
            }
            return "\n\nचूंकि लक्षण स्पष्ट नहीं हैं, मैं आपको डॉक्टर से परामर्श लेने की जोरदार सलाह देता हूँ।";
        } else if (language === 'hinglish') {
            if (confidence >= 70) {
                return "\n\nYaad rakhiye, yeh assessment aapki di hui details par based hai. Proper treatment ke liye kisi doctor ko dikhayein.";
            }
            return "\n\nKyunki symptoms bilkul clear nahi hain, main strongly recommend karunga ki aap kisi doctor ko check karayen.";
        } else {
            if (confidence >= 70) {
                return "\n\nRemember, this assessment is based on the information you've provided. For a definitive diagnosis and treatment plan, please consult with a healthcare professional.";
            }
            return "\n\nGiven the uncertainty, I strongly recommend consulting a healthcare provider who can examine you in person.";
        }
    }

    /**
     * Generate phase-appropriate greeting
     */
    generateGreeting(state: DialogueState): string {
        const language = state.context.detectedLanguage || 'en';

        if (language === 'hi') {
            return "नमस्ते! मैं Healio हूँ, आपका हेल्थ असिस्टेंट। आज मैं आपकी क्या मदद कर सकता हूँ?";
        } else if (language === 'hinglish') {
            return "Hello! Main Healio hu, aapka health assistant. Aaj main aapki kya help kar sakta hu?";
        }

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
        const { emotionalState, detectedLanguage = 'en' } = state.context;

        let conclusion = "";

        if (detectedLanguage === 'hi') {
            conclusion = "यह परामर्श अब पूरा हो गया है। मुझे आशा है कि यह जानकारी आपके लिए मददगार साबित होगी!";
            if (emotionalState === 'anxious') {
                conclusion += " याद रखें, यदि आपको कभी भी संदेह हो या आपके लक्षण बढ़ें, तो डॉक्टर से सलाह लेना सबसे अच्छा है।";
            }
            conclusion += " आप अपनी हिस्ट्री में एक विस्तृत सारांश पा सकते हैं। अपना ख्याल रखें!";
        } else if (detectedLanguage === 'hinglish') {
            conclusion = "Yeh consultation ab complete ho chuka hai. I hope yeh analysis aapke liye helpful rahega!";
            if (emotionalState === 'anxious') {
                conclusion += " Yaad rakhiye, agar aapko kabhi bhi doubt ho ya symptoms badhein, toh doctor se consult karna best hai.";
            }
            conclusion += " Aapko History mein detailed summary mil jayegi. Take care!";
        } else {
            conclusion = "This consultation is now complete. I hope this analysis helps!";
            if (emotionalState === 'anxious') {
                conclusion += " Remember, if you're ever unsure or your symptoms worsen, it's always okay to seek professional medical advice.";
            }
            conclusion += " You can find a detailed summary in your History. Take care!";
        }

        return conclusion;
    }
}

// Export singleton instance
export const responseGenerator = new EmpatheticResponseGenerator();
