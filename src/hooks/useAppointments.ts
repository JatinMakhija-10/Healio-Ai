import { useCallback, useEffect } from 'react';
import { useAppointmentStore, selectFilteredAppointments, selectTodayAppointments, selectUpcomingAppointments, Appointment } from '@/stores/appointmentStore';
import { useShallow } from 'zustand/react/shallow';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

/**
 * Custom hook for appointment management with API integration
 */
export function useAppointments() {
    const { user } = useAuth();

    // Subscribe to state needed for rendering
    const {
        appointments,
        isLoading,
        error,
        filters,
        selectedAppointmentId
    } = useAppointmentStore(
        useShallow((state) => ({
            appointments: state.appointments,
            isLoading: state.isLoading,
            error: state.error,
            filters: state.filters,
            selectedAppointmentId: state.selectedAppointmentId,
        }))
    );

    // Stable Actions (no subscription)
    const storeActions = useAppointmentStore.getState();

    // Selectors with useShallow to prevnt infinite loops
    const filteredAppointments = useAppointmentStore(useShallow(selectFilteredAppointments));
    const todayAppointments = useAppointmentStore(useShallow(selectTodayAppointments));
    const upcomingAppointments = useAppointmentStore(useShallow(selectUpcomingAppointments));

    // Fetch appointments from API
    const fetchAppointments = useCallback(async () => {
        if (!user) return;

        // Use imperative actions to avoid dependency loop
        const { setAppointments, setLoading, setError } = useAppointmentStore.getState();

        setLoading(true);
        setError(null);

        try {
            const doctor = await api.getDoctorProfile(user.id);
            if (!doctor) {
                setAppointments([]);
                return;
            }

            const rawAppointments = await api.getDoctorAppointments(doctor.id);

            // Map to UI model
            const mapped: Appointment[] = rawAppointments.map((apt: any) => ({
                id: apt.id,
                patientId: apt.patient_id,
                patientName: apt.patient?.full_name || 'Unknown Patient',
                patientAvatar: apt.patient?.avatar_url,
                scheduledAt: new Date(apt.scheduled_at),
                duration: apt.duration_minutes,
                status: apt.status,
                chiefComplaint: apt.notes_for_doctor || '',
                aiDiagnosis: 'Pending Analysis',
                aiConfidence: 0,
                hasRedFlags: false,
                isUrgent: false,
                meetingLink: apt.meeting_link,
                notes: apt.notes_for_doctor,
            }));

            setAppointments(mapped);
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
            setError('Failed to load appointments');
            toast.error('Failed to load appointments');
        }
    }, [user]);

    // Initial fetch
    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // Update appointment status with optimistic UI
    const updateStatus = useCallback(async (
        appointmentId: string,
        newStatus: Appointment['status']
    ) => {
        const store = useAppointmentStore.getState();
        const original = store.appointments.find((a) => a.id === appointmentId);
        if (!original) return;

        // Optimistic update
        store.optimisticUpdate(appointmentId, { status: newStatus });
        toast.loading('Updating appointment...', { id: 'update-status' });

        try {
            // API call would go here
            // await api.updateAppointmentStatus(appointmentId, newStatus);
            toast.success('Appointment updated', { id: 'update-status' });
        } catch (error) {
            // Rollback on failure
            store.rollbackUpdate(appointmentId, original);
            toast.error('Failed to update appointment', { id: 'update-status' });
        }
    }, []);

    // Reschedule appointment
    const reschedule = useCallback(async (
        appointmentId: string,
        newDate: Date,
        newDuration?: number
    ) => {
        const store = useAppointmentStore.getState();
        const original = store.appointments.find((a) => a.id === appointmentId);
        if (!original) return;

        const updates: Partial<Appointment> = {
            scheduledAt: newDate,
            ...(newDuration && { duration: newDuration }),
        };

        // Optimistic update
        store.optimisticUpdate(appointmentId, updates);
        toast.loading('Rescheduling...', { id: 'reschedule' });

        try {
            // API call would go here
            toast.success('Appointment rescheduled', { id: 'reschedule' });
        } catch (error) {
            store.rollbackUpdate(appointmentId, original);
            toast.error('Failed to reschedule', { id: 'reschedule' });
        }
    }, []);

    // Cancel appointment
    const cancel = useCallback(async (appointmentId: string, _reason?: string) => {
        await updateStatus(appointmentId, 'cancelled_by_doctor');
    }, [updateStatus]);

    // Check for conflicts
    const hasConflict = useCallback((date: Date, duration: number, excludeId?: string) => {
        // Access state directly without subscription for this check or depend on passed prop
        // Here we can use the subscribed `appointments` or imperative state if we want freshness
        // Using subscribed `appointments` is fine as it's in render scope, but dependency array needs it
        // Or access via getState() to avoid dependency? 
        // Let's use the local `appointments` (subscribed) so it re-renders if list changes

        // Actually, easier to just use imperative state for utility checks to avoid recreating callback
        const currentAppointments = useAppointmentStore.getState().appointments;

        const startTime = date.getTime();
        const endTime = startTime + duration * 60 * 1000;

        return currentAppointments.some((apt) => {
            if (excludeId && apt.id === excludeId) return false;
            if (apt.status.includes('cancelled')) return false;

            const aptStart = new Date(apt.scheduledAt).getTime();
            const aptEnd = aptStart + apt.duration * 60 * 1000;

            // Check overlap
            return (startTime < aptEnd && endTime > aptStart);
        });
    }, []);

    return {
        // Data
        appointments,
        filteredAppointments,
        todayAppointments,
        upcomingAppointments,
        selectedAppointment: appointments.find((a) => a.id === selectedAppointmentId),

        // State
        isLoading,
        error,
        filters,

        // Actions
        fetchAppointments,
        addAppointment: storeActions.addAppointment,
        updateStatus,
        reschedule,
        cancel,
        hasConflict,

        // Filter Actions
        setFilter: storeActions.setFilter,
        resetFilters: storeActions.resetFilters,

        // Selection
        selectAppointment: storeActions.selectAppointment,
    };
}
