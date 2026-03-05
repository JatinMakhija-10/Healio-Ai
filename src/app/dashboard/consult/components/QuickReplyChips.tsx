"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface QuickReplyChipsProps {
    options: string[];
    onSelect: (option: string) => void;
}

export function QuickReplyChips({ options, onSelect }: QuickReplyChipsProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [selected, setSelected] = useState<string | null>(null);

    const handleSelect = (option: string) => {
        setSelected(option);
        setIsOpen(false);
        onSelect(option);
    };

    if (selected) {
        return null; // Hide after selection — the message bubble will show the selection
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="pl-14 px-4"
        >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-xs">
                {/* Dropdown header */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                    <span className="text-xs font-medium text-gray-400">Select an option</span>
                    <ChevronDown
                        size={14}
                        className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                </button>

                {/* Dropdown options */}
                {isOpen && (
                    <div className="border-t border-gray-100 max-h-[220px] overflow-y-auto">
                        {options.map((option, index) => (
                            <button
                                key={option}
                                onClick={() => handleSelect(option)}
                                className={`w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors ${index !== options.length - 1 ? "border-b border-gray-50" : ""
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
