"use client";

import { motion } from "framer-motion";
import { ChatMessage, DiagnosticPreferences } from "../hooks/useChat";
import { DiagnosisResultCard } from "@/components/chat/DiagnosisResultCard";
import { Condition, ReasoningTraceEntry } from "@/lib/diagnosis/types";
import type { RuleResult, UncertaintyEstimate } from "@/lib/diagnosis/advanced";
import { UsageLimitCard } from "./UsageLimitCard";
import { AskHealioResponseRenderer } from "@/components/wellness/AskHealioResponseRenderer";
import type { AskHealioResponse } from "@/lib/wellness/askHealioResponse";
import { EscalationAlert } from "@/components/wellness/EscalationAlert";
import type { EscalationLevel } from "@/components/wellness/EscalationAlert";
import { Leaf } from "lucide-react";

interface MessageBubbleProps {
    message: ChatMessage;
    diagnosticPreferences: DiagnosticPreferences;
}

type ParsedConditionPayload = Condition & {
    confidence?: number;
    uncertainty?: UncertaintyEstimate;
    clinicalRules?: RuleResult[];
    reasoningTrace?: ReasoningTraceEntry[];
};

function formatTime(date: Date) {
    return new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function MessageBubble({ message, diagnosticPreferences }: MessageBubbleProps) {
    const isUser = message.role === "user";

    // Extract JSON block if present
    let displayText = message.content;
    let parsedCondition: ParsedConditionPayload | null = null;
    let isParsingJson = false;

    // Wellness 7-block response detection
    let wellnessResponse: AskHealioResponse | null = null;
    if (message.content.startsWith("___WELLNESS_RESPONSE___\n")) {
        try {
            const jsonText = message.content.replace("___WELLNESS_RESPONSE___\n", "");
            wellnessResponse = JSON.parse(jsonText) as AskHealioResponse;
            displayText = "";
        } catch (e) {
            console.error("[MessageBubble] Failed to parse wellness response:", e);
        }
    }

    // Usage limit detection
    let usageLimitData: {
        limit: number;
        resets_at: string;
        current_count: number;
        code?: string;
        cooldown_remaining?: number;
        credits_balance?: number;
        daily_count?: number;
        daily_limit?: number;
        plan?: string;
    } | null = null;
    if (message.content.startsWith("___JSON_USAGE_LIMIT___\n")) {
        try {
            const jsonText = message.content.replace("___JSON_USAGE_LIMIT___\n", "");
            usageLimitData = JSON.parse(jsonText);
            displayText = ""; // Hide plain text
        } catch (e) {
            console.error(e);
        }
    }

    let extractedJsonText: string | null = null;
    const jsonMatch = message.content.match(/```(?:json)?\s*([\s\S]*?)```/);
    
    if (jsonMatch) {
        extractedJsonText = jsonMatch[1];
    } else if (message.content.includes("```") && !usageLimitData) {
        // We have an opening ``` but no closing. We are probably still streaming or it was truncated.
        const parts = message.content.split(/```(?:json)?\s*/);
        if (parts.length > 1) {
            extractedJsonText = parts[1];
            isParsingJson = true; // Still streaming
            displayText = parts[0].trim();
        }
    }

    if (extractedJsonText) {
        // Find first { and last }
        const firstBrace = extractedJsonText.indexOf('{');
        const lastBrace = extractedJsonText.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
            try {
                const possibleJson = extractedJsonText.substring(firstBrace, lastBrace + 1);
                parsedCondition = JSON.parse(possibleJson) as ParsedConditionPayload;
                // If it parsed successfully, it's fully formed
                isParsingJson = false;
                
                // Hide the json part from displayText
                displayText = message.content.replace(/```(?:json)?\s*[\s\S]*?(?:```|$)/, "").trim();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                // Failed to parse, probably incomplete
                isParsingJson = true;
                displayText = message.content.split(/```(?:json)?/)[0].trim();
            }
        } else {
            // No valid JSON object found yet inside the block
            isParsingJson = true;
            displayText = message.content.split(/```(?:json)?/)[0].trim();
        }
    }

    // Strip ui_hint JSON from displayText
    const hintMatch = displayText.match(/\{"ui_hint"\s*:/);
    if (hintMatch && hintMatch.index !== undefined) {
        const startIndex = hintMatch.index;
        const stringFromHint = displayText.substring(startIndex);
        
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
            displayText = (displayText.substring(0, startIndex) + stringFromHint.substring(endIndex + 1)).trim();
        } else {
            displayText = displayText.substring(0, startIndex).trim();
        }
    }

    // Hide bubble completely if it's just an empty string after stripping JSON
    // but show it if it's generating the card, usage limit card, or wellness response
    if (!displayText && !parsedCondition && !isParsingJson && !isUser && !usageLimitData && !wellnessResponse) {
        return null;
    }

    const parsedConfidence =
        typeof parsedCondition?.confidence === "number"
            ? parsedCondition.confidence
            : 85;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`flex items-end gap-3 px-4 ${isUser ? "flex-row-reverse" : ""}`}
        >
            {/* Avatar */}
            {!isUser && (
                <div className="mb-auto mt-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#1D9E75] text-white shadow-sm">
                    <Leaf className="h-5 w-5" strokeWidth={2.3} aria-hidden="true" />
                </div>
            )}

            {/* Bubble + Timestamp */}
            <div
                className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full max-w-[90%] md:max-w-[75%]`}
            >
                {/* Usage Limit Card */}
                {usageLimitData && (
                    <div className="mb-2 w-full">
                        <UsageLimitCard 
                            limit={usageLimitData.limit}
                            resetsAt={usageLimitData.resets_at}
                            code={usageLimitData.code}
                            cooldownRemaining={usageLimitData.cooldown_remaining}
                            creditsBalance={usageLimitData.credits_balance}
                            onUpgradeClick={() => {
                                window.dispatchEvent(new CustomEvent("healio:open-upgrade", {
                                    detail: {
                                        featureLocked: "Unlimited Consultations",
                                        targetPlan: "plus",
                                    },
                                }));
                            }}
                        />
                    </div>
                )}

                {/* Text Bubble */}
                {displayText && (
                    <div
                        className={`whitespace-pre-wrap break-words px-4 py-3 text-[15px] leading-relaxed shadow-sm ${isUser
                            ? "rounded-[8px] rounded-br-[3px] bg-[#1A1A2E] text-white"
                            : "rounded-[8px] rounded-tl-[3px] border border-[#DAD7CF] bg-white text-[#1C1C1E]"
                            }`}
                    >
                        {renderContent(displayText)}
                    </div>
                )}

                {/* Wellness 7-block response */}
                {wellnessResponse && (
                    <div className="mt-1 w-full">
                        <AskHealioResponseRenderer response={wellnessResponse} />
                    </div>
                )}

                {/* Escalation ladder alert, rendered above the diagnosis card */}
                {parsedCondition?.escalation_level && (() => {
                    const lvl = parsedCondition.escalation_level as EscalationLevel;
                    const validLevels: EscalationLevel[] = ["L1", "L2", "L3", "L4", "L5"];
                    if (!validLevels.includes(lvl)) return null;
                    return (
                        <div className="mt-2 w-full">
                            <EscalationAlert
                                level={lvl}
                                reason={parsedCondition.concern_summary ?? parsedCondition.description ?? ""}
                                action={parsedCondition.escalation_action ?? parsedCondition.when_to_consult ?? ""}
                                practitionerTip={parsedCondition.practitioner_prep}
                            />
                        </div>
                    );
                })()}

                {/* Structured Card */}
                {parsedCondition && (
                    <div className="mt-3 w-full">
                        <DiagnosisResultCard
                            condition={parsedCondition}
                            confidence={parsedConfidence}
                            uncertainty={parsedCondition.uncertainty}
                            clinicalRules={parsedCondition.clinicalRules}
                            reasoningTrace={parsedCondition.reasoningTrace}
                            showIndianRemedies={diagnosticPreferences.ayurvedicMode}
                            showUncertaintyDetails={diagnosticPreferences.showUncertainty}
                            showDetailedExplanations={diagnosticPreferences.detailedExplanations}
                            showBookDoctor={false}
                        />
                    </div>
                )}

                {/* Loading State for JSON */}
                {isParsingJson && !parsedCondition && (
                    <div className="mt-2 flex animate-pulse items-center gap-2 text-xs font-medium text-[#0F6E56]">
                        <div className="w-4 h-4 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                        Generating diagnosis card...
                    </div>
                )}

                <span className="mt-1 px-1 text-[11px] text-[#9A9A9A]">
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
