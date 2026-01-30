# Admin Dashboard & "God Mode" Specification

## 1. High-Level Overview
The Admin Dashboard is the "Control Tower" for Healio.AI operations. It is restricted to internal super-admins and provides oversight on Users, Doctors, Finances, Clinical Quality, and Platform Integrity.

## 2. Core Modules & UI Architecture

### A. The "Pulse" (Home Screen)
*   **Live Metrics**:
    *   Active Utility: Current active users / Active consultations.
    *   Financials: Today's GMV (Gross Merchandise Value), Net Revenue (Commission).
    *   **Health Status**: System uptime, AI Engine latency (P99).
*   **Urgent Action Queue**:
    *   "3 Suspicious Consultations labeled 'High Risk'".
    *   "5 New Doctor Applications pending verification".

### B. User & Provider Management
*   **Doctor Verification Portal**:
    *   View uploaded licenses/certificates.
    *   Background check status integration.
    *   Action: `Approve`, `Reject (with reason)`, `Request More Info`.
*   **User Support Console**:
    *   Search user by Email/ID.
    *   View activity logs (e.g., "User X diagnosis history").
    *   **Impersonation Mode**: Securely "Log in as User" to debug issues (Read-Only).

### C. Financial & Marketplace Ops
*   **Transaction Ledger**:
    *   Real-time feed of all payments.
    *   Status: `Held`, `Released to Doctor`, `Refunded`.
*   **Commission Manager**:
    *   Global setting for Platform Fee (e.g., 20%).
    *   Custom overrides for specific top-tier doctors.
*   **Payouts**:
    *   Weekly automated settlement approval interface.

---

## 3. Compliance & "Leakage" Command Center (The Police)
*   **The "Flagged Sessions" Queue**:
    *   Filters: `Leakage Detected`, `Abusive Language`, `Medical Malpractice Risk`.
    *   **Review Interface**:
        *   Shows the exact part of the transcript where the trigger occurred.
        *   Shows the "Snipped Audio" clip.
        *   Action: `Dismiss` (False Positive) or `Confirm Violation` (Apply Strike).
*   **Ban Hammer**:
    *   One-click account suspension for confirmed violators.

---

## 4. Clinical Quality Assurance (RLHF Loop)
*   **The "Vignette" Manager**:
    *   Interface to upload "Golden Set" medical cases to test the AI.
*   **AI vs. Human Analysis**:
    *   Metric: **Disagreement Rate**.
    *   Alerts: "AI diagnosed 'Flu' but Doctor diagnosed 'Pneumonia' in 5 cases today." -> Triggers immediate review of the AI weights for Respiratory symptoms.

## 5. Content & Knowledge Base (CMS)
*   **Remedy Management**:
    *   CRUD interface for Herbs, Products, and Advice.
    *   "Blacklist": Temporarily disable a remedy if new research suggests risks.
*   **Push Notification Scheduler**:
    *   Send global health alerts (e.g., "Flu Season Warning").

## 6. Access Control
*   **Super Admin**: Full access.
*   **Support Agent**: Read-only User Management, no Financials.
*   **Medical Director**: Clinical QA only, no Financials.

## 7. Strategic Operations (God Mode)

### A. Epidemic Heatmap (Bio-Surveillance)
*   **Real-Time Map**: Visualizes symptom clusters geographically.
    *   *Insight*: "Spike in 'Respiratory Symptoms' detected in Mumbai (Pin Code 400050)."
*   **Value**: Early warning system for partners (Govt/Hospitals).

### B. Marketing & Campaign Manager
*   **Cohort Targeting**:
    *   "Send 10% off Yoga Coupon to all users with 'Back Pain' diagnosis in the last 30 days."
    *   *Ethical Guardrail*: Anonymized targeting (Marketing team sees numbers, not names).
*   **Win-Back Automation**: Auto-emails to users who haven't logged in for 90 days.

## 8. Technical & Forensic Oversight

### A. The "Black Box" (Audit Trail)
*   **Immutable Logs**: Every single click, view, and edit by ANY admin or doctor is recorded on blockchain/ledger.
*   **Use Case**: Legal defense. "Prove that Dr. X saw the allergy warning." -> "Here is the timestamped log."

### B. Feature Flag Configurator
*   **Global Kill-Switches**:
    *   "Disable 'Ayurvedic Mode' globally" (in case of regulatory update).
    *   "Maintenance Mode" for specific regions.
*   **A/B Testing Control**: Roll out new "Bayesian Engine V2" to only 5% of users.
