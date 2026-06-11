"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface QuickReplyChipsProps {
    options: string[];
    onSelect: (option: string) => void;
}

export function QuickReplyChips({ options, onSelect }: QuickReplyChipsProps) {
    const [selected, setSelected] = useState<string | null>(null);

    const handleSelect = (option: string) => {
        if (option.includes("Other")) {
            window.dispatchEvent(new CustomEvent('focus-chat-input'));
            return;
        }
        setSelected(option);
        onSelect(option);
    };

    if (selected) {
        return null; // Hide after selection — the message bubble will show the selection
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="pl-14 px-4 py-2 flex flex-wrap gap-2"
        >
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    className="px-3.5 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-[14px] text-slate-700 hover:text-teal-900 rounded-full transition-all duration-200 shadow-sm cursor-pointer active:scale-95"
                >
                    {option}
                </button>
            ))}
        </motion.div>
    );
}
