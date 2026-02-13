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

export type WellnessVideo = {
    id: string;
    doctor_id: string;
    title: string;
    description: string | null;
    category: string;
    video_url: string;
    thumbnail_url: string | null;
    duration_seconds: number | null;
    is_published: boolean;
    views_count: number;
    created_at: string;
    updated_at: string;
    doctor_name?: string;
    doctor_avatar?: string;
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

        // 3. Fetch Doctor Profiles (Parallel)
        const [{ data: doctors }, { data: profiles }] = await Promise.all([
            supabase.from('doctors').select('user_id, specialty, consultation_fee').in('user_id', doctorIds),
            supabase.from('profiles').select('id, full_name, avatar_url').in('id', doctorIds)
        ]);

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
        // Fetch doctor's actual consultation fee from their profile
        const { data: doctorProfile } = await supabase
            .from('doctors')
            .select('consultation_fee')
            .eq('user_id', appointmentData.doctor_id)
            .single();
        const consultationFee = doctorProfile?.consultation_fee ?? 500;

        const { data, error } = await supabase
            .from('appointments')
            .insert({
                patient_id: appointmentData.patient_id,
                doctor_id: appointmentData.doctor_id,
                scheduled_at: appointmentData.scheduled_at,
                duration_minutes: appointmentData.duration_minutes,
                status: 'scheduled',
                notes: appointmentData.reason,
                diagnosis_ref_id: appointmentData.diagnosis_ref_id,
                consultation_fee: consultationFee
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

        const { data, error } = await query;

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
    },

    // ============================================================
    // Wellness Videos
    // ============================================================

    /**
     * Get Videos uploaded by a specific Doctor
     */
    async getDoctorVideos(doctorId: string): Promise<WellnessVideo[]> {
        const { data, error } = await supabase
            .from('wellness_videos')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching doctor videos:", error);
            return [];
        }
        return data || [];
    },

    /**
     * Get all published videos (patient-facing)
     */
    async getPublishedVideos(filters?: { category?: string; search?: string }): Promise<WellnessVideo[]> {
        let query = supabase
            .from('wellness_videos')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (filters?.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }

        if (filters?.search) {
            query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        const { data: videos, error } = await query;

        if (error) {
            console.error("Error fetching published videos:", error);
            return [];
        }

        if (!videos || videos.length === 0) return [];

        // Fetch doctor names for display
        const doctorIds = Array.from(new Set(videos.map(v => v.doctor_id)));
        const { data: doctors } = await supabase
            .from('doctors')
            .select('id, user_id')
            .in('id', doctorIds);

        const userIds = doctors?.map(d => d.user_id) || [];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

        const doctorToProfile = new Map<string, { full_name: string; avatar_url: string | null }>();
        doctors?.forEach(d => {
            const prof = profiles?.find(p => p.id === d.user_id);
            if (prof) doctorToProfile.set(d.id, prof);
        });

        return videos.map(v => ({
            ...v,
            doctor_name: doctorToProfile.get(v.doctor_id)?.full_name || 'Practitioner',
            doctor_avatar: doctorToProfile.get(v.doctor_id)?.avatar_url || null,
        }));
    },

    /**
     * Upload video metadata (file upload to storage is done separately)
     */
    async uploadVideoMetadata(data: {
        doctor_id: string;
        title: string;
        description?: string;
        category: string;
        video_url: string;
        thumbnail_url?: string;
        duration_seconds?: number;
        is_published?: boolean;
    }) {
        const { data: video, error } = await supabase
            .from('wellness_videos')
            .insert({
                doctor_id: data.doctor_id,
                title: data.title,
                description: data.description || null,
                category: data.category,
                video_url: data.video_url,
                thumbnail_url: data.thumbnail_url || null,
                duration_seconds: data.duration_seconds || null,
                is_published: data.is_published ?? true,
            })
            .select()
            .single();

        if (error) throw error;
        return video;
    },

    /**
     * Update video metadata
     */
    async updateVideo(videoId: string, data: Partial<{
        title: string;
        description: string;
        category: string;
        is_published: boolean;
        thumbnail_url: string;
    }>) {
        const { error } = await supabase
            .from('wellness_videos')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', videoId);

        if (error) throw error;
    },

    /**
     * Delete a video
     */
    async deleteVideo(videoId: string) {
        const { error } = await supabase
            .from('wellness_videos')
            .delete()
            .eq('id', videoId);

        if (error) throw error;
    },

    /**
     * Increment video view count
     */
    async incrementVideoViews(videoId: string) {
        const { error } = await supabase.rpc('increment_video_views', { video_id: videoId });
        // Fallback: manual increment if RPC not available
        if (error) {
            const { data } = await supabase
                .from('wellness_videos')
                .select('views_count')
                .eq('id', videoId)
                .single();
            if (data) {
                await supabase
                    .from('wellness_videos')
                    .update({ views_count: (data.views_count || 0) + 1 })
                    .eq('id', videoId);
            }
        }
    },

    /**
     * [ADMIN] Get ALL videos with doctor info (published + unpublished)
     */
    async getAllVideosAdmin(): Promise<WellnessVideo[]> {
        const { data: videos, error } = await supabase
            .from('wellness_videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching all videos (admin):", error);
            return [];
        }

        if (!videos || videos.length === 0) return [];

        // Fetch doctor names
        const doctorIds = Array.from(new Set(videos.map(v => v.doctor_id)));
        const { data: doctors } = await supabase
            .from('doctors')
            .select('id, user_id')
            .in('id', doctorIds);

        const userIds = doctors?.map(d => d.user_id) || [];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

        const doctorToProfile = new Map<string, { full_name: string; avatar_url: string | null }>();
        doctors?.forEach(d => {
            const prof = profiles?.find(p => p.id === d.user_id);
            if (prof) doctorToProfile.set(d.id, prof);
        });

        return videos.map(v => ({
            ...v,
            doctor_name: doctorToProfile.get(v.doctor_id)?.full_name || 'Unknown Doctor',
            doctor_avatar: doctorToProfile.get(v.doctor_id)?.avatar_url || null,
        }));
    },

    /**
     * [ADMIN] Force-publish or unpublish any video
     */
    async adminToggleVideoPublish(videoId: string, isPublished: boolean) {
        const { error } = await supabase
            .from('wellness_videos')
            .update({ is_published: isPublished, updated_at: new Date().toISOString() })
            .eq('id', videoId);
        if (error) throw error;
    },

    /**
     * [ADMIN] Delete any video
     */
    async adminDeleteVideo(videoId: string) {
        const { error } = await supabase
            .from('wellness_videos')
            .delete()
            .eq('id', videoId);
        if (error) throw error;
    }
};
