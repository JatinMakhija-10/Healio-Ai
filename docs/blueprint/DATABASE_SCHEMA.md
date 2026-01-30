# Database Schema: Relational Architecture & Security

## 1. Core Philosophy
Healio.AI uses a high-performance PostgreSQL schema hosted on Supabase. It prioritizes **Clinical Traceability** and **Data Isolation** via Row-Level Security (RLS).

## 2. Table Specifications
### A. `profiles`
- **Purpose**: Unified identity for Patients, Doctors, and Admins.
- **Keys**: `id` (UUID, primary, matches Auth.uid()).
- **Attributes**: `full_name`, `avatar_url`, `role` (enum: 'patient', 'doctor', 'admin').

### B. `doctors`
- **Purpose**: Medical professional credentials.
- **Relational**: 1:1 with `profiles` via `user_id`.
- **Attributes**: `license_number`, `specialty` (TEXT[]), `consultation_fee`, `is_verified` (BOOLEAN).

### C. `diagnoses`
- **Purpose**: Immutable records of health assessments.
- **Relational**: N:1 with `profiles`.
- **Attributes**:
    - `condition_id`: Mapping to knowledge base.
    - `confidence`: Point estimate (0-100).
    - `symptom_payload`: JSONB storage of raw inputs for auditability.
    - `reasoning_trace`: JSONB array of step-by-step logic.

### D. `appointments`
- **Purpose**: Real-time scheduling.
- **Attributes**: `scheduled_at`, `status` (enum), `doctor_id`, `patient_id`.

## 3. Security Layer: Row-Level Security (RLS)
The system implements a "Strict Isolation" policy:
- **Patient Access**: Can only `SELECT` from `diagnoses` and `appointments` where `patient_id = auth.uid()`.
- **Doctor Access**: Can only read data for patients who have a `confirmed` status appointment with them.
- **Audit Requirement**: Any `UPDATE` to a medical record triggers a database-level audit log.

## 4. Real-time Capabilities
Uses Supabase WebSockets to push updates:
- **Doctor View**: Instant notification when a patient enters the "Quick Consult" queue.
- **Patient View**: Real-time status changes for appointments (e.g., "Doctor is ready").

## 5. Knowledge Base Infrastructure
The `conditions` table uses pgvector for semantic symptom matching:
- **Symptom Embedding**: Symptoms are converted to 1536-dimensional vectors.
- **Search Logic**: Uses Cosine Similarity to find the closest medical hypothesis.
