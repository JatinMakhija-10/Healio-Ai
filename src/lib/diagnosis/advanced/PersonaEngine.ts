/**
 * PersonaEngine — Deterministic Patient Profile Parser
 *
 * Converts raw onboarding data (strings, arrays) into structured,
 * typed flags that the MCMC covariate system can consume.
 *
 * Zero LLM dependency. Pure functions only.
 */

// ─── Output Types ─────────────────────────────────────────────────────────────

export interface FamilyHistoryFlags {
    cardiac: boolean;      // heart attack, heart disease, coronary, MI
    diabetes: boolean;     // diabetes, T2DM, sugar
    cancer: boolean;       // cancer, tumor, malignancy
    mentalHealth: boolean; // depression, anxiety, bipolar, schizophrenia
    stroke: boolean;       // stroke, brain hemorrhage
    hypertension: boolean; // blood pressure, hypertension
    thyroid: boolean;      // thyroid, hypothyroid, hyperthyroid
    kidney: boolean;       // kidney disease, CKD, renal
    autoimmune: boolean;   // lupus, rheumatoid, autoimmune
    asthma: boolean;       // asthma, respiratory
}

export type OccupationCategory =
    | 'desk'        // desk_job, IT, software, office
    | 'manual'      // construction, factory, labour
    | 'healthcare'  // doctor, nurse, hospital, clinic
    | 'outdoor'     // farming, delivery, sports
    | 'student'     // student, studying
    | 'homemaker'   // housewife, homemaker
    | 'unknown';

export interface DietRiskFlags {
    isHighFat: boolean;
    isHighSalt: boolean;
    isVegetarian: boolean;
    isVegan: boolean;
    isJunkHeavy: boolean;
}

export interface MedicationFlags {
    onSteroids: boolean;
    onImmunosuppressants: boolean;
    onAntidepressants: boolean;
    onAnticoagulants: boolean;
    onInsulin: boolean;
    onThyroidMeds: boolean;
    onStatins: boolean;
    onAntihypertensives: boolean;
}

export interface PersonaProfile {
    bmi: number | null;
    isObese: boolean;           // BMI >= 30
    isUnderweight: boolean;     // BMI < 18.5
    isOverweight: boolean;      // BMI 25-29.9
    isAlcoholUser: boolean;
    isHeavyDrinker: boolean;    // 'heavy' or 'daily'
    isSedentary: boolean;
    isVigorousExercise: boolean;
    hasLowSleep: boolean;       // < 6 hours
    familyHistory: FamilyHistoryFlags;
    occupation: OccupationCategory;
    dietRisk: DietRiskFlags;
    medicationFlags: MedicationFlags;
    // Comorbidity flags parsed from conditions[]
    hasThyroid: boolean;
    hasPCOS: boolean;
    hasAnemia: boolean;
    hasAsthma: boolean;
    hasCKD: boolean;
    hasDepression: boolean;
    hasLiverDisease: boolean;
    hasAutoimmune: boolean;
    hasGout: boolean;
    hasEpilepsy: boolean;
    // ── Phase 2 derived risk scores ─────────────────────────────────────────
    bmiClass: 'underweight' | 'normal' | 'overweight' | 'obese_I' | 'obese_II' | 'obese_III' | 'unknown';
    polypharmacyRisk: 'none' | 'low' | 'moderate' | 'high' | 'critical'; // §4.2
    frailtyIndex: number;       // 0–10 frailty score (§4.4)
    medicationCount: number;    // raw count for prompt builders
}

// ─── BMI Calculator ───────────────────────────────────────────────────────────

/**
 * Compute BMI from weight (kg) and height (cm).
 * Handles string inputs like "75", "75kg", "170", "170cm", "5'10", "5ft10in"
 */
