import type { IntakeFieldDefinition, IntakeFieldKey } from './ConversationIntakeState';

export type SymptomSchemaId =
    | 'generic'
    | 'fever'
    | 'headache'
    | 'chest_pain'
    | 'abdominal_pain'
    | 'cough_cold'
    | 'vomiting_diarrhea'
    | 'skin_rash'
    | 'dizziness'
    | 'fatigue'
    | 'mental_health';

export type IntakeResponseType = 'text' | 'number' | 'boolean' | 'multi_select';

export interface SymptomQuestionField extends IntakeFieldDefinition {
    required: boolean;
    responseType: IntakeResponseType;
    aliases?: IntakeFieldKey[];
    triggerIf?: string;
    redFlagWhen?: string;
}

export interface SymptomQuestionSchema {
    id: SymptomSchemaId;
    label: string;
    match: RegExp;
    fields: SymptomQuestionField[];
}

export const GENERIC_SCHEMA: SymptomQuestionSchema = {
    id: 'generic',
    label: 'General symptom intake',
    match: /.*/,
    fields: [
        { key: 'chief_complaint', priority: 1, required: true, responseType: 'text', question: 'What is the main problem?' },
        { key: 'duration', priority: 1, required: true, responseType: 'text', question: 'How long has this been happening?' },
        { key: 'severity', priority: 1, required: true, responseType: 'number', question: 'How bad is it on a scale of 1 to 10?' },
        { key: 'location', priority: 2, required: false, responseType: 'text', question: 'Where exactly in the body is this happening?' },
        { key: 'sensation', priority: 2, required: false, responseType: 'text', question: 'What does the symptom or discomfort feel like?' },
        { key: 'associated', priority: 2, required: false, responseType: 'multi_select', question: 'Are there any other symptoms alongside this?' },
        { key: 'aggravation', priority: 2, required: false, responseType: 'text', question: 'What makes it worse?' },
        { key: 'amelioration', priority: 2, required: false, responseType: 'text', question: 'What gives relief?' },
        { key: 'history', priority: 3, required: false, responseType: 'text', question: 'How did it start, or what was happening before it began?' },
    ],
};

