﻿/**
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

  // ── Low-risk wellness (plan §15.1) ─────────────────────────────────────────

  {
    id: 'w-hydration-summer',
    title: 'Staying Hydrated in Summer',
    whatItIs: 'A set of practical habits to maintain safe fluid balance during hot weather.',
    mayHelpWith: ['Heat exhaustion prevention', 'Fatigue', 'Headaches from dehydration'],
    traditionalUse:
      'Drinking water with a pinch of salt and sugar (homemade ORS), nimbu pani, and coconut water are traditional Indian summer practices for replenishing fluids and electrolytes.',
    evidenceLabel: 'clinically_established',
    evidenceSummary:
      'WHO and Indian guidelines consistently recommend 8-10 glasses of water daily, increasing to 10-12 in peak heat. Oral rehydration therapy is clinically proven for preventing and treating dehydration. Electrolyte replacement is evidence-backed for heat exposure.',
    avoidIf: [
      'Kidney disease with fluid restriction — follow your nephrologist\'s prescribed limit',
      'Heart failure — excess fluid intake may worsen the condition',
    ],
    howToUseSafely:
      'Drink water regularly throughout the day, not just when thirsty. Carry water when outdoors. Homemade ORS: 1 litre water + 6 tsp sugar + 0.5 tsp salt. Avoid very cold water immediately after sun exposure.',
    seekHelpIf: [
      'Dizziness, confusion, or rapid heartbeat in the heat',
      'Urine is very dark or absent for more than 6 hours',
      'Fainting or inability to keep fluids down',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'preventive',
    season: 'summer',
  },

  {
    id: 'w-sleep-routine',
    title: 'Better Sleep Routine',
    whatItIs: 'A set of daily habits that support reliable, restorative sleep — without medication.',
    mayHelpWith: ['Difficulty falling asleep', 'Waking through the night', 'Morning fatigue'],
    traditionalUse:
      'Evening oil massage (abhyanga), warm milk at bedtime, avoiding stimulating foods after sunset, and fixed sleep-wake times are long-standing Ayurvedic recommendations for sleep.',
    evidenceLabel: 'clinically_established',
    evidenceSummary:
      'Sleep hygiene practices have strong clinical support (CBT-I protocol). Consistent sleep-wake times, dark/cool rooms, and screen avoidance 1 hour before bed improve sleep quality measurably. Warm milk may have mild benefit via tryptophan content.',
    avoidIf: [
      'Sleep apnoea — behavioural changes alone are insufficient; seek medical review',
      'Chronic insomnia lasting more than 3 weeks — speak to a doctor',
    ],
    howToUseSafely:
      'Fix a wake-up time and hold to it every day including weekends. Keep the bedroom cool (18-22°C ideal), dark, and quiet. Avoid screens 60 minutes before sleep. Avoid caffeine after 2 pm. A brief 10-minute walk in the evening supports sleep onset.',
    seekHelpIf: [
      'Loud snoring with gasping — possible sleep apnoea',
      'Insomnia lasting more than 3 weeks despite good habits',
      'Persistent daytime sleepiness affecting work or safety',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'sleep_stress',
    season: null,
  },

  {
    id: 'w-screen-break',
    title: 'Screen-Break Routine (20-20-20)',
    whatItIs:
      'A simple eye-rest rule for people who spend long hours looking at digital screens.',
    mayHelpWith: ['Eye strain', 'Headaches from screen use', 'Dry eyes', 'Neck tension'],
    traditionalUse:
      'Regular breaks and distant gazing are mentioned in traditional vision-care texts. Modern optometrists formalised the 20-20-20 rule based on the same principle.',
    evidenceLabel: 'clinically_established',
    evidenceSummary:
      'The 20-20-20 rule (every 20 minutes, look at something 20 feet away for 20 seconds) is recommended by the American Academy of Ophthalmology to reduce digital eye strain. It reduces ciliary muscle fatigue and blink suppression.',
    avoidIf: [],
    howToUseSafely:
      'Set a 20-minute reminder. During each break, look at a window, tree, or distant wall — 20 feet (6 metres) away — for 20 seconds. Blink deliberately. Also adjust screen brightness to match room lighting and keep the screen at arm\'s length.',
    seekHelpIf: [
      'Persistent eye pain, redness, or blurred vision beyond eye strain',
      'Double vision or sudden vision change — seek care immediately',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'preventive',
    season: null,
  },

  {
    id: 'w-breathing-stress',
    title: 'Gentle Breathing for Stress (Diaphragmatic Breathing)',
    whatItIs:
      'A simple breathing technique that activates the parasympathetic nervous system to reduce acute stress.',
    mayHelpWith: ['Anxiety', 'Stress', 'Mild panic', 'Pre-exam nerves', 'Sleep onset'],
    traditionalUse:
      'Deep breathing is central to Pranayama practice in yoga and has been used in Indian wellness traditions for centuries. The 4-7-8 pattern and simple belly breathing are modern adaptations.',
    evidenceLabel: 'clinically_established',
    evidenceSummary:
      'Diaphragmatic breathing is clinically proven to reduce cortisol levels, lower heart rate, and improve mood during stress. Used in CBT, cardiac rehabilitation, and anxiety management. Evidence is strong and consistent across multiple RCTs.',
    avoidIf: [
      'Chronic obstructive pulmonary disease (COPD) — modified breathing only with physiotherapist guidance',
    ],
    howToUseSafely:
      'Sit comfortably. Place one hand on your chest and one on your belly. Breathe in slowly through the nose for 4 counts — belly should rise, chest stays still. Hold for 4 counts. Exhale slowly through pursed lips for 6-8 counts. Repeat 5-10 times. Practice daily.',
    seekHelpIf: [
      'Breathing difficulty, chest pain, or light-headedness during practice',
      'Persistent anxiety or panic attacks — speak to a doctor or psychologist',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'sleep_stress',
    season: null,
  },

  {
    id: 'w-oral-rehydration',
    title: 'Oral Rehydration Basics (ORS)',
    whatItIs:
      'A simple salt-and-sugar solution that replaces fluids and electrolytes lost through vomiting or diarrhoea.',
    mayHelpWith: ['Mild-to-moderate dehydration', 'Diarrhoea recovery', 'Vomiting recovery'],
    traditionalUse:
      'A version of ORS has been used in India (nimbu pani with salt) long before the WHO formalised the formula in the 1970s. It is now the cornerstone of diarrhoea management globally.',
    evidenceLabel: 'clinically_established',
    evidenceSummary:
      'WHO-ORS is one of the most evidence-supported interventions in global health, credited with saving millions of lives. Its mechanism — sodium-glucose co-transport — is well established. Homemade versions (water, sugar, salt) are slightly less optimal but effective for mild dehydration.',
    avoidIf: [
      'Signs of severe dehydration (sunken eyes, no urine for 8+ hours, confusion) — needs IV fluids, seek emergency care',
      'Severe vomiting where oral intake is not possible — seek hospital care',
    ],
    howToUseSafely:
      'Use WHO-ORS sachet (available at any pharmacy) dissolved in 1 litre of clean water. Homemade: 1 litre water + 6 level teaspoons sugar + 0.5 teaspoon salt. Give small sips frequently. For children: give a teaspoon every 1-2 minutes.',
    seekHelpIf: [
      'Child under 5 with severe diarrhoea (more than 6 watery stools in 24 hours)',
      'Blood in stool',
      'Inability to keep any fluids down for more than 4 hours',
      'Confusion, rapid breathing, or signs of severe dehydration',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'preventive',
    season: null,
  },

  {
    id: 'w-dry-skin-routine',
    title: 'Dry Skin Care Routine',
    whatItIs:
      'A simple moisturising and skin-barrier maintenance routine for mild dry skin, especially during winter or in dry climates.',
    mayHelpWith: ['Dry or flaky skin', 'Skin tightness', 'Mild eczema-like dryness'],
    traditionalUse:
      'Sarson (mustard) or coconut oil massage after bathing is a long-standing Indian skin practice. Applying oil to damp skin seals moisture — consistent with modern dermatology recommendations.',
    evidenceLabel: 'common_self_care',
    evidenceSummary:
      'Moisturising after bathing is clinically recommended for dry skin and mild atopic dermatitis. Coconut oil has demonstrated improvement in skin barrier function in studies. The mechanism — sealing water in the skin — is well established. Mustard oil has less evidence and may irritate sensitive skin.',
    avoidIf: [
      'Known nut allergy — avoid coconut oil; use fragrance-free aqueous cream instead',
      'Mustard oil: avoid on infants or broken skin',
    ],
    howToUseSafely:
      'Apply a thin layer of moisturiser or coconut oil to damp skin within 3 minutes of bathing. Use lukewarm (not hot) water. Avoid long showers in winter. Choose fragrance-free moisturisers for sensitive skin. Hands benefit from application after every wash.',
    seekHelpIf: [
      'Severe itching, bleeding, or infection signs (yellow crust, warmth, swelling)',
      'Dry skin that does not improve after 2 weeks of regular moisturising',
      'Widespread rash or hives — may need dermatologist review',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'skin_hair',
    season: 'winter',
  },

  {
    id: 'w-menstrual-comfort',
    title: 'Menstrual Comfort Habits',
    whatItIs:
      'Non-medication practices that reduce discomfort during menstruation, including heat, movement, diet, and rest.',
    mayHelpWith: ['Menstrual cramps', 'Bloating', 'Lower back pain during period', 'Fatigue'],
    traditionalUse:
      'Heat packs, light movement restriction, warm fluids, and avoiding cold food are traditional Indian practices during menstruation — consistent with modern comfort care.',
    evidenceLabel: 'clinically_established',
    evidenceSummary:
      'Heat therapy for dysmenorrhoea is clinically proven (heat pack equivalent to low-dose ibuprofen in some trials). Regular aerobic exercise reduces period pain over cycles. Reducing salt intake before menstruation may ease bloating. These are not substitutes for evaluation of severe dysmenorrhoea.',
    avoidIf: [],
    howToUseSafely:
      'Apply a warm (not hot) water bottle or heat pack to the lower abdomen for 20 minutes. Walk or do gentle yoga on days you feel able. Stay hydrated and reduce salt and caffeine in the days before your period. Rest when needed.',
    seekHelpIf: [
      'Period pain severe enough to miss school or work regularly',
      'Very heavy bleeding (soaking a pad every hour for 2+ hours)',
      'Irregular cycles, missed periods, or sudden worsening of pain',
      'Pain during intercourse — may indicate endometriosis; see a gynaecologist',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'womens_wellness',
    season: null,
  },

  // ── Traditional practice topics (plan §15.2) ────────────────────────────────

  {
    id: 'w-tulsi-tea',
    title: 'Tulsi Tea (Holy Basil)',
    whatItIs:
      'A warm tea made from fresh or dried Tulsi (Ocimum tenuiflorum) leaves — one of the most widely used plants in Indian household and Ayurvedic practice.',
    mayHelpWith: ['Mild cold comfort', 'Stress and anxiety', 'Mild throat irritation', 'Seasonal fatigue'],
    traditionalUse:
      'Tulsi has been revered in Indian homes for centuries — both spiritually and medicinally. It is brewed as a tea for cough, cold, fever, and mild stress, often with ginger and honey.',
    evidenceLabel: 'traditional_practice',
    evidenceSummary:
      'Preclinical studies suggest adaptogenic, antimicrobial, and anti-inflammatory properties. Human trials are small and limited. No strong clinical evidence for specific health outcomes. Safe as a tea in normal quantities. Not a treatment for any named condition.',
    avoidIf: [
      'Blood-thinning medications (warfarin, aspirin) — Tulsi may enhance the effect',
      'Diabetes medication — may lower blood sugar; monitor if using frequently',
      'Pregnancy in large medicinal doses — safe as culinary tea but avoid supplements',
    ],
    howToUseSafely:
      'Add 5-8 fresh Tulsi leaves (or 1 tsp dried) to 1 cup of hot water. Steep 5 minutes. Add honey when slightly cooled. Drink 1-2 cups daily for up to 1 week for cold/stress comfort.',
    seekHelpIf: [
      'Throat symptoms with white patches, difficulty swallowing, or high fever',
      'Cold symptoms not improving after 5 days',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'kitchen_care',
    season: 'winter',
  },

  {
    id: 'w-steam-inhalation',
    title: 'Steam Inhalation',
    whatItIs:
      'Breathing in warm steam to temporarily ease nasal congestion and soothe irritated airways — a common household cold and sinus comfort practice.',
    mayHelpWith: ['Nasal congestion', 'Blocked nose', 'Mild sinus discomfort', 'Dry throat from dry air'],
    traditionalUse:
      'Steam inhalation ("bhap lena") is used across Indian households for colds and sinus congestion. Adding eucalyptus oil or Vicks to the water is a common addition.',
    evidenceLabel: 'common_self_care',
    evidenceSummary:
      'Steam provides temporary symptomatic relief from nasal congestion. It does not treat the underlying infection or reduce its duration. Evidence for added benefit from eucalyptus oil is limited but it is generally safe for adults. The main risk is burns from hot water — this is the most common adverse event.',
    avoidIf: [
      'Children under 12 — high burn risk; use a cool-mist humidifier instead',
      'Asthma — steam may trigger bronchospasm in some patients; avoid',
      'Facial skin conditions or rosacea — heat may worsen',
    ],
    howToUseSafely:
      'Boil water, let it cool 1-2 minutes (not boiling), pour into a wide bowl. Place face 30 cm (1 foot) above the bowl — never lean directly over it. Drape a towel over the head to trap steam. Breathe gently for 5-10 minutes. Do not add water mid-session. Eucalyptus or menthol drops are optional and for adults only.',
    seekHelpIf: [
      'Facial pain, fever above 38.5°C, or thick green/yellow mucus for more than 7 days — may be sinusitis',
      'Difficulty breathing at rest or during steam',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'cough_cold',
    season: 'winter',
  },

  {
    id: 'w-ajwain-water',
    title: 'Ajwain Water (Carom Seed Tea)',
    whatItIs:
      'A traditional Indian digestive drink made by boiling ajwain (carom seeds, Trachyspermum ammi) in water.',
    mayHelpWith: ['Gas and bloating', 'Mild indigestion', 'Stomach cramps after eating', 'Acidity discomfort'],
    traditionalUse:
      'Ajwain is a staple of Indian kitchens used for thousands of years for digestive complaints. It is given as ajwain water, chewed after meals, or added to dal and bread to reduce gas.',
    evidenceLabel: 'traditional_practice',
    evidenceSummary:
      'Thymol in ajwain has proven antispasmodic and carminative properties in lab studies. Human clinical trials specifically for ajwain water are very limited. Its use as a digestive is consistent with its chemical properties. Not a substitute for medical evaluation of chronic digestive problems.',
    avoidIf: [
      'Pregnancy in large doses — ajwain may stimulate the uterus; culinary amounts are fine',
      'Peptic ulcer — thymol may irritate gastric mucosa in concentrated form',
      'Liver disease — high doses not recommended',
    ],
    howToUseSafely:
      'Add 1 teaspoon of ajwain seeds to 500 ml water and bring to a boil. Simmer 5 minutes, strain, and cool. Drink 100-150 ml after a heavy meal. Add a pinch of rock salt if desired. Limit to once daily.',
    seekHelpIf: [
      'Stomach pain lasting more than 48 hours',
      'Vomiting blood or very dark stools',
      'Unexplained weight loss with digestive symptoms',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'digestion',
    season: null,
  },

  {
    id: 'w-curd-rice',
    title: 'Curd and Rice for Stomach Upset',
    whatItIs:
      'A light, easily digestible meal of plain rice with room-temperature curd (yoghurt) used to settle the stomach during mild gastric upset.',
    mayHelpWith: ['Mild diarrhoea', 'Nausea', 'Post-illness appetite loss', 'Gastric discomfort'],
    traditionalUse:
      'Curd-rice (thayir sadam) is a staple recovery food across South India and widely used across India for digestive recovery. It is light, cooling (kapha-balancing in Ayurveda), and gentle on the stomach.',
    evidenceLabel: 'common_self_care',
    evidenceSummary:
      'Plain rice is a component of the BRAT diet (Bananas, Rice, Applesauce, Toast), which has clinical support for mild diarrhoea recovery. Curd contains live Lactobacillus cultures (probiotics) with evidence for reducing diarrhoea duration. The combination is sensible, gentle, and widely practised.',
    avoidIf: [
      'Lactose intolerance — use lactose-free yoghurt or plain rice only',
      'Milk protein allergy',
    ],
    howToUseSafely:
      'Use freshly made curd or plain natural yoghurt with live cultures (not sweetened or flavoured). Mix with lightly salted plain rice. Eat at room temperature. Add a pinch of cumin powder if desired. Small quantities 3-4 times a day. Resume normal diet gradually as symptoms improve.',
    seekHelpIf: [
      'Diarrhoea lasting more than 3 days in adults, or more than 24 hours in young children',
      'Blood in stool',
      'High fever with diarrhoea',
      'Signs of dehydration — no urine, sunken eyes, extreme thirst',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'digestion',
    season: null,
  },

  {
    id: 'w-yoga-nidra',
    title: 'Yoga Nidra for Relaxation',
    whatItIs:
      'A guided body-scan meditation practice that induces a state of deep rest while maintaining awareness — sometimes called "yogic sleep".',
    mayHelpWith: ['Stress and anxiety', 'Sleep difficulties', 'Mental fatigue', 'Post-illness recovery rest'],
    traditionalUse:
      'Yoga Nidra originates in Tantric tradition and was systematised by Swami Satyananda Saraswati in the 20th century. It is now widely practised as a guided relaxation tool in wellness and clinical settings.',
    evidenceLabel: 'emerging_limited',
    evidenceSummary:
      'Small RCTs show benefits for stress, anxiety, and sleep quality. Studies in cancer patients, chronic pain, and PTSD show promising results. Evidence base is growing but still limited — larger trials are needed. The practice itself carries no harm risk for most people.',
    avoidIf: [
      'Active psychosis or severe dissociative disorders — body-scan practices may be contraindicated; consult a mental health professional first',
    ],
    howToUseSafely:
      'Lie comfortably on your back in a quiet, dark space. Follow a guided audio (20-45 minutes) — many free recordings are available. Do not do this while driving. Once daily, ideally before sleep or after lunch. If distressing thoughts arise, open your eyes and sit up.',
    seekHelpIf: [
      'Persistent sleep problems lasting more than 3 weeks despite relaxation practice',
      'Severe anxiety, depression, or panic attacks — speak to a doctor or psychologist',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'sleep_stress',
    season: null,
  },

  {
    id: 'w-pranayama-safety',
    title: 'Pranayama Safety (Basic Breathing Practices)',
    whatItIs:
      'A family of breathing exercises from yogic tradition that regulate breathing rate and pattern to influence the mind and body.',
    mayHelpWith: ['Stress and anxiety', 'Mild breathlessness from anxiety', 'Focus and concentration', 'Blood pressure support'],
    traditionalUse:
      'Pranayama is a core part of Ashtanga yoga, practised for thousands of years across India. Basic practices like Anulom-Vilom (alternate nostril) and Bhramari (humming bee) are widely taught.',
    evidenceLabel: 'emerging_limited',
    evidenceSummary:
      'Slow pranayama practices show modest evidence for reducing blood pressure and anxiety in small trials. Bhramari and Anulom-Vilom have shown benefit for stress markers. Evidence for therapeutic use in disease is limited. Safe for general wellness use in healthy adults. Avoid advanced techniques (Kapalabhati, Bhastrika) without experienced guidance.',
    avoidIf: [
      'Asthma or COPD — certain breathing exercises may trigger symptoms; consult a respiratory physiotherapist',
      'Cardiovascular disease — avoid breath retention (kumbhaka) practices without medical clearance',
      'Pregnancy — avoid forceful exhalation exercises; gentle slow breathing is safe',
      'Recent surgery or abdominal injury — avoid abdominal pranayama',
    ],
    howToUseSafely:
      'Start with slow, gentle practices only: Anulom-Vilom (alternate nostril) or Bhramari (humming). Practise 5-10 minutes daily. Stop if you feel dizzy, lightheaded, or anxious. Never force the breath. Avoid advanced techniques (Kapalabhati, Bhastrika, Kumbhaka) without an experienced teacher.',
    seekHelpIf: [
      'Chest pain, fainting, or palpitations during any breathing exercise',
      'Worsening breathlessness — rule out cardiac or respiratory cause',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'mental_wellness',
    season: null,
  },

  {
    id: 'w-light-food-indigestion',
    title: 'Light Food During Indigestion',
    whatItIs:
      'Dietary adjustments that reduce the burden on the digestive system during mild indigestion, nausea, or gastric discomfort.',
    mayHelpWith: ['Mild indigestion', 'Nausea', 'Bloating', 'Post-illness appetite recovery', 'Acidity'],
    traditionalUse:
      'Khichdi (rice and moong dal), plain toast, ripe banana, and coconut water are staple Indian recovery foods. The principle — light, warm, easy-to-digest food — is consistent across Ayurvedic and clinical dietary guidance.',
    evidenceLabel: 'common_self_care',
    evidenceSummary:
      'Clinical dietary guidance for gastric upset consistently recommends bland, easily digestible foods. Bananas (potassium, pectin) and rice (binding) are clinically supported components of recovery diets. Reducing fat, spice, and fibre acutely reduces gastric irritation.',
    avoidIf: [],
    howToUseSafely:
      'Choose: plain rice or khichdi, ripe banana, plain toast, plain boiled potato, coconut water. Avoid: spicy, fried, or fatty foods; raw vegetables; milk (except curd); caffeine and alcohol. Eat small amounts every 2-3 hours. Resume normal diet gradually over 2-3 days as symptoms ease.',
    seekHelpIf: [
      'Vomiting that prevents any food or fluid intake for more than 6 hours',
      'Severe abdominal pain — do not manage at home, seek immediate care',
      'Symptoms lasting more than 3 days without improvement',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'digestion',
    season: null,
  },

  {
    id: 'w-simple-walking',
    title: 'Simple Walking for Daily Movement',
    whatItIs:
      'A sustainable, low-cost physical activity that supports cardiovascular health, mood, blood sugar regulation, and weight maintenance.',
    mayHelpWith: ['General fitness', 'Mild stress and low mood', 'Blood sugar management', 'Sleep quality', 'Weight maintenance'],
    traditionalUse:
      'Morning and evening walks (prabhati sair) are a deeply rooted Indian daily habit, recommended across traditional and modern wellness guidance.',
    evidenceLabel: 'clinically_established',
    evidenceSummary:
      'Walking 30 minutes daily (or 7,500-10,000 steps) has extensive clinical evidence for reducing cardiovascular risk, improving glycaemic control in Type 2 diabetes, reducing depression symptoms, and supporting weight management. It is the most accessible and evidence-supported daily physical activity.',
    avoidIf: [
      'Active foot wounds, especially in diabetic patients — consult a doctor before beginning a walking programme',
      'Recent cardiac event — exercise only as cleared by your cardiologist',
    ],
    howToUseSafely:
      'Start with 15 minutes daily if you are currently sedentary. Build to 30 minutes over 2 weeks. Walk at a pace where you can hold a conversation but feel slightly breathless. Wear supportive footwear. Avoid walking outdoors in peak summer heat (12-4 pm); prefer early morning or evening.',
    seekHelpIf: [
      'Chest pain, palpitations, or unusual breathlessness during light walking',
      'Foot pain, numbness, or tingling — especially in diabetic patients',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'movement',
    season: null,
  },


  // ── Batch 2: Remaining §VI pilot topics ───────────────────────────────────

  {
    id: 'hair-oiling-safety',
    title: 'Hair oiling — safe practice',
    whatItIs: 'Traditional hair oiling before washing — using coconut, sesame, or amla oil — is a widely practised scalp-care ritual in Indian households.',
    mayHelpWith: ['Scalp dryness', 'Hair breakage from dryness', 'Relaxation via scalp massage'],
    traditionalUse: 'Coconut, sesame, and amla oils have been used in Indian hair care for centuries. Warm oil massage (champi) is a well-established pre-wash practice across Ayurveda and folk tradition.',
    evidenceLabel: 'traditional_practice',
    evidenceSummary: 'Limited clinical evidence exists for oiling improving hair growth. Coconut oil has some research support for reducing protein loss in hair. Amla has antioxidant properties studied in vitro. Cultural and anecdotal benefit is widely reported.',
    avoidIf: [
      'Active scalp infection, dandruff, or seborrhoeic dermatitis — oil can worsen fungal overgrowth',
      'Open wounds or sores on the scalp',
      'Known allergy to any of the oils used',
    ],
    howToUseSafely: 'Warm the oil slightly (test on wrist — not hot). Apply to scalp and hair 1–2 hours before washing; avoid leaving overnight if you have dandruff-prone scalp. Wash out thoroughly with mild shampoo. A tablespoon is enough for most hair lengths.',
    seekHelpIf: [
      'Scalp itching, flaking, or redness that worsens after oiling',
      'Hair loss that is sudden or in patches',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'skin_hair',
    season: null,
  },

  {
    id: 'posture-desk-workers',
    title: 'Posture for desk workers',
    whatItIs: 'Ergonomic posture habits and movement breaks for people who sit at a desk for extended hours each day.',
    mayHelpWith: ['Neck and upper back stiffness', 'Lower back discomfort', 'Eye strain from screens', 'Afternoon fatigue'],
    traditionalUse: 'Yogic posture principles — alignment, breathing awareness, and periodic movement — inform many modern ergonomic guidelines and physiotherapy recommendations.',
    evidenceLabel: 'clinically_established',
    evidenceSummary: 'Strong evidence links prolonged sitting and poor ergonomics to musculoskeletal discomfort. Regular movement breaks and correct screen positioning are well-supported by occupational health research and WHO guidelines.',
    avoidIf: [
      'Acute disc prolapse or spinal injury — consult a physiotherapist before making postural changes',
    ],
    howToUseSafely: 'Screen at eye level, not below. Feet flat on floor or footrest. Chair supports lower back. Take a 2-minute movement break every 30–45 minutes: stand, walk, or do shoulder rolls. The 20-20-20 rule for eyes: every 20 minutes, look 20 feet away for 20 seconds.',
    seekHelpIf: [
      'Pain radiating down the arm or leg (numbness, tingling)',
      'Neck or back pain that does not improve with rest or movement breaks',
      'Headaches starting at the base of the skull',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'movement',
    season: null,
  },

  {
    id: 'healthy-morning-routine',
    title: 'Healthy morning routine',
    whatItIs: 'A consistent set of morning habits — hydration, light movement, and a proper breakfast — that supports energy, mood, and focus throughout the day.',
    mayHelpWith: ['Sustained energy through the morning', 'Better mood and focus', 'Reducing reliance on caffeine'],
    traditionalUse: 'Ayurvedic Dinacharya (daily routine) prescribes waking before sunrise, tongue scraping, oil pulling, and a warm breakfast — elements that align with modern sleep science and circadian rhythm research.',
    evidenceLabel: 'common_self_care',
    evidenceSummary: 'Consistent wake times, morning hydration, and eating breakfast are supported by circadian biology and behavioural research. Limiting early screen use is associated with better cortisol patterns. No single protocol is universally proven; consistency matters more than specifics.',
    avoidIf: [
      'No specific contraindications — adjust intensity if unwell or sleep-deprived',
    ],
    howToUseSafely: 'Wake at a consistent time. Drink one glass of warm or room-temperature water first. Spend 5–10 minutes on light stretching or breathing. Eat breakfast within 90 minutes of waking. Limit phone use for the first 20 minutes.',
    seekHelpIf: [
      'Persistent morning fatigue despite adequate sleep — rule out thyroid or anaemia',
      'Difficulty eating in the morning combined with nausea — mention to your doctor',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'preventive',
    season: null,
  },

  {
    id: 'reducing-processed-sugar',
    title: 'Reducing processed sugar',
    whatItIs: 'Cutting back on added and processed sugar — from drinks, packaged snacks, and desserts — to support energy stability, weight, and long-term metabolic health.',
    mayHelpWith: ['Energy stability (fewer blood sugar spikes and crashes)', 'Skin health', 'Weight management', 'Reducing dental caries'],
    traditionalUse: 'Traditional Indian diets relied on natural sweetness from fruits, jaggery in moderation, and seasonal foods. Processed sugar is a modern addition with no traditional roots.',
    evidenceLabel: 'clinically_established',
    evidenceSummary: 'Robust clinical evidence links high added sugar intake to obesity, type 2 diabetes, and cardiovascular disease risk. WHO and Indian dietary guidelines recommend limiting free sugars to under 10% of total daily energy intake. Replacing sugar with whole fruit is consistently supported.',
    avoidIf: [
      'Diabetic patients should consult their doctor about sugar substitutes — some alternatives affect blood glucose differently',
    ],
    howToUseSafely: 'Remove one obvious source at a time: sweetened drinks, packaged biscuits, or daily dessert. Replace with fruit, plain nuts, or roasted chana. Read labels — sugar hides as corn syrup, dextrose, and maltose. Jaggery and honey are lower-glycaemic alternatives but are still sugar — use sparingly.',
    seekHelpIf: [
      'Intense sugar cravings that feel uncontrollable — could indicate blood sugar dysregulation',
      'Any symptom of diabetes: unusual thirst, frequent urination, unexplained weight loss',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'preventive',
    season: null,
  },

  {
    id: 'evening-wind-down',
    title: 'Evening wind-down routine',
    whatItIs: 'A consistent set of calming habits in the 60–90 minutes before bed that improve sleep onset, sleep quality, and next-day energy.',
    mayHelpWith: ['Falling asleep faster', 'Deeper, less fragmented sleep', 'Reducing next-day fatigue and irritability'],
    traditionalUse: 'Ayurveda recommends Ratricharya (evening routine): light dinner, gentle walking, avoiding stimulating activity, and preparing the mind and body for sleep through calm rituals.',
    evidenceLabel: 'clinically_established',
    evidenceSummary: 'Sleep hygiene research consistently supports dim lighting, screen cessation, and consistent sleep timing as effective for improving sleep onset latency and quality. These recommendations are endorsed by AASM and international sleep medicine guidelines.',
    avoidIf: [
      'Clinical insomnia or sleep disorders — these need professional assessment alongside lifestyle changes',
    ],
    howToUseSafely: 'Dim lights and turn off screens 60 minutes before bed. Eat dinner at least 2 hours before sleep. A short walk after dinner aids digestion. 5 minutes of light stretching or breathing eases the body into rest. Avoid stressful news or work emails in the final hour.',
    seekHelpIf: [
      'Inability to fall or stay asleep consistently for more than 3 weeks',
      'Snoring loudly or waking with headaches — possible sleep apnoea',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'sleep_stress',
    season: null,
  },

  {
    id: 'mindful-eating-basics',
    title: 'Mindful eating basics',
    whatItIs: 'The practice of eating slowly and with full attention — no screens, no multitasking — to improve digestion and awareness of hunger and fullness cues.',
    mayHelpWith: ['Bloating and indigestion', 'Overeating and portion awareness', 'Improving relationship with food'],
    traditionalUse: 'Ayurvedic eating principles include sitting to eat, chewing thoroughly, eating in a calm environment, and not eating when emotionally upset — consistent with modern mindful eating research.',
    evidenceLabel: 'common_self_care',
    evidenceSummary: 'Mindful eating is associated with reduced binge eating and improved satiety signalling in clinical reviews. It is included in evidence-based behavioural nutrition programmes. Effects on weight alone are modest; impact on food relationship and digestion comfort is better supported.',
    avoidIf: [
      'Eating disorders — mindful eating can be helpful but should be guided by a professional in clinical eating disorder contexts',
    ],
    howToUseSafely: 'Put the phone away during meals. Eat seated, not standing. Chew each mouthful thoroughly. Pause mid-meal to check hunger — are you still hungry or just eating out of habit? Take at least 20 minutes per main meal.',
    seekHelpIf: [
      'Persistent bloating, pain, or reflux despite dietary changes',
      'Significant unintended weight loss or gain',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'digestion',
    season: null,
  },

  {
    id: 'safe-sun-exposure',
    title: 'Safe sun exposure',
    whatItIs: 'Brief, daily sun exposure — particularly in the early morning — to support Vitamin D synthesis and mood, while avoiding peak-UV midday sun.',
    mayHelpWith: ['Vitamin D synthesis', 'Mood support (via serotonin)', 'Circadian rhythm regulation'],
    traditionalUse: 'Surya Namaskar (sun salutation) and early morning sun exposure are longstanding Indian wellness traditions. Culturally, morning sun is considered sattvic and health-promoting.',
    evidenceLabel: 'clinically_established',
    evidenceSummary: 'UVB exposure triggering cutaneous Vitamin D synthesis is well-established. Morning light exposure supporting circadian rhythm and serotonin is robustly supported in sleep and mood research. The risk of UV-induced skin damage at midday is also clinically established — balance is key.',
    avoidIf: [
      'History of skin cancer or very fair skin with sunburn history — limit and use SPF',
      'Photosensitive conditions such as lupus',
      'Certain medications increase photosensitivity (tetracyclines, some antifungals) — check with your doctor',
    ],
    howToUseSafely: 'Aim for 15–20 minutes on arms and face between 7–10 am. Avoid direct midday sun (11 am–3 pm) in Indian summers. Use SPF 30+ if staying outdoors beyond 20 minutes. Do not substitute sun exposure for medically confirmed Vitamin D supplementation.',
    seekHelpIf: [
      'Any new mole, skin lesion, or change in an existing mole — get it assessed',
      'Severe sunburn with blistering',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'preventive',
    season: 'summer',
  },

  {
    id: 'basic-hand-hygiene',
    title: 'Basic hand hygiene',
    whatItIs: 'Handwashing with soap and water for at least 20 seconds — one of the most evidence-backed ways to prevent the spread of respiratory and gastrointestinal infections.',
    mayHelpWith: ['Reducing transmission of cold and flu', 'Preventing food-borne illness', 'Protecting vulnerable family members (children, elderly)'],
    traditionalUse: 'Washing hands before meals and after using the toilet is embedded in Indian household tradition and religious practice — consistent with modern infection control principles.',
    evidenceLabel: 'clinically_established',
    evidenceSummary: 'Handwashing with soap is one of the most cost-effective public health interventions, supported by WHO, CDC, and extensive epidemiological research. It reduces diarrhoeal disease incidence by up to 47% and respiratory infections by up to 23% in controlled studies.',
    avoidIf: [
      'No contraindications. Excessive washing with harsh soaps can cause skin dryness — use a moisturising hand cream if needed.',
    ],
    howToUseSafely: 'Wet hands, apply soap, lather for 20 seconds covering all surfaces including between fingers and under nails. Rinse thoroughly. Dry with a clean cloth or air. Key moments: before handling food, after the toilet, after public surfaces, after blowing the nose.',
    seekHelpIf: [
      'Recurrent skin cracking or bleeding from hand-washing — may indicate eczema or dermatitis needing dermatologist assessment',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'preventive',
    season: null,
  },

  {
    id: 'mild-seasonal-allergies',
    title: 'Managing mild seasonal allergies',
    whatItIs: 'Safe home strategies for managing seasonal sneezing, itchy eyes, and runny nose caused by pollen, dust, or environmental triggers.',
    mayHelpWith: ['Sneezing and runny nose', 'Itchy, watery eyes', 'Mild nasal congestion'],
    traditionalUse: 'Jal neti (nasal irrigation with saline) is a classical Hatha Yoga practice shown in modern research to help clear nasal passages and reduce allergy symptom burden.',
    evidenceLabel: 'common_self_care',
    evidenceSummary: 'Saline nasal irrigation has good clinical evidence for reducing allergic rhinitis symptoms (Cochrane reviews). Allergen avoidance is a cornerstone of allergy management. OTC antihistamines have established efficacy. Jal neti specifically has supporting small-scale trials.',
    avoidIf: [
      'Severe or sudden allergic reactions (hives, throat swelling, difficulty breathing) — these are emergencies, not seasonal allergy',
      'Jal Neti: always use boiled, distilled, or sterile saline — never plain tap water',
    ],
    howToUseSafely: 'Keep windows closed during high-pollen periods. Rinse face and nasal passages after coming indoors. Saline nasal rinse twice daily reduces irritant load. Change pillowcases frequently. OTC antihistamine eye drops are generally safe for short-term use.',
    seekHelpIf: [
      'Symptoms lasting more than 2 weeks without improvement',
      'Fever, facial pain, or thick coloured discharge — suggests sinusitis',
      'Wheezing or difficulty breathing alongside nasal symptoms',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'seasonal',
    season: 'summer',
  },

  {
    id: 'back-stretching-safety',
    title: 'Safe stretching for back discomfort',
    whatItIs: 'Gentle, targeted stretches for mild, non-specific lower back discomfort — designed to release muscle tension without worsening underlying issues.',
    mayHelpWith: ['Lower back stiffness from prolonged sitting', 'Muscle tension from stress', 'Post-exercise tightness'],
    traditionalUse: 'Yoga asanas — Balasana (Child Pose), Setu Bandhasana (Bridge Pose), and Pawanmuktasana (Wind-release Pose) — have been used for centuries to address lower back tension and stiffness.',
    evidenceLabel: 'clinically_established',
    evidenceSummary: 'Stretching and yoga for non-specific lower back pain have strong evidence from multiple systematic reviews and clinical guidelines (NICE, ACP). Gentle movement is now preferred over bed rest for most acute and chronic lower back pain episodes.',
    avoidIf: [
      'Acute disc herniation, sciatica with radiating leg pain, or recent spinal surgery — consult a physiotherapist first',
      'Any stretch that causes sharp, shooting, or worsening pain — stop immediately',
    ],
    howToUseSafely: 'Start with 2–3 minutes once or twice daily on a firm, flat surface. Knees-to-chest: lie on your back, hug both knees for 30 seconds. Cat-cow: on hands and knees, alternate arching and rounding for 8–10 slow breaths. Child pose: kneel and stretch arms forward, forehead down for 30 seconds. Never bounce or force a stretch.',
    seekHelpIf: [
      'Pain radiating down one or both legs, or tingling or numbness in feet',
      'Back pain that wakes you from sleep or is significantly worse in the morning',
      'Back pain alongside fever, unexplained weight loss, or bladder/bowel difficulty',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'movement',
    season: null,
  },

  {
    id: 'seasonal-food-habits',
    title: 'Seasonal food habits',
    whatItIs: 'The practice of eating foods naturally available and appropriate to each season — a principle shared by Ayurveda, traditional Indian cooking, and modern nutritional ecology.',
    mayHelpWith: ['Digestive comfort', 'Seasonal immunity support', 'Reducing bloating and heaviness'],
    traditionalUse: 'Ritucharya (seasonal routine) in Ayurveda prescribes specific foods, tastes, and practices for each season: cooling foods in summer, warming foods in winter, light foods during monsoon when Agni (digestive fire) is considered weakest.',
    evidenceLabel: 'traditional_practice',
    evidenceSummary: 'Modern evidence supports eating locally and seasonally for micronutrient density (seasonal produce is fresher and nutritionally richer). Specific Ayurvedic seasonal protocols have limited clinical trial data but align with general principles of variety and appropriate-calorie diets.',
    avoidIf: [
      'No general contraindications; specific dietary conditions (diabetes, kidney disease, IBS) require dietitian guidance',
    ],
    howToUseSafely: 'Summer: prioritise cooling foods — cucumber, coconut water, curd, mint, watermelon. Monsoon: eat light, well-cooked foods; include ginger and turmeric for digestive support; avoid raw salads and street food. Winter: warm soups, ghee in moderation, seasonal root vegetables, jaggery. Year-round: prefer seasonal over cold-stored produce.',
    seekHelpIf: [
      'Persistent digestive symptoms regardless of diet — needs clinical assessment',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'seasonal',
    season: null,
  },

  {
    id: 'homeopathy-evidence-review',
    title: 'Homeopathy — honest evidence review',
    whatItIs: 'A balanced, evidence-informed overview of homeopathy — what it is, where evidence supports its use, and where it should not replace conventional care.',
    mayHelpWith: ['Chronic low-severity complaints (patient-reported benefit for recurrent colds, mild skin conditions, functional digestive issues)', 'As a complement to conventional care for chronic management'],
    traditionalUse: 'Developed in the late 18th century by Samuel Hahnemann. Widely practised in India under the AYUSH framework. Classical homeopathy uses highly diluted preparations matched to individual symptom patterns (constitutional prescribing).',
    evidenceLabel: 'traditional_practice',
    evidenceSummary: 'Current systematic reviews (Cochrane, UK NHS, Australian NHMRC) find no reliable evidence that homeopathy is more effective than placebo for any health condition. Patient-reported improvement is common and may reflect the therapeutic consultation, placebo effect, or natural disease resolution. It is not appropriate as a substitute for evidence-based care in serious or acute conditions.',
    avoidIf: [
      'Acute emergencies — homeopathy is not appropriate as a primary treatment for infections, sepsis, trauma, or any emergency',
      'Do not replace prescribed medication with homeopathy without discussing with your doctor',
      'Avoid remedies marketed as vaccine replacements — no evidence supports this use',
    ],
    howToUseSafely: 'If using for chronic, low-severity concerns, consult a registered practitioner (BHMS/MD Homeopathy). Keep your allopathic doctor informed. Do not discontinue prescribed medications. Use as a complement, not a replacement. Be cautious of practitioners who claim to treat serious conditions exclusively with homeopathy.',
    seekHelpIf: [
      'Any condition that is worsening, acute, or involves danger signs — seek conventional medical care immediately',
      'You feel pressured to stop prescribed medication in favour of homeopathy',
    ],
    reviewer: 'Healio Medical Review — v1 (May 2026)',
    category: 'kitchen_care',
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
