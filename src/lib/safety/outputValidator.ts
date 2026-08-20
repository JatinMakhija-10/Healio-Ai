/**
 * Output Validator Middleware — v2 (Field-Level, Negation-Aware)
 *
 * Auditor note (Forensic Audit §7, F2):
 * The prior version scanned JSON.stringify(response) as a single blob, which:
 *   1. Cannot distinguish "pregnancy is not relevant" (SAFE) from "possible pregnancy" (VIOLATION)
 *   2. Cannot distinguish which field produced the violation
 *   3. Misses paraphrases ("expecting", "carrying", "gestation")
 *   4. Produces false positives that strip medically necessary content
 *
 * This version:
 *   - Scans each response field INDIVIDUALLY so violations are field-attributed
 *   - Applies a negation-window check (40-char lookback) before flagging
 *   - Uses the QuestionApplicabilityEngine for typed context (not raw gender strings)
 *   - Treats the sanitization step as defense-in-depth, not the primary control
 *     (the primary control is the QuestionApplicabilityEngine upstream)
 *
 * IMPORTANT: This validator is a SECOND LINE OF DEFENSE.
 * The first line is the QuestionApplicabilityEngine, which prevents inapplicable
 * content from entering the prompt at all. Relying on this validator as the
 * sole safety mechanism is still insufficient — see QuestionApplicabilityEngine.ts.
 */

import {
    normalizeReproductiveContext,
    buildApplicabilityContext,
    type RawProfileInput,
    type QuestionApplicabilityContext,
} from '@/lib/diagnosis/QuestionApplicabilityEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Legacy profile shape — kept for backwards compatibility. */
export interface ValidationProfile {
    gender?: string | null;
    age?: number | string | null;
    /** Optional: sexAtBirth takes precedence over gender if provided. */
    sexAtBirth?: string | null;
    /** Optional: list of remedies blocked by Stage 2.5 DDI filter */
    blockedRemedies?: string[];
}

export interface FieldViolation {
    field: string;
    term: string;
    excerpt: string;
}

export interface OutputValidationResult {
    isValid: boolean;
    /** Per-field violations for better observability than a flat list. */
    fieldViolations: FieldViolation[];
    /** Flat violation strings — backwards-compatible with existing call sites. */
    violations: string[];
    sanitizedJson?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TERM LISTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Female reproductive content that MUST NOT appear in responses for patients
 * where pregnancy is not applicable. Paraphrase-aware list.
 */
const FEMALE_REPRODUCTIVE_TERMS: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /\bpregnan\w*/i,               label: 'pregnant/pregnancy' },
    { pattern: /\bectopic\b/i,                label: 'ectopic' },
    { pattern: /\bmissed\s+period\b/i,        label: 'missed period' },
    { pattern: /\btrimester\b/i,              label: 'trimester' },
    { pattern: /\bbreastfeed\w*/i,            label: 'breastfeeding' },
    { pattern: /\buter(?:us|ine)\b/i,         label: 'uterus/uterine' },
    { pattern: /\bovarian\b/i,                label: 'ovarian' },
    { pattern: /\bexpecting\s+a\s+baby\b/i,   label: 'expecting a baby' },
    { pattern: /\bconception\b/i,             label: 'conception' },
    { pattern: /\bgestati\w*/i,               label: 'gestation' },
    { pattern: /\bmenstrua\w*/i,              label: 'menstrual' },
    { pattern: /\bamenorrh\w*/i,              label: 'amenorrhea' },
];

/**
 * Negation tokens that, when found within a 40-character window immediately
 * before a flagged term, indicate the term is being denied or ruled out.
 */
const NEGATION_WINDOW_PATTERN =
    /\b(?:not|no|without|denies|denied|negative\s+for|do\s+not\s+have|don't\s+have|does\s+not\s+have|doesn't\s+have|rules?\s+out|ruled\s+out|isn't|aren't|wasn't|aren't|not\s+relevant|not\s+applicable|nahi|nahin)\b/i;

/** Aspirin / acetylsalicylic patterns for the pediatric rule. */
const ASPIRIN_PATTERN = /\baspirin\b|\bacetylsalicylic\b/i;

// ═══════════════════════════════════════════════════════════════════════════════
// NEGATION-AWARE SCAN
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Returns true when the matched term appears to be NEGATED.
 * Checks a 40-char lookback window BEFORE the match (for "no pregnancy",
 * "not pregnant") AND a 50-char forward window AFTER the match (for
 * "Pregnancy is not relevant", "pregnancy... not applicable").
 * This is a heuristic — it reduces false positives without guaranteeing
 * zero false negatives. The primary control is the Applicability Engine.
 */
