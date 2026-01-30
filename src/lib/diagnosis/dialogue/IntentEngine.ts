/**
 * Intent Classification Engine for Healio.AI
 * 
 * Fast-path rule-based intent classification with fallback hierarchy.
 * Designed for <50ms response time on emergency detection.
 */

import {
    Intent,
    IntentUnderstanding,
    EmotionalState,
    UrgencyLevel,
    ExtractedEntity
} from './DialogueState';

// ============================================================================
// EMERGENCY PATTERNS (Highest Priority - Must be fast)
// ============================================================================

const EMERGENCY_PATTERNS = [
    // Cardiac emergencies
    /can'?t breathe|unable to breathe|difficulty breathing/i,
    /chest pain.*(sweat|arm|jaw|crush|pressure)/i,
    /(crushing|squeezing).*(chest|heart)/i,
    /heart attack/i,

    // Neurological emergencies
    /stroke|sudden numbness|face drooping|slurred speech/i,
    /(severe|worst).*(headache|head pain).*sudden/i,
    /sudden.*confusion|can'?t think straight/i,
    /seizure|convulsion|fitting/i,

    // Respiratory emergencies
    /turning blue|cyanosis|lips.*blue/i,
    /choking|can'?t swallow|throat closing/i,
    /severe.*asthma.*attack/i,

    // Trauma/Injury
    /unconscious|passed out|unresponsive/i,
    /severe bleeding|won'?t stop bleeding/i,
    /bone.*sticking out|compound fracture/i,
    /head injury.*vomiting/i,

    // Anaphylaxis
    /allergic reaction.*swelling|throat.*swelling/i,
    /anaphyla/i,

    // Crisis (Mental Health)
    /suicide|kill myself|end my life|want to die/i,
    /self.?harm|cutting myself|hurt myself/i
];

const CRISIS_PATTERNS = [
    /suicide|suicidal/i,
    /kill myself|end my life|want to die/i,
    /self.?harm|cutting myself|hurt myself/i,
    /no reason to live|better off dead/i
];

// ============================================================================
// INTENT PATTERNS
// ============================================================================

const ADD_SYMPTOM_PATTERNS = [
    /also|and also|plus|along with|in addition/i,
    /another thing|i also have|there'?s also/i,
    /additionally|moreover|on top of/i
];

const CLARIFICATION_PATTERNS = [
    /what do you mean|can you explain|don'?t understand/i,
    /why are you asking|what does that mean/i,
    /i'?m confused|unclear|not sure what/i,
    /could you clarify|please explain/i
];

const AFFIRMATIVE_PATTERNS = [
    /^yes\b|yep|yeah|yup|correct|right|true|definitely|absolutely/i,
    /i do|i have|i am|that'?s right|exactly/i,
    /^y$|^ya$/i
];

const NEGATIVE_PATTERNS = [
    /^no\b|nope|nah|negative|not at all|don'?t have/i,
    /i don'?t|i haven'?t|i'?m not|that'?s not|never/i,
    /^n$/i,
    /none of the above/i
];

// ============================================================================
// EMOTIONAL STATE PATTERNS
// ============================================================================

const ANXIOUS_PATTERNS = [
    /worried|scared|anxious|nervous|frightened/i,
    /terrified|panic|afraid|fear/i,
    /what if|could it be|am i dying/i,
    /please help|i'?m really concerned/i
];

const FRUSTRATED_PATTERNS = [
    /frustrated|annoyed|irritated|already told you/i,
    /again\?|keep asking|same question/i,
    /give up|this is useless|waste of time/i
];

const URGENT_PATTERNS = [
    /urgent|emergency|help me|right now/i,
    /immediately|asap|can'?t wait/i,
    /critical|serious|life.?threatening/i
];

// ============================================================================
// INTENT ENGINE CLASS
// ============================================================================

export class IntentEngine {

    /**
     * Classify user input with fallback hierarchy
     * Fast path for emergencies, slower analysis for complex cases
     */
    understand(input: string, previousIntents: Intent[] = []): IntentUnderstanding {
        const normalized = input.toLowerCase().trim();

        // Track timing for performance monitoring
        const startTime = performance.now();

        // FAST PATH: Emergency detection (MUST be < 50ms)
        const emergencyResult = this.checkEmergency(normalized);
        if (emergencyResult.isEmergency) {
            return {
                primary: 'EMERGENCY',
                confidence: emergencyResult.confidence,
                alternatives: [],
                entities: [],
                sentiment: 'urgent',
                urgency: 'emergency'
            };
        }

        // Rule-based classification for clear cases
        const ruleMatch = this.ruleBasedMatch(normalized);
        if (ruleMatch.confidence > 0.85) {
            return {
                ...ruleMatch,
                sentiment: this.detectEmotionalState(normalized),
                urgency: this.assessUrgency(normalized)
            };
        }

        // Context-aware classification
        const contextMatch = this.contextAwareMatch(normalized, previousIntents);

        // Combine with emotional analysis
        const sentiment = this.detectEmotionalState(normalized);
        const urgency = this.assessUrgency(normalized);

        // Performance logging
        const duration = performance.now() - startTime;
        if (duration > 100) {
            console.warn(`[IntentEngine] Slow classification: ${duration.toFixed(1)}ms`);
        }

        return {
            primary: contextMatch.primary,
            confidence: contextMatch.confidence,
            alternatives: contextMatch.alternatives,
            entities: [],
            sentiment,
            urgency
        };
    }

