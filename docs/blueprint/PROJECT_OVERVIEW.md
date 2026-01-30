# Healio.AI: Project Overview & Blueprint

## Executive Summary
Healio.AI is a next-generation healthcare platform that fuses ancient Ayurvedic wisdom with modern clinical intelligence. At its core, it aims to provide personalized health insights by understanding an individual's unique biological constitution (Prakriti) and current imbalances (Vikriti), while using an advanced Bayesian Diagnosis Engine to identify potential medical conditions.

---

## 1. System Architecture
Healio.AI uses a decoupled, event-driven architecture designed for high throughput and clinical safety.

### High-Level Architecture
(Refer to Mermaid diagram above)

### 2. Infrastructure Patterns
#### API Infrastructure
- **Pattern**: Repository Pattern using the `api` object in `src/lib/api.ts`.
- **Latency Target**: P95 < 150ms for engine inference.
- **Role-Based Access Control (RBAC)**: 
    - Implemented via Supabase JWT claims.
    - Custom hooks (`useAuth`) manage session persistence and role-specific redirection.

#### Database Relational Integrity
- **Engine**: PostgreSQL via Supabase.
- **Core Relationships**:
    - `profiles` 1:N `diagnoses` (Primary health history).
    - `doctors` 1:N `appointments` (Clinical scheduling).
    - `users` 1:1 `ayurvedic_profiles` (Constitution baseline).
- **Row-Level Security (RLS)**: Crucial for HIPAA-like compliance. No user can read another's health data unless a `verified_consultation` session exists.

### 3. Data Flow Logic
1. **Ingestion**: Raw symptoms captured via `src/app/dashboard/consult`.
2. **Standardization**: Symptoms mapped to standardized IDs.
3. **Inference**: Parallel execution of Ayurvedic and Clinical logic.
4. **Integration**: Ayurvedic profiles act as "weights" in the Clinical engine.
5. **Persistence**: Structured results stored in PostgreSQL.

## 2. The "What"
**What is Healio.AI?**
It is a comprehensive health management ecosystem consisting of:
- **Prakriti Engine**: Assesses your fundamental genetic/birth constitution.
- **Vikriti Calculation**: Tracks dynamic physiological and psychological imbalances.
- **Diagnosis Engine**: A hybrid clinical tool that combines symptom retrieval with probabilistic (Bayesian) scoring.
- **Three-Tier Dashboard System**: Automated workflows for Patients, Doctors, and Administrators.

## 3. The "How" (Technical Stack)
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Lucide Icons, Radix UI.
- **Backend/Database**: Supabase (PostgreSQL), Edge Functions for sensitive logic.
- **State Management**: React Context (`AuthContext`) and LocalStorage for offline-first symptom persistence.
- **Calculations**: Pure TypeScript engines in `src/lib/` for deterministic, testable logic.

## 4. Senior Architect Review: System Scalability & Safety
As Healio.AI moves from blueprint to production, the following architectural guardrails ensure clinical safety and system robustness.

### A. Clinical Safety Guardrails
- **Deterministic First**: Unlike LLMs, our core engines are pure TypeScript functions. This ensures the *exact* same input always yields the *exact* same diagnosis, critical for medical FDA/HIPAA compliance.
- **The Reasoning Trace**: Every calculation is logged in a `reasoning_trace`. If a doctor disagrees with the AI, the system can point to the specific symptom or correlate that drove the prediction.

### B. Scalability Architecture
- **Stateless Engines**: All inference logic is stateless, allowing it to run in **Supabase Edge Functions** (Deno) with sub-100ms cold starts.
- **Edge Search**: Knowledge base searches use pgvector with IVFFlat indexing, ensuring semantic symptom matching remains constant time ($O(1)$) even as the `conditions` table grows to 10k+ rows.

### C. Future Evolution
- **Wearable Ingestion**: The data schema is pre-built to ingest Apple Health/Google Fit data, which will act as continuous Vikriti inputs.
- **Nadi-Bot**: An upcoming integration for visual pulse diagnosis using smartphone camera sensors.

---

### Navigation
- [DATABASE_SCHEMA.md](file:///c:/Users/JATIN/Desktop/Healio.AI/docs/blueprint/DATABASE_SCHEMA.md)
- [CLINICAL_DECISION_RULES.md](file:///c:/Users/JATIN/Desktop/Healio.AI/docs/blueprint/CLINICAL_DECISION_RULES.md)
- [CARE_PATHWAY_LIBRARY.md](file:///c:/Users/JATIN/Desktop/Healio.AI/docs/blueprint/CARE_PATHWAY_LIBRARY.md)
- [Prakriti Engine](file:///c:/Users/JATIN/Desktop/Healio.AI/docs/blueprint/PRAKRITI_ENGINE.md)
- [Vikriti Calculation](file:///c:/Users/JATIN/Desktop/Healio.AI/docs/blueprint/VIKRITI_CALCULATION.md)
- [Diagnosis Engine](file:///c:/Users/JATIN/Desktop/Healio.AI/docs/blueprint/DIAGNOSIS_ENGINE.md)
- [Agni (Digestive Fire)](file:///c:/Users/JATIN/Desktop/Healio.AI/docs/blueprint/AGNI_ENGINE.md)
- [Health Risk Calculator](file:///c:/Users/JATIN/Desktop/Healio.AI/docs/blueprint/HEALTH_RISK_CALCULATOR.md)
