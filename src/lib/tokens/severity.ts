/**
 * Typed severity token mappings.
 *
 * Maps clinical severity levels to CSS class names defined in
 * `src/app/tokens.css`. Use className strings in components
 * so dark: variants and Tailwind utilities work correctly.
 *
 * Usage:
 *   <Badge className={severityTokens[condition.severity].className}>
 *     {severityTokens[condition.severity].label}
 *   </Badge>
 */

import type { Severity } from "@/lib/diagnosis/types";

export const severityTokens: Record<
    Severity,
    { textClass: string; bgClass: string; className: string; label: string }
> = {
    benign:           { textClass: "text-severity-info",     bgClass: "bg-severity-info",     className: "text-severity-info bg-severity-info",         label: "Benign" },
    mild:             { textClass: "text-severity-mild",     bgClass: "bg-severity-mild",     className: "text-severity-mild bg-severity-mild",         label: "Mild" },
    "mild-moderate":  { textClass: "text-severity-moderate", bgClass: "bg-severity-moderate", className: "text-severity-moderate bg-severity-moderate",  label: "Mild-Moderate" },
    moderate:         { textClass: "text-severity-moderate", bgClass: "bg-severity-moderate", className: "text-severity-moderate bg-severity-moderate",  label: "Moderate" },
    "moderate-severe":{ textClass: "text-severity-severe",   bgClass: "bg-severity-severe",   className: "text-severity-severe bg-severity-severe",     label: "Moderate-Severe" },
    chronic:          { textClass: "text-severity-severe",   bgClass: "bg-severity-severe",   className: "text-severity-severe bg-severity-severe",     label: "Chronic" },
    severe:           { textClass: "text-severity-severe",   bgClass: "bg-severity-severe",   className: "text-severity-severe bg-severity-severe",     label: "Severe" },
    critical:         { textClass: "text-severity-critical", bgClass: "bg-severity-critical", className: "text-severity-critical bg-severity-critical",  label: "Critical" },
};

export const confidenceTokens = {
    high:   "text-confidence-high",
    medium: "text-confidence-medium",
    low:    "text-confidence-low",
} as const;

export function getConfidenceClass(confidence: number): string {
    if (confidence >= 80) return confidenceTokens.high;
    if (confidence >= 50) return confidenceTokens.medium;
    return confidenceTokens.low;
}
