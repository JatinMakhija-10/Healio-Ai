/**
 * redFlagDetector.ts — Compound Clinical Red Flag Detector
 *
 * Detects clinically significant multi-symptom patterns that indicate
 * emergencies. Designed to AUGMENT the existing single-symptom
 * EMERGENCY_PATTERNS in route.ts — NOT to replace them.
 *
 * The existing hasEmergencyRedFlag() catches single-keyword emergencies.
 * This module catches compound patterns requiring multiple co-occurring
 * symptoms (e.g. chest pain + arm + sweating = cardiac emergency).
 *
 * Zero LLM dependency. Pure regex/string matching only.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type RedFlagType =
    | 'CARDIAC_EMERGENCY'
    | 'SUBARACHNOID_HEMORRHAGE'
    | 'STROKE_FAST'
    | 'RESPIRATORY_EMERGENCY'
    | 'SEPSIS_RISK'
    | 'ANAPHYLAXIS'
    | 'HYPERTENSIVE_CRISIS'
    | 'PULMONARY_EMBOLISM'
    | 'AORTIC_DISSECTION'
    | 'MENINGITIS'
    | 'TESTICULAR_TORSION'
    | 'ECTOPIC_PREGNANCY';

export interface RedFlagResult {
    detected: boolean;
    flag: RedFlagType | null;
    matchedPattern: string | null;
    emergencyMessage: string;
}

// ─── Compound Pattern Definitions ────────────────────────────────────────────

interface CompoundPattern {
    flag: RedFlagType;
    /** All component patterns must match for the flag to trigger */
    components: RegExp[];
    emergencyMessage: string;
}

