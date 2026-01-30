"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchPathwayForCondition } from "@/lib/diagnosis/pathwayClient";
import { generatePersonalizedPathway, calculateCurrentDay } from "@/lib/diagnosis/care-pathways/pathwayEngine";
import { PersonalizedPathway, SelfCareGuidance } from "@/lib/diagnosis/care-pathways/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Checklist, ChecklistItem } from "@/components/dashboard/Checklist";
import { Timeline, TimelinePhase } from "@/components/dashboard/Timeline";

export default function PathwayPage() {
    const params = useParams();
    const { user } = useAuth();
    const [pathway, setPathway] = useState<PersonalizedPathway | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentDay, setCurrentDay] = useState(1);
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    useEffect(() => {
        async function loadPathway() {
            if (!params.id || typeof params.id !== "string") return;

            try {
                // 1. Fetch Request
                const base = await fetchPathwayForCondition(params.id);
                if (!base) {
                    console.error("Pathway not found");
                    return;
                }

                // 2. Mock Profile Data (In real app, fetch from DB)
                const mockPrakriti = user?.user_metadata?.ayurvedic_profile || null;
                const mockVikriti = null;
                const mockAgni = null;

                // 3. Generate Personalized Pathway
                const personalized = generatePersonalizedPathway(
                    {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        condition: { id: base.conditionId, name: base.conditionName } as any,
                        confidence: 0.9,
                        matchedKeywords: []
                    },
                    base,
                    mockPrakriti,
                    mockVikriti,
                    mockAgni
                );

                setPathway(personalized);

                // Initialize day and start date
                let day = 1;
                try {
                    const stored = localStorage.getItem('healio_consultation_history');
                    if (stored) {
                        const history = JSON.parse(stored);
                        if (history.length > 0) {
                            // Find relevant history item
                            const relevant = history.find((h: { diagnosis?: { id?: string; condition?: string }, created_at: string }) =>
                                (h.diagnosis?.id === params.id) ||
                                (h.diagnosis?.condition?.toLowerCase().replace(/ /g, '_') === params.id)
                            );

                            if (relevant) {
                                const createdDate = new Date(relevant.created_at);
                                day = calculateCurrentDay(createdDate);
                                setStartDate(createdDate);
                            }
                        }
                    }
                } catch (e) { console.error(e); }
                setCurrentDay(day);

            } catch (error) {
                console.error("Failed to load pathway", error);
            } finally {
                setLoading(false);
            }
        }

        loadPathway();
    }, [params.id, user]);

    const toggleItem = (id: string, checked: boolean) => {
        setCheckedItems(prev => ({ ...prev, [id]: checked }));
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Loading care plan...</p>
            </div>
        </div>
    );

    if (!pathway) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Care plan not found</h2>
                <p className="text-slate-500 mb-6">We couldn't locate the requested care plan. It may have been removed or you may have followed an invalid link.</p>
                <Link href="/dashboard" className="text-teal-600 hover:text-teal-700 font-medium">
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );

    const { basePathway, personalizedPhases, urgencyLevel, adjustments } = pathway;
    const activePhase = personalizedPhases.find(p =>
        currentDay >= p.dayRange.start && currentDay <= p.dayRange.end
    ) || personalizedPhases[0];

    // Group self care
    const selfCareByCategory: Record<string, SelfCareGuidance[]> = {};
    basePathway.selfCare.forEach(item => {
        if (!selfCareByCategory[item.category]) {
            selfCareByCategory[item.category] = [];
        }
        selfCareByCategory[item.category].push(item);
    });

    // Transform data for components
    const checklistItems: ChecklistItem[] = activePhase.actions.map((action, idx) => ({
        id: `task-${idx}`,
        text: action.action,
        category: action.category,
        priority: action.priority as any,
        frequency: action.frequency,
        isCompleted: !!checkedItems[`task-${idx}`],
        notes: action.notes
    }));

    const timelinePhases: TimelinePhase[] = personalizedPhases.map(p => ({
        name: p.name,
        description: p.description,
        startDay: p.dayRange.start,
        endDay: p.dayRange.end,
        status: currentDay > p.dayRange.end ? 'completed' : (currentDay >= p.dayRange.start ? 'current' : 'upcoming')
    }));

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
                {/* Header / Nav */}
                <div className="flex flex-col gap-6">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-700 transition-colors self-start group font-medium"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to Dashboard
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                    {basePathway.conditionName} Recovery Plan
                                </h1>
                                <span className={
                                    `px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${urgencyLevel === 'urgent' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
                                    }`
                                }>
                                    {urgencyLevel === 'self-care' ? 'Home Care' : urgencyLevel}
                                </span>
                            </div>
                            <p className="text-slate-500">
                                Personalized for your {user?.user_metadata?.ayurvedic_profile?.prakriti || "unique"} constitution
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-center">
                                <div className="text-2xl font-bold text-teal-600">Day {currentDay}</div>
                                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Current Progress</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* Main Content (Checklist & Timeline) - 8 Cols */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Daily Checklist */}
                        <Card className="border-none shadow-lg shadow-slate-200/50 ring-1 ring-slate-100 bg-white overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-teal-50/50 to-transparent border-b border-slate-100/50 pb-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                                            Daily Actions
                                        </CardTitle>
                                        <CardDescription className="bg-transparent mt-1.5">
                                            Complete these tasks to stay on track with your recovery.
                                        </CardDescription>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <div className="text-3xl font-bold text-slate-900">
                                            {checklistItems.filter(i => i.isCompleted).length}
                                            <span className="text-slate-300 mx-1">/</span>
                                            <span className="text-slate-400 text-xl">{checklistItems.length}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 font-medium">Tasks Completed</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <Checklist items={checklistItems} onToggle={toggleItem} />
                            </CardContent>
                        </Card>

                        {/* Timeline */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Recovery Timeline</CardTitle>
                                <CardDescription>Your roadmap to full health</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Timeline
                                    phases={timelinePhases}
                                    startDate={startDate}
                                    currentDay={currentDay}
                                />
                            </CardContent>
                        </Card>

                    </div>

                    {/* Sidebar (Info & Red Flags) - 4 Cols */}
                    <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">

                        {/* Red Flags */}
                        <Card className="border-red-100 shadow-sm bg-red-50/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg text-red-900">
                                    <AlertTriangle className="h-5 w-5 fill-red-100 text-red-600" />
                                    When to call a doctor
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {basePathway.redFlags.map((flag, i) => (
                                    <div key={i} className="flex gap-3 text-sm p-3 bg-white rounded-lg border border-red-100 shadow-sm">
                                        <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${flag.severity === 'emergency' ? 'bg-red-600' : 'bg-orange-500'}`} />
                                        <div className="space-y-1">
                                            <p className="font-medium text-slate-900">{flag.symptom}</p>
                                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{flag.action}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Personal Adjustments */}
                        {adjustments.length > 0 && (
                            <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-100">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-teal-900 text-base">Personalized for You</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {adjustments.map((adj, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-teal-800">
                                                <div className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                                                <span className="leading-relaxed">{adj.rationale}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {/* General Tips */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Care Guidelines</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {Object.entries(selfCareByCategory).map(([category, items]) => (
                                    <div key={category}>
                                        <h4 className="font-semibold text-xs text-teal-700 uppercase tracking-wider mb-2">{category}</h4>
                                        <ul className="text-sm text-slate-600 space-y-2">
                                            {items.map((item, j) => (
                                                <li key={j} className="pl-3 border-l-2 border-slate-200">
                                                    <span className="font-medium text-slate-900">{item.instruction}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
}
