/**
 * Medical Named Entity Recognition (NER) for Healio.AI
 * 
 * Enhanced entity extraction with:
 * - 200+ synonym mappings (layman → medical terms)
 * - NegEx-style negation detection
 * - Temporal expression parsing
 * - Modifier extraction (severity, frequency)
 */

import { ExtractedEntity, EntityContext } from './DialogueState';

// ============================================================================
// COMPREHENSIVE SYNONYM MAPPING
// Maps layman terms to standardized medical terminology
// ============================================================================

const SYMPTOM_SYNONYMS: Record<string, string[]> = {
    // Pain descriptors
    'headache': ['head hurts', 'head pain', 'head ache', 'my head is killing me', 'splitting headache'],
    'migraine': ['sick headache', 'migrane', 'migraines'],
    'abdominal_pain': ['stomach ache', 'stomachache', 'tummy ache', 'belly pain', 'gut pain', 'stomach hurts', 'abdomen hurts'],
    'chest_pain': ['chest hurts', 'pain in chest', 'chest discomfort', 'heart hurts'],
    'back_pain': ['backache', 'back ache', 'back hurts', 'spine pain', 'lower back'],
    'joint_pain': ['joints hurt', 'achy joints', 'joint ache'],
    'muscle_pain': ['sore muscles', 'muscle ache', 'muscles hurt', 'body aches'],
    'sore_throat': ['throat hurts', 'throat pain', 'scratchy throat', 'painful throat'],

    // Gastrointestinal
    'nausea': ['feel sick', 'queasy', 'sick to stomach', 'feel like throwing up', 'want to vomit', 'nauseous'],
    'vomiting': ['throwing up', 'puking', 'vomit', 'being sick', 'barfing'],
    'diarrhea': ['loose stool', 'watery stool', 'runny stool', 'the runs', 'upset stomach'],
    'constipation': ['can\'t poop', 'hard stool', 'blocked up', 'irregular bowel'],
    'bloating': ['bloated', 'gas', 'gassy', 'distended', 'full feeling'],
    'heartburn': ['acid reflux', 'acidity', 'burning chest', 'indigestion'],
    'loss_of_appetite': ['not hungry', 'don\'t want to eat', 'no appetite', 'off food'],

    // Respiratory
    'shortness_of_breath': ['can\'t breathe', 'difficulty breathing', 'breathless', 'hard to breathe', 'out of breath', 'dyspnea'],
    'cough': ['coughing', 'hacking', 'hacky cough'],
    'wheezing': ['whistling breath', 'breathing sounds'],
    'congestion': ['stuffy nose', 'blocked nose', 'stuffed up', 'bunged up'],
    'runny_nose': ['nose running', 'sniffly', 'runny'],
    'sneezing': ['sneezy', 'achoo'],

    // Neurological
    'dizziness': ['dizzy', 'lightheaded', 'light headed', 'woozy', 'unsteady', 'room spinning'],
    'vertigo': ['spinning', 'world spinning', 'balance problems'],
    'numbness': ['numb', 'can\'t feel', 'tingling', 'pins and needles', 'prickling'],
    'confusion': ['confused', 'disoriented', 'brain fog', 'can\'t think clearly'],
    'memory_problems': ['forgetful', 'can\'t remember', 'memory loss'],

    // General/Systemic
    'fever': ['high temperature', 'temperature', 'burning up', 'feverish', 'hot', 'chills and fever'],
    'chills': ['shivering', 'cold chills', 'rigors', 'shaky'],
    'fatigue': ['tired', 'exhausted', 'no energy', 'worn out', 'drained', 'weak', 'lethargic', 'sluggish'],
    'weakness': ['weak', 'feeble', 'no strength'],
    'sweating': ['sweaty', 'perspiring', 'night sweats', 'cold sweats'],
    'weight_loss': ['losing weight', 'lost weight', 'getting thinner'],
    'weight_gain': ['gaining weight', 'putting on weight', 'getting heavier'],

    // Skin
    'rash': ['skin rash', 'red spots', 'bumps on skin', 'skin irritation', 'hives'],
    'itching': ['itchy', 'scratchy skin', 'skin itches'],
    'swelling': ['swollen', 'puffiness', 'puffy', 'inflammation'],
    'bruising': ['bruise', 'black and blue'],

    // Sensory
    'blurred_vision': ['blurry vision', 'can\'t see clearly', 'fuzzy vision', 'vision problems'],
    'sensitivity_to_light': ['light sensitive', 'photophobia', 'light hurts eyes', 'bright lights bother me'],
    'ringing_ears': ['tinnitus', 'ears ringing', 'buzzing in ears'],
    'hearing_loss': ['can\'t hear', 'hard of hearing', 'deaf'],

    // Cardiac
    'palpitations': ['heart racing', 'heart pounding', 'heart fluttering', 'heart skipping', 'rapid heartbeat'],
    'irregular_heartbeat': ['arrhythmia', 'heart skips', 'irregular pulse'],

    // Urinary
    'frequent_urination': ['peeing a lot', 'urinating often', 'going to bathroom frequently'],
    'painful_urination': ['hurts to pee', 'burning when urinating', 'dysuria'],
    'blood_in_urine': ['bloody urine', 'red urine', 'hematuria'],

    // Sleep
    'insomnia': ['can\'t sleep', 'trouble sleeping', 'sleepless', 'sleep problems'],
    'sleep_apnea': ['stop breathing at night', 'snoring loudly']
};

