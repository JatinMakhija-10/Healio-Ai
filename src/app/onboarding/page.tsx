"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
    ChevronRight, ChevronLeft, ShieldAlert, CheckCircle, X, Search,
    User, HeartPulse, Pill, AlertTriangle, Users, Leaf, Loader2,
    Smile, CalendarDays, HelpCircle, Stethoscope
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

// ─── Medicine Types ───────────────────────────────────────────────────────────
type MedicineEntry = { name: string; category: "Allopathic" | "Homeopathic" | "Ayurvedic" };

const CATEGORY_COLORS: Record<string, string> = {
    Allopathic:  "bg-blue-50 text-blue-700 border-blue-200",
    Homeopathic: "bg-purple-50 text-purple-700 border-purple-200",
    Ayurvedic:   "bg-green-50 text-green-700 border-green-200",
};

const CATEGORY_DOT: Record<string, string> = {
    Allopathic:  "bg-blue-400",
    Homeopathic: "bg-purple-400",
    Ayurvedic:   "bg-green-500",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type OnboardingData = {
    // Step 1: Basic Profile
    fullName: string;
    age: string;
    gender: string;
    height: string;      // cm
    weight: string;      // kg
    occupation: string;  // sedentary | desk_job | active | highly_active
    // Step 2: Medical History
    conditions: string[];
    surgeries: string;
    hospitalizations: string;
    // Step 3: Medications
    medicationList: string[];  // selected medicine names
    selfMedication: boolean;
    // Step 4: Allergies
    drugAllergies: string[];
    foodAllergies: string[];
    // Step 5: Family History
    familyHistory: string[];
    // Step 6: Lifestyle
    smoking: string;
    alcohol: string;
    diet: string;
    exercise: string;
    sleepPattern: string;
    // Step 0: Wellness Goal
    wellnessGoal: string;
    // Step 7: Consent
    hasConsented: boolean;
};

const INITIAL_DATA: OnboardingData = {
    fullName: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    occupation: "desk_job",
    conditions: [],
    surgeries: "",
    hospitalizations: "",
    medicationList: [],
    selfMedication: false,
    drugAllergies: [],
    foodAllergies: [],
    familyHistory: [],
    smoking: "never",
    alcohol: "none",
    diet: "mixed",
    exercise: "moderate",
    sleepPattern: "7-8h",
    wellnessGoal: "",
    hasConsented: false,
};

const WELLNESS_GOALS = [
    { id: "feel_better", icon: Smile, label: "Feel better day to day", desc: "Calm, safe guidance on everyday symptoms and concerns" },
    { id: "build_routines", icon: CalendarDays, label: "Build healthy routines", desc: "Morning and evening habits, seasonal self-care" },
    { id: "understand_concern", icon: HelpCircle, label: "Understand a concern safely", desc: "Learn what symptoms could mean — without panic" },
    { id: "find_practitioner", icon: Stethoscope, label: "Find a practitioner", desc: "Navigate to the right type of professional care" },
];

const STEP_META = [
    { icon: Smile, title: "Your Wellness Goal", desc: "What brings you to Healio? This shapes everything we show you." },
    { icon: User, title: "About You", desc: "A few basics so we can personalise your experience." },
    { icon: HeartPulse, title: "Health Context", desc: "Help us give you safer, more relevant guidance." },
    { icon: Pill, title: "Current Medications", desc: "Search and select any medicines you are currently taking." },
    { icon: AlertTriangle, title: "Allergies", desc: "Critical for your safety — drug and food allergies." },
    { icon: Users, title: "Family Health History", desc: "Hereditary patterns that may affect your risk profile." },
    { icon: Leaf, title: "Lifestyle", desc: "Your day-to-day habits help us personalise recommendations." },
    { icon: ShieldAlert, title: "Consent & Privacy", desc: "How we protect your data — plain language, no jargon." },
];

// ─── Medicine Combobox (API-driven, 224k+ medicines) ─────────────────────────
function MedicineCombobox({
    selected,
    onToggle,
}: {
    selected: string[];
    onToggle: (name: string, category: string) => void;
}) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState<MedicineEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMeta, setSelectedMeta] = useState<Record<string, string>>({});
    const ref = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Debounced fetch
    const fetchMedicines = useCallback(async (q: string) => {
        if (q.length < 2) { setResults([]); return; }
        setLoading(true);
        try {
            const res = await fetch(`/api/medicines/search?q=${encodeURIComponent(q)}&limit=50`);
            const data = await res.json();
            setResults(data.results ?? []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => fetchMedicines(query), 220);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [query, fetchMedicines]);

    const groups = ["Allopathic", "Homeopathic", "Ayurvedic"] as const;

    const handleSelect = (name: string, category: string) => {
        setSelectedMeta(prev => ({ ...prev, [name]: category }));
        onToggle(name, category);
        setQuery("");
        setOpen(false);
    };

    return (
        <div className="space-y-3">
            {/* Selected chips */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selected.map((name) => {
                        const cat = selectedMeta[name] ?? "Allopathic";
                        const colorClass = CATEGORY_COLORS[cat] ?? "bg-slate-100 text-slate-700 border-slate-200";
                        const dotClass = CATEGORY_DOT[cat] ?? "bg-slate-400";
                        return (
                            <span
                                key={name}
                                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${colorClass}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
                                {name}
                                <button
                                    type="button"
                                    onClick={() => onToggle(name, cat)}
                                    className="hover:opacity-70 transition-opacity ml-0.5"
                                    aria-label={`Remove ${name}`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Search input */}
            <div ref={ref} className="relative">
                <div className="relative">
                    {loading
                        ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-500 animate-spin pointer-events-none" />
                        : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    }
                    <input
                        type="text"
                        placeholder="Search 224,000+ medicines — Allopathic, Ayurvedic, Homeopathic…"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 placeholder:text-slate-400"
                    />
                </div>

                <AnimatePresence>
                {open && query.length >= 2 && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto"
                    >
                        {results.length === 0 && !loading && (
                            <div className="px-4 py-3 text-sm text-slate-400 italic">
                                No results for &quot;{query}&quot; — try a different spelling or type it below.
                            </div>
                        )}
                        {groups.map((group) => {
                            const items = results.filter((m) => m.category === group);
                            if (items.length === 0) return null;
                            return (
                                <div key={group}>
                                    <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-slate-400 bg-slate-50 border-b border-slate-100 sticky top-0 flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[group]}`} />
                                        {group}
                                    </div>
                                    {items.map((m) => {
                                        const isSelected = selected.includes(m.name);
                                        return (
                                            <button
                                                key={m.name}
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleSelect(m.name, m.category);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                                    isSelected ? "bg-teal-50 text-teal-700" : "text-slate-700"
                                                }`}
                                            >
                                                <span>{m.name}</span>
                                                {isSelected && <CheckCircle className="h-4 w-4 text-teal-500 shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </motion.div>
                )}
                </AnimatePresence>

                {!open && query.length < 2 && (
                    <p className="text-[11px] text-slate-400 mt-1.5 px-1">
                        Type at least 2 characters to search across Allopathic, Ayurvedic &amp; Homeopathic medicines.
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Allergy Chip Input ───────────────────────────────────────────────────────
function ChipInput({
    label,
    placeholder,
    chips,
    onAdd,
    onRemove,
}: {
    label: string;
    placeholder: string;
    chips: string[];
    onAdd: (v: string) => void;
    onRemove: (v: string) => void;
}) {
    const [val, setVal] = useState("");

    const commit = () => {
        const trimmed = val.trim();
        if (trimmed && !chips.includes(trimmed)) onAdd(trimmed);
        setVal("");
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex gap-2">
                <Input
                    placeholder={placeholder}
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            commit();
                        }
                    }}
                    className="flex-1"
                />
                <Button type="button" variant="outline" onClick={commit} className="shrink-0 text-sm">
                    Add
                </Button>
            </div>
            {chips.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                    {chips.map((chip) => (
                        <span
                            key={chip}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200"
                        >
                            {chip}
                            <button
                                type="button"
                                onClick={() => onRemove(chip)}
                                className="hover:opacity-70"
                                aria-label={`Remove ${chip}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
export default function OnboardingWizard() {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
    const [saving, setSaving] = useState(false);
    const totalSteps = 8;
    const progress = (step / totalSteps) * 100;
    const router = useRouter();
    const { user, loading } = useAuth();

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1);
        else handleComplete();
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const selectGoal = (goalId: string) => {
        updateData("wellnessGoal", goalId);
        setStep(2);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData = (field: keyof OnboardingData, value: any) => {
        setData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleList = (field: "conditions" | "familyHistory", item: string) => {
        setData((prev) => {
            const list = prev[field] as string[];
            return {
                ...prev,
                [field]: list.includes(item) ? list.filter((x) => x !== item) : [...list, item],
            };
        });
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const toggleMedicine = (name: string, _category?: string) => {
        setData((prev) => ({
            ...prev,
            medicationList: prev.medicationList.includes(name)
                ? prev.medicationList.filter((m) => m !== name)
                : [...prev.medicationList, name],
        }));
    };

    const addAllergy = (type: "drugAllergies" | "foodAllergies", val: string) => {
        setData((prev) => ({ ...prev, [type]: [...prev[type], val] }));
    };
    const removeAllergy = (type: "drugAllergies" | "foodAllergies", val: string) => {
        setData((prev) => ({ ...prev, [type]: prev[type].filter((x) => x !== val) }));
    };

    const handleComplete = async () => {
        if (loading) return;
        setSaving(true);

        const medical_profile = {
            conditions: data.conditions,
            surgeries: data.surgeries,
            hospitalizations: data.hospitalizations,
            medications: data.medicationList,
            selfMedication: data.selfMedication,
            drugAllergies: data.drugAllergies,
            foodAllergies: data.foodAllergies,
            familyHistory: data.familyHistory,
            lifestyle: {
                smoking: data.smoking,
                alcohol: data.alcohol,
                diet: data.diet,
                exercise: data.exercise,
                sleepPattern: data.sleepPattern,
                occupation: data.occupation,
            },
            vitals: {
                height: data.height,
                weight: data.weight,
                gender: data.gender,
                age: data.age,
            },
            onboarding_completed: true,
        };

        const profileData = {
            full_name: data.fullName,
            age: data.age,
            gender: data.gender,
            onboarding_completed: true,
            medical_profile,
            wellness_goal: data.wellnessGoal,
        };

        // Persist to localStorage first (offline fallback)
        const storageKey = user ? `healio_pending_profile_${user.id}` : "healio_pending_profile";
        localStorage.setItem(storageKey, JSON.stringify(profileData));

        if (!user) {
            router.push("/dashboard");
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ data: profileData });
            if (error) throw error;

            const { error: dbError } = await supabase
                .from("profiles")
                .update({ full_name: data.fullName })
                .eq("id", user.id);
            if (dbError) console.error("DB sync error:", dbError);

            localStorage.removeItem(`healio_pending_profile_${user.id}`);
            await supabase.auth.refreshSession();
            router.push("/dashboard");
        } catch (err) {
            console.error("Error saving profile:", err);
            alert("Data saved locally. There was a cloud sync issue.");
            router.push("/dashboard");
        } finally {
            setSaving(false);
        }
    };

    const { icon: StepIcon, title: stepTitle, desc: stepDesc } = STEP_META[step - 1];

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center p-4 pt-8 pb-10">
            {/* Background decor */}
            <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-teal-50/60 to-transparent pointer-events-none -z-10" />

            <div className="w-full max-w-xl space-y-5">
                {/* Logo / brand */}
                <div className="text-center mb-2">
                    <span className="text-teal-600 font-bold text-lg tracking-tight">healio<span className="text-slate-400 font-light">.</span>ai</span>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                        <span>Step {step} of {totalSteps}</span>
                        <span>{Math.round(progress)}% Complete</span>
                    </div>
                    <Progress value={progress} className="h-1.5 bg-slate-100" />

                    {/* Step pills */}
                    <div className="flex gap-1.5 pt-1">
                        {STEP_META.map((s, i) => (
                            <div
                                key={i}
                                className={`flex-1 h-1 rounded-full transition-all duration-500 ${i < step ? "bg-teal-500" : i === step - 1 ? "bg-teal-300" : "bg-slate-200"}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Card */}
                <Card className="border-slate-200 shadow-xl shadow-slate-200/50 bg-white/98 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                        >
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                                        <StepIcon className="h-4.5 w-4.5 text-teal-600" style={{ width: 18, height: 18 }} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-slate-900 leading-tight">{stepTitle}</CardTitle>
                                    </div>
                                </div>
                                <CardDescription className="text-slate-500 text-sm">{stepDesc}</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">

                                {/* ── Step 1: Wellness Goal ─────────────────────── */}
                                {step === 1 && (
                                    <div className="grid grid-cols-1 gap-3">
                                        {WELLNESS_GOALS.map((goal) => {
                                            const GoalIcon = goal.icon;
                                            const selected = data.wellnessGoal === goal.id;
                                            return (
                                                <button
                                                    key={goal.id}
                                                    onClick={() => selectGoal(goal.id)}
                                                    className={`flex items-start gap-4 rounded-xl border-2 px-4 py-3.5 text-left transition-all ${
                                                        selected
                                                            ? "border-teal-500 bg-teal-50"
                                                            : "border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/40"
                                                    }`}
                                                >
                                                    <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                                                        selected ? "bg-teal-100" : "bg-slate-100"
                                                    }`}>
                                                        <GoalIcon className={`size-5 ${ selected ? "text-teal-600" : "text-slate-500" }`} />
                                                    </span>
                                                    <div>
                                                        <p className={`text-sm font-semibold ${ selected ? "text-teal-900" : "text-slate-800" }`}>{goal.label}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">{goal.desc}</p>
                                                    </div>
                                                    {selected && <CheckCircle className="ml-auto mt-1 size-5 shrink-0 text-teal-500" />}
                                                </button>
                                            );
                                        })}
                                        <p className="text-center text-xs text-slate-400 pt-1">You can change this any time in your profile.</p>
                                    </div>
                                )}

                                {/* ── Step 2: About You ──────────────────────────── */}
                                {step === 2 && (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="fullName">Full Name <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
                                            <Input
                                                id="fullName"
                                                placeholder="e.g. Arun Sharma"
                                                value={data.fullName}
                                                onChange={(e) => updateData("fullName", e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="age">Age</Label>
                                                <Input
                                                    id="age"
                                                    type="number"
                                                    placeholder="e.g. 32"
                                                    min={1}
                                                    max={120}
                                                    value={data.age}
                                                    onChange={(e) => updateData("age", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>Gender</Label>
                                                <Select value={data.gender} onValueChange={(v) => updateData("gender", v)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="other">Other / Prefer not to say</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="height">Height (cm)</Label>
                                                <Input
                                                    id="height"
                                                    type="number"
                                                    placeholder="e.g. 170"
                                                    value={data.height}
                                                    onChange={(e) => updateData("height", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="weight">Weight (kg)</Label>
                                                <Input
                                                    id="weight"
                                                    type="number"
                                                    placeholder="e.g. 72"
                                                    value={data.weight}
                                                    onChange={(e) => updateData("weight", e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label>Occupation / Activity Level</Label>
                                            <Select value={data.occupation} onValueChange={(v) => updateData("occupation", v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="sedentary">Sedentary (mostly sitting)</SelectItem>
                                                    <SelectItem value="desk_job">Desk Job (light activity)</SelectItem>
                                                    <SelectItem value="active">Active (field / standing work)</SelectItem>
                                                    <SelectItem value="highly_active">Highly Active (manual / athlete)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                {/* ── Step 3: Health Context ────────────────────── */}
                                {step === 3 && (
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-700">Existing Conditions <span className="text-slate-400 font-normal text-xs">(select all that apply)</span></Label>
                                            <div className="grid grid-cols-2 gap-2.5">
                                                {[
                                                    "Diabetes Mellitus (Type 1)",
                                                    "Diabetes Mellitus (Type 2)",
                                                    "Hypertension",
                                                    "Coronary Artery Disease",
                                                    "Thyroid Disorder",
                                                    "Asthma / COPD",
                                                    "Arthritis",
                                                    "Migraine",
                                                    "Epilepsy",
                                                    "Kidney Disease",
                                                    "Liver Disease",
                                                    "Anaemia",
                                                    "PCOD / PCOS",
                                                    "Depression / Anxiety",
                                                    "Cancer (any)",
                                                    "HIV / AIDS",
                                                ].map((c) => (
                                                    <label
                                                        key={c}
                                                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${data.conditions.includes(c) ? "bg-teal-50 border-teal-300 text-teal-800" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}
                                                    >
                                                        <Checkbox
                                                            checked={data.conditions.includes(c)}
                                                            onCheckedChange={() => toggleList("conditions", c)}
                                                            className="shrink-0"
                                                        />
                                                        <span className="leading-tight">{c}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="surgeries">Previous Surgeries <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
                                            <Input
                                                id="surgeries"
                                                placeholder="e.g. Appendectomy 2019, Knee replacement 2022"
                                                value={data.surgeries}
                                                onChange={(e) => updateData("surgeries", e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="hospitalizations">Recent Hospitalisations <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
                                            <Input
                                                id="hospitalizations"
                                                placeholder="e.g. ICU admission for dengue fever, Jan 2024"
                                                value={data.hospitalizations}
                                                onChange={(e) => updateData("hospitalizations", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* ── Step 4: Medications ────────────────────────── */}
                                {step === 4 && (
                                    <div className="space-y-5">
                                        <MedicineCombobox selected={data.medicationList} onToggle={toggleMedicine} />

                                        {data.medicationList.length === 0 && (
                                            <p className="text-xs text-slate-400 text-center py-2">
                                                No medicines selected yet. Start typing to search.
                                            </p>
                                        )}

                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-semibold text-slate-700">Other medicine not in list <span className="text-slate-400 font-normal text-xs">(optional — free text)</span></Label>
                                            <Input
                                                placeholder="e.g. Patanjali Giloy Ghanvati, some local formulation…"
                                                onBlur={(e) => {
                                                    const val = e.target.value.trim();
                                                    if (val && !data.medicationList.includes(val)) {
                                                        updateData("medicationList", [...data.medicationList, val]);
                                                        e.target.value = "";
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        const input = e.target as HTMLInputElement;
                                                        const val = input.value.trim();
                                                        if (val && !data.medicationList.includes(val)) {
                                                            updateData("medicationList", [...data.medicationList, val]);
                                                            input.value = "";
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>

                                        <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${data.selfMedication ? "bg-amber-50 border-amber-300" : "bg-slate-50 border-slate-200"}`}>
                                            <Checkbox
                                                checked={data.selfMedication}
                                                onCheckedChange={(c) => updateData("selfMedication", c === true)}
                                                className="mt-0.5 shrink-0"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-slate-800">I regularly self-medicate</span>
                                                <p className="text-xs text-slate-500 mt-0.5">I take OTC medicines, supplements or home remedies on my own without prescription.</p>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {/* ── Step 5: Allergies ─────────────────────────── */}
                                {step === 5 && (
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                            <p className="text-xs text-red-700 leading-relaxed">
                                                Allergy information is critical for safe diagnosis and prescription. Please be as specific as possible.
                                            </p>
                                        </div>

                                        <ChipInput
                                            label="Drug / Medicine Allergies"
                                            placeholder="e.g. Penicillin, Sulfa drugs, Aspirin…"
                                            chips={data.drugAllergies}
                                            onAdd={(v) => addAllergy("drugAllergies", v)}
                                            onRemove={(v) => removeAllergy("drugAllergies", v)}
                                        />

                                        <ChipInput
                                            label="Food Allergies"
                                            placeholder="e.g. Peanuts, Shellfish, Dairy, Gluten…"
                                            chips={data.foodAllergies}
                                            onAdd={(v) => addAllergy("foodAllergies", v)}
                                            onRemove={(v) => removeAllergy("foodAllergies", v)}
                                        />

                                        {data.drugAllergies.length === 0 && data.foodAllergies.length === 0 && (
                                            <p className="text-xs text-slate-400 text-center pt-1">
                                                Leave blank if you have no known allergies.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* ── Step 6: Family Health History ──────────────── */}
                                {step === 6 && (
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold text-slate-700">Conditions in close family <span className="text-slate-400 font-normal text-xs">(parents, siblings, grandparents)</span></Label>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {[
                                                "Heart Disease",
                                                "Diabetes (Type 2)",
                                                "Stroke",
                                                "Hypertension",
                                                "Cancer (any)",
                                                "Thyroid Disease",
                                                "Kidney Disease",
                                                "Mental Illness",
                                                "Alzheimer's / Dementia",
                                                "Asthma / Allergies",
                                                "Obesity",
                                                "Osteoporosis",
                                            ].map((c) => (
                                                <label
                                                    key={c}
                                                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${data.familyHistory.includes(c) ? "bg-indigo-50 border-indigo-300 text-indigo-800" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}
                                                >
                                                    <Checkbox
                                                        checked={data.familyHistory.includes(c)}
                                                        onCheckedChange={() => toggleList("familyHistory", c)}
                                                        className="shrink-0"
                                                    />
                                                    <span className="leading-tight">{c}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-400 pt-1">
                                            Don&apos;t worry if you&apos;re unsure — you can update this later.
                                        </p>
                                    </div>
                                )}

                                {/* ── Step 7: Lifestyle ─────────────────────────── */}
                                {step === 7 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label>Smoking</Label>
                                                <Select value={data.smoking} onValueChange={(v) => updateData("smoking", v)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="never">Never smoked</SelectItem>
                                                        <SelectItem value="former">Former smoker</SelectItem>
                                                        <SelectItem value="occasional">Occasional smoker</SelectItem>
                                                        <SelectItem value="current">Current smoker</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>Alcohol</Label>
                                                <Select value={data.alcohol} onValueChange={(v) => updateData("alcohol", v)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        <SelectItem value="rare">Rarely (social)</SelectItem>
                                                        <SelectItem value="occasional">Occasionally (weekly)</SelectItem>
                                                        <SelectItem value="frequent">Frequently (daily)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label>Diet Type</Label>
                                                <Select value={data.diet} onValueChange={(v) => updateData("diet", v)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                                                        <SelectItem value="vegan">Vegan</SelectItem>
                                                        <SelectItem value="non_veg">Non-Vegetarian</SelectItem>
                                                        <SelectItem value="mixed">Mixed / Flexitarian</SelectItem>
                                                        <SelectItem value="jain">Jain</SelectItem>
                                                        <SelectItem value="keto">Keto / Low-carb</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>Exercise Frequency</Label>
                                                <Select value={data.exercise} onValueChange={(v) => updateData("exercise", v)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        <SelectItem value="light">Light (1–2×/week)</SelectItem>
                                                        <SelectItem value="moderate">Moderate (3–4×/week)</SelectItem>
                                                        <SelectItem value="active">Active (5–6×/week)</SelectItem>
                                                        <SelectItem value="athlete">Athlete (daily)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label>Sleep Pattern (average per night)</Label>
                                            <Select value={data.sleepPattern} onValueChange={(v) => updateData("sleepPattern", v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="<5h">Less than 5 hours</SelectItem>
                                                    <SelectItem value="5-6h">5 – 6 hours</SelectItem>
                                                    <SelectItem value="7-8h">7 – 8 hours (recommended)</SelectItem>
                                                    <SelectItem value=">8h">More than 8 hours</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                {/* ── Step 8: Consent & Privacy ─────────────────── */}
                                {step === 8 && (
                                    <div className="space-y-3">

                                        {/* Compact header */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                                                <ShieldAlert className="h-5 w-5 text-teal-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-base leading-tight">Your Health, Your Data</h3>
                                                <p className="text-xs text-slate-500">Review how we protect and use your information.</p>
                                            </div>
                                        </div>

                                        {/* Medical disclaimer — most prominent */}
                                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
                                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-semibold text-amber-800 mb-0.5">Medical Disclaimer</p>
                                                <p className="text-xs text-amber-700 leading-relaxed">
                                                    Healio.AI is <strong>not a licensed medical practitioner</strong>. Information provided is for educational purposes only and does <strong>not constitute medical advice, diagnosis, or treatment</strong>. Always consult a qualified doctor before making health decisions. In a medical emergency, call <strong>112</strong> (India).
                                                </p>
                                            </div>
                                        </div>

                                        {/* Privacy points — compact 3-column grid */}
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { title: "End-to-End Encrypted", desc: "At rest & in transit" },
                                                { title: "You Control Your Data", desc: "Delete anytime, permanently" },
                                                { title: "Never Sold", desc: "We never sell your health data" },
                                            ].map((item, i) => (
                                                <div key={i} className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                                                    <CheckCircle className="h-3.5 w-3.5 text-teal-500" />
                                                    <p className="text-xs font-semibold text-slate-700 leading-tight">{item.title}</p>
                                                    <p className="text-[11px] text-slate-400 leading-tight">{item.desc}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Data usage */}
                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <p className="text-xs font-semibold text-slate-700 mb-1.5">How we use your data</p>
                                            <ul className="text-xs text-slate-500 space-y-1 leading-relaxed">
                                                <li className="flex items-start gap-1.5"><span className="text-teal-500 mt-0.5">•</span> Personalise AI-generated health suggestions for you</li>
                                                <li className="flex items-start gap-1.5"><span className="text-teal-500 mt-0.5">•</span> Flag drug interactions and allergy conflicts before suggesting remedies</li>
                                                <li className="flex items-start gap-1.5"><span className="text-teal-500 mt-0.5">•</span> Stored encrypted in Supabase (SOC 2 compliant infrastructure)</li>
                                                <li className="flex items-start gap-1.5"><span className="text-teal-500 mt-0.5">•</span> Retained for 2 years or until you delete your account — whichever is sooner</li>
                                            </ul>
                                        </div>

                                        {/* AI limitations */}
                                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                                            <p className="text-xs font-semibold text-blue-800 mb-1">AI Limitations & Scope</p>
                                            <p className="text-xs text-blue-700 leading-relaxed">
                                                Responses are generated by AI and may occasionally be inaccurate or incomplete. Healio.AI does not replace clinical examination, laboratory tests, imaging, or specialist consultation. The platform is intended for general wellness guidance only and is not suitable for diagnosing serious, chronic, or emergency conditions.
                                            </p>
                                        </div>

                                        {/* Consent checkbox — full legal text */}
                                        <div className={`p-3.5 rounded-xl border transition-all ${data.hasConsented ? "bg-teal-50 border-teal-300" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    id="consent"
                                                    checked={data.hasConsented}
                                                    onCheckedChange={(c) => setData((p) => ({ ...p, hasConsented: c === true }))}
                                                    className="mt-0.5 border-teal-200 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                                                />
                                                <div className="space-y-1">
                                                    <Label htmlFor="consent" className="text-sm font-semibold text-slate-800 cursor-pointer leading-tight">
                                                        I understand and agree
                                                    </Label>
                                                    <p className="text-xs text-slate-500 leading-relaxed">
                                                        I confirm I am at least <strong>18 years old</strong>, have read the{" "}
                                                        <a href="/terms" className="underline text-teal-700 hover:text-teal-800">Terms of Service</a> and{" "}
                                                        <a href="/privacy" className="underline text-teal-700 hover:text-teal-800">Privacy Policy</a>,
                                                        acknowledge that Healio.AI is <strong>not a substitute for professional medical advice</strong>,
                                                        and consent to my health data being processed as described above.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                )}

                            </CardContent>

                            {/* Footer nav */}
                            <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex justify-between items-center bg-white">
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    disabled={step <= 1}
                                    className="text-slate-500 border-slate-200 hover:bg-slate-50"
                                >
                                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                                </Button>

                                <Button
                                    onClick={handleNext}
                                    disabled={(step === 8 && !data.hasConsented) || (step === 1 && !data.wellnessGoal) || saving}
                                    className={`min-w-[150px] transition-all ${step === totalSteps
                                        ? "bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg shadow-teal-600/20 border-0"
                                        : "bg-slate-900 hover:bg-slate-800 text-white"}`}
                                >
                                    {step === totalSteps
                                        ? (saving ? "Saving…" : "Complete & Start Dashboard")
                                        : (<>Next <ChevronRight className="ml-1 h-4 w-4" /></>)}
                                </Button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </Card>

                {/* Skip (for returning users who accidentally landed here) */}
                <p className="text-center text-xs text-slate-400">
                    Already done this?{" "}
                    <button onClick={() => router.push("/dashboard")} className="underline hover:text-slate-600 transition-colors">
                        Go to Dashboard
                    </button>
                </p>
            </div>
        </div>
    );
}