    /**
     * Fast emergency detection - MUST complete in < 50ms
     */
    private checkEmergency(input: string): { isEmergency: boolean; confidence: number; isCrisis: boolean } {
        // Check crisis patterns first (mental health emergencies)
        for (const pattern of CRISIS_PATTERNS) {
            if (pattern.test(input)) {
                return { isEmergency: true, confidence: 1.0, isCrisis: true };
            }
        }

        // Check medical emergency patterns
        for (const pattern of EMERGENCY_PATTERNS) {
            if (pattern.test(input)) {
                return { isEmergency: true, confidence: 0.95, isCrisis: false };
            }
        }

        return { isEmergency: false, confidence: 0, isCrisis: false };
    }

    /**
     * Rule-based matching for clear-cut intents
     */
    private ruleBasedMatch(input: string): Omit<IntentUnderstanding, 'sentiment' | 'urgency'> {
        // Check for symptom addition
        for (const pattern of ADD_SYMPTOM_PATTERNS) {
            if (pattern.test(input)) {
                return {
                    primary: 'ADD_SYMPTOM',
                    confidence: 0.9,
                    alternatives: ['DESCRIBE_SYMPTOM'],
                    entities: []
                };
            }
        }

        // Check for clarification requests
        for (const pattern of CLARIFICATION_PATTERNS) {
            if (pattern.test(input)) {
                return {
                    primary: 'CLARIFICATION_NEEDED',
                    confidence: 0.95,
                    alternatives: ['ASK_QUESTION'],
                    entities: []
                };
            }
        }

        // Check for affirmative responses
        for (const pattern of AFFIRMATIVE_PATTERNS) {
            if (pattern.test(input)) {
                return {
                    primary: 'ANSWER_YES',
                    confidence: 0.9,
                    alternatives: [],
                    entities: []
                };
            }
        }

        // Check for negative responses
        for (const pattern of NEGATIVE_PATTERNS) {
            if (pattern.test(input)) {
                return {
                    primary: 'ANSWER_NO',
                    confidence: 0.9,
                    alternatives: [],
                    entities: []
                };
            }
        }

        // Default: Likely describing symptoms
        return {
            primary: 'DESCRIBE_SYMPTOM',
            confidence: 0.5,
            alternatives: ['ASK_QUESTION', 'ADD_SYMPTOM'],
            entities: []
        };
    }

    /**
     * Context-aware classification using conversation history
     */
    private contextAwareMatch(
        input: string,
        previousIntents: Intent[]
    ): Omit<IntentUnderstanding, 'sentiment' | 'urgency'> {
        // If previous intent was a question, this is likely an answer
        const lastIntent = previousIntents[previousIntents.length - 1];

        if (lastIntent === 'ASK_QUESTION') {
            // Short responses after questions are likely answers
            if (input.length < 50) {
                const isPositive = AFFIRMATIVE_PATTERNS.some(p => p.test(input));
                const isNegative = NEGATIVE_PATTERNS.some(p => p.test(input));

                if (isPositive) {
                    return { primary: 'ANSWER_YES', confidence: 0.85, alternatives: [], entities: [] };
                }
                if (isNegative) {
                    return { primary: 'ANSWER_NO', confidence: 0.85, alternatives: [], entities: [] };
                }
            }
        }

        // Default symptom description for longer inputs
        if (input.length > 30) {
            return {
                primary: 'DESCRIBE_SYMPTOM',
                confidence: 0.7,
                alternatives: ['ADD_SYMPTOM'],
                entities: []
            };
        }

        return {
            primary: 'UNKNOWN',
            confidence: 0.3,
            alternatives: ['DESCRIBE_SYMPTOM', 'ANSWER_YES', 'ANSWER_NO'],
            entities: []
        };
    }

    /**
     * Detect user's emotional state from message
     */
    detectEmotionalState(input: string): EmotionalState {
        // Check urgent first (highest priority)
        for (const pattern of URGENT_PATTERNS) {
            if (pattern.test(input)) return 'urgent';
        }

        // Check frustrated
        for (const pattern of FRUSTRATED_PATTERNS) {
            if (pattern.test(input)) return 'frustrated';
        }

        // Check anxious
        for (const pattern of ANXIOUS_PATTERNS) {
            if (pattern.test(input)) return 'anxious';
        }

        return 'calm';
    }

    /**
     * Assess urgency level for triage
     */
    private assessUrgency(input: string): UrgencyLevel {
        // Emergency already handled in checkEmergency

        // Check for urgent indicators
        if (URGENT_PATTERNS.some(p => p.test(input))) {
            return 'urgent';
        }

        // Severity indicators
        if (/(severe|intense|unbearable|extreme|worst)/i.test(input)) {
            return 'urgent';
        }

        // Time indicators suggesting urgency
        if (/(getting worse|rapidly|suddenly)/i.test(input)) {
            return 'urgent';
        }

        return 'routine';
    }

    /**
     * Check if input contains crisis-related content
     * Used for immediate intervention
     */
    checkForCrisis(input: string): { isCrisis: boolean; type?: string } {
        for (const pattern of CRISIS_PATTERNS) {
            if (pattern.test(input)) {
                return {
                    isCrisis: true,
                    type: 'mental_health_crisis'
                };
            }
        }
        return { isCrisis: false };
    }
}

// Export singleton instance
export const intentEngine = new IntentEngine();
