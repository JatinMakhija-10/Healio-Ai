/**
 * LongitudinalTracker — v1 (Goal 9: Longitudinal Intelligence)
 *
 * Tracks symptom progression across sessions and provides insights
 * about symptom evolution, new/resolved symptoms, and progression patterns.
 *
 * Uses localStorage (client-side) or session memory for temporal tracking.
 * This module provides the analysis logic — persistence is handled externally.
 */

import type {
    SymptomSnapshot,
    LongitudinalInsight,
    IntelligenceContext,
} from './intelligenceTypes';

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESSION-DIAGNOSTIC PATTERNS
// Maps temporal patterns to diagnostic signals
// ═══════════════════════════════════════════════════════════════════════════════

interface ProgressionDiagnosticRule {
    pattern: 'worsening' | 'fluctuating' | 'new_systems';
    conditionPattern: RegExp;
    multiplier: number;
    reason: string;
}

const PROGRESSION_DIAGNOSTIC_RULES: ProgressionDiagnosticRule[] = [
    // Worsening patterns
    { pattern: 'worsening', conditionPattern: /cancer|malignan|tumor/i, multiplier: 1.5, reason: "Progressive worsening raises concern for malignancy" },
    { pattern: 'worsening', conditionPattern: /heart_failure/i, multiplier: 1.4, reason: "Progressive dyspnea/edema suggests HF decompensation" },
    { pattern: 'worsening', conditionPattern: /copd_exacerbation/i, multiplier: 1.3, reason: "Worsening respiratory symptoms suggest COPD exacerbation" },
    { pattern: 'worsening', conditionPattern: /renal|kidney/i, multiplier: 1.3, reason: "Progressive symptoms may indicate advancing kidney disease" },

    // Fluctuating patterns
    { pattern: 'fluctuating', conditionPattern: /multiple_sclerosis|ms$/i, multiplier: 1.5, reason: "Relapsing-remitting pattern classic for MS" },
    { pattern: 'fluctuating', conditionPattern: /sle|lupus/i, multiplier: 1.4, reason: "Flares and remissions classic for lupus" },
    { pattern: 'fluctuating', conditionPattern: /crohn|ulcerative_colitis|ibd/i, multiplier: 1.4, reason: "Fluctuating GI symptoms suggest inflammatory bowel disease" },
    { pattern: 'fluctuating', conditionPattern: /migraine/i, multiplier: 1.3, reason: "Episodic pattern typical of migraine" },
    { pattern: 'fluctuating', conditionPattern: /gout/i, multiplier: 1.4, reason: "Episodic acute attacks classic for gout" },

    // New system involvement
    { pattern: 'new_systems', conditionPattern: /sepsis/i, multiplier: 1.5, reason: "New organ system involvement suggests sepsis progression" },
    { pattern: 'new_systems', conditionPattern: /sle|lupus/i, multiplier: 1.4, reason: "New organ involvement suggests SLE flare with new organ damage" },
    { pattern: 'new_systems', conditionPattern: /amyloidosis/i, multiplier: 1.5, reason: "Multi-organ progression suggests systemic amyloidosis" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPORAL ALERT PATTERNS
// Time-based warnings
// ═══════════════════════════════════════════════════════════════════════════════

interface TemporalAlertRule {
    condition: (current: string[], previous: SymptomSnapshot[], durationDays: number) => boolean;
    alert: string;
}

const TEMPORAL_ALERT_RULES: TemporalAlertRule[] = [
    {
        condition: (current, previous, duration) => {
            // Persistent fever >7 days
            return duration > 7 && current.includes('fever') &&
                previous.some(s => s.symptoms.includes('fever'));
        },
        alert: "⏰ Fever persisting >7 days — consider workup for TB, endocarditis, lymphoma, or autoimmune conditions",
    },
    {
        condition: (current, previous, duration) => {
            // Persistent headache >14 days
            return duration > 14 && current.includes('headache') &&
                previous.some(s => s.symptoms.includes('headache'));
        },
        alert: "⏰ Headache persisting >14 days — consider neuroimaging to rule out structural causes",
    },
    {
        condition: (current, previous, duration) => {
            // Weight loss across sessions
            return duration > 30 && current.includes('weight_loss') &&
                previous.some(s => s.symptoms.includes('weight_loss'));
        },
        alert: "⏰ Persistent unintentional weight loss >1 month — warrants comprehensive workup (CBC, metabolic panel, cancer screening)",
    },
    {
        condition: (current, _previous, duration) => {
            // New neurological symptoms appearing
            const neuroSymptoms = ['weakness', 'numbness', 'tingling', 'visual_disturbance', 'slurred_speech'];
            const hasNeuro = current.some(s => neuroSymptoms.includes(s));
            return hasNeuro && duration < 3; // Acute neurological onset
        },
        alert: "⏰ Acute onset neurological symptoms — consider urgent neurological evaluation",
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// LONGITUDINAL TRACKER
// ═══════════════════════════════════════════════════════════════════════════════

export class LongitudinalTracker {

    /**
     * Analyze symptom progression across sessions.
     * Returns insights about symptom evolution and diagnostic signals.
     */
    analyze(ctx: IntelligenceContext): LongitudinalInsight | null {
        const previousSessions = ctx.previousSessions;
        if (!previousSessions || previousSessions.length === 0) {
            return null; // No previous data to compare
        }

        const currentSymptoms = new Set(ctx.symptomList.map(s => s.toLowerCase()));
        const lastSession = previousSessions[previousSessions.length - 1];
        const lastSymptoms = new Set(lastSession.symptoms.map(s => s.toLowerCase()));

        // Compute symptom changes
        const newSymptoms = [...currentSymptoms].filter(s => !lastSymptoms.has(s));
        const resolvedSymptoms = [...lastSymptoms].filter(s => !currentSymptoms.has(s));
        const persistingSymptoms = [...currentSymptoms].filter(s => lastSymptoms.has(s));

        // Detect progression pattern
        const progressionPattern = this.detectProgressionPattern(
            currentSymptoms, previousSessions
        );

        // Determine progressing symptoms (getting worse)
        const progressingSymptoms = this.findProgressingSymptoms(
            persistingSymptoms, previousSessions, ctx.symptoms.intensity ?? null
        );

        // Check temporal alerts
        const durationDays = (Date.now() - previousSessions[0].timestamp) / (1000 * 60 * 60 * 24);
        const temporalAlerts = this.checkTemporalAlerts(
            ctx.symptomList, previousSessions, durationDays
        );

        // Compute progression-diagnostic signals
        const progressionDiagnosticSignal = this.computeProgressionSignal(
            progressionPattern, newSymptoms, ctx.bayesianCandidates
        );

        return {
            progressingSymptoms,
            newSymptoms,
            resolvedSymptoms,
            progressionPattern,
            temporalAlerts,
            progressionDiagnosticSignal,
        };
    }

    /**
     * Create a snapshot from the current session for future tracking
     */
    createSnapshot(ctx: IntelligenceContext): SymptomSnapshot {
        return {
            timestamp: Date.now(),
            symptoms: ctx.symptomList,
            intensity: ctx.symptoms.intensity ?? undefined,
            notes: ctx.symptoms.additionalNotes || undefined,
        };
    }

    /**
     * Detect overall progression pattern across sessions
     */
    private detectProgressionPattern(
        currentSymptoms: Set<string>,
        previous: SymptomSnapshot[],
    ): LongitudinalInsight['progressionPattern'] {
        if (previous.length < 2) return 'unknown';

        const symptomCounts = previous.map(s => s.symptoms.length);
        const currentCount = currentSymptoms.size;

        // Check if monotonically worsening (more symptoms over time)
        const isWorsening = symptomCounts.every((count, i) =>
            i === 0 || count >= symptomCounts[i - 1]
        ) && currentCount >= symptomCounts[symptomCounts.length - 1];

        if (isWorsening && currentCount > symptomCounts[0]) return 'worsening';

        // Check if improving
        const isImproving = currentCount < symptomCounts[symptomCounts.length - 1] &&
            currentCount < symptomCounts[0];
        if (isImproving) return 'improving';

        // Check for fluctuation (going up and down)
        let directionChanges = 0;
        for (let i = 1; i < symptomCounts.length; i++) {
            if (i > 1) {
                const prevDir = Math.sign(symptomCounts[i - 1] - symptomCounts[i - 2]);
                const currDir = Math.sign(symptomCounts[i] - symptomCounts[i - 1]);
                if (prevDir !== 0 && currDir !== 0 && prevDir !== currDir) {
                    directionChanges++;
                }
            }
        }
        if (directionChanges >= 1) return 'fluctuating';

        return 'stable';
    }

    /**
     * Find symptoms that are persisting and potentially worsening
     */
    private findProgressingSymptoms(
        persistingSymptoms: string[],
        previous: SymptomSnapshot[],
        currentIntensity: number | null,
    ): string[] {
        // If we have intensity data, check if it's increasing
        if (currentIntensity !== null && previous.length > 0) {
            const lastIntensity = previous[previous.length - 1].intensity;
            if (lastIntensity !== undefined && currentIntensity > lastIntensity) {
                return persistingSymptoms; // All persisting symptoms are worsening
            }
        }

        // Check which symptoms have been present in all sessions (chronic)
        return persistingSymptoms.filter(symptom => {
            const presentInAll = previous.every(session =>
                session.symptoms.some(s => s.toLowerCase() === symptom)
            );
            return presentInAll && previous.length >= 2; // Present in 2+ previous sessions
        });
    }

    /**
     * Check temporal alert rules
     */
    private checkTemporalAlerts(
        currentSymptoms: string[],
        previous: SymptomSnapshot[],
        durationDays: number,
    ): string[] {
        const alerts: string[] = [];
        const normalized = currentSymptoms.map(s => s.toLowerCase());

        for (const rule of TEMPORAL_ALERT_RULES) {
            if (rule.condition(normalized, previous, durationDays)) {
                alerts.push(rule.alert);
            }
        }

        return alerts;
    }

    /**
     * Compute diagnostic signals based on progression pattern
     */
    private computeProgressionSignal(
        pattern: LongitudinalInsight['progressionPattern'],
        newSymptoms: string[],
        candidates: IntelligenceContext['bayesianCandidates'],
    ): LongitudinalInsight['progressionDiagnosticSignal'] {
        const signals: LongitudinalInsight['progressionDiagnosticSignal'] = [];

        const isNewSystems = newSymptoms.length >= 2; // New symptoms suggesting new system involvement
        const effectivePattern = isNewSystems ? 'new_systems' : pattern;

        for (const candidate of candidates) {
            for (const rule of PROGRESSION_DIAGNOSTIC_RULES) {
                if (
                    (rule.pattern === effectivePattern || rule.pattern === pattern) &&
                    rule.conditionPattern.test(candidate.conditionId)
                ) {
                    signals.push({
                        conditionId: candidate.conditionId,
                        reason: rule.reason,
                        multiplier: rule.multiplier,
                    });
                }
            }
        }

        return signals;
    }
}

export const longitudinalTracker = new LongitudinalTracker();
