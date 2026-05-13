/**
 * Intelligence Layer Types — v1
 *
 * Type definitions for the Clinical Intelligence Enhancement Layer.
 * These types extend (never replace) the existing diagnosis types.
 *
 * Used by: ClinicalKnowledgeBase, MedicationIntelligence,
 *          PatientSimilarityEngine, DynamicConfidenceEngine,
 *          MultiModalReasoner, LongitudinalTracker,
 *          SafetyGuardEnhancer, ClinicalIntelligenceLayer
 */

import type { ReasoningTraceEntry, UserSymptomData, Condition } from '../types';
import type { DetectedPattern } from './SymptomCorrelations';
import type { PersonaProfile } from './PersonaEngine';
import type { MCMCResult } from './MCMCEngine';

// ─── Goal 1: Pattern-Based Clinical Reasoning ────────────────────────────────

export interface ExtendedClinicalPattern {
    name: string;
    conditionId: string;
    symptoms: string[];
    multiplier: number;
    specificity: number;
    clinicalPearl?: string;
    /** Source dataset this pattern was derived from */
    source: 'mimic_iv' | 'eicu' | 'pubmed' | 'who' | 'clinical_guideline' | 'expert';
    /** Minimum patient age for this pattern (null = any) */
    minAge?: number | null;
    /** Maximum patient age for this pattern (null = any) */
    maxAge?: number | null;
    /** Gender filter: 'male', 'female', or null for any */
    genderFilter?: 'male' | 'female' | null;
    /** Prevalence in source dataset */
    prevalenceInDataset?: number;
    /** ICD-10 codes associated with this pattern */
    icdCodes?: string[];
}

// ─── Goal 2: Differential Diagnosis Intelligence ─────────────────────────────

export interface DifferentialEntry {
    primaryConditionId: string;
    mimicConditionId: string;
    /** Symptoms that distinguish the primary from the mimic */
    distinguishingSymptoms: string[];
    /** Symptoms shared between both conditions */
    sharedSymptoms: string[];
    /** How often this mimic is confused with the primary (0-1) */
    confusionRate: number;
    /** Critical test or finding that differentiates */
    keyDifferentiator: string;
    /** Clinical note for the reasoning trace */
    clinicalNote: string;
}

export interface DifferentialResult {
    primaryCondition: string;
    differentials: Array<{
        conditionId: string;
        conditionName: string;
        overlapScore: number;
        distinguishingFeatures: string[];
        clinicalNote: string;
    }>;
}

// ─── Goal 3: Medication-Aware Reasoning ──────────────────────────────────────

export interface MedicationSideEffectProfile {
    medicationPattern: RegExp;
    canonicalName: string;
    drugClass: string;
    commonSideEffects: Array<{
        symptom: string;
        frequency: 'very_common' | 'common' | 'uncommon' | 'rare';
        /** Probability that this symptom is caused by the medication (0-1) */
        attributableFraction: number;
    }>;
    seriousSideEffects: Array<{
        symptom: string;
        urgency: 'immediate' | 'urgent' | 'routine';
        alert: string;
    }>;
    /** Conditions this medication can mask or exacerbate */
    maskingEffects: Array<{
        conditionId: string;
        effect: 'masks' | 'exacerbates' | 'mimics';
        explanation: string;
    }>;
}

export interface MedicationReasoningResult {
    /** Symptoms that may be medication side effects rather than disease */
    potentialSideEffects: Array<{
        symptom: string;
        medication: string;
        attributableFraction: number;
        recommendation: string;
    }>;
    /** Medications that could mask the true condition */
    maskingAlerts: Array<{
        medication: string;
        conditionId: string;
        effect: string;
        explanation: string;
    }>;
    /** Adjustment factors for Bayesian scoring */
    scoreAdjustments: Array<{
        conditionId: string;
        factor: number;
        reason: string;
    }>;
}

// ─── Goal 4: Historical Patient Similarity Engine ────────────────────────────

export interface ClinicalCasePattern {
    id: string;
    /** Demographic profile */
    demographics: {
        ageRange: [number, number];
        gender?: 'male' | 'female' | 'any';
        bmiRange?: [number, number];
        comorbidities?: string[];
    };
    /** Presenting symptoms */
    presentingSymptoms: string[];
    /** Final diagnosis */
    finalDiagnosis: string;
    /** Diagnostic confidence from the source case */
    diagnosticConfidence: number;
    /** Outcome if available */
    outcome?: 'recovered' | 'chronic' | 'referred' | 'hospitalized';
    /** Source dataset */
    source: 'mimic_iv' | 'eicu' | 'openmrs' | 'synthetic';
    /** How common this pattern is (n = number of similar cases) */
    caseCount: number;
}

export interface SimilarityResult {
    matchedPatterns: Array<{
        pattern: ClinicalCasePattern;
        similarityScore: number;
        matchedFeatures: string[];
        unmatchedFeatures: string[];
    }>;
    /** Aggregate diagnostic signal from similar cases */
    aggregateDiagnosisSignal: Array<{
        conditionId: string;
        frequency: number;
        meanConfidence: number;
    }>;
}

