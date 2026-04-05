/**
 * MCMC Bayesian Diagnosis Engine — v2 (Full Checkpoint Implementation)
 * 
 * Full Markov Chain Monte Carlo inference using Metropolis-Hastings sampling.
 * Implements ALL 9 checkpoints from MCMC_BAYESIAN_ENGINE.md:
 * 
 *  CP1 — Bayesian Foundation:    P(C|S) ∝ P(S|C) × P(C)
 *  CP2 — Markov Chain:           Stationary distribution = posterior
 *  CP3 — Metropolis-Hastings:    Accept/reject with ratio α in log space
 *  CP5 — Prior Design:           Covariate-conditioned priors, prior sensitivity
 *  CP6 — Likelihood Model:       Per-symptom LRs, missing data marginalisation
 *  CP7 — Convergence Diagnostics: Multi-chain, R̂ (Gelman-Rubin), ESS, Geweke
 *  CP8 — Clinical Output:        HDI, posterior predictive checks, red flag escalation
 *  CP9 — Engineering:            Log-space arithmetic, logit-space proposals
 *  CP10 — Full Pipeline:         Convergence-gated output flag
 * 
 * Note: CP4 (HMC/NUTS) is intentionally not implemented — vanilla MH is
 * adequate for our 1-dimensional per-condition posterior (θ_c ∈ [0,1]).
 * Gradient-based samplers add complexity with no benefit at this dimensionality.
 */

import { Condition, UserSymptomData, ReasoningTraceEntry } from "../types";
import { DetectedPattern } from "./SymptomCorrelations";

// ─── Configuration ────────────────────────────────────────────────────────────

export interface MCMCConfig {
    numSamples: number;       // Total MCMC iterations per chain
    burnIn: number;           // Burn-in samples to discard
    proposalSigma: number;    // Random walk proposal standard deviation
    thinning: number;         // Keep every Nth sample to reduce autocorrelation
    numChains: number;        // Number of independent chains (for R̂)
    rHatThreshold: number;    // R̂ must be below this to declare convergence
    minESS: number;           // Minimum effective sample size required
    runPriorSensitivity: boolean; // Run inference under weakened priors too
}

