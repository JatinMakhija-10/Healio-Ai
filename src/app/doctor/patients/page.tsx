"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Search,
    Filter,
    MoreHorizontal,
    ChevronRight,
    Activity,
    AlertCircle,
    Clock,
    FileText
} from "lucide-react";
import Link from "next/link";

import { MOCK_PATIENTS } from "@/lib/mockData";

export default function PatientListPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredPatients = MOCK_PATIENTS.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.condition.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Patient List</h1>
                    <p className="text-slate-500">Manage your patient records and history.</p>
                </div>
                <Button className="bg-teal-600 hover:bg-teal-700">
                    + Add Patient
                </Button>
            </div>

            <Card>
                <CardHeader className="border-b bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name or condition..."
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Filter
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Patient</th>
                                    <th className="px-6 py-3 font-medium">Condition</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Risk Profile</th>
                                    <th className="px-6 py-3 font-medium">Last Visit</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPatients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-teal-100 text-teal-700">
                                                        {patient.name[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium text-slate-900">{patient.name}</div>
                                                    <div className="text-xs text-slate-500">{patient.age} yrs • {patient.gender}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            {patient.condition}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="bg-slate-100 font-normal">
                                                {patient.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`flex items-center gap-1.5 text-xs font-medium
                                                ${patient.risk === 'High' ? 'text-red-600' :
                                                    patient.risk === 'Medium' ? 'text-amber-600' : 'text-green-600'}
                                            `}>
                                                <Activity className="h-3.5 w-3.5" />
                                                {patient.risk} Risk
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {patient.lastVisit}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/doctor/patients/${patient.id}`}>
                                                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
