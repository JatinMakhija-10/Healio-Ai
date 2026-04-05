import { Condition, DiagnosisResult, UserSymptomData, ClarificationQuestion, ReasoningTraceEntry } from "./types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ENGINE_CONFIG, getBestQuestion, PRECOMPUTE_STATS } from "./precompute";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { searchConditions } from "./retrieval";

// Advanced diagnosis modules
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { symptomCorrelationDetector, DetectedPattern } from "./advanced/SymptomCorrelations";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { clinicalRules, RuleResult } from "./advanced/ClinicalDecisionRules";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { uncertaintyQuantifier, UncertaintyEstimate, EvidenceQualityMetrics } from "./advanced/UncertaintyQuantification";
import { mcmcInfer, extractEvidence } from "./advanced/MCMCEngine";

/**
 * Extracts a list of symptom keys from user input for correlation detection
 */
export function extractSymptomList(symptoms: UserSymptomData): string[] {
    const list: string[] = [];

    // Add locations as potential symptoms
    list.push(...symptoms.location.map(l => l.toLowerCase().replace(' ', '_') + '_pain'));

    // Add pain type
    if (symptoms.painType) {
        list.push(symptoms.painType.toLowerCase());
    }

    // Parse additional notes for known symptoms
    if (symptoms.additionalNotes) {
        const notes = symptoms.additionalNotes.toLowerCase();
        const knownSymptoms = [
            'fever', 'nausea', 'vomiting', 'headache', 'cough', 'fatigue',
            'sweating', 'shortness_of_breath', 'dizziness', 'chills',
            'chest_pain', 'left_arm_pain', 'jaw_pain', 'back_pain',
            'face_drooping', 'arm_weakness', 'slurred_speech',
            'productive_cough', 'light_sensitivity', 'visual_aura',
            'stiff_neck', 'leg_swelling', 'calf_tenderness',
            // Clinical Rule Triggers
            'active_cancer', 'cancer', 'bedridden', 'paralysis', 'recent_surgery',
            'leg_swelling_entire', 'calf_asymmetry', 'pitting_edema',
            'coughing_blood', 'history_dvt', 'history_pe',
            'hypertension', 'diabetes', 'smoking', 'obesity',
            'midline_tenderness', 'altered_mental_status', 'intoxicated',
            'bone_tenderness', 'unable_to_bear_weight'
        ];

        for (const symptom of knownSymptoms) {
            const readable = symptom.replace(/_/g, ' ');
            if (notes.includes(readable) || notes.includes(symptom)) {
                list.push(symptom);
            }
        }
    }

    return [...new Set(list)]; // Deduplicate
}

/**
 * Builds evidence quality metrics for uncertainty quantification
 */
export function buildEvidenceMetrics(symptoms: UserSymptomData, patterns: DetectedPattern[]): EvidenceQualityMetrics {
    const symptomList = extractSymptomList(symptoms);

    return {
        symptomCount: symptomList.length,
        specificityOfSymptoms: patterns.length > 0
            ? Math.max(...patterns.map(p => p.pattern.specificity))
            : 0.5,
        hasLabResults: false, // Would be true if integrated with lab systems
        hasPhysicalExam: false,
        temporalClarity: symptoms.duration ? 'clear' : 'vague',
        symptomCorrelation: patterns.length > 0 ? patterns[0].confidence : 0
    };
}

/**
 * Calculates a confidence score for a condition based on symptoms
 */



/**
 * Scans for Critical Red Flags that require immediate medical attention
 * Enhanced with comprehensive emergency patterns including cardiac, neurological,
 * respiratory, anaphylaxis, trauma, and mental health crisis detection.
 */
