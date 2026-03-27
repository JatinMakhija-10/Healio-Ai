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

    const startRecording = useCallback(async () => {
        if (!isSupported || isRecording) return;

        try {
            // First explicitly request/check microphone permissions
            // This forces the browser prompt if it hasn't been granted yet
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Immediately stop the stream tracks as we just needed permission, 
            // the SpeechRecognition API handles its own stream
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.error("Microphone permission denied or error:", err);
            return;
        }

        const SpeechRecognitionAPI =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognitionAPI) return;

        const recognition = new SpeechRecognitionAPI();
        // Read user's preferred language from Settings, default to en-IN
        const preferredLang = typeof window !== "undefined"
            ? localStorage.getItem("healio_speech_lang") || "en-IN"
            : "en-IN";
        recognition.lang = preferredLang;
        recognition.interimResults = false; // Set to false since we only want final to avoid duplication
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
            let currentTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    currentTranscript += event.results[i][0].transcript;
                } else {
                    // We only want to set the transcript when it's final so it doesn't duplicate
                    // while in interim mode. We ignore interim here.
                }
            }
            if (currentTranscript) {
                setTranscript(currentTranscript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);

            // Only attempt language fallback if explicitly 'language-not-supported'
            if (event.error === "language-not-supported" && recognition.lang !== "en-IN") {
                recognition.lang = "en-IN";
                try {
                    recognition.start();
                    return; // Successfully restarted in English
                } catch {
                    // Fall through to stop recording
                }
            }

            // For all other errors (like 'network', 'not-allowed', 'no-speech'), abort cleanly
            setIsRecording(false);
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
