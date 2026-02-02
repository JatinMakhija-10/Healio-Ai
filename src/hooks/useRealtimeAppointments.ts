import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface UseRealtimeAppointmentsOptions {
    onAppointmentCreated?: (appointment: any) => void;
    onAppointmentUpdated?: (appointment: any) => void;
    onAppointmentDeleted?: (appointmentId: string) => void;
    enabled?: boolean;
}

/**
 * Hook for real-time appointment updates
 * Subscribes to Postgres changes on the appointments table
 */
export function useRealtimeAppointments(options: UseRealtimeAppointmentsOptions = {}) {
    const { user } = useAuth();
    const {
        onAppointmentCreated,
        onAppointmentUpdated,
        onAppointmentDeleted,
        enabled = true
    } = options;

    useEffect(() => {
        if (!enabled || !user) return;

        let channel: RealtimeChannel;

        const setupChannel = async () => {
            // Subscribe to appointment changes for this user
            channel = supabase
                .channel(`appointments:user:${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'appointments',
                        filter: `patient_id=eq.${user.id}`,
                    },
                    (payload) => {
                        console.log('[Realtime] New appointment:', payload);
                        toast.success('New appointment scheduled!');
                        onAppointmentCreated?.(payload.new);
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'appointments',
                        filter: `patient_id=eq.${user.id}`,
                    },
                    (payload) => {
                        console.log('[Realtime] Appointment updated:', payload);

                        // Show appropriate notification based on status
                        const newStatus = (payload.new as any).status;
                        if (newStatus === 'confirmed') {
                            toast.success('Appointment confirmed by doctor!');
                        } else if (newStatus === 'cancelled_by_doctor') {
                            toast.error('Appointment cancelled by doctor');
                        } else if (newStatus === 'completed') {
                            toast.info('Appointment completed');
                        }

                        onAppointmentUpdated?.(payload.new);
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'appointments',
                        filter: `patient_id=eq.${user.id}`,
                    },
                    (payload) => {
                        console.log('[Realtime] Appointment deleted:', payload);
                        toast.info('Appointment removed');
                        onAppointmentDeleted?.((payload.old as any).id);
                    }
                )
                .subscribe((status) => {
                    console.log('[Realtime Appointments] Subscription status:', status);
                });
        };

        setupChannel();

        return () => {
            if (channel) {
                channel.unsubscribe();
            }
        };
    }, [user, enabled, onAppointmentCreated, onAppointmentUpdated, onAppointmentDeleted]);

    return {
        // Could expose channel status here if needed
    };
}
