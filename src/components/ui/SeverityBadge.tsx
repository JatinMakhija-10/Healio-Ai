"use client";

import { useState } from "react";
import { Info } from "lucide-react";

export interface SeverityBadgeProps {
  level?: "mild" | "mild-moderate" | "moderate" | "moderate-severe" | "severe" | string;
  label?: string;
  showTooltip?: boolean;
  tooltipPosition?: "top" | "bottom" | "bottom-left" | "bottom-right" | "top-left" | "top-right";
  className?: string;
}

export function SeverityBadge({
  level = "mild",
  label,
  showTooltip = true,
  tooltipPosition = "bottom-right",
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

  const getTooltipClasses = () => {
    switch (tooltipPosition) {
      case "bottom-left":
        return {
          box: "top-full left-0 mt-2",
          arrow: "bottom-full left-3.5 border-b-[#1A1A2E] border-x-transparent border-t-transparent",
        };
      case "bottom":
        return {
          box: "top-full left-1/2 -translate-x-1/2 mt-2",
          arrow: "bottom-full left-1/2 -ml-1 border-b-[#1A1A2E] border-x-transparent border-t-transparent",
        };
      case "top-right":
        return {
          box: "bottom-full right-0 mb-2",
          arrow: "top-full right-3.5 border-t-[#1A1A2E] border-x-transparent border-b-transparent",
        };
      case "top-left":
        return {
          box: "bottom-full left-0 mb-2",
          arrow: "top-full left-3.5 border-t-[#1A1A2E] border-x-transparent border-b-transparent",
        };
      case "top":
        return {
          box: "bottom-full left-1/2 -translate-x-1/2 mb-2",
          arrow: "top-full left-1/2 -ml-1 border-t-[#1A1A2E] border-x-transparent border-b-transparent",
        };
      case "bottom-right":
      default:
        return {
          box: "top-full right-0 mt-2",
          arrow: "bottom-full right-3.5 border-b-[#1A1A2E] border-x-transparent border-t-transparent",
        };
    }
  };

  const tooltipClasses = getTooltipClasses();

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
          className={`absolute z-50 w-64 rounded-lg bg-[#1A1A2E] p-3 text-xs leading-relaxed text-white shadow-xl animate-fadeInUp ${tooltipClasses.box}`}
        >
          <p className="font-bold text-[#F57F17]">Reported Severity</p>
          <p className="mt-1">
            Reflects user-reported symptom intensity and discomfort, separate from algorithm confidence.
          </p>
          <div className={`absolute border-4 ${tooltipClasses.arrow}`} />
        </div>
      )}
    </div>
  );
}

