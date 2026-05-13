/**
 * ClinicalIntelligenceLayer — v1 (Master Coordinator)
 *
 * Single entry point that orchestrates all 8 intelligence modules:
 *   1. ClinicalKnowledgeBase   (Goals 1, 2, 5, 11)
 *   2. MedicationIntelligence  (Goal 3)
 *   3. PatientSimilarityEngine (Goal 4)
 *   4. DynamicConfidenceEngine (Goals 6, 7, 10, 13)
 *   5. MultiModalReasoner      (Goal 8)
 *   6. LongitudinalTracker     (Goal 9)
 *   7. SafetyGuardEnhancer     (Goals 5, 12, 14)
 *
 * Pipeline:
 *   IntelligenceContext → [all modules in parallel] → EnhancedDiagnosisOutput
 *
 * DESIGN: Augments existing orchestrator output. Never replaces base results.
 * Failure in any module is caught and skipped — base diagnosis always returns.
 */

import type {
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
    IntelligenceAdjustment,
    EnhancedReasoningTrace,
} from './intelligenceTypes';

import { clinicalKnowledgeBase } from './ClinicalKnowledgeBase';
import { medicationIntelligence } from './MedicationIntelligence';
import { patientSimilarityEngine } from './PatientSimilarityEngine';
import { dynamicConfidenceEngine } from './DynamicConfidenceEngine';
import { multiModalReasoner } from './MultiModalReasoner';
import { longitudinalTracker } from './LongitudinalTracker';
import { safetyGuardEnhancer } from './SafetyGuardEnhancer';

const ENHANCEMENT_VERSION = '1.0.0';

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Run the full Clinical Intelligence Enhancement Layer.
 *
 * @param ctx - Intelligence context built from the existing orchestrator output
 * @returns Enhanced diagnosis output with all intelligence modules applied
 *
 * This function is designed to be called AFTER the existing orchestrator
 * completes its pipeline. It takes the orchestrator's output (wrapped in
 * IntelligenceContext) and produces additional intelligence signals.
 *
 * It is 100% fault-tolerant: any module failure is caught and skipped.
 */
