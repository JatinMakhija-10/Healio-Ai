/**
 * Healio.AI - Language Selector Component
 */

const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' }
];

export function LanguageSelector(currentLang = 'en', onChange) {
    const containerId = 'language-selector-' + Date.now();

    setTimeout(() => {
        const container = document.getElementById(containerId);
        if (container) {
            attachLanguageHandlers(container, onChange);
        }
    }, 0);

    return `
    <div class="language-selector" id="${containerId}">
      <select class="language-select" id="lang-select">
        ${LANGUAGES.map(lang => `
          <option value="${lang.code}" ${lang.code === currentLang ? 'selected' : ''}>
            ${lang.flag} ${lang.name}
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

function attachLanguageHandlers(container, onChange) {
    const select = container.querySelector('#lang-select');
    if (select) {
        select.addEventListener('change', (e) => {
            if (onChange) {
                onChange(e.target.value);
            }
        });
    }
}

// Translation strings
export const TRANSLATIONS = {
    en: {
        // Home screen
        homeTitle: "Let's understand your pain.",
        homeSubtitle: "I'll ask a few questions and guide you safely. I'm here to support you, not replace a doctor.",
        startButton: "Start Conversation",

        // Chat
        greeting: "Hi there. I'm here to help you understand your pain better. I'll ask you a few questions, and together we'll figure out the best way forward.",
        disclaimer: "Remember, I'm here to support and guide you, not replace a doctor. If anything feels urgent, please seek proper medical care.",

        // Pain intake
        locationQuestion: "First, let's understand where you're experiencing pain.",
        intensityQuestion: "Now, let's understand how intense your pain is right now.",
        frequencyQuestion: "How often does this pain occur?",
        typeQuestion: "How would you describe the sensation of your pain?",
        durationQuestion: "How long have you been experiencing this pain? You can type your answer below.",
        triggersQuestion: "Is there anything that makes your pain better or worse? For example, certain movements, positions, or activities.",

        // Responses
        acknowledgment: "Thank you for sharing that with me.",
        empathyMild: "Thank you for telling me.",
        empathySevere: "I'm sorry you're dealing with that level of pain.",
        transition: "Let's understand this better.",
        reassurance: "You're doing the right thing by looking into this.",

        // Summary
        summaryIntro: "Thank you! Here's a summary of your pain.",
        treatmentPrompt: "Now choose how you'd like to proceed.",

        // Treatment options
        homeRemediesTitle: "Great! Here are some traditional Indian home remedies that may help.",
        medicalAdviceTitle: "Here's some medical advice and exercises that may help.",

        // Labels
        painLocation: "Location",
        painIntensity: "Intensity",
        painFrequency: "Frequency",
        painType: "Type",
        painDuration: "Duration",
        painTriggers: "Triggers",

        // Buttons
        continueBtn: "Continue",
        backBtn: "See Other Options",
        copyBtn: "Copy",
        shareBtn: "Share Summary",
        startOver: "Start Over"
    },
    hi: {
        // Home screen
        homeTitle: "आइए आपके दर्द को समझें।",
        homeSubtitle: "मैं कुछ सवाल पूछूंगा और आपकी मदद करूंगा। मैं डॉक्टर की जगह नहीं हूं।",
        startButton: "शुरू करें",

        // Chat
        greeting: "नमस्ते। मैं आपके दर्द को समझने में आपकी मदद करने के लिए यहां हूं। मैं कुछ सवाल पूछूंगा।",
        disclaimer: "याद रखें, मैं आपका मार्गदर्शन करने के लिए हूं, डॉक्टर की जगह नहीं। अगर कुछ गंभीर लगे, तो तुरंत डॉक्टर से मिलें।",

        // Pain intake
        locationQuestion: "पहले, बताइए कि आपको दर्द कहां हो रहा है।",
        intensityQuestion: "अभी आपका दर्द कितना तेज है?",
        frequencyQuestion: "यह दर्द कितनी बार होता है?",
        typeQuestion: "आपका दर्द कैसा महसूस होता है?",
        durationQuestion: "यह दर्द कब से हो रहा है? नीचे लिखें।",
        triggersQuestion: "क्या कुछ ऐसा है जिससे दर्द बढ़ता या कम होता है?",

        // Responses
        acknowledgment: "बताने के लिए धन्यवाद।",
        empathyMild: "बताने के लिए धन्यवाद।",
        empathySevere: "मुझे दुख है कि आप इतने दर्द में हैं।",
        transition: "चलिए इसे और समझते हैं।",
        reassurance: "आप सही कर रहे हैं कि इसकी जांच कर रहे हैं।",

        // Summary
        summaryIntro: "धन्यवाद! यहां आपके दर्द का सारांश है।",
        treatmentPrompt: "अब चुनें कि आप आगे कैसे बढ़ना चाहते हैं।",

        // Treatment options
        homeRemediesTitle: "बहुत अच्छा! यहां कुछ पारंपरिक भारतीय घरेलू उपचार हैं।",
        medicalAdviceTitle: "यहां कुछ चिकित्सा सलाह और व्यायाम हैं।",

        // Labels
        painLocation: "जगह",
        painIntensity: "तीव्रता",
        painFrequency: "आवृत्ति",
        painType: "प्रकार",
        painDuration: "अवधि",
        painTriggers: "कारण",

        // Buttons
        continueBtn: "आगे बढ़ें",
        backBtn: "अन्य विकल्प देखें",
        copyBtn: "कॉपी करें",
        shareBtn: "सारांश साझा करें",
        startOver: "फिर से शुरू करें"
    }
};

export { LANGUAGES };
