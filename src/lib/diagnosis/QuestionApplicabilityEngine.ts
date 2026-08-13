/**
 * QuestionApplicabilityEngine — Deterministic, pre-LLM content gate.
 *
 * The ONLY correct fix for the male-pregnancy-question class of bug.
 *
 * Design principle: applicability is decided once, in code, from validated
 * typed fields — BEFORE any question is assembled, before RAG retrieval,
 * before the prompt is built. The LLM never receives content it isn't
 * supposed to reason about; it does not rely on being instructed not to.
 *
 * Failure semantics: FAIL-CLOSED. When sex-at-birth or pregnancy capacity
 * is unknown, the engine excludes pregnancy-related content by default rather
 * than guessing. A separate "deferred" list is returned so the UI can prompt
 * profile completion without silently suppressing or incorrectly generating.
 *
 * No LLM calls anywhere in this module.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CORE TYPES
// These replace the single overloaded `gender` field with four distinct
// clinical concepts. Do NOT collapse these back into one field.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Biological sex at birth. Used for clinical applicability decisions only.
 * NEVER use genderIdentity for this purpose.
 */
export type SexAtBirth = 'male' | 'female' | 'intersex' | 'unknown';

/**
 * Whether this patient can become pregnant. Derived from sexAtBirth by default,
 * but overridable (e.g. hysterectomy → not_applicable even for female profiles).
 *
 * 'capable'        — can become pregnant
 * 'not_applicable' — cannot (male, post-hysterectomy, etc.)
 * 'unknown'        — we do not have enough information to determine this
 */
export type PregnancyCapacity = 'capable' | 'not_applicable' | 'unknown';

/** Current pregnancy status, if known. */
export type PregnancyStatus = 'pregnant' | 'not_pregnant' | 'unknown';

export interface ReproductiveContext {
    sexAtBirth: SexAtBirth;
    pregnancyCapacity: PregnancyCapacity;
    pregnancyStatus: PregnancyStatus;
    /** Free text, used ONLY for tone/pronouns. NEVER gates clinical logic. */
    genderIdentity?: string;
}

/** The context object consumed identically by all layers (schema, safety, RAG, output validator). */
export interface QuestionApplicabilityContext {
    age?: number | null;
    reproductive: ReproductiveContext;
}