export function scanRedFlags(symptoms: UserSymptomData): string[] {
    const alerts: string[] = [];
    const allText = `${symptoms.location.join(" ")} ${symptoms.painType || ""} ${symptoms.additionalNotes || ""} ${symptoms.triggers || ""}`.toLowerCase();

    // ================== CARDIAC EMERGENCIES ==================

    // 1a. Heart Attack - Classic presentation
    if (allText.includes("chest") && (allText.includes("sweat") || allText.includes("arm") || allText.includes("crushing") || allText.includes("pressure"))) {
        alerts.push("🚨 CARDIAC EMERGENCY: Potential heart attack. Call 911 immediately. Do not drive yourself.");
    }

    // 1b. Heart Attack - Atypical (especially in women)
    if ((allText.includes("jaw") || allText.includes("back")) && allText.includes("pain") && (allText.includes("nausea") || allText.includes("sweat") || allText.includes("short of breath"))) {
        alerts.push("🚨 CARDIAC EMERGENCY: Atypical heart attack symptoms. Call 911 immediately.");
    }

    // 1c. Aortic Dissection
    if (allText.includes("chest") && allText.includes("back") && (allText.includes("tearing") || allText.includes("ripping") || allText.includes("worst pain"))) {
        alerts.push("🚨 CARDIAC EMERGENCY: Possible aortic dissection. Call 911 immediately. This is life-threatening.");
    }

    // ================== NEUROLOGICAL EMERGENCIES ==================

    // 2a. Stroke - FAST symptoms
    if ((allText.includes("face") && (allText.includes("droop") || allText.includes("numb"))) ||
        (allText.includes("arm") && allText.includes("weak")) ||
        (allText.includes("speech") && (allText.includes("slur") || allText.includes("confused")))) {
        alerts.push("🚨 STROKE WARNING: Time is critical. Call 911 immediately. Note the time symptoms started.");
    }

    // 2b. Meningitis
    if (allText.includes("head") && allText.includes("neck") && (allText.includes("stiff") || allText.includes("severe"))) {
        alerts.push("🚨 MENINGITIS RISK: Potential meningitis. Seek emergency care immediately.");
    }

    // 2c. Subarachnoid Hemorrhage (thunderclap headache)
    if ((allText.includes("worst headache") || allText.includes("thunderclap") || allText.includes("sudden severe headache"))) {
        alerts.push("🚨 NEUROLOGICAL EMERGENCY: Sudden severe headache may indicate brain bleed. Call 911 immediately.");
    }

    // 2d. Seizure
    if (allText.includes("seizure") || allText.includes("convulsion") || allText.includes("fitting")) {
        alerts.push("⚠️ SEIZURE DETECTED: If this is a first-time seizure or lasts >5 minutes, call 911.");
    }

    // ================== RESPIRATORY EMERGENCIES ==================

    // 3a. Severe Respiratory Distress
    if (allText.includes("breath") && (allText.includes("can't") || allText.includes("unable") || allText.includes("fail") || allText.includes("blue") || allText.includes("gasping"))) {
        alerts.push("🚨 RESPIRATORY EMERGENCY: Severe breathing difficulty. Call 911 immediately.");
    }

    // 3b. Choking
    if (allText.includes("choking") || allText.includes("can't swallow") || allText.includes("throat closing")) {
        alerts.push("🚨 CHOKING EMERGENCY: If unable to speak or breathe, perform Heimlich maneuver. Call 911.");
    }

    // 3c. Severe Asthma Attack
    if (allText.includes("asthma") && (allText.includes("severe") || allText.includes("not responding") || allText.includes("blue lips"))) {
        alerts.push("🚨 SEVERE ASTHMA: Use rescue inhaler immediately. If no relief, call 911.");
    }

    // ================== ANAPHYLAXIS ==================

    // 4. Allergic Reaction / Anaphylaxis
    if ((allText.includes("allergic") || allText.includes("allergy")) &&
        (allText.includes("throat") || allText.includes("swelling") || allText.includes("can't breathe") || allText.includes("hives"))) {
        alerts.push("🚨 ANAPHYLAXIS RISK: Severe allergic reaction. Use EpiPen if available. Call 911 immediately.");
    }

    if (allText.includes("throat") && allText.includes("swelling")) {
        alerts.push("🚨 AIRWAY EMERGENCY: Throat swelling can be life-threatening. Call 911 immediately.");
    }

    // ================== TRAUMA EMERGENCIES ==================

    // 5a. Severe Fracture
    if (allText.includes("deformity") || allText.includes("deformed") || allText.includes("bone") && (allText.includes("poking") || allText.includes("protruding") || allText.includes("sticking out"))) {
        alerts.push("🚨 SEVERE FRACTURE: Compound fracture suspected. Do not move. Call 911 immediately.");
    }

    // 5b. Head Injury with Red Flags
    if (allText.includes("head") && allText.includes("injury") && (allText.includes("unconscious") || allText.includes("vomiting") || allText.includes("confused") || allText.includes("clear fluid"))) {
        alerts.push("🚨 HEAD INJURY: Signs of serious head trauma. Call 911. Do not move patient.");
    }

    // 5c. Severe Bleeding
    if ((allText.includes("bleeding") || allText.includes("blood")) && (allText.includes("won't stop") || allText.includes("severe") || allText.includes("spurting"))) {
        alerts.push("🚨 SEVERE BLEEDING: Apply firm pressure. Elevate if possible. Call 911 immediately.");
    }

    // 5d. Inability to bear weight
    if ((allText.includes("fall") || allText.includes("impact") || allText.includes("trauma")) &&
        (allText.includes("unable to bear weight") || allText.includes("can't walk") || allText.includes("cannot walk"))) {
        alerts.push("⚠️ TRAUMA: Inability to bear weight after injury suggests fracture or ligament tear. Seek immediate care.");
    }

    // ================== ABDOMINAL EMERGENCIES ==================

    // 6a. Appendicitis / Peritonitis
    if (allText.includes("abdomen") && allText.includes("rigid") && allText.includes("severe")) {
        alerts.push("🚨 ABDOMINAL EMERGENCY: Rigid abdomen suggests peritonitis. Call 911 immediately.");
    }

    // 6b. Ectopic Pregnancy
    if ((allText.includes("pregnant") || allText.includes("missed period")) && allText.includes("abdomen") && allText.includes("severe pain")) {
        alerts.push("🚨 ECTOPIC PREGNANCY RISK: Severe abdominal pain during pregnancy requires immediate care. Call 911.");
    }

    // ================== MENTAL HEALTH CRISIS ==================

    // 7. Suicide / Self-Harm
    if (/suicid|kill myself|end my life|want to die|self.?harm|cutting myself|hurt myself|no reason to live|better off dead/i.test(allText)) {
        alerts.push("🆘 CRISIS SUPPORT: Please reach out now:\n• National Suicide Prevention: 988\n• Crisis Text Line: Text HOME to 741741\n• You are not alone. These feelings can get better with support.");
    }

    // ================== OTHER CRITICAL CONDITIONS ==================

    // 8a. Diabetic Emergency
    if ((allText.includes("diabetic") || allText.includes("diabetes")) && (allText.includes("confused") || allText.includes("unconscious") || allText.includes("fruity breath"))) {
        alerts.push("🚨 DIABETIC EMERGENCY: Possible diabetic crisis. If unconscious, call 911. If conscious, check blood sugar.");
    }

    // 8b. Overdose
    if (allText.includes("overdose") || (allText.includes("pills") && allText.includes("too many")) || allText.includes("poisoning")) {
        alerts.push("🚨 OVERDOSE/POISONING: Call Poison Control (1-800-222-1222) or 911 immediately.");
    }

    return alerts;
}


