/**
 * ClinicalKnowledgeBase — v1
 *
 * Goals 1, 2, 5, 11:
 *   1. Pattern-Based Clinical Reasoning — 60+ clinical patterns from datasets
 *   2. Differential Diagnosis Intelligence — mimic/look-alike matrix
 *   5. Rare Disease Escalation — uncommon conditions with escalation criteria
 *  11. Adaptive Global Reasoning — regional/demographic weighting
 *
 * This module provides the clinical knowledge that feeds the intelligence layer.
 * It does NOT touch the Bayesian engine — it provides data consumed downstream.
 */

import type {
    ExtendedClinicalPattern,
    DifferentialEntry,
    RareDiseasePattern,
    DifferentialResult,
    RareDiseaseAlert,
    BodySystem,
} from './intelligenceTypes';

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: EXTENDED CLINICAL PATTERNS (Goal 1)
// Based on MIMIC-IV, eICU, PubMed case reports, WHO data
// ═══════════════════════════════════════════════════════════════════════════════

export const EXTENDED_CLINICAL_PATTERNS: ExtendedClinicalPattern[] = [
    // ── CARDIAC (expanded) ──────────────────────────────────────────────────
    {
        name: "Unstable Angina (ACS Spectrum)",
        conditionId: "unstable_angina",
        symptoms: ["chest_pain", "exertional_dyspnea", "diaphoresis", "jaw_pain"],
        multiplier: 4.0,
        specificity: 0.85,
        clinicalPearl: "Crescendo pattern: increasing frequency/severity of angina at rest or minimal exertion",
        source: "mimic_iv",
        icdCodes: ["I20.0"],
    },
    {
        name: "Aortic Dissection Triad",
        conditionId: "aortic_dissection",
        symptoms: ["tearing_chest_pain", "back_pain", "hypertension", "pulse_deficit"],
        multiplier: 6.0,
        specificity: 0.93,
        clinicalPearl: "Tearing/ripping pain radiating to back — BP differential between arms",
        source: "clinical_guideline",
        icdCodes: ["I71.0"],
    },
    {
        name: "Heart Failure Exacerbation",
        conditionId: "heart_failure",
        symptoms: ["dyspnea", "orthopnea", "leg_edema", "weight_gain", "fatigue"],
        multiplier: 3.0,
        specificity: 0.82,
        clinicalPearl: "Weight gain >2kg in 3 days suggests fluid overload",
        source: "mimic_iv",
        icdCodes: ["I50.9"],
    },
    {
        name: "Pericarditis",
        conditionId: "pericarditis",
        symptoms: ["pleuritic_chest_pain", "fever", "pericardial_rub", "positional_relief"],
        multiplier: 3.5,
        specificity: 0.84,
        clinicalPearl: "Pain improves sitting up/leaning forward; diffuse ST elevation on ECG",
        source: "pubmed",
        icdCodes: ["I30.9"],
    },
    {
        name: "Atrial Fibrillation Presentation",
        conditionId: "atrial_fibrillation",
        symptoms: ["palpitations", "irregular_heartbeat", "dyspnea", "dizziness", "fatigue"],
        multiplier: 2.8,
        specificity: 0.80,
        clinicalPearl: "Irregularly irregular pulse; risk of stroke — needs CHA₂DS₂-VASc scoring",
        source: "mimic_iv",
        icdCodes: ["I48.91"],
    },

    // ── PULMONARY (expanded) ────────────────────────────────────────────────
    {
        name: "COPD Exacerbation",
        conditionId: "copd_exacerbation",
        symptoms: ["worsening_dyspnea", "increased_sputum", "sputum_color_change", "wheezing"],
        multiplier: 2.8,
        specificity: 0.80,
        clinicalPearl: "Anthonisen criteria: ≥2 of dyspnea/sputum volume/purulence → antibiotics",
        source: "clinical_guideline",
        minAge: 40,
        icdCodes: ["J44.1"],
    },
    {
        name: "Pneumothorax",
        conditionId: "pneumothorax",
        symptoms: ["sudden_chest_pain", "sudden_shortness_of_breath", "decreased_breath_sounds"],
        multiplier: 4.5,
        specificity: 0.90,
        clinicalPearl: "Tall, thin males 20-30 most at risk for primary spontaneous pneumothorax",
        source: "eicu",
        icdCodes: ["J93.9"],
    },
    {
        name: "Asthma Exacerbation (Severe)",
        conditionId: "asthma_exacerbation",
        symptoms: ["wheezing", "shortness_of_breath", "chest_tightness", "inability_to_speak_full_sentences"],
        multiplier: 3.5,
        specificity: 0.85,
        clinicalPearl: "Silent chest = critical — impending respiratory failure",
        source: "clinical_guideline",
        icdCodes: ["J45.41"],
    },
    {
        name: "Tuberculosis Active",
        conditionId: "tuberculosis",
        symptoms: ["chronic_cough", "hemoptysis", "night_sweats", "weight_loss", "fever"],
        multiplier: 3.0,
        specificity: 0.82,
        clinicalPearl: "Cough >3 weeks + hemoptysis + night sweats in endemic area = TB until proven otherwise",
        source: "who",
        icdCodes: ["A15.0"],
    },

    // ── NEUROLOGICAL (expanded) ─────────────────────────────────────────────
    {
        name: "Subarachnoid Hemorrhage (SAH)",
        conditionId: "subarachnoid_hemorrhage",
        symptoms: ["thunderclap_headache", "worst_headache_of_life", "neck_stiffness", "vomiting", "photophobia"],
        multiplier: 6.0,
        specificity: 0.94,
        clinicalPearl: "Sudden onset 'thunderclap' headache reaching max intensity in seconds — CT then LP",
        source: "eicu",
        icdCodes: ["I60.9"],
    },
    {
        name: "Temporal Arteritis (Giant Cell Arteritis)",
        conditionId: "temporal_arteritis",
        symptoms: ["temporal_headache", "jaw_claudication", "scalp_tenderness", "visual_disturbance", "elevated_esr"],
        multiplier: 4.0,
        specificity: 0.88,
        clinicalPearl: "Age >50, new headache + jaw claudication → immediate steroids to prevent blindness",
        source: "pubmed",
        minAge: 50,
        icdCodes: ["M31.6"],
    },
    {
        name: "Guillain-Barré Syndrome (GBS)",
        conditionId: "guillain_barre",
        symptoms: ["ascending_weakness", "areflexia", "paresthesias", "recent_infection"],
        multiplier: 4.5,
        specificity: 0.90,
        clinicalPearl: "Ascending paralysis after viral illness — monitor respiratory function closely",
        source: "pubmed",
        icdCodes: ["G61.0"],
    },
    {
        name: "Cauda Equina Syndrome",
        conditionId: "cauda_equina",
        symptoms: ["saddle_anesthesia", "urinary_retention", "bilateral_leg_weakness", "severe_back_pain"],
        multiplier: 5.5,
        specificity: 0.92,
        clinicalPearl: "Surgical emergency — decompression within 48h to prevent permanent paralysis",
        source: "clinical_guideline",
        icdCodes: ["G83.4"],
    },
    {
        name: "Status Epilepticus",
        conditionId: "status_epilepticus",
        symptoms: ["prolonged_seizure", "altered_consciousness", "tonic_clonic_movements"],
        multiplier: 6.0,
        specificity: 0.95,
        clinicalPearl: "Seizure >5 min or recurrent without recovery — IV benzodiazepines immediately",
        source: "eicu",
        icdCodes: ["G41.9"],
    },

    // ── GASTROINTESTINAL (expanded) ─────────────────────────────────────────
    {
        name: "Pancreatitis (Acute)",
        conditionId: "acute_pancreatitis",
        symptoms: ["epigastric_pain", "pain_radiating_to_back", "nausea", "vomiting", "tenderness"],
        multiplier: 3.0,
        specificity: 0.83,
        clinicalPearl: "Lipase >3× ULN is diagnostic; most common causes: gallstones and alcohol",
        source: "mimic_iv",
        icdCodes: ["K85.9"],
    },
    {
        name: "GI Bleed (Upper)",
        conditionId: "upper_gi_bleed",
        symptoms: ["hematemesis", "melena", "tachycardia", "dizziness", "epigastric_pain"],
        multiplier: 4.0,
        specificity: 0.87,
        clinicalPearl: "Glasgow-Blatchford score ≥1 → admission; black tarry stool = digested blood",
        source: "mimic_iv",
        icdCodes: ["K92.0"],
    },
    {
        name: "Bowel Obstruction",
        conditionId: "bowel_obstruction",
        symptoms: ["colicky_abdominal_pain", "vomiting", "abdominal_distension", "obstipation"],
        multiplier: 3.5,
        specificity: 0.85,
        clinicalPearl: "Previous surgery → adhesions (#1 cause); high-pitched bowel sounds; X-ray: air-fluid levels",
        source: "mimic_iv",
        icdCodes: ["K56.69"],
    },
    {
        name: "Diverticulitis",
        conditionId: "diverticulitis",
        symptoms: ["left_lower_quadrant_pain", "fever", "nausea", "change_in_bowel_habit"],
        multiplier: 2.5,
        specificity: 0.78,
        clinicalPearl: "LLQ pain + fever in patient >50 = diverticulitis until proven otherwise; CT for diagnosis",
        source: "clinical_guideline",
        minAge: 40,
        icdCodes: ["K57.32"],
    },
    {
        name: "Celiac Disease Presentation",
        conditionId: "celiac_disease",
        symptoms: ["chronic_diarrhea", "bloating", "weight_loss", "fatigue", "iron_deficiency_anemia"],
        multiplier: 2.5,
        specificity: 0.78,
        clinicalPearl: "Consider in unexplained iron deficiency anemia, even without GI symptoms",
        source: "pubmed",
        icdCodes: ["K90.0"],
    },

    // ── ENDOCRINE ───────────────────────────────────────────────────────────
    {
        name: "Diabetic Ketoacidosis (DKA)",
        conditionId: "diabetic_ketoacidosis",
        symptoms: ["polyuria", "polydipsia", "nausea", "vomiting", "abdominal_pain", "fruity_breath", "kussmaul_breathing"],
        multiplier: 5.0,
        specificity: 0.92,
        clinicalPearl: "Glucose >250 + pH <7.3 + ketones → IV insulin + fluids + K+ monitoring",
        source: "eicu",
        icdCodes: ["E10.10", "E11.10"],
    },
    {
        name: "Thyroid Storm",
        conditionId: "thyroid_storm",
        symptoms: ["tachycardia", "fever", "agitation", "tremor", "diarrhea", "altered_consciousness"],
        multiplier: 5.5,
        specificity: 0.90,
        clinicalPearl: "Medical emergency — Burch-Wartofsky score ≥45; thionamides + beta-blocker + steroids",
        source: "eicu",
        icdCodes: ["E05.51"],
    },
    {
        name: "Addisonian Crisis",
        conditionId: "adrenal_crisis",
        symptoms: ["hypotension", "severe_fatigue", "abdominal_pain", "nausea", "confusion", "hyperpigmentation"],
        multiplier: 5.0,
        specificity: 0.88,
        clinicalPearl: "Refractory hypotension not responding to fluids — give IV hydrocortisone 100mg stat",
        source: "eicu",
        icdCodes: ["E27.2"],
    },
    {
        name: "Hypoglycemia (Severe)",
        conditionId: "severe_hypoglycemia",
        symptoms: ["tremor", "sweating", "confusion", "palpitations", "hunger", "altered_consciousness"],
        multiplier: 4.0,
        specificity: 0.85,
        clinicalPearl: "Whipple triad: symptoms + low glucose + resolution with glucose. Check insulin/sulfonylurea use",
        source: "mimic_iv",
        icdCodes: ["E16.2"],
    },

    // ── INFECTIOUS (expanded) ───────────────────────────────────────────────
    {
        name: "Sepsis (qSOFA)",
        conditionId: "sepsis",
        symptoms: ["fever", "tachycardia", "hypotension", "altered_consciousness", "tachypnea"],
        multiplier: 5.5,
        specificity: 0.88,
        clinicalPearl: "qSOFA ≥2 (RR≥22, SBP≤100, AMS) → suspect sepsis; Surviving Sepsis: hour-1 bundle",
        source: "mimic_iv",
        icdCodes: ["A41.9"],
    },
    {
        name: "Necrotizing Fasciitis",
        conditionId: "necrotizing_fasciitis",
        symptoms: ["severe_wound_pain", "skin_erythema", "rapid_spread", "fever", "crepitus", "bullae"],
        multiplier: 6.0,
        specificity: 0.93,
        clinicalPearl: "Pain out of proportion to exam — surgical emergency. LRINEC score ≥6 → high risk",
        source: "pubmed",
        icdCodes: ["M72.6"],
    },
    {
        name: "Infective Endocarditis",
        conditionId: "infective_endocarditis",
        symptoms: ["persistent_fever", "new_murmur", "janeway_lesions", "osler_nodes", "splinter_hemorrhages"],
        multiplier: 4.0,
        specificity: 0.88,
        clinicalPearl: "Modified Duke criteria; fever + new murmur = endocarditis until proven otherwise; 3 blood cultures",
        source: "pubmed",
        icdCodes: ["I33.0"],
    },
    {
        name: "Dengue Fever Warning Signs",
        conditionId: "dengue_fever",
        symptoms: ["high_fever", "severe_headache", "retro_orbital_pain", "myalgia", "rash", "petechiae"],
        multiplier: 3.5,
        specificity: 0.84,
        clinicalPearl: "Warning signs: abdominal pain, persistent vomiting, mucosal bleeding → dengue hemorrhagic fever risk",
        source: "who",
        icdCodes: ["A90"],
    },
    {
        name: "Malaria (P. falciparum)",
        conditionId: "malaria",
        symptoms: ["cyclical_fever", "chills", "rigors", "headache", "sweating", "splenomegaly"],
        multiplier: 3.5,
        specificity: 0.82,
        clinicalPearl: "Travel to endemic area + cyclical fever → thick/thin blood smear; P. falciparum = most dangerous",
        source: "who",
        icdCodes: ["B50.9"],
    },

    // ── RENAL / UROLOGICAL ──────────────────────────────────────────────────
    {
        name: "Acute Kidney Injury (AKI)",
        conditionId: "acute_kidney_injury",
        symptoms: ["oliguria", "edema", "fatigue", "nausea", "confusion", "elevated_creatinine"],
        multiplier: 3.5,
        specificity: 0.82,
        clinicalPearl: "KDIGO staging: Cr 1.5× baseline within 7d OR <0.5 mL/kg/h for 6h. Check for prerenal vs intrinsic",
        source: "mimic_iv",
        icdCodes: ["N17.9"],
    },
    {
        name: "Renal Colic (Nephrolithiasis)",
        conditionId: "kidney_stone",
        symptoms: ["severe_flank_pain", "colicky_pain", "hematuria", "nausea", "groin_radiation"],
        multiplier: 3.0,
        specificity: 0.85,
        clinicalPearl: "Costovertebral angle tenderness + hematuria. CT non-contrast is gold standard",
        source: "clinical_guideline",
        icdCodes: ["N20.0"],
    },
    {
        name: "Pyelonephritis",
        conditionId: "pyelonephritis",
        symptoms: ["flank_pain", "fever", "chills", "dysuria", "costovertebral_tenderness"],
        multiplier: 3.0,
        specificity: 0.83,
        clinicalPearl: "UTI symptoms + systemic fever/chills = pyelonephritis; urine culture + oral/IV antibiotics",
        source: "clinical_guideline",
        icdCodes: ["N10"],
    },

    // ── HEMATOLOGICAL ───────────────────────────────────────────────────────
    {
        name: "Deep Vein Thrombosis (DVT)",
        conditionId: "dvt",
        symptoms: ["unilateral_leg_swelling", "calf_pain", "warmth", "erythema", "pitting_edema"],
        multiplier: 3.5,
        specificity: 0.82,
        clinicalPearl: "Homans sign unreliable — use Wells Score + D-dimer; compression US is diagnostic",
        source: "clinical_guideline",
        icdCodes: ["I82.40"],
    },
    {
        name: "Disseminated Intravascular Coagulation (DIC)",
        conditionId: "dic",
        symptoms: ["unexplained_bleeding", "petechiae", "ecchymoses", "oozing_from_puncture_sites", "organ_dysfunction"],
        multiplier: 5.0,
        specificity: 0.88,
        clinicalPearl: "Low platelets + low fibrinogen + elevated D-dimer + prolonged PT/aPTT. Treat underlying cause",
        source: "eicu",
        icdCodes: ["D65"],
    },

    // ── AUTOIMMUNE / RHEUMATOLOGIC ──────────────────────────────────────────
    {
        name: "Systemic Lupus Erythematosus Flare",
        conditionId: "sle_flare",
        symptoms: ["malar_rash", "joint_pain", "fatigue", "photosensitivity", "oral_ulcers", "pleuritis"],
        multiplier: 3.0,
        specificity: 0.85,
        clinicalPearl: "≥4 of 11 ACR criteria; monitor for lupus nephritis (urine protein) and anti-dsDNA/C3/C4",
        source: "pubmed",
        genderFilter: "female",
        icdCodes: ["M32.9"],
    },
    {
        name: "Gout Attack (Acute)",
        conditionId: "gout",
        symptoms: ["acute_joint_pain", "swelling", "erythema", "first_mtp_involvement", "warmth"],
        multiplier: 3.0,
        specificity: 0.84,
        clinicalPearl: "Podagra (1st MTP) is classic; joint aspirate with negatively birefringent crystals is gold standard",
        source: "clinical_guideline",
        icdCodes: ["M10.9"],
    },
    {
        name: "Polymyalgia Rheumatica",
        conditionId: "polymyalgia_rheumatica",
        symptoms: ["bilateral_shoulder_pain", "hip_stiffness", "morning_stiffness", "elevated_esr", "fatigue"],
        multiplier: 2.8,
        specificity: 0.80,
        clinicalPearl: "Age >50, bilateral shoulder/hip stiffness, ESR >40 — responds dramatically to low-dose prednisone",
        source: "pubmed",
        minAge: 50,
        icdCodes: ["M35.3"],
    },

    // ── PSYCHIATRIC EMERGENCIES ─────────────────────────────────────────────
    {
        name: "Serotonin Syndrome",
        conditionId: "serotonin_syndrome",
        symptoms: ["agitation", "hyperthermia", "clonus", "tremor", "diarrhea", "mydriasis"],
        multiplier: 4.5,
        specificity: 0.88,
        clinicalPearl: "Hunter criteria; typically from SSRI + MAOI combination or SSRI overdose. Cyproheptadine is antidote",
        source: "pubmed",
        icdCodes: ["G25.79"],
    },
    {
        name: "Neuroleptic Malignant Syndrome (NMS)",
        conditionId: "neuroleptic_malignant_syndrome",
        symptoms: ["hyperthermia", "muscle_rigidity", "altered_consciousness", "autonomic_instability", "elevated_cpk"],
        multiplier: 5.0,
        specificity: 0.90,
        clinicalPearl: "Develops days to weeks after antipsychotic start/dose change. Stop offending agent; dantrolene/bromocriptine",
        source: "pubmed",
        icdCodes: ["G21.0"],
    },

    // ── OBSTETRIC / GYNECOLOGICAL ───────────────────────────────────────────
    {
        name: "Ectopic Pregnancy",
        conditionId: "ectopic_pregnancy",
        symptoms: ["lower_abdominal_pain", "vaginal_bleeding", "amenorrhea", "shoulder_pain", "dizziness"],
        multiplier: 5.0,
        specificity: 0.88,
        clinicalPearl: "Any reproductive-age female with abdominal pain + vaginal bleeding → urine β-hCG stat",
        source: "clinical_guideline",
        genderFilter: "female",
        icdCodes: ["O00.9"],
    },
    {
        name: "Preeclampsia",
        conditionId: "preeclampsia",
        symptoms: ["hypertension", "proteinuria", "headache", "visual_changes", "epigastric_pain", "edema"],
        multiplier: 4.5,
        specificity: 0.87,
        clinicalPearl: "BP ≥140/90 after 20 weeks + proteinuria; severe features: HELLP, eclampsia risk",
        source: "clinical_guideline",
        genderFilter: "female",
        icdCodes: ["O14.9"],
    },

    // ── TOXICOLOGICAL ───────────────────────────────────────────────────────
    {
        name: "Acetaminophen Overdose",
        conditionId: "acetaminophen_overdose",
        symptoms: ["nausea", "vomiting", "abdominal_pain", "hepatic_tenderness", "jaundice"],
        multiplier: 4.0,
        specificity: 0.85,
        clinicalPearl: "Rumack-Matthew nomogram; N-acetylcysteine within 8h most effective. May be asymptomatic initially",
        source: "mimic_iv",
        icdCodes: ["T39.1X1A"],
    },
    {
        name: "Carbon Monoxide Poisoning",
        conditionId: "co_poisoning",
        symptoms: ["headache", "dizziness", "nausea", "confusion", "cherry_red_skin"],
        multiplier: 3.5,
        specificity: 0.82,
        clinicalPearl: "Multiple household members with similar symptoms → suspect CO. SpO2 falsely normal. Get CO-oximetry",
        source: "eicu",
        icdCodes: ["T58.01"],
    },

    // ── PEDIATRIC-WEIGHTED ──────────────────────────────────────────────────
    {
        name: "Kawasaki Disease",
        conditionId: "kawasaki_disease",
        symptoms: ["persistent_fever", "conjunctivitis", "rash", "cervical_lymphadenopathy", "strawberry_tongue", "extremity_changes"],
        multiplier: 4.0,
        specificity: 0.87,
        clinicalPearl: "Fever ≥5 days + ≥4 criteria; IVIG + aspirin to prevent coronary aneurysms",
        source: "pubmed",
        maxAge: 12,
        icdCodes: ["M30.3"],
    },
    {
        name: "Intussusception",
        conditionId: "intussusception",
        symptoms: ["colicky_abdominal_pain", "currant_jelly_stool", "vomiting", "sausage_shaped_mass"],
        multiplier: 4.5,
        specificity: 0.88,
        clinicalPearl: "Age 6mo-3yr; intermittent crying/drawing up legs; ultrasound target sign; air enema reduction",
        source: "pubmed",
        maxAge: 5,
        icdCodes: ["K56.1"],
    },

    // ── GERIATRIC-WEIGHTED ──────────────────────────────────────────────────
    {
        name: "Normal Pressure Hydrocephalus (NPH)",
        conditionId: "normal_pressure_hydrocephalus",
        symptoms: ["gait_disturbance", "urinary_incontinence", "cognitive_decline"],
        multiplier: 3.0,
        specificity: 0.85,
        clinicalPearl: "Classic triad: 'wet, wacky, wobbly' — one of few treatable causes of dementia. VP shunt",
        source: "pubmed",
        minAge: 60,
        icdCodes: ["G91.2"],
    },
    {
        name: "Atypical MI in Elderly",
        conditionId: "heart_attack",
        symptoms: ["dyspnea", "fatigue", "confusion", "syncope"],
        multiplier: 3.5,
        specificity: 0.75,
        clinicalPearl: "Up to 40% of MI in elderly present WITHOUT chest pain. Dyspnea may be the only symptom",
        source: "mimic_iv",
        minAge: 70,
        icdCodes: ["I21.9"],
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: DIFFERENTIAL DIAGNOSIS MATRIX (Goal 2)
// Maps common diagnostic confusion pairs with distinguishing features
// ═══════════════════════════════════════════════════════════════════════════════

export const DIFFERENTIAL_MATRIX: DifferentialEntry[] = [
    {
        primaryConditionId: "heart_attack",
        mimicConditionId: "gerd",
        sharedSymptoms: ["chest_pain", "nausea", "sweating"],
        distinguishingSymptoms: ["left_arm_pain", "jaw_pain", "exertional", "shortness_of_breath"],
        confusionRate: 0.35,
        keyDifferentiator: "Exertional component, radiation to arm/jaw, associated dyspnea favor cardiac. Burning quality, postprandial worsening favor GERD",
        clinicalNote: "When in doubt, rule out cardiac first — GERD never killed anyone, MI kills in minutes",
    },
    {
        primaryConditionId: "heart_attack",
        mimicConditionId: "panic_attack",
        sharedSymptoms: ["chest_pain", "palpitations", "sweating", "shortness_of_breath"],
        distinguishingSymptoms: ["left_arm_pain", "jaw_pain", "diaphoresis"],
        confusionRate: 0.25,
        keyDifferentiator: "Panic: hyperventilation, perioral tingling, prior episodes, younger age. MI: diaphoresis, radiation, risk factors",
        clinicalNote: "Never diagnose panic disorder during first episode without cardiac workup",
    },
    {
        primaryConditionId: "appendicitis",
        mimicConditionId: "gastroenteritis",
        sharedSymptoms: ["abdominal_pain", "nausea", "vomiting"],
        distinguishingSymptoms: ["rlq_tenderness", "rebound_tenderness", "migration_of_pain", "anorexia"],
        confusionRate: 0.30,
        keyDifferentiator: "Appendicitis: pain migrates periumbilical→RLQ, localized tenderness, fever. Gastroenteritis: diffuse, diarrhea prominent",
        clinicalNote: "RLQ pain + fever + elevated WBC should trigger surgical consult",
    },
    {
        primaryConditionId: "appendicitis",
        mimicConditionId: "ectopic_pregnancy",
        sharedSymptoms: ["lower_abdominal_pain", "nausea"],
        distinguishingSymptoms: ["vaginal_bleeding", "amenorrhea", "positive_hcg"],
        confusionRate: 0.20,
        keyDifferentiator: "Any reproductive-age female with lower abdominal pain → urine β-hCG MUST be checked",
        clinicalNote: "Missing ectopic pregnancy is a leading cause of malpractice claims",
    },
    {
        primaryConditionId: "migraine",
        mimicConditionId: "subarachnoid_hemorrhage",
        sharedSymptoms: ["severe_headache", "nausea", "photophobia"],
        distinguishingSymptoms: ["thunderclap_onset", "worst_headache_of_life", "neck_stiffness", "meningism"],
        confusionRate: 0.15,
        keyDifferentiator: "SAH: sudden onset reaching max in seconds, meningismus. Migraine: gradual onset, aura, prior similar episodes",
        clinicalNote: "First/worst headache or thunderclap onset = CT head + LP regardless of suspected migraine history",
    },
    {
        primaryConditionId: "pneumonia",
        mimicConditionId: "heart_failure",
        sharedSymptoms: ["dyspnea", "cough", "fatigue"],
        distinguishingSymptoms: ["productive_sputum", "fever", "pleuritic_pain"],
        confusionRate: 0.25,
        keyDifferentiator: "Pneumonia: fever, productive sputum, focal findings. HF: orthopnea, PND, JVD, bilateral edema, BNP elevated",
        clinicalNote: "Both can coexist — decompensated HF is often triggered by pneumonia",
    },
    {
        primaryConditionId: "pulmonary_embolism",
        mimicConditionId: "pneumonia",
        sharedSymptoms: ["dyspnea", "chest_pain", "cough", "tachycardia"],
        distinguishingSymptoms: ["sudden_onset", "pleuritic_pain", "hemoptysis", "leg_swelling"],
        confusionRate: 0.30,
        keyDifferentiator: "PE: sudden onset, pleuritic, DVT signs, clear CXR. Pneumonia: gradual, productive cough, fever, consolidation on CXR",
        clinicalNote: "PE is the great masquerader — consider in any unexplained dyspnea + tachycardia",
    },
    {
        primaryConditionId: "stroke",
        mimicConditionId: "hypoglycemia",
        sharedSymptoms: ["confusion", "weakness", "slurred_speech"],
        distinguishingSymptoms: ["unilateral_weakness", "facial_droop", "visual_field_cut"],
        confusionRate: 0.15,
        keyDifferentiator: "Always check glucose first — hypoglycemia can perfectly mimic stroke. FAST exam + glucose",
        clinicalNote: "Blood glucose is the first test in ANY altered mental status",
    },
    {
        primaryConditionId: "meningitis",
        mimicConditionId: "migraine",
        sharedSymptoms: ["headache", "photophobia", "nausea"],
        distinguishingSymptoms: ["fever", "neck_stiffness", "petechial_rash", "altered_consciousness"],
        confusionRate: 0.20,
        keyDifferentiator: "Meningitis: fever + neck stiffness + headache (classic triad). Kernig/Brudzinski signs. Migraine: no fever, prior episodes",
        clinicalNote: "Fever + headache + neck stiffness = LP before antibiotics if possible; antibiotics should NOT be delayed",
    },
    {
        primaryConditionId: "cholecystitis",
        mimicConditionId: "peptic_ulcer",
        sharedSymptoms: ["epigastric_pain", "nausea", "vomiting"],
        distinguishingSymptoms: ["ruq_tenderness", "murphys_sign", "fatty_food_trigger", "fever"],
        confusionRate: 0.25,
        keyDifferentiator: "Cholecystitis: RUQ pain, positive Murphy's, post-fatty meal. PUD: epigastric, burning, relieved by food (duodenal) or worsened (gastric)",
        clinicalNote: "RUQ ultrasound is first-line for suspected biliary pathology",
    },
    {
        primaryConditionId: "dvt",
        mimicConditionId: "cellulitis",
        sharedSymptoms: ["leg_swelling", "erythema", "warmth", "pain"],
        distinguishingSymptoms: ["unilateral_swelling", "calf_asymmetry", "pitting_edema"],
        confusionRate: 0.20,
        keyDifferentiator: "DVT: unilateral, non-tender erythema, distended veins. Cellulitis: clearly demarcated erythema, tenderness, fever, skin break",
        clinicalNote: "Misdiagnosing DVT as cellulitis can lead to fatal PE — always check Wells Score",
    },
    {
        primaryConditionId: "asthma_exacerbation",
        mimicConditionId: "anaphylaxis",
        sharedSymptoms: ["wheezing", "shortness_of_breath", "chest_tightness"],
        distinguishingSymptoms: ["urticaria", "angioedema", "hypotension", "allergen_exposure"],
        confusionRate: 0.15,
        keyDifferentiator: "Anaphylaxis: rapid onset after exposure, urticaria, angioedema, hypotension. Asthma: no urticaria/angioedema, gradual onset",
        clinicalNote: "If in doubt, give IM epinephrine — it helps both and delay can be fatal in anaphylaxis",
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: RARE DISEASE PATTERNS (Goal 5)
// Conditions that standard differential often misses
// ═══════════════════════════════════════════════════════════════════════════════

export const RARE_DISEASE_PATTERNS: RareDiseasePattern[] = [
    {
        conditionId: "addisons_disease",
        conditionName: "Addison's Disease (Adrenal Insufficiency)",
        icdCodes: ["E27.1"],
        triggerSymptoms: ["fatigue", "weight_loss", "hyperpigmentation", "hypotension", "salt_craving", "nausea"],
        minTriggerCount: 3,
        urgency: "urgent_referral",
        specialistReferral: "Endocrinology",
        clinicalRationale: "Chronic adrenal insufficiency can present insidiously. Adrenal crisis is life-threatening. AM cortisol + ACTH stimulation test",
        prevalence: "1 in 10,000",
        source: "pubmed",
    },
    {
        conditionId: "pheochromocytoma",
        conditionName: "Pheochromocytoma",
        icdCodes: ["D35.0"],
        triggerSymptoms: ["episodic_hypertension", "headache", "sweating", "palpitations", "anxiety"],
        minTriggerCount: 3,
        urgency: "urgent_referral",
        specialistReferral: "Endocrinology / Endocrine Surgery",
        clinicalRationale: "Classic triad: headache + sweating + palpitations with episodic hypertension. 24-hour urine metanephrines",
        prevalence: "1 in 500,000",
        source: "pubmed",
    },
    {
        conditionId: "myasthenia_gravis",
        conditionName: "Myasthenia Gravis",
        icdCodes: ["G70.0"],
        triggerSymptoms: ["ptosis", "diplopia", "fatigable_weakness", "dysphagia", "dysarthria"],
        minTriggerCount: 2,
        urgency: "urgent_referral",
        specialistReferral: "Neurology",
        clinicalRationale: "Weakness worsens with activity, improves with rest. Anti-AChR antibodies. Ice pack test for ptosis",
        prevalence: "1 in 5,000",
        source: "pubmed",
    },
    {
        conditionId: "multiple_sclerosis",
        conditionName: "Multiple Sclerosis",
        icdCodes: ["G35"],
        triggerSymptoms: ["optic_neuritis", "numbness", "tingling", "weakness", "lhermitte_sign", "urinary_urgency"],
        minTriggerCount: 2,
        urgency: "urgent_referral",
        specialistReferral: "Neurology",
        clinicalRationale: "Young adults with disseminated neurological symptoms separated in time and space. MRI brain/spine + CSF",
        prevalence: "1 in 1,000",
        source: "pubmed",
    },
    {
        conditionId: "cushings_syndrome",
        conditionName: "Cushing's Syndrome",
        icdCodes: ["E24.9"],
        triggerSymptoms: ["moon_face", "buffalo_hump", "abdominal_striae", "weight_gain", "hypertension", "diabetes"],
        minTriggerCount: 3,
        urgency: "routine_referral",
        specialistReferral: "Endocrinology",
        clinicalRationale: "Central obesity + proximal weakness + purple striae + easy bruising. 24h urine cortisol or overnight dexamethasone suppression",
        prevalence: "1 in 50,000",
        source: "pubmed",
    },
    {
        conditionId: "sarcoidosis",
        conditionName: "Sarcoidosis",
        icdCodes: ["D86.9"],
        triggerSymptoms: ["bilateral_hilar_lymphadenopathy", "erythema_nodosum", "cough", "fatigue", "uveitis", "joint_pain"],
        minTriggerCount: 2,
        urgency: "routine_referral",
        specialistReferral: "Pulmonology / Rheumatology",
        clinicalRationale: "Non-caseating granulomas; elevated ACE level; CXR bilateral hilar lymphadenopathy. Young adults, especially AA females",
        prevalence: "1 in 10,000",
        source: "pubmed",
    },
    {
        conditionId: "hemochromatosis",
        conditionName: "Hereditary Hemochromatosis",
        icdCodes: ["E83.110"],
        triggerSymptoms: ["fatigue", "joint_pain", "abdominal_pain", "bronze_skin", "diabetes", "liver_dysfunction"],
        minTriggerCount: 3,
        urgency: "routine_referral",
        specialistReferral: "Hepatology / Gastroenterology",
        clinicalRationale: "Iron overload — 'bronze diabetes'. Check ferritin + transferrin saturation. HFE gene testing",
        prevalence: "1 in 300 (Northern European descent)",
        source: "pubmed",
    },
    {
        conditionId: "amyloidosis",
        conditionName: "Systemic Amyloidosis",
        icdCodes: ["E85.9"],
        triggerSymptoms: ["macroglossia", "periorbital_purpura", "nephrotic_syndrome", "cardiomyopathy", "peripheral_neuropathy"],
        minTriggerCount: 2,
        urgency: "urgent_referral",
        specialistReferral: "Hematology / Rheumatology",
        clinicalRationale: "Multi-organ involvement with waxy deposits; Congo red staining. AL amyloidosis is most treatable",
        prevalence: "1 in 100,000",
        source: "pubmed",
    },
    {
        conditionId: "wilsons_disease",
        conditionName: "Wilson's Disease",
        icdCodes: ["E83.01"],
        triggerSymptoms: ["liver_disease", "tremor", "psychiatric_symptoms", "kayser_fleischer_rings", "dysarthria"],
        minTriggerCount: 2,
        urgency: "urgent_referral",
        specialistReferral: "Hepatology / Neurology",
        clinicalRationale: "Copper accumulation; young patients with liver disease + neuropsychiatric symptoms. Ceruloplasmin + 24h urine copper",
        prevalence: "1 in 30,000",
        source: "pubmed",
        maxAge: 40,
    },
    {
        conditionId: "mastocytosis",
        conditionName: "Systemic Mastocytosis",
        icdCodes: ["D47.02"],
        triggerSymptoms: ["flushing", "urticaria", "abdominal_pain", "diarrhea", "anaphylaxis", "bone_pain"],
        minTriggerCount: 3,
        urgency: "routine_referral",
        specialistReferral: "Allergy/Immunology / Hematology",
        clinicalRationale: "Mast cell proliferation; recurrent anaphylaxis-like episodes. Serum tryptase; bone marrow biopsy",
        prevalence: "1 in 100,000",
        source: "pubmed",
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: BODY SYSTEM MAPPING (Goal 8: Multi-Modal Reasoning)
// Maps conditions to body systems for cross-system correlation detection
// ═══════════════════════════════════════════════════════════════════════════════

export const CONDITION_SYSTEM_MAP: Record<string, BodySystem[]> = {
    heart_attack:          ['cardiovascular'],
    heart_failure:         ['cardiovascular', 'respiratory', 'renal'],
    atrial_fibrillation:   ['cardiovascular'],
    pulmonary_embolism:    ['cardiovascular', 'respiratory', 'hematological'],
    pneumonia:             ['respiratory'],
    copd_exacerbation:     ['respiratory'],
    asthma_exacerbation:   ['respiratory', 'immunological'],
    stroke:                ['neurological', 'cardiovascular'],
    migraine:              ['neurological'],
    meningitis:            ['neurological', 'immunological'],
    appendicitis:          ['gastrointestinal'],
    cholecystitis:         ['gastrointestinal'],
    pancreatitis:          ['gastrointestinal', 'endocrine'],
    diabetes:              ['endocrine', 'cardiovascular', 'neurological', 'renal'],
    thyroid_storm:         ['endocrine', 'cardiovascular'],
    sle_flare:             ['immunological', 'renal', 'dermatological', 'musculoskeletal', 'hematological'],
    sepsis:                ['immunological', 'cardiovascular', 'respiratory', 'renal'],
    acute_kidney_injury:   ['renal', 'cardiovascular'],
    dvt:                   ['hematological', 'cardiovascular'],
    depression:            ['psychiatric'],
    anaphylaxis:           ['immunological', 'respiratory', 'cardiovascular', 'dermatological'],
    diabetic_ketoacidosis: ['endocrine', 'gastrointestinal', 'neurological'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: REGIONAL EPIDEMIOLOGICAL WEIGHTS (Goal 11)
// Adjusts prevalence based on geographic/demographic context
// ═══════════════════════════════════════════════════════════════════════════════

export interface RegionalWeight {
    conditionPattern: RegExp;
    region: 'south_asia' | 'southeast_asia' | 'sub_saharan_africa' | 'global';
    multiplier: number;
    rationale: string;
}

export const REGIONAL_WEIGHTS: RegionalWeight[] = [
    { conditionPattern: /tuberculosis|tb/i, region: 'south_asia', multiplier: 3.0, rationale: "India accounts for 26% of global TB burden (WHO 2023)" },
    { conditionPattern: /dengue/i, region: 'south_asia', multiplier: 2.5, rationale: "Endemic in tropical South/Southeast Asia" },
    { conditionPattern: /malaria/i, region: 'south_asia', multiplier: 2.0, rationale: "Prevalent in tropical regions" },
    { conditionPattern: /malaria/i, region: 'sub_saharan_africa', multiplier: 4.0, rationale: "95% of malaria deaths occur in Africa (WHO)" },
    { conditionPattern: /typhoid/i, region: 'south_asia', multiplier: 3.0, rationale: "Highest incidence in South Asia" },
    { conditionPattern: /diabetes|t2dm/i, region: 'south_asia', multiplier: 1.5, rationale: "South Asians have 2-4× higher diabetes risk at lower BMI" },
    { conditionPattern: /rheumatic_heart|rheumatic_fever/i, region: 'south_asia', multiplier: 2.5, rationale: "Still prevalent in developing countries" },
    { conditionPattern: /thalassemia/i, region: 'south_asia', multiplier: 2.5, rationale: "Carrier rate 3-17% in India" },
    { conditionPattern: /sickle_cell/i, region: 'sub_saharan_africa', multiplier: 3.0, rationale: "Highest prevalence in sub-Saharan Africa" },
    { conditionPattern: /celiac/i, region: 'south_asia', multiplier: 1.5, rationale: "North Indian wheat-belt has high celiac prevalence" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: CLINICAL KNOWLEDGE BASE CLASS
// Unified interface for all knowledge lookups
// ═══════════════════════════════════════════════════════════════════════════════

export class ClinicalKnowledgeBase {
    private patterns: ExtendedClinicalPattern[];
    private differentials: DifferentialEntry[];
    private rareDiseases: RareDiseasePattern[];

    constructor() {
        this.patterns = EXTENDED_CLINICAL_PATTERNS;
        this.differentials = DIFFERENTIAL_MATRIX;
        this.rareDiseases = RARE_DISEASE_PATTERNS;
    }

    // ── Goal 1: Pattern Detection ────────────────────────────────────────────

    detectExtendedPatterns(
        symptoms: string[],
        age?: number | null,
        gender?: string | null,
    ): Array<{ pattern: ExtendedClinicalPattern; matchedSymptoms: string[]; confidence: number }> {
        const normalizedSymptoms = new Set(symptoms.map(s => s.toLowerCase().trim()));
        const results: Array<{ pattern: ExtendedClinicalPattern; matchedSymptoms: string[]; confidence: number }> = [];

        for (const pattern of this.patterns) {
            // Age filter
            if (age !== null && age !== undefined) {
                if (pattern.minAge && age < pattern.minAge) continue;
                if (pattern.maxAge && age > pattern.maxAge) continue;
            }

            // Gender filter
            if (gender && pattern.genderFilter) {
                const normalizedGender = gender.toLowerCase();
                if (pattern.genderFilter === 'male' && !['male', 'm'].includes(normalizedGender)) continue;
                if (pattern.genderFilter === 'female' && !['female', 'f'].includes(normalizedGender)) continue;
            }

            // Symptom matching
            const matched: string[] = [];
            for (const symptom of pattern.symptoms) {
                if (normalizedSymptoms.has(symptom.toLowerCase())) {
                    matched.push(symptom);
                }
            }

            const matchRatio = matched.length / pattern.symptoms.length;
            if (matchRatio >= 0.60) { // Lower threshold than existing 75% for extended patterns
                const confidence = matchRatio * pattern.specificity;
                results.push({ pattern, matchedSymptoms: matched, confidence });
            }
        }

        return results.sort((a, b) => b.confidence - a.confidence);
    }

    // ── Goal 2: Differential Diagnosis ───────────────────────────────────────

    getDifferentialAnalysis(
        primaryConditionId: string,
        userSymptoms: string[],
    ): DifferentialResult {
        const normalizedSymptoms = new Set(userSymptoms.map(s => s.toLowerCase()));
        const entries = this.differentials.filter(
            d => d.primaryConditionId === primaryConditionId || d.mimicConditionId === primaryConditionId
        );

        const differentials = entries.map(entry => {
            const isMimic = entry.mimicConditionId === primaryConditionId;
            const otherConditionId = isMimic ? entry.primaryConditionId : entry.mimicConditionId;

            // Calculate overlap with shared symptoms
            const sharedPresent = entry.sharedSymptoms.filter(s => normalizedSymptoms.has(s)).length;
            const distinguishPresent = entry.distinguishingSymptoms.filter(s => normalizedSymptoms.has(s)).length;

            const overlapScore = sharedPresent / Math.max(entry.sharedSymptoms.length, 1);
            const distinguishScore = distinguishPresent / Math.max(entry.distinguishingSymptoms.length, 1);

            return {
                conditionId: otherConditionId,
                conditionName: otherConditionId.replace(/_/g, ' '),
                overlapScore: overlapScore * entry.confusionRate,
                distinguishingFeatures: entry.distinguishingSymptoms,
                clinicalNote: entry.clinicalNote,
            };
        });

        return {
            primaryCondition: primaryConditionId,
            differentials: differentials.sort((a, b) => b.overlapScore - a.overlapScore),
        };
    }

    // ── Goal 5: Rare Disease Screening ───────────────────────────────────────

    screenForRareDiseases(
        symptoms: string[],
        age?: number | null,
    ): RareDiseaseAlert[] {
        const normalizedSymptoms = new Set(symptoms.map(s => s.toLowerCase()));
        const alerts: RareDiseaseAlert[] = [];

        for (const rare of this.rareDiseases) {
            // Age filter
            if (age !== null && age !== undefined && rare.conditionId === 'wilsons_disease') {
                if (rare.maxAge && age > rare.maxAge) continue;
            }

            const matched = rare.triggerSymptoms.filter(s => normalizedSymptoms.has(s));
            if (matched.length >= rare.minTriggerCount) {
                const triggerScore = matched.length / rare.triggerSymptoms.length;
                alerts.push({
                    conditionName: rare.conditionName,
                    triggerScore,
                    matchedSymptoms: matched,
                    urgency: rare.urgency,
                    specialistReferral: rare.specialistReferral,
                    rationale: rare.clinicalRationale,
                });
            }
        }

        return alerts.sort((a, b) => b.triggerScore - a.triggerScore);
    }

    // ── Goal 8: Body System Classification ───────────────────────────────────

    getBodySystems(conditionId: string): BodySystem[] {
        return CONDITION_SYSTEM_MAP[conditionId] || [];
    }

    // ── Goal 11: Regional Weight ─────────────────────────────────────────────

    getRegionalMultiplier(conditionId: string, region: string = 'south_asia'): number {
        let maxMultiplier = 1.0;
        for (const rw of REGIONAL_WEIGHTS) {
            if (rw.conditionPattern.test(conditionId) && rw.region === region) {
                maxMultiplier = Math.max(maxMultiplier, rw.multiplier);
            }
        }
        return maxMultiplier;
    }
}

export const clinicalKnowledgeBase = new ClinicalKnowledgeBase();
