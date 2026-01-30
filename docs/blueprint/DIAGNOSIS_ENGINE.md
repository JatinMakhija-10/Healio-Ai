# Diagnosis Engine: Bayesian Clinical Intelligence

## 1. Concept: Hybrid Medical Inference
A high-precision clinical decision support system combining semantic symptom matching with probabilistic (Bayesian) inference.

## 2. The Core Algorithm: Bayesian Sigmoid Logic
The engine (`src/lib/diagnosis/engine.ts`) uses **Log-Odds Evidence Accumulation**.

### Step 1: Prior Log-Probability
$$L_{0} = \ln(P(Prior))$$

### Step 2: Evidence Updates
For every symptom $S$:
$$L_{new} = L_{old} + \ln(\text{Multiplier})$$
- Multiplier > 1 (Positive match)
- Multiplier < 1 (Contradiction/Exclusion)

### Step 3: Pattern Correlation Multipliers
Found in `SymptomCorrelations.ts`:
- **Heart Attack Pattern**: 5.0x boost
- **Stroke (FAST)**: 6.0x boost
- **Anaphylaxis**: 5.5x boost

### Step 4: Sigmoid Normalization
Converts log-odds back to a 0-100% human-readable score:
$$Score = \frac{1}{1 + e^{-L_{final}}} \times 100$$

## 3. High-Fidelity Modules
### A. Clinical Decision Rules (Validated Math)
- **Wells' Score (DVT)**: If $Score \ge 3 \rightarrow$ 75% probability.
- **HEART Score (Cardiac)**: $Score \ge 7 \rightarrow$ 50-65% Risk of Adverse Event.
- **PERC Rule (PE)**: If all 8 criteria negative $\rightarrow$ 99.6% NPV (Negative Predictive Value).

### B. Uncertainty Quantification logic (Bootstrap Variation)
Uses a statistical "Bootstrap" approach to calculate the `confidenceInterval` range.
1. **Base Interval**: Assigned based on evidence quality (Strong: 10%, Moderate: 15%, Weak: 25%).
2. **Width Adjustment**:
$$Width = BaseWidth \times (1 + (1 - \frac{|Score - 50|}{50}) \times 0.5)$$
3. **Calibration Quality**:
    - **Excellent**: If Evidence = Strong AND Interval < 15%.
    - **Poor**: If Evidence = Weak OR Interval > 30%.

*Goal: To communicate to the doctor: "We have an 80% point estimate, but because the evidence is weak, the true value could be anywhere between 65% and 95%."*

## 4. UI Actions & Feature logic
- **"New Consultation" Button**: Resets the `currentSymptomData` state and initializes the `scanRedFlags()` sweep.
- **"Detailed Reasoning" Button**: Renders the `reasoningTrace` array, mapping every log-probability increment to a human-readable explanation (e.g., "+3.0: High-specificity match for fever").

## 5. Explainability Table
| Feature | Technical Implementation | Goal |
| :--- | :--- | :--- |
| Red Flags | Regex-based pattern matching | Safety-first triage |
| Correlates | Set intersection logic | Counter naive Bayesian bias |
| Rules | Point-based arithmetic | Validated medical accuracy |
| Sigmoid | Logistic function | Readable confidence levels |
