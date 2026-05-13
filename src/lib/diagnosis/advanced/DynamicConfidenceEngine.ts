/**
 * DynamicConfidenceEngine — v1
 *
 * Goals 6, 7, 10, 13:
 *   6.  Dynamic Confidence Scoring — multi-factor calibrated confidence
 *   7.  Clinical Risk Prioritization — severity-weighted reranking
 *  10.  Explainability Layer — enhanced reasoning traces
 *  13.  Intelligence Amplification Rules — meta-rules for refinement
 *
 * AUGMENTS existing UncertaintyQuantification — does NOT replace it.
 */

import type {
    DynamicConfidenceFactors,
    DynamicConfidenceResult,
    RiskPrioritizedCandidate,
    ExplainabilityReport,
    EnhancedReasoningTrace,
    AmplificationRule,
    IntelligenceAdjustment,
    IntelligenceContext,
    MedicationReasoningResult,
    SimilarityResult,
} from './intelligenceTypes';

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: SEVERITY / TIME-CRITICALITY DATABASE (Goal 7)
// ═══════════════════════════════════════════════════════════════════════════════

interface SeverityProfile {
    conditionPattern: RegExp;
    severityWeight: number;        // 1.0 = normal, 2.0 = double priority, etc.
    timeCriticality: 'minutes' | 'hours' | 'days' | 'weeks' | 'non_urgent';
    worstCaseIfMissed: string;
}

