import { create } from 'zustand';

/**
 * Admin Metrics UI Store — UI-only state.
 *
 * Server-fetched metrics/health data should be loaded via React Query
 * using `useAdminMetrics()` / `useSystemHealth()` from `useApiQueries.ts`.
 * This store only manages live-view toggle and connection status.
 */

export type SystemHealthStatus = 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

interface AdminMetricsUIState {
    // UI State
    liveViewEnabled: boolean;
    connectionStatus: ConnectionStatus;

    // UI Actions
    toggleLiveView: () => void;
    setConnectionStatus: (status: ConnectionStatus) => void;
    reset: () => void;
}

const initialState = {
    liveViewEnabled: false,
    connectionStatus: 'disconnected' as ConnectionStatus,
};

export const useAdminMetricsStore = create<AdminMetricsUIState>((set) => ({
    ...initialState,

    toggleLiveView: () => {
        set((state) => ({
            liveViewEnabled: !state.liveViewEnabled,
            connectionStatus: !state.liveViewEnabled ? 'connecting' : 'disconnected',
        }));
    },

    setConnectionStatus: (status: ConnectionStatus) => {
        set({ connectionStatus: status });
    },

    reset: () => {
        set(initialState);
    },
}));
