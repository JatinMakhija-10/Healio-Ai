"use client";

import { useRef, useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DiagnosisResultCard } from "./DiagnosisResultCard";
import { Bot, User } from "lucide-react";
import { motion } from "framer-motion";
import type { DiagnosisMessage, UiHint } from "./useDiagnosisChat";

function parseUiHint(content: string): { cleanText: string; hint: UiHint | null } {
    const hintMatch = content.match(/\{"ui_hint"\s*:/);
    if (!hintMatch || hintMatch.index === undefined) return { cleanText: content.trim(), hint: null };
    
    const startIndex = hintMatch.index;
    const stringFromHint = content.substring(startIndex);
    
    try {
        let openBraces = 0;
        let endIndex = -1;
        for (let i = 0; i < stringFromHint.length; i++) {
            if (stringFromHint[i] === '{') openBraces++;
            if (stringFromHint[i] === '}') openBraces--;
            if (openBraces === 0 && i > 0) {
                endIndex = i;
                break;
            }
        }
        
        if (endIndex !== -1) {
            const validJsonStr = stringFromHint.substring(0, endIndex + 1);
            const parsed = JSON.parse(validJsonStr);
            if (parsed?.ui_hint) {
                const cleanText = content.substring(0, startIndex) + stringFromHint.substring(endIndex + 1);
                return {
                    cleanText: cleanText.trim(),
                    hint: parsed.ui_hint as UiHint,
                };
            }
        }
    } catch (e) {
        console.error("Failed to parse ui_hint", e);
    }
    
    // Fallback: strip anything from ui_hint onwards to prevent JSON text leak
    return { cleanText: content.substring(0, startIndex).trim(), hint: null };
}

// ── Chip selector component ───────────────────────────────────────────────────
function ChipSelector({
    options,
    onSelect,
}: {
    options: string[];
    onSelect: (val: string) => void;
}) {
    const [selected, setSelected] = useState<string | null>(null);
    return (
        <div className="flex flex-wrap gap-2 mt-2">
            {options.map((opt) => (
                <button
                    key={opt}
                    onClick={() => {
                        setSelected(opt);
                        onSelect(opt);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150
                        ${selected === opt
                            ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700"
                        }`}
                >
                    {opt}
                </button>
            ))}
        </div>
    );
}

// ── Severity slider component ─────────────────────────────────────────────────
function SeveritySlider({
    min,
    max,
    onSelect,
}: {
    min: number;
    max: number;
    onSelect: (val: string) => void;
}) {
    const [value, setValue] = useState([5]);
    const submitted = useRef(false);

    const SEVERITY_LABELS: Record<number, string> = {
        1: "Very mild",
        2: "Mild",
        3: "Mild-moderate",
        4: "Moderate",
        5: "Moderate",
        6: "Moderate-severe",
        7: "Severe",
        8: "Very severe",
        9: "Intense",
        10: "Unbearable",
    };

    return (
        <div className="mt-3 space-y-3 px-1">
            <div className="flex justify-between text-xs text-slate-500 px-1">
                <span>{min} — {SEVERITY_LABELS[min] || "Minimal"}</span>
                <span className="font-semibold text-teal-600 text-sm">
                    {value[0]}/10
                </span>
                <span>{max} — {SEVERITY_LABELS[max] || "Maximum"}</span>
            </div>
            <Slider
                min={min}
                max={max}
                step={1}
                value={value}
                onValueChange={setValue}
                className="w-full"
            />
            <p className="text-center text-xs text-slate-500 italic">
                {SEVERITY_LABELS[value[0]] || ""}
            </p>
            <div className="flex justify-center">
                <button
                    onClick={() => {
                        if (!submitted.current) {
                            submitted.current = true;
                            onSelect(`${value[0]}/10 — ${SEVERITY_LABELS[value[0]] || ""}`);
                        }
                    }}
                    className="px-5 py-2 bg-teal-600 text-white text-xs font-semibold rounded-full hover:bg-teal-700 transition-colors"
                >
                    Confirm Severity
                </button>
            </div>
        </div>
    );
}

// ── Structured input renderer ─────────────────────────────────────────────────
function UiHintControl({
    hint,
    onSelect,
}: {
    hint: UiHint;
    onSelect: (val: string) => void;
}) {
    if (hint.type === "chips" || hint.type === "dropdown") {
        return <ChipSelector options={hint.options ?? []} onSelect={onSelect} />;
    }
    if (hint.type === "slider") {
        return (
            <SeveritySlider
                min={hint.min ?? 1}
                max={hint.max ?? 10}
                onSelect={onSelect}
            />
        );
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────

interface MessageListProps {
    messages: DiagnosisMessage[];
    isTyping: boolean;
    isComplete: boolean;
    preferences: {
        ayurvedicMode: boolean;
        showUncertainty: boolean;
        detailedExplanations: boolean;
    };
    onOptionSelect: (option: string) => void;
    onReset: () => void;
}

export function MessageList({
    messages,
    isTyping,
    isComplete,
    preferences,
    onOptionSelect,
    onReset,
}: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // Track which message hints have been answered so they disappear after selection
    const [answeredHints, setAnsweredHints] = useState<Set<string>>(new Set());

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleHintSelect = (msgId: string, value: string) => {
        setAnsweredHints((prev) => new Set([...prev, msgId]));
        onOptionSelect(value);
    };

    return (
        <div className="flex-1 overflow-y-auto space-y-6 pr-4 pb-4">
            {messages.map((msg) => {
                // Parse any ui_hint from the message content
                const { cleanText, hint } = msg.role === "assistant"
                    ? parseUiHint(msg.content)
                    : { cleanText: msg.content, hint: null };

                const isLastAssistantMsg =
                    msg.role === "assistant" &&
                    messages.filter((m) => m.role === "assistant").at(-1)?.id === msg.id;

                const showHint =
                    hint &&
                    isLastAssistantMsg &&
                    !answeredHints.has(msg.id) &&
                    !isComplete;

                return (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                        <Avatar className="w-8 h-8 border border-slate-200">
                            <AvatarFallback
                                className={
                                    msg.role === "assistant"
                                        ? "bg-teal-600 text-white"
                                        : "bg-slate-200"
                                }
                            >
                                {msg.role === "assistant" ? (
                                    <Bot size={16} />
                                ) : (
                                    <User size={16} />
                                )}
                            </AvatarFallback>
                        </Avatar>

                        <div className="space-y-2 max-w-[80%]">
                            <div
                                className={`p-3 rounded-lg text-sm ${
                                    msg.role === "assistant"
                                        ? "bg-white border border-slate-200 text-slate-800 shadow-sm"
                                        : "bg-slate-900 text-white"
                                }`}
                            >
                                {/* Show cleaned text (without the raw JSON hint) */}
                                <p className="whitespace-pre-wrap">{cleanText}</p>

                                {/* Render structured UI control inline under the message bubble */}
                                {showHint && (
                                    <UiHintControl
                                        hint={hint}
                                        onSelect={(val) => handleHintSelect(msg.id, val)}
                                    />
                                )}
                            </div>

                            {/* Legacy options (from old diagnosis engine ClarificationQuestion.options) */}
                            {msg.type === "options" && msg.options && (
                                <div className="flex flex-wrap gap-2">
                                    {msg.options.map((opt) => (
                                        <Button
                                            key={opt}
                                            variant="outline"
                                            className="text-xs bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200"
                                            onClick={() => onOptionSelect(opt)}
                                        >
                                            {opt}
                                        </Button>
                                    ))}
                                </div>
                            )}

                            {msg.type === "diagnosis_card" && msg.diagnosis && (
                                <DiagnosisResultCard
                                    condition={msg.diagnosis.condition}
                                    confidence={msg.diagnosis.confidence}
                                    uncertainty={msg.uncertainty}
                                    clinicalRules={msg.clinicalRules}
                                    alerts={msg.alerts}
                                    showIndianRemedies={preferences.ayurvedicMode}
                                    showUncertaintyDetails={preferences.showUncertainty}
                                    showDetailedExplanations={preferences.detailedExplanations}
                                    reasoningTrace={msg.diagnosis.reasoningTrace}
                                />
                            )}
                        </div>
                    </motion.div>
                );
            })}

            {isTyping && (
                <div className="flex gap-3">
                    <Avatar className="w-8 h-8 border border-slate-200">
                        <AvatarFallback className="bg-teal-600 text-white">
                            <Bot size={16} />
                        </AvatarFallback>
                    </Avatar>
                    <div className="bg-white border border-slate-200 p-3 rounded-lg flex gap-1 items-center h-10 w-16">
                        <div
                            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                        />
                        <div
                            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                        />
                        <div
                            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                        />
                    </div>
                </div>
            )}

            {isComplete && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center pt-4"
                >
                    <Button
                        onClick={onReset}
                        className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-md px-6 py-6 rounded-xl"
                    >
                        Start New Diagnosis
                    </Button>
                </motion.div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
}
