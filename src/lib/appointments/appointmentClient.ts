import { supabase } from "@/lib/supabase";

export interface Appointment {
    id: string;
    patient_id: string;
    doctor_id: string;
    diagnosis_ref_id?: string;
    diagnosis_snapshot?: Record<string, unknown>;
    scheduled_at: string;
    duration_minutes: number;
    status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled_by_patient' | 'cancelled_by_doctor' | 'no_show';
    meeting_link?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    started_at?: string;
    ended_at?: string;
}

export interface Doctor {
    id: string;
    user_id: string;
    specialty: string[];
    qualification: string;
    experience_years: number;
    bio?: string;
    verified: boolean;
    availability: Record<string, string[]>;
    consultation_fee: number;
    consultation_duration: number;
    accepts_new_patients: boolean;
    rating: number;
    rating_count: number;
    total_consultations: number;
    // Joined from profiles
    full_name?: string;
    avatar_url?: string;
}

export interface CreateAppointmentInput {
    patientId: string;
    doctorId: string;
    diagnosisRefId?: string;
    diagnosisSnapshot?: Record<string, unknown>;
    scheduledAt: Date;
    durationMinutes?: number;
    notes?: string;
}

/**
 * Create a new appointment
 */
export async function createAppointment(input: CreateAppointmentInput): Promise<Appointment | null> {
    const { data, error } = await supabase
        .from('appointments')
        .insert({
            patient_id: input.patientId,
            doctor_id: input.doctorId,
            diagnosis_ref_id: input.diagnosisRefId,
            diagnosis_snapshot: input.diagnosisSnapshot,
            scheduled_at: input.scheduledAt.toISOString(),
            duration_minutes: input.durationMinutes || 30,
            notes: input.notes,
            status: 'scheduled',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating appointment:', error);
        return null;
    }

    return data;
}

/**
 * Get appointments for a doctor
 */
export async function getAppointmentsForDoctor(
    doctorId: string,
    options?: {
        status?: Appointment['status'][];
        fromDate?: Date;
        toDate?: Date;
    }
): Promise<Appointment[]> {
    let query = supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('scheduled_at', { ascending: true });

    if (options?.status && options.status.length > 0) {
        query = query.in('status', options.status);
    }

    if (options?.fromDate) {
        query = query.gte('scheduled_at', options.fromDate.toISOString());
    }

    if (options?.toDate) {
        query = query.lte('scheduled_at', options.toDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching appointments for doctor:', error);
        return [];
    }

    return data || [];
}

/**
 * Get appointments for a patient
 */
export async function getAppointmentsForPatient(
    patientId: string,
    options?: {
        status?: Appointment['status'][];
        limit?: number;
    }
): Promise<Appointment[]> {
    let query = supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('scheduled_at', { ascending: false });

    if (options?.status && options.status.length > 0) {
        query = query.in('status', options.status);
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching appointments for patient:', error);
        return [];
    }

    return data || [];
}

/**
 * Get a single appointment by ID
 */
export async function getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

    if (error) {
        console.error('Error fetching appointment:', error);
        return null;
    }

    return data;
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
    appointmentId: string,
    status: Appointment['status'],
    additionalFields?: { started_at?: string; ended_at?: string }
): Promise<boolean> {
    const { error } = await supabase
        .from('appointments')
        .update({
            status,
            ...additionalFields,
        })
        .eq('id', appointmentId);

    if (error) {
        console.error('Error updating appointment status:', error);
        return false;
    }

    return true;
}

/**
 * Get verified doctors with optional specialty filter
 */
export async function getVerifiedDoctors(options?: {
    specialty?: string;
    limit?: number;
}): Promise<Doctor[]> {
    let query = supabase
        .from('doctors')
        .select('*')
        .eq('verified', true)
        .eq('accepts_new_patients', true)
        .order('rating', { ascending: false });

    if (options?.specialty) {
        query = query.contains('specialty', [options.specialty]);
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching doctors:', error);
        return [];
    }

    return data || [];
}

/**
 * Get doctor by ID
 */
export async function getDoctorById(doctorId: string): Promise<Doctor | null> {
    const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', doctorId)
        .single();

    if (error) {
        console.error('Error fetching doctor:', error);
        return null;
    }

    return data;
}

/**
 * Get doctor's available slots for a given date
 */
export function getAvailableSlots(
    doctor: Doctor,
    date: Date,
    existingAppointments: Appointment[]
): string[] {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    const availability = doctor.availability[dayOfWeek];

    if (!availability || availability.length === 0) {
        return [];
    }

    const slots: string[] = [];
    const duration = doctor.consultation_duration || 30;

    // Parse time ranges and generate slots
    for (const range of availability) {
        const [start, end] = range.split('-');
        if (!start || !end) continue;

        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);

        let currentHour = startHour;
        let currentMin = startMin;

        while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
            const slotTime = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

            // Check if slot is already booked
            const slotDateTime = new Date(date);
            slotDateTime.setHours(currentHour, currentMin, 0, 0);

            const isBooked = existingAppointments.some(apt => {
                const aptTime = new Date(apt.scheduled_at);
                return Math.abs(aptTime.getTime() - slotDateTime.getTime()) < duration * 60 * 1000;
            });

            if (!isBooked) {
                slots.push(slotTime);
            }

            // Increment by duration
            currentMin += duration;
            if (currentMin >= 60) {
                currentHour += Math.floor(currentMin / 60);
                currentMin = currentMin % 60;
            }
        }
    }

    return slots;
}
