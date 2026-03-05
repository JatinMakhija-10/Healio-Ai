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

    // Empty state — show a welcoming hero
    if (messages.length === 0 && !isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="text-center max-w-md"
                >
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-200">
                        <Sparkles className="text-white" size={28} />
                    </div>

                    <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                        Namaste! 🙏
                    </h1>
                    <p className="text-gray-500 text-[15px] leading-relaxed">
                        Main Healio hoon — aapka homeopathic health assistant.
                        <br />
                        Batayein, aaj kya taklif hai?
                    </p>
                    <p className="text-gray-400 text-xs mt-4 italic">
                        Hindi, English ya Hinglish — jo bhi comfortable lage
                    </p>
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
