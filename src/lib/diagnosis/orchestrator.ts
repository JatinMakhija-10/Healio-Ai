/**
 * DiagnosisOrchestrator (v3 — Math-First Architecture)
 *
 * The Bayesian MCMC engine has TOTAL AUTHORITY over the diagnosis.
 * The LLM (Groq / Gemini) is a Natural Language Formatter ONLY.
 *
 *  ┌─────────────────────────────────────────────────────────────────────┐
 *  │  SYMPTOMS                                                           │
 *  │     │                                                               │
 *  │     ▼                                                               │
 *  │  [1] BAYESIAN ENGINE  ──── multi-chain MCMC with R̂ ─────────────┐ │
 *  │     │       100% authority over: conditionName + confidence score │ │
 *  │     ▼                                                             │ │
 *  │  [1b] CONVERGENCE GATE ── R̂ > 1.05 or ESS < 100: ─────────────┤ │
 *  │     │                       block output, ask info-gain question  │ │
 *  │     ▼                                                             │ │
 *  │  [2] CLINICAL RULES  ──── Wells / PERC / Ottawa / HEART ─────────┤ │
 *  │     │                                                             │ │
 *  │     ▼                                                             │ │
 *  │  [3] LLM FORMATTER  ────── given MCMC diagnosis, AI writes: ─────┘ │
 *  │     │                           · Compassionate description          │
 *  │     │                           · Symptom rationale                  │
 *  │     │                           · Formats pre-verified DB remedies    │
 *  │     │                           · Uses Boericke RAG for enrichment    │
 *  │     ▼                                                               │
 *  │  [4] UNCERTAINTY QUANTIFICATION  – confidence intervals             │
 *  │     │                                                               │
 *  │     ▼                                                               │
 *  │  FINAL RESULT  (Bayesian-authoritative, AI-articulated)            │
 *  └─────────────────────────────────────────────────────────────────────┘
 */

