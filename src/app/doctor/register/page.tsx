"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Stethoscope,
    User,
    GraduationCap,
    Clock,
    FileText,
    Calendar,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    Upload,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const SPECIALTIES = [
    "General Medicine",
    "Ayurveda",
    "Dermatology",
    "Orthopedics",
    "Pediatrics",
    "Gynecology",
    "Cardiology",
    "Neurology",
    "Psychiatry",
    "ENT",
    "Ophthalmology",
    "Dentistry",
    "Sports Medicine",
    "Nutrition",
    "Physiotherapy",
];

const DAYS = [
    { key: "mon", label: "Monday" },
    { key: "tue", label: "Tuesday" },
    { key: "wed", label: "Wednesday" },
    { key: "thu", label: "Thursday" },
    { key: "fri", label: "Friday" },
    { key: "sat", label: "Saturday" },
    { key: "sun", label: "Sunday" },
];

type Step = 1 | 2 | 3 | 4;

interface FormData {
    // Step 1: Personal Info
    fullName: string;
    phone: string;
    bio: string;

    // Step 2: Professional Info
    specialty: string[];
    qualification: string;
    experienceYears: number;
    licenseNumber: string;

    // Step 3: Documents
    licenseDocument: File | null;
    profilePhoto: File | null;

    // Step 4: Availability
    consultationFee: number;
    consultationDuration: number;
    availability: Record<string, { enabled: boolean; slots: string[] }>;
}

const initialFormData: FormData = {
    fullName: "",
    phone: "",
    bio: "",
    specialty: [],
    qualification: "",
    experienceYears: 0,
    licenseNumber: "",
    licenseDocument: null,
    profilePhoto: null,
    consultationFee: 500,
    consultationDuration: 30,
    availability: {
        mon: { enabled: true, slots: ["09:00-12:00", "14:00-17:00"] },
        tue: { enabled: true, slots: ["09:00-12:00", "14:00-17:00"] },
        wed: { enabled: true, slots: ["09:00-12:00"] },
        thu: { enabled: true, slots: ["09:00-12:00", "14:00-17:00"] },
        fri: { enabled: true, slots: ["09:00-12:00", "14:00-17:00"] },
        sat: { enabled: false, slots: [] },
        sun: { enabled: false, slots: [] },
    },
};

