/**
 * clinicalValidator.ts — Medical Profile Consistency Validator
 *
 * Server-side validation pass that cross-checks the patient's submitted
 * profile for clinical inconsistencies BEFORE it is injected into
 * the AI system prompt.
 *
 * Catches:
 *   1. Age–medication mismatches (e.g. 8-year-old on warfarin)
 *   2. Allergy–medication conflicts (e.g. penicillin allergy + amoxicillin)
 *   3. Mutually exclusive conditions (T1DM + T2DM simultaneously)
 *
 * Warnings are surfaced in the system prompt as [CLINICAL INCONSISTENCY ALERT]
 * blocks so the LLM can ask the patient to clarify — not silently dropped.
 *
 * Zero LLM dependency. Pure functions only.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidationWarning {
    field: string;
    issue: string;
    severity: 'warning' | 'error';
}

export interface MedicalProfile {
    age?: number | string | null;
    conditions: string[];
    medications: string[];
    allergies: string[];
}

// ─── Age–Medication Rules ─────────────────────────────────────────────────────

interface AgeMedRule {
    drug: string;         // Display name
    matchers: string[];   // Substrings to match in medication name (case-insensitive)
    minAge: number;       // Minimum age for this medication
    reason: string;
}

const AGE_MEDICATION_RULES: AgeMedRule[] = [
    // Anticoagulants
    { drug: 'Warfarin',      matchers: ['warfarin'],           minAge: 18, reason: 'requires regular INR monitoring not routinely available for children' },
    { drug: 'Rivaroxaban',   matchers: ['rivaroxaban'],        minAge: 18, reason: 'not approved for paediatric use' },
    { drug: 'Apixaban',      matchers: ['apixaban'],           minAge: 18, reason: 'not approved for paediatric use' },
    { drug: 'Dabigatran',    matchers: ['dabigatran'],         minAge: 18, reason: 'not approved for paediatric use' },
    // Immunosuppressants / chemotherapy
    { drug: 'Methotrexate',  matchers: ['methotrexate'],       minAge: 2,  reason: 'requires weight-based dosing and specialist supervision in children' },
    { drug: 'Azathioprine',  matchers: ['azathioprine'],       minAge: 2,  reason: 'requires specialist supervision in young children' },
    // Psychiatric
    { drug: 'Lithium',       matchers: ['lithium'],            minAge: 12, reason: 'requires careful monitoring; typically not used in children under 12' },
    // Cardiac antiarrhythmics
    { drug: 'Amiodarone',    matchers: ['amiodarone'],         minAge: 18, reason: 'typically adult-only; paediatric use requires specialist oversight' },
    // Antibiotics
    { drug: 'Doxycycline',   matchers: ['doxycycline'],        minAge: 8,  reason: 'affects tooth development in children under 8' },
    { drug: 'Tetracycline',  matchers: ['tetracycline'],       minAge: 8,  reason: 'affects tooth development in children under 8' },
    { drug: 'Ciprofloxacin', matchers: ['ciprofloxacin'],      minAge: 18, reason: 'associated with joint problems in growing children; typically avoided under 18' },
    // Analgesics
    { drug: 'Aspirin',       matchers: ['aspirin'],            minAge: 16, reason: 'risk of Reye\'s syndrome in children under 16 with viral illness' },
    // Antidiabetics
    { drug: 'Glipizide',     matchers: ['glipizide'],          minAge: 18, reason: 'not approved for paediatric use' },
    { drug: 'Glibenclamide', matchers: ['glibenclamide', 'glyburide'], minAge: 18, reason: 'not approved for paediatric use' },
    // Hormonal
    { drug: 'Finasteride',   matchers: ['finasteride'],        minAge: 18, reason: 'not approved for use in children or women of childbearing age' },
];

// ─── Allergy–Medication Cross-Reference ──────────────────────────────────────

interface AllergyMedRule {
    allergen: string;
    relatedDrugMatchers: string[];  // Substrings of medication names that conflict
    crossReactivity: boolean;       // true = cross-reactive drug class (not identical allergen)
}

const ALLERGY_MED_RULES: AllergyMedRule[] = [
    {
        allergen: 'penicillin',
        relatedDrugMatchers: ['amoxicillin', 'ampicillin', 'piperacillin', 'cloxacillin', 'flucloxacillin', 'co-amoxiclav', 'augmentin', 'penicillin'],
        crossReactivity: false,
    },
    {
        allergen: 'sulfa',
        relatedDrugMatchers: ['sulfamethoxazole', 'bactrim', 'septran', 'co-trimoxazole', 'sulfonamide', 'sulfadiazine'],
        crossReactivity: false,
    },
    {
        allergen: 'aspirin',
        relatedDrugMatchers: ['ibuprofen', 'naproxen', 'diclofenac', 'celecoxib', 'indomethacin', 'ketorolac'],
        crossReactivity: true,
    },
    {
        allergen: 'nsaid',
        relatedDrugMatchers: ['ibuprofen', 'naproxen', 'diclofenac', 'celecoxib', 'aspirin', 'indomethacin'],
        crossReactivity: false,
    },
    {
        allergen: 'codeine',
        relatedDrugMatchers: ['codeine', 'co-codamol', 'tramadol'],
        crossReactivity: false,
    },
    {
        allergen: 'metformin',
        relatedDrugMatchers: ['metformin', 'glucophage'],
        crossReactivity: false,
    },
    {
        allergen: 'statins',
        relatedDrugMatchers: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'pravastatin', 'lovastatin'],
        crossReactivity: true,
    },
];

// ─── Mutually Exclusive Conditions ───────────────────────────────────────────

interface ExclusivePair {
    condA: string;
    condB: string;
    aMatchers: string[];
    bMatchers: string[];
    note: string;
}

const EXCLUSIVE_PAIRS: ExclusivePair[] = [
    {
        condA: 'Type 1 Diabetes',
        condB: 'Type 2 Diabetes',
        aMatchers: ['type 1 diabet', 't1dm', 'type1 diabet', 'insulin.dependent diabet', 'juvenile diabet'],
        bMatchers: ['type 2 diabet', 't2dm', 'type2 diabet', 'non.insulin.dependent'],
        note: 'Type 1 and Type 2 diabetes are distinct conditions. Please confirm which applies.',
    },
    {
        condA: 'Hypothyroidism',
        condB: 'Hyperthyroidism',
        aMatchers: ['hypothyroid', 'underactive thyroid'],
        bMatchers: ['hyperthyroid', 'overactive thyroid', 'graves'],
        note: 'Hypothyroidism and hyperthyroidism are opposite thyroid conditions. Please verify.',
    },
    {
        condA: 'Hypertension',
        condB: 'Hypotension',
        aMatchers: ['hypertension', 'high blood pressure'],
        bMatchers: ['hypotension', 'low blood pressure'],
        note: 'Both high and low blood pressure are listed simultaneously. Please verify.',
    },
    {
        condA: 'Crohn\'s Disease',
        condB: 'Ulcerative Colitis',
        aMatchers: ['crohn'],
        bMatchers: ['ulcerative colitis'],
        note: 'Crohn\'s and Ulcerative Colitis are distinct IBD types. Having both simultaneously is unusual — please confirm.',
    },
];

// ─── Core Validator ───────────────────────────────────────────────────────────

/**
 * Validates the patient profile for clinical consistency.
 *
 * @param profile  Resolved patient profile.
 * @returns        Array of ValidationWarning objects (empty = no issues found).
 */
