import { supabase } from "@/lib/supabase";

export interface PatientContext {
    // From AI Diagnosis
    chiefComplaint: string;
    aiDiagnosis: string;
    aiConfidence: number;
    matchedSymptoms: string[];
    redFlags: string[];

    // Ayurvedic Profile
    prakriti?: {
        dominant: string;
        secondary?: string;
        description: string;
    };
    vikriti?: {
        current: string;
        imbalance: string;
    };

    // History
    recentConditions: Array<{
        condition: string;
        date: string;
        confidence: number;
    }>;

    // Patient Info
    patientName: string;
    patientAge?: number;
    patientGender?: string;
}

/**
 * Get patient context for a consultation from the linked diagnosis
 */
export async function getPatientContext(
    diagnosisRefId: string,
    diagnosisSnapshot?: Record<string, unknown>
): Promise<PatientContext | null> {
    // If we have a snapshot, use it directly
    if (diagnosisSnapshot) {
        return parseSnapshotToContext(diagnosisSnapshot);
    }

    // Otherwise, try to fetch from localStorage or database
    // For now, return mock data - in production this would query the diagnoses table

    // Mock implementation
    return {
        chiefComplaint: "Severe headache on left side, 3 days duration",
        aiDiagnosis: "Migraine",
        aiConfidence: 0.92,
        matchedSymptoms: [
            "Unilateral headache",
            "Throbbing pain",
            "Photophobia",
            "Nausea",
        ],
        redFlags: [],
        prakriti: {
            dominant: "Pitta",
            secondary: "Vata",
            description: "Fire and air predominant constitution. Prone to heat-related issues.",
        },
        vikriti: {
            current: "Pitta",
            imbalance: "Excess heat accumulation detected",
        },
        recentConditions: [
            { condition: "Tension Headache", date: "2026-01-10", confidence: 0.78 },
            { condition: "Acid Reflux", date: "2025-12-20", confidence: 0.85 },
        ],
        patientName: "Priya Sharma",
        patientAge: 32,
        patientGender: "Female",
    };
}

/**
 * Parse a diagnosis snapshot into patient context
 */
function parseSnapshotToContext(snapshot: Record<string, unknown>): PatientContext {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = snapshot as any;

    return {
        chiefComplaint: s.chiefComplaint || s.symptoms?.description || "Not specified",
        aiDiagnosis: s.diagnosis?.condition || s.topDiagnosis?.name || "Unknown",
        aiConfidence: s.confidence || s.topDiagnosis?.confidence || 0,
        matchedSymptoms: s.matchedSymptoms || s.symptoms?.list || [],
        redFlags: s.redFlags || [],
        prakriti: s.ayurvedicProfile?.prakriti,
        vikriti: s.ayurvedicProfile?.vikriti,
        recentConditions: [],
        patientName: s.patientName || "Patient",
        patientAge: s.patientAge,
        patientGender: s.patientGender,
    };
}

/**
 * Get patient's full consultation history
 */
export async function getPatientHistory(patientId: string): Promise<Array<{
    id: string;
    date: string;
    diagnosis: string;
    doctor?: string;
    type: 'ai' | 'consultation';
}>> {
    // Mock implementation - would query appointments and diagnoses tables
    return [
        {
            id: "1",
            date: "2026-01-24",
            diagnosis: "AI Self-Diagnosis: Migraine",
            type: "ai",
        },
        {
            id: "2",
            date: "2026-01-10",
            diagnosis: "Tension Headache",
            doctor: "Dr. Sharma",
            type: "consultation",
        },
        {
            id: "3",
            date: "2025-12-20",
            diagnosis: "Acid Reflux",
            doctor: "Dr. Patel",
            type: "consultation",
        },
    ];
}

/**
 * Save clinical notes for an appointment
 */
export async function saveClinicalNotes(
    appointmentId: string,
    notes: {
        subjective?: string;
        objective?: string;
        assessment?: string;
        plan?: string;
    }
): Promise<boolean> {
    const { error } = await supabase
        .from('clinical_notes')
        .upsert({
            appointment_id: appointmentId,
            ...notes,
            updated_at: new Date().toISOString(),
        });

    if (error) {
        console.error('Error saving clinical notes:', error);
        return false;
    }

    return true;
}

/**
 * Get clinical notes for an appointment
 */
export async function getClinicalNotes(appointmentId: string): Promise<{
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
} | null> {
    const { data, error } = await supabase
        .from('clinical_notes')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

    if (error) {
        console.error('Error fetching clinical notes:', error);
        return null;
    }

    return data;
}
