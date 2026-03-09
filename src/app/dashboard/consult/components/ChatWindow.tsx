"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "../hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { PainSliderWidget } from "./PainSliderWidget";
import { QuickReplyChips } from "./QuickReplyChips";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { detectWidget } from "@/lib/chat/widgetDetection";

interface ChatWindowProps {
    messages: ChatMessage[];
    isLoading: boolean;
    onSendMessage?: (text: string) => void;
}

export function ChatWindow({ messages, isLoading, onSendMessage }: ChatWindowProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // Empty state — show a welcoming hero with starter prompts
    if (messages.length === 0 && !isLoading) {
        const starterPrompts = [
            "I have had a persistent headache for 3 days",
            "I have been running a fever since yesterday",
            "I am experiencing stomach pain and nausea",
            "I have a skin rash on my arms",
        ];

        return (
            <div className="flex-1 flex items-center justify-center px-4 py-10 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="text-center w-full max-w-2xl mx-auto"
                >
                    <div className="w-[72px] h-[72px] bg-teal-700 rounded-[20px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-teal-900/10">
                        <Sparkles className="text-white fill-white/10" size={32} strokeWidth={1.5} />
                    </div>

                    <h1 style={{ fontFamily: "var(--font-dm-serif), serif", fontSize: "32px", fontWeight: 400, color: "#111827", lineHeight: 1.2, letterSpacing: "-0.02em" }} className="mb-4">
                        How can I help you today?
                    </h1>

                    <p className="text-slate-500 text-[16px] leading-relaxed">
                        I am Healio, your homeopathic health assistant.
                    </p>
                    <p className="text-slate-400 text-[15px] mt-1.5 mb-10">
                        Respond in Hindi, English, or Hinglish — your choice.
                    </p>

                    {/* Starter Prompt Chips — 2x2 Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto mb-10">
                        {starterPrompts.map((prompt, i) => (
                            <motion.button
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
                                onClick={() => onSendMessage?.(prompt)}
                                className="text-left p-4 bg-white border border-slate-200 rounded-xl text-[14.5px] text-slate-700 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-900 transition-all duration-200 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.03)] hover:shadow-md cursor-pointer h-auto min-h-[72px] flex items-center leading-snug"
                            >
                                {prompt}
                            </motion.button>
                        ))}
                    </div>

                    {/* Trust signal - Official Badge Pattern */}
                    <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-full">
                        <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.0833 6.33333H2.91667C2.27233 6.33333 1.75 6.85567 1.75 7.5V12.1667C1.75 12.811 2.27233 13.3333 2.91667 13.3333H11.0833C11.7277 13.3333 12.25 12.811 12.25 12.1667V7.5C12.25 6.85567 11.7277 6.33333 11.0833 6.33333Z" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M4.08337 6.33333V4C4.08337 3.22645 4.39067 2.48455 4.93765 1.93756C5.48463 1.39058 6.22653 1.08333 7.00004 1.08333C7.77355 1.08333 8.51545 1.39058 9.06243 1.93756C9.60942 2.48455 9.91671 3.22645 9.91671 4V6.33333" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-slate-500 text-[13px] font-medium tracking-wide">
                            Your conversation is private and encrypted
                        </span>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Detect widget for the last assistant message
    const lastMessage = messages[messages.length - 1];
    const isLastAssistant =
        lastMessage?.role === "assistant" &&
        !isLoading &&
        !lastMessage.content.includes("```json");

    const widgetHint = isLastAssistant
        ? detectWidget(lastMessage.content)
        : { type: "none" as const };

    return (
        <div className="flex-1 overflow-y-auto py-6 space-y-4">
            {messages.map((msg, index) => {
                const isLast = index === messages.length - 1;
                return (
                    <div key={msg.id} className="space-y-4">
                        <MessageBubble message={msg} />

                        <AnimatePresence>
                            {isLast && isLastAssistant && widgetHint.type === "pain_slider" && onSendMessage && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="pl-14 px-4 overflow-hidden"
                                >
                                    <PainSliderWidget onSubmit={(val) => onSendMessage(`${val}/10`)} />
                                </motion.div>
                            )}

                            {isLast && isLastAssistant && widgetHint.type === "quick_reply" && onSendMessage && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <QuickReplyChips
                                        options={widgetHint.options}
                                        onSelect={(opt) => onSendMessage(opt)}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}

            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} className="h-4" />
        </div>
    );
}
