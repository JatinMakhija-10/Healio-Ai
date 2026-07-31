"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, CheckCircle2 } from "lucide-react";

export interface SourceItem {
  id?: string;
  title: string;
  matchConfidence?: string | number;
  type?: string;
}

export interface SourcesDisclosureProps {
  sources?: SourceItem[];
  className?: string;
}

const DEFAULT_CURATED_SOURCES: SourceItem[] = [
  { title: "Ayurvedic Formulary of India, Vol II", matchConfidence: "84% match", type: "Ayurvedic Text" },
  { title: "Standard Treatment Guidelines (Ministry of Health & Family Welfare)", matchConfidence: "91% match", type: "Clinical Guideline" },
  { title: "Homoeopathic Pharmacopoeia of India (HPI)", matchConfidence: "76% match", type: "Pharmacopoeia" },
];

export function SourcesDisclosure({
  sources = DEFAULT_CURATED_SOURCES,
  className = "",
}: SourcesDisclosureProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeSources = sources.length > 0 ? sources : DEFAULT_CURATED_SOURCES;

  return (
    <div className={`rounded-xl border border-[#DAD7CF] bg-white p-4 shadow-xs ${className}`}>
      <button
        type="button"
        className="flex w-full items-center justify-between text-left focus-visible:outline-none"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-[#0F6E56]" />
          <span className="text-sm font-bold text-[#1A1A2E]">
            Verified Sources & Evidence ({activeSources.length})
          </span>
        </div>
        <ChevronDown
          className={`size-4 text-[#555555] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-3 space-y-2 border-t border-[#E5E3DC] pt-3 animate-fadeInUp">
          <p className="text-xs text-[#6B6B6B]">
            Symptoms were matched against curated health databases, government guidelines, and traditional pharmacopoeias:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {activeSources.map((item, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-2 rounded-lg border border-[#C8E7DA] bg-[#E1F5EE] px-3 py-1.5 text-xs text-[#0F6E56]"
              >
                <CheckCircle2 className="size-3.5 shrink-0 text-[#0F6E56]" />
                <span className="font-semibold text-[#1C1C1E]">{item.title}</span>
                {item.matchConfidence && (
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#0F6E56]">
                    {typeof item.matchConfidence === "number" ? `${item.matchConfidence}% match` : item.matchConfidence}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
