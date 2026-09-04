# Healio.AI — Workspace Directory Structure & Maintenance Guide

> **Important Directive for Future Maintainers & AI Assistants:**  
> This document provides a complete, structured overview of every directory, subfolder, and core file in the **Healio.AI** codebase. Whenever new top-level folders, major modules, or key architecture scripts are created or modified, **this file MUST be updated** to reflect the new structure.

---

## 📁 Repository Overview

```
Healio.AI/
├── src/                      # Next.js App Router, React Components, Clinical Engine & APIs
├── docs/                     # Documentation, Architectural Specs, UX Audits & PDF Reports
│   ├── pdf_reports/          # Generated PDF Technical Dossiers, Pitch Guides & Architecture Reports
│   └── architecture/         # High-Level Architecture, Brand Context & UX Audit Specs
├── scripts/                  # Data Ingestion, Database Migrations, PDF Generators & Helpers
│   ├── generators/           # ReportLab Python PDF Generation Scripts
│   └── helpers/              # One-off Test Helpers & Maintenance Scripts
├── data/                     # Data Lakes, Formulations, Spreadsheets & Ingestion JSONs
│   └── spreadsheets/         # Essential Medicines List & Clinical Spreadsheets
├── logs/                     # Build Outputs, TypeScript Check Logs & Lint Audit Files
│   └── build_and_lint/       # Next.js Build Logs, Lint Reports & Diff Analysis Files
├── supabase/                 # Supabase Migrations, Vector Search RPCs & Database Schemas
├── backend/                  # Python & FastAPI Microservices / RAG Pipelines
├── e2e/                      # Playwright End-to-End Test Suite
├── public/                   # Static Assets, Icons, Images & Favicons
├── Books/                    # Classical Homeopathic & Ayurvedic Text Datasets
├── Medicines/                # Ingested Remedy & Drug Classification Archives
└── [Root Config Files]       # Next.js, TypeScript, ESLint, Tailwind, Sentry & Env Configs
```

---

## 🛠 Top-Level Directories & Key Files

### 1. `src/` — Primary Frontend & Clinical Application Code
The core TypeScript/React application built on Next.js App Router (v15+):

* **`src/app/`**: Next.js App Router pages and serverless API endpoints:
  * `src/app/api/chat/route.ts`: Core AI Chatbot API (handles Intent Routing, System Prompt Injection, Groq/Gemini fallbacks, and RAG context merge).
  * `src/app/api/diagnose/route.ts`: Bayesian Diagnostic Inference API.
  * `src/app/dashboard/`: Patient Dashboard, Chat UI, Consultation History, Assessment & Settings pages.
  * `src/app/doctor/`: Doctor Portal (Consultations, Appointments, Patient Review, Registration).
  * `src/app/onboarding/`: Interactive Medical Profile & Persona Builder wizard.
  * `src/app/admin/`: Admin Control Panel.

* **`src/components/`**: Reusable React UI Components:
  * `src/components/chat/`: Chat UI elements (`PainSliderWidget.tsx`, `MessageBubble.tsx`, `IntakeCard.tsx`, `SourcesDisclosure.tsx`, `MentalHealthAssessmentCard.tsx`).
  * `src/components/ui/`: Atomic Tailwind/shadcn components (Button, Modal, Card, Slider, Select, Badge).
  * `src/components/layout/`: Header, Sidebar, Navigation Bar, and Page Layout wrappers.

* **`src/lib/`**: Core Clinical Algorithms & Business Logic:
  * `src/lib/diagnosis/`:
    * `advanced/PersonaEngine.ts`: Deterministic patient profile parser (calculates BMI, WHO classes, Comorbidity flags, Medication flags, Polypharmacy risk, and 0–10 Clinical Frailty Index).
    * `advanced/MCMCEngine.ts`: Bayesian MCMC diagnostic engine with 12 groups of Covariate Prior ($\alpha$) Multipliers.
    * `orchestrator.ts`: Multi-stage diagnostic pipeline manager.
    * `ddi.ts`: Stateless Drug-Drug & Drug-Disease Interaction Safety Filter.
    * `dialogue/`: Dialogue state management (`DialogueState.ts`, `SymptomQuestionSchemas.ts`, `EmpatheticResponseGenerator.ts`).
  * `src/lib/chat/`: Chat utilities, `widgetDetection.ts` (detects pain slider, location picker, quick reply chips), and consultation history.
  * `src/lib/healthPersona.ts`: Merges Supabase `user_metadata.medical_profile` with local state.
  * `src/lib/rag/`: Vector search interfaces, Boericke Homeopathy RAG, Ayurvedic RAG, and `queryRewriter.ts`.
  * `src/lib/safety/`: Safety scanners (`redFlagDetector.ts`) and escalation managers.

