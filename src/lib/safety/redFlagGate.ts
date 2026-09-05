/**
 * redFlagGate.ts — Deterministic Red-Flag Override Gate
 *
 * Runs BEFORE the Bayesian MCMC engine, BEFORE any LLM, on every user turn.
 * If triggered, the pipeline short-circuits and returns a fixed,
 * clinician-reviewed emergency message — the LLM is bypassed entirely.
 *
 * Design principles (from c1.md Part I, §I.1):
 *   - Fixed, non-generative output: messages are clinician-approved copy, never LLM-authored
 *   - Runs pre-persona: fires the same regardless of Health Persona state
 *   - Negation-aware, but fails safe: for high-stakes rules (self-harm),
 *     excludeIfNegated is false — escalates even on a hedge
 *   - Every rule requires clinician sign-off before merge
 *
 * AUGMENTS existing red-flag systems (engine.ts scanRedFlags, redFlagDetector.ts) —
 * does NOT replace them. This gate has PRIORITY: it runs first and its output
 * is final (no downstream processing can override an EMERGENCY_STOP).
 *
 * Zero LLM dependency. Pure functions only.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type RedFlagAction = 'EMERGENCY_STOP' | 'URGENT_ESCALATION';

export interface RedFlagRule {
    /** Stable identifier for audit trail and change-control tracking */
    id: string;
    /** All patterns are tested against the input; ANY match triggers the rule */
    patterns: RegExp[];
    /**
     * If true, the rule is skipped when negation is detected in a window
     * before the match. If false (e.g. suicidal ideation), the rule fires
     * even if phrased tentatively — false negatives are more dangerous
     * than false positives for these rules.
     */
    excludeIfNegated: boolean;
    /** EMERGENCY_STOP = bypass LLM entirely; URGENT_ESCALATION = inject alert, continue */
    action: RedFlagAction;
    /**
     * Fixed, clinician-reviewed copy — never LLM-generated.
     * CLINICIAN_REVIEW_REQUIRED: these messages must be signed off by a
     * licensed clinician before production merge.
     */
    message: string;
}

export interface RedFlagGateResult {
    rule: RedFlagRule;
    action: RedFlagAction;
    message: string;
}

// ─── Negation Detection ───────────────────────────────────────────────────────

/**
 * Window size (in chars) to look back from a pattern match for negation tokens.
 * Matches the approach used in redFlagDetector.ts for consistency.
 */
const NEGATION_WINDOW_CHARS = 60;

const NEGATION_PATTERN =
    /\b(?:no|not|without|without\s+any|deny|denies|denied|negative\s+for|do\s+not\s+have|don'?t\s+have|does\s+not\s+have|doesn'?t\s+have|never\s+had|rules?\s+out|ruled\s+out|nahi|nahin|nahi\s+hai)\b/i;

function isNegated(text: string, matchIndex: number): boolean {
    const before = text.slice(Math.max(0, matchIndex - NEGATION_WINDOW_CHARS), matchIndex);
    return NEGATION_PATTERN.test(before);
}

// ─── Rule Table ───────────────────────────────────────────────────────────────
// CLINICAL CONTENT — requires licensed clinician sign-off before merge.
// Do not modify messages without clinical review. Treat like a formulary,
// not standard code.

