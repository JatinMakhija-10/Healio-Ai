# Doctor Dashboard: Clinical Management Interface

## 1. Goal: Evidence-Based Triage
The dashboard moves practitioners from "Data Review" to "Action" using AI-sorted prioritization.

## 2. Feature: The Triage Algorithm
The patient queue (`src/app/doctor/page.tsx`) uses a multi-variable sort:
1. **Red Flag Priority**: Any patient with `hasRedFlags: true` (from `scanRedFlags()`) is boosted to the top.
2. **Confidence-Severity Index**: Patients with high-confidence diagnoses of severe conditions are prioritized next.
3. **Wait Time**: Standard FIFO logic applied within risk tiers.

## 3. UI Actions & Button Logic
- **"Quick Consult" Button**: 
    - **Trigger**: Opens a pre-populated video consultation room.
    - **Backend**: Initializes a `consultation_session` in Supabase, linking the AI's `DiagnosisResult` to the Doctor's live notes.
- **"Review Now" Alert Button**: 
    - Only visible when `isUrgent` is true.
    - **Action**: High-priority shortcut to the patient's full medical reasoning trace.

## 4. Feature: AI-Assisted Consultation
When in a patient view:
- **Prakriti/Vikriti Gauge**: Renders the patient's current doshic state against their baseline.
- **"Confirm AI Diagnosis" Button**: 
    - **Logic**: One-click commitment of the AI-suggested condition to the patient's official electronic health record (EHR).
    - **State Change**: Updates `is_verified` status to `true` in the `diagnoses` table.

## 5. Security & RBAC Logic
The dashboard checks `src/lib/rbac.ts` on every mount:
- **Verified Doctors**: Access to PII (Patient Identifiable Information) and `Write` access to prescriptions.
- **Pending Doctors**: Read-only access to anonymized research data until admin approval.
