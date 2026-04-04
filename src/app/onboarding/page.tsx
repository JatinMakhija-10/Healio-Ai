"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ChevronRight, ChevronLeft, ShieldAlert, CheckCircle, Stethoscope, Leaf, Dumbbell, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ONBOARDING_PRAKRITI_QUESTIONS } from "@/lib/ayurveda/prakriti/onboardingQuestions";

// --- Types ---
type OnboardingData = {
    // Step 1: Basic
    fullName: string;
    age: string;
    gender: string;
    // Step 2: Vitals & Lifestyle
    weight: string; // kg
    height: string; // cm
    smoking: string; // never, former, current
    alcohol: string; // none, occasional, frequent
    exercise: string; // sedentary, light, moderate, active
    diet: string; // vegetarian, non-veg, vegan, mixed
    // Step 3: Medical
    conditions: string[];
    allergies: string;
    // Step 4: Family History & Lifestyle Details
    familyHistory: string[];
    sleepHours: string;
    occupation: string;
    recentSurgery: boolean;
    // Step 5: Safety
    isPregnant: boolean;
    hasKidneyLiverDisease: boolean;
    medications: string;
    bloodPressure: string; // normal, high, low
    // Step 6: Emergency Contact
    emergencyContact: {
        name: string;
        phone: string;
        relation: string;
    };
    // Step 2: Care Preferences
    carePreferences: string[]; // 'modern_medicine' | 'ayurveda' | 'yoga' | 'home_remedies'
    // Step 8: Consent
    hasConsented: boolean;
    // Prakriti Assessment (Ayurvedic Constitution)
    prakritiAnswers: Record<string, 'vata' | 'pitta' | 'kapha'>; // question ID -> selected dosha
};

const INITIAL_DATA: OnboardingData = {
    fullName: "",
    age: "",
    gender: "",
    weight: "",
    height: "",
    smoking: "never",
    alcohol: "none",
    exercise: "moderate",
    diet: "mixed",
    carePreferences: [],
    conditions: [],
    allergies: "",
    familyHistory: [],
    sleepHours: "7-8",
    occupation: "",
    recentSurgery: false,
    isPregnant: false,
    hasKidneyLiverDisease: false,
    medications: "",
    bloodPressure: "normal",
    emergencyContact: { name: "", phone: "", relation: "" },
    hasConsented: false,
    prakritiAnswers: {} // Empty initially
};

