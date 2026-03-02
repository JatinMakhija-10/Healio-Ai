"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseVoiceInputReturn {
    isRecording: boolean;
    transcript: string;
    isSupported: boolean;
    startRecording: () => void;
    stopRecording: () => void;
    clearTranscript: () => void;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function useVoiceInput(): UseVoiceInputReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const recognitionRef = useRef<any>(null);
    const [isSupported, setIsSupported] = useState(false);

    // Detect browser support client-side only to avoid SSR hydration mismatch
    useEffect(() => {
        setIsSupported(
            "SpeechRecognition" in window || "webkitSpeechRecognition" in window
        );
    }, []);

    const startRecording = useCallback(() => {
        if (!isSupported || isRecording) return;

        const SpeechRecognitionAPI =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognitionAPI) return;

        const recognition = new SpeechRecognitionAPI();
        recognition.lang = "hi-IN"; // Hindi primary
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
            let interim = "";
            let final = "";
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            setTranscript(final || interim);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            // If Hindi fails, try English
            if (event.error === "no-speech" || event.error === "not-allowed") {
                setIsRecording(false);
                return;
            }
            recognition.lang = "en-IN";
            try {
                recognition.start();
            } catch {
                setIsRecording(false);
            }
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
        } catch (e) {
            console.error("Failed to start speech recognition:", e);
            setIsRecording(false);
        }
    }, [isSupported, isRecording]);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsRecording(false);
    }, []);

    const clearTranscript = useCallback(() => {
        setTranscript("");
    }, []);

    return {
        isRecording,
        transcript,
        isSupported,
        startRecording,
        stopRecording,
        clearTranscript,
    };
}
