/**
 * MedicationIntelligence — v1 (Goal 3: Medication-Aware Reasoning)
 *
 * Integrates medication context into the diagnostic reasoning pipeline.
 * Detects when patient symptoms may be medication side effects rather than
 * disease, identifies masking effects, and provides score adjustments.
 *
 * Data sourced from: RxNorm, MedlinePlus, MIMIC-IV medication records
 *
 * AUGMENTS existing DDI module — does NOT replace it.
 * DDI handles remedy safety; this module handles diagnostic reasoning.
 */

import type {
    MedicationSideEffectProfile,
    MedicationReasoningResult,
    IntelligenceContext,
} from './intelligenceTypes';
import { fetchDrugProfiles } from '../rxnorm/client';
import type { DrugProfile } from '../rxnorm/client';

// ═══════════════════════════════════════════════════════════════════════════════
// MEDICATION SIDE-EFFECT PROFILES (from RxNorm + MedlinePlus + MIMIC-IV)
// ═══════════════════════════════════════════════════════════════════════════════

const MEDICATION_PROFILES: MedicationSideEffectProfile[] = [
    // ── CARDIOVASCULAR MEDICATIONS ──────────────────────────────────────────
    {
        medicationPattern: /atorvastat|rosuvastat|simvastat|pravas|statin|lipitor|crestor/i,
        canonicalName: "Statins (HMG-CoA Reductase Inhibitors)",
        drugClass: "statins",
        commonSideEffects: [
            { symptom: "muscle_pain", frequency: "common", attributableFraction: 0.15 },
            { symptom: "fatigue", frequency: "common", attributableFraction: 0.08 },
            { symptom: "headache", frequency: "common", attributableFraction: 0.05 },
            { symptom: "nausea", frequency: "uncommon", attributableFraction: 0.03 },
            { symptom: "joint_pain", frequency: "common", attributableFraction: 0.06 },
        ],
        seriousSideEffects: [
            { symptom: "rhabdomyolysis", urgency: "immediate", alert: "⚠️ Severe muscle pain + dark urine on statin → suspect rhabdomyolysis → CK level STAT" },
            { symptom: "hepatotoxicity", urgency: "urgent", alert: "⚠️ Jaundice/RUQ pain on statin → check LFTs" },
        ],
        maskingEffects: [
            { conditionId: "fibromyalgia", effect: "mimics", explanation: "Statin myopathy can mimic fibromyalgia-like diffuse muscle pain" },
            { conditionId: "polymyalgia_rheumatica", effect: "mimics", explanation: "Statin-related proximal myopathy can mimic PMR" },
        ],
    },
    {
        medicationPattern: /amlodipin|nifedipin|diltiazem|verapamil|ccb/i,
        canonicalName: "Calcium Channel Blockers",
        drugClass: "ccb",
        commonSideEffects: [
            { symptom: "ankle_swelling", frequency: "very_common", attributableFraction: 0.25 },
            { symptom: "headache", frequency: "common", attributableFraction: 0.10 },
            { symptom: "dizziness", frequency: "common", attributableFraction: 0.08 },
            { symptom: "flushing", frequency: "common", attributableFraction: 0.10 },
            { symptom: "constipation", frequency: "common", attributableFraction: 0.12 },
        ],
        seriousSideEffects: [],
        maskingEffects: [
            { conditionId: "dvt", effect: "masks", explanation: "CCB-induced pedal edema can mask unilateral DVT swelling" },
            { conditionId: "heart_failure", effect: "masks", explanation: "Edema from CCB may be confused with early HF decompensation" },
        ],
    },
    {
        medicationPattern: /metoprolol|atenolol|propranolol|bisoprolol|carvedilol|beta.?blocker/i,
        canonicalName: "Beta-Blockers",
        drugClass: "beta_blocker",
        commonSideEffects: [
            { symptom: "fatigue", frequency: "very_common", attributableFraction: 0.20 },
            { symptom: "dizziness", frequency: "common", attributableFraction: 0.10 },
            { symptom: "cold_extremities", frequency: "common", attributableFraction: 0.08 },
            { symptom: "insomnia", frequency: "uncommon", attributableFraction: 0.05 },
            { symptom: "depression", frequency: "uncommon", attributableFraction: 0.04 },
        ],
        seriousSideEffects: [
            { symptom: "severe_bradycardia", urgency: "immediate", alert: "⚠️ HR <50 + symptomatic on beta-blocker → hold dose, seek evaluation" },
            { symptom: "bronchospasm", urgency: "urgent", alert: "⚠️ New wheezing on beta-blocker in asthmatic → may trigger bronchospasm" },
        ],
        maskingEffects: [
            { conditionId: "hyperthyroidism", effect: "masks", explanation: "Beta-blockers mask tachycardia and tremor of thyrotoxicosis" },
            { conditionId: "hypoglycemia", effect: "masks", explanation: "Beta-blockers mask adrenergic symptoms of hypoglycemia (tremor, tachycardia)" },
        ],
    },
    {
        medicationPattern: /losartan|telmisartan|valsartan|olmesartan|irbesartan|arb/i,
        canonicalName: "ARBs (Angiotensin II Receptor Blockers)",
        drugClass: "arb",
        commonSideEffects: [
            { symptom: "dizziness", frequency: "common", attributableFraction: 0.08 },
            { symptom: "hyperkalemia", frequency: "uncommon", attributableFraction: 0.05 },
        ],
        seriousSideEffects: [
            { symptom: "angioedema", urgency: "immediate", alert: "⚠️ Facial/lip swelling on ARB → angioedema risk → stop drug, ER evaluation" },
        ],
        maskingEffects: [],
    },

    // ── PSYCHIATRIC MEDICATIONS ─────────────────────────────────────────────
    {
        medicationPattern: /escitalopram|sertralin|fluoxetin|paroxetin|citalopram|ssri|nexito/i,
        canonicalName: "SSRIs (Selective Serotonin Reuptake Inhibitors)",
        drugClass: "ssri",
        commonSideEffects: [
            { symptom: "nausea", frequency: "very_common", attributableFraction: 0.20 },
            { symptom: "headache", frequency: "common", attributableFraction: 0.10 },
            { symptom: "insomnia", frequency: "common", attributableFraction: 0.12 },
            { symptom: "dizziness", frequency: "common", attributableFraction: 0.08 },
            { symptom: "fatigue", frequency: "common", attributableFraction: 0.10 },
            { symptom: "sexual_dysfunction", frequency: "very_common", attributableFraction: 0.30 },
            { symptom: "weight_gain", frequency: "common", attributableFraction: 0.08 },
            { symptom: "tremor", frequency: "uncommon", attributableFraction: 0.04 },
        ],
        seriousSideEffects: [
            { symptom: "serotonin_syndrome", urgency: "immediate", alert: "⚠️ Agitation + clonus + hyperthermia on SSRI → serotonin syndrome → ER immediately" },
            { symptom: "hyponatremia", urgency: "urgent", alert: "⚠️ Confusion/weakness on SSRI (especially elderly) → check sodium (SIADH)" },
        ],
        maskingEffects: [
            { conditionId: "hypothyroidism", effect: "masks", explanation: "SSRI fatigue/weight gain may mask concurrent hypothyroidism" },
        ],
    },
    {
        medicationPattern: /venlafaxin|duloxetin|desvenlafaxin|snri/i,
        canonicalName: "SNRIs",
        drugClass: "snri",
        commonSideEffects: [
            { symptom: "nausea", frequency: "very_common", attributableFraction: 0.22 },
            { symptom: "headache", frequency: "common", attributableFraction: 0.10 },
            { symptom: "dizziness", frequency: "common", attributableFraction: 0.10 },
            { symptom: "sweating", frequency: "common", attributableFraction: 0.12 },
            { symptom: "hypertension", frequency: "uncommon", attributableFraction: 0.05 },
        ],
        seriousSideEffects: [
            { symptom: "serotonin_syndrome", urgency: "immediate", alert: "⚠️ SNRI + serotonergic drug → serotonin syndrome risk" },
        ],
        maskingEffects: [],
    },

    // ── PAIN MEDICATIONS ────────────────────────────────────────────────────
    {
        medicationPattern: /ibuprofen|naproxen|diclofenac|nsaid|advil|voltaren|combiflam/i,
        canonicalName: "NSAIDs",
        drugClass: "nsaid",
        commonSideEffects: [
            { symptom: "epigastric_pain", frequency: "common", attributableFraction: 0.15 },
            { symptom: "nausea", frequency: "common", attributableFraction: 0.08 },
            { symptom: "edema", frequency: "uncommon", attributableFraction: 0.05 },
            { symptom: "headache", frequency: "uncommon", attributableFraction: 0.04 },
        ],
        seriousSideEffects: [
            { symptom: "gi_bleeding", urgency: "immediate", alert: "⚠️ Black stool/hematemesis on NSAIDs → GI bleed → stop NSAID, ER" },
            { symptom: "acute_kidney_injury", urgency: "urgent", alert: "⚠️ Decreased urine + elevated creatinine on NSAID → AKI risk" },
        ],
        maskingEffects: [
            { conditionId: "infection", effect: "masks", explanation: "NSAIDs can suppress fever and mask signs of infection" },
            { conditionId: "appendicitis", effect: "masks", explanation: "Pain relief may mask peritoneal signs in early appendicitis" },
        ],
    },
    {
        medicationPattern: /gabapentin|pregabalin|lyrica/i,
        canonicalName: "Gabapentinoids",
        drugClass: "gabapentinoid",
        commonSideEffects: [
            { symptom: "dizziness", frequency: "very_common", attributableFraction: 0.25 },
            { symptom: "fatigue", frequency: "very_common", attributableFraction: 0.20 },
            { symptom: "peripheral_edema", frequency: "common", attributableFraction: 0.10 },
            { symptom: "weight_gain", frequency: "common", attributableFraction: 0.08 },
            { symptom: "blurred_vision", frequency: "common", attributableFraction: 0.06 },
        ],
        seriousSideEffects: [],
        maskingEffects: [],
    },

    // ── DIABETES MEDICATIONS ────────────────────────────────────────────────
    {
        medicationPattern: /metformin|glucophage/i,
        canonicalName: "Metformin",
        drugClass: "biguanide",
        commonSideEffects: [
            { symptom: "nausea", frequency: "very_common", attributableFraction: 0.20 },
            { symptom: "diarrhea", frequency: "very_common", attributableFraction: 0.25 },
            { symptom: "abdominal_pain", frequency: "common", attributableFraction: 0.10 },
            { symptom: "metallic_taste", frequency: "common", attributableFraction: 0.08 },
        ],
        seriousSideEffects: [
            { symptom: "lactic_acidosis", urgency: "immediate", alert: "⚠️ Tachypnea + confusion on metformin (esp. with renal impairment) → lactic acidosis → STOP metformin, ER" },
        ],
        maskingEffects: [],
    },
    {
        medicationPattern: /glimepir|gliclaz|glipiz|glibencl|sulfonylurea/i,
        canonicalName: "Sulfonylureas",
        drugClass: "sulfonylurea",
        commonSideEffects: [
            { symptom: "hypoglycemia", frequency: "common", attributableFraction: 0.15 },
            { symptom: "weight_gain", frequency: "common", attributableFraction: 0.10 },
            { symptom: "nausea", frequency: "uncommon", attributableFraction: 0.04 },
        ],
        seriousSideEffects: [
            { symptom: "severe_hypoglycemia", urgency: "immediate", alert: "⚠️ Confusion/sweating/tremor on sulfonylurea → check glucose immediately" },
        ],
        maskingEffects: [],
    },

    // ── STEROID MEDICATIONS ─────────────────────────────────────────────────
    {
        medicationPattern: /predniso|deflazacort|dexa|methyl.?pred|betameth|steroid|wysolone|omnacortil/i,
        canonicalName: "Corticosteroids",
        drugClass: "corticosteroid",
        commonSideEffects: [
            { symptom: "insomnia", frequency: "very_common", attributableFraction: 0.30 },
            { symptom: "weight_gain", frequency: "very_common", attributableFraction: 0.25 },
            { symptom: "mood_changes", frequency: "common", attributableFraction: 0.15 },
            { symptom: "hyperglycemia", frequency: "common", attributableFraction: 0.20 },
            { symptom: "increased_appetite", frequency: "very_common", attributableFraction: 0.25 },
            { symptom: "muscle_weakness", frequency: "common", attributableFraction: 0.08 },
            { symptom: "edema", frequency: "common", attributableFraction: 0.10 },
        ],
        seriousSideEffects: [
            { symptom: "adrenal_crisis", urgency: "immediate", alert: "⚠️ Abrupt steroid withdrawal → adrenal crisis risk → never stop suddenly" },
            { symptom: "avascular_necrosis", urgency: "urgent", alert: "⚠️ Hip/groin pain on chronic steroids → suspect AVN → MRI" },
        ],
        maskingEffects: [
            { conditionId: "infection", effect: "masks", explanation: "Steroids suppress fever and inflammatory markers, masking serious infections" },
            { conditionId: "cushings_syndrome", effect: "mimics", explanation: "Exogenous steroids cause iatrogenic Cushing's" },
        ],
    },

    // ── THYROID MEDICATIONS ──────────────────────────────────────────────────
    {
        medicationPattern: /levothyrox|thyronorm|thyrox|eltroxin/i,
        canonicalName: "Levothyroxine",
        drugClass: "thyroid_hormone",
        commonSideEffects: [
            { symptom: "palpitations", frequency: "common", attributableFraction: 0.10 },
            { symptom: "tremor", frequency: "common", attributableFraction: 0.08 },
            { symptom: "weight_loss", frequency: "uncommon", attributableFraction: 0.05 },
            { symptom: "insomnia", frequency: "common", attributableFraction: 0.08 },
            { symptom: "anxiety", frequency: "uncommon", attributableFraction: 0.05 },
        ],
        seriousSideEffects: [
            { symptom: "atrial_fibrillation", urgency: "urgent", alert: "⚠️ Palpitations + irregular pulse on levothyroxine → check TSH, possible over-replacement" },
        ],
        maskingEffects: [
            { conditionId: "hyperthyroidism", effect: "mimics", explanation: "Levothyroxine overreplacement mimics hyperthyroidism" },
        ],
    },

    // ── ANTICOAGULANTS ──────────────────────────────────────────────────────
    {
        medicationPattern: /warfarin|acenocoumarol|acitrom|rivaroxaban|apixaban|dabigatran|enoxaparin/i,
        canonicalName: "Anticoagulants",
        drugClass: "anticoagulant",
        commonSideEffects: [
            { symptom: "easy_bruising", frequency: "very_common", attributableFraction: 0.30 },
            { symptom: "nosebleed", frequency: "common", attributableFraction: 0.10 },
            { symptom: "gum_bleeding", frequency: "common", attributableFraction: 0.08 },
        ],
        seriousSideEffects: [
            { symptom: "major_bleeding", urgency: "immediate", alert: "⚠️ GI/intracranial bleed on anticoagulant → ER immediately, hold anticoagulant" },
            { symptom: "hematuria", urgency: "urgent", alert: "⚠️ Blood in urine on anticoagulant → may need dose adjustment + urology eval" },
        ],
        maskingEffects: [],
    },

    // ── PROTON PUMP INHIBITORS ──────────────────────────────────────────────
    {
        medicationPattern: /omeprazol|pantoprazol|esomeprazol|rabeprazol|lansoprazol|ppi/i,
        canonicalName: "Proton Pump Inhibitors",
        drugClass: "ppi",
        commonSideEffects: [
            { symptom: "headache", frequency: "common", attributableFraction: 0.05 },
            { symptom: "diarrhea", frequency: "common", attributableFraction: 0.05 },
            { symptom: "abdominal_pain", frequency: "uncommon", attributableFraction: 0.03 },
        ],
        seriousSideEffects: [
            { symptom: "c_diff_infection", urgency: "urgent", alert: "⚠️ New diarrhea (watery, >3/day) on long-term PPI → C. difficile risk" },
            { symptom: "hypomagnesemia", urgency: "urgent", alert: "⚠️ Muscle cramps/weakness on long-term PPI → check magnesium" },
        ],
        maskingEffects: [
            { conditionId: "gastric_cancer", effect: "masks", explanation: "PPIs can mask symptoms of gastric malignancy by reducing acid-related symptoms" },
        ],
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MEDICATION INTELLIGENCE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class MedicationIntelligenceEngine {
    private profiles: MedicationSideEffectProfile[];

    constructor() {
        this.profiles = MEDICATION_PROFILES;
    }

    /**
     * Async enrichment: fetches real RxNorm + OpenFDA adverse event data
     * for the user's medications and merges it with hardcoded profiles.
     *
     * Falls back gracefully to hardcoded profiles if API is unavailable.
     * Call this ONCE per session (results are cached in rxnorm/client.ts).
     */
    async enrichWithRealData(ctx: IntelligenceContext): Promise<{
        dataSource: 'rxnorm_openfda' | 'static_fallback';
        drugsResolved: string[];
        topSignals: Array<{ drug: string; symptom: string; reportCount: number; isSignal: boolean }>;
    }> {
        const medications = this.extractMedications(ctx);
        if (medications.length === 0) {
            return { dataSource: 'static_fallback', drugsResolved: [], topSignals: [] };
        }

        try {
            const profileMap: Map<string, DrugProfile> = await fetchDrugProfiles(medications);
            if (profileMap.size === 0) {
                return { dataSource: 'static_fallback', drugsResolved: [], topSignals: [] };
            }

            const topSignals: Array<{ drug: string; symptom: string; reportCount: number; isSignal: boolean }> = [];

            for (const [name, profile] of profileMap) {
                // Add real FDA signals on top of hardcoded profiles
                const signals = profile.topAdverseEvents
                    .filter(e => e.isSignal)
                    .slice(0, 5);

                for (const signal of signals) {
                    topSignals.push({
                        drug: profile.name,
                        symptom: signal.symptom,
                        reportCount: signal.count,
                        isSignal: true,
                    });

                    // Dynamically add to profiles if not already known
                    const existingProfile = this.profiles.find(p => p.medicationPattern.test(name));
                    if (existingProfile) {
                        const alreadyKnown = existingProfile.commonSideEffects.some(
                            se => se.symptom === signal.symptom
                        );
                        if (!alreadyKnown) {
                            existingProfile.commonSideEffects.push({
                                symptom: signal.symptom,
                                frequency: signal.count > 100 ? 'common' : 'uncommon',
                                attributableFraction: Math.min(signal.proportionalReportingRatio / 20, 0.3),
                            });
                        }
                    }
                }

                void name; // used via profileMap key
            }

            return {
                dataSource: 'rxnorm_openfda',
                drugsResolved: Array.from(profileMap.keys()),
                topSignals,
            };
        } catch {
            return { dataSource: 'static_fallback', drugsResolved: [], topSignals: [] };
        }
    }

    /**
     * Analyze how the patient's medications interact with their symptom presentation.
     * Returns potential side effects, masking alerts, and Bayesian score adjustments.
     */
    analyze(ctx: IntelligenceContext): MedicationReasoningResult {
        const medications = this.extractMedications(ctx);
        if (medications.length === 0) {
            return { potentialSideEffects: [], maskingAlerts: [], scoreAdjustments: [] };
        }

        const matchedProfiles = this.matchMedicationProfiles(medications);
        if (matchedProfiles.length === 0) {
            return { potentialSideEffects: [], maskingAlerts: [], scoreAdjustments: [] };
        }

        const potentialSideEffects = this.detectSideEffectSymptoms(matchedProfiles, ctx.symptomList);
        const maskingAlerts = this.detectMaskingEffects(matchedProfiles, ctx.bayesianCandidates);
        const scoreAdjustments = this.computeScoreAdjustments(matchedProfiles, ctx);

        return { potentialSideEffects, maskingAlerts, scoreAdjustments };
    }

    /**
     * Extract medication list from user profile
     */
    private extractMedications(ctx: IntelligenceContext): string[] {
        const meds = ctx.symptoms.userProfile?.medications;
        if (!meds) return [];
        if (Array.isArray(meds)) return meds;
        if (typeof meds === 'string') return meds.split(/[,;]/).map(m => m.trim()).filter(Boolean);
        return [];
    }

    /**
     * Match user's medications against known profiles
     */
    private matchMedicationProfiles(medications: string[]): MedicationSideEffectProfile[] {
        const medText = medications.join(' ').toLowerCase();
        return this.profiles.filter(p => p.medicationPattern.test(medText));
    }

    /**
     * Detect symptoms that may be medication side effects
     */
    private detectSideEffectSymptoms(
        profiles: MedicationSideEffectProfile[],
        userSymptoms: string[],
    ): MedicationReasoningResult['potentialSideEffects'] {
        const results: MedicationReasoningResult['potentialSideEffects'] = [];
        const normalizedSymptoms = new Set(userSymptoms.map(s => s.toLowerCase()));

        for (const profile of profiles) {
            for (const se of profile.commonSideEffects) {
                if (normalizedSymptoms.has(se.symptom.toLowerCase()) && se.attributableFraction >= 0.05) {
                    results.push({
                        symptom: se.symptom,
                        medication: profile.canonicalName,
                        attributableFraction: se.attributableFraction,
                        recommendation: se.attributableFraction >= 0.15
                            ? `Consider whether ${se.symptom.replace(/_/g, ' ')} could be a side effect of ${profile.canonicalName} (${(se.attributableFraction * 100).toFixed(0)}% attributable fraction)`
                            : `${se.symptom.replace(/_/g, ' ')} is a known but less common side effect of ${profile.canonicalName}`,
                    });
                }
            }
        }

        return results.sort((a, b) => b.attributableFraction - a.attributableFraction);
    }

    /**
     * Detect conditions that medications might be masking
     */
    private detectMaskingEffects(
        profiles: MedicationSideEffectProfile[],
        candidates: IntelligenceContext['bayesianCandidates'],
    ): MedicationReasoningResult['maskingAlerts'] {
        const results: MedicationReasoningResult['maskingAlerts'] = [];
        const candidateIds = new Set(candidates.map(c => c.conditionId));

        for (const profile of profiles) {
            for (const masking of profile.maskingEffects) {
                // Alert if the masked condition is in the differential OR if it's a dangerous mimic
                if (candidateIds.has(masking.conditionId) || masking.effect === 'masks') {
                    results.push({
                        medication: profile.canonicalName,
                        conditionId: masking.conditionId,
                        effect: masking.effect,
                        explanation: masking.explanation,
                    });
                }
            }
        }

        return results;
    }

    /**
     * Compute Bayesian score adjustments based on medication context.
     * If a symptom is likely a side effect, reduce the score for conditions
     * whose diagnosis heavily depends on that symptom.
     */
    private computeScoreAdjustments(
        profiles: MedicationSideEffectProfile[],
        ctx: IntelligenceContext,
    ): MedicationReasoningResult['scoreAdjustments'] {
        const adjustments: MedicationReasoningResult['scoreAdjustments'] = [];
        const normalizedSymptoms = new Set(ctx.symptomList.map(s => s.toLowerCase()));

        // Collect high-AF side-effect symptoms
        const sideEffectSymptoms = new Map<string, number>(); // symptom → max AF
        for (const profile of profiles) {
            for (const se of profile.commonSideEffects) {
                if (normalizedSymptoms.has(se.symptom.toLowerCase()) && se.attributableFraction >= 0.10) {
                    const existing = sideEffectSymptoms.get(se.symptom) || 0;
                    sideEffectSymptoms.set(se.symptom, Math.max(existing, se.attributableFraction));
                }
            }
        }

        if (sideEffectSymptoms.size === 0) return adjustments;

        // For each candidate condition, check if its matched keywords are dominated by side-effect symptoms
        for (const candidate of ctx.bayesianCandidates) {
            const matchedKeywords = candidate.matchedKeywords.map(k => k.toLowerCase());
            let sideEffectOverlap = 0;
            let totalSideEffectAF = 0;

            for (const keyword of matchedKeywords) {
                const af = sideEffectSymptoms.get(keyword);
                if (af) {
                    sideEffectOverlap++;
                    totalSideEffectAF += af;
                }
            }

            if (sideEffectOverlap > 0 && matchedKeywords.length > 0) {
                const overlapRatio = sideEffectOverlap / matchedKeywords.length;
                const avgAF = totalSideEffectAF / sideEffectOverlap;

                // Only adjust if a significant portion of evidence might be medication-driven
                if (overlapRatio >= 0.3 && avgAF >= 0.10) {
                    const reductionFactor = 1.0 - (overlapRatio * avgAF * 0.5); // Max 50% reduction
                    adjustments.push({
                        conditionId: candidate.conditionId,
                        factor: Math.max(reductionFactor, 0.5), // Never reduce below 50%
                        reason: `${(overlapRatio * 100).toFixed(0)}% of matched symptoms may be medication side effects (avg AF: ${(avgAF * 100).toFixed(0)}%)`,
                    });
                }
            }
        }

        return adjustments;
    }
}

export const medicationIntelligence = new MedicationIntelligenceEngine();
