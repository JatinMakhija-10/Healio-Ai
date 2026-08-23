// ── Consultation History Summarisation Pipeline ───────────────────────────────
// Smart summarisation for the AI system prompt:
//   - Last 3 consultations: full detail (condition, date, severity, remedies)
//   - Older consultations (4-10): compressed into a single narrative line
//   - Recurring condition detection: flags any condition appearing 2+ times
//
// Security note (Forensic Audit §F6):
//   All text fields from consultation records are sanitized before injection
//   into the system prompt to prevent prompt-injection attacks. A malicious
//   or corrupted record could otherwise override model instructions.

/**
 * Strips prompt-injection attack patterns from a string before it is
 * inserted into an LLM system prompt.
 *
 * Patterns removed:
 *   - Role-change instructions: "You are", "Act as", "From now on"
 *   - Separator tokens: [SYSTEM], [INST], <</SYS>>, ### Instruction
 *   - Override phrases: "Ignore previous", "Forget all"
 *   - Null-byte / control characters
 *
 * This is a best-effort heuristic. The primary protection is that
 * consultation data is inserted into a clearly-delimited section
 * of the prompt, not at the top level where it could override
 * core instructions.
 */
export function sanitizeForPromptInjection(text: string, maxLength = 300): string {
    if (!text) return '';

    // Strip common separator / role tokens used in injection attacks
    const INJECTION_PATTERNS = [
        /\[\s*(?:SYSTEM|INST|END|BEGIN|USER|ASSISTANT|SYS)\s*\]/gi,
        /<<\/?SYS>>/gi,
        /###\s*(?:Instruction|System|Human|Assistant|Prompt)/gi,
        /\bIgnore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?\b/gi,
        /\bForget\s+(?:all\s+)?(?:previous|prior|above|everything)\b/gi,
        /\bYou\s+are\s+(?:now\s+)?(?:a|an|the)\b/gi,
        /\bAct\s+as\s+(?:a|an|the)\b/gi,
        /\bFrom\s+now\s+on\b/gi,
        /\bDisregard\s+(?:all\s+)?(?:previous|prior)\b/gi,
        // Null bytes and other control chars
        // eslint-disable-next-line no-control-regex
        /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
    ];

    let sanitized = text;
    for (const pattern of INJECTION_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    // Truncate to prevent context window flooding
    return sanitized.slice(0, maxLength);
}

export interface ConsultationRecord {
    created_at?: string;
    confidence?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    diagnosis?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    symptoms?: Record<string, any>;
}

export interface RecurringCondition {
    name: string;
    count: number;
    dates: string[];
    lastSeverity: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRemedyNames(d: Record<string, any>): string[] {
    const names: string[] = [];
    for (const key of [
        'remedies',
        'indianHomeRemedies',
        'homeopathic_remedies',
        'ayurvedic_remedies',
        'home_remedies',
    ]) {
        if (Array.isArray(d[key])) {
            names.push(
                ...d[key]
                    .slice(0, 2)
                    .map((r: unknown) =>
                        typeof r === 'string'
                            ? sanitizeForPromptInjection(r, 80)
                            : sanitizeForPromptInjection(
                                  ((r as Record<string, unknown>)?.name as string) || '',
                                  80
                              )
                    )
                    .filter(Boolean)
            );
        }
    }
    return names.slice(0, 3);
}

/**
 * Detects conditions that appear in 2 or more consultations.
 * Returns sorted by frequency descending.
 */
export function detectRecurringConditions(
    consultations: ConsultationRecord[]
): RecurringCondition[] {
    const freq = new Map<string, RecurringCondition>();

    for (const c of consultations) {
        const d = c.diagnosis || {};
        const raw = sanitizeForPromptInjection((d.condition || d.name || '').trim(), 100);
        if (!raw || raw === 'Unknown Condition') continue;

        const key = raw.toLowerCase();
        const dateStr = c.created_at
            ? new Date(c.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
              })
            : '';

        if (!freq.has(key)) {
            freq.set(key, { name: raw, count: 0, dates: [], lastSeverity: d.severity || 'unknown' });
        }
        const entry = freq.get(key)!;
        entry.count++;
        if (dateStr) entry.dates.push(dateStr);
        entry.lastSeverity = d.severity || entry.lastSeverity;
    }

    return [...freq.values()]
        .filter((v) => v.count >= 2)
        .sort((a, b) => b.count - a.count);
}

/**
 * Builds the medical history context block for the AI system prompt.
 * Returns an empty string if no consultations exist.
 */
export function buildMedicalHistoryContext(consultations: ConsultationRecord[]): string {
    if (!consultations?.length) return '';

    const recurringConditions = detectRecurringConditions(consultations);

    // ── Recent consultations: full detail (last 3) ───────────────────────────
    const recentEntries = consultations.slice(0, 3).map((c, i) => {
        const d = c.diagnosis || {};
        const dateStr = c.created_at
            ? new Date(c.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
              })
            : 'unknown date';
        // Sanitize all user-derived text fields before prompt injection (Audit F6)
        const condition = sanitizeForPromptInjection(d.condition || d.name || 'Unknown', 100);
        const severity = sanitizeForPromptInjection(d.severity || 'unknown', 40);
        const confidence =
            typeof c.confidence === 'number' ? `${c.confidence}%` : 'N/A';
        const remedies = extractRemedyNames(d);
        const symptoms = c.symptoms || {};
        const location = Array.isArray(symptoms.location)
            ? symptoms.location.map((l: string) => sanitizeForPromptInjection(l, 40)).join(', ')
            : '';
        const sensation = sanitizeForPromptInjection(
            symptoms.sensation || symptoms.painType || '',
            80
        );

        let entry = `  ${i + 1}. [${dateStr}] ${condition} (severity: ${severity}, confidence: ${confidence})`;
        if (location) entry += `\n     Location: ${location}`;
        if (sensation) entry += ` | Sensation: ${sensation}`;
        if (remedies.length) entry += `\n     Remedies prescribed: ${remedies.join(', ')}`;
        if (d.seekHelp)
            entry += `\n     Advised: ${
                typeof d.seekHelp === 'string'
                    ? sanitizeForPromptInjection(d.seekHelp, 100)
                    : ''
            }`;
        if (d.is_followup) entry += ' [FOLLOW-UP]';
        return entry;
    });

    // ── Older consultations: compact summary (4+) ────────────────────────────
    const olderConsultations = consultations.slice(3);
    let olderSummary = '';
    if (olderConsultations.length > 0) {
        const olderConditions = [
            ...new Set(
                olderConsultations
                    .map((c) => {
                        const d = c.diagnosis || {};
                        return (d.condition || d.name || '').trim();
                    })
                    .filter((s) => s && s !== 'Unknown Condition')
            ),
        ];
        if (olderConditions.length) {
            olderSummary =
                `  ${recentEntries.length + 1}. [Older history — ${olderConsultations.length} consultation${
                    olderConsultations.length > 1 ? 's' : ''
                }] Conditions: ${olderConditions.join(', ')}`;
        }
    }

    const lines: string[] = [
        '\n\n=== PATIENT MEDICAL HISTORY (past consultations on Arovia) ===',
        'Use this context to:',
        '- Avoid re-asking about known conditions, allergies, or medications',
        '- Reference past diagnoses naturally ("I see you had X last month...")',
        '- Flag recurring patterns and escalate if the same condition keeps returning',
        '- Skip remedies already prescribed; escalate potency or suggest alternatives',
        '',
    ];

    if (recurringConditions.length) {
        lines.push('RECURRING CONDITIONS DETECTED (requires pattern awareness):');
        for (const rc of recurringConditions) {
            lines.push(
                `  -> ${rc.name} (${rc.count}x — ${rc.dates.slice(0, 3).join(', ')})`
            );
        }
        lines.push(
            "  -> If today's complaint relates to any of these, acknowledge the pattern explicitly: \"This seems to be recurring for you — let's look at underlying causes.\""
        );
        lines.push('');
    }

    lines.push('RECENT CONSULTATIONS (full detail):');
    lines.push(...recentEntries);

    if (olderSummary) {
        lines.push('');
        lines.push('OLDER HISTORY (summary):');
        lines.push(olderSummary);
    }

    lines.push('');
    lines.push(
        'Do NOT re-diagnose past conditions unless the patient asks. Use as background context only.'
    );
    lines.push('=== END OF MEDICAL HISTORY ===');

    return lines.join('\n');
}
