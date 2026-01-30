"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Clock,
    Video,
    MessageSquare,
    ChevronRight,
    AlertCircle,
    Sparkles,
} from "lucide-react";
import Link from "next/link";

export interface AppointmentCardProps {
    id: string;
    patientName: string;
    patientAvatar?: string;
    scheduledAt: Date;
    duration: number; // minutes
    status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled_by_patient' | 'cancelled_by_doctor' | 'no_show';
    chiefComplaint?: string;
    aiDiagnosis?: string;
    aiConfidence?: number;
    hasRedFlags?: boolean;
    isUrgent?: boolean;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 border-blue-200" },
    confirmed: { label: "Confirmed", className: "bg-green-100 text-green-700 border-green-200" },
    in_progress: { label: "In Progress", className: "bg-purple-100 text-purple-700 border-purple-200 animate-pulse" },
    completed: { label: "Completed", className: "bg-slate-100 text-slate-600 border-slate-200" },
    cancelled_by_patient: { label: "Cancelled", className: "bg-red-100 text-red-700 border-red-200" },
    cancelled_by_doctor: { label: "Cancelled", className: "bg-red-100 text-red-700 border-red-200" },
    no_show: { label: "No Show", className: "bg-amber-100 text-amber-700 border-amber-200" },
};

export function AppointmentCard({
    id,
    patientName,
    patientAvatar,
    scheduledAt,
    duration,
    status,
    chiefComplaint,
    aiDiagnosis,
    aiConfidence,
    hasRedFlags,
    isUrgent,
}: AppointmentCardProps) {
    const initials = patientName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const formatDate = (date: Date) => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return "Tomorrow";
        } else {
            return date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
            });
        }
    };

    const isActive = status === 'scheduled' || status === 'confirmed';
    const isLive = status === 'in_progress';

    return (
        <Card
            className={cn(
                "group relative overflow-hidden transition-all duration-300",
                "hover:shadow-lg hover:shadow-slate-200/50",
                isUrgent && "ring-2 ring-red-200",
                isLive && "ring-2 ring-purple-300 shadow-purple-100"
            )}
        >
            {/* Urgent/Live Indicator Strip */}
            {(isUrgent || isLive) && (
                <div
                    className={cn(
                        "absolute top-0 left-0 right-0 h-1",
                        isLive ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gradient-to-r from-red-500 to-orange-500"
                    )}
                />
            )}

            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative">
                        <Avatar className="h-12 w-12 ring-2 ring-slate-100">
                            <AvatarImage src={patientAvatar} />
                            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white font-medium">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        {hasRedFlags && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                                <AlertCircle className="h-3 w-3 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="font-semibold text-slate-900 truncate">
                                    {patientName}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>
                                        {formatDate(scheduledAt)} • {formatTime(scheduledAt)}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span>{duration} min</span>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className={cn("shrink-0 text-xs", statusConfig[status]?.className)}
                            >
                                {statusConfig[status]?.label}
                            </Badge>
                        </div>

                        {/* Chief Complaint & AI Summary */}
                        {chiefComplaint && (
                            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                                <Sparkles className="h-4 w-4 text-teal-500 mt-0.5 shrink-0" />
                                <div className="text-sm space-y-0.5">
                                    <p className="text-slate-700 line-clamp-1">
                                        <span className="font-medium">Chief:</span> {chiefComplaint}
                                    </p>
                                    {aiDiagnosis && (
                                        <p className="text-slate-500">
                                            <span className="font-medium text-teal-600">AI:</span>{" "}
                                            {aiDiagnosis}
                                            {aiConfidence && (
                                                <span className="ml-1 text-xs text-slate-400">
                                                    ({Math.round(aiConfidence * 100)}%)
                                                </span>
                                            )}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        {isActive && (
                            <div className="flex items-center gap-2 pt-1">
                                <Link href={`/doctor/consult/${id}`} className="flex-1">
                                    <Button
                                        size="sm"
                                        className={cn(
                                            "w-full",
                                            isLive
                                                ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-200"
                                                : "bg-teal-600 hover:bg-teal-700 text-white"
                                        )}
                                    >
                                        <Video className="h-4 w-4 mr-2" />
                                        {isLive ? "Join Now" : "Start Consult"}
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-slate-600"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Hover Chevron */}
                    <ChevronRight className="h-5 w-5 text-slate-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </CardContent>
        </Card>
    );
}
