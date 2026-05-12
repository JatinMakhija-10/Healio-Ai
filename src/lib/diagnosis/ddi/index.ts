/**
 * DDI Module — Public API
 */
export { checkInteractions, buildDDIPromptSection } from './checker';
export type { CheckInteractionsInput } from './checker';
export { parseMedicationList, conditionsToTriggers, isPregnant } from './medParser';
export { DDI_RULES } from './rules';
export type {
    DDICheckResult,
    DDIRule,
    DDIMeta,
    FlaggedRemedy,
    InteractionSeverity,
    ParsedMedication,
    RemedyCategory,
} from './types';
