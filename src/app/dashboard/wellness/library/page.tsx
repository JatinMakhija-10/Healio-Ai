"use client";

/**
 * Remedies & Routines Library Page
 *
 * Plan ref: Part IV §4.6 + Enhanced Plan §8.2 + §10.2
 *
 * Renders the Wellness Content Library — a searchable, filterable grid of
 * 8-field ContentCards. Uses the SAMPLE_WELLNESS_CONTENT seed set until the
 * full database-backed library is connected.
 *
 * This is a new route (/dashboard/wellness/library). The existing
 * /dashboard/wellness page (Dosha tracking) is not modified.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, SlidersHorizontal, X } from "lucide-react";
import { ContentCard } from "@/components/wellness/ContentCard";
import { EvidenceLabelBadge } from "@/components/wellness/EvidenceLabelBadge";
import {
  SAMPLE_WELLNESS_CONTENT,
} from "@/lib/wellness/sampleContent";
import {
  WELLNESS_CATEGORY_LABELS,
  type WellnessCategory,
} from "@/lib/wellness/contentTypes";
import type { EvidenceLabelKey } from "@/lib/wellness/evidenceLabels";
import { EVIDENCE_LABELS } from "@/lib/wellness/evidenceLabels";

// Categories actually present in the seed data
const PRESENT_CATEGORIES = Array.from(
  new Set(SAMPLE_WELLNESS_CONTENT.map(c => c.category))
) as WellnessCategory[];

export default function WellnessLibraryPage() {
  const [query, setQuery]           = useState("");
  const [category, setCategory]     = useState<WellnessCategory | "all">("all");
  const [evidence, setEvidence]     = useState<EvidenceLabelKey | "all">("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const results = useMemo(() => {
    return SAMPLE_WELLNESS_CONTENT.filter(item => {
      if (category !== "all" && item.category !== category) return false;
      if (evidence !== "all" && item.evidenceLabel !== evidence) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const haystack = [
          item.title,
          item.whatItIs,
          ...item.mayHelpWith,
        ].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [query, category, evidence]);

  const hasFilters = category !== "all" || evidence !== "all";

  const clearFilters = () => {
    setCategory("all");
    setEvidence("all");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/wellness"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Wellness
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-800">Remedies &amp; Routines</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Remedies &amp; Routines</h1>
        <p className="mt-1 text-gray-500 text-sm">
          Traditional practices and everyday self-care — each with honest evidence context.
        </p>
      </div>

      {/* ── Search + filter bar ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by concern, ingredient, or practice…"
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors ${
              filtersOpen || hasFilters
                ? "border-[#2D6A4F] bg-[#EAF4EF] text-[#2D6A4F]"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {hasFilters && (
              <span className="ml-1 size-4 rounded-full bg-[#2D6A4F] text-white text-[10px] flex items-center justify-center leading-none">
                {(category !== "all" ? 1 : 0) + (evidence !== "all" ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filter panels */}
        {filtersOpen && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-4">
            {/* Category */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Category
              </p>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  active={category === "all"}
                  onClick={() => setCategory("all")}
                  label="All"
                />
                {PRESENT_CATEGORIES.map(cat => (
                  <FilterChip
                    key={cat}
                    active={category === cat}
                    onClick={() => setCategory(cat)}
                    label={WELLNESS_CATEGORY_LABELS[cat]}
                  />
                ))}
              </div>
            </div>

            {/* Evidence label */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Evidence level
              </p>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  active={evidence === "all"}
                  onClick={() => setEvidence("all")}
                  label="All"
                />
                {(Object.keys(EVIDENCE_LABELS) as EvidenceLabelKey[]).map(key => (
                  <button
                    key={key}
                    onClick={() => setEvidence(key)}
                    className={`transition-opacity ${
                      evidence !== "all" && evidence !== key ? "opacity-40" : "opacity-100"
                    }`}
                  >
                    <EvidenceLabelBadge
                      label={key}
                      size="sm"
                      showTooltip={false}
                    />
                  </button>
                ))}
              </div>
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {results.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Search className="size-8 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No matches found</p>
          <p className="text-sm mt-1">Try a different search term or clear your filters.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map(item => (
              <ContentCard
                key={item.id}
                content={item}
                defaultExpanded={false}
                detailHref={`/dashboard/wellness/library/${item.id}`}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Seed data notice ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-400 text-center">
        Showing {SAMPLE_WELLNESS_CONTENT.length} reviewed entries — full library coming soon.
      </div>
    </div>
  );
}

// ── Internal chip ─────────────────────────────────────────────────────────────

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
        active
          ? "bg-[#2D6A4F] text-white border-[#2D6A4F]"
          : "bg-white text-gray-600 border-gray-200 hover:border-[#2D6A4F]/40"
      }`}
    >
      {label}
    </button>
  );
}
