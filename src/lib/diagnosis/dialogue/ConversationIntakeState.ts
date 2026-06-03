/**
 * Transcript-derived clinical intake state.
 *
 * The goal is to make the next question deterministic: extract only user-stated
 * answers, mark fields as answered, then expose the next unanswered priority.
 */

import {
    GENERIC_SCHEMA,
    getRequiredPriorityOneFields,
    getSchemaFieldByKey,
    resolveSchemaFieldKey,
    selectSymptomQuestionSchema,
    type SymptomSchemaId,
} from './SymptomQuestionSchemas';

export type IntakeFieldKey = string;

export type IntakePhaseStatus = 'triage' | 'intake' | 'summary' | 'escalated';

export interface IntakeFieldDefinition {
    key: IntakeFieldKey;
    priority: 1 | 2 | 3;
    question: string;
    aliases?: IntakeFieldKey[];
    required?: boolean;
}

export interface ConversationIntakeState {
    chiefComplaint: string | null;
    activeSchemaId: SymptomSchemaId;
    activeSchemaLabel: string;
    fieldDefinitions: IntakeFieldDefinition[];
    requiredPriorityOneFields: IntakeFieldKey[];
    answeredFields: Set<IntakeFieldKey>;
    collectedData: Map<IntakeFieldKey, string>;
    pendingQueue: IntakeFieldDefinition[];
    redFlagsFound: string[];
    clarifyPending: { field: IntakeFieldKey; reason: string } | null;
    phaseStatus: IntakePhaseStatus;
}

export interface ChatTranscriptMessage {
    role: string;
    content: string;
}

export const INTAKE_FIELD_DEFINITIONS: IntakeFieldDefinition[] = GENERIC_SCHEMA.fields;

