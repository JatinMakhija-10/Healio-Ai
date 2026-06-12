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
    extractFn?: (userText: string) => string | null;
    redFlagFn?: (value: string) => boolean;
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
    /** Phase 5: Symptoms confirmed via yes/no clarification answers */
    confirmedSymptoms: string[];
    /** Phase 5: Symptoms denied via yes/no clarification answers (feeds Bayesian excluded list) */
    excludedSymptoms: string[];
    coverageScore: number;
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
    { label: 'seizure', pattern: /\b(seizure|convulsion|fitting|mirgi)\b/i },
    { label: 'suicidal thoughts', pattern: /\b(suicidal|suicide|kill myself|end my life|want to die|self.?harm)\b/i },
    { label: 'sudden severe headache', pattern: /\b(worst headache|sudden severe headache|thunderclap headache)\b/i },
    { label: 'severe abdominal pain', pattern: /\b(severe abdominal pain|rigid abdomen|unbearable stomach pain)\b/i },
    { label: 'anaphylaxis', pattern: /\b(lips swelling|throat swelling|tongue swelling|anaphylaxis|severe allergic reaction)\b/i },
    { label: 'pregnancy emergency', pattern: /\b(pregnant.*bleeding|pregnant.*severe pain|pregnancy.*emergency)\b/i },
    { label: 'altered consciousness', pattern: /\b(confusion|hallucinating|delirious|not making sense)\b/i },
    { label: 'severe bleeding', pattern: /\b(vomiting blood|blood in vomit|black stool|severe bleeding|heavy bleeding)\b/i }
];

const BODY_LOCATION_PATTERN =
    /\b(head|forehead|eye|eyes|ear|ears|nose|throat|neck|chest|stomach|abdomen|belly|back|lower back|shoulder|arm|hand|leg|knee|foot|feet|skin|face|scalp|sinus|tooth|teeth|pelvis|urine|urinary)\b/i;

const SYMPTOM_PATTERN =
    /\b(fever|headache|cough|cold|rash|vomiting|diarrhea|loose motion|nausea|dizziness|fatigue|weakness|pain|ache|burning|itching|congestion|sore throat|chills|breathless|anxiety|palpitations|swelling|bukhar|khansi|ulti|dast|chakkar|thakan|jalan|khujli)\b/i;

const SENSATION_PATTERN =
    /\b(sharp|stabbing|dull|aching|burning|itching|tingling|numb|pressure|tightness|throbbing|pulsing|cramping|swollen|tender|blocked|congested|runny|watery|heavy|weak|tired|nausea|uneasy|dry|wet|productive|tight|scratchy|hoarse|sore|raw|stiff|achy)\b/i;

const ASSOCIATED_SYMPTOM_PATTERN =
    /\b(fever|chills|cough|sore throat|burning urine|rash|vomiting|nausea|headache|dizziness|fatigue|weakness|diarrhea|loose motion|body ache|shortness of breath|sweating|runny nose|blocked nose|ear pain|palpitations|joint pain|back pain)\b/i;

// Matches durations with OR without leading preposition ("for", "since", "from")
// Also handles bare relative times: "morning", "evening", "afternoon", "last night"
const DURATION_PATTERN =
    /\b(?:for|since|from|se)?\s*((?:today|yesterday|last night|this morning|this evening|this afternoon|few hours|a few hours|couple of hours|couple of days|several days|morning|evening|afternoon|[1-9]\d?(?:\s*(?:-|to)\s*[1-9]\d?)?\s*(?:minute|minutes|hour|hours|ghante|ghanta|day|days|din|dino|dino se|week|weeks|hafta|hafte|month|months|mahina|mahine|year|years|saal)|one\s+(?:hour|day|week|month|year)|two\s+(?:hours|days|weeks|months|years)|three\s+(?:hours|days|weeks|months|years)))\b/i;

