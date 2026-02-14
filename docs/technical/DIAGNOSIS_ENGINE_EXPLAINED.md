# Healio.AI Diagnosis Engine - Complete Technical Explanation

## Overview

Healio's diagnosis engine uses a **Bayesian inference approach** combined with **information gain-based questioning** to iteratively narrow down possible conditions. Think of it like a highly sophisticated game of "20 Questions" where each question is strategically chosen to eliminate the maximum number of possibilities.

---

## Architecture: The Complete Flow

```
User Input → Safety Check → Entity Extraction → Bayesian Scoring → Question Generation → Repeat
     ↓             ↓              ↓                    ↓                    ↓
  Symptoms    Red Flags    Normalize Terms    Calculate Probabilities   Ask Next Best Q
```

---

## Phase 1: Initial Symptom Intake

### What Happens
When you submit the intake form with:
- **Location** (e.g., "chest", "head")
- **Pain type** (e.g., "sharp", "burning")
- **Intensity** (1-10 scale)
- **Duration** (e.g., "2 days")
- **Additional notes** (free text)

### Behind the Scenes

#### 1. Medical NER (Entity Extraction)
```typescript
Input: "severe chest pain with shortness of breath"
↓
Medical NER extracts:
- "chest_pain" (normalized from "chest pain")
- "shortness_of_breath" (normalized from "shortness of breath")
- Severity: "severe"
```

The system has **200+ synonym mappings**:
- "tummy ache" → "abdominal_pain"
- "can't breathe" → "shortness_of_breath"
- "throwing up" → "vomiting"

#### 2. Negation Detection (NegEx Algorithm)
```typescript
Input: "I have a headache but NO fever"
↓
Detected:
- Present: ["headache"]
- Negated: ["fever"]
```

This is crucial! If a condition requires fever but you explicitly denied having it, that condition's probability drops significantly.

---

## Phase 2: Emergency Detection (Red Flag Scanning)

**Speed requirement: <200ms** ✅ (Currently: 0.50ms)

### How It Works
Before any diagnosis logic, the engine scans for **life-threatening patterns**:

```typescript
if (text.includes("chest") && (text.includes("sweat") || text.includes("arm"))) {
  → 🚨 CARDIAC EMERGENCY
  → STOP and display immediate action
}
```

**20+ emergency patterns** including:
- Cardiac (heart attack, aortic dissection)
- Neurological (stroke FAST symptoms, hemorrhage)
- Respiratory (severe distress, choking)
- Anaphylaxis (throat swelling, allergic reaction)
- Mental health crisis (988 hotline)

---

## Phase 3: Bayesian Inference - The Core Algorithm

### The Math Behind It

For each condition in the database (265 total conditions), the engine calculates:

```
P(Condition | Symptoms) ∝ P(Condition) × P(Symptoms | Condition)
     ↑                        ↑              ↑
  Posterior              Prior        Likelihood
```

#### Step 1: Prior Probability
Every condition has a **prevalence** (base rate):
```typescript
const PREVALENCE_PRIORS = {
  'very_common': 0.1,    // Common Cold
  'common': 0.05,        // Flu
  'uncommon': 0.01,      // Dengue
  'rare': 0.001,         // Meningitis
  'very_rare': 0.0001
};
```

Starting point: `logProb = log(prior)`

#### Step 2: Likelihood Updates

For each symptom you report, the engine adjusts the probability:

**If symptom is present:**
```typescript
// Example: Fever in Common Cold
symptomWeights: {
  "fever": {
    sensitivity: 0.8,   // 80% of cold patients have fever
    specificity: 0.6    // Fever is 60% specific to cold vs other conditions
  }
}

// High specificity = big boost
boost = 3.0 + (specificity - 0.5) × 4.0
logProb += boost
```

**If symptom is explicitly absent:**
```typescript
// Example: User says "NO fever"
if (sensitivity > 0.7) {
  // High-sensitivity symptom being absent is strong evidence AGAINST
  penalty = (sensitivity - 0.5) × 6.0
  logProb -= penalty
}
```