const RED_FLAG_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
    { label: 'chest pain', pattern: /\b(chest pain|pressure in chest|crushing chest|severe chest)\b/i },
    { label: 'breathing difficulty', pattern: /\b(shortness of breath|difficulty breathing|can't breathe|unable to breathe|breathless)\b/i },
    { label: 'stroke signs', pattern: /\b(slurred speech|face drooping|facial droop|sudden numbness|arm weakness)\b/i },
    { label: 'loss of consciousness', pattern: /\b(loss of consciousness|passed out|unconscious|fainted)\b/i },
    { label: 'coughing blood', pattern: /\b(coughing blood|blood in cough|khoon.*khansi)\b/i },
    { label: 'seizure', pattern: /\b(seizure|convulsion|fitting)\b/i },
    { label: 'suicidal thoughts', pattern: /\b(suicidal|suicide|kill myself|end my life|want to die|self.?harm)\b/i },
    { label: 'sudden severe headache', pattern: /\b(worst headache|sudden severe headache|thunderclap headache)\b/i },
    { label: 'severe abdominal pain', pattern: /\b(severe abdominal pain|rigid abdomen|unbearable stomach pain)\b/i },
];

const BODY_LOCATION_PATTERN =
    /\b(head|forehead|eye|eyes|ear|ears|nose|throat|neck|chest|stomach|abdomen|belly|back|lower back|shoulder|arm|hand|leg|knee|foot|feet|skin|face|scalp|sinus|tooth|teeth|pelvis|urine|urinary)\b/i;

const SYMPTOM_PATTERN =
    /\b(fever|headache|cough|cold|rash|vomiting|diarrhea|loose motion|nausea|dizziness|fatigue|weakness|pain|ache|burning|itching|congestion|sore throat|chills|breathless|anxiety|palpitations|swelling|bukhar|khansi|ulti|dast|chakkar|thakan|jalan|khujli)\b/i;

const SENSATION_PATTERN =
    /\b(sharp|stabbing|dull|aching|burning|itching|tingling|numb|pressure|tightness|throbbing|pulsing|cramping|swollen|tender|blocked|congested|runny|watery|heavy|weak|tired|nausea|uneasy)\b/i;

const ASSOCIATED_SYMPTOM_PATTERN =
    /\b(fever|chills|cough|sore throat|burning urine|rash|vomiting|nausea|headache|dizziness|fatigue|weakness|diarrhea|loose motion|body ache|shortness of breath|sweating)\b/i;

const DURATION_PATTERN =
    /\b(?:for|since|from)?\s*((?:today|yesterday|last night|this morning|few hours|a few hours|couple of hours|couple of days|several days|[1-9]\d?\s*(?:minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)|one\s+(?:hour|day|week|month|year)|two\s+(?:hours|days|weeks|months|years)|three\s+(?:hours|days|weeks|months|years)))\b/i;

const SEVERITY_PATTERN =
    /\b(?:severity|intensity|pain|rate|rating)?\s*(?:is|was|around|about|:)?\s*([1-9]|10)\s*(?:\/\s*10|out of 10|on a scale)?\b/i;

const TEMPERATURE_PATTERN =
    /\b((?:9[5-9]|10[0-9]|11[0-9])(?:\.\d+)?)\s*(?:°?\s*f|fahrenheit)?\b|\b([3-4]\d(?:\.\d+)?)\s*(?:°?\s*c|celsius)\b/i;

function normalizeValue(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}

function normalizeQuestion(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function isUsefulAnswer(text: string): boolean {
    const normalized = normalizeValue(text);
    if (!normalized) return false;
    if (/^(yes|yeah|yep|no|nope|ok|okay|hmm)$/i.test(normalized)) return false;
    if (/\b(not sure|don't know|do not know|what do you mean|what you mean|samajh nahi|confused)\b/i.test(normalized)) return false;
    return true;
}

function findFieldByAlias(
    fieldDefinitions: IntakeFieldDefinition[],
    alias: IntakeFieldKey
): IntakeFieldKey {
    return fieldDefinitions.find((field) => field.key === alias || field.aliases?.includes(alias))?.key ?? alias;
}

export function inferAskedFieldFromAssistant(
    content: string,
    fieldDefinitions: IntakeFieldDefinition[] = INTAKE_FIELD_DEFINITIONS
): IntakeFieldKey | null {
    const text = content.toLowerCase();
    const normalizedText = normalizeQuestion(content);

    const matchingDefinition = fieldDefinitions
        .filter((field) => normalizeQuestion(field.question).length > 12)
        .find((field) => normalizedText.includes(normalizeQuestion(field.question)));
    if (matchingDefinition) return matchingDefinition.key;

    const uiHint = text.match(/"question_type"\s*:\s*"([^"]+)"/);
    const questionType = uiHint?.[1];
    if (questionType === 'duration') return findFieldByAlias(fieldDefinitions, 'duration');
    if (questionType === 'severity') return findFieldByAlias(fieldDefinitions, 'severity');
    if (questionType === 'sensation') return findFieldByAlias(fieldDefinitions, 'sensation');
    if (questionType === 'associated_symptoms') return findFieldByAlias(fieldDefinitions, 'associated');
    if (questionType === 'aggravation') return findFieldByAlias(fieldDefinitions, 'aggravation');
    if (questionType === 'amelioration') return findFieldByAlias(fieldDefinitions, 'amelioration');

    if (/temperature reading|temperature|fever reading/.test(text)) {
        return fieldDefinitions.find((field) => field.key === 'fever.temp_value')?.key ??
            findFieldByAlias(fieldDefinitions, 'severity');
    }
    if (/how long|since when|when did|duration|how many days/.test(text)) return findFieldByAlias(fieldDefinitions, 'duration');
    if (/scale of 1|1 to 10|intensity|severity|how bad/.test(text)) return findFieldByAlias(fieldDefinitions, 'severity');
    if (/where exactly|which part|location|body/.test(text)) return findFieldByAlias(fieldDefinitions, 'location');
    if (/feel like|type of discomfort|sensation|sharp|burning|itching/.test(text)) return findFieldByAlias(fieldDefinitions, 'sensation');
    if (/other symptoms|alongside|associated|any fever|nausea|dizziness/.test(text)) return findFieldByAlias(fieldDefinitions, 'associated');
    if (/worse|trigger|aggravate|makes it worse/.test(text)) return findFieldByAlias(fieldDefinitions, 'aggravation');
    if (/relief|better|helps|gives relief/.test(text)) return findFieldByAlias(fieldDefinitions, 'amelioration');
    if (/how did it start|what was happening|before it began|dietary change|poor sleep|stress/.test(text)) return findFieldByAlias(fieldDefinitions, 'history');
    if (/main problem|what's bothering|what is bothering|what concern/.test(text)) return 'chief_complaint';

    return null;
}

function extractFieldValues(
    text: string,
    pendingField: IntakeFieldKey | null,
    activeSchema = GENERIC_SCHEMA
): Partial<Record<IntakeFieldKey, string>> {
    const normalized = normalizeValue(text);
    const values: Partial<Record<IntakeFieldKey, string>> = {};
    const setValue = (key: IntakeFieldKey, value: string | undefined) => {
        if (!value) return;
        values[resolveSchemaFieldKey(activeSchema, key)] = normalizeValue(value);
    };

    const duration = normalized.match(DURATION_PATTERN)?.[1];
    setValue('duration', duration);

    if (activeSchema.id === 'fever') {
        const temperatureMatch = normalized.match(TEMPERATURE_PATTERN);
        const temperature = temperatureMatch?.[1]
            ? `${temperatureMatch[1]}F`
            : temperatureMatch?.[2]
                ? `${temperatureMatch[2]}C`
                : undefined;
        setValue('fever.temp_value', temperature);
    }

    const explicitSeverity = normalized.match(SEVERITY_PATTERN)?.[1];
    if (explicitSeverity && (/\b(\/\s*10|out of 10|scale|severity|intensity|pain|rate|rating)\b/i.test(normalized) || pendingField === 'severity')) {
        setValue('severity', `${explicitSeverity}/10`);
    } else if (/\b(mild|slight|moderate|medium|severe|bad|very bad|unbearable|extreme)\b/i.test(normalized)) {
        setValue('severity', normalized.match(/\b(mild|slight|moderate|medium|severe|bad|very bad|unbearable|extreme)\b/i)?.[1]);
    }

    const location = normalized.match(BODY_LOCATION_PATTERN)?.[1];
    setValue('location', location);

    const sensation = normalized.match(SENSATION_PATTERN)?.[1];
    setValue('sensation', sensation);

    const associatedMatches = normalized.match(new RegExp(ASSOCIATED_SYMPTOM_PATTERN.source, 'gi'));
    if (associatedMatches && associatedMatches.length > 0) {
        setValue('associated', Array.from(new Set(associatedMatches.map(normalizeValue))).join(', '));
    }

    if (/\b(worse|triggered by|after eating|after food|on walking|while walking|lying down|exercise|stress|cold air|movement)\b/i.test(normalized)) {
        setValue('aggravation', normalized);
    }

    if (/\b(better|relief|helps|improves|rest|sleep|warm|cold compress|medicine|after eating|drinking water)\b/i.test(normalized)) {
        setValue('amelioration', normalized);
    }

    if (/\b(started after|began after|after i|since i|stress|poor sleep|diet|travel|contact|injury|fall|food|ate)\b/i.test(normalized)) {
        setValue('history', normalized);
    }

    if (activeSchema.id === 'fever' && /\b(chills|shaking|shivering|rigors|thand|kampkampi)\b/i.test(normalized)) {
        values['fever.rigors'] = 'yes';
    }

    if (activeSchema.id === 'fever' && /\b(travel|contact|sick person|exposed)\b/i.test(normalized)) {
        values['fever.travel'] = normalized;
    }

    if (/\b(confusion|difficulty breathing|stiff neck|persistent high fever|blood|fainting|blue lips|slurred speech|face drooping|self.?harm|suicid)\b/i.test(normalized)) {
        const redFlagField = activeSchema.fields.find((field) => field.redFlagWhen)?.key;
        if (redFlagField) values[redFlagField] = normalized;
    }

    if (SYMPTOM_PATTERN.test(normalized) && !values.chief_complaint) {
        values.chief_complaint = normalized;
    }

    if (pendingField && isUsefulAnswer(normalized)) {
        const pendingDefinition = getSchemaFieldByKey(activeSchema, pendingField);
        if (pendingDefinition?.responseType === 'boolean') {
            if (/^(yes|yeah|yep|haan|ha|true)\b/i.test(normalized)) values[pendingField] = 'yes';
            if (/^(no|nope|nah|nahi|false)\b/i.test(normalized)) values[pendingField] = 'no';
        }
        if (!values[pendingField]) values[pendingField] = normalized;
    } else if (pendingField) {
        const pendingDefinition = getSchemaFieldByKey(activeSchema, pendingField);
        if (pendingDefinition?.responseType === 'boolean') {
            if (/^(yes|yeah|yep|haan|ha|true)\b/i.test(normalized)) values[pendingField] = 'yes';
            if (/^(no|nope|nah|nahi|false)\b/i.test(normalized)) values[pendingField] = 'no';
        }
    }

    return values;
}

function findRedFlags(messages: ChatTranscriptMessage[]): string[] {
    const userText = messages
        .filter((message) => message.role === 'user')
        .map((message) => message.content)
        .join('\n');

    return RED_FLAG_PATTERNS
        .filter(({ pattern }) => pattern.test(userText))
        .map(({ label }) => label);
}

export function buildConversationIntakeState(messages: ChatTranscriptMessage[]): ConversationIntakeState {
    const userText = messages
        .filter((message) => message.role === 'user')
        .map((message) => message.content)
        .join('\n');
    const activeSchema = selectSymptomQuestionSchema(userText);
    const fieldDefinitions = activeSchema.fields;
    const collectedData = new Map<IntakeFieldKey, string>();
    let previousAssistantField: IntakeFieldKey | null = null;

    for (const message of messages) {
        if (message.role === 'assistant') {
            previousAssistantField = inferAskedFieldFromAssistant(message.content, fieldDefinitions);
            continue;
        }

        if (message.role !== 'user') continue;

        const extracted = extractFieldValues(message.content, previousAssistantField, activeSchema);
        for (const definition of fieldDefinitions) {
            const value = extracted[definition.key];
            if (value && !collectedData.has(definition.key)) {
                collectedData.set(definition.key, normalizeValue(value));
            }
        }

        previousAssistantField = null;
    }

    const answeredFields = new Set(collectedData.keys());
    const redFlagsFound = findRedFlags(messages);
    const pendingQueue = fieldDefinitions
        .filter((definition) => !answeredFields.has(definition.key))
        .sort((a, b) => a.priority - b.priority);

    const lastAssistantField = [...messages]
        .reverse()
        .find((message) => message.role === 'assistant');
    const lastAskedField = lastAssistantField ? inferAskedFieldFromAssistant(lastAssistantField.content, fieldDefinitions) : null;
    const lastMessage = messages[messages.length - 1];
    const clarifyPending =
        lastMessage?.role === 'user' &&
        lastAskedField &&
        !answeredFields.has(lastAskedField)
            ? { field: lastAskedField, reason: 'The latest reply did not contain a clear value for the pending field.' }
            : null;

    return {
        chiefComplaint: collectedData.get('chief_complaint') ?? null,
        activeSchemaId: activeSchema.id,
        activeSchemaLabel: activeSchema.label,
        fieldDefinitions,
        requiredPriorityOneFields: getRequiredPriorityOneFields(activeSchema),
        answeredFields,
        collectedData,
        pendingQueue,
        redFlagsFound,
        clarifyPending,
        phaseStatus: redFlagsFound.length > 0 ? 'escalated' : pendingQueue.length === 0 ? 'summary' : 'intake',
    };
}

export function hasMinimumDiagnosticData(state: ConversationIntakeState): boolean {
    return state.requiredPriorityOneFields.every((field) => state.answeredFields.has(field));
}

export function formatConversationIntakeStateForPrompt(state: ConversationIntakeState): string {
    const answered = [...state.answeredFields];
    const dataLines = [...state.collectedData.entries()]
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n') || '- none';
    const pendingLines = state.pendingQueue
        .map((field) => `- ${field.key} (priority ${field.priority}): ${field.question}`)
        .join('\n') || '- none';
    const nextField = state.clarifyPending?.field ?? state.pendingQueue[0]?.key ?? 'none';

    return [
        '\n\n=== SERVER CONVERSATION STATE MACHINE ===',
        `activeSchema: ${state.activeSchemaId} (${state.activeSchemaLabel})`,
        `phaseStatus: ${state.phaseStatus}`,
        `chiefComplaint: ${state.chiefComplaint ?? 'unknown'}`,
        `requiredPriorityOneFields: ${state.requiredPriorityOneFields.join(', ') || 'none'}`,
        `answeredFields: ${answered.length ? answered.join(', ') : 'none'}`,
        `redFlagsFound: ${state.redFlagsFound.length ? state.redFlagsFound.join(', ') : 'none'}`,
        `clarifyPending: ${state.clarifyPending ? `${state.clarifyPending.field} - ${state.clarifyPending.reason}` : 'none'}`,
        `nextFieldToAsk: ${nextField}`,
        'collectedData:',
        dataLines,
        'pendingQueue:',
        pendingLines,
        'RULES:',
        '- Treat collectedData as the only source of answered fields.',
        '- Never ask for any field listed in answeredFields.',
        '- If clarifyPending is not none, rephrase that same field and do not advance the queue.',
        '- If phaseStatus is escalated, stop normal questioning and provide the emergency message only.',
        '- If nextFieldToAsk is not none and this is not a final diagnosis turn, ask exactly that field and no other question.',
        '- If priority-1 fields are missing, do not give final diagnosis or remedy advice yet.',
        '=== END SERVER CONVERSATION STATE MACHINE ===',
    ].join('\n');
}
