"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCheck, Clock, CheckCircle, XCircle, Stethoscope } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface DoctorRow {
    id: string;
    user_id: string;
    specialization: string | null;
    license_number: string | null;
    experience_years: number | null;
    verification_status: string;
    created_at: string;
    profiles: { full_name: string | null; email: string | null } | null;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    pending:  { color: "bg-amber-100 text-amber-700",  label: "Pending" },
    approved: { color: "bg-green-100 text-green-700",  label: "Approved" },
    verified: { color: "bg-green-100 text-green-700",  label: "Verified" },
    rejected: { color: "bg-red-100 text-red-700",      label: "Rejected" },
};

export default function AdminDoctorsPage() {
    const [doctors, setDoctors] = useState<DoctorRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all");

    const fetchDoctors = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from("doctors")
            .select("*, profiles!inner(full_name, email)")
            .order("created_at", { ascending: false });
        setDoctors((data as DoctorRow[]) || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

    const updateStatus = async (doctorId: string, userId: string, status: string) => {
        setActionLoading(doctorId);
        await supabase
            .from("doctors")
            .update({ verification_status: status, verified: status === "approved" || status === "verified" })
            .eq("id", doctorId);
        if (status === "approved" || status === "verified") {
            await supabase.from("profiles").update({ role: "doctor" }).eq("id", userId);
        }
        await fetchDoctors();
        setActionLoading(null);
    };

    const filtered = activeTab === "all" ? doctors : doctors.filter(d => d.verification_status === activeTab);

    const counts = {
        all:      doctors.length,
        pending:  doctors.filter(d => d.verification_status === "pending").length,
        approved: doctors.filter(d => ["approved","verified"].includes(d.verification_status)).length,
        rejected: doctors.filter(d => d.verification_status === "rejected").length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-1">
                    <Stethoscope className="h-4 w-4" />
                    <span>Doctor Management</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Doctor Verification Queue</h1>
                <p className="text-slate-500 mt-1">Review and approve doctor credentials</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { key: "all",      label: "Total Doctors", Icon: Stethoscope, color: "text-slate-700",  bg: "bg-slate-50" },
                    { key: "pending",  label: "Pending Review", Icon: Clock,       color: "text-amber-700", bg: "bg-amber-50" },
                    { key: "approved", label: "Approved",       Icon: CheckCircle, color: "text-green-700", bg: "bg-green-50" },
                    { key: "rejected", label: "Rejected",       Icon: XCircle,     color: "text-red-700",   bg: "bg-red-50" },
                ].map(s => (
                    <Card
                        key={s.key}
                        className={`border-0 ${s.bg} cursor-pointer transition-opacity ${activeTab === s.key ? "ring-2 ring-offset-1 ring-blue-400" : "hover:opacity-80"}`}
                        onClick={() => setActiveTab(s.key as typeof activeTab)}
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <s.Icon className={`h-5 w-5 ${s.color}`} />
                            <div>
                                <p className="text-xs text-slate-500">{s.label}</p>
                                <p className={`text-2xl font-bold ${s.color}`}>{loading ? "—" : counts[s.key as keyof typeof counts]}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pending alert */}
            {counts.pending > 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="text-amber-800 text-sm font-medium">
                        {counts.pending} doctor application{counts.pending > 1 ? "s" : ""} awaiting your review
                    </p>
                </div>
            )}

            {/* Table */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle>
                        {activeTab === "all" ? "All Doctors" : `${STATUS_CONFIG[activeTab]?.label || activeTab} Doctors`}
                        <span className="ml-2 text-sm font-normal text-slate-400">({filtered.length})</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center text-slate-400 py-12">
                            No doctors in this category
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-y border-slate-100">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-slate-500 font-medium">Doctor</th>
                                        <th className="text-left px-6 py-3 text-slate-500 font-medium">Specialization</th>
                                        <th className="text-left px-6 py-3 text-slate-500 font-medium">License</th>
                                        <th className="text-left px-6 py-3 text-slate-500 font-medium">Experience</th>
                                        <th className="text-left px-6 py-3 text-slate-500 font-medium">Status</th>
                                        <th className="text-left px-6 py-3 text-slate-500 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(doctor => {
                                        const profile = doctor.profiles;
                                        const status = STATUS_CONFIG[doctor.verification_status] || STATUS_CONFIG.pending;
                                        const isLoading = actionLoading === doctor.id;
                                        return (
                                            <tr key={doctor.id} className="border-b last:border-0 hover:bg-slate-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                                                            {(profile?.full_name || profile?.email || "D")[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900">{profile?.full_name || "Unknown"}</p>
                                                            <p className="text-xs text-slate-400">{profile?.email || "—"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{doctor.specialization || "—"}</td>
                                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{doctor.license_number || "—"}</td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {doctor.experience_years != null ? `${doctor.experience_years} yrs` : "—"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className={`${status.color} border-0 text-xs`}>
                                                        {status.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {doctor.verification_status === "pending" && (
                                                            <>
                                                                <Button
                                                                    size="sm" disabled={isLoading}
                                                                    className="h-7 text-xs bg-green-600 hover:bg-green-700 gap-1"
                                                                    onClick={() => updateStatus(doctor.id, doctor.user_id, "approved")}
                                                                >
                                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm" variant="destructive" disabled={isLoading}
                                                                    className="h-7 text-xs gap-1"
                                                                    onClick={() => updateStatus(doctor.id, doctor.user_id, "rejected")}
                                                                >
                                                                    <XCircle className="h-3.5 w-3.5" />
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        {doctor.verification_status !== "pending" && (
                                                            <Button
                                                                size="sm" variant="outline" disabled={isLoading}
                                                                className="h-7 text-xs"
                                                                onClick={() => updateStatus(doctor.id, doctor.user_id, "pending")}
                                                            >
                                                                <UserCheck className="h-3.5 w-3.5 mr-1" />
                                                                Re-review
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
