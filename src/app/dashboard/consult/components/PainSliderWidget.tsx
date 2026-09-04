"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface PainSliderWidgetProps {
    onSubmit: (value: number) => void;
    questionText?: string;
    symptomTerm?: string;
}

/**
 * Dynamically extracts the primary subject/term being asked about from the question text.
 * Defaults to "Pain" if no specific term is found.
 */
export function extractSymptomTerm(questionText?: string, explicitTerm?: string): string {
    if (explicitTerm && explicitTerm.trim()) return explicitTerm.trim();
    if (!questionText) return "Pain";

    const cleanText = questionText.split(/\{"ui_hint"\s*:/)[0] ?? questionText;
    const text = cleanText.toLowerCase();

    // Priority explicit keywords (English & Hinglish)
    if (text.includes("discomfort") || text.includes("taklif") || text.includes("unease")) {
        return "Discomfort";
    }
    if (text.includes("nausea") || text.includes("ulti") || text.includes("ji machlana")) {
        return "Nausea";
    }
    if (text.includes("headache") || text.includes("head ache") || text.includes("sar dard") || text.includes("sir dard")) {
        return "Headache";
    }
    if (text.includes("fever") || text.includes("bukhar")) {
        return "Fever";
    }
    if (text.includes("itching") || text.includes("khujli")) {
        return "Itching";
    }
    if (text.includes("burning") || text.includes("jalan")) {
        return "Burning";
    }
    if (text.includes("cough") || text.includes("khansi")) {
        return "Cough";
    }
    if (text.includes("cramping") || text.includes("cramps") || text.includes("murod")) {
        return "Cramps";
    }
    if (text.includes("swelling") || text.includes("sujan")) {
        return "Swelling";
    }
    if (text.includes("dizziness") || text.includes("chakkar")) {
        return "Dizziness";
    }
    if (text.includes("stomach pain") || text.includes("pet dard") || text.includes("belly pain")) {
        return "Stomach Pain";
    }
    if (text.includes("back pain") || text.includes("kamar dard")) {
        return "Back Pain";
    }
    if (text.includes("chest pain") || text.includes("chhati mein dard")) {
        return "Chest Pain";
    }
    if (text.includes("joint pain") || text.includes("jod dard")) {
        return "Joint Pain";
    }

    // Dynamic phrase extraction: "how severe is your [X]", "how bad is your [X]", "intensity of your [X]"
    const matchPatterns = [
        /(?:how\s+severe\s+is\s+your|how\s+bad\s+is\s+your|rate\s+your|intensity\s+of\s+your|level\s+of\s+your|severity\s+of\s+your)\s+([a-z\s]+?)(?:\s+right|\s+on|\s+from|\s+now|\?|\.|$)/i,
        /(?:how\s+severe\s+is\s+the|how\s+bad\s+is\s+the|severity\s+of\s+the|intensity\s+of\s+the)\s+([a-z\s]+?)(?:\s+right|\s+on|\s+from|\s+now|\?|\.|$)/i,
    ];

    for (const pattern of matchPatterns) {
        const m = text.match(pattern);
        if (m && m[1]) {
            const candidate = m[1].trim();
            if (candidate && candidate.length > 2 && candidate.length < 25 && !["a", "the", "this", "that", "level", "rating"].includes(candidate)) {
                return candidate.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
            }
        }
    }

    if (text.includes("symptom")) {
        return "Symptom";
    }

    if (text.includes("pain") || text.includes("dard")) {
        return "Pain";
    }

    return "Pain";
}

function getHeaderTitle(term: string): string {
    const lower = term.toLowerCase();
    if (lower === "pain") return "Current Pain Intensity";
    if (lower === "discomfort") return "Discomfort Severity";
    if (lower.endsWith("pain")) return `Current ${term} Intensity`;
    return `${term} Severity`;
}

function getWidgetDescription(term: string): string {
    const lower = term.toLowerCase();
    if (lower === "pain") {
        return "How would you rate the intensity of your pain from 0 to 10, where 0 is no pain and 10 is the worst pain you can imagine?";
    }
    if (lower === "discomfort") {
        return "How would you rate your level of discomfort from 0 to 10, where 0 is no discomfort and 10 is the most severe discomfort possible?";
    }
    return `How would you rate the severity of your ${lower} from 0 to 10, where 0 is no ${lower} and 10 is the most severe ${lower} possible?`;
}

function getPainLabel(value: number, term: string): string {
    const lower = term.toLowerCase();
    if (value === 0) return `No ${lower}`;
    if (value <= 3) return "Mild";
    if (value <= 6) return "Moderate";
    if (value <= 8) return "Severe";
    return "Worst Possible";
}

function getPainColor(value: number): string {
    if (value === 0) return "text-teal-600";
    if (value <= 3) return "text-green-600";
    if (value <= 6) return "text-yellow-600";
    if (value <= 8) return "text-orange-600";
    return "text-red-600";
}

export function PainSliderWidget({ onSubmit, questionText, symptomTerm }: PainSliderWidgetProps) {
    const [value, setValue] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const term = extractSymptomTerm(questionText, symptomTerm);
    const headerTitle = getHeaderTitle(term);
    const descriptionText = getWidgetDescription(term);

    const handleSubmit = () => {
        setSubmitted(true);
        onSubmit(value);
    };

    if (submitted) {
        return (
            <div className="inline-block rounded-[8px] rounded-br-[3px] bg-[#1A1A2E] px-4 py-3 text-[15px] text-white">
                {value}/10 - {getPainLabel(value, term)}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md rounded-[8px] rounded-tl-[3px] border border-[#DAD7CF] bg-white p-5 shadow-sm"
        >
            {/* Header row */}
            <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-bold text-[#1A1A2E]">
                    {headerTitle}
                </h4>
                <div className="text-right">
                    <span className={`text-2xl font-bold ${getPainColor(value)}`}>
                        {value}
                    </span>
                    <p className={`text-xs ${getPainColor(value)} font-medium`}>
                        {getPainLabel(value, term)}
                    </p>
                </div>
            </div>

            {/* Description */}
            <p className="mb-4 text-xs leading-relaxed text-[#0F6E56]">
                {descriptionText}
            </p>

            {/* Slider */}
            <div className="px-0.5">
                <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-teal-600"
                    style={{
                        background: `linear-gradient(to right, #2A9D8F ${value * 10}%, #E5E7EB ${value * 10}%)`,
                    }}
                />
                <div className="mt-1.5 flex justify-between px-0.5 text-[11px] text-[#8C8C8C]">
                    <span>0 - No {term.toLowerCase()}</span>
                    <span>5 - Moderate</span>
                    <span>10 - Worst Possible</span>
                </div>
            </div>

            {/* Submit */}
            <button
                onClick={handleSubmit}
                className="mt-4 w-full rounded-full bg-[#1A1A2E] py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#0F6E56] active:scale-[0.98]"
            >
                Confirm - {value}/10
            </button>
        </motion.div>
    );
}
