"use client";

import Link from "next/link";
import { HeartHandshake, PhoneCall, ArrowRight } from "lucide-react";

export interface MentalHealthAssessmentCardProps {
  conditionName?: string;
  description?: string;
  className?: string;
}

export function MentalHealthAssessmentCard({
  conditionName,
  description,
  className = "",
}: MentalHealthAssessmentCardProps) {
  return (
    <div
      className={`rounded-[12px] border-l-4 border-l-[#E65100] border-y border-r border-[#FFE0B2] bg-[#FFF3E0] p-6 shadow-sm ${className}`}
      role="region"
      aria-label="Emotional well-being guidance"
    >
      <div className="flex items-start gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#FFE0B2] text-[#E65100]">
          <HeartHandshake className="size-6" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-[#BF360C]">
            Emotional well-being pattern detected
          </h3>
          {conditionName && (
            <p className="mt-1 text-sm font-semibold text-[#E65100]">
              Pattern context: {conditionName}
            </p>
          )}
          <p className="mt-3 text-sm leading-6 text-[#4E342E]">
            {description ||
              "This presentation falls outside Healio's home-care guidance. We strongly recommend speaking with a licensed mental health professional. Our AI cannot provide treatment or diagnostic advice for emotional health."}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href="https://icallhelpline.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#E65100] px-5 text-sm font-bold text-white shadow-xs transition hover:bg-[#BF360C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E65100]"
            >
              Find a counselor near you
              <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </a>

            <a
              href="tel:14416"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#E65100] bg-white px-4 text-xs font-bold text-[#E65100] transition hover:bg-[#FFE0B2]"
            >
              <PhoneCall className="mr-2 size-3.5" />
              Tele-MANAS Helpline (14416)
            </a>
          </div>

          <div className="mt-4 border-t border-[#FFE0B2] pt-3 text-xs leading-5 text-[#6D4C41]">
            <strong>Immediate support:</strong> If you or someone you know is in crisis, please call Tele-MANAS at <strong>14416</strong> or iCall at <strong>9152987821</strong> (India), or contact your local emergency services.
          </div>
        </div>
      </div>
    </div>
  );
}

export function isMentalHealthPattern(text?: string): boolean {
  if (!text) return false;
  const normalized = text.toLowerCase();
  const keywords = [
    "adjustment disorder",
    "anxiety",
    "depression",
    "panic attack",
    "emotional distress",
    "burnout",
    "mood disorder",
    "grief",
    "trauma",
    "ptsd",
  ];
  return keywords.some((kw) => normalized.includes(kw));
}
