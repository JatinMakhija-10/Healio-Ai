"use client";

/**
 * Remedy / Routine Detail Page
 *
 * Plan ref: Traditional Plan §11.4 + Enhanced Plan §8.2
 *
 * Full-page view for a single WellnessContent entry.
 * Shows all 8 fields expanded, related content, and a practitioner CTA.
 *
 * Route: /dashboard/wellness/library/[id]
 */

import { useMemo } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { ArrowLeft, Stethoscope, BookOpen } from "lucide-react";
import { ContentCard } from "@/components/wellness/ContentCard";
import { EvidenceLabelBadge } from "@/components/wellness/EvidenceLabelBadge";
import {
  SAMPLE_WELLNESS_CONTENT,
} from "@/lib/wellness/sampleContent";
import {
  WELLNESS_CATEGORY_LABELS,
} from "@/lib/wellness/contentTypes";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ContentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const item = useMemo(
    () => SAMPLE_WELLNESS_CONTENT.find(c => c.id === id),
    [id]
  );

  if (!item) {
    notFound();
  }

  // Related: same category, excluding current
  const related = useMemo(
    () =>
      SAMPLE_WELLNESS_CONTENT.filter(
        c => c.category === item.category && c.id !== item.id
      ).slice(0, 3),
    [item]
  );

  const categoryLabel = WELLNESS_CATEGORY_LABELS[item.category] ?? item.category;

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/dashboard/wellness"
          className="hover:text-gray-700 transition-colors"
        >
          Wellness
        </Link>
        <span className="text-gray-300">/</span>
        <Link
          href="/dashboard/wellness/library"
          className="hover:text-gray-700 transition-colors"
        >
          Remedies &amp; Routines
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-800 font-medium truncate max-w-[180px]">
          {item.title}
        </span>
      </nav>

      {/* ── Back button ────────────────────────────────────────────────── */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      {/* ── Category chip ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
          <BookOpen className="size-3" />
          {categoryLabel}
        </span>
        <EvidenceLabelBadge label={item.evidenceLabel} size="sm" />
      </div>

      {/* ── Full content card ──────────────────────────────────────────── */}
      <ContentCard
        content={item}
        defaultExpanded={true}
        onConsultClick={() => router.push("/dashboard/search")}
      />

      {/* ── Practitioner CTA banner ────────────────────────────────────── */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 flex items-start gap-4">
        <div className="size-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
          <Stethoscope className="size-5 text-teal-700" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-teal-900">
            This is worth discussing with a practitioner
          </p>
          <p className="text-xs text-teal-700 mt-0.5">
            If your concern persists or you are unsure whether this applies to you,
            speaking with a qualified doctor or AYUSH practitioner is the safest next step.
          </p>
          <Link
            href="/dashboard/search"
            className="mt-2 inline-block text-xs font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-900"
          >
            Find a practitioner →
          </Link>
        </div>
      </div>

      {/* ── Related content ────────────────────────────────────────────── */}
      {related.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            More in {categoryLabel}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map(rel => (
              <Link
                key={rel.id}
                href={`/dashboard/wellness/library/${rel.id}`}
                className="group rounded-2xl border border-gray-100 bg-white px-4 py-3 hover:border-[#2D6A4F]/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-[#2D6A4F] leading-snug">
                    {rel.title}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                  {rel.whatItIs}
                </p>
                <div className="mt-2">
                  <EvidenceLabelBadge label={rel.evidenceLabel} size="sm" showTooltip={false} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Library link ───────────────────────────────────────────────── */}
      <div className="text-center">
        <Link
          href="/dashboard/wellness/library"
          className="text-sm font-medium text-[#2D6A4F] hover:text-[#1E4D38] underline underline-offset-2"
        >
          ← Browse the full library
        </Link>
      </div>
    </div>
  );
}