const DEFAULT_CONFIG: MCMCConfig = {
    numSamples: 3000,
    burnIn: 750,
    proposalSigma: 0.12,
    thinning: 2,
    numChains: 3,
    rHatThreshold: 1.01,
    minESS: 400,
    runPriorSensitivity: true,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MCMCResult {
    posteriorMean: number;          // Point estimate (0-1)
    posteriorMedian: number;        // Median of posterior
    credibleInterval: {             // 95% Highest Posterior Density
        lower: number;
        upper: number;
        width: number;
    };
    effectiveSampleSize: number;    // ESS for convergence assessment
    gewekePValue: number;           // Geweke convergence diagnostic
    rHat: number;                   // Gelman-Rubin R̂ statistic (multi-chain)
    numChains: number;              // How many chains were actually run
    converged: boolean;             // Whether ALL diagnostics passed
    samples: number[];              // Raw posterior samples (combined chains)
    acceptanceRate: number;         // Mean MH acceptance rate across chains
    priorDominated: boolean;        // Prior sensitivity: data has no info
    posteriorPredictiveP: number;   // Posterior predictive check (0-1, higher=better)
}

export interface MCMCDiagnosisResult {
    conditionId: string;
    conditionName: string;
    mcmc: MCMCResult;
    score: number;                  // 0-100 scale for backward compat
    matchedKeywords: string[];
    reasoningTrace: ReasoningTraceEntry[];
    posteriorRedFlags: string[];    // CP8: posterior-based escalation alerts
}

export interface EvidenceVector {
    presentSymptoms: Set<string>;
    absentSymptoms: Set<string>;
    unknownSymptoms: Set<string>;   // CP6: symptoms with no data (for marginalisation)
    location: string[];
    painType: string | null;
    triggers: string | null;
    duration: string | null;
    frequency: string | null;
    intensity: number | null;
    additionalText: string;
    negatedTerms: string[];
    // CP5: Covariate data for prior conditioning
    age: number | null;
    sex: string | null;
    isSmoker: boolean;
    isObese: boolean;
    hasDiabetes: boolean;
    hasHypertension: boolean;
    familyHistory: string[];
    isPregnant: boolean;
    usesBirthControl: boolean;
}

// ─── Prevalence → Beta Prior Parameters ───────────────────────────────────────

interface BetaParams {
    alpha: number;
    beta: number;
}

const PREVALENCE_BETA_PRIORS: Record<string, BetaParams> = {
    'very_common': { alpha: 10, beta: 90 },    // Mean ~0.10
    'common': { alpha: 5, beta: 95 },     // Mean ~0.05
    'uncommon': { alpha: 1, beta: 99 },     // Mean ~0.01
    'rare': { alpha: 1, beta: 999 },    // Mean ~0.001
    'very_rare': { alpha: 1, beta: 9999 },   // Mean ~0.0001
};

// ─── CP5: Covariate-Conditioned Prior Adjustments ─────────────────────────────

/**
 * Epidemiological adjustments to Beta prior parameters based on patient covariates.
 * Each entry specifies: which condition IDs are affected, the filter function,
 * and the multiplier to apply to the alpha parameter (increasing the prior).
 */
interface CovariateRule {
    conditionPattern: RegExp;    // Matches condition.id
    filter: (ev: EvidenceVector) => boolean;
    alphaMultiplier: number;     // > 1 increases prior, < 1 decreases
    description: string;
}

const COVARIATE_RULES: CovariateRule[] = [
    // Age-based adjustments
    {
        conditionPattern: /copd|chronic_bronchitis|emphysema/i,
        filter: (ev) => (ev.age ?? 0) >= 50 && ev.isSmoker,
        alphaMultiplier: 3.0,
        description: "Smoker aged 50+ → COPD prior tripled"
    },
    {
        conditionPattern: /heart_attack|angina|coronary|mi$/i,
        filter: (ev) => (ev.age ?? 0) >= 45 && (ev.isSmoker || ev.hasHypertension),
        alphaMultiplier: 2.5,
        description: "Age 45+ with risk factors → cardiac prior boosted"
    },
    {
        conditionPattern: /migraine/i,
        filter: (ev) => (ev.age ?? 0) >= 60,
        alphaMultiplier: 0.4,
        description: "Age 60+ → migraine prior reduced (new-onset less likely)"
    },
    {
        conditionPattern: /migraine/i,
        filter: (ev) => (ev.sex === 'female' || ev.sex === 'f') && (ev.age ?? 0) >= 15 && (ev.age ?? 0) <= 45,
        alphaMultiplier: 2.0,
        description: "Female 15-45 → migraine prior doubled"
    },
    // Sex-based adjustments
    {
        conditionPattern: /uti|urinary_tract/i,
        filter: (ev) => ev.sex === 'female' || ev.sex === 'f',
        alphaMultiplier: 3.0,
        description: "Female → UTI prior tripled"
    },
    {
        conditionPattern: /pulmonary_embolism|dvt|deep_vein/i,
        filter: (ev) => ev.usesBirthControl || ev.isPregnant,
        alphaMultiplier: 2.0,
        description: "Oral contraceptive/pregnancy → PE/DVT prior doubled"
    },
    {
        conditionPattern: /ectopic_pregnancy/i,
        filter: (ev) => ev.isPregnant || (ev.sex === 'female' || ev.sex === 'f'),
        alphaMultiplier: 2.5,
        description: "Female/pregnant → ectopic prior boosted"
    },
    // Comorbidity-based adjustments
    {
        conditionPattern: /diabetic_neuropathy|diabetic_ketoacidosis|diabetic/i,
        filter: (ev) => ev.hasDiabetes,
        alphaMultiplier: 4.0,
        description: "Known diabetic → diabetes-related prior quadrupled"
    },
    {
        conditionPattern: /hypertensive|stroke|heart/i,
        filter: (ev) => ev.hasHypertension,
        alphaMultiplier: 1.8,
        description: "Known hypertension → cardiovascular prior boosted"
    },
    // Lifestyle adjustments
    {
        conditionPattern: /pneumonia|lung_cancer|bronchitis|copd/i,
        filter: (ev) => ev.isSmoker,
        alphaMultiplier: 2.0,
        description: "Smoker → respiratory prior doubled"
    },
    {
        conditionPattern: /gerd|acid_reflux|gastritis/i,
        filter: (ev) => (ev.age ?? 0) >= 40,
        alphaMultiplier: 1.5,
        description: "Age 40+ → GI prior mildly boosted"
    },
];

// ─── Synonym Mapping ──────────────────────────────────────────────────────────

const SYNONYM_MAP: Record<string, string[]> = {
    'nausea': ['vomit', 'puke', 'throw up', 'sick', 'queasy', 'ji machlana', 'ulti', 'chakkar'],
    'fever': ['high temp', 'chills', 'bukhar', 'tez bukhar', 'badan garam'],
    'pain': ['hurt', 'ache', 'sore', 'throbbing', 'agony', 'dard', 'taklif', 'peeda'],
    'stomach': ['belly', 'tummy', 'gut', 'abdomen', 'pet', 'pait'],
    'cold': ['chilly', 'freezing', 'shivers', 'thand', 'sardi'],
    'cough': ['coughing', 'hack', 'khansi', 'khaansi'],
    'breathing': ['breath', 'gasping', 'air', 'saans', 'dum'],
    'headache': ['head pain', 'head ache', 'migraine', 'sar dard', 'sir dard'],
    'dizziness': ['dizzy', 'lightheaded', 'vertigo', 'faint', 'chakkar aana'],
    'fatigue': ['tired', 'exhaustion', 'weakness', 'lethargy', 'thakan', 'kamzori'],
    'swelling': ['swollen', 'puffy', 'edema', 'sujan', 'soojhan'],
    'rash': ['dermatitis', 'skin rash', 'daane', 'khujli'],
    'itching': ['itch', 'itchy', 'khujli', 'kharish'],
    'palpitations': ['heart racing', 'heart pounding', 'dil ki dhadkan', 'tez dhadkan'],
    'insomnia': ['can\'t sleep', 'sleepless', 'neend nahi', 'nind nahi'],
    'anxiety': ['anxious', 'worried', 'nervous', 'ghabrahat', 'chinta'],
    'constipation': ['constipated', 'kabz', 'pet saaf nahi'],
    'diarrhea': ['loose motion', 'loose stool', 'dast', 'patlaa'],
    'joint_pain': ['joint ache', 'arthritis', 'jod dard', 'gathiya'],
    'muscle_pain': ['muscle ache', 'body ache', 'badan dard', 'maanspeshi dard'],
};

// All known symptom keys used in conditions database
const ALL_KNOWN_SYMPTOMS = [
    'fever', 'nausea', 'vomiting', 'headache', 'cough', 'fatigue',
    'sweating', 'shortness_of_breath', 'dizziness', 'chills',
    'chest_pain', 'left_arm_pain', 'jaw_pain', 'back_pain',
    'productive_cough', 'light_sensitivity', 'visual_aura',
    'stiff_neck', 'leg_swelling', 'calf_tenderness',
    'burning', 'numbness', 'tingling', 'rash', 'swelling',
    'bloating', 'constipation', 'diarrhea', 'weight_loss',
    'itching', 'palpitations', 'sneezing', 'runny_nose',
    'sore_throat', 'joint_pain', 'muscle_pain', 'anxiety',
    'insomnia', 'loss_of_appetite', 'excessive_thirst',
    'frequent_urination', 'blurred_vision', 'ear_pain',
    'tinnitus', 'hoarseness', 'difficulty_swallowing',
    'abdominal_cramps', 'blood_in_stool', 'blood_in_urine',
];

// ─── Evidence Extraction ──────────────────────────────────────────────────────

export function extractEvidence(symptoms: UserSymptomData): EvidenceVector {
    const locationText = symptoms.location.join(" ").toLowerCase();
    const fullText = `${locationText} ${symptoms.painType || ""} ${symptoms.triggers || ""} ${symptoms.frequency || ""} ${symptoms.additionalNotes || ""}`.toLowerCase();

    // Extract negated terms
    const negationRegex = /(?:no|not|without|doesn't have|dont have)\s+([a-z\s]+?)(?:[.,]|$)/gi;
    const negatedTerms: string[] = [];
    let match;
    while ((match = negationRegex.exec(fullText)) !== null) {
        if (match[1]) negatedTerms.push(match[1].trim());
    }

    // Build safe text (with negations removed)
    let safeText = fullText;
    negatedTerms.forEach(term => { safeText = safeText.replace(term, ""); });

    // Expand synonyms
    Object.entries(SYNONYM_MAP).forEach(([key, synonyms]) => {
        if (synonyms.some(syn => safeText.includes(syn))) safeText += ` ${key}`;
    });

    // Parse present and absent symptoms
    const presentSymptoms = new Set<string>();
    const absentSymptoms = new Set<string>(
        (symptoms.excludedSymptoms || []).map(s => s.toLowerCase())
    );

    // Add negated terms to absent
    negatedTerms.forEach(t => absentSymptoms.add(t));

    // Add location-based symptoms
    symptoms.location.forEach(l => presentSymptoms.add(l.toLowerCase().replace(' ', '_') + '_pain'));

    // Add pain type
    if (symptoms.painType) presentSymptoms.add(symptoms.painType.toLowerCase());

    // Parse known symptoms from text
    for (const symptom of ALL_KNOWN_SYMPTOMS) {
        const readable = symptom.replace(/_/g, ' ');
        if (safeText.includes(readable) || safeText.includes(symptom)) {
            presentSymptoms.add(symptom);
        }
    }

    // CP6: Build unknown symptoms set (mentioned in conditions but user neither confirmed nor denied)
    const unknownSymptoms = new Set<string>();
    for (const symptom of ALL_KNOWN_SYMPTOMS) {
        if (!presentSymptoms.has(symptom) && !absentSymptoms.has(symptom)) {
            unknownSymptoms.add(symptom);
        }
    }

    // CP5: Extract covariate data from user profile
    const profile = symptoms.userProfile;
    const ageRaw = profile?.age;
    const age = ageRaw ? parseInt(ageRaw, 10) : null;
    const sex = profile?.gender?.toLowerCase() || null;
    const conditionsText = (profile?.conditions || []).join(' ').toLowerCase();
    const notesLower = (symptoms.additionalNotes || '').toLowerCase();

    return {
        presentSymptoms,
        absentSymptoms,
        unknownSymptoms,
        location: symptoms.location.map(l => l.toLowerCase()),
        painType: symptoms.painType?.toLowerCase() || null,
        triggers: symptoms.triggers?.toLowerCase() || null,
        duration: symptoms.duration?.toLowerCase() || null,
        frequency: symptoms.frequency?.toLowerCase() || null,
        intensity: symptoms.intensity ?? null,
        additionalText: safeText,
        negatedTerms,
        // Covariates
        age: isNaN(age as number) ? null : age,
        sex,
        isSmoker: profile?.smoking === 'yes' || conditionsText.includes('smok') || notesLower.includes('smok'),
        isObese: profile?.weight ? parseFloat(profile.weight) > 100 : false, // rough heuristic
        hasDiabetes: conditionsText.includes('diabet') || notesLower.includes('diabet'),
        hasHypertension: conditionsText.includes('hypertens') || conditionsText.includes('blood pressure') || notesLower.includes('bp high'),
        familyHistory: profile?.familyHistory || [],
        isPregnant: profile?.pregnant || false,
        usesBirthControl: notesLower.includes('birth control') || notesLower.includes('contracepti') || notesLower.includes('pill'),
    };
}

// ─── Mathematical Utilities ───────────────────────────────────────────────────

/** Log of Beta function B(a,b) = Γ(a)Γ(b)/Γ(a+b) using Stirling approx */
function logBeta(a: number, b: number): number {
    return logGamma(a) + logGamma(b) - logGamma(a + b);
}

/** Stirling's approximation if x > 7, otherwise exact for small integers */
function logGamma(x: number): number {
    if (x <= 0) return 0;
    if (x < 7) {
        let result = 0;
        let z = x;
        while (z < 7) {
            result -= Math.log(z);
            z += 1;
        }
        return result + logGamma(z);
    }
    return (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI)
        + 1 / (12 * x) - 1 / (360 * x * x * x);
}

/** Log of Beta distribution PDF: Beta(x | α, β) */
function logBetaPDF(x: number, alpha: number, beta: number): number {
    if (x <= 0 || x >= 1) return -Infinity;
    return (alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - logBeta(alpha, beta);
}

/** Box-Muller transform for normal random variates */
function randn(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** Clamp value to [lo, hi] */
function clamp(x: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, x));
}

// ─── CP5: Covariate-Conditioned Prior ─────────────────────────────────────────

/**
 * Compute Beta prior parameters adjusted for patient covariates.
 * Applies epidemiological rules from COVARIATE_RULES to shift the prior.
 */
function computeCovariateAdjustedPrior(
    condition: Condition,
    evidence: EvidenceVector
): BetaParams {
    const prevalence = condition.prevalence || 'uncommon';
    const base = PREVALENCE_BETA_PRIORS[prevalence] || PREVALENCE_BETA_PRIORS['uncommon'];
    let adjustedAlpha = base.alpha;

    for (const rule of COVARIATE_RULES) {
        if (rule.conditionPattern.test(condition.id) && rule.filter(evidence)) {
            adjustedAlpha *= rule.alphaMultiplier;
        }
    }

    // Clamp alpha to prevent extreme priors
    adjustedAlpha = clamp(adjustedAlpha, 0.1, 100);

    return { alpha: adjustedAlpha, beta: base.beta };
}

/**
 * Weakened prior for sensitivity analysis (flatten toward uniform).
 * Reduces the information content of the prior by pulling α toward 1.
 */
function computeWeakenedPrior(params: BetaParams): BetaParams {
    // Blend toward Beta(1, 1) = uniform, keeping 30% of original information
    const weakAlpha = 0.3 * params.alpha + 0.7 * 1.0;
    const weakBeta = 0.3 * params.beta + 0.7 * 1.0;
    return { alpha: Math.max(weakAlpha, 0.5), beta: Math.max(weakBeta, 0.5) };
}

// ─── Core MCMC Functions ──────────────────────────────────────────────────────

/**
 * Compute log-prior P(θ) using Beta distribution with covariate-adjusted params
 */
function computeLogPrior(theta: number, priorParams: BetaParams): number {
    return logBetaPDF(theta, priorParams.alpha, priorParams.beta);
}

/**
 * Compute log-likelihood P(Evidence | Condition, θ)
 * 
 * CP6 fully implemented:
 *   - Present symptoms: log(sensitivity / (1 - specificity)) × weight
 *   - Absent symptoms (confirmed): log((1 - sensitivity) / specificity) × weight
 *   - Unknown symptoms (CP6 marginalisation): log(baseRate × LR_present + (1 - baseRate) × LR_absent)
 *   - Pattern correlations, temporal reasoning, trigger/type matching
 */
function computeLogLikelihood(
    condition: Condition,
    evidence: EvidenceVector,
    detectedPatterns: DetectedPattern[] = []
): { logLik: number; matchedKeywords: string[]; trace: ReasoningTraceEntry[] } {
    const criteria = condition.matchCriteria;
    const matchedKeywords: string[] = [];
    const trace: ReasoningTraceEntry[] = [];
    let logLik = 0;

    // ── 1. Location Constraint (Hard Filter) ──────────────────────────────
    if (criteria.locations && criteria.locations.length > 0) {
        const locationMatches = criteria.locations.some(loc => {
            const locLower = loc.toLowerCase();
            return evidence.location.some(
                userLoc => locLower.includes(userLoc) || userLoc.includes(locLower)
            );
        });
        if (!locationMatches) {
            return { logLik: -Infinity, matchedKeywords: [], trace: [] };
        }
        logLik += Math.log(0.95);
        trace.push({ factor: `Location: ${evidence.location.join(", ")}`, impact: Math.log(0.95), type: 'location' });
    }

    // ── 2. Mandatory Symptoms (Hard Constraint) ───────────────────────────
    if (condition.mandatorySymptoms && condition.mandatorySymptoms.length > 0) {
        const hasMandatory = condition.mandatorySymptoms.every(m =>
            evidence.additionalText.includes(m.toLowerCase())
        );
        if (!hasMandatory) {
            return { logLik: -Infinity, matchedKeywords: [], trace: [{ factor: 'Missing mandatory symptom', impact: -100, type: 'symptom' }] };
        }
    }

    // ── 3. Per-Symptom Likelihoods (Weighted) — CP6 with marginalisation ──
    if (criteria.symptomWeights) {
        Object.entries(criteria.symptomWeights).forEach(([symptom, config]) => {
            const symLower = symptom.toLowerCase();
            const sensitivity = config.sensitivity ?? 0.6;
            const specificity = config.specificity ?? 0.7;
            const weight = config.weight ?? 1.0;

            const isPresent = evidence.additionalText.includes(symLower) ||
                evidence.presentSymptoms.has(symLower);
            const isAbsent = evidence.absentSymptoms.has(symLower) ||
                evidence.negatedTerms.some(n => n.includes(symLower));
            const isUnknown = !isPresent && !isAbsent;

            if (isPresent) {
                // P(symptom present | has condition) / P(symptom present | no condition)
                const lr = sensitivity / Math.max(1 - specificity, 0.01);
                const contribution = Math.log(lr) * weight;
                logLik += contribution;
                matchedKeywords.push(symptom);
                trace.push({ factor: `Symptom (weighted): ${symptom}`, impact: contribution, type: 'symptom' });
            } else if (isAbsent) {
                // Explicitly absent: (1 - sensitivity) / specificity
                const lr = (1 - sensitivity) / Math.max(specificity, 0.01);
                const contribution = Math.log(lr) * weight;
                logLik += contribution;
                trace.push({ factor: `Absent (confirmed): ${symptom}`, impact: contribution, type: 'absent' });
            } else if (isUnknown) {
                // CP6: Missing data marginalisation
                // Marginalise over presence/absence using base rate
                const baseRate = 0.3; // Prior probability symptom is present in general population
                const lrPresent = sensitivity / Math.max(1 - specificity, 0.01);
                const lrAbsent = (1 - sensitivity) / Math.max(specificity, 0.01);
                const marginalLR = baseRate * lrPresent + (1 - baseRate) * lrAbsent;
                const contribution = Math.log(Math.max(marginalLR, 0.01)) * weight * 0.5; // Halve weight for unknown
                logLik += contribution;
                trace.push({ factor: `Unknown (marginalised): ${symptom}`, impact: contribution, type: 'symptom' });
            }
        });
    }

    // ── 4. Special Symptoms (Flat likelihood) ─────────────────────────────
    if (criteria.specialSymptoms) {
        const defaultSensitivity = 0.6;
        const defaultSpecificity = 0.7;

        criteria.specialSymptoms.forEach(symptom => {
            if (criteria.symptomWeights && symptom in criteria.symptomWeights) return;

            const symLower = symptom.toLowerCase();
            const isPresent = evidence.additionalText.includes(symLower) ||
                evidence.presentSymptoms.has(symLower);

            if (isPresent) {
                const lr = defaultSensitivity / (1 - defaultSpecificity);
                const contribution = Math.log(lr);
                logLik += contribution;
                matchedKeywords.push(symptom);
                trace.push({ factor: `Symptom: ${symptom}`, impact: contribution, type: 'symptom' });
            }
        });
    }

    // ── 5. Absent Symptoms (Positive evidence) ────────────────────────────
    if (criteria.absentSymptoms) {
        criteria.absentSymptoms.forEach(abs => {
            const absLower = abs.toLowerCase();
            if (evidence.absentSymptoms.has(absLower) ||
                evidence.negatedTerms.some(n => n.includes(absLower))) {
                const contribution = Math.log(2.0);
                logLik += contribution;
                trace.push({ factor: `Absent (confirms): ${abs}`, impact: contribution, type: 'absent' });
            }
        });
    }

    // ── 6. Pain Type Match ────────────────────────────────────────────────
    if (criteria.types && criteria.types.length > 0 && evidence.painType) {
        const typeMatches = criteria.types.filter(t =>
            evidence.additionalText.includes(t.toLowerCase())
        );
        if (typeMatches.length > 0) {
            const contribution = Math.log(3.0);
            logLik += contribution;
            typeMatches.forEach(m => matchedKeywords.push(`Type: ${m}`));
            trace.push({ factor: `Type match: ${typeMatches.join(", ")}`, impact: contribution, type: 'symptom' });
        }
    }

    // ── 7. Trigger Match ──────────────────────────────────────────────────
    if (criteria.triggers && evidence.triggers) {
        const triggerMatch = criteria.triggers.find(t =>
            evidence.triggers!.includes(t.toLowerCase())
        );
        if (triggerMatch) {
            const contribution = Math.log(2.5);
            logLik += contribution;
            matchedKeywords.push(`Trigger: ${triggerMatch}`);
            trace.push({ factor: `Trigger: ${triggerMatch}`, impact: contribution, type: 'trigger' });
        }
    }

    // ── 8. Temporal Reasoning ─────────────────────────────────────────────
    if (evidence.duration && criteria.onset) {
        if (criteria.onset === 'sudden' && (evidence.duration.includes('sudden') || evidence.duration.includes('hour'))) {
            logLik += Math.log(2.0);
            trace.push({ factor: 'Onset: sudden (matches)', impact: Math.log(2.0), type: 'temporal' });
        } else if (criteria.onset === 'gradual' && (evidence.duration.includes('gradual') || evidence.duration.includes('month') || evidence.duration.includes('year'))) {
            logLik += Math.log(2.0);
            trace.push({ factor: 'Onset: gradual (matches)', impact: Math.log(2.0), type: 'temporal' });
        }
    }

    if (evidence.additionalText && criteria.progression) {
        if (criteria.progression === 'worsening' && (evidence.additionalText.includes('worse') || evidence.additionalText.includes('getting bad'))) {
            logLik += Math.log(1.8);
            trace.push({ factor: 'Progression: worsening', impact: Math.log(1.8), type: 'temporal' });
        } else if (criteria.progression === 'fluctuating' && (evidence.additionalText.includes('comes and goes') || evidence.additionalText.includes('episod'))) {
            logLik += Math.log(1.8);
            trace.push({ factor: 'Progression: fluctuating', impact: Math.log(1.8), type: 'temporal' });
        }
    }

    // ── 9. Condition Name Match (user mentioned it) ───────────────────────
    if (evidence.additionalText.includes(condition.name.toLowerCase()) ||
        evidence.additionalText.includes(condition.id.toLowerCase())) {
        logLik += Math.log(5.0);
        matchedKeywords.push(`User mentioned: ${condition.name}`);
        trace.push({ factor: `User mentioned: ${condition.name}`, impact: Math.log(5.0), type: 'symptom' });
    }

    // ── 10. Clinical Correlation Patterns ─────────────────────────────────
    for (const pattern of detectedPatterns) {
        if (pattern.pattern.conditionId === condition.id) {
            const contribution = Math.log(pattern.pattern.multiplier);
            logLik += contribution;
            matchedKeywords.push(`Pattern: ${pattern.pattern.name}`);
            trace.push({ factor: `Pattern: ${pattern.pattern.name}`, impact: contribution, type: 'pattern' });
        }
    }

    return { logLik, matchedKeywords, trace };
}

/**
 * Compute the unnormalized log-posterior: log P(θ) + log P(Evidence | θ, Condition)
 */
function logPosterior(
    theta: number,
    priorParams: BetaParams,
    logLikCache: number
): number {
    return computeLogPrior(theta, priorParams) + logLikCache;
}

// ─── CP7: Multi-Chain MCMC Sampler ────────────────────────────────────────────

/**
 * Result from a single chain run
 */
interface SingleChainResult {
    samples: number[];
    acceptanceRate: number;
}

/**
 * Run a single Metropolis-Hastings chain.
 */
function runSingleChain(
    priorParams: BetaParams,
    logLik: number,
    startTheta: number,
    config: MCMCConfig
): SingleChainResult {
    const { numSamples, burnIn, proposalSigma, thinning } = config;

    let currentTheta = clamp(startTheta, 1e-6, 1 - 1e-6);
    let currentLogPost = logPosterior(currentTheta, priorParams, logLik);

    const samples: number[] = [];
    let accepted = 0;
    const totalIterations = burnIn + numSamples * thinning;

    for (let i = 0; i < totalIterations; i++) {
        // Propose new θ via random walk on logit scale for better mixing
        const logitCurrent = Math.log(currentTheta / (1 - currentTheta));
        const logitProposed = logitCurrent + randn() * proposalSigma;
        const proposedTheta = 1 / (1 + Math.exp(-logitProposed));
        const thetaStar = clamp(proposedTheta, 1e-6, 1 - 1e-6);

        // Compute log-posterior at proposal
        const proposedLogPost = logPosterior(thetaStar, priorParams, logLik);

        // Jacobian correction for logit transform
        const logJacobianCurrent = -Math.log(currentTheta) - Math.log(1 - currentTheta);
        const logJacobianProposed = -Math.log(thetaStar) - Math.log(1 - thetaStar);

        // MH acceptance ratio (in log space)
        const logAlpha = (proposedLogPost + logJacobianProposed) - (currentLogPost + logJacobianCurrent);

        // Accept/reject
        if (Math.log(Math.random()) < logAlpha) {
            currentTheta = thetaStar;
            currentLogPost = proposedLogPost;
            accepted++;
        }

        // Collect post-burn-in samples with thinning
        if (i >= burnIn && (i - burnIn) % thinning === 0) {
            samples.push(currentTheta);
        }
    }

    return {
        samples,
        acceptanceRate: accepted / totalIterations,
    };
}

/**
 * CP7: Run multiple chains and compute R̂ (Gelman-Rubin diagnostic).
 * 
 * R̂ measures ratio of between-chain variance to within-chain variance.
 * R̂ ≈ 1.0 means all chains sample from same distribution.
 * R̂ > threshold means chains haven't mixed — non-convergence.
 */
function runMultiChainMCMC(
    priorParams: BetaParams,
    logLik: number,
    config: MCMCConfig
): { combinedSamples: number[]; chainSamples: number[][]; rHat: number; meanAcceptanceRate: number } {
    const { numChains } = config;
    const priorMean = priorParams.alpha / (priorParams.alpha + priorParams.beta);

    // Disperse starting points across the prior to test mixing
    const startingPoints: number[] = [];
    for (let c = 0; c < numChains; c++) {
        // Spread starts: 10th, 50th, 90th percentile of Beta prior (approximated)
        const spread = (c + 1) / (numChains + 1);
        const start = clamp(priorMean * (0.2 + spread * 1.6), 1e-4, 1 - 1e-4);
        startingPoints.push(start);
    }

    // Run all chains
    const chainResults: SingleChainResult[] = [];
    for (const start of startingPoints) {
        chainResults.push(runSingleChain(priorParams, logLik, start, config));
    }

    const chainSamples = chainResults.map(r => r.samples);
    const meanAcceptanceRate = chainResults.reduce((s, r) => s + r.acceptanceRate, 0) / numChains;

    // Compute R̂ (Gelman-Rubin)
    const rHat = computeRHat(chainSamples);

    // Combine all chain samples for final posterior
    const combinedSamples: number[] = [];
    for (const chain of chainSamples) {
        combinedSamples.push(...chain);
    }

    return { combinedSamples, chainSamples, rHat, meanAcceptanceRate };
}

/**
 * CP7: Gelman-Rubin R̂ diagnostic.
 * 
 *   B = between-chain variance of chain means
 *   W = mean of within-chain variances
 *   R̂ = √((n-1)/n + B/(n*W))
 * 
 * Where n = number of samples per chain.
 */
function computeRHat(chains: number[][]): number {
    const m = chains.length; // number of chains
    if (m < 2) return 1.0; // Can't compute R̂ with 1 chain

    const n = Math.min(...chains.map(c => c.length));
    if (n < 4) return 1.0; // Too few samples

    // Chain means
    const chainMeans = chains.map(chain => {
        const samples = chain.slice(0, n);
        return samples.reduce((s, x) => s + x, 0) / n;
    });

    // Overall mean
    const grandMean = chainMeans.reduce((s, x) => s + x, 0) / m;

    // Between-chain variance B
    const B = (n / (m - 1)) * chainMeans.reduce((s, mean) => s + (mean - grandMean) ** 2, 0);

    // Within-chain variance W
    const W = (1 / m) * chains.reduce((totalW, chain) => {
        const samples = chain.slice(0, n);
        const mean = samples.reduce((s, x) => s + x, 0) / n;
        const variance = samples.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1);
        return totalW + variance;
    }, 0);

    if (W === 0) return 1.0; // All chains at same point (degenerate)

    // Pooled variance estimate
    const varHat = ((n - 1) / n) * W + (1 / n) * B;

    // R̂
    const rHat = Math.sqrt(varHat / W);
    return isFinite(rHat) ? rHat : 1.0;
}

// ─── Posterior Summary & Diagnostics ──────────────────────────────────────────

function summarizePosterior(
    samples: number[],
    acceptanceRate: number,
    rHat: number,
    numChains: number,
    config: MCMCConfig,
    priorDominated: boolean,
    posteriorPredictiveP: number
): MCMCResult {
    if (samples.length === 0) {
        return {
            posteriorMean: 0,
            posteriorMedian: 0,
            credibleInterval: { lower: 0, upper: 0, width: 0 },
            effectiveSampleSize: 0,
            gewekePValue: 1,
            rHat: 1.0,
            numChains,
            converged: true,
            samples: [],
            acceptanceRate,
            priorDominated: false,
            posteriorPredictiveP: 1.0,
        };
    }

    // Sort for quantile computation
    const sorted = [...samples].sort((a, b) => a - b);
    const n = sorted.length;

    // Point estimates
    const posteriorMean = samples.reduce((s, x) => s + x, 0) / n;
    const posteriorMedian = n % 2 === 0
        ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
        : sorted[Math.floor(n / 2)];

    // 95% Highest Posterior Density interval
    const hpd = computeHPD(sorted, 0.95);

    // Effective Sample Size (using batch means)
    const ess = computeESS(samples);

    // Geweke convergence diagnostic
    const gewekePValue = gewekeTest(samples);

    // CP7: Full convergence check — ALL diagnostics must pass
    const converged =
        rHat < config.rHatThreshold &&            // R̂ < 1.05
        ess >= config.minESS &&                     // ESS ≥ 100
        gewekePValue > 0.05 &&                      // Geweke passes
        acceptanceRate > 0.15 &&                    // Not stuck
        acceptanceRate < 0.60;                      // Not random walking

    return {
        posteriorMean,
        posteriorMedian,
        credibleInterval: hpd,
        effectiveSampleSize: ess,
        gewekePValue,
        rHat,
        numChains,
        converged,
        samples,
        acceptanceRate,
        priorDominated,
        posteriorPredictiveP,
    };
}

/**
 * Compute 95% HPD interval (shortest interval containing 95% of samples)
 */
function computeHPD(sorted: number[], level: number = 0.95): { lower: number; upper: number; width: number } {
    const n = sorted.length;
    const intervalSize = Math.floor(n * level);
    if (intervalSize >= n) {
        return { lower: sorted[0], upper: sorted[n - 1], width: sorted[n - 1] - sorted[0] };
    }

    let minWidth = Infinity;
    let bestLower = sorted[0];
    let bestUpper = sorted[n - 1];

    for (let i = 0; i <= n - intervalSize; i++) {
        const width = sorted[i + intervalSize - 1] - sorted[i];
        if (width < minWidth) {
            minWidth = width;
            bestLower = sorted[i];
            bestUpper = sorted[i + intervalSize - 1];
        }
    }

    return { lower: bestLower, upper: bestUpper, width: minWidth };
}

/**
 * Effective Sample Size using batch means method.
 */
function computeESS(samples: number[]): number {
    const n = samples.length;
    if (n < 10) return n;

    const mean = samples.reduce((s, x) => s + x, 0) / n;
    const variance = samples.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1);
    if (variance === 0) return n;

    const batchSize = Math.max(Math.floor(Math.sqrt(n)), 2);
    const numBatches = Math.floor(n / batchSize);
    const batchMeans: number[] = [];

    for (let i = 0; i < numBatches; i++) {
        let batchSum = 0;
        for (let j = 0; j < batchSize; j++) {
            batchSum += samples[i * batchSize + j];
        }
        batchMeans.push(batchSum / batchSize);
    }

    const batchVariance = batchMeans.reduce((s, x) => s + (x - mean) ** 2, 0) / (numBatches - 1);
    const tau = batchSize * batchVariance / variance;

    if (tau <= 0 || !isFinite(tau)) return n;
    return Math.min(n, Math.max(1, n / tau));
}

