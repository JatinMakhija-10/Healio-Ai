# Agni Engine: Digestive Fire Assessment

## 1. Concept: The Root of Life
**What is Agni?**
In Ayurveda, Agni (Digestive Fire) is considered the primary biological fire that governs metabolism, digestion, and systemic intelligence. It is deemed more critical than Doshas in clinical prognosis.

## 2. The Algorithm: Multi-Factor Pattern Recognition
The engine (`src/lib/ayurveda/agni/agniAssessment.ts`) identifies Agni types by scoring five clinical physiological domains.

### Domain Scoring Logic
1. **Appetite Pattern**: Irregular (Vata), Burning (Pitta), Weak (Kapha).
2. **Digestion Speed**: Fast/Slow/Moderate.
3. **Post-Meal Sensation**: Lethargy vs. Burning vs. Lightness.
4. **Tongue Topography**: White coating (Kapha/Ama) vs. Yellow (Pitta).
5. **Stool Consistency**: Formation and frequency.

### Classification Matrix
| Agni Type | Sanskrit | Characteristic | Clinical Profile |
| :--- | :--- | :--- | :--- |
| **Sama** | Balanced | Constant | Optimal health, light after eating |
| **Vishama**| Irregular | Vata-driven | Bloating, gas, unpredictable hunger |
| **Tikshna** | Sharp | Pitta-driven | Acidity, "hangry", burning sensations |
| **Manda** | Weak | Kapha-driven | Heavy feeling, lethargy, slow metabolism |

## 3. Mathematical Strength Index
The engine calculates a `strength` metric (1-10) based on response correlations:
- **Index 9+**: Sama-Agni (Balanced).
- **Index 4-6**: Doshic provocations (Vishama/Manda).
- **Index < 3**: Critical Ama (toxin) accumulation.

## 4. Feature: Impact on Recovery pathways
Agni strength acts as a **Recovery Multiplier** in the Care Pathway Engine:
$$RecoveryDuration = BaseDuration \times AgniFactor$$
- **Sama Agni**: $0.85x$ (Accelerated recovery).
- **Manda Agni**: $1.20x$ (Delayed recovery due to poor nutrient absorption).

## 5. UI Actions & logic
- **"Start Agni Check"**: Triggers `assessAgni()` function.
- **"View Expected Improvements"**: Dynamically pulls strings from `getExpectedImprovements(type)` based on the calculated state.
