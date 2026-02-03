"use client";




import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search,
    Filter,
    ChevronRight,
    Activity,
    UserX,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function PatientListPage() {
    const { user, doctorProfile } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPatients() {
            if (!user) return;
            try {
                // Determine doctor ID
                let doctorId = doctorProfile?.id;
                if (!doctorId) {
                    // Fallback to fetching if context not ready
                    const profileData = await api.getDoctorProfile(user.id);
                    doctorId = profileData?.id;
                }

                if (doctorId) {
                    // Forcing dummy data for now as per user request
                    const DUMMY_PATIENTS = [
                        { id: 'p1', full_name: 'Rahul Sharma', email: 'rahul@example.com', role: 'patient', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul' },
                        { id: 'p2', full_name: 'Priya Singh', email: 'priya@example.com', role: 'patient', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
                        { id: 'p3', full_name: 'Amit Patel', email: 'amit@example.com', role: 'patient', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit' },
                    ];
                    setPatients(DUMMY_PATIENTS);

                    /* 
                    // Real data commented out for now
                    const data = await api.getDoctorPatients(doctorId);
                    setPatients(data || []);
                    */
                }
            } catch (error) {
                console.error("Failed to fetch patients", error);
            } finally {
                setLoading(false);
            }
        }

        fetchPatients();
    }, [user, doctorProfile]);

    const filteredPatients = patients.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Patient List</h1>
                    <p className="text-slate-500">Manage your patient records and history.</p>
                </div>
            </div>

            <Card>
                <CardHeader className="border-b bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name..."
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
                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredPatients.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Patient</th>
                                        <th className="px-6 py-3 font-medium">Role</th>
                                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredPatients.map((patient) => (
                                        <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={patient.avatar_url} />
                                                        <AvatarFallback className="bg-teal-100 text-teal-700">
                                                            {patient.full_name?.[0] || "P"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium text-slate-900">{patient.full_name || "Unknown"}</div>
                                                        <div className="text-xs text-slate-500">{patient.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="bg-slate-100 font-normal capitalize">
                                                    {patient.role || "Patient"}
                                                </Badge>
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
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <UserX className="h-12 w-12 mb-4 text-slate-300" />
                            <h3 className="text-lg font-medium text-slate-700">No patients found</h3>
                            <p className="text-sm">You haven't consulted with any patients yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
