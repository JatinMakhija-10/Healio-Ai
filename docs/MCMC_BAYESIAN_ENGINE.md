# MCMC Bayesian Inference Engine — Healio.AI

> **Version 2.0** — Full Checkpoint Implementation
> Last updated: 2026-04-05

## Architecture Overview

The Healio MCMC Bayesian Engine provides clinically-safe probabilistic diagnosis through a 10-checkpoint pipeline. Every diagnosis passes through multi-chain Markov Chain Monte Carlo inference before being fused with RAG-retrieved Boericke Materia Medica and AI reasoning.

```
┌──────────────────────────────────────────────────────────────────┐
│  SYMPTOMS (UserSymptomData)                                      │
│     │                                                            │
│     ▼                                                            │
│  [CP1-3] MCMC SAMPLER ── Multi-chain Metropolis-Hastings ──┐    │
│     │                     (3 chains × 3000 samples)          │    │
│     │  [CP5] Covariate-conditioned priors (age/sex/BMI)      │    │
│     │  [CP6] Missing data marginalisation                    │    │
│     │  [CP7] R̂ Gelman-Rubin + ESS + Geweke diagnostics     │    │
│     ▼                                                        │    │
│  [CP10] CONVERGENCE GATE ── R̂ < 1.05 AND ESS ≥ 100? ──────┤    │
│     │              NO → force InformationGain question       │    │
│     │              YES → proceed to AI                       │    │
│     ▼                                                        │    │
│  [CP8] CLINICAL OUTPUT ── HDI, PPP, Red Flag Escalation ────┘    │
│     │                                                            │
│     ▼                                                            │
│  MULTI-QUERY RAG ── Boericke Materia Medica retrieval            │
│     │                                                            │
│     ▼                                                            │
│  LLM INFERENCE ── Enriched prompt with convergence warnings      │
│     │               + posterior red flags + R̂ quality data       │
│     ▼                                                            │
│  BAYESIAN CALIBRATION ── 70% AI + 30% Bayesian blend             │
│     │                                                            │
│     ▼                                                            │
│  UNCERTAINTY QUANTIFICATION ── Confidence intervals              │
│     │                                                            │
│     ▼                                                            │
│  FUSED DIAGNOSIS                                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## Checkpoint Implementation Details

### CP1 — Bayesian Foundation
**File:** `MCMCEngine.ts`

The core identity: **P(Condition | Symptoms) ∝ P(Symptoms | Condition) × P(Condition)**

- Log-space arithmetic throughout to prevent underflow
- Posterior is proportional to `logPrior(θ) + logLikelihood(evidence) × θ`

### CP2 — Markov Chain
**File:** `MCMCEngine.ts` → `runSingleChain()`

- Ergodic chain with stationary distribution equal to the posterior
- Logit-space proposals for better mixing on bounded [0,1] domain
- Burn-in period (750 samples) discarded before collection

### CP3 — Metropolis-Hastings
**File:** `MCMCEngine.ts` → `runSingleChain()`

Accept/reject with log-space ratio:
```
log α = (log P*(θ*) + log J(θ*)) − (log P*(θ) + log J(θ))
```
Where J is the Jacobian correction for the logit transform.

- Random walk proposals: `logit(θ*) = logit(θ) + N(0, σ²)` with `σ = 0.12`
- Thinning factor: keep every 2nd sample to reduce autocorrelation
- Target acceptance rate: 20-50% (optimal for 1D posteriors)

### CP4 — HMC/NUTS
**Status: Intentionally not implemented**

Vanilla MH is adequate for our 1-dimensional per-condition posteriors. HMC requires differentiable likelihood functions — our binary symptom likelihoods are discrete. The computational overhead of gradient computation provides no benefit at this dimensionality.

### CP5 — Prior Design
**File:** `MCMCEngine.ts` → `computeCovariateAdjustedPrior()`, `computeWeakenedPrior()`

#### Covariate-Conditioned Priors
Beta(α, β) priors from prevalence, adjusted by patient covariates:

| Covariate | Adjustment |
|:---|:---|
| Age 50+ smoker | COPD prior × 3.0 |
| Age 45+ with HTN/smoking | Cardiac prior × 2.5 |
| Female 15-45 | Migraine prior × 2.0 |
| Female | UTI prior × 3.0 |
| Birth control / pregnant | PE/DVT prior × 2.0 |
| Known diabetic | Diabetic complications prior × 4.0 |
| Known hypertension | Cardiovascular prior × 1.8 |
| Smoker | Respiratory prior × 2.0 |

#### Prior Sensitivity Analysis
Runs inference under both informative (current) and weakened (flattened) priors. If `|posterior_informative − posterior_weak| < 0.02`, the result is flagged as `priorDominated: true` — the data contains no information about this condition.

### CP6 — Likelihood Model
**File:** `MCMCEngine.ts` → `computeLogLikelihood()`

Per-symptom likelihood ratios from sensitivity/specificity:
- **Present symptoms:** `LR = sensitivity / (1 − specificity)`
- **Absent symptoms (confirmed):** `LR = (1 − sensitivity) / specificity`
- **Unknown symptoms (marginalised):** `LR = baseRate × LR_present + (1 − baseRate) × LR_absent`

Additional factors: pain type matching, trigger matching, temporal reasoning (onset/progression), condition name mention, clinical correlation pattern multipliers.

### CP7 — Convergence Diagnostics
**File:** `MCMCEngine.ts` → `runMultiChainMCMC()`, `computeRHat()`

Three independent chains from dispersed starting points (10th, 50th, 90th percentile of prior):

| Diagnostic | Threshold | Purpose |
|:---|:---|:---|
| **R̂ (Gelman-Rubin)** | < 1.05 | Between-chain vs within-chain variance |
| **ESS (Effective Sample Size)** | ≥ 100 | Autocorrelation-adjusted sample count |
| **Geweke test** | p > 0.05 | Stationarity of first 10% vs last 50% |
| **Acceptance rate** | 15-60% | Chain mixing quality |

All four must pass for `converged: true`.

### CP8 — Clinical Output
**File:** `MCMCEngine.ts` → `summarizePosterior()`, `posteriorPredictiveCheck()`, `checkPosteriorRedFlags()`

- **HDI:** 95% Highest Posterior Density interval (shortest interval containing 95% mass)
- **Posterior Predictive Check:** Simulates expected symptom profile vs actual presentation. `posteriorPredictiveP < 0.3` flags poor model fit.
- **Red Flag Escalation:** Even if not the top diagnosis, triggers alert if:
  - P(PE) > 5%, P(MI) > 5%, P(Stroke) > 3%, P(Meningitis) > 3%, P(Aortic Dissection) > 2%

### CP9 — Engineering Tricks
**File:** `MCMCEngine.ts`

- ✅ Log-space arithmetic (all probability computations)
- ✅ Logit-space proposals (better mixing on [0,1])
- ✅ Multi-chain inference (3 chains from dispersed starts)
- ✅ Thinning (every 2nd sample to reduce autocorrelation)
- ⬜ Warm-up adaptation of step size (not needed — fixed σ=0.12 works well for 1D)
- ⬜ GPU parallelism (N/A — JavaScript runtime)
- ⬜ Rao-Blackwellisation (N/A — no discrete latent variables)

### CP10 — Full Pipeline & Gated Output
**File:** `orchestrator.ts` → `diagnose()`, `route.ts` → `POST()`

The convergence gate enforces clinical safety:

1. **Orchestrator Gate:** If `mcmcDiagnostics.converged === false` for the top candidate AND multiple candidates exist → force `InformationGainSelector` to ask a follow-up question. No AI inference occurs.

2. **Route Gate:** If all Bayesian priors have `converged === false`:
   - LLM temperature forced to 0.1 (ultra-conservative)
   - Convergence warning injected into prompt
   - AI confidence capped at 60 post-hoc
   - Warning appended to response

3. **Red Flag Gate:** If posterior red flags exist:
   - `seekHelp` forced to `true`
   - Red flags injected into AI prompt as mandatory differential diagnoses
   - Temperature reduced to 0.15

---

## Output Schema

```typescript
interface MCMCResult {
    posteriorMean: number;          // Point estimate [0,1]
    posteriorMedian: number;        // Median of posterior
    credibleInterval: {             // 95% HPD
        lower: number;
        upper: number;
        width: number;
    };
    effectiveSampleSize: number;    // ESS (batch means)
    gewekePValue: number;           // Geweke diagnostic
    rHat: number;                   // Gelman-Rubin R̂
    numChains: number;              // Chains run
    converged: boolean;             // All diagnostics passed
    acceptanceRate: number;         // Mean MH acceptance
    priorDominated: boolean;        // Prior sensitivity flag
    posteriorPredictiveP: number;   // Model fit check [0,1]
    samples: number[];              // Raw posterior samples
}
```

---

## File Map

| File | Responsibility |
|:---|:---|
| `MCMCEngine.ts` | Core MCMC sampler, priors, likelihood, convergence, red flags |
| `engine.ts` | Public `calculateBayesianScore()` API, red flag scanner |
| `orchestrator.ts` | 5-stage fusion pipeline with convergence gate |
| `route.ts` | API endpoint with convergence-aware prompt building |
| `InformationGainSelector.ts` | Entropy-reducing follow-up questions |
| `UncertaintyQuantification.ts` | Confidence intervals and calibration |
| `SymptomCorrelations.ts` | Clinical pattern detection (MI, stroke, etc.) |
| `ClinicalDecisionRules.ts` | Wells, PERC, HEART, Ottawa scoring |
