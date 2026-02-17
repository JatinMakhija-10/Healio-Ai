# Doctor Onboarding & Verification Process

## Overview
This document outlines the standardized process for onboarding new doctors to the Healio.AI platform. The goal is to ensure all medical practitioners are legitimate, verified, and legally authorized to practice before they can interact with patients.

## 1. Registration Flow (Doctor Side)
The onboarding process is a guided 4-step wizard designed to collect comprehensive credentials.

### Step 1: Personal Information
**Objective**: Establish identity and contact details.
- **Full Name**: Must match the name on the medical license.
- **Phone Number**: Verified via OTP (future enhancement) for secure communication.
- **Bio**: Professional summary visible to patients.

### Step 2: Professional Credentials
**Objective**: Capture medical qualifications for verification.
- **Specializations**: Primary and secondary areas of practice (e.g., Ayurveda, General Medicine).
- **Qualification**: Degrees held (e.g., MBBS, BAMS, MD).
- **Experience**: Years of active practice.
- **Medical License Number**: Unique identifier issued by the Medical Council (e.g., MCI/NMC/Ayush registration number).

### Step 3: Document Verification (Critical)
**Objective**: Collect proof of legitimacy.
- **Medical License / Registration Certificate**:
    - **Format**: PDF, JPG, PNG (Max 5MB).
    - **Requirement**: Clear, legible, non-expired official document.
- **Profile Photo**: Professional headshot for patient trust.

### Step 4: Practice Configuration
**Objective**: Set up the digital clinic.
- **Consultation Fee**: Standard fee per session.
- **Duration**: Default time per slot (15/30/45/60 mins).
- **Availability**: Weekly schedule configuration.

---

## 2. Verification Process (Admin Side)
Once a doctor submits their application, their account enters a `PENDING_VERIFICATION` state. They cannot accept appointments until approved.

### Admin Review Workflow
1.  **Application Queue**: Admins access the "Doctor Verification" queue in the Admin Dashboard.
2.  **Document Inspection**:
    *   View uploaded License Document.
    *   Verify the name on the document matches the profile name.
    *   Check for expiration dates and valid issuing authority stamps.
3.  **External Validation (Manual)**:
    *   Admins cross-reference the **License Number** with the respective national registry (e.g., National Medical Commission, Central Council of Indian Medicine).
4.  **Decision**:
    *   **Approve**: Account is activated. Doctor receives an email confirmation.
    *   **Request More Info**: Application is returned to the doctor with specific notes (e.g., "Upload clearer copy of license").
    *   **Reject**: Account is permanently disabled if fraud is detected.

## 3. Data Safety & Compliance
- **Secure Storage**: All license documents are stored in a restricted, private storage bucket (e.g., AWS S3 / Supabase Storage private buckets), accessible only by authorized admins.
- **Audit Logs**: All admin actions (approve/reject) are logged with timestamps and admin IDs for accountability.
- **Privacy**: Doctor's personal contact details (phone/email) are hidden from patients; communication occurs solely through the platform.

## 4. Post-Verification
- **Profile Badge**: Verified doctors receive a "Verified Practitioner" badge on their profile.
- **Search Visibility**: Only verified doctors appear in patient search results.
- **Monitoring**: Continuous monitoring of session quality and patient feedback. Flagged accounts may undergo re-verification.
