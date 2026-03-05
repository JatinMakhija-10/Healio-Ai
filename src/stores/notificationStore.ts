import { create } from 'zustand';

/**
 * Notification UI Store — UI-only state.
 *
 * Server-fetched notification data is managed by React Query
 * via `useNotifications()` in `src/lib/hooks/useApiQueries.ts`.
 * This store only tracks panel visibility and ephemeral client-side
 * notifications (e.g. realtime push events before they're persisted).
 */

export type NotificationType =
    | 'appointment_reminder'
    | 'new_booking'
    | 'cancellation'
    | 'patient_message'
    | 'system'
    | 'video_call';

export interface EphemeralNotification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: Date;
    actionUrl?: string;
}

interface NotificationUIState {
    // UI State
    isOpen: boolean;

    // Ephemeral real-time notifications (not yet persisted to DB)
    ephemeralNotifications: EphemeralNotification[];

    // UI Actions
    togglePanel: () => void;
    closePanel: () => void;

    // Ephemeral actions (for Supabase Realtime push before DB persistence)
    addEphemeral: (notification: Omit<EphemeralNotification, 'id' | 'timestamp'>) => void;
    clearEphemeral: () => void;
}

export const useNotificationStore = create<NotificationUIState>((set) => ({
    isOpen: false,
    ephemeralNotifications: [],

    togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
    closePanel: () => set({ isOpen: false }),

    addEphemeral: (notification) => {
        const newNotif: EphemeralNotification = {
            ...notification,
            id: `eph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
        };
        set((state) => ({
            ephemeralNotifications: [newNotif, ...state.ephemeralNotifications].slice(0, 10),
        }));
    },

    clearEphemeral: () => set({ ephemeralNotifications: [] }),
}));

// Selectors
export const selectEphemeralCount = (state: NotificationUIState) =>
    state.ephemeralNotifications.length;
