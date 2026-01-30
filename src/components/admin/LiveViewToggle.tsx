'use client';

import { Button } from '@/components/ui/button';
import { Globe, Wifi, WifiOff } from 'lucide-react';
import { useAdminMetricsStore } from '@/stores/adminMetricsStore';
import { cn } from '@/lib/utils';

export function LiveViewToggle() {
    const { liveViewEnabled, connectionStatus, toggleLiveView } = useAdminMetricsStore();

    const getStatusIcon = () => {
        if (!liveViewEnabled) {
            return <Globe className="h-4 w-4" />;
        }

        switch (connectionStatus) {
            case 'connected':
                return <Wifi className="h-4 w-4" />;
            case 'connecting':
            case 'reconnecting':
                return <Wifi className="h-4 w-4 animate-pulse" />;
            case 'disconnected':
                return <WifiOff className="h-4 w-4" />;
            default:
                return <Globe className="h-4 w-4" />;
        }
    };

    const getStatusText = () => {
        if (!liveViewEnabled) return 'Live View';

        switch (connectionStatus) {
            case 'connected':
                return 'Live';
            case 'connecting':
                return 'Connecting...';
            case 'reconnecting':
                return 'Reconnecting...';
            case 'disconnected':
                return 'Disconnected';
            default:
                return 'Live View';
        }
    };

    const getButtonClasses = () => {
        if (!liveViewEnabled) {
            return 'bg-purple-600 hover:bg-purple-700 text-white';
        }

        switch (connectionStatus) {
            case 'connected':
                return 'bg-green-600 hover:bg-green-700 text-white animate-pulse';
            case 'connecting':
            case 'reconnecting':
                return 'bg-yellow-600 hover:bg-yellow-700 text-white';
            case 'disconnected':
                return 'bg-gray-600 hover:bg-gray-700 text-white';
            default:
                return 'bg-purple-600 hover:bg-purple-700 text-white';
        }
    };

    return (
        <Button
            onClick={toggleLiveView}
            className={cn(
                'gap-2 shadow-lg transition-all',
                getButtonClasses()
            )}
            title={liveViewEnabled ? 'Disable live updates' : 'Enable live real-time updates'}
        >
            {getStatusIcon()}
            {getStatusText()}
            {liveViewEnabled && connectionStatus === 'connected' && (
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
            )}
        </Button>
    );
}
