"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "../hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { PainSliderWidget } from "./PainSliderWidget";
import { PainLocationDropdown } from "./PainLocationDropdown";
import { QuickReplyChips } from "./QuickReplyChips";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpenCheck, HeartPulse, Leaf, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { detectWidget } from "@/lib/chat/widgetDetection";

interface ChatWindowProps {
    messages: ChatMessage[];
    isLoading: boolean;
    onSendMessage?: (text: string) => void;
    onWidgetActive?: (active: boolean) => void;
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

export function ChatWindow({ messages, isLoading, onSendMessage, onWidgetActive }: ChatWindowProps) {
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
        } else {
            widgetHint = detectWidget(lastMessage.content);
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
            {
                icon: HeartPulse,
                label: "Monsoon fever",
                prompt: "Mujhe mild fever aur cough hai. Ghar par kya safe hai?",
            },
            {
                icon: Leaf,
                label: "Acidity after dinner",
                prompt: "Spicy dinner ke baad acidity aur heaviness ho rahi hai.",
            },
            {
                icon: Sparkles,
                label: "Sleep and stress",
                prompt: "Kaafi stress hai aur neend theek nahi aa rahi.",
            },
            {
                icon: Stethoscope,
                label: "Dadi's remedy check",
                prompt: "Ghar ka kadha ya home remedy try karne se pehle kya dhyan rakhu?",
            },
        ];

        return (
            <div className="w-full flex-1 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="mx-auto w-full max-w-3xl px-4 pb-36 pt-8 text-center"
                >
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[8px] bg-[#1D9E75] text-white shadow-sm">
                        <Leaf size={30} strokeWidth={2.3} aria-hidden="true" />
                    </div>

                    <h1
                        style={{ fontFamily: "var(--font-dm-serif), serif" }}
                        className="mb-3 text-[clamp(28px,7vw,40px)] font-semibold leading-tight text-[#1A1A2E]"
                    >
                        What is happening at home today?
                    </h1>

                    <p className="mx-auto max-w-xl text-[15px] leading-relaxed text-[#555555]">
                        Tell Healio the concern in Hindi, English, or Hinglish. You will get calm home-care context, Ayurvedic/homeopathic boundaries, safety limits, and doctor signals when needed.
                    </p>

                    <div className="mx-auto mt-5 grid max-w-2xl gap-2 sm:grid-cols-3">
                        {[
                            { icon: Leaf, label: "Ayurveda context" },
                            { icon: BookOpenCheck, label: "100+ sources" },
                            { icon: ShieldCheck, label: "Doctor signals" },
                        ].map((item) => (
                            <div
                                className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#DAD7CF] bg-white px-3 text-xs font-bold text-[#0F6E56] shadow-sm"
                                key={item.label}
                            >
                                <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                                {item.label}
                            </div>
                        ))}
                    </div>

                    {/* Starter Prompt Chips */}
                    <div className="mx-auto mb-7 mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                        {starterPrompts.map((item, i) => (
                            <motion.button
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
                                onClick={() => onSendMessage?.(item.prompt)}
                                className="flex min-h-[92px] cursor-pointer items-start gap-3 rounded-[8px] border border-[#DAD7CF] bg-white p-4 text-left shadow-sm transition duration-200 hover:border-[#9FE1CB] hover:bg-[#E1F5EE]"
                            >
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-[#E1F5EE] text-[#0F6E56]">
                                    <item.icon className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <span>
                                    <span className="block text-sm font-bold text-[#1A1A2E]">{item.label}</span>
                                    <span className="mt-1 block text-sm leading-5 text-[#555555]">{item.prompt}</span>
                                </span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Trust signal */}
                    <div className="inline-flex items-center gap-2.5 rounded-full border border-[#DAD7CF] bg-white px-4 py-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#0F6E56]" aria-hidden="true" />
                        <span className="text-[12px] font-medium tracking-wide text-[#6B6B6B]">
                            Informational wellness guidance, not emergency care.
                        </span>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto py-6">
            <div className="mx-auto max-w-3xl space-y-5">
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
                <div ref={bottomRef} className="h-4" />
            </div>
        </div>
    );
}