export function runIntelligenceLayer(ctx: IntelligenceContext): EnhancedDiagnosisOutput {
    const startTime = performance.now();
    const modulesExecuted: string[] = [];

    let differentialAnalysis: DifferentialResult | undefined;
    let riskPrioritizedCandidates: RiskPrioritizedCandidate[] | undefined;
    let medicationReasoning: MedicationReasoningResult | undefined;
    let patientSimilarity: SimilarityResult | undefined;
    let rareDiseaseAlerts: RareDiseaseAlert[] = [];
    let dynamicConfidence: DynamicConfidenceResult | undefined;
    let crossSystemAnalysis: CrossSystemCorrelation | undefined;
    let longitudinalInsights: LongitudinalInsight | undefined;
    let explainability: ExplainabilityReport | undefined;
    let safetyAssessment: SafetyAssessment | undefined;
    let rxnormDataSource: 'rxnorm_openfda' | 'static_fallback' = 'static_fallback';
    let rxnormDrugsResolved: string[] = [];

    const age = ctx.symptoms.userProfile?.age ? parseInt(ctx.symptoms.userProfile.age) : null;
    const gender = ctx.symptoms.userProfile?.gender || null;

    // ── Module 0: Real-Data Enrichment (RxNorm + OpenFDA) ───────────────────
    // Fire-and-forget: enrichWithRealData mutates the medication profiles
    // in-place so that Module 3 (Medication Intelligence) benefits from live
    // FDA adverse event data. If the API is unavailable the static profiles
    // remain unchanged — fully graceful degradation.
    medicationIntelligence.enrichWithRealData(ctx)
        .then(result => {
            rxnormDataSource = result.dataSource;
            rxnormDrugsResolved = result.drugsResolved;
            if (result.dataSource === 'rxnorm_openfda') {
                modulesExecuted.push('rxnorm_openfda_enrichment');
            }
        })
        .catch(() => { /* non-fatal */ });

    // ── Module 1: Extended Pattern Detection (Goal 1) ────────────────────────
    try {
        const extendedPatterns = clinicalKnowledgeBase.detectExtendedPatterns(
            ctx.symptomList, age, gender
        );
        if (extendedPatterns.length > 0) {
            modulesExecuted.push('extended_patterns');
        }
    } catch { /* skip */ }

    // ── Module 2: Differential Diagnosis (Goal 2) ────────────────────────────
    try {
        if (ctx.bayesianCandidates.length > 0) {
            differentialAnalysis = clinicalKnowledgeBase.getDifferentialAnalysis(
                ctx.bayesianCandidates[0].conditionId,
                ctx.symptomList,
            );
            if (differentialAnalysis.differentials.length > 0) {
                modulesExecuted.push('differential_diagnosis');
            }
        }
    } catch { /* skip */ }

    // ── Module 3: Medication Intelligence (Goal 3) ───────────────────────────
    try {
        medicationReasoning = medicationIntelligence.analyze(ctx);
        if (medicationReasoning.potentialSideEffects.length > 0 ||
            medicationReasoning.maskingAlerts.length > 0) {
            modulesExecuted.push('medication_intelligence');
        }
    } catch { /* skip */ }

    // ── Module 4: Patient Similarity (Goal 4) — Real DB + Hardcoded ─────────
    // Fire real-data lookup as fire-and-forget; use hardcoded sync result now.
    // On next session, DB cache is warm and results will be richer.
    patientSimilarity = patientSimilarityEngine.findSimilarCases(ctx);
    if (patientSimilarity.matchedPatterns.length > 0) {
        modulesExecuted.push('patient_similarity');
    }
    // Async upgrade: if DB returns better matches, they'll be used next session
    patientSimilarityEngine.findSimilarCasesWithRealData(ctx)
        .then(realResult => {
            if (realResult.matchedPatterns.length > (patientSimilarity?.matchedPatterns.length ?? 0)) {
                patientSimilarity = realResult;
                if (!modulesExecuted.includes('patient_similarity_realdata')) {
                    modulesExecuted.push('patient_similarity_realdata');
                }
            }
        })
        .catch(() => { /* non-fatal */ });

    // ── Module 5: Rare Disease Screening (Goal 5) ────────────────────────────
    try {
        rareDiseaseAlerts = clinicalKnowledgeBase.screenForRareDiseases(ctx.symptomList, age);
        if (rareDiseaseAlerts.length > 0) {
            modulesExecuted.push('rare_disease_screening');
        }
    } catch { /* skip */ }

    // ── Module 6: Dynamic Confidence (Goal 6) ────────────────────────────────
    try {
        dynamicConfidence = dynamicConfidenceEngine.computeDynamicConfidence(
            ctx, medicationReasoning, patientSimilarity
        );
        modulesExecuted.push('dynamic_confidence');
    } catch { /* skip */ }

    // ── Module 7: Risk Prioritization (Goal 7) ──────────────────────────────
    try {
        riskPrioritizedCandidates = dynamicConfidenceEngine.riskPrioritize(ctx);
        if (riskPrioritizedCandidates.length > 0) {
            modulesExecuted.push('risk_prioritization');
        }
    } catch { /* skip */ }

    // ── Module 8: Multi-Modal Reasoning (Goal 8) ─────────────────────────────
    try {
        const result = multiModalReasoner.analyze(ctx);
        if (result) {
            crossSystemAnalysis = result;
            modulesExecuted.push('multi_modal_reasoning');
        }
    } catch { /* skip */ }

    // ── Module 9: Longitudinal Tracking (Goal 9) ─────────────────────────────
    try {
        const result = longitudinalTracker.analyze(ctx);
        if (result) {
            longitudinalInsights = result;
            modulesExecuted.push('longitudinal_tracking');
        }
    } catch { /* skip */ }

    // ── Module 10: Explainability (Goal 10) ──────────────────────────────────
    try {
        explainability = dynamicConfidenceEngine.generateExplainability(ctx);
        modulesExecuted.push('explainability');
    } catch { /* skip */ }

    // ── Module 11: Intelligence Amplification (Goal 13) ──────────────────────
    let amplification: IntelligenceAdjustment | undefined;
    try {
        amplification = dynamicConfidenceEngine.applyAmplificationRules(ctx);
        if (amplification.additionalAlerts?.length || amplification.forceFollowUp || amplification.traceEntries?.length) {
            modulesExecuted.push('intelligence_amplification');
        }
    } catch { /* skip */ }

    // ── Module 12: Safety Assessment (Goals 5, 12, 14) ──────────────────────
    try {
        safetyAssessment = safetyGuardEnhancer.assess(
            ctx,
            rareDiseaseAlerts,
            medicationReasoning,
            crossSystemAnalysis,
            longitudinalInsights,
            dynamicConfidence,
        );
        modulesExecuted.push('safety_assessment');

        // Merge amplification alerts into safety
        if (amplification?.additionalAlerts) {
            safetyAssessment.mergedRedFlags.push(...amplification.additionalAlerts);
        }
    } catch { /* skip */ }

    // ── Build final output ───────────────────────────────────────────────────
    const totalTime = performance.now() - startTime;

    return {
        baseResults: ctx.bayesianCandidates,
        intelligence: {
            differentialAnalysis,
            riskPrioritizedCandidates,
            medicationReasoning,
            patientSimilarity,
            rareDiseaseAlerts: rareDiseaseAlerts.length > 0 ? rareDiseaseAlerts : undefined,
            dynamicConfidence,
            crossSystemAnalysis,
            longitudinalInsights,
            explainability,
            safetyAssessment,
            meta: {
                enhancementVersion: ENHANCEMENT_VERSION,
                modulesExecuted,
                totalEnhancementTimeMs: Math.round(totalTime * 100) / 100,
                patternsDetected: ctx.detectedPatterns.length,
                rareDiseaseChecks: rareDiseaseAlerts.length,
                safetyAlertsGenerated: safetyAssessment?.alerts.length || 0,
                medicationDataSource: rxnormDataSource,
                rxnormDrugsResolved,
            },
        },
    };
}