// ============================================================================
// NEGATION DETECTION (NegEx-style)
// ============================================================================

const NEGATION_CUES = [
    'no', 'not', 'without', 'deny', 'denies', 'denied', 'negative for',
    'don\'t have', 'doesn\'t have', 'do not have', 'does not have',
    'haven\'t had', 'hasn\'t had', 'never had', 'no sign of', 'no evidence of',
    'ruled out', 'absent', 'free of', 'lack of', 'lacks'
];

const NEGATION_WINDOW = 6; // tokens to look ahead/behind

// ============================================================================
// TEMPORAL EXPRESSIONS
// ============================================================================

const PAST_INDICATORS = [
    'had', 'was', 'were', 'used to', 'previously', 'before',
    'yesterday', 'last week', 'last month', 'ago', 'earlier',
    'in the past', 'previously had', 'history of'
];

const RECENT_INDICATORS = [
    'just', 'recently', 'today', 'this morning', 'started', 'began',
    'since', 'for the past', 'suddenly'
];

// ============================================================================
// SEVERITY MODIFIERS
// ============================================================================

const SEVERITY_MODIFIERS: Record<string, EntityContext['severity']> = {
    // Mild
    'mild': 'mild',
    'slight': 'mild',
    'minor': 'mild',
    'little': 'mild',
    'bit of': 'mild',
    'a little': 'mild',
    'somewhat': 'mild',

    // Moderate
    'moderate': 'moderate',
    'medium': 'moderate',
    'noticeable': 'moderate',
    'significant': 'moderate',

    // Severe
    'severe': 'severe',
    'extreme': 'severe',
    'intense': 'severe',
    'unbearable': 'severe',
    'excruciating': 'severe',
    'worst': 'severe',
    'terrible': 'severe',
    'awful': 'severe',
    'horrible': 'severe',
    'agonizing': 'severe',
    'debilitating': 'severe',
    'crippling': 'severe'
};

// ============================================================================
// FREQUENCY MODIFIERS
// ============================================================================

