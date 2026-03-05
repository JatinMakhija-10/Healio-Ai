/**
 * Language Detector for Healio.AI Conversation Engine
 * 
 * Auto-detects English, Hindi, and Hinglish based on script analysis
 * and keyword heuristics to provide a localized experience without
 * explicitly asking the user.
 */

export type SupportedLanguage = 'en' | 'hi' | 'hinglish';

export interface LanguageDetectionResult {
    language: SupportedLanguage;
    confidence: number;
    script: 'devanagari' | 'latin' | 'mixed';
}

export class LanguageDetector {
    // Top 50 common Hindi words written in Latin script (Hinglish identifiers)
    private readonly HINGLISH_KEYWORDS = new Set([
        'hai', 'hota', 'hoti', 'hote', 'nahi', 'kya', 'kyun', 'kaise', 'kab', 'kahan',
        'mera', 'meri', 'mere', 'mujhe', 'kuch', 'bhi', 'aur', 'par', 'lekin', 'agar',
        'dard', 'bukhar', 'sir', 'pet', 'gala', 'khansi', 'zukam', 'saans', 'chakar',
        'khoon', 'dard', 'bahut', 'thoda', 'zyada', 'kam', 'din', 'saal', 'mahina',
        'se', 'ko', 'mein', 'pe', 'ke', 'liye', 'sath', 'raha', 'rahi', 'rahe', 'tha', 'thi'
    ]);

    // Top 50 common English words (to differentiate Hinglish from English)
    private readonly ENGLISH_KEYWORDS = new Set([
        'is', 'am', 'are', 'was', 'were', 'be', 'being', 'been', 'have', 'has', 'had',
        'do', 'does', 'did', 'can', 'could', 'will', 'would', 'shall', 'should',
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'our', 'their',
        'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'whose',
        'and', 'but', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with'
    ]);

    /**
     * Detects the language of a given text.
     */
    public detect(text: string): LanguageDetectionResult {
        if (!text || text.trim().length === 0) {
            return { language: 'en', confidence: 1.0, script: 'latin' };
        }

        // 1. Script Analysis
        const devanagariPattern = /[\u0900-\u097F]/;
        const latinPattern = /[a-zA-Z]/;

        const hasDevanagari = devanagariPattern.test(text);
        const hasLatin = latinPattern.test(text);

        // If it contains Devanagari, it's definitively Hindi (or mixed but treated as Hindi for UI)
        if (hasDevanagari && !hasLatin) {
            return { language: 'hi', confidence: 0.95, script: 'devanagari' };
        } else if (hasDevanagari && hasLatin) {
            // Mixed script usually implies Hindi dominant with some English words (e.g. "mujhe headache हो रहा है")
            // We'll treat this as Hindi for response generation, but could track as mixed
            return { language: 'hi', confidence: 0.8, script: 'mixed' };
        }

        // 2. Keyword Heuristics for Latin Script (English vs Hinglish)
        const tokens = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(t => t.length > 0);

        let hinglishMatchCount = 0;
        let englishMatchCount = 0;

        for (const token of tokens) {
            if (this.HINGLISH_KEYWORDS.has(token)) {
                hinglishMatchCount++;
            } else if (this.ENGLISH_KEYWORDS.has(token)) {
                englishMatchCount++;
            }
        }

        const totalKeywordsMatched = hinglishMatchCount + englishMatchCount;

        // If no keywords matched, default to English (or if it's very short)
        if (totalKeywordsMatched === 0) {
            // Check for specific medical terms that might be Hinglish
            const specificHinglishMedical = ['dard', 'bukhar', 'chakkar', 'khasi', 'zukam', 'ulti', 'dast'];
            for (const token of tokens) {
                if (specificHinglishMedical.includes(token)) {
                    return { language: 'hinglish', confidence: 0.6, script: 'latin' };
                }
            }
            return { language: 'en', confidence: 0.6, script: 'latin' };
        }

        // Calculate ratios
        const hinglishRatio = hinglishMatchCount / totalKeywordsMatched;

        if (hinglishRatio > 0.4) {
            // If more than 40% of standard keywords are Hinglish, it's likely Hinglish
            // (Lower threshold because English stopwords are very common even in Hinglish)
            return {
                language: 'hinglish',
                confidence: Math.min(0.5 + hinglishRatio, 0.95),
                script: 'latin'
            };
        } else {
            return {
                language: 'en',
                confidence: Math.min(0.5 + (1 - hinglishRatio), 0.95),
                script: 'latin'
            };
        }
    }
}

// Export singleton
export const languageDetector = new LanguageDetector();
