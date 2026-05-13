/**
 * Free Clinical Data Sources — Master Module
 *
 * All sources used are free, public domain, no credentials required:
 *
 *   Source                  | What it provides                          | Endpoint
 *   ─────────────────────────────────────────────────────────────────────────────
 *   RxNorm (NLM)            | Drug → RxCUI, drug classes                | rxnav.nlm.nih.gov
 *   OpenFDA Adverse Events  | Real FDA adverse event reports (millions) | api.fda.gov/drug/event
 *   OpenFDA Drug Labels     | Contraindications, BBW, drug interactions  | api.fda.gov/drug/label
 *   NCBI PubMed             | Rare disease case report abstracts        | eutils.ncbi.nlm.nih.gov
 *   ClinicalTrials.gov      | Condition profiles from eligibility criteria| clinicaltrials.gov/api/v2
 *   MedlinePlus Connect     | ICD-10 → patient health topics            | connect.medlineplus.gov
 *
 * Fallback strategy: every call is wrapped in try/catch.
 * If ALL external APIs are unavailable, the hardcoded static data remains.
 */

export type { FDADrugLabel, FDALabelCheckResult } from './openFDALabels';
export { fetchFDALabel, checkDrugSafety, batchCheckDrugSafety } from './openFDALabels';

export type { RareDiseaseEnrichment, PubMedArticle } from './pubmed';
export { enrichRareDiseaseFromPubMed, batchEnrichRareDiseases } from './pubmed';

export type { ConditionTrialProfile, ClinicalTrialSummary } from './clinicalTrials';
export { fetchConditionTrialProfile, batchFetchTrialProfiles } from './clinicalTrials';

export type { MedLinePlusHealthTopic, NLMDrugInfo } from './medlinePlus';
export {
    fetchHealthTopicByICD,
    fetchHealthTopicByName,
    fetchNLMDrugInfo,
    batchFetchHealthTopics,
} from './medlinePlus';

// Re-export RxNorm from its existing location
export type { DrugProfile, RxNormInteraction, OpenFDAAdverseEvent } from '../rxnorm/client';
export {
    resolveRxCUI,
    getDrugClasses,
    getRxNormInteractions,
    getOpenFDAAdverseEvents,
    fetchDrugProfile,
    fetchDrugProfiles,
} from '../rxnorm/client';

// ─── Composite Enrichment API ──────────────────────────────────────────────────

import { batchCheckDrugSafety } from './openFDALabels';
import { batchEnrichRareDiseases } from './pubmed';
import { batchFetchTrialProfiles } from './clinicalTrials';
import { batchFetchHealthTopics } from './medlinePlus';
import { fetchDrugProfiles } from '../rxnorm/client';

export interface DiagnosisSessionEnrichment {
    /** RxNorm + OpenFDA adverse events for user's medications */
    drugProfiles: Awaited<ReturnType<typeof fetchDrugProfiles>>;
    /** OpenFDA label safety checks for user's medications */
    drugSafetyChecks: Awaited<ReturnType<typeof batchCheckDrugSafety>>;
    /** PubMed enrichment for rare disease candidates */
    rareDisease: Awaited<ReturnType<typeof batchEnrichRareDiseases>>;
    /** ClinicalTrials.gov profiles for top diagnosis candidates */
    trialProfiles: Awaited<ReturnType<typeof batchFetchTrialProfiles>>;
    /** MedlinePlus topics for ICD codes */
    healthTopics: Awaited<ReturnType<typeof batchFetchHealthTopics>>;
    /** Data source availability report */
    availability: Record<string, boolean>;
}

/**
 * Run all free data sources for a diagnosis session in parallel.
 *
 * Each source is independently fault-tolerant.
 * Designed to be called once per diagnosis, results cached by each client.
 *
 * @param medications       User's medication list (for RxNorm + OpenFDA)
 * @param userConditions    User's known conditions (for DDI checks)
 * @param rareDiseaseNames  Names of rare diseases to enrich from PubMed
 * @param topConditionNames Top N candidate conditions (for ClinicalTrials)
 * @param icd10Codes        ICD codes of top candidates (for MedlinePlus)
 * @param isPregnant        Pregnancy flag for drug safety checks
 */
export async function enrichDiagnosisSession(params: {
    medications: string[];
    userConditions: string[];
    rareDiseaseNames: string[];
    topConditionNames: string[];
    icd10Codes: string[];
    isPregnant?: boolean;
}): Promise<DiagnosisSessionEnrichment> {
    const {
        medications,
        userConditions,
        rareDiseaseNames,
        topConditionNames,
        icd10Codes,
        isPregnant,
    } = params;

    const availability: Record<string, boolean> = {};

    // Run all sources in parallel — each has its own timeout + error handling
    const [drugProfiles, drugSafetyChecks, rareDisease, trialProfiles, healthTopics] =
        await Promise.all([
            // 1. RxNorm + OpenFDA adverse events
            medications.length > 0
                ? fetchDrugProfiles(medications)
                    .then(r => { availability['rxnorm_openfda'] = r.size > 0; return r; })
                    .catch(() => { availability['rxnorm_openfda'] = false; return new Map(); })
                : Promise.resolve(new Map()),

            // 2. OpenFDA Drug Labels (contraindications, BBW, interactions)
            medications.length > 0
                ? batchCheckDrugSafety(medications, userConditions, medications, isPregnant)
                    .then(r => { availability['openfda_labels'] = r.some(x => x.labelFound); return r; })
                    .catch(() => { availability['openfda_labels'] = false; return []; })
                : Promise.resolve([]),

            // 3. PubMed rare disease enrichment
            rareDiseaseNames.length > 0
                ? batchEnrichRareDiseases(rareDiseaseNames.slice(0, 3)) // limit to 3 to avoid rate limits
                    .then(r => { availability['pubmed'] = r.size > 0; return r; })
                    .catch(() => { availability['pubmed'] = false; return new Map(); })
                : Promise.resolve(new Map()),

            // 4. ClinicalTrials.gov condition profiles
            topConditionNames.length > 0
                ? batchFetchTrialProfiles(topConditionNames.slice(0, 3))
                    .then(r => { availability['clinical_trials'] = r.size > 0; return r; })
                    .catch(() => { availability['clinical_trials'] = false; return new Map(); })
                : Promise.resolve(new Map()),

            // 5. MedlinePlus health topics by ICD code
            icd10Codes.length > 0
                ? batchFetchHealthTopics(icd10Codes.slice(0, 3))
                    .then(r => { availability['medlineplus'] = r.size > 0; return r; })
                    .catch(() => { availability['medlineplus'] = false; return new Map(); })
                : Promise.resolve(new Map()),
        ]);

    return {
        drugProfiles,
        drugSafetyChecks,
        rareDisease,
        trialProfiles,
        healthTopics,
        availability,
    };
}
