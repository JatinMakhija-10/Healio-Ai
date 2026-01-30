import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppointmentStatus =
    | 'scheduled'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'cancelled_by_patient'
    | 'cancelled_by_doctor'
    | 'no_show';

export interface Appointment {
    id: string;
    patientId: string;
    patientName: string;
    patientAvatar?: string;
    scheduledAt: Date;
    duration: number;
    status: AppointmentStatus;
    chiefComplaint?: string;
    aiDiagnosis?: string;
    aiConfidence?: number;
    hasRedFlags?: boolean;
    isUrgent?: boolean;
    meetingLink?: string;
    notes?: string;
}

export interface AppointmentFilters {
    status: AppointmentStatus | 'all';
    dateRange: { start: Date; end: Date } | null;
    searchQuery: string;
}

interface AppointmentState {
    // Data
    appointments: Appointment[];
    isLoading: boolean;
    error: string | null;

    // Filters
    filters: AppointmentFilters;

    // Selected
    selectedAppointmentId: string | null;

    // Actions
    setAppointments: (appointments: Appointment[]) => void;
    addAppointment: (appointment: Appointment) => void;
    updateAppointment: (id: string, updates: Partial<Appointment>) => void;
    removeAppointment: (id: string) => void;

    // Optimistic Updates
    optimisticUpdate: (id: string, updates: Partial<Appointment>) => void;
    rollbackUpdate: (id: string, original: Appointment) => void;

    // Filter Actions
    setFilter: <K extends keyof AppointmentFilters>(key: K, value: AppointmentFilters[K]) => void;
    resetFilters: () => void;

    // Selection
    selectAppointment: (id: string | null) => void;

    // Loading States
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

const defaultFilters: AppointmentFilters = {
    status: 'all',
    dateRange: null,
    searchQuery: '',
};

export const useAppointmentStore = create<AppointmentState>()(
    persist(
        (set, get) => ({
            // Initial State
            appointments: [],
            isLoading: false,
            error: null,
            filters: defaultFilters,
            selectedAppointmentId: null,

            // Data Actions
            setAppointments: (appointments) => set({ appointments, isLoading: false }),

            addAppointment: (appointment) =>
                set((state) => ({
                    appointments: [...state.appointments, appointment]
                })),

            updateAppointment: (id, updates) =>
                set((state) => ({
                    appointments: state.appointments.map((apt) =>
                        apt.id === id ? { ...apt, ...updates } : apt
                    ),
                })),

            removeAppointment: (id) =>
                set((state) => ({
                    appointments: state.appointments.filter((apt) => apt.id !== id),
                })),

            // Optimistic Updates
            optimisticUpdate: (id, updates) => {
                const original = get().appointments.find((a) => a.id === id);
                if (original) {
                    get().updateAppointment(id, updates);
                }
            },

            rollbackUpdate: (id, original) => {
                set((state) => ({
                    appointments: state.appointments.map((apt) =>
                        apt.id === id ? original : apt
                    ),
                }));
            },

            // Filter Actions
            setFilter: (key, value) =>
                set((state) => ({
                    filters: { ...state.filters, [key]: value },
                })),

            resetFilters: () => set({ filters: defaultFilters }),

            // Selection
            selectAppointment: (id) => set({ selectedAppointmentId: id }),

            // Loading States
            setLoading: (loading) => set({ isLoading: loading }),
            setError: (error) => set({ error }),
        }),
        {
            name: 'healio-appointments',
            partialize: (state) => ({ filters: state.filters }), // Only persist filters
        }
    )
);

// Selectors (for memoization)
export const selectFilteredAppointments = (state: AppointmentState) => {
    const { appointments, filters } = state;

    return appointments.filter((apt) => {
        // Status filter
        if (filters.status !== 'all' && apt.status !== filters.status) {
            return false;
        }

        // Date range filter
        if (filters.dateRange) {
            const aptDate = new Date(apt.scheduledAt);
            if (aptDate < filters.dateRange.start || aptDate > filters.dateRange.end) {
                return false;
            }
        }

        // Search query
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            const matchesName = apt.patientName.toLowerCase().includes(query);
            const matchesComplaint = apt.chiefComplaint?.toLowerCase().includes(query);
            if (!matchesName && !matchesComplaint) {
                return false;
            }
        }

        return true;
    });
};

export const selectTodayAppointments = (state: AppointmentState) => {
    const today = new Date();
    return state.appointments.filter((apt) => {
        const aptDate = new Date(apt.scheduledAt);
        return (
            aptDate.getDate() === today.getDate() &&
            aptDate.getMonth() === today.getMonth() &&
            aptDate.getFullYear() === today.getFullYear()
        );
    });
};

export const selectUpcomingAppointments = (state: AppointmentState) => {
    const now = new Date();
    return state.appointments
        .filter((apt) => new Date(apt.scheduledAt) > now && apt.status !== 'completed')
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
};