const FREQUENCY_MODIFIERS: Record<string, EntityContext['frequency']> = {
    // Occasional
    'sometimes': 'occasional',
    'occasionally': 'occasional',
    'now and then': 'occasional',
    'once in a while': 'occasional',
    'intermittent': 'occasional',
    'sporadic': 'occasional',

    // Frequent
    'often': 'frequent',
    'frequently': 'frequent',
    'usually': 'frequent',
    'most of the time': 'frequent',
    'regularly': 'frequent',

    // Constant
    'always': 'constant',
    'constantly': 'constant',
    'all the time': 'constant',
    'continuous': 'constant',
    'persistent': 'constant',
    'non-stop': 'constant',
    'never goes away': 'constant',
    '24/7': 'constant'
};

// ============================================================================
// MEDICAL NER CLASS
// ============================================================================

export class MedicalNER {
    private synonymIndex: Map<string, string> = new Map();

    constructor() {
        this.buildSynonymIndex();
    }

    /**
     * Build reverse index: synonym phrase → canonical term
     */
    private buildSynonymIndex(): void {
        for (const [canonical, synonyms] of Object.entries(SYMPTOM_SYNONYMS)) {
            // Index the canonical term itself
            this.synonymIndex.set(canonical.toLowerCase(), canonical);

            // Index all synonyms
            for (const synonym of synonyms) {
                this.synonymIndex.set(synonym.toLowerCase(), canonical);
            }
        }
    }

    /**
     * Extract all medical entities from user input
     */
    extractEntities(text: string): ExtractedEntity[] {
        const normalized = text.toLowerCase();
        const entities: ExtractedEntity[] = [];
        const tokens = this.tokenize(normalized);

        // 1. Find symptom mentions (including synonyms)
        const symptomEntities = this.extractSymptoms(normalized, tokens);
        entities.push(...symptomEntities);

        // 2. Extract duration mentions
        const durationEntities = this.extractDurations(normalized);
        entities.push(...durationEntities);

        // 3. Extract severity mentions
        const severityEntities = this.extractSeverities(normalized);
        entities.push(...severityEntities);

        return entities;
    }

    /**
     * Tokenize text for analysis
     */
    private tokenize(text: string): string[] {
        return text.split(/\s+/).filter(t => t.length > 0);
    }

    /**
     * Extract symptom entities with normalization
     */
    private extractSymptoms(text: string, tokens: string[]): ExtractedEntity[] {
        const entities: ExtractedEntity[] = [];
        const foundSymptoms = new Set<string>();

        // Check for multi-word phrases first (longer matches take priority)
        for (const [phrase, canonical] of this.synonymIndex.entries()) {
            if (text.includes(phrase) && !foundSymptoms.has(canonical)) {
                const isNegated = this.checkNegation(text, phrase);
                const isPast = this.checkPastTense(text, phrase);
                const severity = this.extractNearestSeverity(text, phrase);
                const frequency = this.extractNearestFrequency(text, phrase);

                entities.push({
                    text: phrase,
                    type: 'symptom',
                    normalizedForm: canonical,
                    confidence: phrase === canonical ? 0.95 : 0.85,
                    context: {
                        isNegated,
                        isPast,
                        severity,
                        frequency
                    }
                });

                foundSymptoms.add(canonical);
            }
        }

        return entities;
    }

