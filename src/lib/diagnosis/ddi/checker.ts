/**
 * DDI Checker Engine
 *
 * Stateless, pure function — re-evaluated fresh per diagnosis request.
 *
 * Accepts:
 *   userMedications  — string[] from onboarding (medicationList)
 *   userConditions   — string[] from onboarding (conditions)
 *   recommendedRemedies — array of remedy objects from the conditions DB
 *   userProfile      — partial profile for pregnancy check
 *
 * Returns DDICheckResult with:
 *   safeRemedies     — pass to AI prompt
 *   flaggedRemedies  — shown with ⚠ badge in UI
 *   blockedRemedies  — shown ~~struck through~~ in UI, excluded from AI
 *   interactionAlerts — text for the warning banner
 */

import { DDI_RULES } from './rules';
import { DDICheckResult, FlaggedRemedy, RemedyCategory } from './types';
import {
    parseMedicationList,
    conditionsToTriggers,
    isPregnant,
} from './medParser';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extracts a lowercased string name from whatever remedy shape the DB returns.
 * Works for: { name }, { remedy }, { remedy_name }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRemedyName(remedy: any): string {
    return (remedy?.name || remedy?.remedy || remedy?.remedy_name || '').toLowerCase();
}

/**
 * Infers remedy category from its shape (homeopathic, ayurvedic, home_remedy).
 * We use this to apply applicableTo filters in the rules.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function inferRemedyCategory(remedy: any, sectionHint?: RemedyCategory): RemedyCategory {
    if (sectionHint) return sectionHint;
    // Heuristics: potency field → homeopathic; preparation field → ayurvedic/home
    if (remedy?.potency) return 'homeopathic';
    if (remedy?.preparation) return 'ayurvedic';
    if (remedy?.method) return 'home_remedy';
    return 'allopathic';
}

/**
 * Checks if a trigger string matches any of the user's canonical medication names
 * or condition-derived trigger keys.
 */
function triggerMatches(trigger: string, userTriggers: string[]): boolean {
    const t = trigger.toLowerCase();
    return userTriggers.some((u) => u.includes(t) || t.includes(u));
}

/**
 * Checks if a remedy name matches the rule's conflictsWith patterns.
 */
function remedyConflicts(remedyName: string, conflictsWith: string[]): boolean {
    return conflictsWith.some((c) =>
        remedyName.includes(c.toLowerCase()) || c.toLowerCase().includes(remedyName)
    );
}

// ─── Core Checker ─────────────────────────────────────────────────────────────

export interface CheckInteractionsInput {
    userMedications: string[];    // from onboarding medicationList
    userConditions: string[];     // from onboarding conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    homeopathicRemedies?: any[];  // condition.remedies / condition.homeopathic_remedies
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ayurvedicRemedies?: any[];    // condition.ayurvedic_remedies
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    homeRemedies?: any[];         // condition.indianHomeRemedies / condition.home_remedies
    userProfile?: { pregnant?: boolean };
}