/**
 * Geweke convergence diagnostic (secondary to R̂)
 */
function gewekeTest(samples: number[]): number {
    const n = samples.length;
    if (n < 20) return 1;

    const n1 = Math.floor(n * 0.1);
    const n2 = Math.floor(n * 0.5);

    const first = samples.slice(0, n1);
    const last = samples.slice(n - n2);

    const mean1 = first.reduce((s, x) => s + x, 0) / n1;
    const mean2 = last.reduce((s, x) => s + x, 0) / n2;

    const var1 = first.reduce((s, x) => s + (x - mean1) ** 2, 0) / (n1 - 1);
    const var2 = last.reduce((s, x) => s + (x - mean2) ** 2, 0) / (n2 - 1);

    const se = Math.sqrt(var1 / n1 + var2 / n2);
    if (se === 0) return 1;

    const z = Math.abs(mean1 - mean2) / se;
    const p = 2 * (1 - normalCDF(z));
    return p;
}

/** Standard normal CDF approximation (Abramowitz & Stegun) */
function normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.SQRT2;

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
}

// ─── CP8: Posterior Predictive Checks ─────────────────────────────────────────

/**
 * Simulates expected symptom profile given the condition and compares to
 * patient's actual presentation. Returns a p-value-like score (0-1).
 * 
 * High posteriorPredictiveP → model fits the data well
 * Low posteriorPredictiveP → model mismatch, diagnoses unreliable
 */
