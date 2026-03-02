import { Condition, DiagnosisResult, UserSymptomData, ClarificationQuestion, ReasoningTraceEntry } from "./types";
import { ENGINE_CONFIG, getBestQuestion, PRECOMPUTE_STATS } from "./precompute";
import { searchConditions } from "./retrieval";

// Advanced diagnosis modules
import { symptomCorrelationDetector, DetectedPattern } from "./advanced/SymptomCorrelations";
import { clinicalRules, RuleResult } from "./advanced/ClinicalDecisionRules";
import { uncertaintyQuantifier, UncertaintyEstimate, EvidenceQualityMetrics } from "./advanced/UncertaintyQuantification";

/**
 * Extracts a list of symptom keys from user input for correlation detection
 */
function extractSymptomList(symptoms: UserSymptomData): string[] {
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
function buildEvidenceMetrics(symptoms: UserSymptomData, patterns: DetectedPattern[]): EvidenceQualityMetrics {
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

// --- BAYESIAN INFERENCE HELPERS ---
const PREVALENCE_PRIORS: Record<string, number> = {
    'very_common': 0.1,    // e.g. Cold
    'common': 0.05,        // e.g. Flu
    'uncommon': 0.01,      // e.g. Dengue
    'rare': 0.001,         // e.g. Meningitis
    'very_rare': 0.0001
};

function getPrior(condition: Condition): number {
    return PREVALENCE_PRIORS[condition.prevalence || 'uncommon'];
}

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
 * Calculates a posterior probability score using a simplified Bayesian approach
 * Posterior proportional to: Prior * Likelihood(Symptoms | Condition)
 * Now includes reasoning trace for explainability and advanced pattern multipliers
 */
function calculateBayesianScore(
    condition: Condition,
    symptoms: UserSymptomData,
    detectedPatterns: DetectedPattern[] = []
): {
    score: number,
    matchedKeywords: string[],
    reasoningTrace: ReasoningTraceEntry[]
} {
    const matchedKeywords: string[] = [];
    const reasoningTrace: ReasoningTraceEntry[] = [];
    const criteria = condition.matchCriteria;

    // --- MANDATORY SYMPTOMS CHECK (Hard Constraint) ---
    if (condition.mandatorySymptoms && condition.mandatorySymptoms.length > 0) {
        const userText = `${symptoms.location.join(" ")} ${symptoms.painType || ""} ${symptoms.triggers || ""} ${symptoms.additionalNotes || ""}`.toLowerCase();
        const hasMandatory = condition.mandatorySymptoms.every(m => userText.includes(m.toLowerCase()));
        if (!hasMandatory) {
            return { score: 0, matchedKeywords: [], reasoningTrace: [{ factor: 'Missing mandatory symptom', impact: -100, type: 'symptom' }] };
        }
    }

    // 1. PRIOR PROBABILITY
    const prior = getPrior(condition);
    let currentLogProb = Math.log(prior);
    reasoningTrace.push({ factor: `Prior (${condition.prevalence || 'uncommon'})`, impact: currentLogProb, type: 'prior' });

    // Normalize input
    const locationText = symptoms.location.join(" ").toLowerCase();

    // Create "Safe Text" (Negation Handling)
    const fullText = `${locationText} ${symptoms.painType || ""} ${symptoms.triggers || ""} ${symptoms.frequency || ""} ${symptoms.additionalNotes || ""}`.toLowerCase();
    const negationRegex = /(?:no|not|without|doesn't have|dont have)\s+([a-z\s]+?)(?:[.,]|$)/gi;
    const negatedTerms: string[] = [];
    let match;
    while ((match = negationRegex.exec(fullText)) !== null) {
        if (match[1]) negatedTerms.push(match[1]);
    }
    let safeText = fullText;
    negatedTerms.forEach(term => { safeText = safeText.replace(term, ""); });

    // Synonym Mapping
    const synonymMap: Record<string, string[]> = {
        'nausea': ['vomit', 'puke', 'throw up', 'sick', 'queasy'],
        'fever': ['high temp', 'hot', 'chills'], // Removed 'burning' to avoid confusion with burning pain
        'pain': ['hurt', 'ache', 'sore', 'throbbing', 'agony'],
        'stomach': ['belly', 'tummy', 'gut', 'abdomen'],
        'cold': ['chilly', 'freezing', 'shivers'],
        'cough': ['coughing', 'hack'],
        'breathing': ['breath', 'gasping', 'air']
    };
    Object.entries(synonymMap).forEach(([key, synonyms]) => {
        if (synonyms.some(syn => safeText.includes(syn))) safeText += ` ${key}`;
    });

    // --- LIKELIHOOD UPDATES ---

    // 0. Location Constraint (Hard Filter + Base Evidence)
    if (criteria.locations && criteria.locations.length > 0) {
        const locationMatches = criteria.locations.some(loc => {
            const locLower = loc.toLowerCase();
            return locationText.includes(locLower) || symptoms.location.some(userLoc => locLower.includes(userLoc.toLowerCase()));
        });
        if (!locationMatches) return { score: 0, matchedKeywords: [], reasoningTrace: [] };

        currentLogProb += 2.0;
        reasoningTrace.push({ factor: `Location: ${symptoms.location.join(", ")}`, impact: 2.0, type: 'location' });
    }

    // 0.5. Pain Type / Nature Match (Strong Evidence)
    if (criteria.types && criteria.types.length > 0) {
        const typeMatches = criteria.types.filter(t => safeText.includes(t.toLowerCase()));
        if (typeMatches.length > 0) {
            currentLogProb += 2.0; // Strong boost for matching pain nature (e.g. 'burning' for reflux)
            typeMatches.forEach(m => matchedKeywords.push(`Type: ${m}`));
            reasoningTrace.push({ factor: `Type Match: ${typeMatches.join(", ")}`, impact: 2.0, type: 'symptom' });
        }
    }

    // 1. Symptom Matching & Weights
    const handledSymptoms = new Set<string>();

    // A. Weighted Symptoms (Sensitivity/Specificity Analysis)
    if (criteria.symptomWeights) {
        Object.entries(criteria.symptomWeights).forEach(([symptom, config]) => {
            const symLower = symptom.toLowerCase();
            const isPresent = safeText.includes(symLower);
            const isExcluded = symptoms.excludedSymptoms?.some(ex => ex.toLowerCase().includes(symLower)) || negatedTerms.some(n => n.includes(symLower));

            if (isPresent) {
                // Base boost = 3.0. Modifiers: specificity.
                let boost = 3.0;
                if (config.specificity && config.specificity > 0.5) {
                    // Specificity Boost: Log-odds-ish. 
                    // 0.9 -> +2.0 boost over base. 0.5 -> 0.
                    boost += (config.specificity - 0.5) * 4.0;
                }
                if (config.weight) boost *= config.weight;

                currentLogProb += boost;
                matchedKeywords.push(symptom);
                handledSymptoms.add(symptom);
                reasoningTrace.push({ factor: `Symptom (Weighted): ${symptom}`, impact: boost, type: 'symptom' });
            } else {
                // Missing... Should we penalize based on SENSITIVITY?
                // If Sensitivity = 0.9 (90% of sick have it), and user lacks it => Penalize.

                if (config.sensitivity && config.sensitivity > 0.7) {
                    if (isExcluded) {
                        // Explicitly absent -> LARGE PENALTY
                        // e.g. 0.9 sensitivity -> 0.4 * 6 = 2.4 penalty
                        const penalty = (config.sensitivity - 0.5) * 6.0;
                        currentLogProb -= penalty;
                        reasoningTrace.push({ factor: `Absent High-Sensitivity: ${symptom}`, impact: -penalty, type: 'absent' });
                    } else {
                        // Just missing from text -> Small penalty (maybe they forgot to mention)
                        const penalty = (config.sensitivity - 0.5) * 1.5;
                        currentLogProb -= penalty;
                        reasoningTrace.push({ factor: `Missing Expected: ${symptom}`, impact: -penalty, type: 'symptom' });
                    }
                }
            }
        });
    }

    // B. Standard Special Symptoms (Fallback/Flat Weight)
    if (criteria.specialSymptoms) {
        const matches = criteria.specialSymptoms.filter(s => {
            // Skip if already handled by weights
            if (handledSymptoms.has(s)) return false;

            const val = s.toLowerCase();
            if (safeText.includes(val)) return true;
            const words = val.split(' ').filter(w => w.length > 3);
            if (words.length === 0) return false;
            const genericWords = ['pain', 'severe', 'mild', 'high', 'low', 'loss', 'feeling', 'sensation', 'acute', 'chronic', 'chest', 'head', 'back', 'stomach', 'abdomen', 'leg', 'arm', 'skin', 'body', 'limb', 'area', 'part'];
            const significantWords = words.filter(w => !genericWords.includes(w));
            if (significantWords.length === 0) return false;
            return significantWords.some(w => safeText.includes(w));
        });

        if (matches.length > 0) {
            matches.forEach(m => {
                currentLogProb += 3.0; // Standard flat boost
                matchedKeywords.push(m);
                reasoningTrace.push({ factor: `Symptom: ${m}`, impact: 3.0, type: 'symptom' });
            });
            if (matches.length > 1) {
                currentLogProb += (matches.length * 0.5);
            }
        } else {
            // Only penalize if NO symptoms matched and NO weighted symptoms matched either
            if (handledSymptoms.size === 0) {
                currentLogProb -= 0.5;
            }
        }
    }

    // 2. ABSENT SYMPTOMS (Positive Evidence - "No fever" supports conditions where fever is absent)
    if (criteria.absentSymptoms && criteria.absentSymptoms.length > 0) {
        const excluded = symptoms.excludedSymptoms?.map(s => s.toLowerCase()) || [];
        const confirmedAbsent = criteria.absentSymptoms.filter(abs =>
            excluded.includes(abs.toLowerCase()) || negatedTerms.some(term => term.includes(abs.toLowerCase()))
        );

        if (confirmedAbsent.length > 0) {
            confirmedAbsent.forEach(abs => {
                currentLogProb += 2.5; // Strong positive evidence
                reasoningTrace.push({ factor: `Absent (confirms): ${abs}`, impact: 2.5, type: 'absent' });
            });
        }
    }

    // 3. Triggers (Contextual Evidence)
    if (criteria.triggers && symptoms.triggers) {
        const triggerMatch = criteria.triggers.find(t => symptoms.triggers!.toLowerCase().includes(t.toLowerCase()));
        if (triggerMatch) {
            currentLogProb += 2.0;
            matchedKeywords.push(`Trigger: ${triggerMatch}`);
            reasoningTrace.push({ factor: `Trigger: ${triggerMatch}`, impact: 2.0, type: 'trigger' });
        }
    }

    // 4. Negation (Evidence to the Contrary)
    if (symptoms.excludedSymptoms) {
        const excluded = symptoms.excludedSymptoms.map(s => s.toLowerCase());
        const contradicted = criteria.specialSymptoms?.filter(s => excluded.includes(s.toLowerCase()));
        if (contradicted && contradicted.length > 0) {
            contradicted.forEach(c => {
                currentLogProb -= 5.0;
                reasoningTrace.push({ factor: `Excluded: ${c}`, impact: -5.0, type: 'symptom' });
            });
        }
    }

    // 5. TEMPORAL REASONING (onset/progression)
    if (symptoms.duration) {
        const durationLower = symptoms.duration.toLowerCase();

        // Onset matching
        if (criteria.onset) {
            if (criteria.onset === 'sudden' && (durationLower.includes('sudden') || durationLower.includes('hour'))) {
                currentLogProb += 2.0;
                reasoningTrace.push({ factor: 'Onset: sudden (matches)', impact: 2.0, type: 'temporal' });
            } else if (criteria.onset === 'gradual' && (durationLower.includes('gradual') || durationLower.includes('month') || durationLower.includes('year'))) {
                currentLogProb += 2.0;
                reasoningTrace.push({ factor: 'Onset: gradual (matches)', impact: 2.0, type: 'temporal' });
            }
        }
    }

    if (symptoms.additionalNotes) {
        const notesLower = symptoms.additionalNotes.toLowerCase();
        if (criteria.progression) {
            if (criteria.progression === 'worsening' && (notesLower.includes('worse') || notesLower.includes('getting bad'))) {
                currentLogProb += 1.5;
                reasoningTrace.push({ factor: 'Progression: worsening', impact: 1.5, type: 'temporal' });
            } else if (criteria.progression === 'fluctuating' && (notesLower.includes('comes and goes') || notesLower.includes('episod'))) {
                currentLogProb += 1.5;
                reasoningTrace.push({ factor: 'Progression: fluctuating', impact: 1.5, type: 'temporal' });
            }
        }
    }

    // 6. Intuition / Name Match
    if (safeText.includes(condition.name.toLowerCase()) || safeText.includes(condition.id.toLowerCase())) {
        currentLogProb += 4.0;
        matchedKeywords.push(`User mentioned: ${condition.name}`);
        reasoningTrace.push({ factor: `User mentioned: ${condition.name}`, impact: 4.0, type: 'symptom' });
    }

    // 7. Ayurveda / Profile
    if (symptoms.userProfile && symptoms.userProfile.ayurvedicProfile) {
        const prakriti = symptoms.userProfile.ayurvedicProfile.prakriti.toLowerCase();
        if (prakriti.includes('vata') && condition.name.toLowerCase().includes('vata')) {
            currentLogProb += 1.0;
            matchedKeywords.push(`Prakriti Match`);
            reasoningTrace.push({ factor: 'Prakriti alignment', impact: 1.0, type: 'profile' });
        }
    }

    // 8. Advanced Symptom Correlation Patterns
    if (detectedPatterns.length > 0) {
        for (const pattern of detectedPatterns) {
            if (pattern.pattern.conditionId === condition.id) {
                // Apply probability boost from pattern
                // Log-odds boost: Multiplier -> Additive log term
                // 2.0x multiplier -> +0.7 log boost
                // 5.0x multiplier -> +1.6 log boost
                const boost = Math.log(pattern.pattern.multiplier);
                currentLogProb += boost;

                const factorName = `Pattern: ${pattern.pattern.name}`;
                matchedKeywords.push(factorName);
                reasoningTrace.push({
                    factor: factorName,
                    impact: boost,
                    type: 'pattern'
                });
            }
        }
    }

    // CONVERT LOG PROB TO LINEAR SCORE (0-100)
    const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
    const finalScore = sigmoid(currentLogProb) * 100;

    return { score: finalScore, matchedKeywords, reasoningTrace };
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

            const result: DiagnosisResult = {
                condition: {
                    id: 'ai_diagnosis',
                    name: aiDiag.conditionName || 'Homeopathic Assessment',
                    description: aiDiag.description || '',
                    severity: aiDiag.severity || 'moderate',
                    matchCriteria: { locations: [], types: [] },
                    remedies: aiDiag.remedies || [],
                    indianHomeRemedies: [],
                    exercises: [],
                    warnings: aiDiag.warnings || [],
                    seekHelp: aiDiag.seekHelp ? 'Please consult a doctor immediately.' : ''
                },
                confidence: aiDiag.confidence || 85,
                matchedKeywords: [],
                reasoningTrace: [{ factor: 'AI Assessment', impact: 100, type: 'prior' }]
            };

            if (aiDiag.reasoningTrace) {
                if (!result.reasoningTrace) result.reasoningTrace = [];
                result.reasoningTrace.push({ factor: aiDiag.reasoningTrace, impact: 100, type: 'pattern' });
            }

            return { results: [result], alerts };
        }
    } catch (e) {
        console.error("AI diagnosis failed:", e);
    }

    return { results: [], alerts };
}
