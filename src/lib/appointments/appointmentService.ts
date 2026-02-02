import { supabase } from '@/lib/supabase';

export interface Appointment {
    id: string;
    doctor_id: string;
    patient_id: string;
    diagnosis_ref_id?: string;
    status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
    appointment_type: 'video' | 'chat' | 'follow_up';
    scheduled_at: string;
    started_at?: string;
    completed_at?: string;
    duration_minutes: number;
    consultation_fee: number;
    payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateAppointmentData {
    doctor_id: string;
    patient_id: string;
    diagnosis_ref_id?: string;
    scheduled_at: string;
    consultation_fee: number;
    appointment_type?: 'video' | 'chat' | 'follow_up';
    duration_minutes?: number;
    notes?: string;
}

export interface UpdateAppointmentData {
    status?: Appointment['status'];
    started_at?: string;
    completed_at?: string;
    payment_status?: Appointment['payment_status'];
    notes?: string;
}

class AppointmentService {
    /**
     * Create a new appointment
     */
    async createAppointment(data: CreateAppointmentData): Promise<Appointment> {


        const { data: appointment, error } = await supabase
            .from('appointments')
            .insert({
                doctor_id: data.doctor_id,
                patient_id: data.patient_id,
                diagnosis_ref_id: data.diagnosis_ref_id,
                scheduled_at: data.scheduled_at,
                consultation_fee: data.consultation_fee,
                appointment_type: data.appointment_type || 'video',
                duration_minutes: data.duration_minutes || 30,
                notes: data.notes,
                status: 'scheduled',
                payment_status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        return appointment;
    }

    /**
     * Get appointments for a doctor
     */
    async getDoctorAppointments(doctorId: string, filters?: {
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<Appointment[]> {


        let query = supabase
            .from('appointments')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('scheduled_at', { ascending: false });

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        if (filters?.startDate) {
            query = query.gte('scheduled_at', filters.startDate);
        }

        if (filters?.endDate) {
            query = query.lte('scheduled_at', filters.endDate);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    }

    /**
     * Get appointments for a patient
     */
    async getPatientAppointments(patientId: string): Promise<Appointment[]> {


        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', patientId)
            .order('scheduled_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Get a single appointment by ID
     */
    async getAppointmentById(id: string): Promise<Appointment | null> {


        const { data, error } = await supabase
            .from('appointments')
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
     * Update appointment
     */
    async updateAppointment(id: string, updates: UpdateAppointmentData): Promise<Appointment> {


        const { data, error } = await supabase
            .from('appointments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Mark appointment as started
     */
    async startAppointment(id: string): Promise<Appointment> {
        return this.updateAppointment(id, {
            status: 'in_progress',
            started_at: new Date().toISOString()
        });
    }

    /**
     * Mark appointment as completed
     */
    async completeAppointment(id: string): Promise<Appointment> {
        return this.updateAppointment(id, {
            status: 'completed',
            completed_at: new Date().toISOString()
        });
    }

    /**
     * Cancel appointment
     */
    async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
        return this.updateAppointment(id, {
            status: 'cancelled',
            notes: reason
        });
    }

    /**
     * Get today's appointments for a doctor
     */
    async getTodaysAppointments(doctorId: string): Promise<Appointment[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.getDoctorAppointments(doctorId, {
            startDate: today.toISOString(),
            endDate: tomorrow.toISOString()
        });
    }

    /**
     * Get completed appointments for doctor (for revenue tracking)
     */
    async getCompletedAppointments(doctorId: string, startDate?: string, endDate?: string): Promise<Appointment[]> {
        return this.getDoctorAppointments(doctorId, {
            status: 'completed',
            startDate,
            endDate
        });
    }
}

export const appointmentService = new AppointmentService();
