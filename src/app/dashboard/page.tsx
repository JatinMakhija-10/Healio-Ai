"use client";

import { useEffect, useState } from "react";
import { DailyTipCard } from "@/components/dashboard/DailyTipCard";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Activity, ArrowRight, Calendar, AlertTriangle, MessageSquare, Info, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { PathwayCard } from "@/components/diagnosis/care-pathways/PathwayCard";
import { fetchPathwayForCondition } from "@/lib/diagnosis/pathwayClient";
import { generatePersonalizedPathway, calculateCurrentDay } from "@/lib/diagnosis/care-pathways/pathwayEngine";
import { PersonalizedPathway } from "@/lib/diagnosis/care-pathways/types";
import { api } from "@/lib/api";
import { useRealtimeAppointments } from "@/hooks/useRealtimeAppointments";



// Type definition for stored consultation
type Consultation = {
    id: string;
    created_at: string;
    symptoms: {
        location: string[];
        painType?: string;
        intensity?: number;
    };
    diagnosis: {
        condition: string;
    };
    confidence: number;
};

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const [history, setHistory] = useState<Consultation[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [localName, setLocalName] = useState<string | null>(null);
    const [activePathway, setActivePathway] = useState<PersonalizedPathway | null>(null);
    const [activeAppointments, setActiveAppointments] = useState<any[]>([]);
    const router = useRouter();

    // Enable real-time appointment updates
    useRealtimeAppointments({
        enabled: !!user,
        onAppointmentCreated: (appointment) => {
            // Refresh appointments list
            loadAppointments();
        },
        onAppointmentUpdated: (appointment) => {
            // Refresh appointments list
            loadAppointments();
        },
        onAppointmentDeleted: () => {
            // Refresh appointments list
            loadAppointments();
        }
    });

    useEffect(() => {
        if (!user && !loading) {
            router.push('/login');
            return;
        }

        if (user && !loading && !user.user_metadata?.onboarding_completed) {
            router.push('/onboarding');
        }
    }, [user, loading, router]);

    useEffect(() => {
        // Try to recover name from local storage
        const storedProfile = localStorage.getItem('healio_pending_profile');
        if (storedProfile) {
            try {
                const parsed = JSON.parse(storedProfile);
                // eslint-disable-next-line
                if (parsed.full_name) setLocalName(parsed.full_name);
            } catch (e) { /* ignore */ }
        }

        // Fetch history and active pathway
        async function loadDashboardData() {
            if (!user) return;
            try {
                // Fetch from DB instead of localStorage for isolation and persistence
                const parsed = await api.getPatientConsultations(user.id);
                setHistory(parsed as any[]); // Cast to Consultation type

                // Also update localStorage for backup/offline if needed (optional)
                localStorage.setItem('healio_consultation_history', JSON.stringify(parsed));

                // If we have history, try to load the pathway for the latest condition
                if (parsed.length > 0) {
                    const latest = parsed[0];
                    // Heuristic: try to find ID from condition name if ID isn't explicitly saved
                    // In reality, we should save conditionId in history.
                    // For now, assuming distinct IDs like 'common_cold', 'flu' etc.
                    // or converting "Common Cold" -> "common_cold" is risky but a starting point.
                    // Ideally, we'd use latest.diagnosis.id if it exists.

                    // Let's assume we can try to fetch by the condition string acting as ID first
                    // or mapped. For this demo, we'll try to convert to snake_case if strictly needed
                    // but let's try the raw string first if the ID is stored there.
                    // Note: The history type definition in this file only has 'condition: string'.
                    // We should fallback or try to fetch.

                    const conditionId = (latest.diagnosis as Record<string, any>).id ||
                        latest.diagnosis.condition.toLowerCase().replace(/ /g, '_');

                    const base = await fetchPathwayForCondition(conditionId);

                    if (base) {
                        // Generate personalized
                        const personalized = generatePersonalizedPathway(
                            {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                condition: { id: conditionId, name: base.conditionName } as any,
                                confidence: 0.8,
                                matchedKeywords: []
                            }, // Mock DiagnosisResult
                            base,
                            user?.user_metadata?.ayurvedic_profile || null,
                            null, // Vikriti
                            null  // Agni
                        );
                        setActivePathway(personalized);
                    }
                }

            } catch (e) {
                console.error("Failed to load dashboard data", e);
            }
            setLoadingHistory(false);
        }

        loadDashboardData();
        loadAppointments();
    }, [user]); // Re-run when user profile loads

    // Fetch upcoming appointments - extracted for real-time updates
    const loadAppointments = async () => {
        if (!user) return;
        try {
            // Fetch from API
            const raw = await api.getPatientAppointments(user.id);
            const now = new Date();

            // Map to UI model and filter for upcoming
            const upcoming = raw
                .map((a: any) => ({
                    id: a.id,
                    doctorName: a.doctor?.full_name || 'Healio Doctor',
                    scheduledAt: a.scheduled_at, // Keep as string for now or parse
                    type: 'video', // Assuming video for now based on context
                    status: a.status
                }))
                .filter((a: any) => new Date(a.scheduledAt) > now && a.status !== 'cancelled')
                .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

            setActiveAppointments(upcoming);
        } catch (e) {
            console.error("Failed to load appointments", e);
        }
    };

    // ... existing variables (userName, lastSession, getTimeAgo)

    // Determine display name with fallbacks
    const userName = user?.user_metadata?.full_name || localName || user?.email?.split("@")[0] || "User";

    const lastSession = history[0];

    // Simple time ago helper
    const getTimeAgo = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            if (seconds < 60) return "Just now";
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
            const days = Math.floor(hours / 24);
            if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
            return date.toLocaleDateString();
        } catch (e) {
            return "Recently";
        }
    };

    return (
        <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="flex justify-between items-end">
                {/* ... existing header content ... */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Good Afternoon, <span className="capitalize">{userName}</span>
                    </h1>
                    <p className="text-slate-500">
                        How are you feeling today? Let&apos;s track your progress.
                    </p>
                </div>
                {/* ... existing dialog ... */}
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-200">
                            <Plus className="mr-2 h-4 w-4" />
                            New Consultation
                        </Button>
                    </DialogTrigger>
                    {/* ... (keep dialog content exactly as is) ... */}
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Start New Assessment</DialogTitle>
                            <DialogDescription>
                                Before we begin, here&apos;s what to expect from your AI health consultation.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="flex items-start gap-4 p-3 bg-teal-50 rounded-lg border border-teal-100">
                                <Clock className="h-5 w-5 text-teal-600 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-teal-900 text-sm">Time Estimate</h4>
                                    <p className="text-sm text-teal-700">Approximately 2-5 minutes to complete.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-3 bg-teal-50 rounded-lg border border-teal-100">
                                <MessageSquare className="h-5 w-5 text-teal-600 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-teal-900 text-sm">Interactive Format</h4>
                                    <p className="text-sm text-teal-700">We&apos;ll ask about your symptoms, history, and patterns.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-amber-900 text-sm">Medical Disclaimer</h4>
                                    <p className="text-xs text-amber-800 leading-relaxed">
                                        This is an AI informational tool, not a doctor. In emergencies, call 911 immediately.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="sm:justify-between gap-2">
                            <p className="text-xs text-slate-400 self-center hidden sm:block">
                                <Info className="h-3 w-3 inline mr-1" />
                                Your privacy is protected
                            </p>
                            <Link href="/dashboard/consult" className="w-full sm:w-auto">
                                <Button className="w-full bg-teal-600 hover:bg-teal-700">
                                    I Understand, Start
                                </Button>
                            </Link>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Active Pathway Card (New) */}
            {activePathway && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 mb-8">
                    <PathwayCard
                        pathway={activePathway}
                        currentDay={calculateCurrentDay(new Date(history[0].created_at))}
                    />
                </div>
            )}

            {/* Optional Prakriti Assessment Prompt */}
            {
                !user?.user_metadata?.ayurvedic_profile?.prakriti && (
                    <div className="bg-gradient-to-r from-teal-800 to-teal-900 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden mb-8 group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-teal-200 text-sm font-medium uppercase tracking-wider">
                                    <Activity className="h-4 w-4" /> Ayurveda
                                </div>
                                <h3 className="text-2xl font-bold">Discover Your Body Type (Prakriti)</h3>
                                <p className="text-teal-100 max-w-lg">
                                    Take a quick 2-minute assessment to unlock personalized lifestyle, diet, and yoga recommendations based on your unique constitution.
                                </p>
                            </div>
                            <Link href="/dashboard/assessment/prakriti">
                                <Button className="bg-white text-teal-900 hover:bg-teal-50 border-0 shadow-lg font-semibold px-6">
                                    Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                )
            }

            {/* Stats / Quick Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* ... existing cards ... */}
                <Card className="border-slate-200 shadow-sm bg-white h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Last Assessment</CardTitle>
                        <Clock className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        {lastSession ? (
                            <>
                                <div className="text-xl font-medium text-slate-900">{getTimeAgo(lastSession.created_at)}</div>
                                <p className="text-xs text-slate-500 mt-1 capitalize">
                                    {lastSession.diagnosis.condition}
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="text-xl font-medium text-slate-400">No data yet</div>
                                <p className="text-xs text-slate-400 mt-1">Complete your first checkup</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm bg-white h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Pain Trend</CardTitle>
                        <Activity className="h-4 w-4 text-teal-500" />
                    </CardHeader>
                    <CardContent>
                        {history.length > 0 ? (
                            <>
                                <div className="text-xl font-medium text-slate-900">
                                    {lastSession?.symptoms.intensity ? `${lastSession.symptoms.intensity}/10` : 'N/A'}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Latest reported intensity</p>
                            </>
                        ) : (
                            <>
                                <div className="text-xl font-medium text-slate-400">No data yet</div>
                                <p className="text-xs text-slate-400 mt-1">Track over time</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <DailyTipCard />
            </div>

            {/* Recent Sessions */}
            {/* ... existing recent sessions section ... */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-800">Recent Sessions</h2>
                    {history.length > 0 && (
                        <Link href="/dashboard/history" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                            View All
                        </Link>
                    )}
                </div>

                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        {loadingHistory ? (
                            <div className="p-4 space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-lg" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : history.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {history.slice(0, 5).map((session) => (
                                    <div key={session.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-teal-50 p-2 rounded-lg text-teal-600">
                                                <Activity className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-slate-900">{session.diagnosis.condition}</h3>
                                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(session.created_at).toLocaleDateString()}
                                                    <span className="text-slate-300">•</span>
                                                    <span className="capitalize">{session.symptoms.location.join(", ")}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-teal-600">
                                            Details <ArrowRight className="ml-1 h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400">
                                <p>No recent sessions found.</p>
                                <p className="text-sm mt-2">Start a new consultation to track your health.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
