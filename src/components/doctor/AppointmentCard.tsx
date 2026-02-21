"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Clock,
    Video,
    MessageSquare,
    ChevronRight,
    AlertCircle,
    Sparkles,
    MoreVertical,
    MapPin,
    CheckCircle2,
    XCircle,
    CalendarClock,
    Timer,
    Phone,
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
    type?: 'video' | 'in_person';
    onCancel?: (id: string) => void;
    onReschedule?: (id: string) => void;
    onComplete?: (id: string) => void;
    onStatusChange?: (id: string, status: string) => void;
}

const statusConfig: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
    scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 border-blue-200", icon: <Clock className="h-3 w-3" /> },
    confirmed: { label: "Confirmed", className: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle2 className="h-3 w-3" /> },
    in_progress: { label: "In Progress", className: "bg-purple-100 text-purple-700 border-purple-200 animate-pulse", icon: <Timer className="h-3 w-3" /> },
    completed: { label: "Completed", className: "bg-slate-100 text-slate-500 border-slate-200", icon: <CheckCircle2 className="h-3 w-3" /> },
    cancelled_by_patient: { label: "Cancelled", className: "bg-red-100 text-red-600 border-red-200", icon: <XCircle className="h-3 w-3" /> },
    cancelled_by_doctor: { label: "Cancelled", className: "bg-red-100 text-red-600 border-red-200", icon: <XCircle className="h-3 w-3" /> },
    no_show: { label: "No Show", className: "bg-amber-100 text-amber-700 border-amber-200", icon: <AlertCircle className="h-3 w-3" /> },
};

function CountdownTimer({ scheduledAt }: { scheduledAt: Date }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const update = () => {
            const now = new Date().getTime();
            const target = new Date(scheduledAt).getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft('Starting now');
                setIsUrgent(true);
                return;
            }

            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);

            if (mins < 5) {
                setIsUrgent(true);
                setTimeLeft(`${mins}m ${secs}s`);
            } else {
                setTimeLeft(`${mins}m`);
            }
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [scheduledAt]);

    if (!timeLeft) return null;

    return (
        <div className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
            isUrgent
                ? "bg-red-100 text-red-700 animate-pulse"
                : "bg-amber-50 text-amber-700"
        )}>
            <Timer className="h-3 w-3" />
            <span>Starts in {timeLeft}</span>
        </div>
    );
}

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
    type = 'video',
    onCancel,
    onReschedule,
    onComplete,
    onStatusChange,
}: AppointmentCardProps) {
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

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
    const isDone = status === 'completed';
    const isCancelled = status === 'cancelled_by_patient' || status === 'cancelled_by_doctor' || status === 'no_show';

    // Show countdown if upcoming within 30 minutes
    const showCountdown = useMemo(() => {
        if (!isActive) return false;
        const now = new Date().getTime();
        const target = new Date(scheduledAt).getTime();
        const diff = target - now;
        return diff > 0 && diff <= 30 * 60 * 1000;
    }, [scheduledAt, isActive]);

    const endTime = new Date(new Date(scheduledAt).getTime() + duration * 60 * 1000);

    return (
        <>
            <Card
                className={cn(
                    "group relative overflow-hidden transition-all duration-300",
                    "hover:shadow-lg hover:shadow-slate-200/50",
                    isUrgent && "ring-2 ring-red-200",
                    isLive && "ring-2 ring-purple-300 shadow-purple-100",
                    isDone && "opacity-75",
                    isCancelled && "opacity-60"
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
                            <Avatar className={cn("h-12 w-12 ring-2", isCancelled ? "ring-slate-200" : "ring-slate-100")}>
                                <AvatarImage src={patientAvatar} />
                                <AvatarFallback className={cn(
                                    "font-medium",
                                    isCancelled
                                        ? "bg-slate-200 text-slate-500"
                                        : "bg-gradient-to-br from-teal-500 to-teal-700 text-white"
                                )}>
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
                                <div className="min-w-0">
                                    <h3 className={cn(
                                        "font-semibold truncate",
                                        isCancelled ? "text-slate-400 line-through" : "text-slate-900"
                                    )}>
                                        {patientName}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
                                        <Clock className="h-3.5 w-3.5 shrink-0" />
                                        <span>
                                            {formatDate(scheduledAt)} • {formatTime(scheduledAt)} – {formatTime(endTime)}
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span>{duration} min</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Type Badge */}
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-slate-200 text-slate-500">
                                        {type === 'video' ? <Video className="h-2.5 w-2.5 mr-1" /> : <MapPin className="h-2.5 w-2.5 mr-1" />}
                                        {type === 'video' ? 'Video' : 'In-Person'}
                                    </Badge>
                                    {/* Status Badge */}
                                    <Badge
                                        variant="outline"
                                        className={cn("text-xs gap-1", statusConfig[status]?.className)}
                                    >
                                        {statusConfig[status]?.icon}
                                        {statusConfig[status]?.label}
                                    </Badge>
                                </div>
                            </div>

                            {/* Countdown Timer */}
                            {showCountdown && <CountdownTimer scheduledAt={scheduledAt} />}

                            {/* Chief Complaint & AI Summary */}
                            {chiefComplaint && !isCancelled && (
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
                                                {aiConfidence != null && aiConfidence > 0 && (
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
                            {(isActive || isLive) && (
                                <div className="flex items-center gap-2 pt-1">
                                    <Link href={`/doctor/consult/${id}`} className="flex-1">
                                        <Button
                                            size="sm"
                                            className={cn(
                                                "w-full gap-2",
                                                isLive
                                                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-200"
                                                    : "bg-teal-600 hover:bg-teal-700 text-white"
                                            )}
                                        >
                                            <Video className="h-4 w-4" />
                                            {isLive ? "Join Now" : "Start Consult"}
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-slate-600"
                                        asChild
                                    >
                                        <Link href={`/doctor/inbox`}>
                                            <MessageSquare className="h-4 w-4" />
                                        </Link>
                                    </Button>

                                    {/* Three-dot menu */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            {onComplete && (isActive || isLive) && (
                                                <DropdownMenuItem onClick={() => onComplete(id)} className="gap-2 text-green-700">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Mark Complete
                                                </DropdownMenuItem>
                                            )}
                                            {onReschedule && isActive && (
                                                <DropdownMenuItem onClick={() => onReschedule(id)} className="gap-2">
                                                    <CalendarClock className="h-4 w-4" />
                                                    Reschedule
                                                </DropdownMenuItem>
                                            )}
                                            {onStatusChange && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => onStatusChange(id, 'no_show')} className="gap-2 text-amber-600">
                                                        <AlertCircle className="h-4 w-4" />
                                                        Mark No-Show
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                            {onCancel && isActive && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => setCancelDialogOpen(true)} className="gap-2 text-red-600">
                                                        <XCircle className="h-4 w-4" />
                                                        Cancel Appointment
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}

                            {/* Completed state action */}
                            {isDone && (
                                <div className="flex items-center gap-2 pt-1">
                                    <Link href={`/doctor/consult/${id}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full gap-2 text-slate-500 border-slate-200">
                                            <ChevronRight className="h-4 w-4" />
                                            View Summary
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Hover Chevron */}
                        {!isCancelled && (
                            <ChevronRight className="h-5 w-5 text-slate-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-center" />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            Cancel Appointment
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel the appointment with <strong>{patientName}</strong> on{" "}
                            <strong>{formatDate(scheduledAt)} at {formatTime(scheduledAt)}</strong>?
                            This action cannot be undone and the patient will be notified.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => onCancel?.(id)}
                        >
                            Yes, Cancel
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
