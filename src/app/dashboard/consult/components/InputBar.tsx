"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InputBarProps {
    onSend: (text: string) => void;
    disabled?: boolean;
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
    isRecording,
    voiceSupported,
    transcript,
    onStartRecording,
    onStopRecording,
    onClearTranscript,
}: InputBarProps) {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Push transcript into the text box
    useEffect(() => {
        if (transcript) {
            setValue(transcript);
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

    const handleSend = () => {
        if (!value.trim() || disabled) return;
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

    return (
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-3 py-3 md:px-6 md:py-4 z-10">
            {/* Listening indicator */}
            <AnimatePresence>
                {isRecording && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="text-center text-xs text-red-500 font-medium mb-2"
                    >
                        🎤 Sun raha hoon... (Listening...)
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-end gap-2 max-w-3xl mx-auto">
                {/* Text area */}
                <div className="flex-1 relative bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-100 transition-all">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Apni problem batayein... (Hindi or English)"
                        disabled={disabled}
                        rows={1}
                        className="w-full resize-none bg-transparent px-4 py-3 pr-20 text-[15px] text-gray-800 placeholder:text-gray-400 placeholder:italic focus:outline-none disabled:opacity-50"
                        style={{ maxHeight: "160px" }}
                    />

                    {/* Inline buttons */}
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                        {/* Voice button */}
                        {voiceSupported && (
                            <button
                                type="button"
                                onClick={handleMicToggle}
                                disabled={disabled}
                                className={`p-2 rounded-full transition-all ${isRecording
                                        ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-200"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                    }`}
                                aria-label={isRecording ? "Stop recording" : "Start voice input"}
                            >
                                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                        )}

                        {/* Send button */}
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={disabled || !hasText}
                            className={`p-2 rounded-full transition-all ${hasText && !disabled
                                    ? "bg-teal-600 text-white hover:bg-teal-700 hover:scale-105 shadow-sm"
                                    : "text-gray-300 cursor-not-allowed"
                                }`}
                            aria-label="Send message"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
