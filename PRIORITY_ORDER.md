# Healio.AI Implementation Priority Order

This document outlines the strategic sequence for implementing the features defined in `REVENUE_STRATEGY.md`, `DOCTOR_DASHBOARD_SPEC.md`, and `ADMIN_DASHBOARD_SPEC.md`. It balances technical foundations with immediate revenue generation.

---

## 🟢 Priority 1: The Foundation & MVP Marketplace
**Goal**: Enable paid consultations and doctor onboarding.
**Business Value**: Immediate cash flow (20% commission) and professional validation.

### 1.1. Professional Infrastructure
- [ ] **RBAC (Role-Based Access Control)**: Define `ADMIN`, `DOCTOR`, and `PATIENT` roles in Supabase/Auth.
- [ ] **Doctor Profile System**: Database schema for specialty, bio, and availability.
- [ ] **Verification Portal (Admin)**: UI for admins to approve/reject doctor credentials.

### 1.2. The Consult Flow
- [ ] **Appointment Engine**: logic to link an AI Diagnosis session to a booking.
- [ ] **Payment Integration**: Stripe/Razorpay setup for escrow (Patient -> Healio -> Doctor).
- [ ] **The "Cockpit" (Doctor MVP)**: 
    - Appointment list view.
    - Basic "AI Summary" panel (Tab 1) fetching data from the linked AI session.
    - Simple chat/video interface.

### 1.3. Financial Oversight (Admin)
- [ ] **Transaction Ledger**: Basic view of GMV and Net Revenue (Commission).
- [ ] **Commission Controller**: Global setting for platform fee.

---

## 🟡 Priority 2: Subscription & Clinical Excellence
**Goal**: Launch "Healio Plus" (Consumer) and "Healio Pro" (Doctor SaaS).
**Business Value**: Predictable MRR (Monthly Recurring Revenue) and doctor retention.

### 2.1. Healio Plus (Consumer Sub)
- [ ] **Paywall UI**: Implementation of the "Healio Plus" landing page and gatekeeping logic.
- [ ] **Premium Features**: 
    - Full PDF report generation.
    - Family profile management.
    - Vikriti (Imbalance) long-term tracking.

### 2.2. Healio Pro (Doctor SaaS)
- [ ] **Smart SOAP Notes**: AI-assisted note-taking with auto-complete.
- [ ] **Clinical Sandbox**: Differential Diagnosis explorer for doctors to test hypotheses.
- [ ] **Patient Analytics**: Dashboard for doctors to see outcomes across their patient base.

---

## 🟠 Priority 3: Contextual Commerce (Ecosystem)
**Goal**: Convert diagnosis into sales.
**Business Value**: High-margin product commissions and user convenience.

### 3.1. The "Ayurvedic Amazon"
- [ ] **Product Database**: Mapping conditions/doshas to specific products (Herbs, Yoga tools).
- [ ] **Contextual UI**: "Add to Cart" recommendations directly inside the *Diagnosis Result Card*.
- [ ] **Admin CMS**: Marketplace management tool for remedies and products.

### 3.2. Lifecycle Marketing (Admin)
- [ ] **Cohort Targeting**: Automated coupon/advice delivery based on diagnosis history (e.g., "Back Pain" cohort).

---

## 🔴 Priority 4: Compliance, Data & Bio-Surveillance
**Goal**: Scale operations securely and leverage data at scale.
**Business Value**: B2B enterprise deals and platform integrity.

### 4.1. Privacy & Security
- [ ] **Anti-Leakage AI**: Monitor transcripts for off-platform payment attempts.
- [ ] **Audit Logs**: Immutable record of all medical data access (The "Black Box").
- [ ] **HIPAA/GDPR Compliance**: Full encryption for `clinical_notes`.

### 4.2. Strategic Insights
- [ ] **Epidemic Heatmap**: Geographic visualization of symptom clusters for government/enterprise sales.
- [ ] **RLHF Feedback Loop**: Interface for Medical Directors to compare AI vs. Human diagnosis to refine weights.

---

## Technical Dependencies (High-Level)
1. **Schema Update**: Must happen first (`doctors`, `appointments`, `clinical_notes`, `products`).
2. **Stripe Connect**: Required for the Marketplace (P1) and SaaS/Subs (P2).
3. **Speech-to-Text (Transcribe)**: Required for AI Scribe (P2) and Leakage Detection (P4).