export function validateProfileConsistency(profile: MedicalProfile): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    const age = profile.age != null ? parseInt(String(profile.age), 10) : NaN;

    // ── 1. Age–Medication Cross-Check ─────────────────────────────────────────
    if (!isNaN(age) && age > 0 && age < 18) {
        for (const med of profile.medications) {
            const medLower = med.toLowerCase();
            for (const rule of AGE_MEDICATION_RULES) {
                if (age < rule.minAge) {
                    const matched = rule.matchers.some(m => medLower.includes(m));
                    if (matched) {
                        warnings.push({
                            field: 'medications',
                            issue: `${rule.drug} is listed for a patient aged ${age}, but is typically only prescribed for patients aged ${rule.minAge}+ (${rule.reason}). Please verify this prescription with the prescribing physician.`,
                            severity: 'warning',
                        });
                    }
                }
            }
        }
    }

    // ── 2. Allergy–Medication Conflict ────────────────────────────────────────
    for (const allergy of profile.allergies) {
        const allergyLower = allergy.toLowerCase().trim();

        // Direct name match — allergy listed AND same drug taken
        for (const med of profile.medications) {
            const medLower = med.toLowerCase();
            if (medLower.includes(allergyLower) || allergyLower.includes(medLower.split(' ')[0])) {
                warnings.push({
                    field: 'medications',
                    issue: `Patient lists allergy to "${allergy}" but also lists "${med}" as a current medication. This is a potential safety conflict. Please verify with the prescribing physician.`,
                    severity: 'error',
                });
            }
        }

        // Cross-reactivity class match
        for (const rule of ALLERGY_MED_RULES) {
            if (!allergyLower.includes(rule.allergen) && !rule.allergen.includes(allergyLower)) continue;
            for (const med of profile.medications) {
                const medLower = med.toLowerCase();
                const hasConflict = rule.relatedDrugMatchers.some(m => medLower.includes(m));
                if (hasConflict) {
                    const crossNote = rule.crossReactivity
                        ? ' (cross-reactive drug class — similar chemical structure)'
                        : '';
                    warnings.push({
                        field: 'medications',
                        issue: `Patient has a "${allergy}" allergy and is listed as taking "${med}"${crossNote}. Please verify with the prescribing physician before any consultation.`,
                        severity: 'error',
                    });
                }
            }
        }
    }

    // ── 3. Mutually Exclusive Conditions ──────────────────────────────────────
    const conditionsText = profile.conditions.map(c => c.toLowerCase()).join(' ');

    for (const pair of EXCLUSIVE_PAIRS) {
        const hasA = pair.aMatchers.some(m => new RegExp(m, 'i').test(conditionsText));
        const hasB = pair.bMatchers.some(m => new RegExp(m, 'i').test(conditionsText));

        if (hasA && hasB) {
            warnings.push({
                field: 'conditions',
                issue: `Both "${pair.condA}" and "${pair.condB}" are listed simultaneously. ${pair.note}`,
                severity: 'warning',
            });
        }
    }

    // Deduplicate by issue text
    const seen = new Set<string>();
    return warnings.filter(w => {
        if (seen.has(w.issue)) return false;
        seen.add(w.issue);
        return true;
    });
}