const SEVERITY_PROFILES: SeverityProfile[] = [
    // ── IMMEDIATE (minutes) ─────────────────────────────────────────────────
    { conditionPattern: /heart_attack|stemi|mi$|myocardial_infarction/i, severityWeight: 3.0, timeCriticality: 'minutes', worstCaseIfMissed: "Death within hours from cardiac arrest or cardiogenic shock" },
    { conditionPattern: /stroke|cerebrovascular/i, severityWeight: 3.0, timeCriticality: 'minutes', worstCaseIfMissed: "Permanent brain damage — tPA window is 4.5 hours" },
    { conditionPattern: /pulmonary_embolism|pe$/i, severityWeight: 2.8, timeCriticality: 'minutes', worstCaseIfMissed: "Massive PE → cardiac arrest; mortality 25-65% if untreated" },
    { conditionPattern: /aortic_dissection/i, severityWeight: 3.0, timeCriticality: 'minutes', worstCaseIfMissed: "Rupture → death. 1-2% mortality per hour if type A untreated" },
    { conditionPattern: /anaphylaxis/i, severityWeight: 3.0, timeCriticality: 'minutes', worstCaseIfMissed: "Airway obstruction and cardiovascular collapse within minutes" },
    { conditionPattern: /tension_pneumothorax/i, severityWeight: 3.0, timeCriticality: 'minutes', worstCaseIfMissed: "Cardiovascular collapse from mediastinal shift" },
    { conditionPattern: /status_epilepticus/i, severityWeight: 2.8, timeCriticality: 'minutes', worstCaseIfMissed: "Brain damage from prolonged seizure activity" },

    // ── URGENT (hours) ──────────────────────────────────────────────────────
    { conditionPattern: /sepsis|septicemia/i, severityWeight: 2.5, timeCriticality: 'hours', worstCaseIfMissed: "Septic shock and multi-organ failure — each hour of delayed antibiotics increases mortality 7.6%" },
    { conditionPattern: /meningitis/i, severityWeight: 2.5, timeCriticality: 'hours', worstCaseIfMissed: "Death or permanent neurological damage within 24 hours" },
    { conditionPattern: /appendicitis/i, severityWeight: 2.0, timeCriticality: 'hours', worstCaseIfMissed: "Perforation → peritonitis → sepsis" },
    { conditionPattern: /ectopic_pregnancy/i, severityWeight: 2.5, timeCriticality: 'hours', worstCaseIfMissed: "Rupture → hemorrhagic shock → maternal death" },
    { conditionPattern: /diabetic_ketoacidosis|dka/i, severityWeight: 2.3, timeCriticality: 'hours', worstCaseIfMissed: "Cerebral edema, coma, death without insulin + fluids" },
    { conditionPattern: /subarachnoid_hemorrhage|sah/i, severityWeight: 2.8, timeCriticality: 'hours', worstCaseIfMissed: "Rebleed risk 40% in first 24h — often fatal" },
    { conditionPattern: /bowel_obstruction/i, severityWeight: 2.2, timeCriticality: 'hours', worstCaseIfMissed: "Bowel ischemia, necrosis, perforation" },
    { conditionPattern: /necrotizing_fasciitis/i, severityWeight: 2.8, timeCriticality: 'hours', worstCaseIfMissed: "Spreads rapidly — mortality 25-35% even with treatment" },
    { conditionPattern: /cauda_equina/i, severityWeight: 2.5, timeCriticality: 'hours', worstCaseIfMissed: "Permanent paralysis and incontinence if not decompressed within 48h" },
    { conditionPattern: /testicular_torsion/i, severityWeight: 2.5, timeCriticality: 'hours', worstCaseIfMissed: "Testicular loss after 6 hours of torsion" },

    // ── SEMI-URGENT (days) ──────────────────────────────────────────────────
    { conditionPattern: /dvt|deep_vein/i, severityWeight: 1.8, timeCriticality: 'days', worstCaseIfMissed: "Propagation → pulmonary embolism" },
    { conditionPattern: /pneumonia/i, severityWeight: 1.5, timeCriticality: 'days', worstCaseIfMissed: "Respiratory failure, sepsis in elderly/immunocompromised" },
    { conditionPattern: /pyelonephritis/i, severityWeight: 1.5, timeCriticality: 'days', worstCaseIfMissed: "Urosepsis, renal abscess" },
    { conditionPattern: /temporal_arteritis/i, severityWeight: 2.0, timeCriticality: 'days', worstCaseIfMissed: "Permanent blindness without prompt steroids" },
    { conditionPattern: /acute_kidney_injury/i, severityWeight: 1.8, timeCriticality: 'days', worstCaseIfMissed: "Chronic kidney disease, need for dialysis" },

    // ── ROUTINE (weeks) ─────────────────────────────────────────────────────
    { conditionPattern: /diabetes|hypothyroid|hypertens/i, severityWeight: 1.2, timeCriticality: 'weeks', worstCaseIfMissed: "Long-term organ damage if chronic condition goes unmanaged" },
    { conditionPattern: /cancer|malignan|carcinoma/i, severityWeight: 1.8, timeCriticality: 'weeks', worstCaseIfMissed: "Stage progression, reduced treatment options" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: INTELLIGENCE AMPLIFICATION RULES (Goal 13)
// Meta-rules that fire based on diagnostic context patterns
// ═══════════════════════════════════════════════════════════════════════════════

const AMPLIFICATION_RULES: AmplificationRule[] = [
    {
        id: "rule_narrow_differential",
        name: "Narrow Differential Gap",
        description: "When top 2 conditions are within 10 points, force follow-up question",
        condition: (ctx) => {
            if (ctx.bayesianCandidates.length < 2) return false;
            const gap = ctx.bayesianCandidates[0].score - ctx.bayesianCandidates[1].score;
            return gap < 10 && ctx.bayesianCandidates[0].score > 20;
        },
        action: (ctx) => ({
            forceFollowUp: true,
            traceEntries: [{
                factor: `🧠 Intelligence Rule: Top 2 conditions are close (${ctx.bayesianCandidates[0].conditionName}: ${ctx.bayesianCandidates[0].score.toFixed(0)} vs ${ctx.bayesianCandidates[1].conditionName}: ${ctx.bayesianCandidates[1].score.toFixed(0)}) — asking discriminating question`,
                impact: 0,
                type: 'pattern' as const,
                direction: 'neutral' as const,
            }],
        }),
    },
    {
        id: "rule_low_confidence_high_severity",
        name: "Low Confidence + High Severity",
        description: "When confidence is low but a severe condition is possible, escalate",
        condition: (ctx) => {
            const topScore = ctx.bayesianCandidates[0]?.score || 0;
            return topScore < 50 && ctx.bayesianCandidates.some(c => {
                return SEVERITY_PROFILES.some(sp =>
                    sp.conditionPattern.test(c.conditionId) && sp.severityWeight >= 2.0 && c.score > 10
                );
            });
        },
        action: (ctx) => {
            const severeConditions = ctx.bayesianCandidates.filter(c =>
                SEVERITY_PROFILES.some(sp =>
                    sp.conditionPattern.test(c.conditionId) && sp.severityWeight >= 2.0 && c.score > 10
                )
            );
            return {
                additionalAlerts: severeConditions.map(c =>
                    `⚠️ Low confidence but ${c.conditionName} (score: ${c.score.toFixed(0)}) cannot be ruled out — seek professional evaluation`
                ),
                traceEntries: [{
                    factor: `🧠 Intelligence Rule: Low confidence but severe condition(s) in differential — cannot safely rule out`,
                    impact: 0,
                    type: 'pattern' as const,
                    direction: 'neutral' as const,
                }],
            };
        },
    },
    {
        id: "rule_conflicting_patterns",
        name: "Conflicting Pattern Detection",
        description: "When detected symptom patterns point to different conditions",
        condition: (ctx) => {
            if (ctx.detectedPatterns.length < 2) return false;
            const conditionIds = new Set(ctx.detectedPatterns.map(p => p.pattern.conditionId));
            return conditionIds.size >= 2;
        },
        action: (ctx) => ({
            forceFollowUp: true,
            additionalAlerts: [
                `ℹ️ Multiple symptom patterns detected pointing to different conditions — additional questions needed for differentiation`,
            ],
            traceEntries: [{
                factor: `🧠 Intelligence Rule: Conflicting symptom patterns detected across ${new Set(ctx.detectedPatterns.map(p => p.pattern.conditionId)).size} conditions`,
                impact: 0,
                type: 'pattern' as const,
                direction: 'neutral' as const,
            }],
        }),
    },
    {
        id: "rule_age_severity_mismatch",
        name: "Age-Severity Mismatch",
        description: "Serious condition in young patient or benign diagnosis in elderly with risk factors",
        condition: (ctx) => {
            const age = ctx.symptoms.userProfile?.age ? parseInt(ctx.symptoms.userProfile.age) : null;
            if (!age) return false;

            // Young patient with serious condition → might be atypical
            if (age < 30 && ctx.bayesianCandidates.some(c =>
                SEVERITY_PROFILES.some(sp =>
                    sp.conditionPattern.test(c.conditionId) && sp.severityWeight >= 2.0 && c.score > 15
                )
            )) return true;

            // Elderly patient with benign top diagnosis but risk factors → might be masking
            if (age >= 65 && ctx.bayesianCandidates[0]?.score > 50) {
                const topSeverity = SEVERITY_PROFILES.find(sp =>
                    sp.conditionPattern.test(ctx.bayesianCandidates[0].conditionId)
                );
                if (!topSeverity || topSeverity.severityWeight < 1.5) {
                    // Check if any severe condition is in the differential
                    return ctx.bayesianCandidates.slice(1).some(c =>
                        SEVERITY_PROFILES.some(sp =>
                            sp.conditionPattern.test(c.conditionId) && sp.severityWeight >= 2.0 && c.score > 10
                        )
                    );
                }
            }

            return false;
        },
        action: () => ({
            additionalAlerts: [
                `⚠️ Age-severity analysis suggests additional workup may be needed — atypical presentations are more common at age extremes`,
            ],
        }),
    },
    {
        id: "rule_medication_confounding",
        name: "Medication Confounding Alert",
        description: "When medications may be confounding the symptom picture",
        condition: (ctx) => {
            const meds = ctx.symptoms.userProfile?.medications;
            if (!meds) return false;
            const medCount = Array.isArray(meds) ? meds.length : meds.split(/[,;]/).length;
            return medCount >= 3; // Polypharmacy threshold
        },
        action: () => ({
            traceEntries: [{
                factor: `🧠 Intelligence Rule: Polypharmacy detected (≥3 medications) — symptom picture may be confounded by drug side effects`,
                impact: -3,
                type: 'profile' as const,
                direction: 'neutral' as const,
            }],
        }),
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: DYNAMIC CONFIDENCE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class DynamicConfidenceEngine {

    // ── Goal 6: Dynamic Confidence Scoring ───────────────────────────────────

    computeDynamicConfidence(
        ctx: IntelligenceContext,
        medicationResult?: MedicationReasoningResult,
        similarityResult?: SimilarityResult,
    ): DynamicConfidenceResult {
        if (ctx.bayesianCandidates.length === 0) {
            return this.emptyConfidenceResult();
        }

        const top = ctx.bayesianCandidates[0];
        const factors = this.computeFactors(ctx, medicationResult, similarityResult);
        const adjustedScore = this.applyFactors(top.score, factors);
        const adjustedCI = this.computeAdjustedCI(adjustedScore, factors);
        const grade = this.gradeConfidence(adjustedScore, adjustedCI.width);
        const explanation = this.explainConfidence(factors, grade);

        return {
            adjustedScore,
            adjustedCI,
            grade,
            factorBreakdown: factors,
            explanation,
        };
    }

    private computeFactors(
        ctx: IntelligenceContext,
        medicationResult?: MedicationReasoningResult,
        similarityResult?: SimilarityResult,
    ): DynamicConfidenceFactors {
        const top = ctx.bayesianCandidates[0];

        // 1. Convergence quality
        const mcmc = top.mcmcDiagnostics;
        let convergenceQuality = 0.5;
        if (mcmc) {
            const rHatPenalty = mcmc.rHat > 1.05 ? (mcmc.rHat - 1.0) * 5 : 0;
            const essFactor = Math.min(mcmc.effectiveSampleSize / 200, 1);
            convergenceQuality = Math.max(0, Math.min(1, essFactor - rHatPenalty));
        }

        // 2. Evidence completeness
        const symptomCount = ctx.symptomList.length;
        const evidenceCompleteness = Math.min(symptomCount / 6, 1.0); // 6+ symptoms = complete

        // 3. Pattern strength
        const relevantPatterns = ctx.detectedPatterns.filter(
            p => p.pattern.conditionId === top.conditionId
        );
        const patternStrength = relevantPatterns.length > 0
            ? Math.max(...relevantPatterns.map(p => p.confidence))
            : 0;

        // 4. Differential separation
        const gap = ctx.bayesianCandidates.length >= 2
            ? (top.score - ctx.bayesianCandidates[1].score) / Math.max(top.score, 1)
            : 1.0;
        const differentialSeparation = Math.min(gap, 1.0);

        // 5. Clinical risk level
        const severity = SEVERITY_PROFILES.find(sp => sp.conditionPattern.test(top.conditionId));
        const clinicalRiskLevel = severity ? severity.severityWeight / 3.0 : 0.3;

        // 6. Medication confounding
        let medicationConfounding = 0;
        if (medicationResult) {
            const totalAF = medicationResult.potentialSideEffects.reduce(
                (sum, se) => sum + se.attributableFraction, 0
            );
            medicationConfounding = Math.min(totalAF, 1.0);
        }

        // 7. Case similarity support
        let similaritySupportScore = 0;
        if (similarityResult) {
            const matchingDiagnosis = similarityResult.aggregateDiagnosisSignal.find(
                d => d.conditionId === top.conditionId
            );
            similaritySupportScore = matchingDiagnosis?.frequency || 0;
        }

        return {
            convergenceQuality,
            evidenceCompleteness,
            patternStrength,
            differentialSeparation,
            clinicalRiskLevel,
            medicationConfounding,
            similaritySupportScore,
        };
    }

    private applyFactors(baseScore: number, factors: DynamicConfidenceFactors): number {
        let adjusted = baseScore;

        // Boost from convergence quality
        adjusted *= 0.8 + 0.2 * factors.convergenceQuality;

        // Boost from evidence completeness
        adjusted *= 0.85 + 0.15 * factors.evidenceCompleteness;

        // Boost from pattern strength
        adjusted *= 1.0 + 0.15 * factors.patternStrength;

        // Boost from differential separation
        adjusted *= 0.9 + 0.1 * factors.differentialSeparation;

        // Penalty from medication confounding
        adjusted *= 1.0 - 0.2 * factors.medicationConfounding;

        // Boost from case similarity
        adjusted *= 1.0 + 0.1 * factors.similaritySupportScore;

        return Math.max(0, Math.min(100, adjusted));
    }

    private computeAdjustedCI(
        score: number,
        factors: DynamicConfidenceFactors,
    ): { lower: number; upper: number; width: number } {
        // Base width depends on evidence quality
        const baseWidth = 20 - 10 * factors.evidenceCompleteness; // 10-20%

        // Widen for high-risk conditions
        const riskWidening = factors.clinicalRiskLevel * 5;

        // Widen for medication confounding
        const medWidening = factors.medicationConfounding * 8;

        // Narrow for pattern match
        const patternNarrowing = factors.patternStrength * 5;

        const totalWidth = Math.max(5, baseWidth + riskWidening + medWidening - patternNarrowing);
        const lower = Math.max(0, score - totalWidth / 2);
        const upper = Math.min(100, score + totalWidth / 2);

        return { lower, upper, width: upper - lower };
    }

    private gradeConfidence(
        score: number,
        ciWidth: number,
    ): DynamicConfidenceResult['grade'] {
        if (score >= 80 && ciWidth <= 12) return 'very_high';
        if (score >= 65 && ciWidth <= 18) return 'high';
        if (score >= 45 && ciWidth <= 25) return 'moderate';
        if (score >= 25) return 'low';
        return 'very_low';
    }

    private explainConfidence(
        factors: DynamicConfidenceFactors,
        grade: string,
    ): string {
        const parts: string[] = [];

        if (factors.convergenceQuality < 0.5) parts.push("statistical model has limited convergence");
        if (factors.evidenceCompleteness < 0.5) parts.push("few symptoms reported");
        if (factors.differentialSeparation < 0.3) parts.push("close differential — multiple conditions are likely");
        if (factors.medicationConfounding > 0.3) parts.push("medication side effects may confound symptom picture");
        if (factors.patternStrength > 0.7) parts.push("strong clinical pattern match supports this diagnosis");
        if (factors.similaritySupportScore > 0.5) parts.push("similar historical cases support this diagnosis");

        if (parts.length === 0) return `${grade} confidence based on available evidence.`;
        return `${grade} confidence — ${parts.join('; ')}.`;
    }

    private emptyConfidenceResult(): DynamicConfidenceResult {
        return {
            adjustedScore: 0,
            adjustedCI: { lower: 0, upper: 0, width: 0 },
            grade: 'very_low',
            factorBreakdown: {
                convergenceQuality: 0, evidenceCompleteness: 0, patternStrength: 0,
                differentialSeparation: 0, clinicalRiskLevel: 0, medicationConfounding: 0,
                similaritySupportScore: 0,
            },
            explanation: "Insufficient data for confidence assessment.",
        };
    }

    // ── Goal 7: Clinical Risk Prioritization ─────────────────────────────────

    riskPrioritize(ctx: IntelligenceContext): RiskPrioritizedCandidate[] {
        return ctx.bayesianCandidates.map(candidate => {
            const severity = SEVERITY_PROFILES.find(sp =>
                sp.conditionPattern.test(candidate.conditionId)
            );

            const severityWeight = severity?.severityWeight || 1.0;
            const timeCriticality = severity?.timeCriticality || 'non_urgent';
            const worstCase = severity?.worstCaseIfMissed || 'Delayed treatment may worsen symptoms';

            // Risk-adjusted score: original score × severity weight
            // But capped so severity alone can't dominate over strong Bayesian evidence
            const riskBoost = Math.min(severityWeight, 1.0 + (severityWeight - 1.0) * 0.5);
            const riskAdjustedScore = Math.min(100, candidate.score * riskBoost);

            return {
                conditionId: candidate.conditionId,
                conditionName: candidate.conditionName,
                originalScore: candidate.score,
                riskAdjustedScore,
                severityWeight,
                timeCriticality,
                worstCaseIfMissed: worstCase,
                riskReasoning: severityWeight > 1.0
                    ? `Risk-adjusted from ${candidate.score.toFixed(0)} → ${riskAdjustedScore.toFixed(0)} due to ${timeCriticality} time-criticality`
                    : "Standard risk level — no adjustment needed",
            };
        }).sort((a, b) => b.riskAdjustedScore - a.riskAdjustedScore);
    }

    // ── Goal 10: Explainability ──────────────────────────────────────────────

    generateExplainability(ctx: IntelligenceContext): ExplainabilityReport {
        const top = ctx.bayesianCandidates[0];
        if (!top) {
            return {
                topSupportingFactors: [],
                topContradictingFactors: [],
                pivotalQuestions: [],
                ruledOutExplanations: [],
                confidenceNarrative: "No diagnosis candidates available.",
            };
        }

        // Classify trace entries
        const supporting: EnhancedReasoningTrace[] = [];
        const contradicting: EnhancedReasoningTrace[] = [];

        for (const entry of top.reasoningTrace) {
            const enhanced: EnhancedReasoningTrace = {
                ...entry,
                direction: entry.impact > 0 ? 'supports' : entry.impact < 0 ? 'contradicts' : 'neutral',
                factorConfidence: Math.abs(entry.impact) / 5, // Normalize
            };

            if (entry.impact > 0) supporting.push(enhanced);
            else if (entry.impact < 0) contradicting.push(enhanced);
        }

        // Get ruled-out conditions (low-scoring candidates)
        const ruledOut = ctx.bayesianCandidates
            .filter(c => c.score < 15 && c.conditionId !== top.conditionId)
            .slice(0, 3)
            .map(c => ({
                conditionName: c.conditionName,
                reason: c.matchedKeywords.length === 0
                    ? "No matching symptom features"
                    : `Only ${c.matchedKeywords.length} feature(s) matched — insufficient for diagnosis`,
            }));

        // Pivotal questions from MCMC VOI (if available)
        const pivotalQuestions: string[] = [];
        if (ctx.bayesianCandidates.length >= 2) {
            const gap = top.score - ctx.bayesianCandidates[1].score;
            if (gap < 15) {
                pivotalQuestions.push(
                    `Differentiate between ${top.conditionName} and ${ctx.bayesianCandidates[1].conditionName}`
                );
            }
        }

        // Narrative
        const pct = top.score.toFixed(0);
        const confidenceNarrative =
            `The diagnosis of ${top.conditionName} (${pct}% confidence) is supported by ${supporting.length} factor(s) ` +
            `and has ${contradicting.length} contradicting factor(s). ` +
            (contradicting.length > 0
                ? `Key concerns: ${contradicting.slice(0, 2).map(c => c.factor).join('; ')}.`
                : 'No significant contradictions detected.');

        return {
            topSupportingFactors: supporting.sort((a, b) => b.impact - a.impact).slice(0, 5),
            topContradictingFactors: contradicting.sort((a, b) => a.impact - b.impact).slice(0, 3),
            pivotalQuestions,
            ruledOutExplanations: ruledOut,
            confidenceNarrative,
        };
    }

    // ── Goal 13: Intelligence Amplification ──────────────────────────────────

    applyAmplificationRules(ctx: IntelligenceContext): IntelligenceAdjustment {
        const mergedAdjustment: IntelligenceAdjustment = {
            scoreMultipliers: [],
            additionalAlerts: [],
            forceFollowUp: false,
            traceEntries: [],
        };

        for (const rule of AMPLIFICATION_RULES) {
            try {
                if (rule.condition(ctx)) {
                    const adjustment = rule.action(ctx);
                    if (adjustment.scoreMultipliers) mergedAdjustment.scoreMultipliers!.push(...adjustment.scoreMultipliers);
                    if (adjustment.additionalAlerts) mergedAdjustment.additionalAlerts!.push(...adjustment.additionalAlerts);
                    if (adjustment.forceFollowUp) mergedAdjustment.forceFollowUp = true;
                    if (adjustment.traceEntries) mergedAdjustment.traceEntries!.push(...adjustment.traceEntries);
                }
            } catch {
                // Safety: never let a meta-rule crash the pipeline
            }
        }

        return mergedAdjustment;
    }
}

export const dynamicConfidenceEngine = new DynamicConfidenceEngine();
