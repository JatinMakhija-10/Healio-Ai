# Arovia Traditional Wellness Repositioning Plan
**Enhanced & Evaluated Edition**

| Field | Detail |
|---|---|
| Date | May 21, 2026 |
| Prepared for | Arovia Product & Design Team |
| Version | 2.0 — Enhanced with Evaluation & Clinical Utility Framework |
| Status | Internal Planning Document |

> **About this document:** This enhanced edition adds (1) a critical evaluation of the original plan, (2) a new Clinical Utility Framework defining how Arovia can maximise genuine health value within honest, compliant boundaries, and (3) strengthened product, content, and governance guidance throughout.

---

## Part I — Plan Evaluation

## 1. Critical Evaluation of the Original Plan

The May 21 plan is a strong strategic document. It is well-researched, compliance-aware, and reflects a clear-eyed reading of where Arovia's risks lie. The following evaluation identifies genuine strengths, gaps, and areas that need deeper development before the plan becomes actionable.

### 1.1 Strengths

- **Strong regulatory literacy.** The plan correctly cites DPDP, CCPA/PIB misleading-ad guidance, ASCI, and Ayush Suraksha. This is more rigorous than most wellness-app planning documents.
- **Clear positioning shift.** Moving from a remedy/diagnosis frame to a wellness navigation frame is the right strategic direction and reduces the product's biggest liability surface.
- **Practical content taxonomy.** The five evidence labels (Clinically established, Common self-care, Traditional practice, Emerging/limited, Avoid or consult first) are specific enough to implement.
- **Escalation-first thinking.** Embedding red-flag detection as a product feature rather than a disclaimer is excellent UX and safety design.
- **Roadmap is realistic.** The five-phase structure with time estimates is workable and appropriately sequences compliance before UI work.

### 1.2 Gaps That Need Addressing

- **The plan does not define what Arovia's AI can actually do clinically.** Saying "AI provides education and wellness navigation" is compliant language but leaves the product team without clear guidance on what value the AI creates beyond a well-written FAQ. This gap is filled in Section 3.
- **Brand concepts lack differentiation logic.** Concepts A, B, and C overlap heavily. The "recommended blend" is vague. A clearer decision tree for choosing between them — based on target segment — is needed.
- **Success metrics include outputs but no outcome metrics.** Did users make better decisions? Did escalations match appropriate cases? The plan should distinguish leading from lagging indicators.
- **No competitor or benchmark analysis.** The plan positions Arovia in the abstract; it does not situate it against 1mg, Practo, Ayurvedic app competitors, or general health-search alternatives.
- **Data architecture is underspecified.** Section 7.4 of the original mentions data-minimisation but does not specify what data is collected, how long it is retained, or how the consent flow is structured technically.
- **Practitioner credentialing process is absent.** The plan mentions displaying qualifications but does not define how Arovia verifies them — both a safety and regulatory matter.

### 1.3 Overall Assessment

> **The plan is directionally correct and compliance-aware.** It needs one significant addition — a clear framework for how the AI creates genuine clinical utility within honest boundaries — and several operational details to become executable. The sections below address both.

---

## Part II — Strategic Direction

## 2. Executive Direction (Confirmed & Strengthened)

> **Brand Promise:** Arovia helps Indian families understand everyday health concerns, build preventive routines, and choose safe next steps — without panic, and without replacing professional care.

### 2.1 What Arovia Is and Is Not

| Category | Meaning |
|---|---|
| **Arovia IS** | A wellness navigation layer that helps users understand concerns, sort self-manageable from serious, access culturally relevant routines, and reach qualified practitioners when needed |
| **Arovia IS** | An evidence-labelled library of traditional and modern wellness guidance |
| **Arovia IS** | A safe escalation engine that detects red flags and routes users appropriately |
| **Arovia IS NOT** | A diagnostic platform — it does not identify disease in a user |
| **Arovia IS NOT** | A prescribing platform — it does not issue treatment instructions |
| **Arovia IS NOT** | A replacement for registered medical practitioners |
| **Arovia IS NOT** | A platform that guarantees outcomes or certifies remedies as cures |

### 2.2 The Mental Model Shift

The single most important product change is not visual. It is cognitive.

**Old mental model:**
> *"Tell me your disease and I will suggest a remedy."*

**New mental model:**
> *"Tell me what is going on and I will help you understand it, manage what you can safely, and reach the right person for what you cannot."*

