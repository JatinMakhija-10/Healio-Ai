"use client";

import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

export function TypingIndicator() {
    return (
        <div className="flex items-start gap-3 px-4">
            {/* Healio Avatar */}
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#1D9E75] text-white shadow-sm">
                <Leaf className="h-5 w-5" strokeWidth={2.3} aria-hidden="true" />
            </div>
            {/* Bouncing dots */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 rounded-[8px] rounded-tl-[3px] border border-[#DAD7CF] bg-white px-4 py-3 shadow-sm"
            >
                <div
                    className="h-2 w-2 animate-bounce rounded-full bg-[#0F6E56]"
                    style={{ animationDelay: "0ms", animationDuration: "0.6s" }}
                />
                <div
                    className="h-2 w-2 animate-bounce rounded-full bg-[#0F6E56]"
                    style={{ animationDelay: "150ms", animationDuration: "0.6s" }}
                />
                <div
                    className="h-2 w-2 animate-bounce rounded-full bg-[#0F6E56]"
                    style={{ animationDelay: "300ms", animationDuration: "0.6s" }}
                />
            </motion.div>
        </div>
    );
}
