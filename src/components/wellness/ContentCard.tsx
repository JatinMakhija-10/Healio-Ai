"use client";

/**
 * ContentCard
 *
 * Plan ref: Part IV §4.6 + Enhanced Plan §8.2 + §10.2
 *
 * The 8-field content card template required for every entry in the
 * Remedies & Routines library. Uses progressive disclosure:
 *   - Fields 1–2 always visible (title, may help with, evidence badge)
 *   - Fields 3–8 behind an expandable "Details" section
 *
 * Plan interaction principle: "Use progressive disclosure: brief first
 * response, details behind 'Why this helps' and 'Safety notes'."
 */

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BookOpen,
  ShieldCheck,
  Clock,
  Users,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EvidenceLabelBadge } from "@/components/wellness/EvidenceLabelBadge";
import type { WellnessContent } from "@/lib/wellness/contentTypes";

interface ContentCardProps {
  content: WellnessContent;
  /** Show the full 8-field detail by default (e.g. on detail pages) */
  defaultExpanded?: boolean;
  className?: string;
  /** Called when user taps "Consult a practitioner" */
  onConsultClick?: () => void;
}

export function ContentCard({
  content,
  defaultExpanded = false,
  className,
  onConsultClick,
}: ContentCardProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white shadow-sm overflow-hidden",
        className
      )}
    >
      {/* ── Always-visible header (Fields 1 + 2) ─────────────────────────── */}
      <div className="px-5 pt-5 pb-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-base text-gray-900 leading-snug">
            {content.title}
          </h3>
          <EvidenceLabelBadge label={content.evidenceLabel} size="sm" />
        </div>

        {/* Field 1 — What this is */}
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          {content.whatItIs}
        </p>

        {/* Field 2 — May help with */}
        {content.mayHelpWith.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {content.mayHelpWith.map((item) => (
              <span
                key={item}
                className="inline-flex items-center rounded-full bg-[#EAF4EF] px-2.5 py-0.5 text-xs font-medium text-[#2D6A4F]"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {/* Expand / collapse toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-[#2D6A4F] hover:text-[#1E4D38] transition-colors"
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <ChevronUp className="size-3.5" />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="size-3.5" />
              Why this helps &amp; Safety notes
            </>
          )}
        </button>
      </div>

      {/* ── Expandable detail section (Fields 3–8) ────────────────────────── */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">

          {/* Field 3 — Traditional use */}
          {content.traditionalUse && (
            <DetailSection
              icon={<BookOpen className="size-4 text-[#3D405B]" />}
              label="Traditional use"
            >
              <p className="text-sm text-gray-700 leading-relaxed">
                {content.traditionalUse}
              </p>
            </DetailSection>
          )}

          {/* Field 4 — Evidence summary */}
          <DetailSection
            icon={<ShieldCheck className="size-4 text-[#2D6A4F]" />}
            label="What the evidence says"
          >
            <p className="text-sm text-gray-700 leading-relaxed">
              {content.evidenceSummary}
            </p>
          </DetailSection>

          {/* Field 5 — Avoid if */}
          {content.avoidIf.length > 0 && (
            <DetailSection
              icon={<Users className="size-4 text-[#C9675A]" />}
              label="Who should avoid this or ask first"
              labelClassName="text-[#C9675A]"
            >
              <ul className="space-y-1">
                {content.avoidIf.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="mt-1.5 size-1.5 rounded-full bg-[#C9675A] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          {/* Field 6 — How to use safely */}
          <DetailSection
            icon={<ShieldCheck className="size-4 text-[#2D6A4F]" />}
            label="How to use safely"
          >
            <p className="text-sm text-gray-700 leading-relaxed">
              {content.howToUseSafely}
            </p>
          </DetailSection>

          {/* Field 7 — When to seek help */}
          {content.seekHelpIf.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  When to seek medical help
                </span>
              </div>
              <ul className="space-y-1">
                {content.seekHelpIf.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-amber-800"
                  >
                    <span className="mt-1.5 size-1.5 rounded-full bg-amber-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Field 8 — Reviewer / sources */}
          {(content.reviewer || (content.sources && content.sources.length > 0)) && (
            <DetailSection
              icon={<Clock className="size-4 text-gray-400" />}
              label="Reviewed by"
              labelClassName="text-gray-400"
            >
              <div className="text-xs text-gray-500 space-y-1">
                {content.reviewer && <p>{content.reviewer}</p>}
                {content.sources?.map((src) => (
                  <a
                    key={src}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#3D405B] hover:underline truncate"
                  >
                    <ExternalLink className="size-3 shrink-0" />
                    {src}
                  </a>
                ))}
              </div>
            </DetailSection>
          )}

          {/* Consult CTA */}
          {onConsultClick && (
            <button
              onClick={onConsultClick}
              className="w-full mt-1 rounded-xl border border-[#2D6A4F]/30 bg-[#EAF4EF] py-2.5 text-sm font-medium text-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white transition-colors"
            >
              Talk to a practitioner about this
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Internal sub-component ────────────────────────────────────────────────────

interface DetailSectionProps {
  icon: React.ReactNode;
  label: string;
  labelClassName?: string;
  children: React.ReactNode;
}

function DetailSection({
  icon,
  label,
  labelClassName,
  children,
}: DetailSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wide text-gray-500",
            labelClassName
          )}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
