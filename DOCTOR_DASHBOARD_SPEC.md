# Doctor Dashboard & Consultation System Specification

## 1. High-Level Architecture
The Doctor Dashboard is a "Provider-Facing" React application (or a dedicated route within the main app) that acts as the command center for medical professionals. It tightly integrates with the core `Healio.AI` diagnosis engine.

### Core Philosophy
*   **"AI as Copilot, Not Autopilot"**: The dashboard never overrides the doctor; it augments them with data.
*   **"Context is King"**: Every view is pre-populated with the patient's AI diagnosis, Vikriti (Ayurvedic profile), and medical history.

---

## 2. User Interface (UI) Design

### A. The "Cockpit" Layout (Main Dashboard)
*   **Sidebar Navigation**:
    *   `My Schedule` (Today's appointments).
    *   `Patient List` (EMR - Electronic Medical Records).
    *   `Inbox` (Async chats with patients).
    *   `Analytics` (Revenue, outcome tracking).
*   **Global Search**: "Search patient by name, symptom, or diagnosis (e.g., 'All patients with Migraine')".

### B. The "Active Consultation" View (The Consultation Room)
This is the most critical screen. It activates when a video call starts.
*   **Split-Screen Layout**:
    *   **Left Panel (60% - Video/Communication)**:
        *   HD Video Feed (Twilio/WebRTC).
        *   Chat overlay for sending quick links/files.
    *   **Right Panel (40% - Clinical Context & AI)**:
        *   **Tab 1: AI Summary (The "Handoff")**:
            *   *Chief Complaint*: "Severe headache, left side."
            *   *AI Provisional Diagnosis*: "Migraine (Confidence: 92%)".
            *   *Vikriti*: "High Pitta (Heat) detected."
            *   *Red Flags*: "No neurological deficits reported."
        *   **Tab 2: Smart SOAP Note**:
            *   An editor that auto-completes medical terms.
            *   **AI Scribe**: Listens to the conversation (Speech-to-Text) and drafts the "Subjective" and "Objective" sections automatically.

### C. The "Patient Profile" Deep Dive
*   **Timeline View**: A vertical timeline showing every interaction:
    *   `Jan 24`: AI Self-Diagnosis (Flu).
    *   `Feb 10`: Video Consult (Dr. Sharma).
    *   `Feb 15`: Follow-up Chat (Reported improvement).
*   **Ayurvedic Chart**: A visual radar chart showing the patient's Prakriti vs. current Vikriti.

---

## 3. Backend Architecture & Data Model

### A. Database Schema (Supabase/PostgreSQL)

```sql
-- The Professional
TABLE doctors (
  id UUID PRIMARY KEY,
  specialty TEXT[], -- ['General', 'Ayurveda']
  verified BOOLEAN,
  availability JSONB -- { "mon": ["09:00", "12:00"] }
);

-- The Connection
TABLE appointments (
  id UUID PRIMARY KEY,
  doctor_id UUID REFERENCES doctors,
  patient_id UUID REFERENCES users,
  diagnosis_ref_id UUID REFERENCES diagnoses, -- LINK TO AI SESSION
  status TEXT, -- 'scheduled', 'completed', 'cancelled'
  starts_at TIMESTAMP
);

-- The Clinical Record
TABLE clinical_notes (
  id UUID PRIMARY KEY,
  appointment_id UUID REFERENCES appointments,
  subjective TEXT, -- Patient's words
  objective TEXT, -- Doctor's findings
  assessment TEXT, -- Final diagnosis
  plan TEXT, -- Rx and instructions
  encrypted_data TEXT -- HIPAA/GDPR compliance
);
```

### B. API Logic
*   `GET /doctor/dashboard/summary`: Fetches today's count, urgent alerts.
*   `GET /patient/{id}/context`: **CRITICAL ENDPOINT**. 
    *   Fetches the *latest* `diagnosis_result` from the AI engine.
    *   Summarizes it into `ChiefComplaint` and `RiskFactors` for the doctor.

---

## 4. Workflows & Integration

### A. The "Handshake": Mixing Diagnosis with Dashboard
How the AI session becomes a Doctor's starting point:

1.  **User Side**: User finishes AI diagnosis. Result: "Consult Recommended". User clicks "Book Dr. Sharma".
2.  **System Side**: 
    *   Creates an `Appointment`.
    *   Links the `DiagnosisID` to this appointment.
    *   **"Freezing the Context"**: The system takes a snapshot of the user's answers and symptoms at *that moment* and attaches it to the appointment receipt.
3.  **Doctor Side (Pre-Consult)**:
    *   Doctor opens the appointment 5 mins early.
    *   Dashboard calls `get_diagnosis_summary(DiagnosisID)`.
    *   Doctor sees: "Patient John. Likely *Acid Reflux*. *Pitta* aggravated. Warned about spicy food."
    *   **Benefit**: Doctor doesn't ask "What brings you here?". They ask "I see you're having reflux since Tuesday, is that right?". *This builds immense trust.*

### B. The Consultation (Live)
*   **AI Assist**: As the doctor talks, the AI suggests codes (ICD-10 or Ayurveda equivalent).
    *   *Doctor says*: "I suspect IBS."
    *   *UI Prompt*: "Tag as: Irritable Bowel Syndrome (K58.0)? [Yes/No]"

### C. Follow-Ups & Client Chats
*   **Automated Check-ins**:
    *   3 Days later, system sends push notification to patient: "How is your pain 1-10?"
    *   **Dashboard Alert**: If pain > 6, the Patient Card turns **RED** in the doctor's dashboard.
*   **Async Chat**:
    *   Patient can ask 1 follow-up question.
    *   Doctor uses "Quick Replies" generated by AI (e.g., "Yes, continue the medication for 2 more days").

## 5. Security & Privacy
*   **Role-Based Access (RBAC)**: Doctors can ONLY see patients they have appointments with.
*   **Audit Logs**: Every view of a patient's medical record is logged ("Dr. X viewed Patient Y at [Time]").

## 6. Platform Integrity & Compliance

### A. Session Recording & Transcription
*   **Secure Archival**: All video consultations are automatically recorded and stored in an encrypted S3 bucket (HIPAA compliant).
*   **Auto-Transcription**: A dedicated AI service generates a verbatim transcript immediately after the call ends.
    *   *Purpose*: Medical legality, quality assurance, and dispute resolution.

### B. "Anti-Leakage" Detection (Platform Leakage)
*   **Real-Time Monitoring**: The separate "Compliance AI" analyzes the live transcript stream.
*   **Detection Logic**: Scans for patterns indicating attempts to take the transaction off-platform.
    *   **Keywords**: "Venmo", "Zelle", "Paytm", "Google Pay", "Call me directly", "My personal number is", "Discount offline".
    *   **Pattern Matching**: Regex detection for phone numbers and email addresses exchanged in chat/audio.
*   **Enforcement Actions**:
    *   **Warning**: Real-time pop-up to the doctor: "Sharing personal contact info is a violation of ToS."
## 7. Advanced Clinical Tools (The "Super-Doctor" Suite)

### A. Differential Diagnosis Explorer ("The Sandbox")
*   **What**: An interactive tool for doctors to test hypotheses.
*   **Action**: Doctors can toggle symptoms On/Off to see how the AI's probability shifts.
    *   *Doctor*: "What if the patient *didn't* have a fever?"
    *   *AI*: "Probability of Dengue drops from 80% to 15%. Top diagnosis becomes Tension Headache."
*   **Value**: Helps doctors validate their gut feelings against statistical data.

### B. Integrated Referral Network
*   **One-Click Handoff**:
    *   Doctor can press "Refer to Specialist".
    *   System matches with the best-rated available specialist (e.g., General Physician -> Cardiologist).
    *   **Data Packet Transfer**: The entire consultation context + notes are securely transferred to the new doctor's dashboard.

## 8. Workflow Enhancements

### A. Patient Education Hub
*   **Content Library**: Access to 500+ verified PDFs/Videos (e.g., "Yoga for Back Pain", "Post-Viral Diet").
*   **Action**: "Prescribe Content" - Send a video link directly to the patient's chat.
*   **Tracking**: See if the patient actually opened/watched the content.

### B. Smart Schedule Optimizer
*   **AI Triage**: Automatically groups similar cases or prioritizes urgent ones.
*   **Gap Filling**: If a patient cancels, the system automatically notifies waitlisted users to fill the slot.
