"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    isRecap?: boolean;
}

interface UseChatOptions {
    resumeId?: string | null;
}

// Data shape for the resume context passed to the API
export interface ResumeContext {
    conditionName: string;
    description: string;
    severity: string;
    confidence: number;
    remedies: string[];
    warnings: string[];
    seekHelp: string;
    daysSince: number;
    originalDate: string;
}

interface UseChatReturn {
    messages: ChatMessage[];
    isLoading: boolean;
    sendMessage: (text: string) => Promise<void>;
    resetChat: () => void;
    resumeContext: ResumeContext | null;
    isResumeMode: boolean;
}

const generateId = () =>
    Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Build a human-readable recap message from a prior consultation.
 */
function buildRecapMessage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    consultation: any,
    daysSince: number
): string {
    const diagnosis = consultation.diagnosis || {};
    const conditionName = diagnosis.condition || "your previous concern";
    const severity = diagnosis.severity || "moderate";
    const dateStr = new Date(consultation.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    // Collect top remedies (max 3)
    const remedyNames: string[] = [];
    if (diagnosis.remedies?.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        diagnosis.remedies.slice(0, 2).forEach((r: any) => {
            if (r.name) remedyNames.push(r.name);
        });
    }
    if (diagnosis.indianHomeRemedies?.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        diagnosis.indianHomeRemedies.slice(0, 1).forEach((r: any) => {
            if (r.name) remedyNames.push(r.name);
        });
    }

    // Top warning
    const topWarning = diagnosis.warnings?.[0] || null;

    // Build the message
    let msg = `🔄 **Welcome back!** It's been **${daysSince} day${daysSince !== 1 ? "s" : ""}** since your last consultation.\n\n`;
    msg += `**Here's what we covered on ${dateStr}:**\n`;
    msg += `• Likely condition: **${conditionName}** (${severity})\n`;

    if (remedyNames.length > 0) {
        msg += `• Recommendations given: ${remedyNames.join(", ")}\n`;
    }

    if (topWarning) {
        msg += `• Red flag to watch: ${topWarning}\n`;
    }

    if (diagnosis.seekHelp) {
        msg += `• See a doctor if: ${diagnosis.seekHelp}\n`;
    }

    msg += `\n**How are you feeling now?** Have things improved, stayed the same, or gotten worse? I can do a follow-up assessment based on your current symptoms. 💚`;

    return msg;
}

/**
 * Build a short context note for consultations < 7 days old.
 */
function buildShortResumeMessage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    consultation: any,
    daysSince: number
): string {
    const diagnosis = consultation.diagnosis || {};
    const conditionName = diagnosis.condition || "your previous concern";

    if (daysSince === 0) {
        return `💬 **Continuing your consultation** for **${conditionName}** from earlier today.\n\nHow are things going? Any changes since we last spoke?`;
    }

    return `💬 **Following up** on your consultation for **${conditionName}** from ${daysSince} day${daysSince !== 1 ? "s" : ""} ago.\n\nHow are you feeling now? Any changes or new symptoms?`;
}

/**
 * Extract structured resume context for the API system prompt.
 */
function extractResumeContext(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    consultation: any,
    daysSince: number
): ResumeContext {
    const diagnosis = consultation.diagnosis || {};
    const remedyNames: string[] = [];

    if (diagnosis.remedies?.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        diagnosis.remedies.forEach((r: any) => {
            if (r.name) remedyNames.push(r.name);
        });
    }
    if (diagnosis.indianHomeRemedies?.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        diagnosis.indianHomeRemedies.forEach((r: any) => {
            if (r.name) remedyNames.push(r.name);
        });
    }

    return {
        conditionName: diagnosis.condition || "Unknown Condition",
        description: diagnosis.description || "",
        severity: diagnosis.severity || "moderate",
        confidence: consultation.confidence || 0,
        remedies: remedyNames,
        warnings: diagnosis.warnings || [],
        seekHelp: diagnosis.seekHelp || "",
        daysSince,
        originalDate: consultation.created_at,
    };
}


