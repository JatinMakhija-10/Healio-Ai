#!/usr/bin/env python3
"""
Arovia / Healio.AI — 500,000-Patient Clinical Monte Carlo Stress Test & Verification Engine
========================================================================================
High-performance parallel simulation harness evaluating 500,000 synthetic patient permutations
across demographics, vitals, comorbidities, polypharmacy, allergies, and clinical presentations.

Evaluates 6 non-negotiable safety invariants:
  1. Hemodynamic Shock & Vital Sign Circuit Breaker
  2. Life-Threatening Red-Flag Pathology Hard Stops
  3. Drug-Disease & Drug-Drug (DDI) Safety Shield
  4. Triage & Narrative Synchronization (Zero Contradictions)
  5. Organ Strain Bounds & Monotonic Calibration
  6. Bayesian Posterior Probability Coherence

Usage:
  python tests/stress/monte_carlo_500k.py --count 500000
  python tests/stress/monte_carlo_500k.py --count 50000 --workers 4
"""

import sys
import os
import time
import math
import random
import json
import argparse
from pathlib import Path
from dataclasses import asdict
from typing import List, Dict, Any, Tuple, Optional
from multiprocessing import Pool, cpu_count

# Ensure parent directory is on sys.path to import persona_terminal
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from persona_terminal import (
    ClinicalPersona,
    SymptomScenario,
    SimulationImpactResult,
    ClinicalImpactEngine,
    SYMPTOM_SCENARIOS,
    PERSONAS
)

# Fix Windows console encoding for UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')


# ─────────────────────────────────────────────────────────────────────────────
# 1. CLINICAL SAMPLING DISTRIBUTIONS & VOCABULARIES
# ─────────────────────────────────────────────────────────────────────────────

INDIAN_FIRST_NAMES_MALE = [
    "Aarav", "Aditya", "Amit", "Anand", "Arun", "Deepak", "Farooq", "Harbans",
    "Jatin", "Karthik", "Manish", "Manoj", "Pradeep", "Rahul", "Rajesh", "Ramesh",
    "Sanjay", "Suresh", "Tenzin", "Vikram", "Vivek", "Zubair"
]

INDIAN_FIRST_NAMES_FEMALE = [
    "Aanya", "Ananya", "Deepa", "Devaki", "Divya", "Kavita", "Meera", "Neha",
    "Nisha", "Pooja", "Priya", "Radhika", "Ritu", "Sangeeta", "Shweta", "Sunita",
    "Tanvi", "Usha", "Vidya", "Zoya"
]

INDIAN_LAST_NAMES = [
    "Banerjee", "Bhatia", "Chawla", "Deshmukh", "Gupta", "Iyer", "Joshi",
    "Kapoor", "Kulkarni", "Malhotra", "Menon", "Nambiar", "Norbu", "Patel",
    "Pillai", "Qureshi", "Reddy", "Roy", "Sen", "Sharma", "Sheikh", "Singh", "Verma"
]

OCCUPATIONS = [
    "Software Engineer", "School Teacher", "Retired Clerk", "Bank Manager",
    "Civil Contractor", "High School Student", "Textile Mill Worker", "Physician",
    "Clinical Psychologist", "Homemaker", "Farmer", "Construction Worker",
    "Accountant", "Mountaineering Guide", "Sales Executive", "Security Guard"
]

LOCATIONS = [
    "New Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Hyderabad",
    "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Coimbatore",
    "Kochi", "Guwahati", "Bhopal", "Patna", "Surat", "Leh"
]

COMORBIDITY_POOL = [
    ("Stage 2 Essential Hypertension", "htn"),
    ("Type 2 Diabetes Mellitus (HbA1c 8.4%)", "diabetes"),
    ("Coronary Artery Disease (s/p DES to LAD)", "cad"),
    ("Congestive Heart Failure (NYHA Class II)", "hf"),
    ("Stage 3b Chronic Kidney Disease (eGFR 38 mL/min)", "ckd"),
    ("Stage 4 Chronic Kidney Disease (eGFR 24 mL/min)", "ckd"),
    ("Severe Persistent Bronchial Asthma", "asthma"),
    ("Chronic Obstructive Pulmonary Disease (COPD Gold 2)", "copd"),
    ("Occupational Byssinosis (Cotton Dust Lung)", "copd"),
    ("Gastroesophageal Reflux Disease (GERD with Esophagitis)", "gerd"),
    ("Chronic Duodenal Peptic Ulcer Disease", "ulcer"),
    ("Recurrent Tophaceous Gout (Hyperuricemia)", "gout"),
    ("Mixed Vascular & Alzheimer's Dementia", "dementia"),
    ("Fibromyalgia Syndrome with Central Sensitization", "fibromyalgia"),
    ("Grade 2 Hepatic Steatosis (Fatty Liver)", "fatty_liver"),
    ("Compensated Hepatic Cirrhosis", "cirrhosis"),
    ("Severe Chronic Tension-Type Headaches", "headache"),
    ("Chronic Migraine with Aura", "migraine_aura"),
    ("Chronic Migraine without Aura", "migraine_no_aura")
]