#### Step 3: Location Filtering (Performance Optimization)

Instead of scoring all 265 conditions, we pre-filter:
```typescript
User location: "chest"
↓
Only score conditions in chest bucket:
- Heart attack
- Acid reflux
- Shingles
- Pneumonia
- ...
(~30-40 conditions instead of 265)
```

This gives us **O(1) lookup** instead of O(n).

#### Step 4: Convert to Confidence Score

```typescript
// Convert log probability to 0-100 scale
sigmoid(z) = 1 / (1 + e^(-z))
confidence = sigmoid(logProb) × 100
```

Result:
```
Top conditions:
1. Common Cold - 87%
2. Flu - 65%
3. Sinusitis - 42%
```

---

## Phase 4: Information Gain Questioning (Akinator Strategy)

### The Problem
After initial scoring, top 3 conditions might all have 60-80% confidence. How do we differentiate?

### The Solution: Maximum Information Gain

For each possible question, calculate:
```
Information Gain = Current Entropy - Expected Entropy After Answer
```

#### Example Scenario
```
Current state:
- Migraine: 75%
- Tension Headache: 70%

Migraine has: nausea (90% sensitive)
Tension Headache does NOT have: nausea

Question: "Do you have nausea?"

If YES → Migraine jumps to 95%, Tension drops to 30% ✓ Big split!
If NO  → Tension jumps to 85%, Migraine drops to 40% ✓ Big split!

Information Gain: HIGH → Ask this question
```

#### Mimic Differentiation (Special Case)
When two conditions explicitly mimic each other:
```typescript
if (condition1.mimics.includes(condition2.id)) {
  // Find symptoms where they disagree
  // Prioritize those questions (cost = 0.1)
}
```

This is why the test shows: "Question targets differentiating symptoms (Nausea/Light Sensitivity)"

---

## Phase 5: Compound Questions

If multiple similar questions exist, bundle them:
```
Instead of:
Q1: "Do you have nausea?"
Q2: "Do you have light sensitivity?"
Q3: "Do you have visual auras?"

Ask:
"Are you experiencing any of the following?"
- Nausea or vomiting
- Sensitivity to light
- Visual disturbances (auras)
- None of the above
```

User picks multiple → All get added to symptom set.

---

## Phase 6: Iterative Refinement

### The Loop
```
1. User answers question
   ↓
2. Update symptom data:
   - If "Yes" → Add to symptoms
   - If "No" → Add to excludedSymptoms
   ↓
3. Re-run Bayesian scoring with new info
   ↓
4. If top confidence ≥ 90% → Present diagnosis
5. If ambiguous (top 2 within 15%) → Ask another question
6. If plateau detected (no good questions left) → Stop
```

### Plateau Detection
```typescript
if (bestQuestion.score > totalConfidence × 0.85) {
  // Even the best question won't help differentiate
  // All conditions share same symptoms
  → Stop asking, present best guess
}
```

---

## Phase 7: Final Diagnosis Presentation

### Confidence Interpretation
```
≥ 80%: "Your symptoms are most consistent with..."
60-79%: "This could be..., though other possibilities exist"
< 60%: "This could potentially be... but consult a doctor"
```

### Reasoning Trace (Explainability)
For each diagnosis, the engine provides:
```typescript
Reasoning Trace:
- Prior (common): +1.2
- Location: chest: +2.0
- Symptom (Weighted): burning: +5.0 (high specificity)
- Absent High-Sensitivity: no fever: -2.4
- Type Match: burning: +2.0
→ Final Score: 87%
```

This tells you **exactly why** it chose that diagnosis.

---

## Enhanced Features (New in Conversation Engine)

### 1. Emotional State Adaptation
```
Detected emotion: anxious
↓
Response: "I understand this is concerning. Let me help ease
your mind. [question]"
```

