/**
 * Wellness Content Types
 *
 * Plan ref: Part IV §4.6 + Enhanced Plan §8.2 + §10.2
 * Defines the 8-field content card template required for every remedy,
 * routine, and traditional practice entry in the Remedies & Routines library.
 *
 * Every WellnessContent item MUST have all 8 fields populated before
 * it can be shown to users (plan §10.3 review workflow).
 */

import type { EvidenceLabelKey } from './evidenceLabels';

// ─── 8-Field Content Card Template ───────────────────────────────────────────
// Source: Enhanced Plan §10.2 + Traditional Plan §9

export interface WellnessContent {
  id: string;

  // Field 1 — What this is
  title: string;
  /** One-sentence plain-language description of this practice/remedy */
  whatItIs: string;

  // Field 2 — What it may help with
  /** Array of concern areas this may support */
  mayHelpWith: string[];

  // Field 3 — How people traditionally use it
  traditionalUse: string;

  // Field 4 — What the evidence says
  evidenceLabel: EvidenceLabelKey;
  /** 2–4 sentences summarising the evidence. Must be honest about limits. */
  evidenceSummary: string;

  // Field 5 — Who should avoid it or ask first
  /** Explicit contraindication groups: pregnancy, children, elderly, conditions, meds */
  avoidIf: string[];

  // Field 6 — How to use safely
  howToUseSafely: string;

  // Field 7 — When to seek medical help
  seekHelpIf: string[];

  // Field 8 — Reviewer / source
  reviewer?: string;
  sources?: string[];

  // ── Metadata ─────────────────────────────────────────────────────────────
  category: WellnessCategory;
  /** Seasonal relevance — null means year-round */
  season?: WellnessSeason | null;
  /** Whether this topic is escalation-only (no home-care content) */
  escalationOnly?: boolean;
}

export type WellnessCategory =
  | 'kitchen_care'
  | 'sleep_stress'
  | 'digestion'
  | 'cough_cold'
  | 'skin_hair'
  | 'womens_wellness'
  | 'child_safe'
  | 'elder_care'
  | 'movement'
  | 'seasonal'
  | 'mental_wellness'
  | 'preventive';

export type WellnessSeason =
  | 'summer'
  | 'monsoon'
  | 'winter'
  | 'festival'
  | 'exam_stress';

/** Display config for each category (label + icon name) */
export const WELLNESS_CATEGORY_LABELS: Record<WellnessCategory, string> = {
  kitchen_care:    'Kitchen Care',
  sleep_stress:    'Sleep & Stress',
  digestion:       'Digestion',
  cough_cold:      'Cough & Cold',
  skin_hair:       'Skin & Hair',
  womens_wellness: "Women's Wellness",
  child_safe:      'Child-Safe Guidance',
  elder_care:      'Elder Care',
  movement:        'Movement & Exercise',
  seasonal:        'Seasonal Wellness',
  mental_wellness: 'Mental Wellness',
  preventive:      'Preventive Habits',
};

export const WELLNESS_SEASON_LABELS: Record<WellnessSeason, string> = {
  summer:       'Summer Care',
  monsoon:      'Monsoon Care',
  winter:       'Winter Care',
  festival:     'Festival Season',
  exam_stress:  'Exam / Work Stress',
};
