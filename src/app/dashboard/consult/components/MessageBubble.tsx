"use client";

import { motion } from "framer-motion";
import { ChatMessage } from "../hooks/useChat";
import { DiagnosisResultCard } from "@/components/chat/DiagnosisResultCard";
import { Condition } from "@/lib/diagnosis/types";

interface MessageBubbleProps {
    message: ChatMessage;
}

function formatTime(date: Date) {
    return new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === "user";

    // Extract JSON block if present
    let displayText = message.content;
    let parsedCondition: Condition | null = null;
    let isParsingJson = false;

    const jsonMatch = message.content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
        // Fully formed JSON block
        try {
            parsedCondition = JSON.parse(jsonMatch[1]) as Condition;
            // Remove the JSON block from the displayed text
            displayText = message.content.replace(/```json\n[\s\S]*?\n```/, "").trim();
        } catch (e) {
            // Invalid JSON, just hide it while it streams
            displayText = message.content.split("```json")[0].trim();
        }
    } else if (message.content.includes("```json")) {
        // Currently streaming the JSON block, hide everything after the marker
        isParsingJson = true;
        displayText = message.content.split("```json")[0].trim();
    }

    // Hide bubble completely if it's just an empty string after stripping JSON
    // but show it if it's generating the card
    if (!displayText && !parsedCondition && !isParsingJson && !isUser) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`flex items-end gap-3 px-4 ${isUser ? "flex-row-reverse" : ""}`}
        >
            {/* Avatar */}
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0 shadow-sm mb-auto mt-2">
                    <span className="text-white text-xs font-bold">H</span>
                </div>
            )}

            {/* Bubble + Timestamp */}
            <div
                className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full max-w-[90%] md:max-w-[75%]`}
            >
                {/* Text Bubble */}
                {displayText && (
                    <div
                        className={`px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words ${isUser
                            ? "bg-[#E8F5F0] text-gray-800 rounded-2xl rounded-br-sm"
                            : "bg-white text-gray-800 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100"
                            }`}
                    >
                        {renderContent(displayText)}
                    </div>
                )}

                {/* Structured Card */}
                {parsedCondition && (
                    <div className="mt-3 w-full">
                        <DiagnosisResultCard
                            condition={parsedCondition}
                            confidence={85} // Mock confidence as it's LLM generated pure text
                            showBookDoctor={false}
                        />
                    </div>
                )}

                {/* Loading State for JSON */}
                {isParsingJson && !parsedCondition && (
                    <div className="mt-2 text-xs text-teal-600 font-medium animate-pulse flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                        Generating diagnosis card...
                    </div>
                )}

                <span className="text-[11px] text-gray-400 mt-1 px-1">
                    {formatTime(message.timestamp)}
                </span>
            </div>
        </motion.div>
    );
}

/**
 * Renders message content with basic markdown-like formatting:
 * **bold**, emojis, and line breaks
 */
function renderContent(text: string) {
    if (!text) return null;

    // Split into segments preserving **bold** markers
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={i} className="font-semibold">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return <span key={i}>{part}</span>;
    });
}
