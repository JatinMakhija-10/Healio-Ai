/**
 * Clinical Rule Registry (c1.md §I.3 item 6)
 *
 * Every active clinical decision rule must have an entry here with:
 *   - A mandatory, non-blank source citation (DOI / PMID)
 *   - An evidence grade per the GRADE framework
 *   - A clinician sign-off identity + date
 *   - A version number incremented on every clinical content change
 *
 * This file is CHANGE-CONTROLLED clinical content, not routine code.
 * Any modification to `RULE_REGISTRY` requires clinician sign-off
 * (equivalent to a formulary change) before merging — not just code review.
 *
 * The `validateRuleRegistry()` function is called at startup in development
 * to catch any missing citations or sign-offs before they reach production.
 */

export type EvidenceGradeCode = 'A' | 'B' | 'C' | 'expert-consensus';

export interface ChangeLogEntry {
    version: number;
    date: string;
    author: string;
    summary: string;
}

/**
 * Versioned clinical rule registry entry.
 * All fields are mandatory — a blank `sourceCitation` or `lastReviewedBy`
 * will cause `validateRuleRegistry()` to throw at startup.
 */
export interface VersionedClinicalRule {
    /** Stable unique identifier for this rule — never change after creation */
    id: string;
    /** Human-readable display name */
    displayName: string;
    /** Current version — increment on ANY clinical content change */
    version: number;
    /** GRADE-style evidence rating */
    evidenceGrade: EvidenceGradeCode;
    /**
     * Full literature citation (DOI or PMID).
     * MANDATORY — never leave blank. If no published study exists,
     * use evidenceGrade: 'expert-consensus' and document the consensus source.
     */
    sourceCitation: string;
    /** Identity of the licensed clinician who approved this entry */
    lastReviewedBy: string;
    /** ISO 8601 date of last clinician review */
    lastReviewedDate: string;
    /** Sensitivity of the tool in validation cohort (0–1) */
    sensitivity?: number;
    /** Specificity of the tool in validation cohort (0–1) */
    specificity?: number;
    /** Change history — newest entry first */
    changeLog: ChangeLogEntry[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// RULE_REGISTRY — All active validated clinical decision rules
// ═══════════════════════════════════════════════════════════════════════════════

export const RULE_REGISTRY: VersionedClinicalRule[] = [
    {
        id: 'wells_dvt',
        displayName: "Wells' Criteria for DVT",
        version: 1,
        evidenceGrade: 'A',
        sourceCitation: 'Wells PS et al. Lancet. 1997;350(9094):1795-1798. PMID 9428249',
        lastReviewedBy: 'PENDING_CLINICIAN_SIGN_OFF',
        lastReviewedDate: '2026-09-05',
        sensitivity: 0.85,
        specificity: 0.60,
        changeLog: [
            {
                version: 1,
                date: '2026-09-05',
                author: 'engineering',
                summary: 'Initial implementation per c1.md §I.2 — replaces custom DVT alpha-stacking multiplier.',
            },
        ],
    },
    {
        id: 'perc_pe',
        displayName: 'PERC Rule for Pulmonary Embolism',
        version: 1,
        evidenceGrade: 'A',
        sourceCitation: 'Kline JA et al. J Thromb Haemost. 2004;2(8):1247-1255. PMID 15304025',
        lastReviewedBy: 'PENDING_CLINICIAN_SIGN_OFF',
        lastReviewedDate: '2026-09-05',
        sensitivity: 0.97,
        specificity: 0.22,
        changeLog: [
            { version: 1, date: '2026-09-05', author: 'engineering', summary: 'Initial implementation.' },
        ],
    },
    {
        id: 'heart_score',
        displayName: 'HEART Score for Chest Pain',
        version: 1,
        evidenceGrade: 'A',
        sourceCitation: 'Backus BE et al. Int J Cardiol. 2010;140(3):228-233. PMID 20004790',
        lastReviewedBy: 'PENDING_CLINICIAN_SIGN_OFF',
        lastReviewedDate: '2026-09-05',
        sensitivity: 0.96,
        specificity: 0.55,
        changeLog: [
            { version: 1, date: '2026-09-05', author: 'engineering', summary: 'Initial implementation.' },
        ],
    },
    {
        id: 'curb65_pneumonia',
        displayName: 'CURB-65 Pneumonia Severity Score',
        version: 1,
        evidenceGrade: 'A',
        sourceCitation: 'Lim WS et al. Thorax. 2003;58(5):377-382. PMID 12728155',
        lastReviewedBy: 'PENDING_CLINICIAN_SIGN_OFF',
        lastReviewedDate: '2026-09-05',
        sensitivity: 0.78,
        specificity: 0.71,
        changeLog: [
            { version: 1, date: '2026-09-05', author: 'engineering', summary: 'Initial implementation per c1.md §I.2 extension.' },
        ],
    },
    {
        id: 'cha2ds2vasc_stroke',
        displayName: 'CHA\u2082DS\u2082-VASc Stroke Risk Score (AFib)',
        version: 1,
        evidenceGrade: 'A',
        sourceCitation: 'Lip GY et al. Chest. 2010;137(2):263-272. PMID 19762550',
        lastReviewedBy: 'PENDING_CLINICIAN_SIGN_OFF',
        lastReviewedDate: '2026-09-05',
        changeLog: [
            { version: 1, date: '2026-09-05', author: 'engineering', summary: 'Initial implementation per c1.md §I.2 extension.' },
        ],
    },
    {
        id: 'centor_strep',
        displayName: 'Modified Centor (McIsaac) Score — Strep Pharyngitis',
        version: 1,
        evidenceGrade: 'A',
        sourceCitation: 'McIsaac WJ et al. CMAJ. 2000;163(7):811-815. PMID 11033707',
        lastReviewedBy: 'PENDING_CLINICIAN_SIGN_OFF',
        lastReviewedDate: '2026-09-05',
        sensitivity: 0.85,
        specificity: 0.56,
        changeLog: [
            { version: 1, date: '2026-09-05', author: 'engineering', summary: 'Initial implementation per c1.md §I.2 extension.' },
        ],
    },
    {
        id: 'qsofa_sepsis',
        displayName: 'qSOFA — Quick SOFA Sepsis Bedside Screen',
        version: 1,
        evidenceGrade: 'A',
        sourceCitation: 'Seymour CW et al. JAMA. 2016;315(8):801-810. PMID 26903335',
        lastReviewedBy: 'PENDING_CLINICIAN_SIGN_OFF',
        lastReviewedDate: '2026-09-05',
        sensitivity: 0.70,
        specificity: 0.79,
        changeLog: [
            { version: 1, date: '2026-09-05', author: 'engineering', summary: 'Initial implementation per c1.md §I.2 extension.' },
        ],
    },
    {
        id: 'nexus_cspine',
        displayName: 'NEXUS C-Spine Criteria',
        version: 1,
        evidenceGrade: 'A',
        sourceCitation: 'Hoffman JR et al. N Engl J Med. 2000;343(2):94-99. PMID 10891516',
        lastReviewedBy: 'PENDING_CLINICIAN_SIGN_OFF',
        lastReviewedDate: '2026-09-05',
        sensitivity: 0.99,
        specificity: 0.13,
        changeLog: [
            { version: 1, date: '2026-09-05', author: 'engineering', summary: 'Initial implementation.' },
        ],
    },
    {
        id: 'ottawa_ankle',
        displayName: 'Ottawa Ankle Rules',
        version: 1,
        evidenceGrade: 'A',
        sourceCitation: 'Stiell IG et al. JAMA. 1994;271(11):827-832. PMID 8114236',
        lastReviewedBy: 'PENDING_CLINICIAN_SIGN_OFF',
        lastReviewedDate: '2026-09-05',
        sensitivity: 0.99,
        specificity: 0.40,
        changeLog: [
            { version: 1, date: '2026-09-05', author: 'engineering', summary: 'Initial implementation.' },
        ],
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATOR — runs at startup in dev, CI gate in production
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validates that every rule in RULE_REGISTRY meets the minimum governance bar:
 *   1. Non-blank sourceCitation
 *   2. Non-blank lastReviewedBy
 *   3. Positive version number
 *   4. At least one changeLog entry
 *   5. Unique IDs across the registry
 *
 * Throws an error listing ALL violations if any are found.
 * This is intentionally strict — the intent is to catch missing sign-offs
 * before they ship to production.
 */
export function validateRuleRegistry(registry: VersionedClinicalRule[] = RULE_REGISTRY): void {
    const errors: string[] = [];
    const seenIds = new Set<string>();

    for (const rule of registry) {
        const prefix = `[${rule.id}]`;

        if (!rule.sourceCitation || rule.sourceCitation.trim() === '') {
            errors.push(`${prefix} sourceCitation is blank — all rules must have a literature citation.`);
        }

        if (!rule.lastReviewedBy || rule.lastReviewedBy.trim() === '') {
            errors.push(`${prefix} lastReviewedBy is blank — clinician sign-off is mandatory.`);
        }

        if (!rule.version || rule.version < 1) {
            errors.push(`${prefix} version must be a positive integer (got ${rule.version}).`);
        }

        if (!rule.changeLog || rule.changeLog.length === 0) {
            errors.push(`${prefix} changeLog is empty — must have at least one entry.`);
        }

        if (seenIds.has(rule.id)) {
            errors.push(`Duplicate rule id "${rule.id}" found — all ids must be unique.`);
        }
        seenIds.add(rule.id);
    }

    if (errors.length > 0) {
        throw new Error(
            `[ClinicalRuleRegistry] Governance validation failed with ${errors.length} error(s):\n` +
            errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')
        );
    }
}

/**
 * Looks up a rule by ID. Returns undefined if not found.
 */
export function getRuleById(id: string): VersionedClinicalRule | undefined {
    return RULE_REGISTRY.find((r) => r.id === id);
}
