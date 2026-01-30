/**
 * Healio.AI - Safety Service
 * Red-flag symptom detection and safety scanning
 */

// Red flag symptoms that require immediate medical attention
const RED_FLAGS = [
    {
        keywords: ['chest pain', 'chest hurts', 'pain in chest', 'heart pain'],
        severity: 'high',
        message: 'Chest pain can be a sign of serious conditions. Please seek medical attention.'
    },
    {
        keywords: ['can\'t move', 'paralysis', 'paralyzed', 'numb', 'numbness', 'can\'t feel'],
        severity: 'high',
        message: 'Numbness or difficulty moving could indicate a serious condition.'
    },
    {
        keywords: ['fever', 'high temperature', 'chills'],
        severity: 'medium',
        message: 'Pain with fever may indicate an infection that needs treatment.'
    },
    {
        keywords: ['sudden', 'worst pain', 'excruciating', 'unbearable', 'worst ever'],
        severity: 'high',
        message: 'Sudden, severe pain may require immediate medical evaluation.'
    },
    {
        keywords: ['accident', 'fall', 'injury', 'trauma', 'hit', 'crash'],
        severity: 'medium',
        message: 'Pain after an injury should be evaluated by a healthcare provider.'
    },
    {
        keywords: ['weight loss', 'losing weight', 'lost weight'],
        severity: 'medium',
        message: 'Unexplained weight loss with pain should be discussed with a doctor.'
    },
    {
        keywords: ['night pain', 'wakes me up', 'can\'t sleep', 'pain at night'],
        severity: 'medium',
        message: 'Pain that wakes you from sleep may need medical evaluation.'
    },
    {
        keywords: ['difficulty breathing', 'can\'t breathe', 'short of breath', 'breathing problem'],
        severity: 'high',
        message: 'Difficulty breathing requires immediate medical attention.'
    },
    {
        keywords: ['vision', 'can\'t see', 'blurry', 'headache'],
        severity: 'medium',
        message: 'Visual changes with pain should be evaluated by a healthcare provider.'
    },
    {
        keywords: ['swelling', 'swollen', 'red', 'hot to touch'],
        severity: 'low',
        message: 'Swelling and redness may indicate inflammation or infection.'
    }
];

export class SafetyService {
    constructor() {
        this.detectedFlags = [];
    }

    /**
     * Scan text for red flag symptoms
     * @param {string} text - User input text
     * @returns {Object} - Detection result
     */
    scan(text) {
        const lowerText = text.toLowerCase();
        this.detectedFlags = [];

        for (const flag of RED_FLAGS) {
            const matched = flag.keywords.some(keyword =>
                lowerText.includes(keyword)
            );

            if (matched) {
                this.detectedFlags.push(flag);
            }
        }

        return this.getResult();
    }

    /**
     * Get the highest severity detected
     */
    getHighestSeverity() {
        if (this.detectedFlags.some(f => f.severity === 'high')) return 'high';
        if (this.detectedFlags.some(f => f.severity === 'medium')) return 'medium';
        if (this.detectedFlags.some(f => f.severity === 'low')) return 'low';
        return null;
    }

    /**
     * Get formatted result
     */
    getResult() {
        const severity = this.getHighestSeverity();

        return {
            hasRedFlags: this.detectedFlags.length > 0,
            severity,
            flags: this.detectedFlags,
            requiresUrgentCare: severity === 'high',
            message: this.getAlertMessage()
        };
    }

    /**
     * Get appropriate alert message based on severity
     */
    getAlertMessage() {
        const severity = this.getHighestSeverity();

        if (severity === 'high') {
            return "Based on what you've described, I strongly recommend speaking to a healthcare professional as soon as possible. This isn't meant to alarm you — it's to ensure you get the care you need.";
        }

        if (severity === 'medium') {
            return "Some of what you've shared suggests it might be worth talking to a doctor. They can give you a proper evaluation and peace of mind.";
        }

        if (severity === 'low') {
            return "While this may not be urgent, it's always a good idea to mention these symptoms to your doctor when you can.";
        }

        return null;
    }

    /**
     * Check if urgent care is recommended based on pain intensity
     */
    checkIntensitySeverity(intensity) {
        if (intensity >= 9) {
            return {
                requiresAttention: true,
                message: "A pain level this high warrants medical attention. Please consider seeing a doctor today."
            };
        }
        if (intensity >= 7) {
            return {
                requiresAttention: true,
                message: "This level of pain can significantly impact your quality of life. Speaking with a healthcare provider would be beneficial."
            };
        }
        return { requiresAttention: false };
    }

    /**
     * Clear detected flags
     */
    reset() {
        this.detectedFlags = [];
    }
}

export { RED_FLAGS };
