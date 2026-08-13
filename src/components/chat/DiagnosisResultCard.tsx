"use client";

import { useState, useEffect, useId } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Condition, ReasoningTraceEntry, UserSymptomData } from "@/lib/diagnosis/types";
import type { UserProfileSummary, SymptomDetailsSummary } from "./MedicalReportPDF";
import type { FlaggedRemedy } from "@/lib/diagnosis/ddi";
import {
    Video,
    Shield,
    Activity,
    AlertTriangle,
    Share2,
    FileText,
    Loader2,
    Lock,
    Dumbbell,
    Clock,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    Circle,
    Calculator,
    Pill,
    FlaskConical,
    Info,
    House,
    Leaf,
    ExternalLink,
    AlertCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { UncertaintyEstimate, RuleResult } from "@/lib/diagnosis/advanced";
import { Button } from "@/components/ui/button";
import { pdf } from '@react-pdf/renderer';
import { MedicalReportDocument, MedicalReportPreviewDocument } from "./MedicalReportPDF";
// PHASE 2 — Doctor Booking
// import { DoctorSelectionModal } from "@/components/booking/DoctorSelectionModal";
import { getSubscriptionStatus } from "@/lib/stripe/mockClient";
import { PlanSelectionModal } from "@/components/subscription/PlanSelectionModal";
import { useAuth } from "@/context/AuthContext";
import { hasFeature } from "@/lib/subscription/plans";
import { EmergencyRedirect } from "./EmergencyRedirect";

type DifferentialDiagnosis = {
    name?: string;
    likelihood?: string;
    rationale?: string;
    probability?: number;
    confidence?: number;
};

type ExplainableCondition = Condition & {
    confidence?: number;
    bayesianFactors?: string;
    differentialDiagnoses?: DifferentialDiagnosis[];
    care_plan?: string;
    rationale?: string;
};

type FlexibleRemedy = {
    name?: string;
    remedy?: string;
    description?: string;
    indication?: string;
    method?: string;
    preparation?: string;
    dosage?: string;
    potency?: string;
    source?: string;
    ingredients?: string[];
    videoUrl?: string;
};

type CareTabId = "home" | "ayurveda" | "homeopathy" | "safety";

function getConfidenceBand(score: number) {
    if (score >= 90) return "High";
    if (score >= 70) return "Moderate-high";
    if (score >= 55) return "Moderate";
    return "Low";
}

function getUserFacingConfidenceLabel(score: number) {
    if (score < 50) return "Preliminary";
    if (score < 70) return "Moderate";
    if (score < 85) return "Good match";
    return "High confidence";
}

function getConfidenceTone(score: number) {
    if (score < 50) return {
        badge: "border-slate-200 bg-slate-100 text-slate-700",
        fill: "bg-slate-400",
        text: "text-slate-700",
    };
    if (score < 70) return {
        badge: "border-amber-200 bg-amber-50 text-amber-800",
        fill: "bg-amber-500",
        text: "text-amber-800",
    };
    if (score < 85) return {
        badge: "border-teal-200 bg-teal-50 text-teal-700",
        fill: "bg-teal-600",
        text: "text-teal-800",
    };
    return {
        badge: "border-green-200 bg-green-50 text-green-700",
        fill: "bg-green-600",
        text: "text-green-800",
    };
}

function getImpactLabel(impact: number) {
    const absImpact = Math.abs(impact);
    if (absImpact > 3) return "Very strong";
    if (absImpact > 2) return "Strong";
    if (absImpact > 1) return "Moderate";
    return "Minor";
}

function getSourceHref(source: unknown) {
    const normalized = String(source ?? "").toLowerCase();
    if (!normalized) return null;
    if (normalized.includes("boericke")) return "https://www.homeoint.org/books/boericmm/";
    if (normalized.includes("ccras")) return "https://www.ccras.nic.in/";
    if (normalized.includes("planet ayurveda")) return "https://www.planetayurveda.com/";
    return null;
}

function getLikelihoodLabel(score: number, primary = false) {
    if (primary) return "Primary";
    if (score >= 60) return "High";
    if (score >= 35) return "Medium";
    return "Low";
}

function inferDifferentialProbability(item: DifferentialDiagnosis, index: number) {
    const directScore = item.probability ?? item.confidence;
    if (typeof directScore === "number" && Number.isFinite(directScore)) {
        return Math.max(5, Math.min(95, Math.round(directScore)));
    }

    const likelihood = String(item.likelihood ?? "").toLowerCase();
    if (likelihood.includes("high")) return Math.max(50, 62 - index * 6);
    if (likelihood.includes("moderate") || likelihood.includes("medium")) return Math.max(32, 44 - index * 5);
    if (likelihood.includes("low")) return Math.max(14, 28 - index * 4);
    return Math.max(12, 36 - index * 6);
}

function DifferentialRow({
    name,
    probability,
    label,
    primary = false,
}: {
    name: string;
    probability: number;
    label: string;
    primary?: boolean;
}) {
    const barColor = probability >= 60
        ? "bg-blue-500"
        : probability >= 35
            ? "bg-amber-500"
            : "bg-amber-300";

    return (
        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(64px,0.9fr)_38px_58px] items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs sm:grid-cols-[minmax(0,1.4fr)_minmax(120px,1fr)_42px_72px]">
            <span className="min-w-0 truncate font-medium text-slate-800" title={name}>{name}</span>
            <div
                className="h-2 overflow-hidden rounded-full bg-slate-100"
                role="img"
                aria-label={`${name} likelihood ${probability}%`}
            >
                <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${Math.max(5, Math.min(100, probability))}%` }}
                />
            </div>
            <span className="text-right font-semibold text-slate-700">
                {primary || probability >= 50 ? `${probability}%` : "<50%"}
            </span>
            <Badge
                variant="outline"
                className={`justify-center text-[10px] ${primary
                    ? "border-teal-200 bg-teal-50 text-teal-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
            >
                {label}
            </Badge>
        </div>
    );
}

function RemedyCard({
    remedy,
    kind,
    tone,
}: {
    remedy: FlexibleRemedy;
    kind?: "home" | "ayurveda" | "homeopathy";
    tone?: "amber" | "green" | "teal" | "red";
}) {
    const resolvedKind = kind ?? (tone === "green" ? "ayurveda" : tone === "teal" ? "homeopathy" : "home");
    const tradition = {
        home: {
            Icon: House,
            label: "Simple home care",
            className: "border-[#B8DED0] bg-[#F1FBF6] text-[var(--healio-wellness-charcoal)]",
            accent: "text-[var(--healio-wellness-primary)]",
            source: "border-[#B8DED0] bg-white text-[var(--healio-wellness-primary)]",
            howTo: "How to use",
        },
        ayurveda: {
            Icon: Leaf,
            label: "Traditional Ayurvedic",
            className: "border-[var(--healio-evidence-established)] bg-[var(--healio-evidence-established-bg)] text-[var(--healio-wellness-charcoal)]",
            accent: "text-[var(--healio-wellness-primary-dark)]",
            source: "border-[var(--healio-evidence-established)] bg-white text-[var(--healio-wellness-primary-dark)]",
            howTo: "Preparation",
        },
        homeopathy: {
            Icon: FlaskConical,
            label: "Homeopathic - consult first",
            className: "border-[var(--healio-evidence-traditional)] bg-[var(--healio-evidence-traditional-bg)] text-[var(--healio-wellness-charcoal)]",
            accent: "text-[var(--healio-wellness-accent)]",
            source: "border-[var(--healio-evidence-traditional)] bg-white text-[var(--healio-wellness-accent)]",
            howTo: "How to take",
        },
    }[resolvedKind];
    const Icon = tradition.Icon;

    return (
        <div className={`rounded-lg border p-3 shadow-sm transition-colors hover:border-opacity-80 ${tradition.className}`}>
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-black/5 pb-2">
                <div className={`flex min-w-0 items-center gap-2 text-[11px] font-bold uppercase tracking-wide ${tradition.accent}`}>
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{tradition.label}</span>
                </div>
                {remedy.source && (() => {
                    const sourceHref = getSourceHref(remedy.source);
                    const sourceLabel = (
                        <span className={`inline-flex max-w-[160px] items-center gap-1 truncate rounded-md border px-2 py-1 text-[10px] font-bold ${tradition.source}`}>
                            Source: {remedy.source}
                            {sourceHref ? <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" /> : null}
                        </span>
                    );

                    return sourceHref ? (
                        <a href={sourceHref} target="_blank" rel="noreferrer" className="shrink-0 hover:opacity-80">
                            {sourceLabel}
                        </a>
                    ) : sourceLabel;
                })()}
            </div>

            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                    <p className="text-[15px] font-bold leading-snug text-slate-950">
                        {remedy.name || remedy.remedy || "Care step"}
                        {remedy.potency && (
                            <span className={`ml-2 rounded-full border bg-white px-2 py-0.5 text-[10px] font-bold ${tradition.source}`}>
                                {remedy.potency}
                            </span>
                        )}
                    </p>
                    {(remedy.description || remedy.indication) && (
                        <p className="text-xs leading-[1.6] text-slate-700">
                            {remedy.description || remedy.indication}
                        </p>
                    )}
                    {(remedy.method || remedy.preparation || remedy.dosage) && (
                        <p className="rounded-md border border-black/5 bg-white/70 px-2.5 py-2 text-xs leading-[1.6] text-slate-700">
                            <strong className={tradition.accent}>{tradition.howTo}:</strong>{" "}
                            {remedy.method || remedy.preparation || remedy.dosage}
                        </p>
                    )}
                    {remedy.ingredients?.length ? (
                        <p className="text-[11px] leading-[1.5] text-slate-600">
                            Ingredients: {remedy.ingredients.join(", ")}
                        </p>
                    ) : null}
                </div>
                {remedy.videoUrl && (
                    <a
                        href={remedy.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`shrink-0 rounded-full border bg-white px-2.5 py-1 text-[11px] font-bold transition-colors hover:bg-white/80 ${tradition.source}`}
                        aria-label="Open remedy video"
                    >
                        <span className="inline-flex items-center gap-1">
                            <Video size={14} />
                            Watch
                        </span>
                    </a>
                )}
            </div>
        </div>
    );
}

interface DiagnosisResultCardProps {
    condition: Condition;
    confidence: number;
    uncertainty?: UncertaintyEstimate;
    alerts?: string[];
    clinicalRules?: RuleResult[];
    showIndianRemedies?: boolean;
    showUncertaintyDetails?: boolean;
    showDetailedExplanations?: boolean;
    symptoms?: string[];
    reasoningTrace?: ReasoningTraceEntry[];
    diagnosisId?: string;
    showBookDoctor?: boolean;
    carePreferences?: string[];
    // ─── DDI Safety Layer ──────────────────────────────────────────────────────
    ddiAlerts?: string[];           // Banner alert strings from the DDI layer
    ddiFlaggedRemedies?: FlaggedRemedy[]; // Remedies with ⚠ badges
    ddiBlockedRemedies?: FlaggedRemedy[]; // Remedies shown with strikethrough
    userSymptomData?: UserSymptomData;  // Full symptom + profile data for PDF
}

// ─── Severity Badge ───────────────────────────────────────────────────────────
// WCAG 1.4.1 fix: shape-prefix icons alongside color (not color alone)
function SeverityBadge({ severity }: { severity?: string }) {
    if (!severity) return null;
    const s = severity.toLowerCase();

    if (s.includes("severe") || s.includes("critical")) {
        return (
            <Badge className="bg-red-100 text-red-800 border border-red-200 gap-1 text-[11px]">
                <AlertTriangle className="h-2.5 w-2.5" />
                Severity: {severity}
            </Badge>
        );
    }
    if (s.includes("moderate")) {
        return (
            <Badge className="bg-amber-100 text-amber-800 border border-amber-200 gap-1 text-[11px]">
                <AlertCircle className="h-2.5 w-2.5" />
                Severity: {severity}
            </Badge>
        );
    }
    if (s.includes("mild") || s.includes("benign")) {
        return (
            <Badge className="bg-green-100 text-green-800 border border-green-200 gap-1 text-[11px]">
                <Circle className="h-2.5 w-2.5 fill-green-600" />
                Severity: {severity}
            </Badge>
        );
    }
    return <Badge variant="outline" className="text-[11px]">Severity: {severity}</Badge>;
}

// ─── Accordion Section ────────────────────────────────────────────────────────
// Replaces the hidden-tab pill pattern — all content visible by default
function getRemedyDisplayName(remedy: unknown) {
    if (!remedy || typeof remedy !== "object") return "Remedy";
    const candidate = remedy as FlexibleRemedy;
    return candidate.name || candidate.remedy || "Remedy";
}

function MedicationSafetySummary({
    ddiAlerts,
    ddiFlaggedRemedies,
    ddiBlockedRemedies,
}: {
    ddiAlerts: string[];
    ddiFlaggedRemedies: FlaggedRemedy[];
    ddiBlockedRemedies: FlaggedRemedy[];
}) {
    const timingAlerts = ddiFlaggedRemedies.filter((flag) => flag.timingNote);
    const majorAlerts = ddiAlerts.filter(
        (alert) => !alert.includes("could not be verified") && !alert.includes("Trikatu")
    );
    const piperineAlert = ddiAlerts.find((alert) => alert.includes("Trikatu"));
    const unverifiedAlert = ddiAlerts.find((alert) => alert.includes("could not be verified"));
    const moderateRemedies = ddiFlaggedRemedies.filter(
        (flag) => (flag.severity === "moderate" || flag.severity === "minor") && !flag.timingNote
    );
    const itemCount =
        timingAlerts.length +
        majorAlerts.length +
        (piperineAlert ? 1 : 0) +
        (unverifiedAlert ? 1 : 0) +
        moderateRemedies.length +
        ddiBlockedRemedies.length;
    const [open, setOpen] = useState(
        majorAlerts.length > 0 || ddiBlockedRemedies.length > 0 || Boolean(piperineAlert)
    );
    const panelId = useId();

    if (itemCount === 0) return null;

    return (
        <div className="border-b border-orange-200 bg-orange-50/70">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-orange-50 sm:px-6"
                aria-expanded={open}
                aria-controls={panelId}
            >
                <span className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-orange-700 shadow-sm">
                        <Pill className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                        <span className="block text-sm font-bold text-orange-900">
                            Medication interactions found ({itemCount})
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-orange-800">
                            Review timing notes, blocked remedies, and consult-first guidance.
                        </span>
                    </span>
                </span>
                {open ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-orange-700" />
                ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-orange-700" />
                )}
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        id={panelId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-3 px-4 pb-4 sm:px-6">
                            {timingAlerts.length > 0 && (
                                <div className="rounded-lg border border-amber-200 bg-white p-3">
                                    <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-800">
                                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                        Timing interactions
                                    </h4>
                                    <ul className="space-y-1.5">
                                        {timingAlerts.map((flag, index) => (
                                            <li key={`${flag.timingNote}-${index}`} className="text-xs leading-[1.6] text-amber-800">
                                                {flag.timingNote}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {(majorAlerts.length > 0 || ddiBlockedRemedies.length > 0 || piperineAlert) && (
                                <div className="rounded-lg border border-orange-200 bg-white p-3">
                                    <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-orange-800">
                                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                                        Consult before using
                                    </h4>
                                    {ddiBlockedRemedies.length > 0 && (
                                        <p className="mb-2 text-xs leading-relaxed text-orange-800">
                                            <strong>{ddiBlockedRemedies.length} remedy/remedies</strong> may be contraindicated with your medication profile.
                                        </p>
                                    )}
                                    <ul className="space-y-1.5">
                                        {ddiBlockedRemedies.map((flag, index) => (
                                            <li key={`${getRemedyDisplayName(flag.remedy)}-${index}`} className="flex items-start gap-2 text-xs leading-[1.65] text-orange-800">
                                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden="true" />
                                                <span><strong>{getRemedyDisplayName(flag.remedy)}:</strong> {flag.reason}</span>
                                            </li>
                                        ))}
                                        {majorAlerts.map((alert, index) => (
                                            <li key={`${alert}-${index}`} className="flex items-start gap-2 text-xs leading-[1.65] text-orange-800">
                                                <Pill className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden="true" />
                                                <span>{alert}</span>
                                            </li>
                                        ))}
                                        {piperineAlert && (
                                            <li className="flex items-start gap-2 text-xs leading-[1.65] text-orange-800">
                                                <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden="true" />
                                                <span>{piperineAlert}</span>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {moderateRemedies.length > 0 && (
                                <div className="rounded-lg border border-slate-200 bg-white p-3">
                                    <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                                        <Info className="h-3.5 w-3.5" aria-hidden="true" />
                                        Moderate or minor notes
                                    </h4>
                                    <ul className="space-y-1.5">
                                        {moderateRemedies.map((flag, index) => (
                                            <li key={`${getRemedyDisplayName(flag.remedy)}-${index}`} className="text-xs leading-[1.65] text-slate-700">
                                                <strong>{getRemedyDisplayName(flag.remedy)}:</strong> {flag.reason}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {unverifiedAlert && (
                                <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs italic leading-relaxed text-slate-600">
                                    {unverifiedAlert}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DiagnosisResultCard({
    condition,
    confidence,
    uncertainty,
    alerts = [],
    clinicalRules = [],
    showIndianRemedies = true,
    showUncertaintyDetails = true,
    showDetailedExplanations = true,
    symptoms = [],
    reasoningTrace = [],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    diagnosisId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    showBookDoctor = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    carePreferences: propCarePreferences,
    ddiAlerts = [],
    ddiFlaggedRemedies = [],
    ddiBlockedRemedies = [],
    userSymptomData,
}: DiagnosisResultCardProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showCalculationPanel, setShowCalculationPanel] = useState(false);
    const [selectedCareTab, setSelectedCareTab] = useState<CareTabId>("home");
    const { user } = useAuth();

    useEffect(() => {
        getSubscriptionStatus().then((status) => {
            setIsPremium(hasFeature(status, "pdf_health_reports"));
        });
    }, []);

    if (!condition) return null;

    const explainableCondition = condition as ExplainableCondition;
    const roundedConfidence = Math.round(uncertainty?.pointEstimate ?? confidence);
    const confidenceBand = getConfidenceBand(roundedConfidence);
    const confidenceLabel = getUserFacingConfidenceLabel(roundedConfidence);
    const confidenceTone = getConfidenceTone(roundedConfidence);
    const showRawConfidence = roundedConfidence >= 50;
    const confidenceRange = uncertainty
        ? `${uncertainty.confidenceInterval.lower.toFixed(0)}% - ${uncertainty.confidenceInterval.upper.toFixed(0)}%`
        : null;
    const significantReasoning = reasoningTrace
        .filter((trace) => Math.abs(trace.impact) > 0.5)
        .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
        .slice(0, 5);
    const differentialDiagnoses = Array.isArray(explainableCondition.differentialDiagnoses)
        ? explainableCondition.differentialDiagnoses.filter((item) => item?.name)
        : [];
    const hasCalculationPanel = showUncertaintyDetails || showDetailedExplanations;

    // Gather all critical warnings
    const allWarnings = [
        ...(condition.seekHelp ? [condition.seekHelp] : []),
        ...alerts,
    ];

    const isEmergency = allWarnings.some(
        (w) =>
            w.toLowerCase().includes("immediate") ||
            w.toLowerCase().includes("emergency") ||
            w.toLowerCase().includes("911") ||
            w.toLowerCase().includes("112")
    );

    const _shouldRecommendDoctor =
        confidence < 80 || allWarnings.length > 0 || clinicalRules.length > 0;
    void _shouldRecommendDoctor; // reserved for Phase 2 doctor flow

    // ── Copy button handler with 2s success feedback ──────────────────────────
    const handleCopy = () => {
        const text = `Condition: ${condition.name}\nDescription: ${condition.description}\n\nDisclaimer: Healio is an AI health assistant for informational purposes only.`;
        navigator.clipboard
            .writeText(text)
            .catch(() => {/* silent fail — still show feedback */})
            .finally(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
    };

    // ── PDF download handler ──────────────────────────────────────────────────
    const handleAddMoreDetails = () => {
        window.dispatchEvent(new Event("focus-chat-input"));
    };

    const handleDownloadReport = async () => {
        // Build a unique report ID for this session
        const reportId = `HA-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
        const generatedAt = new Date();

        // Build UserProfileSummary from userSymptomData if available
        const up = userSymptomData?.userProfile;
        const userProfile: UserProfileSummary | undefined = up ? {
            age: up.age,
            gender: up.gender,
            weight: up.weight,
            height: up.height,
            bloodPressure: up.bloodPressure,
            medications: up.medications,
            allergies: up.allergies,
            conditions: up.conditions,
            familyHistory: up.familyHistory ? (Array.isArray(up.familyHistory) ? up.familyHistory : [up.familyHistory]) : undefined,
            smoking: up.smoking,
            alcohol: up.alcohol,
            exercise: up.exercise,
        } : undefined;

        // Build SymptomDetailsSummary from userSymptomData
        const symptomDetails: SymptomDetailsSummary | undefined = userSymptomData ? {
            duration: userSymptomData.duration,
            frequency: userSymptomData.frequency,
            intensity: userSymptomData.intensity,
            triggers: userSymptomData.triggers,
            sensation: userSymptomData.sensation ?? userSymptomData.painType,
        } : undefined;

        if (!isPremium) {
            // Watermarked 1-page preview for free tier (Notion/Canva pattern)
            setIsGenerating(true);
            try {
                const blob = await pdf(
                    <MedicalReportPreviewDocument
                        condition={condition}
                        confidence={confidence}
                        uncertainty={uncertainty}
                        alerts={allWarnings}
                        symptoms={symptoms}
                    />
                ).toBlob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `Healio-Preview-${condition.name.replace(/\s+/g, "-")}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error("Preview generation failed:", error);
            } finally {
                setIsGenerating(false);
                setShowUpgradeModal(true);
            }
            return;
        }

        setIsGenerating(true);
        try {
            const blob = await pdf(
                <MedicalReportDocument
                    condition={condition}
                    confidence={confidence}
                    uncertainty={uncertainty}
                    alerts={allWarnings}
                    symptoms={symptoms}
                    clinicalRules={clinicalRules}
                    reasoningTrace={reasoningTrace}
                    ddiAlerts={ddiAlerts}
                    userProfile={userProfile}
                    symptomDetails={symptomDetails}
                    reportId={reportId}
                    generatedAt={generatedAt}
                    userName={user?.user_metadata?.full_name || 'Patient'}
                />
            ).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Healio-Report-${condition.name.replace(/\s+/g, "-")}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Report generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Phase 2: doctor booking callback (unused until DoctorSelectionModal is re-enabled)
    // const handleBookingComplete = (appointmentId: string) => { ... };

    // Remedy section visibility flags
    const hasHomeRemedies = showIndianRemedies && (
        (condition.indianHomeRemedies?.length ?? 0) > 0 ||
        (condition.home_remedies?.length ?? 0) > 0
    );
    const hasAyurvedic = showIndianRemedies && (condition.ayurvedic_remedies?.length ?? 0) > 0;
    const hasHomeopathic =
        (condition.remedies?.length ?? 0) > 0 ||
        (condition.homeopathic_remedies?.length ?? 0) > 0;
    const hasExerciseWarning =
        (condition.warnings?.length ?? 0) > 0 ||
        (condition.exercises?.length ?? 0) > 0;
    const homeRemedies = [
        ...((condition.home_remedies || []) as FlexibleRemedy[]),
        ...((condition.indianHomeRemedies || []) as FlexibleRemedy[]),
    ].slice(0, 5);
    const ayurvedicRemedies = ((condition.ayurvedic_remedies || []) as FlexibleRemedy[]).slice(0, 5);
    const homeopathicRemedies = [
        ...((condition.homeopathic_remedies || []) as FlexibleRemedy[]),
        ...((condition.remedies || []) as FlexibleRemedy[]),
    ].slice(0, 5);
    const careTabs = [
        hasHomeRemedies ? { id: "home" as const, label: "Home Remedies", meta: `${homeRemedies.length} safe steps` } : null,
        hasAyurvedic ? { id: "ayurveda" as const, label: "Ayurveda", meta: `${ayurvedicRemedies.length} source-backed` } : null,
        hasHomeopathic ? { id: "homeopathy" as const, label: "Homeopathy", meta: "Experimental, ask a practitioner" } : null,
        hasExerciseWarning ? { id: "safety" as const, label: "Warnings", meta: "Limits and next steps" } : null,
    ].filter(Boolean) as Array<{ id: CareTabId; label: string; meta: string }>;
    const activeCareTab = careTabs.some((tab) => tab.id === selectedCareTab)
        ? selectedCareTab
        : careTabs[0]?.id;
    const differentialRows = [
        {
            name: condition.name,
            probability: Math.max(5, Math.min(95, roundedConfidence)),
            label: "Primary",
            primary: true,
        },
        ...differentialDiagnoses.slice(0, 3).map((item, idx) => {
            const probability = inferDifferentialProbability(item, idx);
            return {
                name: item.name ?? "Other possibility",
                probability,
                label: getLikelihoodLabel(probability),
                primary: false,
            };
        }),
    ];

    return (
        <>
            <Card className="w-full overflow-hidden rounded-[14px] border-slate-200 bg-white shadow-md sm:border-teal-200">

                {/* ── 1. URGENCY BANNER ─────────────────────────────────────────────────
                    DOM position [0] — always first visible node (Nielsen Heuristic #1)
                    WCAG fix: text-amber-800 (#92400e) = 7.2:1 ratio on amber-50 ✓       */}
                {allWarnings.length > 0 && (
                    <div
                        className={`${isEmergency
                            ? "bg-red-50 border-b border-red-200"
                            : "bg-amber-50 border-b border-amber-100"
                            } px-4 py-3 sm:px-6 sm:py-4`}
                    >
                        <div className="flex items-start gap-3">
                            <AlertTriangle
                                className={`h-5 w-5 ${isEmergency ? "text-red-600" : "text-amber-600"} mt-0.5 shrink-0`}
                            />
                            <div>
                                <h4
                                    className={`text-sm font-bold ${isEmergency ? "text-red-800" : "text-amber-800"} mb-1`}
                                >
                                    {isEmergency
                                        ? "Medical Attention Recommended"
                                        : "Important Note"}
                                </h4>
                                <ul className="space-y-1">
                                    {allWarnings.map((w, i) => (
                                        <li
                                            key={i}
                                            className={`text-sm leading-[1.65] ${isEmergency ? "text-red-700" : "text-amber-800"}`}
                                        >
                                            {w}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 1b. DDI INTERACTION BANNER ─────────────────────────────────────
                    Sits directly below urgency banner — impossible to miss.
                    Shown only when the DDI layer detected active interactions.
                    Orange/purple palette to distinguish from clinical warnings.  */}
                {isEmergency && (
                    <div className="border-b border-red-200 bg-red-50 px-4 py-4 sm:px-6">
                        <EmergencyRedirect detectedSymptoms={allWarnings} />
                    </div>
                )}

                {(ddiAlerts.length > 0 || ddiBlockedRemedies.length > 0 || ddiFlaggedRemedies.length > 0) && (
                    <MedicationSafetySummary
                        ddiAlerts={ddiAlerts}
                        ddiFlaggedRemedies={ddiFlaggedRemedies}
                        ddiBlockedRemedies={ddiBlockedRemedies}
                    />
                )}



                {/* ── 2. DIAGNOSIS HEADER ───────────────────────────────────────────────
                    Tier 1 padding (px-6 py-6 = 24px) — primary zone                    */}
                <div className="bg-white px-4 py-5 border-b border-slate-100 sm:px-6 sm:py-6">
                    <div className="flex flex-col gap-4">
                        <div className="order-2 flex w-full flex-wrap items-center gap-2">
                            {/* Copy button with 2s success state */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopy}
                                className={`h-8 gap-2 rounded-full px-3 text-xs transition-all duration-200 active:scale-[0.97] ${copied
                                    ? "bg-green-50 text-green-700 border-green-300"
                                    : "bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-700 border-slate-200"
                                    }`}
                                aria-label="Copy diagnosis to clipboard"
                            >
                                {copied
                                    ? <Check className="h-4 w-4" />
                                    : <Copy className="h-4 w-4" />
                                }
                                <span>
                                    {copied ? "Copied!" : "Copy"}
                                </span>
                            </Button>

                            {/* PDF export — min-w-[120px] prevents CLS on spinner swap
                                FIXED color: teal-700 (not amber — amber = caution psychology) */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadReport}
                                disabled={isGenerating}
                                className={`h-8 min-w-[120px] gap-2 rounded-full px-3 text-xs active:scale-[0.97] ${isPremium
                                    ? "bg-teal-700 text-white border-teal-700 hover:bg-teal-800"
                                    : "bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-700 border-slate-200"
                                    }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {/* Text always alongside spinner — prevents CLS */}
                                        <span>Exporting...</span>
                                    </>
                                ) : !isPremium ? (
                                    <>
                                        <Lock className="h-3.5 w-3.5" />
                                        <span className="sm:hidden">Report</span>
                                        <span className="hidden sm:inline">Get Report</span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="h-4 w-4" />
                                        <span>Download</span>
                                    </>
                                )}
                            </Button>

                            {roundedConfidence < 80 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddMoreDetails}
                                    className="h-8 gap-2 rounded-full border-teal-200 bg-white px-3 text-xs text-teal-700 hover:bg-teal-50"
                                >
                                    Add more details
                                </Button>
                            )}
                        </div>

                        <div className="order-1 min-w-0">
                            <h3 className="text-display-condition w-full max-w-none whitespace-normal break-words">
                                {condition.name}
                            </h3>
                            {condition.severity && (
                                <div className="mt-2">
                                    <SeverityBadge severity={condition.severity} />
                                </div>
                            )}
                            <p className="mt-3 max-w-3xl text-[14px] leading-[1.65] text-slate-600">
                                {condition.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── 3. CONFIDENCE VISUALIZATION ──────────────────────────────────────
                    Moved OUT of teal header zone (Gestalt proximity fix).
                    CI bar redesigned: gray track + teal fill + dashed bound lines.      */}
                {showUncertaintyDetails && (
                    <div className="bg-white px-4 py-4 border-b border-slate-100 sm:px-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Activity className="h-4 w-4 text-teal-600" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Diagnostic Confidence
                            </span>
                        </div>

                        {uncertainty ? (
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className={`text-lg font-bold ${confidenceTone.text}`}>
                                        {confidenceLabel}
                                    </span>
                                    <span className={`text-sm font-semibold ${confidenceTone.text}`}>
                                        {showRawConfidence ? `${roundedConfidence}%` : "<50%"}
                                    </span>
                                    <span className="sr-only">
                                        CI: {uncertainty.confidenceInterval.lower.toFixed(0)}%
                                        {" – "}
                                        {uncertainty.confidenceInterval.upper.toFixed(0)}%
                                    </span>
                                </div>

                                {/* Redesigned CI bar (FiveThirtyEight / Our World in Data pattern) */}
                                <div className="relative mb-3 h-3 w-full rounded-full bg-gray-200 sm:h-4">
                                    {/* CI zone: light teal between lower and upper bounds */}
                                    <div
                                        className="absolute h-full rounded-full bg-teal-100"
                                        style={{
                                            left: `${uncertainty.confidenceInterval.lower}%`,
                                            width: `${uncertainty.confidenceInterval.upper - uncertainty.confidenceInterval.lower}%`,
                                        }}
                                    />
                                    {/* Point estimate fill */}
                                    <div
                                        className={`absolute h-full rounded-full ${confidenceTone.fill}`}
                                        style={{ width: `${uncertainty.pointEstimate}%` }}
                                    />
                                    {/* Lower bound dashed line */}
                                    <div
                                        className="absolute top-0 bottom-0 border-l-2 border-dashed border-teal-500"
                                        style={{ left: `${uncertainty.confidenceInterval.lower}%` }}
                                    />
                                    {/* Upper bound dashed line */}
                                    <div
                                        className="absolute top-0 bottom-0 border-l-2 border-dashed border-teal-500"
                                        style={{ left: `${uncertainty.confidenceInterval.upper}%` }}
                                    />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="text-[11px] bg-white border-teal-200 text-teal-700">
                                        Evidence: {uncertainty.evidenceQuality}
                                    </Badge>
                                    <Badge variant="outline" className="text-[11px] bg-white border-teal-200 text-teal-700">
                                        {uncertainty.calibrationQuality} Calibration
                                    </Badge>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                                    <Badge variant="outline" className={`w-fit text-[11px] ${confidenceTone.badge}`}>
                                        {confidenceLabel}
                                    </Badge>
                                    <span className="text-sm leading-relaxed text-slate-600">
                                        {roundedConfidence < 80
                                            ? "More information needed for a confident assessment"
                                            : "Open calculations for score details"}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {differentialRows.length > 1 && (
                    <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-6">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Also Possible
                            </span>
                            <span className="hidden text-[11px] text-slate-400 sm:inline">
                                Pattern match comparison
                            </span>
                        </div>
                        <div className="space-y-2">
                            {differentialRows.map((row) => (
                                <DifferentialRow
                                    key={`${row.name}-${row.label}`}
                                    name={row.name}
                                    probability={row.probability}
                                    label={row.label}
                                    primary={row.primary}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {hasCalculationPanel && (
                    <div className="bg-slate-50 px-4 py-4 border-b border-slate-100 sm:px-6">
                        <button
                            type="button"
                            onClick={() => setShowCalculationPanel((open) => !open)}
                            className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50/40 sm:px-4"
                            aria-expanded={showCalculationPanel}
                        >
                            <span className="flex min-w-0 items-start gap-3">
                                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                                    <Calculator className="h-4 w-4" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold text-slate-950">
                                        View calculation and explanation
                                    </span>
                                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                                        See match score, confidence range, evidence quality, rules, and reasoning factors.
                                    </span>
                                </span>
                            </span>
                            {showCalculationPanel
                                ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
                                : <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                            }
                        </button>

                        {showCalculationPanel && (
                            <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
                                {showUncertaintyDetails && (
                                    <div>
                                        <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-teal-700">
                                            <Activity className="h-3.5 w-3.5" />
                                            Calculation Snapshot
                                        </h4>
                                        <div className="grid gap-2 sm:grid-cols-3">
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                    Match score
                                                </p>
                                                <p className="mt-1 text-lg font-bold text-slate-950">
                                                    {roundedConfidence}%
                                                </p>
                                                <p className="text-xs text-slate-500">{confidenceBand} fit</p>
                                            </div>
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                    Confidence range
                                                </p>
                                                <p className="mt-1 text-lg font-bold text-slate-950">
                                                    {confidenceRange ?? "Not enough data"}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {confidenceRange ? "Lower to upper estimate" : "Shown when the engine can estimate a range"}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                    Evidence quality
                                                </p>
                                                <p className="mt-1 text-lg font-bold capitalize text-slate-950">
                                                    {uncertainty?.evidenceQuality ?? "Screening"}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {uncertainty?.calibrationQuality
                                                        ? `${uncertainty.calibrationQuality} calibration`
                                                        : "Based on available symptom detail"}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                                            Healio combines reported symptoms, duration, severity, safety flags, profile context, and available source-backed guidance. This score is a triage aid, not a confirmed medical diagnosis.
                                        </p>
                                    </div>
                                )}

                                {showDetailedExplanations && (
                                    <div className="space-y-3 border-t border-slate-100 pt-3">
                                        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                                            <FileText className="h-3.5 w-3.5" />
                                            Explanation
                                        </h4>

                                        {(explainableCondition.bayesianFactors || explainableCondition.rationale || condition.description) && (
                                            <div className="rounded-lg border border-teal-100 bg-teal-50/50 p-3">
                                                <p className="text-xs font-semibold text-teal-900">Why this pattern was shown</p>
                                                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                                                    {explainableCondition.bayesianFactors || explainableCondition.rationale || condition.description}
                                                </p>
                                            </div>
                                        )}

                                        {clinicalRules.length > 0 && (
                                            <div>
                                                <p className="mb-2 text-xs font-semibold text-slate-700">Clinical rules applied</p>
                                                <div className="space-y-2">
                                                    {clinicalRules.map((rule, idx) => (
                                                        <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                                                            <span className="font-semibold text-slate-950">{rule.rule}:</span>{" "}
                                                            {rule.interpretation}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {significantReasoning.length > 0 && (
                                            <div>
                                                <p className="mb-2 text-xs font-semibold text-slate-700">Top reasoning factors</p>
                                                <div className="space-y-2">
                                                    {significantReasoning.map((trace, idx) => (
                                                        <div key={idx} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                                                            <span className="min-w-0 font-medium text-slate-700">{trace.factor}</span>
                                                            <Badge
                                                                variant="outline"
                                                                className={`shrink-0 text-[11px] ${trace.impact > 0
                                                                    ? "border-teal-200 bg-teal-50 text-teal-700"
                                                                    : "border-red-200 bg-red-50 text-red-700"
                                                                    }`}
                                                            >
                                                                {trace.impact > 0 ? "Supports diagnosis" : "Against diagnosis"} - {getImpactLabel(trace.impact)}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {differentialDiagnoses.length > 0 && (
                                            <div>
                                                <p className="mb-2 text-xs font-semibold text-slate-700">Other possibilities considered</p>
                                                <div className="space-y-2">
                                                    {differentialDiagnoses.slice(0, 3).map((item, idx) => (
                                                        <div key={`${item.name}-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="text-xs font-semibold text-slate-950">{item.name}</p>
                                                                {item.likelihood && (
                                                                    <Badge variant="outline" className="text-[11px] capitalize">
                                                                        {item.likelihood}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {item.rationale && (
                                                                <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.rationale}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {clinicalRules.length === 0 && significantReasoning.length === 0 && differentialDiagnoses.length === 0 && !explainableCondition.bayesianFactors && !explainableCondition.rationale && (
                                            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                                                Detailed calculation data was not returned for this answer. Healio is still showing the available match score and safety guidance from this chat turn.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <CardContent className="p-0">
                    {careTabs.length > 0 && (
                        <div className="border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
                            <h4 className="mb-3 text-sm font-semibold text-slate-950">
                                Recommended Care
                            </h4>

                            <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Recommended care sections">
                                {careTabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        id={`care-tab-${tab.id}`}
                                        type="button"
                                        role="tab"
                                        aria-selected={activeCareTab === tab.id}
                                        aria-controls={`care-panel-${tab.id}`}
                                        tabIndex={activeCareTab === tab.id ? 0 : -1}
                                        onClick={() => setSelectedCareTab(tab.id)}
                                        className={`min-w-fit rounded-full border px-3 py-2 text-left transition-colors ${activeCareTab === tab.id
                                            ? "border-teal-200 bg-teal-50 text-teal-800"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50/50"
                                            }`}
                                    >
                                        <span className="block text-xs font-semibold">{tab.label}</span>
                                        <span className="mt-0.5 block text-[10px] leading-tight opacity-80">{tab.meta}</span>
                                    </button>
                                ))}
                            </div>

                            {activeCareTab === "home" && (
                                <div id="care-panel-home" role="tabpanel" aria-labelledby="care-tab-home" className="grid gap-3 sm:grid-cols-2">
                                    {homeRemedies.map((remedy, idx) => (
                                        <RemedyCard key={`home-${idx}`} remedy={remedy} kind="home" />
                                    ))}
                                </div>
                            )}

                            {activeCareTab === "ayurveda" && (
                                <div id="care-panel-ayurveda" role="tabpanel" aria-labelledby="care-tab-ayurveda" className="grid gap-3 sm:grid-cols-2">
                                    {ayurvedicRemedies.map((remedy, idx) => (
                                        <RemedyCard key={`ayurveda-${idx}`} remedy={remedy} kind="ayurveda" />
                                    ))}
                                </div>
                            )}

                            {activeCareTab === "homeopathy" && (
                                <div id="care-panel-homeopathy" role="tabpanel" aria-labelledby="care-tab-homeopathy" className="space-y-3">
                                    <div className="rounded-lg border border-[var(--healio-evidence-traditional)] bg-[var(--healio-evidence-traditional-bg)] px-3 py-2 text-xs leading-relaxed text-[var(--healio-wellness-accent)]">
                                        Experimental suggestions. Consult a qualified homeopathic or medical practitioner before use.
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {homeopathicRemedies.map((remedy, idx) => (
                                            <RemedyCard key={`homeopathy-${idx}`} remedy={remedy} kind="homeopathy" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeCareTab === "safety" && (
                                <div id="care-panel-safety" role="tabpanel" aria-labelledby="care-tab-safety" className="space-y-3">
                                    {(condition.warnings || []).length > 0 && (
                                        <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                                            <h5 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-red-700">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                Precautions
                                            </h5>
                                            <ul className="space-y-1.5">
                                                {(condition.warnings || []).map((warning, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-xs leading-[1.65] text-red-700">
                                                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden="true" />
                                                        <span>{warning}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {(condition.exercises || []).length > 0 && (
                                        <div className="rounded-lg border border-orange-100 bg-orange-50 p-3">
                                            <h5 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-orange-700">
                                                <Dumbbell className="h-3.5 w-3.5" />
                                                Movement guidance
                                            </h5>
                                            <div className="space-y-2">
                                                {(condition.exercises || []).slice(0, 4).map((exercise, idx) => (
                                                    <div key={idx} className="flex flex-col gap-1 text-xs text-orange-800 sm:flex-row sm:items-center sm:justify-between">
                                                        <span className="font-medium">{exercise.name}</span>
                                                        {exercise.duration && (
                                                            <span className="w-fit rounded-full bg-orange-100 px-2 py-0.5 text-[11px] text-orange-700">
                                                                {exercise.duration}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {/* ── 5. RECOMMENDED CARE — Progressive Disclosure Accordions ────────
                        Replaces hidden-tab pill system (Baymard: 74% users miss non-default tabs).
                        All sections default-open; Exercise/Warnings closed by default.           */}


                    {/* ── 6. DISCLAIMER ─────────────────────────────────────────────────
                        WCAG fix: text-amber-800 (#92400e) = 7.2:1 on amber-50 ✓
                        Italic IS appropriate here — disclaimer is the sole italic role.   */}
                    <div className="border-t border-amber-100 bg-amber-50 px-4 py-3 sm:px-6">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-0.5">
                                <p className="text-xs text-amber-900 leading-[1.65] font-bold tracking-wide uppercase">
                                    Not a Medical Diagnosis
                                </p>
                                <p className="text-xs text-amber-900 leading-[1.65] font-semibold">
                                    Beta - Assessment Summary &amp; Informational Care Guidance
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-amber-800 leading-[1.65] italic">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(condition as any).disclaimer
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                ? (condition as any).disclaimer
                                : "Healio is an AI health assistant for informational and educational purposes only. This is not a medical diagnosis. AI analysis is experimental and may be inaccurate. Homeopathic, Ayurvedic, and home remedy suggestions are provided for awareness only — they have not been evaluated by a regulatory authority. Please consult a qualified healthcare professional before taking any medicine or altering any existing treatment."}
                        </p>
                        <p className="text-[11px] text-amber-700 font-medium">
                            Always seek advice from a licensed doctor, especially before taking any medicine.
                        </p>
                    </div>

                    {/* ── 7. PRIVACY FOOTER ─────────────────────────────────────────────
                        Tier 3 padding (px-4 py-3 = ~12px). Caption type = 11px.          */}
                    <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Shield className="h-3 w-3" />
                            <span>Analysis is encrypted &amp; private</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                            AI-assisted • For informational purposes only
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* PHASE 2 — Booking Modal (commented out) */}
            {/* <DoctorSelectionModal ... /> */}

            {/* Premium Upgrade Modal */}
            <PlanSelectionModal
                open={showUpgradeModal}
                onOpenChange={setShowUpgradeModal}
                featureLocked="Medical Reports"
            />
        </>
    );
}
