"use client";

import { useState, useRef, useEffect } from "react";
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
    User, HeartPulse, Pill, AlertTriangle, Users, Leaf
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

// ─── Medicine List ────────────────────────────────────────────────────────────
type MedicineEntry = { name: string; category: "Allopathic" | "Homeopathic" | "Ayurvedic" };

const MEDICINES_LIST: MedicineEntry[] = [
    // --- Allopathic: Diabetes ---
    { name: "Metformin", category: "Allopathic" },
    { name: "Insulin (Regular)", category: "Allopathic" },
    { name: "Insulin (NPH)", category: "Allopathic" },
    { name: "Glipizide", category: "Allopathic" },
    { name: "Glyburide", category: "Allopathic" },
    { name: "Glimepiride", category: "Allopathic" },
    { name: "Sitagliptin (Januvia)", category: "Allopathic" },
    { name: "Empagliflozin (Jardiance)", category: "Allopathic" },
    { name: "Dapagliflozin (Farxiga)", category: "Allopathic" },
    { name: "Liraglutide (Victoza)", category: "Allopathic" },
    { name: "Pioglitazone", category: "Allopathic" },
    // --- Allopathic: Hypertension ---
    { name: "Amlodipine", category: "Allopathic" },
    { name: "Losartan", category: "Allopathic" },
    { name: "Telmisartan", category: "Allopathic" },
    { name: "Lisinopril", category: "Allopathic" },
    { name: "Enalapril", category: "Allopathic" },
    { name: "Atenolol", category: "Allopathic" },
    { name: "Metoprolol", category: "Allopathic" },
    { name: "Carvedilol", category: "Allopathic" },
    { name: "Ramipril", category: "Allopathic" },
    { name: "Hydrochlorothiazide", category: "Allopathic" },
    { name: "Furosemide", category: "Allopathic" },
    { name: "Spironolactone", category: "Allopathic" },
    // --- Allopathic: Cholesterol ---
    { name: "Atorvastatin", category: "Allopathic" },
    { name: "Rosuvastatin", category: "Allopathic" },
    { name: "Simvastatin", category: "Allopathic" },
    { name: "Ezetimibe", category: "Allopathic" },
    // --- Allopathic: Pain / Anti-inflammatory ---
    { name: "Paracetamol (Acetaminophen)", category: "Allopathic" },
    { name: "Ibuprofen", category: "Allopathic" },
    { name: "Diclofenac", category: "Allopathic" },
    { name: "Naproxen", category: "Allopathic" },
    { name: "Aspirin", category: "Allopathic" },
    { name: "Celecoxib", category: "Allopathic" },
    { name: "Tramadol", category: "Allopathic" },
    { name: "Morphine", category: "Allopathic" },
    { name: "Ketorolac", category: "Allopathic" },
    // --- Allopathic: Antibiotics ---
    { name: "Amoxicillin", category: "Allopathic" },
    { name: "Amoxicillin-Clavulanate (Augmentin)", category: "Allopathic" },
    { name: "Azithromycin", category: "Allopathic" },
    { name: "Ciprofloxacin", category: "Allopathic" },
    { name: "Levofloxacin", category: "Allopathic" },
    { name: "Doxycycline", category: "Allopathic" },
    { name: "Metronidazole", category: "Allopathic" },
    { name: "Cefixime", category: "Allopathic" },
    { name: "Cefuroxime", category: "Allopathic" },
    { name: "Clindamycin", category: "Allopathic" },
    { name: "Trimethoprim-Sulfamethoxazole", category: "Allopathic" },
    { name: "Nitrofurantoin", category: "Allopathic" },
    // --- Allopathic: Thyroid ---
    { name: "Levothyroxine", category: "Allopathic" },
    { name: "Carbimazole", category: "Allopathic" },
    { name: "Methimazole", category: "Allopathic" },
    { name: "Propylthiouracil", category: "Allopathic" },
    // --- Allopathic: Respiratory ---
    { name: "Salbutamol (Albuterol)", category: "Allopathic" },
    { name: "Montelukast", category: "Allopathic" },
    { name: "Budesonide inhaler", category: "Allopathic" },
    { name: "Fluticasone inhaler", category: "Allopathic" },
    { name: "Tiotropium", category: "Allopathic" },
    { name: "Salmeterol", category: "Allopathic" },
    { name: "Theophylline", category: "Allopathic" },
    // --- Allopathic: Gastro ---
    { name: "Omeprazole", category: "Allopathic" },
    { name: "Pantoprazole", category: "Allopathic" },
    { name: "Rabeprazole", category: "Allopathic" },
    { name: "Ranitidine", category: "Allopathic" },
    { name: "Domperidone", category: "Allopathic" },
    { name: "Ondansetron", category: "Allopathic" },
    { name: "Loperamide", category: "Allopathic" },
    { name: "Lactulose", category: "Allopathic" },
    { name: "Bisacodyl", category: "Allopathic" },
    // --- Allopathic: Mental health ---
    { name: "Sertraline", category: "Allopathic" },
    { name: "Fluoxetine", category: "Allopathic" },
    { name: "Escitalopram", category: "Allopathic" },
    { name: "Clonazepam", category: "Allopathic" },
    { name: "Alprazolam", category: "Allopathic" },
    { name: "Diazepam", category: "Allopathic" },
    { name: "Olanzapine", category: "Allopathic" },
    { name: "Risperidone", category: "Allopathic" },
    { name: "Quetiapine", category: "Allopathic" },
    { name: "Lithium", category: "Allopathic" },
    { name: "Bupropion", category: "Allopathic" },
    { name: "Venlafaxine", category: "Allopathic" },
    // --- Allopathic: Vitamins / Supplements ---
    { name: "Vitamin D3", category: "Allopathic" },
    { name: "Vitamin B12 (Methylcobalamin)", category: "Allopathic" },
    { name: "Ferrous Sulfate (Iron)", category: "Allopathic" },
    { name: "Folic Acid", category: "Allopathic" },
    { name: "Calcium Carbonate", category: "Allopathic" },
    { name: "Zinc Sulfate", category: "Allopathic" },
    { name: "Magnesium", category: "Allopathic" },
    { name: "Omega-3 Fish Oil", category: "Allopathic" },
    // --- Allopathic: Antihistamines ---
    { name: "Cetirizine", category: "Allopathic" },
    { name: "Loratadine", category: "Allopathic" },
    { name: "Fexofenadine", category: "Allopathic" },
    { name: "Diphenhydramine", category: "Allopathic" },
    { name: "Chlorpheniramine", category: "Allopathic" },
    // --- Allopathic: Anti-malarial / Anti-parasite ---
    { name: "Hydroxychloroquine", category: "Allopathic" },
    { name: "Chloroquine", category: "Allopathic" },
    { name: "Albendazole", category: "Allopathic" },
    { name: "Mebendazole", category: "Allopathic" },
    // --- Allopathic: Dermatology ---
    { name: "Tretinoin", category: "Allopathic" },
    { name: "Betamethasone cream", category: "Allopathic" },
    { name: "Clotrimazole", category: "Allopathic" },
    { name: "Terbinafine", category: "Allopathic" },
    { name: "Doxycycline (acne)", category: "Allopathic" },
    // --- Allopathic: Cardiac ---
    { name: "Clopidogrel", category: "Allopathic" },
    { name: "Warfarin", category: "Allopathic" },
    { name: "Digoxin", category: "Allopathic" },
    { name: "Nitroglycerin", category: "Allopathic" },
    { name: "Amiodarone", category: "Allopathic" },
    { name: "Isosorbide Mononitrate", category: "Allopathic" },
    // --- Allopathic: Urology ---
    { name: "Tamsulosin", category: "Allopathic" },
    { name: "Sildenafil", category: "Allopathic" },
    { name: "Finasteride", category: "Allopathic" },
    // --- Homeopathic ---
    { name: "Arnica Montana 30C", category: "Homeopathic" },
    { name: "Belladonna 30C", category: "Homeopathic" },
    { name: "Nux Vomica 30C", category: "Homeopathic" },
    { name: "Rhus Tox 30C", category: "Homeopathic" },
    { name: "Bryonia 30C", category: "Homeopathic" },
    { name: "Pulsatilla 30C", category: "Homeopathic" },
    { name: "Sulphur 30C", category: "Homeopathic" },
    { name: "Calcarea Carbonica 30C", category: "Homeopathic" },
    { name: "Lycopodium 30C", category: "Homeopathic" },
    { name: "Phosphorus 30C", category: "Homeopathic" },
    { name: "Natrum Muriaticum 30C", category: "Homeopathic" },
    { name: "Sepia 30C", category: "Homeopathic" },
    { name: "Ignatia Amara 30C", category: "Homeopathic" },
    { name: "Gelsemium 30C", category: "Homeopathic" },
    { name: "Arsenicum Album 30C", category: "Homeopathic" },
    { name: "Aconite 30C", category: "Homeopathic" },
    { name: "Mercurius Solubilis 30C", category: "Homeopathic" },
    { name: "Hepar Sulph 30C", category: "Homeopathic" },
    { name: "Silicea 30C", category: "Homeopathic" },
    { name: "Thuja Occidentalis 30C", category: "Homeopathic" },
    { name: "Allium Cepa 30C", category: "Homeopathic" },
    { name: "Apis Mellifica 30C", category: "Homeopathic" },
    { name: "Cantharis 30C", category: "Homeopathic" },
    { name: "Colocynthis 30C", category: "Homeopathic" },
    { name: "Drosera 30C", category: "Homeopathic" },
    { name: "Ferrum Phosphoricum 30C", category: "Homeopathic" },
    { name: "Hamamelis 30C", category: "Homeopathic" },
    { name: "Hypericum Perforatum 30C", category: "Homeopathic" },
    { name: "Kali Bichromicum 30C", category: "Homeopathic" },
    { name: "Lachesis 30C", category: "Homeopathic" },
    { name: "Ledum Palustre 30C", category: "Homeopathic" },
    { name: "Ruta Graveolens 30C", category: "Homeopathic" },
    { name: "Spongia Tosta 30C", category: "Homeopathic" },
    { name: "Staphysagria 30C", category: "Homeopathic" },
    { name: "Veratrum Album 30C", category: "Homeopathic" },
    { name: "Zincum Metallicum 30C", category: "Homeopathic" },
    // --- Ayurvedic ---
    { name: "Ashwagandha (Withania somnifera)", category: "Ayurvedic" },
    { name: "Triphala Churna", category: "Ayurvedic" },
    { name: "Chyawanprash", category: "Ayurvedic" },
    { name: "Brahmi (Bacopa monnieri)", category: "Ayurvedic" },
    { name: "Tulsi (Holy Basil) extract", category: "Ayurvedic" },
    { name: "Turmeric (Curcumin)", category: "Ayurvedic" },
    { name: "Shilajit", category: "Ayurvedic" },
    { name: "Guduchi (Tinospora cordifolia)", category: "Ayurvedic" },
    { name: "Neem (Azadirachta indica)", category: "Ayurvedic" },
    { name: "Amla (Emblica officinalis)", category: "Ayurvedic" },
    { name: "Shatavari (Asparagus racemosus)", category: "Ayurvedic" },
    { name: "Haritaki", category: "Ayurvedic" },
    { name: "Vibhitaki", category: "Ayurvedic" },
    { name: "Gokshura (Tribulus terrestris)", category: "Ayurvedic" },
    { name: "Kapikacchu (Mucuna pruriens)", category: "Ayurvedic" },
    { name: "Punarnava (Boerhavia diffusa)", category: "Ayurvedic" },
    { name: "Manjistha (Rubia cordifolia)", category: "Ayurvedic" },
    { name: "Dashamoola", category: "Ayurvedic" },
    { name: "Trikatu Churna", category: "Ayurvedic" },
    { name: "Hingvastak Churna", category: "Ayurvedic" },
    { name: "Arjuna (Terminalia arjuna)", category: "Ayurvedic" },
    { name: "Karela (Bitter Gourd) Juice", category: "Ayurvedic" },
    { name: "Jamun Seed Powder", category: "Ayurvedic" },
    { name: "Moringa (Drumstick leaf)", category: "Ayurvedic" },
    { name: "Licorice (Mulethi)", category: "Ayurvedic" },
    { name: "Vacha (Acorus calamus)", category: "Ayurvedic" },
    { name: "Shankhpushpi", category: "Ayurvedic" },
    { name: "Jatamansi", category: "Ayurvedic" },
    { name: "Pippali (Long Pepper)", category: "Ayurvedic" },
    { name: "Pushkarmool", category: "Ayurvedic" },
    { name: "Bhumyamalaki", category: "Ayurvedic" },
    { name: "Kutki (Picrorhiza kurroa)", category: "Ayurvedic" },
    { name: "Vidanga (Embelia ribes)", category: "Ayurvedic" },
    { name: "Chitrak (Plumbago zeylanica)", category: "Ayurvedic" },
];

