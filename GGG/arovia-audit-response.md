# Arovia.AI — Audit Response & Hardened Design

> **Response to**: Arovia.AI audit brief + prior audit documents (personalization/memory pipeline, gender-gating root-cause analysis)
> **Date**: August 2, 2026
> **Scope**: Reproductive-risk gating bug, RAG content safety, a right-sized priority list, and current regulatory framing

## Scope and caveats

I don't have the actual Arovia.AI repo — just what's quoted and described across the audit brief and the two prior audit documents. So the specific line numbers, file paths, and code snippets referenced below should be treated as reported by whatever produced those documents, not independently verified.

One thing worth flagging about that source material itself: the 45% / 30% / 15% / 10% root-cause breakdown in the audit doc is presented with a precision that implies it was measured (log analysis, incident counts) rather than estimated. If it's actually a judgment call dressed up as data, that's worth knowing — it's exactly the kind of unsupported claim a rigorous audit is supposed to catch, including from itself.

This document also doesn't attempt the literal 750 test cases, or the Top 100 / Top 100 lists, that the original audit brief asked for. Hand-writing that many discrete items with no code to run them against would mostly produce generic filler and bury the few things that actually matter. Instead: a harder look at the two existing audits, a full redesign of the one bug that's concretely specified, a second issue ranked at least as serious, a realistically-sized priority list, and what it would take to do the rest for real.

## The pregnancy question is a symptom, not the disease

Both prior audits converge on the same three root causes, and they're basically right: bundled question strings, a client-payload fallback to `{}` that silently erases demographic context, and unconditional safety instructions in the system prompt. But there's a design flaw underneath all three, and the proposed fix — gate on `gender === 'male'` — has a failure mode of its own worth catching before shipping it.

That gate treats gender identity as a proxy for reproductive risk. A trans man or non-binary patient with a uterus and ovaries is exactly the population this symptom (lower abdominal pain, possible ectopic pregnancy) is most dangerous for — a hard `gender==male` block would silently suppress the question for some of them too, with no error and no log entry. Missing an ectopic pregnancy is a bleed-to-death emergency, so a false negative here is worse than the false positive already caught. The result would be fixing the embarrassing bug while keeping the dangerous one.

The real fix separates two fields that got conflated: gender identity (self-described, relevant to tone) and reproductive risk (a clinical fact — uterus/ovaries, age, surgical and menopausal history — independent of identity). Derive the risk flag from actual clinical facts, default to *asking* when it's unknown, and gate every downstream check on that flag instead of on gender.

### Corrected pipeline

```
Patient profile (age + reproductive anatomy status)
        |
        v
Reproductive-risk deriver --> possible / not_possible / unknown
        |
        v
Question composer --> filters atomic red-flag checks
        |
        v
LLM inference --> response built from the filtered prompt
        |
        v
Output validator --> checks response against the same flag
        |
        +-- pass --> sent to patient
        +-- fail --> regenerated with a correction
```

### Deriving the flag

```typescript
type ReproductivePotential = 'possible' | 'not_possible' | 'unknown';

interface ReproductiveInputs {
  age?: number;
  hasUterusOvaries?: boolean | null;   // explicit, optional, collected once
  hysterectomyOrOophorectomy?: boolean;
  postMenopausal?: boolean;
}

function deriveReproductivePotential(p: ReproductiveInputs): ReproductivePotential {
  if (p.age != null && p.age < 10) return 'not_possible';
  if (p.hasUterusOvaries === false) return 'not_possible';
  if (p.hysterectomyOrOophorectomy || p.postMenopausal) return 'not_possible';
  if (p.hasUterusOvaries === true) return 'possible';
  return 'unknown'; // never inferred from gender identity alone
}
```

A cis man with `hasUterusOvaries: false` still resolves to `not_possible` — same outcome as before. An unspecified or non-binary profile resolves to `unknown`, and `unknown` is treated as "ask," not "skip." Same logic, both bugs handled.

### Atomic question schema

```typescript
interface RedFlagAtom {
  id: string;
  text: string;
  appliesIf: (ctx: PatientContext) => boolean;
}

const abdominalPainRedFlags: RedFlagAtom[] = [
  { id: 'rigid_belly', text: 'a rigid or board-like belly', appliesIf: () => true },
  { id: 'fainting', text: 'fainting or feeling like you might pass out', appliesIf: () => true },
  { id: 'gi_bleeding', text: 'blood in your stool or vomit', appliesIf: () => true },
  {
    id: 'pregnancy_possibility',
    text: 'any possibility you could be pregnant',
    appliesIf: (ctx) => ctx.reproductivePotential !== 'not_possible', // possible OR unknown → ask
  },
];

function composeRedFlagQuestion(atoms: RedFlagAtom[], ctx: PatientContext): string {
  const clauses = atoms.filter(a => a.appliesIf(ctx)).map(a => a.text);
  return `Are you experiencing any of the following: ${clauses.join(', ')}?`;
}
```

