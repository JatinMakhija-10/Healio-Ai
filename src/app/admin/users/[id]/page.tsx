"use client";

import { useEffect, useState } from "react";
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
    User,
    Mail,
    Phone,
    Calendar,
    Shield,
    ArrowLeft,
    Activity,
    FileText
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Profile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    role: string;
    phone: string;
    created_at: string;
}

interface Consultation {
    id: string;
    status: string;
    created_at: string;
    doctor?: {
        full_name: string;
    }
}

export default function UserDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                setLoading(true);

                // Fetch Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (profileError) throw profileError;
                setProfile(profileData);

                // Fetch Consultations (Try patient_id, if empty try doctor_id if role is doctor)
                // Assuming 'consultations' table has patient_id
                const { data: consultData, error: consultError } = await supabase
                    .from('consultations')
                    .select('*')
                    .eq('patient_id', id)
                    .order('created_at', { ascending: false });

                // If error or empty and user is doctor, try doctor_id logic (omitted for now as table schema typically separates)
                if (!consultError && consultData) {
                    setConsultations(consultData);
                }

            } catch (error) {
                console.error('Error fetching details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

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
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="text-2xl bg-purple-100 text-purple-700">
                            {getInitials(profile.full_name || profile.email)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-slate-900">{profile.full_name || 'Unnamed User'}</h1>
                        <div className="flex items-center gap-3 text-slate-500">
                            <span className="flex items-center gap-1.5 text-sm">
                                <Mail className="h-4 w-4" />
                                {profile.email}
                            </span>
                            <Badge variant="secondary" className="capitalize">
                                {profile.role}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Actions like Edit, Suspend could go here */}
                    <Button variant="outline">Reset Password</Button>
                    <Button variant="destructive">Suspend User</Button>
                </div>
            </div>

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
                                <span className="text-slate-700">{profile.email}</span>
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
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-purple-50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-purple-700">{consultations.length}</div>
                                <div className="text-xs text-purple-600 font-medium uppercase tracking-wider">Consultations</div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-700">0</div>
                                <div className="text-xs text-blue-600 font-medium uppercase tracking-wider">Reports</div>
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
        </div>
    );
}
