"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentCard, AppointmentCardProps } from "@/components/doctor/AppointmentCard";
import {
    Calendar,
    Users,
    TrendingUp,
    Clock,
    Video,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Activity,
} from "lucide-react";
import Link from "next/link";

import { api, Appointment } from "@/lib/api";

export default function DoctorDashboardPage() {
    const { user, profile, doctorProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todayCount: 0,
        weekCount: 0,
        completedToday: 0,
        revenue: 0
    });
    const [todayAppointments, setTodayAppointments] = useState<AppointmentCardProps[]>([]);

    useEffect(() => {
        async function fetchDashboardData() {
            if (!user) return;
            try {
                // 1. Get Doctor Profile ID (prefer context, fallback to API)
                let doctorId = doctorProfile?.id;

                if (!doctorId) {
                    const doctorData = await api.getDoctorProfile(user.id);
                    if (doctorData) {
                        doctorId = doctorData.id;
                    }
                }

                if (!doctorId) {
                    console.log("No doctor profile found for user");
                    setLoading(false);
                    return;
                }

                // 2. Get Appointments
                const appointments = await api.getDoctorAppointments(doctorId);

                // 3. Map to UI Model
                const mapped: AppointmentCardProps[] = appointments.map((apt: any) => ({
                    id: apt.id,
                    patientName: apt.patient?.full_name || "Unknown Patient",
                    patientAvatar: apt.patient?.avatar_url,
                    scheduledAt: new Date(apt.scheduled_at),
                    duration: apt.duration_minutes,
                    status: apt.status,
                    chiefComplaint: apt.notes || "No notes provided",
                    aiDiagnosis: "Pending Analysis", // Placeholder until linked to consultations
                    aiConfidence: 0,
                    hasRedFlags: false,
                    isUrgent: false,
                }));

                const today = new Date();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
                const endOfWeek = new Date(today);
                endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Saturday

                // Filter for "Today"
                const todayOnly = mapped.filter(apt => {
                    const d = apt.scheduledAt;
                    return d.getDate() === today.getDate() &&
                        d.getMonth() === today.getMonth() &&
                        d.getFullYear() === today.getFullYear();
                });

                // Calculate Stats
                const weekCount = mapped.filter(apt => {
                    const d = apt.scheduledAt;
                    return d >= startOfWeek && d <= endOfWeek;
                }).length;

                const completedToday = todayOnly.filter(apt => apt.status === 'completed').length;

                setTodayAppointments(todayOnly);
                setStats({
                    todayCount: todayOnly.length,
                    weekCount,
                    completedToday,
                    revenue: 0 // TODO: Implement revenue tracking
                });

            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, [user, doctorProfile]); // Re-run if doctorProfile updates

    // Use profile name if available, otherwise fallback to metadata or default
    const doctorName = profile?.full_name || user?.user_metadata?.full_name || "Doctor";

    // Check verification status
    const isProfileIncomplete = !doctorProfile || !doctorProfile.specialization;
    const isPendingVerification = doctorProfile?.verification_status === 'pending';
    const isVerified = doctorProfile?.verification_status === 'verified';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Sparkles className="h-4 w-4 text-teal-500" />
                        <span>AI-Powered Clinical Insights</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        {getGreeting()}, <span className="text-teal-600">Dr. {doctorName.replace(/^Dr\.?\s*/i, "").split(" ")[0]}</span>
                    </h1>
                    <p className="text-slate-500">
                        You have {stats.todayCount} consultations scheduled for today.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2" asChild>
                        <Link href="/doctor/schedule">
                            <Calendar className="h-4 w-4" />
                            View Schedule
                        </Link>
                    </Button>
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-lg shadow-teal-200" asChild>
                        <Link href="/doctor/schedule">
                            <Video className="h-4 w-4" />
                            Quick Consult
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Dashboard Content */}

            {/* Profile Incomplete Warning */}
            {isProfileIncomplete && (
                <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-amber-900">Profile Incomplete</h3>
                                <p className="text-sm text-amber-700 mt-1">
                                    Please complete your profile details to start accepting appointments.
                                </p>
                                <Button variant="link" className="text-amber-700 h-auto p-0 mt-2 font-semibold" asChild>
                                    <Link href="/doctor/settings">Complete Profile <ArrowRight className="h-4 w-4 ml-1" /></Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Verification Pending Warning */}
            {isPendingVerification && !isProfileIncomplete && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <Clock className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-blue-900">Verification Pending</h3>
                                <p className="text-sm text-blue-700 mt-1">
                                    Your profile is under review. You will be able to accept appointments once verified by the admin.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Today's Appointments */}
                <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-bl-full" />
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Today</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.todayCount}</p>
                                <p className="text-xs text-slate-400 mt-1">consultations</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-teal-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* This Week */}
                <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">This Week</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.weekCount}</p>
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    Scheduled
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Completed Today */}
                <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-full" />
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Completed</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.completedToday}</p>
                                <p className="text-xs text-slate-400 mt-1">today</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue */}
                <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Earnings</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">
                                    {stats.revenue > 0 ? `₹${stats.revenue.toLocaleString()}` : "—"}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">this month</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Activity className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Urgent Alert Banner */}
            {todayAppointments.some(apt => apt.isUrgent) && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-red-900">Urgent Attention Required</p>
                        <p className="text-sm text-red-700">
                            {todayAppointments.filter(apt => apt.isUrgent).length} patient(s) have red flags that need immediate review.
                        </p>
                    </div>
                    <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
                        Review Now
                    </Button>
                </div>
            )}

            {/* Today's Appointments */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-slate-900">Today&apos;s Schedule</h2>
                        <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                            <Clock className="h-3 w-3 mr-1" />
                            {stats.todayCount} upcoming
                        </Badge>
                    </div>
                    <Link href="/doctor/schedule" className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
                        View Full Schedule
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-5 w-32" />
                                            <Skeleton className="h-4 w-48" />
                                            <Skeleton className="h-16 w-full" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : todayAppointments.length > 0 ? (
                    <div className="space-y-4">
                        {todayAppointments.map((appointment) => (
                            <AppointmentCard key={appointment.id} {...appointment} />
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="p-12 text-center">
                            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-700">No Appointments Today</h3>
                            <p className="text-slate-500 mt-1">Enjoy your free time, or update your availability to accept new bookings.</p>
                            <Button variant="outline" className="mt-4">
                                Update Availability
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-teal-600 to-teal-700 text-white overflow-hidden relative group hover:shadow-xl transition-shadow">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">Patient Records</h3>
                                <p className="text-teal-100 text-sm">
                                    Access complete medical history, past consultations, and AI-generated insights for all your patients.
                                </p>
                                <Button className="mt-4 bg-white text-teal-700 hover:bg-teal-50" size="sm" asChild>
                                    <Link href="/doctor/patients">
                                        <Users className="h-4 w-4 mr-2" />
                                        View Patients
                                    </Link>
                                </Button>
                            </div>
                            <Users className="h-16 w-16 text-white/20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden relative group hover:shadow-xl transition-shadow">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
                                <p className="text-slate-300 text-sm">
                                    Track your performance, patient outcomes, revenue trends, and consultation statistics.
                                </p>
                                <Button className="mt-4 bg-white text-slate-900 hover:bg-slate-100" size="sm" asChild>
                                    <Link href="/doctor/analytics">
                                        <TrendingUp className="h-4 w-4 mr-2" />
                                        View Analytics
                                    </Link>
                                </Button>
                            </div>
                            <Activity className="h-16 w-16 text-white/20" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
