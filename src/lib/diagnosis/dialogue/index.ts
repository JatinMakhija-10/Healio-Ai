/**
 * Dialogue Module Exports
 * Central export for all dialogue management functionality
 */

// State Management
export {
    type EmotionalState,
    type CommunicationStyle,
    type ConversationPhase,
    type Intent,
    type UrgencyLevel,
    type IntentUnderstanding,
    type ExtractedEntity,
    type EntityContext,
    type SymptomInfo,
    type InformationNeed,
    type DialogueState,
    type ConversationalGoal,
    type DialogueTurn,
    createDialogueState,
    updateDialogueState,
    addSymptomToState,
    transitionPhase
} from './DialogueState';

// Intent Classification
export {
    IntentEngine,
    intentEngine
} from './IntentEngine';

// Medical NER
export {
    MedicalNER,
    medicalNER
} from './MedicalNER';

// Response Generation
export {
    EmpatheticResponseGenerator,
    responseGenerator
} from './EmpatheticResponseGenerator';
