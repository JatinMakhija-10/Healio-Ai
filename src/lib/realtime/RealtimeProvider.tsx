'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAdminMetricsStore } from '@/stores/adminMetricsStore';

interface RealtimeContextValue {
    isConnected: boolean;
    error: string | null;
}

const RealtimeContext = createContext<RealtimeContextValue>({
    isConnected: false,
    error: null,
});

export const useRealtime = () => useContext(RealtimeContext);

interface RealtimeProviderProps {
    children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);
    const { liveViewEnabled, setConnectionStatus } = useAdminMetricsStore();

    useEffect(() => {
        if (!liveViewEnabled) {
            // Cleanup channel if live view is disabled
            if (channel) {
                channel.unsubscribe();
                setChannel(null);
                setIsConnected(false);
                setConnectionStatus('disconnected');
            }
            return;
        }

        // Set up Supabase Realtime connection
        setConnectionStatus('connecting');

        const realtimeChannel = supabase.channel('admin-metrics', {
            config: {
                broadcast: { self: true },
                presence: { key: 'admin-presence' },
            },
        });

        realtimeChannel
            .on('presence', { event: 'sync' }, () => {
                console.log('[Realtime] Presence synced');
            })
            .on('presence', { event: 'join' }, () => {
                console.log('[Realtime] Admin joined');
            })
            .on('presence', { event: 'leave' }, () => {
                console.log('[Realtime] Admin left');
            })
            .subscribe((status) => {
                console.log('[Realtime] Subscription status:', status);

                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    setConnectionStatus('connected');
                    setError(null);
                    console.log('[Realtime] WebSocket connected successfully');
                } else if (status === 'CHANNEL_ERROR') {
                    setIsConnected(false);
                    setConnectionStatus('disconnected');
                    setError('Failed to connect to realtime channel');
                    console.error('[Realtime] Channel error');
                } else if (status === 'TIMED_OUT') {
                    setIsConnected(false);
                    setConnectionStatus('reconnecting');
                    setError('Connection timed out, reconnecting...');
                    console.warn('[Realtime] Connection timed out');
                } else if (status === 'CLOSED') {
                    setIsConnected(false);
                    setConnectionStatus('disconnected');
                    console.log('[Realtime] Connection closed');
                }
            });

        setChannel(realtimeChannel);

        // Cleanup function
        return () => {
            console.log('[Realtime] Cleaning up connection');
            realtimeChannel.unsubscribe();
            setIsConnected(false);
            setConnectionStatus('disconnected');
        };
    }, [liveViewEnabled, setConnectionStatus]);

    // Auto-reconnection logic with exponential backoff
    useEffect(() => {
        if (!liveViewEnabled || isConnected || !error) return;

        let reconnectAttempt = 0;
        const maxAttempts = 5;
        const baseDelay = 2000; // 2 seconds

        const reconnect = () => {
            if (reconnectAttempt >= maxAttempts) {
                console.error('[Realtime] Max reconnection attempts reached');
                setError('Failed to reconnect after multiple attempts');
                setConnectionStatus('disconnected');
                return;
            }

            const delay = baseDelay * Math.pow(2, reconnectAttempt);
            console.log(`[Realtime] Reconnecting in ${delay}ms (attempt ${reconnectAttempt + 1}/${maxAttempts})`);

            setConnectionStatus('reconnecting');

            setTimeout(() => {
                reconnectAttempt++;
                // Force re-render to trigger reconnection
                setError(null);
            }, delay);
        };

        const timeout = setTimeout(reconnect, 1000);
        return () => clearTimeout(timeout);
    }, [error, isConnected, liveViewEnabled, setConnectionStatus]);

    return (
        <RealtimeContext.Provider value={{ isConnected, error }}>
            {children}
        </RealtimeContext.Provider>
    );
}
