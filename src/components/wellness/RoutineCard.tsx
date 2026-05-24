"use client";

/**
 * RoutineCard
 *
 * Plan ref: Part IV §4.5 + Enhanced Plan §8.3
 *
 * Renders a WellnessRoutine with its steps grouped by time slot.
 * Uses progressive disclosure — only the first time slot is open
 * by default; others expand on tap.
 */

import * as React from "react";
import { Clock, Sun, Sunset, Moon, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { EvidenceLabelBadge } from "@/components/wellness/EvidenceLabelBadge";
import {
  type WellnessRoutine,
  type RoutineTimeSlot,
  ROUTINE_TIME_SLOT_LABELS,
  ROUTINE_FREQUENCY_LABELS,
  groupStepsByTimeSlot,
} from "@/lib/wellness/routineTypes";

interface RoutineCardProps {
  routine: WellnessRoutine;
  className?: string;
  /** Called when user taps "Save to my routines" */
  onSave?: (routineId: string) => void;
  /** True if the user has already saved this routine */
  isSaved?: boolean;
}

// Map time slots to icons
const SLOT_ICONS: Record<RoutineTimeSlot, React.ReactNode> = {
  wake_up:    <Sun className="size-4" />,
  morning:    <Coffee className="size-4" />,
  midday:     <Sun className="size-4" />,
  afternoon:  <Clock className="size-4" />,
  evening:    <Sunset className="size-4" />,
  before_bed: <Moon className="size-4" />,
};

export function RoutineCard({
  routine,
  className,
  onSave,
  isSaved = false,
}: RoutineCardProps) {
  const grouped = groupStepsByTimeSlot(routine.steps);
  const slots = Object.keys(grouped) as RoutineTimeSlot[];

  // Only the first slot open by default
  const [openSlots, setOpenSlots] = React.useState<Set<RoutineTimeSlot>>(
    () => new Set(slots.slice(0, 1))
  );

  const toggleSlot = (slot: RoutineTimeSlot) =>
    setOpenSlots((prev) => {
      const next = new Set(prev);
      next.has(slot) ? next.delete(slot) : next.add(slot);
      return next;
    });

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white overflow-hidden shadow-sm",
        className
      )}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="px-5 py-4"
        style={{ backgroundColor: "var(--healio-wellness-primary-bg)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-base text-gray-900">
              {routine.title}
            </h3>
            {routine.tagline && (
              <p className="text-sm text-gray-600 mt-0.5">{routine.tagline}</p>
            )}
          </div>
          {routine.aiGenerated && (
            <span className="shrink-0 rounded-full bg-[#EAF4EF] px-2 py-0.5 text-[10px] font-semibold text-[#2D6A4F] uppercase tracking-wide">
              AI Suggested
            </span>
          )}
        </div>

        {/* Suitable-for badges */}
        {routine.suitableFor.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-xs text-gray-500">Good for:</span>
            {routine.suitableFor.map((d) => (
              <span
                key={d}
                className="rounded-full bg-white/70 border border-[#2D6A4F]/20 px-2 py-0.5 text-xs font-medium text-[#2D6A4F] capitalize"
              >
                {d}
              </span>
            ))}
          </div>
        )}

        {/* Season badge */}
        {routine.season && (
          <span className="mt-2 inline-block rounded-full bg-[#FEF6E0] px-2.5 py-0.5 text-xs font-medium text-[#E9A21A]">
            {routine.season.replace("_", " ")} routine
          </span>
        )}
      </div>

      {/* ── Steps grouped by time slot ────────────────────────────────── */}
      <div className="divide-y divide-gray-100">
        {slots.map((slot) => {
          const steps = grouped[slot]!;
          const isOpen = openSlots.has(slot);

          return (
            <div key={slot}>
              {/* Slot header — always clickable */}
              <button
                onClick={() => toggleSlot(slot)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span style={{ color: "var(--healio-wellness-primary)" }}>
                    {SLOT_ICONS[slot]}
                  </span>
                  {ROUTINE_TIME_SLOT_LABELS[slot]}
                  <span className="text-xs text-gray-400 font-normal">
                    ({steps.length} step{steps.length !== 1 ? "s" : ""})
                  </span>
                </div>
                <span className="text-gray-400 text-xs">
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>

              {/* Steps list */}
              {isOpen && (
                <div className="px-5 pb-3 space-y-2.5">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-800">
                            {step.title}
                          </span>
                          <EvidenceLabelBadge
                            label={step.evidenceLabel}
                            size="sm"
                            showTooltip={false}
                          />
                        </div>
                        {step.description && (
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                            {step.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
                          {step.duration && (
                            <span className="flex items-center gap-0.5">
                              <Clock className="size-2.5" />
                              {step.duration}
                            </span>
                          )}
                          <span>{ROUTINE_FREQUENCY_LABELS[step.frequency]}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer CTA ───────────────────────────────────────────────── */}
      {onSave && (
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={() => onSave(routine.id)}
            className={cn(
              "w-full rounded-xl py-2.5 text-sm font-medium transition-colors",
              isSaved
                ? "bg-[#EAF4EF] text-[#2D6A4F] cursor-default"
                : "bg-[#2D6A4F] text-white hover:bg-[#1E4D38]"
            )}
            disabled={isSaved}
          >
            {isSaved ? "Saved to your routines" : "Save to my routines"}
          </button>
        </div>
      )}
    </div>
  );
}
