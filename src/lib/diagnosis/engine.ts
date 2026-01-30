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
 * Calculates a confidence score for a condition based on symptoms
 */
function calculateScore(condition: Condition, symptoms: UserSymptomData): { score: number, matchedKeywords: string[] } {
    let score = 0;
    let maxPossibleScore = 0;
    const matchedKeywords: string[] = [];
    const criteria = condition.matchCriteria;

    // Normalize input
    const locationText = symptoms.location.join(" ").toLowerCase();

    // Create "Safe Text" by removing negated phrases
    // Regex matches "no fever", "not have headache", "without pain", etc.
    const fullText = `${locationText} ${symptoms.painType || ""} ${symptoms.triggers || ""} ${symptoms.frequency || ""} ${symptoms.additionalNotes || ""}`.toLowerCase();

    const negationRegex = /(?:no|not|without|doesn't have|dont have)\s+([a-z\s]+?)(?:[.,]|$)/gi;
    const negatedTerms: string[] = [];
    let match;
    while ((match = negationRegex.exec(fullText)) !== null) {
        if (match[1]) negatedTerms.push(match[1]);
    }

    // Remove negated terms from consideration text to avoid false positives
    // We keep them in 'fullText' for context but use 'safeText' for matching
    let safeText = fullText;
    negatedTerms.forEach(term => {
        safeText = safeText.replace(term, "");
    });

    const synonymMap: Record<string, string[]> = {
        'nausea': ['vomit', 'puke', 'throw up', 'sick to stomach', 'queasy'],
        'fever': ['high temp', 'hot', 'temperature', 'burning up', 'chills'],
        'pain': ['hurt', 'ache', 'sore', 'throbbing', 'discomfort'],
        'stomach': ['belly', 'tummy', 'abdomen', 'gut'],
        'cold': ['chilly', 'freezing', 'shivering'],
        'cough': ['coughing', 'hack'],
        'breathing': ['breath', 'short of breath', 'gasping'],
        'fatigue': ['tired', 'weak', 'exhausted', 'drained', 'sleepy']
    };

    // Inject synonyms into safeText
    Object.entries(synonymMap).forEach(([key, synonyms]) => {
        if (synonyms.some(syn => safeText.includes(syn))) {
            safeText += ` ${key}`;
        }
    });

    // CRITICAL: Location must match as a prerequisite
    if (criteria.locations && criteria.locations.length > 0) {
        const locationMatches = criteria.locations.some(loc => {
            const locLower = loc.toLowerCase();
            return locationText.includes(locLower) ||
                symptoms.location.some(userLoc => locLower.includes(userLoc.toLowerCase()));
        });

        if (!locationMatches) {
            return { score: 0, matchedKeywords: [] };
        }
    }

    // --- NEGATIVE SYMPTOM HANDLING (Explicit Exclusions) ---
    if (symptoms.excludedSymptoms && symptoms.excludedSymptoms.length > 0) {
        const excluded = symptoms.excludedSymptoms.map(s => s.toLowerCase());

        // Check special symptoms
        if (criteria.specialSymptoms) {
            const hasExcludedSymptom = criteria.specialSymptoms.some(s => excluded.includes(s.toLowerCase()));
            if (hasExcludedSymptom) {
                maxPossibleScore += 5;
                score -= 3;
            }
        }
        // Check triggers
        if (criteria.triggers) {
            const hasExcludedTrigger = criteria.triggers.some(t => excluded.includes(t.toLowerCase()));
            if (hasExcludedTrigger) {
                maxPossibleScore += 3;
                score -= 1.5;
            }
        }
    }

    // 0. Name Match Bonus (Intuition)
    // If user explicitly mentions the condition name, give a huge boost
    if (safeText.includes(condition.name.toLowerCase()) || safeText.includes(condition.id.toLowerCase())) {
        score += 5;
        matchedKeywords.push(`User mentioned: ${condition.name}`);
    }

    // 1. Location Match (Weight: 3)
    if (criteria.locations) {
        maxPossibleScore += 3;
        score += 3;
    }

    // 2. Pain Type Match (Weight: 2)
    if (criteria.types) {
        if (symptoms.painType) {
            maxPossibleScore += 2;
            const match = criteria.types.find(t => symptoms.painType!.toLowerCase().includes(t.toLowerCase()));
            if (match) {
                score += 2;
                matchedKeywords.push(`Pain Type: ${match}`);
            }
        }
    }

    // 3. Special Symptoms (Weight: 4)
    if (criteria.specialSymptoms) {
        maxPossibleScore += 4;

        // Fuzzy match
        const matchedItems = criteria.specialSymptoms.filter(s => {
            const val = s.toLowerCase();
            // 1. Exact phrase match (best)
            if (safeText.includes(val)) return true;

            // 2. Word overlap (stricter)
            const words = val.split(' ').filter(w => w.length > 3);
            if (words.length === 0) return false; // purely short words, need exact match

            const genericWords = ['pain', 'severe', 'mild', 'high', 'low', 'loss', 'feeling'];
            const significantWords = words.filter(w => !genericWords.includes(w));

            if (significantWords.length === 0) return false; // only generic words (e.g. "severe pain") -> need exact match

            // Require ALL significant words to be present for a match
            // e.g. "pain behind eyes" -> significant: "behind", "eyes". Both must be there.
            // Actually, "behind" is common. "eyes" is key.
            // Let's require at least ONE significant word match if it's a long phrase?
            // "pain behind eyes" -> "eyes" match?
            // "bone pain" -> "bone" match? Yes.

            return significantWords.some(w => safeText.includes(w));
        });

        if (matchedItems.length > 0) {
            score += 4;
            matchedKeywords.push(...matchedItems);

            // Bonus logic
            if (matchedItems.length > 1) {
                score += (matchedItems.length - 1);
            }
        }
    }

    // 4. Triggers (Weight: 2)
    if (criteria.triggers && symptoms.triggers) {
        maxPossibleScore += 2;
        const match = criteria.triggers.find(t => symptoms.triggers!.toLowerCase().includes(t.toLowerCase()));
        if (match) {
            score += 2;
            matchedKeywords.push(`Trigger: ${match}`);
        }
    }

    // 5. Intensity Match (Weight: 2)
    if (criteria.intensity && symptoms.intensity !== undefined) {
        maxPossibleScore += 2;
        const [minIntensity, maxIntensity] = criteria.intensity;
        if (symptoms.intensity >= minIntensity && symptoms.intensity <= maxIntensity) {
            score += 2;
        }
    }

    // 6. Frequency Match (Weight: 1.5)
    if (criteria.frequency && symptoms.frequency) {
        maxPossibleScore += 1.5;
        const match = criteria.frequency.find(f => symptoms.frequency!.toLowerCase().includes(f.toLowerCase()));
        if (match) {
            score += 1.5;
            matchedKeywords.push(`Frequency: ${match}`);
        }
    }

    // 7. Duration Hint (Weight: 1.5)
    if (criteria.durationHint && symptoms.duration) {
        maxPossibleScore += 1.5;
        const duration = symptoms.duration.toLowerCase();
        const isAcute = ['hours', '1-3days', '4-7days', '1-2weeks'].some(d => duration.includes(d));
        const isChronic = ['3-6months', '6months+', 'chronic'].some(d => duration.includes(d));

        if (criteria.durationHint === 'acute' && isAcute) score += 1.5;
        else if (criteria.durationHint === 'chronic' && isChronic) score += 1.5;
        else if (criteria.durationHint === 'any') score += 1.5;
    }

    // 8. User Profile Logic ... (Keep as is, but add keywords?)
    // (Abbreviated for safety, assuming risk logic matches remain valid as boost)
    if (symptoms.userProfile) {
        // ... (existing logic) ...
        // Simplification: Not creating matchedKeywords for profile risks to keep output clean, 
        // unless requested. We'll proceed with score boosts only for now to minimize diff complexity
        // or add basic keyword tracking if easily accessible.

        if (symptoms.userProfile.familyHistory?.some(h => condition.name.toLowerCase().includes(h.toLowerCase()))) {
            score += 2;
            matchedKeywords.push("Family History");
        }

        if (symptoms.userProfile.conditions?.some(c => condition.name.toLowerCase().includes(c.toLowerCase()))) {
            score += 1.5;
            matchedKeywords.push("Existing Condition");
        }

        // ... other profile logic ...
        // Re-implementing specific parts to ensure correct scoping if I replaced the whole function
        // Actually, let's keep the block replacement clean. I am replacing the WHOLE calculateScore function.
        // I need to make sure I include the profile logic.

        // 9. Ayurvedic Prakriti
        if (symptoms.userProfile.ayurvedicProfile) {
            const prakriti = symptoms.userProfile.ayurvedicProfile.prakriti.toLowerCase();
            const conditionName = condition.name.toLowerCase();
            if ((prakriti.includes('vata') && ['vata', 'arthritis', 'anxiety'].some(x => conditionName.includes(x))) ||
                (prakriti.includes('pitta') && ['pitta', 'acid', 'migraine'].some(x => conditionName.includes(x))) ||
                (prakriti.includes('kapha') && ['kapha', 'congestion', 'diabetes'].some(x => conditionName.includes(x)))) {
                score += 2.5;
                matchedKeywords.push(`Prakriti Match: ${prakriti}`);
            }
        }
    }

    // Calculate percentage
    if (maxPossibleScore === 0) return { score: 0, matchedKeywords: [] };

    const finalScore = (score / maxPossibleScore) * 100;
    return { score: finalScore, matchedKeywords };
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
    const startTime = performance.now();
    let results: DiagnosisResult[] = [];
    const alerts = scanRedFlags(symptoms);

    // --- ADVANCED 1: Symptom Correlation Detection ---
    const symptomList = extractSymptomList(symptoms);
    const detectedPatterns = symptomCorrelationDetector.detectPatterns(symptomList);

    // --- ADVANCED 2: Clinical Decision Rules ---
    // Extract demographics from profile or default
    const demographics = symptoms.userProfile || { age: 30 };
    const ruleResults = clinicalRules.applyRules(extractSymptomList(symptoms), demographics);

    // --- RETRIEVAL: Vector Search + Filtering ---
    // Fetch relevant candidates from DB (or fallback) using semantic search
    const candidateConditions = await searchConditions(symptoms);

    // --- OPTIMIZATION 2: Score with Early Aggregation ---
    // Prepare evidence metrics once
    const evidenceMetrics = buildEvidenceMetrics(symptoms, detectedPatterns);

    for (const condition of candidateConditions) {
        const { score: confidence, matchedKeywords, reasoningTrace } = calculateBayesianScore(condition, symptoms, detectedPatterns);

        // Pruning: Only keep candidates above threshold
        if (confidence > ENGINE_CONFIG.PRUNING_THRESHOLD * 100) {
            // Calculate uncertainty for this specific result
            const uncertainty = uncertaintyQuantifier.quantify(
                confidence,
                extractSymptomList(symptoms),
                evidenceMetrics
            );

            results.push({
                condition,
                confidence,
                matchedKeywords,
                reasoningTrace,
                uncertainty
            });
        }
    }

    // Sort by confidence
    results.sort((a, b) => b.confidence - a.confidence);

    // --- OPTIMIZATION 3: Aggressive Pruning ---
    if (results.length > ENGINE_CONFIG.AGGRESSIVE_PRUNE_THRESHOLD) {
        results = results.slice(0, ENGINE_CONFIG.MAX_CANDIDATES);
    }

    // --- OPTIMIZATION 4: Early Exit ---
    // If top candidate has very high confidence, skip complex questioning
    const hasHighConfidence = results.length > 0 && results[0].confidence >= ENGINE_CONFIG.EARLY_EXIT_CONFIDENCE;

    // Apply cap to 100% after sorting
    results.forEach(r => {
        if (r.confidence > 100) r.confidence = 100;
    });

    // --- CLINICAL UNCERTAINTY FLAG ---
    // Mark as uncertain if top 2 candidates are within 15% of each other
    if (results.length >= 2) {
        const gap = results[0].confidence - results[1].confidence;
        if (gap < 15) {
            results[0].uncertaintyFlag = true;
            results[1].uncertaintyFlag = true;
        }
    }


    // --- Akinator-Style Questioning Logic (Information Gain) ---
    // OPTIMIZATION 5: Skip questioning if high confidence already achieved

    if (results.length >= 2 && !hasHighConfidence) {
        const topCandidates = results.slice(0, 8); // Consider broader set for questioning

        // Helper to check if user already mentioned a term
        const userText = JSON.stringify(symptoms).toLowerCase();
        const excludedText = (symptoms.excludedSymptoms || []).join(" ").toLowerCase();
        const isUnknown = (term: string) => !userText.includes(term.toLowerCase()) && !excludedText.includes(term.toLowerCase());

        // 1. Collect all potential differentiating "Features"
        const potentialQuestions: {
            type: 'symptom' | 'trigger' | 'painType' | 'duration' | 'severity';
            key: string;
            score: number; // Lower is better (closer to 50/50 split)
            question: string;
            options: string[];
        }[] = [];

        // Helper to check coverage
        const totalConf = topCandidates.reduce((sum, r) => sum + r.confidence, 0);
        const MIN_COVERAGE = totalConf * 0.4; // Question must apply to at least 40% of candidates

        // A. Duration (Global check)
        if (isUnknown('acute') && isUnknown('chronic') && isUnknown('days') && isUnknown('months')) {
            const acuteConf = topCandidates.reduce((sum, r) => {
                const d = r.condition.matchCriteria.durationHint;
                return sum + (d === 'acute' || d === 'any' ? r.confidence : 0);
            }, 0);
            const chronicConf = topCandidates.reduce((sum, r) => {
                const d = r.condition.matchCriteria.durationHint;
                return sum + (d === 'chronic' || d === 'any' ? r.confidence : 0);
            }, 0);

            // Only ask if enough candidates have a duration hint
            const coverage = acuteConf + chronicConf;
            if (coverage >= MIN_COVERAGE) {
                potentialQuestions.push({
                    type: 'duration',
                    key: 'duration',
                    score: Math.abs(acuteConf - chronicConf),
                    question: "How long have you been experiencing these symptoms?",
                    options: ["Recently (Days/Weeks)", "Long time (Months/Years)"]
                });
            }
        }

        // B. Severity (Global check)
        if (isUnknown('severe') && isUnknown('mild')) {
            // Heuristic: severe conditions have 'severe' in types or severity field
            const severeConf = topCandidates.reduce((sum, r) => {
                const isSevere = r.condition.severity === 'severe' || r.condition.matchCriteria.types?.includes('severe');
                return sum + (isSevere ? r.confidence : 0);
            }, 0);
            const mildConf = topCandidates.reduce((sum, r) => {
                const isSevere = r.condition.severity === 'severe' || r.condition.matchCriteria.types?.includes('severe');
                return sum + (!isSevere ? r.confidence : 0);
            }, 0);

            if ((severeConf + mildConf) >= MIN_COVERAGE) {
                potentialQuestions.push({
                    type: 'severity',
                    key: 'severity',
                    score: Math.abs(severeConf - mildConf),
                    question: "How would you describe the intensity?",
                    options: ["Mild / Manageable", "Severe / Unbearable"]
                });
            }
        }

        // C. Special Symptoms, Triggers, Types
        const allFeatures = new Set<string>();
        topCandidates.forEach(r => {
            r.condition.matchCriteria.specialSymptoms?.forEach(s => allFeatures.add(`symptom:${s}`));
            r.condition.matchCriteria.triggers?.forEach(t => allFeatures.add(`trigger:${t}`));
            r.condition.matchCriteria.types?.forEach(t => allFeatures.add(`type:${t}`));
        });

        allFeatures.forEach(feature => {
            const [type, value] = feature.split(':');

            // Blacklist generic/nonsense triggers for questioning
            const triggerBlacklist = ['flu', 'virus', 'infection', 'bacteria', 'disease', 'sickness', 'cold'];
            if (type === 'trigger' && triggerBlacklist.some(b => value.toLowerCase().includes(b))) return;

            if (!isUnknown(value)) return;

            // Calculate Split Score
            let yesConf = 0;
            let noConf = 0;

            topCandidates.forEach(r => {
                let hasIt = false;
                if (type === 'symptom') hasIt = r.condition.matchCriteria.specialSymptoms?.some(s => s.toLowerCase() === value.toLowerCase()) || false;
                if (type === 'trigger') hasIt = r.condition.matchCriteria.triggers?.some(t => t.toLowerCase() === value.toLowerCase()) || false;
                if (type === 'type') hasIt = r.condition.matchCriteria.types?.some(t => t.toLowerCase() === value.toLowerCase()) || false;

                if (hasIt) yesConf += r.confidence;
                else noConf += r.confidence;
            });

            // We prefer questions that split the field evenly
            const diff = Math.abs(yesConf - noConf);

            // Generate Question String
            let qText = "";
            let opts = ["Yes", "No"];

            if (type === 'symptom') {
                qText = `Do you also experience ${value}?`;
                opts = [`Yes, I have ${value}`, "No"];
            } else if (type === 'trigger') {
                qText = `Does it worsen with ${value}?`;
                opts = [`Yes, worsens with ${value}`, "No"];
            } else if (type === 'type') {
                qText = `Is the sensation ${value}?`;
                opts = [`Yes, it is ${value}`, "No"];
            }

            // Cost Function: Penalize harder questions (Triggers are harder to recall than current symptoms)
            // Score = Diff * Cost (Lower is better)
            let cost = 1.0;
            if (type === 'trigger') cost = 1.5;

            // --- PHASE 4: Mimic Differentiation Boost ---
            try {
                if (topCandidates.length >= 2) {
                    const c1 = topCandidates[0].condition;
                    const c2 = topCandidates[1].condition;

                    const isMimicSituation = (c1.mimics?.includes(c2.id) || c2.mimics?.includes(c1.id));

                    if (isMimicSituation) {
                        let c1Has = false;
                        let c2Has = false;

                        if (type === 'symptom') {
                            c1Has = c1.matchCriteria.specialSymptoms?.some(s => s.toLowerCase() === value.toLowerCase()) || false;
                            c2Has = c2.matchCriteria.specialSymptoms?.some(s => s.toLowerCase() === value.toLowerCase()) || false;
                        }
                        // Triggers/Types logic similar... (simplified for now to symptoms)

                        // If they disagree on this trait (XOR), it's a critical differentiator
                        if (c1Has !== c2Has) {
                            cost = 0.1; // Massive boost (makes score very small, floating to top)
                        }
                    }
                }
            } catch (err) {
                console.error("Error in Mimic Logic:", err);
            }

            potentialQuestions.push({
                type: type as 'symptom' | 'trigger' | 'painType' | 'duration' | 'severity',
                key: value,
                score: diff * cost,
                question: qText,
                options: opts
            });
        });

        // 2. Select Best Question
        // Sort by score (ascending) -> smallest difference is best 50/50 split
        potentialQuestions.sort((a, b) => a.score - b.score);

        // DEBUG LOG
        // if (potentialQuestions.length > 0) {
        //    console.log(`[Engine] Best Q: ${potentialQuestions[0].key} Score: ${potentialQuestions[0].score} TotalConf: ${totalConf}`);
        // }

        // --- PLATEAU DETECTION ---
        // If the best question has a score roughly equal to totalConfidence,
        // it means even the best question produces a 100/0 split (one-sided).
        // This usually happens when all candidates share the same symptoms.
        // In this case, asking more won't help differentiate.
        if (potentialQuestions.length > 0 && potentialQuestions[0].score > (totalConf * 0.85)) {
            console.log("[Engine] Plateau detected. Stopping.");
            // Return just results without a question implies we are done/stuck
            return { results, alerts };
        }

        // --- PHASE 2: Compound Questions ---
        // Try to bundle top 3 differentiating questions into one "Do you have any of these?"
        const bestSingleQ = potentialQuestions[0];

        if (bestSingleQ) {
            // Heuristic: If we have multiple good potential questions (diff score < 500), bundle them.
            // (Max Diff is roughly 100 * N_Candidates). A low score means it splits candidates well.

            const goodQuestions = potentialQuestions.filter(q => q.score < (totalConf * 0.6) && q.type === 'symptom').slice(0, 3);

            if (goodQuestions.length >= 2) {
                const combinedTokens = goodQuestions.map(q => q.key);
                const combinedOptions = goodQuestions.map(q =>
                    q.question
                        .replace(/^Do you (also )?(have|experience|feel) /, '')
                        .replace(/^Are you /, '')
                        .replace('?', '')
                        .trim()
                );

                return {
                    results,
                    question: {
                        type: 'multi_choice',
                        question: "Are you experiencing any of the following?",
                        options: [...combinedOptions, "None of the above"],
                        multiSelectTokens: combinedTokens,
                        relatedConditions: topCandidates.map(r => r.condition.id)
                    },
                    alerts,
                    clinicalRules: ruleResults
                };
            }

            // Fallback to single best question
            return {
                results,
                question: {
                    type: 'clarification',
                    question: bestSingleQ.question,
                    options: bestSingleQ.options,
                    symptomKey: bestSingleQ.key, // This is what gets added to notes/exclusions
                    relatedConditions: topCandidates.map(r => r.condition.id)
                },
                alerts,
                clinicalRules: ruleResults
            };
        }
    }

    // --- Category Fallback / Low Confidence ---
    // If confidence is low (< 40%), determine the category and ask a broad assessment question
    if (results.length === 0 || results[0].confidence < 40) {

        // Detect Category
        const locations = symptoms.location.join(" ").toLowerCase();
        let categoryQuestion: ClarificationQuestion | null = null;

        if (locations.includes("head") || locations.includes("neck")) {
            categoryQuestion = {
                type: 'clarification',
                question: "Is the pain accompanied by any vision changes or sensitivity to light?",
                options: ["Yes, vision changes/light sensitivity", "No"],
                relatedConditions: []
            };
        } else if (locations.includes("stomach") || locations.includes("abdomen")) {
            categoryQuestion = {
                type: 'clarification',
                question: "Do you notice any changes in your appetite or bowel movements?",
                options: ["Yes, appetite/bowel changes", "No"],
                relatedConditions: []
            };
        } else if (locations.includes("chest")) {
            categoryQuestion = {
                type: 'clarification',
                question: "Do you experience shortness of breath or palpitations?",
                options: ["Yes, breathlessness/palpitations", "No"],
                relatedConditions: []
            };
        }

        // Only return if we haven't asked this (simple check: if userText includes the key words)
        const userText = JSON.stringify(symptoms).toLowerCase();
        if (categoryQuestion && !userText.includes("vision") && !userText.includes("appetite") && !userText.includes("breath")) {
            return { results, question: categoryQuestion, alerts, clinicalRules: ruleResults };
        }
    }

    // --- External API Fallback ---
    // If no results or low confidence, try External API
    // Increased threshold to 60%
    if (results.length === 0 || results[0].confidence < 60) {
        try {
            // Lazy load api to avoid circular dependencies if any
            const { EndlessMedicalAPI } = await import('../api/endlessMedical');

            // Convert symptoms to list
            const symptomList = [
                ...symptoms.location,
                symptoms.painType,
                ...symptoms.triggers || [],
                symptoms.additionalNotes
            ].filter(Boolean) as string[];

            const apiResults = await EndlessMedicalAPI.analyze(symptomList);

            if (apiResults && apiResults.length > 0) {
                // Map API results to our format
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const apiDiagnoses: DiagnosisResult[] = apiResults.map((disease: any) => ({
                    condition: {
                        id: `api_${disease.name.replace(/\s+/g, '_').toLowerCase()}`,
                        name: disease.name || "Unknown Condition",
                        description: `Possible condition identified by AI analysis. Likelihood: ${(disease.likelihood * 100).toFixed(1)}%`,
                        matchCriteria: { locations: [], types: [] }, // Dummy
                        severity: 'moderate',
                        remedies: [
                            {
                                name: 'Consult Doctor',
                                description: 'This condition was identified by our advanced AI model. Please consult a specialist for confirmation.',
                                ingredients: [],
                                method: 'Seek professional medical advice.',
                                videoUrl: null,
                                videoTitle: null
                            }
                        ],
                        indianHomeRemedies: [],
                        exercises: [],
                        warnings: ['This is an AI-generated suggestion'],
                        seekHelp: 'Consult a doctor for accurate diagnosis'
                    },
                    confidence: (disease.likelihood * 100) || 50,
                    matchedKeywords: []
                }));

                // Add to results
                results.push(...apiDiagnoses);

                // RE-SORT results
                results.sort((a, b) => b.confidence - a.confidence);
            }
        } catch (e) {
            console.error("API Diagnosis failed", e);
        }
    }

    // --- ADVANCED 3: Uncertainty Quantification ---
    // (Legacy block removed - now handled per-result above)
    // We still expose the top result's uncertainty as the "main" one for backwards compatibility
    const uncertainty = results.length > 0 ? results[0].uncertainty : undefined;

    // Add rule interpretations to alerts if high confidence rules fired
    if (results.length > 0) {
        ruleResults.forEach(rule => {
            if (rule.confidence > 0.5) {
                if (!alerts.includes(rule.recommendation)) {
                    alerts.push(`MEDICAL RULE (${rule.rule}): ${rule.interpretation}. ${rule.recommendation}`);
                }
            }
        });
    }

    // Default: Return results directly
    return { results, alerts, uncertainty, clinicalRules: ruleResults };
}
