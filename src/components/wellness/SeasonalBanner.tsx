"use client";

/**
 * SeasonalBanner
 *
 * Plan ref: Enhanced Plan §8.3 + Traditional Plan §7.3
 *
 * Automatically derives the current Indian season from the calendar month
 * and renders a contextual wellness nudge. No user data required.
 *
 * Seasons: Summer (Mar-Jun), Monsoon (Jul-Sep), Winter (Oct-Feb),
 *          + Festival overlay (Oct-Nov), Exam/work stress (Jan-Feb, Apr-May)
 */

import * as React from "react";
import Link from "next/link";
import { Droplets, Wind, Sun, CloudRain, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Season config ────────────────────────────────────────────────────────────

type SeasonKey = "summer" | "monsoon" | "winter" | "festival" | "exam";

interface SeasonConfig {
  key: SeasonKey;
  icon: React.ReactNode;
  label: string;
  nudge: string;
  tip: string;
  cta: string;
  ctaHref: string;
  color: string;
  bg: string;
}

const SEASONS: Record<SeasonKey, SeasonConfig> = {
  summer: {
    key: "summer",
    icon: <Sun className="size-4" />,
    label: "Summer Care",
    nudge: "Peak heat season",
    tip: "Stay hydrated — aim for 10-12 glasses of water. Watch for heat exhaustion signs: dizziness, rapid heartbeat, very dark urine.",
    cta: "Summer care tips",
    ctaHref: "/dashboard/wellness/library",
    color: "var(--healio-wellness-marigold)",
    bg: "var(--healio-wellness-marigold-bg)",
  },
  monsoon: {
    key: "monsoon",
    icon: <CloudRain className="size-4" />,
    label: "Monsoon Care",
    nudge: "Monsoon season",
    tip: "Digestive infections and mosquito-borne illnesses are more common. Eat freshly cooked food and use mosquito protection.",
    cta: "Monsoon hygiene guide",
    ctaHref: "/dashboard/wellness/library",
    color: "var(--healio-wellness-indigo)",
    bg: "var(--healio-wellness-indigo-bg)",
  },
  winter: {
    key: "winter",
    icon: <Wind className="size-4" />,
    label: "Winter Care",
    nudge: "Winter season",
    tip: "Cold and dry air can irritate respiratory passages. Warm fluids, steam inhalation, and keeping the throat moist all help.",
    cta: "Winter wellness library",
    ctaHref: "/dashboard/wellness/library",
    color: "var(--healio-wellness-primary)",
    bg: "var(--healio-wellness-primary-bg)",
  },
  festival: {
    key: "festival",
    icon: <Droplets className="size-4" />,
    label: "Festival Season",
    nudge: "Festival season",
    tip: "Late nights and rich food during festivals can stress your digestion and sleep. Light meals, hydration, and brief walks help recovery.",
    cta: "Digestive care tips",
    ctaHref: "/dashboard/wellness/library",
    color: "var(--healio-wellness-rose)",
    bg: "var(--healio-wellness-rose-bg)",
  },
  exam: {
    key: "exam",
    icon: <BookOpen className="size-4" />,
    label: "Exam / Work Season",
    nudge: "High-stress period",
    tip: "Consistent sleep matters more than extra study hours. A brief walk, deep breathing, and regular meals improve focus and reduce burnout.",
    cta: "Stress & sleep tips",
    ctaHref: "/dashboard/wellness/library",
    color: "var(--healio-wellness-indigo)",
    bg: "var(--healio-wellness-indigo-bg)",
  },
};

/** Derive the dominant season for the current month (India-centric) */
function getCurrentSeason(): SeasonKey {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 10 && month <= 11) return "festival"; // Oct-Nov: Navratri/Diwali
  if (month === 1 || month === 2 || month === 4 || month === 5) return "exam"; // Jan-Feb, Apr-May: boards/JEE
  if (month >= 3 && month <= 6) return "summer";
  if (month >= 7 && month <= 9) return "monsoon";
  return "winter"; // Dec, Mar residual
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SeasonalBannerProps {
  className?: string;
}

export function SeasonalBanner({ className }: SeasonalBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);
  const season = SEASONS[getCurrentSeason()];

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "relative rounded-2xl border px-4 py-3.5 flex items-start gap-3",
        className
      )}
      style={{
        backgroundColor: season.bg,
        borderColor: `color-mix(in srgb, ${season.color} 20%, transparent)`,
      }}
    >
      {/* Icon */}
      <span
        className="size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{
          backgroundColor: `color-mix(in srgb, ${season.color} 18%, white)`,
          color: season.color,
        }}
      >
        {season.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: season.color }}
          >
            {season.label}
          </span>
          <span className="text-[10px] text-gray-400">{season.nudge}</span>
        </div>
        <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">
          {season.tip}
        </p>
        <Link
          href={season.ctaHref}
          className="mt-1.5 inline-block text-xs font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
          style={{ color: season.color }}
        >
          {season.cta} →
        </Link>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
