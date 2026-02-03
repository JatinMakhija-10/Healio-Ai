import { supabase } from "./supabase";
import { User } from "@supabase/supabase-js";

export type DoctorProfile = {
    id: string;
    user_id: string;
    full_name: string;
    specialty: string[];
    qualification: string;
    experience_years: number;
    bio: string;
    consultation_fee: number;
    availability: any;
    verified: boolean;
    verification_status: string;
    avatar_url?: string;
};

export type PatientProfile = {
    id: string; // This is the user_id (profile id)
    full_name: string;
    age?: number;
    gender?: string;
    phone?: string;
    email?: string;
    avatar_url?: string;
};

export type Appointment = {
    id: string;
    patient_id: string;
    doctor_id: string;
    scheduled_at: string;
    duration_minutes: number;
    status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled_by_patient' | 'cancelled_by_doctor' | 'no_show';
    notes?: string;
    patient?: PatientProfile; // Joined
};

export const api = {
    /**
     * Create or update doctor profile
     */
    async createDoctorProfile(userId: string, data: any) {
        // 1. Update Profile (role, phone, name)
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                full_name: data.fullName,
                phone: data.phone,
                role: 'doctor',
                updated_at: new Date().toISOString(),
            });

        if (profileError) throw profileError;

        // 2. Create/Update Doctor Record
        // We match on user_id since it's unique
        const { error: doctorError } = await supabase
            .from('doctors')
            .upsert({
                user_id: userId,
                specialty: data.specialty,
                qualification: data.qualification,
                experience_years: data.experienceYears,
                bio: data.bio,
                license_number: data.licenseNumber,
                consultation_fee: data.consultationFee,
                availability: data.availability,
                // Files would be uploaded to storage and URLs passed here in a real storage implementation
                // license_document_url: ... 
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

        if (doctorError) throw doctorError;

        // 3. Update Auth Metadata (optional but good for consistency)
        await supabase.auth.updateUser({
            data: {
                role: 'doctor',
                doctor_verified: false, // Default to false
            }
        });
    },

    /**
     * Get Doctor Profile by User ID
     */
    async getDoctorProfile(userId: string) {
        // Fetch Doctor record
        const { data: doctor, error: doctorError } = await supabase
            .from('doctors')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (doctorError) return null;

        // Fetch user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', userId)
            .single();

        return {
            ...doctor,
            profiles: profile || { full_name: 'Unknown', avatar_url: null }
        };
    },

    /**
     * Get Appointments for a Doctor
     */
    async getDoctorAppointments(doctorId: string) {
        // 1. Get Appointments
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('scheduled_at', { ascending: true });

        if (error) {
            console.error("Error fetching appointments:", error);
            return [];
        }

        if (!appointments || appointments.length === 0) return [];

        // 2. Get Unique Patient IDs
        const patientIds = Array.from(new Set(appointments.map((a: any) => a.patient_id)));

        // 3. Fetch Patient Profiles
        const { data: patients } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, phone')
            .in('id', patientIds);

        const patientMap = new Map(patients?.map((p: any) => [p.id, p]));

        // 4. Merge
        return appointments.map((a: any) => ({
            ...a,
            patient: patientMap.get(a.patient_id) || { full_name: 'Unknown', avatar_url: null }
        }));
    },

    /**
     * Get Appointments for a Patient
     * Used by: Patient Dashboard
     */
    async getPatientAppointments(patientId: string) {
        // 1. Get Appointments
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', patientId)
            .order('scheduled_at', { ascending: true });

        if (error || !appointments) return [];

        // 2. Get Unique Doctor IDs
        const doctorIds = Array.from(new Set(appointments.map((a: any) => a.doctor_id)));

        // 3. Fetch Doctor Profiles
        // We need both the doctor record and the profile name
        const { data: doctors } = await supabase
            .from('doctors')
            .select('user_id, specialty, consultation_fee')
            .in('user_id', doctorIds);

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', doctorIds);

        const doctorMap = new Map();
        doctors?.forEach(d => {
            const profile = profiles?.find(p => p.id === d.user_id);
            doctorMap.set(d.user_id, {
                ...d,
                full_name: profile?.full_name || 'Doctor',
                avatar_url: profile?.avatar_url
            });
        });

        // 4. Merge
        return appointments.map((a: any) => ({
            ...a,
            doctor: doctorMap.get(a.doctor_id) || { full_name: 'Healio Doctor', specialty: [] }
        }));
    },

    /**
     * Get Patients List for a Doctor (derived from appointments)
     */
    async getDoctorPatients(doctorId: string) {
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('patient_id')
            .eq('doctor_id', doctorId);

        if (error || !appointments) return [];

        // Unique IDs
        const patientIds = Array.from(new Set(appointments.map((a: any) => a.patient_id)));

        if (patientIds.length === 0) return [];

        // Fetch details
        const { data: patients } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, phone, role')
            .in('id', patientIds);

        return patients || [];
    },

    /**
     * Get All Verified Doctors
     * Used by: Patient "Find Specialist"
     */
    async getAllDoctors() {
        // 1. Fetch Verified Doctor Records
        const { data: doctors, error } = await supabase
            .from('doctors')
            .select('*')
            .in('verification_status', ['verified', 'approved']); // Or custom verification logic

        if (error || !doctors) {
            console.error("Error fetching doctors:", error);
            return [];
        }

        // 2. Fetch Profiles for these doctors
        const userIds = doctors.map(d => d.user_id);
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));

        // 3. Merge
        // 3. Merge and Filter (Remove orphans)
        return doctors
            .map(d => ({
                ...d,
                profile: profileMap.get(d.user_id)
            }))
            .filter(d => d.profile && d.profile.full_name);
    },

    /**
     * Create Appointment
     * @param appointmentData - Appointment details including optional diagnosis reference
     */
    async createAppointment(appointmentData: {
        patient_id: string;
        doctor_id: string;
        scheduled_at: string; // ISO string
        duration_minutes: number;
        reason?: string;
        diagnosis_ref_id?: string; // Link to AI consultation
    }) {
        const { data, error } = await supabase
            .from('appointments')
            .insert({
                patient_id: appointmentData.patient_id,
                doctor_id: appointmentData.doctor_id,
                scheduled_at: appointmentData.scheduled_at,
                duration_minutes: appointmentData.duration_minutes,
                status: 'scheduled',
                notes: appointmentData.reason,
                diagnosis_ref_id: appointmentData.diagnosis_ref_id, // Link to consultation
                consultation_fee: 500 // Default fee, should ideally come from doctor profile
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get Appointment by ID
     * Used for consultation pages
     */
    async getAppointmentById(appointmentId: string) {
        // 1. Get Appointment
        const { data: appointment, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', appointmentId)
            .single();

        if (error || !appointment) return null;

        // 2. Get Patient Profile
        const { data: patient } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', appointment.patient_id)
            .single();

        // 3. Get Doctor Profile
        const { data: doctor } = await supabase
            .from('doctors')
            .select('*')
            .eq('id', appointment.doctor_id)
            .single();

        const { data: doctorProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', doctor?.user_id)
            .single();

        return {
            ...appointment,
            patient: patient || { full_name: 'Unknown Patient', avatar_url: null },
            doctor: {
                ...doctor,
                full_name: doctorProfile?.full_name || 'Doctor',
                avatar_url: doctorProfile?.avatar_url
            }
        };
    },


    /**
     * Get Latest Consultation for a Patient
     * Used to link the most recent AI diagnosis to an appointment
     */
    async getLatestConsultation(patientId: string) {
        const { data, error } = await supabase
            .from('consultations')
            .select('*')
            .eq('user_id', patientId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) return null;
        return data;
    },

    /**
     * Get Patient Details
     */
    async getPatientDetails(patientId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', patientId)
            .single();

        if (error) return null;
        return data;
    },

    /**
     * Get Consultation History for a Patient
     */
    async getPatientConsultations(patientId: string) {
        const { data, error } = await supabase
            .from('consultations')
            .select('*')
            .eq('user_id', patientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching consultations:", error);
            return [];
        }
        return data || [];
    },

    /**
     * Get Notifications for a User
     */
    async getNotifications(userId: string, unreadOnly = false) {
        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching notifications:", error);
            return [];
        }
        return data || [];
    },

    /**
     * Mark Notification as Read
     */
    async markNotificationAsRead(notificationId: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', notificationId);

        if (error) {
            console.error("Error marking notification as read:", error);
            throw error;
        }
    },

    /**
     * Mark All Notifications as Read
     */
    async markAllNotificationsAsRead(userId: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error("Error marking all notifications as read:", error);
            throw error;
        }
    }
};
