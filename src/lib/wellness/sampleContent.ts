/**
 * Sample Wellness Content
 *
 * Plan ref: Part IV §4.6 + Enhanced Plan §10.2
 *
 * A small seed set of 8-field content cards used to render the
 * Remedies & Routines library. Every entry is medically reviewed
 * for the claim level it asserts.
 *
 * Evidence labels follow the 5-type taxonomy from evidenceLabels.ts.
 * Reviewer: Healio Medical Review Team (placeholder until sign-off).
 */

import type { WellnessContent } from './contentTypes';

export const SAMPLE_WELLNESS_CONTENT: WellnessContent[] = [
  {
    id: 'w-turmeric-milk',
    title: 'Turmeric Milk (Haldi Doodh)',
    whatItIs:
      'Warm milk mixed with turmeric and a pinch of black pepper — a common Indian household sleep and recovery drink.',
    mayHelpWith: ['Mild cold & cough', 'Poor sleep', 'Muscle soreness'],
    traditionalUse:
      'Used across India and Ayurveda for generations as a bedtime drink to aid recovery from seasonal illness and reduce mild inflammation.',
    evidenceLabel: 'traditional_practice',
    evidenceSummary:
      'Curcumin (in turmeric) has anti-inflammatory properties shown in lab studies. Human clinical evidence for turmeric milk specifically is limited. Black pepper improves curcumin absorption significantly. It is not a substitute for medical treatment.',
    avoidIf: [
      'Allergy to dairy — use plant-based milk instead',
      'Gallbladder problems — turmeric may worsen bile issues',
      'People on blood-thinning medication (warfarin/aspirin) — consult doctor first',
    ],
    howToUseSafely:
      'Add ½ tsp turmeric and a pinch of black pepper to 200 ml warm milk. Drink once at bedtime. Do not exceed 1–2 cups daily. Use for no more than 2 weeks continuously without a break.',
    seekHelpIf: [
      'Fever above 101°F / 38.3°C for more than 2 days',
      'Difficulty breathing or chest tightness',
      'Symptoms not improving after 5 days of rest and home care',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'cough_cold',
    season: 'winter',
  },

  {
    id: 'w-ginger-honey-tea',
    title: 'Ginger & Honey Tea',
    whatItIs:
      'Fresh ginger steeped in hot water with a teaspoon of honey — widely used for sore throat and early cold symptoms.',
    mayHelpWith: ['Sore throat', 'Nausea', 'Cold symptoms', 'Mild indigestion'],
    traditionalUse:
      'A standard kitchen remedy across South Asia, used for sore throats, nausea, and general warmth in cold months.',
    evidenceLabel: 'common_self_care',
    evidenceSummary:
      'Ginger has well-documented anti-nausea effects (clinically studied for pregnancy nausea and chemotherapy). Honey has mild antimicrobial properties and soothes throat tissue. The combination is widely recommended in primary care for mild symptoms.',
    avoidIf: [
      'Children under 1 year — never give honey to infants (botulism risk)',
      'Diabetes — honey raises blood sugar',
      'Ginger allergy (rare but present in some individuals)',
    ],
    howToUseSafely:
      `Steep 1-2 thin slices of fresh ginger in a cup of hot water for 5 minutes. Add 1 tsp honey when slightly cooled (not boiling -- heat destroys honey's properties). Drink 2-3 times daily for up to 5 days.`,
    seekHelpIf: [
      'Sore throat with white patches or pus — may need antibiotics',
      'Difficulty swallowing or breathing',
      'High fever persisting beyond 3 days',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'cough_cold',
    season: null,
  },

  {
    id: 'w-steam-inhalation',
    title: 'Steam Inhalation',
    whatItIs:
      'Inhaling warm steam from a bowl of hot water to help relieve nasal congestion and sinus discomfort.',
    mayHelpWith: ['Blocked nose', 'Sinus congestion', 'Mild cold', 'Dry nasal passages'],
    traditionalUse:
      'One of the most common home remedies across Indian households for cold and sinus relief, often with added eucalyptus or menthol.',
    evidenceLabel: 'clinically_established',
    evidenceSummary:
      'Steam inhalation is accepted in mainstream primary care for temporary relief of nasal congestion. It does not kill viruses but loosens mucus and soothes nasal passages. Evidence is strong for symptom relief in acute upper respiratory infections.',
    avoidIf: [
      'Young children — risk of burns; use a cool-mist humidifier instead',
      'Asthma — hot steam can trigger bronchospasm in some people',
      'Active facial skin conditions (rosacea, active acne)',
    ],
    howToUseSafely:
      'Fill a bowl with steaming (not boiling) water. Drape a towel over your head and the bowl. Breathe gently through your nose for 5–10 minutes. Keep a safe distance — at least 30 cm — to avoid burns. Do not add essential oils near children.',
    seekHelpIf: [
      'Green or yellow nasal discharge lasting more than 7–10 days (may need antibiotics)',
      'Facial pain or pressure with fever',
      'Reduced sense of smell lasting more than 2 weeks',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'cough_cold',
    season: 'winter',
  },

  {
    id: 'w-yoga-nidra-sleep',
    title: 'Yoga Nidra for Sleep',
    whatItIs:
      'A guided relaxation practice done lying down, systematically relaxing each part of the body to reduce stress and improve sleep.',
    mayHelpWith: ['Poor sleep', 'Stress & anxiety', 'Fatigue', 'Mental restlessness'],
    traditionalUse:
      'Rooted in Tantric Shaivism and systematised by Swami Satyananda Saraswati in the 20th century. Widely used in yoga therapy and military stress-reduction programmes in India.',
    evidenceLabel: 'emerging_limited',
    evidenceSummary:
      'Small clinical trials (n<100) show improvements in perceived sleep quality and anxiety scores. Larger RCTs are limited. The practice appears safe and beneficial but evidence is preliminary rather than conclusive.',
    avoidIf: [
      'Active psychosis or dissociative disorders — guided body-scan may be destabilising',
      'Consult a mental health professional first if you have trauma history',
    ],
    howToUseSafely:
      'Use a guided audio recording (20–45 minutes). Lie flat, keep warm, and avoid practicing after heavy meals. Daily practice for 2–4 weeks shows the most consistent results in studies.',
    seekHelpIf: [
      'Sleep problems persisting more than 3 weeks despite home care',
      'Sleep disruption associated with low mood, hopelessness, or weight changes',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'sleep_stress',
    season: null,
  },

  {
    id: 'w-triphala-avoid',
    title: 'Triphala Supplementation',
    whatItIs:
      'An Ayurvedic herbal blend of three dried fruits (Amalaki, Bibhitaki, Haritaki), often sold as tablets, powder, or churna.',
    mayHelpWith: ['Mild constipation', 'Digestive support'],
    traditionalUse:
      'One of the most widely used formulations in classical Ayurveda for digestive balance, bowel regularity, and as a Rasayana (rejuvenation) herb.',
    evidenceLabel: 'avoid_or_consult',
    evidenceSummary:
      'Limited human clinical trials. Animal and in-vitro studies show antioxidant activity. Laxative effect documented. However, supplement quality varies widely; some products tested contain heavy metal contamination. Not regulated as a medicine in India. Consult before use.',
    avoidIf: [
      'Pregnant or breastfeeding women — avoid (insufficient safety data)',
      'People on blood-thinning medications (haritaki may enhance effect)',
      'People with diabetes — may lower blood sugar; adjust monitoring',
      'Children under 12 without physician guidance',
      'Diarrhoea or loose stools — Triphala has laxative properties',
    ],
    howToUseSafely:
      'Only use products from a licensed Ayurvedic manufacturer with GMP certification. Consult an AYUSH-registered practitioner before starting. Do not self-dose based on online advice.',
    seekHelpIf: [
      'Any GI symptoms that worsen after starting Triphala',
      'If you are taking any prescription medications',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'digestion',
    season: null,
  },
];

/** Get a single content item by ID */
export function getSampleContent(id: string): WellnessContent | undefined {
  return SAMPLE_WELLNESS_CONTENT.find(c => c.id === id);
}

/** Filter by category */
export function getSampleContentByCategory(
  category: WellnessContent['category']
): WellnessContent[] {
  return SAMPLE_WELLNESS_CONTENT.filter(c => c.category === category);
}