// IMPORTANT: Severity MUST be anchored with context ("X/10", "X out of 10", "severity is X", "X on a scale")
// to avoid matching bare numbers like the "3" in "for 3 days"
const SEVERITY_PATTERN =
    /(?:(?:severity|intensity|pain level|pain|rate|rating|score)\s*(?:is|was|around|about|of|:)?\s*([1-9]|10)\b)|(?:\b([1-9]|10)\s*(?:\/\s*10|out of 10|on a scale))/i;

function extractTemperature(text: string): string | undefined {
    const normalized = text.toLowerCase();
    
    // Pattern to look for numbers adjacent to f/c/fahrenheit/celsius/celcius/degree
    // e.g. "99-101 degree", "38.5 c", "101.2F"
    const pattern = /(?<![\d])(\d{2,3}(?:\.\d+)?)\s*(?:-|to)?\s*(\d{2,3}(?:\.\d+)?)?[\s]*(?:degrees?|°)?[\s]*(f|c|fahrenheit|celsius|celcius)?(?![a-zA-Z])/g;
    
    let match;
    const candidates: Array<{ val: number; unit: 'F' | 'C' }> = [];
    
    while ((match = pattern.exec(normalized)) !== null) {
        const val1 = parseFloat(match[1]);
        const val2 = match[2] ? parseFloat(match[2]) : null;
        const unitWord = match[3];

        const processVal = (val: number) => {
            let unit: 'F' | 'C' | null = null;
            
            // Explicit unit check with sanity magnitude correction
            if (unitWord === 'f' || unitWord === 'fahrenheit') {
                if (val >= 34 && val <= 45) {
                    unit = 'C'; // correction
                } else {
                    unit = 'F';
                }
            } else if (unitWord === 'c' || unitWord === 'celsius' || unitWord === 'celcius') {
                if (val >= 94 && val <= 115) {
                    unit = 'F'; // correction (e.g. "101 celcius")
                } else {
                    unit = 'C';
                }
            } else {
                // Inferred from magnitude
                if (val >= 94 && val <= 115) {
                    unit = 'F';
                } else if (val >= 34 && val <= 45) {
                    unit = 'C';
                }
            }

            if (unit) {
                candidates.push({ val, unit });
            }
        };

        processVal(val1);
        if (val2 !== null) {
            processVal(val2);
        }
    }

    if (candidates.length > 0) {
        candidates.sort((a, b) => b.val - a.val);
        return `${candidates[0].val}${candidates[0].unit}`;
    }

    // Fallback: search pure numbers in ranges
    const numberMatches = normalized.match(/\b\d{2,3}(?:\.\d+)?\b/g);
    if (numberMatches) {
        const temps: Array<{ val: number; unit: 'F' | 'C' }> = [];
        for (const m of numberMatches) {
            const val = parseFloat(m);
            if (val >= 94 && val <= 115) {
                temps.push({ val, unit: 'F' });
            } else if (val >= 34 && val <= 45) {
                temps.push({ val, unit: 'C' });
            }
        }
        if (temps.length > 0) {
            temps.sort((a, b) => b.val - a.val);
            return `${temps[0].val}${temps[0].unit}`;
        }
    }

    return undefined;
}

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
        const temperature = extractTemperature(normalized);
        setValue('fever.temp_value', temperature);
    }

    // Severity: capture group 1 = labelled ("severity is 7"), group 2 = anchored ("7/10" or "7 out of 10")
    const severityMatch = normalized.match(SEVERITY_PATTERN);
    const explicitSeverity = severityMatch?.[1] ?? severityMatch?.[2];
    if (explicitSeverity) {
        setValue('severity', `${explicitSeverity}/10`);
    } else if (pendingField === 'severity' || pendingField?.endsWith('.severity')) {
        // If the bot just asked for severity and user said a word descriptor, use it
        const wordSeverity = normalized.match(/\b(mild|slight|moderate|medium|severe|bad|very bad|unbearable|extreme)\b/i)?.[1];
        if (wordSeverity) setValue('severity', wordSeverity);
    } else if (/\b(mild|slight|moderate|medium|severe|bad|very bad|unbearable|extreme)\b/i.test(normalized)) {
        // Word severity is only safe when there's no competing number in the message
        if (!normalized.match(/\b[1-9]\d?\s*(days?|weeks?|months?|hours?|minutes?)\b/i)) {
            setValue('severity', normalized.match(/\b(mild|slight|moderate|medium|severe|bad|very bad|unbearable|extreme)\b/i)?.[1]);
        }
    }

    const location = normalized.match(BODY_LOCATION_PATTERN)?.[1];
    setValue('location', location);

    const sensation = normalized.match(SENSATION_PATTERN)?.[1];
    setValue('sensation', sensation);

    const associatedMatches = normalized.match(new RegExp(ASSOCIATED_SYMPTOM_PATTERN.source, 'gi'));
    if (associatedMatches && associatedMatches.length > 0) {
        setValue('associated', Array.from(new Set(associatedMatches.map(normalizeValue))).join(', '));
    }

    // Aggravation: match triggers including time-of-day and food patterns
    if (/\b(worse|gets worse|worsens|triggered by|aggravated|after eating|after food|after meals|on walking|while walking|lying down|on exertion|exercise|stress|cold air|movement|at night|in morning|bending|breathing|deep breath|spicy|fatty|dairy|alcohol)\b/i.test(normalized)) {
        setValue('aggravation', normalized);
    }

    if (/\b(better|relief|helps|improves|rest|sleep|warm|cold compress|ice|medicine|after eating|drinking water|antacid|painkiller|lying down|sitting up|fresh air)\b/i.test(normalized)) {
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
        const redFlagField = activeSchema.fields.find((field) => field.redFlagFn)?.key;
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

    // Apply strict extractFn and redFlagFn from the schema definitions if provided
    activeSchema.fields.forEach(field => {
        if (field.extractFn) {
            const extracted = field.extractFn(normalized);
            if (extracted !== null) {
                values[field.key] = extracted;
            }
        }
        // Run redFlagFn on the value if it exists
        const val = values[field.key];
        if (val && field.redFlagFn) {
            if (field.redFlagFn(val)) {
                // Synthesize a red flag trigger
                values[`${field.key}_red_flag_trigger`] = 'yes'; 
            }
        }
    });

    return values;
}

