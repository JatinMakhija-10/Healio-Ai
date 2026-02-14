# Healio.AI Architecture & Logic Guide

Healio.AI is a sophisticated AI-driven health assistant that combines modern clinical diagnostic methods with traditional Ayurvedic wisdom. This document explains the system's architecture, technology stack, and its advanced diagnosis engine.

## 1. Technology Stack

Healio.AI is built using a modern, high-performance web stack:

*   **Framework:** [Next.js 15](https://nextjs.org/) (App Router) with [React 19](https://react.dev/).
*   **Language:** [TypeScript](https://www.typescriptlang.org/) for type safety across the engine and UI.
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) for a responsive, premium design.
*   **Animations:** [Framer Motion](https://www.framer.com/motion/) for smooth UI transitions and interactive elements.
*   **Components:** [Radix UI](https://www.radix-ui.com/) primitives for accessible UI components (dialogs, select, progress bars).
*   **Icons:** [Lucide React](https://lucide.dev/).

## 2. Database & Data Storage

Healio.AI uses a hybrid storage strategy to ensure both persistence and privacy:

### **A. Supabase (Cloud Database)**
*   **Role:** Primary persistent storage for authenticated users.
*   **Tech:** [Supabase](https://supabase.com/) (PostgreSQL) is used for Secure Authentication and storing User Profiles, Health Histories, and Onboarding data.
*   **Sync:** When a user logs in, their locally stored sessions are synced with the cloud.

### **B. LocalStorage (Client-Side Memory)**
*   **Role:** Anonymous storage and fallback mechanism.
*   **Function:** Guest users can perform diagnoses without an account. Their data is stored in the browser's `localStorage` so they don't lose progress if they refresh the page.

## 3. The Diagnosis Engine

The "brain" of Healio.AI is located in `src/lib/diagnosis/engine.ts`. It does not rely on simple "keyword matching" but uses a tiered clinical approach.

### **Phase 1: Intelligent Intake**
The UI uses an "Intake Card" that collects:
1.  **Location:** Where does it hurt? (Clickable Body Map).
2.  **Intensity:** 1-10 pain scale.
3.  **Nature:** Description of the sensation (sharp, dull, burning).
4.  **Duration:** How long has this been happening?

### **Phase 2: Safety First (Red Flags)**
Before any diagnosis, the engine scans for **Critical Red Flags**.
*   **Logic:** If keywords like "chest pain + sweating" or "stiff neck + severe headache" are detected, the system immediately halts and triggers an **Emergency Alert**.

### **Phase 3: The Bayesian Inference Engine**
Healio uses **Bayesian Probability** to rank conditions:
*   **Priors:** Each condition has a "prevalence" (e.g., Common Cold is common, Meningitis is rare). The engine starts with these "prior probabilities."
*   **Likelihoods:** As you provide symptoms, the engine updates the probability using **Sensitivity** and **Specificity**:
    *   *Sensitivity:* If 90% of people with a condition have "Fever," and you DON'T have a fever, the condition is penalized.
    *   *Specificity:* If "Burning sensation" is very unique to "Acid Reflux," having it gives a massive boost.
*   **Negation Handling:** The engine understands "No fever" or "I don't have a cough" and uses this to rule out conditions.

### **Phase 4: Iterative Questioning (Information Gain)**
Like the game "Akinator," the engine calculates which question will "split the field" most effectively.
*   It looks at the top candidate diseases and finds a symptom that one has and the other doesn't.
*   It asks that specific question to confirm or rule out the leading candidates.

## 4. Ayurvedic & Lifestyle Integration

Healio.AI is unique in how it integrates holistic health:

*   **Prakriti Engine:** During onboarding, users take a quiz that determines their **Dosha** (Vata, Pitta, Kapha).
*   **Diagnosis Influence:** A user's constitution (Prakriti) slightly weights the diagnosis results (e.g., Vata types are more prone to joint issues).
*   **Holistic Remedies:** For every diagnosis, the app provides:
    1.  Standard Medical Advice.
    2.  Indian Home Remedies (Dadi Maa ke Nuskhe).
    3.  Ayurvedic Balancing (Herbs and Diet).
    4.  Specific Exercises/Physiotherapy.

## 5. Application Flow summary

1.  **Onboarding:** Collects vitals (BMI) and determines Ayurvedic Constitution.
2.  **Health Dashboard:** Personalized health overview.
3.  **AI Chat Interface:** Conversational intake and iterative questioning.
4.  **Diagnosis:** Confidence-based ranking with reasoning traces (why the AI thinks this).
5.  **History:** All past records stored securely for future reference.
