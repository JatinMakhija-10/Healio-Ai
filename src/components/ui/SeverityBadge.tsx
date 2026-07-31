"use client";

import { useState } from "react";
import { Info } from "lucide-react";

export interface SeverityBadgeProps {
  level?: "mild" | "mild-moderate" | "moderate" | "moderate-severe" | "severe" | string;
  label?: string;
  showTooltip?: boolean;
  className?: string;
}

export function SeverityBadge({
  level = "mild",
  label,
  showTooltip = true,
  className = "",
}: SeverityBadgeProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const getStyles = () => {
    const normalized = level.toLowerCase();
    if (normalized.includes("severe")) {
      return {
        border: "border-[#C62828] text-[#C62828] bg-red-50/50",
        icon: "◉",
        displayLabel: label || "Severe",
      };
    }
    if (normalized.includes("moderate")) {
      return {
        border: "border-[#F57F17] text-[#F57F17] bg-amber-50/50",
        icon: "◉",
        displayLabel: label || "Moderate",
      };
    }
    return {
      border: "border-[#90A4AE] text-[#455A64] bg-slate-50/50",
      icon: "◉",
      displayLabel: label || "Mild",
    };
  };

  const style = getStyles();

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-xs ${style.border}`}
        role="status"
        aria-label={`Reported severity: ${style.displayLabel}`}
      >
        <span className="text-[10px]" aria-hidden="true">{style.icon}</span>
        <span>{style.displayLabel}</span>
        {showTooltip && (
          <button
            type="button"
            className="ml-0.5 rounded-full p-0.5 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current"
            aria-label="What does reported severity mean?"
            onClick={(e) => {
              e.stopPropagation();
              setTooltipOpen((prev) => !prev);
            }}
            onMouseEnter={() => setTooltipOpen(true)}
            onMouseLeave={() => setTooltipOpen(false)}
          >
            <Info className="size-3.5" />
          </button>
        )}
      </div>

      {tooltipOpen && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg bg-[#1A1A2E] p-3 text-xs leading-relaxed text-white shadow-xl animate-fadeInUp"
        >
          <p className="font-bold text-[#F57F17]">Reported Severity</p>
          <p className="mt-1">
            Reflects user-reported symptom intensity and discomfort, separate from algorithm confidence.
          </p>
          <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-[#1A1A2E]" />
        </div>
      )}
    </div>
  );
}
