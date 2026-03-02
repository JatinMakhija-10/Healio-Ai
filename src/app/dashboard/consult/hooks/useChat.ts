"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface UseChatReturn {
    messages: ChatMessage[];
    isLoading: boolean;
    sendMessage: (text: string) => Promise<void>;
    resetChat: () => void;
}

const generateId = () =>
    Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export function useChat(): UseChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const { user } = useAuth();

    const saveConsultation = useCallback(
        async (allMessages: ChatMessage[]) => {
            const consultation = {
                id: generateId(),
                created_at: new Date().toISOString(),
                symptoms: {
                    raw_conversation: allMessages
                        .filter((m) => m.role === "user")
                        .map((m) => m.content)
                        .join("\n"),
                },
                diagnosis: {
                    raw_conversation: allMessages
                        .filter((m) => m.role === "assistant")
                        .map((m) => m.content)
                        .join("\n"),
                    ai_generated: true,
                },
                confidence: 0,
            };

            // Save to localStorage backup
            try {
                const existing = JSON.parse(
                    localStorage.getItem("healio_consultation_history") || "[]"
                );
                existing.unshift(consultation);
                localStorage.setItem(
                    "healio_consultation_history",
                    JSON.stringify(existing.slice(0, 20))
                );
            } catch (e) {
                console.error("Failed to save to localStorage:", e);
            }

            // Save to Supabase if authenticated
            if (user) {
                try {
                    await supabase.from("consultations").insert({
                        user_id: user.id,
                        symptoms: consultation.symptoms,
                        diagnosis: consultation.diagnosis,
                        confidence: consultation.confidence,
                    });
                } catch (error) {
                    console.error("Failed to save to Supabase:", error);
                }
            }
        },
        [user]
    );

    const sendMessage = useCallback(
        async (text: string) => {
            if (!text.trim() || isLoading) return;

            // Add user message
            const userMsg: ChatMessage = {
                id: generateId(),
                role: "user",
                content: text.trim(),
                timestamp: new Date(),
            };

            const updatedMessages = [...messages, userMsg];
            setMessages(updatedMessages);
            setIsLoading(true);

            // Create placeholder for the assistant's streaming response
            const assistantId = generateId();
            const assistantMsg: ChatMessage = {
                id: assistantId,
                role: "assistant",
                content: "",
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMsg]);

            try {
                abortRef.current = new AbortController();

                const apiMessages = updatedMessages.map((m) => ({
                    role: m.role,
                    content: m.content,
                }));

                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages: apiMessages }),
                    signal: abortRef.current.signal,
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const contentType = response.headers.get("content-type") || "";

                if (contentType.includes("text/event-stream")) {
                    // Handle streaming response (from Groq)
                    const reader = response.body!.getReader();
                    const decoder = new TextDecoder();
                    let buffer = "";
                    let fullContent = "";

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed || !trimmed.startsWith("data: ")) continue;
                            const data = trimmed.slice(6);
                            if (data === "[DONE]") continue;

                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.content) {
                                    fullContent += parsed.content;
                                    setMessages((prev) =>
                                        prev.map((m) =>
                                            m.id === assistantId
                                                ? { ...m, content: fullContent }
                                                : m
                                        )
                                    );
                                }
                            } catch {
                                // skip malformed
                            }
                        }
                    }
                } else {
                    // Handle non-streaming response (Gemini fallback)
                    const data = await response.json();
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantId
                                ? { ...m, content: data.content || "" }
                                : m
                        )
                    );
                }

                // Check if the AI's response contains the diagnosis markers
                setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (
                        last?.role === "assistant" &&
                        last.content.includes("```json")
                    ) {
                        // Consultation complete — save it
                        saveConsultation(prev);
                    }
                    return prev;
                });
            } catch (error) {
                if ((error as Error).name !== "AbortError") {
                    console.error("Chat error:", error);
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantId
                                ? {
                                    ...m,
                                    content:
                                        "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. 🙏",
                                }
                                : m
                        )
                    );
                }
            } finally {
                setIsLoading(false);
                abortRef.current = null;
            }
        },
        [messages, isLoading, saveConsultation]
    );

    const resetChat = useCallback(() => {
        if (abortRef.current) abortRef.current.abort();
        setMessages([]);
        setIsLoading(false);
    }, []);

    return { messages, isLoading, sendMessage, resetChat };
}
