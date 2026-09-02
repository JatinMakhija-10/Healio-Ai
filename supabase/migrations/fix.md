# Arovia Ledger-Style Dashboard Redesign

That template look is a real, nameable pattern: white `rounded-2xl` cards on cream, a soft shadow, one Lucide icon assigned to every single row, a purple "premium" tint, mint-green checkmark chips, and a sparkle icon standing in for "AI/premium." It's the default output of pretty much every AI design tool right now — so it's not that anything here is wrong, it's that none of it is *specific* to Arovia.

## Why It Reads Generic

* **Icon-per-row is decoration, not information.** A heart, a pulse line, two people, a document — assigned essentially at random to keep the grid visually busy. None of them actually help someone scan the list faster.
* **The sparkle icon is the biggest tell.** It's shorthand for "AI feature" in literally thousands of dashboards right now — it signals nothing about your product.
* **Purple-for-premium + mint-for-included** are the two most overused semantic colors in SaaS onboarding right now.
* **Every card has the same shadow and radius**, so nothing has hierarchy — the credit-cost list, the usage stats, and the plan features all look like the same component reused three times.

## A Direction That's Actually Yours

Arovia's real subject matter is an apothecary/dispensary — dosing, measurement, a price list of remedies. That's a much more specific well to draw from than generic SaaS chrome:

* **Palette** — stone `#EDE8DD`, ink `#2A2924`, leaf `#3E5641` (primary), marigold `#C68A2E` (the *only* accent, used for credit values), hairline `#C9C2B2`. No purple, no mint.
* **Type** — a serif (Fraunces or Lora) only for small eyebrow labels; a humanist sans (Public Sans / Work Sans) for body copy; a monospace (IBM Plex Mono) for every number — dosage precision, not a UI convention.
* **Layout** — the credit list becomes a dispensary price list with dotted leader lines instead of icon cards. The three stat cards become one hairline-divided strip instead of three separate boxes. The features list becomes a plain checked ledger, no chip backgrounds, no header icon.
* **Signature** — the dotted leader-line ledger rule, reused everywhere, is the one memorable device. No sparkles, no per-item icons anywhere.

## Full Implementation Prompt

```text
Redesign three dashboard components for Arovia, an AI Ayurvedic health
consultation app. Move away from the generic "AI SaaS dashboard" look —
no icon-per-row, no colored chip backgrounds, no sparkle/star icons, no
purple-tinted premium cards, no soft drop shadows on white rounded cards.

CONCEPT: treat these as an apothecary/dispensary ledger — the visual
language of a dispensary price list and dosage measurement, not a tech
dashboard.

COLOR (use exactly these, no purple, no mint-green, no gradients):
- paper / card background: #EDE8DD
- ink / primary text: #2A2924
- leaf (primary structural color, borders/rules): #3E5641
- marigold (single accent — reserve for currency/credit values ONLY): #C68A2E
- hairline (dividers, dotted leaders): #C9C2B2

TYPE:
- Eyebrow labels / small section titles: Fraunces, small size, letter-
  spacing 0.02em, sentence case (not uppercase-bold)
- Body copy: Public Sans or Work Sans
- ALL numbers (credit costs, usage counts, credit balance): monospace,
  IBM Plex Mono or similar — ties to "precise dosage/measurement"

COMPONENT 1 — Premium feature credit costs:
Replace the icon-card grid with a single ledger list. Each row: feature
name left-aligned, a dotted leader line (border-bottom: dotted,
hairline color) filling the gap, cost right-aligned in mono numerals.
No icons. No card-within-card backgrounds per row — just rows separated
by the dotted leader.

COMPONENT 2 — Usage stats (Monthly usage / Today / Credits):
Replace the three separate boxed cards with ONE bordered strip, divided
internally by thin vertical hairlines (not gaps + separate shadows).
Each section: small sentence-case label, big mono number, muted caption
below. Only the credits number gets the marigold accent color — every
other number stays ink color. No icons on any of the three.

COMPONENT 3 — Plan features checklist:
Replace the mint-green pill chips and sparkle header icon with a plain
two-column list. Each row: a simple check mark in leaf-green ink
(typographic, not a colored icon badge) + the feature text. Rows
separated by hairline top-borders, no chip backgrounds. Section header
is plain sentence-case text, no icon.

GENERAL RULES:
- No icons anywhere in these three components except the plain checkmark
  in component 3.
- No drop shadows. Borders are hairline (0.5–1px) in the hairline color,
  not soft box-shadows.
- Border radius: small and consistent (6–8px), not the heavy rounded-2xl
  card look.
- Keep contrast accessible (WCAG AA) for ink-on-paper and marigold-on-
  paper text.
- Responsive down to mobile: the stats strip should stack vertically
  with horizontal hairlines instead of vertical ones below ~480px.
- Respect prefers-reduced-motion; keep any hover states subtle (border
  color shift only, no scale/shadow animation).
```

## Consistency Note

This direction only makes sense if it's applied consistently across the rest of the app too. If these three components go ledger-style but the surrounding nav/buttons stay in the current rounded-purple style, it'll look like two different apps stitched together.

Use this prompt as the basis for a broader style pass, not just these three cards.
