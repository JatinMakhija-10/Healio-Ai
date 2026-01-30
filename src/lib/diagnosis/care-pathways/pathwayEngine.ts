/**
 * Care Pathway Engine
 * 
 * Generates personalized, evidence-based treatment pathways
 * for diagnosed conditions.
 */

import {
    CarePathway,
    PersonalizedPathway,
    PathwayAdjustment,
    TreatmentPhase,
    PhaseAction
} from './types';

import { PrakritiProfile, VikritiProfile, AgniAssessment } from '../../ayurveda/types';
import { DiagnosisResult } from '../types';

/**
 * Generate personalized care pathway for a diagnosis
 * @param diagnosis The diagnosis result
 * @param basePathway The base care pathway for the condition
 * @param prakriti Patient's Prakriti (optional)
 * @param vikriti Patient's Vikriti (optional)
 * @param agni Patient's Agni assessment (optional)
 * @returns Personalized care pathway
 */
export function generatePersonalizedPathway(
    diagnosis: DiagnosisResult,
    basePathway: CarePathway,
    prakriti?: PrakritiProfile | null,
    vikriti?: VikritiProfile | null,
    agni?: AgniAssessment | null
): PersonalizedPathway {
    const adjustments: PathwayAdjustment[] = [];

    // Apply Ayurvedic modifications if constitution data available
    if (basePathway.ayurvedicModifications) {
        // Prakriti-based adjustments
        if (prakriti && basePathway.ayurvedicModifications.prakritiModifications) {
            const prakritiAdj = basePathway.ayurvedicModifications.prakritiModifications[prakriti.prakriti];
            if (prakritiAdj) {
                adjustments.push(...prakritiAdj);
            }
        }

        // Vikriti-based adjustments
        if (vikriti && basePathway.ayurvedicModifications.vikritiModifications) {
            const vikritiAdj = basePathway.ayurvedicModifications.vikritiModifications[vikriti.primaryDosha];
            if (vikritiAdj) {
                adjustments.push(...vikritiAdj);
            }
        }

        // Agni-based adjustments
        if (agni && basePathway.ayurvedicModifications.agniModifications) {
            const agniAdj = basePathway.ayurvedicModifications.agniModifications[agni.type];
            if (agniAdj) {
                adjustments.push(...agniAdj);
            }
        }

        // Seasonal adjustments
        if (basePathway.ayurvedicModifications.seasonalModifications) {
            const currentSeason = getCurrentSeason();
            const seasonalAdj = basePathway.ayurvedicModifications.seasonalModifications[currentSeason];
            if (seasonalAdj) {
                adjustments.push(...seasonalAdj);
            }
        }
    }

    // Apply adjustments to create personalized phases
    const personalizedPhases = applyAdjustments(basePathway.phases, adjustments);

    // Adjust urgency based on diagnosis confidence and red flags
    const urgencyLevel = determineUrgency(basePathway, diagnosis);

    // Estimate duration based on patient factors
    const estimatedDuration = estimateDuration(basePathway, vikriti, agni);

    return {
        basePathway,
        adjustments,
        personalizedPhases,
        urgencyLevel,
        estimatedDuration
    };
}

/**
 * Apply adjustments to treatment phases
 */
