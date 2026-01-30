"use client";

import { useState } from "react";
import { Check, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface ChecklistItem {
    id: string;
    text: string;
    category?: string;
    priority?: 'critical' | 'normal';
    frequency?: string;
    isCompleted: boolean;
    notes?: string;
}

interface ChecklistProps {
    items: ChecklistItem[];
    onToggle: (id: string, checked: boolean) => void;
    className?: string;
}

export function Checklist({ items, onToggle, className }: ChecklistProps) {
    return (
        <div className={cn("space-y-3", className)}>
            <AnimatePresence>
                {items.map((item) => (
                    <ChecklistItemCard key={item.id} item={item} onToggle={onToggle} />
                ))}
            </AnimatePresence>
            {items.length === 0 && (
                <div className="text-center p-8 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <p>No tasks for today. Enjoy your rest!</p>
                </div>
            )}
        </div>
    );
}

function ChecklistItemCard({ item, onToggle }: { item: ChecklistItem; onToggle: (id: string, checked: boolean) => void }) {
    const isCritical = item.priority === 'critical';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            layout
            className={cn(
                "group relative overflow-hidden rounded-xl border p-4 transition-all duration-300",
                item.isCompleted
                    ? "bg-slate-50 border-slate-100 opacity-75"
                    : isCritical
                        ? "bg-white border-amber-200 shadow-sm hover:shadow-md hover:border-amber-300"
                        : "bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-teal-200"
            )}
        >
            <div className="flex items-start gap-4">
                <button
                    onClick={() => onToggle(item.id, !item.isCompleted)}
                    className={cn(
                        "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20",
                        item.isCompleted
                            ? "border-teal-500 bg-teal-500 text-white"
                            : isCritical
                                ? "border-amber-400 text-transparent hover:border-amber-500"
                                : "border-slate-300 text-transparent hover:border-teal-500"
                    )}
                >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </button>

                <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                        <label
                            className={cn(
                                "text-sm font-semibold transition-all duration-300 cursor-pointer select-none",
                                item.isCompleted ? "text-slate-500 line-through decoration-slate-300" : "text-slate-900"
                            )}
                            onClick={() => onToggle(item.id, !item.isCompleted)}
                        >
                            {item.text}
                        </label>
                        {item.category && (
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                item.isCompleted
                                    ? "bg-slate-100 text-slate-400"
                                    : "bg-slate-100 text-slate-600"
                            )}>
                                {item.category}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        {item.frequency && (
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.frequency}
                            </span>
                        )}
                        {isCritical && !item.isCompleted && (
                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                                <AlertCircle className="h-3 w-3" />
                                Priority
                            </span>
                        )}
                    </div>

                    {item.notes && !item.isCompleted && (
                        <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100">
                            {item.notes}
                        </div>
                    )}
                </div>
            </div>

            {/* Completion Effect Bar */}
            <div
                className={cn(
                    "absolute bottom-0 left-0 h-1 bg-teal-500 transition-all duration-500",
                    item.isCompleted ? "w-full" : "w-0"
                )}
            />
        </motion.div>
    );
}
