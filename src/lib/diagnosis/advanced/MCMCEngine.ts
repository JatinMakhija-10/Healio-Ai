/**
 * MCMC Bayesian Diagnosis Engine
 * 
 * Full Markov Chain Monte Carlo inference using Metropolis-Hastings sampling.
 * Replaces the simplified log-boost scoring with proper posterior distributions
 * over the condition probability space.
 * 
 * Mathematical Model:
 *   P(Condition | Symptoms) ∝ P(Symptoms | Condition) × P(Condition)
 * 
 * Where:
 *   - P(Condition) = Beta prior from prevalence data
 *   - P(Symptoms | Condition) = Product of per-symptom likelihoods
 *     using sensitivity (true positive rate) and specificity (true negative rate)
 *   - Symptom correlations are handled via joint likelihood multipliers
 */

import { Condition, UserSymptomData, ReasoningTraceEntry } from "../types";
import { DetectedPattern } from "./SymptomCorrelations";

// ─── Configuration ────────────────────────────────────────────────────────────

export interface MCMCConfig {
    numSamples: number;       // Total MCMC iterations
    burnIn: number;           // Burn-in samples to discard
    proposalSigma: number;    // Random walk proposal standard deviation
    thinning: number;         // Keep every Nth sample to reduce autocorrelation
    numChains: number;        // Number of independent chains
}

const DEFAULT_CONFIG: MCMCConfig = {
    numSamples: 3000,
    burnIn: 750,
    proposalSigma: 0.12,
    thinning: 2,
    numChains: 3,
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
    converged: boolean;             // Whether the chain converged
    samples: number[];              // Raw posterior samples
    acceptanceRate: number;         // MH acceptance rate
}

export interface MCMCDiagnosisResult {
    conditionId: string;
    conditionName: string;
    mcmc: MCMCResult;
    score: number;                  // 0-100 scale for backward compat
    matchedKeywords: string[];
    reasoningTrace: ReasoningTraceEntry[];
}

