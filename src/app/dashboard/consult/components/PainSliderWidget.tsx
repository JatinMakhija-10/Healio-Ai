"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface PainSliderWidgetProps {
    onSubmit: (value: number) => void;
}

const PAIN_LABELS = [
    { range: [0, 0], label: "No pain", emoji: "😊", color: "bg-green-400" },
    { range: [1, 3], label: "Mild", emoji: "🙂", color: "bg-lime-400" },
    { range: [4, 6], label: "Moderate", emoji: "😐", color: "bg-yellow-400" },
    { range: [7, 8], label: "Severe", emoji: "😣", color: "bg-orange-400" },
    { range: [9, 10], label: "Extreme", emoji: "😫", color: "bg-red-500" },
];

function getPainInfo(value: number) {
    return (
        PAIN_LABELS.find(
            (p) => value >= p.range[0] && value <= p.range[1]
        ) || PAIN_LABELS[0]
    );
}

export function PainSliderWidget({ onSubmit }: PainSliderWidgetProps) {
    const [value, setValue] = useState(5);
    const [submitted, setSubmitted] = useState(false);
    const info = getPainInfo(value);

    const handleSubmit = () => {
        setSubmitted(true);
        onSubmit(value);
    };

    if (submitted) {
        return (
            <div className="bg-[#E8F5F0] rounded-2xl rounded-br-sm px-4 py-3 text-[15px] text-gray-800 inline-block">
                {value}/10 — {info.label} {info.emoji}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 p-4 max-w-sm"
        >
            {/* Current value display */}
            <div className="text-center mb-3">
                <span className="text-4xl">{info.emoji}</span>
                <div className="mt-1">
                    <span className="text-2xl font-bold text-gray-800">
                        {value}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">/10</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{info.label}</p>
            </div>

            {/* Slider */}
            <div className="px-1">
                <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-teal-600"
                    style={{
                        background: `linear-gradient(to right, #2A9D8F ${value * 10
                            }%, #E5E7EB ${value * 10}%)`,
                    }}
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-0.5">
                    <span>0</span>
                    <span>5</span>
                    <span>10</span>
                </div>
            </div>

            {/* Submit */}
            <button
                onClick={handleSubmit}
                className="mt-3 w-full py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-all active:scale-[0.98]"
            >
                Confirm — {value}/10
            </button>
        </motion.div>
    );
}
