# Prakriti Engine: Birth Constitution Assessment

## 1. Concept: The Biological Blueprint
Prakriti is the "original nature" or genetic constitution, determined at conception. It is considered **unchangeable**.

## 2. The Algorithm: Weighted Confidence Scoring
The engine (`src/lib/ayurveda/prakriti/prakritiEngine.ts`) applies a complex weighted sum to every response.

### Step 1: Raw Contribution
For every factor $i$ (e.g., body frame):
$$C_{i}(Dosha) = Weight_{i} \times Confidence_{i}$$

### Step 2: Normalization
The raw scores are summed and normalized to a 100% scale:
$$Score(Dosha) = \frac{\sum C_{i}(Dosha)}{\sum \text{Total Raw Scores}} \times 100$$

### Step 3: Classification Logic
Found in `determinePrakritiType()`:
- **Single Dosha**: $Score_{max} \ge 50\%$
- **Dual Dosha**: $(Score_{first} - Score_{second}) \le 15\%$
- **Tridoshic**: $(Score_{first} - Score_{third}) \le 10\%$

## 3. Implementation Details
### Confidence Math
The final confidence is a product of the engine's base confidence and the user's data quality:
$$FinalConf = Avg(Conf_{weights}) \times ConsistencyScore$$

**Consistency Score** measures how clearly the dominant dosha stands out:
$$Consistency = \min(1, 0.5 + \frac{Score_{first} - Score_{second}}{100})$$

### Assessment Quality Thresholds
The engine performs a metadata sweep to ensure clinical validity:
- **Completeness**: Requires $>90\%$ response rate for "High Quality" status. 
- **Consistency Threshold**: If $(Score_{first} - Score_{second}) < 10\%$, the quality is flagged as "Ambiguous," and the `PrakritiCard` adds a recommendation for professional pulse diagnosis.
- **Factor Correlation**: Validates if the psychological profile (e.g., Learning Style) contradicts the physical profile (e.g., Weight Tendency).

## 4. Feature: The Questionnaire
- **Button Logic**: Each radio button in the UI maps to a specific `PrakritiType` factor in `PRAKRITI_SCORING_WEIGHTS`.
- **State Management**: Answers are staged in local state and committed only on "Complete Assessment," triggering the `assessPrakriti()` function.

## 5. UI Components
- **PrakritiCard**: Displays the primary dosha with a SVG-based circular gauge.
- **Characteristic List**: Automatically generated using `extractDefiningCharacteristics()` to show the user exactly *why* they were assigned a specific type.
