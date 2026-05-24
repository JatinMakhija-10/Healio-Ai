"use client";

/**
 * WellnessEntryCards
 *
 * Plan ref: Enhanced Plan §6.2 + Traditional Plan §5 (Home Screen Concept)
 *
 * The 5-card "What do you need help with today?" entry surface.
 * Sits at the top of the dashboard home screen.
 * Each card routes to the appropriate pathway:
 *   - Everyday care (Ask Healio)
 *   - Traditional wellness (Library)
 *   - Medical escalation (Consult)
 */

import * as React from "react";
import Link from "next/link";
import {
  Thermometer,
  Leaf,
  Sparkles,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EntryCard {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  href: string;
  accent: string;
  accentBg: string;
}

const CARDS: EntryCard[] = [
  {
    icon: <Thermometer className="size-5" />,
    label: "I feel unwell",
    sublabel: "Get calm, safe guidance",
    href: "/dashboard/consult",
    accent: "var(--healio-wellness-primary)",
    accentBg: "var(--healio-wellness-primary-bg)",
  },
  {
    icon: <Leaf className="size-5" />,
    label: "Home-care routine",
    sublabel: "Daily wellness practices",
    href: "/dashboard/wellness/routines",
    accent: "var(--healio-wellness-primary)",
    accentBg: "var(--healio-wellness-primary-bg)",
  },
  {
    icon: <Sparkles className="size-5" />,
    label: "Preventive tips",
    sublabel: "Seasonal & lifestyle care",
    href: "/dashboard/wellness/library",
    accent: "var(--healio-wellness-marigold)",
    accentBg: "var(--healio-wellness-marigold-bg)",
  },
  {
    icon: <ShieldAlert className="size-5" />,
    label: "Is this serious?",
    sublabel: "Red-flag check",
    href: "/dashboard/consult",
    accent: "var(--healio-wellness-rose)",
    accentBg: "var(--healio-wellness-rose-bg)",
  },
  {
    icon: <Stethoscope className="size-5" />,
    label: "Consult a practitioner",
    sublabel: "Talk to a qualified doctor",
    href: "/dashboard/search",
    accent: "var(--healio-wellness-indigo)",
    accentBg: "var(--healio-wellness-indigo-bg)",
  },
];

interface WellnessEntryCardsProps {
  className?: string;
}

export function WellnessEntryCards({ className }: WellnessEntryCardsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <p
        className="text-base font-semibold"
        style={{ color: "var(--healio-wellness-charcoal)" }}
      >
        What do you need help with today?
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {CARDS.map((card) => (
          <Link key={card.label} href={card.href}>
            <div
              className="flex flex-col gap-2.5 rounded-2xl border p-3.5 h-full transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer"
              style={{
                backgroundColor: card.accentBg,
                borderColor: `color-mix(in srgb, ${card.accent} 20%, transparent)`,
              }}
            >
              <span
                className="size-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `color-mix(in srgb, ${card.accent} 15%, white)`,
                  color: card.accent,
                }}
              >
                {card.icon}
              </span>
              <div>
                <p
                  className="text-sm font-semibold leading-tight"
                  style={{ color: "var(--healio-wellness-charcoal)" }}
                >
                  {card.label}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                  {card.sublabel}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
