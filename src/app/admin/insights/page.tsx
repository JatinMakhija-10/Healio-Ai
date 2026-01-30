"use client";

import { EpidemicHeatmap } from "@/components/admin/analytics/EpidemicHeatmap";
import { Activity, TrendingUp, AlertTriangle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InsightsPage() {
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

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            National Risk Level
                        </CardTitle>
                        <Activity className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">Moderate</div>
                        <p className="text-xs text-muted-foreground">
                            +12% vs last week
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Clusters
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">4 Critical</div>
                        <p className="text-xs text-muted-foreground">
                            Maharashtra, Delhi
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Affected Population
                        </CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">14.2k</div>
                        <p className="text-xs text-muted-foreground">
                            Est. active cases
                        </p>
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