---

## Part III — Clinical Utility Framework (New)

## 3. Clinical Utility Framework: Maximising Value Within Honest Boundaries

This section directly addresses a gap in the original plan. It defines precisely how Arovia's AI can create genuine, substantial clinical value for users — without making diagnostic claims, without legal risk, and without misleading users about what the product does.

> **Important note:** The goal of this framework is not to find clever workarounds to compliance rules. It is to demonstrate that operating within honest, legal boundaries still enables an extremely useful product — one that meaningfully improves health decisions for millions of users.

### 3.1 The Space Between Search and Diagnosis

There is a large, underserved space between a Google search result and a clinical consultation. Arovia's value lives here. Consider what a trusted, medically literate friend can do when you describe a symptom:

- Tell you the range of common, everyday causes of that symptom pattern
- Tell you which features of your situation are reassuring and which are concerning
- Help you monitor the situation — what changes to watch for, over what timeframe
- Explain what a doctor is likely to ask and examine, helping you prepare
- Tell you what self-care is reasonable while you wait and what is not
- Recommend you see a professional today versus tomorrow versus next week
- Explain what a practitioner told you in plain language

None of the above is diagnosis. All of it is enormously valuable. **This is exactly what Arovia's AI should do.**

### 3.2 What Arovia's AI Can Legitimately Do

| Capability | What Arovia Does | Design Constraint |
|---|---|---|
| **Symptom pattern education** | Explain what conditions commonly present with this symptom combination in general population terms | Always present as population-level possibilities, never as the user's diagnosis. Use "many people with this pattern have…" not "you have…" |
| **Temporal guidance** | Advise on how long a symptom is typically self-limiting before professional review is warranted | Frame as general guidance, not a personalised prognosis. "Most uncomplicated cases resolve within X days; if not, see a practitioner." |
| **Red-flag detection** | Identify features in the user's description that indicate potential urgency | The highest-value capability. Do it aggressively and conservatively — always better to escalate when uncertain. |
| **Self-care guidance** | Recommend evidence-supported or traditionally accepted self-care appropriate to the concern | Label evidence level. Include contraindications. Emphasise monitoring. |
| **Practitioner preparation** | Help users know what information to bring, what questions to ask, what examination to expect | Positions Arovia as complement to professional care, not substitute. Increases consultation quality. |
| **Medication context education** | Explain how common OTC medications or traditional preparations work in general terms | Never suggest dosing for prescription medications. Always recommend reading labels and consulting a pharmacist or doctor. |
| **Care pathway navigation** | Guide users toward the right type of practitioner for their concern | A key service gap — many users do not know whether to see a GP, specialist, AYUSH practitioner, or emergency care. |
| **Post-consultation support** | Help users understand what a practitioner told them, follow-up timelines, lifestyle adjustments | Does not modify or second-guess the practitioner's advice; amplifies adherence and understanding. |

### 3.3 The Honest Warning Framework

The original plan proposes warnings as a compliance layer. This framework treats them as a core UX feature. A well-designed warning system makes Arovia more useful, not less.

- **Warnings must be proximate.** They appear next to the relevant content, not on a separate legal page nobody reads.
- **Warnings must be specific.** "Consult a doctor" is useless. "This should not be used if you are pregnant, have kidney disease, or take blood thinners — ask your doctor or pharmacist first" is useful.
- **Warnings must be graduated.** Distinguish urgent (seek care now), advisory (discuss at your next appointment), and precautionary (be aware of this possibility).
- **Warnings must be actionable.** Every warning includes a clear next step, not just a cautionary statement.
- **The red-flag engine must be embedded in the conversational flow, not added at the end.** Before suggesting any home care, screen for danger signs.

### 3.4 Language That Is Both Safe and Useful

The original plan provides a safe/risky language table. This framework goes further — showing how to be simultaneously cautious and genuinely helpful, avoiding the trap of watered-down language that says nothing useful.