function isLikelyNegated(text: string, matchIndex: number, matchLength: number): boolean {
    // ── Lookback: check 40 chars before the term ──────────────────────────
    const windowStart = Math.max(0, matchIndex - 40);
    const precedingWindow = text.slice(windowStart, matchIndex);
    if (NEGATION_WINDOW_PATTERN.test(precedingWindow)) return true;

    // ── Forward: check 50 chars after the term ────────────────────────────
    // Catches patterns like "Pregnancy is not relevant", "pregnancy: not applicable"
    const followingEnd = Math.min(text.length, matchIndex + matchLength + 50);
    const followingWindow = text.slice(matchIndex + matchLength, followingEnd).toLowerCase();
    const FOLLOWING_NEGATION =
        /\b(?:is|are|was|were|'s)\s+not\b|\bnot\s+(?:relevant|applicable|present|a concern|confirmed|indicated|suspected|found|detected)\b/i;
    if (FOLLOWING_NEGATION.test(followingWindow)) return true;

    return false;
}

/**
 * Scans a single text field for female reproductive term violations.
 * Returns per-field violations with context excerpts for observability.
 */
function scanTextField(
    fieldName: string,
    text: string | undefined | null,
    ctx: QuestionApplicabilityContext,
): FieldViolation[] {
    if (!text) return [];

    if (ctx.reproductive.pregnancyCapacity !== 'not_applicable') return [];

    const violations: FieldViolation[] = [];

    for (const { pattern, label } of FEMALE_REPRODUCTIVE_TERMS) {
        const match = pattern.exec(text);
        if (!match) continue;

        if (isLikelyNegated(text, match.index, match[0].length)) continue;

        // Include a short excerpt for debugging
        const excerptStart = Math.max(0, match.index - 20);
        const excerptEnd = Math.min(text.length, match.index + match[0].length + 20);
        violations.push({
            field: fieldName,
            term: label,
            excerpt: text.slice(excerptStart, excerptEnd).replace(/\n/g, ' '),
        });
    }

    return violations;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validates an AI JSON response against the patient's applicability context and DDI safety list.
 *
 * @param jsonResponse  Parsed JSON response object from LLM inference
 * @param profile       Patient profile (legacy shape) or QuestionApplicabilityContext
 *                      May include `blockedRemedies` array from DDI check
 */
export function validateOutputAgainstProfile(
    jsonResponse: Record<string, unknown>,
    profile?: (ValidationProfile & RawProfileInput) | null,
): OutputValidationResult {
    if (!jsonResponse || typeof jsonResponse !== 'object') {
        return { isValid: true, fieldViolations: [], violations: [], sanitizedJson: jsonResponse };
    }

    // Build the applicability context from whatever profile shape we receive
    const ctx: QuestionApplicabilityContext = buildApplicabilityContext({
        sexAtBirth: (profile as RawProfileInput)?.sexAtBirth ?? undefined,
        gender: profile?.gender ?? undefined,
        age: profile?.age ?? undefined,
    });

    const fieldViolations: FieldViolation[] = [];

    // ── 1. Female Reproductive Safety Rule ──────────────────────────────────
    // Scan each named field individually instead of the whole serialized blob.
    const textFields: Array<{ name: string; value: string | undefined | null }> = [
        { name: 'question',      value: jsonResponse.question as string | undefined },
        { name: 'description',   value: jsonResponse.description as string | undefined },
        { name: 'rationale',     value: jsonResponse.rationale as string | undefined },
        { name: 'reasoning',     value: jsonResponse.reasoning as string | undefined },
        { name: 'followUp',      value: jsonResponse.followUp as string | undefined },
        { name: 'diagnosis',     value: jsonResponse.diagnosis as string | undefined },
        { name: 'summary',       value: jsonResponse.summary as string | undefined },
    ];

    for (const { name, value } of textFields) {
        fieldViolations.push(...scanTextField(name, value, ctx));
    }

    // Scan array fields element-by-element
    const arrayFields: Array<{ name: string; value: unknown }> = [
        { name: 'warnings',           value: jsonResponse.warnings },
        { name: 'redFlags',           value: jsonResponse.redFlags },
        { name: 'recommendations',    value: jsonResponse.recommendations },
        { name: 'followUpQuestions',  value: jsonResponse.followUpQuestions },
        { name: 'differentials',      value: jsonResponse.differentials },
    ];

    for (const { name, value } of arrayFields) {
        if (Array.isArray(value)) {
            value.forEach((item: unknown, idx: number) => {
                if (typeof item === 'string') {
                    fieldViolations.push(...scanTextField(`${name}[${idx}]`, item, ctx));
                }
            });
        }
    }

    // ── 2. DDI Blocked Remedies Safety Rule (P0-3) ───────────────────────────
    const blockedRemedies = profile?.blockedRemedies || [];
    if (blockedRemedies.length > 0) {
        const fullContentText = JSON.stringify(jsonResponse).toLowerCase();
        for (const blocked of blockedRemedies) {
            const blockedLower = blocked.trim().toLowerCase();
            if (!blockedLower) continue;

            // Check if blocked remedy appears in remedies array
            if (Array.isArray(jsonResponse.remedies)) {
                jsonResponse.remedies.forEach((r: unknown, idx: number) => {
                    const remedyName = (r as { name?: string })?.name?.toLowerCase() || '';
                    if (remedyName.includes(blockedLower) || blockedLower.includes(remedyName)) {
                        fieldViolations.push({
                            field: `remedies[${idx}]`,
                            term: `blocked_remedy:${blocked}`,
                            excerpt: `DDI Contraindication: "${blocked}" is strictly blocked for this patient.`,
                        });
                    }
                });
            }

            // Check if blocked remedy is mentioned in prose or description
            if (fullContentText.includes(blockedLower)) {
                fieldViolations.push({
                    field: 'response_text',
                    term: `blocked_remedy:${blocked}`,
                    excerpt: `DDI Contraindication: Mention of blocked remedy "${blocked}" detected in LLM output.`,
                });
            }
        }
    }

    // ── 2. Pediatric Aspirin Safety Rule ────────────────────────────────────
    const parsedAge = (() => {
        if (!profile?.age) return null;
        const n = parseInt(String(profile.age), 10);
        return isNaN(n) ? null : n;
    })();

    if (parsedAge !== null && parsedAge < 12) {
        // For aspirin we still scan the full blob since it may appear in nested objects
        const fullText = JSON.stringify(jsonResponse);
        if (ASPIRIN_PATTERN.test(fullText)) {
            fieldViolations.push({
                field: 'full_response',
                term: 'aspirin',
                excerpt: `Pediatric patient (age ${parsedAge}) — aspirin contraindicated (Reye syndrome risk)`,
            });
        }
    }

    if (fieldViolations.length === 0) {
        return {
            isValid: true,
            fieldViolations: [],
            violations: [],
            sanitizedJson: jsonResponse,
        };
    }

    // ── Violations found: log and sanitize ───────────────────────────────────
    const violations = fieldViolations.map(
        (v) => `[${v.field}] "${v.term}" — ${v.excerpt}`,
    );
    console.warn('[OutputValidator] Field-level violations detected:', fieldViolations);

    const sanitized = JSON.parse(JSON.stringify(jsonResponse)) as Record<string, unknown>;

    // P0-3 Blocked Remedy Sanitization
    if (blockedRemedies.length > 0 && Array.isArray(sanitized.remedies)) {
        sanitized.remedies = (sanitized.remedies as Array<{ name?: string }>).filter((r) => {
            const name = r.name?.toLowerCase() || '';
            return !blockedRemedies.some((b) => {
                const bLower = b.trim().toLowerCase();
                return bLower && (name.includes(bLower) || bLower.includes(name));
            });
        });
    }

    const reproCtx = normalizeReproductiveContext({
        gender: profile?.gender,
        sexAtBirth: (profile as RawProfileInput)?.sexAtBirth,
    });

    // Only sanitize reproductive content when pregnancy is explicitly not applicable.
    // This check is always true when we reach here (violations only fire for
    // not_applicable profiles), but stated explicitly for clarity.
    if (reproCtx.pregnancyCapacity === 'not_applicable') {
        // Filter out warnings containing reproductive terms
        if (Array.isArray(sanitized.warnings)) {
            sanitized.warnings = (sanitized.warnings as string[]).filter((w) => {
                for (const { pattern } of FEMALE_REPRODUCTIVE_TERMS) {
                    const m = pattern.exec(w);
                    if (m && !isLikelyNegated(w, m.index, m[0].length)) return false;
                }
                return true;
            });
        }

        // Strip inline pregnancy phrases from prose fields (last-resort sanitization)
        const INLINE_PREGNANCY_PHRASES = [
            /or\s+pregnancy\s+possibility\??/gi,
            /or\s+possibility\s+of\s+pregnancy\??/gi,
            /could\s+there\s+also\s+be\s+any\s+possibility\s+you\s+could\s+be\s+pregnant\??/gi,
        ];
        for (const proseField of ['rationale', 'description', 'reasoning', 'summary'] as const) {
            if (typeof sanitized[proseField] === 'string') {
                let text = sanitized[proseField] as string;
                for (const phrase of INLINE_PREGNANCY_PHRASES) {
                    text = text.replace(phrase, '');
                }
                sanitized[proseField] = text.trim();
            }
        }
    }

    return {
        isValid: false,
        fieldViolations,
        violations,
        sanitizedJson: sanitized,
    };
}