function applyAdjustments(
    basePhases: TreatmentPhase[],
    adjustments: PathwayAdjustment[]
): TreatmentPhase[] {
    // Deep clone phases to avoid mutation
    const modifiedPhases = JSON.parse(JSON.stringify(basePhases)) as TreatmentPhase[];

    for (const adjustment of adjustments) {
        // Determine which phases to modify
        const phasesToModify = adjustment.phase === 'all'
            ? modifiedPhases
            : modifiedPhases.filter(p => p.name === adjustment.phase);

        for (const phase of phasesToModify) {
            // Add new actions
            if (adjustment.modifications.add) {
                phase.actions.push(...adjustment.modifications.add);
            }

            // Remove actions
            if (adjustment.modifications.remove) {
                phase.actions = phase.actions.filter(action =>
                    !adjustment.modifications.remove!.some(removeText =>
                        action.action.toLowerCase().includes(removeText.toLowerCase())
                    )
                );
            }

            // Adjust existing actions
            if (adjustment.modifications.adjust) {
                for (const adjust of adjustment.modifications.adjust) {
                    const actionToAdjust = phase.actions.find(a =>
                        a.action.toLowerCase().includes(adjust.actionText.toLowerCase())
                    );

                    if (actionToAdjust) {
                        if (adjust.newFrequency) actionToAdjust.frequency = adjust.newFrequency;
                        if (adjust.newNotes) actionToAdjust.notes = adjust.newNotes;
                    }
                }
            }
        }
    }

    return modifiedPhases;
}

/**
 * Determine urgency level
 */
function determineUrgency(
    pathway: CarePathway,
    diagnosis: DiagnosisResult
): 'emergency' | 'urgent' | 'routine' | 'self-care' {
    // Check for emergency red flags
    const hasEmergencyFlags = pathway.redFlags.some(flag => flag.severity === 'emergency');
    if (hasEmergencyFlags) {
        return 'emergency';
    }

    // Use pathway's base urgency
    return pathway.urgency;
}

/**
 * Estimate recovery duration based on patient factors
 */
function estimateDuration(
    pathway: CarePathway,
    vikriti?: VikritiProfile | null,
    agni?: AgniAssessment | null
): number {
    let duration = pathway.expectedDuration.typical;

    // Adjust based on Vikriti imbalance severity
    if (vikriti) {
        if (vikriti.imbalanceSeverity > 60) {
            // Severe imbalance may slow recovery
            duration += Math.round(duration * 0.3); // +30%
        } else if (vikriti.imbalanceSeverity < 30) {
            // Good balance may speed recovery
            duration -= Math.round(duration * 0.1); // -10%
        }
    }

    // Adjust based on Agni strength
    if (agni) {
        if (agni.type === 'sama') {
            // Strong Agni aids recovery
            duration -= Math.round(duration * 0.15); // -15%
        } else if (agni.type === 'manda') {
            // Weak Agni slows recovery
            duration += Math.round(duration * 0.2); // +20%
        }
    }

    // Ensure within min/max bounds
    return Math.max(
        pathway.expectedDuration.min,
        Math.min(pathway.expectedDuration.max, duration)
    );
}

/**
 * Get current season for seasonal adjustments
 */
function getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 6) return 'summer';
    if (month >= 7 && month <= 8) return 'monsoon';
    if (month >= 9 && month <= 10) return 'autumn';
    return 'winter';
}

/**
 * Calculate current day in pathway
 */
export function calculateCurrentDay(startDate: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Get current phase based on day
 */
export function getCurrentPhase(
    pathway: PersonalizedPathway,
    currentDay: number
): TreatmentPhase | null {
    for (const phase of pathway.personalizedPhases) {
        if (currentDay >= phase.dayRange.start && currentDay <= phase.dayRange.end) {
            return phase;
        }
    }
    return null;
}

/**
 * Get actions for specific day
 */
export function getActionsForDay(
    pathway: PersonalizedPathway,
    day: number
): PhaseAction[] {
    const phase = getCurrentPhase(pathway, day);
    return phase ? phase.actions : [];
}

/**
 * Check if pathway has critical red flags
 */
export function hasCriticalRedFlags(pathway: CarePathway): boolean {
    return pathway.redFlags.some(flag => flag.severity === 'emergency');
}

/**
 * Get next checkpoint
 */
export function getNextCheckpoint(
    pathway: CarePathway,
    currentDay: number
): typeof pathway.monitoring.checkpoints[0] | null {
    const futureCheckpoints = pathway.monitoring.checkpoints
        .filter(cp => cp.day > currentDay)
        .sort((a, b) => a.day - b.day);

    return futureCheckpoints[0] || null;
}
