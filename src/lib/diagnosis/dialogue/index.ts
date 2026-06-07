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

// Language Detection
export {
    LanguageDetector,
    languageDetector,
    type SupportedLanguage,
    type LanguageDetectionResult
} from './LanguageDetector';

// Medical NER
export {
    MedicalNER,
    medicalNER
} from './MedicalNER';

// Conversation Intake State
export {
    type IntakeFieldKey,
    type IntakePhaseStatus,
    type IntakeFieldDefinition,
    type ConversationIntakeState,
    type ChatTranscriptMessage,
    INTAKE_FIELD_DEFINITIONS,
    buildConversationIntakeState,
    formatConversationIntakeStateForPrompt,
    hasMinimumDiagnosticData,
    inferAskedFieldFromAssistant,
    getExcludedSymptoms,
} from './ConversationIntakeState';

// Phase 5: Iterative Refinement Engine
export {
    type RefinementAction,
    type RefinementDecision,
    type YesNoAnswer,
    computeRefinementDecision,
    formatRefinementDecisionForPrompt,
    extractConfidenceHistory,
    detectPlateau,
    parseYesNoAnswers,
    deriveSymptomUpdates,
} from './IterativeRefinementEngine';

export {
    type SymptomSchemaId,
    type IntakeResponseType,
    type SymptomQuestionField,
    type SymptomQuestionSchema,
    GENERIC_SCHEMA,
    SYMPTOM_QUESTION_SCHEMAS,
    selectSymptomQuestionSchema,
    getSchemaFieldByKey,
    resolveSchemaFieldKey,
    getRequiredPriorityOneFields
} from './SymptomQuestionSchemas';

export {
    type NextQuestionDecisionType,
    type NextQuestionDecision,
    selectNextQuestionDecision,
    formatNextQuestionDecisionForPrompt
} from './NextQuestionSelector';

// Response Generation
export {
    EmpatheticResponseGenerator,
    responseGenerator
} from './EmpatheticResponseGenerator';

export { CHIP_OPTIONS, resolveChipOptionsForSchema } from "./ChipOptionsRegistry";