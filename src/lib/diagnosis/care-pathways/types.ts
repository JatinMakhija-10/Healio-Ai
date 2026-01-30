/**
 * Care Pathway Type Definitions
 * 
 * Defines the structure for evidence-based treatment pathways
 * that guide patients from diagnosis through recovery.
 */

import { DoshaType, PrakritiType, AgniType } from '../../ayurveda/types';

/**
 * Complete Care Pathway for a condition
 */
export interface CarePathway {
    conditionId: string;
    conditionName: string;

    /**
     * Expected duration of illness/recovery (in days)
     */
    expectedDuration: {
        min: number;
        max: number;
        typical: number;
    };

    /**
     * Severity-based urgency classification
     */
    urgency: 'emergency' | 'urgent' | 'routine' | 'self-care';

    /**
     * Timeline-based treatment phases
     */
    phases: TreatmentPhase[];

    /**
     * Monitoring schedule with checkpoints
     */
    monitoring: MonitoringSchedule;

    /**
     * Red flags requiring escalation
     */
    redFlags: RedFlag[];

    /**
     * General self-care instructions
     */
    selfCare: SelfCareGuidance[];

    /**
     * When to seek professional medical help
     */
    seekHelpCriteria: string[];

    /**
     * Evidence base for this pathway
     */
    evidenceBase?: EvidenceSource[];

    /**
     * Ayurvedic modifications based on constitution
     */
    ayurvedicModifications?: AyurvedicPathwayModifications;
}

/**
 * Treatment phase within a care pathway
 */
export interface TreatmentPhase {
    name: string;
    dayRange: { start: number; end: number };
    description: string;

    /**
     * Actions to take during this phase
     */
    actions: PhaseAction[];

    /**
     * Expected changes/improvements during this phase
     */
    expectedChanges: string[];

    /**
     * Warning signs to watch for
     */
    warningSigns: string[];
}

/**
 * Individual action within a treatment phase
 */
export interface PhaseAction {
    category: 'medication' | 'lifestyle' | 'diet' | 'exercise' | 'monitoring' | 'ayurvedic' | 'supplement';
    priority: 'critical' | 'important' | 'recommended' | 'optional';
    action: string;
    frequency?: string;
    duration?: string;
    notes?: string;
    dosage?: string;
}

/**
 * Monitoring schedule with checkpoints
 */
export interface MonitoringSchedule {
    /**
     * Planned checkpoints at specific days
     */
    checkpoints: Checkpoint[];

    /**
     * Daily self-monitoring tasks
     */
    selfMonitoring: SelfMonitoringTask[];
}

/**
 * Assessment checkpoint at a specific day
 */
export interface Checkpoint {
    day: number;
    description: string;
    assessments: string[];
    decisions: DecisionPoint[];
}

/**
 * Decision point based on assessment
 */
export interface DecisionPoint {
    condition: string;
    ifTrue: string;
    ifFalse: string;
}

/**
 * Self-monitoring task
 */
export interface SelfMonitoringTask {
    task: string;
    frequency: 'hourly' | 'twice-daily' | 'daily' | 'every-2-days' | 'weekly';
    method?: string;
    normalRange?: string;
}

/**
 * Red flag requiring immediate attention
 */
export interface RedFlag {
    symptom: string;
    severity: 'emergency' | 'urgent' | 'concerning';
    action: string;
    timeframe: 'immediately' | 'within-1-hour' | 'within-24-hours' | 'within-2-3-days';
    rationale?: string;
}

/**
 * Self-care guidance
 */
export interface SelfCareGuidance {
    category: 'Hydration' | 'Rest' | 'Nutrition' | 'Activity' | 'Hygiene' | 'Environment' | 'Other';
    instruction: string;
    rationale: string;
    frequency?: string;
}

/**
 * Evidence source for pathway
 */
export interface EvidenceSource {
    type: 'guideline' | 'clinical-trial' | 'meta-analysis' | 'expert-consensus' | 'traditional-medicine';
    citation: string;
    quality: 'high' | 'moderate' | 'low';
}

/**
 * Ayurvedic modifications to pathway based on constitution
 */
export interface AyurvedicPathwayModifications {
    /**
     * Modifications based on Prakriti (birth constitution)
     */
    prakritiModifications?: {
        [key in PrakritiType]?: PathwayAdjustment[];
    };

    /**
     * Modifications based on current Vikriti (doshic imbalance)
     */
    vikritiModifications?: {
        [key in DoshaType]?: PathwayAdjustment[];
    };

    /**
     * Modifications based on Agni (digestive fire)
     */
    agniModifications?: {
        [key in AgniType]?: PathwayAdjustment[];
    };

    /**
     * Seasonal modifications (Ritucharya)
     */
    seasonalModifications?: {
        [season: string]: PathwayAdjustment[];
    };
}

/**
 * Adjustment to pathway for personalization
 */
export interface PathwayAdjustment {
    phase: string | 'all'; // Which phase to modify, or 'all'
    modifications: {
        add?: PhaseAction[];
        remove?: string[]; // Action descriptions to remove
        adjust?: Array<{ actionText: string; newFrequency?: string; newNotes?: string }>;
    };
    rationale: string;
}

/**
 * Patient's current progress through pathway
 */
export interface PathwayProgress {
    pathwayId: string;
    startDate: Date;
    currentDay: number;
    currentPhase: string;

    /**
     * Completed actions
     */
    completedActions: string[];

    /**
     * Checkpoint results
     */
    checkpointResults: Array<{
        day: number;
        assessments: { [key: string]: string };
        decision: string;
    }>;

    /**
     * Self-monitoring data
     */
    monitoringData: Array<{
        date: Date;
        task: string;
        value: string;
    }>;

    /**
     * Deviation from expected progress
     */
    deviation: 'on-track' | 'faster-than-expected' | 'slower-than-expected' | 'concerning';
}

/**
 * Pathway recommendation with personalization
 */
export interface PersonalizedPathway {
    basePathway: CarePathway;
    adjustments: PathwayAdjustment[];
    personalizedPhases: TreatmentPhase[];
    urgencyLevel: 'emergency' | 'urgent' | 'routine' | 'self-care';
    estimatedDuration: number; // days
}
