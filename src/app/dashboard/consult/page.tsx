"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChatWindow } from "./components/ChatWindow";
import { InputBar } from "./components/InputBar";
import { useChat } from "./hooks/useChat";
import { useVoiceInput } from "./hooks/useVoiceInput";
import { useAuth } from "@/context/AuthContext";
import { PlanSelectionModal } from "@/components/subscription/PlanSelectionModal";
import type { SubscriptionPlan } from "@/lib/subscription/plans";
import { X, ArrowLeft, History, MessageSquareHeart, Plus, Leaf, ShieldCheck, Pill, AlertTriangle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

// ─── Persona Required Banner ──────────────────────────────────────────────────
function PersonaRequiredBanner() {
    const router = useRouter();

    return (
        <div className="flex h-full flex-col items-center justify-center bg-[#F7F6F2] p-6">
            <div className="w-full max-w-md text-center space-y-6">
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 rounded-full bg-[#C8E7DA] opacity-60" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-[8px] border border-[#B8DED0] bg-white shadow-sm">
                        <Leaf className="h-12 w-12 text-[#0F6E56]" strokeWidth={2.2} />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2
                        className="text-2xl font-bold tracking-tight text-[#1A1A2E]"
                        style={{ fontFamily: "var(--font-dm-serif), serif" }}
                    >
                        Build your health profile first
                    </h2>
                    <p className="text-[15px] leading-relaxed text-[#555555]">
                        Complete your health persona first so Healio can understand your medical background,
                        current medications, and allergies before giving you personalised advice.
                    </p>
                </div>

                <div className="grid gap-2.5 text-left">
                    {[
                        { icon: ShieldCheck, label: "Your medical profile helps personalise each response" },
                        { icon: Pill, label: "Current medications help flag unsafe interactions" },
                        { icon: AlertTriangle, label: "Allergy details reduce avoidable risk" },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="flex items-start gap-3 rounded-[8px] border border-[#DAD7CF] bg-white px-4 py-3 shadow-sm"
                        >
                            <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0F6E56]" aria-hidden="true" />
                            <p className="text-sm leading-snug text-[#555555]">{item.label}</p>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => router.push("/dashboard/assessment/prakriti")}
                    className="w-full rounded-full bg-[#1A1A2E] py-3.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#0F6E56] active:scale-[0.99]"
                >
                    Build my persona
                </button>

                <Link
                    href="/dashboard"
                    className="block text-sm text-[#6B6B6B] transition-colors hover:text-[#1A1A2E]"
                >
                    Back to dashboard
                </Link>
            </div>
        </div>
    );
}

// ─── Follow-up Banner ─────────────────────────────────────────────────────────
function FollowUpBanner({
    conditionName,
    daysSince,
    onClose,
}: {
    conditionName: string;
    daysSince: number;
    onClose: () => void;
}) {
    const router = useRouter();

    const timeLabel =
        daysSince === 0
            ? "earlier today"
            : daysSince === 1
                ? "yesterday"
                : `${daysSince} days ago`;

    return (
        <div className="border-b border-[#B8DED0] bg-[#E1F5EE]">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-white text-[#0F6E56] shadow-sm">
                        <History className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#1A1A2E]">
                            Follow-up: <span className="font-semibold">{conditionName}</span>
                        </p>
                        <p className="text-xs text-[#0F6E56]">
                            Consultation from {timeLabel}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                        onClick={() => router.push("/dashboard/history")}
                        className="flex items-center gap-1 rounded-[8px] px-2 py-1 text-xs text-[#0F6E56] transition-colors hover:bg-white/70 hover:text-[#1A1A2E]"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        History
                    </button>
                    <button
                        onClick={onClose}
                        className="rounded-[8px] p-1 text-[#0F6E56] transition-colors hover:bg-white/70 hover:text-[#1A1A2E]"
                        title="Dismiss banner"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Inner Component (uses useSearchParams) ───────────────────────────────────
function ConsultPageInner() {
    const { user, loading } = useAuth();
    const searchParams = useSearchParams();
    const resumeId = searchParams.get("resumeId");

    const {
        messages,
        isLoading,
        sendMessage,
        resetChat,
        startFollowUpFromDiagnosis,
        resumeContext,
        isResumeMode,
        hasCompletedDiagnosis,
        diagnosticPreferences,
    } = useChat({
        resumeId,
    });

    const [widgetActive, setWidgetActive] = useState(false);
    const [bannerDismissed, setBannerDismissed] = useState(false);
    const [upgradeModal, setUpgradeModal] = useState<{
        open: boolean;
        featureLocked?: string;
        targetPlan: Exclude<SubscriptionPlan, "free">;
    }>({ open: false, targetPlan: "plus" });
    const {
        isRecording,
        transcript,
        isSupported,
        startRecording,
        stopRecording,
        clearTranscript,
    } = useVoiceInput();

    const handleWidgetActive = useCallback((active: boolean) => {
        setWidgetActive(active);
    }, []);

    // Track first message sent in a consultation
    const [hasTrackedStart, setHasTrackedStart] = useState(false);
    const handleSendMessage = useCallback((msg: string) => {
        if (!hasTrackedStart) {
            trackEvent.consultationStarted('text');
            setHasTrackedStart(true);
        }
        sendMessage(msg);
    }, [hasTrackedStart, sendMessage]);

    const handleStartRecording = useCallback(() => {
        if (!hasTrackedStart) {
            trackEvent.consultationStarted('voice');
            setHasTrackedStart(true);
        }
        startRecording();
    }, [hasTrackedStart, startRecording]);

    useEffect(() => {
        const handleUpgradeEvent = (event: Event) => {
            const detail = (event as CustomEvent<{
                featureLocked?: string;
                targetPlan?: Exclude<SubscriptionPlan, "free">;
            }>).detail;
            setUpgradeModal({
                open: true,
                featureLocked: detail?.featureLocked,
                targetPlan: detail?.targetPlan || "plus",
            });
        };

        window.addEventListener("healio:open-upgrade", handleUpgradeEvent);
        return () => window.removeEventListener("healio:open-upgrade", handleUpgradeEvent);
    }, []);

    // Show nothing while auth resolves
    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-[#F7F6F2]">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // ── PERSONA GUARD ──
    // onboarding_completed is set by the full onboarding flow;
    // persona_built is set by the persona builder (/dashboard/assessment/prakriti).
    // Either flag means the user has a usable medical profile.
    const isPersonaBuilt = Boolean(
        user?.user_metadata?.medical_profile?.onboarding_completed ||
        user?.user_metadata?.medical_profile?.persona_built ||
        user?.user_metadata?.onboarding_completed
    );

    if (!isPersonaBuilt) {
        return <PersonaRequiredBanner />;
    }

    return (
        <div
            className="healio-consult-page flex h-full min-h-0 flex-col bg-[#F7F6F2]"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            {/* Follow-up Banner */}
            {isResumeMode && resumeContext && !bannerDismissed && (
                <FollowUpBanner
                    conditionName={resumeContext.conditionName}
                    daysSince={resumeContext.daysSince}
                    onClose={() => setBannerDismissed(true)}
                />
            )}

            {/* Chat Messages */}
            <ChatWindow
                messages={messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                onWidgetActive={handleWidgetActive}
                diagnosticPreferences={diagnosticPreferences}
            />

            {/* Post-diagnosis actions */}
            {hasCompletedDiagnosis && !isLoading && (
                <div className="shrink-0 border-t border-[#E5E3DC] bg-white/90 px-4 py-3 backdrop-blur">
                    <div className="mx-auto flex max-w-3xl flex-col justify-center gap-3 sm:flex-row sm:gap-4">
                        <button
                            onClick={startFollowUpFromDiagnosis}
                            className="flex items-center justify-center gap-2 rounded-full bg-[#1A1A2E] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#0F6E56] active:scale-[0.99]"
                        >
                            <MessageSquareHeart className="h-4 w-4" />
                            Ask Follow-up
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm("Are you sure? Your current chat will be saved.")) {
                                    resetChat();
                                    // Also clear the resumeId from the URL cleanly
                                    if (resumeId) {
                                        window.history.replaceState(null, "", "/dashboard/consult");
                                    }
                                }
                            }}
                            className="flex items-center justify-center gap-2 rounded-full border border-[#DAD7CF] bg-white px-5 py-2.5 text-sm font-medium text-[#1C1C1E] shadow-sm transition hover:border-[#B8DED0] hover:bg-[#E1F5EE] active:scale-[0.99]"
                        >
                            <Plus className="h-4 w-4" />
                            Start New Consultation
                        </button>
                    </div>
                </div>
            )}

            {/* Input Bar */}
            <InputBar
                onSend={handleSendMessage}
                disabled={isLoading}
                widgetActive={widgetActive}
                followUpMode={isResumeMode || hasCompletedDiagnosis}
                isRecording={isRecording}
                voiceSupported={isSupported}
                transcript={transcript}
                onStartRecording={handleStartRecording}
                onStopRecording={stopRecording}
                onClearTranscript={clearTranscript}
            />

            <PlanSelectionModal
                open={upgradeModal.open}
                onOpenChange={(open) => setUpgradeModal((prev) => ({ ...prev, open }))}
                featureLocked={upgradeModal.featureLocked}
                targetPlan={upgradeModal.targetPlan}
            />
        </div>
    );
}

// ─── Main Consult Page (wrapped in Suspense for useSearchParams) ──────────────
export default function ConsultPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-full items-center justify-center bg-[#F7F6F2]">
                    <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <ConsultPageInner />
        </Suspense>
    );
}
