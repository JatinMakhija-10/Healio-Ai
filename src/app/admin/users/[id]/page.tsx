"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
    Mail,
    Phone,
    Calendar,
    Shield,
    ArrowLeft,
    Activity,
    FileText,
    KeyRound,
    Ban,
    CheckCircle2,
    AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { UserActionsDialog } from "@/components/admin/users/UserActionsDialog";

interface Profile {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
    phone: string | null;
    created_at: string;
    is_suspended: boolean;
    suspended_at: string | null;
    suspended_reason: string | null;
}

interface Consultation {
    id: string;
    status: string;
    created_at: string;
}

type ActionKind = "suspend" | "unsuspend" | "reset-password" | null;

export default function UserDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [reportCount, setReportCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [pendingAction, setPendingAction] = useState<ActionKind>(null);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            // Dossier — profile + counts
            const dossierRes = await fetch(`/api/admin/users/${id}`);
            const dossier = await dossierRes.json();
            if (dossierRes.ok && dossier.success) {
                setProfile(dossier.data.profile);
                setReportCount(dossier.data.reportCount || 0);
            } else {
                setProfile(null);
            }

            // Consultations list (ordered, with status)
            const { data: consultData } = await supabase
                .from("consultations")
                .select("id, status, created_at")
                .eq("patient_id", id)
                .order("created_at", { ascending: false });
            setConsultations(consultData || []);
        } catch (error) {
            console.error("Error fetching details:", error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-32" />
                <div className="flex items-start gap-6">
                    <Skeleton className="h-64 w-80" />
                    <Skeleton className="h-96 flex-1" />
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <h2 className="text-xl font-semibold">User not found</h2>
                <Button asChild variant="outline">
                    <Link href="/admin/users">Return to Users</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Button variant="ghost" className="pl-0 gap-2 hover:bg-transparent hover:text-purple-600" asChild>
                <Link href="/admin/users">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Users
                </Link>
            </Button>

            {/* Header Section */}
            <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
                        <AvatarImage src={profile.avatar_url ?? undefined} />
                        <AvatarFallback className="text-2xl bg-purple-100 text-purple-700">
                            {getInitials(profile.full_name || profile.email || "")}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-slate-900">{profile.full_name || 'Unnamed User'}</h1>
                        <div className="flex items-center gap-3 text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1.5 text-sm">
                                <Mail className="h-4 w-4" />
                                {profile.email || '—'}
                            </span>
                            <Badge variant="secondary" className="capitalize">
                                {profile.role}
                            </Badge>
                            {profile.is_suspended && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                                    <Ban className="h-3 w-3" /> Suspended
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {profile.role !== 'admin' && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => setPendingAction("reset-password")}
                            disabled={!profile.email}
                            title={profile.email ? "" : "User has no email on file"}
                        >
                            <KeyRound className="h-4 w-4" />
                            Reset Password
                        </Button>
                        {profile.is_suspended ? (
                            <Button
                                variant="default"
                                className="gap-2 bg-green-600 hover:bg-green-700"
                                onClick={() => setPendingAction("unsuspend")}
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Re-instate
                            </Button>
                        ) : (
                            <Button
                                variant="destructive"
                                className="gap-2"
                                onClick={() => setPendingAction("suspend")}
                            >
                                <Ban className="h-4 w-4" />
                                Suspend User
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {profile.is_suspended && (
                <div className="flex items-start gap-3 p-4 rounded-lg border border-red-200 bg-red-50">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-red-800">
                            This account is suspended
                            {profile.suspended_at
                                ? ` since ${format(new Date(profile.suspended_at), "PPP")}`
                                : ""}
                            .
                        </p>
                        {profile.suspended_reason && (
                            <p className="text-red-700 mt-1">Reason: {profile.suspended_reason}</p>
                        )}
                        <p className="text-red-700 mt-1">The user cannot sign in until you re-instate the account.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-700">{profile.email || '—'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-700">{profile.phone || 'No phone number'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-700">
                                    Joined {format(new Date(profile.created_at), "PPP")}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Shield className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-700 capitalize">{profile.role} Account</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-purple-50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-purple-700">{consultations.length}</div>
                                <div className="text-xs text-purple-600 font-medium uppercase tracking-wider">Consultations</div>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-amber-700">{reportCount}</div>
                                <div className="text-xs text-amber-600 font-medium uppercase tracking-wider">Reports</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="consultations" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                            <TabsTrigger
                                value="consultations"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-4 py-3"
                            >
                                <Activity className="h-4 w-4 mr-2" />
                                Consultations
                            </TabsTrigger>
                            <TabsTrigger
                                value="history"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-4 py-3"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Medical History
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="consultations" className="pt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Consultation History</CardTitle>
                                    <CardDescription>
                                        Past appointments and medical sessions.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {consultations.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            No consultations found for this user.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {consultations.map((consult) => (
                                                <div key={consult.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                                            <Activity className="h-5 w-5 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">General Consultation</p>
                                                            <p className="text-sm text-slate-500">
                                                                {format(new Date(consult.created_at), "PPP p")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="capitalize">
                                                        {consult.status || 'completed'}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history" className="pt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Medical History</CardTitle>
                                    <CardDescription>
                                        Uploaded documents and health timeline.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed">
                                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No medical records active for this profile.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <UserActionsDialog
                userId={profile.id}
                userEmail={profile.email}
                userFullName={profile.full_name}
                action={pendingAction}
                onClose={() => setPendingAction(null)}
                onCompleted={fetchData}
            />
        </div>
    );
}
