"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSubscriptionStatus } from "@/lib/stripe/mockClient";
import { PlanSelectionModal } from "@/components/subscription/PlanSelectionModal";
import {
    Activity,
    Brain,
    Flame,
    Wind,
    Droplets,
    TrendingUp,
    Calendar,
    ArrowRight,
    Lock,
    Unlock,
    Leaf
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function WellnessPage() {
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
        getSubscriptionStatus().then((status) => {
            setIsPremium(status === 'plus' || status === 'pro');
            setLoading(false);
        });
    }, []);

    // Mock data for premium view
    const wellnessData = {
        vikritiScore: 72, // 0-100 balance score
        imbalance: {
            dominant: "Pitta",
            level: "High",
            trend: "improving"
        },
        trends: [
            { day: "M", score: 65 },
            { day: "T", score: 68 },
            { day: "W", score: 62 },
            { day: "T", score: 70 },
            { day: "F", score: 72 },
            { day: "S", score: 75 },
            { day: "S", score: 72 },
        ]
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-48 w-full rounded-xl" />
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Ayurvedic Wellness</h1>
                    <p className="text-slate-500">Track your Dosha balance and long-term vitality.</p>
                </div>
                {!isPremium && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5">
                        <Lock className="h-3 w-3" />
                        Premium Feature
                    </Badge>
                )}
            </div>

            {/* Main Content - Blurred if not premium */}
            <div className="relative">
                {!isPremium && (
                    <div className="absolute inset-0 z-10 backdrop-blur-sm bg-white/50 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200">
                        <div className="text-center p-8 max-w-md space-y-4 bg-white/90 shadow-xl rounded-2xl border border-white/50">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-teal-500/30">
                                <Leaf className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Unlock Wellness Insights</h3>
                                <p className="text-slate-500 text-sm mt-2">
                                    Track your Vata, Pitta, and Kapha levels over time. Get personalized lifestyle recommendations based on your bio-rhythms.
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowUpgradeModal(true)}
                                className="w-full bg-slate-900 text-white hover:bg-slate-800"
                            >
                                Upgrade to Plus
                            </Button>
                        </div>
                    </div>
                )}

                <div className={`space-y-6 transition-all duration-500 ${!isPremium ? "opacity-20 pointer-events-none select-none grayscale-[0.5]" : ""}`}>
                    {/* Score Card */}
                    <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
                        <CardContent className="p-8">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="relative w-32 h-32 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                            <path
                                                className="text-emerald-200"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                            />
                                            <path
                                                className="text-emerald-600"
                                                strokeDasharray={`${wellnessData.vikritiScore}, 100`}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                                            <span className="text-3xl font-bold text-emerald-900">{wellnessData.vikritiScore}</span>
                                            <span className="text-[10px] uppercase font-bold text-emerald-600">Balance</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Your Harmony Score is Good</h3>
                                        <p className="text-slate-600 max-w-sm mt-1">
                                            Your <span className="font-semibold text-emerald-700">Pitta</span> levels are stabilizing. Previous heating patterns are reducing thanks to your cooling diet.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
                                    <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-emerald-100/50">
                                        <Wind className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                                        <p className="text-xs font-bold text-slate-500">VATA</p>
                                        <p className="font-semibold text-slate-700">Balanced</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-xl shadow-sm ring-2 ring-emerald-500/20 border border-emerald-500">
                                        <Flame className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                                        <p className="text-xs font-bold text-emerald-700">PITTA</p>
                                        <p className="font-semibold text-slate-900">Elevated</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-emerald-100/50">
                                        <Droplets className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                                        <p className="text-xs font-bold text-slate-500">KAPHA</p>
                                        <p className="font-semibold text-slate-700">Low</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Trends Chart Mockup */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-slate-400" />
                                    Balance History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-48 flex items-end justify-between gap-2 pt-4">
                                    {wellnessData.trends.map((point, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                            <div
                                                className="w-full bg-emerald-100 rounded-t-lg transition-all group-hover:bg-emerald-200 relative"
                                                style={{ height: `${point.score}%` }}
                                            >
                                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded transition-opacity">
                                                    {point.score}
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400 font-medium">{point.day}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recommendations */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Brain className="h-5 w-5 text-slate-400" />
                                    Daily Focus
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-3">
                                    <div className="mt-0.5"><Flame className="h-4 w-4 text-amber-600" /></div>
                                    <div>
                                        <p className="text-sm font-medium text-amber-900">Avoid spicy foods today</p>
                                        <p className="text-xs text-amber-700">Pitta is slightly aggravated. Opt for cooling foods like cucumber or mint.</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-start gap-3">
                                    <div className="mt-0.5"><Leaf className="h-4 w-4 text-emerald-600" /></div>
                                    <div>
                                        <p className="text-sm font-medium text-emerald-900">Evening Meditation</p>
                                        <p className="text-xs text-emerald-700">10 mins of cooling Pranayama (Sheetali) recommended before sleep.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <PlanSelectionModal
                open={showUpgradeModal}
                onOpenChange={setShowUpgradeModal}
                featureLocked="Wellness Tracking"
            />
        </div>
    );
}
