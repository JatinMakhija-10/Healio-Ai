# Healio.AI — Comprehensive Engine Documentation

This document outlines the end-to-end technical flow of how Healio.AI collects symptoms from users, processes them mathematically, runs them against validated medical decision rules, and generates highly individualized homeopathic medicine suggestions.

---

## Part 1: Architecture & Symptom Logic

### 1. The Conversational Flow (Symptom Collection)
**File:** `src/app/api/chat/route.ts`

Healio uses an AI conversational assistant (powered by Groq / Llama-3) acting as a warm, empathetic doctor.

#### Structured Questioning
The AI is strictly prompted to collect data across 9 distinct clinical dimensions, one question at a time. It never asks generic "yes/no" questions for critical data.
1. **Location:** Where exactly is the pain/problem?
2. **Sensation:** What does it feel like? (Burning, sharp, throbbing, dull)
3. **Duration:** How long has it been happening?
4. **Intensity:** On a scale of 1-10, how bad is the pain?
5. **Aggravations (Triggers):** What makes it worse? (Eating, cold, movement, time of day)
6. **Ameliorations (Relief):** What makes it better? (Rest, warm water, pressure)
7. **Associated Symptoms:** Any fever, nausea, fatigue alongside the main issue?
8. **Onset/History:** How did it start? Has this happened before?
9. **Stress/Sleep:** How are the patient's stress levels and sleep patterns?

#### Language Matching
The AI dynamically detects the user's language (Hindi, English, or Hinglish) and mirrors it precisely without asking the user to switch languages.

#### Generating the Payload
Once 7-9 questions are answered and enough context is gathered, the AI ends the conversation and packs the collected data into a structured `UserSymptomData` JSON object, moving the patient to the diagnosis phase.

---

### 2. Emergency Red Flag Detection
**File:** `src/lib/diagnosis/engine.ts`

Before any medicine is suggested, the `scanRedFlags(symptoms)` function intercepts the payload. It scans the raw keyword data against dozens of critical emergency patterns:
- **Cardiac:** Chest pain + sweating/arm pain (Heart Attack), Tearing chest/back pain (Aortic Dissection).
- **Neurological:** Face drooping + slurred speech (Stroke), Thunderclap headache (Brain bleed).
- **Respiratory:** "Can't breathe" + blue lips (Severe Asthma / Anaphylaxis).
- **Mental Health:** Suicidal ideation or self-harm keywords.

If a red flag is detected, the system immediately ceases diagnosis, issues a high-priority alert, and instructs the user to seek emergency medical care (e.g., Call 911).

---

### 3. The Backend Diagnosis Pipeline (Symphony Knowledge Fusion)
**File:** `src/app/api/diagnose/route.ts`

If no red flags are found, the data is pushed to the advanced Diagnosis API. This pipeline is the brain of Healio, merging statistical math, classical homeopathy literature, and Generative AI. 

It executes in **five steps**:

#### Step A: Bayesian MCMC Statistical Inference
**File:** `src/lib/diagnosis/advanced/MCMCEngine.ts`
Before asking the AI for an opinion, Healio runs a purely mathematical **Metropolis-Hastings algorithm** (Markov Chain Monte Carlo). 
- It looks at the patient's symptoms and calculates the posterior probability of hundreds of conditions based on hardcoded *Sensitivity*, *Specificity*, and *Prevalence* metrics.
- It detects symptom correlations (e.g., Right-sided pain + Nausea = High probability of Appendicitis or Gallbladder issues).
- It outputs a ranked list of "Priors" (top condition candidates) along with a 95% Credible Interval (uncertainty metric) to prove mathematical confidence.

#### Step B: Multi-Query RAG Retrieval (Boericke's Materia Medica)
To ensure the AI doesn't hallucinate remedies, Healio searches a vector database containing **Boericke’s Materia Medica** (the foundational textbook of homeopathy).
- It embeds the patient's symptoms AND the top mathematical candidates (from Step A) using Gemini Embeddings.
- It queries Supabase via semantic search (`match_boericke_embeddings`) to fetch the exact textbook paragraphs that match the patient's unique modalities (e.g., "headache worse from sunlight, better in a dark room").

#### Step C: The Enriched Prompt
The system constructs a massive "Super-Prompt" containing:
- The Patient's raw symptoms and profile.
- The Bayesian MCMC statistical results (Step A).
- The verbatim text from Boericke's Materia Medica (Step B).
- Any minor clinical alerts or rules triggered.

#### Step D: Dynamic-Temperature AI Inference
The Enriched Prompt is sent to **Groq (Llama-3.3-70B)** (with **Gemini 2.5 Flash** as an automatic fallback).
- **Dynamic Temperature:** If the Bayesian math (Step A) was highly confident, the AI temperature is set lower (`0.1`) forcing it to strictly obey the math. If the math was uncertain, the temperature is raised (`0.4`), allowing the AI to think creatively and act as a differential diagnostician.
- The AI acts as the final judge, comparing the mathematical hypotheses against the textbook literature to produce the final JSON output.

#### Step E: Smart Question Override (Information Gain)
If the AI returns a diagnosis but its confidence is below 75%, Healio uses an **Entropy-Reduction Algorithm** (`InformationGainSelector`). 
Rather than guessing, it calculates which single medical question would mathematically divide the remaining condition probabilities in half, overrides the AI's diagnosis, and asks the user that specific follow-up question.