### 2. Communication Style Matching
```
Technical user: "Pneumonia is an inflammatory condition of the
lung parenchyma..."

Layperson: "Pneumonia is when your lungs get infected, like
having a bad cold in your lungs."
```

### 3. Empathetic Question Framing
```
Instead of: "Do you have chest pain?"

Now: "I need to ask about chest pain. This helps me understand
if we're dealing with a cardiac condition. Do you experience
chest pain?"
```

---

## Real-World Example: Step-by-Step

### User Input
```
Location: [chest]
Pain Type: burning
Intensity: 6/10
Duration: 2 hours
Notes: "worse after eating, feels like fire"
```

### Step 1: Entity Extraction
```
Extracted:
- chest_pain (from location)
- burning (from pain type)
- worse after eating (trigger)
```

### Step 2: Red Flag Scan (0.50ms)
```
Check: chest + burning?
→ Not an emergency pattern
→ Continue to diagnosis
```

### Step 3: Location Filter
```
Chest conditions (40 total):
- acid_reflux
- heart_attack
- shingles
- pneumonia
- ...
```

### Step 4: Bayesian Scoring
```
Acid Reflux:
  Prior: 0.05 (common) → logProb = -3.0
  Location: chest → +2.0
  Type: burning (specificity=0.9) → +5.6
  Trigger: after eating (specificity=0.95) → +5.8
  → Final: sigmoid(10.4) × 100 = 92%

Heart Attack:
  Prior: 0.01 (uncommon) → logProb = -4.6
  Location: chest → +2.0
  Type: burning (expected=crushing) → No boost
  Missing: sweating, arm pain → -3.0
  → Final: sigmoid(-5.6) × 100 = 12%
```

### Step 5: High Confidence → Diagnosis
```
Top Result: Acid Reflux (GERD) - 92%

Reasoning:
- Burning sensation matches (high specificity)
- Worse after eating (classic trigger)
- No cardiac red flags

Recommendation:
- Avoid trigger foods
- Antacids
- Elevate head while sleeping
- See doctor if persists >2 weeks
```

---

## Performance Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Emergency detection | <200ms | 0.50ms ✅ |
| Total response time | <2500ms | ~1200ms ✅ |
| Conditions in database | - | 265 |
| Synonym mappings | - | 200+ |
| Emergency patterns | - | 20+ |
| Test accuracy | >90% | 87.5% (7/8) |

---

## Why This Approach Works

1. **Bayesian Inference**: Mathematically sound probability updates
2. **Information Gain**: Asks the most useful questions first
3. **Location Filtering**: O(1) lookup instead of O(n)
4. **Negation Handling**: "No fever" is valuable information
5. **Explainability**: Shows reasoning trace
6. **Safety First**: Emergency detection in <1ms
7. **Context Awareness**: Adapts to user's emotional state

---

## Limitations & Safeguards

### What It Can Do
✅ Narrow down likely conditions
✅ Ask strategic questions
✅ Detect emergencies instantly
✅ Explain its reasoning

### What It Cannot Do
❌ Replace a doctor's physical examination
❌ Order lab tests or imaging
❌ Prescribe medications
❌ Provide legal medical diagnosis

### Safety Measures
- Always recommends consulting healthcare provider
- Transparent about confidence levels
- Immediate emergency routing for critical symptoms
- Crisis hotline for mental health emergencies

---

## Summary

The Healio diagnosis engine is a **multi-stage Bayesian inference system** that:

1. Extracts and normalizes medical entities from free text
2. Checks for emergencies in <1ms
3. Filters 265 conditions by location (O(1) lookup)
4. Scores each using Bayesian probability with sensitivity/specificity
5. Asks questions with maximum information gain
6. Iteratively refines until confident or plateau detected
7. Presents diagnosis with full reasoning trace

It's not magic—it's **math, medical knowledge, and strategic questioning** working together to help you understand your symptoms.
