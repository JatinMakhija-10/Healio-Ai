"use client";

import { useState, useCallback } from "react";
import { ChatWindow } from "./components/ChatWindow";
import { InputBar } from "./components/InputBar";
import { useChat } from "./hooks/useChat";
import { useVoiceInput } from "./hooks/useVoiceInput";

export default function ConsultPage() {
    const { messages, isLoading, sendMessage, resetChat } = useChat();
    const [widgetActive, setWidgetActive] = useState(false);
    const {
        isRecording,
        transcript,
        isSupported,
        startRecording,
        stopRecording,
        clearTranscript,
    } = useVoiceInput();

    const handleWidgetActive = useCallback((active: boolean) => {
        setWidgetActive(active);
    }, []);

    return (
        <div className="flex flex-col h-[calc(100dvh-64px)] bg-[#F7F8FA]">
            {/* Chat Messages */}
            <ChatWindow
                messages={messages}
                isLoading={isLoading}
                onSendMessage={sendMessage}
                onWidgetActive={handleWidgetActive}
            />

            {/* New Consultation button when chat has ended */}
            {messages.length > 0 &&
                !isLoading &&
                messages[messages.length - 1]?.role === "assistant" &&
                messages[messages.length - 1]?.content.includes("```json") && (
                    <div className="flex justify-center py-3">
                        <button
                            onClick={resetChat}
                            className="px-6 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-full hover:bg-teal-700 transition-all hover:scale-105 shadow-md"
                        >
                            ✨ Start New Consultation
                        </button>
                    </div>
                )}

            {/* Input Bar */}
            <InputBar
                onSend={sendMessage}
                disabled={isLoading}
                widgetActive={widgetActive}
                isRecording={isRecording}
                voiceSupported={isSupported}
                transcript={transcript}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onClearTranscript={clearTranscript}
            />
        </div>
    );
}

