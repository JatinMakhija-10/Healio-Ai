"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Condition } from "@/lib/diagnosis/types";
import {
    Video,
    Shield,
    Activity,
    AlertTriangle,
    Info,
    Share2,
    FileText,
    Loader2,
    Stethoscope,
    ArrowRight,
    Lock,
    Dumbbell,
    Clock
} from "lucide-react";
import { UncertaintyEstimate, RuleResult } from "@/lib/diagnosis/advanced";
import { Button } from "@/components/ui/button";
import { pdf } from '@react-pdf/renderer';
import { MedicalReportDocument } from "./MedicalReportPDF";
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
    reasoningTrace?: { factor: string; impact: number; type: string }[];
    diagnosisId?: string; // ID for booking flow
    showBookDoctor?: boolean; // Whether to show booking CTA
    carePreferences?: string[]; // Override user preferences from parent
}

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
    diagnosisId,
    showBookDoctor = true,
    carePreferences: propCarePreferences,
}: DiagnosisResultCardProps) {
    const [activeTab, setActiveTab] = useState<string>("home_remedies");
    const [isGenerating, setIsGenerating] = useState(false);
    // PHASE 2 — Booking
    // const [showBookingModal, setShowBookingModal] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const { user } = useAuth();



    useEffect(() => {
        getSubscriptionStatus().then((status) => {
            setIsPremium(status === 'plus' || status === 'pro');
        });
    }, []);

    // Gather all critical warnings (condition-specific + general alerts)
    const allWarnings = [
        ...(condition.seekHelp ? [condition.seekHelp] : []),
        ...alerts
    ];

    // Determine urgency level
    const isEmergency = allWarnings.some(w =>
        w.toLowerCase().includes("immediate") ||
        w.toLowerCase().includes("emergency") ||
        w.toLowerCase().includes("911")
    );

    // Determine if we should recommend a doctor
    const shouldRecommendDoctor = confidence < 80 || allWarnings.length > 0 || clinicalRules.length > 0;

    const handleDownloadReport = async () => {
        if (!isPremium) {
            setShowUpgradeModal(true);
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
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Healio-Report-${condition.name.replace(/\s+/g, '-')}.pdf`;
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

    const handleBookingComplete = (appointmentId: string) => {
        // Handle successful booking - could redirect or show confirmation
        console.log("Appointment booked:", appointmentId);
    };

    return (
        <>
            <Card className="w-full bg-white border-teal-200 shadow-md overflow-hidden relative">
                {/* 1. URGENCY HEADER (Moved to top) */}
                {allWarnings.length > 0 && (
                    <div className={`${isEmergency ? 'bg-red-50 border-b border-red-200' : 'bg-amber-50 border-b border-amber-100'} p-4`}>
                        <div className="flex items-start gap-3">
                            <AlertTriangle className={`h-5 w-5 ${isEmergency ? 'text-red-600' : 'text-amber-600'} mt-0.5 shrink-0`} />
                            <div>
                                <h4 className={`text-sm font-bold ${isEmergency ? 'text-red-800' : 'text-amber-800'} mb-1`}>
                                    {isEmergency ? "Medical Attention Recommended" : "Important Note"}
                                </h4>
                                <ul className="space-y-1">
                                    {allWarnings.map((w, i) => (
                                        <li key={i} className={`text-sm ${isEmergency ? 'text-red-700' : 'text-amber-700'}`}>
                                            {w}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. DIAGNOSIS HEADER */}
                <div className="bg-teal-50 p-5 border-b border-teal-100">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h3 className="text-xl font-bold text-teal-900">{condition.name}</h3>
                            <p className="text-sm text-teal-700 mt-1 opacity-90">{condition.description}</p>
                        </div>
                        {/* Premium Report Download Button */}
                        <div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadReport}
                                disabled={isGenerating}
                                className={isPremium
                                    ? "bg-white text-teal-700 hover:bg-teal-50 border-teal-200 gap-2 h-9"
                                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 gap-2 h-9"
                                }
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : !isPremium ? (
                                    <Lock className="h-3.5 w-3.5" />
                                ) : (
                                    <Share2 className="h-4 w-4" />
                                )}
                                {isGenerating ? "Exporting..." : !isPremium ? "Unlock Report" : "Share Report"}
                            </Button>
                        </div>
                    </div>

                    {/* 3. CONFIDENCE VISUALIZATION */}
                    <div className="bg-white/60 p-3 rounded-lg border border-teal-100/50 mt-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="h-4 w-4 text-teal-600" />
                            <span className="text-xs font-semibold text-teal-800 uppercase tracking-wide">
                                Diagnostic Confidence
                            </span>
                        </div>

                        {uncertainty && showUncertaintyDetails ? (
                            <div>
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-2xl font-bold text-teal-900">
                                        {uncertainty.pointEstimate.toFixed(0)}%
                                    </span>
                                    <span className="text-xs text-teal-600 font-medium mb-1">
                                        Range: {uncertainty.confidenceInterval.lower.toFixed(0)}% - {uncertainty.confidenceInterval.upper.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="w-full bg-teal-100 rounded-full h-2 mb-2 relative overflow-hidden">
                                    <div
                                        className="bg-teal-500 h-full rounded-full opacity-30 absolute"
                                        style={{
                                            left: `${uncertainty.confidenceInterval.lower}%`,
                                            width: `${uncertainty.confidenceInterval.upper - uncertainty.confidenceInterval.lower}%`
                                        }}
                                    />
                                    <div
                                        className="bg-teal-600 h-full rounded-full absolute"
                                        style={{ width: `${uncertainty.pointEstimate}%` }}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="text-[10px] bg-white border-teal-200 text-teal-700">
                                        Evidence: {uncertainty.evidenceQuality}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] bg-white border-teal-200 text-teal-700">
                                        {uncertainty.calibrationQuality} Calibration
                                    </Badge>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Badge className="bg-teal-600">
                                    {confidence > 90 ? "High" : confidence > 60 ? "Moderate" : "Low"} Match
                                </Badge>
                                <span className="text-sm text-teal-600">({confidence}% match score)</span>
                            </div>
                        )}
                    </div>
                </div>

                <CardContent className="p-0">
                    {/* 4. CLINICAL RULES */}
                    {clinicalRules.length > 0 && (
                        <div className="bg-slate-50 p-4 border-b border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <Info className="h-3 w-3" /> Clinical Rules Applied
                            </h4>
                            <div className="space-y-2">
                                {clinicalRules.map((rule, idx) => (
                                    <div key={idx} className="text-xs bg-white p-2 rounded border border-slate-200 text-slate-700">
                                        <span className="font-semibold text-slate-900">{rule.rule}:</span> {rule.interpretation}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 4b. DETAILED EXPLANATIONS */}
                    {showDetailedExplanations && reasoningTrace && reasoningTrace.length > 0 && (
                        <div className="bg-white p-4 border-b border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                                <FileText className="h-3 w-3" /> Diagnostic Reasoning
                            </h4>
                            <div className="space-y-2">
                                {reasoningTrace
                                    .filter(trace => Math.abs(trace.impact) > 0.5) // Filter out minor factors
                                    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)) // Sort by impact
                                    .slice(0, 5) // Top 5 factors
                                    .map((trace, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <span className="text-slate-700 font-medium">{trace.factor}</span>
                                            <Badge
                                                variant="outline"
                                                className={`ml-2 text-[10px] h-5 ${trace.impact > 0
                                                    ? "text-teal-700 bg-teal-50 border-teal-200"
                                                    : "text-red-700 bg-red-50 border-red-200"
                                                    }`}
                                            >
                                                {trace.impact > 0 ? "+" : ""}{trace.impact > 2 ? "High Impact" : "Contributing"}
                                            </Badge>
                                        </div>
                                    ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-3 italic">
                                *Analysis based on reported symptoms and medical knowledge base.
                            </p>
                        </div>
                    )}

                    {/* 5. REMEDIES TABS — Pill-Style */}
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                Recommended Care
                            </h4>
                        </div>

                        {/* Pill-style tab toggles */}
                        <div className="flex flex-wrap gap-2">
                            {(condition.indianHomeRemedies?.length ?? 0) > 0 && (
                                <button
                                    onClick={() => setActiveTab("home_remedies")}
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === "home_remedies"
                                        ? "bg-amber-500 text-white shadow-sm"
                                        : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                                        }`}
                                >
                                    🌿 Home Remedies
                                </button>
                            )}
                            {(condition.remedies?.length ?? 0) > 0 && (
                                <button
                                    onClick={() => setActiveTab("homeopathic")}
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === "homeopathic"
                                        ? "bg-teal-600 text-white shadow-sm"
                                        : "bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100"
                                        }`}
                                >
                                    💊 Homeopathic Solution
                                </button>
                            )}
                            {((condition.warnings?.length ?? 0) > 0 || (condition.exercises?.length ?? 0) > 0) && (
                                <button
                                    onClick={() => setActiveTab("exercise_warning")}
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === "exercise_warning"
                                        ? "bg-red-500 text-white shadow-sm"
                                        : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                                        }`}
                                >
                                    ⚠️ Exercise Warning
                                </button>
                            )}
                        </div>

                        {/* Tab Content */}
                        <div className="space-y-3 mt-2">
                            {/* Home Remedies Tab */}
                            {activeTab === "home_remedies" && (condition.indianHomeRemedies || []).slice(0, 5).map((remedy, idx) => (
                                <div key={idx} className="bg-amber-50 p-3 rounded-lg border border-amber-100 hover:border-amber-200 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-amber-800 text-sm">{remedy.name}</span>
                                    </div>
                                    <p className="text-xs text-amber-700 mt-1">{remedy.description}</p>
                                    {remedy.method && <p className="text-xs text-amber-800 mt-1 italic">How to use: {remedy.method}</p>}
                                    {remedy.ingredients?.length > 0 && (
                                        <p className="text-xs text-amber-600 mt-1">Ingredients: {remedy.ingredients.join(', ')}</p>
                                    )}
                                </div>
                            ))}

                            {/* Homeopathic Solution Tab */}
                            {activeTab === "homeopathic" && (condition.remedies || []).slice(0, 5).map((remedy, idx) => (
                                <div key={idx} className="bg-teal-50 p-3 rounded-lg border border-teal-100 hover:border-teal-200 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="font-medium text-teal-800 text-sm">{remedy.name}</span>
                                            {(remedy as any).potency && (
                                                <span className="ml-2 text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                                                    {(remedy as any).potency}
                                                </span>
                                            )}
                                        </div>
                                        {remedy.videoUrl && (
                                            <a href={remedy.videoUrl} target="_blank" rel="noreferrer" className="text-teal-600 hover:text-teal-700">
                                                <Video size={16} />
                                            </a>
                                        )}
                                    </div>
                                    <p className="text-xs text-teal-700 mt-1">{remedy.description}</p>
                                    {remedy.method && <p className="text-xs text-teal-800 mt-1 italic">How to take: {remedy.method}</p>}
                                    {(remedy as any).source && (
                                        <span className="inline-block mt-1.5 text-[10px] bg-teal-100/60 text-teal-600 px-2 py-0.5 rounded-full">
                                            Source: {(remedy as any).source}
                                        </span>
                                    )}
                                </div>
                            ))}

                            {/* Exercise Warning Tab */}
                            {activeTab === "exercise_warning" && (
                                <div className="space-y-3">
                                    {/* Warnings */}
                                    {(condition.warnings || []).length > 0 && (
                                        <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                            <h5 className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                Precautions & Contraindications
                                            </h5>
                                            <ul className="space-y-1.5">
                                                {(condition.warnings || []).map((warning, idx) => (
                                                    <li key={idx} className="text-xs text-red-700 flex items-start gap-2">
                                                        <span className="text-red-400 mt-0.5">•</span>
                                                        <span>{warning}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {/* Exercises (if any) */}
                                    {(condition.exercises || []).length > 0 && (
                                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                            <h5 className="text-xs font-bold text-orange-700 mb-2 flex items-center gap-1.5">
                                                <Dumbbell className="h-3.5 w-3.5" />
                                                Exercise Recommendations
                                            </h5>
                                            <div className="space-y-2">
                                                {(condition.exercises || []).slice(0, 4).map((exercise, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-orange-400">•</span>
                                                            <span className="text-orange-800 font-medium">{exercise.name}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {exercise.duration && (
                                                                <span className="text-[10px] text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" /> {exercise.duration}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(condition.warnings || []).length === 0 && (condition.exercises || []).length === 0 && (
                                        <p className="text-xs text-slate-500 italic p-3">No specific exercise warnings for this condition.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PHASE 2 — Book a Doctor CTA */}
                    {/* {showBookDoctor && (
                        <div className="p-4 border-t border-slate-100">
                            <div className={`p-4 rounded-xl ${shouldRecommendDoctor ? 'bg-gradient-to-r from-teal-600 to-teal-700' : 'bg-slate-100'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${shouldRecommendDoctor ? 'bg-white/20' : 'bg-white'}`}>
                                        <Stethoscope className={`h-6 w-6 ${shouldRecommendDoctor ? 'text-white' : 'text-slate-600'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`font-semibold ${shouldRecommendDoctor ? 'text-white' : 'text-slate-900'}`}>
                                            {shouldRecommendDoctor ? 'Consult a Doctor' : 'Want Expert Opinion?'}
                                        </h4>
                                        <p className={`text-sm ${shouldRecommendDoctor ? 'text-teal-100' : 'text-slate-600'}`}>
                                            {shouldRecommendDoctor
                                                ? 'Get professional advice for your symptoms'
                                                : 'Book a consultation with a verified doctor'}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => setShowBookingModal(true)}
                                        className={shouldRecommendDoctor
                                            ? 'bg-white text-teal-700 hover:bg-teal-50 shadow-lg'
                                            : 'bg-teal-600 text-white hover:bg-teal-700'
                                        }
                                    >
                                        Book Now
                                        <ArrowRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )} */}

                    {/* Phase 1 — Disclaimer (Always Visible) */}
                    <div className="p-4 border-t border-amber-100 bg-amber-50/50">
                        <p className="text-xs text-amber-700 leading-relaxed">
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            <strong>Disclaimer:</strong> Healio is an AI health assistant for informational purposes only. This is not a medical diagnosis. Please consult a qualified healthcare professional for treatment. These suggestions are for informational purposes only — please consult a qualified homeopathic practitioner before taking any remedy.
                        </p>
                    </div>

                    {/* 7. PRIVACY FOOTER */}
                    <div className="bg-slate-50 p-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Shield className="h-3 w-3" />
                            <span>Analysis is encrypted & private</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                            AI-assisted • For informational purposes only
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* PHASE 2 — Booking Modal */}
            {/* <DoctorSelectionModal
                open={showBookingModal}
                onOpenChange={setShowBookingModal}
                diagnosisId={diagnosisId}
                diagnosisSnapshot={{
                    condition: condition.name,
                    confidence,
                    symptoms,
                    warnings: allWarnings,
                }}
                onBookingComplete={handleBookingComplete}
            /> */}

            {/* Premium Upgrade Modal */}
            <PlanSelectionModal
                open={showUpgradeModal}
                onOpenChange={setShowUpgradeModal}
                featureLocked="Medical Reports"
            />
        </>
    );
}
