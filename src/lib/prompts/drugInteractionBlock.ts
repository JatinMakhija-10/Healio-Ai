/**
 * drugInteractionBlock.ts — Clinical Prompt Block Builders
 *
 * Builds system prompt additions for:
 *   - Drug interaction mandatory checks (§3.4)
 *   - Dosage grounding rules (§6.2)
 *   - Chain-of-thought diagnosis protocol (§3.2)
 *   - Differential confidence tiers (§3.3)
 *   - Context-specific disclaimers (§6.3)
 *   - Age-stratified dosing rules matrix (§3.5)
 *
 * All functions return plain strings appended to finalSystemPrompt
 * in route.ts. Zero side effects. Pure functions only.
 */

// ─── Drug Interaction Check (§3.4) ───────────────────────────────────────────

/**
 * Builds a mandatory drug interaction check block.
 * Injected when intent === 'medication_query' AND patient is on 2+ medications.
 *
 * @param medications  The patient's current medication list.
 */
export function buildDrugInteractionPrompt(medications: string[]): string {
    if (medications.length < 2) return '';

    return `
[DRUG INTERACTION CHECK — MANDATORY FOR THIS RESPONSE]
Patient is currently taking: ${medications.join(', ')}.
Before recommending ANY drug, supplement, herb, or OTC medication in your response:
1. Check for pharmacokinetic interactions (CYP450 enzyme induction/inhibition, renal clearance, protein binding).
2. Check for pharmacodynamic interactions (additive toxicity, antagonism, serotonin syndrome risk, QT prolongation).
3. Check for contraindications with the patient's listed conditions.
4. State any interaction risk explicitly BEFORE the recommendation.
5. If uncertain about an interaction, err on the side of caution and advise the patient to verify with their pharmacist.
This check is mandatory — do NOT skip it.
`;
}

// ─── Dosage Grounding Rule (§6.2) ────────────────────────────────────────────

/**
 * Builds the dosage grounding rule prompt block.
 * Injected whenever the user's message contains dosage-related keywords.
 */
export function buildDosageGroundingPrompt(): string {
    return `
[DOSAGE GROUNDING RULE — CRITICAL]
The user's message contains a dosage or medication administration question.
RULE: Any specific dosage, frequency, or administration route you state MUST come directly from the
retrieved clinical documents provided in the AVORIA MEDICAL KNOWLEDGE BASE context above.
If no retrieved document contains the specific dosage for this patient's exact situation (accounting for
age, weight, renal function, and co-medications), respond with:
"I don't have verified dosing information for this specific combination — please confirm the exact dose
with your prescribing physician or pharmacist before taking or changing any medication."
Do NOT infer, extrapolate, or calculate dosages from general medical knowledge alone.
Do NOT cite a standard adult dose if the patient has CKD, hepatic impairment, or is a child — these
require dose adjustment and the standard figures would be unsafe.
`;
}

// ─── Chain-of-Thought Diagnosis Protocol (§3.2) ──────────────────────────────

/**
 * Builds the CoT (chain-of-thought) diagnosis reasoning protocol.
 * Injected on final-turn (summary) responses only.
 *
 * The steps are labelled as INTERNAL REASONING so the model understands
 * that only the Step 5 output is shown to the patient.
 */
export function buildCoTDiagnosisProtocol(): string {
    return `
[CHAIN-OF-THOUGHT DIAGNOSIS PROTOCOL — APPLY FOR THIS FINAL RESPONSE]
Before producing your final JSON output, reason through these steps internally:

STEP 1 — SYMPTOM CHARACTERISATION
Identify the reported symptoms, their onset, duration, severity (1-10), location,
character/sensation, aggravating factors, and relieving factors.

STEP 2 — PROFILE RISK INTERSECTION
Which of the patient's known conditions, medications, allergies, or lifestyle risk
factors are directly relevant to the presenting symptoms?
Cross-reference: Does any known condition explain or modify the symptom presentation?

STEP 3 — DIFFERENTIAL GENERATION (top 3–5)
List candidate diagnoses in descending order of posterior probability.
For each: brief justification why it fits this patient's specific profile.

STEP 4 — RED FLAG SCREEN
Are any emergency or urgent conditions (L4/L5) present in the differential?
If yes, set escalation_level to L4 or L5 and populate escalation_action before
proceeding to Step 5.

STEP 5 — SAFE RESPONSE FORMULATION
Given the patient's profile constraints (allergies, renal/hepatic function, age,
polypharmacy), what guidance is safe to provide vs. what must be escalated?
This is what you output in the JSON — Steps 1–4 are your internal reasoning only.

FORMAT: Produce ONLY the final JSON output from Step 5. Do not include your
internal reasoning steps in the response visible to the patient.
`;
}

