/**
 * MultiModalReasoner — v1 (Goal 8: Multi-Modal Medical Reasoning)
 *
 * Detects cross-system symptom correlations — when symptoms from multiple
 * body systems co-occur, identifies conditions that span systems and
 * cascading pathology chains.
 *
 * AUGMENTS existing single-system diagnosis — does NOT replace it.
 */

import type {
    CrossSystemCorrelation,
    BodySystem,
    IntelligenceContext,
} from './intelligenceTypes';
import { CONDITION_SYSTEM_MAP } from './ClinicalKnowledgeBase';

// ═══════════════════════════════════════════════════════════════════════════════
// SYMPTOM → BODY SYSTEM MAPPING
// Used to classify patient symptoms by organ system
// ═══════════════════════════════════════════════════════════════════════════════

const SYMPTOM_SYSTEM_MAP: Record<string, BodySystem[]> = {
    // Cardiovascular
    chest_pain:          ['cardiovascular'],
    palpitations:        ['cardiovascular'],
    tachycardia:         ['cardiovascular'],
    bradycardia:         ['cardiovascular'],
    hypotension:         ['cardiovascular'],
    hypertension:        ['cardiovascular'],
    leg_edema:           ['cardiovascular'],
    syncope:             ['cardiovascular', 'neurological'],

    // Respiratory
    dyspnea:             ['respiratory'],
    shortness_of_breath: ['respiratory', 'cardiovascular'],
    cough:               ['respiratory'],
    wheezing:            ['respiratory'],
    hemoptysis:          ['respiratory'],
    pleuritic_pain:      ['respiratory'],

    // Neurological
    headache:            ['neurological'],
    dizziness:           ['neurological'],
    confusion:           ['neurological'],
    weakness:            ['neurological'],
    numbness:            ['neurological'],
    tingling:            ['neurological'],
    seizure:             ['neurological'],
    visual_disturbance:  ['neurological', 'ophthalmological'],
    slurred_speech:      ['neurological'],

    // Gastrointestinal
    nausea:              ['gastrointestinal'],
    vomiting:            ['gastrointestinal'],
    diarrhea:            ['gastrointestinal'],
    abdominal_pain:      ['gastrointestinal'],
    constipation:        ['gastrointestinal'],
    bloating:            ['gastrointestinal'],
    hematemesis:         ['gastrointestinal'],
    melena:              ['gastrointestinal'],

    // Musculoskeletal
    joint_pain:          ['musculoskeletal'],
    muscle_pain:         ['musculoskeletal'],
    back_pain:           ['musculoskeletal'],
    stiffness:           ['musculoskeletal'],
    swelling:            ['musculoskeletal', 'immunological'],

    // Endocrine
    weight_gain:         ['endocrine'],
    weight_loss:         ['endocrine', 'gastrointestinal'],
    fatigue:             ['endocrine'],
    excessive_thirst:    ['endocrine'],
    frequent_urination:  ['endocrine', 'renal'],
    heat_intolerance:    ['endocrine'],
    cold_intolerance:    ['endocrine'],

    // Renal
    oliguria:            ['renal'],
    hematuria:           ['renal'],
    flank_pain:          ['renal'],
    dysuria:             ['renal'],

    // Dermatological
    rash:                ['dermatological'],
    itching:             ['dermatological'],
    urticaria:           ['dermatological', 'immunological'],
    petechiae:           ['dermatological', 'hematological'],

    // Hematological
    easy_bruising:       ['hematological'],
    bleeding:            ['hematological'],
    pallor:              ['hematological'],

    // Immunological
    fever:               ['immunological'],
    lymphadenopathy:     ['immunological', 'hematological'],
    night_sweats:        ['immunological'],

    // Psychiatric
    anxiety:             ['psychiatric'],
    depression:          ['psychiatric'],
    insomnia:            ['psychiatric'],
    agitation:           ['psychiatric', 'neurological'],

    // ENT
    sore_throat:         ['ent'],
    ear_pain:            ['ent'],
    hoarseness:          ['ent'],
    tinnitus:            ['ent'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// KNOWN MULTI-SYSTEM PATHOLOGY CASCADES
// Patterns where one system's dysfunction cascades to others
// ═══════════════════════════════════════════════════════════════════════════════

interface PathologyCascade {
    name: string;
    triggerSystem: BodySystem;
    cascadeSystems: BodySystem[];
    conditionIds: string[];
    minSystems: number;
    clinicalNote: string;
}

const PATHOLOGY_CASCADES: PathologyCascade[] = [
    {
        name: "Cardiorenal Syndrome",
        triggerSystem: 'cardiovascular',
        cascadeSystems: ['renal'],
        conditionIds: ['heart_failure', 'acute_kidney_injury'],
        minSystems: 2,
        clinicalNote: "Heart failure → renal hypoperfusion → AKI; or renal failure → fluid overload → HF decompensation",
    },
    {
        name: "Hepatorenal Syndrome",
        triggerSystem: 'gastrointestinal',
        cascadeSystems: ['renal'],
        conditionIds: ['liver_failure', 'acute_kidney_injury'],
        minSystems: 2,
        clinicalNote: "Advanced liver disease → splanchnic vasodilation → renal vasoconstriction → AKI",
    },
    {
        name: "Sepsis Multi-Organ Dysfunction",
        triggerSystem: 'immunological',
        cascadeSystems: ['cardiovascular', 'respiratory', 'renal', 'neurological', 'hematological'],
        conditionIds: ['sepsis'],
        minSystems: 3,
        clinicalNote: "Infection → systemic inflammatory response → organ dysfunction cascade. Each additional organ increases mortality 15-20%",
    },
    {
        name: "Autoimmune Multi-System Involvement",
        triggerSystem: 'immunological',
        cascadeSystems: ['musculoskeletal', 'renal', 'dermatological', 'hematological'],
        conditionIds: ['sle_flare', 'vasculitis'],
        minSystems: 3,
        clinicalNote: "Autoimmune conditions frequently involve multiple organ systems — joints + skin + kidneys is classic SLE",
    },
    {
        name: "Diabetic Complications Cascade",
        triggerSystem: 'endocrine',
        cascadeSystems: ['cardiovascular', 'neurological', 'renal', 'ophthalmological'],
        conditionIds: ['diabetes', 'diabetic_ketoacidosis'],
        minSystems: 2,
        clinicalNote: "Uncontrolled diabetes → micro/macrovascular complications across multiple systems",
    },
    {
        name: "Thyrotoxic Crisis",
        triggerSystem: 'endocrine',
        cascadeSystems: ['cardiovascular', 'neurological', 'gastrointestinal'],
        conditionIds: ['thyroid_storm', 'hyperthyroidism'],
        minSystems: 2,
        clinicalNote: "Thyroid hormone excess → high-output cardiac failure + GI hypermotility + neuropsychiatric symptoms",
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-MODAL REASONER
// ═══════════════════════════════════════════════════════════════════════════════

export class MultiModalReasoner {

    /**
     * Analyze cross-system symptom correlations for the current patient.
     * Returns which body systems are involved and potential multi-system conditions.
     */
    analyze(ctx: IntelligenceContext): CrossSystemCorrelation | null {
        const systemProfile = this.classifySymptomsBySystem(ctx.symptomList);

        // Need at least 2 systems involved for cross-system analysis
        const involvedSystems = Object.entries(systemProfile)
            .filter(([, symptoms]) => symptoms.length > 0)
            .map(([system]) => system as BodySystem);

        if (involvedSystems.length < 2) return null;

        // Primary system = system with most symptoms
        const sorted = Object.entries(systemProfile)
            .filter(([, symptoms]) => symptoms.length > 0)
            .sort((a, b) => b[1].length - a[1].length);

        const primarySystem = sorted[0][0] as BodySystem;

        // Secondary systems
        const secondarySystems = sorted.slice(1).map(([system, symptoms]) => ({
            system: system as BodySystem,
            symptoms,
            correlationStrength: symptoms.length / ctx.symptomList.length,
        }));

        // Find multi-system conditions from candidates
        const multiSystemConditions = this.findMultiSystemConditions(
            ctx.bayesianCandidates, involvedSystems
        );

        // Check for pathology cascades
        const cascadeAlerts = this.detectCascades(involvedSystems);

        // Add cascade info to multiSystemConditions
        for (const cascade of cascadeAlerts) {
            for (const condId of cascade.conditionIds) {
                if (!multiSystemConditions.find(c => c.conditionId === condId)) {
                    multiSystemConditions.push({
                        conditionId: condId,
                        systemsInvolved: [cascade.triggerSystem, ...cascade.cascadeSystems],
                        evidenceStrength: 0.3, // Lower confidence for cascade-inferred
                    });
                }
            }
        }

        return {
            primarySystem,
            secondarySystems,
            multiSystemConditions,
        };
    }

    /**
     * Classify symptoms into body systems
     */
    private classifySymptomsBySystem(symptoms: string[]): Record<BodySystem, string[]> {
        const profile: Record<BodySystem, string[]> = {
            cardiovascular: [], respiratory: [], neurological: [],
            gastrointestinal: [], musculoskeletal: [], endocrine: [],
            renal: [], dermatological: [], hematological: [],
            immunological: [], psychiatric: [], ophthalmological: [],
            ent: [], reproductive: [],
        };

        for (const symptom of symptoms) {
            const normalized = symptom.toLowerCase().replace(/\s+/g, '_');
            const systems = SYMPTOM_SYSTEM_MAP[normalized];
            if (systems) {
                for (const system of systems) {
                    if (!profile[system].includes(symptom)) {
                        profile[system].push(symptom);
                    }
                }
            }
        }

        return profile;
    }

    /**
     * Find conditions in the candidate list that span multiple body systems
     */
    private findMultiSystemConditions(
        candidates: IntelligenceContext['bayesianCandidates'],
        involvedSystems: BodySystem[],
    ): CrossSystemCorrelation['multiSystemConditions'] {
        const results: CrossSystemCorrelation['multiSystemConditions'] = [];

        for (const candidate of candidates) {
            const conditionSystems = CONDITION_SYSTEM_MAP[candidate.conditionId] || [];
            const overlap = conditionSystems.filter(s => involvedSystems.includes(s));

            if (overlap.length >= 2) {
                results.push({
                    conditionId: candidate.conditionId,
                    systemsInvolved: overlap,
                    evidenceStrength: candidate.score / 100,
                });
            }
        }

        return results.sort((a, b) => b.evidenceStrength - a.evidenceStrength);
    }

    /**
     * Detect known pathology cascades based on involved systems
     */
    private detectCascades(involvedSystems: BodySystem[]): PathologyCascade[] {
        return PATHOLOGY_CASCADES.filter(cascade => {
            const hasTrigger = involvedSystems.includes(cascade.triggerSystem);
            const cascadeOverlap = cascade.cascadeSystems.filter(s => involvedSystems.includes(s));
            const totalMatched = (hasTrigger ? 1 : 0) + cascadeOverlap.length;
            return totalMatched >= cascade.minSystems;
        });
    }
}

export const multiModalReasoner = new MultiModalReasoner();