This replaces a one-off `buildAbdominalPainSafetyQuestion` function with a generic composer, written once, reused for every symptom cluster.

### Output validator

```typescript
function validateOutput(responseText: string, ctx: PatientContext) {
  const violations: string[] = [];
  if (ctx.reproductivePotential === 'not_possible') {
    const reproTerms = /\b(pregnan\w*|ectopic|trimester|missed period|uterus|ovarian|ovulat\w*)\b/i;
    if (reproTerms.test(responseText)) {
      violations.push('Reproductive content present despite not_possible flag');
    }
  }
  return { isValid: violations.length === 0, violations };
}
```

Word-boundary matching instead of naive substring matching, so it doesn't block a response legitimately discussing a partner's situation, and doesn't miss phrasing like "expecting" or "missed period." On a violation, regenerate with a correction appended rather than silently stripping — a silent strip can leave a response that just trails off.

### Generated tests instead of a hand-written list

```typescript
const genders = ['male', 'female', 'non-binary', 'unspecified'];
const reproStates: ReproductivePotential[] = ['possible', 'not_possible', 'unknown'];
const ages = [8, 16, 30, 60];

for (const g of genders)
  for (const r of reproStates)
    for (const age of ages) {
      const ctx = { genderIdentity: g, reproductivePotential: r, age };
      const question = composeRedFlagQuestion(abdominalPainRedFlags, ctx);
      const shouldAsk = r !== 'not_possible';
      expect(question.includes('pregnant')).toBe(shouldAsk); // oracle checks the flag, not gender
    }
```

Ten lines generate 48 real, executable cases with a correctness oracle attached — more rigorous than a prose list of 50, and it extends to every other symptom bundle by swapping the atom list.

**Worth auditing while in this code**: the same profile-conflation pattern likely recurs anywhere else a rule is conditioned on a patient attribute — pediatric dosing thresholds, elderly frailty adjustments, pregnancy-category drug flags. If `gender` or `age` are used directly as stand-ins for a clinical fact elsewhere in the persona or knowledge-base modules, that's the same bug class, not a one-off.

## A second issue ranked at least as high

Both prior audits mention, in passing, that the RAG pipeline retrieves from a homeopathic materia medica (Boericke) and an Ayurvedic-knowledge source, feeding that content into the same pipeline as clinical knowledge for live diagnostic queries. This is worth flagging separately from the gender bug, because it's a different kind of problem.

Homeopathic remedies are prepared by serial dilution past the point where any active molecule is statistically likely to remain, and the weight of controlled-trial evidence doesn't support efficacy beyond placebo for any condition. Surfacing that content with the same retrieval confidence as evidence-based guidance, inside something aiming to be "the world's best AI doctor," risks false reassurance and delayed escalation for something that might be serious.

Ayurveda is a different case — a real medical tradition, not one testable claim — but the specific safety concern is documented rather than theoretical. A widely cited JAMA study found that roughly one in five Ayurvedic medications purchased online contained lead, mercury, or arsenic, and a cluster investigation among a community of Ayurveda users found about 40% had elevated blood lead levels. In some formulations the metals appear to be added deliberately, as part of a practice intended to increase potency, rather than showing up as incidental contamination — meaning safety varies by specific product and manufacturer in ways a RAG pipeline retrieving generic "Ayurvedic knowledge" text has no way to screen for. (Sources below.)

This doesn't necessarily mean removing the content — plenty of health platforms offer traditional-medicine information as a clearly-labeled, opt-in reference layer. The problem is retrieving it through the *same* pipeline, with the same implied authority, as primary diagnostic reasoning, with nothing stopping it from being the answer to a red-flag symptom. If kept, it needs to be walled off: separate retrieval path, explicit non-clinical-evidence framing, and a hard rule that it can never be the sole response when a red-flag check fires.

## A right-sized "Top 100 problems"

