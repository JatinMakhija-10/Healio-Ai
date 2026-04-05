# MCMC Bayesian Engine — Complete Architectural Deep Dive

This document serves as the foundational reference architecture for all enhancements, scaling, and debugging of the Healio.AI Bayesian inference engine.

---

## Checkpoint 1 — The Bayesian Foundation

Everything starts with Bayes' theorem. In a health diagnosis context, you have:

**P(disease | symptoms) = P(symptoms | disease) × P(disease) / P(symptoms)**

- `P(disease)` is the **prior** — baseline prevalence before any patient data
- `P(symptoms | disease)` is the **likelihood** — how probable these symptoms are, given the disease
- `P(disease | symptoms)` is the **posterior** — the updated belief after seeing the evidence
- `P(symptoms)` is the normalising constant — often intractable to compute directly (this is exactly why MCMC exists)

The core problem: when you have dozens of diseases and hundreds of symptoms, the posterior lives in a very high-dimensional space. You cannot compute it analytically. MCMC is a way to *sample* from it without ever computing the normalising constant.

---

## Checkpoint 2 — What is a Markov Chain?

A Markov Chain is a sequence of states where each next state depends only on the current state — not on history. In MCMC, the "states" are parameter values (e.g., a particular probability assignment over diseases).

Key properties that make it work for inference:

- The chain is designed so its **stationary distribution** equals the target posterior
- Given enough steps, the chain "forgets" its starting point and its samples become draws from the true posterior
- This is the **ergodicity** guarantee — the chain will visit every region of the posterior proportional to its probability mass
- The **Markov property** (memorylessness) makes the chain computationally cheap — each step only needs the current state. The red zone is burn-in — the chain wandering towards the high-probability region. The green zone is the usable posterior samples. Notice how the chain visits the two probability modes proportionally to their mass.

---

## Checkpoint 3 — The Metropolis-Hastings Algorithm

Metropolis-Hastings (MH) is the foundational MCMC algorithm. It builds the correct Markov chain by using an accept/reject step:

**The algorithm at each iteration:**
1. At current state θ, propose a new state θ* by sampling from a proposal distribution q(θ* | θ) — typically a Gaussian centred on the current point
2. Compute the acceptance ratio: `α = [P(θ*| data) / P(θ | data)]` — equivalently `[likelihood(θ*) × prior(θ*)] / [likelihood(θ) × prior(θ)]`
3. Accept θ* with probability `min(1, α)` — if the proposed state is more probable, always accept; if less probable, sometimes accept (this is what allows the chain to escape local maxima)
4. If rejected, stay at θ and record θ again

The normalising constant P(data) cancels out in the ratio — this is the key trick. You never need to compute it.

**Proposal tuning** is critical. Too narrow a proposal = tiny steps, slow mixing, very high acceptance rate but poor exploration. Too wide = proposals land in very low-probability regions, almost always rejected, chain barely moves. Target acceptance rate for MH is typically 23–44%.

---

## Checkpoint 4 — Advanced Samplers: HMC and NUTS

Vanilla MH is slow in high dimensions because random-walk proposals explore inefficiently. Modern MCMC engines use two key upgrades:

**Hamiltonian Monte Carlo (HMC)** — uses gradient information from the log-posterior to make large, directed leaps through parameter space. It simulates a physical system: θ is particle position, a momentum variable p is introduced, and the system evolves using Hamiltonian dynamics along the posterior surface. Proposals land far from the current state yet are accepted with very high probability (~90%+) because they follow the posterior's contours.

- Requires computing `∇log P(θ|data)` — the gradient of the log-posterior
- Uses leapfrog integration to simulate the Hamiltonian trajectory
- L leapfrog steps with step size ε must be tuned — wrong values waste computation or cause divergences
- Divergent transitions (where the leapfrog integrator goes unstable) indicate model misspecification or poor geometry

**NUTS (No-U-Turn Sampler)** — eliminates the manual tuning of L and ε in HMC. It extends the leapfrog trajectory until it starts doubling back on itself (a "U-turn"), then samples from the set of valid trajectory points. This gives near-optimal trajectory length automatically. NUTS is the default sampler in Stan and PyMC.

**Why this matters for health diagnosis:** A disease model with 200 parameters (symptom weights, disease correlations, lab value distributions) needs HMC/NUTS. Vanilla MH would take millions of steps and hours to converge. HMC/NUTS converges in thousands of steps.

---

## Checkpoint 5 — The Prior: Encoding Medical Knowledge