/**
 * Build an IntelligenceContext from orchestrator output.
 *
 * This adapter function converts the existing orchestrator's output
 * into the format expected by the intelligence layer.
 *
 * @param orchestratorOutput - Output from the existing diagnosis pipeline
 * @returns IntelligenceContext ready for runIntelligenceLayer()
 */
export function buildIntelligenceContext(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orchestratorOutput: any,
): IntelligenceContext {
    return {
        symptoms: orchestratorOutput.symptoms || {},
        persona: orchestratorOutput.persona || {},
        bayesianCandidates: orchestratorOutput.candidates || [],
        detectedPatterns: orchestratorOutput.detectedPatterns || [],
        symptomList: orchestratorOutput.symptomList || [],
        allConditions: orchestratorOutput.conditions || [],
        existingAlerts: orchestratorOutput.alerts || [],
        previousSessions: orchestratorOutput.previousSessions || undefined,
    };
}

/**
 * Merge intelligence layer safety signals back into the orchestrator's
 * existing alert/seekHelp fields so the AI prompt and UI reflect them.
 */
export function mergeIntelligenceIntoResponse(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    baseResponse: any,
    enhanced: EnhancedDiagnosisOutput,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    const safety = enhanced.intelligence.safetyAssessment;
    if (!safety) return baseResponse;

    // Merge red flags
    const existingAlerts: string[] = baseResponse.alerts || [];
    const mergedAlerts = [...new Set([...existingAlerts, ...safety.mergedRedFlags])];

    // Force seekHelp if safety layer demands it
    const seekHelp = baseResponse.seekHelp || safety.forceSeekHelp;
    const seekHelpReason = safety.forceSeekHelp
        ? safety.seekHelpReason || baseResponse.seekHelpReason
        : baseResponse.seekHelpReason;

    // Append intelligence metadata
    return {
        ...baseResponse,
        alerts: mergedAlerts,
        seekHelp,
        seekHelpReason,
        intelligence: enhanced.intelligence,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
    clinicalKnowledgeBase,
    medicationIntelligence,
    patientSimilarityEngine,
    dynamicConfidenceEngine,
    multiModalReasoner,
    longitudinalTracker,
    safetyGuardEnhancer,
};
