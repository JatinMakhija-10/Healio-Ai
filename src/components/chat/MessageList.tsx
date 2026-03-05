"use client";

import { useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DiagnosisResultCard } from "./DiagnosisResultCard";
import { Bot, User } from "lucide-react";
import { motion } from "framer-motion";
import type { DiagnosisMessage } from "./useDiagnosisChat";

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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    return (
        <div className="flex-1 overflow-y-auto space-y-6 pr-4 pb-4">
            {messages.map((msg) => (
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
                            {msg.content}
                        </div>

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
            ))}

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