MEDICATION_MAP = {
    "cad": ["Aspirin 75mg OD", "Clopidogrel 75mg OD", "Atorvastatin 40mg OD", "Metoprolol Succinate 50mg OD"],
    "hf": ["Furosemide 40mg OD", "Spironolactone 25mg OD", "Ramipril 5mg OD"],
    "ckd": ["Torsemide 20mg OD", "Sodium Bicarbonate 500mg BID", "Calcitriol 0.25mcg OD"],
    "htn": ["Telmisartan 40mg OD", "Amlodipine 5mg OD"],
    "diabetes": ["Metformin 1000mg BID", "Glimepiride 2mg OD", "Teneligliptin 20mg OD"],
    "asthma": ["Budesonide/Formoterol 200/6 Inhaler BID", "Salbutamol 100mcg MDI PRN"],
    "copd": ["Tiotropium 18mcg Rotacap OD", "Deriphyllin Retard 150mg BID"],
    "gerd": ["Pantoprazole 40mg OD before breakfast"],
    "ulcer": ["Rabeprazole 20mg OD", "Sucralfate syrup 10ml TID"],
    "gout": ["Febuxostat 40mg OD", "Colchicine 0.5mg PRN"],
    "dementia": ["Donepezil 10mg OD", "Memantine 10mg BID"],
    "fibromyalgia": ["Duloxetine 60mg OD", "Pregabalin 75mg at bedtime"],
    "migraine_aura": ["Rizatriptan 10mg PRN", "Propranolol 40mg OD"],
    "migraine_no_aura": ["Sumatriptan 50mg PRN", "Naproxen 500mg PRN"],
    "anticoag": ["Apixaban 5mg BID", "Warfarin 4mg OD (INR 2.4)", "Rivaroxaban 20mg OD"]
}

ALLERGIES_POOL = [
    "Aspirin (triggers severe bronchospasm & angioedema)",
    "Penicillin (severe urticaria & anaphylactoid reaction)",
    "Sulfa drugs (Stevens-Johnson syndrome risk)",
    "Morphine & Opiates (severe respiratory depression)",
    "NSAIDs (Ibuprofen/Diclofenac causes facial angioedema)",
    "Peanuts (oral pruritus & wheezing)",
    "Chlorinated water",
    "None known"
]


# ─────────────────────────────────────────────────────────────────────────────
# 2. DETERMINISTIC SYNTHETIC PATIENT GENERATOR
# ─────────────────────────────────────────────────────────────────────────────

