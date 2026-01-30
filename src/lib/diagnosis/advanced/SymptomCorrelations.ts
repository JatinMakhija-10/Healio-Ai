/**
 * Symptom Correlation Detection
 * 
 * Addresses the naive Bayesian independence assumption by detecting
 * known clinical patterns where symptoms together are more informative
 * than the sum of their parts.
 * 
 * Example: "fever + productive cough + chest pain" together is MUCH
 * more specific for bacterial pneumonia than each symptom individually.
 */

export interface SymptomPattern {
    name: string;
    conditionId: string;
    symptoms: string[];           // Required symptoms in this pattern
    multiplier: number;           // Probability boost when all present
    specificity: number;          // How specific is this pattern (0-1)
    clinicalPearl?: string;       // Educational note
}

export interface DetectedPattern {
    pattern: SymptomPattern;
    matchedSymptoms: string[];
    confidence: number;
}

/**
 * Clinically validated symptom patterns
 * Based on medical literature and clinical practice guidelines
 */
export const CLINICAL_PATTERNS: SymptomPattern[] = [
    // ============ CARDIAC PATTERNS ============
    {
        name: "Typical Myocardial Infarction",
        conditionId: "heart_attack",
        symptoms: ["chest_pain", "left_arm_pain", "sweating", "nausea"],
        multiplier: 5.0,
        specificity: 0.92,
        clinicalPearl: "Classic presentation of acute MI - immediate 911"
    },
    {
        name: "Atypical MI (Especially Women)",
        conditionId: "heart_attack",
        symptoms: ["jaw_pain", "back_pain", "nausea", "fatigue"],
        multiplier: 3.5,
        specificity: 0.75,
        clinicalPearl: "Women often present atypically - don't miss this"
    },

    // ============ PULMONARY PATTERNS ============
    {
        name: "Bacterial Pneumonia",
        conditionId: "pneumonia",
        symptoms: ["fever", "productive_cough", "chest_pain", "shortness_of_breath"],
        multiplier: 2.5,
        specificity: 0.85,
        clinicalPearl: "Classic lobar pneumonia presentation"
    },
    {
        name: "Pulmonary Embolism",
        conditionId: "pulmonary_embolism",
        symptoms: ["sudden_shortness_of_breath", "chest_pain", "cough", "leg_swelling"],
        multiplier: 4.0,
        specificity: 0.88,
        clinicalPearl: "Wells Score + D-dimer if suspected"
    },

    // ============ NEUROLOGICAL PATTERNS ============
    {
        name: "Migraine with Aura",
        conditionId: "migraine",
        symptoms: ["headache", "visual_aura", "nausea", "light_sensitivity"],
        multiplier: 3.0,
        specificity: 0.90,
        clinicalPearl: "Aura typically precedes headache by 30-60min"
    },
    {
        name: "Stroke (FAST)",
        conditionId: "stroke",
        symptoms: ["face_drooping", "arm_weakness", "slurred_speech"],
        multiplier: 6.0,
        specificity: 0.95,
        clinicalPearl: "Time is brain - immediate 911, note onset time"
    },
    {
        name: "Meningitis Classic Triad",
        conditionId: "meningitis",
        symptoms: ["fever", "headache", "stiff_neck"],
        multiplier: 4.5,
        specificity: 0.87,
        clinicalPearl: "Kernig/Brudzinski signs if present"
    },

    // ============ GASTROINTESTINAL PATTERNS ============
    {
        name: "Appendicitis Migration",
        conditionId: "appendicitis",
        symptoms: ["periumbilical_pain", "right_lower_quadrant_pain", "nausea", "fever"],
        multiplier: 3.5,
        specificity: 0.82,
        clinicalPearl: "Pain migrates from umbilicus to RLQ over 12-24hrs"
    },
    {
        name: "Cholecystitis",
        conditionId: "cholecystitis",
        symptoms: ["right_upper_quadrant_pain", "nausea", "vomiting", "fatty_food_trigger"],
        multiplier: 2.8,
        specificity: 0.78,
        clinicalPearl: "Murphy's sign positive, worse after fatty meals"
    },

    // ============ INFECTIOUS DISEASE PATTERNS ============
    {
        name: "Influenza",
        conditionId: "flu",
        symptoms: ["fever", "body_aches", "headache", "dry_cough", "sudden_onset"],
        multiplier: 2.2,
        specificity: 0.75,
        clinicalPearl: "Sudden onset distinguishes from common cold"
    },
    {
        name: "COVID-19 Classic",
        conditionId: "covid_19",
        symptoms: ["fever", "dry_cough", "fatigue", "loss_of_smell", "loss_of_taste"],
        multiplier: 3.0,
        specificity: 0.88,
        clinicalPearl: "Anosmia/ageusia highly specific for COVID-19"
    },

    // ============ RHEUMATOLOGIC PATTERNS ============
    {
        name: "Inflammatory Arthritis",
        conditionId: "rheumatoid_arthritis",
        symptoms: ["morning_stiffness", "joint_swelling", "bilateral_symptoms", "fatigue"],
        multiplier: 2.5,
        specificity: 0.80,
        clinicalPearl: "Morning stiffness >1hr suggests inflammatory process"
    },

    // ============ ANAPHYLAXIS PATTERNS ============
    {
        name: "Anaphylaxis",
        conditionId: "anaphylaxis",
        symptoms: ["throat_swelling", "difficulty_breathing", "hives", "recent_allergen_exposure"],
        multiplier: 5.5,
        specificity: 0.94,
        clinicalPearl: "EpiPen immediately, then 911 - biphasic reactions possible"
    }
];

