"use client";

import { useEffect, useState } from "react";
import { EpidemicHeatmap } from "@/components/admin/analytics/EpidemicHeatmap";
import { Activity, TrendingUp, AlertTriangle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface OutbreakSummary {
    totalClusters: number;
    highAlertZones: number;
    moderateAlertZones: number;
    totalCases48h: number;
    totalCases7d: number;
    topCondition: string;
    points: { state: string; outbreakScore: string }[];
}

function deriveRiskLevel(highZones: number, moderateZones: number): { label: string; color: string } {
    if (highZones >= 3) return { label: "Critical", color: "text-red-600" };
    if (highZones >= 1) return { label: "Elevated", color: "text-orange-600" };
    if (moderateZones >= 3) return { label: "Moderate", color: "text-amber-600" };
    return { label: "Low", color: "text-green-600" };
}

export default function InsightsPage() {
    const [data, setData] = useState<OutbreakSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/admin/outbreak-map");
                const json = await res.json();
                if (cancelled) return;
                if (json.success) setData(json.data);
            } catch (err) {
                console.error("Failed to load insights data:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const risk = data
        ? deriveRiskLevel(data.highAlertZones, data.moderateAlertZones)
        : { label: "—", color: "text-slate-400" };

    const topStates = data
        ? Array.from(new Set(
            data.points
                .filter(p => p.outbreakScore === "HIGH" || p.outbreakScore === "MODERATE")
                .map(p => p.state)
          )).slice(0, 2).join(", ") || "None"
        : "—";

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex flex-col gap-2 shrink-0">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    Strategic Insights
                </h1>
                <p className="text-slate-500">
                    Geospatial analysis of health trends and predictive epidemic modeling.
                </p>
            </div>

            {/* KPI Cards — driven by /api/admin/outbreak-map */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">National Risk Level</CardTitle>
                        <Activity className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-32" />
                        ) : (
                            <>
                                <div className={`text-2xl font-bold ${risk.color}`}>{risk.label}</div>
                                <p className="text-xs text-muted-foreground">
                                    Based on {data?.totalClusters ?? 0} active clusters
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Clusters</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-32" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-slate-900">
                                    {data?.highAlertZones ?? 0} High
                                    {data?.moderateAlertZones ? ` · ${data.moderateAlertZones} Moderate` : ""}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {topStates === "None" || topStates === "—"
                                        ? "No high-priority states"
                                        : topStates}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cases (48h)</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-32" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-slate-900">
                                    {(data?.totalCases48h ?? 0).toLocaleString("en-IN")}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    7-day total: {(data?.totalCases7d ?? 0).toLocaleString("en-IN")}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Map Area */}
            <div className="flex-1 min-h-0">
                <EpidemicHeatmap />
            </div>
        </div>
    );
}
