import { create } from 'zustand';

export type SystemHealthStatus = 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

export interface SystemHealth {
    status: SystemHealthStatus;
    lastChecked: Date;
    services: {
        database: 'operational' | 'degraded' | 'down';
        aiService: 'operational' | 'degraded' | 'down';
        supabase: 'operational' | 'degraded' | 'down';
    };
}

export interface AILatency {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
}

export interface AdminMetrics {
    uptime: {
        last24h: number;
        last7d: number;
        last30d: number;
    };
    aiLatency: AILatency;
    pendingDoctors: number;
    flaggedSessions: number;
    activeUsers: number;
    activeConsultations: number;
}

interface AdminMetricsState {
    // State
    liveViewEnabled: boolean;
    connectionStatus: ConnectionStatus;
    systemHealth: SystemHealth | null;
    metrics: AdminMetrics | null;
    lastUpdated: Date | null;

    // Throttle tracking
    lastUpdateTimestamp: number;
    updateThrottle: number; // milliseconds between updates

    // Actions
    toggleLiveView: () => void;
    setConnectionStatus: (status: ConnectionStatus) => void;
    setSystemHealth: (health: SystemHealth) => void;
    updateMetrics: (metrics: Partial<AdminMetrics>) => void;
    updateSingleMetric: <K extends keyof AdminMetrics>(key: K, value: AdminMetrics[K]) => void;
    reset: () => void;
}

const initialState = {
    liveViewEnabled: false,
    connectionStatus: 'disconnected' as ConnectionStatus,
    systemHealth: null,
    metrics: null,
    lastUpdated: null,
    lastUpdateTimestamp: 0,
    updateThrottle: 1000, // 1 second throttle (60 updates per minute max)
};

export const useAdminMetricsStore = create<AdminMetricsState>((set, get) => ({
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

    setSystemHealth: (health: SystemHealth) => {
        set({
            systemHealth: health,
            lastUpdated: new Date(),
        });
    },

    updateMetrics: (newMetrics: Partial<AdminMetrics>) => {
        const now = Date.now();
        const state = get();

        // Throttle updates to prevent UI thrashing
        if (now - state.lastUpdateTimestamp < state.updateThrottle) {
            // Queue update for later (using setTimeout)
            setTimeout(() => {
                set((state) => ({
                    metrics: state.metrics ? { ...state.metrics, ...newMetrics } : newMetrics as AdminMetrics,
                    lastUpdated: new Date(),
                    lastUpdateTimestamp: Date.now(),
                }));
            }, state.updateThrottle - (now - state.lastUpdateTimestamp));
            return;
        }

        set((state) => ({
            metrics: state.metrics ? { ...state.metrics, ...newMetrics } : newMetrics as AdminMetrics,
            lastUpdated: new Date(),
            lastUpdateTimestamp: now,
        }));
    },

    updateSingleMetric: <K extends keyof AdminMetrics>(key: K, value: AdminMetrics[K]) => {
        const now = Date.now();
        const state = get();

        // Throttle updates
        if (now - state.lastUpdateTimestamp < state.updateThrottle) {
            setTimeout(() => {
                set((state) => ({
                    metrics: state.metrics ? { ...state.metrics, [key]: value } : { [key]: value } as AdminMetrics,
                    lastUpdated: new Date(),
                    lastUpdateTimestamp: Date.now(),
                }));
            }, state.updateThrottle - (now - state.lastUpdateTimestamp));
            return;
        }

        set((state) => ({
            metrics: state.metrics ? { ...state.metrics, [key]: value } : { [key]: value } as AdminMetrics,
            lastUpdated: new Date(),
            lastUpdateTimestamp: now,
        }));
    },

    reset: () => {
        set(initialState);
    },
}));
