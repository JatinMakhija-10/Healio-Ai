/**
 * Escalation-Only Topics
 *
 * Plan ref: Enhanced Plan §15.3 + §9.3 (Required Guardrails)
 *
 * These topics MUST NEVER receive home-care content.
 * Any Ask Healio response matching these topics goes straight to
 * Level 4 / Level 5 escalation (plan §3.5 Escalation Ladder).
 *
 * RULE: If `isEscalationOnlyTopic()` returns true, the response renderer
 * must suppress home-care blocks entirely and show only the escalation alert.
 */

// ─── Escalation-only topic IDs (no home care, ever) ──────────────────────────

export const ESCALATION_ONLY_TOPIC_IDS = new Set<string>([
  'chest-pain',
  'severe-breathing',
  'stroke-symptoms',
  'severe-allergic-reaction',
  'infant-fever',
  'pregnancy-bleeding',
  'severe-dehydration',
  'suicidal-ideation',
  'severe-abdominal-pain',
  'blood-in-stool-vomit',
]);

// ─── Keyword phrases that trigger escalation-only mode ───────────────────────
// Used to screen free-text input before any home-care content is shown.

export const ESCALATION_ONLY_KEYWORDS: string[] = [
  // Cardiac / respiratory
  'chest pain',
  'chest tightness',
  'chest pressure',
  'can\'t breathe',
  'cannot breathe',
  'difficulty breathing',
  'severe breathlessness',
  'breathing stopped',

  // Neurological / stroke
  'stroke',
  'face drooping',
  'arm weakness',
  'slurred speech',
  'sudden confusion',
  'sudden severe headache',
  'loss of consciousness',
  'fainted',
  'seizure',
  'convulsion',

  // Allergic / anaphylaxis
  'anaphylaxis',
  'throat swelling',
  'tongue swelling',
  'severe allergic',
  'allergic reaction severe',

  // Paediatric emergencies
  'infant fever',
  'baby fever',
  'newborn fever',
  'baby not breathing',

  // Obstetric
  'pregnancy bleeding',
  'bleeding during pregnancy',
  'vaginal bleeding pregnant',
  'miscarriage',

  // GI emergencies
  'vomiting blood',
  'blood in stool',
  'black tarry stool',
  'severe stomach pain',
  'severe abdominal pain',

  // Dehydration / collapse
  'severe dehydration',
  'can\'t keep water down',
  'no urine for 8 hours',

  // Mental health crisis
  'suicidal',
  'want to die',
  'kill myself',
  'self harm',
  'overdose',
];

// ─── Helper functions ─────────────────────────────────────────────────────────

/**
 * Returns true if the given free-text input contains any escalation-only
 * keyword phrase. Case-insensitive.
 *
 * Usage: Call this BEFORE generating any home-care content.
 * If true → show EscalationAlert (L4/L5) only — no home-care blocks.
 */
export function isEscalationOnlyInput(input: string): boolean {
  const lower = input.toLowerCase();
  return ESCALATION_ONLY_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Returns true if the given content topic ID is escalation-only.
 */
export function isEscalationOnlyTopic(topicId: string): boolean {
  return ESCALATION_ONLY_TOPIC_IDS.has(topicId);
}

// ─── Emergency routing guidance ───────────────────────────────────────────────
// These are the standardised messages to show for each escalation-only topic.

export interface EscalationOnlyGuidance {
  topicId: string;
  heading: string;
  body: string;
  callToAction: string;
  urgency: 'L4' | 'L5';
}

export const ESCALATION_GUIDANCE: EscalationOnlyGuidance[] = [
  {
    topicId: 'chest-pain',
    heading: 'Chest pain needs immediate attention',
    body: 'Chest pain can have serious causes including heart attack. Do not wait to see if it improves. Call emergency services (112) or go to the nearest emergency department now.',
    callToAction: 'Call 112 now',
    urgency: 'L5',
  },
  {
    topicId: 'severe-breathing',
    heading: 'Severe breathing difficulty is an emergency',
    body: 'Inability to breathe normally is a medical emergency. Do not attempt home management. Call 112 or go to the nearest emergency department immediately.',
    callToAction: 'Call 112 now',
    urgency: 'L5',
  },
  {
    topicId: 'stroke-symptoms',
    heading: 'Stroke symptoms need emergency care within minutes',
    body: 'Signs of stroke — face drooping, arm weakness, speech difficulty — require emergency care immediately. Every minute matters. Call 112 now.',
    callToAction: 'Call 112 — time is critical',
    urgency: 'L5',
  },
  {
    topicId: 'severe-allergic-reaction',
    heading: 'Severe allergic reaction requires emergency care',
    body: 'Throat or tongue swelling, difficulty breathing after exposure to an allergen is anaphylaxis — a life-threatening emergency. Use an EpiPen if available. Call 112 immediately.',
    callToAction: 'Call 112 now',
    urgency: 'L5',
  },
  {
    topicId: 'infant-fever',
    heading: 'Fever in a baby under 3 months needs same-day care',
    body: 'Any fever in an infant under 3 months, or fever above 39°C in a child under 6 months, requires same-day medical assessment. Do not manage at home.',
    callToAction: 'See a doctor today',
    urgency: 'L4',
  },
  {
    topicId: 'suicidal-ideation',
    heading: 'You are not alone — please reach out now',
    body: 'If you are having thoughts of suicide or self-harm, please speak to someone immediately. iCall (India): 9152987821. Vandrevala Foundation: 1860-2662-345 (24/7). Or go to your nearest emergency department.',
    callToAction: 'Call iCall: 9152987821',
    urgency: 'L5',
  },
  {
    topicId: 'pregnancy-bleeding',
    heading: 'Bleeding during pregnancy needs same-day emergency care',
    body: 'Any vaginal bleeding during pregnancy — especially with pain, fever, or dizziness — requires immediate assessment. Do not wait. Go to the nearest maternity emergency or call 112.',
    callToAction: 'Go to maternity emergency now',
    urgency: 'L5',
  },
  {
    topicId: 'severe-dehydration',
    heading: 'Severe dehydration can become life-threatening',
    body: 'If you or a family member cannot keep any fluids down, has not passed urine in 8+ hours, is very dizzy or confused, or a child is limp and unresponsive — this is a medical emergency. Go to emergency immediately.',
    callToAction: 'Go to emergency or call 112',
    urgency: 'L4',
  },
  {
    topicId: 'severe-abdominal-pain',
    heading: 'Severe abdominal pain needs urgent assessment',
    body: 'Sudden severe abdominal pain — especially with fever, rigid abdomen, or vomiting — can indicate a surgical emergency (appendicitis, perforation). Do not attempt home management. Seek emergency care now.',
    callToAction: 'Go to emergency now',
    urgency: 'L5',
  },
  {
    topicId: 'blood-in-stool-vomit',
    heading: 'Blood in vomit or stool requires urgent care',
    body: 'Vomiting blood or passing black tarry stools indicates bleeding in the digestive tract. This is a medical emergency. Do not wait for symptoms to resolve. Call 112 or go to the nearest emergency department immediately.',
    callToAction: 'Call 112 or go to emergency',
    urgency: 'L5',
  },
];