const CATEGORY_COLORS: Record<string, string> = {
    Allopathic: "bg-blue-50 text-blue-700 border-blue-200",
    Homeopathic: "bg-purple-50 text-purple-700 border-purple-200",
    Ayurvedic: "bg-green-50 text-green-700 border-green-200",
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
    hasConsented: false,
};

const STEP_META = [
    { icon: User, title: "Basic Profile", desc: "Tell us about yourself so we can personalise your care." },
    { icon: HeartPulse, title: "Medical History", desc: "Help us understand your health background." },
    { icon: Pill, title: "Current Medications", desc: "Search and select any medicines you are currently taking." },
    { icon: AlertTriangle, title: "Allergies", desc: "Critical for safe prescriptions — drug and food allergies." },
    { icon: Users, title: "Family History", desc: "Hereditary conditions that may affect your risk profile." },
    { icon: Leaf, title: "Lifestyle", desc: "Your day-to-day habits help us personalise recommendations." },
    { icon: ShieldAlert, title: "Consent & Privacy", desc: "Review how we handle your data." },
];

// ─── Medicine Combobox ────────────────────────────────────────────────────────
function MedicineCombobox({
    selected,
    onToggle,
}: {
    selected: string[];
    onToggle: (name: string) => void;
}) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered = query.length < 1
        ? []
        : MEDICINES_LIST.filter((m) =>
            m.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 30);

    const groups = ["Allopathic", "Homeopathic", "Ayurvedic"] as const;

    return (
        <div className="space-y-3">
            {/* Selected chips */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selected.map((name) => {
                        const entry = MEDICINES_LIST.find((m) => m.name === name);
                        const colorClass = entry ? CATEGORY_COLORS[entry.category] : "bg-slate-100 text-slate-700 border-slate-200";
                        return (
                            <span
                                key={name}
                                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${colorClass}`}
                            >
                                {name}
                                <button
                                    type="button"
                                    onClick={() => onToggle(name)}
                                    className="hover:opacity-70 transition-opacity"
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search medicines (e.g. Metformin, Arnica, Ashwagandha…)"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 placeholder:text-slate-400"
                    />
                </div>

                {/* Dropdown */}
                {open && filtered.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                        {groups.map((group) => {
                            const items = filtered.filter((m) => m.category === group);
                            if (items.length === 0) return null;
                            return (
                                <div key={group}>
                                    <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-slate-400 bg-slate-50 border-b border-slate-100 sticky top-0">
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
                                                    onToggle(m.name);
                                                    setQuery("");
                                                    setOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${isSelected ? "bg-teal-50 text-teal-700" : "text-slate-700"}`}
                                            >
                                                <span>{m.name}</span>
                                                {isSelected && <CheckCircle className="h-4 w-4 text-teal-500 shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                )}

                {open && query.length >= 1 && filtered.length === 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm text-slate-500">
                        No medicines found for &quot;{query}&quot;. You can type the name in the free-text box below.
                    </div>
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
    const totalSteps = 7;
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

    const toggleMedicine = (name: string) => {
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
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-4 py-12">
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

                            <CardContent className="space-y-5 min-h-[280px]">

                                {/* ── Step 1: Basic Profile ──────────────────────── */}
                                {step === 1 && (
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

                                {/* ── Step 2: Medical History ────────────────────── */}
                                {step === 2 && (
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

                                {/* ── Step 3: Medications ────────────────────────── */}
                                {step === 3 && (
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

                                {/* ── Step 4: Allergies ─────────────────────────── */}
                                {step === 4 && (
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

                                {/* ── Step 5: Family History ─────────────────────── */}
                                {step === 5 && (
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

                                {/* ── Step 6: Lifestyle ─────────────────────────── */}
                                {step === 6 && (
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

                                {/* ── Step 7: Consent ───────────────────────────── */}
                                {step === 7 && (
                                    <div className="space-y-6 text-center py-2">
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
                                                { title: "Private by Design", desc: "We never sell your personal health data." },
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
                                                    onCheckedChange={(c) => setData((p) => ({ ...p, hasConsented: c === true }))}
                                                    className="mt-1 border-teal-200 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <Label htmlFor="consent" className="text-sm font-semibold text-slate-800 cursor-pointer">
                                                        I agree to the Terms of Service
                                                    </Label>
                                                    <p className="text-xs text-slate-500 leading-snug">
                                                        I confirm that I am at least 18 years old and acknowledge the{" "}
                                                        <a href="#" className="underline text-teal-700 hover:text-teal-800">Privacy Policy</a>.
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
                                    disabled={step === 1}
                                    className="text-slate-500 border-slate-200 hover:bg-slate-50"
                                >
                                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                                </Button>

                                <Button
                                    onClick={handleNext}
                                    disabled={(step === 7 && !data.hasConsented) || saving}
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
