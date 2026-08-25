import type { ConversationIntakeState, IntakeFieldDefinition, IntakeFieldKey } from './ConversationIntakeState';

export type NextQuestionDecisionType =
    | 'escalate'
    | 'clarify'
    | 'ask_required'
    | 'ask_contextual'
    | 'summarize'
    | 'ask_optional';

export interface NextQuestionDecision {
    type: NextQuestionDecisionType;
    field: IntakeFieldDefinition | null;
    reason: string;
    stopQuestioning: boolean;
}

interface TriggerableField extends IntakeFieldDefinition {
    triggerIf?: string;
}

const FIELD_ALIAS_BY_SCHEMA_KEY: Record<string, IntakeFieldKey[]> = {
    'fever.duration': ['duration'],
    'headache.duration': ['duration'],
    'chest_pain.duration': ['duration'],
    'abdominal_pain.duration': ['duration'],
    'cough_cold.duration': ['duration'],
    'vomiting_diarrhea.duration': ['duration'],
    'vomiting_diarrhea.severity': ['severity'],
    'skin_rash.duration': ['duration'],
    'dizziness.duration': ['duration'],
    'fatigue.duration': ['duration'],
    'mental_health.duration': ['duration'],
    'eye_problem.duration': ['duration'],
    'body_pain.duration': ['duration'],
};

// ── Tiered Red Flag System ────────────────────────────────────────────────────
//
// TIER 1 — HARD STOP: True life-threatening emergencies where seconds count.
// These immediately terminate the chat and send the emergency number message.
// Only patterns that unambiguously require 112/911 belong here.
//
// TIER 2 — SOFT ESCALATE: Clinical warning signs that need professional review
// (same-day or urgent) but NOT immediate emergency services. The conversation
// continues; the LLM sets escalation_level to L3 or L4 in the final card.
//
const TIER_1_HARD_STOP_FLAGS = new Set([
    'chest pain',
    'breathing difficulty',
    'stroke signs',
    'loss of consciousness',
    'coughing blood',
    'seizure',
    'suicidal thoughts',
    'sudden severe headache',
    'severe abdominal pain',
    'anaphylaxis',
    'pregnancy emergency',
    'altered consciousness',
    'severe bleeding',
    'meningitis signs',
    'dka / metabolic crisis',
    'eye emergency',
    'testicular torsion',
    'head trauma red flag',
    'sepsis signs',
    'bowel obstruction',
    'infant fever <3 months',
    'pediatric seizure',
    'stridor',
    'rescue inhaler not helping',
    'central vertigo',
    'suicidal ideation with plan',
    'hypoglycemia',
    'alcohol withdrawal',
    'heat stroke',
    'pain out of proportion',
    'rapidly spreading infection',
    'compartment syndrome',
    'cauda equina syndrome',
    'visual disturbance',
    'ovarian torsion',
    'airway obstruction',
]);



function parseDurationDays(value: string | undefined): number | null {
    if (!value) return null;
    const normalized = value.toLowerCase();
    
    // Check for range like "3-4" or "3 to 4" first
    const rangeMatch = normalized.match(/\b([1-9]\d?)\s*(?:-|to)\s*([1-9]\d?)\b/);
    let amount: number | null = null;
    if (rangeMatch) {
        amount = Number(rangeMatch[2]);
    } else {
        const numberMatch = normalized.match(/\b([1-9]\d?)\b/);
        const wordNumbers: Record<string, number> = {
            one: 1,
            two: 2,
            three: 3,
            four: 4,
            five: 5,
            six: 6,
            seven: 7,
        };
        const wordMatch = normalized.match(/\b(one|two|three|four|five|six|seven)\b/);
        amount = numberMatch ? Number(numberMatch[1]) : wordMatch ? wordNumbers[wordMatch[1]] : null;
    }

    if (amount == null) {
        if (/\btoday|this morning|few hours|hour|ghante|ghanta/.test(normalized)) return 0;
        if (/\byesterday/.test(normalized)) return 1;
        return null;
    }

    if (/\bweek|hafta|hafte|hafto\b/.test(normalized)) return amount * 7;
    if (/\bmonth|mahina|mahine|mahino\b/.test(normalized)) return amount * 30;
    if (/\byear|saal\b/.test(normalized)) return amount * 365;
    if (/\bhour|minute|ghante|ghanta\b/.test(normalized)) return 0;
    return amount;
}

function getCollectedValue(state: ConversationIntakeState, key: IntakeFieldKey): string | undefined {
    const direct = state.collectedData.get(key);
    if (direct) return direct;

    const aliases = FIELD_ALIAS_BY_SCHEMA_KEY[key] ?? [];
    for (const alias of aliases) {
        const aliasValue = state.collectedData.get(alias);
        if (aliasValue) return aliasValue;
    }

    const aliasMatch = state.fieldDefinitions.find((field) => field.key === key)?.aliases ?? [];
    for (const alias of aliasMatch) {
        const aliasValue = state.collectedData.get(alias);
        if (aliasValue) return aliasValue;
    }

    return undefined;
}