def generate_synthetic_patient(patient_id: int, rng: random.Random) -> Tuple[ClinicalPersona, SymptomScenario]:
    """
    Generates a single randomized yet clinically coherent patient and scenario pair.
    Uses dedicated rng instance for 100% deterministic reproducibility.
    """
    # 1. Demographics
    age = int(rng.gauss(52, 20))
    age = max(12, min(98, age))

    sex_roll = rng.random()
    is_pregnant = False
    pregnancy_weeks = None

    if sex_roll < 0.48:
        sex = "male"
        first_name = rng.choice(INDIAN_FIRST_NAMES_MALE)
    elif sex_roll < 0.94:
        sex = "female"
        first_name = rng.choice(INDIAN_FIRST_NAMES_FEMALE)
    else:
        sex = "female"
        first_name = rng.choice(INDIAN_FIRST_NAMES_FEMALE)
        if 16 <= age <= 45:
            is_pregnant = True
            pregnancy_weeks = rng.randint(4, 40)

    last_name = rng.choice(INDIAN_LAST_NAMES)
    full_name = f"{first_name} {last_name}"
    occupation = rng.choice(OCCUPATIONS)
    location = rng.choice(LOCATIONS)

    height_cm = round(rng.gauss(165 if sex == "female" else 172, 8), 1)
    height_cm = max(142.0, min(198.0, height_cm))
    weight_kg = round(rng.gauss(68 if sex == "female" else 76, 14), 1)
    weight_kg = max(40.0, min(140.0, weight_kg))

    # 2. Vitals & Pathological Shock Clusters
    # 8% of generated patients receive acute shock / severe vital instability
    is_shock_cluster = rng.random() < 0.08
    if is_shock_cluster:
        shock_type = rng.choice(["hypovolemic", "hypotensive", "hypoxic", "tachypneic"])
        if shock_type == "hypovolemic":
            # HR 115-155, SBP 70-88 => Shock Index 1.3 - 2.1
            sbp = rng.randint(68, 88)
            dbp = rng.randint(42, sbp - 15)
            hr = rng.randint(110, 155)
            spo2 = rng.randint(90, 96)
            rr = rng.randint(22, 32)
        elif shock_type == "hypotensive":
            sbp = rng.randint(72, 89)
            dbp = rng.randint(44, sbp - 14)
            hr = rng.randint(80, 108)
            spo2 = rng.randint(92, 98)
            rr = rng.randint(18, 26)
        elif shock_type == "hypoxic":
            sbp = rng.randint(95, 145)
            dbp = rng.randint(65, 90)
            hr = rng.randint(100, 135)
            spo2 = rng.randint(76, 88)  # Critical hypoxia (< 90%)
            rr = rng.randint(28, 40)    # Critical tachypnea (> 28/min)
        else: # tachypneic
            sbp = rng.randint(98, 150)
            dbp = rng.randint(65, 92)
            hr = rng.randint(95, 130)
            spo2 = rng.randint(87, 93)
            rr = rng.randint(30, 42)    # Critical tachypnea (> 28/min)
    else:
        # Standard non-shock vitals
        sbp = int(rng.gauss(126, 18))
        sbp = max(95, min(210, sbp))
        dbp = int(rng.gauss(80, 10))
        dbp = max(60, min(120, dbp))
        if dbp >= sbp:
            dbp = sbp - 20
        hr = int(rng.gauss(74, 11))
        hr = max(52, min(98, hr))
        spo2 = rng.randint(94, 100)
        rr = rng.randint(12, 22)

    resting_bp = f"{sbp}/{dbp}"
    resting_hr = hr

    # 3. Comorbidities
    # Number of comorbidities follows Poisson distribution lambda=1.8, correlated with age
    num_conds = min(5, max(0, int(rng.expovariate(1.0 / 1.8))))
    if age > 65:
        num_conds = max(1, num_conds)

    selected_conds: List[str] = []
    selected_tags: Set[str] = set()

    eligible_conds = list(COMORBIDITY_POOL)
    rng.shuffle(eligible_conds)

    for c_text, c_tag in eligible_conds:
        if len(selected_conds) >= num_conds:
            break
        # Age and sex filters for plausible medicine
        if c_tag in ["dementia"] and age < 60:
            continue
        if c_tag in ["cad", "hf"] and age < 35:
            continue
        if c_tag in ["migraine_aura", "migraine_no_aura"] and age > 70:
            continue
        selected_conds.append(c_text)
        selected_tags.add(c_tag)

    # 4. Medications & Polypharmacy
    selected_meds: List[str] = []
    for tag in selected_tags:
        if tag in MEDICATION_MAP:
            drug_choices = MEDICATION_MAP[tag]
            # Pick 1-2 drugs per condition
            picks = rng.sample(drug_choices, min(len(drug_choices), rng.randint(1, 2)))
            selected_meds.extend(picks)

    # Add oral contraceptive in young reproductive women (15% probability)
    if sex == "female" and 16 <= age <= 42 and not is_pregnant:
        if rng.random() < 0.20:
            selected_meds.append("Combined Oral Contraceptive (Ethinylestradiol 30mcg / Levonorgestrel 150mcg OD)")

    # Add anticoagulants in atrial fibrillation / CAD / high age
    if ("cad" in selected_tags or age >= 75) and rng.random() < 0.25:
        selected_meds.append(rng.choice(MEDICATION_MAP["anticoag"]))

    # Add occasional analgesics / SSRIs
    if rng.random() < 0.12 and not is_pregnant:
        selected_meds.append("Ibuprofen 400mg PRN for headache/joint pain")
    if rng.random() < 0.08:
        selected_meds.append(rng.choice(["Sertraline 50mg OD", "Escitalopram 10mg OD", "Duloxetine 40mg OD"]))

    # Deduplicate medications
    selected_meds = list(dict.fromkeys(selected_meds))

    # Polypharmacy risk
    num_meds = len(selected_meds)
    if num_meds >= 6:
        poly_risk = "critical" if num_meds >= 8 else "high"
    elif num_meds >= 3:
        poly_risk = "moderate"
    elif num_meds >= 1:
        poly_risk = "low"
    else:
        poly_risk = "none"

    # 5. Allergies
    selected_allergies: List[str] = []
    if rng.random() < 0.18:
        allergy_pick = rng.choice(ALLERGIES_POOL)
        if allergy_pick != "None known":
            selected_allergies.append(allergy_pick)
    if not selected_allergies:
        selected_allergies.append("None known")

    # 6. Frailty & eGFR
    base_frailty = min(10, max(0, int((age - 20) / 10) + len(selected_conds)))
    frailty_index = max(0, min(10, base_frailty + rng.randint(-1, 1)))

    # eGFR
    if "ckd" in selected_tags:
        egfr = round(rng.uniform(14.0, 56.0), 1)
    elif age > 75:
        egfr = round(rng.uniform(42.0, 78.0), 1)
    else:
        egfr = round(rng.uniform(65.0, 118.0), 1)

    lifestyle = {
        "smoking": "Smoker (10-15 cigs/day)" if rng.random() < 0.22 and age >= 18 else "Never",
        "alcohol": "Social alcohol" if rng.random() < 0.25 and age >= 21 else "None",
        "exercise": rng.choice(["Sedentary", "Moderate walking", "High athletic", "Bedbound"])
    }

    persona = ClinicalPersona(
        id=patient_id,
        name=full_name,
        age=age,
        sex=sex,
        occupation=occupation,
        location=location,
        height_cm=height_cm,
        weight_kg=weight_kg,
        resting_bp=resting_bp,
        resting_hr=resting_hr,
        diet_profile="Standard Indian diet",
        lifestyle=lifestyle,
        conditions=selected_conds,
        medications=selected_meds,
        allergies=selected_allergies,
        family_history=["Family medical history documented"],
        frailty_index=frailty_index,
        polypharmacy_risk=poly_risk,
        is_pregnant=is_pregnant,
        pregnancy_weeks=pregnancy_weeks,
        key_quote="Synthetic Monte Carlo Test Patient",
        spo2=spo2,
        rr=rr,
        egfr=egfr
    )

    # 7. Scenario Selection (Uniform across 12 core scenarios)
    scenario_idx = rng.randint(0, len(SYMPTOM_SCENARIOS) - 1)
    scenario = SYMPTOM_SCENARIOS[scenario_idx]

    return persona, scenario


