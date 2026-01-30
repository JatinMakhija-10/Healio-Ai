"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Leaf, Flame, Droplets, Activity, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
    const { user } = useAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [localProfile, setLocalProfile] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [latestConsultation, setLatestConsultation] = useState<any>(null);

    useEffect(() => {
        // 1. Get Profile Data
        const pending = localStorage.getItem('healio_pending_profile');
        if (pending) {
            try {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                setLocalProfile(JSON.parse(pending));
            } catch (e) {
                console.error("Failed to parse pending profile:", e);
            }
        }

        // 2. Get Vikriti (Latest Consultation)
        const fetchHistory = async () => {
            let consultations: any[] = [];

            // From Supabase
            if (user) {
                const { data } = await supabase
                    .from('consultations')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1);
                if (data && data.length > 0) consultations = data;
            }

            // From LocalStorage (merge if needed, but for 'latest' we just need the newest)
            try {
                const localHistory = JSON.parse(localStorage.getItem('healio_consultation_history') || '[]');
                if (localHistory.length > 0) {
                    // If we have local history, compare dates. 
                    // Simple check: if local history has a newer item than supabase (or supabase empty)
                    consultations = [...consultations, ...localHistory];
                    consultations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                }
            } catch (e) { console.error(e); }

            if (consultations.length > 0) {
                setLatestConsultation(consultations[0]);
            }
        };

        fetchHistory();
    }, [user]);

    // Data Resolution
    const metadata = user?.user_metadata?.onboarding_completed
        ? user.user_metadata
        : (localProfile || user?.user_metadata || {});
    const medical = metadata.medical_profile || {};
    const ayurvedic = metadata.ayurvedic_profile;

    // Helper to get Dosha Color
    const getDoshaColor = (dosha: string) => {
        if (!dosha) return "bg-slate-100 text-slate-800";
        if (dosha.includes("vata")) return "bg-blue-50 text-blue-700 border-blue-200";
        if (dosha.includes("pitta")) return "bg-orange-50 text-orange-700 border-orange-200";
        if (dosha.includes("kapha")) return "bg-green-50 text-green-700 border-green-200";
        return "bg-slate-100 text-slate-800";
    };

    return (
        <div className="space-y-8 max-w-4xl pb-10">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Patient Profile</h1>
                <p className="text-slate-500">Manage your personal information and health context.</p>
            </div>

            {/* Header Card */}
            <Card>
                <CardContent className="p-6 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                    <Avatar className="h-24 w-24 border-4 border-slate-50">
                        <AvatarImage src={metadata.avatar_url} />
                        <AvatarFallback className="text-2xl bg-teal-100 text-teal-700">
                            {(metadata.full_name || user?.email || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 pt-2 flex-1">
                        <h2 className="text-2xl font-bold text-slate-900">{metadata.full_name || "User"}</h2>
                        <p className="text-slate-500">{user?.email}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                            <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100">
                                Free Plan
                            </Badge>
                            {metadata.onboarding_completed && (
                                <Badge variant="outline" className="text-slate-600 border-slate-200">
                                    Profile Complete
                                </Badge>
                            )}
                            {ayurvedic && (
                                <Badge className={`capitalize border ${getDoshaColor(ayurvedic.prakriti)}`}>
                                    Prakriti: {ayurvedic.prakriti}
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* --- AYURVEDIC PROFILE SECTION (NEW) --- */}
            {ayurvedic && (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-teal-100 shadow-sm overflow-hidden">
                        <CardHeader className="bg-teal-50/50 pb-4">
                            <CardTitle className="flex items-center gap-2 text-teal-800">
                                <Leaf className="h-5 w-5" />
                                Prakriti (Constitution)
                            </CardTitle>
                            <CardDescription>
                                Your inherent nature determined at birth.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500">Dominant Dosha</span>
                                <Badge className={`text-base px-3 py-1 capitalize ${getDoshaColor(ayurvedic.primaryDosha)}`}>
                                    {ayurvedic.primaryDosha}
                                </Badge>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wider text-slate-400">Doshic Balance</Label>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="w-12 font-medium text-blue-600">Vata</span>
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-400" style={{ width: `${ayurvedic.doshicTendencies.vata}%` }} />
                                        </div>
                                        <span className="w-8 text-right text-slate-500">{ayurvedic.doshicTendencies.vata}%</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="w-12 font-medium text-orange-600">Pitta</span>
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-400" style={{ width: `${ayurvedic.doshicTendencies.pitta}%` }} />
                                        </div>
                                        <span className="w-8 text-right text-slate-500">{ayurvedic.doshicTendencies.pitta}%</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="w-12 font-medium text-green-600">Kapha</span>
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-400" style={{ width: `${ayurvedic.doshicTendencies.kapha}%` }} />
                                        </div>
                                        <span className="w-8 text-right text-slate-500">{ayurvedic.doshicTendencies.kapha}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-sm text-slate-600 italic">
                                    &quot;{ayurvedic.characteristics[0]}&quot;
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-orange-100 shadow-sm">
                        <CardHeader className="bg-orange-50/50 pb-4">
                            <CardTitle className="flex items-center gap-2 text-orange-800">
                                <Activity className="h-5 w-5" />
                                Current Vikriti (Imbalance)
                            </CardTitle>
                            <CardDescription>
                                Based on your latest consultation.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {latestConsultation ? (
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-xs uppercase tracking-wider text-slate-400">Latest Issue</Label>
                                        <p className="font-medium text-lg text-slate-900 mt-1">
                                            {latestConsultation.diagnosis?.condition || "Undiagnosed"}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {new Date(latestConsultation.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {latestConsultation.diagnosis?.severity && (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-white">
                                                Severity: {latestConsultation.diagnosis.severity}
                                            </Badge>
                                        </div>
                                    )}

                                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-sm text-orange-800">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                            <p>
                                                This condition may be aggravating your <strong>{ayurvedic.primaryDosha}</strong> dosha.
                                            </p>
                                        </div>
                                    </div>

                                    <Button variant="ghost" className="w-full text-teal-600 hover:text-teal-700 hover:bg-teal-50" asChild>
                                        <Link href="/dashboard/history">
                                            View History <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-6 space-y-3">
                                    <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-orange-500">
                                        <Activity className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        No recent consultations found. Start a diagnosis to identify your current imbalances.
                                    </p>
                                    <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50" asChild>
                                        <Link href="/dashboard/consult">Start Diagnosis</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Basic details about you.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Age</Label>
                                <div className="p-2 bg-slate-50 rounded-md text-slate-900 border border-slate-100">
                                    {metadata.age || "Not set"}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <div className="p-2 bg-slate-50 rounded-md text-slate-900 border border-slate-100 capitalize">
                                    {metadata.gender || "Not set"}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Height</Label>
                                <div className="p-2 bg-slate-50 rounded-md text-slate-900 border border-slate-100">
                                    {metadata.height ? `${metadata.height} cm` : "Not set"}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Weight</Label>
                                <div className="p-2 bg-slate-50 rounded-md text-slate-900 border border-slate-100">
                                    {metadata.weight ? `${metadata.weight} kg` : "Not set"}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Medical Context */}
                <Card>
                    <CardHeader>
                        <CardTitle>Medical Context</CardTitle>
                        <CardDescription>Important health factors for diagnosis.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Chronic Conditions</Label>
                            <div className="flex flex-wrap gap-2">
                                {medical.conditions && medical.conditions.length > 0 ? (
                                    medical.conditions.map((c: string) => (
                                        <Badge key={c} variant="outline">{c}</Badge>
                                    ))
                                ) : (
                                    <span className="text-sm text-slate-400">None listed</span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Allergies</Label>
                            <div className="p-2 bg-slate-50 rounded-md text-slate-900 border border-slate-100 text-sm">
                                {medical.allergies || "None listed"}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Habits</Label>
                            <div className="flex gap-2 text-sm text-slate-600">
                                <div>Smoking: <span className="font-medium text-slate-900 capitalize">{medical.smoking || "Unknown"}</span></div>
                                <div>•</div>
                                <div>Alcohol: <span className="font-medium text-slate-900 capitalize">{medical.alcohol || "Unknown"}</span></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Current Medications</Label>
                            <div className="p-2 bg-slate-50 rounded-md text-slate-900 border border-slate-100 text-sm">
                                {medical.medications || "None listed"}
                            </div>
                        </div>

                        {(medical.pregnant || medical.kidney_liver_disease || medical.recent_surgery) && (
                            <div className="space-y-2">
                                <Label>Safety Flags & History</Label>
                                <div className="flex flex-wrap gap-2">
                                    {medical.pregnant && (
                                        <Badge variant="destructive" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">
                                            Pregnant
                                        </Badge>
                                    )}
                                    {medical.kidney_liver_disease && (
                                        <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
                                            Kidney/Liver Disease
                                        </Badge>
                                    )}
                                    {medical.recent_surgery && (
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">
                                            Recent Surgery
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