| # | Issue | Severity | Fix direction | Effort |
|---|---|---|---|---|
| 1 | Gender identity used as a proxy for reproductive risk | High | Separate `reproductivePotential` flag; default to asking when unknown | Medium |
| 2 | Homeopathic/unvetted Ayurvedic content sharing the primary diagnostic RAG path | Critical | Wall off behind opt-in + disclaimers; never the sole answer to a red flag | Med–high |
| 3 | Client-supplied profile falls back to `{}` | High | Server always re-resolves from the authenticated session | Low |
| 4 | Output validation is a reactive substring blocklist | Medium | Prevent via decomposed schema first, validate with flag-tied regex second | Medium |
| 5 | No persistent semantic memory across sessions | Medium | Build the vector + decay design already sketched in prior audit — sound, just unbuilt | High |
| 6 | Gender used as a blunt Bayesian prior for conditions like ACS | High | Use validated risk-stratification inputs; audit false-negative rate by sex | Medium |
| 7 | Root-cause percentages given without stated methodology | Low (integrity) | Back with real telemetry, or relabel as a ranked hypothesis, not a measured stat | Low |
| 8 | Single LLM chain with no independent deterministic backstop | Medium | Keep a rule-based hard-stop layer that runs regardless of which model answered | Medium |
| 9 | No stated incident-review loop | High at scale | Structured logging of every red-flag decision + periodic clinician review | Medium |
| 10 | "AI doctor" framing vs. regulatory reality | High, strategic | Clarify product claims; get regulatory counsel involved early | N/A |
| 11 | Memory categories are binary (immutable vs. not) | Low–medium | Tiered categories, distinct decay rate per data type | Low–medium |
| 12 | Offline/online profile sync has no conflict resolution | Low–medium | Timestamp + source-of-truth precedence rules | Medium |

## Where this sits regulatorily

Worth knowing before scaling this: FDA replaced its clinical decision support guidance on January 6, 2026 with an updated final version, and the update backs away from FDA's earlier stance that non-device CDS had to present multiple options to a clinician rather than one specific recommendation — a real loosening. But that update is scoped entirely to clinician-facing tools; it doesn't extend any new enforcement discretion to consumer-facing products like health chatbots or symptom checkers, and the softer treatment it does offer depends on a health care provider being able to independently review the basis for a recommendation rather than relying on it outright — not a patient doing so.

A direct-to-patient tool making diagnosis-adjacent claims doesn't inherit the benefit of the easier 2026 rules just because they exist; a patient-facing tool with no clinician in the loop to catch an error arguably sits in a *higher*-risk category, not a lower one. (Not a lawyer, not a substitute for one — get real regulatory counsel before finalizing what Arovia claims to do.)

The practical version of this: whether the product is called an "AI doctor," a "symptom checker," or a "triage assistant" isn't just marketing language — it's the thing that determines which regulatory bucket it lands in.

## Getting the real version of this audit

Everything above is inference from prose descriptions of the code, not a read of the code itself. The line-level audit the original brief asked for — real hallucination tests, a real regression suite, a Top 100 that isn't padding — needs actual repo access: reading every file, running the test suite, checking whether the previously reported line numbers are still accurate. Claude Code (or an equivalent agentic coding tool with real file access) is the right tool for that next step — it can open the actual source files, verify these claims directly, and land the fixes above as a real pull request.

## Bottom line

Is anything here fatal to "world's best AI doctor"? No. The architecture shape — deterministic Bayesian core, RAG retrieval, LLM formatting layer kept separate from diagnostic logic — is reasonable, and the team caught its own gender bug rather than shipping it silently, which says something good about the engineering culture. What's actually stopping it, based on what's here:

1. Attribute-conditional logic keeps getting bolted on as one-off special cases instead of a general "clinical fact vs. self-reported identity" layer — the pregnancy bug is the one that was found, not the only one that pattern produces.
2. Non-evidence-based content shares a retrieval pipeline with clinical content, with no wall between them.
3. No persistent cross-session memory yet — self-scored at 4/10 in the prior audit.
4. "World's best AI doctor" is a regulatory and clinical-governance problem as much as an engineering one. Incident monitoring and a precise answer to "what exactly is this software claiming to do" matter as much as code quality once millions of users are involved.

None of these get fixed by a bigger prompt.

## Sources

- FDA Clinical Decision Support Software guidance, updated January 6, 2026 — [Covington & Burling summary](https://www.cov.com/en/news-and-insights/insights/2026/01/5-key-takeaways-from-fdas-revised-clinical-decision-support-cds-software-guidance) · [CITI Program summary](https://about.citiprogram.org/blog/clinical-decision-support-compliance-fdas-2026-expectations/) · [Nixon Law Group summary](https://www.nixonlawgroup.com/resources/fda-relaxes-clinical-decision-support-and-general-wellness-guidance-what-it-means-for-generative-ai-and-consumer-wearables)
- Ayurvedic product heavy-metal contamination — [Minnesota Dept. of Health](https://www.health.state.mn.us/communities/environment/lead/fs/ayurvedic.html) · [Iowa cluster study, PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4727589/) · [NPR, 2015](https://www.npr.org/sections/health-shots/2015/07/31/428016419/toxic-lead-contaminates-some-traditional-ayurvedic-medicines)