/**
 * Calculates a posterior probability score using MCMC Bayesian inference (v2).
 *
 * Runs multi-chain Metropolis-Hastings sampling with:
 *   - Covariate-conditioned priors (age/sex/comorbidities)
 *   - R̂ (Gelman-Rubin) convergence diagnostic
 *   - Prior sensitivity analysis
 *   - Posterior predictive checks
 *   - Posterior-based red flag escalation
 *   - Missing data marginalisation
 *
 * Backward-compatible signature — returns score (0-100), matched keywords,
 * and reasoning trace, plus full MCMC diagnostics.
 */
export function calculateBayesianScore(
    condition: Condition,
    symptoms: UserSymptomData,
    detectedPatterns: DetectedPattern[] = []
): {
    score: number,
    matchedKeywords: string[],
    reasoningTrace: ReasoningTraceEntry[],
    posteriorRedFlags: string[],
    mcmcDiagnostics?: {
        posteriorMean: number,
        posteriorMedian: number,
        credibleInterval: { lower: number; upper: number; width: number },
        effectiveSampleSize: number,
        gewekePValue: number,
        rHat: number,
        numChains: number,
        converged: boolean,
        acceptanceRate: number,
        priorDominated: boolean,
        posteriorPredictiveP: number,
    }
} {
    const evidence = extractEvidence(symptoms);
    const result = mcmcInfer(condition, evidence, detectedPatterns);

    return {
        score: result.score,
        matchedKeywords: result.matchedKeywords,
        reasoningTrace: result.reasoningTrace,
        posteriorRedFlags: result.posteriorRedFlags,
        mcmcDiagnostics: {
            posteriorMean: result.mcmc.posteriorMean,
            posteriorMedian: result.mcmc.posteriorMedian,
            credibleInterval: result.mcmc.credibleInterval,
            effectiveSampleSize: result.mcmc.effectiveSampleSize,
            gewekePValue: result.mcmc.gewekePValue,
            rHat: result.mcmc.rHat,
            numChains: result.mcmc.numChains,
            converged: result.mcmc.converged,
            acceptanceRate: result.mcmc.acceptanceRate,
            priorDominated: result.mcmc.priorDominated,
            posteriorPredictiveP: result.mcmc.posteriorPredictiveP,
        }
    };
}