export function computeBMI(
    weightRaw: string | number | undefined,
    heightRaw: string | number | undefined
): number | null {
    if (!weightRaw || !heightRaw) return null;

    const weightStr = String(weightRaw).toLowerCase().trim();
    const heightStr = String(heightRaw).toLowerCase().trim();

    // Parse weight (assume kg if no unit)
    let weightKg = parseFloat(weightStr.replace(/[^0-9.]/g, ''));
    if (isNaN(weightKg) || weightKg <= 0) return null;

    // If weight seems like lbs (> 200 and no 'kg'), convert
    if (weightKg > 200 && !weightStr.includes('kg')) {
        weightKg = weightKg * 0.453592;
    }

    // Parse height
    let heightM: number;

    // Check for feet/inches format: 5'10, 5ft10, 5'10"
    const ftInMatch = heightStr.match(/(\d+)\s*['′ft]+\s*(\d+)?/);
    if (ftInMatch) {
        const feet = parseInt(ftInMatch[1], 10);
        const inches = parseInt(ftInMatch[2] || '0', 10);
        heightM = (feet * 12 + inches) * 0.0254;
    } else {
        const heightVal = parseFloat(heightStr.replace(/[^0-9.]/g, ''));
        if (isNaN(heightVal) || heightVal <= 0) return null;

        // Heuristic: if < 10, probably meters; if < 100, probably inches; else cm
        if (heightVal < 3) {
            heightM = heightVal; // already meters
        } else if (heightVal < 100) {
            heightM = heightVal * 0.0254; // inches
        } else {
            heightM = heightVal / 100; // cm → m
        }
    }

    if (heightM <= 0) return null;

    const bmi = weightKg / (heightM * heightM);
    return Math.round(bmi * 10) / 10; // 1 decimal
}

// ─── Family History Parser ────────────────────────────────────────────────────

const FH_PATTERNS: Record<keyof FamilyHistoryFlags, RegExp> = {
    cardiac:      /heart|cardiac|coronary|mi\b|angina|heart attack|heart disease/i,
    diabetes:     /diabet|sugar|t2dm|t1dm|blood sugar/i,
    cancer:       /cancer|tumor|tumour|malignan|carcinoma|leukemia|lymphoma/i,
    mentalHealth: /depress|anxiety|bipolar|schizo|mental|psychiatric|suicide/i,
    stroke:       /stroke|cerebral|brain hemorrh|brain bleed|paralysis/i,
    hypertension: /hypertens|blood pressure|bp high|high bp/i,
    thyroid:      /thyroid|hypothyroid|hyperthyroid|goiter|goitre/i,
    kidney:       /kidney|renal|ckd|dialysis/i,
    autoimmune:   /lupus|rheumatoid|autoimmune|scleroderma|crohn|celiac/i,
    asthma:       /asthma|respiratory|copd|bronchit/i,
};

export function parseFamilyHistory(
    fh: string | string[] | undefined | null
): FamilyHistoryFlags {
    const defaults: FamilyHistoryFlags = {
        cardiac: false, diabetes: false, cancer: false, mentalHealth: false,
        stroke: false, hypertension: false, thyroid: false, kidney: false,
        autoimmune: false, asthma: false,
    };

    if (!fh) return defaults;

    const text = (Array.isArray(fh) ? fh.join(' ') : String(fh)).toLowerCase();
    if (!text.trim()) return defaults;

    for (const [key, pattern] of Object.entries(FH_PATTERNS)) {
        if (pattern.test(text)) {
            defaults[key as keyof FamilyHistoryFlags] = true;
        }
    }

    return defaults;
}

// ─── Occupation Classifier ────────────────────────────────────────────────────

export function parseOccupationRisk(occupation: string | undefined | null): OccupationCategory {
    if (!occupation) return 'unknown';
    const o = occupation.toLowerCase().trim();

    // Exact enum values from onboarding
    if (o === 'desk_job' || o === 'sedentary') return 'desk';
    if (o === 'active') return 'manual';
    if (o === 'highly_active') return 'outdoor';

    // Free-text heuristics
    if (/desk|office|it\b|software|computer|bank|account|analyst|manager|corporate|remote/i.test(o)) return 'desk';
    if (/construct|factory|labour|labor|mechanic|plumb|electric|weld|driver|deliver|warehouse/i.test(o)) return 'manual';
    if (/doctor|nurse|hospital|clinic|pharma|medical|dentist|health\s?care|paramedic/i.test(o)) return 'healthcare';
    if (/farm|agricult|outdoor|sport|coach|trainer|delivery|courier/i.test(o)) return 'outdoor';
    if (/student|school|college|universit|stud/i.test(o)) return 'student';
    if (/home\s?maker|housewife|house\s?wife|domestic/i.test(o)) return 'homemaker';

    return 'unknown';
}

// ─── Diet Risk Parser ─────────────────────────────────────────────────────────

export function parseDietRisk(diet: string | undefined | null): DietRiskFlags {
    const defaults: DietRiskFlags = {
        isHighFat: false, isHighSalt: false,
        isVegetarian: false, isVegan: false, isJunkHeavy: false,
    };

    if (!diet) return defaults;
    const d = diet.toLowerCase().trim();

    // Onboarding enum values: 'vegetarian', 'vegan', 'mixed', 'non_vegetarian'
    if (d === 'vegetarian' || d.includes('vegetarian')) defaults.isVegetarian = true;
    if (d === 'vegan' || d.includes('vegan')) { defaults.isVegan = true; defaults.isVegetarian = true; }
    if (/non.?veg|mixed/i.test(d)) defaults.isHighFat = true; // heuristic: non-veg Indian diets tend high-fat
    if (/junk|fast food|processed/i.test(d)) { defaults.isJunkHeavy = true; defaults.isHighFat = true; }
    if (/salt|salty|pickle|namkeen|papad/i.test(d)) defaults.isHighSalt = true;

    return defaults;
}

// ─── Alcohol Parser ───────────────────────────────────────────────────────────

export function parseAlcohol(alcohol: string | undefined | null): { isUser: boolean; isHeavy: boolean } {
    if (!alcohol) return { isUser: false, isHeavy: false };
    const a = alcohol.toLowerCase().trim();

    // Onboarding enum: 'none', 'occasional', 'moderate', 'heavy'
    if (a === 'none' || a === 'never' || a === 'no') return { isUser: false, isHeavy: false };
    if (a === 'heavy' || a === 'daily' || a.includes('heavy') || a.includes('daily')) {
        return { isUser: true, isHeavy: true };
    }
    return { isUser: true, isHeavy: false }; // occasional or moderate
}

// ─── Sleep Parser ─────────────────────────────────────────────────────────────

export function parseSleep(sleepPattern: string | undefined | null): boolean {
    if (!sleepPattern) return false; // unknown → assume fine
    const s = sleepPattern.toLowerCase().trim();

    // Onboarding enum: '< 5h', '5-6h', '6-7h', '7-8h', '> 8h'
    if (s.includes('< 5') || s.includes('<5') || s === '< 5h') return true;
    if (s.includes('5-6') || s === '5-6h') return true;

    // Free text
    const hours = parseFloat(s.replace(/[^0-9.]/g, ''));
    if (!isNaN(hours) && hours > 0 && hours < 6) return true;

    if (/insomnia|poor|bad|disturb|less/i.test(s)) return true;

    return false;
}

// ─── Exercise Parser ──────────────────────────────────────────────────────────

export function parseExercise(exercise: string | undefined | null): { isSedentary: boolean; isVigorous: boolean } {
    if (!exercise) return { isSedentary: false, isVigorous: false };
    const e = exercise.toLowerCase().trim();

    // Onboarding enum: 'none', 'light', 'moderate', 'intense'
    if (e === 'none' || e === 'sedentary' || e === 'never' || e === 'no') return { isSedentary: true, isVigorous: false };
    if (e === 'light') return { isSedentary: false, isVigorous: false }; // not sedentary but not vigorous
    if (e === 'intense' || e === 'vigorous' || e === 'highly_active' || e.includes('daily gym') || e.includes('athlete')) {
        return { isSedentary: false, isVigorous: true };
    }
    return { isSedentary: false, isVigorous: false }; // moderate
}

// ─── Medication Flag Parser ───────────────────────────────────────────────────

const MED_FLAG_PATTERNS: Record<keyof MedicationFlags, RegExp> = {
    onSteroids:            /predniso|wysolone|deflazacort|dexa|methyl\s?pred|cortisol|steroid|betamethasone|omnacortil/i,
    onImmunosuppressants:  /cyclosporin|tacrolimus|azathioprine|mycophenol|methotrexate|imuran|cellcept/i,
    onAntidepressants:     /escitalopram|nexito|fluoxetin|sertralin|paroxetin|venlafaxin|duloxetin|amitriptylin|ssri|snri/i,
    onAnticoagulants:      /warfarin|acenocoumarol|acitrom|heparin|rivaroxaban|apixaban|dabigatran|enoxaparin/i,
    onInsulin:             /insulin|lantus|novorapid|humalog|mixtard|actrapid|tresiba/i,
    onThyroidMeds:         /thyronorm|thyrox|eltroxin|levothyrox|thyroid/i,
    onStatins:             /atorvastat|rosuvastat|statin|ecosprin av|crestor|lipitor|simvastat|pravas/i,
    onAntihypertensives:   /amlodipin|telmisartan|losartan|enalapril|ramipril|metoprolol|atenolol|olmesartan|amlokind/i,
};

export function parseMedicationFlags(
    medications: string | string[] | undefined | null
): MedicationFlags {
    const defaults: MedicationFlags = {
        onSteroids: false, onImmunosuppressants: false, onAntidepressants: false,
        onAnticoagulants: false, onInsulin: false, onThyroidMeds: false,
        onStatins: false, onAntihypertensives: false,
    };

    if (!medications) return defaults;
    const text = (Array.isArray(medications) ? medications.join(' ') : String(medications)).toLowerCase();
    if (!text.trim()) return defaults;

    for (const [key, pattern] of Object.entries(MED_FLAG_PATTERNS)) {
        if (pattern.test(text)) {
            defaults[key as keyof MedicationFlags] = true;
        }
    }

    return defaults;
}

// ─── Comorbidity Parser ───────────────────────────────────────────────────────

function parseConditionFlags(conditions: string[] | undefined | null): {
    hasThyroid: boolean;
    hasPCOS: boolean;
    hasAnemia: boolean;
    hasAsthma: boolean;
    hasCKD: boolean;
    hasDepression: boolean;
    hasLiverDisease: boolean;
    hasAutoimmune: boolean;
    hasGout: boolean;
    hasEpilepsy: boolean;
} {
    const text = (conditions || []).join(' ').toLowerCase();
    return {
        hasThyroid:      /thyroid|hypothyroid|hyperthyroid/i.test(text),
        hasPCOS:         /pcos|polycystic/i.test(text),
        hasAnemia:       /anemia|anaemia/i.test(text),
        hasAsthma:       /asthma/i.test(text),
        hasCKD:          /kidney|ckd|renal/i.test(text),
        hasDepression:   /depress|anxiety|mental/i.test(text),
        hasLiverDisease: /liver|hepat|cirrhosis|fatty liver/i.test(text),
        hasAutoimmune:   /lupus|rheumatoid|autoimmune|crohn|psoria/i.test(text),
        hasGout:         /gout|uric acid/i.test(text),
        hasEpilepsy:     /epilep|seizure|convuls/i.test(text),
    };
}

// ─── Phase 2: BMI Prior Adjustments (§4.1) ────────────────────────────────

/**
 * Returns a map of condition-category → alpha-multiplier adjustments
 * based on a patient’s BMI class. Used by the MCMC covariate system.
 *
 * @param bmi  Patient BMI (kg/m²).
 * @returns    Record of condition regex patterns to alpha multipliers.
 */
export function getBMIPriorAdjustments(bmi: number | null): Record<string, number> {
    if (bmi === null || isNaN(bmi) || bmi <= 0) return {};

    if (bmi < 18.5) {
        // Underweight: TB, anaemia, malnutrition, immune vulnerability
        return {
            'anemia|anaemia|iron_deficiency|b12': 2.0,
            'tuberculosis|tb|pulmonary':          2.0,
            'malnutrition|electrolyte':           2.5,
            'depress|anxiety':                    1.5,
        };
    }
    if (bmi < 25) {
        // Normal weight: no major adjustments
        return {};
    }
    if (bmi < 30) {
        // Overweight (BMI 25–29.9): mild metabolic risk
        return {
            'diabetes|t2dm|metabolic':            1.5,
            'hypertens|blood_pressure':           1.3,
            'sleep_apnea|osa':                    1.5,
            'gerd|acid_reflux':                   1.3,
        };
    }
    if (bmi < 35) {
        // Obese Class I (BMI 30–34.9)
        return {
            'diabetes|t2dm|metabolic':            2.5,
            'hypertens|cardiovascular|cardiac':   2.0,
            'sleep_apnea|osa':                    3.0,
            'osteoarthritis|joint|knee':          2.0,
            'gerd|fatty_liver|nafld':             2.0,
        };
    }
    if (bmi < 40) {
        // Obese Class II (BMI 35–39.9)
        return {
            'diabetes|t2dm|metabolic':            3.0,
            'hypertens|cardiovascular|cardiac':   2.5,
            'sleep_apnea|osa':                    3.5,
            'osteoarthritis|joint|knee':          2.5,
            'gerd|fatty_liver|nafld':             2.5,
            'dvt|pulmonary_embolism':             2.0,
        };
    }
    // Obese Class III (BMI ≥ 40) — morbid obesity
    return {
        'diabetes|t2dm|metabolic':                3.5,
        'hypertens|cardiovascular|cardiac':       3.0,
        'sleep_apnea|osa':                        4.0,
        'osteoarthritis|joint|knee':              3.0,
        'gerd|fatty_liver|nafld|liver':           3.0,
        'dvt|pulmonary_embolism':                 2.5,
        'renal|kidney|ckd':                       2.0,
    };
}

/**
 * Returns the WHO BMI class label for a given BMI value.
 */
export function getBMIClass(bmi: number | null): PersonaProfile['bmiClass'] {
    if (bmi === null || isNaN(bmi) || bmi <= 0) return 'unknown';
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25.0) return 'normal';
    if (bmi < 30.0) return 'overweight';
    if (bmi < 35.0) return 'obese_I';
    if (bmi < 40.0) return 'obese_II';
    return 'obese_III';
}

// ─── Phase 2: Polypharmacy Risk Score (§4.2) ────────────────────────────

/**
 * Calculates polypharmacy risk tier based on medication count.
 *
 * Tiers follow WHO/clinical definitions:
 *   0–2 meds  → none
 *   3–4 meds  → low
 *   5–6 meds  → moderate   (standard polypharmacy threshold)
 *   7–9 meds  → high
 *   10+ meds  → critical   (hyperpolypharmacy)
 *
 * @param medicationCount  Number of active medications.
 */
export function calculatePolypharmacyRisk(
    medicationCount: number
): PersonaProfile['polypharmacyRisk'] {
    if (medicationCount <= 0) return 'none';
    if (medicationCount <= 2) return 'none';
    if (medicationCount <= 4) return 'low';
    if (medicationCount <= 6) return 'moderate';
    if (medicationCount <= 9) return 'high';
    return 'critical';
}

// ─── Phase 2: Frailty Index (§4.4) ─────────────────────────────────────

/**
 * Computes a composite frailty index (0–10 scale) from patient persona.
 *
 * Based on a simplified Clinical Frailty Scale:
 *   0–2  = robust / fit
 *   3–4  = pre-frail
 *   5–6  = mildly frail
 *   7–8  = moderately frail
 *   9–10 = severely frail
 *
 * Each deficit domain contributes 1 point unless annotated otherwise.
 *
 * @param persona  A fully built PersonaProfile.
 * @param age      Patient age in years (required for age-based weighting).
 */
export function computeFrailtyIndex(persona: PersonaProfile, age: number | null): number {
    let score = 0;

    // Age-based vulnerability weighting
    const ageNum = age ?? 0;
    if (ageNum >= 85) score += 3;
    else if (ageNum >= 75) score += 2;
    else if (ageNum >= 65) score += 1;

    // Physical function deficits
    if (persona.isSedentary)           score += 1;
    if (persona.hasLowSleep)           score += 0.5;

    // Chronic disease burden (each comorbidity = 0.5 point)
    if (persona.hasThyroid)            score += 0.5;
    if (persona.hasCKD)                score += 1;   // CKD has outsized frailty impact
    if (persona.hasLiverDisease)       score += 0.5;
    if (persona.hasAnemia)             score += 0.5;
    if (persona.hasDepression)         score += 0.5;
    if (persona.hasAutoimmune)         score += 0.5;
    if (persona.hasEpilepsy)           score += 0.5;

    // Nutritional / metabolic
    if (persona.isUnderweight)         score += 1;
    if (persona.bmiClass === 'obese_III') score += 0.5;

    // Polypharmacy burden
    if (persona.polypharmacyRisk === 'high')     score += 1;
    if (persona.polypharmacyRisk === 'critical') score += 1.5;

    // Medication-derived deficits
    if (persona.medicationFlags.onSteroids)        score += 0.5;
    if (persona.medicationFlags.onImmunosuppressants) score += 1;
    if (persona.medicationFlags.onAnticoagulants)  score += 0.5;

    // Alcohol / social risk
    if (persona.isHeavyDrinker)        score += 0.5;

    return Math.min(Math.round(score * 10) / 10, 10); // cap at 10
}

// ─── Master Persona Builder ───────────────────────────────────────────────────

/**
 * Build a full PersonaProfile from raw onboarding data.
 * This is the single entry point used by extractEvidence().
 *
 * Accepts the shape of `user_metadata.medical_profile` from Supabase,
 * which has nested `lifestyle.*` and `vitals.*` objects.
 */
export function buildPersonaProfile(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    medicalProfile: Record<string, any> | undefined | null,
    // Top-level user_metadata fallbacks (age, gender from server)
    topLevel?: { age?: string | number; gender?: string; weight?: string | number; height?: string | number }
): PersonaProfile {
    if (!medicalProfile && !topLevel) {
        return getEmptyPersonaProfile();
    }

    const mp = medicalProfile || {};
    const lifestyle = mp.lifestyle || {};
    const vitals = mp.vitals || {};

    // Priority: vitals > topLevel > mp flat fields (backward compat)
    const weight = vitals.weight || topLevel?.weight || mp.weight;
    const height = vitals.height || topLevel?.height || mp.height;
    const bmi = computeBMI(weight, height);

    const alcohol = parseAlcohol(lifestyle.alcohol || mp.alcohol);
    const exercise = parseExercise(lifestyle.exercise || mp.exercise);
    const sleep = parseSleep(lifestyle.sleepPattern || lifestyle.sleep_pattern || mp.sleepPattern || mp.sleep_hours);
    const familyHistory = parseFamilyHistory(mp.familyHistory || mp.family_history);
    const occupation = parseOccupationRisk(lifestyle.occupation || mp.occupation);
    const dietRisk = parseDietRisk(lifestyle.diet || mp.diet);
    const medicationFlags = parseMedicationFlags(mp.medications);
    const conditionFlags = parseConditionFlags(mp.conditions);

    // Count medications
    let medicationCount = 0;
    if (Array.isArray(mp.medicationList)) medicationCount = mp.medicationList.filter(Boolean).length;
    else if (Array.isArray(mp.medications)) medicationCount = mp.medications.filter(Boolean).length;
    else if (typeof mp.medications === 'string' && mp.medications) {
        medicationCount = mp.medications.split(',').filter((s: string) => s.trim()).length;
    }

    const bmiClass = getBMIClass(bmi);
    const polypharmacyRisk = calculatePolypharmacyRisk(medicationCount);

    // Need partial profile to compute frailty — build it first then call computeFrailtyIndex
    const partialProfile: PersonaProfile = {
        bmi,
        isObese: bmi !== null && bmi >= 30,
        isUnderweight: bmi !== null && bmi < 18.5,
        isOverweight: bmi !== null && bmi >= 25 && bmi < 30,
        isAlcoholUser: alcohol.isUser,
        isHeavyDrinker: alcohol.isHeavy,
        isSedentary: exercise.isSedentary,
        isVigorousExercise: exercise.isVigorous,
        hasLowSleep: sleep,
        familyHistory,
        occupation,
        dietRisk,
        medicationFlags,
        ...conditionFlags,
        bmiClass,
        polypharmacyRisk,
        frailtyIndex: 0,     // placeholder — computed below
        medicationCount,
    };

    const ageNum = (() => {
        const raw = vitals.age ?? topLevel?.age ?? mp.age;
        if (!raw) return null;
        const n = parseInt(String(raw), 10);
        return isNaN(n) ? null : n;
    })();

    partialProfile.frailtyIndex = computeFrailtyIndex(partialProfile, ageNum);

    return partialProfile;
}

function getEmptyPersonaProfile(): PersonaProfile {
    return {
        bmi: null,
        isObese: false,
        isUnderweight: false,
        isOverweight: false,
        isAlcoholUser: false,
        isHeavyDrinker: false,
        isSedentary: false,
        isVigorousExercise: false,
        hasLowSleep: false,
        familyHistory: parseFamilyHistory(null),
        occupation: 'unknown',
        dietRisk: parseDietRisk(null),
        medicationFlags: parseMedicationFlags(null),
        hasThyroid: false,
        hasPCOS: false,
        hasAnemia: false,
        hasAsthma: false,
        hasCKD: false,
        hasDepression: false,
        hasLiverDisease: false,
        hasAutoimmune: false,
        hasGout: false,
        hasEpilepsy: false,
        bmiClass: 'unknown',
        polypharmacyRisk: 'none',
        frailtyIndex: 0,
        medicationCount: 0,
    };
}