export default function OnboardingWizard() {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
    const totalSteps = 3; // Phase 1: Basic Info, Health Background, Consent
    const progress = (step / totalSteps) * 100;
    const router = useRouter();
    const { user, loading } = useAuth(); // Assuming loading is available in useAuth

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1)
         
        else handleComplete();
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleComplete = async () => {
        if (loading) return; // Wait for auth to initialize

        // PHASE 2 — Health Risk Profile & Prakriti Assessment
        // Import and calculate health risk profile
        // const { calculateHealthRiskProfile } = await import('@/lib/diagnosis/healthRiskCalculator');
        // const { assessPrakriti } = await import('@/lib/ayurveda/prakriti/prakritiEngine');
        // ... (all prakriti + health risk calculation code preserved but disabled)

        // Phase 1 — Simplified profile data
        const profileData = {
            full_name: data.fullName,
            age: data.age,
            gender: data.gender,
            onboarding_completed: true,
            medical_profile: {
                conditions: data.conditions,
                allergies: data.allergies,
            },
        };

        console.log("Phase 1 Profile:", profileData);

        // Save to localStorage with user-specific key if user is logged in, otherwise use generic key
        const storageKey = user ? `healio_pending_profile_${user.id}` : 'healio_pending_profile';
        localStorage.setItem(storageKey, JSON.stringify(profileData));
        console.log("Saved profile to localStorage:", profileData);

        if (!user) {
            console.log("User not authenticated, data saved to localStorage for later sync.");
            router.push("/dashboard");
            return;
        }

        try {
            console.log("Saving profile to Supabase metadata...", profileData);

            // 1. Update Auth Metadata (for session and quick access)
            const { error } = await supabase.auth.updateUser({
                data: profileData
            });
            if (error) throw error;

            // 2. Update Public Profiles Table
            const { error: dbError } = await supabase
                .from('profiles')
                .update({
                    full_name: data.fullName,
                })
                .eq('id', user.id);

            if (dbError) {
                console.error("Error syncing to profiles table:", dbError);
            }

            // Clear pending profile from localStorage since it's now saved
            localStorage.removeItem(`healio_pending_profile_${user.id}`);

            // Force session refresh to ensure AuthContext picks up the new metadata
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) console.error("Error refreshing session:", refreshError);

            router.push("/dashboard");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("There was an issue saving your profile to the cloud, but your data is saved locally.");
            router.push("/dashboard");
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData = (field: keyof OnboardingData, value: any) => {
        setData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleCondition = (condition: string) => {
        setData((prev) => {
            const exists = prev.conditions.includes(condition);
            return {
                ...prev,
                conditions: exists
                    ? prev.conditions.filter((c) => c !== condition)
                    : [...prev.conditions, condition],
            };
        });
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const toggleFamilyHistory = (condition: string) => {
        setData((prev) => {
            const exists = prev.familyHistory.includes(condition);
            return {
                ...prev,
                familyHistory: exists
                    ? prev.familyHistory.filter((c) => c !== condition)
                    : [...prev.familyHistory, condition],
            };
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-full h-64 bg-gradient-to-b from-blue-50 to-transparent -z-10" />

            <div className="w-full max-w-xl space-y-6">
                {/* Progress Header */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium text-slate-500">
                        <span>Step {step} of {totalSteps}</span>
                        <span>{Math.round(progress)}% Complete</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-slate-200" />
                </div>

                {/* Wizard Card */}
                <Card className="border-slate-200 shadow-xl shadow-slate-200/60 backdrop-blur-sm bg-white/95 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CardHeader>
                                <CardTitle className="text-2xl text-slate-800">
                                    {step === 1 && "Basic Profile"}
                                    {step === 2 && "Health Background"}
                                    {step === 3 && "Consent & Privacy"}
                                </CardTitle>
                                <CardDescription className="text-slate-500">
                                    {step === 1 && "Tell us a bit about yourself so we can personalize your care."}
                                    {step === 2 && "Help us understand your health background (optional)."}
                                    {step === 3 && "Review how we handle your data."}
                                </CardDescription>
                            </CardHeader>

                            {/* Main Content Area - Responsive Height */}
                            <CardContent className="space-y-6 min-h-[300px] md:min-h-[350px]">
                                {/* --- Step 1: Basic Profile --- KEEP */}
                                {step === 1 && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName">Full Name</Label>
                                            <Input
                                                id="fullName"
                                                placeholder="e.g. Jane Doe"
                                                value={data.fullName}
                                                onChange={(e) => updateData("fullName", e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="age">Age</Label>
                                                <Input
                                                    id="age"
                                                    type="number"
                                                    placeholder="e.g. 32"
                                                    value={data.age}
                                                    onChange={(e) => updateData("age", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Gender</Label>
                                                <Select
                                                    value={data.gender}
                                                    onValueChange={(val) => updateData("gender", val)}
                                                >
                                                    <SelectTrigger className="text-base md:text-sm">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* --- Step 2: Basic Health Background (Phase 1 simplified) --- */}
                                {step === 2 && (
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label className="text-base">Any Known Health Conditions? (Optional)</Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {["Diabetes", "Hypertension", "Thyroid", "Arthritis", "Migraine", "Asthma"].map((c) => (
                                                    <div key={c} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`cond-${c}`}
                                                            checked={data.conditions.includes(c)}
                                                            onCheckedChange={() => toggleCondition(c)}
                                                        />
                                                        <label htmlFor={`cond-${c}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600">
                                                            {c}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="allergies">Any Known Allergies? (Optional)</Label>
                                            <Input
                                                id="allergies"
                                                placeholder="e.g. Penicillin, Peanuts (leave blank if none)"
                                                value={data.allergies}
                                                onChange={(e) => updateData("allergies", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* PHASE 2 — Care Preferences (was Step 2) */}
                                {/* <Step2CarePreferences /> */}

                                {/* PHASE 2 — Vitals & Lifestyle (was Step 3) */}
                                {/* <Step3VitalsLifestyle /> */}

                                {/* PHASE 2 — Medical History (was Step 4) - now simplified into Step 2 above */}
                                {/* <Step4MedicalHistory /> */}

                                {/* PHASE 2 — Family History & Lifestyle (was Step 5) */}
                                {/* <Step5FamilyHistory /> */}

                                {/* PHASE 2 — Safety Check (was Step 6) */}
                                {/* <Step6SafetyCheck /> */}

                                {/* PHASE 2 — Emergency Contact (was Step 7) */}
                                {/* <Step7EmergencyContact /> */}

                                {/* PHASE 2 — Old Steps 3-7 commented out to prevent rendering conflicts
                                   with new 3-step flow. The step === 3 condition below would conflict
                                   with the Consent step (now step 3).
                                   To re-enable for Phase 2, increase totalSteps and renumber these. */}

                                {/* {step === 3 && (
                                    <div className="space-y-4">
                                        ... Vitals & Lifestyle step content ...
                                    </div>
                                )} */}

                                {/* {step === 4 && (
                                    <div className="space-y-6">
                                        ... Medical History step content ...
                                    </div>
                                )} */}

                                {/* {step === 5 && (
                                    <div className="space-y-6">
                                        ... Family History & Lifestyle step content ...
                                    </div>
                                )} */}

                                {/* {step === 6 && (
                                    <div className="space-y-6">
                                        ... Safety Check step content ...
                                    </div>
                                )} */}

                                {/* {step === 7 && (
                                    <div className="space-y-6">
                                        ... Emergency Contact step content ...
                                    </div>
                                )} */}


                                {/* --- Step 3: Consent (was Step 8) --- */}
                                {step === 3 && (
                                    <div className="space-y-8 text-center py-2">
                                        <div className="relative mx-auto w-20 h-20">
                                            <div className="absolute inset-0 bg-teal-100 rounded-full animate-ping opacity-20" />
                                            <div className="relative bg-gradient-to-br from-teal-50 to-white w-20 h-20 rounded-full flex items-center justify-center border border-teal-100 shadow-sm">
                                                <ShieldAlert className="h-10 w-10 text-teal-600" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="font-bold text-slate-900 text-2xl tracking-tight">Your Health, Your Data</h3>
                                            <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
                                                We believe privacy is a fundamental right. Your medical information is protected by industry-leading security standards.
                                            </p>
                                        </div>

                                        <div className="grid gap-3 max-w-sm mx-auto text-left">
                                            {[
                                                { title: "End-to-End Encryption", desc: "Your data is encrypted at rest and in transit." },
                                                { title: "You Are In Control", desc: "Delete your data permanently at any time." },
                                                { title: "Private by Design", desc: "We never sell your personal health data." }
                                            ].map((item, i) => (
                                                <div key={i} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 items-start">
                                                    <div className="mt-0.5 min-w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center">
                                                        <CheckCircle className="h-3 w-3 text-teal-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
                                                        <p className="text-xs text-slate-500">{item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100 text-left max-w-sm mx-auto transition-all hover:bg-teal-50 hover:shadow-md">
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    id="consent"
                                                    checked={data.hasConsented}
                                                    onCheckedChange={(checked) => setData(prev => ({ ...prev, hasConsented: checked === true }))}
                                                    className="mt-1 border-teal-200 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <Label htmlFor="consent" className="text-sm font-semibold text-slate-800 cursor-pointer">
                                                        I agree to the Terms of Service
                                                    </Label>
                                                    <p className="text-xs text-slate-500 leading-snug">
                                                        I confirm that I am at least 18 years old and acknowledge the <a href="#" className="underline text-teal-700 hover:text-teal-800">Privacy Policy</a>.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <div className="p-6 border-t border-slate-100 flex justify-between bg-white z-10 relative">
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    disabled={step === 1}
                                    className="text-slate-500 border-slate-200 hover:bg-slate-50"
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={
                                        (step === 3 && !data.hasConsented)
                                    }
                                    className={`min-w-[140px] transition-all ${step === totalSteps
                                        ? "bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg shadow-teal-600/20 border-0"
                                        : "bg-slate-900 hover:bg-slate-800 text-white"
                                        }`}
                                >
                                    {step === totalSteps ? (loading ? "Saving..." : "Start Dashboard") : (
                                        <>Next <ChevronRight className="ml-2 h-4 w-4" /></>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </Card>
            </div>
        </div >
    );
}
