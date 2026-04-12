"use client";

import { useEffect, useState, useCallback } from "react";
import { Chart } from "react-google-charts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Activity, DollarSign, Stethoscope, PieChart } from "lucide-react";

interface ChartData {
    userGrowth:          { date: string; count: number }[];
    consultationTrend:   { date: string; count: number }[];
    revenueTrend:        { date: string; amount: number }[];
    diseaseDistribution: { name: string; count: number }[];
    specialtyMix:        { name: string; count: number }[];
    roleCounts:          Record<string, number>;
}

const CHART_GREEN  = "#10b981";
const CHART_PURPLE = "#8b5cf6";
const CHART_BLUE   = "#3b82f6";
const CHART_AMBER  = "#f59e0b";

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<ChartData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchCharts = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/charts");
            const json = await res.json();
            if (json.success) setData(json.data);
        } catch (e) {
            console.error("Charts fetch failed", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCharts();
        const interval = setInterval(fetchCharts, 60_000);
        return () => clearInterval(interval);
    }, [fetchCharts]);

    // Build Google Charts data arrays
    const userGrowthData = data
        ? [["Date", "New Users"], ...data.userGrowth.map(d => [d.date.slice(5), d.count])]
        : [["Date", "New Users"]];

    const consultationData = data
        ? [["Date", "Consultations"], ...data.consultationTrend.map(d => [d.date.slice(5), d.count])]
        : [["Date", "Consultations"]];

    const revenueData = data
        ? [["Date", "Revenue (₹)"], ...data.revenueTrend.map(d => [d.date.slice(5), d.amount])]
        : [["Date", "Revenue (₹)"]];

    const diseaseData = data
        ? [["Disease", "Cases"], ...data.diseaseDistribution.map(d => [d.name, d.count])]
        : [["Disease", "Cases"]];

    const specialtyData = data
        ? [["Specialty", "Doctors"], ...data.specialtyMix.map(s => [s.name, s.count])]
        : [["Specialty", "Doctors"]];

    const roleData = data
        ? [["Role", "Count"], ...Object.entries(data.roleCounts).map(([k, v]) => [k, v])]
        : [["Role", "Count"]];

    const chartContainer = "h-[280px]";
    const chartBg = "transparent";

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-sm text-purple-600 font-medium mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Analytics & Insights</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Platform Analytics</h1>
                <p className="text-slate-500 mt-1">Live data — auto-refreshes every 60 seconds</p>
            </div>

            {/* Row 1: User Growth + Consultation Trend */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-green-500" />
                            <CardTitle className="text-base">User Growth</CardTitle>
                        </div>
                        <CardDescription>New registrations — last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className={chartContainer} />
                        ) : (
                            <div className={chartContainer}>
                                <Chart
                                    chartType="AreaChart"
                                    data={userGrowthData}
                                    options={{
                                        backgroundColor: chartBg,
                                        colors: [CHART_GREEN],
                                        legend: "none",
                                        chartArea: { top: 10, bottom: 40, left: 40, right: 20, width: "100%", height: "85%" },
                                        hAxis: { textStyle: { color: "#94a3b8", fontSize: 10 }, gridlines: { count: 5 } },
                                        vAxis: { textStyle: { color: "#94a3b8", fontSize: 10 }, gridlines: { color: "#f1f5f9" }, minValue: 0 },
                                        areaOpacity: 0.15,
                                        lineWidth: 2,
                                        pointSize: 4,
                                        curveType: "function",
                                    }}
                                    width="100%"
                                    height="100%"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-purple-500" />
                            <CardTitle className="text-base">Consultations Trend</CardTitle>
                        </div>
                        <CardDescription>AI diagnostic sessions — last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className={chartContainer} />
                        ) : (
                            <div className={chartContainer}>
                                <Chart
                                    chartType="AreaChart"
                                    data={consultationData}
                                    options={{
                                        backgroundColor: chartBg,
                                        colors: [CHART_PURPLE],
                                        legend: "none",
                                        chartArea: { top: 10, bottom: 40, left: 40, right: 20, width: "100%", height: "85%" },
                                        hAxis: { textStyle: { color: "#94a3b8", fontSize: 10 }, gridlines: { count: 5 } },
                                        vAxis: { textStyle: { color: "#94a3b8", fontSize: 10 }, gridlines: { color: "#f1f5f9" }, minValue: 0 },
                                        areaOpacity: 0.15,
                                        lineWidth: 2,
                                        pointSize: 4,
                                        curveType: "function",
                                    }}
                                    width="100%"
                                    height="100%"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Revenue + Disease Distribution */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-amber-500" />
                            <CardTitle className="text-base">Revenue Trend</CardTitle>
                        </div>
                        <CardDescription>Transaction volume — last 30 days (₹)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className={chartContainer} />
                        ) : (
                            <div className={chartContainer}>
                                <Chart
                                    chartType="ColumnChart"
                                    data={revenueData}
                                    options={{
                                        backgroundColor: chartBg,
                                        colors: [CHART_AMBER],
                                        legend: "none",
                                        chartArea: { top: 10, bottom: 40, left: 50, right: 20, width: "100%", height: "85%" },
                                        hAxis: { textStyle: { color: "#94a3b8", fontSize: 10 }, gridlines: { count: 5 } },
                                        vAxis: { textStyle: { color: "#94a3b8", fontSize: 10 }, gridlines: { color: "#f1f5f9" }, minValue: 0, format: "₹#,##0" },
                                        bar: { groupWidth: "70%" },
                                    }}
                                    width="100%"
                                    height="100%"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-red-500" />
                            <CardTitle className="text-base">Disease Distribution</CardTitle>
                        </div>
                        <CardDescription>Top 10 diagnoses on the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className={chartContainer} />
                        ) : (
                            <div className={chartContainer}>
                                <Chart
                                    chartType="PieChart"
                                    data={diseaseData}
                                    options={{
                                        backgroundColor: chartBg,
                                        legend: { position: "right", textStyle: { color: "#64748b", fontSize: 11 } },
                                        chartArea: { top: 10, bottom: 10, left: 10, right: 160, width: "100%", height: "90%" },
                                        pieHole: 0.45,
                                        colors: ["#6366f1","#8b5cf6","#a855f7","#c084fc","#3b82f6","#60a5fa","#10b981","#34d399","#f59e0b","#fb923c"],
                                        pieSliceTextStyle: { color: "#fff", fontSize: 10 },
                                    }}
                                    width="100%"
                                    height="100%"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: Specialty Mix + Role Breakdown */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <Stethoscope className="h-5 w-5 text-blue-500" />
                            <CardTitle className="text-base">Doctor Specialty Mix</CardTitle>
                        </div>
                        <CardDescription>Distribution of doctor specializations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className={chartContainer} />
                        ) : (
                            <div className={chartContainer}>
                                <Chart
                                    chartType="BarChart"
                                    data={specialtyData}
                                    options={{
                                        backgroundColor: chartBg,
                                        colors: [CHART_BLUE],
                                        legend: "none",
                                        chartArea: { top: 10, bottom: 30, left: 140, right: 30, width: "100%", height: "85%" },
                                        hAxis: { textStyle: { color: "#94a3b8", fontSize: 10 }, minValue: 0 },
                                        vAxis: { textStyle: { color: "#64748b", fontSize: 11 } },
                                        bar: { groupWidth: "60%" },
                                    }}
                                    width="100%"
                                    height="100%"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-500" />
                            <CardTitle className="text-base">User Role Breakdown</CardTitle>
                        </div>
                        <CardDescription>Patients, doctors, and admins</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className={chartContainer} />
                        ) : (
                            <div className={chartContainer}>
                                <Chart
                                    chartType="PieChart"
                                    data={roleData}
                                    options={{
                                        backgroundColor: chartBg,
                                        legend: { position: "right", textStyle: { color: "#64748b", fontSize: 12 } },
                                        chartArea: { top: 10, bottom: 10, left: 10, right: 140, width: "100%", height: "90%" },
                                        colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
                                        pieSliceTextStyle: { color: "#fff", fontSize: 11 },
                                    }}
                                    width="100%"
                                    height="100%"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