# ─────────────────────────────────────────────────────────────────────────────
# 3. THE 6 CLINICAL SAFETY INVARIANT VERIFICATION FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def verify_invariants(patient: ClinicalPersona, scenario: SymptomScenario, sim: SimulationImpactResult) -> List[str]:
    """
    Evaluates simulation output against all 6 non-negotiable medical safety invariants.
    Returns a list of violation strings (empty if 100% compliant).
    """
    violations: List[str] = []

    # Parse patient vitals
    sbp = 120
    try:
        if "/" in patient.resting_bp:
            sbp = int(patient.resting_bp.split("/")[0].strip())
    except Exception:
        sbp = 120
    hr = patient.resting_hr or 75
    shock_index = hr / max(1, sbp)
    spo2 = patient.spo2 or 98
    rr = patient.rr or 16

    cond_str = " ".join(patient.conditions).lower()
    med_str = " ".join(patient.medications).lower()
    all_advice_text = " ".join(sim.allopathic_management + sim.lifestyle_guidelines).lower()
    ddi_alerts_text = " ".join(sim.ddi_contraindications)

    is_shock_state = (shock_index > 1.0 or sbp < 90 or spo2 < 90 or rr > 28)

    # ─────────────────────────────────────────────────────────────────────────
    # INVARIANT 1: Hemodynamic Shock & Vital Sign Circuit Breaker
    # ─────────────────────────────────────────────────────────────────────────
    if is_shock_state:
        if sim.triage_level not in ["EMERGENCY", "EMERGENCY (OBSTETRIC)"]:
            violations.append(
                f"INV1_SHOCK_BREAKER_FAILED: Patient with critical vitals (SBP {sbp}, HR {hr}, SI {shock_index:.2f}, SpO2 {spo2}%, RR {rr}) received non-emergency triage '{sim.triage_level}'."
            )
        if not sim.red_flag_triggered:
            violations.append(
                f"INV1_RED_FLAG_MISSING_IN_SHOCK: red_flag_triggered was False despite critical hemodynamic shock."
            )
        # Positioning: In hypovolemic / bleeding shock, head-up semi-Fowler position is contraindicated
        if (scenario.emergency_type in ["UPPER_GI_BLEED", "HYPOVOLEMIC_SHOCK"] or scenario.id in [6, 10] or sbp < 90 or shock_index > 1.0):
            if any("semi-fowler" in l.lower() for l in sim.lifestyle_guidelines):
                violations.append(
                    f"INV1_HAZARDOUS_HEAD_UP_POSITIONING: Patient in hypovolemic/hypotensive shock was instructed to assume head-up semi-Fowler position instead of supine with legs elevated / recovery position."
                )

    # ─────────────────────────────────────────────────────────────────────────
    # INVARIANT 2: Life-Threatening Red-Flag Pathology Hard Stops
    # ─────────────────────────────────────────────────────────────────────────
    is_stroke_scenario = (scenario.id == 9 or scenario.emergency_type == "STROKE_FAST")
    is_gi_bleed_scenario = (scenario.id == 6 or scenario.emergency_type == "UPPER_GI_BLEED")
    is_diabetic_acs = (scenario.id == 1 and ("diabetes" in cond_str or (patient.age >= 60 and ("hypertension" in cond_str or "smoker" in str(patient.lifestyle)))))

    if is_stroke_scenario or is_gi_bleed_scenario or is_diabetic_acs:
        if sim.triage_level not in ["EMERGENCY", "EMERGENCY (OBSTETRIC)"]:
            violations.append(
                f"INV2_RED_FLAG_PATHOLOGY_ESCAPE: Critical presentation (Scenario {scenario.id}: {scenario.title}) triaged as '{sim.triage_level}' instead of EMERGENCY."
            )
        if not sim.red_flag_triggered:
            violations.append(
                f"INV2_PATHOLOGY_RED_FLAG_NOT_SET: Scenario {scenario.id} did not set red_flag_triggered."
            )
        # Must have emergency ambulance / transport instruction
        has_ambulance_dispatch = any(
            ("112" in a or "ambulance" in a.lower() or "emergency" in a.lower())
            for a in sim.allopathic_management
        )
        if not has_ambulance_dispatch:
            violations.append(
                f"INV2_AMBULANCE_DISPATCH_MISSING: Red-flag pathology (Scenario {scenario.id}) allopathic recommendations missing ambulance/emergency transfer instructions."
            )

    # ─────────────────────────────────────────────────────────────────────────
    # INVARIANT 3: Drug-Disease & Drug-Drug (DDI) Safety Shield
    # ─────────────────────────────────────────────────────────────────────────
    # 3A: Renal NSAID Contraindication
    has_ckd = ("kidney" in cond_str or "ckd" in cond_str or (patient.egfr is not None and patient.egfr < 60))
    if has_ckd:
        if not any("RENAL" in a or "NSAID" in a for a in sim.ddi_contraindications):
            violations.append(
                f"INV3A_RENAL_NSAID_ESCAPE: CKD patient (eGFR {patient.egfr}) lacked Renal NSAID contraindication alert."
            )

    # 3B: Pregnancy Safety Shield
    if patient.is_pregnant:
        if not any("PREGNANCY" in a for a in sim.ddi_contraindications):
            violations.append(
                f"INV3B_PREGNANCY_SHIELD_ESCAPE: Pregnant patient ({patient.pregnancy_weeks} weeks) lacked Pregnancy Medication Safety alert."
            )

    # 3C: Hemostatic Bleed Alert
    has_anticoag = any(d in med_str for d in ["apixaban", "aspirin", "clopidogrel", "warfarin", "rivaroxaban", "dabigatran", "heparin"])
    if has_anticoag:
        if not any("HEMOSTATIC" in a for a in sim.ddi_contraindications):
            violations.append(
                f"INV3C_HEMOSTATIC_ALERT_ESCAPE: Patient on anticoagulant/antiplatelet lacked Hemostatic Alert."
            )

    # 3D: Metformin Sick-Day Rule
    has_metformin = "metformin" in med_str
    if has_metformin and (scenario.id in [2, 7, 10] or is_shock_state or "dehydration" in scenario.title.lower()):
        if not any("METFORMIN" in a for a in sim.ddi_contraindications):
            violations.append(
                f"INV3D_METFORMIN_SICK_DAY_ESCAPE: Patient on Metformin in dehydrating/septic presentation (Scenario {scenario.id}) lacked Metformin Sick-Day hold alert."
            )

    # 3E: Combined Oral Contraceptive & Migraine Aura (WHO MEC 4) / VTE Risk
    has_ocp = any(c in med_str for c in ["contraceptive", "ethinylestradiol", "estrogen", "ocp"])
    if has_ocp:
        is_aura = (scenario.id in [3, 9, 13] or "aura" in cond_str or "aura" in scenario.title.lower())
        if is_aura:
            if not any("WHO MEC CATEGORY 4" in a for a in sim.ddi_contraindications):
                violations.append(
                    f"INV3E_WHO_MEC4_ESCAPE: Female on OCP with migraine with aura lacked WHO MEC Category 4 contraindication alert."
                )
        elif scenario.id in [1, 2]:
            if not any("ESTROGEN / VTE ALERT" in a for a in sim.ddi_contraindications):
                violations.append(
                    f"INV3E_ESTROGEN_VTE_ESCAPE: Female on OCP with cardiopulmonary presentation lacked Estrogen / VTE alert."
                )
        else:
            if not any("ESTROGEN" in a for a in sim.ddi_contraindications):
                violations.append(
                    f"INV3E_ESTROGEN_SAFETY_ESCAPE: Female on OCP lacked Estrogen safety alert."
                )

    # 3F: Serotonergic Safety Caution (SSRI/SNRI + Triptan)
    has_serotonergic = any(s in med_str for s in ["duloxetine", "snri", "ssri", "sertraline", "fluoxetine", "escitalopram", "venlafaxine"])
    has_triptan = any(t in med_str for t in ["triptan", "rizatriptan", "sumatriptan", "zolmitriptan"])
    if has_serotonergic and has_triptan:
        if not any("SEROTONERGIC" in a for a in sim.ddi_contraindications):
            violations.append(
                f"INV3F_SEROTONIN_SYNDROME_ESCAPE: Concomitant SSRI/SNRI and Triptan lacked Serotonergic Caution alert."
            )

    # 3G: Severe Allergy Shields
    for allergy in patient.allergies:
        al_lower = allergy.lower()
        if "aspirin" in al_lower or "nsaid" in al_lower or "ibuprofen" in al_lower:
            if not any("ALLERGY SHIELD (SEVERE NSAID HYPERSENSITIVITY)" in a for a in sim.ddi_contraindications):
                violations.append(
                    f"INV3G_ALLERGY_SHIELD_ESCAPE: Patient with documented Aspirin/NSAID hypersensitivity lacked severe NSAID allergy shield."
                )
        if "penicillin" in al_lower:
            if not any("Penicillin" in a for a in sim.ddi_contraindications):
                violations.append(
                    f"INV3G_PENICILLIN_ALLERGY_ESCAPE: Patient with documented Penicillin allergy lacked penicillin alert."
                )

    # ─────────────────────────────────────────────────────────────────────────
    # INVARIANT 4: Triage & Narrative Synchronization (Zero Contradictions)
    # ─────────────────────────────────────────────────────────────────────────
    has_immediate_ambulance = any("immediate 112/911 ambulance transport" in a.lower() for a in sim.allopathic_management)
    if has_immediate_ambulance and sim.triage_level not in ["EMERGENCY", "EMERGENCY (OBSTETRIC)"]:
        violations.append(
            f"INV4_TRIAGE_NARRATIVE_CONTRADICTION: Advice mandates 'Immediate 112/911 ambulance transport', but triage level is '{sim.triage_level}'."
        )
    if sim.triage_level == "ROUTINE" and has_immediate_ambulance:
        violations.append(
            f"INV4_ROUTINE_AMBULANCE_CONTRADICTION: ROUTINE triage co-exists with immediate ambulance instruction."
        )

    # ─────────────────────────────────────────────────────────────────────────
    # INVARIANT 5: Organ Strain Index Calibration & Bounds
    # ─────────────────────────────────────────────────────────────────────────
    for organ_key, strain_val in sim.organ_burden.items():
        if not (0 <= strain_val <= 100):
            violations.append(
                f"INV5_ORGAN_STRAIN_OUT_OF_BOUNDS: Organ '{organ_key}' strain {strain_val} is outside [0, 100]."
            )

    # Monotonic scaling check: Acute insult on chronically diseased organ must produce strain >= 70
    if scenario.id == 1 and ("cad" in cond_str or "heart failure" in cond_str):
        if sim.organ_burden["cardiovascular"] < 70:
            violations.append(
                f"INV5_STRAIN_CALIBRATION_DEFECT: Acute chest pain in CAD/CHF patient produced cardiovascular strain {sim.organ_burden['cardiovascular']} (< 70)."
            )
    if scenario.id == 7 and has_ckd:
        if sim.organ_burden["renal_metabolic"] < 70:
            violations.append(
                f"INV5_STRAIN_CALIBRATION_DEFECT: Severe pyelonephritis in CKD patient produced renal strain {sim.organ_burden['renal_metabolic']} (< 70)."
            )
    if scenario.id == 8 and ("asthma" in cond_str or "copd" in cond_str or "byssinosis" in cond_str):
        if sim.organ_burden["respiratory"] < 70:
            violations.append(
                f"INV5_STRAIN_CALIBRATION_DEFECT: Severe bronchospasm in chronic lung patient produced respiratory strain {sim.organ_burden['respiratory']} (< 70)."
            )

    # ─────────────────────────────────────────────────────────────────────────
    # INVARIANT 6: Bayesian Posterior Probability Coherence
    # ─────────────────────────────────────────────────────────────────────────
    for diff in sim.bayesian_differentials:
        post_pct = diff.get("posterior_pct", 0.0)
        if not (0.0 < post_pct < 100.0):
            violations.append(
                f"INV6_BAYESIAN_PROBABILITY_INVALID: Differential '{diff.get('disease')}' posterior {post_pct}% not in (0%, 100%)."
            )
        if diff.get("multiplier", 0.0) <= 0.0:
            violations.append(
                f"INV6_NEGATIVE_COVARIATE_MULTIPLIER: Differential '{diff.get('disease')}' has non-positive multiplier {diff.get('multiplier')}."
            )

    # Sum of posteriors should normalize to ~100% (99.0% - 101.0% due to rounding)
    prob_sum = sum(d.get("posterior_pct", 0.0) for d in sim.bayesian_differentials)
    if not (98.5 <= prob_sum <= 101.5):
        violations.append(
            f"INV6_PROBABILITY_NORMALIZATION_DEFECT: Differentials sum to {prob_sum:.1f}% (expected ~100.0%)."
        )

    return violations