| Risky | Watered-Down (also avoid) | Honest and Useful |
|---|---|---|
| "This cures your stomach pain" | "This may help with some wellness goals" | "Ginger tea is commonly used for nausea and mild indigestion. Evidence supports its use for nausea; for pain, evidence is limited. Avoid on an empty stomach." |
| "You have acid reflux" | "We cannot say what you have" | "The pattern you describe — burning after meals, worse lying down — is very commonly associated with acid reflux. A doctor can confirm this with a brief assessment." |
| "This prevents dengue" | "This supports your health" | "There is no home remedy proven to prevent dengue. The only evidence-based prevention is mosquito control. We can walk you through that." |
| "See a doctor eventually" | "You may want to consider a consultation" | "Given the fever above 38.5°C in a child under 3 months, please seek medical attention today — do not wait." |
| "Turmeric treats inflammation" | "Turmeric may support wellness" | "Turmeric contains curcumin, which has shown anti-inflammatory properties in lab studies. Evidence in humans is modest. It is safe in food amounts. Supplements need caution in high doses." |

### 3.5 The Escalation Ladder

Every user pathway must route through an escalation ladder. This is both a safety feature and a product differentiator.

| Level | Trigger Criteria | Arovia Response |
|---|---|---|
| **Level 1 — Routine Self-Care** | Symptom is common, mild, temporally limited, no danger signs | Self-care guidance with monitoring instructions and a clear "return here if X, Y, or Z" trigger |
| **Level 2 — Watchful Waiting** | Symptom is not immediately dangerous but warrants monitoring | Home care plus a specific time threshold: "If this continues beyond 48 hours, or worsens before then, see a practitioner" |
| **Level 3 — Non-Urgent Consult** | Symptom pattern suggests professional assessment within days | "This is worth discussing with a doctor or AYUSH practitioner. Here is what to tell them and what they may check." |
| **Level 4 — Urgent Consult** | Symptom pattern warrants same-day professional attention | "Please see a doctor today. Here is what to tell them. Do not self-treat while waiting." |
| **Level 5 — Emergency** | Danger signs present | "This needs emergency care. Call emergency services or go to the nearest emergency department now. Do not delay." |

### 3.6 What Arovia Should Never Do

- Never name a specific disease as the user's diagnosis, even with caveats. "You likely have X" is a diagnosis regardless of the qualifier.
- Never suggest stopping, modifying, or substituting a prescription medication.
- Never contradict a practitioner's specific advice to a named user, even if the advice seems questionable.
- Never provide dosing instructions for prescription or controlled medications.
- Never suggest that a traditional remedy is equivalent in efficacy to a prescribed treatment.
- Never provide mental health crisis support beyond immediate escalation to crisis resources.
- Never collect or store sensitive health data without explicit, specific, informed consent under DPDP principles.

> **Framework conclusion:** There is substantial space to be genuinely useful without diagnosis, without legal exposure, and without misleading users. The product does not need loopholes or workarounds — it needs a clearly defined model of what it does, executed with design rigour.

---

## Part IV — Brand & Product Strategy

## 4. Repositioning Strategy

### 4.1 Current Perception Risk

Arovia's existing homeopathy-forward assets create three compounding risks:

1. Users may perceive Arovia as a treatment or prescribing platform, creating misaligned expectations and potential liability.
2. Marketing copy may drift into cure or prevention claims that require substantiation Arovia cannot provide.
3. The clinical dashboard aesthetic positions Arovia as a medical tool rather than a daily wellness companion, limiting retention and broadening.

### 4.2 New Brand Territory

| Old Emphasis | New Emphasis |
|---|---|
| Homeopathy-first guidance | Indian wellness-first guidance |
| Remedy recommendations | Routine, lifestyle, and safe next-step guidance |
| Condition-oriented content | Concern, habit, and prevention-oriented content |
| Clinical dashboard feel | Warm household wellness companion |
| "AI can answer health questions" | "AI helps you understand and act safely" |

### 4.3 Tagline Options

- Everyday wellness, understood simply.
- Calm guidance for daily health.
- Indian wellness wisdom, safely guided.
- Small steps for better days.
- Your daily wellness companion.

> **Avoid:** Taglines implying cure, diagnosis, guaranteed prevention, or medical replacement — "cure naturally," "doctor at home," "AI vaidya," or "prevent disease with home remedies" are all non-compliant.

### 4.4 Segment-Concept Mapping

| Target Segment | Primary Concept | Design Emphasis |
|---|---|---|
| Urban young professional, 25–35 | Concepts B + C | Lead with habits, routines, and evidence labels. De-emphasise "ghar" framing. |
| Household decision-maker (typically women, 30–50) | Concepts A + C | Lead with family safety and culturally familiar care. Evidence labels as reassurance. |
| Tier 2/3 user, vernacular-first | Concept A | Lead with warmth, simplicity, and local language. Safety messaging prominent. |
| Premium health-conscious user | Concepts B + C | Lead with science-backed traditional practice, routine tracking, and practitioner access. |

