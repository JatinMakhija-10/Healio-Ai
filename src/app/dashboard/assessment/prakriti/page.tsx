"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2, ArrowLeft, ChevronRight, ChevronLeft, UserCog, HeartPulse, ShieldCheck, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

type PersonaData = {
    age: string;
    gender: string;
    weight: string; // kg
    height: string; // cm
    smoking: string; // never | former | current
    alcohol: string; // none | occasional | frequent
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
    conditions: [],
    isPregnant: false,
    hasKidneyLiverDisease: false,
};

const KNOWN_CONDITIONS = [
    "Diabetes",
    "Hypertension",
    "Heart Disease",
    "Thyroid",
    "Arthritis",
    "Asthma",
    "Migraine",
    "Obesity",
    "PCOD / PCOS",
    "Epilepsy",
    "Cancer",
    "Depression / Anxiety",
];

const STEPS = [
    { title: "Basic Info", description: "Tell us a bit about yourself.", icon: UserCog },
    { title: "Lifestyle", description: "Your daily habits affect your health.", icon: HeartPulse },
    { title: "Medical History", description: "Existing conditions we should know about.", icon: ShieldCheck },
];

export default function PersonaBuilderPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [data, setData] = useState<PersonaData>(INITIAL);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const totalSteps = STEPS.length;
    const progress = (step / totalSteps) * 100;

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

    const canProceed = () => {
        if (step === 1) return data.age.trim() !== "" && data.gender !== "";
        if (step === 2) return true; // lifestyle is optional
        return true; // medical history is optional
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
            conditions: data.conditions,
            isPregnant: data.isPregnant,
            hasKidneyLiverDisease: data.hasKidneyLiverDisease,
            persona_built: true,
        };

        if (user) {
            const { error } = await supabase.auth.updateUser({
                data: { medical_profile: medicalProfile },
            });
            if (error) {
                console.error("Error saving persona:", error);
            } else {
                try {
                    localStorage.removeItem(`healio_pending_profile_${user.id}`);
                } catch {
                    /* ignore */
                }
                const { error: refreshError } = await supabase.auth.refreshSession();
                if (refreshError) console.error("Error refreshing session after persona:", refreshError);
            }
        }

        setIsSubmitting(false);
        setIsDone(true);
        setTimeout(() => router.push("/dashboard"), 2000);
    };

    if (isDone) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-teal-100"
                >
                    <div className="bg-teal-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-teal-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Profile Built!</h2>
                    <p className="text-slate-500">Your health persona has been saved. Redirecting to dashboard...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-xl mx-auto space-y-6">
                {/* Back button */}
                <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-teal-600" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>

                {/* Header */}
                <div className="text-center space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Build Your Health Persona</h1>
                    <p className="text-slate-500 text-sm">This helps us give you more personalized insights.</p>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-slate-400">
                        <span>Step {step} of {totalSteps} — {STEPS[step - 1].title}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-slate-200" />
                </div>

                {/* Card */}
                <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.25 }}
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

                            <CardContent className="space-y-5 min-h-[280px]">
                                {/* --- Step 1: Basic Info --- */}
                                {step === 1 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="age">Age <span className="text-red-400">*</span></Label>
                                                <Input
                                                    id="age"
                                                    type="number"
                                                    placeholder="e.g. 28"
                                                    value={data.age}
                                                    onChange={(e) => update("age", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Gender <span className="text-red-400">*</span></Label>
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
                                                <Input
                                                    id="weight"
                                                    type="number"
                                                    placeholder="e.g. 70"
                                                    value={data.weight}
                                                    onChange={(e) => update("weight", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="height">Height (cm)</Label>
                                                <Input
                                                    id="height"
                                                    type="number"
                                                    placeholder="e.g. 170"
                                                    value={data.height}
                                                    onChange={(e) => update("height", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* --- Step 2: Lifestyle --- */}
                                {step === 2 && (
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label>Smoking Status</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { value: "never", label: "Never" },
                                                    { value: "former", label: "Former" },
                                                    { value: "current", label: "Current" },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => update("smoking", opt.value)}
                                                        className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                                                            data.smoking === opt.value
                                                                ? "bg-teal-50 border-teal-400 text-teal-700"
                                                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Alcohol Consumption</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { value: "none", label: "None" },
                                                    { value: "occasional", label: "Occasional" },
                                                    { value: "frequent", label: "Frequent" },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => update("alcohol", opt.value)}
                                                        className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                                                            data.alcohol === opt.value
                                                                ? "bg-teal-50 border-teal-400 text-teal-700"
                                                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* --- Step 3: Medical History --- */}
                                {step === 3 && (
                                    <div className="space-y-5">
                                        <div className="space-y-3">
                                            <Label>Existing Health Conditions <span className="text-slate-400 font-normal">(select all that apply)</span></Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {KNOWN_CONDITIONS.map((c) => (
                                                    <div key={c} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                                                        data.conditions.includes(c)
                                                            ? "bg-teal-50 border-teal-300"
                                                            : "bg-white border-slate-100 hover:border-slate-200"
                                                    }`}
                                                        onClick={() => toggleCondition(c)}
                                                    >
                                                        <Checkbox
                                                            checked={data.conditions.includes(c)}
                                                            onCheckedChange={() => toggleCondition(c)}
                                                            className="border-slate-300 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                                                        />
                                                        <span className="text-sm text-slate-700">{c}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-1 border-t border-slate-100">
                                            <Label className="text-slate-700">Safety Flags</Label>
                                            <div className="space-y-2">
                                                <div
                                                    onClick={() => update("hasKidneyLiverDisease", !data.hasKidneyLiverDisease)}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                        data.hasKidneyLiverDisease
                                                            ? "bg-amber-50 border-amber-300"
                                                            : "bg-white border-slate-100 hover:border-slate-200"
                                                    }`}
                                                >
                                                    <Checkbox
                                                        checked={data.hasKidneyLiverDisease}
                                                        onCheckedChange={(v) => update("hasKidneyLiverDisease", v === true)}
                                                        className="border-slate-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                                    />
                                                    <span className="text-sm text-slate-700">I have kidney or liver disease</span>
                                                </div>

                                                {(data.gender === "female" || data.gender === "") && (
                                                    <div
                                                        onClick={() => update("isPregnant", !data.isPregnant)}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                            data.isPregnant
                                                                ? "bg-pink-50 border-pink-300"
                                                                : "bg-white border-slate-100 hover:border-slate-200"
                                                        }`}
                                                    >
                                                        <Checkbox
                                                            checked={data.isPregnant}
                                                            onCheckedChange={(v) => update("isPregnant", v === true)}
                                                            className="border-slate-300 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                                                        />
                                                        <span className="text-sm text-slate-700">I am currently pregnant</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-slate-100 flex justify-between bg-white">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                                    disabled={step === 1}
                                    className="text-slate-500 border-slate-200 hover:bg-slate-50"
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                </Button>

                                {step < totalSteps ? (
                                    <Button
                                        onClick={() => setStep((s) => s + 1)}
                                        disabled={!canProceed()}
                                        className="bg-slate-900 hover:bg-slate-800 text-white min-w-[120px]"
                                    >
                                        Next <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="bg-teal-600 hover:bg-teal-700 text-white min-w-[140px] shadow-lg shadow-teal-600/20"
                                    >
                                        {isSubmitting ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                        ) : (
                                            "Save Profile"
                                        )}
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
