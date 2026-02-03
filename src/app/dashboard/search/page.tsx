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
import { supabase } from "@/lib/supabase";
import { SPECIALIZATIONS } from "@/lib/constants";

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

        // Real-time subscription for doctor updates
        const channel = supabase
            .channel('doctor-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'doctors'
                },
                (payload: any) => {
                    console.log('Doctor update received, refreshing list...', payload);
                    fetchDoctors();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filteredDoctors = doctors.filter(doc => {
        const nameMatch = doc.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const specialtyMatch = doc.specialty?.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase())) || false;

        const matchesSearch = nameMatch || specialtyMatch;
        const matchesSpecialty = selectedSpecialty === "All" || doc.specialty?.includes(selectedSpecialty);

        return matchesSearch && matchesSpecialty;
    });


    const specialties = ["All", ...SPECIALIZATIONS];

    return (
        <div className="space-y-8 pb-20">
            {/* Header & Search */}
            <div className="relative bg-teal-900 -mx-4 sm:-mx-8 -mt-8 px-4 sm:px-8 py-12 md:py-20 text-white overflow-hidden">
                {/* Background Patterns */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl -ml-10 -mb-10" />

                <div className="relative max-w-4xl mx-auto text-center space-y-6">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Find Your Healing Partner</h1>
                    <p className="text-teal-100 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                        Connect with top-rated Ayurvedic experts, general physicians, and wellness coaches verified for their excellence.
                    </p>

                    <div className="max-w-2xl mx-auto relative group mt-8">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                        </div>
                        <Input
                            placeholder="Search by name, specialty (e.g., 'Cardiology'), or keyword..."
                            className="pl-12 h-16 rounded-full shadow-xl border-0 text-slate-900 placeholder:text-slate-400 text-lg focus:ring-4 focus:ring-teal-500/30"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-2 flex items-center">
                            <Button className="rounded-full h-12 px-6 bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-lg transition-transform active:scale-95">
                                Search
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {specialties.map(spec => (
                        <button
                            key={spec}
                            onClick={() => setSelectedSpecialty(spec)}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${selectedSpecialty === spec
                                ? "bg-teal-600 text-white border-teal-600 shadow-md transform scale-105"
                                : "bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50"
                                }`}
                        >
                            {spec}
                        </button>
                    ))}
                </div>

                {/* Results Grid */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-32 space-y-4 text-slate-400">
                        <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
                        <p>Finding the best doctors for you...</p>
                    </div>
                ) : filteredDoctors.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDoctors.map(doctor => (
                            <Card key={doctor.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-100 overflow-hidden flex flex-col h-full">
                                <CardContent className="p-0 flex flex-col h-full">
                                    <div className="p-6 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-4">
                                                <div className="relative">
                                                    <Avatar className="h-16 w-16 shadow-sm border-2 border-white ring-2 ring-slate-50">
                                                        <AvatarImage src={doctor.profile?.avatar_url} className="object-cover" />
                                                        <AvatarFallback className="bg-teal-50 text-teal-700 font-bold text-xl">
                                                            {doctor.profile?.full_name?.[0] || 'D'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {doctor.verified && (
                                                        <div className="absolute -bottom-1 -right-1 bg-teal-500 text-white p-0.5 rounded-full border-2 border-white" title="Verified Doctor">
                                                            <Award className="h-3 w-3" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-900 leading-tight group-hover:text-teal-700 transition-colors">
                                                        {doctor.profile?.full_name || 'Doctor'}
                                                    </h3>
                                                    <p className="text-teal-600 text-sm font-medium">
                                                        {doctor.specialty?.[0]}
                                                    </p>
                                                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                                        <MapPin className="h-3 w-3" />
                                                        <span>Online / Video</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100 gap-1 pl-1.5 pr-2">
                                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                                <span className="font-bold">4.9</span>
                                            </Badge>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                {doctor.specialty?.slice(0, 3).map((tag: string) => (
                                                    <Badge key={tag} variant="outline" className="text-xs font-normal text-slate-500 border-slate-200 bg-slate-50">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {doctor.specialty?.length > 3 && (
                                                    <Badge variant="outline" className="text-xs text-slate-400 border-dashed">
                                                        +{doctor.specialty.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-6 pb-6 pt-2 mt-auto space-y-4">
                                        <div className="flex justify-between items-center text-sm py-3 px-4 bg-slate-50 rounded-xl border border-slate-100/50">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Experience</span>
                                                <span className="text-slate-700 font-medium">{doctor.experience_years}+ Years</span>
                                            </div>
                                            <div className="w-px h-8 bg-slate-200 mx-2" />
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Consultation</span>
                                                <span className="text-slate-900 font-bold">₹{doctor.consultation_fee}</span>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => setSelectedDoctor(doctor)}
                                            className="w-full h-11 bg-slate-900 hover:bg-teal-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 rounded-xl group-hover:translate-y-0.5"
                                        >
                                            Book Appointment <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                            <Search className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">No doctors found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-6">
                            We couldn't find any specialists matching "{searchTerm || selectedSpecialty}". Try adjusting your filters.
                        </p>
                        <Button variant="outline" onClick={() => { setSearchTerm(""); setSelectedSpecialty("All"); }} className="border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300">
                            Clear All Filters
                        </Button>
                    </div>
                )}
            </div>

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
