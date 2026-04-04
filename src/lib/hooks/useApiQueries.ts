import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Appointment } from "@/lib/api";

// ─── Query Keys ──────────────────────────────────────────────

export const queryKeys = {
    doctorProfile: (userId: string) => ["doctorProfile", userId] as const,
    doctorAppointments: (doctorId: string) => ["doctorAppointments", doctorId] as const,
    patientAppointments: (patientId: string) => ["patientAppointments", patientId] as const,
    doctorPatients: (doctorId: string) => ["doctorPatients", doctorId] as const,
    allDoctors: () => ["allDoctors"] as const,
    appointment: (id: string) => ["appointment", id] as const,
    latestConsultation: (patientId: string) => ["latestConsultation", patientId] as const,
    patientConsultations: (patientId: string) => ["patientConsultations", patientId] as const,
    notifications: (userId: string, unreadOnly?: boolean) => ["notifications", userId, { unreadOnly }] as const,
    doctorVideos: (doctorId: string) => ["doctorVideos", doctorId] as const,
    publishedVideos: (filters?: { category?: string; search?: string }) => ["publishedVideos", filters] as const,
    allVideosAdmin: () => ["allVideosAdmin"] as const,
};

// ─── Doctor Queries ──────────────────────────────────────────

export function useDoctorProfile(userId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.doctorProfile(userId!),
        queryFn: () => api.getDoctorProfile(userId!),
        enabled: !!userId,
    });
}

export function useDoctorAppointments(doctorId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.doctorAppointments(doctorId!),
        queryFn: () => api.getDoctorAppointments(doctorId!),
        enabled: !!doctorId,
        staleTime: 15 * 1000, // 15s — appointments are time-critical
        refetchOnWindowFocus: true, // doctor returning to tab should see fresh data
    });
}

export function useDoctorPatients(doctorId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.doctorPatients(doctorId!),
        queryFn: () => api.getDoctorPatients(doctorId!),
        enabled: !!doctorId,
    });
}

// ─── Patient Queries ─────────────────────────────────────────

export function usePatientAppointments(patientId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.patientAppointments(patientId!),
        queryFn: () => api.getPatientAppointments(patientId!),
        enabled: !!patientId,
        staleTime: 15 * 1000, // 15s — appointments are time-critical
        refetchOnWindowFocus: true,
    });
}

export function useLatestConsultation(patientId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.latestConsultation(patientId!),
        queryFn: () => api.getLatestConsultation(patientId!),
        enabled: !!patientId,
    });
}

export function usePatientConsultations(patientId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.patientConsultations(patientId!),
        queryFn: () => api.getPatientConsultations(patientId!),
        enabled: !!patientId,
    });
}

// ─── Shared Queries ──────────────────────────────────────────

export function useAllDoctors() {
    return useQuery({
        queryKey: queryKeys.allDoctors(),
        queryFn: () => api.getAllDoctors(),
        staleTime: 5 * 60 * 1000, // 5min — doctor list changes rarely
    });
}

export function useAppointmentById(appointmentId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.appointment(appointmentId!),
        queryFn: () => api.getAppointmentById(appointmentId!),
        enabled: !!appointmentId,
        staleTime: 15 * 1000, // 15s — single appointment detail (during consultation)
    });
}

export function useNotifications(userId: string | undefined, unreadOnly = false) {
    return useQuery({
        queryKey: queryKeys.notifications(userId!, unreadOnly),
        queryFn: () => api.getNotifications(userId!, unreadOnly),
        enabled: !!userId,
        staleTime: 10 * 1000, // 10s — notifications should be near-realtime
        refetchOnWindowFocus: true,
        refetchInterval: 30 * 1000, // poll every 30s in background
    });
}

// ─── Video Queries ───────────────────────────────────────────

export function useDoctorVideos(doctorId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.doctorVideos(doctorId!),
        queryFn: () => api.getDoctorVideos(doctorId!),
        enabled: !!doctorId,
    });
}

export function usePublishedVideos(filters?: { category?: string; search?: string }) {
    return useQuery({
        queryKey: queryKeys.publishedVideos(filters),
        queryFn: () => api.getPublishedVideos(filters),
    });
}

export function useAllVideosAdmin() {
    return useQuery({
        queryKey: queryKeys.allVideosAdmin(),
        queryFn: () => api.getAllVideosAdmin(),
    });
}

// ─── Admin Queries ───────────────────────────────────────────

export function useAdminMetrics() {
    return useQuery({
        queryKey: ["adminMetrics"],
        queryFn: async () => {
            const res = await fetch("/api/admin/metrics");
            if (!res.ok) throw new Error("Failed to fetch admin metrics");
            return res.json();
        },
        staleTime: 10 * 1000, // 10s — admin dashboard updates frequently
        refetchInterval: 30 * 1000, // auto-poll every 30s
    });
}

export function useSystemHealth() {
    return useQuery({
        queryKey: ["systemHealth"],
        queryFn: async () => {
            const res = await fetch("/api/admin/health");
            if (!res.ok) throw new Error("Failed to fetch system health");
            return res.json();
        },
        staleTime: 15 * 1000,
        refetchInterval: 60 * 1000,
    });
}

// ─── Mutations ───────────────────────────────────────────────

export function useCreateAppointment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Parameters<typeof api.createAppointment>[0]) =>
            api.createAppointment(data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["patientAppointments", variables.patient_id] });
            queryClient.invalidateQueries({ queryKey: ["doctorAppointments", variables.doctor_id] });
        },
    });
}

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId: string) =>
            api.markNotificationAsRead(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}

export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) =>
            api.markAllNotificationsAsRead(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}
