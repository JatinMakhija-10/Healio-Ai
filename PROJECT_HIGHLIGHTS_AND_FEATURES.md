# Healio.AI - Project Highlights & Features

## 🌟 Executive Summary
Healio.AI is a next-generation healthcare platform that bridges the gap between modern clinical precision and ancient Ayurvedic wisdom. Unlike standard symptom checkers that rely on static decision trees, Healio.AI uses a **Bayesian Probabilistic Engine** to calculate condition probabilities and a **Holistic Integration Layer** to provide personalized care based on a user's unique constitution (Prakriti).

**Mission**: To democratize access to high-quality, personalized healthcare that treats the individual, not just the symptom.

---

## 🚀 Key Highlights (The "Wow" Factors)

1.  **Thinking AI, Not Scripted**: The diagnostic engine uses **Bayesian Inference** (Math) rather than simple `if/then` coding. It understands disease prevalence ("priors") and symptom "likelihoods" to think like a doctor.
2.  **Hypersonic Safety Layer**: A dedicated safety engine scans user inputs in **<100ms** for life-threatening "Red Flags" (e.g., heart attack, stroke, suicide risk) and immediately triggers an emergency override, bypassing the AI to potentially save lives.
3.  **East Meets West**: The only platform that combines FDA-level clinical protocols (Wells Score, HEART Score) with authentic Ayurvedic Prakriti analysis (Vata/Pitta/Kapha) for a truly holistic diagnosis.
4.  **Bio-Surveillance**: An admin-facing **Epidemic Heatmap** capable of detecting disease outbreaks geographically before they reach hospitals.

---

## 🩺 Patient-Facing Features

### 1. Intelligent Symptom Triage
*   **Dynamic Interview**: The AI uses "Information Gain" to ask the *one* question that most effectively narrows down the diagnosis, mimicking a skilled clinician ("The Akinator Strategy").
*   **Natural Language Understanding**: Understands negation ("no fever"), synonyms ("puke" -> "nausea"), and context ("chest pain after gym" vs "chest pain while resting").
*   **Uncertainty Quantification**: Doesn't just guess; provides confidence intervals (e.g., "80% confident") and explains *why* it reached a conclusion (Reasoning Trace).

### 2. Holistic Onboarding (Prakriti Analysis)
*   **Dosha Assessment**: A dedicated engine determines the user's birth constitution (Prakriti) – **Vata**, **Pitta**, or **Kapha** – based on physical structure, skin type, metabolism, and temperament.
*   **Personalized Recommendations**: Diagnosis results are tailored to the user's Prakriti (e.g., "Since you have a Vata imbalance, avoid cold foods for this condition").

### 3. Comprehensive Dashboard
*   **Health History**: Tracks past diagnoses and symptom progression over time.
*   **Vitals Tracking**: Monitors key metrics like BMI, sleep patterns, and lifestyle risks.
*   **Family Health**: Manages profiles for family members under one account.

### 4. Appointment Booking
*   **Find Specialists**: Integrated search for doctors and holistic practitioners.
*   **Real-Time Availability**: View doctor slots and book appointments instantly.

---

## 👨‍⚕️ Provider-Facing Features (Healio Pro)

### 1. Doctor Dashboard
*   **AI-Assisted Intake**: Doctors receive an AI-generated summary of the patient's symptoms, valid red flags, and preliminary diagnosis *before* the consultation starts.
*   **Patient Analytics**: Visualizations of patient recovery trends and adherence to care plans.
*   **Schedule Management**: Comprehensive calendar view for managing appointments and availability.

### 2. Practice Management
*   **Verified Profiles**: Secure storage for medical licenses and certifications.
*   **Inbox & Communication**: Secure messaging channel with patients.

---

## 🛡️ Admin & Strategic Features

### 1. Epidemic Intelligence
*   **Real-Time Heatmap**: A geospatial dashboard that visualizes symptom clusters (e.g., "Cluster of high fever in North Delhi") to predict potential outbreaks.
*   **Strategic Insights**: KPI cards tracking National Risk Level, Active Clusters, and Affected Population estimates.

### 2. Platform Management
*   **User & Doctor Management**: Tools to verify doctors, manage user accounts, and handle disputes.
*   **Clinical Q&A**: System for medical experts to review and improve the AI's question bank.

---

## 🧠 The Diagnosis Engine (Technical Deep Dive)

The core of Healio.AI is located in `src/lib/diagnosis/engine.ts`. It is a sophisticated system comprising:

*   **Bayesian Inference Core**: Calculates $P(Condition | Symptoms)$ using standard epidemiological priors.
*   **Symptom Correlation Detector**: Identifies "syndromes" where symptoms occurring together (e.g., "Fever + Stiff Neck") imply a higher probability than the sum of their parts.
*   **Clinical Decision Rules**: Implements validated medical scoring systems (e.g., Wells Score for DVT) as hard logic overrides.
*   **Negation & Synonym Handling**: Advanced regex-based NLP transforms raw user text into structured "Safe Text" for analysis.
*   **Ayurvedic Boosters**: The engine gives probability boosts to conditions that align with the user's Prakriti (e.g., Joint pain in a Vata individual).

---

## 💻 Technology Stack

*   **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion.
*   **Language**: TypeScript (Strict Mode) for enterprise-grade reliability.
*   **Database**: Supabase (PostgreSQL) with Row Level Security (RLS).
*   **Architecture**: Modular Service-Based Architecture (Diagnosis Service, Appointment Service, User Service).
