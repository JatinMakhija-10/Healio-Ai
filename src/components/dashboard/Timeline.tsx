"use client";

import { CheckCircle2, Circle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";

export interface TimelinePhase {
    name: string;
    description: string;
    startDay: number;
    endDay: number;
    status: 'completed' | 'current' | 'upcoming';
}

interface TimelineProps {
    phases: TimelinePhase[];
    startDate: Date;
    currentDay: number;
    className?: string;
}

export function Timeline({ phases, startDate, currentDay, className }: TimelineProps) {
    return (
        <div className={cn("relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-2.5 before:h-full before:w-0.5 before:-translate-x-1/2 before:bg-slate-200", className)}>
            {phases.map((phase, idx) => {
                const phaseStartDate = addDays(startDate, phase.startDay - 1);
                const phaseEndDate = addDays(startDate, phase.endDay - 1);
                const isActive = phase.status === 'current';
                const isCompleted = phase.status === 'completed';

                return (
                    <div key={idx} className="relative">
                        {/* Dot Indicator */}
                        <div className={cn(
                            "absolute left-0 top-1 -ml-6 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white transition-colors",
                            isActive ? "border-teal-600 text-teal-600 scale-110" :
                                isCompleted ? "border-teal-500 bg-teal-50 text-teal-500" :
                                    "border-slate-300 text-slate-300"
                        )}>
                            {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <Circle className={cn("h-3 w-3 fill-current", isActive ? "animate-pulse" : "opacity-0")} />
                            )}
                        </div>

                        {/* Content */}
                        <div className={cn(
                            "rounded-lg border p-4 transition-all",
                            isActive
                                ? "bg-white border-teal-200 shadow-md ring-1 ring-teal-50"
                                : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                        )}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className={cn("font-semibold text-sm", isActive ? "text-teal-900" : "text-slate-700")}>
                                    {phase.name}
                                </h3>
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                        {format(phaseStartDate, "MMM d")} - {format(phaseEndDate, "MMM d")}
                                    </span>
                                </div>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed mb-2">
                                {phase.description}
                            </p>

                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                <span>Day {phase.startDay} - {phase.endDay}</span>
                                {isActive && (
                                    <span className="bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">
                                        Current Day: {currentDay}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
