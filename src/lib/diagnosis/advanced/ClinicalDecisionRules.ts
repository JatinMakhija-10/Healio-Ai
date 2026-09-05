/**
 * Clinical Decision Rules
 * 
 * Implements validated medical algorithms that have been clinically tested
 * and proven to improve diagnostic accuracy. These are evidence-based tools
 * used in emergency departments and clinical practice worldwide.
 * 
 * Each rule has been validated in medical literature with known sensitivity/
 * specificity, and some are even mandated by clinical guidelines.
 */

export interface ClinicalRule {
    name: string;
    purpose: string;
    sensitivity: number;  // True positive rate
    specificity: number;  // True negative rate
    reference: string;    // Medical literature citation
}

export interface RuleResult {
    rule: string;
    score: number;
    interpretation: string;
    recommendation: string;
    confidence: number;
    clinicalNote?: string;
}

export interface DemographicData {
    age?: string | number;
    cancer_treatment_recent?: boolean;
    hormonal_therapy?: boolean;
    birth_control?: boolean;
}

/**
 * Wells Score for Deep Vein Thrombosis (DVT)
 * Validated tool for DVT risk stratification
 */
export function wellsScoreDVT(symptoms: string[], demographics: DemographicData): RuleResult {
    let score = 0;
    const findings: string[] = [];

    // Active cancer (treatment ongoing or within 6 months)
    if (symptoms.includes('active_cancer') || symptoms.includes('cancer') || demographics.cancer_treatment_recent) {
        score += 1;
        findings.push('Active cancer (+1)');
    }

    // Paralysis, paresis, or recent plaster immobilization
    if (symptoms.includes('paralysis') || symptoms.includes('recent_cast')) {
        score += 1;
        findings.push('Immobilization (+1)');
    }

    // Recently bedridden >3 days or major surgery within 12 weeks
    if (symptoms.includes('bedridden') || symptoms.includes('recent_surgery')) {
        score += 1;
        findings.push('Recent immobilization/surgery (+1)');
    }

    // Localized tenderness along deep venous system
    if (symptoms.includes('calf_tenderness') || symptoms.includes('deep_vein_tenderness')) {
        score += 1;
        findings.push('Localized tenderness (+1)');
    }

    // Entire leg swollen
    if (symptoms.includes('leg_swelling_entire')) {
        score += 1;
        findings.push('Entire leg swollen (+1)');
    }

    // Calf swelling >3cm compared to asymptomatic leg
    if (symptoms.includes('calf_asymmetry')) {
        score += 1;
        findings.push('Calf asymmetry (+1)');
    }

    // Pitting edema (greater in symptomatic leg)
    if (symptoms.includes('pitting_edema')) {
        score += 1;
        findings.push('Pitting edema (+1)');
    }

    // Collateral superficial veins
    if (symptoms.includes('superficial_veins')) {
        score += 1;
        findings.push('Collateral veins (+1)');
    }

    // Alternative diagnosis as likely or more likely than DVT
    if (symptoms.includes('alternative_diagnosis_likely')) {
        score -= 2;
        findings.push('Alternative diagnosis likely (-2)');
    }

    // Interpretation
    let interpretation: string;
    let recommendation: string;
    let confidence: number;

    if (score >= 3) {
        interpretation = "DVT likely (high probability)";
        recommendation = "Compression ultrasonography recommended. If negative, consider D-dimer or serial ultrasounds.";
        confidence = 0.75; // ~75% have DVT
    } else if (score >= 1) {
        interpretation = "DVT possible (moderate probability)";
        recommendation = "D-dimer test recommended. If positive, proceed to ultrasound.";
        confidence = 0.17; // ~17% have DVT
    } else {
        interpretation = "DVT unlikely (low probability)";
        recommendation = "D-dimer test. If negative, DVT essentially ruled out (NPV 96%).";
        confidence = 0.05; // ~5% have DVT
    }

    return {
        rule: 'Wells Score for DVT',
        score,
        interpretation,
        recommendation,
        confidence,
        clinicalNote: findings.join(', ')
    };
}

