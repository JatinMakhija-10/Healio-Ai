"use client";

import { useState, useRef, useEffect } from "react";
import { IntakeCard } from "./IntakeCard";
import { DiagnosisResultCard } from "./DiagnosisResultCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserSymptomData, DiagnosisResult, ClarificationQuestion } from "@/lib/diagnosis/types";
import { diagnose } from "@/lib/diagnosis/engine";
import { Bot, User } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

// Enhanced Dialogue Management
import {
    DialogueState,
    EmotionalState,
    createDialogueState,
    updateDialogueState,
    transitionPhase,
    intentEngine,
    medicalNER,
    responseGenerator
} from "@/lib/diagnosis/dialogue";
import { UncertaintyEstimate, RuleResult } from "@/lib/diagnosis/advanced";

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
    type?: "text" | "diagnosis_card" | "options";
    options?: string[]; // For clarification
    diagnosis?: DiagnosisResult;
    uncertainty?: UncertaintyEstimate;
    clinicalRules?: RuleResult[];
    alerts?: string[];
};

// Emotional state detection patterns
const ANXIOUS_PATTERNS = /worried|scared|anxious|nervous|frightened|terrified|panic|afraid|fear|please help|am i dying/i;
const FRUSTRATED_PATTERNS = /frustrated|annoyed|irritated|already told you|again\?|keep asking|same question/i;
const URGENT_PATTERNS = /urgent|emergency|help me|right now|immediately|asap|can't wait|critical|serious/i;

