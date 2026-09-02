"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Mic, MicOff, Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InputBarProps {
    onSend: (text: string) => void;
    disabled?: boolean;
    widgetActive?: boolean;
    followUpMode?: boolean;
    // Voice
    isRecording: boolean;
    voiceSupported: boolean;
    transcript: string;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onClearTranscript: () => void;
}

export function InputBar({
    onSend,
    disabled,
    widgetActive,
    followUpMode,
    isRecording,
    voiceSupported,
    transcript,
    onStartRecording,
    onStopRecording,
    onClearTranscript,
}: InputBarProps) {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isInputDisabled = disabled;

    // Append transcript into the text box
    useEffect(() => {
        if (transcript) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setValue((prev) => {
                const space = prev && !prev.endsWith(" ") ? " " : "";
                return prev + space + transcript;
            });
            onClearTranscript();
        }
    }, [transcript, onClearTranscript]);

    // Auto-resize textarea
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
    }, [value]);

    // Handle external focus requests (e.g. from "Other" chip selection)
    useEffect(() => {
        const handleFocus = () => {
            textareaRef.current?.focus();
        };
        window.addEventListener("focus-chat-input", handleFocus);
        return () => window.removeEventListener("focus-chat-input", handleFocus);
    }, []);

    const handleSend = () => {
        if (!value.trim() || isInputDisabled) return;
        onSend(value.trim());
        setValue("");
        // reset height
        if (textareaRef.current) textareaRef.current.style.height = "auto";
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleMicToggle = () => {
        if (isRecording) {
            onStopRecording();
        } else {
            onStartRecording();
        }
    };

    const hasText = value.trim().length > 0;

    const placeholderText = widgetActive
        ? "Select an option above or type here..."
        : followUpMode
            ? "Share an update or ask a follow-up..."
        : "Tell Arovia what you are feeling...";

    return (
        <div className="shrink-0 border-t border-[#E5E3DC] bg-white/95 px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(26,26,46,0.07)] backdrop-blur md:px-6 md:pt-3 md:pb-3">
            {/* Listening indicator */}
            <AnimatePresence>
                {isRecording && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="mx-auto mb-2 flex w-fit items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-600"
                    >
                        <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                        Listening
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mx-auto flex max-w-3xl items-end gap-2">
                {/* Text area */}
                <div className="relative flex-1 rounded-[14px] border border-[#DAD7CF] bg-[#FDFBF7] shadow-sm transition-all focus-within:border-[#0F6E56] focus-within:shadow-[0_0_0_3px_rgba(15,110,86,0.12)] md:rounded-[8px]">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholderText}
                        disabled={isInputDisabled}
                        rows={1}
                        className="w-full resize-none bg-transparent px-3 py-3 pr-24 text-[15px] leading-6 text-[#1C1C1E] placeholder:text-[#8C8C8C] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                        style={{ maxHeight: "160px" }}
                    />

                    {/* Inline buttons */}
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                        {/* Voice button */}
                        {voiceSupported && (
                            <button
                                type="button"
                                onClick={handleMicToggle}
                                disabled={isInputDisabled}
                                className={`rounded-full p-2 transition-all ${isRecording
                                    ? "animate-pulse bg-red-500 text-white shadow-sm"
                                    : "text-[#6B6B6B] hover:bg-white hover:text-[#1A1A2E]"
                                    } ${isInputDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                                aria-label={isRecording ? "Stop recording" : "Start voice input"}
                            >
                                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                        )}

                        {/* Send button */}
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={isInputDisabled || !hasText}
                            className={`rounded-full p-2 transition-all ${hasText && !isInputDisabled
                                ? "bg-[#1A1A2E] text-white shadow-sm hover:bg-[#0F6E56]"
                                : "cursor-not-allowed text-[#B8B8B8]"
                                }`}
                            aria-label="Send message"
                        >
                            {isInputDisabled ? <Loader2 size={18} className="animate-spin text-[#0F6E56]" /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
            </div>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-[#8C8C8C]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#0F6E56]" aria-hidden="true" />
                <span>
                    {widgetActive
                        ? "Use the selection above or type your answer"
                        : followUpMode
                            ? "Continuing with your previous diagnosis context"
                            : "For emergencies, call local emergency services."}
                </span>
            </p>
        </div>
    );
}