/**
 * PERC Rule for Pulmonary Embolism
 * 8 criteria - if ALL are absent, PE can be ruled out without D-dimer
 */
export function percRulePE(symptoms: string[], demographics: DemographicData): RuleResult {
    const age = typeof demographics.age === 'string' ? parseInt(demographics.age) : (demographics.age || 30);
    const criteria = {
        age_over_50: age > 50,
        hr_over_100: symptoms.includes('heart_rate_over_100'),
        spo2_under_95: symptoms.includes('oxygen_saturation_low'),
        hemoptysis: symptoms.includes('coughing_blood'),
        estrogen_use: demographics.hormonal_therapy || demographics.birth_control,
        prior_dvt_pe: symptoms.includes('history_dvt') || symptoms.includes('history_pe'),
        recent_surgery: symptoms.includes('surgery_within_4weeks'),
        unilateral_leg_swelling: symptoms.includes('one_leg_swelling')
    };

     
    const failedCriteria = Object.entries(criteria).filter(([_, v]) => v);
    const allNegative = failedCriteria.length === 0;

    let interpretation: string;
    let recommendation: string;
    let confidence: number;

    if (allNegative) {
        interpretation = "PERC negative - PE extremely unlikely";
        recommendation = "No further testing needed. PE ruled out with 99.6% NPV.";
        confidence = 0.004; // <0.4% have PE when PERC negative
    } else {
        interpretation = "PERC positive - Cannot rule out PE";
        recommendation = `D-dimer recommended. Failed criteria: ${failedCriteria.map(([k]) => k).join(', ')}`;
        confidence = 0.15; // ~15% baseline PE prevalence
    }

    return {
        rule: 'PERC Rule for PE',
        score: failedCriteria.length,
        interpretation,
        recommendation,
        confidence,
        clinicalNote: allNegative
            ? 'All 8 PERC criteria negative'
            : `${failedCriteria.length}/8 criteria positive`
    };
}

/**
 * HEART Score for Chest Pain (Major Adverse Cardiac Events)
 * Validated tool for cardiac risk stratification in ED
 */
export function heartScore(symptoms: string[] & { troponin_level?: number }, demographics: DemographicData): RuleResult {
    let score = 0;
    const details: string[] = [];

    // History (0-2 points)
    if (symptoms.includes('high_risk_history')) {
        score += 2;
        details.push('High-risk history (+2)');
    } else if (symptoms.includes('moderate_risk_history')) {
        score += 1;
        details.push('Moderate-risk history (+1)');
    } else {
        details.push('Low-risk history (0)');
    }

    // EKG (0-2 points) - would need actual EKG results
    // Assuming we don't have EKG, use symptoms as proxy
    if (symptoms.includes('st_depression') || symptoms.includes('t_wave_inversion')) {
        score += 2;
        details.push('EKG abnormalities (+2)');
    } else if (symptoms.includes('nonspecific_ekg_changes')) {
        score += 1;
        details.push('Non-specific EKG changes (+1)');
    }

    const age = typeof demographics.age === 'string' ? parseInt(demographics.age) : (demographics.age || 30);

    if (age >= 65) {
        score += 2;
        details.push('Age ≥65 (+2)');
    } else if (age >= 45) {
        score += 1;
        details.push('Age 45-64 (+1)');
    }

    // Risk factors (0-2 points)
    const riskFactorCount = [
        symptoms.includes('hypertension'),
        symptoms.includes('hyperlipidemia'),
        symptoms.includes('diabetes'),
        symptoms.includes('smoking'),
        symptoms.includes('obesity'),
        symptoms.includes('family_history_cad')
    ].filter(Boolean).length;

    if (riskFactorCount >= 3) {
        score += 2;
        details.push('≥3 risk factors (+2)');
    } else if (riskFactorCount >= 1) {
        score += 1;
        details.push('1-2 risk factors (+1)');
    }

    // Troponin (0-2 points) - if available
    if (symptoms.troponin_level) {
        if (symptoms.troponin_level >= 3) {
            score += 2;
            details.push('Troponin ≥3x normal (+2)');
        } else if (symptoms.troponin_level >= 1) {
            score += 1;
            details.push('Troponin 1-3x normal (+1)');
        }
    }

    // Interpretation
    let interpretation: string;
    let recommendation: string;
    let confidence: number;

    if (score >= 7) {
        interpretation = "High risk (50-65% MACE at 6 weeks)";
        recommendation = "Admit for cardiology evaluation. Early invasive strategy.";
        confidence = 0.57;
    } else if (score >= 4) {
        interpretation = "Moderate risk (12-17% MACE at 6 weeks)";
        recommendation = "Observation unit. Serial troponins and stress test.";
        confidence = 0.145;
    } else {
        interpretation = "Low risk (1.7% MACE at 6 weeks)";
        recommendation = "Safe for early discharge with outpatient follow-up.";
        confidence = 0.017;
    }

    return {
        rule: 'HEART Score',
        score,
        interpretation,
        recommendation,
        confidence,
        clinicalNote: details.join('; ')
    };
}

