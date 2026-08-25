import type { IntakeFieldDefinition, IntakeFieldKey } from './ConversationIntakeState';
import {
    normalizeReproductiveContext,
    shouldAskPregnancyQuestion,
    type RawProfileInput,
} from '../QuestionApplicabilityEngine';

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
    | 'mental_health'
    | 'eye_problem'
    | 'body_pain';

export type IntakeResponseType = 'text' | 'number' | 'boolean' | 'multi_select';

export interface SymptomQuestionField extends IntakeFieldDefinition {
    required: boolean;
    responseType: IntakeResponseType;
    aliases?: IntakeFieldKey[];
    triggerIf?: string;
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
            { key: 'fever.temp_value', priority: 1, required: true, responseType: 'number', question: 'What is your temperature reading?', redFlagFn: (v) => { const n = parseFloat(v); return v.toUpperCase().includes('F') ? (n > 104 || n < 95) : (n > 40 || n < 35); } },
            { key: 'fever.duration', aliases: ['duration'], priority: 1, required: true, responseType: 'text', question: 'How many days have you had the fever?', redFlagFn: (v) => parseInt(v) > 7 },
            { key: 'fever.rigors', priority: 1, required: true, responseType: 'boolean', question: 'Any chills or shaking?' },
            { key: 'fever.danger_signs', priority: 1, required: true, responseType: 'boolean', question: 'Any confusion, difficulty breathing, stiff neck, or persistent high fever?', redFlagFn: (v) => v === 'yes' },
            { key: 'fever.associated', aliases: ['associated'], priority: 1, required: true, responseType: 'multi_select', question: 'Any cough, sore throat, burning urine, rash, vomiting, or headache?' },
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
            { key: 'headache.danger_signs', priority: 1, required: true, responseType: 'boolean', question: 'Was it sudden and severe, or is there weakness, confusion, fainting, fever, or neck stiffness?', redFlagFn: (v) => v === 'yes' },
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
            { key: 'chest_pain.red_flags', priority: 1, required: true, responseType: 'boolean', question: 'Is there sweating, breathlessness, fainting, nausea, or pain spreading to the arm, jaw, or back?', redFlagFn: (v) => v === 'yes' },
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
            { key: 'abdominal_pain.danger_signs', priority: 1, required: true, responseType: 'boolean', question: 'Any severe worsening, rigid belly, fainting, or blood in stool or vomit?', redFlagFn: (v) => v === 'yes' },
            { key: 'abdominal_pain.associated', aliases: ['associated'], priority: 2, required: false, responseType: 'multi_select', question: 'Any vomiting, diarrhea, fever, burning urine, constipation, or bloating?' },
            { key: 'abdominal_pain.food_stool', aliases: ['history'], priority: 3, required: false, responseType: 'text', question: 'Did it start after food, travel, alcohol, or a bowel change?' },
        ],
    },
    {
        id: 'cough_cold',
        label: 'Cough/cold',
        match: /\b(cough|cold|khansi|runny nose|blocked nose|sore throat|throat pain|pain in (?:my )?throat|gala dard|tonsil|tonsillitis|painful swallowing|swallowing pain|congestion)\b/i,
        fields: [
            { key: 'chief_complaint', priority: 1, required: true, responseType: 'text', question: 'What is the main problem?' },
            { key: 'cough_cold.duration', aliases: ['duration'], priority: 1, required: true, responseType: 'text', question: 'How many days have you had the throat, cough, or cold symptoms?' },
            { key: 'cough_cold.breathing_red_flags', priority: 1, required: true, responseType: 'boolean', question: 'Any difficulty breathing, chest pain, blue lips, coughing blood, throat swelling, drooling, or inability to swallow?', redFlagFn: (v) => v === 'yes' },
            { key: 'cough_cold.fever', priority: 2, required: false, responseType: 'boolean', question: 'Do you also have fever or chills?' },
            { key: 'cough_cold.sputum', aliases: ['sensation'], priority: 2, required: false, responseType: 'text', question: 'Is the cough dry, or are you bringing up mucus?' },
            { key: 'cough_cold.associated', aliases: ['associated'], priority: 2, required: false, responseType: 'multi_select', question: 'Any sore throat, runny nose, wheezing, body ache, or headache?' },
            { key: 'cough_cold.exposure', aliases: ['history'], priority: 3, required: false, responseType: 'boolean', question: 'Any contact with someone sick, dust exposure, smoke exposure, or recent travel?' },
        ],
    },
    {
        id: 'vomiting_diarrhea',
        label: 'Nausea, Vomiting & Diarrhea',
        match: /\b(vomiting|vomit|diarrhea|loose motion|loose motions|dast|ulti|nausea|nauseous|nauseated|queasy|throwing up|throw up|feel sick|sick to stomach|upset stomach|indigestion|acid reflux)\b/i,
        fields: [
            { key: 'chief_complaint', priority: 1, required: true, responseType: 'text', question: 'What is the main problem?' },
            { key: 'vomiting_diarrhea.duration', aliases: ['duration'], priority: 1, required: true, responseType: 'text', question: 'How long have you had the nausea, vomiting, or stomach upset?' },
            { key: 'vomiting_diarrhea.severity', aliases: ['severity'], priority: 1, required: true, responseType: 'number', question: 'How bothersome is it on a scale of 1 to 10?' },
            { key: 'vomiting_diarrhea.dehydration_red_flags', priority: 2, required: false, responseType: 'boolean', question: 'Are you able to keep water or ORS down, or is there extreme weakness, very low urine, or blood in vomit/stool?', redFlagFn: (v) => v === 'yes' },
            { key: 'vomiting_diarrhea.frequency', priority: 2, required: false, responseType: 'number', question: 'How many times have you vomited or had loose motions today, or is it mostly nausea?' },
            { key: 'vomiting_diarrhea.food_trigger', aliases: ['history'], priority: 2, required: false, responseType: 'text', question: 'Did this start after eating specific food, or is there any stomach pain or fever?' },
            { key: 'vomiting_diarrhea.associated', aliases: ['associated'], priority: 2, required: false, responseType: 'multi_select', question: 'Any fever, abdominal pain, headache, dizziness, or recent travel?' },
            { key: 'vomiting_diarrhea.intake', aliases: ['amelioration'], priority: 2, required: false, responseType: 'text', question: 'Are you able to drink water or ORS, and does anything help settle your stomach?' },
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
            { key: 'skin_rash.danger_signs', priority: 1, required: true, responseType: 'boolean', question: 'Any swelling of the lips or face, difficulty breathing, or purple/dark spots that do not fade when pressed?', redFlagFn: (v) => v === 'yes' },
            { key: 'skin_rash.blisters', priority: 2, required: false, responseType: 'boolean', question: 'Are there blisters or open sores on the rash — and if so, are they spreading rapidly or covering a large area?' },
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
            { key: 'dizziness.neuro_red_flags', priority: 1, required: true, responseType: 'boolean', question: 'Any weakness, slurred speech, chest pain, fainting, severe headache, or new vision trouble?', redFlagFn: (v) => v === 'yes' },
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
            { key: 'fatigue.red_flags', priority: 1, required: true, responseType: 'boolean', question: 'Any chest pain, breathlessness, fainting, fever, unexplained weight loss, or black stools?', redFlagFn: (v) => v === 'yes' },
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
            { key: 'mental_health.safety', priority: 1, required: true, responseType: 'boolean', question: 'Are you having thoughts of harming yourself or feeling unsafe right now?', redFlagFn: (v) => v === 'yes' },
            { key: 'mental_health.duration', aliases: ['duration'], priority: 1, required: true, responseType: 'text', question: 'How long have you been feeling this way?' },
            { key: 'mental_health.severity', aliases: ['severity'], priority: 1, required: true, responseType: 'number', question: 'How intense does it feel on a scale of 1 to 10?' },
            { key: 'mental_health.sleep_appetite', aliases: ['associated'], priority: 2, required: false, responseType: 'text', question: 'How are your sleep, appetite, energy, and concentration?' },
            { key: 'mental_health.triggers_support', aliases: ['history'], priority: 2, required: false, responseType: 'text', question: 'Did anything trigger this, and do you have someone safe you can talk to?' },
        ],
    },
    {
        id: 'eye_problem',
        label: 'Eye problem',
        match: /\b(eye pain|eye\s+problem|eye|eyes|blurry vision|blurred vision|vision loss|halos|seeing halos|red eye|watery eye|itchy eye|eye discharge|eyelid|stye|aankh|ankh|aankhon|nazar|aankh mein|aankh dard)\b/i,
        fields: [
            { key: 'chief_complaint', priority: 1, required: true, responseType: 'text', question: 'What is the main problem?' },
            { key: 'eye_problem.duration', aliases: ['duration'], priority: 1, required: true, responseType: 'text', question: 'How long has the eye problem been present?' },
            { key: 'eye_problem.severity', aliases: ['severity'], priority: 1, required: true, responseType: 'number', question: 'How severe is it on a scale of 1 to 10?' },
            {
                // IMPORTANT: Do NOT include "red eye" or "blurry vision" here — those are the
                // presenting complaints that selected this schema. Asking if the eye is "very red"
                // when the user just said "my eye is very red" guarantees a yes → false emergency.
                //
                // True glaucoma/retinal emergency discriminators are:
                //   1. Halos around lights (pathognomonic for acute angle-closure glaucoma)
                //   2. Sudden, significant vision loss (not mild blurring from discharge)
                //   3. SEVERE eye pain (not discomfort — pressure-like, 7+/10)
                //   4. Nausea or vomiting WITH eye pain (classic glaucoma constellation)
                key: 'eye_problem.danger_signs',
                priority: 1,
                required: true,
                responseType: 'boolean',
                question: 'Are you seeing coloured halos or rainbow rings around lights, or is there very severe eye pain (not just discomfort), or sudden loss of vision, or nausea and vomiting along with the eye problem?',
                redFlagFn: (v) => v === 'yes',
            },
            { key: 'eye_problem.laterality', priority: 2, required: false, responseType: 'text', question: 'Is one eye or both eyes affected?' },
            { key: 'eye_problem.sensation', aliases: ['sensation'], priority: 2, required: false, responseType: 'text', question: 'What does the eye problem feel like (e.g. burning, gritty, itchy, pressure, sharp)?' },
            { key: 'eye_problem.associated', aliases: ['associated'], priority: 2, required: false, responseType: 'multi_select', question: 'Any headache, sensitivity to light, discharge, tearing, or swelling around the eye?' },
            { key: 'eye_problem.exposure', aliases: ['history'], priority: 3, required: false, responseType: 'text', question: 'Any recent eye injury, chemical splash, contact lens use, or new eye drops?' },
        ],
    },
    {
        id: 'body_pain',
        label: 'Body pain',
        match: /\b(body pain|injury|hurt|sprain|strain|fracture|broken|joint|back|neck|shoulder|arm|leg|finger|toe|wrist|ankle|knee|hip|muscle|cramp|soreness|shoulder pain|knee pain|back pain|joint pain|muscle pain|kamar dard|ghutne|pair)\b/i,
        fields: [
            { key: 'chief_complaint', priority: 1, required: true, responseType: 'text', question: 'What is the main problem?' },
            { key: 'body_pain.duration', aliases: ['duration'], priority: 1, required: true, responseType: 'text', question: 'How long has the pain been present?' },
            { key: 'body_pain.severity', aliases: ['severity'], priority: 1, required: true, responseType: 'number', question: 'How severe is it on a scale of 1 to 10?' },
            { key: 'body_pain.red_flags', priority: 1, required: true, responseType: 'boolean', question: 'Any numbness, tingling, weakness, visible deformity, inability to bear weight, fever with swelling, or loss of bowel/bladder control with back or neck pain?', redFlagFn: (v) => v === 'yes' },
            { key: 'body_pain.location', aliases: ['location'], priority: 2, required: false, responseType: 'text', question: 'Where is the pain located?' },
            { key: 'body_pain.sensation', aliases: ['sensation'], priority: 2, required: false, responseType: 'text', question: 'What does the pain feel like (e.g. sharp, dull, aching, throbbing)?' },
            { key: 'body_pain.onset', aliases: ['history'], priority: 2, required: false, responseType: 'text', question: 'How did this start, or what were you doing before the pain began?' },
            { key: 'body_pain.aggravation', aliases: ['aggravation'], priority: 2, required: false, responseType: 'text', question: 'What makes the pain worse?' },
            { key: 'body_pain.amelioration', aliases: ['amelioration'], priority: 2, required: false, responseType: 'text', question: 'What gives relief?' },
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

/**
 * Returns a dynamically formatted question string for a schema field,
 * conditionally appending sex-specific questions (e.g. pregnancy) ONLY when
 * the patient's profile affirmatively supports it.
 *
 * Fail-closed: unknown/missing/malformed gender → no pregnancy question appended.
 * The QuestionApplicabilityEngine handles normalization so this function cannot
 * fail open regardless of what the caller passes.
 */
export function getFormattedFieldQuestion(
    field: SymptomQuestionField,
    userProfile?: RawProfileInput | { gender?: string | null; age?: number | string | null } | null
): string {
    if (field.key === 'abdominal_pain.danger_signs') {
        // Use the engine's typed normalization — handles case, trim, and unknown.
        // shouldAskPregnancyQuestion returns true only when:
        //   pregnancyCapacity === 'capable' (female or intersex) AND
        //   pregnancyStatus === 'unknown'  (not already answered)
        const ctx = {
            reproductive: normalizeReproductiveContext(userProfile ?? {}),
            age: null,
        };
        if (shouldAskPregnancyQuestion(ctx)) {
            return `${field.question} Could there also be any possibility of pregnancy?`;
        }
    }
    return field.question;
}