// ─── Differential Confidence Tiers (§3.3) ────────────────────────────────────

/**
 * Builds the differential confidence tier vocabulary block.
 * Injected on final-turn responses only.
 */
export function buildConfidenceTiersPrompt(): string {
    return `
[DIFFERENTIAL CONFIDENCE COMMUNICATION — APPLY IN bayesianFactors AND differentialDiagnoses]
When stating a differential or probable diagnosis, qualify it with one of these tiers:

[HIGH CONFIDENCE] — Classic presentation + strong profile alignment + well-supported by
retrieved literature. Use when ≥2 major diagnostic criteria are met.

[MODERATE CONFIDENCE] — Plausible but non-specific; fits some but not all criteria.
Further workup needed to confirm. Use for top 1–2 differentials when pattern is suggestive.

[LOW CONFIDENCE] — Possible but requires exclusion of higher-probability alternatives first.
Use for rarer diagnoses or when symptom data is sparse.

[ESCALATE] — Presentation warrants urgent clinical evaluation. Do not speculate further —
direct the patient to seek care and set escalation_level to L4 or L5.

Apply these labels in the bayesianFactors field and in each differentialDiagnoses entry's
rationale. Example: "The [HIGH CONFIDENCE] primary assessment is tension-type headache
based on bilateral, pressure-like pain with desk-work occupation. [MODERATE CONFIDENCE]
migraine without aura cannot be excluded given recurring pattern."
`;
}

// ─── Context-Specific Disclaimers (§6.3) ─────────────────────────────────────

export type DisclaimerType =
    | 'symptom_assessment'
    | 'drug_information'
    | 'lab_interpretation'
    | 'mental_health'
    | 'pediatric';

const DISCLAIMERS: Record<DisclaimerType, string> = {
    symptom_assessment:
        'This assessment is not a clinical diagnosis. If your symptoms worsen, persist beyond 48 hours, or new danger signs appear, please seek evaluation from a qualified healthcare provider.',
    drug_information:
        'Always verify drug dosages, interactions, and suitability with your pharmacist or prescribing physician before starting, stopping, or changing any medication.',
    lab_interpretation:
        'Lab values must be interpreted by your physician in the context of your complete clinical picture, medical history, and current symptoms. This information is educational only.',
    mental_health:
        'If you are experiencing thoughts of self-harm or suicide, please contact a mental health professional or crisis line immediately. In India: iCall 9152987821 | Vandrevala Foundation 1860-2662-345.',
    pediatric:
        'All guidance for children should be reviewed and approved by their registered paediatrician before use. Children metabolise medications differently from adults.',
};

/**
 * Returns the appropriate context-specific disclaimer text.
 *
 * @param type  The response type that determines which disclaimer to use.
 */
export function buildContextualDisclaimer(type: DisclaimerType): string {
    return `\n[DISCLAIMER — APPEND TO END OF RESPONSE]\n${DISCLAIMERS[type]}`;
}

/**
 * Infers the best disclaimer type from intent and message content.
 */
export function inferDisclaimerType(
    intent: string,
    messageContent: string,
    patientAge?: number | null
): DisclaimerType {
    if (patientAge !== null && patientAge !== undefined && !isNaN(patientAge) && patientAge < 18) {
        return 'pediatric';
    }
    if (/suicid|self.harm|depress|anxiety|mental health|crisis/i.test(messageContent)) {
        return 'mental_health';
    }
    if (intent === 'lab_result_query') return 'lab_interpretation';
    if (intent === 'medication_query') return 'drug_information';
    return 'symptom_assessment';
}

// ─── Age-Stratified Dosing Rules (§3.5) ──────────────────────────────────────

/**
 * Returns the age-stratified dosing rule block for a given patient age.
 * These are injected into the structured PATIENT PROFILE block.
 *
 * @param age  Patient age in years.
 */