export async function diagnose(symptoms: UserSymptomData): Promise<{
    results: DiagnosisResult[],
    question?: ClarificationQuestion,
    alerts?: string[],
    uncertainty?: UncertaintyEstimate,
    clinicalRules?: RuleResult[]
}> {
    const alerts = scanRedFlags(symptoms);

    try {
        const response = await fetch('/api/diagnose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symptoms, userProfile: symptoms.userProfile })
        });

        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();

        if (data.diagnosis) {
            const aiDiag = data.diagnosis;

            // NOTE: In Math-First v3, conditionName and confidence are no longer
            // returned by the AI formatter. We use safe fallbacks here.
            const result: DiagnosisResult = {
                condition: {
                    id: 'ai_diagnosis',
                    name: aiDiag.conditionName || 'Homeopathic Assessment', // kept for UI compatibility
                    description: aiDiag.description || '',
                    severity: aiDiag.severity || 'moderate',
                    matchCriteria: { locations: [], types: [] },
                    remedies: aiDiag.remedies || [],
                    indianHomeRemedies: aiDiag.indianHomeRemedies || [],
                    exercises: [],
                    warnings: aiDiag.warnings || [],
                    seekHelp: aiDiag.seekHelp ? (aiDiag.seekHelpReason || 'Please consult a doctor immediately.') : ''
                },
                // Confidence is Math-driven — not from AI. Use 0 as safe default.
                confidence: 0,
                matchedKeywords: [],
                reasoningTrace: [{ factor: 'Bayesian MCMC Engine (formatter fallback)', impact: 0, type: 'prior' }]
            };

            if (aiDiag.rationale) {
                if (!result.reasoningTrace) result.reasoningTrace = [];
                result.reasoningTrace.push({ factor: aiDiag.rationale, impact: 100, type: 'pattern' });
            }

            return { results: [result], alerts };
        }
    } catch (e) {
        console.error("AI diagnosis failed:", e);
    }

    return { results: [], alerts };
}
