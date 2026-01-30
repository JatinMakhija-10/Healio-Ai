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
