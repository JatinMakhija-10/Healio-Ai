/**
 * Drug-Drug / Drug-Condition Interaction (DDI) Types
 *
 * These types flow through the DDI safety layer inserted between
 * Stage 2 (Clinical Rules) and Stage 3 (AI Formatting) in the orchestrator.
 */

// ─── Severity ─────────────────────────────────────────────────────────────────

export type InteractionSeverity =
    | 'contraindicated' // Never combine — remove from output
    | 'major'           // Significant risk — show with strong warning
    | 'moderate'        // Monitor carefully — show with caution label
    | 'minor'           // Low risk — informational note
    | 'caution';        // Special-case (e.g. homeopathic dilution) — minimal note

// ─── Remedy Category (mirrors onboarding MedicineEntry.category) ─────────────

export type RemedyCategory = 'homeopathic' | 'ayurvedic' | 'home_remedy' | 'allopathic' | 'unknown';

// ─── DDI Rule (stored in rules.ts) ───────────────────────────────────────────

export interface DDIRule {
    /** Canonical user medication/condition keys that trigger this rule */
    triggers: string[];
    /** Canonical remedy name(s) that conflict — partial/lowercase match */
    conflictsWith: string[];
    severity: InteractionSeverity;
    /** Human-readable reason shown in UI */
    reason: string;
    /** If true, apply based on userProfile.pregnant = true */
    pregnancyRule?: boolean;
    /** If true, apply based on conditions[] match */
    conditionRule?: boolean;
    /** Categories of remedies this rule applies to; undefined = all */
    applicableTo?: RemedyCategory[];
    /** For timing-only interactions (e.g. Shelcal + Thyronorm) — not a contraindication */
    timingNote?: string;
}

// ─── Parsed Medication (output of medParser) ─────────────────────────────────

export interface ParsedMedication {
    /** Original string as listed in onboarding */
    original: string;
    /** Lowercased canonical name after normalization */
    canonical: string;
    /** 1.0 = exact API match, 0.5–0.9 = partial match, <0.5 = fuzzy */
    confidence: number;
    /** Medication category from onboarding API */
    category: RemedyCategory;
    /** True if this is a Fixed-Dose Combination brand */
    isFDC?: boolean;
    /** All generic components if isFDC (used for multi-generic DDI expansion) */
    fdcGenerics?: string[];
}

// ─── Flagged Remedy (remedy + interaction info) ───────────────────────────────

export interface FlaggedRemedy {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    remedy: any; // Original remedy object from the conditions DB
    severity: InteractionSeverity;
    reason: string;
    interactingWith: string; // Which user med/condition triggered this
    isBlocked: boolean;      // true if contraindicated (removed from safe list)
    dilutionSafe?: boolean;  // true if homeopathic dilution likely renders inert
    timingNote?: string;     // e.g. "Take at least 4 hours apart" — not a contraindication
}

// ─── DDI Check Result (full output of checker) ────────────────────────────────

export interface DDICheckResult {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    safeRemedies: any[];         // Remedies with no interaction detected
    flaggedRemedies: FlaggedRemedy[]; // Remedies with interaction (shown with badges)
    blockedRemedies: FlaggedRemedy[]; // Contraindicated (shown with strikethrough)
    interactionAlerts: string[]; // Human-readable alert strings for the banner
    ddiApplied: boolean;         // true = at least one med/condition was recognized
    unrecognizedMeds: string[];  // Meds that could not be matched (> low confidence)
    parsedMeds: ParsedMedication[]; // Full parse results for debugging
}

// ─── DDI Meta (added to orchestrationMeta) ────────────────────────────────────

export interface DDIMeta {
    ddiApplied: boolean;
    ddiBlockedCount: number;
    ddiFlaggedCount: number;
    ddiAlerts: string[];
    unrecognizedMeds: string[];
}