function findRedFlags(messages: ChatTranscriptMessage[]): string[] {
    const userText = messages
        .filter((message) => message.role === 'user')
        .map((message) => message.content)
        .join('\n');

    const redFlags: string[] = [];
    for (const { label, pattern } of RED_FLAG_PATTERNS) {
        let match: RegExpExecArray | null;
        const localPattern = new RegExp(pattern.source, 'gi');
        while ((match = localPattern.exec(userText)) !== null) {
            const matchIndex = match.index;
            const matchText = match[0];
            
            // Check context before match (English/Hinglish pre-negation)
            const contextBefore = userText.slice(Math.max(0, matchIndex - 25), matchIndex).toLowerCase();
            const isPreNegated = /\b(no|not|dont|don't|without|free of|nahi|na|no\s+other|denies|denied)\b\s*$/i.test(contextBefore) ||
                                 /\b(no|not|dont|don't|without|free of|nahi|na|no\s+other|denies|denied)\s+\w+\s*$/i.test(contextBefore) ||
                                 /\b(no|not|dont|don't|without|free of|nahi|na|no\s+other|denies|denied)\s+\w+\s+\w+\s*$/i.test(contextBefore);

            // Check context after match (Hindi/Hinglish post-negation)
            const contextAfter = userText.slice(matchIndex + matchText.length, matchIndex + matchText.length + 20).toLowerCase();
            const isPostNegated = /^\s*\b(nahi|na|no|not|nil|none)\b/i.test(contextAfter) ||
                                  /^\s*\w+\s+\b(nahi|na|no|not|nil|none)\b/i.test(contextAfter);

            if (!isPreNegated && !isPostNegated) {
                redFlags.push(label);
                break;
            }
        }
    }
    return redFlags;
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
        
        // Also capture synthesized red flags into collectedData
        for (const key of Object.keys(extracted)) {
            if (key.endsWith('_red_flag_trigger') && extracted[key]) {
                collectedData.set(key, extracted[key]!);
            }
        }

        previousAssistantField = null;
    }

    const answeredFields = new Set(collectedData.keys());
    const redFlagsFound = findRedFlags(messages);
    
    // Add synthesized red flags from specific field answers
    for (const [key, value] of collectedData.entries()) {
        if (key.endsWith('_red_flag_trigger') && value === 'yes') {
            redFlagsFound.push(key.replace('_red_flag_trigger', ''));
        }
    }

    const pendingQueue = fieldDefinitions
        .filter((definition) => !answeredFields.has(definition.key) && !definition.key.endsWith('_red_flag_trigger'))
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

    // ── Phase 5: Yes/No symptom tracking ─────────────────────────────────────
    // Scans transcript for binary question/answer pairs to extract confirmed
    // and excluded symptoms for Bayesian re-scoring.
    const confirmedSymptoms: string[] = [];
    const excludedSymptoms: string[] = [];
    const YES_RE = /^(yes|yeah|yep|haan|ha|correct|true|definitely|absolutely|sure)\b/i;
    const NO_RE = /^(no|nope|nah|nahi|not|never|false|don't|dont|na)\b/i;
    const BINARY_Q_RE = /\b(do you|are you|have you|did you|is there|does it|can you|would you)\b.*\?/i;

    let lastBinaryField: string | null = null;
    for (const msg of messages) {
        if (msg.role === 'assistant') {
            if (BINARY_Q_RE.test(msg.content)) {
                // Extract a quoted keyword as the field label
                const m = msg.content.match(/"([^"]{2,40})"/);
                lastBinaryField = m?.[1] ?? null;
            } else {
                lastBinaryField = null;
            }
            continue;
        }
        if (msg.role === 'user' && lastBinaryField) {
            const trimmed = msg.content.trim();
            if (YES_RE.test(trimmed) && !confirmedSymptoms.includes(lastBinaryField)) {
                confirmedSymptoms.push(lastBinaryField);
            } else if (NO_RE.test(trimmed) && !excludedSymptoms.includes(lastBinaryField)) {
                excludedSymptoms.push(lastBinaryField);
            }
            lastBinaryField = null;
        }
    }

    const p1Fields = getRequiredPriorityOneFields(activeSchema);
    const answeredP1Fields = p1Fields.filter((field) => answeredFields.has(field));
    const coverageScore = p1Fields.length > 0 ? Math.round((answeredP1Fields.length / p1Fields.length) * 100) : 100;

    return {
        chiefComplaint: collectedData.get('chief_complaint') ?? null,
        activeSchemaId: activeSchema.id,
        activeSchemaLabel: activeSchema.label,
        fieldDefinitions,
        requiredPriorityOneFields: p1Fields,
        answeredFields,
        collectedData,
        pendingQueue,
        redFlagsFound,
        clarifyPending,
        phaseStatus: redFlagsFound.length > 0 ? 'escalated' : pendingQueue.length === 0 ? 'summary' : 'intake',
        confirmedSymptoms,
        excludedSymptoms,
        coverageScore,
    };
}

export function hasMinimumDiagnosticData(state: ConversationIntakeState): boolean {
    return state.requiredPriorityOneFields.every((field) => state.answeredFields.has(field));
}

/**
 * Phase 5: Returns the list of symptoms explicitly denied by the user via yes/no answers.
 * These should be passed to the Bayesian engine as `excludedSymptoms` to prevent
 * false-positive scoring.
 */
export function getExcludedSymptoms(state: ConversationIntakeState): string[] {
    return state.excludedSymptoms;
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
        `coverageScore: ${state.coverageScore}%`,
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