export const RED_FLAG_RULES: RedFlagRule[] = [
    // ── 1. Cardiac Emergency (chest pain + radiation) ────────────────────────
    {
        id: 'chest_pain_cardiac',
        patterns: [
            /chest\s*(?:pain|pressure|tightness)/i,
            /pain.*(arm|jaw|back).*chest/i,
            /chest.*(radiating|radiat).*(arm|jaw|back|shoulder)/i,
        ],
        excludeIfNegated: true,
        action: 'EMERGENCY_STOP',
        // CLINICIAN_REVIEW_REQUIRED
        message:
            'This combination of symptoms needs immediate in-person emergency evaluation. ' +
            'Please call your local emergency number (112 in India, 911 in US) or go to the nearest ER now — ' +
            'this is not something to assess further here.',
    },

    // ── 2. Stroke — FAST signs ───────────────────────────────────────────────
    {
        id: 'stroke_fast',
        patterns: [
            /(sudden|one[- ]?sided).*(weakness|numbness|droop)/i,
            /slurred speech/i,
            /sudden.*vision loss/i,
        ],
        excludeIfNegated: true,
        action: 'EMERGENCY_STOP',
        // CLINICIAN_REVIEW_REQUIRED
        message:
            'These can be signs of a stroke, where minutes matter. ' +
            'Please call emergency services (112 in India, 911 in US) immediately.',
    },

    // ── 3. Suicidal Ideation / Self-Harm ─────────────────────────────────────
    // NEVER skip, even if phrased tentatively — false negatives are lethal.
    {
        id: 'suicidal_ideation',
        patterns: [
            /(want|going|plan)\s+to\s+(die|kill myself|end\s+(it|my life))/i,
            /suicid/i,
            /kill\s+myself/i,
            /end\s+my\s+life/i,
            /no\s+reason\s+to\s+live/i,
            /better\s+off\s+dead/i,
            /self[- ]?harm/i,
        ],
        excludeIfNegated: false, // NEVER skip — fails safe
        action: 'EMERGENCY_STOP',
        // CLINICIAN_REVIEW_REQUIRED
        message:
            'I hear you, and I want you to know that help is available right now.\n\n' +
            '• National Suicide Prevention Lifeline: 988 (US) / iCall: 9152987821 (India)\n' +
            '• Crisis Text Line: Text HOME to 741741 (US)\n' +
            '• Vandrevala Foundation: 1860-2662-345 (India)\n\n' +
            'Please reach out to one of these services — you are not alone, and these feelings can get better with support.',
    },

    // ── 4. Severe Breathing Difficulty ───────────────────────────────────────
    {
        id: 'severe_breathing_difficulty',
        patterns: [
            /(can'?t|unable\s+to)\s+(breathe|catch\s+(my|his|her)\s+breath)/i,
            /gasping/i,
            /can'?t\s+breathe/i,
        ],
        excludeIfNegated: true,
        action: 'EMERGENCY_STOP',
        // CLINICIAN_REVIEW_REQUIRED
        message:
            'Difficulty breathing like this needs emergency care right away. ' +
            'Please call emergency services (112 in India, 911 in US).',
    },

    // ── 5. Suspected DVT/PE (compound presentation) ─────────────────────────
    {
        id: 'suspected_dvt_pe',
        patterns: [
            /sudden.*(shortness\s+of\s+breath|chest\s+pain).*swelling/i,
            /swelling.*sudden.*(shortness\s+of\s+breath|chest\s+pain)/i,
        ],
        excludeIfNegated: true,
        action: 'URGENT_ESCALATION',
        // CLINICIAN_REVIEW_REQUIRED
        message:
            'This combination raises concern for a blood clot. ' +
            'Please seek same-day in-person medical evaluation — ' +
            "don't wait for this to resolve on its own.",
    },
];

// ─── Main Gate Function ───────────────────────────────────────────────────────

/**
 * Checks raw text input against the deterministic red-flag rule table.
 * Returns the first matching rule result, or null if no rules fire.
 *
 * Rules are evaluated in priority order (cardiac → stroke → self-harm →
 * breathing → DVT/PE). First match wins — no further rules are checked.
 *
 * @param text  Raw user message text or concatenated symptom text.
 *              Case-insensitive matching is applied by the patterns.
 * @returns     RedFlagGateResult if a rule fires, null otherwise.
 */
export function checkRedFlags(text: string): RedFlagGateResult | null {
    if (!text?.trim()) return null;

    for (const rule of RED_FLAG_RULES) {
        for (const pattern of rule.patterns) {
            const match = pattern.exec(text);
            if (!match) continue;

            // If rule allows negation exclusion, check for it
            if (rule.excludeIfNegated && isNegated(text, match.index)) {
                continue;
            }

            // Match found and not negated (or negation check not applicable)
            return {
                rule,
                action: rule.action,
                message: rule.message,
            };
        }
    }

    return null;
}

/**
 * Builds a plain-text emergency response string from a gate result.
 * Includes the clinician-reviewed message plus a standard Arovia disclaimer.
 */
export function buildGateResponseText(result: RedFlagGateResult): string {
    return [
        result.message,
        '',
        'Arovia cannot assist with potential emergencies. Please contact emergency services or a healthcare provider immediately.',
    ].join('\n');
}
