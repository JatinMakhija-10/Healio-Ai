/**
 * Evidence Label System
 *
 * Plan ref: Part II §Product Principles #3 + Part IV §4.4
 * Source documents:
 *   - Healio_Enhanced_Repositioning_Plan.md §5 / §10.1
 *   - Healio_Traditional_Wellness_Repositioning_Plan.md §4 / §9
 *
 * Five label types that MUST appear on every wellness recommendation.
 * These are the exact vocabulary locked in the plan (Decision #3).
 */

export type EvidenceLabelKey =
  | 'clinically_established'
  | 'common_self_care'
  | 'traditional_practice'
  | 'emerging_limited'
  | 'avoid_or_consult';

export interface EvidenceLabelConfig {
  key: EvidenceLabelKey;
  /** Short display label shown in badges */
  label: string;
  /** One-sentence plain-language description for tooltips */
  description: string;
  /** CSS utility classes from tokens.css (text + background) */
  textClass: string;
  bgClass: string;
  /** Inline CSS variable fallback for environments that can't use utility classes */
  colorVar: string;
  bgColorVar: string;
}

export const EVIDENCE_LABELS: Record<EvidenceLabelKey, EvidenceLabelConfig> = {
  clinically_established: {
    key: 'clinically_established',
    label: 'Clinically Established',
    description:
      'Supported by robust clinical research and accepted in mainstream medical practice.',
    textClass: 'text-evidence-established',
    bgClass: 'bg-evidence-established',
    colorVar: 'var(--avoria-evidence-established)',
    bgColorVar: 'var(--avoria-evidence-established-bg)',
  },
  common_self_care: {
    key: 'common_self_care',
    label: 'Common Self-Care',
    description:
      'Widely practiced and generally considered safe for everyday home management.',
    textClass: 'text-evidence-selfcare',
    bgClass: 'bg-evidence-selfcare',
    colorVar: 'var(--avoria-evidence-selfcare)',
    bgColorVar: 'var(--avoria-evidence-selfcare-bg)',
  },
  traditional_practice: {
    key: 'traditional_practice',
    label: 'Traditional Practice',
    description:
      'Part of traditional Indian or Ayurvedic practice. Evidence from clinical research is limited or mixed.',
    textClass: 'text-evidence-traditional',
    bgClass: 'bg-evidence-traditional',
    colorVar: 'var(--avoria-evidence-traditional)',
    bgColorVar: 'var(--avoria-evidence-traditional-bg)',
  },
  emerging_limited: {
    key: 'emerging_limited',
    label: 'Emerging / Limited Evidence',
    description:
      'Some early or preliminary research exists, but evidence is not yet sufficient for strong recommendations.',
    textClass: 'text-evidence-emerging',
    bgClass: 'bg-evidence-emerging',
    colorVar: 'var(--avoria-evidence-emerging)',
    bgColorVar: 'var(--avoria-evidence-emerging-bg)',
  },
  avoid_or_consult: {
    key: 'avoid_or_consult',
    label: 'Avoid or Consult First',
    description:
      'Not appropriate for self-care or requires professional review before use. Check with your doctor or pharmacist.',
    textClass: 'text-evidence-avoid',
    bgClass: 'bg-evidence-avoid',
    colorVar: 'var(--avoria-evidence-avoid)',
    bgColorVar: 'var(--avoria-evidence-avoid-bg)',
  },
};

/** Ordered array for rendering label selectors / legends */
export const EVIDENCE_LABEL_ORDER: EvidenceLabelKey[] = [
  'clinically_established',
  'common_self_care',
  'traditional_practice',
  'emerging_limited',
  'avoid_or_consult',
];

/** Convenience getter — returns config or undefined for unknown keys */
export function getEvidenceLabel(key: EvidenceLabelKey): EvidenceLabelConfig {
  return EVIDENCE_LABELS[key];
}
