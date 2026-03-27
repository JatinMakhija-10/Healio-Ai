"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Mic, MicOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InputBarProps {
    onSend: (text: string) => void;
    disabled?: boolean;
    widgetActive?: boolean;
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
        : "Describe your symptoms here...";

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
                        🎤 Listening...
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-end gap-2 max-w-3xl mx-auto">
                {/* Text area */}
                <div className={`flex-1 relative bg-gray-50 rounded-2xl border border-gray-200 transition-all focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-100`}>
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholderText}
                        disabled={isInputDisabled}
                        rows={1}
                        className="w-full resize-none bg-transparent px-4 py-3 pr-20 text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className={`p-2 rounded-full transition-all ${isRecording
                                    ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-200"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
                            className={`p-2 rounded-full transition-all ${hasText && !isInputDisabled
                                ? "bg-teal-600 text-white hover:bg-teal-700 hover:scale-105 shadow-sm"
                                : "text-gray-300 cursor-not-allowed"
                                }`}
                            aria-label="Send message"
                        >
                            {isInputDisabled ? <Loader2 size={18} className="animate-spin text-teal-600" /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">
                {widgetActive ? "Use the selection above or type your answer" : "Type in Hindi, English, or Hinglish"}
            </p>
        </div>
    );
}

