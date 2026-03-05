/**
 * Pure helper functions extracted from useDiagnosisChat for testability.
 */

import type { EmotionalState } from "@/lib/diagnosis/dialogue";

const ANXIOUS_PATTERNS =
    /worried|scared|anxious|nervous|frightened|terrified|panic|afraid|fear|please help|am i dying/i;
const FRUSTRATED_PATTERNS =
    /frustrated|annoyed|irritated|already told you|again\?|keep asking|same question/i;
const URGENT_PATTERNS =
    /urgent|emergency|help me|right now|immediately|asap|can't wait|critical|serious/i;

/**
 * Detect the user's emotional state from their message text.
 * Priority: urgent > frustrated > anxious > calm.
 */
export function detectEmotionalState(message: string): EmotionalState {
    if (URGENT_PATTERNS.test(message)) return "urgent";
    if (FRUSTRATED_PATTERNS.test(message)) return "frustrated";
    if (ANXIOUS_PATTERNS.test(message)) return "anxious";
    return "calm";
}

/**
 * Generate a deterministic-ish ID for messages.
 */
export function generateMessageId(): string {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

/**
 * Parse accumulated symptom data from an option selection.
 * Given the current symptom data, the option the user selected,
 * and the current question context, return updated symptom notes
 * and excluded symptoms.
 */
export function applyOptionToSymptoms(
    additionalNotes: string,
    excludedSymptoms: string[],
    option: string,
    currentContext: string | null,
    multiSelectTokens?: string[],
    allOptions?: string[]
): { additionalNotes: string; excludedSymptoms: string[] } {
    const normalizedOption = option.toLowerCase();

    // Multi-choice with token mapping
    if (multiSelectTokens && allOptions) {
        if (normalizedOption === "none of the above") {
            return {
                additionalNotes,
                excludedSymptoms: [...excludedSymptoms, ...multiSelectTokens],
            };
        }
        const index = allOptions.findIndex(
            (o) => o.toLowerCase() === normalizedOption
        );
        if (index !== -1 && multiSelectTokens[index]) {
            return {
                additionalNotes: (additionalNotes + " " + multiSelectTokens[index]).trim(),
                excludedSymptoms,
            };
        }
    }

    // Yes/No with context
    if (normalizedOption.startsWith("no") && currentContext) {
        return {
            additionalNotes,
            excludedSymptoms: [...excludedSymptoms, currentContext],
        };
    }

    if (currentContext) {
        return {
            additionalNotes: (additionalNotes + " " + currentContext).trim(),
            excludedSymptoms,
        };
    }

    // Radiation/numbness keywords
    if (
        normalizedOption.includes("radiates") ||
        normalizedOption.includes("numbness")
    ) {
        return {
            additionalNotes: (additionalNotes + " numbness radiating").trim(),
            excludedSymptoms,
        };
    }

    return { additionalNotes, excludedSymptoms };
}
