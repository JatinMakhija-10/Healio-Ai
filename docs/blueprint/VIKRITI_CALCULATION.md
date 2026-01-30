# Vikriti Calculation: Dynamic Imbalance Assessment

## 1. Concept: The State of Imbalance
Vikriti represents the "current state" of an individual's doshas. It is **dynamic** and reactive to external stimuli.

## 2. The Algorithm: High-Entropy Imbalance Tracking
The engine (`src/lib/ayurveda/vikriti/vikritiEngine.ts`) uses a multi-factor accumulator.

### Step 1: Accumulation
Scores are added for each symptom or lifestyle factor.
**Example**:
- Sleep Duration < 6hrs $\rightarrow$ Vata +10
- Sleep Duration > 8hrs $\rightarrow$ Kapha +10
- Chronic Stress $\rightarrow$ Vata +15, Pitta +10

### Step 2: Seasonal Multiplier (Ritucharya)
The engine applies a seasonalprovocation constant:
$$Score(Dosha_{provoked}) = Score(Dosha_{provoked}) + 15$$

### Step 3: Normalization
$$Score\% = \frac{Score_{raw}}{\sum Score_{all}} \times 100$$

## 3. Severity Formula
Severity expresses how far the current state is from a baseline balance of 33.33%.
$$Deviation = |Score_{max} - 33.33|$$
$$Severity = \min(100, Deviation \times 2)$$

**Scale**:
- **0-20%**: Balanced (Sama)
- **21-60%**: Moderate Imbalance
- **>80%**: Critical Deviation

## 4. Feature: Contributing Factors logic
The `identifyContributingFactors()` function iterates through user inputs and uses conditional logic to map "Aggravators":
- **Algorithm**: If $Input(i) = \text{BadHabit}$ AND $Factor(i)$ correlates with $Dosha_{dominant}$, then add to `contributingFactors` list.

## 5. UI Buttons and Actions
- **Get Guidance Button**: Triggers `getSeasonalGuidance()`.
- **Log Symptom Button**: Appends values to the `symptoms` array, which the engine evaluates as high-weight evidence.
