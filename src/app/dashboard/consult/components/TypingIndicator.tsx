"use client";

import { motion } from "framer-motion";

export function TypingIndicator() {
    return (
        <div className="flex items-start gap-3 px-4">
            {/* Healio Avatar */}
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white text-xs font-bold">H</span>
            </div>
            {/* Bouncing dots */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-1.5"
            >
                <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms", animationDuration: "0.6s" }}
                />
                <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms", animationDuration: "0.6s" }}
                />
                <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms", animationDuration: "0.6s" }}
                />
            </motion.div>
        </div>
    );
}