export function getAgeStratifiedDosingRules(age: number): string {
    if (isNaN(age) || age <= 0) return '';

    if (age <= 2) {
        return [
            '[AGE-STRATIFIED DOSING — NEONATE/INFANT (0–2 years)]',
            '- Weight-based dosing ONLY (mg/kg). Never use flat adult or child doses.',
            '- Flag ALL OTC medications as requiring paediatrician approval before use.',
            '- Standard adult formulations are almost always unsafe at this age.',
            '- If in doubt, escalate to paediatric specialist. Do not estimate.',
        ].join('\n');
    }

    if (age <= 11) {
        return [
            '[AGE-STRATIFIED DOSING — CHILD (3–11 years)]',
            '- Use mg/kg dosing where applicable. Confirm weight if not in profile.',
            '- NEVER recommend aspirin — Reye\'s syndrome risk.',
            '- Avoid adult tablet formulations; use liquid/suspension where available.',
            '- Always add: "Please confirm this dose with your child\'s paediatrician."',
        ].join('\n');
    }

    if (age <= 17) {
        return [
            '[AGE-STRATIFIED DOSING — ADOLESCENT (12–17 years)]',
            '- Most adult doses can be used with caution. Confirm weight for weight-sensitive drugs.',
            '- Flag aspirin — contraindicated in viral illness (Reye\'s syndrome risk until 16).',
            '- Mental health screening context: adolescents may underreport mood symptoms.',
            '- Reproductive health awareness if applicable (contraception, menstrual cycle effects).',
        ].join('\n');
    }

    if (age >= 75) {
        return [
            '[AGE-STRATIFIED DOSING — OLDER ELDERLY (75+ years)]',
            '- Aggressive deprescribing posture: fewer drugs = lower adverse event risk.',
            '- Consider frailty index when recommending any new medication.',
            '- Anticholinergic burden: avoid antihistamines, tricyclic antidepressants, bladder drugs.',
            '- Fall-risk drugs: benzodiazepines, antihypertensives (orthostatic hypotension risk).',
            '- STOPP/START criteria awareness: always suggest physician medication review.',
            '- Renal and hepatic clearance often significantly reduced — dose-adjust accordingly.',
            '- If frailty index ≥ 5: escalate to geriatrician. Do not increase medication burden.',
        ].join('\n');
    }

    if (age >= 65) {
        return [
            '[AGE-STRATIFIED DOSING — YOUNG ELDERLY (65–74 years)]',
            '- START at ⅔ of standard adult dose for new medications. Titrate up as tolerated.',
            '- START/STOPP criteria awareness: check appropriateness of existing medications.',
            '- Fall-risk drugs (benzodiazepines, sedatives, antihypertensives): flag explicitly.',
            '- Renal clearance may be reduced: check renal-dose adjustments for all new drugs.',
            '- Polypharmacy review: if on 5+ medications, note this in response.',
        ].join('\n');
    }

    // Standard adult (18–64) — no special dosing block needed in most cases
    return '';
}

// ─── Polypharmacy Prompt Injection (§4.2) ────────────────────────────────────

/**
 * Builds a polypharmacy warning block for high-risk patients.
 * Returns empty string for low/moderate risk.
 *
 * @param medicationCount  Number of current medications.
 */
export function buildPolypharmacyWarningPrompt(medicationCount: number): string {
    if (medicationCount < 5) return '';

    const risk =
        medicationCount >= 10 ? 'CRITICAL'
        : medicationCount >= 7  ? 'HIGH'
        : 'MODERATE';

    return `
[POLYPHARMACY RISK — ${risk} (${medicationCount} current medications)]
This patient is on a ${risk.toLowerCase()}-risk polypharmacy regimen.
For ANY new drug, supplement, herbal remedy, or OTC recommendation:
1. Explicitly verify it does not introduce a Class D or X drug interaction with existing medications.
2. Consider cumulative anticholinergic burden (especially in elderly patients).
3. Consider cumulative sedative/CNS-depressant burden.
4. If uncertain, recommend pharmacist review before adding any new agent.
5. Avoid recommending additional medications where non-pharmacological alternatives exist.
${risk === 'CRITICAL' ? '⚠️ CRITICAL POLYPHARMACY: Consider recommending a comprehensive medication review with the prescribing physician as a primary action.' : ''}
`;
}
