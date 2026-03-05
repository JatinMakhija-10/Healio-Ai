"use client";

/**
 * @deprecated Use the conversational chat system at
 * `src/app/dashboard/consult/` instead. This component uses the older
 * form-based intake + client-side Bayesian orchestrator pipeline.
 * Kept for backward compatibility; will be removed in a future release.
 */

import { IntakeCard } from "./IntakeCard";
import { MessageList } from "./MessageList";
import { useDiagnosisChat } from "./useDiagnosisChat";

export default function ChatInterface() {
    const {
        messages,
        symptomData,
        isTyping,
        isComplete,
        preferences,
        handleIntakeSubmit,
        handleOptionSelect,
        handleReset,
    } = useDiagnosisChat();

    if (!symptomData) {
        return (
            <div className="flex justify-center pt-8">
                <IntakeCard onSubmit={handleIntakeSubmit} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100dvh-140px)] max-w-3xl mx-auto">
            <MessageList
                messages={messages}
                isTyping={isTyping}
                isComplete={isComplete}
                preferences={preferences}
                onOptionSelect={handleOptionSelect}
                onReset={handleReset}
            />
        </div>
    );
}