// ─── Goal 5: Rare Disease Escalation Layer ───────────────────────────────────

export interface RareDiseasePattern {
    conditionId: string;
    conditionName: string;
    /** ICD-10 codes */
    icdCodes: string[];
    /** Combination of symptoms that should trigger escalation */
    triggerSymptoms: string[];
    /** Minimum number of trigger symptoms needed */
    minTriggerCount: number;
    /** Alert level */
    urgency: 'routine_referral' | 'urgent_referral' | 'emergency';
    /** Specialist type recommended */
    specialistReferral: string;
    /** Why this is important to catch */
    clinicalRationale: string;
    /** Estimated prevalence */
    prevalence: string;
    /** Source of this pattern */
    source: 'pubmed' | 'orphanet' | 'who' | 'expert';
    /** Maximum age for this pattern (null = any) */
    maxAge?: number | null;
}

export interface RareDiseaseAlert {
    conditionName: string;
    triggerScore: number;
    matchedSymptoms: string[];
    urgency: string;
    specialistReferral: string;
    rationale: string;
}

// ─── Goal 6: Dynamic Confidence Scoring ──────────────────────────────────────

export interface DynamicConfidenceFactors {
    /** MCMC convergence quality (0-1) */
    convergenceQuality: number;
    /** Evidence completeness (0-1) */
    evidenceCompleteness: number;
    /** Pattern match strength (0-1) */
    patternStrength: number;
    /** Differential separation (how far ahead of #2) (0-1) */
    differentialSeparation: number;
    /** Clinical risk level (higher risk → wider CI) */
    clinicalRiskLevel: number;
    /** Medication confounding (0-1, higher = more confounding) */
    medicationConfounding: number;
    /** Case similarity support (0-1) */
    similaritySupportScore: number;
}

export interface DynamicConfidenceResult {
    /** Adjusted confidence score (0-100) */
    adjustedScore: number;
    /** Adjusted confidence interval */
    adjustedCI: { lower: number; upper: number; width: number };
    /** Confidence grade */
    grade: 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';
    /** Factors that influenced the adjustment */
    factorBreakdown: DynamicConfidenceFactors;
    /** Human-readable explanation */
    explanation: string;
}

// ─── Goal 7: Clinical Risk Prioritization ────────────────────────────────────

export interface RiskPrioritizedCandidate {
    conditionId: string;
    conditionName: string;
    originalScore: number;
    riskAdjustedScore: number;
    severityWeight: number;
    /** Time-criticality: how urgent is this to catch early */
    timeCriticality: 'minutes' | 'hours' | 'days' | 'weeks' | 'non_urgent';
    /** Worst-case outcome if missed */
    worstCaseIfMissed: string;
    /** Reasoning for risk adjustment */
    riskReasoning: string;
}

// ─── Goal 8: Multi-Modal Medical Reasoning ───────────────────────────────────

export interface CrossSystemCorrelation {
    /** Primary body system affected */
    primarySystem: BodySystem;
    /** Secondary systems with related symptoms */
    secondarySystems: Array<{
        system: BodySystem;
        symptoms: string[];
        correlationStrength: number;
    }>;
    /** Conditions that span multiple systems */
    multiSystemConditions: Array<{
        conditionId: string;
        systemsInvolved: BodySystem[];
        evidenceStrength: number;
    }>;
}

export type BodySystem =
    | 'cardiovascular' | 'respiratory' | 'neurological'
    | 'gastrointestinal' | 'musculoskeletal' | 'endocrine'
    | 'renal' | 'dermatological' | 'hematological'
    | 'immunological' | 'psychiatric' | 'ophthalmological'
    | 'ent' | 'reproductive';

// ─── Goal 9: Longitudinal Intelligence ───────────────────────────────────────

export interface SymptomSnapshot {
    timestamp: number;
    symptoms: string[];
    intensity?: number;
    notes?: string;
}

export interface LongitudinalInsight {
    /** Symptoms that are progressing (getting worse) */
    progressingSymptoms: string[];
    /** Symptoms that are new since last visit */
    newSymptoms: string[];
    /** Symptoms that have resolved */
    resolvedSymptoms: string[];
    /** Pattern of progression */
    progressionPattern: 'stable' | 'worsening' | 'improving' | 'fluctuating' | 'unknown';
    /** Time-based alerts */
    temporalAlerts: string[];
    /** Conditions more likely given the progression pattern */
    progressionDiagnosticSignal: Array<{
        conditionId: string;
        reason: string;
        multiplier: number;
    }>;
}

// ─── Goal 10: Explainability Layer ───────────────────────────────────────────

