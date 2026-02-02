import { supabase } from '@/lib/supabase';

export interface ClinicalNote {
    id: string;
    appointment_id: string;
    doctor_id: string;
    patient_id: string;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    prescriptions?: Prescription[];
    lab_tests?: LabTest[];
    follow_up_date?: string;
    follow_up_notes?: string;
    created_at: string;
    updated_at: string;
}

export interface Prescription {
    medicine: string;
    dosage: string;
    duration: string;
    instructions: string;
    frequency?: string;
}

export interface LabTest {
    test_name: string;
    reason: string;
    urgent?: boolean;
}

export interface CreateClinicalNoteData {
    appointment_id: string;
    doctor_id: string;
    patient_id: string;
    subjective?: string;
    objective?: string;
    assessment: string;
    plan: string;
    prescriptions?: Prescription[];
    lab_tests?: LabTest[];
    follow_up_date?: string;
    follow_up_notes?: string;
}

export interface UpdateClinicalNoteData {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    prescriptions?: Prescription[];
    lab_tests?: LabTest[];
    follow_up_date?: string;
    follow_up_notes?: string;
}

class ClinicalNotesService {
    /**
     * Create clinical notes for an appointment
     */
    async createClinicalNote(data: CreateClinicalNoteData): Promise<ClinicalNote> {


        const { data: note, error } = await supabase
            .from('clinical_notes')
            .insert({
                appointment_id: data.appointment_id,
                doctor_id: data.doctor_id,
                patient_id: data.patient_id,
                subjective: data.subjective,
                objective: data.objective,
                assessment: data.assessment,
                plan: data.plan,
                prescriptions: data.prescriptions || [],
                lab_tests: data.lab_tests || [],
                follow_up_date: data.follow_up_date,
                follow_up_notes: data.follow_up_notes
            })
            .select()
            .single();

        if (error) throw error;
        return note;
    }

    /**
     * Update existing clinical note
     */
    async updateClinicalNote(id: string, updates: UpdateClinicalNoteData): Promise<ClinicalNote> {


        const { data, error } = await supabase
            .from('clinical_notes')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get clinical note by appointment ID
     */
    async getClinicalNoteByAppointment(appointmentId: string): Promise<ClinicalNote | null> {


        const { data, error } = await supabase
            .from('clinical_notes')
            .select('*')
            .eq('appointment_id', appointmentId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    /**
     * Get all clinical notes for a patient
     */
    async getPatientClinicalNotes(patientId: string): Promise<ClinicalNote[]> {


        const { data, error } = await supabase
            .from('clinical_notes')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Get all clinical notes by a doctor
     */
    async getDoctorClinicalNotes(doctorId: string): Promise<ClinicalNote[]> {


        const { data, error } = await supabase
            .from('clinical_notes')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Get clinical note by ID
     */
    async getClinicalNoteById(id: string): Promise<ClinicalNote | null> {


        const { data, error } = await supabase
            .from('clinical_notes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    /**
     * Delete clinical note
     */
    async deleteClinicalNote(id: string): Promise<void> {


        const { error } = await supabase
            .from('clinical_notes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Get patient's medical history (timeline of clinical notes)
     */
    async getPatientMedicalHistory(patientId: string): Promise<ClinicalNote[]> {
        return this.getPatientClinicalNotes(patientId);
    }
}

export const clinicalNotesService = new ClinicalNotesService();
