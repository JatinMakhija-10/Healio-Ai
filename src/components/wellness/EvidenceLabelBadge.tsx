"use client";

/**
 * EvidenceLabelBadge
 *
 * Plan ref: Part IV §4.3 + §4.4
 * Renders the 5-type evidence label from the plan as a small inline badge
 * with a tooltip description. Uses existing Badge + Tooltip UI primitives.
 *
 * Usage:
 *   <EvidenceLabelBadge label="traditional_practice" />
 *   <EvidenceLabelBadge label="clinically_established" size="sm" />
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  type EvidenceLabelKey,
  getEvidenceLabel,
} from "@/lib/wellness/evidenceLabels";

interface EvidenceLabelBadgeProps {
  label: EvidenceLabelKey;
  /** "sm" for inline use inside chat bubbles; "md" for content cards */
  size?: "sm" | "md";
  className?: string;
  /** Set false to suppress the tooltip (e.g. when space is tight) */
  showTooltip?: boolean;
}

export function EvidenceLabelBadge({
  label,
  size = "md",
  className,
  showTooltip = true,
}: EvidenceLabelBadgeProps) {
  const config = getEvidenceLabel(label);

  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium shrink-0 whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        config.textClass,
        config.bgClass,
        "border-current/20",
        className
      )}
      style={{
        color: config.colorVar,
        backgroundColor: config.bgColorVar,
        borderColor: `color-mix(in srgb, ${config.colorVar} 25%, transparent)`,
      }}
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full shrink-0"
        style={{ backgroundColor: config.colorVar }}
      />
      {config.label}
    </span>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{badge}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-center">
          {config.description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
