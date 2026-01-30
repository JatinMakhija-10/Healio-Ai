'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface RealtimeMetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    variant: 'blue' | 'green' | 'purple' | 'teal' | 'amber' | 'red';
    isLive?: boolean;
    lastUpdated?: Date | null;
    onClick?: () => void;
    trend?: {
        value: number;
        label: string;
    };
}

const variantClasses = {
    blue: 'border-blue-200 bg-blue-50/50',
    green: 'border-green-200 bg-green-50/50',
    purple: 'border-purple-200 bg-purple-50/50',
    teal: 'border-teal-200 bg-teal-50/50',
    amber: 'border-amber-200 bg-amber-50/50',
    red: 'border-red-200 bg-red-50/50',
};

const iconBgClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    purple: 'bg-purple-100',
    teal: 'bg-teal-100',
    amber: 'bg-amber-100',
    red: 'bg-red-100',
};

const iconClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    teal: 'text-teal-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
};

const textClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    teal: 'text-teal-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
};

const valueClasses = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    purple: 'text-purple-700',
    teal: 'text-teal-700',
    amber: 'text-amber-700',
    red: 'text-red-700',
};

export function RealtimeMetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    variant,
    isLive = false,
    lastUpdated,
    onClick,
    trend,
}: RealtimeMetricCardProps) {
    const [prevValue, setPrevValue] = useState(value);
    const [showFlash, setShowFlash] = useState(false);

    useEffect(() => {
        if (value !== prevValue && isLive) {
            setShowFlash(true);
            setPrevValue(value);
            const timer = setTimeout(() => setShowFlash(false), 500);
            return () => clearTimeout(timer);
        }
    }, [value, prevValue, isLive]);

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const seconds = Math.floor(diff / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    return (
        <Card
            className={cn(
                variantClasses[variant],
                onClick && 'cursor-pointer hover:shadow-md transition-all',
                showFlash && 'ring-2 ring-offset-2',
                showFlash && `ring-${variant}-400`
            )}
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBgClasses[variant])}>
                        <Icon className={cn('h-5 w-5', iconClasses[variant])} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className={cn('text-xs font-medium', textClasses[variant])}>
                                {title}
                            </p>
                            {isLive && (
                                <span className="relative flex h-2 w-2">
                                    <span className={cn(
                                        'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                                        `bg-${variant}-400`
                                    )}></span>
                                    <span className={cn(
                                        'relative inline-flex rounded-full h-2 w-2',
                                        `bg-${variant}-500`
                                    )}></span>
                                </span>
                            )}
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={String(value)}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.2 }}
                                className={cn('text-lg font-bold', valueClasses[variant])}
                            >
                                {value}
                            </motion.p>
                        </AnimatePresence>
                        {subtitle && (
                            <p className="text-xs text-slate-500 truncate">{subtitle}</p>
                        )}
                        {trend && (
                            <p className="text-xs text-green-600 mt-0.5">
                                +{trend.value}% {trend.label}
                            </p>
                        )}
                        {lastUpdated && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                Updated {formatTime(lastUpdated)}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
