"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { SlotPicker } from "@/components/booking/SlotPicker";
import {
    Star,
    Clock,
    MapPin,
    Stethoscope,
    GraduationCap,
    ChevronRight,
    ArrowLeft,
    CheckCircle2,
} from "lucide-react";

interface Doctor {
    id: string;
    full_name: string;
    avatar_url?: string;
    specialty: string[];
    qualification: string;
    experience_years: number;
    bio?: string;
    consultation_fee: number;
    consultation_duration: number;
    rating: number;
    rating_count: number;
    location?: string;
    availability: Record<string, string[]>;
}

interface DoctorSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    diagnosisId?: string;
    diagnosisSnapshot?: Record<string, unknown>;
    onBookingComplete?: (appointmentId: string) => void;
}

// Mock doctors for demo
const mockDoctors: Doctor[] = [
    {
        id: "doc-1",
        full_name: "Dr. Aisha Patel",
        specialty: ["General Medicine", "Ayurveda"],
        qualification: "MBBS, MD (Ayurveda)",
        experience_years: 8,
        bio: "Experienced physician combining modern medicine with traditional Ayurvedic practices for holistic healing.",
        consultation_fee: 500,
        consultation_duration: 30,
        rating: 4.8,
        rating_count: 142,
        location: "Mumbai",
        availability: {
            mon: ["09:00-12:00", "14:00-17:00"],
            tue: ["09:00-12:00", "14:00-17:00"],
            wed: ["09:00-12:00"],
            thu: ["09:00-12:00", "14:00-17:00"],
            fri: ["09:00-12:00", "14:00-17:00"],
        },
    },
    {
        id: "doc-2",
        full_name: "Dr. Rajesh Kumar",
        specialty: ["Dermatology"],
        qualification: "MBBS, MD (Dermatology)",
        experience_years: 12,
        bio: "Dermatologist specializing in skin conditions, allergies, and cosmetic procedures.",
        consultation_fee: 750,
        consultation_duration: 30,
        rating: 4.9,
        rating_count: 89,
        location: "Delhi",
        availability: {
            mon: ["10:00-13:00", "15:00-18:00"],
            tue: ["10:00-13:00"],
            wed: ["10:00-13:00", "15:00-18:00"],
            thu: ["10:00-13:00", "15:00-18:00"],
            fri: ["10:00-13:00"],
        },
    },
    {
        id: "doc-3",
        full_name: "Dr. Meera Sharma",
        specialty: ["Orthopedics", "Sports Medicine"],
        qualification: "MBBS, MS (Ortho)",
        experience_years: 15,
        bio: "Orthopedic surgeon with expertise in sports injuries, joint pain, and rehabilitation.",
        consultation_fee: 1000,
        consultation_duration: 45,
        rating: 4.7,
        rating_count: 203,
        location: "Bangalore",
        availability: {
            mon: ["09:00-11:00", "16:00-19:00"],
            wed: ["09:00-11:00", "16:00-19:00"],
            fri: ["09:00-11:00", "16:00-19:00"],
        },
    },
];

type Step = "select-doctor" | "select-slot" | "confirm";

