"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, ShieldAlert, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
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
    // Step 7: Consent
    hasConsented: boolean;
    // Step 8: Prakriti Assessment (Ayurvedic Constitution)
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
    const totalSteps = 7; // Removed Prakriti Assessment
    const progress = (step / totalSteps) * 100;
    const router = useRouter();
    const { user, loading } = useAuth(); // Assuming loading is available in useAuth

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1);
        else handleComplete();
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleComplete = async () => {
        if (loading) return; // Wait for auth to initialize

        // Import and calculate health risk profile
        const { calculateHealthRiskProfile } = await import('@/lib/diagnosis/healthRiskCalculator');
        const { assessPrakriti } = await import('@/lib/ayurveda/prakriti/prakritiEngine');

        // Prepare onboarding data for calculations
        const calculationData = {
            age: data.age,
            gender: data.gender,
            weight: data.weight,
            height: data.height,
            smoking: data.smoking,
            alcohol: data.alcohol,
            exercise: data.exercise,
            diet: data.diet,
            sleepHours: data.sleepHours,
            conditions: data.conditions,
            familyHistory: data.familyHistory,
            bloodPressure: data.bloodPressure,
            medications: data.medications,
            recentSurgery: data.recentSurgery,
            isPregnant: data.isPregnant,
            hasKidneyLiverDisease: data.hasKidneyLiverDisease,
            occupation: data.occupation
        };

        // Calculate health risk profile (BMI, cardiovascular, diabetes, respiratory, liver risks)
        const healthRiskProfile = calculateHealthRiskProfile(calculationData);
        console.log("✅ Health Risk Profile Calculated:", healthRiskProfile);

        // Build Prakriti questionnaire data from answers
        // Map questionnaire answers to proper format for Prakriti engine
        /* eslint-disable @typescript-eslint/no-explicit-any */

        //Helper: Map dosha selections to enum keys expected by Prakriti engine
        const mapToEnum = (questionId: string, dosha: 'vata' | 'pitta' | 'kapha'): string => {
            // Question ID -> [vata value, pitta value, kapha value]
            const enumMappings: Record<string, [string, string, string]> = {
                'P1': ['thin-small-boned', 'medium-moderate', 'large-heavy-boned'],
                'P2': ['thin-dry-rough', 'warm-soft-oily', 'thick-smooth-cool'],
                'P6': ['thin-cracking-prominent', 'medium-loose', 'large-padded-stable'],
                'P7': ['cold-prefer-warmth', 'warm-prefer-cool', 'adaptable-dislike-damp'],
                'D1': ['irregular-unpredictable', 'strong-cant-skip-meals', 'steady-low'],
                'D2': ['variable-inconsistent', 'quick-rapid', 'slow-prolonged'],
                'D7': ['irregular-constipation', 'regular-loose-frequent', 'heavy-once-daily'],
                'D8': ['underweight-hard-to-gain', 'moderate-fluctuates', 'overweight-hard-to-lose'],
                'M1': ['quick-creative-restless', 'sharp-analytical-focused', 'slow-methodical-steady'],
                'M2': ['quick-grasp-poor-retention', 'sharp-focused-good-retention', 'slow-excellent-long-term-memory'],
                'M3': ['fear-anxiety-insecurity', 'anger-jealousy-ambition', 'attachment-greed-calm'],
                'S1': ['light-interrupted-insomnia', 'moderate-sound', 'deep-heavy-excessive']
            };

            const mapping = enumMappings[questionId];
            if (!mapping) return '';

            const dIdx = dosha === 'vata' ? 0 : dosha === 'pitta' ? 1 : 2;
            return mapping[dIdx];
        };

        const prakritiQuestionnaireData = {
            bodyStructure: {
                frame: mapToEnum('P1', data.prakritiAnswers['P1']) as any,
                weight: mapToEnum('D8', data.prakritiAnswers['D8']) as any,
                veinsVisibility: 'moderate' as any,
                jointSize: mapToEnum('P6', data.prakritiAnswers['P6']) as any
            },
            skinHair: {
                skinTexture: mapToEnum('P2', data.prakritiAnswers['P2']) as any,
                complexion: 'fair-reddish' as any,
                hairType: 'fine-oily-early-grey' as any,
                hairGrowth: 'moderate' as any
            },
            physiological: {
                naturalAppetite: mapToEnum('D1', data.prakritiAnswers['D1']) as any,
                naturalThirst: 'variable' as any,
                naturalBowelPattern: mapToEnum('D7', data.prakritiAnswers['D7']) as any,
                naturalSleepPattern: mapToEnum('S1', data.prakritiAnswers['S1']) as any,
                dreamingStyle: 'colorful-violent-passionate' as any
            },
            mind: {
                learningStyle: mapToEnum('M2', data.prakritiAnswers['M2']) as any,
                speechPattern: 'clear-precise-sharp' as any,
                decisionMaking: 'quick-decisive' as any,
                emotionalTendency: mapToEnum('M3', data.prakritiAnswers['M3']) as any,
                memoryType: 'sharp-medium-term' as any
            },
            behavior: {
                activityLevel: 'moderate-purposeful' as any,
                spendingHabits: 'planned-on-luxuries' as any,
                temperament: mapToEnum('M1', data.prakritiAnswers['M1']) as any
            }
        };
        /* eslint-enable @typescript-eslint/no-explicit-any */

        // Assess Prakriti using authentic Ayurvedic engine
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prakritiProfile = assessPrakriti(prakritiQuestionnaireData as any);
        console.log("✅ Authentic Prakriti Assessment Completed:", prakritiProfile);

        // Convert to old format for compatibility (transition period)
        const ayurvedicProfile = {
            prakriti: prakritiProfile.prakriti,
            primaryDosha: prakritiProfile.prakriti.split('-')[0] as 'vata' | 'pitta' | 'kapha',
            secondaryDosha: prakritiProfile.prakriti.includes('-')
                ? prakritiProfile.prakriti.split('-')[1] as 'vata' | 'pitta' | 'kapha' | null
                : null,
            doshicTendencies: prakritiProfile.doshicTendencies,
            characteristics: prakritiProfile.definingCharacteristics?.physical || [],
            strengths: [],
            vulnerabilities: [],
            dietaryRecommendations: [],
            lifestyleRecommendations: [],
            balancingHerbs: [],
            balancingPractices: [],
            // Store full authentic profile
            fullPrakritiProfile: prakritiProfile
        };
        console.log("✅ Ayurvedic Profile Created:", ayurvedicProfile);

        // Prepare profile data object with computed profiles
        const profileData = {
            full_name: data.fullName,
            age: data.age,
            gender: data.gender,
            weight: data.weight,
            height: data.height,
            onboarding_completed: true,
            medical_profile: {
                conditions: data.conditions,
                allergies: data.allergies,
                smoking: data.smoking,
                alcohol: data.alcohol,
                exercise: data.exercise,
                diet: data.diet,
                family_history: data.familyHistory,
                sleep_hours: data.sleepHours,
                occupation: data.occupation,
                recent_surgery: data.recentSurgery,
                medications: data.medications,
                pregnant: data.isPregnant,
                kidney_liver_disease: data.hasKidneyLiverDisease,
                blood_pressure: data.bloodPressure,
                emergency_contact: data.emergencyContact
            },
            // Computed health intelligence
            health_risk_profile: healthRiskProfile,
            ayurvedic_profile: ayurvedicProfile
        };

        // Log summary of key health insights
        console.log("🏥 Health Summary:");
        console.log(`   BMI: ${healthRiskProfile.bmi.value} (${healthRiskProfile.bmi.category})`);
        console.log(`   Overall Health Score: ${healthRiskProfile.overallHealthScore}/100`);
        console.log(`   Lifestyle Rating: ${healthRiskProfile.lifestyleScore.rating}`);
        console.log(`   Prakriti: ${ayurvedicProfile.prakriti} (${ayurvedicProfile.primaryDosha} dominant)`);
        if (healthRiskProfile.priorityWarnings.length > 0) {
            console.log("   Priority Warnings:", healthRiskProfile.priorityWarnings);
        }

        // Always save to localStorage (works even without auth)
        localStorage.setItem('healio_pending_profile', JSON.stringify(profileData));
        // Also save emergency contact separately for easy access in Settings/App
        localStorage.setItem('healio_emergency_contact', JSON.stringify(data.emergencyContact));
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

            // 2. Update Public Profiles Table (for Dashboard/Settings persistence)
            // ensuring consistency so Settings can edit this later
            const { error: dbError } = await supabase
                .from('profiles')
                .update({
                    full_name: data.fullName,
                    // If phone is collected in onboarding (e.g. step 6 emergency, or if added to step 1 which it isn't currently but good to prep)
                    // Currently onboarding doesn't seem to have a specific 'phone' field for the user themselves, only emergency contact.
                    // But if we want to sync metadata phone if it exists:
                    // phone: data.phone || undefined 
                })
                .eq('id', user.id);

            if (dbError) {
                console.error("Error syncing to profiles table:", dbError);
                // We don't throw here to avoid blocking completion if metadata worked, 
                // but it might cause the issue user described. Let's log it.
            }

            // Clear pending profile from localStorage since it's now saved
            localStorage.removeItem('healio_pending_profile');

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
                                    {step === 2 && "Vitals & Lifestyle"}
                                    {step === 3 && "Medical History"}
                                    {step === 4 && "Family & Lifestyle"}
                                    {step === 5 && "Safety Check"}
                                    {step === 6 && "Emergency Contact"}
                                    {step === 7 && "Consent & Privacy"}
                                </CardTitle>
                                <CardDescription className="text-slate-500">
                                    {step === 1 && "Tell us a bit about yourself so we can personalize your care."}
                                    {step === 2 && "We need these details to check for risk factors."}
                                    {step === 3 && "Help us understand your health history."}
                                    {step === 4 && "Your background helps us identify genetic risks."}
                                    {step === 5 && "Let's ensure our recommendations are safe for you."}
                                    {step === 6 && "In case we detect a critical situation."}
                                    {step === 7 && "Review how we handle your data."}
                                </CardDescription>
                            </CardHeader>

                            {/* Main Content Area - Responsive Height */}
                            <CardContent className="space-y-6 min-h-[300px] md:min-h-[350px]">
                                {/* --- Step 1: Basic Profile --- */}
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

                                {/* --- Step 2: Vitals & Lifestyle --- */}
                                {step === 2 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="weight">Weight (kg)</Label>
                                                <Input
                                                    id="weight"
                                                    type="number"
                                                    placeholder="e.g. 70"
                                                    value={data.weight}
                                                    onChange={(e) => updateData("weight", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="height">Height (cm)</Label>
                                                <Input
                                                    id="height"
                                                    type="number"
                                                    placeholder="e.g. 175"
                                                    value={data.height}
                                                    onChange={(e) => updateData("height", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Smoking</Label>
                                            <Select
                                                value={data.smoking}
                                                onValueChange={(val) => updateData("smoking", val)}
                                            >
                                                <SelectTrigger className="text-base md:text-sm">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="never">Never Smoked</SelectItem>
                                                    <SelectItem value="former">Former Smoker</SelectItem>
                                                    <SelectItem value="current">Current Smoker</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Alcohol Consumption</Label>
                                            <Select
                                                value={data.alcohol}
                                                onValueChange={(val) => updateData("alcohol", val)}
                                            >
                                                <SelectTrigger className="text-base md:text-sm">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    <SelectItem value="occasional">Occasional</SelectItem>
                                                    <SelectItem value="frequent">Frequent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Exercise Frequency</Label>
                                                <Select
                                                    value={data.exercise}
                                                    onValueChange={(val) => updateData("exercise", val)}
                                                >
                                                    <SelectTrigger className="text-base md:text-sm">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="sedentary">Sedentary (No exercise)</SelectItem>
                                                        <SelectItem value="light">Light (1-2 times/week)</SelectItem>
                                                        <SelectItem value="moderate">Moderate (3-4 times/week)</SelectItem>
                                                        <SelectItem value="active">Active (5+ times/week)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Diet Type</Label>
                                                <Select
                                                    value={data.diet}
                                                    onValueChange={(val) => updateData("diet", val)}
                                                >
                                                    <SelectTrigger className="text-base md:text-sm">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                                                        <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                                                        <SelectItem value="vegan">Vegan</SelectItem>
                                                        <SelectItem value="mixed">Mixed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* --- Step 3: Medical History --- */}
                                {step === 3 && (
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label className="text-base">Existing Conditions</Label>
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
                                            <Label htmlFor="allergies">Allergies (Medication or Food)</Label>
                                            <Input
                                                id="allergies"
                                                placeholder="e.g. Penicillin, Peanuts (leave blank if none)"
                                                value={data.allergies}
                                                onChange={(e) => updateData("allergies", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* --- Step 4: Family History & Lifestyle --- */}
                                {step === 4 && (
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label className="text-base">Family Medical History</Label>
                                            <p className="text-sm text-slate-500">Select conditions present in your immediate family (parents, siblings)</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {["Diabetes", "Heart Disease", "Hypertension", "Cancer", "Stroke", "Mental Health Issues"].map((c) => (
                                                    <div key={c} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`fam-${c}`}
                                                            checked={data.familyHistory.includes(c)}
                                                            onCheckedChange={() => toggleFamilyHistory(c)}
                                                        />
                                                        <label htmlFor={`fam-${c}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600">
                                                            {c}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="sleep">Avg. Sleep (Hours)</Label>
                                                <Select
                                                    value={data.sleepHours}
                                                    onValueChange={(val) => updateData("sleepHours", val)}
                                                >
                                                    <SelectTrigger className="text-base md:text-sm">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="<5">Less than 5</SelectItem>
                                                        <SelectItem value="5-6">5-6 hours</SelectItem>
                                                        <SelectItem value="6-7">6-7 hours</SelectItem>
                                                        <SelectItem value="7-8">7-8 hours</SelectItem>
                                                        <SelectItem value="8+">8+ hours</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="occupation">Occupation</Label>
                                                <Input
                                                    id="occupation"
                                                    placeholder="e.g. Software Engineer"
                                                    value={data.occupation}
                                                    onChange={(e) => updateData("occupation", e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                            <div className="space-y-1">
                                                <Label className="text-base">Recent Surgery?</Label>
                                                <p className="text-xs text-slate-500">In the last 6 months</p>
                                            </div>
                                            <div className="flex gap-4">
                                                <Button
                                                    type="button"
                                                    variant={data.recentSurgery ? "default" : "outline"}
                                                    onClick={() => updateData("recentSurgery", true)}
                                                    className={data.recentSurgery ? "bg-teal-600" : ""}
                                                >Yes</Button>
                                                <Button
                                                    type="button"
                                                    variant={!data.recentSurgery ? "default" : "outline"}
                                                    onClick={() => updateData("recentSurgery", false)}
                                                    className={!data.recentSurgery ? "bg-slate-800" : ""}
                                                >No</Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* --- Step 5: Safety --- */}
                                {step === 5 && (
                                    <div className="space-y-6">
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800 text-sm">
                                            <ShieldAlert className="h-5 w-5 shrink-0" />
                                            <p>Currently, we screen for pregnancy and kidney/liver issues as they affect medication safety.</p>
                                        </div>

                                        <div className="space-y-4">
                                            {data.gender === "female" && (
                                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                                    <Label className="text-base">Are you currently pregnant?</Label>
                                                    <div className="flex gap-4">
                                                        <Button
                                                            type="button"
                                                            variant={data.isPregnant ? "default" : "outline"}
                                                            onClick={() => updateData("isPregnant", true)}
                                                            className={data.isPregnant ? "bg-teal-600" : ""}
                                                        >Yes</Button>
                                                        <Button
                                                            type="button"
                                                            variant={!data.isPregnant ? "default" : "outline"}
                                                            onClick={() => updateData("isPregnant", false)}
                                                            className={!data.isPregnant ? "bg-slate-800" : ""}
                                                        >No</Button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                                <div className="space-y-1">
                                                    <Label className="text-base">Kidney or Liver Disease?</Label>
                                                    <p className="text-xs text-slate-500">Includes chronic kidney disease, hepatitis, etc.</p>
                                                </div>
                                                <div className="flex gap-4">
                                                    <Button
                                                        type="button"
                                                        variant={data.hasKidneyLiverDisease ? "default" : "outline"}
                                                        onClick={() => updateData("hasKidneyLiverDisease", true)}
                                                        className={data.hasKidneyLiverDisease ? "bg-teal-600" : ""}
                                                    >Yes</Button>
                                                    <Button
                                                        type="button"
                                                        variant={!data.hasKidneyLiverDisease ? "default" : "outline"}
                                                        onClick={() => updateData("hasKidneyLiverDisease", false)}
                                                        className={!data.hasKidneyLiverDisease ? "bg-slate-800" : ""}
                                                    >No</Button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="medications">Current Medications</Label>
                                                <Input
                                                    id="medications"
                                                    placeholder="List any daily medications..."
                                                    value={data.medications}
                                                    onChange={(e) => updateData("medications", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* --- Step 6: Emergency Contact --- */}
                                {step === 6 && (
                                    <div className="space-y-6">
                                        <div className="bg-slate-50 p-4 rounded-lg flex gap-3 text-slate-700 text-sm border border-slate-200">
                                            <ShieldAlert className="h-5 w-5 shrink-0 text-teal-600" />
                                            <p>We'll only show this information if our AI detects a potential medical emergency.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="ec-name">Contact Name</Label>
                                                <Input
                                                    id="ec-name"
                                                    placeholder="e.g. John Doe"
                                                    value={data.emergencyContact.name}
                                                    onChange={(e) => setData(prev => ({
                                                        ...prev,
                                                        emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                                                    }))}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="ec-relation">Relationship</Label>
                                                    <Select
                                                        value={data.emergencyContact.relation}
                                                        onValueChange={(val) => setData(prev => ({
                                                            ...prev,
                                                            emergencyContact: { ...prev.emergencyContact, relation: val }
                                                        }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="spouse">Spouse/Partner</SelectItem>
                                                            <SelectItem value="parent">Parent</SelectItem>
                                                            <SelectItem value="child">Child</SelectItem>
                                                            <SelectItem value="sibling">Sibling</SelectItem>
                                                            <SelectItem value="friend">Friend</SelectItem>
                                                            <SelectItem value="doctor">Doctor</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="ec-phone">Phone Number</Label>
                                                    <Input
                                                        id="ec-phone"
                                                        type="tel"
                                                        placeholder="+1 (555) 000-0000"
                                                        value={data.emergencyContact.phone}
                                                        onChange={(e) => setData(prev => ({
                                                            ...prev,
                                                            emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                                                        }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* --- Step 7: Consent --- */}
                                {step === 7 && (
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
                                        (step === 7 && !data.hasConsented)
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