/**
 * Symptom Correlation Detector
 * Identifies when combinations of symptoms match known clinical patterns
 */
export class SymptomCorrelationDetector {
    private patterns: SymptomPattern[];

    constructor(patterns: SymptomPattern[] = CLINICAL_PATTERNS) {
        this.patterns = patterns;
    }

    /**
     * Detect all matching patterns from user symptoms
     */
    detectPatterns(userSymptoms: string[]): DetectedPattern[] {
        const normalizedSymptoms = new Set(
            userSymptoms.map(s => s.toLowerCase().trim())
        );

        const detected: DetectedPattern[] = [];

        for (const pattern of this.patterns) {
            const match = this.matchPattern(pattern, normalizedSymptoms);

            if (match.isMatch) {
                detected.push({
                    pattern,
                    matchedSymptoms: match.matchedSymptoms,
                    confidence: match.confidence
                });
            }
        }

        // Sort by confidence (higher = better match)
        return detected.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Check if a pattern matches user symptoms
     */
    private matchPattern(
        pattern: SymptomPattern,
        userSymptoms: Set<string>
    ): { isMatch: boolean; matchedSymptoms: string[]; confidence: number } {
        const matchedSymptoms: string[] = [];

        for (const requiredSymptom of pattern.symptoms) {
            if (userSymptoms.has(requiredSymptom)) {
                matchedSymptoms.push(requiredSymptom);
            }
        }

        const matchRatio = matchedSymptoms.length / pattern.symptoms.length;

        // Require at least 75% of pattern symptoms to consider it a match
        const isMatch = matchRatio >= 0.75;

        // Confidence based on how complete the match is
        const confidence = matchRatio * pattern.specificity;

        return { isMatch, matchedSymptoms, confidence };
    }

    /**
     * Get probability multiplier for a specific condition based on detected patterns
     */
    getMultiplierForCondition(
        conditionId: string,
        detectedPatterns: DetectedPattern[]
    ): number {
        let maxMultiplier = 1.0; // No boost by default

        for (const detected of detectedPatterns) {
            if (detected.pattern.conditionId === conditionId) {
                // Use the highest multiplier if multiple patterns match
                maxMultiplier = Math.max(maxMultiplier, detected.pattern.multiplier);
            }
        }

        return maxMultiplier;
    }

    /**
     * Get clinical insights from detected patterns
     */
    getClinicalInsights(detectedPatterns: DetectedPattern[]): string[] {
        return detectedPatterns
            .filter(p => p.pattern.clinicalPearl)
            .map(p => `${p.pattern.name}: ${p.pattern.clinicalPearl}`);
    }

    /**
     * Check if any detected pattern suggests an emergency
     */
    hasEmergencyPattern(detectedPatterns: DetectedPattern[]): boolean {
        const emergencyConditions = [
            'heart_attack',
            'stroke',
            'pulmonary_embolism',
            'anaphylaxis',
            'meningitis'
        ];

        return detectedPatterns.some(p =>
            emergencyConditions.includes(p.pattern.conditionId) &&
            p.confidence > 0.7
        );
    }
}

// Export singleton instance
export const symptomCorrelationDetector = new SymptomCorrelationDetector();
