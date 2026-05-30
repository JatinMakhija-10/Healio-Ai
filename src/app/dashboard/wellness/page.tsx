"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSubscriptionStatus } from "@/lib/stripe/mockClient";
import { hasFeature } from "@/lib/subscription/plans";
import { PlanSelectionModal } from "@/components/subscription/PlanSelectionModal";
import {
    Brain,
    Flame,
    Wind,
    Droplets,
    TrendingUp,
    Lock,
    Leaf,
    Sun,
    Moon,
    BookOpen,
    Zap,
    Heart,
    Sparkles,
    ArrowUpRight,
    CalendarDays,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface DoshaLevel {
    name: string;
    value: number;
    status: "balanced" | "elevated" | "low";
    icon: React.ReactNode;
    color: string;
}

interface DailyRecommendation {
    id: string;
    title: string;
    description: string;
    category: "food" | "movement" | "mindfulness" | "rest";
    icon: React.ReactNode;
    bgColor: string;
    borderColor: string;
    textColor: string;
}

interface TrendPoint {
    day: string;
    score: number;
    date: string;
}

const STORAGE_KEY_STREAK = "healio_wellness_streak";
const STORAGE_KEY_LAST_VISIT = "healio_wellness_last_visit";

function computeStreak(): number {
    try {
        const lastVisit = localStorage.getItem(STORAGE_KEY_LAST_VISIT);
        const streak = parseInt(localStorage.getItem(STORAGE_KEY_STREAK) || "0", 10);
        const today = new Date().toDateString();

        if (lastVisit === today) return streak;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastVisit === yesterday.toDateString()) {
            const newStreak = streak + 1;
            localStorage.setItem(STORAGE_KEY_STREAK, String(newStreak));
            localStorage.setItem(STORAGE_KEY_LAST_VISIT, today);
            return newStreak;
        }

        localStorage.setItem(STORAGE_KEY_STREAK, "1");
        localStorage.setItem(STORAGE_KEY_LAST_VISIT, today);
        return 1;
    } catch {
        return 1;
    }
}

function getSeasonalTip(): { title: string; body: string; season: string } {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) {
        return {
            season: "Spring (Vasant)",
            title: "Kapha season — lighten your diet",
            body: "Favour warm, light foods. Add ginger and turmeric to meals. Start mornings with dry brushing to stimulate circulation.",
        };
    }
    if (month >= 5 && month <= 8) {
        return {
            season: "Summer (Grishma)",
            title: "Pitta season — cool and hydrate",
            body: "Drink cooling buttermilk (chaas). Avoid midday sun. Use coconut oil on scalp. Rose water mist for instant relief.",
        };
    }
    return {
        season: "Winter (Hemant)",
        title: "Vata season — warm and nourish",
        body: "Eat warm, oily foods. Sesame oil self-massage (abhyanga) before bath. Keep a fixed sleep schedule to ground Vata energy.",
    };
}

function generateWeeklyTrends(): TrendPoint[] {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const result: TrendPoint[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayIdx = d.getDay();
        const seed = d.getDate() * 7 + d.getMonth() * 31;
        const score = 55 + (seed % 35);
        result.push({ day: days[dayIdx], score: Math.min(score, 95), date: d.toDateString() });
    }
    return result;
}

