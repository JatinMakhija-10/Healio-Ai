"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Calendar,
    Phone,
    Mail,
    MapPin,
    AlertTriangle,
    FileText,
    Clock,
    Activity,
    ChevronLeft,
    Leaf,
    MessageSquare
} from "lucide-react";
import Link from "next/link";


import { getPatientById } from "../../../../../data/seed/mockData";

export default function PatientProfilePage() {
    const params = useParams();
    const id = params.id as string;

    const patient = getPatientById(id);

    if (!patient) {
        return (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900">Patient Not Found</h2>
                    <p className="text-slate-500 mt-2">The requested patient ID does not exist.</p>
                    <Button asChild className="mt-4 bg-teal-600">
                        <Link href="/doctor/patients">Back to List</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/doctor/patients">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{patient.name}</h1>
                    <p className="text-slate-500 text-sm">Patient ID: {patient.id}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Message
                    </Button>
                    <Button className="bg-teal-600 hover:bg-teal-700 gap-2">
                        <Calendar className="h-4 w-4" />
                        Book Appointment
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-12 gap-6">
                {/* Left Sidebar - Bio */}
                <div className="md:col-span-4 space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center mb-6">
                                <Avatar className="h-24 w-24 mb-4 ring-4 ring-slate-50">
                                    <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl">
                                        {patient.name[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <h3 className="text-xl font-bold text-slate-900">{patient.name}</h3>
                                <p className="text-slate-500">{patient.age} yrs • {patient.gender}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                    {patient.phone}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    {patient.email}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <MapPin className="h-4 w-4 text-slate-400" />
                                    {patient.address}
                                </div>
                            </div>

                            <hr className="my-6 border-slate-100" />

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Ayurvedic Profile</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                                            <div className="text-xs text-amber-600">Prakriti</div>
                                            <div className="font-semibold text-amber-900">{patient.prakriti}</div>
                                        </div>
                                        <div className="p-2.5 bg-red-50 rounded-lg border border-red-100">
                                            <div className="text-xs text-red-600">Vikriti</div>
                                            <div className="font-semibold text-red-900">Pitta ++</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Medical Alerts</p>
                                    <div className="flex flex-wrap gap-2">
                                        {patient.allergies.map(a => (
                                            <Badge key={a} variant="outline" className="border-red-200 text-red-700 bg-red-50">
                                                Allergy: {a}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content - History & Timeline */}
                <div className="md:col-span-8">
                    <Tabs defaultValue="timeline">
                        <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 mb-4 space-x-6">
                            <TabsTrigger
                                value="timeline"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent px-0 pb-2"
                            >
                                Timeline & Activity
                            </TabsTrigger>
                            <TabsTrigger
                                value="soap"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent px-0 pb-2"
                            >
                                Clinical Notes (SOAP)
                            </TabsTrigger>
                            <TabsTrigger
                                value="files"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent px-0 pb-2"
                            >
                                Documents & Labs
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="timeline" className="space-y-6">
                            {/* AI Summary Card */}
                            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white/10 rounded-xl">
                                            <Leaf className="h-6 w-6 text-teal-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">AI Health Insight</h3>
                                            <p className="text-slate-300 text-sm leading-relaxed">
                                                Patient shows recurring signs of Pitta aggravation correlating with high stress periods. Migraine frequency has decreased by 15% since starting Brahmi supplements.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Timeline Items */}
                            <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                <div className="relative">
                                    <div className="absolute -left-[35px] p-2 bg-teal-100 rounded-full border-4 border-white">
                                        <VideoIcon className="h-4 w-4 text-teal-600" />
                                    </div>
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-slate-900">Video Consultation</h4>
                                                    <p className="text-sm text-slate-500">Dr. Sharma • General Follow-up</p>
                                                </div>
                                                <span className="text-xs text-slate-400">2 days ago</span>
                                            </div>
                                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                "Patient reported feeling better. Sleep quality improved. Advised to continue current medication."
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[35px] p-2 bg-purple-100 rounded-full border-4 border-white">
                                        <Activity className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-slate-900">AI Symptom Check</h4>
                                                    <p className="text-sm text-slate-500">Healio AI • Self-Check</p>
                                                </div>
                                                <span className="text-xs text-slate-400">1 week ago</span>
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <Badge variant="secondary">Headache</Badge>
                                                <Badge variant="secondary">Nausea</Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

function VideoIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m22 8-6 4 6 4V8Z" />
            <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
        </svg>
    )
}
