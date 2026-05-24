/**
 * Ask Healio — 7-Step Response Structure
 *
 * Plan ref: Part IV §4.3 + Enhanced Plan §7 (AI Response Format)
 *
 * Every Ask Healio response MUST contain all 7 blocks.
 * The renderer decides which blocks to surface and in what order,
 * but the data contract is defined here.
 *
 * Rendering rules (plan §4.3):
 *  1. If escalationLevel is L4 or L5 → suppress home_care block,
 *     show escalation block as non-dismissible banner at top.
 *  2. evidence_label MUST be present on every recommendation.
 *  3. safety_note block is always rendered, never suppressible.
 *  4. Never use the word "diagnose", "cure", "treat", "prescribe".
 */

import type { EvidenceLabelKey } from './evidenceLabels';
import type { EscalationLevel } from '@/components/wellness/EscalationAlert';

// ─── Step 1: Acknowledgement ──────────────────────────────────────────────────
export interface AcknowledgementBlock {
  type: 'acknowledgement';
  /**
   * 1–2 sentences validating what the user shared.
   * Warm, non-clinical tone. No diagnosis framing.
   * e.g. "It sounds like you've been dealing with this for a few days — that
   *       can feel draining."
   */
  text: string;
}

// ─── Step 2: Understanding (what Healio understood) ───────────────────────────
export interface UnderstandingBlock {
  type: 'understanding';
  /** Plain-language summary of what Healio understood from the input */
  summary: string;
  /** Any clarifications Healio had to make (e.g. assumed symptom duration) */
  assumptions?: string[];
}

// ─── Step 3: Escalation level ─────────────────────────────────────────────────
export interface EscalationBlock {
  type: 'escalation';
  level: EscalationLevel;
  /** Plain-language reason for this level */
  reason: string;
  /** Specific action instruction */
  action: string;
  /** Optional tip for what to tell a practitioner (L3/L4 only) */
  practitionerTip?: string;
}

// ─── Step 4: Home care / wellness suggestions ─────────────────────────────────
export interface HomeCareItem {
  /** Short action title, e.g. "Warm turmeric milk at bedtime" */
  title: string;
  description: string;
  evidenceLabel: EvidenceLabelKey;
  /** Duration or timing suggestion */
  timing?: string;
}

export interface HomeCareBlock {
  type: 'home_care';
  /**
   * MUST be empty / omitted when escalationLevel is L4 or L5.
   * Plan ref: §4.10 — "L4/L5 always override home-care suggestions."
   */
  items: HomeCareItem[];
  /**
   * Framing header, e.g. "Things that may help while you rest at home"
   * Never use "treatment" or "remedy for [condition]".
   */
  heading: string;
}

// ─── Step 5: What to watch for ────────────────────────────────────────────────
export interface WatchForBlock {
  type: 'watch_for';
  /** List of signs that should prompt immediate escalation */
  redFlags: string[];
  /** Signs that warrant a non-urgent consultation */
  yellowFlags?: string[];
  /**
   * Timeframe: if no improvement within this time, escalate.
   * e.g. "48 hours", "3 days"
   */
  revisitAfter?: string;
}

// ─── Step 6: Safety note ──────────────────────────────────────────────────────
export interface SafetyNoteBlock {
  type: 'safety_note';
  /**
   * Always rendered. Never suppressible.
   * Standard disclaimer + any condition-specific cautions.
   */
  text: string;
  /**
   * Specific groups for which this topic requires extra caution.
   * e.g. ["pregnant women", "children under 5", "people on blood thinners"]
   */
  cautionGroups?: string[];
}

// ─── Step 7: Follow-up ────────────────────────────────────────────────────────
export interface FollowUpBlock {
  type: 'follow_up';
  /** Suggested next question the user might want to ask */
  suggestedQuestions?: string[];
  /** Link to a relevant content card or routine in the library */
  relatedContentId?: string;
  relatedRoutineId?: string;
}

// ─── Union and full response ──────────────────────────────────────────────────

export type AskHealioBlock =
  | AcknowledgementBlock
  | UnderstandingBlock
  | EscalationBlock
  | HomeCareBlock
  | WatchForBlock
  | SafetyNoteBlock
  | FollowUpBlock;

/**
 * The complete structured response from Ask Healio.
 * All 7 blocks are required; home_care items may be empty at L4/L5.
 */
export interface AskHealioResponse {
  id: string;
  /** ISO timestamp */
  generatedAt: string;
  blocks: [
    AcknowledgementBlock,
    UnderstandingBlock,
    EscalationBlock,
    HomeCareBlock,
    WatchForBlock,
    SafetyNoteBlock,
    FollowUpBlock,
  ];
}

// ─── Validator ────────────────────────────────────────────────────────────────

/**
 * Runtime check that a response has all 7 required block types.
 * Returns an array of missing block types (empty = valid).
 */
export function validateAskHealioResponse(
  response: Partial<AskHealioResponse>
): string[] {
  const REQUIRED_TYPES: AskHealioBlock['type'][] = [
    'acknowledgement',
    'understanding',
    'escalation',
    'home_care',
    'watch_for',
    'safety_note',
    'follow_up',
  ];
  const present = new Set((response.blocks ?? []).map(b => b.type));
  return REQUIRED_TYPES.filter(t => !present.has(t));
}

/**
 * Check if home care items should be suppressed for this response.
 * Plan ref: §4.10
 */
export function homeCareAllowed(response: AskHealioResponse): boolean {
  const escalation = response.blocks.find(b => b.type === 'escalation') as
    | EscalationBlock
    | undefined;
  if (!escalation) return true;
  return escalation.level !== 'L4' && escalation.level !== 'L5';
}

/** Standard safety note text used across all responses. */
export const STANDARD_SAFETY_NOTE =
  'Healio provides wellness information only. It is not a licensed medical ' +
  'practitioner and cannot diagnose conditions, prescribe treatment, or replace ' +
  'a doctor\'s consultation. Always seek professional advice for persistent, ' +
  'worsening, or concerning symptoms. In an emergency, call 112.';
