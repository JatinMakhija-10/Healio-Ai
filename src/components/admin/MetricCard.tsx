"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
    };
    variant?: "default" | "teal" | "blue" | "purple" | "green" | "amber" | "red";
    size?: "default" | "large";
}

const variantStyles = {
    default: {
        iconBg: "bg-slate-100",
        iconColor: "text-slate-600",
        glow: "from-slate-500/10",
    },
    teal: {
        iconBg: "bg-teal-100",
        iconColor: "text-teal-600",
        glow: "from-teal-500/10",
    },
    blue: {
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        glow: "from-blue-500/10",
    },
    purple: {
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600",
        glow: "from-purple-500/10",
    },
    green: {
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        glow: "from-green-500/10",
    },
    amber: {
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        glow: "from-amber-500/10",
    },
    red: {
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        glow: "from-red-500/10",
    },
};

export function MetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    variant = "default",
    size = "default",
}: MetricCardProps) {
    const styles = variantStyles[variant];
    const isPositive = trend && trend.value > 0;
    const isNegative = trend && trend.value < 0;
    const isNeutral = trend && trend.value === 0;

    return (
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-slate-200">
            {/* Background Glow */}
            <div
                className={cn(
                    "absolute top-0 right-0 w-32 h-32 rounded-bl-full bg-gradient-to-bl to-transparent opacity-60",
                    styles.glow
                )}
            />

            <CardContent className={cn("relative", size === "large" ? "p-6" : "p-5")}>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                        <p
                            className={cn(
                                "font-bold text-slate-900 tracking-tight",
                                size === "large" ? "text-4xl" : "text-3xl"
                            )}
                        >
                            {typeof value === "number" ? value.toLocaleString() : value}
                        </p>
                        {subtitle && (
                            <p className="text-xs text-slate-400">{subtitle}</p>
                        )}
                        {trend && (
                            <div
                                className={cn(
                                    "flex items-center gap-1 text-xs font-medium mt-2",
                                    isPositive && "text-green-600",
                                    isNegative && "text-red-600",
                                    isNeutral && "text-slate-500"
                                )}
                            >
                                {isPositive && <TrendingUp className="h-3.5 w-3.5" />}
                                {isNegative && <TrendingDown className="h-3.5 w-3.5" />}
                                {isNeutral && <Minus className="h-3.5 w-3.5" />}
                                <span>
                                    {isPositive && "+"}
                                    {trend.value}% {trend.label}
                                </span>
                            </div>
                        )}
                    </div>
                    <div
                        className={cn(
                            "rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                            styles.iconBg,
                            size === "large" ? "w-14 h-14" : "w-12 h-12"
                        )}
                    >
                        <Icon
                            className={cn(
                                styles.iconColor,
                                size === "large" ? "h-7 w-7" : "h-6 w-6"
                            )}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