export default function DoctorRegisterPage() {
    const { user } = useAuth();
    const [step, setStep] = useState<Step>(1);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const updateFormData = <K extends keyof FormData>(key: K, value: FormData[K]) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleNext = () => {
        if (step < 4) setStep((step + 1) as Step);
    };

    const handleBack = () => {
        if (step > 1) setStep((step - 1) as Step);
    };

    const handleSubmit = async () => {
        if (!user) return;
        setSubmitting(true);

        try {
            await api.createDoctorProfile(user.id, formData);
            setSubmitted(true);
        } catch (error) {
            console.error("Registration error:", error);
            // In a real app, show toast notification here
            alert("Failed to create profile. Please check console for details.");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleSpecialty = (specialty: string) => {
        if (formData.specialty.includes(specialty)) {
            updateFormData("specialty", formData.specialty.filter((s) => s !== specialty));
        } else {
            updateFormData("specialty", [...formData.specialty, specialty]);
        }
    };

    const toggleDay = (day: string) => {
        updateFormData("availability", {
            ...formData.availability,
            [day]: {
                ...formData.availability[day],
                enabled: !formData.availability[day].enabled,
            },
        });
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50 p-6">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="pt-12 pb-8 space-y-6">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900">Application Submitted!</h2>
                            <p className="text-slate-600">
                                Thank you for registering with Healio.AI. Our team will review your credentials and get back to you within 24-48 hours.
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
                            <p>We&apos;ll send you an email at <strong>{user?.email}</strong> once your profile is verified.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const steps = [
        { number: 1, label: "Personal Info", icon: User },
        { number: 2, label: "Professional", icon: GraduationCap },
        { number: 3, label: "Documents", icon: FileText },
        { number: 4, label: "Availability", icon: Calendar },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50 py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 text-teal-700 text-sm font-medium">
                        <Stethoscope className="h-4 w-4" />
                        Doctor Registration
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Join Healio.AI</h1>
                    <p className="text-slate-600">Complete your profile to start helping patients</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2">
                    {steps.map((s, index) => (
                        <div key={s.number} className="flex items-center">
                            <div
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-full transition-all",
                                    step === s.number
                                        ? "bg-teal-600 text-white"
                                        : step > s.number
                                            ? "bg-teal-100 text-teal-700"
                                            : "bg-slate-100 text-slate-400"
                                )}
                            >
                                {step > s.number ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <s.icon className="h-4 w-4" />
                                )}
                                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={cn(
                                        "w-8 h-0.5 mx-2",
                                        step > s.number ? "bg-teal-400" : "bg-slate-200"
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <Card className="shadow-xl border-0">
                    <CardHeader>
                        <CardTitle>
                            {step === 1 && "Personal Information"}
                            {step === 2 && "Professional Details"}
                            {step === 3 && "Upload Documents"}
                            {step === 4 && "Set Your Availability"}
                        </CardTitle>
                        <CardDescription>
                            {step === 1 && "Tell us about yourself"}
                            {step === 2 && "Your qualifications and expertise"}
                            {step === 3 && "Verify your credentials"}
                            {step === 4 && "When can patients book you?"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Step 1: Personal Info */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name (as on license)</Label>
                                    <Input
                                        id="fullName"
                                        placeholder="Dr. John Doe"
                                        value={formData.fullName}
                                        onChange={(e) => updateFormData("fullName", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        placeholder="+91 98765 43210"
                                        value={formData.phone}
                                        onChange={(e) => updateFormData("phone", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        placeholder="Tell patients about your background, approach, and what makes you unique..."
                                        rows={4}
                                        value={formData.bio}
                                        onChange={(e) => updateFormData("bio", e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Professional Info */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Specializations (select all that apply)</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {SPECIALTIES.map((specialty) => (
                                            <button
                                                key={specialty}
                                                type="button"
                                                onClick={() => toggleSpecialty(specialty)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                                    formData.specialty.includes(specialty)
                                                        ? "bg-teal-600 text-white"
                                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                )}
                                            >
                                                {specialty}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="qualification">Qualification</Label>
                                        <Input
                                            id="qualification"
                                            placeholder="e.g., MBBS, MD (Ayurveda)"
                                            value={formData.qualification}
                                            onChange={(e) => updateFormData("qualification", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="experience">Years of Experience</Label>
                                        <Input
                                            id="experience"
                                            type="number"
                                            min={0}
                                            max={50}
                                            value={formData.experienceYears}
                                            onChange={(e) => updateFormData("experienceYears", parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="license">Medical License Number</Label>
                                    <Input
                                        id="license"
                                        placeholder="e.g., MH-12345-2020"
                                        value={formData.licenseNumber}
                                        onChange={(e) => updateFormData("licenseNumber", e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Documents */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Medical License / Registration Certificate</Label>
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-teal-300 transition-colors cursor-pointer">
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="hidden"
                                            id="licenseDoc"
                                            onChange={(e) => updateFormData("licenseDocument", e.target.files?.[0] || null)}
                                        />
                                        <label htmlFor="licenseDoc" className="cursor-pointer">
                                            <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                                            {formData.licenseDocument ? (
                                                <p className="text-teal-600 font-medium">{formData.licenseDocument.name}</p>
                                            ) : (
                                                <>
                                                    <p className="text-slate-600 font-medium">Click to upload</p>
                                                    <p className="text-sm text-slate-400">PDF, JPG or PNG (max 5MB)</p>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Profile Photo (Optional)</Label>
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-teal-300 transition-colors cursor-pointer">
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png"
                                            className="hidden"
                                            id="profilePhoto"
                                            onChange={(e) => updateFormData("profilePhoto", e.target.files?.[0] || null)}
                                        />
                                        <label htmlFor="profilePhoto" className="cursor-pointer">
                                            <User className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                                            {formData.profilePhoto ? (
                                                <p className="text-teal-600 font-medium">{formData.profilePhoto.name}</p>
                                            ) : (
                                                <>
                                                    <p className="text-slate-600 font-medium">Upload a professional photo</p>
                                                    <p className="text-sm text-slate-400">Helps patients recognize you</p>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Availability */}
                        {step === 4 && (
                            <div className="space-y-6">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fee">Consultation Fee (₹)</Label>
                                        <Input
                                            id="fee"
                                            type="number"
                                            min={100}
                                            step={50}
                                            value={formData.consultationFee}
                                            onChange={(e) => updateFormData("consultationFee", parseInt(e.target.value) || 500)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Consultation Duration</Label>
                                        <Select
                                            value={formData.consultationDuration.toString()}
                                            onValueChange={(v) => updateFormData("consultationDuration", parseInt(v))}
                                        >
                                            <SelectTrigger id="duration">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="15">15 minutes</SelectItem>
                                                <SelectItem value="30">30 minutes</SelectItem>
                                                <SelectItem value="45">45 minutes</SelectItem>
                                                <SelectItem value="60">60 minutes</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label>Available Days</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {DAYS.map((day) => (
                                            <div
                                                key={day.key}
                                                className={cn(
                                                    "flex items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer",
                                                    formData.availability[day.key].enabled
                                                        ? "border-teal-500 bg-teal-50"
                                                        : "border-slate-200 bg-white hover:border-slate-300"
                                                )}
                                                onClick={() => toggleDay(day.key)}
                                            >
                                                <Checkbox
                                                    checked={formData.availability[day.key].enabled}
                                                    onCheckedChange={() => toggleDay(day.key)}
                                                />
                                                <span className="text-sm font-medium">{day.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Clock className="h-4 w-4" />
                                        <span>Default hours: 9:00 AM - 12:00 PM, 2:00 PM - 5:00 PM</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">You can customize exact hours after registration.</p>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex items-center justify-between pt-4 border-t">
                            {step > 1 ? (
                                <Button variant="outline" onClick={handleBack}>
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Back
                                </Button>
                            ) : (
                                <div />
                            )}

                            {step < 4 ? (
                                <Button onClick={handleNext} className="bg-teal-600 hover:bg-teal-700">
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="bg-teal-600 hover:bg-teal-700"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Submit Application
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Info Footer */}
                <p className="text-center text-sm text-slate-500">
                    By registering, you agree to our Terms of Service and Privacy Policy.
                    <br />
                    Your information will be reviewed by our team for verification.
                </p>
            </div>
        </div>
    );
}