/**
 * Formats validation warnings for injection into the system prompt.
 * Errors get a [CLINICAL INCONSISTENCY ALERT] header.
 * Warnings get a [PROFILE NOTE] header.
 *
 * @param warnings  Output of validateProfileConsistency().
 * @returns         Formatted string block or empty string if no warnings.
 */
export function formatValidationWarningsForPrompt(warnings: ValidationWarning[]): string {
    if (!warnings.length) return '';

    const errors = warnings.filter(w => w.severity === 'error');
    const notices = warnings.filter(w => w.severity === 'warning');

    const lines: string[] = ['\n[CLINICAL PROFILE VALIDATION RESULTS]'];

    if (errors.length) {
        lines.push('[CLINICAL INCONSISTENCY ALERT — ERRORS REQUIRE ATTENTION]');
        lines.push('The following conflicts were detected in the patient profile. Do NOT proceed with medication or remedy recommendations until these are clarified:');
        errors.forEach((e, i) => lines.push(`  ${i + 1}. ${e.issue}`));
    }

    if (notices.length) {
        lines.push('[PROFILE NOTES — PLEASE VERIFY]');
        notices.forEach((n, i) => lines.push(`  ${i + 1}. ${n.issue}`));
    }

    lines.push('[END CLINICAL PROFILE VALIDATION]');
    return lines.join('\n');
}