const COMPOUND_RED_FLAGS: CompoundPattern[] = [
    // ── Cardiovascular ────────────────────────────────────────────────────────
    {
        flag: 'CARDIAC_EMERGENCY',
        components: [
            /chest\s*(?:pain|tightness|pressure|discomfort|heaviness)/i,
            /(?:arm|jaw|neck|shoulder|back)\s*(?:pain|ache|radiating|numbness)|radiating\s*(?:to|down|into|towards|in)?\s*(?:my)?\s*(?:left|right)?\s*(?:arm|jaw|neck|shoulder|back)/i,
        ],
        emergencyMessage:
            '⚠️ URGENT: Chest pain radiating to the arm, jaw, or neck may indicate a heart attack. Call 112 (India) or 911 (US) immediately. Do not wait.',
    },
    {
        flag: 'CARDIAC_EMERGENCY',
        components: [
            /chest\s*(?:pain|tightness|pressure|discomfort)/i,
            /sweating|diaphoresis|cold\s*sweat|clammy/i,
        ],
        emergencyMessage:
            '⚠️ URGENT: Chest pain with sweating can indicate a cardiac emergency. Call 112 (India) or 911 (US) immediately.',
    },
    {
        flag: 'AORTIC_DISSECTION',
        components: [
            /(?:sudden|severe|tearing|ripping|worst)\s*(?:chest|back)\s*(?:pain)/i,
            /(?:tearing|ripping|stabbing|radiating\s*to\s*back)/i,
        ],
        emergencyMessage:
            '⚠️ URGENT: Sudden severe tearing chest or back pain may indicate aortic dissection, a life-threatening emergency. Call 112 (India) or 911 (US) immediately.',
    },

    // ── Neurological ──────────────────────────────────────────────────────────
    {
        flag: 'SUBARACHNOID_HEMORRHAGE',
        components: [
            /(?:sudden|severe|worst|thunderclap)\s*(?:severe\s*)?headache/i,
            /(?:worst.*life|never.*had|thunderclap|sudden\s*onset|split\s*second)/i,
        ],
        emergencyMessage:
            '⚠️ URGENT: A sudden "thunderclap" headache — the worst of your life — can indicate a brain bleed (subarachnoid haemorrhage). This is a medical emergency. Call 112 (India) or 911 (US) now.',
    },
    {
        flag: 'STROKE_FAST',
        components: [
            /face\s*(?:drooping|droop|numb|weakness)|facial\s*(?:droop|weakness)/i,
            /arm\s*(?:weakness|numb|heavy)|one\s*(?:side|arm)\s*(?:weak|numb)/i,
        ],
        emergencyMessage:
            '⚠️ URGENT: Facial drooping with arm weakness are classic stroke signs (FAST criteria). Call 112 (India) or 911 (US) immediately — time is critical.',
    },
    {
        flag: 'STROKE_FAST',
        components: [
            /slurred?\s*speech|speech\s*(?:slurred|difficulty|problem)|can'?t\s*speak\s*clearly/i,
            /(?:face\s*droop|arm\s*weak|sudden\s*confusion|sudden\s*vision)/i,
        ],
        emergencyMessage:
            '⚠️ URGENT: Slurred speech with facial drooping or arm weakness are stroke warning signs. Call 112 (India) or 911 (US) immediately.',
    },
    {
        flag: 'MENINGITIS',
        components: [
            /stiff\s*neck|neck\s*stiffness|can'?t\s*(?:bend|touch)\s*(?:chin|neck)/i,
            /fever|high\s*temperature/i,
            /(?:severe\s*headache|photophobia|light\s*sensitivity|rash)/i,
        ],
        emergencyMessage:
            '⚠️ URGENT: Fever with stiff neck and headache may indicate meningitis, a medical emergency. Call 112 (India) or 911 (US) immediately.',
    },

    // ── Respiratory ───────────────────────────────────────────────────────────
    {
        flag: 'PULMONARY_EMBOLISM',
        components: [
            /shortness\s*of\s*breath|difficulty\s*breathing|can'?t\s*breathe/i,
            /chest\s*(?:pain|tightness)|pleuritic\s*pain/i,
            /(?:recent\s*(?:surgery|flight|travel|immobilisation|leg\s*swelling)|coughing\s*blood|haemoptysis)/i,
        ],
        emergencyMessage:
            '⚠️ URGENT: Breathlessness with chest pain and recent immobility or surgery may indicate a pulmonary embolism (blood clot in lung). Call 112 (India) or 911 (US) immediately.',
    },

    // ── Sepsis ────────────────────────────────────────────────────────────────
    {
        flag: 'SEPSIS_RISK',
        components: [
            /fever|high\s*temperature|\d+\s*°[CF]|\btemp\b/i,
            /(?:confusion|disoriented|altered\s*consciousness|not\s*making\s*sense)/i,
            /(?:rapid\s*breathing|breathing\s*fast|very\s*fast\s*pulse|heart\s*racing)/i,
        ],
        emergencyMessage:
            '⚠️ URGENT: Fever with confusion and rapid breathing can indicate sepsis, a life-threatening condition. Call 112 (India) or 911 (US) immediately.',
    },
    {
        flag: 'SEPSIS_RISK',
        components: [
            /fever|high\s*temperature/i,
            /(?:cold\s*(?:hands|feet|skin)|mottled\s*skin|pale\s*and\s*cold|clammy)/i,
        ],
        emergencyMessage:
            '⚠️ URGENT: Fever with cold extremities or mottled skin may indicate septic shock. This is a medical emergency. Call 112 (India) or 911 (US) immediately.',
    },

    // ── Allergic / Anaphylaxis ────────────────────────────────────────────────
    {
        flag: 'ANAPHYLAXIS',
        components: [
            /(?:throat\s*(?:swelling|closing|tightening)|tongue\s*swelling|difficulty\s*swallowing)/i,
            /(?:rash|hives|urticaria|itching)/i,
        ],
        emergencyMessage:
            '⚠️ URGENT: Throat swelling with rash after exposure to a substance may be anaphylaxis — a life-threatening allergic reaction. Use an EpiPen if available and call 112 (India) or 911 (US) immediately.',
    },

    // ── Hypertensive Crisis ───────────────────────────────────────────────────
    {
        flag: 'HYPERTENSIVE_CRISIS',
        components: [
            /(?:blood\s*pressure|bp|systolic)\s*(?:of\s*)?(?:1[89]\d|2\d{2})/i,
            /(?:severe\s*headache|vision\s*(?:change|blurred|loss)|chest\s*pain|confusion)/i,
        ],
        emergencyMessage:
            '⚠️ URGENT: Extremely high blood pressure with symptoms like severe headache or vision changes is a hypertensive emergency. Seek immediate medical care.',
    },

    // ── Gynaecological / Abdominal ────────────────────────────────────────────
    {
        flag: 'ECTOPIC_PREGNANCY',
        components: [
            /(?:sudden|severe|sharp)\s*(?:pelvic|lower\s*abdominal|one.?sided)\s*pain/i,
            /(?:missed\s*period|pregnant|positive\s*test|could\s*be\s*pregnant)/i,
            /(?:shoulder\s*tip\s*pain|dizziness|fainting|vaginal\s*bleeding)/i,
        ],
        emergencyMessage:
            '⚠️ URGENT: Severe one-sided pelvic pain with a missed period or pregnancy may indicate an ectopic pregnancy, which can be life-threatening. Call 112 (India) or 911 (US) immediately.',
    },

    // ── Urological ────────────────────────────────────────────────────────────
    {
        flag: 'TESTICULAR_TORSION',
        components: [
            /(?:sudden|severe)\s*(?:testicular|scrotal|testicle)\s*(?:pain|swelling)/i,
            /(?:nausea|vomiting|abdominal\s*pain)/i,
        ],
        emergencyMessage:
            '⚠️ URGENT: Sudden severe testicular pain with nausea may indicate testicular torsion — a surgical emergency. Call 112 (India) or 911 (US) immediately. Every minute counts.',
    },
];

