"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RealtimeProvider } from "@/lib/realtime/RealtimeProvider";
import { useRouter } from "next/navigation";
import {
    Users, UserCheck, CreditCard, Activity,
    AlertTriangle, Clock, ArrowRight,
    TrendingUp, Shield, Zap, Server, Map, BarChart2,
} from "lucide-react";
import Link from "next/link";

interface PlatformStats {
    totalUsers: number;
    totalDoctors: number;
    pendingDoctors: number;
    totalConsultations: number;
    todayConsultations: number;
    newUsersToday: number;
    newUsersWeek: number;
    totalRevenue: number;
    activeUsers: number;
}

interface UrgentItem {
    id: number;
    icon: React.ElementType;
    priority: string;
    title: string;
    description: string;
    href: string;
}

function StatCard({ title, value, subtitle, icon: Icon, color, href }: {
    title: string; value: string | number; subtitle?: string;
    icon: React.ElementType; color: string; href?: string;
}) {
    const inner = (
        <Card className={`border-0 bg-gradient-to-br ${color} hover:shadow-md transition-all cursor-pointer group`}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-white/70">{title}</p>
                        <p className="text-3xl font-bold text-white mt-1">{value}</p>
                        {subtitle && <p className="text-xs text-white/60 mt-1">{subtitle}</p>}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
    return href ? <Link href={href}>{inner}</Link> : inner;
}

function AdminDashboardContent() {
    const { user } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/stats");
            const json = await res.json();
            if (json.success) {
                setStats(json.data);
                setLastUpdated(new Date());
            }
        } catch (e) {
            console.error("Stats fetch failed", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30_000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const adminName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin";

    const urgentItems: UrgentItem[] = ([
        stats?.pendingDoctors && stats.pendingDoctors > 0 ? {
            id: 1, icon: UserCheck, priority: "high",
            title: `${stats.pendingDoctors} Doctor Application${stats.pendingDoctors > 1 ? "s" : ""}`,
            description: "Pending credential verification",
            href: "/admin/doctors",
        } : null,
        stats?.todayConsultations && stats.todayConsultations > 0 ? {
            id: 2, icon: Activity, priority: "medium",
            title: `${stats.todayConsultations} Consultations Today`,
            description: "AI diagnostic sessions completed",
            href: "/admin/analytics",
        } : null,
        stats?.newUsersToday && stats.newUsersToday > 0 ? {
            id: 3, icon: Users, priority: "medium",
            title: `${stats.newUsersToday} New User${stats.newUsersToday > 1 ? "s" : ""} Today`,
            description: "New registrations today",
            href: "/admin/users",
        } : null,
    ].filter(Boolean)) as UrgentItem[];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                        <Zap className="h-4 w-4" />
                        <span>Control Center</span>
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200 ml-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs font-medium text-green-700">Live</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">The Pulse</h1>
                    <p className="text-slate-500">
                        Welcome back, <span className="font-medium text-slate-700">{adminName}</span>.
                        {" "}<span className="text-xs text-slate-400">Updated {lastUpdated.toLocaleTimeString()}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2" onClick={() => router.push("/admin/analytics")}>
                        <BarChart2 className="h-4 w-4" />
                        Analytics
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => router.push("/admin/map")}>
                        <Map className="h-4 w-4" />
                        Outbreak Map
                    </Button>
                </div>
            </div>

            {/* Primary Stats Grid */}
            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Users"
                        value={stats?.totalUsers ?? 0}
                        subtitle={`+${stats?.newUsersToday ?? 0} today`}
                        icon={Users}
                        color="from-blue-500 to-blue-600"
                        href="/admin/users"
                    />
                    <StatCard
                        title="Total Doctors"
                        value={stats?.totalDoctors ?? 0}
                        subtitle={`${stats?.pendingDoctors ?? 0} pending`}
                        icon={UserCheck}
                        color="from-emerald-500 to-teal-600"
                        href="/admin/doctors"
                    />
                    <StatCard
                        title="Consultations"
                        value={stats?.totalConsultations ?? 0}
                        subtitle={`${stats?.todayConsultations ?? 0} today`}
                        icon={Activity}
                        color="from-purple-500 to-purple-600"
                        href="/admin/analytics"
                    />
                    <StatCard
                        title="Revenue"
                        value={`₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`}
                        subtitle="total platform"
                        icon={CreditCard}
                        color="from-amber-500 to-orange-500"
                        href="/admin/transactions"
                    />
                </div>
            )}

            {/* System Health + Active Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Active Users", value: loading ? "—" : `${stats?.activeUsers ?? 0}`, sub: "last 15 min", icon: Users, color: "text-blue-600 bg-blue-50" },
                    { label: "Uptime (24h)", value: "99.95%", sub: "all systems go", icon: Server, color: "text-green-600 bg-green-50" },
                    { label: "New This Week", value: loading ? "—" : `${stats?.newUsersWeek ?? 0}`, sub: "new signups", icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
                    { label: "Pending Doctors", value: loading ? "—" : `${stats?.pendingDoctors ?? 0}`, sub: "need review", icon: Clock, color: "text-amber-600 bg-amber-50", onClick: () => router.push("/admin/doctors") },
                ].map(s => (
                    <Card
                        key={s.label}
                        className={`border-0 ${s.color.split(" ")[1]} ${s.onClick ? "cursor-pointer hover:shadow-sm" : ""} transition`}
                        onClick={s.onClick}
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${s.color.split(" ")[1]} flex items-center justify-center`}>
                                <s.icon className={`h-5 w-5 ${s.color.split(" ")[0]}`} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">{s.label}</p>
                                <p className={`text-xl font-bold ${s.color.split(" ")[0]}`}>{s.value}</p>
                                <p className="text-xs text-slate-400">{s.sub}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Action Queue */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">Action Queue</CardTitle>
                                {urgentItems.length > 0 && (
                                    <Badge variant="destructive" className="text-xs">{urgentItems.length} pending</Badge>
                                )}
                            </div>
                            <Button variant="ghost" size="sm" className="text-slate-500" onClick={() => router.push("/admin/doctors")}>
                                View All <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {loading ? (
                                [1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                            ) : urgentItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                    <Shield className="h-10 w-10 mb-2 text-green-400" />
                                    <p className="font-medium text-green-600">All clear!</p>
                                    <p className="text-sm">No pending actions</p>
                                </div>
                            ) : (
                                urgentItems.map(item => (
                                    <Link href={item.href} key={item.id}>
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group cursor-pointer">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.priority === "high" ? "bg-amber-100" : "bg-blue-100"}`}>
                                                <item.icon className={`h-6 w-6 ${item.priority === "high" ? "text-amber-600" : "text-blue-600"}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-slate-900">{item.title}</h4>
                                                    {item.priority === "high" && (
                                                        <Badge variant="destructive" className="text-[10px] h-4">ACTION</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500">{item.description}</p>
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </Link>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Nav */}
                <div className="space-y-4">
                    <Card className="border-l-4 border-l-red-400 bg-gradient-to-br from-red-50 to-white hover:shadow-md transition cursor-pointer group" onClick={() => router.push("/admin/map")}>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-red-600 font-semibold text-sm">🗺️ Outbreak Radar</p>
                                    <p className="text-xl font-bold text-slate-900 mt-1">Pandemic Map</p>
                                    <p className="text-xs text-slate-500 mt-1">Disease cluster detection</p>
                                </div>
                                <AlertTriangle className="h-7 w-7 text-red-400 group-hover:scale-110 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-400 bg-gradient-to-br from-purple-50 to-white hover:shadow-md transition cursor-pointer group" onClick={() => router.push("/admin/analytics")}>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-purple-600 font-semibold text-sm">📊 Analytics</p>
                                    <p className="text-xl font-bold text-slate-900 mt-1">6 Live Charts</p>
                                    <p className="text-xs text-slate-500 mt-1">Platform insights</p>
                                </div>
                                <BarChart2 className="h-7 w-7 text-purple-400 group-hover:scale-110 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-400 bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition cursor-pointer group" onClick={() => router.push("/admin/users")}>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-blue-600 font-semibold text-sm">👥 Users</p>
                                    <p className="text-xl font-bold text-slate-900 mt-1">{loading ? "—" : stats?.totalUsers ?? 0} Total</p>
                                    <p className="text-xs text-slate-500 mt-1">Manage all accounts</p>
                                </div>
                                <Users className="h-7 w-7 text-blue-400 group-hover:scale-110 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    return (
        <RealtimeProvider>
            <AdminDashboardContent />
        </RealtimeProvider>
    );
}
