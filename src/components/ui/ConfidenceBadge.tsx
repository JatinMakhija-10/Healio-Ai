"use client";

import { useState } from "react";
import { Info } from "lucide-react";

export interface ConfidenceBadgeProps {
  score?: number;
  level?: "high" | "moderate" | "low" | "good";
  label?: string;
  showTooltip?: boolean;
  tooltipPosition?: "top" | "bottom" | "bottom-left" | "bottom-right" | "top-left" | "top-right";
  className?: string;
}

export function ConfidenceBadge({
  score,
  level = "moderate",
  label,
  showTooltip = true,
  tooltipPosition = "bottom-right",
  className = "",
}: ConfidenceBadgeProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // Normalize level from score if provided
  let activeLevel = level;
  if (typeof score === "number") {
    if (score >= 88) activeLevel = "high";
    else if (score >= 75) activeLevel = "good";
    else if (score >= 60) activeLevel = "moderate";
    else activeLevel = "low";
  }

  const getStyles = () => {
    switch (activeLevel) {
      case "high":
        return {
          bg: "bg-[#2E7D32] text-white",
          dot: "bg-white",
          displayLabel: label || "High match",
        };
      case "good":
        return {
          bg: "bg-[#0F6E56] text-white",
          dot: "bg-white",
          displayLabel: label || "Good match",
        };
      case "moderate":
        return {
          bg: "bg-[#F57F17] text-white",
          dot: "bg-white",
          displayLabel: label || "Moderate match",
        };
      case "low":
      default:
        return {
          bg: "bg-[#C62828] text-white",
          dot: "bg-white",
          displayLabel: label || "Preliminary match",
        };
    }
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
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${style.bg}`}
        role="status"
        aria-label={`Match confidence: ${style.displayLabel}`}
      >
        <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
        <span>{style.displayLabel}</span>
        {showTooltip && (
          <button
            type="button"
            className="ml-0.5 rounded-full p-0.5 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            aria-label="What does match confidence mean?"
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
          <p className="font-bold text-[#9FE1CB]">Match Confidence</p>
          <p className="mt-1">
            Indicates how closely reported symptoms match established health patterns. It represents statistical alignment — not a medical certainty.
          </p>
          <div className={`absolute border-4 ${tooltipClasses.arrow}`} />
        </div>
      )}
    </div>
  );
}