export const SYMPTOM_QUESTION_SCHEMAS: SymptomQuestionSchema[] = [
    {
        id: 'fever',
        label: 'Fever',
        match: /\b(fever|temperature|feverish|bukhar|high temp)\b/i,
        fields: [
            { key: 'chief_complaint', priority: 1, required: true, responseType: 'text', question: 'What is the main problem?' },
            { key: 'fever.temp_value', priority: 1, required: true, responseType: 'number', question: 'What is your temperature reading?', redFlagWhen: '>40C or <35C' },
            { key: 'fever.duration', aliases: ['duration'], priority: 1, required: true, responseType: 'text', question: 'How many days have you had the fever?', redFlagWhen: '>7 days' },
            { key: 'fever.rigors', priority: 1, required: true, responseType: 'boolean', question: 'Any chills or shaking?' },
            { key: 'fever.danger_signs', priority: 1, required: true, responseType: 'boolean', question: 'Any confusion, difficulty breathing, stiff neck, or persistent high fever?', redFlagWhen: 'any=true' },
            { key: 'fever.associated', aliases: ['associated'], priority: 2, required: false, responseType: 'multi_select', question: 'Any cough, sore throat, burning urine, rash, vomiting, or headache?' },
            { key: 'fever.travel', priority: 2, required: false, responseType: 'boolean', question: 'Any recent travel or contact with a sick person?', triggerIf: 'duration > 3 days' },
        ],
    },
    {
        id: 'headache',
        label: 'Headache',
        match: /\b(headache|head pain|migraine|sir dard|sar dard)\b/i,
        fields: [
            { key: 'chief_complaint', priority: 1, required: true, responseType: 'text', question: 'What is the main problem?' },
            { key: 'headache.duration', aliases: ['duration'], priority: 1, required: true, responseType: 'text', question: 'How long have you had the headache?' },
            { key: 'headache.severity', aliases: ['severity'], priority: 1, required: true, responseType: 'number', question: 'How severe is it on a scale of 1 to 10?' },
            { key: 'headache.danger_signs', priority: 1, required: true, responseType: 'boolean', question: 'Was it sudden and severe, or is there weakness, confusion, fainting, fever, or neck stiffness?', redFlagWhen: 'any=true' },
            { key: 'headache.location', aliases: ['location'], priority: 2, required: false, responseType: 'text', question: 'Where is the headache felt most?' },
            { key: 'headache.sensation', aliases: ['sensation'], priority: 2, required: false, responseType: 'text', question: 'What does the headache feel like?' },
            { key: 'headache.associated', aliases: ['associated'], priority: 2, required: false, responseType: 'multi_select', question: 'Any nausea, vomiting, light sensitivity, blurred vision, or sinus symptoms?' },
            { key: 'headache.triggers', aliases: ['aggravation'], priority: 3, required: false, responseType: 'text', question: 'What seems to trigger or worsen it?' },
        ],
    },
    {
        id: 'chest_pain',
        label: 'Chest pain',
        match: /\b(chest pain|chest tightness|chest pressure|heart pain|seene mein dard)\b/i,
        fields: [
            { key: 'chief_complaint', priority: 1, required: true, responseType: 'text', question: 'What is the main problem?' },
            { key: 'chest_pain.duration', aliases: ['duration'], priority: 1, required: true, responseType: 'text', question: 'When did the chest discomfort start?' },
            { key: 'chest_pain.severity', aliases: ['severity'], priority: 1, required: true, responseType: 'number', question: 'How severe is it on a scale of 1 to 10?' },
            { key: 'chest_pain.red_flags', priority: 1, required: true, responseType: 'boolean', question: 'Is there sweating, breathlessness, fainting, nausea, or pain spreading to the arm, jaw, or back?', redFlagWhen: 'any=true' },
            { key: 'chest_pain.character', aliases: ['sensation'], priority: 2, required: false, responseType: 'text', question: 'Does it feel like pressure, burning, sharp pain, or tightness?' },
            { key: 'chest_pain.exertion', aliases: ['aggravation'], priority: 2, required: false, responseType: 'boolean', question: 'Does it get worse with walking, climbing stairs, or exertion?' },
            { key: 'chest_pain.relief', aliases: ['amelioration'], priority: 2, required: false, responseType: 'text', question: 'Does rest, antacid, position change, or anything else relieve it?' },
        ],
    },
    {
        id: 'abdominal_pain',
        label: 'Abdominal pain',
        match: /\b(abdominal pain|stomach pain|stomach ache|belly pain|pet dard|abdomen)\b/i,
        fields: [
            { key: 'chief_complaint', priority: 1, required: true, responseType: 'text', question: 'What is the main problem?' },
            { key: 'abdominal_pain.location', aliases: ['location'], priority: 1, required: true, responseType: 'text', question: 'Where exactly is the abdominal pain?' },
            { key: 'abdominal_pain.duration', aliases: ['duration'], priority: 1, required: true, responseType: 'text', question: 'How long has the abdominal pain been present?' },
            { key: 'abdominal_pain.severity', aliases: ['severity'], priority: 1, required: true, responseType: 'number', question: 'How severe is it on a scale of 1 to 10?' },
            { key: 'abdominal_pain.danger_signs', priority: 1, required: true, responseType: 'boolean', question: 'Any severe worsening, rigid belly, fainting, blood in stool or vomit, or pregnancy possibility?', redFlagWhen: 'any=true' },
            { key: 'abdominal_pain.associated', aliases: ['associated'], priority: 2, required: false, responseType: 'multi_select', question: 'Any vomiting, diarrhea, fever, burning urine, constipation, or bloating?' },
            { key: 'abdominal_pain.food_stool', aliases: ['history'], priority: 3, required: false, responseType: 'text', question: 'Did it start after food, travel, alcohol, or a bowel change?' },
        ],
    },
    {
        id: 'cough_cold',
        label: 'Cough/cold',
        match: /\b(cough|cold|khansi|runny nose|blocked nose|sore throat|congestion)\b/i,
        fields: [
            { key: 'chief_complaint', priority: 1, required: true, responseType: 'text', question: 'What is the main problem?' },
            { key: 'cough_cold.duration', aliases: ['duration'], priority: 1, required: true, responseType: 'text', question: 'How many days have you had the cough or cold symptoms?' },
            { key: 'cough_cold.breathing_red_flags', priority: 1, required: true, responseType: 'boolean', question: 'Any difficulty breathing, chest pain, blue lips, or coughing blood?', redFlagWhen: 'any=true' },
            { key: 'cough_cold.fever', priority: 2, required: false, responseType: 'boolean', question: 'Do you also have fever or chills?' },
            { key: 'cough_cold.sputum', aliases: ['sensation'], priority: 2, required: false, responseType: 'text', question: 'Is the cough dry, or are you bringing up mucus?' },
            { key: 'cough_cold.associated', aliases: ['associated'], priority: 2, required: false, responseType: 'multi_select', question: 'Any sore throat, runny nose, wheezing, body ache, or headache?' },
            { key: 'cough_cold.exposure', aliases: ['history'], priority: 3, required: false, responseType: 'boolean', question: 'Any contact with someone sick, dust exposure, smoke exposure, or recent travel?' },
        ],
    },
    {
        id: 'vomiting_diarrhea',
        label: 'Vomiting/diarrhea',
        match: /\b(vomiting|vomit|diarrhea|loose motion|loose motions|dast|ulti)\b/i,
        fields: [
            { key: 'chief_complaint', priority: 1, required: true, responseType: 'text', question: 'What is the main problem?' },
            { key: 'vomiting_diarrhea.duration', aliases: ['duration'], priority: 1, required: true, responseType: 'text', question: 'How long has the vomiting or diarrhea been happening?' },
            { key: 'vomiting_diarrhea.frequency', priority: 1, required: true, responseType: 'number', question: 'How many times has it happened in the last 24 hours?' },
            { key: 'vomiting_diarrhea.dehydration_red_flags', priority: 1, required: true, responseType: 'boolean', question: 'Any very low urine, extreme weakness, dizziness, blood, black stool, or inability to keep fluids down?', redFlagWhen: 'any=true' },
            { key: 'vomiting_diarrhea.associated', aliases: ['associated'], priority: 2, required: false, responseType: 'multi_select', question: 'Any fever, abdominal pain, headache, recent outside food, or travel?' },
            { key: 'vomiting_diarrhea.intake', aliases: ['amelioration'], priority: 2, required: false, responseType: 'text', question: 'Are you able to drink water or ORS and keep it down?' },
        ],
    },
    {
        id: 'skin_rash',
        label: 'Skin rash',
        match: /\b(rash|skin rash|hives|itching|khujli|red spots|daane)\b/i,
        fields: [
            { key: 'chief_complaint', priority: 1, required: true, responseType: 'text', question: 'What is the main problem?' },
            { key: 'skin_rash.duration', aliases: ['duration'], priority: 1, required: true, responseType: 'text', question: 'How long has the rash or skin symptom been present?' },
            { key: 'skin_rash.spread_location', aliases: ['location'], priority: 1, required: true, responseType: 'text', question: 'Where is it, and is it spreading?' },
            { key: 'skin_rash.danger_signs', priority: 1, required: true, responseType: 'boolean', question: 'Any swelling of lips or face, breathing difficulty, fever, severe pain, blisters, or purple spots?', redFlagWhen: 'any=true' },
            { key: 'skin_rash.sensation', aliases: ['sensation'], priority: 2, required: false, responseType: 'text', question: 'Is it itchy, painful, burning, dry, or oozing?' },
            { key: 'skin_rash.exposure', aliases: ['history'], priority: 2, required: false, responseType: 'text', question: 'Any new food, medicine, skincare product, insect bite, or plant/contact exposure?' },
        ],
    },
    {
        id: 'dizziness',
        label: 'Dizziness',
        match: /\b(dizziness|dizzy|vertigo|lightheaded|faint|chakkar)\b/i,
        fields: [
            { key: 'chief_complaint', priority: 1, required: true, responseType: 'text', question: 'What is the main problem?' },
            { key: 'dizziness.duration', aliases: ['duration'], priority: 1, required: true, responseType: 'text', question: 'How long has the dizziness been happening?' },
            { key: 'dizziness.type', aliases: ['sensation'], priority: 1, required: true, responseType: 'text', question: 'Does it feel like spinning, lightheadedness, imbalance, or near-fainting?' },
            { key: 'dizziness.neuro_red_flags', priority: 1, required: true, responseType: 'boolean', question: 'Any weakness, slurred speech, chest pain, fainting, severe headache, or new vision trouble?', redFlagWhen: 'any=true' },
            { key: 'dizziness.triggers', aliases: ['aggravation'], priority: 2, required: false, responseType: 'text', question: 'Does it happen with standing, head movement, exertion, or not eating?' },
            { key: 'dizziness.associated', aliases: ['associated'], priority: 2, required: false, responseType: 'multi_select', question: 'Any nausea, ear symptoms, palpitations, sweating, fever, or dehydration?' },
        ],
    },
    {
        id: 'fatigue',
        label: 'Fatigue',
        match: /\b(fatigue|tired|weakness|weak|exhausted|low energy|thakan|kamzori)\b/i,
        fields: [
            { key: 'chief_complaint', priority: 1, required: true, responseType: 'text', question: 'What is the main problem?' },
            { key: 'fatigue.duration', aliases: ['duration'], priority: 1, required: true, responseType: 'text', question: 'How long have you been feeling this tired or weak?' },
            { key: 'fatigue.severity', aliases: ['severity'], priority: 1, required: true, responseType: 'number', question: 'How much is it affecting daily activity on a scale of 1 to 10?' },
            { key: 'fatigue.red_flags', priority: 1, required: true, responseType: 'boolean', question: 'Any chest pain, breathlessness, fainting, fever, unexplained weight loss, or black stools?', redFlagWhen: 'any=true' },
            { key: 'fatigue.sleep_stress', aliases: ['history'], priority: 2, required: false, responseType: 'text', question: 'How have sleep, stress, diet, and workload been recently?' },
            { key: 'fatigue.associated', aliases: ['associated'], priority: 2, required: false, responseType: 'multi_select', question: 'Any fever, body ache, low mood, heavy periods, dizziness, or appetite change?' },
        ],
    },
    {
        id: 'mental_health',
        label: 'Mental health',
        match: /\b(anxiety|panic|depression|sad|stress|low mood|hopeless|mental health|ghabrahat|udas)\b/i,
        fields: [
            { key: 'chief_complaint', priority: 1, required: true, responseType: 'text', question: 'What is the main problem?' },
            { key: 'mental_health.safety', priority: 1, required: true, responseType: 'boolean', question: 'Are you having thoughts of harming yourself or feeling unsafe right now?', redFlagWhen: 'yes=true' },
            { key: 'mental_health.duration', aliases: ['duration'], priority: 1, required: true, responseType: 'text', question: 'How long have you been feeling this way?' },
            { key: 'mental_health.severity', aliases: ['severity'], priority: 1, required: true, responseType: 'number', question: 'How intense does it feel on a scale of 1 to 10?' },
            { key: 'mental_health.sleep_appetite', aliases: ['associated'], priority: 2, required: false, responseType: 'text', question: 'How are your sleep, appetite, energy, and concentration?' },
            { key: 'mental_health.triggers_support', aliases: ['history'], priority: 2, required: false, responseType: 'text', question: 'Did anything trigger this, and do you have someone safe you can talk to?' },
        ],
    },
];

export function selectSymptomQuestionSchema(text: string): SymptomQuestionSchema {
    return SYMPTOM_QUESTION_SCHEMAS.find((schema) => schema.match.test(text)) ?? GENERIC_SCHEMA;
}

export function getSchemaFieldByKey(
    schema: SymptomQuestionSchema,
    key: IntakeFieldKey
): SymptomQuestionField | undefined {
    return schema.fields.find((field) => field.key === key);
}

export function resolveSchemaFieldKey(
    schema: SymptomQuestionSchema,
    key: IntakeFieldKey
): IntakeFieldKey {
    if (schema.fields.some((field) => field.key === key)) return key;
    const aliasMatch = schema.fields.find((field) => field.aliases?.includes(key));
    return aliasMatch?.key ?? key;
}

export function getRequiredPriorityOneFields(schema: SymptomQuestionSchema): IntakeFieldKey[] {
    return schema.fields
        .filter((field) => field.required && field.priority === 1)
        .map((field) => field.key);
}