---

## 5. Product Principles

1. **Wellness before treatment.** Default language: "support," "routine," "care," "relief," "when to seek help." Not: "cure," "treat," "prescribe."
2. **Indian, but not ornamental.** Cultural cues through routines, food habits, seasonal context, family patterns, and local languages — not festival posters or decorative heritage boards.
3. **Evidence labels everywhere.** Every recommendation classified as: Clinically established / Common self-care / Traditional practice / Emerging or limited evidence / Avoid or consult first.
4. **Safety as UX, not legal wall.** Red flags, emergency guidance, and escalation embedded in the flow — not appended as fine print.
5. **Calm enough for night-time anxiety.** Familiar enough for family use.
6. **Genuinely useful within honest limits.** (See Clinical Utility Framework, Section 3.)

---

## 6. Information Architecture

### 6.1 Primary Navigation

| Section | Content | Design Note |
|---|---|---|
| **1. Home** | Daily check-in, seasonal prompt, quick concern entry, saved routines | Must not ask users to diagnose themselves |
| **2. Ask Arovia** | Conversational guidance, red-flag screening, evidence-labeled suggestions, escalation | Governed by Clinical Utility Framework |
| **3. Remedies & Routines** | Kitchen care, sleep, digestion, cough/cold, skin, women's wellness, child-safe, elder care | No content without evidence tag |
| **4. My Wellness** | Routine tracker, hydration/sleep/movement/food/stress, cycle/seasonal notes | Primary retention driver |
| **5. Practitioners** | Qualified profiles, scope labels, qualifications, appointment/chat | Credentialing required |
| **6. Learn** | Explainers, myth checks, seasonal guides, safety notes, evidence summaries | Trust and education layer |

### 6.2 Home Screen Concept

The first screen asks: **"What do you need help with today?"**

Entry cards:
- I feel unwell
- I want a home-care routine
- I want preventive tips
- I need to know if this is serious
- I want to consult someone

User routes into one of three pathways:
- **Everyday care:** hydration, rest, food, lifestyle, symptom monitoring
- **Traditional wellness:** clearly labelled cultural/home practices with cautions
- **Medical escalation:** red flags, practitioner consult, emergency guidance

---

## 7. UI/UX Design Direction

### 7.1 Design Mood

Warm, clean, household-familiar. Calm for anxious users. More tactile than a generic AI chatbot. Designed for repeated daily use — not only crisis moments.

### 7.2 Palette Direction

| Role | Colour | Usage |
|---|---|---|
| Primary | Tulsi green `#2D6A4F` | CTAs, progress, wellness states |
| Secondary | Marigold `#E9A21A` | Positive highlights, seasonal prompts |
| Accent | Indigo `#3D405B` | Trust, learning, practitioner pathways |
| Soft support | Rose clay `#C9675A` | Gentle alerts, family/women's wellness |
| Background | Warm ivory | Light mode surface |
| Text | Deep charcoal | Primary readability |
| Safety | Clear red/amber | Red flags and cautions only |

> **Avoid:** Overuse of saffron, temple motifs, mandalas, dark blue medical dashboards, neon gradients, or all-green palettes.

### 7.3 Interaction Principles

- Use progressive disclosure: brief first response, details behind "Why this helps" and "Safety notes."
- Put cautions close to recommendations, not hidden in legal pages.
- Keep all health flows answerable in under 60 seconds.
- Always provide one immediate action and one monitoring instruction.
- Make "Talk to a practitioner" visible but not fear-inducing.

---

## 8. Core Feature Restructure

### 8.1 Ask Arovia: Wellness Navigator

New response structure for every concern entry:

