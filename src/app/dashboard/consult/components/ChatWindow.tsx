"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "../hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { PainSliderWidget } from "./PainSliderWidget";
import { QuickReplyChips } from "./QuickReplyChips";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

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
                    {/* Healio Logo */}
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

    // Determine if we should show a widget for the last message
    const lastMessage = messages[messages.length - 1];
    const isLastAssistant = lastMessage?.role === "assistant" && !isLoading && !lastMessage.content.includes("```json");

    let showPainSlider = false;
    let quickReplyOptions: string[] = [];

    if (isLastAssistant) {
        const text = lastMessage.content.toLowerCase();

        // Detect 1-10 pain scale questions
        if (text.includes("1-10") || text.includes("1 se 10") || text.includes("1 to 10") || text.includes("scale of 1")) {
            showPainSlider = true;
        }
        // Detect sensation type questions (burning, pressure, etc in English or Hindi)
        else if (text.includes("burning") || text.includes("jalan") || text.includes("dull") || text.includes("sharp")) {
            quickReplyOptions = ["Burning (Jalan)", "Sharp (Tez Chubhan)", "Dull Ache (Halka Dard)", "Throbbing (Tees maar aana)"];
        }
        // Detect duration questions
        else if (text.includes("how long") || text.includes("kitne samay") || text.includes("kitne dino") || text.includes("kab se")) {
            quickReplyOptions = ["1-2 Days", "Since Morning", "1 Week", "More than a month"];
        }
        // Detect triggers/worse questions
        else if (text.includes("makes it worse") || text.includes("badh jata hai") || text.includes("worse") || text.includes("trigger")) {
            quickReplyOptions = ["Eating", "Movement", "Cold", "Heat", "Stress", "Nothing specific"];
        }
        // General YES/NO if it ends in a question mark and isn't caught above
        else if (text.endsWith("?")) {
            quickReplyOptions = ["Haan (Yes)", "Nahi (No)", "Not sure"];
        }
    }

    return (
        <div className="flex-1 overflow-y-auto py-6 space-y-4">
            {messages.map((msg, index) => {
                const isLast = index === messages.length - 1;
                return (
                    <div key={msg.id} className="space-y-4">
                        <MessageBubble message={msg} />

                        {/* Render active interactive widget right under the last AI message */}
                        <AnimatePresence>
                            {isLast && isLastAssistant && showPainSlider && onSendMessage && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="pl-14 px-4 overflow-hidden"
                                >
                                    <PainSliderWidget onSubmit={(val) => onSendMessage(`${val}/10`)} />
                                </motion.div>
                            )}

                            {isLast && isLastAssistant && quickReplyOptions.length > 0 && onSendMessage && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <QuickReplyChips
                                        options={quickReplyOptions}
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
