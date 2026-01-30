# Clinical Decision Rules: Validated Medical Mathematics

## 1. Concept: Evidence-Based Determinant Logic
The Decision Rules module (`src/lib/diagnosis/advanced/ClinicalDecisionRules.ts`) implements validated medical scoring systems that have higher predictive power than simple Bayesian inference in critical scenarios.

## 2. Rule-Specific Mathematics
### A. Wells Score for DVT
- **Goal**: Quantify probability of Deep Vein Thrombosis.
- **Math**: Point-based summation ($P_{DVT}$).
  - `Entire leg swollen`: $+1$
  - `Calf asymmetry >3cm`: $+1$
  - `Alternative diagnosis likely`: $-2$
- **Probabilistic Mapping**:
  - $P_{DVT} \ge 3 \rightarrow 75\%$ Risk
  - $P_{DVT} \in [1, 2] \rightarrow 17\%$ Risk

### B. PERC Rule for Pulmonary Embolism
- **Goal**: Rule out PE without invasive testing.
- **Math**: Boolean logic gate (All 8 negative).
- **Clinical Performance**: If ALL criteria are negative, the Negative Predictive Value (NPV) is **99.6%**.

### C. HEART Score for Chest Pain
- **Goal**: Triage MACE (Major Adverse Cardiac Events).
- **Dimensions**: History, EKG, Age, Risk factors, Troponin.
- **Weighting**:
  - $Score \ge 7 \rightarrow$ High Risk (Admit Immediately).
  - $Score \le 3 \rightarrow$ Low Risk (1.7% Event Rate).

## 3. Algorithmic Impact: Log-Odds Injection
When a clinical rule is "Triggered" (e.g., Wells > 2), the engine injects a significant multiplier into the log-odds of the corresponding condition:
$$Log_{new} = Log_{old} + \ln(RuleMultiplier)$$
*Note: This ensures that evidence-based rules always override generic symptom matching in high-stakes triage.*

## 4. Feature Deployment: Rule Manager
The `applyRules()` function acts as an **Orchestrator**:
1. Scan presenting symptoms for "Suspicion Seeds" (e.g., Leg Swelling).
2. If match, execute the specific subclass (e.g., `wellsScoreDVT`).
3. Return a `RuleResult` with a mandatory `recommendation` string which is rendered in the Physician's UI.

## 5. Summary Table
| Rule | Domain | Sensitivity | Specificity | Key Metric |
| :--- | :--- | :--- | :--- | :--- |
| **Wells** | Vascular | 0.89 | 0.45 | Pre-test Probability |
| **PERC** | Respiratory| 1.00 | N/A | Rule-out (NPV) |
| **HEART**| Cardiac | 0.99 | 0.40 | Mortality Triage |
| **NEXUS**| Trauma | 0.99 | 0.13 | Imaging De-escalation|