/**
 * NEXUS Criteria for C-Spine Imaging
 * If ALL criteria met, C-spine imaging not needed (99.6% NPV)
 */
export function nexusCriteria(symptoms: string[]): RuleResult {
    const criteria = {
        no_midline_tenderness: !symptoms.includes('midline_tenderness'),
        no_focal_deficit: !symptoms.includes('focal_neurological_deficit'),
        normal_alertness: !symptoms.includes('altered_mental_status'),
        no_intoxication: !symptoms.includes('intoxicated'),
        no_distracting_injury: !symptoms.includes('painful_distracting_injury')
    };

    const allCriteriaMet = Object.values(criteria).every(v => v);
    const failedCriteria = Object.entries(criteria)
         
        .filter(([_, v]) => !v)
        .map(([k]) => k);

    if (allCriteriaMet) {
        return {
            rule: 'NEXUS C-Spine Criteria',
            score: 5,
            interpretation: "C-spine injury extremely unlikely",
            recommendation: "C-spine imaging NOT needed (99.6% NPV). Safe to clear C-spine clinically.",
            confidence: 0.004,
            clinicalNote: 'All 5 NEXUS criteria met'
        };
    } else {
        return {
            rule: 'NEXUS C-Spine Criteria',
            score: failedCriteria.length,
            interpretation: "Cannot rule out C-spine injury",
            recommendation: `C-spine imaging recommended. Failed: ${failedCriteria.join(', ')}`,
            confidence: 0.05,
            clinicalNote: `${failedCriteria.length} criteria not met`
        };
    }
}

/**
 * Ottawa Ankle Rules
 * Determines need for ankle X-ray
 */
export function ottawaAnkleRules(symptoms: string[], demographics: DemographicData = {}): RuleResult {
    // Ankle series needed if ANY of:
    const age = typeof demographics.age === 'string' ? parseInt(demographics.age) : (demographics.age || 30);
    const needsXray =
        (age >= 55) ||
        symptoms.includes('bone_tenderness_posterior_lateral_malleolus') ||
        symptoms.includes('bone_tenderness_posterior_medial_malleolus') ||
        symptoms.includes('unable_to_bear_weight_immediately') ||
        symptoms.includes('unable_to_bear_weight_ed_4steps');

    if (needsXray) {
        return {
            rule: 'Ottawa Ankle Rules',
            score: 1,
            interpretation: "Ankle X-ray indicated",
            recommendation: "Obtain ankle radiographs to rule out fracture",
            confidence: 0.15,
            clinicalNote: 'One or more Ottawa criteria met'
        };
    } else {
        return {
            rule: 'Ottawa Ankle Rules',
            score: 0,
            interpretation: "Ankle fracture highly unlikely",
            recommendation: "X-ray not needed (98.5% NPV). Treat as soft tissue injury.",
            confidence: 0.015,
            clinicalNote: 'No Ottawa criteria met - fracture ruled out'
        };
    }
}

