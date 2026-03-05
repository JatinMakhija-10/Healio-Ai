"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface PainLocationDropdownProps {
    onSubmit: (location: string) => void;
}

const BODY_REGIONS = [
    { label: "Head (Sar)", emoji: "🧠", value: "Head" },
    { label: "Neck (Gardan)", emoji: "🦴", value: "Neck" },
    { label: "Chest (Seena)", emoji: "🫁", value: "Chest" },
    { label: "Upper Abdomen (Oopar Pet)", emoji: "⬆️", value: "Upper Abdomen" },
    { label: "Lower Abdomen (Neeche Pet)", emoji: "⬇️", value: "Lower Abdomen" },
    { label: "Back (Peeth)", emoji: "🔙", value: "Back" },
    { label: "Lower Back (Kamar)", emoji: "💫", value: "Lower Back" },
    { label: "Shoulder (Kandha)", emoji: "💪", value: "Shoulder" },
    { label: "Arms (Baazu)", emoji: "🦾", value: "Arms" },
    { label: "Hands (Haath)", emoji: "🤲", value: "Hands" },
    { label: "Legs (Taang)", emoji: "🦵", value: "Legs" },
    { label: "Knees (Ghutna)", emoji: "🦿", value: "Knees" },
    { label: "Ankles (Takhna)", emoji: "🦶", value: "Ankles" },
    { label: "Feet (Pair)", emoji: "👣", value: "Feet" },
    { label: "Joints (Jod)", emoji: "⚡", value: "Joints" },
    { label: "Full Body (Pura Sharir)", emoji: "🧍", value: "Full Body" },
];

export function PainLocationDropdown({ onSubmit }: PainLocationDropdownProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleSelect = (region: typeof BODY_REGIONS[0]) => {
        setSelected(region.value);
    };

    const handleSubmit = () => {
        if (!selected) return;
        setSubmitted(true);
        onSubmit(selected);
    };

    if (submitted) {
        return (
            <div className="bg-[#E8F5F0] rounded-2xl rounded-br-sm px-4 py-3 text-[15px] text-gray-800 inline-block">
                📍 {selected}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 p-4 max-w-md"
        >
            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                📍 Select pain location <span className="text-gray-400 text-xs font-normal">— Dard ki jagah chunein</span>
            </p>

            <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1">
                {BODY_REGIONS.map((region) => (
                    <button
                        key={region.value}
                        onClick={() => handleSelect(region)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-all active:scale-[0.97] ${selected === region.value
                                ? "bg-teal-50 border-2 border-teal-500 text-teal-800 font-medium shadow-sm"
                                : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-teal-50 hover:border-teal-200"
                            }`}
                    >
                        <span className="text-lg">{region.emoji}</span>
                        <span className="truncate">{region.label}</span>
                    </button>
                ))}
            </div>

            <button
                onClick={handleSubmit}
                disabled={!selected}
                className={`mt-3 w-full py-2.5 text-sm font-medium rounded-xl transition-all active:scale-[0.98] ${selected
                        ? "bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
            >
                {selected ? `Confirm — ${selected}` : "Select a location"}
            </button>
        </motion.div>
    );
}