/** A single question clause with an explicit applicability predicate. */
export interface QuestionClause {
    id: string;
    text: string;
    /** Returns true only when this clause should be shown to this patient. */
    requiresContext: (ctx: QuestionApplicabilityContext) => boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NORMALIZATION — converts raw, possibly-malformed input to typed context
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Raw input shape accepted from client data. All fields optional/nullable
 * because we may be working with legacy data.
 */
export interface RawProfileInput {
    /** Preferred field — explicit sex at birth. */
    sexAtBirth?: string | null;
    /**
     * Legacy field — treated as a fallback for sexAtBirth when sexAtBirth is
     * absent. Do NOT use gender for clinical logic; migrate callers to sexAtBirth.
     */
    gender?: string | null;
    /** Explicit override for pregnancy capacity (e.g. post-hysterectomy). */
    pregnancyCapacity?: string | null;
    /** Known pregnancy status. */
    pregnancyStatus?: string | null;
    /** Legacy boolean pregnancy flag from onboarding. */
    isPregnant?: boolean | null;
    /** Age in years. */
    age?: number | string | null;
}

/**
 * Normalizes raw profile data into a typed, safe `QuestionApplicabilityContext`.
 *
 * Rules:
 * - Unknown/missing/malformed input ALWAYS maps to the safest known state.
 * - sexAtBirth is case-insensitive and whitespace-trimmed.
 * - Unknown sexAtBirth → unknown pregnancyCapacity (never silently default to female).
 * - Male sexAtBirth → pregnancyCapacity = not_applicable (deterministic).
 * - Female/intersex sexAtBirth → pregnancyCapacity = capable (conservative default).
 * - pregnancyCapacity can be overridden by an explicit field.
 */
export function normalizeReproductiveContext(raw: RawProfileInput): ReproductiveContext {
    // Prefer sexAtBirth; fall back to gender for legacy compatibility
    const sexRaw = ((raw.sexAtBirth ?? raw.gender) ?? '').toString().trim().toLowerCase();

    let sexAtBirth: SexAtBirth = 'unknown';
    if (sexRaw === 'male' || sexRaw === 'm' || sexRaw === 'man') {
        sexAtBirth = 'male';
    } else if (sexRaw === 'female' || sexRaw === 'f' || sexRaw === 'woman') {
        sexAtBirth = 'female';
    } else if (sexRaw === 'intersex') {
        sexAtBirth = 'intersex';
    }
    // Anything else (empty, null, malformed) → 'unknown'

    // Derive pregnancy capacity from sex at birth (fail-closed)
    let pregnancyCapacity: PregnancyCapacity = 'unknown';
    if (sexAtBirth === 'male') {
        pregnancyCapacity = 'not_applicable';
    } else if (sexAtBirth === 'female' || sexAtBirth === 'intersex') {
        pregnancyCapacity = 'capable'; // conservative default when anatomy is known
    }
    // sexAtBirth === 'unknown' → pregnancyCapacity stays 'unknown' — do NOT guess

    // Allow explicit override of pregnancy capacity (e.g. post-hysterectomy)
    if (raw.pregnancyCapacity) {
        const capRaw = raw.pregnancyCapacity.toString().trim().toLowerCase();
        if (capRaw === 'capable') pregnancyCapacity = 'capable';
        else if (capRaw === 'not_applicable' || capRaw === 'not applicable') {
            pregnancyCapacity = 'not_applicable';
        }
    }

    // Resolve pregnancy status from legacy boolean or explicit field
    let pregnancyStatus: PregnancyStatus = 'unknown';
    if (raw.isPregnant === true) pregnancyStatus = 'pregnant';
    else if (raw.isPregnant === false) pregnancyStatus = 'not_pregnant';
    if (raw.pregnancyStatus) {
        const stRaw = raw.pregnancyStatus.toString().trim().toLowerCase();
        if (stRaw === 'pregnant') pregnancyStatus = 'pregnant';
        else if (stRaw === 'not_pregnant' || stRaw === 'not pregnant') {
            pregnancyStatus = 'not_pregnant';
        }
    }

    return { sexAtBirth, pregnancyCapacity, pregnancyStatus };
}

/**
 * Builds a full `QuestionApplicabilityContext` from a raw profile.
 * Use this as the single entry point for all layers.
 */
export function buildApplicabilityContext(raw: RawProfileInput): QuestionApplicabilityContext {
    const ageRaw = raw.age;
    let age: number | null = null;
    if (ageRaw != null) {
        const n = typeof ageRaw === 'number' ? ageRaw : parseInt(String(ageRaw), 10);
        if (!isNaN(n)) age = n;
    }
    return {
        age,
        reproductive: normalizeReproductiveContext(raw),
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICABILITY PREDICATES — used by all layers uniformly
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Returns true if and only if pregnancy/reproductive content is clinically
 * applicable for this profile.
 *
 * Fail-closed: returns false when capacity is unknown (don't guess).
 */
export function isPregnancyApplicable(ctx: QuestionApplicabilityContext): boolean {
    return ctx.reproductive.pregnancyCapacity === 'capable';
}

/**
 * Returns true if the pregnancy screening QUESTION should be asked.
 * More specific than `isPregnancyApplicable`: also suppresses the question
 * when pregnancy status is already known.
 */
export function shouldAskPregnancyQuestion(ctx: QuestionApplicabilityContext): boolean {
    return (
        ctx.reproductive.pregnancyCapacity === 'capable' &&
        ctx.reproductive.pregnancyStatus === 'unknown'
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLAUSE RESOLUTION — filters question clauses before prompt assembly
// ═══════════════════════════════════════════════════════════════════════════════

export interface ClauseResolutionResult {
    /** Clauses that should be presented to this patient. */
    applicable: QuestionClause[];
    /**
     * Clauses that are not applicable now but could become applicable once the
     * profile is completed. The UI should prompt profile completion rather than
     * silently suppressing or incorrectly generating.
     */
    deferredForProfileCompletion: QuestionClause[];
    /** Clauses explicitly not applicable (e.g. male for pregnancy). */
    excluded: QuestionClause[];
}

/**
 * Resolves which clauses apply to this patient context.
 * Should be called BEFORE prompt assembly and BEFORE RAG retrieval.
 */
export function resolveApplicableClauses(
    clauses: QuestionClause[],
    ctx: QuestionApplicabilityContext,
): ClauseResolutionResult {
    const applicable: QuestionClause[] = [];
    const deferredForProfileCompletion: QuestionClause[] = [];
    const excluded: QuestionClause[] = [];

    for (const clause of clauses) {
        if (clause.requiresContext(ctx)) {
            applicable.push(clause);
        } else if (
            ctx.reproductive.pregnancyCapacity === 'unknown' &&
            (clause.id.includes('pregnancy') || clause.id.includes('reproductive'))
        ) {
            // Profile is incomplete — we don't know if this clause is relevant.
            // Don't ask via chat, but don't permanently exclude either.
            deferredForProfileCompletion.push(clause);
        } else {
            excluded.push(clause);
        }
    }

    return { applicable, deferredForProfileCompletion, excluded };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE CLAUSE DEFINITIONS — abdominal pain danger signs
// Replaces the monolithic bundled string in SymptomQuestionSchemas.ts.
// Each clause has an independent, testable applicability predicate.
// ═══════════════════════════════════════════════════════════════════════════════

export const abdominalPainDangerClauses: QuestionClause[] = [
    {
        id: 'severe_worsening',
        text: 'Has the pain suddenly gotten much worse?',
        requiresContext: () => true, // universal — applies to all patients
    },
    {
        id: 'rigid_belly',
        text: 'Does your belly feel rigid or extremely tender to touch?',
        requiresContext: () => true, // universal
    },
    {
        id: 'fainting',
        text: 'Have you fainted or felt close to fainting?',
        requiresContext: () => true, // universal
    },
    {
        id: 'blood_in_stool_or_vomit',
        text: 'Have you noticed blood in your stool or vomit?',
        requiresContext: () => true, // universal
    },
    {
        id: 'pregnancy_possibility',
        text: 'Is there any possibility you could be pregnant?',
        /**
         * Fail-closed: only ask when pregnancy is AFFIRMATIVELY known to be
         * clinically possible AND status is not already known.
         *
         * pregnancyCapacity === 'not_applicable' (male/post-hysterectomy): NEVER ask
         * pregnancyCapacity === 'unknown' (profile incomplete): DON'T ask via chat
         *                                                        → returns to deferredForProfileCompletion
         * pregnancyCapacity === 'capable' AND status === 'unknown': ASK
         * pregnancyCapacity === 'capable' AND status === 'pregnant'|'not_pregnant': DON'T RE-ASK
         */
        requiresContext: (ctx) => shouldAskPregnancyQuestion(ctx),
    },
];