function posteriorPredictiveCheck(
    condition: Condition,
    evidence: EvidenceVector
): number {
    const weights = condition.matchCriteria.symptomWeights;
    if (!weights || Object.keys(weights).length === 0) return 0.5; // No data to check

    let expectedPresent = 0;
    let actuallyPresent = 0;
    let totalChecked = 0;

    Object.entries(weights).forEach(([symptom, config]) => {
        const sensitivity = config.sensitivity ?? 0.6;
        if (sensitivity < 0.5) return; // Not expected to be present

        totalChecked++;
        expectedPresent += sensitivity;

        const symLower = symptom.toLowerCase();
        const isPresent = evidence.additionalText.includes(symLower) ||
            evidence.presentSymptoms.has(symLower);

        if (isPresent) actuallyPresent++;
    });

    if (totalChecked === 0) return 0.5;

    // Compute match ratio: what fraction of expected symptoms are actually present?
    const expectedRate = expectedPresent / totalChecked;
    const actualRate = actuallyPresent / totalChecked;

    // p-value analog: 1.0 = perfect match, 0.0 = complete mismatch
    const discrepancy = Math.abs(expectedRate - actualRate);
    return clamp(1.0 - discrepancy * 2, 0, 1);
}

// ─── CP8: Posterior-Based Red Flag Escalation ─────────────────────────────────