export function checkInteractions(input: CheckInteractionsInput): DDICheckResult {
    const {
        userMedications = [],
        userConditions = [],
        homeopathicRemedies = [],
        ayurvedicRemedies = [],
        homeRemedies = [],
        userProfile,
    } = input;

    // ── 1. Parse medications → canonical list ──────────────────────────────────
    const { recognized, unrecognized } = parseMedicationList(userMedications);

    // Build the full set of trigger strings:
    //   - canonical med names from parser
    //   - condition-derived triggers
    //   - 'pregnancy' if user is pregnant
    const medTriggers = recognized.map((p) => p.canonical);
    const condTriggers = conditionsToTriggers(userConditions);
    const pregnancyTrigger = isPregnant(userProfile) ? ['pregnancy'] : [];

    const allUserTriggers = [...medTriggers, ...condTriggers, ...pregnancyTrigger];

    // Early exit: no recognized meds or conditions → all remedies are safe
    if (allUserTriggers.length === 0) {
        return {
            safeRemedies: [...homeopathicRemedies, ...ayurvedicRemedies, ...homeRemedies],
            flaggedRemedies: [],
            blockedRemedies: [],
            interactionAlerts: [],
            ddiApplied: false,
            unrecognizedMeds: unrecognized,
            parsedMeds: recognized,
        };
    }

    // ── 2. Check each remedy against all applicable rules ─────────────────────

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeRemedies: any[] = [];
    const flaggedRemedies: FlaggedRemedy[] = [];
    const blockedRemedies: FlaggedRemedy[] = [];
    const alertSet = new Set<string>();

    const remedySections: Array<{ remedies: unknown[], category: RemedyCategory }> = [
        { remedies: homeopathicRemedies, category: 'homeopathic' },
        { remedies: ayurvedicRemedies, category: 'ayurvedic' },
        { remedies: homeRemedies, category: 'home_remedy' },
    ];

    for (const section of remedySections) {
        for (const remedy of section.remedies) {
            const remedyName = getRemedyName(remedy);
            const remedyCategory = inferRemedyCategory(remedy, section.category);
            if (!remedyName) {
                safeRemedies.push(remedy);
                continue;
            }

            let worstMatch: FlaggedRemedy | null = null;

            for (const rule of DDI_RULES) {
                // Check applicableTo filter
                if (rule.applicableTo && !rule.applicableTo.includes(remedyCategory)) {
                    continue;
                }

                // conditionRule guard: must have a matching condition/pregnancy trigger,
                // NOT just a medication trigger — prevents med-only matches on condition rules
                if (rule.conditionRule) {
                    const condOrPregnancy = [...condTriggers, ...pregnancyTrigger];
                    const hasCondMatch = rule.triggers.some((t) => triggerMatches(t, condOrPregnancy));
                    if (!hasCondMatch) continue;
                }

                // Check if any user trigger matches this rule
                const matchedTrigger = rule.triggers.find((t) => triggerMatches(t, allUserTriggers));
                if (!matchedTrigger) continue;

                // Check if remedy conflicts with this rule
                if (!remedyConflicts(remedyName, rule.conflictsWith)) continue;

                // Found a match — determine if it's worse than any prior match
                const severityRank: Record<string, number> = {
                    contraindicated: 5,
                    major: 4,
                    moderate: 3,
                    minor: 2,
                    caution: 1,
                };

                const rank = severityRank[rule.severity] ?? 0;
                const priorRank = worstMatch ? (severityRank[worstMatch.severity] ?? 0) : -1;

                if (rank > priorRank) {
                    // Is this homeopathic? Add dilution safe note for 'caution' rules
                    const dilutionSafe =
                        rule.severity === 'caution' && remedyCategory === 'homeopathic';

                    worstMatch = {
                        remedy,
                        severity: rule.severity,
                        reason: rule.reason,
                        interactingWith: matchedTrigger,
                        isBlocked: rule.severity === 'contraindicated',
                        category: remedyCategory,
                        dilutionSafe,
                        timingNote: rule.timingNote,
                    };
                }
            }

            if (!worstMatch) {
                safeRemedies.push(remedy);
            } else if (worstMatch.isBlocked) {
                blockedRemedies.push(worstMatch);
                // Build alert message for the banner
                const displayName = getRemedyName(remedy);
                const systemLabel = worstMatch.category !== 'allopathic' && worstMatch.category !== 'unknown'
                    ? ` (${capitalize(worstMatch.category)})`
                    : '';
                alertSet.add(
                    `⛔ ${capitalize(displayName)}${systemLabel} is contraindicated with ${worstMatch.interactingWith}: ${worstMatch.reason}`
                );
            } else {
                // Still pass flagged remedies to safe list — but also add to flaggedRemedies for UI badges
                flaggedRemedies.push(worstMatch);
                safeRemedies.push(remedy); // flagged but not removed
                if (worstMatch.severity === 'major') {
                    const displayName = getRemedyName(remedy);
                    const systemLabel = worstMatch.category !== 'allopathic' && worstMatch.category !== 'unknown'
                        ? ` (${capitalize(worstMatch.category)})`
                        : '';
                    alertSet.add(
                        `⚠️ ${capitalize(displayName)}${systemLabel}: ${worstMatch.reason}`
                    );
                }
            }
        }
    }

    // ── 3. Piperine cross-cutting caution (fires when 2+ recognized meds present) ────
    // Trikatu / piperine / bioperine significantly enhance drug absorption
    const piperineNames = ['trikatu', 'piperine', 'bioperine', 'black pepper supplement'];
    const allRemedyNames = [
        ...homeopathicRemedies.map(getRemedyName),
        ...ayurvedicRemedies.map(getRemedyName),
        ...homeRemedies.map(getRemedyName),
    ];
    if (
        recognized.length >= 2 &&
        allRemedyNames.some((n) => piperineNames.some((p) => n.includes(p)))
    ) {
        alertSet.add(
            '⚠️ Trikatu/Piperine detected: Piperine significantly enhances absorption of prescription medications. Blood levels of your current drugs may increase unpredictably. Consult your doctor before using.'
        );
    }

    // ── 4. Unrecognized meds warning (as per spec requirement) ────────────────
    if (unrecognized.length > 0) {
        alertSet.add(
            `ℹ️ Some medications could not be verified (${unrecognized.slice(0, 3).join(', ')}${unrecognized.length > 3 ? '…' : ''}). Please update your profile for complete interaction checking.`
        );
    }

    return {
        safeRemedies,
        flaggedRemedies,
        blockedRemedies,
        interactionAlerts: [...alertSet],
        ddiApplied: true,
        unrecognizedMeds: unrecognized,
        parsedMeds: recognized,
    };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Builds a summary string for the AI prompt injection.
 * Instructs the LLM about blocked remedies — it must NOT re-invent them.
 */
export function buildDDIPromptSection(result: DDICheckResult): string {
    if (!result.ddiApplied && result.blockedRemedies.length === 0) return '';

    const lines: string[] = ['=== DRUG INTERACTION CONTEXT (DDI Safety Layer) ==='];

    if (result.parsedMeds.length > 0) {
        lines.push(`User's current medications: ${result.parsedMeds.map((m) => m.canonical).join(', ')}`);
    }

    if (result.blockedRemedies.length > 0) {
        lines.push('\nBLOCKED REMEDIES (contraindicated — DO NOT recommend these):');
        for (const fr of result.blockedRemedies) {
            lines.push(`  - ${getRemedyName(fr.remedy)}: ${fr.reason}`);
        }
        lines.push('\nCRITICAL: You MUST NOT recommend any of the above blocked remedies in your output.');
        lines.push('You MUST NOT invent new interaction warnings beyond what is listed here.');
    }

    if (result.flaggedRemedies.filter((f) => f.severity === 'major').length > 0) {
        lines.push('\nFLAGGED REMEDIES (use with caution — mention relevant warning in seekHelpReason if major):');
        for (const fr of result.flaggedRemedies.filter((f) => f.severity === 'major')) {
            lines.push(`  - ${getRemedyName(fr.remedy)}: ${fr.reason}`);
        }
    }

    return lines.join('\n');
}