function isTriggerSatisfied(field: TriggerableField, state: ConversationIntakeState): boolean {
    if (!field.triggerIf) return true;

    if (field.triggerIf === 'duration > 3 days') {
        const duration = getCollectedValue(state, 'fever.duration') ?? getCollectedValue(state, 'duration');
        const days = parseDurationDays(duration);
        return days != null && days > 3;
    }

    return true;
}

function getField(state: ConversationIntakeState, key: IntakeFieldKey): IntakeFieldDefinition | null {
    return state.fieldDefinitions.find((field) => field.key === key) ?? null;
}

export function selectNextQuestionDecision(state: ConversationIntakeState): NextQuestionDecision {
    // ── Tiered escalation check ───────────────────────────────────────────────
    // Only Tier 1 flags hard-stop the conversation. Tier 2 flags (eye emergency,
    // altered consciousness, blisters, etc.) allow intake to continue — the LLM
    // sets L3/L4 in the final card using the phaseStatus + redFlagsFound context.
    if (state.redFlagsFound.length > 0) {
        const hardStopFlag = state.redFlagsFound.find((flag) =>
            TIER_1_HARD_STOP_FLAGS.has(flag) ||
            flag.endsWith('.danger_signs') ||
            flag.endsWith('_red_flag_trigger') ||
            flag.endsWith('.red_flags') ||
            state.fieldDefinitions.some((f) => f.key === flag && Boolean(f.redFlagFn))
        );
        if (hardStopFlag) {
            return {
                type: 'escalate',
                field: null,
                reason: `Critical red flag detected: ${hardStopFlag}`,
                stopQuestioning: true,
            };
        }
        // Tier 2: clinical warning flags present — continue intake, note in log.
        // phaseStatus will be 'escalated' in the state but the decision is NOT
        // 'escalate', so the route.ts will proceed to the LLM with the state context.
        console.log(`[NextQuestionSelector] Tier-2 soft flag(s): ${state.redFlagsFound.join(', ')} — continuing intake (LLM should use L3/L4).`);
    }

    if (state.clarifyPending) {
        return {
            type: 'clarify',
            field: getField(state, state.clarifyPending.field),
            reason: state.clarifyPending.reason,
            stopQuestioning: false,
        };
    }

    const requiredMissing = state.pendingQueue.find((field) =>
        field.priority === 1 && state.requiredPriorityOneFields.includes(field.key)
    );
    if (requiredMissing) {
        return {
            type: 'ask_required',
            field: requiredMissing,
            reason: 'Highest-priority required diagnostic field is missing.',
            stopQuestioning: false,
        };
    }

    const contextualField = state.pendingQueue.find((field) =>
        field.priority === 2 && isTriggerSatisfied(field as TriggerableField, state)
    );
    if (contextualField) {
        return {
            type: 'ask_contextual',
            field: contextualField,
            reason: 'Required fields are complete; next schema-specific contextual field is relevant.',
            stopQuestioning: false,
        };
    }

    const optionalField = state.pendingQueue.find((field) => field.priority === 3);
    if (optionalField) {
        return {
            type: 'ask_optional',
            field: optionalField,
            reason: 'No required or triggered contextual field remains; optional detail may still improve confidence.',
            stopQuestioning: false,
        };
    }

    return {
        type: 'summarize',
        field: null,
        reason: 'Required fields and relevant contextual fields are complete (Sufficiency met).',
        stopQuestioning: true,
    };
}

export function formatNextQuestionDecisionForPrompt(decision: NextQuestionDecision): string {
    return [
        '\n\n=== NEXT QUESTION SELECTOR DECISION ===',
        `decision: ${decision.type}`,
        `field: ${decision.field?.key ?? 'none'}`,
        `question: ${decision.field?.question ?? 'none'}`,
        `reason: ${decision.reason}`,
        `stopQuestioning: ${decision.stopQuestioning ? 'true' : 'false'}`,
        'RULES:',
        '- This selector decision wins over the generic prompt.',
        '- If decision is escalate, output only the emergency message and ask no questions.',
        '- If decision is clarify, rephrase the same field and do not advance.',
        '- If decision is ask_required, ask exactly that required field.',
        '- If decision is ask_contextual, ask exactly that schema-specific contextual field.',
        '- If decision is summarize, stop asking questions and provide a concise structured summary with likely possibilities.',
        '- IMPORTANT: If phaseStatus is escalated but decision is NOT escalate, a Tier-2 clinical warning sign was detected.',
        '  Continue the intake normally. Set escalation_level to L3 or L4 in the final JSON card.',
        '  Do NOT output an emergency message. Do NOT end the conversation abruptly.',
        '  Ask the next pending question as normal.',
        '=== END NEXT QUESTION SELECTOR DECISION ===',
    ].join('\n');
}
