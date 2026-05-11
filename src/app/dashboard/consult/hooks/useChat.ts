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
    startFollowUpFromDiagnosis: () => boolean;
    resumeContext: ResumeContext | null;
    isResumeMode: boolean;
    hasCompletedDiagnosis: boolean;
}

const generateId = () =>
    Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type ParsedDiagnosis = Record<string, unknown>;

function firstString(...values: unknown[]): string | undefined {
    return values.find((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function arrayOrEmpty(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

function normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") {
                const record = item as Record<string, unknown>;
                return firstString(record.name, record.indication, record.description, record.preparation) || null;
            }
            return null;
        })
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function collectRemedyNames(diagnosis: ParsedDiagnosis): string[] {
    return [
        ...normalizeStringArray(diagnosis.remedies),
        ...normalizeStringArray(diagnosis.indianHomeRemedies),
        ...normalizeStringArray(diagnosis.homeopathic_remedies),
        ...normalizeStringArray(diagnosis.ayurvedic_remedies),
        ...normalizeStringArray(diagnosis.home_remedies),
    ];
}

function extractLatestDiagnosis(messages: ChatMessage[]): ParsedDiagnosis | null {
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    for (let i = assistantMessages.length - 1; i >= 0; i--) {
        const jsonMatch = assistantMessages[i].content.match(/```json\n([\s\S]*?)\n```/);
        if (!jsonMatch) continue;

        try {
            return JSON.parse(jsonMatch[1]) as ParsedDiagnosis;
        } catch {
            // Invalid JSON block; continue searching older assistant messages.
        }
    }

    return null;
}

function buildResumeContextFromDiagnosis(
    diagnosis: ParsedDiagnosis,
    originalDate: string,
    daysSince = 0
): ResumeContext {
    const seeDoctorIf = normalizeStringArray(diagnosis.see_doctor_if);
    const seekHelp =
        typeof diagnosis.seekHelp === "string"
            ? diagnosis.seekHelp
            : seeDoctorIf.join("; ");

    return {
        conditionName:
            firstString(diagnosis.name, diagnosis.condition, diagnosis.conditionName) ||
            "your previous concern",
        description: firstString(diagnosis.description) || "",
        severity: firstString(diagnosis.severity) || "moderate",
        confidence:
            typeof diagnosis.confidence === "number" ? diagnosis.confidence : 0,
        remedies: collectRemedyNames(diagnosis),
        warnings: [
            ...normalizeStringArray(diagnosis.warnings),
            ...normalizeStringArray(diagnosis.red_flags),
        ],
        seekHelp,
        daysSince,
        originalDate,
    };
}

function normalizeDiagnosisForStorage(
    parsedDiagnosis: ParsedDiagnosis,
    isResumeMode: boolean,
    resumeContext: ResumeContext | null
) {
    const seeDoctorIf = normalizeStringArray(parsedDiagnosis.see_doctor_if);

    return {
        condition: firstString(parsedDiagnosis.name, parsedDiagnosis.condition) || "Unknown Condition",
        description: firstString(parsedDiagnosis.description) || "",
        severity: firstString(parsedDiagnosis.severity) || "moderate",
        remedies: arrayOrEmpty(parsedDiagnosis.remedies).length
            ? arrayOrEmpty(parsedDiagnosis.remedies)
            : arrayOrEmpty(parsedDiagnosis.homeopathic_remedies),
        indianHomeRemedies: arrayOrEmpty(parsedDiagnosis.indianHomeRemedies).length
            ? arrayOrEmpty(parsedDiagnosis.indianHomeRemedies)
            : arrayOrEmpty(parsedDiagnosis.home_remedies),
        ayurvedicRemedies: arrayOrEmpty(parsedDiagnosis.ayurvedic_remedies),
        exercises: arrayOrEmpty(parsedDiagnosis.exercises).length
            ? arrayOrEmpty(parsedDiagnosis.exercises)
            : arrayOrEmpty(parsedDiagnosis.lifestyle_advice),
        warnings: arrayOrEmpty(parsedDiagnosis.warnings).length
            ? arrayOrEmpty(parsedDiagnosis.warnings)
            : arrayOrEmpty(parsedDiagnosis.red_flags),
        seekHelp:
            firstString(parsedDiagnosis.seekHelp) ||
            (seeDoctorIf.length > 0 ? seeDoctorIf.join("; ") : ""),
        ai_generated: true,
        is_followup: isResumeMode,
        prior_condition: resumeContext?.conditionName || null,
    };
}

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

    const remedyNames = collectRemedyNames(diagnosis).slice(0, 3);
    const topWarning = diagnosis.warnings?.[0] || null;

    let msg = `**Continue your consultation**\n\n`;
    msg += `Your last consultation was **${daysSince} day${daysSince !== 1 ? "s" : ""} ago** on ${dateStr}.\n\n`;
    msg += `**Previous assessment**\n`;
    msg += `- Likely condition: **${conditionName}**\n`;
    msg += `- Severity: ${severity}\n`;

    if (remedyNames.length > 0) {
        msg += `- Recommendations discussed: ${remedyNames.join(", ")}\n`;
    }

    if (topWarning) {
        msg += `- Watch for: ${topWarning}\n`;
    }

    if (diagnosis.seekHelp) {
        msg += `- Seek medical help if: ${diagnosis.seekHelp}\n`;
    }

    msg += `\nTell me what changed since then, or ask any question about the diagnosis or care plan.`;

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
        return `**Continue your consultation**\n\nWe are continuing from your **${conditionName}** assessment earlier today.\n\nTell me what changed since then, or ask any question about the diagnosis or care plan.`;
    }

    return `**Continue your consultation**\n\nWe are continuing from your **${conditionName}** assessment from ${daysSince} day${daysSince !== 1 ? "s" : ""} ago.\n\nTell me what changed since then, or ask any question about the diagnosis or care plan.`;
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

    return {
        conditionName: diagnosis.condition || diagnosis.name || "Unknown Condition",
        description: diagnosis.description || "",
        severity: diagnosis.severity || "moderate",
        confidence: consultation.confidence || 0,
        remedies: collectRemedyNames(diagnosis),
        warnings: [
            ...normalizeStringArray(diagnosis.warnings),
            ...normalizeStringArray(diagnosis.red_flags),
        ],
        seekHelp:
            diagnosis.seekHelp ||
            normalizeStringArray(diagnosis.see_doctor_if).join("; "),
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
    const hasCompletedDiagnosis = Boolean(extractLatestDiagnosis(messages));

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
            const parsedDiagnosis = extractLatestDiagnosis(allMessages);
            const confidence = 0;
            const assistantMessages = allMessages.filter((m) => m.role === "assistant");

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
                    ? normalizeDiagnosisForStorage(parsedDiagnosis, isResumeMode, resumeContext)
                    : {
                        condition: "Unknown Condition",
                        raw_conversation: assistantMessages
                            .map((m) => m.content)
                            .join("\n"),
                        ai_generated: true,
                        is_followup: isResumeMode,
                    },
                confidence:
                    typeof parsedDiagnosis?.confidence === "number"
                        ? parsedDiagnosis.confidence
                        : confidence,
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

                const latestDiagnosis = extractLatestDiagnosis(updatedMessages);
                const activeResumeContext =
                    resumeContext ||
                    (latestDiagnosis
                        ? buildResumeContextFromDiagnosis(
                            latestDiagnosis,
                            new Date().toISOString()
                        )
                        : null);

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const body: any = { messages: apiMessages };

                // Attach resume context if in follow-up mode
                if (activeResumeContext) {
                    body.resumeContext = activeResumeContext;
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

    const startFollowUpFromDiagnosis = useCallback(() => {
        const latestDiagnosis = extractLatestDiagnosis(messages);
        if (!latestDiagnosis) return false;

        const ctx = buildResumeContextFromDiagnosis(
            latestDiagnosis,
            new Date().toISOString()
        );

        setResumeContext(ctx);
        setIsResumeMode(true);
        setMessages((prev) => {
            const alreadyPrompted = prev.some((m) => m.isRecap && m.id.startsWith("current-followup-"));
            if (alreadyPrompted) return prev;

            return [
                ...prev,
                {
                    id: `current-followup-${generateId()}`,
                    role: "assistant",
                    content:
                        `**Continue your consultation**\n\nWe can continue from the **${ctx.conditionName}** assessment.\n\nTell me what changed since then, or ask any question about the diagnosis or care plan.`,
                    timestamp: new Date(),
                    isRecap: true,
                },
            ];
        });

        return true;
    }, [messages]);

    return {
        messages,
        isLoading,
        sendMessage,
        resetChat,
        startFollowUpFromDiagnosis,
        resumeContext,
        isResumeMode,
        hasCompletedDiagnosis,
    };
}
