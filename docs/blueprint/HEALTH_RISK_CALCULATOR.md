# Health Risk Calculator: Clinical Predictive Math

## 1. Goal: Proactive Risk Stratification
The Health Risk Calculator (`src/lib/diagnosis/healthRiskCalculator.ts`) performs high-fidelity probability calculations based on onboarding data.

## 2. BMI Standard Calculation
Uses WHO-standardized biometric math:
$$BMI = \frac{Weight (kg)}{Height (m)^2}$$

### Ayurvedic Biometric Interpretation
Unlike Western medicine, we map BMI to **Dhatu (Tissue)** status:
- **Low BMI**: Vata dominance / Tissue depletion.
- **High BMI**: Kapha imbalance / Meda Dhatu (Fat) excess.

## 3. Cardiovascular Risk Calculation
Adapted from the **Framingham Heart Study** models.
### Risk Factors (Weights)
- **Smoking**: $+25$ points.
- **Age 65+**: $+25$ points.
- **High BP**: $+20$ points.
- **Sedentary**: $+15$ points.
- **Active (Protective)**: $-10$ points.

## 4. Diabetes Risk Calculation (FINDRISC)
Uses a point-based system adapted from the Finnish Diabetes Risk Score.
- **BMI > 30**: $+25$ points.
- **Family History**: $+20$ points.
- **Sleep < 6hrs**: $+10$ points.

## 5. Overall Health Score Calculation
Weighted average of all risk indices:
$$HealthScore = (Lifestyle \times 0.4) + (Cardio \times 0.2) + (Diabetes \times 0.15) + (Resp \times 0.15) + (Liver \times 0.10)$$

## 6. Dashboard Feature Logic
- **"Priority Warnings"**: A filter that triggers if any sub-score is $>65\%$.
- **"Wellness Score" Logic**: This is a dynamic metric that updates as a patient completes tasks in their **Care Pathway**, reflecting "Adherence Probability."

## 7. UI Components
- **RiskRadarChart**: Visualizes these scores in a relative layout.
- **Recommendation Engine**: Triggers `generateAgniRecommendations()` or `calculateLifestyleScore()` based on the highest risk quadrant.