/**
 * Clinical Decision Rules Manager
 * Coordinates application of all clinical rules
 */
export class ClinicalDecisionRules {
    /**
     * Apply all relevant clinical decision rules based on presenting symptoms
     */
    applyRules(symptoms: string[] & { troponin_level?: number }, demographics: DemographicData): RuleResult[] {
        const results: RuleResult[] = [];

        // Check which rules are applicable
        if (this.isDVTSuspected(symptoms)) {
            results.push(wellsScoreDVT(symptoms, demographics));
        }

        if (this.isPESuspected(symptoms)) {
            results.push(percRulePE(symptoms, demographics));
        }

        if (this.isCardiacChestPain(symptoms)) {
            results.push(heartScore(symptoms, demographics));
        }

        if (this.isSpineTrauma(symptoms)) {
            results.push(nexusCriteria(symptoms));
        }

        if (this.isAnkleInjury(symptoms)) {
            results.push(ottawaAnkleRules(symptoms));
        }

        return results;
    }

    private isDVTSuspected(symptoms: string[]): boolean {
        return symptoms.includes('leg_swelling') ||
            symptoms.includes('calf_pain') ||
            symptoms.includes('leg_pain');
    }

    private isPESuspected(symptoms: string[]): boolean {
        return symptoms.includes('shortness_of_breath') ||
            symptoms.includes('chest_pain') ||
            symptoms.includes('sudden_dyspnea');
    }

    private isCardiacChestPain(symptoms: string[]): boolean {
        return symptoms.includes('chest_pain') ||
            symptoms.includes('chest_discomfort');
    }

    private isSpineTrauma(symptoms: string[]): boolean {
        return symptoms.includes('neck_injury') ||
            symptoms.includes('neck_pain_trauma');
    }

    private isAnkleInjury(symptoms: string[]): boolean {
        return symptoms.includes('ankle_injury') ||
            symptoms.includes('ankle_pain_trauma');
    }
}

export const clinicalRules = new ClinicalDecisionRules();

// ═══════════════════════════════════════════════════════════════════════════════
// WELLS' CRITERIA DVT OVERRIDE (c1.md Part I, §I.2)
//
// Replaces the custom α-stacking multiplier approach for DVT risk with the
// validated Wells' Criteria scoring system. The output is a validated risk tier
// mapped to published post-test probabilities from the original Wells cohort,
// NOT a bespoke percentage the system invented.
//
// The MCMC engine is preserved for conditions WITHOUT an established decision
// rule, but DVT-specific scoring defers to Wells' when it fires.
// ═══════════════════════════════════════════════════════════════════════════════

export type WellsRiskTier = 'low' | 'moderate' | 'high';

export interface WellsOverrideResult {
    /** Whether the Wells' override was applied */
    applied: boolean;
    /** Wells' raw score */
    score: number;
    /** Risk tier derived from Wells' score thresholds */
    riskTier: WellsRiskTier;
    /**
     * Published post-test probability from the original Wells cohort.
     * This is a VALIDATED number, not a model-generated estimate.
     * Reference: Wells PS et al., Lancet 1997; 350: 1795–98
     */
    validatedProbability: number;
    /** Human-readable interpretation for the reasoning trace */
    interpretation: string;
    /** Clinical recommendation */
    recommendation: string;
    /** The full RuleResult from wellsScoreDVT */
    ruleResult: RuleResult;
}

/**
 * Maps a Wells' risk tier to the published post-test probability from
 * the original validation cohort.
 *
 * These are NOT custom numbers — they come from:
 *   Wells PS, Anderson DR, Bormanis J, et al.
 *   "Value of assessment of pretest probability of deep-vein thrombosis
 *    in clinical management." Lancet. 1997; 350(9094): 1795–1798.
 *
 * Low  (score ≤0):  ~5% DVT prevalence
 * Moderate (1–2):   ~17% DVT prevalence
 * High (≥3):        ~53% DVT prevalence
 */
