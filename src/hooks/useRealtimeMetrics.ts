'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAdminMetricsStore } from '@/stores/adminMetricsStore';
import { useAdminMetrics, useSystemHealth } from '@/lib/hooks/useApiQueries';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeMetricsOptions {
    enabled?: boolean;
}

export function useRealtimeMetrics(options: UseRealtimeMetricsOptions = {}) {
    const { enabled = true } = options;
    const { liveViewEnabled, connectionStatus } = useAdminMetricsStore();
    const queryClient = useQueryClient();

    // Server data via React Query
    const { data: metrics } = useAdminMetrics();
    const { data: systemHealth } = useSystemHealth();

    const channelsRef = useRef<RealtimeChannel[]>([]);

    // Set up real-time subscriptions that invalidate React Query cache
    useEffect(() => {
        if (!liveViewEnabled || !enabled) {
            channelsRef.current.forEach(channel => channel.unsubscribe());
            channelsRef.current = [];
            return;
        }

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
                () => {
                    queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
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
                () => {
                    queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
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
                () => {
                    queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
                }
            )
            .subscribe();

        channelsRef.current = [doctorsChannel, flaggedSessionsChannel, aiLatencyChannel];

        return () => {
            channelsRef.current.forEach(channel => channel.unsubscribe());
            channelsRef.current = [];
        };
    }, [liveViewEnabled, enabled, queryClient]);

    return {
        metrics,
        systemHealth,
        connectionStatus,
        refetch: () => queryClient.invalidateQueries({ queryKey: ['adminMetrics'] }),
        refetchHealth: () => queryClient.invalidateQueries({ queryKey: ['systemHealth'] }),
    };
}