---

### 4. Medicine Suggestion Logic (Remedies)
The actual selection of the 5 homeopathic medicines occurs during **Step D**. The AI is strictly instructed to:
1. Prioritize remedies found in the retrieved Boericke RAG chunks.
2. Cross-reference the remedies against the mathematical Bayesian candidates.
3. Ensure the selection matches the patient's distinct **Modalities** (e.g., if the user stated "warm water gives relief", the AI must suggest remedies indicated for heat-amelioration, like *Arsenicum Album* or *Magnesia Phosphorica*).
4. Output the exact **Potency** (e.g., 30C, 200C) and **Dosage** (e.g., 4 pills every 3 hours) based on the severity and chronicity of the symptoms.
5. Provide a rationale (`indication`) explaining *why* this specific medicine was chosen based on the user's exact words.

*(It also simultaneously queries an Indian Home Remedies database to provide supportive Ayurvedic/Kitchen measures like Ginger Tea or Turmeric milk based on the symptoms).*

---
---

## Part 2: Rule Engine & Logic Flow

This section specifically explains the **decision-making brain** of Healio: how it knows when to ask questions, when to stop chatting, and how rigid clinical rules are applied to the conversational data.

### 1. When to Ask Questions vs. When to Stop (The Chat Loop)
The decision to chat vs. stop is primarily governed dynamically by the **Prompt Engine**, with a hard-coded mathematical override acting as a safety net.

#### A. The LLM Stopping Condition (`useChat.ts` & `/api/chat`)
The conversational AI is strictly prompted to collect data across **9 specific dimensions**.
- It is instructed to ask only **ONE question per message**.
- **When it stops:** The prompt explicitly states: `WHEN YOU HAVE ENOUGH INFORMATION (after 7-9 questions): Tell the user you have enough information - Generate the final diagnosis as a STRICT JSON object wrapped in \`\`\`json`.
- **The Interception:** In the frontend (`useChat.ts`), the system constantly watches the AI's streaming response. The moment it detects ````json` in the response, it intercepts the data, gracefully ends the chat UI, saves the payload locally and to Supabase, and triggers the transition to the Diagnosis screen.

#### B. The Information Gain Override (The Safety Net)
Sometimes, the LLM thinks it has enough data (after 9 questions), but the backend diagnosis engine disagrees.
If the AI generates a final diagnosis but its internal `confidence` score is **< 75%** AND there are multiple statistically probable conditions (from the Bayesian MCMC engine), the system triggers the `InformationGainSelector`.
- **How it works:** It uses **Shannon Entropy mathematical formulas** on the remaining condition probabilities. It simulates: *"If I ask the patient if they have X symptom, how much will that reduce my uncertainty?"*
- **The Override:** It selects the single question that yields the highest information gain, deletes the AI's final diagnosis, and replaces it with this generated question. This effectively kicks the user back into the chat loop to answer the tie-breaking question.

---

### 2. When and How Logic is Applied

As the symptoms are gathered and finalized, the system runs the raw text and keywords through several **deterministic logical engines** before doing any generative AI guesswork.

#### A. The Emergency Red Flag Scanner
**When it runs:** Immediately after the chat stops, before entering the diagnosis pipeline.
**Logic Applied:** It scans for highly specific, hard-coded combinations of words indicating immediate life threats.
- *Example:* If text includes `chest` AND (`sweat` OR `arm` OR `crushing`), it immediately flags: `🚨 CARDIAC EMERGENCY: Call 911.`
- *Example:* If text includes `face` AND `droop`, it flags a Stroke warning.
If flagged, it surfaces these alerts at the very top of the diagnosis to ensure the user seeks immediate IRL help.

#### B. Validated Clinical Decision Rules (The Rule Engine)
**When it runs:** During the diagnosis phase, operating passively in the background (`ClinicalDecisionRules.ts`).
**Logic Applied:** Healio implements real-world, peer-reviewed emergency medicine scoring algorithms. Instead of relying on an AI to "guess" if someone has Deep Vein Thrombosis, the system uses the exact formulas doctors use.
- **Wells Score (for DVT):** If the user mentions leg swelling, the engine applies the Wells Criteria (+1 for active cancer, +1 for bedridden, +1 for entire leg swollen, etc.). If the score is $\ge$ 3, it definitively flags "DVT Likely (High Probability) - Compression ultrasonography recommended."
- **PERC Rule (for Pulmonary Embolism):** Evaluates 8 criteria. If all 8 are absent, it mathematically rules out a PE without needing clinical testing.
- **HEART Score (for Cardiac Events):** Evaluates history, age, risk factors (hypertension, smoking, diabetes) to calculate the 6-week risk of a Major Adverse Cardiac Event.
- **NEXUS & Ottawa Ankle Rules:** Used to logically deduce if X-rays are actually necessary following a trauma event.

These rule engines output a definitive `RuleResult` with a calculated score, interpretation, and confidence metric. These hard-coded, medically validated results are forcibly injected into the final prompt alongside the Boericke textbook references to ensure the Generative AI does not deviate from established medical protocols.
