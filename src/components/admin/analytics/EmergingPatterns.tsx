"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertCircle, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Mock Data for "Emerging Patterns"
const PATTERNS = [
    {
        id: 1,
        title: "Dengue-like Symptoms Cluster",
        region: "Maharashtra (Mumbai)",
        confidence: 89,
        severity: "High",
        symptoms: ["High Fever", "Joint Pain", "Rash"],
        trend: "up",
        detected_at: "2 hours ago"
    },
    {
        id: 2,
        title: "Respiratory Spike",
        region: "Delhi NCR",
        confidence: 75,
        severity: "Moderate",
        symptoms: ["Cough", "Shortness of Breath"],
        trend: "stable",
        detected_at: "5 hours ago"
    },
    {
        id: 3,
        title: "Waterborne Illness Risk",
        region: "Kerala (Coastal)",
        confidence: 62,
        severity: "Low",
        symptoms: ["Nausea", "Dehydration"],
        trend: "down",
        detected_at: "1 day ago"
    }
];

export function EmergingPatterns() {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    Emerging Patterns
                </CardTitle>
                <CardDescription>
                    AI-detected symptom anomalies and potential outbreaks.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {PATTERNS.map((pattern) => (
                        <div key={pattern.id} className="flex flex-col gap-3 p-4 border rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                        {pattern.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <span>{pattern.region}</span>
                                        <span>•</span>
                                        <span>{pattern.detected_at}</span>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={
                                        pattern.severity === "High" ? "bg-red-50 text-red-700 border-red-200" :
                                            pattern.severity === "Moderate" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                                "bg-blue-50 text-blue-700 border-blue-200"
                                    }
                                >
                                    {pattern.severity} Impact
                                </Badge>
                            </div>

                            {/* Confidence Score */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>AI Confidence</span>
                                    <span>{pattern.confidence}%</span>
                                </div>
                                <Progress value={pattern.confidence} className="h-1.5" />
                            </div>

                            {/* Symptoms */}
                            <div className="flex flex-wrap gap-2">
                                {pattern.symptoms.map(sym => (
                                    <Badge key={sym} variant="secondary" className="text-xs font-normal">
                                        {sym}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// Mock Data for AI Health
const AI_METRICS = {
    total_tokens: "14.5M",
    avg_latency: "450ms",
    accuracy_rate: "94.2%",
    cache_hit_rate: "68%"
};

export function AIHealthDetail() {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    AI Engine Health
                </CardTitle>
                <CardDescription>
                    Performance metrics for the Prakriti diagnostic engine.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-slate-50 border">
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Tokens</div>
                        <div className="text-2xl font-bold text-slate-900">{AI_METRICS.total_tokens}</div>
                        <div className="text-xs text-green-600 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" /> +12% vs avg
                        </div>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border">
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Avg Latency</div>
                        <div className="text-2xl font-bold text-slate-900">{AI_METRICS.avg_latency}</div>
                        <div className="text-xs text-green-600 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" /> Optimal
                        </div>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border">
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Dx Accuracy</div>
                        <div className="text-2xl font-bold text-slate-900">{AI_METRICS.accuracy_rate}</div>
                        <div className="text-xs text-slate-500 mt-1">
                            Based on doc feedback
                        </div>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border">
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Cache Hit</div>
                        <div className="text-2xl font-bold text-slate-900">{AI_METRICS.cache_hit_rate}</div>
                        <div className="text-xs text-slate-500 mt-1">
                            Redis active
                        </div>
                    </div>
                </div>

                <div className="mt-6 border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">Model Drift Analysis</h4>
                    <div className="h-32 flex items-end justify-between gap-1">
                        {[40, 65, 45, 80, 55, 70, 60, 90, 75, 85].map((h, i) => (
                            <div
                                key={i}
                                className="w-full bg-blue-100 hover:bg-blue-200 rounded-t-sm transition-colors relative group"
                                style={{ height: `${h}%` }}
                            >
                                <div className="absolute bottom-0 w-full h-[2px] bg-blue-500 opacity-50"></div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-2">
                        <span>7 Days Ago</span>
                        <span>Today</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