function detectEmotionalState(message: string): EmotionalState {
    if (URGENT_PATTERNS.test(message)) return 'urgent';
    if (FRUSTRATED_PATTERNS.test(message)) return 'frustrated';
    if (ANXIOUS_PATTERNS.test(message)) return 'anxious';
    return 'calm';
}

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export default function ChatInterface() {
    const [symptomData, setSymptomData] = useState<UserSymptomData | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [currentContext, setCurrentContext] = useState<string | null>(null); // Legacy single symptom context
    const [currentQuestion, setCurrentQuestion] = useState<ClarificationQuestion | null>(null); // Full question context for multi-choice
    const [isComplete, setIsComplete] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    // Enhanced dialogue state tracking
    const [dialogueState, setDialogueState] = useState<DialogueState>(() => createDialogueState());

    // User Preferences
    const [preferences, setPreferences] = useState({
        ayurvedicMode: true,
        showUncertainty: true,
        detailedExplanations: true
    });

    useEffect(() => {
        const savedAyurvedic = localStorage.getItem("healio_pref_ayurvedic");
        const savedUncertainty = localStorage.getItem("healio_pref_uncertainty");
        const savedDetailed = localStorage.getItem("healio_pref_detailed");

        // eslint-disable-next-line react-hooks/exhaustive-deps
        setPreferences({
            ayurvedicMode: savedAyurvedic !== "false", // Default true
            showUncertainty: savedUncertainty !== "false", // Default true
            detailedExplanations: savedDetailed !== "false" // Default true
        });
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => scrollToBottom(), [messages, isTyping]);

    const addMessage = (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
    };

    const saveConsultation = async (symptoms: UserSymptomData, diagnosisResult: DiagnosisResult, uncertainty?: UncertaintyEstimate, rules?: RuleResult[]) => {
        const consultationData = {
            id: generateId(),
            created_at: new Date().toISOString(),
            symptoms: symptoms,
            diagnosis: {
                condition: diagnosisResult.condition.name,
                description: diagnosisResult.condition.description,
                severity: diagnosisResult.condition.severity,
                remedies: diagnosisResult.condition.remedies,
                indianHomeRemedies: diagnosisResult.condition.indianHomeRemedies,
                exercises: diagnosisResult.condition.exercises,
                warnings: diagnosisResult.condition.warnings,
                seekHelp: diagnosisResult.condition.seekHelp
            },
            confidence: diagnosisResult.confidence,
            uncertainty: uncertainty,
            clinicalRules: rules
        };

        // Always save to localStorage as backup
        try {
            const existingHistory = JSON.parse(localStorage.getItem('healio_consultation_history') || '[]');
            existingHistory.unshift(consultationData);
            // Keep only last 20 consultations in localStorage
            const trimmedHistory = existingHistory.slice(0, 20);
            localStorage.setItem('healio_consultation_history', JSON.stringify(trimmedHistory));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }

        // Also save to Supabase if user is authenticated
        if (user) {
            try {
                await supabase.from('consultations').insert({
                    user_id: user.id,
                    symptoms: symptoms,
                    diagnosis: consultationData.diagnosis,
                    confidence: diagnosisResult.confidence
                });
            } catch (error) {
                console.error('Failed to save consultation to Supabase:', error);
            }
        }
    };

    const handleIntakeSubmit = async (data: UserSymptomData) => {
        // Enrich data with user profile if available
        const enrichedData: UserSymptomData = {
            ...data,
            userProfile: user?.user_metadata ? {
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
            } : undefined
        };

        setSymptomData(enrichedData);
        setIsTyping(true);

        // Transition dialogue state to intake phase
        setDialogueState(prev => transitionPhase(prev, 'intake'));

        setTimeout(() => {
            setIsTyping(false);

            // Generate empathetic acknowledgment
            const acknowledgment = responseGenerator.generate(
                `I understand you have ${data.duration} ${data.painType} pain in your ${data.location.join(", ")} with a severity of ${data.intensity}/10. Let me analyze that for you.`,
                dialogueState
            );

            addMessage({
                id: generateId(),
                role: "assistant",
                content: acknowledgment
            });

            // Update dialogue state
            setDialogueState(prev => transitionPhase(prev, 'clarification'));

            runDiagnosis(enrichedData);
        }, 1500);
    };

    const runDiagnosis = (data: UserSymptomData) => {
        setIsTyping(true);

        setTimeout(async () => {
            const result = await diagnose(data);
            setIsTyping(false);

            // Check for emergency alerts first
            if (result.alerts && result.alerts.length > 0) {
                // Show emergency alerts prominently
                for (const alert of result.alerts) {
                    addMessage({
                        id: generateId(),
                        role: "assistant",
                        content: alert
                    });
                }
            }

            // Check for clarification question
            if (result.question) {
                setCurrentQuestion(result.question);
                setCurrentContext(result.question.symptomKey || null);

                // Generate empathetic question with explanation
                const questionType = result.question.symptomKey?.includes('trigger') ? 'trigger' : 'symptom';
                const enhancedQuestion = responseGenerator.generateQuestion(
                    result.question.question,
                    questionType,
                    dialogueState
                );

                // Update turn count in dialogue state
                setDialogueState(prev => updateDialogueState(prev, {
                    turnsCount: prev.context.turnsCount + 1
                }));

                addMessage({
                    id: generateId(),
                    role: "assistant",
                    content: enhancedQuestion,
                    type: "options",
                    options: result.question.options
                });
            } else if (result.results.length > 0) {
                // Transition to diagnosis phase
                setDialogueState(prev => transitionPhase(prev, 'diagnosis'));

                // Show diagnosis with empathetic framing
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
                    alerts: result.alerts
                });

                // Save consultation to history
                await saveConsultation(data, topResult, result.uncertainty, result.clinicalRules);

                // End chat with empathetic conclusion
                setTimeout(() => {
                    setIsComplete(true);
                    setDialogueState(prev => transitionPhase(prev, 'guidance'));

                    const conclusion = responseGenerator.generateConclusion(dialogueState);
                    addMessage({
                        id: "end_msg",
                        role: "assistant",
                        content: conclusion
                    });
                }, 1000);
            } else {
                addMessage({
                    id: generateId(),
                    role: "assistant",
                    content: responseGenerator.generate(
                        "I'm having trouble pinpointing the exact condition based on the information provided. It's best to consult a healthcare professional who can examine you in person.",
                        dialogueState
                    )
                });
                setIsComplete(true);
            }
        }, 1500);
    };

    const handleOptionSelect = (option: string) => {
        // Add user response
        addMessage({
            id: generateId(),
            role: "user",
            content: option
        });

        // Detect emotional state from user's response
        const detectedEmotion = detectEmotionalState(option);
        if (detectedEmotion !== 'calm') {
            setDialogueState(prev => updateDialogueState(prev, {
                emotionalState: detectedEmotion
            }));
        }

        // Update symptom data based on answer and re-run diagnosis
        const newData = { ...symptomData } as UserSymptomData;
        const normalizedOption = option.toLowerCase();

        // 1. Handle Multi-Choice questions (Fixes the infinite loop)
        if (currentQuestion?.type === 'multi_choice' && currentQuestion.multiSelectTokens) {
            const index = currentQuestion.options.findIndex(o => o.toLowerCase() === normalizedOption);

            if (normalizedOption === "none of the above") {
                // If user says none, exclude all tokens shown so we don't ask again
                newData.excludedSymptoms = [
                    ...(newData.excludedSymptoms || []),
                    ...currentQuestion.multiSelectTokens
                ];
            } else if (index !== -1 && currentQuestion.multiSelectTokens[index]) {
                // User picked a specific symptom - map it back to the clinical token
                const token = currentQuestion.multiSelectTokens[index];
                newData.additionalNotes = (newData.additionalNotes || "") + " " + token;
            }
        }
        // 2. Handle standard Yes/No questions (Linear fallback)
        else if (normalizedOption.startsWith("no") && currentContext) {
            // Add to excluded symptoms so we don't ask again or consider it matches
            newData.excludedSymptoms = [
                ...(newData.excludedSymptoms || []),
                currentContext
            ];
        }
        // 3. Handle positive responses for single questions
        else if (currentContext) {
            newData.additionalNotes = (newData.additionalNotes || "") + " " + currentContext;
        }

        // 4. Fallback for specific keywords (legacy support)
        if (normalizedOption.includes("radiates") || normalizedOption.includes("numbness")) {
            newData.additionalNotes = (newData.additionalNotes || "") + " numbness radiating";
        }

        // 5. Use Medical NER to extract any additional symptoms from free-text responses
        if (option.length > 20) {
            const entities = medicalNER.extractEntities(option);
            const confirmedSymptoms = medicalNER.getConfirmedSymptoms(entities);
            const deniedSymptoms = medicalNER.getDeniedSymptoms(entities);

            if (confirmedSymptoms.length > 0) {
                newData.additionalNotes = (newData.additionalNotes || "") + " " + confirmedSymptoms.join(" ");
            }
            if (deniedSymptoms.length > 0) {
                newData.excludedSymptoms = [
                    ...(newData.excludedSymptoms || []),
                    ...deniedSymptoms
                ];
            }
        }

        setSymptomData(newData);
        setCurrentContext(null);
        setCurrentQuestion(null); // Reset both contexts after answering
        runDiagnosis(newData);
    };

    const handleReset = () => {
        setSymptomData(null);
        setMessages([]);
        setIsComplete(false);
        setCurrentContext(null);
        setCurrentQuestion(null);
        // Reset dialogue state for new conversation
        setDialogueState(createDialogueState());
    };

    if (!symptomData) {
        return (
            <div className="flex justify-center pt-8">
                <IntakeCard onSubmit={handleIntakeSubmit} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100dvh-140px)] max-w-3xl mx-auto">
            <div className="flex-1 overflow-y-auto space-y-6 pr-4 pb-4">
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                        <Avatar className="w-8 h-8 border border-slate-200">
                            <AvatarFallback className={msg.role === "assistant" ? "bg-teal-600 text-white" : "bg-slate-200"}>
                                {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
                            </AvatarFallback>
                        </Avatar>

                        <div className={`space-y-2 max-w-[80%]`}>
                            <div className={`p-3 rounded-lg text-sm ${msg.role === "assistant"
                                ? "bg-white border border-slate-200 text-slate-800 shadow-sm"
                                : "bg-slate-900 text-white"
                                }`}>
                                {msg.content}
                            </div>

                            {msg.type === "options" && msg.options && (
                                <div className="flex flex-wrap gap-2">
                                    {msg.options.map((opt) => (
                                        <Button
                                            key={opt}
                                            variant="outline"
                                            className="text-xs bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200"
                                            onClick={() => handleOptionSelect(opt)}
                                        >
                                            {opt}
                                        </Button>
                                    ))}
                                </div>
                            )}

                            {msg.type === "diagnosis_card" && msg.diagnosis && (
                                <DiagnosisResultCard
                                    condition={msg.diagnosis.condition}
                                    confidence={msg.diagnosis.confidence}
                                    uncertainty={msg.uncertainty}
                                    clinicalRules={msg.clinicalRules}
                                    alerts={msg.alerts}
                                    showIndianRemedies={preferences.ayurvedicMode}
                                    showUncertaintyDetails={preferences.showUncertainty}
                                    showDetailedExplanations={preferences.detailedExplanations}
                                    reasoningTrace={msg.diagnosis.reasoningTrace}
                                />
                            )}
                        </div>
                    </motion.div>
                ))}

                {isTyping && (
                    <div className="flex gap-3">
                        <Avatar className="w-8 h-8 border border-slate-200">
                            <AvatarFallback className="bg-teal-600 text-white"><Bot size={16} /></AvatarFallback>
                        </Avatar>
                        <div className="bg-white border border-slate-200 p-3 rounded-lg flex gap-1 items-center h-10 w-16">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                    </div>
                )}
                {isComplete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-center pt-4"
                    >
                        <Button
                            onClick={handleReset}
                            className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-md px-6 py-6 rounded-xl"
                        >
                            Start New Diagnosis
                        </Button>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
