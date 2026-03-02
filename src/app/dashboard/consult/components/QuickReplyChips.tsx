"use client";

import { motion } from "framer-motion";

interface QuickReplyChipsProps {
    options: string[];
    onSelect: (option: string) => void;
}

export function QuickReplyChips({ options, onSelect }: QuickReplyChipsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 px-4 pl-14"
        >
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => onSelect(option)}
                    className="px-3.5 py-1.5 text-sm bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-all active:scale-95 shadow-sm"
                >
                    {option}
                </button>
            ))}
        </motion.div>
    );
}
