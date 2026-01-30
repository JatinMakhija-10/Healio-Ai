/**
 * Dialogue State Management for Healio.AI Conversation Engine
 * 
 * This module defines rich dialogue state types for context-aware
 * conversation management, emotional state tracking, and strategic
 * information gathering.
 */

// ============================================================================
// EMOTIONAL STATE & COMMUNICATION
// ============================================================================

/** User's detected emotional state during conversation */
export type EmotionalState = 'anxious' | 'calm' | 'frustrated' | 'urgent';

/** User's preferred communication style (detected or explicit) */
export type CommunicationStyle = 'technical' | 'layperson' | 'simple';

/** Conversation phase progression */
export type ConversationPhase =
    | 'greeting'        // Initial welcome
    | 'intake'          // Gathering initial symptoms
    | 'clarification'   // Asking follow-up questions
    | 'diagnosis'       // Presenting results
    | 'guidance';       // Providing recommendations

// ============================================================================
// INTENT CLASSIFICATION
// ============================================================================

/** Primary user intents the system can understand */
export type Intent =
    | 'EMERGENCY'           // Critical health emergency detected
    | 'ADD_SYMPTOM'         // User is adding more symptoms
    | 'ANSWER_YES'          // Affirmative response
    | 'ANSWER_NO'           // Negative response
    | 'CLARIFICATION_NEEDED' // User needs more info
    | 'CHANGE_TOPIC'        // User wants to discuss something else
    | 'DESCRIBE_SYMPTOM'    // User is describing symptoms
    | 'ASK_QUESTION'        // User is asking about something
    | 'UNKNOWN';            // Could not classify

/** Urgency levels for triage */
export type UrgencyLevel = 'routine' | 'urgent' | 'emergency';

/** Full intent understanding with confidence and alternatives */
export interface IntentUnderstanding {
    primary: Intent;
    confidence: number;         // 0.0 - 1.0
    alternatives: Intent[];     // Fallback interpretations
    entities: ExtractedEntity[];
    sentiment: EmotionalState;
    urgency: UrgencyLevel;
}

// ============================================================================
// ENTITY EXTRACTION
// ============================================================================

/** Extracted medical entity from user input */
export interface ExtractedEntity {
    text: string;               // Original text
    type: 'symptom' | 'medication' | 'condition' | 'duration' | 'severity' | 'location' | 'trigger';
    normalizedForm: string;     // Standardized medical term
    confidence: number;
    context: EntityContext;
}

/** Contextual information about an extracted entity */
export interface EntityContext {
    isNegated: boolean;         // "NO fever" → true
    isPast: boolean;            // "had a fever yesterday" → true
    severity?: 'mild' | 'moderate' | 'severe';
    frequency?: 'occasional' | 'frequent' | 'constant';
    location?: string;          // Body location if applicable
}

// ============================================================================
// SYMPTOM TRACKING
// ============================================================================

/** Comprehensive symptom information */
export interface SymptomInfo {
    name: string;
    normalizedName: string;
    isPresent: boolean;         // true = confirmed, false = denied
    confidence: number;
    severity?: string;
    duration?: string;
    location?: string[];
    addedAt: number;            // Timestamp
    source: 'user_stated' | 'clarification' | 'inferred';
}

// ============================================================================
// INFORMATION NEEDS
// ============================================================================

/** What information we still need to gather */
export interface InformationNeed {
    type: 'symptom' | 'duration' | 'severity' | 'trigger' | 'location' | 'medication';
    priority: number;           // Higher = more important
    reason: string;             // Why we need this
    relatedConditions: string[];
    askedCount: number;         // How many times we've asked
}

// ============================================================================
// DIALOGUE STATE
// ============================================================================

/** Complete dialogue state for a conversation */
export interface DialogueState {
    conversationId: string;
    phase: ConversationPhase;
    startedAt: number;          // Timestamp

    /** Rich context for understanding */
    context: {
        emotionalState: EmotionalState;
        communicationPreference: CommunicationStyle;
        turnsCount: number;
        lastTurnAt: number;

        /** Symptom knowledge graph - what we know vs. uncertain */
        symptomGraph: Map<string, SymptomInfo>;

        /** Current diagnostic hypotheses (top candidates) */
        diagnosticHypotheses: string[];  // Condition IDs

        /** Confidence in current top diagnosis */
        diagnosticConfidence: number;
    };

    /** What information we still need */
    informationNeeds: InformationNeed[];

    /** Conversational goals beyond diagnosis */
    conversationalGoals: ConversationalGoal[];

    /** Questions already asked (to avoid repetition) */
    askedQuestions: Set<string>;

    /** Critical alerts detected */
    alerts: string[];
}

/** High-level conversational goals */
export interface ConversationalGoal {
    type: 'build_trust' | 'reduce_anxiety' | 'gather_info' | 'provide_guidance';
    priority: number;
    achieved: boolean;
}

// ============================================================================
// DIALOGUE TURN
// ============================================================================

/** A single turn in the conversation */
export interface DialogueTurn {
    id: string;
    timestamp: number;
    role: 'user' | 'assistant';
    content: string;
    intent?: IntentUnderstanding;
    entities?: ExtractedEntity[];
    stateSnapshot?: Partial<DialogueState>;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

// Helper to generate UUIDs safely in any environment
function generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback UUID v4 implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/** Create a new DialogueState with sensible defaults */
export function createDialogueState(conversationId?: string): DialogueState {
    return {
        conversationId: conversationId || generateUUID(),
        phase: 'greeting',
        startedAt: Date.now(),
        context: {
            emotionalState: 'calm',
            communicationPreference: 'layperson',
            turnsCount: 0,
            lastTurnAt: Date.now(),
            symptomGraph: new Map(),
            diagnosticHypotheses: [],
            diagnosticConfidence: 0
        },
        informationNeeds: [],
        conversationalGoals: [
            { type: 'build_trust', priority: 1, achieved: false },
            { type: 'gather_info', priority: 2, achieved: false }
        ],
        askedQuestions: new Set(),
        alerts: []
    };
}

/** Update dialogue state with new turn information */
export function updateDialogueState(
    state: DialogueState,
    updates: Partial<DialogueState['context']>
): DialogueState {
    return {
        ...state,
        context: {
            ...state.context,
            ...updates,
            turnsCount: state.context.turnsCount + 1,
            lastTurnAt: Date.now()
        }
    };
}

/** Add a symptom to the knowledge graph */
export function addSymptomToState(
    state: DialogueState,
    symptom: SymptomInfo
): DialogueState {
    const newGraph = new Map(state.context.symptomGraph);
    newGraph.set(symptom.normalizedName, symptom);

    return {
        ...state,
        context: {
            ...state.context,
            symptomGraph: newGraph
        }
    };
}

/** Transition to a new conversation phase */
export function transitionPhase(
    state: DialogueState,
    newPhase: ConversationPhase
): DialogueState {
    return {
        ...state,
        phase: newPhase
    };
}
