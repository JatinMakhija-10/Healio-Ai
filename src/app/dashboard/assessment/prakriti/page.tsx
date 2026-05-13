"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowLeft, ChevronRight, ChevronLeft, UserCog, HeartPulse, ShieldCheck, Pill, CheckCircle, Plus, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export type MedicationEntry = {
    name: string;
    type: "allopathic" | "homeopathic" | "ayurvedic" | "supplement" | "other";
    duration: string;
};

type PersonaData = {
    age: string;
    gender: string;
    weight: string;
    height: string;
    smoking: string;
    alcohol: string;
    activityLevel: string;
    medications: MedicationEntry[];
    noMedications: boolean;
    allergies: string;
    conditions: string[];
    isPregnant: boolean;
    hasKidneyLiverDisease: boolean;
};

const INITIAL: PersonaData = {
    age: "",
    gender: "",
    weight: "",
    height: "",
    smoking: "never",
    alcohol: "none",
    activityLevel: "moderate",
    medications: [],
    noMedications: false,
    allergies: "",
    conditions: [],
    isPregnant: false,
    hasKidneyLiverDisease: false,
};

const DURATION_OPTIONS = [
    "Less than 1 month",
    "1–3 months",
    "3–6 months",
    "6–12 months",
    "1–2 years",
    "More than 2 years",
];

const KNOWN_CONDITIONS = [
    "Diabetes", "Hypertension", "Heart Disease", "Thyroid",
    "Arthritis", "Asthma", "Migraine", "Obesity",
    "PCOD / PCOS", "Epilepsy", "Cancer", "Depression / Anxiety",
    "Kidney Disease", "Liver Disease", "G6PD Deficiency",
];

const STEPS = [
    { title: "Basic Info", description: "Tell us a bit about yourself.", icon: UserCog },
    { title: "Lifestyle", description: "Your daily habits affect your health.", icon: HeartPulse },
    { title: "Medications & Allergies", description: "What you currently take and any sensitivities.", icon: Pill },
    { title: "Medical History", description: "Existing conditions we should know about.", icon: ShieldCheck },
];