export interface EvidenceVector {
    presentSymptoms: Set<string>;
    absentSymptoms: Set<string>;
    location: string[];
    painType: string | null;
    triggers: string | null;
    duration: string | null;
    frequency: string | null;
    intensity: number | null;
    additionalText: string;
    negatedTerms: string[];
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
    const knownSymptoms = [
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

    for (const symptom of knownSymptoms) {
        const readable = symptom.replace(/_/g, ' ');
        if (safeText.includes(readable) || safeText.includes(symptom)) {
            presentSymptoms.add(symptom);
        }
    }

    return {
        presentSymptoms,
        absentSymptoms,
        location: symptoms.location.map(l => l.toLowerCase()),
        painType: symptoms.painType?.toLowerCase() || null,
        triggers: symptoms.triggers?.toLowerCase() || null,
        duration: symptoms.duration?.toLowerCase() || null,
        frequency: symptoms.frequency?.toLowerCase() || null,
        intensity: symptoms.intensity ?? null,
        additionalText: safeText,
        negatedTerms,
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
        // Use recurrence: Γ(x+1) = x·Γ(x)
        let result = 0;
        let z = x;
        while (z < 7) {
            result -= Math.log(z);
            z += 1;
        }
        return result + logGamma(z);
    }
    // Stirling's approximation for large x
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

// ─── Core MCMC Functions ──────────────────────────────────────────────────────

/**
 * Compute log-prior P(θ) using Beta distribution from prevalence
 */
function computeLogPrior(theta: number, condition: Condition): number {
    const prevalence = condition.prevalence || 'uncommon';
    const params = PREVALENCE_BETA_PRIORS[prevalence] || PREVALENCE_BETA_PRIORS['uncommon'];
    return logBetaPDF(theta, params.alpha, params.beta);
}

/**
 * Compute log-likelihood P(Evidence | Condition, θ)
 * 
 * For each symptom with known sensitivity/specificity:
 *   - If present: log(sensitivity) weighted by θ
 *   - If absent:  log(1 - sensitivity) → supports if condition doesn't always show it
 * 
 * For symptoms without weights, use default sensitivity=0.6, specificity=0.7
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
        logLik += Math.log(0.95); // High prob of location match
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

    // ── 3. Per-Symptom Likelihoods (Weighted) ─────────────────────────────
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

            if (isPresent) {
                // P(symptom present | has condition) = sensitivity
                // P(symptom present | no condition) = 1 - specificity
                // Likelihood ratio = sensitivity / (1 - specificity)
                const lr = sensitivity / Math.max(1 - specificity, 0.01);
                const contribution = Math.log(lr) * weight;
                logLik += contribution;
                matchedKeywords.push(symptom);
                trace.push({ factor: `Symptom (weighted): ${symptom}`, impact: contribution, type: 'symptom' });
            } else if (isAbsent) {
                // Explicitly absent: P(absent | has condition) = 1 - sensitivity
                // P(absent | no condition) = specificity
                // LR = (1 - sensitivity) / specificity
                const lr = (1 - sensitivity) / Math.max(specificity, 0.01);
                const contribution = Math.log(lr) * weight;
                logLik += contribution;
                trace.push({ factor: `Absent (confirmed): ${symptom}`, impact: contribution, type: 'absent' });
            } else {
                // Not mentioned — mild penalty if high sensitivity (expected to be mentioned)
                if (sensitivity > 0.7) {
                    const penalty = Math.log(1 - sensitivity * 0.3);
                    logLik += penalty;
                    trace.push({ factor: `Missing expected: ${symptom}`, impact: penalty, type: 'symptom' });
                }
            }
        });
    }

    // ── 4. Special Symptoms (Flat likelihood) ─────────────────────────────
    if (criteria.specialSymptoms) {
        const defaultSensitivity = 0.6;
        const defaultSpecificity = 0.7;

        criteria.specialSymptoms.forEach(symptom => {
            // Skip if already handled by weights
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
                // Confirmed absence of a symptom that SHOULD be absent
                const contribution = Math.log(2.0); // LR = 2.0 for confirmed absence
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
            const contribution = Math.log(3.0); // Strong LR for type match
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
    condition: Condition,
    evidence: EvidenceVector,
    detectedPatterns: DetectedPattern[],
    logLikCache: number
): number {
    return computeLogPrior(theta, condition) + logLikCache * theta;
}

// ─── MCMC Sampler ─────────────────────────────────────────────────────────────

/**
 * Run Metropolis-Hastings MCMC for a single condition.
 * 
 * Samples from the posterior P(θ_c | Evidence) where θ_c is the probability
 * that this condition is present given the observed symptoms.
 */
function runMetropolisHastings(
    condition: Condition,
    evidence: EvidenceVector,
    detectedPatterns: DetectedPattern[],
    config: MCMCConfig = DEFAULT_CONFIG
): MCMCResult {
    const { numSamples, burnIn, proposalSigma, thinning } = config;

    // Pre-compute log-likelihood (it doesn't depend on θ directly — θ modulates the posterior)
    const likResult = computeLogLikelihood(condition, evidence, detectedPatterns);

    // If hard-filtered out (logLik = -Infinity), return zero posterior
    if (likResult.logLik === -Infinity) {
        return {
            posteriorMean: 0,
            posteriorMedian: 0,
            credibleInterval: { lower: 0, upper: 0, width: 0 },
            effectiveSampleSize: 0,
            gewekePValue: 1,
            converged: true,
            samples: [],
            acceptanceRate: 0,
        };
    }

    // Initialize chain at the prior mean
    const prevalence = condition.prevalence || 'uncommon';
    const priorParams = PREVALENCE_BETA_PRIORS[prevalence] || PREVALENCE_BETA_PRIORS['uncommon'];
    let currentTheta = priorParams.alpha / (priorParams.alpha + priorParams.beta);
    let currentLogPost = logPosterior(currentTheta, condition, evidence, detectedPatterns, likResult.logLik);

    const samples: number[] = [];
    let accepted = 0;
    const totalIterations = burnIn + numSamples * thinning;

    for (let i = 0; i < totalIterations; i++) {
        // Propose new θ via random walk on logit scale for better mixing
        const logitCurrent = Math.log(currentTheta / (1 - currentTheta));
        const logitProposed = logitCurrent + randn() * proposalSigma;
        const proposedTheta = 1 / (1 + Math.exp(-logitProposed));

        // Clamp to avoid numerical issues
        const thetaStar = clamp(proposedTheta, 1e-6, 1 - 1e-6);

        // Compute log-posterior at proposal
        const proposedLogPost = logPosterior(thetaStar, condition, evidence, detectedPatterns, likResult.logLik);

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

    const acceptanceRate = accepted / totalIterations;

    // Posterior summary
    return summarizePosterior(samples, acceptanceRate);
}

// ─── Posterior Summary & Diagnostics ──────────────────────────────────────────

function summarizePosterior(samples: number[], acceptanceRate: number): MCMCResult {
    if (samples.length === 0) {
        return {
            posteriorMean: 0,
            posteriorMedian: 0,
            credibleInterval: { lower: 0, upper: 0, width: 0 },
            effectiveSampleSize: 0,
            gewekePValue: 1,
            converged: true,
            samples: [],
            acceptanceRate,
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

    // Effective Sample Size (using autocorrelation)
    const ess = computeESS(samples);

    // Geweke convergence diagnostic
    const gewekePValue = gewekeTest(samples);

    const converged = gewekePValue > 0.05 && ess > 50 && acceptanceRate > 0.15 && acceptanceRate < 0.60;

    return {
        posteriorMean,
        posteriorMedian,
        credibleInterval: hpd,
        effectiveSampleSize: ess,
        gewekePValue,
        converged,
        samples,
        acceptanceRate,
    };
}

/**
 * Compute 95% Highest Posterior Density (HPD) interval.
 * Finds the shortest interval containing (1-alpha) fraction of samples.
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
 * More robust than autocorrelation for short chains.
 */
function computeESS(samples: number[]): number {
    const n = samples.length;
    if (n < 10) return n;

    const mean = samples.reduce((s, x) => s + x, 0) / n;
    const variance = samples.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1);
    if (variance === 0) return n;

    // Batch means: split into sqrt(n) batches
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
    const tau = batchSize * batchVariance / variance; // Integrated autocorrelation time estimate

    if (tau <= 0 || !isFinite(tau)) return n;
    return Math.min(n, Math.max(1, n / tau));
}

/**
 * Geweke convergence diagnostic.
 * Compares mean of first 10% vs last 50% of chain.
 * Returns approximate p-value from two-sided z-test.
 */
function gewekeTest(samples: number[]): number {
    const n = samples.length;
    if (n < 20) return 1; // Too few samples

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

    // Approximate p-value from standard normal (two-sided)
    // Using error function approximation
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

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Run MCMC inference for a single condition given evidence.
 * Returns full posterior summary with diagnostics.
 */
export function mcmcInfer(
    condition: Condition,
    evidence: EvidenceVector,
    detectedPatterns: DetectedPattern[] = [],
    config: MCMCConfig = DEFAULT_CONFIG
): MCMCDiagnosisResult {
    const mcmc = runMetropolisHastings(condition, evidence, detectedPatterns, config);

    // Get likelihood details for keywords and trace
    const likResult = computeLogLikelihood(condition, evidence, detectedPatterns);

    // Add prior to trace
    const fullTrace: ReasoningTraceEntry[] = [
        { factor: `Prior (${condition.prevalence || 'uncommon'})`, impact: mcmc.posteriorMean, type: 'prior' },
        ...likResult.trace,
    ];

    // Convert posterior mean to 0-100 score (normalized)
    // Use sigmoid-like mapping centered around prior mean for intuitive scaling
    const priorMean = (PREVALENCE_BETA_PRIORS[condition.prevalence || 'uncommon'] || PREVALENCE_BETA_PRIORS['uncommon']).alpha /
        ((PREVALENCE_BETA_PRIORS[condition.prevalence || 'uncommon'] || PREVALENCE_BETA_PRIORS['uncommon']).alpha +
            (PREVALENCE_BETA_PRIORS[condition.prevalence || 'uncommon'] || PREVALENCE_BETA_PRIORS['uncommon']).beta);

    // Score: how much the posterior exceeds the prior, scaled to 0-100
    // If posterior = prior → ~20. If posterior >> prior → up to 95.
    const posteriorLiftRatio = mcmc.posteriorMean / Math.max(priorMean, 1e-6);
    const score = clamp(
        (1 / (1 + Math.exp(-Math.log(posteriorLiftRatio)))) * 100,
        0,
        99
    );

    return {
        conditionId: condition.id,
        conditionName: condition.name,
        mcmc,
        score,
        matchedKeywords: likResult.matchedKeywords,
        reasoningTrace: fullTrace,
    };
}

/**
 * Run MCMC inference across all candidate conditions.
 * Returns sorted results with top conditions ranked by posterior.
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

export { computeLogLikelihood, computeLogPrior, runMetropolisHastings };
export type { BetaParams };
