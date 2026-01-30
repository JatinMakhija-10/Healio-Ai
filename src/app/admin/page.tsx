"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/admin/MetricCard";
import { RealtimeMetricCard } from "@/components/admin/RealtimeMetricCard";
import { LiveViewToggle } from "@/components/admin/LiveViewToggle";
import { SystemHealthBadge } from "@/components/admin/SystemHealthBadge";
import { RealtimeProvider } from "@/lib/realtime/RealtimeProvider";
import { useRealtimeMetrics } from "@/hooks/useRealtimeMetrics";
import { useRouter } from "next/navigation";
import {
    Users,
    UserCheck,
    CreditCard,
    Activity,
    AlertTriangle,
    Clock,
    ArrowRight,
    TrendingUp,
    Shield,
    Zap,
    Server,
} from "lucide-react";
import Link from "next/link";

// Mock data for demo
const mockUrgentQueue = [
    {
        id: 1,
        type: "verification",
        title: "5 New Doctor Applications",
        description: "Pending credential verification",
        priority: "high",
        icon: UserCheck,
    },
    {
        id: 2,
        type: "compliance",
        title: "3 Suspicious Sessions",
        description: "Potential platform leakage detected",
        priority: "urgent",
        icon: Shield,
    },
    {
        id: 3,
        type: "support",
        title: "2 Refund Requests",
        description: "Awaiting admin approval",
        priority: "medium",
        icon: CreditCard,
    },
];

const mockLiveActivity = [
    { user: "Dr. Sharma", action: "Started consultation", time: "2 min ago" },
    { user: "Priya M.", action: "Completed payment ₹500", time: "5 min ago" },
    { user: "Dr. Patel", action: "Profile approved", time: "8 min ago" },
    { user: "Rahul V.", action: "Submitted diagnosis", time: "12 min ago" },
];

function AdminDashboardContent() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const { metrics, systemHealth } = useRealtimeMetrics({ enabled: true });

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

    const adminName = user?.user_metadata?.full_name || "Admin";

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                        <Zap className="h-4 w-4" />
                        <span>Control Center</span>
                        <SystemHealthBadge />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        The Pulse
                    </h1>
                    <p className="text-slate-500">
                        Welcome back, <span className="font-medium text-slate-700">{adminName}</span>. Here&apos;s what&apos;s happening.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2">
                        <Activity className="h-4 w-4" />
                        Export Report
                    </Button>
                    <LiveViewToggle />
                </div>
            </div>

            {/* Live Metrics Grid */}
            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <RealtimeMetricCard
                        title="Active Users"
                        value={metrics?.activeUsers || 0}
                        subtitle="currently online"
                        icon={Users}
                        variant="blue"
                        isLive={true}
                        lastUpdated={new Date()}
                    />
                    <RealtimeMetricCard
                        title="Live Consultations"
                        value={metrics?.activeConsultations || 0}
                        subtitle="in progress"
                        icon={Activity}
                        variant="green"
                        isLive={true}
                        lastUpdated={new Date()}
                    />
                    <MetricCard
                        title="Today's GMV"
                        value={`₹45,600`}
                        subtitle="gross merchandise value"
                        icon={CreditCard}
                        variant="purple"
                        trend={{ value: 8, label: "vs yesterday" }}
                    />
                    <MetricCard
                        title="Net Revenue"
                        value={`₹9,120`}
                        subtitle="platform commission (20%)"
                        icon={TrendingUp}
                        variant="teal"
                        trend={{ value: 8, label: "vs yesterday" }}
                    />
                </div>
            )}

            {/* System Health Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <RealtimeMetricCard
                    title="Uptime (24h)"
                    value={`${metrics?.uptime.last24h.toFixed(2) || '99.9'}%`}
                    icon={Server}
                    variant="green"
                    isLive={true}
                    lastUpdated={new Date()}
                />
                <RealtimeMetricCard
                    title="AI Latency (P99)"
                    value={`${metrics?.aiLatency.p99 || 42}ms`}
                    icon={Clock}
                    variant="blue"
                    isLive={true}
                    lastUpdated={new Date()}
                />
                <RealtimeMetricCard
                    title="Pending Doctors"
                    value={metrics?.pendingDoctors || 0}
                    icon={UserCheck}
                    variant="amber"
                    isLive={true}
                    lastUpdated={new Date()}
                    onClick={() => router.push('/admin/doctors')}
                />
                <RealtimeMetricCard
                    title="Flagged Sessions"
                    value={metrics?.flaggedSessions || 0}
                    icon={Shield}
                    variant="red"
                    isLive={true}
                    lastUpdated={new Date()}
                    onClick={() => router.push('/admin/compliance')}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Urgent Action Queue */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">Urgent Action Queue</CardTitle>
                                <Badge variant="destructive" className="text-xs">
                                    {mockUrgentQueue.length} pending
                                </Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="text-slate-500">
                                View All
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {mockUrgentQueue.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group cursor-pointer"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.priority === "urgent"
                                        ? "bg-red-100"
                                        : item.priority === "high"
                                            ? "bg-amber-100"
                                            : "bg-blue-100"
                                        }`}>
                                        <item.icon className={`h-6 w-6 ${item.priority === "urgent"
                                            ? "text-red-600"
                                            : item.priority === "high"
                                                ? "text-amber-600"
                                                : "text-blue-600"
                                            }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-slate-900">{item.title}</h4>
                                            {item.priority === "urgent" && (
                                                <Badge variant="destructive" className="text-[10px] h-4">URGENT</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500">{item.description}</p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Live Activity Feed */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <CardTitle className="text-lg">Live Activity</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {mockLiveActivity.map((activity, index) => (
                            <div key={index} className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-slate-700">
                                        <span className="font-medium">{activity.user}</span>{" "}
                                        <span className="text-slate-500">{activity.action}</span>
                                    </p>
                                    <p className="text-xs text-slate-400">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid md:grid-cols-3 gap-4">
                <Link href="/admin/doctors">
                    <Card className="group hover:shadow-lg transition-all cursor-pointer border-amber-100 hover:border-amber-200 bg-gradient-to-br from-amber-50 to-white">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-amber-600 font-semibold mb-1">Doctor Verification</p>
                                    <p className="text-2xl font-bold text-slate-900">{metrics?.pendingDoctors || 0} pending</p>
                                    <p className="text-sm text-slate-500 mt-2">Review credentials and approve doctors</p>
                                </div>
                                <UserCheck className="h-8 w-8 text-amber-400 group-hover:scale-110 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/transactions">
                    <Card className="group hover:shadow-lg transition-all cursor-pointer border-purple-100 hover:border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-purple-600 font-semibold mb-1">Transactions</p>
                                    <p className="text-2xl font-bold text-slate-900">₹45,600</p>
                                    <p className="text-sm text-slate-500 mt-2">Manage payments and payouts</p>
                                </div>
                                <CreditCard className="h-8 w-8 text-purple-400 group-hover:scale-110 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/compliance">
                    <Card className="group hover:shadow-lg transition-all cursor-pointer border-red-100 hover:border-red-200 bg-gradient-to-br from-red-50 to-white">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-red-600 font-semibold mb-1">Compliance</p>
                                    <p className="text-2xl font-bold text-slate-900">{metrics?.flaggedSessions || 0} flagged</p>
                                    <p className="text-sm text-slate-500 mt-2">Review suspicious sessions</p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-red-400 group-hover:scale-110 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}

// Wrapper with RealtimeProvider
export default function AdminDashboardPage() {
    return (
        <RealtimeProvider>
            <AdminDashboardContent />
        </RealtimeProvider>
    );
}
