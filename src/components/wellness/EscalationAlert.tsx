"use client";

/**
 * EscalationAlert
 *
 * Plan ref: Part IV §4.3 + Part II §3.5 (Escalation Ladder)
 *
 * Renders the 5-level escalation ladder result from Ask Arovia responses.
 * - L1 / L2 / L3  — dismissible informational banners
 * - L4 / L5       — NON-DISMISSIBLE, hard CTA required (plan requirement)
 *
 * Note: The existing EmergencyRedirect component handles hard L5 detection
 * mid-conversation and is preserved. This component is for the structured
 * escalation output attached to every Ask Arovia response.
 */

import * as React from "react";
import {
  AlertTriangle,
  Phone,
  Clock,
  CheckCircle,
  Eye,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EscalationLevel = "L1" | "L2" | "L3" | "L4" | "L5";

export interface EscalationAlertProps {
  level: EscalationLevel;
  /** Plain-language reason shown to the user */
  reason: string;
  /**
   * Specific action instruction for this level.
   * e.g. "If symptoms worsen before 48 h, return here or see a practitioner."
   */
  action: string;
  /** For L3/L4: optional guidance on what to tell the practitioner */
  practitionerTip?: string;
  /** Callback for dismissible levels (L1–L3). Not called for L4/L5. */
  onDismiss?: () => void;
  className?: string;
}

const LEVEL_CONFIG: Record<
  EscalationLevel,
  {
    label: string;
    icon: React.ReactNode;
    colorVar: string;
    bgColorVar: string;
    borderClass: string;
    dismissible: boolean;
  }
> = {
  L1: {
    label: "Routine Self-Care",
    icon: <CheckCircle className="size-5 shrink-0" />,
    colorVar: "var(--arovia-escalation-l1)",
    bgColorVar: "var(--arovia-wellness-primary-bg)",
    borderClass: "border-[#2D6A4F]/30",
    dismissible: true,
  },
  L2: {
    label: "Watchful Waiting",
    icon: <Eye className="size-5 shrink-0" />,
    colorVar: "var(--arovia-escalation-l2)",
    bgColorVar: "var(--arovia-wellness-secondary-bg)",
    borderClass: "border-[#E9A21A]/40",
    dismissible: true,
  },
  L3: {
    label: "Non-Urgent Consult Recommended",
    icon: <Clock className="size-5 shrink-0" />,
    colorVar: "var(--arovia-escalation-l3)",
    bgColorVar: "#FEF3C7",
    borderClass: "border-amber-400/40",
    dismissible: true,
  },
  L4: {
    label: "See a Doctor Today",
    icon: <AlertTriangle className="size-5 shrink-0" />,
    colorVar: "var(--arovia-escalation-l4)",
    bgColorVar: "#FFF0EB",
    borderClass: "border-orange-500/50",
    dismissible: false,
  },
  L5: {
    label: "Emergency — Seek Care Now",
    icon: <Phone className="size-5 shrink-0" />,
    colorVar: "var(--arovia-escalation-l5)",
    bgColorVar: "var(--arovia-escalation-l5-bg)",
    borderClass: "border-red-500/60",
    dismissible: false,
  },
};

export function EscalationAlert({
  level,
  reason,
  action,
  practitionerTip,
  onDismiss,
  className,
}: EscalationAlertProps) {
  const [dismissed, setDismissed] = React.useState(false);
  const config = LEVEL_CONFIG[level];

  if (dismissed) return null;

  const handleDismiss = () => {
    if (!config.dismissible) return;
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      role={level === "L5" ? "alert" : "status"}
      aria-live={level === "L5" ? "assertive" : "polite"}
      className={cn(
        "rounded-xl border p-4 text-sm",
        config.borderClass,
        className
      )}
      style={{ backgroundColor: config.bgColorVar }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span style={{ color: config.colorVar }}>{config.icon}</span>
          <span
            className="font-semibold text-sm"
            style={{ color: config.colorVar }}
          >
            {config.label}
          </span>
        </div>

        {/* Dismiss button — only for L1/L2/L3 */}
        {config.dismissible && onDismiss && (
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="p-1 rounded hover:bg-black/5 text-gray-500 hover:text-gray-700 transition-colors shrink-0"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Reason */}
      <p className="mt-2 text-gray-700 leading-relaxed">{reason}</p>

      {/* Action instruction */}
      <div
        className="mt-3 rounded-lg px-3 py-2.5 text-sm font-medium"
        style={{
          backgroundColor: `color-mix(in srgb, ${config.colorVar} 12%, white)`,
          color: config.colorVar,
        }}
      >
        {action}
      </div>

      {/* Practitioner tip (L3/L4 only) */}
      {practitionerTip && (
        <p className="mt-2.5 text-xs text-gray-500 leading-relaxed">
          <span className="font-medium text-gray-600">What to tell them: </span>
          {practitionerTip}
        </p>
      )}

      {/* L5-specific emergency numbers */}
      {level === "L5" && (
        <div className="mt-3 flex gap-2">
          <a
            href="tel:112"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-red-300 bg-white py-2 text-sm font-bold text-red-700 hover:bg-red-50 transition-colors"
          >
            <Phone className="size-4" />
            112 — India
          </a>
          <a
            href="tel:102"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-red-300 bg-white py-2 text-sm font-bold text-red-700 hover:bg-red-50 transition-colors"
          >
            <Phone className="size-4" />
            102 — Ambulance
          </a>
        </div>
      )}
    </div>
  );
}
