/**
 * Advanced Diagnosis Module
 * Production-grade enhancements for the core diagnosis engine
 */

// Symptom Correlations
export type { SymptomPattern, DetectedPattern } from './SymptomCorrelations';
export { SymptomCorrelationDetector, symptomCorrelationDetector, CLINICAL_PATTERNS } from './SymptomCorrelations';

// Clinical Decision Rules  
export type { ClinicalRule, RuleResult } from './ClinicalDecisionRules';
export { ClinicalDecisionRules, clinicalRules, wellsScoreDVT, percRulePE, heartScore, nexusCriteria, ottawaAnkleRules } from './ClinicalDecisionRules';

// Uncertainty Quantification
export type { UncertaintyEstimate, EvidenceQualityMetrics } from './UncertaintyQuantification';
export { UncertaintyQuantifier, uncertaintyQuantifier, formatUncertaintyForUser } from './UncertaintyQuantification';

// MCMC Bayesian Engine (v2 — Full Checkpoint Implementation)
export type { MCMCResult, MCMCDiagnosisResult, MCMCConfig, EvidenceVector, BetaParams, CovariateRule } from './MCMCEngine';
export { mcmcInfer, mcmcDiagnoseAll, extractEvidence, computeRHat, computeCovariateAdjustedPrior } from './MCMCEngine';

// Information Gain Selector
export { infoGainSelector } from './InformationGainSelector';

// Persona Engine
export { buildPersonaProfile } from './PersonaEngine';

// ─── Clinical Intelligence Enhancement Layer (v1) ────────────────────────────
// Goals 1-15: Augments existing pipeline — never replaces

// Intelligence Types
export type {
    IntelligenceContext,
    EnhancedDiagnosisOutput,
    DifferentialResult,
    RiskPrioritizedCandidate,
    MedicationReasoningResult,
    SimilarityResult,
    RareDiseaseAlert,
    DynamicConfidenceResult,
    CrossSystemCorrelation,
    LongitudinalInsight,
    ExplainabilityReport,
    SafetyAssessment,
    SafetyAlert,
    EnhancedReasoningTrace,
} from './intelligenceTypes';

// Master Coordinator
export { runIntelligenceLayer, buildIntelligenceContext, mergeIntelligenceIntoResponse } from './ClinicalIntelligenceLayer';

// Individual Modules (for testing/direct access)
export { ClinicalKnowledgeBase, clinicalKnowledgeBase } from './ClinicalKnowledgeBase';
export { MedicationIntelligenceEngine, medicationIntelligence } from './MedicationIntelligence';
export { PatientSimilarityEngine, patientSimilarityEngine } from './PatientSimilarityEngine';
export { DynamicConfidenceEngine, dynamicConfidenceEngine } from './DynamicConfidenceEngine';
export { MultiModalReasoner, multiModalReasoner } from './MultiModalReasoner';
export { LongitudinalTracker, longitudinalTracker } from './LongitudinalTracker';
export { SafetyGuardEnhancer, safetyGuardEnhancer } from './SafetyGuardEnhancer';