function needsDuration(type: string): boolean {
    return type === "allopathic" || type === "homeopathic";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeMedList(raw: any): MedicationEntry[] {
    if (!raw) return [];
    if (typeof raw === "string") {
        return raw.split(",").map((s) => s.trim()).filter(Boolean).map((name) => ({
            name, type: "allopathic" as const, duration: "",
        }));
    }
    if (Array.isArray(raw)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return raw.map((item: any) =>
            typeof item === "string"
                ? { name: item, type: "allopathic" as const, duration: "" }
                : (item as MedicationEntry)
        );
    }
    return [];
}

export default function PersonaBuilderPage() {
    const { user, updateUserMetadata } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [data, setData] = useState<PersonaData>(INITIAL);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [newMed, setNewMed] = useState<MedicationEntry>({ name: "", type: "allopathic", duration: "" });

    const totalSteps = STEPS.length;
    const progress = (step / totalSteps) * 100;

    // Pre-populate form when editing an existing persona
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mp = user?.user_metadata?.medical_profile as any;
        if (!mp?.persona_built) return;
        setIsEditMode(true);
        setData({
            age: String(mp.age ?? mp.vitals?.age ?? ""),
            gender: mp.gender ?? mp.vitals?.gender ?? "",
            weight: String(mp.weight ?? mp.vitals?.weight ?? ""),
            height: String(mp.height ?? mp.vitals?.height ?? ""),
            smoking: mp.smoking ?? mp.lifestyle?.smoking ?? "never",
            alcohol: mp.alcohol ?? mp.lifestyle?.alcohol ?? "none",
            activityLevel: mp.activityLevel ?? mp.lifestyle?.exercise ?? "moderate",
            medications: normalizeMedList(mp.medicationList ?? mp.medications),
            noMedications: mp.noCurrentMedications ?? false,
            allergies: mp.allergies ?? [
                ...(mp.drugAllergies ?? []),
                ...(mp.foodAllergies ?? []),
            ].join(", "),
            conditions: mp.conditions ?? [],
            isPregnant: mp.isPregnant ?? mp.pregnant ?? false,
            hasKidneyLiverDisease: mp.hasKidneyLiverDisease ?? mp.kidney_liver_disease ?? false,
        });
    }, [user]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update = (field: keyof PersonaData, value: any) =>
        setData((prev) => ({ ...prev, [field]: value }));

    const toggleCondition = (c: string) =>
        setData((prev) => ({
            ...prev,
            conditions: prev.conditions.includes(c)
                ? prev.conditions.filter((x) => x !== c)
                : [...prev.conditions, c],
        }));

    const addMedication = () => {
        if (!newMed.name.trim()) return;
        setData((prev) => ({ ...prev, medications: [...prev.medications, { ...newMed }], noMedications: false }));
        setNewMed({ name: "", type: "allopathic", duration: "" });
    };

    const removeMedication = (idx: number) =>
        setData((prev) => ({ ...prev, medications: prev.medications.filter((_, i) => i !== idx) }));

    const canProceed = () => {
        if (step === 1) return data.age.trim() !== "" && data.gender !== "";
        return true;
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const medicalProfile = {
            age: data.age,
            gender: data.gender,
            weight: data.weight,
            height: data.height,
            smoking: data.smoking,
            alcohol: data.alcohol,
            activityLevel: data.activityLevel,
            medicationList: data.medications,
            medications: data.medications.map((m) => m.name).join(", "),
            noCurrentMedications: data.noMedications,
            allergies: data.allergies,
            conditions: data.conditions,
            isPregnant: data.isPregnant,
            hasKidneyLiverDisease: data.hasKidneyLiverDisease,
            persona_built: true,
        };
        try {
            await updateUserMetadata({ medical_profile: medicalProfile });
            if (user) {
                try { localStorage.removeItem(`healio_pending_profile_${user.id}`); } catch { /* ignore */ }
            }
        } catch (err) {
            console.error("Error saving persona:", err);
        }
        setIsSubmitting(false);
        setIsDone(true);
        setTimeout(() => router.push("/dashboard/profile"), 1500);
    };

    if (isDone) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-teal-100"
                >
                    <div className="bg-teal-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-teal-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                        {isEditMode ? "Persona Updated!" : "Profile Built!"}
                    </h2>
                    <p className="text-slate-500">Your health persona has been saved. Redirecting to your profile...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="py-8 px-4">
            <div className="max-w-xl mx-auto space-y-6">
                {/* Back button */}
                <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-teal-600" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>

                {/* Header */}
                <div className="text-center space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {isEditMode ? "Update Your Health Persona" : "Build Your Health Persona"}
                    </h1>
                    <p className="text-slate-500 text-sm">This helps us give you more personalised insights.</p>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-slate-400">
                        <span>Step {step} of {totalSteps} — {STEPS[step - 1].title}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-slate-200" />
                </div>

                {/* Step indicator dots */}
                <div className="flex justify-center gap-2">
                    {STEPS.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => i + 1 < step && setStep(i + 1)}
                            className={`h-2 rounded-full transition-all ${
                                i + 1 === step ? "w-6 bg-teal-500" :
                                i + 1 < step ? "w-2 bg-teal-300 cursor-pointer" :
                                "w-2 bg-slate-200"
                            }`}
                        />
                    ))}
                </div>

                {/* Card */}
                <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.22 }}
                        >
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-1">
                                    {(() => {
                                        const Icon = STEPS[step - 1].icon;
                                        return <div className="p-2 bg-teal-50 rounded-lg"><Icon className="h-5 w-5 text-teal-600" /></div>;
                                    })()}
                                    <div>
                                        <CardTitle className="text-xl text-slate-800">{STEPS[step - 1].title}</CardTitle>
                                        <CardDescription className="text-slate-500 text-sm">{STEPS[step - 1].description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-5 min-h-[300px]">

                                {/* ── Step 1: Basic Info ── */}
                                {step === 1 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="age">Age <span className="text-red-400">*</span></Label>
                                                <Input id="age" type="number" placeholder="e.g. 28" value={data.age}
                                                    onChange={(e) => update("age", e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Sex <span className="text-red-400">*</span></Label>
                                                <Select value={data.gender} onValueChange={(v) => update("gender", v)}>
                                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="weight">Weight (kg)</Label>
                                                <Input id="weight" type="number" placeholder="e.g. 70" value={data.weight}
                                                    onChange={(e) => update("weight", e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="height">Height (cm)</Label>
                                                <Input id="height" type="number" placeholder="e.g. 170" value={data.height}
                                                    onChange={(e) => update("height", e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                                            <CheckCircle className="h-3.5 w-3.5 text-teal-500 mt-0.5 shrink-0" />
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                Your data is encrypted and stored securely. It is used only to personalise your health suggestions and is never shared or sold.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* ── Step 2: Lifestyle ── */}
                                {step === 2 && (
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label>Smoking Status</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[{ value: "never", label: "Never" }, { value: "former", label: "Former" }, { value: "current", label: "Current" }].map((opt) => (
                                                    <button key={opt.value} type="button" onClick={() => update("smoking", opt.value)}
                                                        className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${data.smoking === opt.value ? "bg-teal-50 border-teal-400 text-teal-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Alcohol Consumption</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[{ value: "none", label: "None" }, { value: "occasional", label: "Occasional" }, { value: "frequent", label: "Frequent" }].map((opt) => (
                                                    <button key={opt.value} type="button" onClick={() => update("alcohol", opt.value)}
                                                        className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${data.alcohol === opt.value ? "bg-teal-50 border-teal-400 text-teal-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Physical Activity Level</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { value: "sedentary", label: "Sedentary", desc: "Little to no exercise" },
                                                    { value: "light", label: "Lightly Active", desc: "1–3 days/week" },
                                                    { value: "moderate", label: "Moderately Active", desc: "3–5 days/week" },
                                                    { value: "active", label: "Very Active", desc: "6–7 days/week" },
                                                ].map((opt) => (
                                                    <button key={opt.value} type="button" onClick={() => update("activityLevel", opt.value)}
                                                        className={`p-3 rounded-lg border text-left text-sm transition-all ${data.activityLevel === opt.value ? "bg-teal-50 border-teal-400" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                                                        <div className={`font-medium ${data.activityLevel === opt.value ? "text-teal-700" : "text-slate-700"}`}>{opt.label}</div>
                                                        <div className="text-slate-400 text-xs mt-0.5">{opt.desc}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── Step 3: Medications & Allergies ── */}
                                {step === 3 && (
                                    <div className="space-y-5">
                                        <div className="space-y-3">
                                            <Label>Current Medications</Label>

                                            {/* No medications confirmation toggle */}
                                            <div
                                                onClick={() => data.medications.length === 0 && update("noMedications", !data.noMedications)}
                                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                                    data.medications.length > 0
                                                        ? "opacity-40 cursor-not-allowed border-slate-100 bg-white"
                                                        : data.noMedications
                                                            ? "bg-green-50 border-green-300 cursor-pointer"
                                                            : "bg-white border-slate-200 hover:border-slate-300 cursor-pointer"
                                                }`}
                                            >
                                                <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0 transition-all ${
                                                    data.noMedications && data.medications.length === 0
                                                        ? "bg-green-500 border-green-500"
                                                        : "border-slate-300"
                                                }`}>
                                                    {data.noMedications && data.medications.length === 0 && (
                                                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <span className={`text-sm font-medium ${
                                                        data.noMedications && data.medications.length === 0 ? "text-green-700" : "text-slate-700"
                                                    }`}>
                                                        I am not currently taking any medications
                                                    </span>
                                                    {data.noMedications && data.medications.length === 0 && (
                                                        <p className="text-xs text-green-600 mt-0.5">Confirmed — no current medications</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Existing medications list */}
                                            {data.medications.length > 0 && (
                                                <div className="space-y-2">
                                                    {data.medications.map((med, idx) => (
                                                        <div key={idx} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                                            <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                                                <span className="font-medium text-sm text-slate-800">{med.name}</span>
                                                                <Badge variant="outline" className="text-xs capitalize text-slate-500 border-slate-200">{med.type}</Badge>
                                                                {med.duration && (
                                                                    <Badge variant="outline" className="text-xs text-teal-600 border-teal-200 bg-teal-50">{med.duration}</Badge>
                                                                )}
                                                            </div>
                                                            <button type="button" onClick={() => removeMedication(idx)}
                                                                className="text-slate-400 hover:text-red-500 transition-colors shrink-0 mt-0.5">
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Add medication form */}
                                            <div className="border border-dashed border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50/50">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-slate-500">Medicine name</Label>
                                                    <Input
                                                        placeholder="e.g. Metformin, Arnica 30C, Ashwagandha"
                                                        value={newMed.name}
                                                        onChange={(e) => setNewMed((p) => ({ ...p, name: e.target.value }))}
                                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMedication(); } }}
                                                    />
                                                </div>
                                                <div className={`grid gap-2 ${needsDuration(newMed.type) ? "grid-cols-2" : "grid-cols-1"}`}>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-slate-500">Medicine type</Label>
                                                        <Select value={newMed.type}
                                                            onValueChange={(v) => setNewMed((p) => ({ ...p, type: v as MedicationEntry["type"], duration: "" }))}>
                                                            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="allopathic">Allopathic</SelectItem>
                                                                <SelectItem value="homeopathic">Homeopathic</SelectItem>
                                                                <SelectItem value="ayurvedic">Ayurvedic</SelectItem>
                                                                <SelectItem value="supplement">Supplement</SelectItem>
                                                                <SelectItem value="other">Other</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {needsDuration(newMed.type) && (
                                                        <div className="space-y-1">
                                                            <Label className="text-xs text-slate-500">
                                                                How long have you been taking it? <span className="text-amber-500">*</span>
                                                            </Label>
                                                            <Select value={newMed.duration}
                                                                onValueChange={(v) => setNewMed((p) => ({ ...p, duration: v }))}>
                                                                <SelectTrigger className="text-sm"><SelectValue placeholder="Select duration" /></SelectTrigger>
                                                                <SelectContent>
                                                                    {DURATION_OPTIONS.map((d) => (
                                                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}
                                                </div>
                                                <Button type="button" variant="outline" size="sm" onClick={addMedication}
                                                    disabled={!newMed.name.trim() || (needsDuration(newMed.type) && !newMed.duration)}
                                                    className="w-full border-teal-200 text-teal-700 hover:bg-teal-50">
                                                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Medication
                                                </Button>
                                            </div>
                                            <p className="text-xs text-slate-400">Duration is required for allopathic and homeopathic medicines — it affects diagnosis accuracy.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="allergies">Known Allergies</Label>
                                            <Input id="allergies"
                                                placeholder="e.g. Penicillin, pollen, nuts (comma-separated)"
                                                value={data.allergies}
                                                onChange={(e) => update("allergies", e.target.value)} />
                                            <p className="text-xs text-slate-400">Drug, food, or environmental allergies</p>
                                        </div>
                                    </div>
                                )}

                                {/* ── Step 4: Medical History ── */}
                                {step === 4 && (
                                    <div className="space-y-5">
                                        <div className="space-y-3">
                                            <Label>Existing Health Conditions <span className="text-slate-400 font-normal">(select all that apply)</span></Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {KNOWN_CONDITIONS.map((c) => (
                                                    <div key={c}
                                                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${data.conditions.includes(c) ? "bg-teal-50 border-teal-300" : "bg-white border-slate-100 hover:border-slate-200"}`}
                                                        onClick={() => toggleCondition(c)}>
                                                        <Checkbox checked={data.conditions.includes(c)} onCheckedChange={() => toggleCondition(c)}
                                                            className="border-slate-300 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600" />
                                                        <span className="text-sm text-slate-700">{c}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-1 border-t border-slate-100">
                                            <Label className="text-slate-700">Safety Flags</Label>
                                            <div className="space-y-2">
                                                <div onClick={() => update("hasKidneyLiverDisease", !data.hasKidneyLiverDisease)}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${data.hasKidneyLiverDisease ? "bg-amber-50 border-amber-300" : "bg-white border-slate-100 hover:border-slate-200"}`}>
                                                    <Checkbox checked={data.hasKidneyLiverDisease}
                                                        onCheckedChange={(v) => update("hasKidneyLiverDisease", v === true)}
                                                        className="border-slate-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500" />
                                                    <span className="text-sm text-slate-700">I have kidney or liver disease</span>
                                                </div>
                                                {(data.gender === "female" || data.gender === "") && (
                                                    <div onClick={() => update("isPregnant", !data.isPregnant)}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${data.isPregnant ? "bg-pink-50 border-pink-300" : "bg-white border-slate-100 hover:border-slate-200"}`}>
                                                        <Checkbox checked={data.isPregnant}
                                                            onCheckedChange={(v) => update("isPregnant", v === true)}
                                                            className="border-slate-300 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500" />
                                                        <span className="text-sm text-slate-700">I am currently pregnant</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </CardContent>

                            {/* Medical disclaimer footer — always visible */}
                            <div className="px-6 pt-0 pb-3">
                                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                                    <p className="text-[11px] text-amber-700 leading-relaxed">
                                        <strong>Not medical advice.</strong> Healio.AI is an AI tool for general wellness guidance only. Always consult a qualified doctor before making health decisions. In an emergency, call <strong>112</strong>.
                                    </p>
                                </div>
                            </div>
                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-slate-100 flex justify-between bg-white">
                                <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}
                                    className="text-slate-500 border-slate-200 hover:bg-slate-50">
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                {step < totalSteps ? (
                                    <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}
                                        className="bg-slate-900 hover:bg-slate-800 text-white min-w-[120px]">
                                        Next <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button onClick={handleSubmit} disabled={isSubmitting}
                                        className="bg-teal-600 hover:bg-teal-700 text-white min-w-[140px] shadow-lg shadow-teal-600/20">
                                        {isSubmitting
                                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                            : isEditMode ? "Update Persona" : "Save Profile"}
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </Card>
            </div>
        </div>
    );
}
