"use client";

/**
 * PractitionerEscalationCard
 *
 * Plan ref: Enhanced Plan §8.5 + §12 + Traditional Plan §7.5 + §11.5
 *
 * A supportive, non-fear-inducing card that surfaces when a user should
 * consider speaking to a practitioner. Renders in:
 *   - Ask Healio L3/L4 responses (within AskHealioResponseRenderer)
 *   - Wellness library cards with 'avoid_or_consult' evidence label
 *   - Standalone escalation flow
 *
 * Strict plan compliance:
 *   - Makes "Talk to a practitioner" visible but NOT fear-inducing (§7.3)
 *   - Displays scope labels + system of practice (§12.2)
 *   - Never says "see a doctor" for L1/L2; always explains WHY at L3+
 */

import * as React from "react";
import Link from "next/link";
import { Stethoscope, ChevronRight, Clock, MessageSquare, Video } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EscalationReason =
  | "precautionary"      // L3 — non-urgent, worth discussing
  | "timely"             // L4 — see a doctor today
  | "contraindication"   // Specific to a remedy or practice
  | "chronic_condition"  // Chronic disease management
  | "pregnancy"          // Pregnancy-related safety
  | "child"              // Paediatric concern
  | "mental_health";     // Mental health support

interface PractitionerType {
  id: string;
  name: string;
  scope: string;
  system: string;
  consultModes: Array<"chat" | "video" | "in_person">;
}

// Placeholder practitioner types (plan §12.2 profile display requirements)
const DEFAULT_PRACTITIONERS: PractitionerType[] = [
  {
    id: "pt-gp",
    name: "General Practitioner (MBBS)",
    scope: "General assessment, symptom evaluation, referrals",
    system: "Modern Medicine",
    consultModes: ["chat", "video"],
  },
  {
    id: "pt-ayurveda",
    name: "Ayurvedic Practitioner (BAMS)",
    scope: "Lifestyle, diet, traditional wellness guidance",
    system: "Ayurveda",
    consultModes: ["chat", "video"],
  },
];

const REASON_COPY: Record<
  EscalationReason,
  { heading: string; body: string }
> = {
  precautionary: {
    heading: "Worth a quick check",
    body: "This is not urgent, but a brief conversation with a practitioner can give you clarity and rule out anything worth addressing early.",
  },
  timely: {
    heading: "See a practitioner today",
    body: "Based on what you've described, this is worth professional assessment today — not as an emergency, but it should not be left for a later date.",
  },
  contraindication: {
    heading: "Check with your practitioner first",
    body: "This remedy or practice may not be suitable for your situation. A practitioner can confirm what is safe for you specifically.",
  },
  chronic_condition: {
    heading: "Ongoing management matters",
    body: "Managing a chronic condition well requires professional guidance alongside home care. A practitioner can help you get the balance right.",
  },
  pregnancy: {
    heading: "Extra caution during pregnancy",
    body: "Many remedies and practices need to be reviewed by a practitioner during pregnancy. Your safety and your baby's safety come first.",
  },
  child: {
    heading: "Children need individual assessment",
    body: "Dosing, safety thresholds, and appropriate care are different for children. A paediatrician or general practitioner can guide you specifically.",
  },
  mental_health: {
    heading: "You do not have to manage this alone",
    body: "A mental health professional or counsellor can provide structured support that goes well beyond what wellness guidance can offer.",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface PractitionerEscalationCardProps {
  reason: EscalationReason;
  /** Optional message to tell the practitioner (from plan §8.1 step 7) */
  whatToTell?: string;
  /** Optional list of what the practitioner may check */
  whatTheyMayCheck?: string[];
  className?: string;
}

export function PractitionerEscalationCard({
  reason,
  whatToTell,
  whatTheyMayCheck,
  className,
}: PractitionerEscalationCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const copy = REASON_COPY[reason];

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white overflow-hidden",
        reason === "timely"
          ? "border-amber-200"
          : "border-gray-100",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "px-4 py-3 flex items-start gap-3",
          reason === "timely" ? "bg-amber-50" : "bg-gray-50"
        )}
      >
        <span
          className={cn(
            "size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
            reason === "timely"
              ? "bg-amber-100 text-amber-700"
              : "bg-indigo-50 text-indigo-600"
          )}
        >
          <Stethoscope className="size-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-semibold",
              reason === "timely" ? "text-amber-900" : "text-gray-800"
            )}
          >
            {copy.heading}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{copy.body}</p>
        </div>
      </div>

      {/* Preparation block (plan §8.1 step 7) */}
      {(whatToTell || whatTheyMayCheck) && (
        <div className="px-4 py-3 border-t border-gray-50 space-y-2">
          {whatToTell && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">
                What to tell them
              </p>
              <p className="text-xs text-gray-700 leading-relaxed">{whatToTell}</p>
            </div>
          )}
          {whatTheyMayCheck && whatTheyMayCheck.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">
                What they may check
              </p>
              <ul className="space-y-0.5">
                {whatTheyMayCheck.map((item, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                    <span className="mt-1.5 size-1 rounded-full bg-gray-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Practitioner types */}
      <div className="px-4 pb-3 pt-2 border-t border-gray-50">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors mb-2"
        >
          Who can help?
          <ChevronRight
            className={cn(
              "size-3.5 transition-transform",
              expanded ? "rotate-90" : ""
            )}
          />
        </button>

        {expanded && (
          <div className="space-y-2 mb-3">
            {DEFAULT_PRACTITIONERS.map(pt => (
              <div
                key={pt.id}
                className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <p className="text-xs font-semibold text-gray-800">{pt.name}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{pt.scope}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-gray-400 font-medium">{pt.system}</span>
                  <span className="text-gray-200">·</span>
                  <div className="flex items-center gap-1">
                    {pt.consultModes.includes("chat") && (
                      <MessageSquare className="size-3 text-gray-400" />
                    )}
                    {pt.consultModes.includes("video") && (
                      <Video className="size-3 text-gray-400" />
                    )}
                    {pt.consultModes.includes("in_person") && (
                      <Clock className="size-3 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <Link
          href="/dashboard/search"
          className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: "var(--healio-wellness-indigo)" }}
        >
          <Stethoscope className="size-4" />
          Find a practitioner
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
