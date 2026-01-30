'use client';

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminMetricsStore } from '@/stores/adminMetricsStore';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeMetricsOptions {
    enabled?: boolean;
    pollingInterval?: number; // Fallback polling interval in ms
}

export function useRealtimeMetrics(options: UseRealtimeMetricsOptions = {}) {
    const { enabled = true, pollingInterval = 5000 } = options;
    const {
        liveViewEnabled,
        updateMetrics,
        updateSingleMetric,
        setSystemHealth,
        metrics,
        systemHealth,
        connectionStatus,
    } = useAdminMetricsStore();

    const channelsRef = useRef<RealtimeChannel[]>([]);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch initial metrics
    const fetchMetrics = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/metrics');
            if (!response.ok) throw new Error('Failed to fetch metrics');

            const { data } = await response.json();
            updateMetrics(data);
        } catch (error) {
            console.error('[useRealtimeMetrics] Failed to fetch metrics:', error);
        }
    }, [updateMetrics]);

    // Fetch system health
    const fetchHealth = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/health');
            if (!response.ok) throw new Error('Failed to fetch health');

            const { data } = await response.json();
            setSystemHealth(data);
        } catch (error) {
            console.error('[useRealtimeMetrics] Failed to fetch health:', error);
        }
    }, [setSystemHealth]);

    // Initial data load
    useEffect(() => {
        if (enabled) {
            fetchMetrics();
            fetchHealth();
        }
    }, [enabled, fetchMetrics, fetchHealth]);

    // Set up real-time subscriptions
    useEffect(() => {
        if (!liveViewEnabled || !enabled) {
            // Cleanup channels
            channelsRef.current.forEach(channel => channel.unsubscribe());
            channelsRef.current = [];

            // Cleanup polling
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
            return;
        }

        console.log('[useRealtimeMetrics] Setting up real-time subscriptions');

        // Subscribe to doctors table changes (for pending doctors count)
        const doctorsChannel = supabase
            .channel('doctors-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'doctors',
                    filter: 'verification_status=eq.pending',
                },
                async (payload) => {
                    console.log('[Realtime] Doctors table changed:', payload);
                    // Refetch pending doctors count
                    const { data } = await supabase
                        .from('pending_doctors_count')
                        .select('count')
                        .single();

                    if (data) {
                        updateSingleMetric('pendingDoctors', Number(data.count));
                    }
                }
            )
            .subscribe();

        // Subscribe to flagged sessions changes
        const flaggedSessionsChannel = supabase
            .channel('flagged-sessions-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'flagged_sessions',
                    filter: 'status=eq.pending',
                },
                async (payload) => {
                    console.log('[Realtime] Flagged sessions changed:', payload);
                    // Refetch flagged sessions count
                    const { data } = await supabase
                        .from('flagged_sessions_count')
                        .select('count')
                        .single();

                    if (data) {
                        updateSingleMetric('flaggedSessions', Number(data.count));
                    }
                }
            )
            .subscribe();

        // Subscribe to AI latency metrics changes
        const aiLatencyChannel = supabase
            .channel('ai-latency-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ai_latency_metrics',
                },
                async (payload) => {
                    console.log('[Realtime] AI latency metric added:', payload);
                    // Refetch AI latency stats
                    const { data } = await supabase
                        .from('ai_latency_stats')
                        .select('*')
                        .single();

                    if (data) {
                        updateSingleMetric('aiLatency', {
                            p50: Number(data.p50_latency || 0),
                            p95: Number(data.p95_latency || 0),
                            p99: Number(data.p99_latency || 0),
                            avg: Number(data.avg_latency || 0),
                        });
                    }
                }
            )
            .subscribe();

        channelsRef.current = [doctorsChannel, flaggedSessionsChannel, aiLatencyChannel];

        // Fallback polling for metrics that don't have realtime triggers
        pollingIntervalRef.current = setInterval(() => {
            fetchMetrics();
            fetchHealth();
        }, pollingInterval);

        // Cleanup
        return () => {
            channelsRef.current.forEach(channel => channel.unsubscribe());
            channelsRef.current = [];

            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [liveViewEnabled, enabled, pollingInterval, updateSingleMetric, fetchMetrics, fetchHealth]);

    return {
        metrics,
        systemHealth,
        connectionStatus,
        refetch: fetchMetrics,
        refetchHealth: fetchHealth,
    };
}