export interface EnhancedReasoningTrace extends ReasoningTraceEntry {
    /** Evidence source */
    evidenceSource?: string;
    /** Confidence in this specific factor */
    factorConfidence?: number;
    /** Cross-references to supporting clinical data */
    references?: string[];
    /** Whether this factor supports or contradicts the diagnosis */
    direction?: 'supports' | 'contradicts' | 'neutral';
}

export interface ExplainabilityReport {
    /** Top supporting evidence */
    topSupportingFactors: EnhancedReasoningTrace[];
    /** Top contradicting evidence */
    topContradictingFactors: EnhancedReasoningTrace[];
    /** What additional information would change the diagnosis */
    pivotalQuestions: string[];
    /** Alternative diagnoses and why they were ruled out */
    ruledOutExplanations: Array<{
        conditionName: string;
        reason: string;
    }>;
    /** Confidence calibration narrative */
    confidenceNarrative: string;
}

// ─── Goal 12: Conservative Medical Safety ────────────────────────────────────

export interface SafetyAssessment {
    /** Overall safety level */
    safetyLevel: 'safe' | 'caution' | 'warning' | 'danger' | 'emergency';
    /** Specific safety alerts */
    alerts: SafetyAlert[];
    /** Whether to force seekHelp = true */
    forceSeekHelp: boolean;
    /** Reason for forcing seekHelp */
    seekHelpReason?: string;
    /** Red flags from multiple sources (merged) */
    mergedRedFlags: string[];
}

export interface SafetyAlert {
    type: 'age_risk' | 'medication_risk' | 'symptom_combination' | 'progression_risk' | 'rare_disease' | 'multi_system';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    recommendation: string;
}

// ─── Goal 13: Intelligence Amplification Rules ──────────────────────────────

export interface AmplificationRule {
    id: string;
    name: string;
    description: string;
    /** When this rule should fire */
    condition: (ctx: IntelligenceContext) => boolean;
    /** What adjustment to make */
    action: (ctx: IntelligenceContext) => IntelligenceAdjustment;
}

export interface IntelligenceAdjustment {
    /** Score multiplier for specific conditions */
    scoreMultipliers?: Array<{ conditionPattern: RegExp; multiplier: number; reason: string }>;
    /** Additional alerts to inject */
    additionalAlerts?: string[];
    /** Force follow-up question */
    forceFollowUp?: boolean;
    /** Additional reasoning trace entries */
    traceEntries?: EnhancedReasoningTrace[];
}

// ─── Goal 15: Enhanced Output Structure ──────────────────────────────────────

export interface EnhancedDiagnosisOutput {
    /** Existing diagnosis results (preserved) */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    baseResults: any[];

    /** Enhancement layer additions */
    intelligence: {
        /** Differential diagnosis analysis */
        differentialAnalysis?: DifferentialResult;
        /** Risk-prioritized candidate list */
        riskPrioritizedCandidates?: RiskPrioritizedCandidate[];
        /** Medication reasoning results */
        medicationReasoning?: MedicationReasoningResult;
        /** Similar case matches */
        patientSimilarity?: SimilarityResult;
        /** Rare disease alerts */
        rareDiseaseAlerts?: RareDiseaseAlert[];
        /** Dynamic confidence assessment */
        dynamicConfidence?: DynamicConfidenceResult;
        /** Cross-system correlations */
        crossSystemAnalysis?: CrossSystemCorrelation;
        /** Longitudinal insights */
        longitudinalInsights?: LongitudinalInsight;
        /** Explainability report */
        explainability?: ExplainabilityReport;
        /** Safety assessment */
        safetyAssessment?: SafetyAssessment;
        /** Intelligence layer metadata */
        meta: {
            enhancementVersion: string;
            modulesExecuted: string[];
            totalEnhancementTimeMs: number;
            patternsDetected: number;
            rareDiseaseChecks: number;
            safetyAlertsGenerated: number;
            medicationDataSource?: 'rxnorm_openfda' | 'static_fallback';
            rxnormDrugsResolved?: string[];
        };
    };
}

// ─── Shared Context for Intelligence Modules ─────────────────────────────────

export interface IntelligenceContext {
    /** Original user symptoms */
    symptoms: UserSymptomData;
    /** Parsed persona profile */
    persona: PersonaProfile;
    /** Bayesian candidate results (from existing engine) */
    bayesianCandidates: Array<{
        conditionId: string;
        conditionName: string;
        score: number;
        matchedKeywords: string[];
        reasoningTrace: ReasoningTraceEntry[];
        posteriorRedFlags: string[];
        mcmcDiagnostics?: MCMCResult;
    }>;
    /** Detected symptom patterns (from existing SymptomCorrelations) */
    detectedPatterns: DetectedPattern[];
    /** Extracted symptom list */
    symptomList: string[];
    /** All conditions matched during retrieval */
    allConditions: Condition[];
    /** Red flag alerts from existing scanner */
    existingAlerts: string[];
    /** Previous session data (for longitudinal) */
    previousSessions?: SymptomSnapshot[];
}
