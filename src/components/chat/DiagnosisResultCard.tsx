"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
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

type DifferentialDiagnosis = {
    name?: string;
    likelihood?: string;
    rationale?: string;
};

type ExplainableCondition = Condition & {
    confidence?: number;
    bayesianFactors?: string;
    differentialDiagnoses?: DifferentialDiagnosis[];
    care_plan?: string;
    rationale?: string;
};

function getConfidenceBand(score: number) {
    if (score >= 90) return "High";
    if (score >= 70) return "Moderate-high";
    if (score >= 55) return "Moderate";
    return "Low";
}

function getImpactLabel(impact: number) {
    const absImpact = Math.abs(impact);
    if (absImpact > 3) return "Very strong";
    if (absImpact > 2) return "Strong";
    if (absImpact > 1) return "Moderate";
    return "Light";
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
                ◆ Severity: {severity}
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
function RemedyAccordion({
    title,
    emoji,
    headerClass,
    defaultOpen = true,
    children,
}: {
    title: string;
    emoji: string;
    headerClass: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
                onClick={() => setOpen((o) => !o)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-all duration-75 active:scale-[0.97] active:opacity-80 ${headerClass}`}
                aria-expanded={open}
            >
                <span>{emoji} {title}</span>
                {open
                    ? <ChevronUp className="h-4 w-4 shrink-0" />
                    : <ChevronDown className="h-4 w-4 shrink-0" />
                }
            </button>
            {open && (
                <div className="p-4 space-y-3">
                    {children}
                </div>
            )}
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
            w.toLowerCase().includes("911")
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

    return (
        <>
            <Card className="w-full bg-white border-teal-200 shadow-md overflow-hidden relative">

                {/* ── 1. URGENCY BANNER ─────────────────────────────────────────────────
                    DOM position [0] — always first visible node (Nielsen Heuristic #1)
                    WCAG fix: text-amber-800 (#92400e) = 7.2:1 ratio on amber-50 ✓       */}
                {allWarnings.length > 0 && (
                    <div
                        className={`${isEmergency
                            ? "bg-red-50 border-b border-red-200"
                            : "bg-amber-50 border-b border-amber-100"
                            } px-6 py-4`}
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
                {(ddiAlerts.length > 0 || ddiBlockedRemedies.length > 0 || ddiFlaggedRemedies.length > 0) && (() => {
                    // Separate alerts by type for tiered display
                    const timingAlerts = ddiFlaggedRemedies.filter((f) => f.timingNote);
                    const majorAlerts = ddiAlerts.filter(
                        (a) => !a.includes('could not be verified') && !a.includes('Trikatu')
                    );
                    const piperineAlert = ddiAlerts.find((a) => a.includes('Trikatu'));
                    const unverifiedAlert = ddiAlerts.find((a) => a.includes('could not be verified'));
                    const moderateRemedies = ddiFlaggedRemedies.filter(
                        (f) => (f.severity === 'moderate' || f.severity === 'minor') && !f.timingNote
                    );

                    return (
                        <div className="border-b border-orange-200">

                            {/* Timing interactions — distinct ⏱ panel */}
                            {timingAlerts.length > 0 && (
                                <div className="bg-amber-50 px-6 py-3 border-b border-amber-100">
                                    <div className="flex items-start gap-3">
                                        <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                        <div>
                                            <h4 className="text-xs font-bold text-amber-800 mb-1">⏱ Timing Interactions</h4>
                                            <ul className="space-y-1">
                                                {timingAlerts.map((f, i) => (
                                                    <li key={i} className="text-xs text-amber-800 leading-[1.6]">
                                                        {f.timingNote}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Major/contraindicated interaction banner */}
                            {(majorAlerts.length > 0 || ddiBlockedRemedies.length > 0 || piperineAlert) && (
                                <div className="bg-orange-50 px-6 py-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-orange-800 mb-1">💊 Medication Interaction Notice</h4>
                                            {ddiBlockedRemedies.length > 0 && (
                                                <p className="text-xs text-orange-700 mb-2 leading-relaxed">
                                                    <strong>{ddiBlockedRemedies.length} remedy/remedies</strong> have been flagged as potentially contraindicated with your medications.
                                                </p>
                                            )}
                                            <ul className="space-y-1.5">
                                                {majorAlerts.map((alert, i) => (
                                                    <li key={i} className="text-xs text-orange-800 leading-[1.65] flex items-start gap-1.5">
                                                        <span className="text-orange-500 mt-0.5 shrink-0">•</span>
                                                        <span>{alert}</span>
                                                    </li>
                                                ))}
                                                {piperineAlert && (
                                                    <li className="text-xs text-orange-800 leading-[1.65] flex items-start gap-1.5">
                                                        <span className="text-orange-500 mt-0.5 shrink-0">⚗</span>
                                                        <span>{piperineAlert}</span>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Moderate interactions — collapsed by default */}
                            {moderateRemedies.length > 0 && (
                                <RemedyAccordion
                                    title={`${moderateRemedies.length} possible interaction${moderateRemedies.length > 1 ? 's' : ''} (moderate/minor)`}
                                    emoji="ℹ️"
                                    headerClass="bg-slate-50 text-slate-700 hover:bg-slate-100"
                                    defaultOpen={false}
                                >
                                    <ul className="space-y-2">
                                        {moderateRemedies.map((f, i) => (
                                            <li key={i} className="text-xs text-slate-700 leading-[1.65] flex items-start gap-1.5">
                                                <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                                                <div>
                                                    <span className="font-medium">
                                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                        {(f.remedy as any)?.name ?? 'Remedy'}
                                                    </span>
                                                    {' — '}{f.reason}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </RemedyAccordion>
                            )}

                            {/* Unverified medication notice */}
                            {unverifiedAlert && (
                                <div className="bg-slate-50 px-6 py-2 border-t border-slate-100">
                                    <p className="text-xs text-slate-600 italic">{unverifiedAlert}</p>
                                </div>
                            )}
                        </div>
                    );
                })()}


                {/* ── 2. DIAGNOSIS HEADER ───────────────────────────────────────────────
                    Tier 1 padding (px-6 py-6 = 24px) — primary zone                    */}
                <div className="bg-teal-50 px-6 py-6 border-b border-teal-100">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-teal-900 leading-tight">
                                {condition.name}
                            </h3>
                            {condition.severity && (
                                <div className="mt-2">
                                    <SeverityBadge severity={condition.severity} />
                                </div>
                            )}
                            <p className="text-sm text-teal-700 mt-2 leading-[1.65]">
                                {condition.description}
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Copy button with 2s success state */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopy}
                                className={`gap-2 h-9 min-w-[80px] transition-all duration-200 active:scale-[0.97] ${copied
                                    ? "bg-green-50 text-green-700 border-green-300"
                                    : "bg-white text-teal-700 hover:bg-teal-50 border-teal-200"
                                    }`}
                                aria-label="Copy diagnosis to clipboard"
                            >
                                {copied
                                    ? <Check className="h-4 w-4" />
                                    : <Copy className="h-4 w-4" />
                                }
                                <span className="hidden sm:inline">
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
                                className={`gap-2 h-9 min-w-[120px] active:scale-[0.97] ${isPremium
                                    ? "bg-white text-teal-700 hover:bg-teal-50 border-teal-200"
                                    : "bg-teal-700 text-white border-teal-700 hover:bg-teal-800"
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
                                        <span>Get Report</span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="h-4 w-4" />
                                        <span>Share</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ── 3. CONFIDENCE VISUALIZATION ──────────────────────────────────────
                    Moved OUT of teal header zone (Gestalt proximity fix).
                    CI bar redesigned: gray track + teal fill + dashed bound lines.      */}
                {showUncertaintyDetails && (
                    <div className="bg-white px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Activity className="h-4 w-4 text-teal-600" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Diagnostic Confidence
                            </span>
                        </div>

                        {uncertainty ? (
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-2xl font-bold text-teal-900">
                                        {uncertainty.pointEstimate.toFixed(0)}%
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium mb-1">
                                        CI: {uncertainty.confidenceInterval.lower.toFixed(0)}%
                                        {" – "}
                                        {uncertainty.confidenceInterval.upper.toFixed(0)}%
                                    </span>
                                </div>

                                {/* Redesigned CI bar (FiveThirtyEight / Our World in Data pattern) */}
                                <div className="w-full bg-gray-200 rounded-full h-3 mb-3 relative overflow-hidden">
                                    {/* CI zone: light teal between lower and upper bounds */}
                                    <div
                                        className="bg-teal-100 h-full absolute"
                                        style={{
                                            left: `${uncertainty.confidenceInterval.lower}%`,
                                            width: `${uncertainty.confidenceInterval.upper - uncertainty.confidenceInterval.lower}%`,
                                        }}
                                    />
                                    {/* Point estimate fill */}
                                    <div
                                        className="bg-teal-600 h-full rounded-l-full absolute"
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

                                <div className="flex gap-2">
                                    <Badge variant="outline" className="text-[11px] bg-white border-teal-200 text-teal-700">
                                        Evidence: {uncertainty.evidenceQuality}
                                    </Badge>
                                    <Badge variant="outline" className="text-[11px] bg-white border-teal-200 text-teal-700">
                                        {uncertainty.calibrationQuality} Calibration
                                    </Badge>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Badge className="bg-teal-600 text-[11px]">
                                    {confidence > 90 ? "High" : confidence > 60 ? "Moderate" : "Low"} Match
                                </Badge>
                                <span className="text-sm text-slate-600">
                                    ({confidence}% match score)
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {hasCalculationPanel && (
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                        <button
                            type="button"
                            onClick={() => setShowCalculationPanel((open) => !open)}
                            className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50/40"
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
                            <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
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
                                                                {trace.impact > 0 ? "+" : "-"} {getImpactLabel(trace.impact)}
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
                    {/* ── 5. RECOMMENDED CARE — Progressive Disclosure Accordions ────────
                        Replaces hidden-tab pill system (Baymard: 74% users miss non-default tabs).
                        All sections default-open; Exercise/Warnings closed by default.           */}
                    {(hasHomeRemedies || hasAyurvedic || hasHomeopathic || hasExerciseWarning) && (
                        <div className="px-4 py-4 space-y-2">
                            <h4 className="font-semibold text-slate-900 mb-3 text-sm">
                                Recommended Care
                            </h4>

                            {/* Home Remedies */}
                            {hasHomeRemedies && (
                                <RemedyAccordion
                                    title="Home Remedies"
                                    emoji="🌿"
                                    headerClass="bg-amber-50 text-amber-800 hover:bg-amber-100"
                                    defaultOpen={true}
                                >
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {(condition.home_remedies || condition.indianHomeRemedies || []).slice(0, 5).map((remedy: any, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-amber-50 p-3 rounded-lg border border-amber-100 hover:border-amber-200 transition-colors"
                                        >
                                            <span className="font-medium text-amber-800 text-sm">
                                                {remedy.name || remedy.remedy}
                                            </span>
                                            {(remedy.description || remedy.indication) && (
                                                <p className="text-xs text-amber-800 mt-1 leading-[1.65]">
                                                    {remedy.description || remedy.indication}
                                                </p>
                                            )}
                                            {(remedy.method || remedy.preparation) && (
                                                <p className="text-xs text-amber-800 mt-1 leading-[1.65]">
                                                    {/* FIXED: bold label — italic restricted to disclaimers */}
                                                    <strong>How to use:</strong>{" "}
                                                    {remedy.method || remedy.preparation}
                                                </p>
                                            )}
                                            {remedy.ingredients?.length > 0 && (
                                                <p className="text-xs text-amber-700 mt-1">
                                                    Ingredients: {remedy.ingredients.join(", ")}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </RemedyAccordion>
                            )}

                            {/* Ayurvedic Solutions */}
                            {hasAyurvedic && (
                                <RemedyAccordion
                                    title="Ayurvedic Solutions"
                                    emoji="🍃"
                                    headerClass="bg-green-50 text-green-800 hover:bg-green-100"
                                    defaultOpen={true}
                                >
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {(condition.ayurvedic_remedies || []).slice(0, 5).map((remedy: any, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-green-50 p-3 rounded-lg border border-green-100 hover:border-green-200 transition-colors"
                                        >
                                            <span className="font-medium text-green-800 text-sm">
                                                {remedy.name}
                                            </span>
                                            {remedy.indication && (
                                                <p className="text-xs text-green-700 mt-1 leading-[1.65]">
                                                    {remedy.indication}
                                                </p>
                                            )}
                                            {remedy.preparation && (
                                                <p className="text-xs text-green-800 mt-1 leading-[1.65]">
                                                    <strong>Preparation:</strong> {remedy.preparation}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </RemedyAccordion>
                            )}

                            {/* Homeopathic Solution */}
                            {hasHomeopathic && (
                                <RemedyAccordion
                                    title="Homeopathic Solution"
                                    emoji="💊"
                                    headerClass="bg-teal-50 text-teal-800 hover:bg-teal-100"
                                    defaultOpen={true}
                                >
                                    {/* ── HOMEOPATHIC BETA DISCLAIMER ────────────────────────────── */}
                                    <div className="flex items-start gap-2.5 bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
                                        <AlertTriangle className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[11px] font-bold text-purple-800 mb-0.5 uppercase tracking-wide">
                                                🧪 Beta Feature · Results May Vary
                                            </p>
                                            <p className="text-[11px] text-purple-700 leading-relaxed">
                                                Homeopathic suggestions are AI-generated and experimental. Homeopathy is not universally recognised by mainstream medicine. <strong>Do not take any medicine without first consulting a qualified homeopathic or medical professional.</strong>
                                            </p>
                                        </div>
                                    </div>
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {(condition.homeopathic_remedies || condition.remedies || []).slice(0, 5).map((remedy: any, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-teal-50 p-3 rounded-lg border border-teal-100 hover:border-teal-200 transition-colors"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="font-medium text-teal-800 text-sm">
                                                        {remedy.name}
                                                    </span>
                                                    {remedy.potency && (
                                                        <span className="ml-2 text-[11px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                                                            {remedy.potency}
                                                        </span>
                                                    )}
                                                </div>
                                                {remedy.videoUrl && (
                                                    <a
                                                        href={remedy.videoUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-teal-600 hover:text-teal-700"
                                                    >
                                                        <Video size={16} />
                                                    </a>
                                                )}
                                            </div>
                                            {(remedy.description || remedy.indication) && (
                                                <p className="text-xs text-teal-700 mt-1 leading-[1.65]">
                                                    {remedy.description || remedy.indication}
                                                </p>
                                            )}
                                            {(remedy.method || remedy.dosage) && (
                                                <p className="text-xs text-teal-800 mt-1 leading-[1.65]">
                                                    <strong>How to take:</strong>{" "}
                                                    {remedy.method || remedy.dosage}
                                                </p>
                                            )}
                                            {remedy.source && (
                                                <span className="inline-block mt-1.5 text-[11px] bg-teal-100/60 text-teal-600 px-2 py-0.5 rounded-full">
                                                    Source: {remedy.source}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </RemedyAccordion>
                            )}

                            {/* Exercise & Warnings — defaultOpen=false (less actionable) */}
                            {hasExerciseWarning && (
                                <RemedyAccordion
                                    title="Exercise & Warnings"
                                    emoji="⚠️"
                                    headerClass="bg-red-50 text-red-800 hover:bg-red-100"
                                    defaultOpen={false}
                                >
                                    {(condition.warnings || []).length > 0 && (
                                        <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                            <h5 className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                Precautions &amp; Contraindications
                                            </h5>
                                            <ul className="space-y-1.5">
                                                {(condition.warnings || []).map((warning, idx) => (
                                                    <li
                                                        key={idx}
                                                        className="text-xs text-red-700 leading-[1.65] flex items-start gap-2"
                                                    >
                                                        <span className="text-red-400 mt-0.5">•</span>
                                                        <span>{warning}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {(condition.exercises || []).length > 0 && (
                                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                            <h5 className="text-xs font-bold text-orange-700 mb-2 flex items-center gap-1.5">
                                                <Dumbbell className="h-3.5 w-3.5" />
                                                Exercise Recommendations
                                            </h5>
                                            <div className="space-y-2">
                                                {(condition.exercises || []).slice(0, 4).map((exercise, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between text-xs"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-orange-400">•</span>
                                                            <span className="text-orange-800 font-medium">
                                                                {exercise.name}
                                                            </span>
                                                        </div>
                                                        {exercise.duration && (
                                                            <span className="text-[11px] text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {exercise.duration}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(condition.warnings || []).length === 0 &&
                                        (condition.exercises || []).length === 0 && (
                                            <p className="text-xs text-slate-500 italic p-3">
                                                No specific exercise warnings for this condition.
                                            </p>
                                        )}
                                </RemedyAccordion>
                            )}
                        </div>
                    )}

                    {/* ── 6. DISCLAIMER ─────────────────────────────────────────────────
                        WCAG fix: text-amber-800 (#92400e) = 7.2:1 on amber-50 ✓
                        Italic IS appropriate here — disclaimer is the sole italic role.   */}
                    <div className="px-6 py-4 border-t border-amber-200 bg-amber-50 space-y-2">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-900 leading-[1.65] font-semibold">
                                ⚠️ Beta · Not a Medical Diagnosis — Results May Vary
                            </p>
                        </div>
                        <p className="text-xs text-amber-800 leading-[1.65] italic">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(condition as any).disclaimer
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                ? (condition as any).disclaimer
                                : "Healio is an AI health assistant for informational and educational purposes only. This is not a medical diagnosis. AI analysis is experimental and may be inaccurate. Homeopathic, Ayurvedic, and home remedy suggestions are provided for awareness only — they have not been evaluated by a regulatory authority. Please consult a qualified healthcare professional before taking any medicine or altering any existing treatment."}
                        </p>
                        <p className="text-[11px] text-amber-700 font-medium">
                            🩺 Always seek advice from a licensed doctor, especially before taking any medicine.
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