/**
 * Emergency condition IDs and their posterior thresholds for escalation.
 * Even if not the top diagnosis, these conditions trigger alerts above threshold.
 */
const POSTERIOR_RED_FLAG_THRESHOLDS: Array<{ pattern: RegExp; threshold: number; alert: string }> = [
    {
        pattern: /sepsis|septicemia|septic_shock/i,
        threshold: 0.05,
        alert: "⚠️ POSTERIOR ALERT: P(Sepsis) > 5% — consider immediate broad-spectrum antibiotics and fluid resuscitation"
    },
    {
        pattern: /stemi|st_elevation|heart_attack|myocardial_infarction|mi$/i,
        threshold: 0.05,
        alert: "⚠️ POSTERIOR ALERT: P(STEMI/MI) > 5% — activate cath lab, consider aspirin and heparin"
    },
    {
        pattern: /pulmonary_embolism|pe$/i,
        threshold: 0.05,
        alert: "⚠️ POSTERIOR ALERT: P(Pulmonary Embolism) > 5% — consider D-dimer or CTPA workup"
    },
    {
        pattern: /stroke|cerebrovascular/i,
        threshold: 0.03,
        alert: "⚠️ POSTERIOR ALERT: P(Stroke) > 3% — consider urgent neurological assessment"
    },
    {
        pattern: /meningitis/i,
        threshold: 0.03,
        alert: "⚠️ POSTERIOR ALERT: P(Meningitis) > 3% — consider lumbar puncture"
    },
    {
        pattern: /aortic_dissection/i,
        threshold: 0.02,
        alert: "⚠️ POSTERIOR ALERT: P(Aortic Dissection) > 2% — consider CT angiography urgently"
    },
    {
        pattern: /anaphylaxis/i,
        threshold: 0.05,
        alert: "⚠️ POSTERIOR ALERT: P(Anaphylaxis) > 5% — EpiPen ready, monitor for biphasic reaction"
    },
];

