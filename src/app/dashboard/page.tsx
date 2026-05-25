"use client";

import { useEffect, useState } from "react";
import { DailyTipCard } from "@/components/dashboard/DailyTipCard";
import { WellnessEntryCards } from "@/components/wellness/WellnessEntryCards";
import { PHASE_CONFIG } from "@/lib/phaseConfig";
import { SeasonalBanner } from "@/components/wellness/SeasonalBanner";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

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
    const { user, profile, loading } = useAuth();
    const [history, setHistory] = useState<Consultation[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [localName, setLocalName] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!user && !loading) {
            router.push('/login');
            return;
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            const storageKey = `healio_pending_profile_${user.id}`;
            const storedProfile = localStorage.getItem(storageKey);
            if (storedProfile) {
                try {
                    const parsed = JSON.parse(storedProfile);
                    // eslint-disable-next-line react-hooks/set-state-in-effect
                    if (parsed.full_name) setLocalName(parsed.full_name);
                } catch {
                    /* ignore */
                }
            }
        }

        async function loadDashboardData() {
            if (!user) return;
            try {
                const parsed = await api.getPatientConsultations(user.id);
                setHistory(parsed as Consultation[]);
                const historyKey = `healio_consultation_history_${user.id}`;
                localStorage.setItem(historyKey, JSON.stringify(parsed));
            } catch (e) {
                console.error("Failed to load dashboard data", e);
            }
            setLoadingHistory(false);
        }

        loadDashboardData();
    }, [user]);

    const userName = profile?.full_name || user?.user_metadata?.full_name || localName || user?.email?.split("@")[0] || "User";
    const isPersonaBuilt = Boolean(
        user?.user_metadata?.medical_profile?.onboarding_completed ||
        user?.user_metadata?.onboarding_completed
    );

    const lastSession = history[0];

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
        } catch {
            return "Recently";
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fadeInUp">
            {/* Welcome Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 style={{ fontFamily: "var(--font-dm-serif), serif", fontSize: "32px", fontWeight: 400, color: "#111827", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                        {getGreeting()}, <span className="capitalize">{userName}</span>
                    </h1>
                    <p className="text-[15px] text-slate-500 mt-1">
                        Your calm, culturally familiar wellness guide.
                    </p>
                </div>
                <Link href="/dashboard/consult">
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-5 shadow-sm transition-all duration-150 py-2.5 h-auto font-semibold">
                        <Plus className="mr-2 h-4 w-4" /> New Consultation
                    </Button>
                </Link>
            </div>

            {isPersonaBuilt ? (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-sm text-green-800 font-medium">
                        ✓ Health persona built. Consultations are now personalised to you.
                    </p>
                    <Link href="/onboarding" className="shrink-0">
                        <Button size="sm" variant="outline" className="border-green-300 text-green-800 hover:bg-green-100">
                            Edit Persona
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-sm text-teal-900">
                        Build your persona to unlock more personalized health insights and recommendations.
                    </p>
                    <Link href="/onboarding" className="shrink-0">
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                            Build Persona
                        </Button>
                    </Link>
                </div>


            )}

            {PHASE_CONFIG.showWellnessSection && <WellnessEntryCards />}
            {PHASE_CONFIG.showWellnessSection && <SeasonalBanner />}
            {PHASE_CONFIG.showDailyTipCard && <DailyTipCard />}

            <div className="grid md:grid-cols-2 gap-6">
                {/* Last Assessment */}
                <Card className="rounded-xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow duration-200 overflow-hidden bg-white">
                    <div className="p-6 pb-5">
                        <div className="flex justify-between items-start mb-5">
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF" }}>
                                LAST ASSESSMENT
                            </span>
                            <div className="bg-teal-50 text-teal-600 p-1.5 rounded-full border border-teal-100/50">
                                <Clock className="h-4 w-4" />
                            </div>
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: "#111827", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                            {lastSession ? getTimeAgo(lastSession.created_at) : "—"}
                        </div>
                        <p className="text-[15px] text-slate-500 mt-1 capitalize">
                            {lastSession?.diagnosis?.condition ?? "Complete your first checkup"}
                        </p>
                        <div className="mt-6 pt-4 border-t border-slate-100">
                            <Link href="/dashboard/history" className="inline-flex items-center text-[13.5px] font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                                View session <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>
                </Card>

                {/* Total Consultations */}
                <Card className="rounded-xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow duration-200 overflow-hidden bg-white">
                    <div className="p-6 pb-5">
                        <div className="flex justify-between items-start mb-5">
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF" }}>
                                TOTAL CONSULTATIONS
                            </span>
                            <div className="bg-teal-50 text-teal-600 p-1.5 rounded-full border border-teal-100/50">
                                <Activity className="h-4 w-4" />
                            </div>
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: "#111827", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                            {history.length}
                        </div>
                        <p className="text-[15px] text-slate-500 mt-1 capitalize">
                            Sessions completed
                        </p>
                        <div className="mt-6 pt-4 border-t border-slate-100">
                            <Link href="/dashboard/history" className="inline-flex items-center text-[13.5px] font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                                View all history <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="pt-4">
                <div className="flex justify-between items-end mb-4 px-1 group">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Sessions</h2>
                        <p className="text-[14px] text-slate-500 mt-0.5">Your last 5 consultations</p>
                    </div>
                    {history.length > 0 && (
                        <Link href="/dashboard/history" className="text-[13.5px] font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center group-hover:underline">
                            View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                    )}
                </div>

                <Card className="rounded-xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] overflow-hidden bg-white">
                    <div className="hidden md:grid grid-cols-[1fr_120px_100px_90px] gap-4 px-6 py-3.5 bg-slate-50/50 border-b border-slate-100">
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF" }}>Diagnosis</div>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF" }}>Date</div>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF" }}>Duration</div>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF" }}>Status</div>
                    </div>
                    {loadingHistory ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : history.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {history.slice(0, 5).map((session, index) => {
                                const mockDuration = `${8 + index * 3} min`;
                                const sessionDate = new Date(session.created_at);
                                const formattedDate = sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                const condition = session.diagnosis?.condition && session.diagnosis.condition !== "Unknown" ? session.diagnosis.condition : "General Consultation";

                                return (
                                    <div key={session.id} className="grid md:grid-cols-[1fr_120px_100px_90px] gap-4 px-6 py-4 items-center hover:bg-slate-50/50 transition-colors">
                                        {/* Diagnosis Column */}
                                        <div className="flex items-center gap-3">
                                            <Activity className="h-[18px] w-[18px] text-teal-500 shrink-0" />
                                            <span className="font-semibold outline-none text-[15px] text-slate-900 leading-tight">
                                                {condition}
                                            </span>
                                        </div>

                                        {/* Date Column */}
                                        <div className="text-[14.5px] text-slate-500 hidden md:block">
                                            {formattedDate}
                                        </div>

                                        {/* Duration Column */}
                                        <div className="text-[14.5px] text-slate-500 hidden md:block">
                                            {mockDuration}
                                        </div>

                                        {/* Status Column */}
                                        <div className="hidden md:block">
                                            <span style={{
                                                fontSize: 10,
                                                fontWeight: 700,
                                                letterSpacing: "0.05em",
                                                background: "#DCFCE7",
                                                color: "#15803D",
                                                padding: "4px 8px",
                                                borderRadius: 100
                                            }}>
                                                COMPLETED
                                            </span>
                                        </div>

                                        {/* Mobile Only: Show meta info below title */}
                                        <div className="md:hidden flex items-center gap-3 text-sm text-slate-500 mt-1 pl-8">
                                            <span>{formattedDate}</span>
                                            <span>•</span>
                                            <span>{mockDuration}</span>
                                            <span className="ml-auto" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", background: "#DCFCE7", color: "#15803D", padding: "3px 6px", borderRadius: 100 }}>
                                                COMPLETED
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-10 text-center flex flex-col items-center justify-center">
                            <div className="bg-slate-50 p-3 rounded-full mb-3">
                                <Activity className="h-6 w-6 text-slate-300" />
                            </div>
                            <p className="font-medium text-slate-500">No recent sessions found.</p>
                            <p className="text-sm mt-1 text-slate-400">Start a new consultation to track your health.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