export function DoctorSelectionModal({
    open,
    onOpenChange,
    diagnosisId,
    diagnosisSnapshot,
    onBookingComplete,
}: DoctorSelectionModalProps) {
    const [step, setStep] = useState<Step>("select-doctor");
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
    const [booking, setBooking] = useState(false);

    useEffect(() => {
        if (open) {
            setStep("select-doctor");
            setSelectedDoctor(null);
            setSelectedSlot(null);
            setLoading(true);
            // Simulate API call
            setTimeout(() => {
                setDoctors(mockDoctors);
                setLoading(false);
            }, 600);
        }
    }, [open]);

    const handleDoctorSelect = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setStep("select-slot");
    };

    const handleSlotSelect = (date: Date, time: string) => {
        setSelectedSlot({ date, time });
        setStep("confirm");
    };

    const handleConfirmBooking = async () => {
        if (!selectedDoctor || !selectedSlot) return;

        setBooking(true);
        // Simulate booking
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // In real implementation:
        // const appointment = await createAppointment({
        //     patientId: userId,
        //     doctorId: selectedDoctor.id,
        //     diagnosisRefId: diagnosisId,
        //     diagnosisSnapshot: diagnosisSnapshot,
        //     scheduledAt: combineDateAndTime(selectedSlot.date, selectedSlot.time),
        // });

        setBooking(false);
        onBookingComplete?.("mock-appointment-id");
        onOpenChange(false);
    };

    const handleBack = () => {
        if (step === "select-slot") {
            setStep("select-doctor");
            setSelectedDoctor(null);
        } else if (step === "confirm") {
            setStep("select-slot");
            setSelectedSlot(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        {step !== "select-doctor" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <div>
                            <DialogTitle>
                                {step === "select-doctor" && "Choose a Doctor"}
                                {step === "select-slot" && "Select Appointment Time"}
                                {step === "confirm" && "Confirm Booking"}
                            </DialogTitle>
                            <DialogDescription>
                                {step === "select-doctor" && "Select from our verified medical professionals"}
                                {step === "select-slot" && `Book with ${selectedDoctor?.full_name}`}
                                {step === "confirm" && "Review and confirm your appointment"}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    {/* Step 1: Doctor Selection */}
                    {step === "select-doctor" && (
                        <div className="space-y-3">
                            {loading ? (
                                <>
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-32" />
                                    ))}
                                </>
                            ) : (
                                doctors.map((doctor) => {
                                    const initials = doctor.full_name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2);

                                    return (
                                        <Card
                                            key={doctor.id}
                                            className="cursor-pointer hover:shadow-md hover:border-teal-200 transition-all group"
                                            onClick={() => handleDoctorSelect(doctor)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex gap-4">
                                                    <Avatar className="h-16 w-16 ring-2 ring-slate-100">
                                                        <AvatarImage src={doctor.avatar_url} />
                                                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white text-lg">
                                                            {initials}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <h3 className="font-semibold text-slate-900">
                                                                    {doctor.full_name}
                                                                </h3>
                                                                <p className="text-sm text-slate-500">
                                                                    {doctor.specialty.join(" • ")}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg font-bold text-slate-900">
                                                                    ₹{doctor.consultation_fee}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {doctor.consultation_duration} min
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600">
                                                            <div className="flex items-center gap-1">
                                                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                                                <span className="font-medium">{doctor.rating}</span>
                                                                <span className="text-slate-400">({doctor.rating_count})</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <GraduationCap className="h-4 w-4 text-slate-400" />
                                                                <span>{doctor.experience_years} yrs exp</span>
                                                            </div>
                                                            {doctor.location && (
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin className="h-4 w-4 text-slate-400" />
                                                                    <span>{doctor.location}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-slate-300 self-center group-hover:text-teal-500 transition-colors" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Step 2: Slot Selection */}
                    {step === "select-slot" && selectedDoctor && (
                        <SlotPicker
                            doctor={selectedDoctor}
                            onSlotSelect={handleSlotSelect}
                        />
                    )}

                    {/* Step 3: Confirmation */}
                    {step === "confirm" && selectedDoctor && selectedSlot && (
                        <div className="space-y-6">
                            {/* Doctor Summary */}
                            <Card className="bg-slate-50 border-slate-200">
                                <CardContent className="p-4">
                                    <div className="flex gap-4">
                                        <Avatar className="h-14 w-14">
                                            <AvatarImage src={selectedDoctor.avatar_url} />
                                            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                                                {selectedDoctor.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{selectedDoctor.full_name}</h3>
                                            <p className="text-sm text-slate-500">{selectedDoctor.specialty.join(" • ")}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Appointment Details */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-slate-900">Appointment Details</h4>
                                <div className="grid gap-3">
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-50 border border-teal-100">
                                        <Clock className="h-5 w-5 text-teal-600" />
                                        <div>
                                            <p className="font-medium text-teal-900">
                                                {selectedSlot.date.toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                            <p className="text-sm text-teal-700">
                                                {selectedSlot.time} • {selectedDoctor.consultation_duration} minutes
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Price Summary */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Consultation Fee</span>
                                    <span className="text-xl font-bold text-slate-900">
                                        ₹{selectedDoctor.consultation_fee}
                                    </span>
                                </div>
                            </div>

                            {/* Confirm Button */}
                            <Button
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 text-base"
                                onClick={handleConfirmBooking}
                                disabled={booking}
                            >
                                {booking ? (
                                    <>
                                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Booking...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-5 w-5 mr-2" />
                                        Confirm & Pay ₹{selectedDoctor.consultation_fee}
                                    </>
                                )}
                            </Button>

                            <p className="text-xs text-center text-slate-500">
                                By confirming, you agree to our cancellation policy. Free cancellation up to 4 hours before the appointment.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
