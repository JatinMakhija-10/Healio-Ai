# Arovia.AI — Product & UX Audit

*Method note: the standard benchmark set (Linear, Stripe, Apple) is built for productivity-tool comparisons. Arovia's actual competitive set is Ada Health, Practo/Tata 1mg, and WebMD — the products that already own trust in AI-mediated health guidance. Benchmarking against them produces sharper, more actionable findings than forcing a fit with tools that don't share Arovia's job-to-be-done. Where a screenshot can't answer a question (live performance, code quality, mobile rendering), I've said so rather than guessed.*

---

## A. Executive Summary

Arovia.AI has a genuinely sharp, differentiated position — culturally fluent (Hindi/Hinglish), family-oriented, Ayurveda-and-homeopathy-aware health guidance with visible doctor-escalation logic — and the visual craft is close to premium-SaaS quality already. But the product currently contradicts its own medical disclaimer in its own marketing and UI copy (a "sample diagnosis" CTA and a "Diagnosis" table column, next to a footer stating it provides no diagnosis), and its pricing model is internally inconsistent ("unlimited consultations" sitting beside a credit-cost table that charges per consultation). Fix the diagnostic-language contradiction and the credits/pricing confusion before scaling distribution — both are the kind of issue that erodes trust fastest in a health product, and both are same-day fixes.

---

## B. Top 10 Critical Issues

1. **"Sample diagnosis" CTA vs. "does not provide medical diagnosis" footer.** → Violates Nielsen's *Consistency & Standards* heuristic and creates a direct legal/trust contradiction. → Users (and regulators) see the product claim two incompatible things about itself in the same session. → Rename the CTA to "See a sample consultation" and audit all copy for the word "diagnosis."

2. **"Diagnosis" column header in Recent Sessions / History**, sitting above hedged outputs like "Likely fever pattern." → Breaks the same consistency principle as #1, and undermines the careful hedging the AI itself is doing. → A user (or a lawyer) reads "Diagnosis: Likely adjustment disorder pattern" as a clinical claim. → Rename the column to "Assessment Summary" or "Possible Pattern" everywhere, matching the hedged phrasing already used inside the cards.

3. **Cookie consent modal overlaps and truncates page content** (the "No guessing" and "Doctor escalation" cards are cut off behind it on first load). → Violates *visibility of system status* and basic layout hygiene — users can't read what they're consenting to view. → First-impression damage at the exact 50ms window that decides trust (Aesthetic-Usability Effect working against you). → Move consent to a slim, non-covering bottom bar; never let a modal obscure content it hasn't been dismissed from.

4. **No visible "Reject" or "Manage preferences" option in the cookie modal**, only "Accept." → This is a consent dark pattern under most modern privacy frameworks, and directly undercuts the footer's own claim of "DPDP Act 2023 aligned consent language." → Legal exposure plus a credibility gap the moment a privacy-literate user (like the Bengaluru testimonial you're citing) notices it. → Add equal-weight "Reject non-essential" and "Manage" actions.