1. **Calm summary:** "This sounds uncomfortable, but many everyday causes are manageable."
2. **Red-flag check:** "Before home care, check if any of these are present…" — full escalation ladder applied.
3. **Likely everyday causes:** plain-language population-level patterns (not the user's diagnosis).
4. **Care plan:** hydration, rest, diet, routine, safe home comfort.
5. **Traditional options:** only with evidence label, cautions, and contraindications.
6. **When to consult:** specific time thresholds and symptom triggers.
7. **Practitioner preparation:** what to tell them, what they may check.

### 8.2 Remedies & Routines Library

Each content card must include:
- What it may support
- How to use it safely
- Who should avoid it
- Evidence label
- When to seek care
- Source or reviewer name

### 8.3 Seasonal Wellness Modules

- **Summer:** hydration, ORS awareness, heat red flags
- **Monsoon:** digestion, hygiene, mosquito prevention
- **Winter:** dry skin, warm foods, respiratory comfort
- **Festival:** digestion, sleep disruption, sugar moderation
- **Exam/work stress:** sleep, breathwork, screen breaks

### 8.4 Family Wellness Profiles (DPDP compliant)

- Age band, not exact DOB unless clinically necessary
- Pregnancy status as optional safety flag
- Medication and allergy flags
- Dietary preference
- Region and language preference
- Chronic-condition caution flags

### 8.5 Practitioner Layer

Strict separation between wellness guidance and consultation. Practitioner profiles must display: registration/qualification, system of practice, scope of advice, consultation mode, language, and referral/safety policy.

---

## Part V — Compliance & Governance

## 9. Compliance-Sensitive Areas

> **Disclaimer:** This section identifies product and content risks for review. It is not legal advice. All claim language, advertising copy, and data practices should be reviewed by qualified legal counsel and healthcare advisors before publication.

### 9.1 High-Risk Claims to Avoid

- "Cures [any named condition]" — diabetes, PCOS, dengue, COVID, cancer, depression, infertility
- "Prevents disease" unless backed by recognised evidence in a compliant framing
- "No side effects" or "natural means always safe"
- "Guaranteed relief"
- "Doctor replacement" or "AI vaidya"
- "Clinically proven" without substantiation
- "Best medicine" or "most effective remedy" without evidence

### 9.2 Safe Language Table

| Risky Language | Safer Alternative |
|---|---|
| Cure | Support, comfort, help manage, may ease |
| Treatment | Care step, routine, wellness support |
| Prescription | Suggestion, option to discuss with your practitioner |
| Diagnosis | Possible pattern, concern category (not your diagnosis) |
| Prevents disease | Helps maintain wellness, supports healthy habits |
| No side effects | Generally used traditionally, but may not suit everyone — see safety notes |
| Clinically proven | Evidence-supported / Traditional practice (label clearly) |

### 9.3 Required Guardrails

- **Red-flag escalation engine:** Chest pain, breathing difficulty, stroke symptoms, severe allergic reaction, severe dehydration, fainting, high fever in infants, pregnancy complications, suicidal ideation, severe abdominal pain, blood in stool or vomit.
- **Contraindication checks:** Pregnancy, children, elderly, chronic disease, allergies, anticoagulants, diabetes medication, blood pressure medication, psychiatric medication, liver/kidney disease.
- **Evidence labels:** No traditional practice presented as clinically proven without substantiation.
- **Medical scope separation:** AI provides education and navigation; registered practitioners provide diagnosis and treatment.
- **Advertising review:** All marketing copy, influencer scripts, and app-store text must pass health-claim review before publication.
- **Data privacy:** Collect only necessary data, explain purpose clearly, provide withdrawal and deletion options, support language accessibility for consent notices.

---

## 10. Content Governance Model

### 10.1 Content Categories

| Category | Example | Review Level |
|---|---|---|
| Low-risk wellness | Sleep hygiene, hydration, screen breaks | Product + content review |
| Common self-care | Steam inhalation, ORS awareness | Healthcare reviewer |
| Traditional practice | Tulsi, ginger, turmeric, homeopathy references | Healthcare reviewer + evidence label |
| Condition-adjacent | PCOS lifestyle, diabetes food habits | Medical reviewer |
| High-risk medical | Chest pain, pregnancy bleeding, infant fever | Strict escalation only — no content, only routing |

### 10.2 Content Card Template

1. What this is
2. What it may help with
3. How people traditionally use it
4. What the evidence says
5. Who should avoid it or ask first
6. How to use safely
7. When to seek medical help
8. Reviewer / source

### 10.3 Review Workflow

1. Draft content
2. Add evidence label
3. Run claim-risk checklist
4. Healthcare review
5. Legal/compliance review for claims and ads
6. Publish with version history
7. Monitor feedback, adverse events, complaints, and corrections

---

## 11. Branding Concepts

### Concept A — "Ghar Ka Wellness Companion"

**Positioning:** A calm household guide for everyday health decisions.
**Best for:** Family adoption, Tier 2/3 expansion, vernacular support.
**Sample copy:** *"For everyday health questions, home-care routines, and knowing when to see a practitioner."*

### Concept B — "Modern Ayurveda-Inspired Wellness"

**Positioning:** Contemporary wellness app inspired by Indian preventive care, without claiming to be an Ayurveda clinic.
**Best for:** Urban millennials, premium subscription, routine tracking.
**Sample copy:** *"Build daily routines around sleep, food, stress, movement, and seasonal care."*

### Concept C — "Safe Traditional Care"

**Positioning:** Traditional remedies and wellness practices with safety checks and evidence labels.
**Best for:** Differentiation from random internet advice.
**Sample copy:** *"Traditional wellness guidance, clearly labelled and safely explained."*

> **Recommended blend:** Use Concept A as the emotional core (warmth, family, household familiarity), Concept B as the product system (routines, habits, modern design), and Concept C as the trust layer (evidence labels, safety checks, practitioner access).

---

## 12. Practitioner Credentialing (New Section)

### 12.1 Minimum Verification Standards

- Registration certificate from the relevant statutory body (NMC for allopathy; relevant State council for AYUSH)
- Valid registration number, checkable against the public registry
- Scope of practice declaration signed by the practitioner
- Mandatory disclosure of any disciplinary proceedings or suspension

### 12.2 Profile Display Requirements

- Registration number and body, displayed prominently
- System of practice (MBBS / Ayurveda / Homeopathy / Unani / Siddha / Naturopathy / Yoga)
- Declared scope: general wellness advice / symptom assessment / treatment / prescription
- Consultation mode: chat / video / in-person
- Language(s) of consultation
- Referral policy

### 12.3 Telemedicine Compliance

> Telemedicine Practice Guidelines (MoHFW, 2020) govern what practitioners can do remotely. Key constraints: certain medications cannot be prescribed via teleconsultation; informed consent must be obtained; patient records must be maintained. Arovia's practitioner layer must comply with these guidelines.

---

## 13. Success Metrics (Enhanced)

### 13.1 Leading Indicators (Process)

- Home-to-action conversion rate
- Ask Arovia completion rate
- Routine creation rate
- 7-day routine retention rate
- Practitioner escalation acceptance rate
- Repeat weekly active users

### 13.2 Lagging Indicators (Outcomes — New)

- User self-reported: "I made a better decision because of Arovia" (post-session survey)
- Escalation accuracy: did Level 4/5 escalations match cases that genuinely needed urgent care? (sample audit)
- Practitioner feedback: are users arriving better prepared for consultations?
- Suppression accuracy: were remedies correctly withheld for contraindicated users?

### 13.3 Trust and Safety Metrics

- Red-flag detection rate and false negative rate (critical)
- Unsafe remedy suppression count
- User comprehension of evidence labels (comprehension test)
- Complaint rate on health claims
- Content correction turnaround time
- Consent withdrawal and deletion success rate

### 13.4 Brand Metrics

- "Feels trustworthy" score
- "Feels Indian and relatable" score
- "Feels simple" score
- "Does not feel like a scary medical app" score
- "Gave me something genuinely useful" score *(new — measures clinical utility)*
- App-store review themes

---

## 14. Implementation Roadmap

| Phase | Title & Duration | Key Deliverables |
|---|---|---|
| **Phase 1** | Direction & Safety Foundation — 2 weeks | Approve positioning. Freeze risky language. Create evidence taxonomy. Audit existing content. Define red-flag rules. Draft first wireframes. |
| **Phase 2** | UI/UX Revamp Prototype — 3–4 weeks | New visual system. Clickable prototype. Revised onboarding. Language and low-data personalisation. User testing (8–12 participants). |
| **Phase 3** | Content & Compliance System — 4 weeks | Content card template. Review top 50 topics. Evidence labels and contraindications. Advertising claim checklist. DPDP-aligned consent copy. Reviewer workflow. |
| **Phase 4** | Product Implementation — 6–8 weeks | New navigation. Redesigned Home and Ask Arovia. Routine library. Safety labels and escalation logic. Practitioner profiles. Updated app-store copy. |
| **Phase 5** | Launch & Measurement — 2 weeks | Soft launch. Track activation, routine creation, escalations, complaints. Comprehension testing. Compliance review before wider launch. |

---

## 15. First Content Pilot

### 15.1 Low-Risk Wellness Topics (20)

Hydration during summer · Better sleep routine · Screen-break routine · Gentle breathing for stress · Simple walking plan · Light food during indigestion · Oral rehydration basics · Menstrual comfort habits · Hair oiling safety · Dry skin care routine · Eye strain and screen time · Posture basics for desk workers · Healthy morning routine · Reducing processed sugar intake · Evening wind-down routine · Mindful eating basics · Safe sun exposure · Basic hand hygiene reminders · Managing mild seasonal allergies · Safe stretching for back discomfort

### 15.2 Traditional Practice Topics (10)

- Tulsi tea comfort use *(evidence label: Traditional practice)*
- Ginger for digestive comfort *(evidence label: Emerging evidence)*
- Turmeric in food vs supplement caution *(evidence label: Emerging / caution for supplements)*
- Steam inhalation comfort and burn safety
- Ajwain water traditional use
- Curd and rice for stomach upset
- Seasonal food habits
- Yoga nidra for relaxation
- Pranayama safety
- Homeopathy as traditional pattern-based care with honest evidence review

### 15.3 Escalation-Only Topics (10)

These topics must never receive home-care content — only immediate escalation guidance:

Chest pain · Severe breathing difficulty · Stroke-like symptoms · Severe allergic reaction · Infant high fever · Pregnancy bleeding · Severe dehydration · Suicidal ideation · Severe abdominal pain · Blood in vomit or stool

---

## 16. Team Decisions Required

| # | Area | Detail |
|---|---|---|
| 1 | Product scope | Will Arovia remain a medical workflow product with a wellness layer, or become wellness-first with medical escalation? (Recommendation: wellness-first) |
| 2 | Practitioner types | Which systems of practice will be supported, and what is the credential verification process? |
| 3 | Evidence vocabulary | Which final evidence label terms will be used — and who approves the classification of each topic? |
| 4 | Language rollout | Which languages in Phase 1? (At minimum: Hindi, English, one South Indian language) |
| 5 | Content gating | Which existing content must be removed, rewritten, or gated before repositioning launch? |
| 6 | Claims approval | Who signs off on health claims in marketing before publication? |
| 7 | Consent architecture | What is the minimum compliant consent and deletion flow for health data under DPDP? |
| 8 | Clinical review body | Who constitutes the clinical review panel for content, and how are conflicts of interest managed? |

---

## 17. Recommended Decision

> **Proceed with wellness-first repositioning.** Arovia should become a culturally Indian, preventive wellness companion with evidence-labelled traditional guidance, a clear clinical utility model, and safe practitioner escalation. This reduces treatment-claim risk, widens the addressable audience beyond homeopathy users, and creates a genuinely useful product — not merely a compliant one.

The most important product change is the mental model: stop being *"tell me your disease and I will suggest a remedy"* and start being *"tell me what is going on and I will help you understand it, manage what you safely can, and reach the right person for what you cannot."*

That mental model is not a workaround. It is a genuinely better product — more useful, more trustworthy, and more sustainable than any attempt to approximate diagnosis within the wellness category.

---

## 18. Source References

- [WHO & Ministry of AYUSH Agreement, 2023](https://www.who.int/news/item/17-11-2023-new-who-and-ministry-of-ayush--republic-of-india-agreement-signed-to-advance-traditional--complementary--and-integrative-medicine)
- [WHO Global Centre for Traditional Medicine in India, 2022](https://www.who.int/news/item/25-03-2022-who-establishes-the-global-centre-for-traditional-medicine-in-india)
- [Ministry of Ayush: AYUSH Knowledge](https://arp.ayush.gov.in/ayushknowledge)
- [Ministry of Ayush: Ayush Suraksha](https://suraksha.ayush.gov.in/about)
- [ASCI Code Guidelines](https://www.ascionline.in/the-asci-code-guidelines/)
- [PIB: CCPA Misleading Advertisement Guidelines, 2022](https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=1832906&lang=1&reg=3)
- [Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954](https://www.indiacode.nic.in/bitstream/123456789/6801/1/drug_and_magic_remedies.pdf)
- [Digital Personal Data Protection Act, 2023](https://www.meity.gov.in/static/uploads/2024/02/Digital-Personal-Data-Protection-Act-2023.pdf)
- [Telemedicine Practice Guidelines](https://www.nrces.in/standards/telemedicine-practice-guidelines)