// ─── Negation Guard ───────────────────────────────────────────────────────────

const NEGATION_WINDOW_CHARS = 40;
const NEGATION_PATTERN =
    /\b(?:no|not|without|deny|denies|denied|negative\s+for|do\s+not\s+have|don'?t\s+have|does\s+not\s+have|doesn'?t\s+have|nahi|nahin|nahi\s+hai)\b/i;

function isNegated(text: string, matchIndex: number): boolean {
    const before = text.slice(Math.max(0, matchIndex - NEGATION_WINDOW_CHARS), matchIndex);
    return NEGATION_PATTERN.test(before);
}

// ─── Main Detector ────────────────────────────────────────────────────────────

const DEFAULT_EMERGENCY_MESSAGE =
    '⚠️ URGENT: Based on what you have described, please seek emergency medical care immediately. Call 112 (India) or 911 (US) or go to the nearest emergency room now. Arovia cannot assist with potential emergencies.';

/**
 * Detects compound red-flag patterns in a user message.
 *
 * Each pattern requires ALL component regexes to match (non-negated)
 * for the flag to trigger. This reduces false positives from single-word
 * triggers (e.g., the word "chest" alone does not trigger CARDIAC_EMERGENCY).
 *
 * @param message  The raw user message text.
 * @returns        RedFlagResult with detected flag and emergency message.
 */
export function detectCompoundRedFlags(message: string): RedFlagResult {
    if (!message?.trim()) {
        return { detected: false, flag: null, matchedPattern: null, emergencyMessage: DEFAULT_EMERGENCY_MESSAGE };
    }

    for (const { flag, components, emergencyMessage } of COMPOUND_RED_FLAGS) {
        const allMatch = components.every(pattern => {
            const match = pattern.exec(message);
            if (!match) return false;
            return !isNegated(message, match.index);
        });

        if (allMatch) {
            return {
                detected: true,
                flag,
                matchedPattern: components.map(c => c.source).join(' AND '),
                emergencyMessage,
            };
        }
    }

    return { detected: false, flag: null, matchedPattern: null, emergencyMessage: DEFAULT_EMERGENCY_MESSAGE };
}

/**
 * Builds the emergency SSE response text for a detected compound red flag.
 * Includes the specific emergency message + the standard Arovia disclaimer.
 */
export function buildEmergencyResponseText(result: RedFlagResult): string {
    if (!result.detected || !result.flag) return DEFAULT_EMERGENCY_MESSAGE;

    return [
        result.emergencyMessage,
        '',
        'WARNING: Arovia cannot assist with potential emergencies. Please call emergency services immediately.',
    ].join('\n');
}