The prior `P(disease)` is not a guess — it encodes real epidemiological structure:

**Hierarchical priors** — instead of independently setting each disease's prior, you model disease categories. Cardiovascular diseases share hyperparameters, respiratory diseases share theirs. This allows rare diseases to borrow statistical strength from their class. The prior for "Pulmonary Embolism" informs and is informed by the prior for "DVT" through the shared cardiovascular hyperparameter.

**Covariate-conditioned priors** — the prior is itself a model: `P(disease) = f(age, sex, geography, comorbidities)`. A 70-year-old male smoker gets P(COPD) ≈ 0.15 as prior; a 25-year-old non-smoker gets P(COPD) ≈ 0.001. This is implemented as a logistic regression layer feeding into the prior.

**Prior sensitivity analysis** — the engine runs inference under multiple prior strengths (informative vs weakly informative vs flat) and flags diagnoses where the posterior is prior-dominated. If P(disease | data) ≈ P(disease) for some disease, it means the data contains no information about it — the prior is doing all the work.

**Conjugate sub-priors** — for computational efficiency, where possible use conjugate pairs: Beta prior on Bernoulli symptom probabilities, Dirichlet prior on categorical disease distributions, Normal-Inverse-Gamma for continuous lab value parameters. Conjugate pairs update analytically, reducing the MCMC burden.

---

## Checkpoint 6 — The Likelihood: Translating Symptoms to Probability

The likelihood `P(symptoms | disease)` is the medical knowledge base expressed probabilistically:

**Binary symptoms** (present/absent) — modelled as Bernoulli with disease-specific sensitivity and specificity. The sensitivity itself is a Beta-distributed parameter, not a point estimate. This propagates uncertainty from the clinical literature directly into the inference.

**Continuous lab values** — modelled per disease with parametric distributions. Troponin levels in MI follow a log-normal with a high mean. Creatinine in CKD follows a shifted Gamma. Mixtures of Gaussians capture bimodal lab patterns. Each distribution's parameters are themselves uncertain and sampled during MCMC.

**Symptom correlations within a disease** — naive Bayes assumes symptom independence given disease, but nausea and vomiting are correlated even within a disease. The likelihood model uses a Gaussian copula to capture within-disease symptom correlations while keeping marginals tractable.

**Missing data** — handled via marginalisation, not imputation. If creatinine is missing, its contribution to the likelihood is integrated out over its prior predictive distribution. The MCMC sampler draws imputed values for missing observations as auxiliary variables — these are part of the sample but marginalised over in the final posterior.

**Temporal evidence** — for time-series vitals (heart rate over 6 hours), a state-space likelihood model captures trajectory shape, not just point values. A rising troponin trend is stronger evidence of MI than a single high reading.

---

## Checkpoint 7 — Burn-in, Thinning, and Convergence Diagnostics

After running the chain, you need to validate that the samples are actually from the posterior:

**Burn-in removal** — the first N samples (often 10–50% of the run) are discarded. The chain starts from an arbitrary point and needs time to "find" the high-probability region. Samples collected before this are biased toward the starting point. Multiple chains with different starting points should reach the same region — if they don't, the model has a problem.

**Thinning** — keeping every k-th sample to reduce autocorrelation between consecutive samples. Consecutive MCMC samples are correlated (each comes from near the previous one). Thinning gives approximately independent samples. Modern practice questions heavy thinning — it's often better to run longer and keep everything.

**R̂ (Gelman-Rubin diagnostic)** — the gold standard convergence check. Run M chains (typically 4) from different starting points. R̂ measures the ratio of between-chain variance to within-chain variance. `R̂ ≈ 1.0` means all chains are sampling the same distribution. `R̂ > 1.01` signals non-convergence — the chains haven't mixed. A health diagnosis engine should require `R̂ < 1.01` for all parameters before producing output.

**Effective Sample Size (ESS)** — due to autocorrelation, 10,000 MCMC samples may only have the statistical power of 500 independent samples. ESS quantifies this. The engine should report ESS alongside every posterior estimate. Diagnosis probabilities based on ESS < 100 are unreliable and should trigger a warning.

**Divergent transitions (HMC-specific)** — indicate regions where the leapfrog integrator breaks down, usually due to sharp curvature in the posterior (a "funnel" geometry). Any divergences in a health diagnosis run should block output — they indicate the model is misspecified for this patient's data.

---

## Checkpoint 8 — Posterior Summaries and Clinical Output