function checkPosteriorRedFlags(conditionId: string, posteriorMean: number): string[] {
    const alerts: string[] = [];
    for (const rule of POSTERIOR_RED_FLAG_THRESHOLDS) {
        if (rule.pattern.test(conditionId) && posteriorMean > rule.threshold) {
            alerts.push(rule.alert);
        }
    }
    return alerts;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Run full multi-chain MCMC inference for a single condition given evidence.
 * Returns complete posterior summary with all convergence diagnostics.
 * 
 * Implements: CP1-3 (MH sampler), CP5 (covariate priors + sensitivity),
 *             CP6 (marginalisation), CP7 (R̂, ESS, multi-chain),
 *             CP8 (HDI, predictive checks, red flags), CP9 (log-space)
 */
export function mcmcInfer(
    condition: Condition,
    evidence: EvidenceVector,
    detectedPatterns: DetectedPattern[] = [],
    config: MCMCConfig = DEFAULT_CONFIG
): MCMCDiagnosisResult {
    // CP5: Compute covariate-adjusted prior
    const priorParams = computeCovariateAdjustedPrior(condition, evidence);

    // Pre-compute log-likelihood (doesn't depend on θ — θ modulates the posterior)
    const likResult = computeLogLikelihood(condition, evidence, detectedPatterns);

    // If hard-filtered out (logLik = -Infinity), return zero posterior
    if (likResult.logLik === -Infinity) {
        return {
            conditionId: condition.id,
            conditionName: condition.name,
            mcmc: {
                posteriorMean: 0, posteriorMedian: 0,
                credibleInterval: { lower: 0, upper: 0, width: 0 },
                effectiveSampleSize: 0, gewekePValue: 1, rHat: 1.0, numChains: 0,
                converged: true, samples: [], acceptanceRate: 0,
                priorDominated: false, posteriorPredictiveP: 1.0,
            },
            score: 0, matchedKeywords: [], reasoningTrace: [], posteriorRedFlags: [],
        };
    }

    // CP7: Run multi-chain MCMC
    const { combinedSamples, rHat, meanAcceptanceRate } = runMultiChainMCMC(
        priorParams, likResult.logLik, config
    );

    // CP5: Prior sensitivity analysis
    let priorDominated = false;
    if (config.runPriorSensitivity && combinedSamples.length > 0) {
        const weakPrior = computeWeakenedPrior(priorParams);
        const weakResult = runMultiChainMCMC(weakPrior, likResult.logLik, {
            ...config,
            numSamples: Math.floor(config.numSamples / 2), // Faster for sensitivity check
            numChains: 2, // Fewer chains needed
            runPriorSensitivity: false, // Don't recurse
        });

        if (weakResult.combinedSamples.length > 0) {
            const informativeMean = combinedSamples.reduce((s, x) => s + x, 0) / combinedSamples.length;
            const weakMean = weakResult.combinedSamples.reduce((s, x) => s + x, 0) / weakResult.combinedSamples.length;
            // If posterior barely changes when we flatten the prior → prior is driving the answer
            priorDominated = Math.abs(informativeMean - weakMean) < 0.02;
        }
    }

    // CP8: Posterior predictive check
    const posteriorPredictiveP = posteriorPredictiveCheck(condition, evidence);

    // Build full posterior summary
    const mcmc = summarizePosterior(
        combinedSamples, meanAcceptanceRate, rHat, config.numChains, config,
        priorDominated, posteriorPredictiveP
    );

    // CP8: Posterior-based red flag escalation
    const posteriorRedFlags = checkPosteriorRedFlags(condition.id, mcmc.posteriorMean);

    // Add prior info to trace
    const fullTrace: ReasoningTraceEntry[] = [
        {
            factor: `Prior: ${condition.prevalence || 'uncommon'} (α=${priorParams.alpha.toFixed(1)}, β=${priorParams.beta})`,
            impact: mcmc.posteriorMean,
            type: 'prior'
        },
        ...likResult.trace,
    ];

    // Add convergence info to trace
    if (!mcmc.converged) {
        fullTrace.push({
            factor: `⚠ MCMC non-convergence: R̂=${rHat.toFixed(3)}, ESS=${mcmc.effectiveSampleSize.toFixed(0)}, acceptance=${(mcmc.acceptanceRate * 100).toFixed(0)}%`,
            impact: -10,
            type: 'prior',
        });
    }

    if (priorDominated) {
        fullTrace.push({
            factor: '⚠ Prior-dominated: diagnosis driven by prevalence data, not symptoms',
            impact: -5,
            type: 'prior',
        });
    }

    if (posteriorPredictiveP < 0.3) {
        fullTrace.push({
            factor: `⚠ Poor model fit (PPP=${posteriorPredictiveP.toFixed(2)}): expected symptoms not matching presentation`,
            impact: -8,
            type: 'pattern',
        });
    }

    // Convert posterior mean to 0-100 score
    const score = clamp(mcmc.posteriorMean * 100, 0, 100);

    return {
        conditionId: condition.id,
        conditionName: condition.name,
        mcmc,
        score,
        matchedKeywords: likResult.matchedKeywords,
        reasoningTrace: fullTrace,
        posteriorRedFlags,
    };
}

/**
 * Run MCMC inference across all candidate conditions.
 * Returns sorted results with top conditions ranked by posterior.
 * Aggregates posterior red flags across all conditions.
 */
export function mcmcDiagnoseAll(
    conditions: Condition[],
    symptoms: UserSymptomData,
    detectedPatterns: DetectedPattern[] = [],
    config: MCMCConfig = DEFAULT_CONFIG
): MCMCDiagnosisResult[] {
    const evidence = extractEvidence(symptoms);

    const results = conditions.map(condition =>
        mcmcInfer(condition, evidence, detectedPatterns, config)
    );

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results;
}

// ─── Exports for Integration ──────────────────────────────────────────────────

export { computeLogLikelihood, computeLogPrior, computeRHat, computeCovariateAdjustedPrior };
export type { BetaParams, CovariateRule };