# ─────────────────────────────────────────────────────────────────────────────
# 4. HIGH-PERFORMANCE MULTIPROCESSING BATCH HARNESS
# ─────────────────────────────────────────────────────────────────────────────

def run_worker_batch(args: Tuple[int, int, int]) -> Dict[str, Any]:
    """
    Worker task: generates and validates a batch of patients.
    args: (start_id, batch_size, master_seed)
    """
    start_id, batch_size, master_seed = args
    rng = random.Random(master_seed + start_id)

    total_tested = 0
    total_passed = 0
    violations_by_invariant: Dict[str, int] = {
        "INV1_SHOCK_BREAKER": 0,
        "INV2_RED_FLAG_PATHOLOGY": 0,
        "INV3_DDI_SAFETY_SHIELD": 0,
        "INV4_TRIAGE_SYNCHRONIZATION": 0,
        "INV5_ORGAN_STRAIN_BOUNDS": 0,
        "INV6_BAYESIAN_COHERENCE": 0
    }
    quarantined_anomalies: List[Dict[str, Any]] = []

    # Category tally for audit
    triage_distribution: Dict[str, int] = {
        "EMERGENCY": 0,
        "EMERGENCY (OBSTETRIC)": 0,
        "URGENT": 0,
        "URGENT (RULE-OUT)": 0,
        "SEMI-URGENT": 0,
        "ROUTINE": 0
    }
    ddi_alert_count = 0
    shock_case_count = 0
    pregnancy_case_count = 0

    for i in range(batch_size):
        patient_id = start_id + i
        patient, scenario = generate_synthetic_patient(patient_id, rng)
        sim_result = ClinicalImpactEngine.simulate(patient, scenario)

        total_tested += 1

        # Tally metrics
        t_level = sim_result.triage_level
        triage_distribution[t_level] = triage_distribution.get(t_level, 0) + 1

        if patient.is_pregnant:
            pregnancy_case_count += 1
        if (patient.resting_hr / max(1, int(patient.resting_bp.split("/")[0])) > 1.0) or (int(patient.resting_bp.split("/")[0]) < 90):
            shock_case_count += 1
        if any("✓ No immediate" not in a for a in sim_result.ddi_contraindications):
            ddi_alert_count += 1

        # Check invariants
        violations = verify_invariants(patient, scenario, sim_result)
        if not violations:
            total_passed += 1
        else:
            for v in violations:
                if v.startswith("INV1"):
                    violations_by_invariant["INV1_SHOCK_BREAKER"] += 1
                elif v.startswith("INV2"):
                    violations_by_invariant["INV2_RED_FLAG_PATHOLOGY"] += 1
                elif v.startswith("INV3"):
                    violations_by_invariant["INV3_DDI_SAFETY_SHIELD"] += 1
                elif v.startswith("INV4"):
                    violations_by_invariant["INV4_TRIAGE_SYNCHRONIZATION"] += 1
                elif v.startswith("INV5"):
                    violations_by_invariant["INV5_ORGAN_STRAIN_BOUNDS"] += 1
                elif v.startswith("INV6"):
                    violations_by_invariant["INV6_BAYESIAN_COHERENCE"] += 1

            if len(quarantined_anomalies) < 10:  # Cap per batch to avoid memory explosion
                quarantined_anomalies.append({
                    "patient_id": patient_id,
                    "patient_profile": {
                        "name": patient.name,
                        "age": patient.age,
                        "sex": patient.sex,
                        "is_pregnant": patient.is_pregnant,
                        "vitals": f"BP {patient.resting_bp}, HR {patient.resting_hr}, SpO2 {patient.spo2}%, RR {patient.rr}",
                        "egfr": patient.egfr,
                        "conditions": patient.conditions,
                        "medications": patient.medications,
                        "allergies": patient.allergies
                    },
                    "scenario": {
                        "id": scenario.id,
                        "title": scenario.title
                    },
                    "engine_output": {
                        "triage_level": sim_result.triage_level,
                        "red_flag_triggered": sim_result.red_flag_triggered,
                        "ddi_alerts": sim_result.ddi_contraindications,
                        "recommendations": sim_result.allopathic_management[:2]
                    },
                    "violations": violations
                })

    return {
        "total_tested": total_tested,
        "total_passed": total_passed,
        "violations_by_invariant": violations_by_invariant,
        "triage_distribution": triage_distribution,
        "ddi_alert_count": ddi_alert_count,
        "shock_case_count": shock_case_count,
        "pregnancy_case_count": pregnancy_case_count,
        "quarantined_anomalies": quarantined_anomalies
    }


