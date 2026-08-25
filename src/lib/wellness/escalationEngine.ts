/**
 * Escalation Engine
 *
 * Plan ref: Part II §3.5 + Part IV §4.3 + §4.10
 *
 * Bridges the diagnosis layer (SafetyAssessment) to the UI layer
 * (EscalationAlertProps). Converts the intelligence layer's safety output
 * into the structured props the EscalationAlert component needs.
 *
 * Used by Ask Arovia response rendering — every response must run through
 * this before home-care suggestions are shown to the user.
 */

import type { SafetyAssessment } from '@/lib/diagnosis/advanced/intelligenceTypes';
import type { EscalationAlertProps, EscalationLevel } from '@/components/wellness/EscalationAlert';

// ─── Default copy for each escalation level ───────────────────────────────────
// Plan §3.5 exact trigger criteria + response language

const LEVEL_DEFAULTS: Record<
  EscalationLevel,
  { reason: string; action: string }
> = {
  L1: {
    reason:
      'What you have described sounds manageable with everyday self-care. Many people with a similar pattern recover well at home.',
    action:
      'Follow the care plan below. Return here — or see a practitioner — if your symptoms worsen or do not improve within the expected time.',
  },
  L2: {
    reason:
      'Your symptoms are not immediately concerning, but they are worth monitoring closely over the next day or two.',
    action:
      'Try the home-care steps below. If symptoms worsen before 48 hours, or persist beyond 48–72 hours without improvement, please see a practitioner.',
  },
  L3: {
    reason:
      'The pattern you have described is worth discussing with a doctor or AYUSH practitioner — not urgently, but within the next few days.',
    action:
      'Book an appointment in the next 2–3 days. You can try supportive home care in the meantime — but do not delay if you feel worse.',
  },
  L4: {
    reason:
      'Based on what you have described, we recommend seeing a doctor today. Please do not wait and observe.',
    action:
      'Visit a doctor or clinic today. Do not self-treat while waiting. If you cannot get a same-day appointment, go to an urgent care centre.',
  },
  L5: {
    reason:
      'What you have described includes signs that need emergency medical attention immediately.',
    action:
      'Call emergency services or go to the nearest emergency department now. Do not drive yourself. Do not delay.',
  },
};

// ─── Main converter ───────────────────────────────────────────────────────────

export interface EscalationEngineResult {
  /** Props to spread directly into <EscalationAlert /> */
  alertProps: EscalationAlertProps;
  /** Whether home-care content should be suppressed (L4/L5) */
  suppressHomeCare: boolean;
  /** Whether the escalation banner is non-dismissible (L4/L5) */
  nonDismissible: boolean;
}

/**
 * Convert a SafetyAssessment into EscalationAlert props.
 *
 * @param assessment  Output from SafetyGuardEnhancer.assess()
 * @param overrides   Optional copy overrides for the specific concern
 */
export function buildEscalationAlert(
  assessment: SafetyAssessment,
  overrides?: {
    reason?: string;
    action?: string;
    practitionerTip?: string;
  }
): EscalationEngineResult {
  const level: EscalationLevel = assessment.escalationLevel ?? 'L1';
  const defaults = LEVEL_DEFAULTS[level];

  // Build reason: prefer seekHelpReason from the engine, then overrides, then defaults
  let reason = defaults.reason;
  if (assessment.seekHelpReason) reason = assessment.seekHelpReason;
  if (overrides?.reason) reason = overrides.reason;

  // Append the first critical alert message if present and different from reason
  const criticalAlert = assessment.alerts.find(a => a.severity === 'critical');
  if (criticalAlert && !reason.includes(criticalAlert.message)) {
    reason = `${reason} ${criticalAlert.message}`;
  }

  const action = overrides?.action ?? defaults.action;

  // Practitioner tip: compile from alert recommendations for L3/L4
  let practitionerTip = overrides?.practitionerTip;
  if (!practitionerTip && (level === 'L3' || level === 'L4')) {
    const recs = assessment.alerts
      .map(a => a.recommendation)
      .filter(Boolean)
      .slice(0, 2);
    if (recs.length > 0) {
      practitionerTip = recs.join(' ');
    }
  }

  const nonDismissible = level === 'L4' || level === 'L5';

  return {
    alertProps: {
      level,
      reason,
      action,
      practitionerTip,
      // onDismiss is wired by the consumer component — not set here
    },
    suppressHomeCare: nonDismissible,
    nonDismissible,
  };
}

/**
 * Quick helper — returns true if home-care content must be hidden.
 * Use this as a gate before rendering any remedy/routine suggestions.
 *
 * Plan ref: Part IV §4.10 — "L4/L5 triggers always override home-care suggestions"
 */
export function shouldSuppressHomeCare(
  assessment: SafetyAssessment | null | undefined
): boolean {
  if (!assessment) return false;
  return assessment.escalationLevel === 'L4' || assessment.escalationLevel === 'L5';
}