export function wellsRiskToProbability(riskTier: WellsRiskTier): number {
    switch (riskTier) {
        case 'low':      return 0.05;   // ~5%
        case 'moderate': return 0.17;   // ~17%
        case 'high':     return 0.53;   // ~53%
    }
}

/**
 * Computes a Wells' Criteria override for DVT when DVT is clinically suspected.
 *
 * Returns a WellsOverrideResult with `applied: true` when DVT symptoms are
 * present, providing a validated risk tier and probability that should replace
 * the MCMC engine's custom DVT multiplier stack.
 *
 * Returns `applied: false` when DVT is not suspected (no leg/calf symptoms).
 *
 * @param symptoms     Normalized symptom list from extractSymptomList()
 * @param demographics Patient demographics (age, cancer status, etc.)
 */
export function computeWellsOverride(
    symptoms: string[],
    demographics: DemographicData = {}
): WellsOverrideResult {
    // Only apply when DVT is clinically suspected
    const dvtSuspected =
        symptoms.includes('leg_swelling') ||
        symptoms.includes('calf_pain') ||
        symptoms.includes('leg_pain') ||
        symptoms.includes('calf_tenderness') ||
        symptoms.includes('deep_vein_tenderness') ||
        symptoms.includes('leg_swelling_entire') ||
        symptoms.includes('calf_asymmetry') ||
        symptoms.includes('pitting_edema');

    if (!dvtSuspected) {
        return {
            applied: false,
            score: 0,
            riskTier: 'low',
            validatedProbability: 0,
            interpretation: 'DVT not suspected — Wells\' override not applied',
            recommendation: '',
            ruleResult: {
                rule: 'Wells Score for DVT',
                score: 0,
                interpretation: 'Not applicable',
                recommendation: '',
                confidence: 0,
            },
        };
    }

    // Run the validated Wells' scoring
    const ruleResult = wellsScoreDVT(symptoms, demographics);

    // Map score to risk tier
    const riskTier: WellsRiskTier =
        ruleResult.score >= 3 ? 'high' :
        ruleResult.score >= 1 ? 'moderate' :
        'low';

    const validatedProbability = wellsRiskToProbability(riskTier);

    return {
        applied: true,
        score: ruleResult.score,
        riskTier,
        validatedProbability,
        interpretation: ruleResult.interpretation,
        recommendation: ruleResult.recommendation,
        ruleResult,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED TYPES — Validated Clinical Calculator Results (c1.md §I.2 extension)
// ═══════════════════════════════════════════════════════════════════════════════

export type EvidenceGrade = 'A' | 'B' | 'C' | 'expert-consensus';
export type RiskTierLabel = 'low' | 'moderate' | 'high' | 'critical';

/**
 * Typed result returned by every validated clinical calculator.
 * validatedProbability is always sourced from published cohort data —
 * never an internally generated estimate.
 */
export interface ValidatedRuleResult {
    ruleName: string;
    score: number;
    riskTier: RiskTierLabel;
    validatedProbability: number;
    interpretation: string;
    recommendation: string;
    citation: string;
    evidenceGrade: EvidenceGrade;
    scoringBreakdown: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CURB-65 — Pneumonia Severity Index (c1.md §I.2)
//
// Reference: Lim WS et al., Thorax. 2003;58(5):377–382. PMID 12728155
//   Score ≤1 → Low       → ~1.5% 30-day mortality → outpatient
//   Score 2  → Moderate  → ~9.2%                  → short-stay/supervised
//   Score 3–4→ High      → ~22%                   → hospitalise
//   Score 5  → Critical  → ~57%                   → ICU consider
// ═══════════════════════════════════════════════════════════════════════════════

export interface CURB65Input {
    elevatedBUN: boolean;
    respiratoryRateHigh: boolean;
    lowBloodPressure: boolean;
    ageOver65: boolean;
    newConfusion: boolean;
}

export function calculateCURB65(input: CURB65Input): ValidatedRuleResult {
    const scoringBreakdown: string[] = [];
    let score = 0;

    if (input.newConfusion) { score += 1; scoringBreakdown.push('Confusion (+1)'); }
    if (input.elevatedBUN) { score += 1; scoringBreakdown.push('Elevated BUN/Urea (+1)'); }
    if (input.respiratoryRateHigh) { score += 1; scoringBreakdown.push('Respiratory rate ≥30/min (+1)'); }
    if (input.lowBloodPressure) { score += 1; scoringBreakdown.push('Low blood pressure (+1)'); }
    if (input.ageOver65) { score += 1; scoringBreakdown.push('Age ≥65 years (+1)'); }

    let riskTier: RiskTierLabel;
    let validatedProbability: number;
    let interpretation: string;
    let recommendation: string;

    if (score <= 1) {
        riskTier = 'low';
        validatedProbability = 0.015;
        interpretation = 'Low severity pneumonia (CURB-65 ≤1)';
        recommendation = 'Consider outpatient treatment. ~1.5% 30-day mortality. Follow up within 48 hours.';
    } else if (score === 2) {
        riskTier = 'moderate';
        validatedProbability = 0.092;
        interpretation = 'Moderate severity pneumonia (CURB-65 = 2)';
        recommendation = 'Consider short inpatient admission or closely supervised outpatient care.';
    } else if (score <= 4) {
        riskTier = 'high';
        validatedProbability = 0.22;
        interpretation = 'Severe pneumonia (CURB-65 3–4)';
        recommendation = 'Hospitalise. ~22% 30-day mortality. Consider IV antibiotics and supplemental oxygen.';
    } else {
        riskTier = 'critical';
        validatedProbability = 0.57;
        interpretation = 'Very severe pneumonia (CURB-65 = 5)';
        recommendation = 'Immediate hospitalisation. Consider ICU admission. ~57% 30-day mortality.';
    }

    return {
        ruleName: 'CURB-65 Pneumonia Severity Score',
        score,
        riskTier,
        validatedProbability,
        interpretation,
        recommendation,
        citation: 'Lim WS et al. Thorax. 2003;58(5):377-382. PMID 12728155',
        evidenceGrade: 'A',
        scoringBreakdown,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHA₂DS₂-VASc — Stroke Risk in Atrial Fibrillation (c1.md §I.2)
//
// Reference: Lip GY et al., Chest. 2010;137(2):263–272. PMID 19762550
//   Score 0  → ~0%   annual stroke risk
//   Score 1  → ~1.3% annual stroke risk — consider anticoagulation
//   Score ≥2 → ≥2.2% annual stroke risk — anticoagulation recommended
// ═══════════════════════════════════════════════════════════════════════════════

export interface CHA2DS2VAScInput {
    heartFailure: boolean;
    hypertension: boolean;
    ageOver75: boolean;
    age65to74: boolean;
    diabetes: boolean;
    priorStrokeOrTIA: boolean;
    vascularDisease: boolean;
    femaleSex: boolean;
}

export function calculateCHA2DS2VASc(input: CHA2DS2VAScInput): ValidatedRuleResult {
    const scoringBreakdown: string[] = [];
    let score = 0;

    if (input.heartFailure) { score += 1; scoringBreakdown.push('Heart failure (+1)'); }
    if (input.hypertension) { score += 1; scoringBreakdown.push('Hypertension (+1)'); }
    if (input.ageOver75) { score += 2; scoringBreakdown.push('Age ≥75 years (+2)'); }
    else if (input.age65to74) { score += 1; scoringBreakdown.push('Age 65–74 years (+1)'); }
    if (input.diabetes) { score += 1; scoringBreakdown.push('Diabetes mellitus (+1)'); }
    if (input.priorStrokeOrTIA) { score += 2; scoringBreakdown.push('Prior stroke/TIA (+2)'); }
    if (input.vascularDisease) { score += 1; scoringBreakdown.push('Vascular disease (+1)'); }
    if (input.femaleSex) { score += 1; scoringBreakdown.push('Female sex (+1)'); }

    // Annual stroke rates from Lip et al. 2010 Table 4
    const ANNUAL_STROKE_RISK: Record<number, number> = {
        0: 0.000, 1: 0.013, 2: 0.022, 3: 0.032,
        4: 0.040, 5: 0.068, 6: 0.094, 7: 0.098,
        8: 0.118, 9: 0.154,
    };
    const clampedScore = Math.min(score, 9);
    const validatedProbability = ANNUAL_STROKE_RISK[clampedScore] ?? 0.154;

    let riskTier: RiskTierLabel;
    let interpretation: string;
    let recommendation: string;

    if (score === 0) {
        riskTier = 'low';
        interpretation = 'Low stroke risk (CHA₂DS₂-VASc = 0)';
        recommendation = 'No antithrombotic therapy needed.';
    } else if (score === 1) {
        riskTier = 'moderate';
        interpretation = 'Borderline stroke risk (CHA₂DS₂-VASc = 1)';
        recommendation = 'Consider oral anticoagulation (OAC). Shared decision-making recommended. ~1.3% annual stroke risk.';
    } else {
        riskTier = 'high';
        interpretation = `Elevated stroke risk (CHA₂DS₂-VASc = ${score})`;
        recommendation = `Oral anticoagulation recommended — ~${(validatedProbability * 100).toFixed(1)}% annual stroke risk. Warfarin (INR 2–3) or NOAC preferred.`;
    }

    return {
        ruleName: 'CHA\u2082DS\u2082-VASc Stroke Risk Score (Atrial Fibrillation)',
        score,
        riskTier,
        validatedProbability,
        interpretation,
        recommendation,
        citation: 'Lip GY et al. Chest. 2010;137(2):263-272. PMID 19762550',
        evidenceGrade: 'A',
        scoringBreakdown,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CENTOR / McISAAC — Strep Pharyngitis Likelihood (c1.md §I.2)
//
// Reference: McIsaac WJ et al., CMAJ. 2000;163(7):811–815. PMID 11033707
//   Score ≤0 → ~1–2.5% → No testing, no antibiotics
//   Score 1  → ~5–10%  → No testing, no antibiotics
//   Score 2  → ~11–17% → Culture/rapid antigen test
//   Score 3  → ~28–35% → Culture/rapid antigen test
//   Score ≥4 → ~52%    → Empiric antibiotics reasonable
// ═══════════════════════════════════════════════════════════════════════════════

export interface CentorInput {
    tonsilllarExudates: boolean;
    tenderAnteriorLymphadenopathy: boolean;
    fever: boolean;
    coughAbsent: boolean;
    ageGroup: 'child' | 'adult' | 'older_adult';
}

export function calculateCentor(input: CentorInput): ValidatedRuleResult {
    const scoringBreakdown: string[] = [];
    let score = 0;

    if (input.tonsilllarExudates) { score += 1; scoringBreakdown.push('Tonsillar exudates (+1)'); }
    if (input.tenderAnteriorLymphadenopathy) { score += 1; scoringBreakdown.push('Tender anterior lymphadenopathy (+1)'); }
    if (input.fever) { score += 1; scoringBreakdown.push('Fever >38\u00b0C (+1)'); }
    if (input.coughAbsent) { score += 1; scoringBreakdown.push('Cough absent (+1)'); }

    if (input.ageGroup === 'child') {
        score += 1; scoringBreakdown.push('Age 3–14 years (+1)');
    } else if (input.ageGroup === 'older_adult') {
        score -= 1; scoringBreakdown.push('Age \u226545 years (\u22121)');
    } else {
        scoringBreakdown.push('Age 15–44 years (0)');
    }

    const STREP_PROBABILITY: Record<number, number> = {
        '-1': 0.010, 0: 0.025, 1: 0.075, 2: 0.140, 3: 0.315, 4: 0.520, 5: 0.520,
    };
    const clampedScore = Math.max(-1, Math.min(score, 5));
    const validatedProbability = STREP_PROBABILITY[clampedScore] ?? 0.025;

    let riskTier: RiskTierLabel;
    let interpretation: string;
    let recommendation: string;

    if (score <= 1) {
        riskTier = 'low';
        interpretation = `Low strep probability (Centor score ${score})`;
        recommendation = 'No throat culture or antibiotics needed. Supportive care.';
    } else if (score <= 3) {
        riskTier = 'moderate';
        interpretation = `Moderate strep probability (Centor score ${score})`;
        recommendation = `Throat culture or rapid antigen test (RADT) recommended (~${(validatedProbability * 100).toFixed(0)}% probability). Treat only if positive.`;
    } else {
        riskTier = 'high';
        interpretation = `High strep probability (Centor score ${score})`;
        recommendation = `Empiric antibiotics reasonable (~${(validatedProbability * 100).toFixed(0)}% probability). Penicillin V or amoxicillin first-line.`;
    }

    return {
        ruleName: 'Modified Centor (McIsaac) Score — Strep Pharyngitis',
        score,
        riskTier,
        validatedProbability,
        interpretation,
        recommendation,
        citation: 'McIsaac WJ et al. CMAJ. 2000;163(7):811-815. PMID 11033707',
        evidenceGrade: 'A',
        scoringBreakdown,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// qSOFA — Quick Sequential Organ Failure Assessment (Sepsis-3) (c1.md §I.2)
//
// Reference: Seymour CW et al., JAMA. 2016;315(8):801–810. PMID 26903335
//   Score 0  → ~3% in-hospital mortality
//   Score 1  → ~6% — monitor, reassess
//   Score ≥2 → ~24% — HIGH RISK, initiate sepsis protocol immediately
// ═══════════════════════════════════════════════════════════════════════════════

export interface QSOFAInput {
    alteredMentalStatus: boolean;
    respiratoryRateHigh: boolean;
    lowSystolicBP: boolean;
}

export function calculateQSOFA(input: QSOFAInput): ValidatedRuleResult {
    const scoringBreakdown: string[] = [];
    let score = 0;

    if (input.alteredMentalStatus) { score += 1; scoringBreakdown.push('Altered mental status (+1)'); }
    if (input.respiratoryRateHigh) { score += 1; scoringBreakdown.push('Respiratory rate \u226522/min (+1)'); }
    if (input.lowSystolicBP) { score += 1; scoringBreakdown.push('Systolic BP \u2264100 mmHg (+1)'); }

    // In-hospital mortality from Seymour et al. 2016 non-ICU validation cohort
    const MORTALITY: Record<number, number> = { 0: 0.03, 1: 0.06, 2: 0.24, 3: 0.40 };
    const validatedProbability = MORTALITY[Math.min(score, 3)] ?? 0.40;

    let riskTier: RiskTierLabel;
    let interpretation: string;
    let recommendation: string;

    if (score >= 2) {
        riskTier = 'critical';
        interpretation = `qSOFA positive — High sepsis mortality risk (score ${score}/3)`;
        recommendation = 'URGENT: Blood cultures x2, lactate, CBC, metabolic panel. Broad-spectrum antibiotics within 1 hour. ICU evaluation.';
    } else if (score === 1) {
        riskTier = 'moderate';
        interpretation = 'qSOFA borderline (1/3) — Monitor closely';
        recommendation = 'Reassess frequently. If clinical concern for infection persists or deteriorates, initiate sepsis protocol.';
    } else {
        riskTier = 'low';
        interpretation = 'qSOFA negative (0/3) — Low sepsis mortality risk';
        recommendation = 'Low mortality risk by qSOFA. Continue monitoring. Clinical judgment always takes precedence.';
    }

    return {
        ruleName: 'qSOFA — Quick SOFA Sepsis Bedside Screen',
        score,
        riskTier,
        validatedProbability,
        interpretation,
        recommendation,
        citation: 'Seymour CW et al. JAMA. 2016;315(8):801-810. PMID 26903335',
        evidenceGrade: 'A',
        scoringBreakdown,
    };
}
