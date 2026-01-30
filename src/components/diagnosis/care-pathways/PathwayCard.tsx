import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Calendar, AlertTriangle } from "lucide-react";
import { PersonalizedPathway } from "@/lib/diagnosis/care-pathways/types";
import Link from "next/link";

interface PathwayCardProps {
    pathway: PersonalizedPathway;
    currentDay: number;
    className?: string;
}

export function PathwayCard({ pathway, currentDay, className }: PathwayCardProps) {
    const { basePathway, personalizedPhases, urgencyLevel } = pathway;

    // Determine current phase
    const currentPhase = personalizedPhases.find(p =>
        currentDay >= p.dayRange.start && currentDay <= p.dayRange.end
    ) || personalizedPhases[personalizedPhases.length - 1];

    const totalDays = basePathway.expectedDuration.typical;
    const progress = Math.min(100, (currentDay / totalDays) * 100);

    return (
        <Card className={`border-slate-200 shadow-sm overflow-hidden ${className}`}>
            <CardHeader className="bg-teal-50/50 pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">
                                Ongoing Care
                            </span>
                            {urgencyLevel === 'urgent' && (
                                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> Monitor Closely
                                </span>
                            )}
                        </div>
                        <CardTitle className="text-lg font-bold text-slate-900">
                            {basePathway.conditionName} Plan
                        </CardTitle>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">Day {currentDay}</p>
                        <p className="text-xs text-slate-500">of {totalDays} days</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {/* Progress Bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-slate-100" indicatorClassName="bg-teal-600" />
                </div>

                {/* Current Phase */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-teal-600" />
                        Current Phase: {currentPhase.name}
                    </h4>
                    <p className="text-sm text-slate-600 line-clamp-2">
                        {currentPhase.description}
                    </p>
                </div>

                {/* Today's Stats */}
                <div className="flex gap-4 pt-2">
                    <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="text-2xl font-bold text-slate-900">{currentPhase.actions.length}</div>
                        <div className="text-xs text-slate-500">Actions for today</div>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="text-2xl font-bold text-slate-900">
                            {currentPhase.actions.filter(a => a.category === 'monitoring').length}
                        </div>
                        <div className="text-xs text-slate-500">Check-ins needed</div>
                    </div>
                </div>

                <Link href={`/dashboard/pathway/${basePathway.conditionId}`} className="block">
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white group">
                        View Daily Checklist
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
