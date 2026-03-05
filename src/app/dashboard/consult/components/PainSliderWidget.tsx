"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface PainSliderWidgetProps {
    onSubmit: (value: number) => void;
}

function getPainLabel(value: number): string {
    if (value === 0) return "No pain";
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

export function PainSliderWidget({ onSubmit }: PainSliderWidgetProps) {
    const [value, setValue] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        setSubmitted(true);
        onSubmit(value);
    };

    if (submitted) {
        return (
            <div className="bg-[#E8F5F0] rounded-2xl rounded-br-sm px-4 py-3 text-[15px] text-gray-800 inline-block">
                {value}/10 — {getPainLabel(value)}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 p-5 max-w-md"
        >
            {/* Header row */}
            <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-semibold text-gray-800">
                    Current Pain Intensity
                </h4>
                <div className="text-right">
                    <span className={`text-2xl font-bold ${getPainColor(value)}`}>
                        {value}
                    </span>
                    <p className={`text-xs ${getPainColor(value)} font-medium`}>
                        {getPainLabel(value)}
                    </p>
                </div>
            </div>

            {/* Description */}
            <p className="text-xs text-teal-600 mb-4 leading-relaxed">
                How would you rate the intensity of your pain from 0 to 10, where 0 is no pain and 10 is the worst pain you can imagine?
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
                <div className="flex justify-between text-[11px] text-gray-400 mt-1.5 px-0.5">
                    <span>0 - No pain</span>
                    <span>5 - Moderate</span>
                    <span>10 - Worst Possible</span>
                </div>
            </div>

            {/* Submit */}
            <button
                onClick={handleSubmit}
                className="mt-4 w-full py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-all active:scale-[0.98] shadow-sm"
            >
                Confirm — {value}/10
            </button>
        </motion.div>
    );
}