    /**
     * Check if a phrase is negated using NegEx-style detection
     */
    checkNegation(text: string, targetPhrase: string): boolean {
        const targetIndex = text.indexOf(targetPhrase);
        if (targetIndex === -1) return false;

        // Get surrounding text
        const beforeText = text.substring(Math.max(0, targetIndex - 50), targetIndex);
        const afterText = text.substring(targetIndex, Math.min(text.length, targetIndex + targetPhrase.length + 30));

        // Check for negation cues before the phrase
        for (const cue of NEGATION_CUES) {
            // Check if negation cue appears before the target within window
            if (beforeText.includes(cue)) {
                // Make sure there's no "but" or "except" breaking the negation
                const cueIndex = beforeText.lastIndexOf(cue);
                const textBetween = beforeText.substring(cueIndex + cue.length);
                if (!/\bbut\b|\bexcept\b|\bhowever\b/.test(textBetween)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if symptom is described in past tense
     */
    private checkPastTense(text: string, phrase: string): boolean {
        const phraseIndex = text.indexOf(phrase);
        if (phraseIndex === -1) return false;

        const surroundingText = text.substring(
            Math.max(0, phraseIndex - 30),
            Math.min(text.length, phraseIndex + phrase.length + 30)
        );

        return PAST_INDICATORS.some(indicator => surroundingText.includes(indicator));
    }

    /**
     * Extract severity modifier near a symptom
     */
    private extractNearestSeverity(text: string, phrase: string): EntityContext['severity'] | undefined {
        const phraseIndex = text.indexOf(phrase);
        if (phraseIndex === -1) return undefined;

        const surroundingText = text.substring(
            Math.max(0, phraseIndex - 20),
            Math.min(text.length, phraseIndex + phrase.length + 10)
        );

        for (const [modifier, severity] of Object.entries(SEVERITY_MODIFIERS)) {
            if (surroundingText.includes(modifier)) {
                return severity;
            }
        }

        return undefined;
    }

    /**
     * Extract frequency modifier near a symptom
     */
    private extractNearestFrequency(text: string, phrase: string): EntityContext['frequency'] | undefined {
        const phraseIndex = text.indexOf(phrase);
        if (phraseIndex === -1) return undefined;

        const surroundingText = text.substring(
            Math.max(0, phraseIndex - 30),
            Math.min(text.length, phraseIndex + phrase.length + 30)
        );

        for (const [modifier, frequency] of Object.entries(FREQUENCY_MODIFIERS)) {
            if (surroundingText.includes(modifier)) {
                return frequency;
            }
        }

        return undefined;
    }

    /**
     * Extract duration expressions
     */
    private extractDurations(text: string): ExtractedEntity[] {
        const entities: ExtractedEntity[] = [];

        // Pattern matching for common duration expressions
        const durationPatterns = [
            /for (?:the )?(?:past |last )?(\d+)\s*(day|week|month|year|hour|minute)s?/gi,
            /since (?:last )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d+ days? ago)/gi,
            /(\d+)\s*(day|week|month|year|hour)s?\s*ago/gi,
            /(a few|several|couple of?)\s*(day|week|month|hour)s?/gi
        ];

        for (const pattern of durationPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                entities.push({
                    text: match[0],
                    type: 'duration',
                    normalizedForm: match[0],
                    confidence: 0.9,
                    context: {
                        isNegated: false,
                        isPast: false
                    }
                });
            }
        }

        return entities;
    }

    /**
     * Extract standalone severity mentions
     */
    private extractSeverities(text: string): ExtractedEntity[] {
        const entities: ExtractedEntity[] = [];

        for (const [modifier, severity] of Object.entries(SEVERITY_MODIFIERS)) {
            if (text.includes(modifier)) {
                entities.push({
                    text: modifier,
                    type: 'severity',
                    normalizedForm: severity || 'unknown',
                    confidence: 0.85,
                    context: {
                        isNegated: false,
                        isPast: false,
                        severity
                    }
                });
                break; // Only capture one severity per input
            }
        }

        return entities;
    }

    /**
     * Normalize a raw symptom string to canonical form
     */
    normalizeSymptom(raw: string): string {
        const lowered = raw.toLowerCase().trim();
        return this.synonymIndex.get(lowered) || raw;
    }

    /**
     * Get all confirmed symptoms (present, not negated)
     */
    getConfirmedSymptoms(entities: ExtractedEntity[]): string[] {
        return entities
            .filter(e => e.type === 'symptom' && !e.context.isNegated && !e.context.isPast)
            .map(e => e.normalizedForm);
    }

    /**
     * Get all denied symptoms (negated)
     */
    getDeniedSymptoms(entities: ExtractedEntity[]): string[] {
        return entities
            .filter(e => e.type === 'symptom' && e.context.isNegated)
            .map(e => e.normalizedForm);
    }
}

// Export singleton instance
export const medicalNER = new MedicalNER();
