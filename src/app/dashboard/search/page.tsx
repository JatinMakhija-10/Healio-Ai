"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Search,
    MapPin,
    Star,
    Award,
    ArrowRight,
    Loader2
} from "lucide-react";
import { PatientBookingModal } from "@/components/dashboard/PatientBookingModal";
import { api } from "@/lib/api";

export default function SearchPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSpecialty, setSelectedSpecialty] = useState("All");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDoctors() {
            setLoading(true);
            try {
                const data = await api.getAllDoctors();
                setDoctors(data);
            } catch (error) {
                console.error("Failed to fetch doctors", error);
            } finally {
                setLoading(false);
            }
        }
        fetchDoctors();
    }, []);

    const filteredDoctors = doctors.filter(doc => {
        const nameMatch = doc.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const specialtyMatch = doc.specialty?.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase())) || false;

        const matchesSearch = nameMatch || specialtyMatch;
        const matchesSpecialty = selectedSpecialty === "All" || doc.specialty?.includes(selectedSpecialty);

        return matchesSearch && matchesSpecialty;
    });

    const specialties = ["All", "Ayurvedic Practitioner", "General Physician", "Nutritionist", "Psychologist"];

    return (
        <div className="space-y-8 pb-20">
            {/* Header & Search */}
            <div className="text-center space-y-4 py-8">
                <h1 className="text-3xl font-bold text-slate-900">Find the Right Specialist</h1>
                <p className="text-slate-500 max-w-xl mx-auto">
                    Connect with verified Ayurvedic experts, general physicians, and wellness coaches tailored to your unique imbalances.
                </p>

                <div className="max-w-2xl mx-auto relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                    </div>
                    <Input
                        placeholder="Search by condition (e.g., 'Migraine') or doctor name..."
                        className="pl-11 h-14 rounded-2xl shadow-sm border-slate-200 bg-white text-lg focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center">
                        <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-10 px-4">
                            Search
                        </Button>
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {specialties.map(spec => (
                        <button
                            key={spec}
                            onClick={() => setSelectedSpecialty(spec)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedSpecialty === spec
                                ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
                                : "bg-white text-slate-600 border border-slate-200 hover:border-teal-200 hover:text-teal-700"
                                }`}
                        >
                            {spec}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Grid */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
                </div>
            ) : filteredDoctors.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDoctors.map(doctor => (
                        <Card key={doctor.id} className="group hover:shadow-lg hover:shadow-teal-500/5 hover:border-teal-200 transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4">
                                        <Avatar className="h-16 w-16 shadow-md border-2 border-white">
                                            <AvatarImage src={doctor.profile?.avatar_url} />
                                            <AvatarFallback className="bg-gradient-to-br from-teal-50 to-teal-100 text-teal-700 text-xl">
                                                {doctor.profile?.full_name?.[0] || 'D'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 group-hover:text-teal-700 transition-colors">
                                                {doctor.profile?.full_name || 'Doctor'}
                                            </h3>
                                            <p className="text-teal-600 text-sm font-medium mb-1">
                                                {doctor.specialty?.[0]}
                                            </p>
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <MapPin className="h-3 w-3" />
                                                Video Consultation
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded text-amber-700 text-xs font-bold border border-amber-100">
                                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                            4.9
                                        </div>
                                        <span className="text-[10px] text-slate-400 mt-1">Verified</span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex flex-wrap gap-2">
                                        {doctor.specialty?.slice(0, 3).map((tag: string) => (
                                            <Badge key={tag} variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 font-normal">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center text-sm pt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 group-hover:bg-teal-50/50 group-hover:border-teal-100 transition-colors">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Award className="h-4 w-4 text-purple-500" />
                                            <span>{doctor.experience_years} Years Exp.</span>
                                        </div>
                                        <div className="font-bold text-slate-900">₹{doctor.consultation_fee}<span className="text-slate-400 font-normal text-xs">/visit</span></div>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setSelectedDoctor(doctor)}
                                    className="w-full bg-slate-900 text-white group-hover:bg-teal-600 transition-colors shadow-lg group-hover:shadow-teal-500/20"
                                >
                                    Book Appointment <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-500">No doctors found matching your criteria.</p>
                    <Button variant="link" onClick={() => { setSearchTerm(""); setSelectedSpecialty("All"); }} className="text-teal-600">
                        Clear Filters
                    </Button>
                </div>
            )}

            {selectedDoctor && (
                <PatientBookingModal
                    isOpen={!!selectedDoctor}
                    onClose={() => setSelectedDoctor(null)}
                    doctor={selectedDoctor}
                />
            )}
        </div>
    );
}