export function useChat(options?: UseChatOptions): UseChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [resumeContext, setResumeContext] = useState<ResumeContext | null>(null);
    const [isResumeMode, setIsResumeMode] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const resumeProcessedRef = useRef<string | null>(null);
    const { user } = useAuth();

    const resumeId = options?.resumeId || null;

    // Get user-specific storage key
    const getStorageKey = useCallback(() => {
        return user?.id ? `healio_current_chat_${user.id}` : null;
    }, [user?.id]);

    // ── Resume Logic: load prior consultation and inject recap ──────────────
    useEffect(() => {
        if (!resumeId || !user) return;
        // Prevent re-processing the same resumeId
        if (resumeProcessedRef.current === resumeId) return;
        resumeProcessedRef.current = resumeId;

        const loadResume = async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let consultation: any = null;

            // 1. Try Supabase
            try {
                const { data, error } = await supabase
                    .from("consultations")
                    .select("*")
                    .eq("id", resumeId)
                    .eq("user_id", user.id)
                    .single();

                if (!error && data) {
                    consultation = data;
                }
            } catch (e) {
                console.error("[useChat] Supabase resume fetch failed:", e);
            }

            // 2. Fallback to localStorage
            if (!consultation) {
                try {
                    const storageKey = `healio_consultation_history_${user.id}`;
                    const localHistory = JSON.parse(
                        localStorage.getItem(storageKey) || "[]"
                    );
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    consultation = localHistory.find((c: any) => c.id === resumeId);
                } catch (e) {
                    console.error("[useChat] localStorage resume fetch failed:", e);
                }
            }

            if (!consultation) {
                console.warn("[useChat] Consultation not found for resumeId:", resumeId);
                return;
            }

            // Calculate days since the consultation
            const createdAt = new Date(consultation.created_at).getTime();
            const now = Date.now();
            const daysSince = Math.floor((now - createdAt) / (24 * 60 * 60 * 1000));

            // Build the appropriate recap message
            const isLongGap = (now - createdAt) >= SEVEN_DAYS_MS;
            const recapContent = isLongGap
                ? buildRecapMessage(consultation, daysSince)
                : buildShortResumeMessage(consultation, daysSince);

            const recapMsg: ChatMessage = {
                id: generateId(),
                role: "assistant",
                content: recapContent,
                timestamp: new Date(),
                isRecap: true,
            };

            // Extract the structured context for API calls
            const ctx = extractResumeContext(consultation, daysSince);
            setResumeContext(ctx);
            setIsResumeMode(true);

            // Clear any existing session and inject the recap
            const storageKey = getStorageKey();
            if (storageKey) {
                sessionStorage.removeItem(storageKey);
            }
            setMessages([recapMsg]);
        };

        loadResume();
    }, [resumeId, user, getStorageKey]);

    // Load session persistence on mount (user-specific) — only if NOT resuming
    useEffect(() => {
        if (resumeId) return; // Skip normal restore when resuming

        const storageKey = getStorageKey();
        if (!storageKey) {
            // No user logged in, clear any messages
            setMessages([]);
            return;
        }

        try {
            const saved = sessionStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Convert string dates back to Date objects
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const withDates = parsed.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                }));
                setMessages(withDates);
            } else {
                // New user session, start fresh
                setMessages([]);
            }
        } catch (e) {
            console.error("Failed to load session chat", e);
            setMessages([]);
        }
    }, [getStorageKey, resumeId]);

    // Save to session persistence whenever messages change (user-specific)
    useEffect(() => {
        const storageKey = getStorageKey();
        if (!storageKey) return; // Don't save if no user

        sessionStorage.setItem(storageKey, JSON.stringify(messages));
    }, [messages, getStorageKey]);

    const saveConsultation = useCallback(
        async (allMessages: ChatMessage[]) => {
            // Try to extract structured diagnosis from AI's JSON block
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let parsedDiagnosis: any = null;
            const confidence = 0;

            // Find the last assistant message containing ```json
            const assistantMessages = allMessages.filter((m) => m.role === "assistant");
            for (let i = assistantMessages.length - 1; i >= 0; i--) {
                const jsonMatch = assistantMessages[i].content.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch) {
                    try {
                        parsedDiagnosis = JSON.parse(jsonMatch[1]);
                        break;
                    } catch {
                        // Invalid JSON, continue searching
                    }
                }
            }

            const consultation = {
                id: generateId(),
                created_at: new Date().toISOString(),
                symptoms: {
                    raw_conversation: allMessages
                        .filter((m) => m.role === "user")
                        .map((m) => m.content)
                        .join("\n"),
                },
                diagnosis: parsedDiagnosis
                    ? {
                        condition: parsedDiagnosis.name || "Unknown Condition",
                        description: parsedDiagnosis.description || "",
                        severity: parsedDiagnosis.severity || "moderate",
                        remedies: parsedDiagnosis.remedies || [],
                        indianHomeRemedies: parsedDiagnosis.indianHomeRemedies || [],
                        exercises: parsedDiagnosis.exercises || [],
                        warnings: parsedDiagnosis.warnings || [],
                        seekHelp: parsedDiagnosis.seekHelp || "",
                        ai_generated: true,
                        is_followup: isResumeMode,
                        prior_condition: resumeContext?.conditionName || null,
                    }
                    : {
                        condition: "Unknown Condition",
                        raw_conversation: assistantMessages
                            .map((m) => m.content)
                            .join("\n"),
                        ai_generated: true,
                        is_followup: isResumeMode,
                    },
                confidence: parsedDiagnosis?.confidence || confidence,
            };

            // Save to localStorage backup (user-specific)
            if (user) {
                try {
                    const storageKey = `healio_consultation_history_${user.id}`;
                    const existing = JSON.parse(
                        localStorage.getItem(storageKey) || "[]"
                    );
                    existing.unshift(consultation);
                    localStorage.setItem(
                        storageKey,
                        JSON.stringify(existing.slice(0, 20))
                    );
                } catch (e) {
                    console.error("Failed to save to localStorage:", e);
                }
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
        [user, isResumeMode, resumeContext]
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

                // Filter out recap messages from API payload (they're synthetic)
                const apiMessages = updatedMessages
                    .filter((m) => !m.isRecap)
                    .map((m) => ({
                        role: m.role,
                        content: m.content,
                    }));

                // Get the current session token for API auth
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) {
                    throw new Error("Not authenticated");
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const body: any = { messages: apiMessages };

                // Attach resume context if in follow-up mode
                if (resumeContext) {
                    body.resumeContext = resumeContext;
                }

                const response = await fetch("/api/chat", {
                    method: "POST",
                    credentials: "omit", // Prevents sending cookies, fixes 431 Header Too Large error
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify(body),
                    signal: abortRef.current.signal,
                });

                if (!response.ok) {
                    // Handle usage limit (429)
                    if (response.status === 429) {
                        const errorData = await response.json().catch(() => ({}));
                        if (errorData.code === 'USAGE_LIMIT') {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === assistantId
                                        ? {
                                            ...m,
                                            content: `___JSON_USAGE_LIMIT___\n${JSON.stringify({
                                                limit: errorData.limit,
                                                resets_at: errorData.resets_at,
                                                current_count: errorData.current_count
                                            })}`,
                                        }
                                        : m
                                )
                            );
                            setIsLoading(false);
                            // Set short timeout then trigger modal
                            setTimeout(() => {
                                // We can trigger the global PlanSelectionModal event here if needed,
                                // but for now, the card itself will have the upgrade button
                            }, 500);
                            return;
                        }
                    }
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
        [messages, isLoading, saveConsultation, resumeContext]
    );

    const resetChat = useCallback(() => {
        if (abortRef.current) abortRef.current.abort();
        setMessages([]);
        setIsLoading(false);
        setResumeContext(null);
        setIsResumeMode(false);
        resumeProcessedRef.current = null;
        const storageKey = getStorageKey();
        if (storageKey) {
            sessionStorage.removeItem(storageKey);
        }
    }, [getStorageKey]);

    return { messages, isLoading, sendMessage, resetChat, resumeContext, isResumeMode };
}
