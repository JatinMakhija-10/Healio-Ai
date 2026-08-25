# Arovia.AI Credit System — Review & Redesign

## 1. What's working well

- **Ledger-backed, not just a counter.** `credit_transactions` records `balance_after` on every row, giving a real audit trail.
- **Server-side cost computation.** `healio_credit_cost(action, plan)` runs in the database, so a client can't spoof its own discount.
- **Lazy regeneration.** Computing the daily grant on request (instead of a cron job) avoids scheduler infrastructure for a fairly simple recurring credit.
- **UPI top-up packs with volume bonuses.** A sensible monetization layer for the Indian market, decoupled from subscriptions.

## 2. Where it's fragile

| # | Issue | Why it matters |
|---|---|---|
| 1 | "Atomic" isn't confirmed | If the balance check and deduction are separate statements rather than one conditional `UPDATE`, concurrent requests (double-tap, two tabs) can both pass the check and both deduct — balance can go negative. |
| 2 | Deduct-then-call, no refund path | Credits are taken *before* the AI call runs. If the call times out or errors, there's no visible compensating transaction — the user is charged for nothing. |
| 3 | Flat costs ignore token data you already collect | `llm_requests.token_count` is tracked but doesn't feed pricing. A 2-page and a 200-page `deep_document_analysis` cost the same 20 credits, so light users overpay and heavy users are subsidized — on exactly the actions most likely to have runaway compute cost. |
| 4 | Four overlapping rate limits on Free tier | Monthly cap (15), daily cap (4/day), 60s cooldown, and the credit balance/regen system all gate the same tier at once. A blocked user can't tell which limit they hit, and you're maintaining four mechanisms doing one job. |
| 5 | Fractional credits (0.5) | NUMERIC(10,2) avoids float rounding, but "0.5 credits" is an odd unit to show a user. A finer integer unit (1 credit = 10 points) avoids this. |
| 6 | Pro tier's "unlimited, zero-cost" is uniform across compute and human resources | `video_consult` and `priority_booking` consume a doctor's real calendar time, not just AI compute. Treating them identically to `standard_chat` under "unlimited" is a real operational cost exposure. |
| 7 | No idempotency key on `/api/credits/consume` | A retried request (network blip, client retry) has no dedup mechanism and can double-charge. |
| 8 | Health-specific risk | Cutting a user off mid-symptom-description because they hit a credit wall is a worse failure mode here than in a generic chatbot. Baseline safety Q&A probably shouldn't be credit-gated at all. |

## 3. Proposed redesign

### 3.1 Reserve → capture / release flow

Replace the single deduct-then-call step with a two-phase transaction:

1. **Action requested** — user taps a paid feature.
2. **Reserve credit hold** — draw from the subscription bucket first, then purchased top-ups. Implemented as one conditional `UPDATE ... SET balance = balance - cost WHERE balance >= cost RETURNING ...`, which is race-safe without explicit row locks.
3. **Call AI service** — the actual LLM request; tokens are metered.
4. **Outcome:**
   - **Success → Capture.** Finalize the deduction, optionally adjusting the charge against actual `llm_requests.token_count` rather than trusting the flat estimate.
   - **Failure → Release.** Restore the hold in full; the user is never charged for a response they didn't get.

This directly fixes issues #1, #2, and #3 above.

### 3.2 Split the balance into two buckets

Maintain `subscription_credits` (monthly grant + daily regen, use-it-or-lose-it) and `purchased_credits` (top-up packs, long expiry) instead of one fungible `credits_balance`. Consume subscription credits first, purchased second. This removes the current ambiguity around whether a top-up pack purchase can even push a balance past the daily-regen cap, or gets silently clobbered by the next regen run.

### 3.3 Move the cost matrix into a config table

```
credit_action_costs(action, tier, base_cost, per_1k_tokens, effective_from)
```

Instead of hardcoding costs inside the PL/pgSQL function, store them in a table. This lets you A/B test pricing or run a promo without a migration, and keeps a historical record of what a past transaction was actually charged under — important for audit/support disputes.

### 3.4 Add idempotency keys

Client generates a UUID per consume attempt; the server dedupes on it. Fixes #7 — retried requests can't double-charge.

### 3.5 Separate spam prevention from monetization

Move the 60-second cooldown out of the credit ledger and into an API/gateway-level rate limiter (e.g. Redis-based), since it's really an anti-abuse control, not a budget control. This alone removes one of the four overlapping Free-tier limits (#4).

### 3.6 Carve out a no-cost safety tier

Define a small set of actions (basic symptom-triage responses, red-flag/urgent-care guidance) that bypass credit checks entirely, or return a lightweight fallback response even at zero balance. Reserve credit-gating for premium features (PDF export, deep document analysis, specialist opinion) rather than baseline safety-relevant Q&A.

## 4. Suggested next steps

- Confirm (or fix) whether `consume_arovia_credits` uses a single conditional `UPDATE` or separate read/write steps.
- Draft `reserve_credits`, `capture_credits`, and `release_credits` function signatures.
- Write the migration for the subscription/purchased bucket split.
- Decide the no-cost safety-tier action list with clinical/product input.