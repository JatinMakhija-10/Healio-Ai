"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { UserSymptomData, DiagnosisResult, ClarificationQuestion } from "@/lib/diagnosis/types";
import { diagnose } from "@/lib/diagnosis/orchestrator";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
    DialogueState,
    EmotionalState,
    createDialogueState,
    updateDialogueState,
    transitionPhase,
    intentEngine,
    medicalNER,
    responseGenerator,
    languageDetector,
} from "@/lib/diagnosis/dialogue";
import { UncertaintyEstimate, RuleResult } from "@/lib/diagnosis/advanced";

// ─── Types ───────────────────────────────────────────────────

// ── UI Hint types (parsed from AI streaming messages) ────────────────────────
export type UiHintType = 'chips' | 'dropdown' | 'slider';

export interface UiHint {
    type: UiHintType;
    options?: string[];        // for chips / dropdown
    min?: number;              // for slider
    max?: number;              // for slider
    question_type?: string;    // e.g. 'duration', 'severity', 'sensation'
}

export type DiagnosisMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    type?: "text" | "diagnosis_card" | "options";
    options?: string[];
    ui_hint?: UiHint;          // structured input control from AI
    diagnosis?: DiagnosisResult;
    uncertainty?: UncertaintyEstimate;
    clinicalRules?: RuleResult[];
    alerts?: string[];
};

export interface DiagnosisChatState {
    messages: DiagnosisMessage[];
    symptomData: UserSymptomData | null;
    isTyping: boolean;
    isComplete: boolean;
    dialogueState: DialogueState;
    preferences: {
        ayurvedicMode: boolean;
        showUncertainty: boolean;
        detailedExplanations: boolean;
    };
}

