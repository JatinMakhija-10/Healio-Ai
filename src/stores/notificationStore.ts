import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType =
    | 'appointment_reminder'
    | 'new_booking'
    | 'cancellation'
    | 'patient_message'
    | 'system'
    | 'video_call';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: Date;
    isRead: boolean;
    actionUrl?: string;
    metadata?: Record<string, any>;
}

interface NotificationState {
    // Data
    notifications: Notification[];

    // UI State
    isOpen: boolean;

    // Actions
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;

    // UI Actions
    togglePanel: () => void;
    closePanel: () => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            notifications: [],
            isOpen: false,

            addNotification: (notification) => {
                const newNotification: Notification = {
                    ...notification,
                    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: new Date(),
                    isRead: false,
                };
                set((state) => ({
                    notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep last 50
                }));
            },

            markAsRead: (id) => set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, isRead: true } : n
                ),
            })),

            markAllAsRead: () => set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
            })),

            removeNotification: (id) => set((state) => ({
                notifications: state.notifications.filter((n) => n.id !== id),
            })),

            clearAll: () => set({ notifications: [] }),

            togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
            closePanel: () => set({ isOpen: false }),
        }),
        {
            name: 'healio-notifications',
        }
    )
);

// Selectors
export const selectUnreadCount = (state: NotificationState) =>
    state.notifications.filter((n) => !n.isRead).length;

export const selectUnreadNotifications = (state: NotificationState) =>
    state.notifications.filter((n) => !n.isRead);

export const selectNotificationsByType = (type: NotificationType) => (state: NotificationState) =>
    state.notifications.filter((n) => n.type === type);
