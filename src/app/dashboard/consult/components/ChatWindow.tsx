"use client";

import { useRef, useEffect } from "react";
import { ChatMessage, DiagnosticPreferences } from "../hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { PainSliderWidget } from "./PainSliderWidget";
import { PainLocationDropdown } from "./PainLocationDropdown";
import { QuickReplyChips } from "./QuickReplyChips";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface ChatWindowProps {
    messages: ChatMessage[];
    isLoading: boolean;
    onSendMessage?: (text: string) => void;
    onWidgetActive?: (active: boolean) => void;
    diagnosticPreferences: DiagnosticPreferences;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseUiHint(content: string): any {
    const hintMatch = content.match(/\{"ui_hint"\s*:/);
    if (!hintMatch || hintMatch.index === undefined) return null;
    
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
            return JSON.parse(validJsonStr)?.ui_hint || null;
        }
    } catch {
        return null;
    }
    return null;
}

export function ChatWindow({ messages, isLoading, onSendMessage, onWidgetActive, diagnosticPreferences }: ChatWindowProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // Detect widget for the last assistant message
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const isLastAssistant =
        lastMessage?.role === "assistant" &&
        !lastMessage.isRecap &&
        !isLoading &&
        !lastMessage.content.includes("```json");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let widgetHint: any = { type: "none" };
    if (isLastAssistant) {
        const explicitHint = parseUiHint(lastMessage.content);
        if (explicitHint) {
            if (explicitHint.type === "chips" || explicitHint.type === "dropdown") {
                widgetHint = { type: "quick_reply", options: explicitHint.options || [] };
            } else if (explicitHint.type === "slider") {
                widgetHint = { type: "pain_slider" };
            }
        }
    }

    const hasActiveWidget = widgetHint.type !== "none";

    // Report widget state to parent
    useEffect(() => {
        onWidgetActive?.(hasActiveWidget);
    }, [hasActiveWidget, onWidgetActive]);

    // Empty state: show a welcoming hero with starter prompts
    if (messages.length === 0 && !isLoading) {
        const starterPrompts = [
            "I have had a persistent headache for 3 days",
            "I have been running a fever since yesterday",
            "I am experiencing stomach pain and nausea",
            "I have a skin rash on my arms",
        ];

        return (
            <div className="min-h-0 w-full flex-1 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="mx-auto w-full max-w-2xl px-4 pb-8 pt-8 text-center"
                >
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[18px] bg-teal-700 text-white shadow-xl shadow-teal-900/10">
                        <Sparkles className="fill-white/10" size={28} strokeWidth={1.5} aria-hidden="true" />
                    </div>

                    <h1
                        style={{ fontFamily: "var(--font-dm-serif), serif" }}
                        className="mb-3 text-[clamp(24px,7vw,32px)] font-normal leading-tight tracking-normal text-slate-900"
                    >
                        How can I help you today?
                    </h1>

                    <p className="text-[15px] leading-relaxed text-slate-500">
                        I am Healio, your homeopathic health assistant.
                    </p>
                    <p className="mb-7 mt-1.5 text-[14px] text-slate-400">
                        Respond in Hindi, English, or Hinglish - your choice.
                    </p>

                    {/* Starter Prompt Chips */}
                    <div className="mx-auto mb-7 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                        {starterPrompts.map((prompt, i) => (
                            <motion.button
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
                                onClick={() => onSendMessage?.(prompt)}
                                className="flex min-h-[60px] cursor-pointer items-center rounded-xl border border-slate-200 bg-white p-3.5 text-left text-[14px] leading-snug text-slate-700 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.03)] transition-all duration-200 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-900 hover:shadow-md"
                            >
                                {prompt}
                            </motion.button>
                        ))}
                    </div>

                    {/* Trust signal */}
                    <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                        <span className="grid h-3.5 w-3.5 place-items-center rounded-full border border-slate-400 text-[9px] text-slate-500">
                            i
                        </span>
                        <span className="text-[12px] font-medium tracking-wide text-slate-500">
                            Your conversation is private and encrypted
                        </span>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-0 flex-1 overflow-y-auto py-6">
            <div className="mx-auto max-w-3xl space-y-5 px-4">
                {messages.map((msg, index) => {
                    const isLast = index === messages.length - 1;
                    return (
                        <div key={msg.id} className="space-y-4">
                            <MessageBubble message={msg} diagnosticPreferences={diagnosticPreferences} />

                            <AnimatePresence>
                                {isLast && isLastAssistant && widgetHint.type === "pain_slider" && onSendMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden px-4 pl-14"
                                    >
                                        <PainSliderWidget onSubmit={(val) => onSendMessage(`${val}/10`)} />
                                    </motion.div>
                                )}

                                {isLast && isLastAssistant && widgetHint.type === "pain_location" && onSendMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden px-4 pl-14"
                                    >
                                        <PainLocationDropdown onSubmit={(loc) => onSendMessage(loc)} />
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
                <div ref={bottomRef} className="h-1" />
            </div>
        </div>
    );
}