export interface DiagnosisChatActions {
    handleIntakeSubmit: (data: UserSymptomData) => void;
    handleOptionSelect: (option: string) => void;
    handleReset: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────

const generateId = () =>
    Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

const ANXIOUS_PATTERNS =
    /worried|scared|anxious|nervous|frightened|terrified|panic|afraid|fear|please help|am i dying/i;
const FRUSTRATED_PATTERNS =
    /frustrated|annoyed|irritated|already told you|again\?|keep asking|same question/i;
const URGENT_PATTERNS =
    /urgent|emergency|help me|right now|immediately|asap|can't wait|critical|serious/i;

function detectEmotionalState(message: string): EmotionalState {
    if (URGENT_PATTERNS.test(message)) return "urgent";
    if (FRUSTRATED_PATTERNS.test(message)) return "frustrated";
    if (ANXIOUS_PATTERNS.test(message)) return "anxious";
    return "calm";
}

// ─── Hook ────────────────────────────────────────────────────

export function useDiagnosisChat(): DiagnosisChatState & DiagnosisChatActions {
    const [symptomData, setSymptomData] = useState<UserSymptomData | null>(null);
    const [messages, setMessages] = useState<DiagnosisMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [currentContext, setCurrentContext] = useState<string | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<ClarificationQuestion | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const { user } = useAuth();

    const [dialogueState, setDialogueState] = useState<DialogueState>(() =>
        createDialogueState()
    );

    const [preferences, setPreferences] = useState({
        ayurvedicMode: true,
        showUncertainty: true,
        detailedExplanations: true,
    });

    useEffect(() => {
        setPreferences({
            ayurvedicMode: localStorage.getItem("healio_pref_ayurvedic") !== "false",
            showUncertainty: localStorage.getItem("healio_pref_uncertainty") !== "false",
            detailedExplanations: localStorage.getItem("healio_pref_detailed") !== "false",
        });
    }, []);

    const addMessage = useCallback((msg: DiagnosisMessage) => {
        setMessages((prev) => [...prev, msg]);
    }, []);

    // ── Save consultation ────────────────────────────────────

    const saveConsultation = useCallback(
        async (
            symptoms: UserSymptomData,
            diagnosisResult: DiagnosisResult,
            uncertainty?: UncertaintyEstimate,
            rules?: RuleResult[]
        ) => {
            const consultationData = {
                id: generateId(),
                created_at: new Date().toISOString(),
                symptoms,
                diagnosis: {
                    condition: diagnosisResult.condition.name,
                    description: diagnosisResult.condition.description,
                    severity: diagnosisResult.condition.severity,
                    remedies: diagnosisResult.condition.remedies,
                    indianHomeRemedies: diagnosisResult.condition.indianHomeRemedies,
                    exercises: diagnosisResult.condition.exercises,
                    warnings: diagnosisResult.condition.warnings,
                    seekHelp: diagnosisResult.condition.seekHelp,
                },
                confidence: diagnosisResult.confidence,
                uncertainty,
                clinicalRules: rules,
            };

            try {
                const existing = JSON.parse(
                    localStorage.getItem("healio_consultation_history") || "[]"
                );
                existing.unshift(consultationData);
                localStorage.setItem(
                    "healio_consultation_history",
                    JSON.stringify(existing.slice(0, 20))
                );
            } catch (e) {
                console.error("Failed to save to localStorage:", e);
            }

            if (user) {
                try {
                    await supabase.from("consultations").insert({
                        user_id: user.id,
                        symptoms,
                        diagnosis: consultationData.diagnosis,
                        confidence: diagnosisResult.confidence,
                    });
                } catch (error) {
                    console.error("Failed to save consultation to Supabase:", error);
                }
            }
        },
        [user]
    );

    // ── Run diagnosis ────────────────────────────────────────

    const runDiagnosis = useCallback(
        (data: UserSymptomData) => {
            setIsTyping(true);

            setTimeout(async () => {
                const result = await diagnose(data);
                setIsTyping(false);

                if (result.alerts && result.alerts.length > 0) {
                    for (const alert of result.alerts) {
                        addMessage({ id: generateId(), role: "assistant", content: alert });
                    }
                }

                if (result.question) {
                    setCurrentQuestion(result.question);
                    setCurrentContext(result.question.symptomKey || null);

                    const questionType = result.question.symptomKey?.includes("trigger")
                        ? "trigger"
                        : "symptom";
                    const enhancedQuestion = responseGenerator.generateQuestion(
                        result.question.question,
                        questionType,
                        dialogueState
                    );

                    setDialogueState((prev) =>
                        updateDialogueState(prev, {
                            turnsCount: prev.context.turnsCount + 1,
                        })
                    );

                    addMessage({
                        id: generateId(),
                        role: "assistant",
                        content: enhancedQuestion,
                        type: "options",
                        options: result.question.options,
                    });
                } else if (result.results.length > 0) {
                    setDialogueState((prev) => transitionPhase(prev, "diagnosis"));

                    const topResult = result.results[0];
                    const diagnosisMessage = responseGenerator.generateDiagnosis(
                        topResult.condition.name,
                        topResult.confidence,
                        dialogueState
                    );

                    addMessage({
                        id: generateId(),
                        role: "assistant",
                        content: diagnosisMessage,
                        type: "diagnosis_card",
                        diagnosis: topResult,
                        uncertainty: result.uncertainty,
                        clinicalRules: result.clinicalRules,
                        alerts: result.alerts,
                    });

                    await saveConsultation(data, topResult, result.uncertainty, result.clinicalRules);

                    setTimeout(() => {
                        setIsComplete(true);
                        setDialogueState((prev) => transitionPhase(prev, "guidance"));
                        const conclusion = responseGenerator.generateConclusion(dialogueState);
                        addMessage({
                            id: "end_msg",
                            role: "assistant",
                            content: conclusion,
                        });
                    }, 1000);
                } else {
                    addMessage({
                        id: generateId(),
                        role: "assistant",
                        content: responseGenerator.generate(
                            "I'm having trouble pinpointing the exact condition based on the information provided. It's best to consult a healthcare professional who can examine you in person.",
                            dialogueState
                        ),
                    });
                    setIsComplete(true);
                }
            }, 1500);
        },
        [addMessage, dialogueState, saveConsultation]
    );

    // ── Intake submit ────────────────────────────────────────

    const handleIntakeSubmit = useCallback(
        (data: UserSymptomData) => {
            const initialText = `${data.painType || ""} ${data.additionalNotes || ""}`.trim();
            const detectedLang = initialText
                ? languageDetector.detect(initialText).language
                : "en";

            const enrichedData: UserSymptomData = {
                ...data,
                userProfile: user?.user_metadata
                    ? {
                          age: user.user_metadata.age,
                          gender: user.user_metadata.gender,
                          weight: user.user_metadata.weight,
                          height: user.user_metadata.height,
                          conditions: user.user_metadata.medical_profile?.conditions,
                          allergies: user.user_metadata.medical_profile?.allergies,
                          smoking: user.user_metadata.medical_profile?.smoking,
                          alcohol: user.user_metadata.medical_profile?.alcohol,
                          medications: user.user_metadata.medical_profile?.medications,
                          pregnant: user.user_metadata.medical_profile?.pregnant,
                          recentSurgery: user.user_metadata.medical_profile?.recent_surgery,
                          familyHistory: user.user_metadata.medical_profile?.family_history,
                          language: detectedLang,
                      }
                    : { language: detectedLang },
            };

            setSymptomData(enrichedData);
            setIsTyping(true);
            setDialogueState((prev) => transitionPhase(prev, "intake"));

            setTimeout(() => {
                setIsTyping(false);

                const acknowledgment = responseGenerator.generate(
                    `I understand you have ${data.duration} ${data.painType} pain in your ${data.location.join(", ")} with a severity of ${data.intensity}/10. Let me analyze that for you.`,
                    dialogueState
                );

                addMessage({
                    id: generateId(),
                    role: "assistant",
                    content: acknowledgment,
                });

                setDialogueState((prev) => transitionPhase(prev, "clarification"));
                runDiagnosis(enrichedData);
            }, 1500);
        },
        [user, dialogueState, addMessage, runDiagnosis]
    );

    // ── Option select ────────────────────────────────────────

    const handleOptionSelect = useCallback(
        (option: string) => {
            addMessage({ id: generateId(), role: "user", content: option });

            const detectedEmotion = detectEmotionalState(option);
            if (detectedEmotion !== "calm") {
                setDialogueState((prev) =>
                    updateDialogueState(prev, { emotionalState: detectedEmotion })
                );
            }

            const newData = { ...symptomData } as UserSymptomData;
            const normalizedOption = option.toLowerCase();

            if (
                currentQuestion?.type === "multi_choice" &&
                currentQuestion.multiSelectTokens
            ) {
                const index = currentQuestion.options.findIndex(
                    (o) => o.toLowerCase() === normalizedOption
                );
                if (normalizedOption === "none of the above") {
                    newData.excludedSymptoms = [
                        ...(newData.excludedSymptoms || []),
                        ...currentQuestion.multiSelectTokens,
                    ];
                } else if (index !== -1 && currentQuestion.multiSelectTokens[index]) {
                    const token = currentQuestion.multiSelectTokens[index];
                    newData.additionalNotes = (newData.additionalNotes || "") + " " + token;
                }
            } else if (normalizedOption.startsWith("no") && currentContext) {
                newData.excludedSymptoms = [
                    ...(newData.excludedSymptoms || []),
                    currentContext,
                ];
            } else if (currentContext) {
                newData.additionalNotes =
                    (newData.additionalNotes || "") + " " + currentContext;
            }

            if (
                normalizedOption.includes("radiates") ||
                normalizedOption.includes("numbness")
            ) {
                newData.additionalNotes =
                    (newData.additionalNotes || "") + " numbness radiating";
            }

            if (option.length > 20) {
                const entities = medicalNER.extractEntities(option);
                const confirmed = medicalNER.getConfirmedSymptoms(entities);
                const denied = medicalNER.getDeniedSymptoms(entities);

                if (confirmed.length > 0) {
                    newData.additionalNotes =
                        (newData.additionalNotes || "") + " " + confirmed.join(" ");
                }
                if (denied.length > 0) {
                    newData.excludedSymptoms = [
                        ...(newData.excludedSymptoms || []),
                        ...denied,
                    ];
                }
            }

            setSymptomData(newData);
            setCurrentContext(null);
            setCurrentQuestion(null);
            runDiagnosis(newData);
        },
        [symptomData, currentQuestion, currentContext, addMessage, runDiagnosis]
    );

    // ── Reset ────────────────────────────────────────────────

    const handleReset = useCallback(() => {
        setSymptomData(null);
        setMessages([]);
        setIsComplete(false);
        setCurrentContext(null);
        setCurrentQuestion(null);
        setDialogueState(createDialogueState());
    }, []);

    return {
        messages,
        symptomData,
        isTyping,
        isComplete,
        dialogueState,
        preferences,
        handleIntakeSubmit,
        handleOptionSelect,
        handleReset,
    };
}