The raw output of MCMC is a set of samples from `P(disease | patient data)`. These must be transformed into clinically useful summaries:

**Posterior mean and median** — the expected probability of each disease. The median is preferred for skewed posteriors (rare diseases with heavy tails).

**95% Credible Interval (CrI)** — the interval containing 95% of posterior probability mass. Fundamentally different from a frequentist confidence interval: you can directly say "there is a 95% probability that P(MI) is between 0.34 and 0.71." This is what clinicians actually need.

**Highest Density Interval (HDI)** — the narrowest interval containing 95% of the mass. Preferred over equal-tailed intervals when the posterior is asymmetric or multimodal.

**Posterior predictive checks** — simulating new patient data from the fitted model and comparing to the actual observed data. If the model consistently cannot reproduce the patient's observed symptom pattern, the model is misspecified — none of the diagnoses should be trusted.

**Value-of-Information (VOI) analysis** — for each possible follow-up test, estimate how much the posterior entropy would decrease if that test were ordered. The test with maximum expected information gain is recommended first. This is computed by sampling from the posterior, simulating what each test result would be under each disease, and computing the expected posterior after the result.

**Red flag escalation** — certain posterior configurations trigger automatic escalation regardless of the top diagnosis. If P(PE) > 0.05 and the patient has any hypoxia, the system flags for urgent workup regardless of what else is on the differential.

---

## Checkpoint 9 — Key Engineering Tricks

**Log-probability arithmetic** — all probabilities are computed in log space. Multiplying tiny probabilities (likelihoods across hundreds of symptoms) causes numerical underflow. In log space, products become sums: `log P(data|θ) = Σ log P(symptom_i|θ)`. The acceptance ratio becomes `log α = log P(θ*|data) − log P(θ|data)`, compared against `log(uniform)`.

**Reparameterisation** — poorly parameterised models have funnel-shaped posteriors where the sampler gets stuck. The standard fix is a non-centred parameterisation: instead of sampling a hierarchical parameter μ directly, sample a standardised variable η ~ N(0,1) and reconstruct μ = μ₀ + η·σ. This transforms the funnel into a well-behaved geometry.

**Warm-up adaptation** — during burn-in (called "warm-up" in Stan), the step size ε and mass matrix M are adapted using dual averaging and the empirical covariance of samples. The mass matrix pre-conditions the sampler — parameters with large variances get larger step sizes. This eliminates the need for manual tuning in production.

**Parallel chains on GPU** — modern frameworks (NumPyro, BlackJAX) run all four chains simultaneously on GPU, with gradient computation via JAX autodiff. A diagnosis with 200 parameters converges in seconds rather than minutes.

**Rao-Blackwellisation** — for discrete latent variables (e.g., which disease subtype), analytically marginalise them out before sampling rather than sampling them directly. This reduces dimensionality and dramatically improves mixing efficiency.

**Mini-batch likelihood** — for large EHR datasets used in model training, stochastic gradient MCMC (SGLD, SGHMC) approximates the full-data gradient using random mini-batches. Biases are corrected via noise schedules. This enables training on millions of patient records.

---

## Summary of All Checkpoints

Here is a consolidated reference across every technical layer covered:

| Checkpoint | Core concept | Key mechanism |
|---|---|---|
| 1 — Bayesian foundation | Posterior ∝ likelihood × prior | Normaliser is intractable → need MCMC |
| 2 — Markov chain | Stationary distribution = posterior | Ergodicity guarantees convergence |
| 3 — Metropolis-Hastings | Accept/reject with ratio α | Normaliser cancels in ratio |
| 4 — HMC/NUTS | Gradient-guided leaps | Leapfrog dynamics, U-turn criterion |
| 5 — Prior design | Hierarchical + covariate-conditioned | Dirichlet, Beta, conjugate families |
| 6 — Likelihood model | Symptom-disease probability | Beta sensitivity, log-normal labs, copula correlations |
| 7 — Diagnostics | R̂, ESS, divergences | Multi-chain comparison, autocorrelation |
| 8 — Clinical output | Posterior summaries | HDI, VOI, predictive checks, red flags |
| 9 — Engineering tricks | Log-space, reparameterisation, GPU | Numerical stability, funnel geometry, speed |
| 10 — Full pipeline | End-to-end system | Gated output, convergence-blocked release |

The MCMC Bayesian engine is powerful precisely because it treats uncertainty as a first-class output — every diagnosis comes with a probability distribution, not a point prediction, and the system knows what it doesn't know.