5. **Hero illustration uses generic skeleton/placeholder bars** (gray and black rectangle "text lines" instead of a real chat screenshot) as the first visual a visitor sees. → Violates the *First Impression / Premium Sensation* pillar directly — it reads as an unfinished wireframe, not a $1B product. → Reduces "information scent" (a visitor can't actually preview what the product does) and weakens the Aesthetic-Usability halo before the value prop even lands. → Replace with a real, redacted screenshot of the actual chat flow you already built (the fever-consultation exchange is genuinely good — show it).

6. **Confidence and severity are visually fused into one signal** ("mild" tag sitting next to "Moderate confidence" on entries like adjustment-disorder or psoriasis patterns). → Violates *Recognition over Recall* / mental-model clarity — users will read "moderate confidence + mild" as "probably nothing," when confidence describes the *model's* certainty, not the *condition's* seriousness. → A genuinely risky symptom pattern could be under-escalated in the user's mind because of a UI label collision. → Separate the two into clearly distinct, separately-explained badges with an info icon.

7. **Plan & Credits page is self-contradictory**: "12/∞ · Unlimited consultations" sits directly beside a Credit Costs table charging "AI Consultation – 1 credit." → Violates *match between system and real world* — a user cannot form a correct mental model of what they're paying for. → Direct CRO harm: confusing pricing is one of the highest-leverage causes of trial abandonment and support tickets. → State the actual model in one sentence ("Unlimited basic chat; premium features use credits") directly under the plan name.

8. **"PDF Medical Report" as a paid feature name**, generated by an AI tool whose own disclaimer says it provides no diagnosis or prescriptions. → Same consistency violation as #1/#2, but now attached to a *document users may show a real doctor or insurer*. → This is the single highest-liability item in the whole product. → Rename to "PDF Wellness Summary" and have legal confirm the disclaimer language covers this artifact explicitly.

9. **App chrome (sidebar labels, table headers, page titles) is English-only**, while the brand's own testimonials (Meera P., Ahmedabad: *"Large buttons and simple language made it easy for my father to use"*) explicitly sell elder-friendly, low-literacy accessibility. → Violates the product's own stated inclusive-design promise — the chatbot code-switches into Hindi/Hinglish, but "Dashboard," "History," "Plan & Credits" never do. → The demographic you're proudest of serving least benefits from the current UI. → Localize the chrome, not just the chatbot's replies.

10. **Icon-only controls with no text label** (lock icon on history entries, refresh icon on Daily Tip, mic icon in chat) with no visible tooltip or aria-label evidence. → Violates *Recognition over Recall* and WCAG 2.2 label requirements, and again cuts against the elder/low-literacy positioning. → Ambiguous affordances (what does tapping the lock actually do?) create hesitation exactly where you want confident action. → Add short text labels or persistent tooltips on every icon-only control in the primary flows.

---

## C. Detailed Pillar-by-Pillar Audit

**1. First Impression & Premium Sensation — 6.5/10**
Clean type, generous whitespace, and a confident headline get you most of the way to "trustworthy" in the first second. The skeleton-bar hero illustration (#5 above) and the overlapping cookie modal cost you the rest. *Fix:* real screenshot in the hero; non-blocking consent.

**2. Visual Design & Craft — 7.5/10**
Consistent 8/12pt-feeling spacing, a restrained cream/teal/navy palette, rounded pill buttons used consistently across CTAs and badges, legible type hierarchy. This is the strongest pillar in the whole product — genuinely close to category-leading. Minor deduction: light-gray body copy on the cream background (testimonial captions, some card subtext) should be checked against 4.5:1 contrast — it looks borderline in several cards.

**3. UX Heuristics & Usability — 6/10**
Good: quick-reply chips ("Today," "1–3 days"...) reduce free-text ambiguity in the symptom-duration step — smart, mobile-friendly, reduces error. Bad: the modal overlap (#3), the icon-only affordances (#10), and the contradictory pricing copy (#7) all violate basic heuristics in ways a first-time user will hit within their first two minutes.

**4. User Psychology Deep-Dive — 6/10**
Trust breaks at the "diagnosis" wording contradiction and the confidence/severity fusion (#1, #2, #6) — exactly the moments where a worried parent needs maximum clarity, not ambiguity. Trust builds well elsewhere: the "I use source-backed scoring, not assumptions" line in the chat is a genuinely well-placed reassurance exactly when a user might doubt the AI. Commitment increases nicely via the Health Persona banner — but the payoff (a genuinely personalized Daily Tip) isn't visibly demonstrated; the tip shown ("Natural Sleep Signals") reads generic despite the "personalised to you" claim sitting right above it, which is a credibility gap between promise and proof.

**5. Conversion Optimization (CRO) — 6/10**
Value prop is clear in under 5 seconds — genuine strength. CTA hierarchy is clean (one primary, one secondary). Missing: a quantified trust stat near the hero CTA (e.g., "X,000 families" — currently only 3 testimonials with no aggregate number), and the "sample diagnosis" wording actively works against conversion trust rather than for it.

**6. Frontend Engineering Excellence — not verifiable from screenshots.**
What I can infer: consistent component reuse (cards, badges, buttons look token-driven, which is good practice). What needs direct verification rather than guessing: Core Web Vitals, semantic landmark structure, keyboard navigation, and font-loading strategy. Given the elder/low-literacy/mobile-first target market, treat mobile performance and INP as launch-blocking checks, not nice-to-haves.

**7. Design System Scale — 7/10**
Cards, pills, badges, and the icon-tile pattern (rounded square, colored icon) repeat consistently across dashboard, history, learn, and plan pages — a real design-token discipline is visible even without seeing the code. Dark-mode variant not shown/unknown.

**8. Product Strategy & Positioning — 7.5/10**
The India-aware, Ayurveda-plus-homeopathy-plus-doctor-escalation niche is genuinely differentiated against both Western symptom checkers (Ada, WebMD) and generic Indian health platforms (Practo). Watch for scope creep: labeling an output "Likely adjustment disorder pattern" pulls the product into mental-health assessment territory, which is a materially different risk class than "monsoon fever" home-remedy guidance and probably deserves its own, more conservative track (see Redesign Blueprint).

**9. Competitive Benchmarking — see Section D table.**

**10. Copywriting & Microcopy — 6/10**
Strong: "Bring traditional care, prevention, and safety boundaries into one view" and "Structured reasoning keeps advice grounded instead of random" are precise, benefit-driven, and well-targeted at the actual anxiety (dadi's remedy vs. doctor). Weak: the diagnosis-language contradiction is a precision failure that undercuts otherwise good writing.

**11. Accessibility (WCAG 2.2 AA & Beyond) — 5/10**
Icon-only controls without labels, English-only chrome despite an elder-friendly promise, and unverified contrast on secondary text are the three concrete gaps visible here. Given your own testimonial explicitly cites an elderly user, this pillar should be a priority fix, not a backlog item.

**12. Growth & Retention Engineering — 5.5/10**
Daily Tip and consultation history are reasonable retention hooks. Missing: no visible referral or family-invite loop, even though a "Family Consult" credit-priced feature already exists — that's a built-in viral loop sitting unused. No visible notification/reminder system shown in these screens.

**13. AI-Product UX — 6.5/10**
Genuinely good: typing indicator, quick-reply chips for structured data (duration), and exposing a confidence label at all (most consumer AI tools hide this) is ahead of category norms. Needs work: confidence and severity are visually conflated (#6), and there's no visible way to inspect *which* of the "100+ curated sources" backed a specific answer — the marketing page promises source-backed reasoning, the product doesn't yet show its work.

**14. Premium Polish & Delight — 6/10**
The skeleton-bar hero art (#5) is the single biggest miss here — it's the one place "premium polish" is being directly contradicted by a placeholder. Elsewhere, the chat's typing dots and card micro-treatment are fine but not distinctive.

---

## D. Competitive Comparison Table

| Dimension | Arovia.AI | Ada Health | Practo / Tata 1mg | Winner & Why |
|---|---|---|---|---|
| Cultural/language localization | Hindi/Hinglish chat, India-specific remedies | English-first, globally generic | Multi-language, India-first, but chat is not the core product | **Arovia** — the Hinglish conversational layer is a real, defensible differentiator |
| Diagnostic-language discipline | "Diagnosis" label + "sample diagnosis" CTA *despite* a no-diagnosis disclaimer | Consistently says "possible conditions," never "diagnosis" | Frames everything as "consult a doctor," avoids diagnostic claims | **Ada** — most legally disciplined language; Arovia should copy this exactly |
| Confidence transparency | Shows "Moderate confidence" / "Good match" (but conflated with severity) | Shows likelihood with plain-language explanation, kept separate from urgency | Rarely exposes model confidence at all | **Ada** — same instinct as Arovia, cleaner execution |
| Pricing clarity | Hybrid subscription + credits, with contradictory "unlimited" copy | Free | Pay-per-consult, unambiguous | **Practo** — a user always knows what they're paying for |
| Traditional-medicine integration | Ayurveda + homeopathy woven into the reasoning with safety caveats | None (pure biomedical) | Some Ayurveda content sections, but not integrated into the AI chat | **Arovia** — unique position; needs stronger "evidence label" framing (which the Learn page already does well) to earn it |
| Family/multi-profile support | "Family Consult" feature exists but no visible invite/growth loop | No | Multiple patient profiles supported | **Tie** — Arovia has the pricing SKU already; needs the actual feature surfaced |

---

## E. Redesign Blueprint — Three Highest-Priority Screens

### 1. Landing Hero + Cookie Consent
**What changes:** Replace the skeleton-bar hero illustration with a real (redacted-if-needed) screenshot of the fever-consultation exchange — it's a genuinely strong artifact, use it as proof, not an abstraction. Move cookie consent from a content-covering modal to a slim bottom sheet (~72–88px) with three equal-weight actions: *Accept all / Reject non-essential / Manage*. Rename "See a sample diagnosis" → "See a sample consultation."
**Why:** Closes the #3, #4, and #5 issues in one pass, and turns the hero from "trust me" into "look, here's exactly what happens."
**Layout notes:** Bottom sheet should never occlude primary content; use `position: fixed; bottom: 0` with a max-height and its own scroll if needed, never an intercepting overlay on first paint.
**Dev notes:** Semantic `<dialog>` or a properly `aria-live`-announced region for the consent sheet; store the reject/accept choice per the "stored locally on this device" copy you already have in the footer.

### 2. Dashboard / History — Diagnosis Labeling & Confidence/Severity Split
**What changes:** Rename "Diagnosis" column → "Assessment Summary." Split the current single badge cluster into two clearly labeled, separately-styled indicators: **Match confidence** (High/Moderate/Low — "how sure the model is this pattern fits") and **Reported severity** (Mild/Moderate/Severe — "based on what you told us"), each with a one-tap info explainer. Route any mental-health-adjacent pattern (e.g., "adjustment disorder") into a distinct visual track with mandatory professional-referral copy and no self-administered remedy suggestions.
**Why:** Directly resolves #2 and #6 — the two issues most likely to cause either a false-reassurance or a liability incident.
**Layout notes:** Two small pill badges side by side, each a different shape or icon family (confidence = filled dot scale; severity = outlined tag), so they're not visually interchangeable at a glance.

### 3. Plan & Credits
**What changes:** One sentence directly beneath "Arovia Plus · ACTIVE": *"Unlimited basic chat consultations. Premium features (Wellness Snapshot, Family Consult, PDF Summary) use your monthly credits."* Rename "PDF Medical Report" → "PDF Wellness Summary."
**Why:** Resolves #7 and #8 — both are trust-and-liability issues, not just cosmetic ones.
**Dev notes:** This is copy-only; no layout change required, which makes it a same-day fix.

---

## F. Quick Wins & Long-Term Vision

**Quick wins (< 1 day each):**
- Remove "diagnosis" from the CTA and rename the History/Dashboard column (find-and-replace scale change).
- Add "Reject" / "Manage" to the cookie modal.
- Add one clarifying sentence to the Plan & Credits page reconciling "unlimited" vs. credits.
- Add text labels to icon-only controls (lock, refresh, mic).
- Reconcile "PDF Medical Report" naming with the medical disclaimer.

**Strategic long-term vision (6–12 months):**
- Full localization of app chrome (not just chatbot replies) to actually deliver on the elder/low-literacy promise your own testimonials are built on.
- A distinct, more conservative pathway for mental-health-adjacent presentations, ideally with a licensed-counselor handoff partnership rather than home-remedy framing.
- Surface *which* curated source backed a specific answer — you already claim "100+ curated articles, books, and medically reviewed source notes" on the marketing page; make that visible per-answer to deepen the "Trust without assumptions" promise you're already selling.
- Build the family-invite growth loop the "Family Consult" SKU already implies but doesn't yet expose.
- A formal legal review of diagnostic-adjacent language and the PDF report artifact against India's telemedicine and DPDP guidance before wider distribution.

---

## G. Holistic Scorecard (0–10, anchored against Ada Health / Practo / WebMD)

| Dimension | Score |
|---|---|
| Visual Design | 7.5 |
| UX & Usability | 6.0 |
| Accessibility | 5.0 |
| Conversion Potential | 6.0 |
| Performance | Not assessable from screenshots |
| Brand Trust & Emotion | 6.0 |
| Information Architecture | 7.0 |
| Typography & Spacing | 7.5 |
| Mobile Experience | Not assessable from screenshots |
| Copywriting Precision | 6.0 |
| Frontend Quality | Not assessable from screenshots |
| Innovation & Differentiation | 7.5 |
| Retention Potential | 5.5 |
| **Overall Product Quality** | **6.4** |

---

## Final Rating: 6.4 / 10

A culturally sharp, visually confident product that is currently contradicting its own medical disclaimer in its own marketing copy — fix the "diagnosis" language and the credits/pricing confusion first; both are same-day fixes, and both are the kind of inconsistency that costs a health product its most valuable asset, which is trust, faster than almost anything else on this list.