# ─────────────────────────────────────────────────────────────────────────────
# 5. MAIN ORCHESTRATION & REPORT GENERATION
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Arovia 500,000-Patient Monte Carlo Clinical Stress Tester")
    parser.add_argument("--count", type=int, default=500000, help="Total patient simulations to execute (default: 500,000)")
    parser.add_argument("--batch-size", type=int, default=5000, help="Chunk size per multiprocessing batch (default: 5,000)")
    parser.add_argument("--workers", type=int, default=max(1, cpu_count() - 1), help="Number of CPU worker processes")
    parser.add_argument("--seed", type=int, default=20261019, help="Deterministic pseudo-random master seed")
    parser.add_argument("--output-json", type=str, default="output/500k_clinical_audit_report.json", help="Destination path for audit report")
    parser.add_argument("--quiet", action="store_true", help="Suppress progress logs")
    args = parser.parse_args()

    total_patients = args.count
    batch_size = args.batch_size
    num_workers = args.workers
    master_seed = args.seed
    output_path = Path(args.output_json)

    print("=" * 80)
    print("🏥 AROVIA / HEALIO.AI — 500,000-PATIENT CLINICAL MONTE CARLO STRESS TEST")
    print("=" * 80)
    print(f"Target Patient Cohort : {total_patients:,} synthetic consultations")
    print(f"Parallel Worker Cores : {num_workers} processes (Batch Chunk: {batch_size:,})")
    print(f"Deterministic Seed    : {master_seed}")
    print(f"Safety Invariants     : 6 Hard Mathematical & Clinical Shields")
    print("=" * 80)

    # Construct batch jobs
    batches = []
    curr_id = 1
    while curr_id <= total_patients:
        curr_batch_size = min(batch_size, total_patients - curr_id + 1)
        batches.append((curr_id, curr_batch_size, master_seed))
        curr_id += curr_batch_size

    print(f"Launching {len(batches)} batches across {num_workers} parallel workers...\n")

    t_start = time.time()

    total_tested_agg = 0
    total_passed_agg = 0
    violations_agg = {
        "INV1_SHOCK_BREAKER": 0,
        "INV2_RED_FLAG_PATHOLOGY": 0,
        "INV3_DDI_SAFETY_SHIELD": 0,
        "INV4_TRIAGE_SYNCHRONIZATION": 0,
        "INV5_ORGAN_STRAIN_BOUNDS": 0,
        "INV6_BAYESIAN_COHERENCE": 0
    }
    triage_agg: Dict[str, int] = {}
    ddi_alert_count_agg = 0
    shock_case_count_agg = 0
    pregnancy_case_count_agg = 0
    quarantine_agg: List[Dict[str, Any]] = []

    # Execute with multiprocessing Pool
    completed_batches = 0
    with Pool(processes=num_workers) as pool:
        for result in pool.imap_unordered(run_worker_batch, batches):
            total_tested_agg += result["total_tested"]
            total_passed_agg += result["total_passed"]
            ddi_alert_count_agg += result["ddi_alert_count"]
            shock_case_count_agg += result["shock_case_count"]
            pregnancy_case_count_agg += result["pregnancy_case_count"]

            for k, v in result["violations_by_invariant"].items():
                violations_agg[k] += v

            for t_k, t_v in result["triage_distribution"].items():
                triage_agg[t_k] = triage_agg.get(t_k, 0) + t_v

            if len(quarantine_agg) < 50:
                quarantine_agg.extend(result["quarantined_anomalies"])

            completed_batches += 1
            if not args.quiet and (completed_batches % 10 == 0 or completed_batches == len(batches)):
                pct = (total_tested_agg / total_patients) * 100
                elapsed = time.time() - t_start
                rate = total_tested_agg / max(0.001, elapsed)
                print(f"  [Progress] {total_tested_agg:7,d} / {total_patients:,} ({pct:5.1f}%) | "
                      f"Pass Rate: {(total_passed_agg/total_tested_agg)*100:6.2f}% | "
                      f"Speed: {rate:6.0f} sim/sec | Elapsed: {elapsed:4.1f}s")

    t_end = time.time()
    total_duration = t_end - t_start
    overall_pass_rate = (total_passed_agg / total_tested_agg) * 100 if total_tested_agg else 0.0

    print("\n" + "=" * 80)
    print("📊 500,000-PATIENT MONTE CARLO AUDIT RESULTS SUMMARY")
    print("=" * 80)
    print(f"Total Patient Permutations Evaluated : {total_tested_agg:,}")
    print(f"Passed All 6 Safety Invariants      : {total_passed_agg:,} ({overall_pass_rate:.4f}%)")
    print(f"Total Execution Time                 : {total_duration:.2f} seconds ({total_tested_agg / total_duration:.0f} sim/sec)")
    print("-" * 80)
    print("INVARIANT BREAKDOWN:")
    for inv_name, count in violations_agg.items():
        status = "PASSED (0 violations)" if count == 0 else f"FAILED ({count:,} violations)"
        print(f"  • {inv_name:<30} : {status}")

    print("-" * 80)
    print("CLINICAL COHORT EPIDEMIOLOGY:")
    print(f"  • Pregnant Patients Evaluated      : {pregnancy_case_count_agg:,} ({(pregnancy_case_count_agg/total_tested_agg)*100:.2f}%)")
    print(f"  • Acute Hemodynamic Shock Cases    : {shock_case_count_agg:,} ({(shock_case_count_agg/total_tested_agg)*100:.2f}%)")
    print(f"  • Active DDI Alerts Triggered      : {ddi_alert_count_agg:,} ({(ddi_alert_count_agg/total_tested_agg)*100:.2f}%)")
    print("TRIAGE DISTRIBUTION:")
    for tr, tr_count in sorted(triage_agg.items(), key=lambda x: x[1], reverse=True):
        print(f"  • {tr:<25} : {tr_count:7,d} ({(tr_count/total_tested_agg)*100:5.2f}%)")
    print("=" * 80)

    # Build and export audit JSON report
    audit_report = {
        "metadata": {
            "title": "Arovia / Healio.AI — 500,000-Patient Clinical Monte Carlo Verification Certificate",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%SZ", time.gmtime()),
            "total_simulations": total_tested_agg,
            "master_seed": master_seed,
            "execution_duration_seconds": round(total_duration, 2),
            "throughput_sim_per_second": round(total_tested_agg / total_duration, 1),
            "cpu_workers": num_workers
        },
        "safety_summary": {
            "overall_pass_rate_percent": round(overall_pass_rate, 4),
            "total_passed": total_passed_agg,
            "total_failed": total_tested_agg - total_passed_agg,
            "compliance_status": "CERTIFIED_SAFE" if total_passed_agg == total_tested_agg else "DEFECTS_DETECTED",
            "invariants": {
                "INV1_Hemodynamic_Shock_Breaker": {
                    "violations": violations_agg["INV1_SHOCK_BREAKER"],
                    "status": "PASSED" if violations_agg["INV1_SHOCK_BREAKER"] == 0 else "FAILED"
                },
                "INV2_Red_Flag_Pathology_Stops": {
                    "violations": violations_agg["INV2_RED_FLAG_PATHOLOGY"],
                    "status": "PASSED" if violations_agg["INV2_RED_FLAG_PATHOLOGY"] == 0 else "FAILED"
                },
                "INV3_Drug_Disease_Drug_Drug_Safety_Shield": {
                    "violations": violations_agg["INV3_DDI_SAFETY_SHIELD"],
                    "status": "PASSED" if violations_agg["INV3_DDI_SAFETY_SHIELD"] == 0 else "FAILED"
                },
                "INV4_Triage_Narrative_Synchronization": {
                    "violations": violations_agg["INV4_TRIAGE_SYNCHRONIZATION"],
                    "status": "PASSED" if violations_agg["INV4_TRIAGE_SYNCHRONIZATION"] == 0 else "FAILED"
                },
                "INV5_Organ_Strain_Calibration_Bounds": {
                    "violations": violations_agg["INV5_ORGAN_STRAIN_BOUNDS"],
                    "status": "PASSED" if violations_agg["INV5_ORGAN_STRAIN_BOUNDS"] == 0 else "FAILED"
                },
                "INV6_Bayesian_Probability_Coherence": {
                    "violations": violations_agg["INV6_BAYESIAN_COHERENCE"],
                    "status": "PASSED" if violations_agg["INV6_BAYESIAN_COHERENCE"] == 0 else "FAILED"
                }
            }
        },
        "epidemiology": {
            "pregnancy_cases": pregnancy_case_count_agg,
            "hemodynamic_shock_cases": shock_case_count_agg,
            "active_ddi_alerts_triggered": ddi_alert_count_agg,
            "triage_distribution": triage_agg
        },
        "quarantined_sample_anomalies": quarantine_agg[:20]
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(audit_report, f, indent=2)

    print(f"✅ Full Clinical Audit Dossier saved to: {output_path.resolve()}\n")

    if total_passed_agg != total_tested_agg:
        print(f"❌ TEST FAILED: {total_tested_agg - total_passed_agg} anomaly violations detected.")
        sys.exit(1)
    else:
        print("🎉 100.0000% CLINICAL SAFETY VERIFICATION ACHIEVED ACROSS ALL 500,000 PATIENTS!")
        sys.exit(0)


if __name__ == "__main__":
    main()
