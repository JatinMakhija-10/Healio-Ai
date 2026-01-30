'use client';

import { Badge } from '@/components/ui/badge';
import { Server, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useAdminMetricsStore, SystemHealthStatus } from '@/stores/adminMetricsStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function SystemHealthBadge() {
    const { systemHealth } = useAdminMetricsStore();
    const [showDetails, setShowDetails] = useState(false);

    if (!systemHealth) {
        return (
            <Badge variant="outline" className="gap-2">
                <Server className="h-3 w-3" />
                Loading...
            </Badge>
        );
    }

    const getStatusConfig = (status: SystemHealthStatus) => {
        switch (status) {
            case 'operational':
                return {
                    icon: Server,
                    text: 'All Systems Operational',
                    className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
                };
            case 'degraded':
                return {
                    icon: AlertCircle,
                    text: 'Degraded Performance',
                    className: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200',
                };
            case 'partial_outage':
                return {
                    icon: AlertTriangle,
                    text: 'Partial Outage',
                    className: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200',
                };
            case 'major_outage':
                return {
                    icon: XCircle,
                    text: 'Major Outage',
                    className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
                };
        }
    };

    const config = getStatusConfig(systemHealth.status);
    const Icon = config.icon;

    const getServiceStatusIcon = (status: string) => {
        if (status === 'operational') return '🟢';
        if (status === 'degraded') return '🟡';
        return '🔴';
    };

    return (
        <>
            <Badge
                className={cn('gap-2 cursor-pointer transition-all', config.className)}
                onClick={() => setShowDetails(true)}
            >
                <Icon className="h-3 w-3" />
                {config.text}
            </Badge>

            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            System Health Details
                        </DialogTitle>
                        <DialogDescription>
                            Last checked: {new Date(systemHealth.lastChecked).toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 mt-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{getServiceStatusIcon(systemHealth.services.database)}</span>
                                <span className="font-medium">Database</span>
                            </div>
                            <Badge variant="outline" className="capitalize">
                                {systemHealth.services.database}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{getServiceStatusIcon(systemHealth.services.aiService)}</span>
                                <span className="font-medium">AI Service</span>
                            </div>
                            <Badge variant="outline" className="capitalize">
                                {systemHealth.services.aiService}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{getServiceStatusIcon(systemHealth.services.supabase)}</span>
                                <span className="font-medium">Supabase</span>
                            </div>
                            <Badge variant="outline" className="capitalize">
                                {systemHealth.services.supabase}
                            </Badge>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