export default function WellnessPage() {
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [streak] = useState(() => computeStreak());

    useEffect(() => {
        getSubscriptionStatus().then((status) => {
            setIsPremium(hasFeature(status, "vikriti_wellness_tracking"));
            setLoading(false);
        });
    }, []);

    const seasonalTip = useMemo(() => getSeasonalTip(), []);
    const trends = useMemo(() => generateWeeklyTrends(), []);
    const todayScore = trends[trends.length - 1]?.score ?? 72;
    const maxScore = Math.max(...trends.map(t => t.score));

    const doshas: DoshaLevel[] = [
        { name: "Vata", value: 38, status: "balanced", icon: <Wind className="h-5 w-5" />, color: "text-sky-500" },
        { name: "Pitta", value: 71, status: "elevated", icon: <Flame className="h-5 w-5" />, color: "text-amber-500" },
        { name: "Kapha", value: 25, status: "low", icon: <Droplets className="h-5 w-5" />, color: "text-blue-400" },
    ];

    const recommendations: DailyRecommendation[] = [
        {
            id: "r1",
            title: "Cooling foods today",
            description: "Pitta is elevated — choose cucumber raita, mint chutney, and coconut water.",
            category: "food",
            icon: <Leaf className="h-4 w-4" />,
            bgColor: "bg-emerald-50",
            borderColor: "border-emerald-100",
            textColor: "text-emerald-800",
        },
        {
            id: "r2",
            title: "5-min Sheetali Pranayama",
            description: "Cooling breath before lunch — roll tongue, inhale through mouth, exhale through nose.",
            category: "mindfulness",
            icon: <Wind className="h-4 w-4" />,
            bgColor: "bg-sky-50",
            borderColor: "border-sky-100",
            textColor: "text-sky-800",
        },
        {
            id: "r3",
            title: "Walk after dinner",
            description: "100 steps (shatapavali) after your evening meal to aid digestion and calm Pitta.",
            category: "movement",
            icon: <Heart className="h-4 w-4" />,
            bgColor: "bg-rose-50",
            borderColor: "border-rose-100",
            textColor: "text-rose-800",
        },
    ];

    if (loading) {
        return (
            <div className="space-y-6 max-w-5xl mx-auto">
                <Skeleton className="h-10 w-64 rounded-lg" />
                <Skeleton className="h-56 w-full rounded-2xl" />
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 rounded-2xl" />
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Wellness</h1>
                    <p className="text-gray-500 mt-1">Your daily dosha balance, habits, and seasonal care.</p>
                </div>
                <div className="flex items-center gap-3">
                    {streak > 1 && (
                        <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5">
                            <Zap className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-xs font-semibold text-amber-700">{streak}-day streak</span>
                        </div>
                    )}
                    {!isPremium && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5">
                            <Lock className="h-3 w-3" />
                            Premium
                        </Badge>
                    )}
                </div>
            </div>

            <div className="relative">
                {!isPremium && (
                    <div className="absolute inset-0 z-10 backdrop-blur-[3px] bg-white/60 flex items-center justify-center rounded-2xl">
                        <div className="text-center p-8 max-w-sm space-y-4 bg-white shadow-2xl rounded-2xl border">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto">
                                <Leaf className="h-7 w-7 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Unlock Wellness Tracking</h3>
                            <p className="text-sm text-gray-500">
                                Track dosha balance, get personalized daily tips, and monitor your vitality trends over time.
                            </p>
                            <Button onClick={() => setShowUpgradeModal(true)} className="w-full">
                                Upgrade to Plus
                            </Button>
                        </div>
                    </div>
                )}

                <div className={`space-y-6 ${!isPremium ? "opacity-20 pointer-events-none select-none" : ""}`}>
                    <Card className="overflow-hidden border-0 shadow-sm bg-gradient-to-br from-emerald-50 via-white to-teal-50">
                        <CardContent className="p-6 md:p-8">
                            <div className="flex flex-col lg:flex-row items-center gap-8">
                                <div className="relative w-36 h-36 shrink-0">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
                                        <circle
                                            cx="18" cy="18" r="15.9"
                                            fill="none"
                                            stroke="#059669"
                                            strokeWidth="2.5"
                                            strokeDasharray={`${todayScore} 100`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-bold text-gray-900">{todayScore}</span>
                                        <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Harmony</span>
                                    </div>
                                </div>

                                <div className="flex-1 w-full">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dosha Balance</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {doshas.map(d => (
                                            <div
                                                key={d.name}
                                                className={`text-center p-4 rounded-xl border bg-white transition-shadow hover:shadow-md ${
                                                    d.status === "elevated" ? "ring-2 ring-amber-200 border-amber-300" : "border-gray-100"
                                                }`}
                                            >
                                                <div className={`mx-auto mb-2 ${d.color}`}>{d.icon}</div>
                                                <p className="text-xs font-bold text-gray-500 uppercase">{d.name}</p>
                                                <p className="text-lg font-bold text-gray-900">{d.value}%</p>
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                                    d.status === "balanced" ? "bg-green-100 text-green-700" :
                                                    d.status === "elevated" ? "bg-amber-100 text-amber-700" :
                                                    "bg-blue-100 text-blue-700"
                                                }`}>
                                                    {d.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="border-gray-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-gray-400" />
                                    7-Day Harmony Trend
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-44 flex items-end justify-between gap-1.5 pt-4">
                                    {trends.map((point, i) => {
                                        const height = (point.score / maxScore) * 100;
                                        const isToday = i === trends.length - 1;
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                                                <div className="relative w-full">
                                                    <div
                                                        className={`w-full rounded-md transition-all ${
                                                            isToday ? "bg-emerald-500" : "bg-emerald-100 group-hover:bg-emerald-200"
                                                        }`}
                                                        style={{ height: `${height * 1.6}px` }}
                                                    />
                                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap transition-opacity">
                                                        {point.score}
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-medium ${isToday ? "text-emerald-700 font-bold" : "text-gray-400"}`}>
                                                    {point.day}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-gray-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-gray-400" />
                                    Today&apos;s Focus
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {recommendations.map(rec => (
                                    <div key={rec.id} className={`p-3 rounded-lg border ${rec.bgColor} ${rec.borderColor} flex items-start gap-3`}>
                                        <div className={`mt-0.5 ${rec.textColor}`}>{rec.icon}</div>
                                        <div className="min-w-0">
                                            <p className={`text-sm font-medium ${rec.textColor}`}>{rec.title}</p>
                                            <p className="text-xs text-gray-600 mt-0.5">{rec.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
                        <div className="flex items-start gap-4">
                            <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <CalendarDays className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-amber-900">{seasonalTip.title}</h4>
                                    <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                        {seasonalTip.season}
                                    </span>
                                </div>
                                <p className="text-sm text-amber-800 leading-relaxed">{seasonalTip.body}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
                <Link href="/dashboard/wellness/library" className="group">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 flex items-center gap-4 hover:shadow-md hover:border-emerald-200 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
                            <BookOpen className="h-5 w-5 text-emerald-700" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">Remedies Library</p>
                            <p className="text-xs text-gray-500 truncate">Traditional self-care with evidence labels</p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 shrink-0 ml-auto transition-colors" />
                    </div>
                </Link>

                <Link href="/dashboard/wellness/routines" className="group">
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 flex items-center gap-4 hover:shadow-md hover:border-indigo-200 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-200 transition-colors">
                            <Sun className="h-5 w-5 text-indigo-700" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">Daily Routines</p>
                            <p className="text-xs text-gray-500 truncate">Morning &amp; evening wellness habits</p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 shrink-0 ml-auto transition-colors" />
                    </div>
                </Link>

                <Link href="/dashboard/consult" className="group">
                    <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-5 flex items-center gap-4 hover:shadow-md hover:border-teal-200 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0 group-hover:bg-teal-200 transition-colors">
                            <Sparkles className="h-5 w-5 text-teal-700" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">Ask Healio</p>
                            <p className="text-xs text-gray-500 truncate">Wellness guidance &amp; home remedies</p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-teal-500 shrink-0 ml-auto transition-colors" />
                    </div>
                </Link>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-center gap-2 text-xs text-gray-400">
                {new Date().getHours() < 12 ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}
                {" · "}
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
            </div>

            <PlanSelectionModal
                open={showUpgradeModal}
                onOpenChange={setShowUpgradeModal}
                featureLocked="Wellness Tracking"
            />
        </div>
    );
}
