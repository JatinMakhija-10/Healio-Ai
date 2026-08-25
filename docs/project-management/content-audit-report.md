# Arovia Content Audit Report
**Phase 1 Deliverable — Plan ref: Part III Phase 1 / Part IV §4.9**
**Date:** May 24, 2026  
**Scope:** `src/lib/ayurveda/`, `src/lib/diagnosis/`, all user-facing dashboard and app copy

---

## Summary

No high-severity cure/treatment claims found in user-facing strings.  
Two medium-severity positioning flags require team decision before repositioning launch.  
Ayurveda library risks are internal code comments only — not user-visible.

---

## Scan Methodology

Searched all `.ts` / `.tsx` files under `src/` for:
- Cure claims: `cure`, `heals`, `treats`, `remedy`, `guarantees`
- Diagnosis framing: `diagnose`, `diagnosis engine`, `symptom checker`, `AI doctor`
- Unsafe safety language: `no side effect`, `prevents disease`, `100%`
- Banned phrases (plan §9.1): `AI vaidya`, `doctor at home`, `clinically proven`, `best medicine`

---

## Findings

### ✅ PASS — No Action Required

| File | Finding | Risk Level |
|---|---|---|
| `src/app/onboarding/page.tsx` | Disclaimer present: "not a licensed medical practitioner… does not constitute medical advice, diagnosis, or treatment" | Low |
| `src/app/medical-disclaimer/page.tsx` | "The AI is a machine, not a doctor. It cannot make clinical diagnoses, prescribe medication, or order tests." | Low |
| `src/app/terms/page.tsx` | Explicitly prohibits using app to independently diagnose or treat | Low |
| `src/lib/ayurveda/agni/agniAssessment.ts` | "ALL disease begins with impaired Agni" — classical Ayurvedic quote in a code comment; not user-visible | Internal only |
| `src/lib/ayurveda/types.ts` | "MORE IMPORTANT than doshas for treatment" — in a JSDoc comment; not user-visible | Internal only |
| `src/lib/ayurveda/prakriti/prakritiEngine.ts` | "Consider in-person pulse diagnosis" — in limitations array returned to UI but framed as a recommendation to seek expert care | Acceptable |

---

### 🚩 FLAG — Requires Team Decision Before Launch

#### Flag 1 — `src/app/doctor/signup/page.tsx:208`

```
"Looking to get diagnosed?"
```

**Risk:** Implies Arovia is a diagnosis platform. Directly conflicts with the repositioning mental model ("wellness navigation, not diagnosis").

**Plan reference:** Part II §2.1 — "Arovia IS NOT a diagnostic platform — it does not identify disease in a user."

**Options:**
1. Change to "Looking for wellness guidance?" or "Want to understand your health concerns?"
2. Remove the line entirely — it's a secondary prompt below the doctor sign-up CTA
3. Keep as-is and scope the fix to Phase 4 (landing/copy rewrite)

**Decision required from:** Product lead + Medical Reviewer

---

#### Flag 2 — `src/app/page.tsx:38`

```
"A clinical-grade assistant to help you make sense of your symptoms before seeing a doctor."
```

**Risk:** "clinical-grade" implies medical/clinical positioning. "symptoms before seeing a doctor" frames Arovia as a pre-consultation diagnosis tool rather than a daily wellness companion.

**Plan reference:** Part II §4.2 — old emphasis: "AI can answer health questions" → new emphasis: "AI helps you understand and act safely."

**Suggested replacement (for team approval):**
> "Everyday wellness guidance for Indian families — calm, safe, and culturally familiar."

**Decision required from:** Product lead + Brand lead

---

## Ayurveda Library — Evidence Label Gaps

The `src/lib/ayurveda/` modules currently output therapeutic recommendations (diet, herbs, lifestyle) without evidence labels. Per the plan (Part II §Product Principles #3), every recommendation must carry one of the 5 evidence label types.

**Action required (Phase 3):** Audit the `AgniAssessment.recommendations` and `TherapeuticPlan` output structures and tag each recommendation category with an appropriate `EvidenceLabelKey` from `src/lib/wellness/evidenceLabels.ts`.

This is **not a Phase 1 blocker** — the label system is now implemented and ready for integration.

---

## Next Steps

| Priority | Action | Owner | Phase |
|---|---|---|---|
| High | Resolve Flag 1 (doctor signup copy) | Product lead | Phase 1 or 4 |
| High | Resolve Flag 2 (landing page hero copy) | Brand lead + Product | Phase 2 |
| Medium | Tag Ayurveda library outputs with evidence labels | Engineering | Phase 3 |
| Low | Internal code comments (classical quotes) — no action needed | — | — |
