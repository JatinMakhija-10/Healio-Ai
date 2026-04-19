"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Condition, ReasoningTraceEntry } from "@/lib/diagnosis/types";
import {
    Video,
    Shield,
    Activity,
    AlertTriangle,
    Info,
    Share2,
    FileText,
    Loader2,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Stethoscope,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ArrowRight,
    Lock,
    Dumbbell,
    Clock,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    Circle,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
}: DiagnosisResultCardProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user } = useAuth();

    useEffect(() => {
        getSubscriptionStatus().then((status) => {
            setIsPremium(status === "plus" || status === "pro");
        });
    }, []);

    if (!condition) return null;

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const shouldRecommendDoctor =
        confidence < 80 || allWarnings.length > 0 || clinicalRules.length > 0;

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleBookingComplete = (appointmentId: string) => {
        console.log("Appointment booked:", appointmentId);
    };

    // Remedy section visibility flags
    const hasHomeRemedies =
        (condition.indianHomeRemedies?.length ?? 0) > 0 ||
        (condition.home_remedies?.length ?? 0) > 0;
    const hasAyurvedic = (condition.ayurvedic_remedies?.length ?? 0) > 0;
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

                <CardContent className="p-0">
                    {/* ── 4. CLINICAL RULES ─────────────────────────────────────────────
                        Credibility anchor: 3px teal left border + teal Info icon.
                        Border-left signals data provenance (Apple Health / EPIC pattern). */}
                    {clinicalRules.length > 0 && (
                        <div className="bg-slate-50 px-4 py-4 border-b border-slate-100">
                            <h4 className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Info className="h-3.5 w-3.5 text-teal-600" />
                                Clinical Rules Applied
                            </h4>
                            <div className="border-l-[3px] border-teal-600 pl-3 space-y-2">
                                {clinicalRules.map((rule, idx) => (
                                    <div
                                        key={idx}
                                        className="text-xs bg-white p-2 rounded border border-slate-200 text-slate-700"
                                    >
                                        <span className="font-semibold text-slate-900">
                                            {rule.rule}:
                                        </span>{" "}
                                        {rule.interpretation}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── 4b. DIAGNOSTIC REASONING ───────────────────────────────────── */}
                    {showDetailedExplanations &&
                        reasoningTrace &&
                        reasoningTrace.length > 0 && (
                            <div className="bg-white px-4 py-4 border-b border-slate-100">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                                    <FileText className="h-3 w-3" /> Diagnostic Reasoning
                                </h4>
                                <div className="space-y-2">
                                    {reasoningTrace
                                        .filter((trace) => Math.abs(trace.impact) > 0.5)
                                        .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
                                        .slice(0, 5)
                                        .map((trace, idx) => (
                                            <div
                                                key={idx}
                                                className="flex justify-between items-center text-xs"
                                            >
                                                <span className="text-slate-700 font-medium">
                                                    {trace.factor}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={`ml-2 text-[11px] h-5 ${trace.impact > 0
                                                        ? "text-teal-700 bg-teal-50 border-teal-200"
                                                        : "text-red-700 bg-red-50 border-red-200"
                                                        }`}
                                                >
                                                    {trace.impact > 0 ? "+" : ""}
                                                    {trace.impact > 2 ? "High Impact" : "Contributing"}
                                                </Badge>
                                            </div>
                                        ))}
                                </div>
                                {/* italic ONLY for disclaimer-type footnote text */}
                                <p className="text-[11px] text-slate-400 mt-3 italic">
                                    *Analysis based on reported symptoms and medical knowledge base.
                                </p>
                            </div>
                        )}

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
                    <div className="px-6 py-4 border-t border-amber-100 bg-amber-50/50">
                        <p className="text-xs text-amber-800 leading-[1.65] italic">
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            <strong>Disclaimer:</strong>{" "}
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(condition as any).disclaimer
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                ? (condition as any).disclaimer
                                : "Healio is an AI health assistant for informational purposes only. This is not a medical diagnosis. Please consult a qualified healthcare professional for treatment. These suggestions are for informational purposes only — please consult a qualified practitioner before taking any remedy."}
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
