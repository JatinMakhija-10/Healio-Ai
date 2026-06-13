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
        return null; // Hide after selection; the message bubble will show the selection
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 px-4 py-2 pl-14"
        >
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    className="min-h-10 cursor-pointer rounded-full border border-[#DAD7CF] bg-white px-4 py-2 text-[14px] font-semibold text-[#1C1C1E] shadow-sm transition-all duration-200 hover:border-[#9FE1CB] hover:bg-[#E1F5EE] hover:text-[#0F6E56] active:scale-[0.98]"
                >
                    {option}
                </button>
            ))}
        </motion.div>
    );
}