import {
    UserSymptomData,
    DiagnosisResult,
    ClarificationQuestion,
    ReasoningTraceEntry,
} from "./types";
import { searchConditions } from "./retrieval";
import {
    scanRedFlags,
    calculateBayesianScore,
    extractSymptomList,
    buildEvidenceMetrics,
} from "./engine";
import { symptomCorrelationDetector, DetectedPattern } from "./advanced/SymptomCorrelations";
import { clinicalRules, RuleResult } from "./advanced/ClinicalDecisionRules";
import { uncertaintyQuantifier, UncertaintyEstimate } from "./advanced/UncertaintyQuantification";
import { infoGainSelector } from "./advanced/InformationGainSelector";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BayesianCandidate {
    conditionId: string;
    conditionName: string;
    score: number;
    matchedKeywords: string[];
    reasoningTrace: ReasoningTraceEntry[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    remedies: any[];
    posteriorRedFlags: string[];
    mcmcDiagnostics?: {
        effectiveSampleSize: number;
        gewekePValue: number;
        acceptanceRate: number;
        converged: boolean;
        rHat: number;
        numChains: number;
        priorDominated: boolean;
        posteriorPredictiveP: number;
        credibleInterval: { lower: number; upper: number; width: number };
    };
}

export interface OrchestratedResult {
    /** Primary diagnosis result (AI + Bayesian calibrated) */
    results: DiagnosisResult[];
    /** Safety red-flag alerts (always evaluated first) */
    alerts: string[];
    /** Uncertainty quantification for calibrated confidence */
    uncertainty?: UncertaintyEstimate;
    /** Clinical rule results (DVT wells score, Ottawa criteria, etc.) */
    clinicalRuleResults?: RuleResult[];
    /** Metadata about the full pipeline run */
    orchestrationMeta: {
        bayesianTopK: Array<{
            conditionId: string;
            conditionName: string;
            priorScore: number;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            remedies: any[];
        }>;
        ragApplied: boolean;
        ragRemediesFound: string[];
        aiProvider: string;
        aiLatencyMs: number;
        bayesianCalibratedConfidence: number;
        fusionMethod: "ai_dominant" | "bayesian_dominant" | "ensemble";
        pipelineStages: string[];
        convergenceGated: boolean;
        posteriorRedFlags: string[];
        mcmcConvergence?: {
            effectiveSampleSize: number;
            gewekePValue: number;
            acceptanceRate: number;
            converged: boolean;
            rHat: number;
            numChains: number;
            priorDominated: boolean;
            posteriorPredictiveP: number;
            credibleInterval: { lower: number; upper: number; width: number };
        };
    };
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

/**
 * Top-K Bayesian candidates forwarded to the AI prompt
 */
const TOP_K = 5;

/**
 * Minimum Bayesian score to be considered (0-100 scale after sigmoid)
 */
const MIN_BAYESIAN_SCORE = 8;

/**
 * Runs the full convergence-gated diagnosis pipeline.
 * This is the recommended entry-point for client-side diagnosis.
 *
 * CP10: If MCMC fails to converge (R̂ > 1.05, ESS < 100),
 * the pipeline forces a follow-up question via InformationGainSelector
 * instead of proceeding to unreliable AI inference.
 */
export async function diagnose(
    symptoms: UserSymptomData
): Promise<{
    results: DiagnosisResult[];
    question?: ClarificationQuestion;
    alerts?: string[];
    uncertainty?: UncertaintyEstimate;
    clinicalRules?: RuleResult[];
    orchestrationMeta?: OrchestratedResult["orchestrationMeta"];
}> {
    const completedStages: string[] = [];
    let convergenceGated = false;
    const allPosteriorRedFlags: string[] = [];

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 0 — Safety Red-Flag Scan (always runs first)
    // ═══════════════════════════════════════════════════════════════════════
    const alerts = scanRedFlags(symptoms);
    completedStages.push("red_flags");

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 1 — Bayesian Candidate Scoring (Multi-Chain MCMC)
    // ═══════════════════════════════════════════════════════════════════════
    let bayesianCandidates: BayesianCandidate[] = [];
    let detectedPatterns: DetectedPattern[] = [];

    try {
        const conditions = await searchConditions(symptoms);
        const symptomList = extractSymptomList(symptoms);
        detectedPatterns = symptomCorrelationDetector.detectPatterns(symptomList);

        bayesianCandidates = conditions
            .map((condition) => {
                const { score, matchedKeywords, reasoningTrace, mcmcDiagnostics, posteriorRedFlags } = calculateBayesianScore(
                    condition,
                    symptoms,
                    detectedPatterns
                );

                // Aggregate posterior red flags
                if (posteriorRedFlags.length > 0) {
                    allPosteriorRedFlags.push(...posteriorRedFlags);
                }

                return {
                    conditionId: condition.id,
                    conditionName: condition.name,
                    score,
                    matchedKeywords,
                    reasoningTrace,
                    remedies: condition.remedies || [],
                    posteriorRedFlags,
                    mcmcDiagnostics,
                };
            })
            .filter((c) => c.score >= MIN_BAYESIAN_SCORE)
            .sort((a, b) => b.score - a.score);

        completedStages.push("bayesian_mcmc");
    } catch (e) {
        console.error("[Orchestrator] Bayesian stage error:", e);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 1b — CONVERGENCE GATE (CP10)
    //
    // If the top candidate's MCMC chain didn't converge (R̂ > threshold,
    // ESS too low, or CrI too wide), the statistical engine is unreliable.
    // Instead of feeding garbage to the AI, force a follow-up question.
    // ═══════════════════════════════════════════════════════════════════════
    const topCandidate = bayesianCandidates[0];
    const topMcmc = topCandidate?.mcmcDiagnostics;

    if (topMcmc && !topMcmc.converged && bayesianCandidates.length >= 2) {
        // MCMC did not converge — try to ask a disambiguating question
        try {
            const candidates = bayesianCandidates.slice(0, 5).map((c) => ({
                conditionName: c.conditionName,
                score: c.score,
            }));

            const knownSymptoms = [
                ...(symptoms.location || []),
                ...(symptoms.additionalNotes?.split(',').map((s: string) => s.trim()) || []),
                symptoms.painType,
            ].filter(Boolean) as string[];

            const excludedSymptoms = symptoms.excludedSymptoms || [];
            const detectedLanguage = symptoms.userProfile?.language || 'en';

            const bestQuestion = infoGainSelector.selectBestQuestion(
                candidates,
                knownSymptoms,
                excludedSymptoms,
                detectedLanguage
            );

            if (bestQuestion) {
                convergenceGated = true;
                completedStages.push("convergence_gate_triggered");

                console.warn(
                    `[Orchestrator] CONVERGENCE GATE: R̂=${topMcmc.rHat.toFixed(3)}, ` +
                    `ESS=${topMcmc.effectiveSampleSize.toFixed(0)} — forcing follow-up question`
                );

                // Merge posterior red flags into main alerts
                const mergedAlerts = [...alerts, ...new Set(allPosteriorRedFlags)];

                return {
                    results: [],
                    question: {
                        type: 'clarification',
                        question: bestQuestion.question,
                        options: bestQuestion.options,
                        symptomKey: bestQuestion.symptomKey,
                        relatedConditions: bayesianCandidates.slice(0, 3).map(c => c.conditionId),
                    },
                    alerts: mergedAlerts,
                    orchestrationMeta: {
                        bayesianTopK: bayesianCandidates.slice(0, 3).map((c) => ({
                            conditionId: c.conditionId,
                            conditionName: c.conditionName,
                            priorScore: Math.round(c.score),
                            remedies: c.remedies || [],
                        })),
                        ragApplied: false,
                        ragRemediesFound: [],
                        aiProvider: "none",
                        aiLatencyMs: 0,
                        bayesianCalibratedConfidence: 0,
                        fusionMethod: "bayesian_dominant",
                        pipelineStages: completedStages,
                        convergenceGated: true,
                        posteriorRedFlags: [...new Set(allPosteriorRedFlags)],
                        mcmcConvergence: topMcmc ? {
                            effectiveSampleSize: topMcmc.effectiveSampleSize,
                            gewekePValue: topMcmc.gewekePValue,
                            acceptanceRate: topMcmc.acceptanceRate,
                            converged: topMcmc.converged,
                            rHat: topMcmc.rHat,
                            numChains: topMcmc.numChains,
                            priorDominated: topMcmc.priorDominated,
                            posteriorPredictiveP: topMcmc.posteriorPredictiveP,
                            credibleInterval: topMcmc.credibleInterval,
                        } : undefined,
                    },
                };
            }
        } catch (e) {
            console.error("[Orchestrator] Convergence gate question generation failed:", e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 2 — Clinical Decision Rules
    // ═══════════════════════════════════════════════════════════════════════
    let clinicalRuleResults: RuleResult[] = [];
    try {
        const symptomList = extractSymptomList(symptoms);
        clinicalRuleResults = clinicalRules.applyRules(symptomList as string[] & { troponin_level?: number }, {});
        completedStages.push("clinical_rules");
    } catch (e) {
        console.error("[Orchestrator] Clinical rules stage error:", e);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 3 — AI Formatting (Bridge to Natural Language)
    // ═══════════════════════════════════════════════════════════════════════
    const primaryCandidate = bayesianCandidates[0];

    // BUG GUARD: If no conditions scored above MIN_BAYESIAN_SCORE, the
    // MCMC engine found no plausible diagnosis. Return early with alerts.
    if (!primaryCandidate) {
        console.warn("[Orchestrator] No Bayesian candidates above threshold — insufficient data.");
        return {
            results: [],
            alerts: [
                ...alerts,
                ...new Set(allPosteriorRedFlags),
                "Insufficient symptom data to determine a diagnosis. Please provide more detail about your symptoms."
            ],
            clinicalRules: clinicalRuleResults,
        };
    }

    let aiResult: DiagnosisResult | null = null;
    let provider = "unknown";
    let latencyMs = 0;
    let ragApplied = false;
    let ragRemediesFound: string[] = [];

    try {
        const response = await fetch("/api/diagnose", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                symptoms,
                userProfile: symptoms.userProfile,
                primaryDiagnosis: {
                    condition: primaryCandidate.conditionName,
                    bayesianScore: Math.round(primaryCandidate.score),
                    matchedKeywords: primaryCandidate.matchedKeywords.slice(0, 5),
                    structuredRemedies: (primaryCandidate.remedies || []).slice(0, 5).map((r: { name: string; description: string }) => ({
                        name: r.name,
                        description: r.description,
                    })),
                },
                clinicalRuleAlerts: clinicalRuleResults
                    .map((r) => `${r.rule}: ${r.interpretation}`),
                posteriorRedFlags: [...new Set(allPosteriorRedFlags)],
                detectedLanguage: symptoms.userProfile?.language || 'en'
            }),
        });

        if (!response.ok) throw new Error(`API status ${response.status}`);
        const data = await response.json();

        completedStages.push("ai_inference");
        provider = data.meta?.provider || "unknown";
        latencyMs = data.meta?.latencyMs || 0;
        ragApplied = data.meta?.ragApplied || false;
        ragRemediesFound = data.meta?.ragRemediesFound || [];

        if (data.diagnosis) {
            const aiDiag = data.diagnosis;
            aiResult = {
                condition: {
                    id: primaryCandidate.conditionId || "gated_diagnostic",
                    name: primaryCandidate.conditionName,
                    description: aiDiag.description || "",
                    severity: "moderate",
                    matchCriteria: { locations: [], types: [] },
                    remedies: aiDiag.remedies || [],
                    indianHomeRemedies: aiDiag.indianHomeRemedies || [],
                    exercises: [],
                    warnings: aiDiag.warnings || [],
                    seekHelp: aiDiag.seekHelp ? (aiDiag.seekHelpReason || "Please consult a doctor immediately.") : "",
                },
                confidence: Math.round(primaryCandidate.score), // Bayesian Score Authority
                matchedKeywords: primaryCandidate.matchedKeywords,
                reasoningTrace: [
                    { factor: "Bayesian MCMC Engine Diagnosis", impact: Math.round(primaryCandidate.score), type: "prior" },
                ],
            };

            if (aiDiag.rationale) {
                aiResult.reasoningTrace!.push({
                    factor: aiDiag.rationale,
                    impact: 100,
                    type: "pattern",
                });
            }
        }
    } catch (e) {
        console.error("[Orchestrator] AI formatting stage error:", e);
    }

    if (!aiResult) {
        return {
            results: [],
            alerts: [...alerts, ...new Set(allPosteriorRedFlags)],
            clinicalRules: clinicalRuleResults,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 4 — Uncertainty Quantification
    // ═══════════════════════════════════════════════════════════════════════
    let uncertainty: UncertaintyEstimate | undefined;
    try {
        const symptomList = extractSymptomList(symptoms);
        const evidenceMetrics = buildEvidenceMetrics(symptoms, detectedPatterns);
        uncertainty = uncertaintyQuantifier.quantify(
            aiResult.confidence,
            symptomList,
            evidenceMetrics
        );
        completedStages.push("uncertainty_quantification");
    } catch (e) {
        console.error("[Orchestrator] Uncertainty quantification error:", e);
    }

    // Always Bayesian dominant now
    const fusionMethod: OrchestratedResult["orchestrationMeta"]["fusionMethod"] = "bayesian_dominant";

    // Merge posterior red flags into main alerts
    const mergedAlerts = [...alerts, ...new Set(allPosteriorRedFlags)];

    const orchestrationMeta: OrchestratedResult["orchestrationMeta"] = {
        bayesianTopK: bayesianCandidates.slice(0, 3).map((c) => ({
            conditionId: c.conditionId,
            conditionName: c.conditionName,
            priorScore: Math.round(c.score),
            remedies: c.remedies || [],
        })),
        ragApplied,
        ragRemediesFound,
        aiProvider: provider,
        aiLatencyMs: latencyMs,
        bayesianCalibratedConfidence: aiResult.confidence,
        fusionMethod,
        pipelineStages: completedStages,
        convergenceGated,
        posteriorRedFlags: [...new Set(allPosteriorRedFlags)],
        mcmcConvergence: topMcmc ? {
            effectiveSampleSize: topMcmc.effectiveSampleSize,
            gewekePValue: topMcmc.gewekePValue,
            acceptanceRate: topMcmc.acceptanceRate,
            converged: topMcmc.converged,
            rHat: topMcmc.rHat,
            numChains: topMcmc.numChains,
            priorDominated: topMcmc.priorDominated,
            posteriorPredictiveP: topMcmc.posteriorPredictiveP,
            credibleInterval: topMcmc.credibleInterval,
        } : undefined,
    };

    return {
        results: [aiResult],
        alerts: mergedAlerts,
        uncertainty,
        clinicalRules: clinicalRuleResults,
        orchestrationMeta,
    };
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

// ─── Private Helpers ──────────────────────────────────────────────────────────
