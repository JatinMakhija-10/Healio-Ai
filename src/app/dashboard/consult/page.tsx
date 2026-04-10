"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChatWindow } from "./components/ChatWindow";
import { InputBar } from "./components/InputBar";
import { useChat } from "./hooks/useChat";
import { useVoiceInput } from "./hooks/useVoiceInput";
import { useAuth } from "@/context/AuthContext";

// ─── Persona Required Banner ──────────────────────────────────────────────────
function PersonaRequiredBanner() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center h-[calc(100dvh-64px)] bg-[#F7F8FA] p-6">
            <div className="w-full max-w-md text-center space-y-6">
                {/* Icon */}
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-teal-100 rounded-full animate-pulse opacity-40" />
                    <div className="relative w-24 h-24 rounded-full bg-white border border-teal-100 shadow-md flex items-center justify-center">
                        <svg
                            className="w-12 h-12 text-teal-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Heading */}
                <div className="space-y-2">
                    <h2
                        className="text-2xl font-bold text-slate-900 tracking-tight"
                        style={{ fontFamily: "var(--font-dm-serif), serif" }}
                    >
                        Persona Not Built
                    </h2>
                    <p className="text-[15px] text-slate-500 leading-relaxed">
                        Complete your health persona first so Healio can understand your medical background,
                        current medications, and allergies before giving you personalised advice.
                    </p>
                </div>

                {/* Features */}
                <div className="grid gap-2.5 text-left">
                    {[
                        { icon: "🧬", label: "Your medical profile is used to personalise every response" },
                        { icon: "💊", label: "Current medications help flag dangerous drug interactions" },
                        { icon: "⚡", label: "Allergy info prevents unsafe prescription recommendations" },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="flex items-start gap-3 bg-white rounded-xl border border-slate-100 px-4 py-3 shadow-sm"
                        >
                            <span className="text-lg leading-none mt-0.5">{item.icon}</span>
                            <p className="text-sm text-slate-600 leading-snug">{item.label}</p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <button
                    onClick={() => router.push("/onboarding")}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold text-[15px] shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-100"
                >
                    Build My Persona →
                </button>

                <Link
                    href="/dashboard"
                    className="block text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                    Back to dashboard
                </Link>
            </div>
        </div>
    );
}

// ─── Main Consult Page ────────────────────────────────────────────────────────
export default function ConsultPage() {
    const { user, loading } = useAuth();
    const { messages, isLoading, sendMessage, resetChat } = useChat();
    const [widgetActive, setWidgetActive] = useState(false);
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

    // Show nothing while auth resolves
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100dvh-64px)] bg-[#F7F8FA]">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // ── PERSONA GUARD ──
    const isPersonaBuilt = Boolean(
        user?.user_metadata?.medical_profile?.onboarding_completed ||
        user?.user_metadata?.onboarding_completed
    );

    if (!isPersonaBuilt) {
        return <PersonaRequiredBanner />;
    }

    return (
        <div className="flex flex-col h-[calc(100dvh-64px)] bg-[#F7F8FA]">
            {/* Chat Messages */}
            <ChatWindow
                messages={messages}
                isLoading={isLoading}
                onSendMessage={sendMessage}
                onWidgetActive={handleWidgetActive}
            />

            {/* New Consultation button when chat has ended */}
            {messages.length > 0 &&
                !isLoading &&
                messages[messages.length - 1]?.role === "assistant" &&
                messages[messages.length - 1]?.content.includes("```json") && (
                    <div className="flex justify-center py-3">
                        <button
                            onClick={() => {
                                if (window.confirm("Are you sure? Your current chat will be saved.")) {
                                    resetChat();
                                }
                            }}
                            className="px-6 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-full hover:bg-teal-700 transition-all hover:scale-105 shadow-md"
                        >
                            ✨ Start New Consultation
                        </button>
                    </div>
                )}

            {/* Input Bar */}
            <InputBar
                onSend={sendMessage}
                disabled={isLoading}
                widgetActive={widgetActive}
                isRecording={isRecording}
                voiceSupported={isSupported}
                transcript={transcript}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onClearTranscript={clearTranscript}
            />
        </div>
    );
}
