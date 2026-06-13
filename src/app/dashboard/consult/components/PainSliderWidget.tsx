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
            <div className="inline-block rounded-[8px] rounded-br-[3px] bg-[#1A1A2E] px-4 py-3 text-[15px] text-white">
                {value}/10 - {getPainLabel(value)}
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
            <p className="mb-4 text-xs leading-relaxed text-[#0F6E56]">
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
                <div className="mt-1.5 flex justify-between px-0.5 text-[11px] text-[#8C8C8C]">
                    <span>0 - No pain</span>
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