* **`src/context/`**: React Context providers (`AuthContext.tsx`, `ChatContext.tsx`, `AppointmentContext.tsx`).
* **`src/hooks/`**: Custom React hooks (`useChat.ts`, `useDiagnosisChat.ts`, `useAuth.ts`).
* **`src/types/`**: Global TypeScript interfaces (`UserSymptomData`, `DiagnosisResult`, `PersonaProfile`).

---

### 2. `docs/` — Documentation & Architectural Dossiers
Contains all project documentation, audits, specs, and generated reports:

* **`docs/pdf_reports/`**: Formatted PDF dossiers generated via ReportLab:
  * `Healio_AI_Health_Persona_Impact_Analysis.pdf`: Comprehensive report on PersonaEngine, MCMCEngine, DDI safety, and LLM prompt rules.
  * `Healio_AI_Master_Pitch_and_Funding_Plan.pdf`: Investor deck & funding breakdown.
  * `Arovia_AI_Technical_Architecture.pdf`: Technical architecture dossier.
* **`docs/architecture/`**: Markdown design specs:
  * `AROVIA_BRAND_CONTEXT.md`, `AROVIA_REDESIGN_AUDIT.md`, `Arovia-AI-Product-UX-Audit.md`, `Arovia_Engine_Documentation.md`.
* **`docs/blueprint/`**, **`docs/business/`**, **`docs/schema/`**, **`docs/technical/`**: Detailed domain specifications.

---

### 3. `scripts/` — Database Ingestion & Maintenance Tools
Contains Python, TypeScript, and JavaScript maintenance scripts:

* **`scripts/generators/`**: Python PDF generation scripts (`generate_persona_pdf.py`, `generate_arovia_pdf.py`, `generate_pitch_prep_pdf.py`).
* **`scripts/helpers/`**: One-off helper & test scripts (`organize_workspace.mjs`, `commit_script.js`, `run_full_disease_test.mjs`, `test_long_chat.mjs`).
* Ingestion & Scrapers: Scripts for ingesting Ayurvedic texts (`ingest_ayurveda_pdfs.ts`), Boericke Homeopathy (`ingest_boericke.ts`), PubMed, and OpenFDA datasets.

---

### 4. `data/` — Knowledge Base & Dataset Spreadsheets
* **`data/spreadsheets/`**: Essential Medicines List (`Essential_Medicines_List_2013_Delhi.xlsx`) and clinical formulation tables (`cure_minor.xlsx`).
* Ingested JSON datasets: Traditional home remedies (`nuskhe.json`), homeopathic remedies, and medical knowledge bases.

---

### 5. `logs/` — Build, Lint & Execution Diagnostics
* **`logs/build_and_lint/`**: Output files from Next.js builds, TypeScript compilations (`tsc_output.txt`), ESLint JSON reports (`lint_report.json`), and git diff outputs (`HEAD_diff.txt`, `get_diff.txt`).

---

### 6. `supabase/` & `backend/` — Database & Microservices
* **`supabase/`**: Migrations (`migrations/`), SQL functions, PgVector embeddings setup, RLS security policies, and seed scripts.
* **`backend/`**: Python microservices for heavy clinical ML tasks or offline RAG processing.

---

## ⚙️ Root Configuration Files

| File Name | Description & Purpose |
| :--- | :--- |
| `package.json` | Project dependencies, npm scripts (`dev`, `build`, `lint`, `test`). |
| `tsconfig.json` | TypeScript compiler configuration and path aliases (`@/*`). |
| `next.config.ts` | Next.js framework configuration (images, redirects, headers, Sentry). |
| `.env.local` / `.env.example` | Local environment variables (Supabase URL, Groq API key, Gemini API key). |
| `vitest.config.ts` | Vitest unit test runner configuration. |
| `playwright.config.ts` | Playwright E2E browser test configuration. |
| `components.json` | shadcn UI component generator configuration. |
| `eslint.config.mjs` | ESLint rules and linting configuration. |
| `postcss.config.mjs` | PostCSS & Tailwind CSS processing. |
| `CLAUDE.md` / `AGENT.md` / `GEMINI.md` | Agentic AI guidelines and developer rules. |
| `README.md` | General project overview and startup guide. |

---

## 📌 Rules for Workspace Maintenance

1. **Keep Root Folder Clean**: Never leave one-off test files, temporary log outputs, or generated PDFs in the root directory. Place them into their designated subdirectories (`docs/pdf_reports/`, `scripts/helpers/`, `logs/build_and_lint/`).
2. **Never Delete Code or Configuration**: When organizing, always use `move` commands to preserve file history.
3. **Always Update This File**: If a new folder is created or a major feature directory is added under `src/`, `docs/`, `scripts/`, or `data/`, update `WORKSPACE_STRUCTURE.md` immediately.
