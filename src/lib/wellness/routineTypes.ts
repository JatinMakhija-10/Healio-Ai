/**
 * Routine Builder Types
 *
 * Plan ref: Part IV §4.5 + Enhanced Plan §8.3
 *
 * A "Routine" is a structured daily or weekly plan built from
 * WellnessContent items, optionally personalised by Prakriti type.
 * Routines are suggested — never prescribed. Every routine item
 * inherits the evidence label of its source WellnessContent entry.
 */

import type { WellnessCategory, WellnessSeason } from './contentTypes';
import type { EvidenceLabelKey } from './evidenceLabels';
import type { DoshaType } from '@/lib/ayurveda/types';

// ─── Core types ───────────────────────────────────────────────────────────────

export type RoutineTimeSlot =
  | 'wake_up'       // Before breakfast (~6–7 am)
  | 'morning'       // After breakfast (~8–10 am)
  | 'midday'        // Around lunch (~12–2 pm)
  | 'afternoon'     // Mid-afternoon (~3–5 pm)
  | 'evening'       // Post-work (~6–8 pm)
  | 'before_bed';   // Wind-down (~9–10 pm)

export type RoutineFrequency = 'daily' | 'weekly' | 'as_needed';

/** A single step within a routine */
export interface RoutineStep {
  id: string;
  /** Title shown in the routine card */
  title: string;
  /** One-line description */
  description: string;
  /** Duration estimate, e.g. "5 minutes", "15–20 minutes" */
  duration?: string;
  /** Time slot this step belongs to */
  timeSlot: RoutineTimeSlot;
  frequency: RoutineFrequency;
  /** ID of the source WellnessContent entry (if this step came from the library) */
  contentId?: string;
  /** Inherited from the source WellnessContent entry */
  evidenceLabel: EvidenceLabelKey;
  category: WellnessCategory;
}

/** A complete named routine */
export interface WellnessRoutine {
  id: string;
  title: string;
  /** Short tagline, e.g. "A calming morning flow for Vata types" */
  tagline: string;
  /** Ordered list of steps, grouped by timeSlot in the UI */
  steps: RoutineStep[];
  /** Prakriti types this routine is appropriate for. Empty = all types. */
  suitableFor: DoshaType[];
  /** Seasonal availability. Null = year-round. */
  season: WellnessSeason | null;
  /** True if this routine was AI-suggested rather than manually curated */
  aiGenerated: boolean;
  /** The user who created or saved this routine (null for library defaults) */
  ownerId: string | null;
  createdAt: string;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const ROUTINE_TIME_SLOT_LABELS: Record<RoutineTimeSlot, string> = {
  wake_up:    'Wake Up',
  morning:    'Morning',
  midday:     'Midday',
  afternoon:  'Afternoon',
  evening:    'Evening',
  before_bed: 'Before Bed',
};

export const ROUTINE_FREQUENCY_LABELS: Record<RoutineFrequency, string> = {
  daily:     'Daily',
  weekly:    'Weekly',
  as_needed: 'As needed',
};

/** Group routine steps by time slot, preserving plan order */
export function groupStepsByTimeSlot(
  steps: RoutineStep[]
): Partial<Record<RoutineTimeSlot, RoutineStep[]>> {
  const ORDER: RoutineTimeSlot[] = [
    'wake_up', 'morning', 'midday', 'afternoon', 'evening', 'before_bed',
  ];
  const groups: Partial<Record<RoutineTimeSlot, RoutineStep[]>> = {};
  for (const slot of ORDER) {
    const slotSteps = steps.filter(s => s.timeSlot === slot);
    if (slotSteps.length > 0) groups[slot] = slotSteps;
  }
  return groups;
}
