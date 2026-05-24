"use client";

/**
 * WellnessSectionHeader
 *
 * Plan ref: Enhanced Plan §8.1 + Traditional Plan §6.2
 *
 * Reusable section header for all wellness pages. Renders a title,
 * optional subtitle, and an optional evidence-context chip.
 *
 * Usage:
 *   <WellnessSectionHeader
 *     title="Remedies & Routines"
 *     subtitle="Traditional practices with honest evidence context"
 *     evidenceNote="All content reviewed by the Healio medical team"
 *   />
 */

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface WellnessSectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional 1-line note displayed in a small trust chip below the subtitle */
  evidenceNote?: string;
  /** Slot for an optional right-side action (button, link, etc.) */
  action?: React.ReactNode;
  className?: string;
}

export function WellnessSectionHeader({
  title,
  subtitle,
  evidenceNote,
  action,
  className,
}: WellnessSectionHeaderProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-start justify-between gap-4">
        <h2
          className="text-xl font-bold leading-tight"
          style={{ color: "var(--healio-wellness-charcoal)" }}
        >
          {title}
        </h2>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {subtitle && (
        <p className="text-sm text-gray-500 leading-relaxed">{subtitle}</p>
      )}

      {evidenceNote && (
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{
            backgroundColor: "var(--healio-wellness-primary-bg)",
            color: "var(--healio-wellness-primary)",
          }}
        >
          <ShieldCheck className="size-3 shrink-0" />
          {evidenceNote}
        </div>
      )}
    </div>
  );
}
