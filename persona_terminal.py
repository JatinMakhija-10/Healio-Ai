#!/usr/bin/env python3
"""
Arovia / Healio.AI — Clinical Health Persona & Disease Impact Terminal Simulator
================================================================================
An interactive clinical terminal application designed to:
  1. Inspect 18 diverse, highly calibrated clinical personas spanning demographics,
     occupations, chronic diseases, lifestyles, diets, frailty indices, and polypharmacy.
  2. Simulate how acute diseases & symptoms affect different personas along multiple dimensions:
       • Bayesian Covariate Prior Shifts & Differential Diagnosis Posterior Probabilities
       • Multi-System Organ Burden (Cardiovascular, Renal/Metabolic, Respiratory, GI/Hepatic, Neuro)
       • Drug-Drug & Drug-Disease Interaction (DDI) Safety Contraindication Alerts
       • Frailty Surge, Pain Scale, Functional Mobility Loss, and Work Disruption
       • Emergency Red Flag Detection & Clinical Triage Level
       • Multi-Modal Personalized Management (Allopathic, Safe Ayush/Ayurvedic, Kitchen Remedies)
  3. Run Cross-Persona Stress Tests ("The Matrix"): Compare 5 to 18 personas responding
     to the EXACT same symptom side-by-side to visualize epidemiological divergence.
  4. Perform Head-to-Head Comparisons (e.g. Athlete vs Geriatric Polypharmacy Diabetic).
  5. Interactively construct and test Custom Personas on the fly.
  6. Export rich Markdown reports to the workspace.

Usage:
  Interactive Mode:
    python persona_terminal.py

  CLI / Quick Run Modes:
    python persona_terminal.py --list
    python persona_terminal.py --inspect 1
    python persona_terminal.py --matrix --symptom 1
    python persona_terminal.py --simulate --persona 1 --symptom 1
    python persona_terminal.py --compare --p1 5 --p2 1 --symptom 1
    python persona_terminal.py --export
"""

import sys
import os
import math
import argparse
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Set, Tuple
from pathlib import Path

# Fix Windows console encoding for UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    from rich.columns import Columns
    from rich.prompt import Prompt, Confirm, IntPrompt
    from rich.text import Text
    from rich.layout import Layout
    from rich.progress import BarColumn, Progress, TextColumn
    from rich.style import Style
    from rich import box
    RICH_AVAILABLE = True
    console = Console()
except ImportError:
    RICH_AVAILABLE = False
    console = None
    print("[WARNING] 'rich' library not found. Falling back to ANSI text output.")


# ─────────────────────────────────────────────────────────────────────────────
# 1. DATA MODELS: CLINICAL PERSONA & SYMPTOM SCENARIO
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class ClinicalPersona:
    id: int
    name: str
    age: int
    sex: str  # 'male' | 'female'
    occupation: str
    location: str
    height_cm: float
    weight_kg: float
    resting_bp: str
    resting_hr: int
    diet_profile: str
    lifestyle: Dict[str, Any]
    conditions: List[str]
    medications: List[str]
    allergies: List[str]
    family_history: List[str]
    frailty_index: int       # 0 - 10 clinical frailty index
    polypharmacy_risk: str   # 'none' | 'low' | 'moderate' | 'high' | 'critical'
    is_pregnant: bool = False
    pregnancy_weeks: Optional[int] = None
    key_quote: str = ""

    @property
    def bmi(self) -> float:
        h_m = self.height_cm / 100.0
        return round(self.weight_kg / (h_m * h_m), 1)

    @property
    def bmi_category(self) -> str:
        bmi = self.bmi
        if bmi < 18.5:
            return "Underweight"
        elif bmi < 25.0:
            return "Normal"
        elif bmi < 30.0:
            return "Overweight"
        elif bmi < 35.0:
            return "Obese Class I"
        elif bmi < 40.0:
            return "Obese Class II"
        else:
            return "Obese Class III (Morbid)"


@dataclass
class SymptomScenario:
    id: int
    title: str
    category: str
    chief_complaint: str
    duration: str
    description: str
    cardinal_symptoms: List[str]
    vital_signs_impact: Dict[str, str]
    base_differentials: List[Dict[str, Any]]
    base_organ_burden: Dict[str, int]  # cardio, renal, resp, gi, neuro (0-100)
    is_emergency_trigger: bool = False
    emergency_type: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# 2. THE 18 DIVERSE CLINICAL PERSONAS
# ─────────────────────────────────────────────────────────────────────────────

PERSONAS: List[ClinicalPersona] = [
    ClinicalPersona(
        id=1,
        name="Ramesh Sharma",
        age=68,
        sex="male",
        occupation="Retired Bank Clerk",
        location="New Delhi",
        height_cm=168,
        weight_kg=84,
        resting_bp="148/92",
        resting_hr=76,
        diet_profile="High-salt Indian vegetarian, samosas, sweets, 4x milky sugary chai/day",
        lifestyle={
            "exercise": "Sedentary (mostly watching TV)",
            "sleep_hours": 5.5,
            "smoking": "Former light smoker (quit 12 yrs ago)",
            "alcohol": "None",
            "stress_level": "Medium (financial & health worries)",
            "circadian": "Fragmented, multiple nocturia awakenings"
        },
        conditions=["Type 2 Diabetes Mellitus (15 yrs)", "Essential Hypertension (18 yrs)", "Stage 3a Chronic Kidney Disease (eGFR 48 mL/min)", "Diabetic Retinopathy (Mild)"],
        medications=["Metformin 1000mg BID", "Glimepiride 2mg OD", "Telmisartan 40mg OD", "Atorvastatin 20mg OD", "Aspirin 75mg OD"],
        allergies=["Sulfa drugs (rash)"],
        family_history=["Father: Fatal Myocardial Infarction at 56", "Mother: Type 2 Diabetes & Stroke"],
        frailty_index=6,
        polypharmacy_risk="high",
        key_quote="\"I take five pills every morning with my tea. My legs swell if I walk too much, but I try not to bother my children.\""
    ),

    ClinicalPersona(
        id=2,
        name="Aanya Sen",
        age=23,
        sex="female",
        occupation="Junior Software Engineer",
        location="Bengaluru",
        height_cm=162,
        weight_kg=51,
        resting_bp="106/70",
        resting_hr=82,
        diet_profile="Junk-heavy, erratic delivery apps, skips breakfast, 4-5 espressos/day",
        lifestyle={
            "exercise": "Sedentary (11+ hours desk bound)",
            "sleep_hours": 4.5,
            "smoking": "Occasional social vaping",
            "alcohol": "Social weekend cocktails (2-3 drinks)",
            "stress_level": "High (startup sprint deadlines)",
            "circadian": "Night owl (sleeps 3 AM - 8 AM)"
        },
        conditions=["Polycystic Ovary Syndrome (PCOS, on Combined Oral Contraceptive therapy)", "Chronic Psychogenic Insomnia", "Generalized Anxiety Disorder"],
        medications=["Combined Oral Contraceptive (Drospirenone / Ethinylestradiol)", "Melatonin 3mg PRN"],
        allergies=["House dust mites", "Tree pollen"],
        family_history=["Maternal aunt: Breast cancer", "Mother: Hypothyroidism"],
        frailty_index=2,
        polypharmacy_risk="low",
        key_quote="\"I live on coffee and cold brew. My Apple watch constantly warns me that my resting heart rate is over 80 and my sleep debt is massive.\""
    ),

    ClinicalPersona(
        id=3,
        name="Gurpreet Singh",
        age=42,
        sex="male",
        occupation="Interstate Long-Haul Truck Driver",
        location="Ludhiana / NH-44",
        height_cm=175,
        weight_kg=106,
        resting_bp="154/98",
        resting_hr=88,
        diet_profile="High-fat dhaba food, butter parathas, sweet lassi, energy drinks",
        lifestyle={
            "exercise": "Sedentary (driving 14 hrs daily)",
            "sleep_hours": 5.0,
            "smoking": "Heavy active smoker (20 bidis/cigarettes per day)",
            "alcohol": "Heavy weekend country liquor / whisky",
            "stress_level": "High (road safety, delivery quotas)",
            "circadian": "Fragmented irregular truck-cabin sleep"
        },
        conditions=["Severe Obstructive Sleep Apnea (OSA, untreated)", "Non-Alcoholic Fatty Liver Disease (NAFLD, Grade 2)", "Chronic Lumbar Spondylosis & Sciatica"],
        medications=["Self-medicating Ibuprofen 600mg daily (OTC)", "Omeprazole 20mg PRN"],
        allergies=["None known"],
        family_history=["Father: Sudden cardiac arrest at 50", "Brother: Hypertension"],
        frailty_index=4,
        polypharmacy_risk="low",
        key_quote="\"My lower back throbs constantly from the highway potholes. I pop Brufen tablets like peanuts just to finish my delivery shifts.\""
    ),

    ClinicalPersona(
        id=4,
        name="Meera Nambiar",
        age=32,
        sex="female",
        occupation="High School Biology Teacher",
        location="Kochi",
        height_cm=158,
        weight_kg=64,
        resting_bp="112/74",
        resting_hr=84,
        diet_profile="Strict traditional lacto-vegetarian, organic home-cooked, zero caffeine",
        lifestyle={
            "exercise": "Moderate (standing during lectures + prenatal walks)",
            "sleep_hours": 8.0,
            "smoking": "Never",
            "alcohol": "Never",
            "stress_level": "Low-to-Medium (preparing for first child)",
            "circadian": "Balanced, early to bed (10 PM - 6 AM)"
        },
        conditions=["Gestational Anemia (Hb 9.8 g/dL)", "Mild Gestational Thrombocytopenia (Platelets 135k)", "Morning Sickness / Reflux"],
        medications=["Ferrous Ascorbate 100mg OD", "Folic Acid 5mg OD", "Calcium Carbonate 500mg + Vit D3"],
        allergies=["Penicillin (severe anaphylactoid urticaria)"],
        family_history=["Mother: Gestational diabetes during both pregnancies", "Father: Asthma"],
        frailty_index=2,
        polypharmacy_risk="low",
        is_pregnant=True,
        pregnancy_weeks=26,
        key_quote="\"I am 26 weeks pregnant with our first baby. Every single symptom worries me because I want to make sure the baby is 100% safe from harmful medicines.\""
    ),

    ClinicalPersona(
        id=5,
        name="Vikramaditya 'Vik' Rathore",
        age=19,
        sex="male",
        occupation="Collegiate 400m Sprinter & Kinesiology Student",
        location="Jaipur",
        height_cm=183,
        weight_kg=76,
        resting_bp="108/66",
        resting_hr=46,  # Athletic bradycardia
        diet_profile="Strict macro-tracked high-protein athletic diet (3200 kcal, lean chicken, eggs, oats, hydration salts)",
        lifestyle={
            "exercise": "Vigorous track and weight training 6 days/week (2.5 hrs/day)",
            "sleep_hours": 9.0,
            "smoking": "Never",
            "alcohol": "Never",
            "stress_level": "Medium (competitive sports trials)",
            "circadian": "Strict circadian alignment (10 PM - 7 AM)"
        },
        conditions=["Exercise-Induced Bronchoconstriction (EIB / Asthma)", "History of recurrent Right Hamstring Strain"],
        medications=["Salbutamol (Albuterol) MDI 100mcg PRN pre-race", "Whey Protein Isolate", "Creatine Monohydrate 5g"],
        allergies=["None known"],
        family_history=["Father: Highly fit marathoner", "No cardiac or metabolic history"],
        frailty_index=0,
        polypharmacy_risk="none",
        key_quote="\"My body is my engine. My resting heart rate is in the 40s. When I get chest tightness, it's usually my bronchi clamping during max sprints.\""
    ),

    ClinicalPersona(
        id=6,
        name="Devaki Patel",
        age=74,
        sex="female",
        occupation="Homemaker & Grandmother",
        location="Ahmedabad",
        height_cm=150,
        weight_kg=42,
        resting_bp="134/82",
        resting_hr=72,
        diet_profile="Traditional Gujarati vegetarian, soft khichdi, very low protein, tea & milk, low fluid intake",
        lifestyle={
            "exercise": "Very low mobility (uses four-prong walking cane indoors)",
            "sleep_hours": 6.0,
            "smoking": "Never",
            "alcohol": "Never",
            "stress_level": "Medium (fear of falling & losing independence)",
            "circadian": "Early waker (4:30 AM), fragmented day naps"
        },
        conditions=["Severe Osteoporosis (T-score -3.4, prior Colles' wrist fracture)", "Bilateral Knee Osteoarthritis (Kellgren Grade 3)", "Early Vascular Cognitive Impairment", "Chronic Postural Instability"],
        medications=["Alendronate 70mg weekly", "Calcium Citrate 1000mg + Vit D3", "Paracetamol 650mg PRN", "Donepezil 5mg OD"],
        allergies=["Ciprofloxacin (severe Achilles tendonitis flare)"],
        family_history=["Mother: Hip fracture at 71", "Sister: Severe dementia"],
        frailty_index=7,
        polypharmacy_risk="moderate",
        key_quote="\"My knees ache with every step. I am terrified of slipping in the bathroom because the doctors said another bone break could put me in bed forever.\""
    ),

    ClinicalPersona(
        id=7,
        name="Sunita Bannerjee",
        age=49,
        sex="female",
        occupation="VP of Corporate Risk & Regulatory Compliance",
        location="Mumbai",
        height_cm=165,
        weight_kg=72,
        resting_bp="138/88",
        resting_hr=78,
        diet_profile="High-sodium restaurant catering, corporate five-star dinners, irregular salads, low fiber",
        lifestyle={
            "exercise": "Minimal (occasional weekend treadmill walk 20 mins)",
            "sleep_hours": 5.0,
            "smoking": "Non-smoker",
            "alcohol": "Social red wine (2 glasses twice a week)",
            "stress_level": "High (multi-million dollar compliance audits)",
            "circadian": "Frequent travel jetlag, late laptop work"
        },
        conditions=["Hashimoto's Autoimmune Hypothyroidism", "Dyslipidemia (Elevated LDL 154 mg/dL)", "Chronic Occupational Burnout Syndrome"],
        medications=["Levothyroxine 88mcg OD (empty stomach)", "Rosuvastatin 10mg OD"],
        allergies=["Codeine (severe nausea & syncope)"],
        family_history=["Mother: Hypothyroidism & Rheumatoid Arthritis", "Father: Hypertension"],
        frailty_index=3,
        polypharmacy_risk="low",
        key_quote="\"I manage corporate crises for a living, but by 3 PM my brain feels like heavy fog and my feet are ice cold even in Mumbai summers.\""
    ),

    ClinicalPersona(
        id=8,
        name="Karthik 'Koko' Roy",
        age=28,
        sex="male",
        occupation="Nightclub Mixologist & Audio Sound Producer",
        location="Goa / Pune",
        height_cm=172,
        weight_kg=70,
        resting_bp="126/82",
        resting_hr=86,
        diet_profile="Irregular midnight fast foods, spicy shawarmas, pizzas, heavy energy drinks & soda",
        lifestyle={
            "exercise": "Light (standing behind bar, pacing DJ console)",
            "sleep_hours": 6.0,
            "smoking": "Vapes nicotine daily, occasional cannabis",
            "alcohol": "Heavy vocational consumption (shifts 5 nights/week, 4-6 shots/drinks per shift)",
            "stress_level": "High (chaotic nightclub shifts & loud acoustic exposure)",
            "circadian": "Inverted nocturnal sleep (sleeps 5 AM to 12 PM)"
        },
        conditions=["Chronic Gastroesophageal Reflux Disease (GERD with Grade B Esophagitis)", "Bilateral Noise-Induced Tinnitus", "Social Anxiety Disorder"],
        medications=["Pantoprazole 40mg OD", "Sertraline 50mg OD", "Clonazepam 0.25mg PRN"],
        allergies=["NSAIDs (Aspirin/Ibuprofen induce immediate severe epigastric agony)"],
        family_history=["Father: Alcoholic liver cirrhosis", "Mother: Depression"],
        frailty_index=2,
        polypharmacy_risk="moderate",
        key_quote="\"When the acid surges up my throat at 4 AM, it feels like literal hot fire in my chest. Sometimes I wonder if it's my heart or just the tequila and hot wings.\""
    ),

    ClinicalPersona(
        id=9,
        name="Dr. Farooq Qureshi",
        age=58,
        sex="male",
        occupation="Senior Cardiothoracic Surgeon",
        location="Hyderabad",
        height_cm=176,
        weight_kg=83,
        resting_bp="142/90",
        resting_hr=74,
        diet_profile="Hospital canteen, hurried lunches, intermittent fasting by surgical default, black coffee 4x/day",
        lifestyle={
            "exercise": "Low (endurance standing in OR 6-8 hrs, minimal cardio)",
            "sleep_hours": 5.5,
            "smoking": "Former smoker (quit 20 yrs ago)",
            "alcohol": "None",
            "stress_level": "Extreme (life-or-death surgical cases)",
            "circadian": "Frequent emergency call disruptions"
        },
        conditions=["Coronary Artery Disease (s/p Drug-Eluting Stent to LAD 4 yrs ago)", "Asymptomatic Hyperuricemia & Mild Gout", "Bilateral Lower Extremity Varicose Veins"],
        medications=["Clopidogrel 75mg OD", "Metoprolol Succinate 50mg OD", "Ramipril 5mg OD", "Allopurinol 100mg OD"],
        allergies=["None known"],
        family_history=["Father: Fatal MI at 52", "Two brothers have CAD with CABG"],
        frailty_index=4,
        polypharmacy_risk="moderate",
        key_quote="\"I crack chests and bypass blocked arteries every single day. I know every millimeter of my own LAD stent and fear becoming my own patient.\""
    ),

    ClinicalPersona(
        id=10,
        name="Priyanka Rao",
        age=36,
        sex="female",
        occupation="Permaculture Farmer & Ashtanga Yoga Acharya",
        location="Coorg / Western Ghats",
        height_cm=160,
        weight_kg=50,
        resting_bp="102/66",
        resting_hr=54,
        diet_profile="100% whole-food organic vegan, zero refined oil, fermented millet kanji, wild herbs",
        lifestyle={
            "exercise": "Vigorous functional physical labor (digging, harvesting + 90 mins daily yoga)",
            "sleep_hours": 8.5,
            "smoking": "Never",
            "alcohol": "Never",
            "stress_level": "Low (nature immersive, mindfulness)",
            "circadian": "Aligned with solar rhythm (sleeps 9 PM, rises 5 AM)"
        },
        conditions=["Irritable Bowel Syndrome (IBS-Diarrhea predominant, stress/fodmap triggered)", "Contact Allergic Phytodermatitis (Parthenium plant resins)"],
        medications=["Triphala Churna at bedtime", "Peppermint Oil enteric capsules", "Spore-based probiotics", "No synthetic pharmaceuticals"],
        allergies=["Synthetic fragrances", "Latex", "Chemical pesticides"],
        family_history=["Mother: Celiac disease", "Maternal grandmother: Vitiligo"],
        frailty_index=1,
        polypharmacy_risk="none",
        key_quote="\"I grow everything I eat. My body reacts violently to any processed chemical or artificial pill. Nature is my pharmacy.\""
    ),

    ClinicalPersona(
        id=11,
        name="Anand Joshi",
        age=54,
        sex="male",
        occupation="Senior Chemical Dye & Textile Mill Foreman",
        location="Surat",
        height_cm=169,
        weight_kg=65,
        resting_bp="132/86",
        resting_hr=80,
        diet_profile="Spicy Gujarati-Maharashtrian farsan, fried sev, batata vada, high chili intake",
        lifestyle={
            "exercise": "Moderate manual exertion (factory floor pacing, climbing vats)",
            "sleep_hours": 6.0,
            "smoking": "Heavy 30-year bidi smoker (15-20 bidis daily)",
            "alcohol": "Moderate country liquor on weekends",
            "stress_level": "Medium-High (factory production targets, chemical fumes)",
            "circadian": "Rotating 8-hour factory shifts"
        },
        conditions=["Occupational Chronic Bronchitis / Byssinosis", "Mild Diabetic Neuropathy (burning feet)", "History of Peptic Duodenal Ulcer (bleeding 6 yrs ago)"],
        medications=["Formoterol 12mcg / Budesonide 400mcg DPI BID", "Theophylline 300mg SR OD", "Rabeprazole 20mg OD"],
        allergies=["Aspirin (triggers acute bronchospasm / Samter's triad variant)"],
        family_history=["Father: Died of chronic lung failure / silicosis", "Mother: Type 2 Diabetes"],
        frailty_index=5,
        polypharmacy_risk="moderate",
        key_quote="\"Thirty years of textile cotton lint and dye fumes live in my lungs. My morning cough sounds like a rusted diesel generator starting up.\""
    ),

    ClinicalPersona(
        id=12,
        name="Zoya Sheikh",
        age=16,
        sex="female",
        occupation="High School Science Student & Competitive Swimmer",
        location="Lucknow",
        height_cm=164,
        weight_kg=52,
        resting_bp="104/68",
        resting_hr=68,
        diet_profile="Nutritious home-cooked North Indian diet, paneer, lentils, fresh fruits, badam milk",
        lifestyle={
            "exercise": "High (2 hours daily swimming conditioning)",
            "sleep_hours": 7.0,
            "smoking": "Never",
            "alcohol": "Never",
            "stress_level": "High (NEET medical entrance exam preparation + national swim trials)",
            "circadian": "Early morning swimming practice (5 AM wake-up)"
        },
        conditions=["Severe Extrinsic Atopic Dermatitis (eczema in cubital & popliteal fossae)", "Seasonal Allergic Rhinitis", "Mild Exercise-Induced Rhinorrhea"],
        medications=["Cetirizine 10mg PRN", "Topical Fluticasone Propionate 0.05% ointment PRN", "Heavy ceramide emollient barrier creams"],
        allergies=["Peanuts (mild oral pruritus)", "Heavy chlorinated swimming pool water"],
        family_history=["Father: Allergic asthma", "Mother: Chronic eczema"],
        frailty_index=0,
        polypharmacy_risk="low",
        key_quote="\"Between 10 hours of physics coaching and 2 hours in the chlorinated pool, my skin cracks and bleeds at the elbows. I scratch until it burns.\""
    ),

    ClinicalPersona(
        id=13,
        name="Harbans Lal",
        age=81,
        sex="male",
        occupation="Assisted Living Resident / Retired Railway Mechanical Engineer",
        location="Chandigarh",
        height_cm=162,
        weight_kg=54,
        resting_bp="116/68",  # Postural drop to 94/56 on standing
        resting_hr=70,        # Ventricular pacemaker rhythm
        diet_profile="Pureed soft diet, thickened liquids, assisted feeding, low protein, low sodium",
        lifestyle={
            "exercise": "Bed-to-wheelchair transfer with 2-person assistance",
            "sleep_hours": 10.0,
            "smoking": "Former smoker (quit 35 yrs ago)",
            "alcohol": "None",
            "stress_level": "Low (advanced cognitive decline, occasional sundowning agitation)",
            "circadian": "Fragmented, frequent day drowsiness and night wakefulness"
        },
        conditions=[
            "Non-Valvular Atrial Fibrillation (CHADS-VASc 5, on Apixaban)",
            "Congestive Heart Failure (NYHA Class III, Ejection Fraction 32%)",
            "Mixed Vascular & Alzheimer's Dementia",
            "Stage 4 Chronic Kidney Disease (eGFR 22 mL/min)",
            "Benign Prostatic Hyperplasia with chronic catheterization history",
            "Severe Sarcopenia & High Aspiration Risk"
        ],
        medications=[
            "Furosemide 40mg OD morning",
            "Spironolactone 25mg OD",
            "Tamsulosin 0.4mg OD",
            "Donepezil 10mg OD",
            "Apixaban 2.5mg BID (renally adjusted dose)",
            "Levetiracetam 500mg BID (past stroke seizure prophylaxis)"
        ],
        allergies=["Morphine & Opiates (severe respiratory depression & delirium)"],
        family_history=["Father: Died at 62 from stroke", "Brother: Heart failure"],
        frailty_index=9,
        polypharmacy_risk="critical",
        key_quote="\"...He frequently confuses the nursing staff with his old railway crew from 1978. Any minor infection causes acute delirium and hypotension.\""
    ),

    ClinicalPersona(
        id=14,
        name="Radhika Menon",
        age=41,
        sex="female",
        occupation="Clinical Psychologist & Psychotherapist",
        location="Chennai",
        height_cm=156,
        weight_kg=76,
        resting_bp="136/86",
        resting_hr=80,
        diet_profile="Emotional binge eating, carb-heavy snacks, sweets, bakery items, irregular lunch",
        lifestyle={
            "exercise": "Sedentary (seated psychotherapy sessions 7 hrs/day)",
            "sleep_hours": 6.5,
            "smoking": "Never",
            "alcohol": "Occasional glass of wine (once a month)",
            "stress_level": "High (secondary trauma, compassion fatigue)",
            "circadian": "Broken sleep, wakes up feeling unrefreshed with stiffness"
        },
        conditions=["Fibromyalgia (14/18 bilateral tender points)", "Major Depressive Disorder (in clinical remission on maintenance)", "Chronic Migraine without Aura"],
        medications=["Duloxetine 60mg OD", "Pregabalin 75mg at bedtime", "Rizatriptan 10mg PRN for migraine"],
        allergies=["Tramadol (triggered acute serotonin tremor & panic)"],
        family_history=["Mother: Severe fibromyalgia & depression", "Maternal aunt: Generalized anxiety"],
        frailty_index=4,
        polypharmacy_risk="moderate",
        key_quote="\"My nervous system is on hypersensitive overdrive. A gentle tap feels like a heavy bruise, and my migraine attacks can blind me for twelve hours.\""
    ),

    ClinicalPersona(
        id=15,
        name="Manish Chawla",
        age=47,
        sex="male",
        occupation="Commercial Real Estate Developer & Broker",
        location="Gurugram",
        height_cm=174,
        weight_kg=96,
        resting_bp="156/96",
        resting_hr=84,
        diet_profile="Excessive rich mutton, butter chicken, seafood banquets, high purines, beer & scotch",
        lifestyle={
            "exercise": "None (driven in luxury SUV, elevator everywhere)",
            "sleep_hours": 5.0,
            "smoking": "Smokes 10 cigarettes a day",
            "alcohol": "Heavy scotch consumption (4-5 pegs nightly at business deals)",
            "stress_level": "High (high-capital real estate negotiations)",
            "circadian": "Late nights (2 AM bed), morning fatigue"
        },
        conditions=[
            "Severe Recurrent Tophaceous Gout (Serum Uric Acid 9.8 mg/dL)",
            "Metabolic Syndrome with Central Adiposity",
            "Grade 2 Hepatic Steatosis (Fatty Liver)",
            "Stage 1 Essential Hypertension"
        ],
        medications=["Febuxostat 40mg OD", "Telmisartan 80mg / Amlodipine 5mg combo OD"],
        allergies=["None known"],
        family_history=["Father: Gout and fatal renal failure", "Mother: Obese, Type 2 Diabetes"],
        frailty_index=4,
        polypharmacy_risk="moderate",
        key_quote="\"When a gout attack hits my big toe, even a bedsheet brushing against it makes me scream in tears. But closing business deals requires scotch and tandoori.\""
    ),

    ClinicalPersona(
        id=16,
        name="Tenzin Norbu",
        age=37,
        sex="male",
        occupation="Himalayan Expedition High-Altitude Mountaineering Guide",
        location="Leh, Ladakh / Karakoram",
        height_cm=170,
        weight_kg=66,
        resting_bp="114/72",
        resting_hr=52,
        diet_profile="High-calorie Tibetan mountain diet, tsampa (roasted barley), salted yak butter tea, dried yak meat, nuts",
        lifestyle={
            "exercise": "Extreme high-altitude physical endurance (carrying 25kg loads above 5,000m)",
            "sleep_hours": 8.0,
            "smoking": "Never",
            "alcohol": "Never",
            "stress_level": "Medium-High (avalanche risk, client safety in hypoxia)",
            "circadian": "Alpine alpine-start circadian pattern (wakes at 3 AM for summit pushes)"
        },
        conditions=["Past High Altitude Pulmonary Edema (HAPE episode 4 yrs ago at 6,200m)", "Cold Urticaria (erythema upon sub-zero exposure)", "Actinic Solar Cheilitis"],
        medications=["Acetazolamide (Diamox) 250mg PRN (during rapid summit ascents)", "Nifedipine SR 20mg (emergency mountain kit for HAPE)"],
        allergies=["None known"],
        family_history=["Ancestral high-altitude Sherpa/Ladakhi genetic adaptations (EPAS1 allele)"],
        frailty_index=1,
        polypharmacy_risk="low",
        key_quote="\"Up at 6,000 meters, the air has half the oxygen of Delhi. If your lungs fill with fluid, you have three hours to descend before you drown on dry snow.\""
    ),

    ClinicalPersona(
        id=17,
        name="Shalini Kulkarni",
        age=63,
        sex="female",
        occupation="Classical Bharatanatyam Guru & Dance Academy Director",
        location="Mysuru",
        height_cm=159,
        weight_kg=58,
        resting_bp="128/80",
        resting_hr=66,
        diet_profile="Nutritious South Indian lacto-vegetarian, ragi mudde, sambar, fresh buttermilk, turmeric milk",
        lifestyle={
            "exercise": "High dance practice (45 years of high-impact rhythmic foot stomping 'tatakku')",
            "sleep_hours": 7.0,
            "smoking": "Never",
            "alcohol": "Never",
            "stress_level": "Medium (annual dance arangetram productions)",
            "circadian": "Disciplined morning practice (6 AM)"
        },
        conditions=["Bilateral Severe Ankle Subtalar Osteoarthritis", "Medial Meniscal Degeneration of Right Knee", "Mild Lumbar Osteopenia"],
        medications=["Diacerein 50mg OD", "Glucosamine-Chondroitin 1500mg OD", "Curcumin extract 500mg with Piperine", "Boswellia Serrata extract"],
        allergies=["Diclofenac & Ketorolac (causes severe gastritis and bleeding)"],
        family_history=["Mother: Knee replacement at 65", "Father: Vitiligo"],
        frailty_index=3,
        polypharmacy_risk="low",
        key_quote="\"Forty-five years of stamping bare feet on hard teak floors created beautiful art, but took away all cartilage from my ankles. I dance with my heart now.\""
    ),

    ClinicalPersona(
        id=18,
        name="Deepak Verma",
        age=34,
        sex="male",
        occupation="High-Frequency Financial Derivatives Trader",
        location="Delhi NCR",
        height_cm=171,
        weight_kg=63,
        resting_bp="144/92",  # Stress-induced labile hypertension
        resting_hr=92,
        diet_profile="Fast food deliveries, cup noodles, sodas, taurine energy drinks, nicotine pouches",
        lifestyle={
            "exercise": "Zero (chained to 4-screen trading terminal 9 AM - 7 PM)",
            "sleep_hours": 4.5,
            "smoking": "Nicotine salt pouches daily (12mg/day)",
            "alcohol": "Social weekend beers",
            "stress_level": "Extreme (managing massive intraday leverage swings)",
            "circadian": "Hyper-aroused insomnia, wakes up checking US futures at 2 AM"
        },
        conditions=[
            "Severe Chronic Tension-Type Headaches",
            "Severe Computer Vision Syndrome & Evaporative Dry Eye",
            "Functional Orthostatic Tachycardia / Adrenaline-Induced Palpitations",
            "Labile Stress Hypertension"
        ],
        medications=["Propranolol 20mg PRN (for situational anxiety / hand tremors)", "Carboxymethylcellulose 0.5% eye drops q2h"],
        allergies=["None known"],
        family_history=["Father: Hypertension & early stroke at 58", "Mother: Migraine"],
        frailty_index=2,
        polypharmacy_risk="low",
        key_quote="\"Every time the Nifty market gaps down 300 points, my heart races to 130 bpm, my palms sweat, and a tight iron band squeezes my temples. I run on pure adrenaline.\""
    )
]


# ─────────────────────────────────────────────────────────────────────────────
# 3. CLINICAL SYMPTOM & DISEASE SCENARIOS
# ─────────────────────────────────────────────────────────────────────────────

SYMPTOM_SCENARIOS: List[SymptomScenario] = [
    SymptomScenario(
        id=1,
        title="Acute Substernal Crushing Chest Pain with Left Arm Radiation",
        category="Cardiovascular / Emergency",
        chief_complaint="Severe retrosternal pressure, feels like an elephant sitting on chest, radiating to left shoulder and jaw",
        duration="45 minutes (ongoing)",
        description="Patient developed sudden squeezing chest pain while sitting. Accompanied by cold diaphoresis, mild nausea, and shortness of breath. No relief with rest.",
        cardinal_symptoms=["crushing retrosternal chest pain", "left arm radiation", "cold sweating", "dyspnea", "nausea"],
        vital_signs_impact={"BP": "+20/15 mmHg or hypotensive collapse", "HR": "+25 bpm", "SpO2": "-3%", "RR": "+8 /min"},
        base_differentials=[
            {"disease": "Acute Coronary Syndrome (STEMI / NSTEMI)", "base_prior": 0.25, "cardiac": True, "urgency": "EMERGENCY"},
            {"disease": "Aortic Dissection", "base_prior": 0.03, "cardiac": True, "urgency": "EMERGENCY"},
            {"disease": "Gastroesophageal Reflux / Esophageal Spasm", "base_prior": 0.35, "cardiac": False, "urgency": "ROUTINE"},
            {"disease": "Costochondritis / Musculoskeletal Chest Wall Strain", "base_prior": 0.30, "cardiac": False, "urgency": "ROUTINE"},
            {"disease": "Pulmonary Embolism", "base_prior": 0.07, "cardiac": False, "urgency": "EMERGENCY"}
        ],
        base_organ_burden={"cardio": 90, "renal": 40, "resp": 65, "gi": 30, "neuro": 35},
        is_emergency_trigger=True,
        emergency_type="CARDIAC_EMERGENCY"
    ),

    SymptomScenario(
        id=2,
        title="High Fever (103°F), Shivering Rigors, Productive Purulent Cough & Dyspnea",
        category="Respiratory / Infectious Sepsis",
        chief_complaint="High-grade spiking fever with uncontrollable shivering rigors, rust/yellow-green thick sputum, and pleuritic right chest stitch",
        duration="4 days (worsening rapidly)",
        description="Began as mild viral cold, rapidly progressed into shaking chills, tachypnea, and painful coughing spells. Unable to take deep breaths.",
        cardinal_symptoms=["high fever", "shivering chills", "productive purulent sputum", "pleuritic chest pain", "tachypnea"],
        vital_signs_impact={"Temp": "103.2°F", "HR": "+30 bpm", "RR": "+10 /min", "SpO2": "-6%"},
        base_differentials=[
            {"disease": "Community-Acquired Lobar Pneumonia", "base_prior": 0.40, "infectious": True, "urgency": "URGENT"},
            {"disease": "Acute Sepsis / Septic Shock Risk", "base_prior": 0.15, "infectious": True, "urgency": "EMERGENCY"},
            {"disease": "Acute Exacerbation of Chronic Bronchitis / COPD", "base_prior": 0.25, "infectious": True, "urgency": "URGENT"},
            {"disease": "Severe Influenza with Secondary Bacterial Infection", "base_prior": 0.20, "infectious": True, "urgency": "MODERATE"}
        ],
        base_organ_burden={"cardio": 60, "renal": 70, "resp": 95, "gi": 25, "neuro": 50},
        is_emergency_trigger=True,
        emergency_type="RESPIRATORY_EMERGENCY"
    ),

    SymptomScenario(
        id=3,
        title="Severe Unilateral Throbbing Temple Headache with Visual Aura & Photophobia",
        category="Neurological / Cranial",
        chief_complaint="Intense pulsating left temple agony, zigzag flickering lights in left visual field, extreme nausea, hypersensitivity to light and sound",
        duration="6 hours",
        description="Aura began 45 mins prior to pain as shimmering blind spot. Now throbbing aggressively with every pulse. Forced to lie down in dark room with eyes covered.",
        cardinal_symptoms=["unilateral pulsating temple pain", "scintillating scotoma aura", "severe photophobia", "phonophobia", "nausea"],
        vital_signs_impact={"BP": "+15/10 mmHg (pain mediated)", "HR": "+12 bpm", "Temp": "Normal"},
        base_differentials=[
            {"disease": "Migraine with Typical Aura", "base_prior": 0.60, "neuro": True, "urgency": "MODERATE"},
            {"disease": "Tension-Type Headache Exacerbation", "base_prior": 0.20, "neuro": True, "urgency": "ROUTINE"},
            {"disease": "Subarachnoid Hemorrhage (Thunderclap Alert)", "base_prior": 0.03, "neuro": True, "urgency": "EMERGENCY"},
            {"disease": "Hypertensive Encephalopathy", "base_prior": 0.10, "neuro": True, "urgency": "URGENT"},
            {"disease": "Temporal Arteritis (Giant Cell Arteritis)", "base_prior": 0.07, "neuro": True, "urgency": "URGENT"}
        ],
        base_organ_burden={"cardio": 30, "renal": 15, "resp": 10, "gi": 45, "neuro": 85},
        is_emergency_trigger=False
    ),

    SymptomScenario(
        id=4,
        title="Acute Right Lower Quadrant Abdominal Pain with Rebound Tenderness",
        category="Gastrointestinal / Acute Abdomen",
        chief_complaint="Periumbilical dull ache that migrated to right iliac fossa (McBurney's point), sharp lancinating pain on walking or coughing, anorexia",
        duration="18 hours",
        description="Began yesterday afternoon with loss of appetite and nausea. Pain migrated to right lower quadrant overnight. Low-grade fever (100.4°F). Guarding present.",
        cardinal_symptoms=["migratory RLQ abdominal pain", "rebound tenderness", "anorexia", "nausea", "low-grade fever"],
        vital_signs_impact={"Temp": "100.8°F", "HR": "+18 bpm", "BP": "Unchanged", "RR": "+4 /min"},
        base_differentials=[
            {"disease": "Acute Appendicitis", "base_prior": 0.50, "surgical": True, "urgency": "EMERGENCY"},
            {"disease": "Ruptured Ectopic Pregnancy (in females of childbearing age)", "base_prior": 0.15, "surgical": True, "urgency": "EMERGENCY"},
            {"disease": "Mesenteric Lymphadenitis / Infectious Enteritis", "base_prior": 0.20, "surgical": False, "urgency": "MODERATE"},
            {"disease": "Right Ureteral Calculus (Renal Colic)", "base_prior": 0.15, "surgical": False, "urgency": "URGENT"}
        ],
        base_organ_burden={"cardio": 35, "renal": 45, "resp": 20, "gi": 90, "neuro": 30},
        is_emergency_trigger=True,
        emergency_type="ACUTE_ABDOMEN"
    ),

    SymptomScenario(
        id=5,
        title="Excruciating Right Great Toe Swelling, Erythema & Inability to Bear Weight",
        category="Rheumatological / Metabolic",
        chief_complaint="Woke up at 3 AM with sensation of boiling water poured on right big toe. Joint is fiery red, swollen 2x size, exquisitely tender to touch",
        duration="12 hours",
        description="Patient cannot tolerate even a light bedsheet touching the toe. Preceded by heavy feast or dehydration. Severe localized throbbing.",
        cardinal_symptoms=["1st MTP joint erythema", "severe localized calor and edema", "exquisite allodynia", "inability to bear weight"],
        vital_signs_impact={"Temp": "99.8°F", "HR": "+15 bpm", "BP": "+10 mmHg"},
        base_differentials=[
            {"disease": "Acute Gouty Arthritis (Podagra Attack)", "base_prior": 0.65, "metabolic": True, "urgency": "MODERATE"},
            {"disease": "Septic Arthritis (Infectious Joint)", "base_prior": 0.10, "metabolic": False, "urgency": "EMERGENCY"},
            {"disease": "Pseudogout (CPPD Arthropathy)", "base_prior": 0.15, "metabolic": True, "urgency": "MODERATE"},
            {"disease": "Acute Cellulitis of Foot", "base_prior": 0.10, "metabolic": False, "urgency": "URGENT"}
        ],
        base_organ_burden={"cardio": 25, "renal": 65, "resp": 10, "gi": 20, "neuro": 40},
        is_emergency_trigger=False
    ),

    SymptomScenario(
        id=6,
        title="Burning Epigastric Agony after Meals with Coffee-Ground Vomitus & Melena",
        category="Gastroenterology / Upper GI Bleed",
        chief_complaint="Gnawing burn in upper stomach, sudden vomiting of dark coffee-ground speckled material, and passage of black tarry foul-smelling stools",
        duration="24 hours (acute bleeding in last 4 hrs)",
        description="Chronic indigestion escalated rapidly after taking pain pills. Patient feels lightheaded upon standing, cold clammy hands.",
        cardinal_symptoms=["coffee-ground vomitus", "melena (black tarry stool)", "severe epigastric burning", "postural lightheadedness"],
        vital_signs_impact={"BP": "-25/15 mmHg (hypovolemia)", "HR": "+32 bpm (compensatory tachycardia)", "Hb": "-3.0 g/dL"},
        base_differentials=[
            {"disease": "Bleeding Peptic Ulcer (Gastric / Duodenal)", "base_prior": 0.60, "gi_bleed": True, "urgency": "EMERGENCY"},
            {"disease": "Acute Erosive Gastropathy (NSAID-induced)", "base_prior": 0.25, "gi_bleed": True, "urgency": "EMERGENCY"},
            {"disease": "Esophageal Variceal Bleed (Cirrhosis)", "base_prior": 0.10, "gi_bleed": True, "urgency": "EMERGENCY"},
            {"disease": "Mallory-Weiss Mucosal Tear", "base_prior": 0.05, "gi_bleed": True, "urgency": "URGENT"}
        ],
        base_organ_burden={"cardio": 75, "renal": 70, "resp": 30, "gi": 98, "neuro": 50},
        is_emergency_trigger=True,
        emergency_type="UPPER_GI_BLEED"
    ),

    SymptomScenario(
        id=7,
        title="Severe Dysuria, High Fever with Shaking Chills, Right Flank CVA Tenderness",
        category="Genitourinary / Urosepsis",
        chief_complaint="Scalding burning during urination, cloudy foul urine, sudden spike of 102.8°F fever, severe pounding pain in right lower back/flank",
        duration="2 days",
        description="Started as urinary frequency and urgency, rapidly climbed upward to kidney area. Marked costovertebral angle tenderness on percussion.",
        cardinal_symptoms=["scalding dysuria", "right flank/kidney pain", "high spiking fever", "shaking chills", "cloudy pyuria"],
        vital_signs_impact={"Temp": "102.8°F", "HR": "+28 bpm", "BP": "-10/5 mmHg", "RR": "+6 /min"},
        base_differentials=[
            {"disease": "Acute Pyelonephritis (Upper Urinary Tract Infection)", "base_prior": 0.55, "renal": True, "urgency": "URGENT"},
            {"disease": "Urosepsis / Systemic Bacteremia", "base_prior": 0.20, "renal": True, "urgency": "EMERGENCY"},
            {"disease": "Obstructing Nephrolithiasis with Superimposed Infection", "base_prior": 0.15, "renal": True, "urgency": "EMERGENCY"},
            {"disease": "Acute Uncomplicated Cystitis", "base_prior": 0.10, "renal": False, "urgency": "ROUTINE"}
        ],
        base_organ_burden={"cardio": 50, "renal": 92, "resp": 30, "gi": 35, "neuro": 45},
        is_emergency_trigger=True,
        emergency_type="SEPSIS_RISK"
    ),

    SymptomScenario(
        id=8,
        title="Acute Expiratory Wheezing, Severe Chest Tightness & Inability to Finish Sentences",
        category="Pulmonology / Bronchospasm",
        chief_complaint="Violent loud wheezing, gasping for breath, chest feels trapped in vice, cannot utter more than 3 words without gasping",
        duration="2 hours",
        description="Triggered by allergen, cold air, or physical exertion. Patient is sitting in tripod position, using accessory neck muscles to pull in air.",
        cardinal_symptoms=["loud expiratory wheezing", "inability to speak full sentences", "suprasternal retractions", "tripod positioning", "silent chest threat"],
        vital_signs_impact={"SpO2": "-9% (drops to 88-91%)", "RR": "+14 /min", "HR": "+35 bpm", "BP": "+18 mmHg"},
        base_differentials=[
            {"disease": "Acute Severe Asthma Exacerbation (Status Asthmaticus)", "base_prior": 0.55, "resp": True, "urgency": "EMERGENCY"},
            {"disease": "Acute Exacerbation of COPD (AECOPD)", "base_prior": 0.25, "resp": True, "urgency": "EMERGENCY"},
            {"disease": "Acute Pulmonary Edema (Cardiac Asthma)", "base_prior": 0.12, "resp": False, "urgency": "EMERGENCY"},
            {"disease": "Anaphylaxis with Bronchospasm", "base_prior": 0.08, "resp": True, "urgency": "EMERGENCY"}
        ],
        base_organ_burden={"cardio": 70, "renal": 35, "resp": 98, "gi": 15, "neuro": 55},
        is_emergency_trigger=True,
        emergency_type="RESPIRATORY_EMERGENCY"
    ),

    SymptomScenario(
        id=9,
        title="Sudden Left Facial Droop, Left Arm Weakness & Slurred Incoherent Speech (FAST)",
        category="Neurological / Acute Stroke",
        chief_complaint="Sudden onset inability to move left arm, mouth drooping on left side when smiling, slurred words, unable to repeat a simple sentence",
        duration="30 minutes (acute stroke window)",
        description="Occurred during routine breakfast. Arm drifted down immediately when raised. Complete loss of fine motor coordination. Critical thrombolysis window.",
        cardinal_symptoms=["unilateral facial droop", "arm pronator drift", "slurred dysarthric speech", "acute hemiparesis"],
        vital_signs_impact={"BP": "+35/20 mmHg (reactive stroke surge)", "HR": "+10 bpm", "SpO2": "97%"},
        base_differentials=[
            {"disease": "Acute Ischemic Stroke (Cerebral Infarction)", "base_prior": 0.70, "stroke": True, "urgency": "EMERGENCY"},
            {"disease": "Intracranial Hemorrhage (Hemorrhagic Stroke)", "base_prior": 0.15, "stroke": True, "urgency": "EMERGENCY"},
            {"disease": "Transient Ischemic Attack (TIA)", "base_prior": 0.10, "stroke": True, "urgency": "EMERGENCY"},
            {"disease": "Bell's Palsy (Facial nerve VII palsy)", "base_prior": 0.05, "stroke": False, "urgency": "ROUTINE"}
        ],
        base_organ_burden={"cardio": 65, "renal": 30, "resp": 40, "gi": 15, "neuro": 98},
        is_emergency_trigger=True,
        emergency_type="STROKE_FAST"
    ),

    SymptomScenario(
        id=10,
        title="Profuse Watery Diarrhea (12x/day), Sunken Eyes, Severe Postural Dizziness & Cramps",
        category="Gastroenterology / Hypovolemia",
        chief_complaint="Continuous rice-water or watery diarrhea stools every 45 mins, severe abdominal cramping, intense dry mouth, dark scanty urine",
        duration="36 hours",
        description="Patient unable to retain oral fluids. Postural syncope upon attempting to stand. Skin turgor poor, sunken eyes, dry oral mucosa.",
        cardinal_symptoms=["profuse watery diarrhea", "severe orthostatic dizziness", "oliguria", "sunken eyes", "calf muscle cramps"],
        vital_signs_impact={"BP": "-30/15 mmHg (hypovolemic shock risk)", "HR": "+35 bpm", "Weight": "-2.5 kg water loss"},
        base_differentials=[
            {"disease": "Acute Secretory Gastroenteritis with Severe Dehydration", "base_prior": 0.60, "gi": True, "urgency": "URGENT"},
            {"disease": "Pre-Renal Acute Kidney Injury (Hypovolemic AKI)", "base_prior": 0.25, "gi": True, "urgency": "EMERGENCY"},
            {"disease": "Electrolyte Derangement (Hypokalemia / Hyponatremia)", "base_prior": 0.10, "gi": True, "urgency": "EMERGENCY"},
            {"disease": "Clostridioides Difficile Colitis", "base_prior": 0.05, "gi": True, "urgency": "URGENT"}
        ],
        base_organ_burden={"cardio": 60, "renal": 95, "resp": 25, "gi": 90, "neuro": 60},
        is_emergency_trigger=True,
        emergency_type="HYPOVOLEMIC_SHOCK"
    ),

    SymptomScenario(
        id=11,
        title="Bilateral Pitting Ankle Edema, Orthopnea (2 Pillows) & 3kg Weight Gain in 3 Days",
        category="Cardiovascular / Fluid Overload",
        chief_complaint="Cannot lie flat at night without suffocating, waking up gasping for air (PND), ankles swollen to double size, rapid water weight gain",
        duration="5 days",
        description="Gradual tightening of shoes followed by severe nocturnal breathlessness relieved only by sitting upright at edge of bed. Bilateral lung base crackles.",
        cardinal_symptoms=["bilateral 3+ pitting pedal edema", "orthopnea requiring 2+ pillows", "paroxysmal nocturnal dyspnea", "rapid weight surge"],
        vital_signs_impact={"BP": "+15/10 mmHg", "HR": "+18 bpm", "RR": "+8 /min", "SpO2": "-5%"},
        base_differentials=[
            {"disease": "Acute Decompensated Congestive Heart Failure", "base_prior": 0.55, "cardiac": True, "urgency": "EMERGENCY"},
            {"disease": "Chronic Kidney Disease Fluid Retention / Uremic Surge", "base_prior": 0.25, "cardiac": False, "urgency": "EMERGENCY"},
            {"disease": "Decompensated Hepatic Cirrhosis (Ascites & Edema)", "base_prior": 0.12, "cardiac": False, "urgency": "URGENT"},
            {"disease": "Bilateral Deep Vein Thrombosis / Venous Stasis", "base_prior": 0.08, "cardiac": False, "urgency": "MODERATE"}
        ],
        base_organ_burden={"cardio": 95, "renal": 85, "resp": 80, "gi": 40, "neuro": 35},
        is_emergency_trigger=True,
        emergency_type="CARDIAC_EMERGENCY"
    ),

    SymptomScenario(
        id=12,
        title="Sudden Severe Low Back Spasm with Sciatic Radiation Down Left Foot",
        category="Musculoskeletal / Spine",
        chief_complaint="Explosive shooting electric-shock pain down posterior left thigh into great toe after lifting a weight. Cannot stand erect",
        duration="1 day",
        description="Back locked in lateral tilt. Coughing or sneezing reproduces shooting electric pain down leg. Straight leg raise positive at 30 degrees.",
        cardinal_symptoms=["lumbar spasm", "sciatica with L5/S1 dermatomal radiation", "positive straight leg raise", "gait antalgia"],
        vital_signs_impact={"BP": "+15 mmHg (acute pain)", "HR": "+12 bpm", "Temp": "Normal"},
        base_differentials=[
            {"disease": "Acute Lumbar Disc Herniation with Radiculopathy", "base_prior": 0.65, "spine": True, "urgency": "MODERATE"},
            {"disease": "Severe Acute Lumbar Musculoligamentous Sprain", "base_prior": 0.25, "spine": True, "urgency": "ROUTINE"},
            {"disease": "Cauda Equina Syndrome (Red flag if bowel/bladder lost)", "base_prior": 0.05, "spine": True, "urgency": "EMERGENCY"},
            {"disease": "Vertebral Compression Fracture (Osteoporotic)", "base_prior": 0.05, "spine": True, "urgency": "URGENT"}
        ],
        base_organ_burden={"cardio": 20, "renal": 15, "resp": 15, "gi": 15, "neuro": 75},
        is_emergency_trigger=False
    )
]


# ─────────────────────────────────────────────────────────────────────────────
# 4. CLINICAL SIMULATION & MULTI-DIMENSIONAL IMPACT ENGINE
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class SimulationImpactResult:
    persona: ClinicalPersona
    scenario: SymptomScenario
    triage_level: str              # 'EMERGENCY' | 'URGENT' | 'SEMI-URGENT' | 'ROUTINE'
    triage_color: str              # 'red' | 'orange' | 'yellow' | 'green'
    red_flag_triggered: bool
    red_flag_message: str
    bayesian_differentials: List[Dict[str, Any]]
    organ_burden: Dict[str, int]   # cardio, renal, resp, gi, neuro (0-100)
    acute_frailty_score: int       # acute frailty (0-10)
    frailty_surge: int
    acute_pain_score: int          # 0-10
    functional_mobility: str       # 'Normal' | 'Mildly Impaired' | 'Severely Impaired' | 'Bedridden'
    work_disruption: str           # 'None' | 'Partial' | 'Complete Disability'
    ddi_contraindications: List[str]
    allopathic_management: List[str]
    ayush_remedies: List[str]
    kitchen_home_remedies: List[str]
    lifestyle_guidelines: List[str]


class ClinicalImpactEngine:
    """
    Implements Arovia's Bayesian Covariate Prior Shifting, DDI Safety Filter,
    Organ Burden Mapping, and Multi-Modal Holistic Personalization.
    """

    @staticmethod
    def calculate_covariate_multipliers(persona: ClinicalPersona, scenario: SymptomScenario) -> Dict[str, float]:
        """
        Derive Bayesian alpha prior multipliers based on patient covariates:
        Age, Sex, Comorbidities, Medications, Lifestyle (Smoking, Alcohol, Sedentary),
        Diet, and Frailty Index.
        """
        multipliers: Dict[str, float] = {}

        # Scan conditions
        cond_str = " ".join(persona.conditions).lower()
        med_str = " ".join(persona.medications).lower()
        has_diabetes = "diabetes" in cond_str
        has_htn = "hypertension" in cond_str
        has_ckd = "kidney" in cond_str or "ckd" in cond_str
        has_cad = "coronary" in cond_str or "stent" in cond_str or "cad" in cond_str
        has_hf = "heart failure" in cond_str or "chf" in cond_str
        has_gout = "gout" in cond_str or "hyperuricemia" in cond_str
        has_gerd = "gerd" in cond_str or "reflux" in cond_str or "esophagitis" in cond_str
        has_asthma = "asthma" in cond_str
        has_copd = "copd" in cond_str or "chronic bronchitis" in cond_str or "byssinosis" in cond_str
        has_dementia = "dementia" in cond_str or "cognitive" in cond_str
        is_smoker = "smoker" in str(persona.lifestyle.get("smoking", "")).lower()

        # 1. Cardiac Multipliers (ACC/AHA 2025 ACS stratification)
        cardiac_mult = 1.0
        # Age >= 60 is an independent major cardiovascular risk factor (including post-menopausal women)
        if persona.age >= 60:
            cardiac_mult *= 2.6
        elif persona.age >= 45 and (is_smoker or has_htn or has_diabetes):
            cardiac_mult *= 2.6
        elif (has_htn or "144/" in persona.resting_bp or "154/" in persona.resting_bp) and persona.age >= 30:
            cardiac_mult *= 1.8  # Uncontrolled Stage 2 HTN in adults increases ischemia risk
        if has_cad:
            cardiac_mult *= 3.5
        if has_diabetes and has_ckd:
            cardiac_mult *= 2.2
        if persona.bmi >= 30:
            cardiac_mult *= 1.4
        if persona.age < 25 and not has_htn and not has_diabetes and persona.frailty_index <= 2:
            cardiac_mult = 0.25  # young healthy athlete has low baseline coronary ischemia prior
        multipliers["cardiac"] = round(cardiac_mult, 2)

        # 2. Respiratory Multipliers (BTS / NICE pneumonia risk)
        resp_mult = 1.0
        if (has_asthma or has_copd) and is_smoker:
            resp_mult *= 3.8
        elif has_copd or has_asthma:
            resp_mult *= 2.4
        if persona.age >= 65 and (has_diabetes or has_ckd or persona.frailty_index >= 5):
            resp_mult *= 2.2  # Immunocompromised elderly diabetic / CKD patient (CURB-65 criteria)
        elif persona.age >= 70:
            resp_mult *= 1.8
        if persona.id == 5:  # Young athlete with EIB has mild bronchial hyperreactivity
            resp_mult = 1.2
        multipliers["respiratory"] = round(resp_mult, 2)

        # 3. Renal & Sepsis Multipliers (KDIGO / qSOFA)
        renal_mult = 1.0
        if has_ckd:
            renal_mult *= 4.2
        if has_diabetes and has_htn:
            renal_mult *= 2.0
        if persona.frailty_index >= 7:
            renal_mult *= 2.5
        multipliers["renal"] = round(renal_mult, 2)

        # 4. Neurological & Stroke Multipliers (AHA/ASA 2026 Stroke Guidelines)
        neuro_mult = 1.0
        if persona.age >= 65:
            neuro_mult *= 2.8
        elif persona.age >= 40 and (has_htn or "154/" in persona.resting_bp or "156/" in persona.resting_bp or is_smoker or "metabolic" in cond_str):
            neuro_mult *= 2.2
        elif (has_htn or "144/" in persona.resting_bp or "154/" in persona.resting_bp or "156/" in persona.resting_bp) and persona.age >= 30:
            neuro_mult *= 2.2
        if has_cad or has_hf or "vascular" in cond_str or "apixaban" in med_str or "atrial fibrillation" in cond_str:
            neuro_mult *= 1.6
        if persona.age < 25 and not has_htn:
            neuro_mult = 0.2
        multipliers["stroke"] = round(neuro_mult, 2)

        # 5. GI & Bleed Multipliers (NICE CG141 Upper GI Bleed)
        gi_mult = 1.0
        if "ibuprofen" in " ".join(persona.medications).lower() or "diclofenac" in " ".join(persona.medications).lower():
            gi_mult *= 3.5  # High daily NSAID abuse is the primary driver of bleeding peptic ulceration
        elif "aspirin" in " ".join(persona.medications).lower():
            gi_mult *= 2.8
        if has_gerd or "ulcer" in cond_str:
            gi_mult *= 1.8
        if "clopidogrel" in " ".join(persona.medications).lower() or "apixaban" in " ".join(persona.medications).lower():
            gi_mult *= 2.5
        if persona.is_pregnant:
            gi_mult = 1.0
        multipliers["gi_bleed"] = round(gi_mult, 2)

        # 6. Gout & Metabolic Multipliers (NICE NG219 Gout)
        gout_mult = 1.0
        if has_gout:
            gout_mult *= 5.0
        if "meat" in persona.diet_profile.lower() or "scotch" in str(persona.lifestyle.get("alcohol", "")).lower():
            gout_mult *= 2.2
        if has_ckd or (has_diabetes and has_htn):
            gout_mult *= 2.8  # Impaired renal clearance of uric acid strongly promotes hyperuricemic flare
        if persona.id == 16:  # Tenzin Norbu (High altitude polycythemia raises secondary uric acid)
            gout_mult = 2.2
        if persona.age < 25 and not has_gout:
            gout_mult = 0.25  # Gout is exceedingly rare in adolescents / young adults (septic/reactive higher)
        elif persona.sex == "female" and persona.age < 50 and not has_gout:
            gout_mult = 0.35  # Estrogen promotes uricosuria; premenopausal gout is rare
        multipliers["gout"] = round(gout_mult, 2)

        return multipliers

    @classmethod
    def simulate(cls, persona: ClinicalPersona, scenario: SymptomScenario) -> SimulationImpactResult:
        cov_mults = cls.calculate_covariate_multipliers(persona, scenario)
        cond_str = " ".join(persona.conditions).lower()
        med_str = " ".join(persona.medications).lower()
        has_diabetes = "diabetes" in cond_str
        has_htn = "hypertension" in cond_str
        has_ckd = "kidney" in cond_str or "ckd" in cond_str
        has_cad = "coronary" in cond_str or "stent" in cond_str or "cad" in cond_str
        has_hf = "heart failure" in cond_str or "chf" in cond_str
        has_gout = "gout" in cond_str or "hyperuricemia" in cond_str
        has_gerd = "gerd" in cond_str or "reflux" in cond_str or "esophagitis" in cond_str
        has_asthma = "asthma" in cond_str
        has_copd = "copd" in cond_str or "chronic bronchitis" in cond_str or "byssinosis" in cond_str

        # ── 1. Calculate Shifted Differential Diagnoses (Bayesian Posterior Shift) ──
        raw_diffs = []
        for diff in scenario.base_differentials:
            base_p = diff["base_prior"]
            disease_name = diff["disease"]

            # Apply disease-specific covariate multiplier (targeting specific pathologies)
            effective_mult = 1.0
            d_lower = disease_name.lower()

            # 1. Cardiovascular / Chest Pain Domain
            if "acute coronary syndrome" in d_lower or "stemi" in d_lower or "coronary" in d_lower:
                effective_mult = cov_mults.get("cardiac", 1.0)
            elif "aortic dissection" in d_lower:
                effective_mult = 1.8 if ("154/" in persona.resting_bp or "144/" in persona.resting_bp) else 1.0
            elif "costochondritis" in d_lower or "chest wall strain" in d_lower or "musculoskeletal" in d_lower:
                if persona.age < 30 and persona.frailty_index <= 2:
                    effective_mult = 2.8
                else:
                    effective_mult = 0.4
            elif "reflux" in d_lower or "esophageal" in d_lower:
                effective_mult = 2.4 if ("gerd" in cond_str or "reflux" in cond_str) else 0.9
            elif "pulmonary embolism" in d_lower:
                effective_mult = 2.5 if (persona.is_pregnant or persona.frailty_index >= 7) else 0.8

            # 2. Pulmonology / Respiratory Domain
            elif "lobar pneumonia" in d_lower or "community-acquired" in d_lower:
                effective_mult = cov_mults.get("respiratory", 1.0)
            elif "acute sepsis" in d_lower or "septic shock" in d_lower:
                effective_mult = 2.0 if (persona.frailty_index >= 7 or persona.age >= 75 or has_ckd) else 0.8
            elif "exacerbation of chronic bronchitis" in d_lower or "copd" in d_lower:
                effective_mult = 2.8 if has_copd else 0.4
            elif "severe influenza" in d_lower:
                effective_mult = 1.0

            # 3. Rheumatology / Gout Domain
            elif "gouty arthritis" in d_lower or "podagra" in d_lower:
                effective_mult = cov_mults.get("gout", 1.0)
            elif "septic arthritis" in d_lower:
                effective_mult = 1.4 if (has_diabetes or persona.frailty_index >= 7 or has_ckd) else 0.8
            elif "pseudogout" in d_lower:
                effective_mult = 1.3 if persona.age >= 65 else 0.5
            elif "cellulitis" in d_lower:
                effective_mult = 1.2 if has_diabetes else 0.8

            # 4. Gastroenterology / Upper GI Bleed Domain
            elif "bleeding peptic ulcer" in d_lower:
                effective_mult = cov_mults.get("gi_bleed", 1.0)
            elif "acute erosive gastropathy" in d_lower or "nsaid-induced" in d_lower:
                effective_mult = 1.4 if ("ibuprofen" in med_str or "aspirin" in med_str or "diclofenac" in med_str) else 0.8
            elif "variceal bleed" in d_lower or "cirrhosis" in d_lower:
                has_cirrhosis = "cirrhosis" in cond_str or "ascites" in cond_str
                effective_mult = 3.0 if has_cirrhosis else 0.4
            elif "mallory-weiss" in d_lower:
                effective_mult = 0.8

            # 5. Nephrology / Dehydration / AKI Domain
            elif "pre-renal acute kidney injury" in d_lower or "hypovolemic aki" in d_lower:
                effective_mult = cov_mults.get("renal", 1.0)
            elif "acute secretory gastroenteritis" in d_lower:
                effective_mult = 1.0
            elif "electrolyte derangement" in d_lower:
                effective_mult = 2.0 if (persona.age >= 65 or has_ckd or "metformin" in med_str) else 1.0
            elif "difficile" in d_lower:
                effective_mult = 0.5

            # 6. Neurology / Stroke Domain
            elif "ischemic stroke" in d_lower or "cerebral infarction" in d_lower:
                effective_mult = cov_mults.get("stroke", 1.0)
            elif "intracranial hemorrhage" in d_lower:
                effective_mult = 1.8 if ("apixaban" in med_str or "aspirin" in med_str or "154/" in persona.resting_bp or "156/" in persona.resting_bp) else 0.8
            elif "transient ischemic attack" in d_lower:
                effective_mult = 1.0
            elif "bell's palsy" in d_lower:
                effective_mult = 0.4

            # General Fallback
            else:
                if diff.get("cardiac"):
                    effective_mult = cov_mults.get("cardiac", 1.0)
                elif diff.get("resp"):
                    effective_mult = cov_mults.get("respiratory", 1.0)
                elif diff.get("stroke"):
                    effective_mult = cov_mults.get("stroke", 1.0)
                elif diff.get("gi_bleed"):
                    effective_mult = cov_mults.get("gi_bleed", 1.0)
                elif diff.get("metabolic"):
                    effective_mult = cov_mults.get("gout", 1.0)
                elif diff.get("renal"):
                    effective_mult = cov_mults.get("renal", 1.0)
                else:
                    effective_mult = 1.0

            shifted_weight = base_p * effective_mult
            raw_diffs.append({
                "disease": disease_name,
                "base_prior": base_p,
                "covariate_multiplier": effective_mult,
                "shifted_weight": shifted_weight,
                "urgency": diff.get("urgency", "MODERATE")
            })

        # Normalize weights to probabilities
        total_weight = sum(d["shifted_weight"] for d in raw_diffs) or 1.0
        final_differentials = []
        for d in sorted(raw_diffs, key=lambda x: x["shifted_weight"], reverse=True):
            posterior_pct = round((d["shifted_weight"] / total_weight) * 100, 1)
            final_differentials.append({
                "disease": d["disease"],
                "base_prior_pct": round(d["base_prior"] * 100, 1),
                "multiplier": d["covariate_multiplier"],
                "posterior_pct": posterior_pct,
                "urgency": d["urgency"]
            })

        # ── 2. Determine Red Flags & Triage Level ──
        red_flag_triggered = False
        red_flag_message = ""
        top_diff = final_differentials[0]

        # Check conditions & scenario severity
        if scenario.is_emergency_trigger:
            has_emergent_top = top_diff.get("urgency") == "EMERGENCY"
            has_high_emergent_diff = any(d.get("urgency") == "EMERGENCY" and d.get("posterior_pct", 0) >= 35.0 for d in final_differentials)
            is_frail_acute = persona.frailty_index >= 7

            # Severe respiratory distress escalation (Anand #11 inability to speak, Zoya #12 SpO2 93%, Ramesh #1 diabetic CKD pneumonia, Devaki #6, Harbans #13)
            is_severe_resp_risk = (scenario.id == 2 and (persona.id in [1, 6, 11, 12, 13] or persona.frailty_index >= 6 or has_copd or (persona.age >= 65 and has_diabetes)))

            if has_emergent_top or has_high_emergent_diff or is_frail_acute or is_severe_resp_risk:
                red_flag_triggered = True
                if scenario.emergency_type == "CARDIAC_EMERGENCY":
                    red_flag_message = f"🚨 RED FLAG: High probability of Acute Coronary Syndrome in {persona.name} (Age {persona.age}, Cardiac Prior Multiplier {cov_mults['cardiac']}x). Immediate 112/911 ambulance dispatch & 12-lead ECG required!"
                elif scenario.emergency_type == "STROKE_FAST":
                    red_flag_message = f"🚨 RED FLAG: Acute Stroke Syndrome (FAST Positive). Immediate Emergency Thrombolysis window (< 4.5 hrs). Do NOT administer Aspirin until non-contrast head CT rules out bleed!"
                elif scenario.emergency_type == "UPPER_GI_BLEED":
                    red_flag_message = f"🚨 RED FLAG: Upper GI Hemorrhage with Melena. Risk of hypovolemic collapse in patient with active medication use. Emergent IV fluid resuscitation & Upper Endoscopy!"
                elif scenario.emergency_type == "RESPIRATORY_EMERGENCY":
                    red_flag_message = f"🚨 RED FLAG: Acute Severe Respiratory Distress / Sepsis risk in {persona.name}. High likelihood of respiratory failure/decompensation. Immediate 112 ambulance transport, supplemental oxygen & hospital emergency evaluation!"
                else:
                    red_flag_message = f"🚨 RED FLAG: Critical acute escalation. Urgent hospital emergency room transfer required."

        if red_flag_triggered:
            triage_level = "EMERGENCY"
            triage_color = "red"
        elif any(d.get("urgency") == "URGENT" and d.get("posterior_pct", 0) > 20.0 for d in final_differentials) or persona.frailty_index >= 6:
            triage_level = "URGENT"
            triage_color = "orange"
        elif scenario.is_emergency_trigger:
            # Acute presentation in low-risk patient requires medical evaluation (ECG/vitals) to safely rule out pathology
            triage_level = "URGENT (RULE-OUT)"
            triage_color = "orange"
        elif any(d.get("urgency") == "MODERATE" and d.get("posterior_pct", 0) > 30.0 for d in final_differentials):
            triage_level = "SEMI-URGENT"
            triage_color = "yellow"
        else:
            triage_level = "ROUTINE"
            triage_color = "green"

        # ── 3. Multi-System Organ Burden (0-100) ──
        base_ob = scenario.base_organ_burden.copy()
        cond_str = " ".join(persona.conditions).lower()

        # Adjust Cardio
        cardio = base_ob.get("cardio", 20)
        if "hypertension" in cond_str: cardio += 15
        if "coronary" in cond_str or "heart failure" in cond_str: cardio += 25
        if persona.age >= 65: cardio += 10
        cardio = min(100, cardio)

        # Adjust Renal
        renal = base_ob.get("renal", 20)
        if "kidney" in cond_str or "ckd" in cond_str: renal += 35
        if "diabetes" in cond_str: renal += 15
        if "ibuprofen" in " ".join(persona.medications).lower(): renal += 15
        if persona.frailty_index >= 7: renal += 15
        renal = min(100, renal)

        # Adjust Resp
        resp = base_ob.get("resp", 20)
        if "asthma" in cond_str or "bronchitis" in cond_str or "byssinosis" in cond_str: resp += 30
        if "smoker" in str(persona.lifestyle.get("smoking", "")).lower(): resp += 15
        resp = min(100, resp)

        # Adjust GI/Hepatic
        gi = base_ob.get("gi", 20)
        if "gerd" in cond_str or "ulcer" in cond_str: gi += 30
        if "fatty liver" in cond_str: gi += 20
        if "alcohol" in str(persona.lifestyle.get("alcohol", "")).lower(): gi += 15
        gi = min(100, gi)

        # Adjust Neuro
        neuro = base_ob.get("neuro", 20)
        if "dementia" in cond_str or "cognitive" in cond_str: neuro += 30
        if "insomnia" in cond_str or "anxiety" in cond_str: neuro += 20
        if "fibromyalgia" in cond_str: neuro += 25
        neuro = min(100, neuro)

        organ_burden = {
            "cardiovascular": cardio,
            "renal_metabolic": renal,
            "respiratory": resp,
            "gastrointestinal": gi,
            "neuro_cognitive": neuro
        }

        # ── 4. Frailty Surge & Functional Impact ──
        frailty_surge = 1
        if triage_level == "EMERGENCY":
            frailty_surge = 3 if persona.frailty_index <= 5 else 2
        elif triage_level == "URGENT":
            frailty_surge = 2

        acute_frailty = min(10, persona.frailty_index + frailty_surge)

        # Pain scale
        acute_pain = 6
        if scenario.id in [1, 4, 5, 6, 12]:
            acute_pain = 8
        if "fibromyalgia" in cond_str:
            acute_pain = min(10, acute_pain + 2)  # Central sensitization
        if persona.frailty_index >= 8:
            acute_pain = min(10, acute_pain + 1)

        # Functional mobility & Work disruption
        if acute_frailty >= 8 or triage_level == "EMERGENCY":
            functional_mobility = "Bedridden / Emergency Admission"
            work_disruption = "Complete Disability (Strict Medical Leave Required)"
        elif acute_frailty >= 5 or triage_level == "URGENT":
            functional_mobility = "Severely Impaired (Confined to home, cane/walker needed)"
            work_disruption = "Severe Impairment (Unable to perform occupational duties)"
        elif acute_frailty >= 3:
            functional_mobility = "Mildly Impaired (Slowed pace, fatigue)"
            work_disruption = "Partial Disruption (Remote / Light duty advised)"
        else:
            functional_mobility = "Normal / Functional Independence"
            work_disruption = "Minimal (Transient symptom pauses)"

        # ── 5. Drug-Drug & Drug-Disease Interaction (DDI) Filter ──
        ddi_alerts: List[str] = []
        med_str = " ".join(persona.medications).lower()

        # Context-aware acuity weights
        is_hemostatic_critical_domain = (scenario.id in [6, 9])  # Upper GI Bleed & Stroke
        is_pain_metabolic_domain = (scenario.id in [1, 2, 5, 7, 8, 11, 12])  # Gout, Chest Pain, Pneumonia, UTI, Spine

        # Priority 1: Pregnancy Medication Safety (FDA PLLR Standard) — Never obscure for pregnant patient
        if persona.is_pregnant:
            ddi_alerts.append("🤰 PREGNANCY MEDICATION SAFETY (FDA PLLR): Avoid systemic NSAIDs in 2nd/3rd trimester (premature ductus arteriosus closure, oligohydramnios). ACE inhibitors, ARBs, and Fluoroquinolones contraindicated due to fetotoxicity. Paracetamol is the first-line analgesic of choice when clinically required.")

        # In Dehydrating Illness / Diarrhea (Scenario 10), Metformin Sick-Day rule is the primary time-critical medication action
        if scenario.id == 10 and "metformin" in med_str:
            ddi_alerts.append("⚠️ METFORMIN SICK-DAY RULE (SADMANS): Hold Metformin during dehydrating illness, acute sepsis, or volume depletion due to increased risk of serious Metformin-Associated Lactic Acidosis (MALA). Coordinate clinical restart with physician once eGFR and hydration normalize.")

        # Priority in GI Bleed & Stroke (Scenarios 6, 9): Hemostatic Alert is P0
        if is_hemostatic_critical_domain and ("apixaban" in med_str or "aspirin" in med_str or "clopidogrel" in med_str):
            ddi_alerts.append("🚨 HEMOSTATIC ALERT: Patient on active antiplatelet/anticoagulant therapy. High bleeding hazard. NSAIDs contraindicated (severe GI bleed risk); avoid unmonitored procedures; record last-dose timing for emergency team.")

        # Priority in Pain / Inflammatory Domains (Gout, Pneumonia, UTI, Spine): Renal NSAID Safety is P0
        if ("kidney" in cond_str or "ckd" in cond_str) and not any("RENAL" in a for a in ddi_alerts):
            ddi_alerts.append("⛔ RENAL NSAID CONTRAINDICATION: NSAIDs (Ibuprofen/Naproxen/Diclofenac) strictly contraindicated in Stage 3-5 CKD. High risk of hemodynamically mediated Acute Kidney Injury (AKI) and accelerating CKD progression via afferent arteriolar vasoconstriction.")

        # General Hemostatic Alert (for non-GI/Stroke domains if not already covered)
        if ("apixaban" in med_str or "aspirin" in med_str or "clopidogrel" in med_str) and not any("HEMOSTATIC" in a for a in ddi_alerts):
            ddi_alerts.append("🚨 HEMOSTATIC ALERT: Patient on active antiplatelet/anticoagulant therapy. High bleeding hazard. NSAIDs contraindicated (severe GI bleed risk); avoid unmonitored procedures; record last-dose timing for emergency team.")

        # Priority: Metformin Sick-Day Rule (General Dehydration / Sepsis)
        if "metformin" in med_str and (scenario.id in [2, 7] or "hypovolemia" in scenario.title.lower() or "diarrhea" in scenario.title.lower()):
            if not any("METFORMIN" in a for a in ddi_alerts):
                ddi_alerts.append("⚠️ METFORMIN SICK-DAY RULE (SADMANS): Hold Metformin during dehydrating illness, acute sepsis, or volume depletion due to increased risk of serious Metformin-Associated Lactic Acidosis (MALA). Coordinate clinical restart with physician once eGFR and hydration normalize.")

        # Priority: Gastrointestinal NSAID Contraindication (Ulcer / Bleed)
        if ("ulcer" in cond_str or "gerd" in cond_str or scenario.id == 6) and not any("GASTROINTESTINAL" in a for a in ddi_alerts):
            ddi_alerts.append("⛔ GASTROINTESTINAL CONTRAINDICATION: Systemic NSAIDs contraindicated due to severe gastric mucosal erosion and upper gastrointestinal hemorrhage risk.")

        # Priority: Cardiac Warning (Heart Failure / Fluid Retention)
        if ("heart failure" in cond_str or "chf" in cond_str) and not any("CARDIAC" in a for a in ddi_alerts):
            ddi_alerts.append("⚠️ CARDIAC WARNING: NSAIDs promote renal sodium & water retention, worsening acute congestive heart failure decompensation.")

        # Priority: Respiratory Beta-Blocker DDI (Only if beta-blocker AND reactive airway disease)
        if ("metoprolol" in med_str or "propranolol" in med_str) and ("asthma" in cond_str or "bronchitis" in cond_str or "byssinosis" in cond_str or "copd" in cond_str or scenario.id == 8):
            ddi_alerts.append("⚠️ RESPIRATORY DDI: Patient is taking Beta-blockers. Non-cardioselective or high-dose beta-blockers exacerbate acute bronchospasm and blunt bronchodilator response.")

        # Priority 8: Allergies
        for allergy in persona.allergies:
            al_lower = allergy.lower()
            if "sulfa" in al_lower:
                ddi_alerts.append("⚠️ ALLERGY SHIELD: Sulfa allergy documented. Avoid Sulfamethoxazole (Bactrim) and thiazide cross-reactivity.")
            if "penicillin" in al_lower:
                ddi_alerts.append("🚨 ALLERGY ALERT: Penicillin allergy noted. Avoid Amoxicillin, Ampicillin; select Cephalosporins with extreme caution or use Macrolides / Azithromycin.")
            if "aspirin" in al_lower:
                ddi_alerts.append("🚨 SAMTER'S TRIAD / ASPIRIN ALLERGY: Severe bronchospasm hazard with all COX-1 inhibitors.")

        if not ddi_alerts:
            ddi_alerts.append("✓ No immediate high-risk DDI clashes detected with baseline profile.")

        # ── 6. Multi-Modal Personalized Clinical Recommendations ──
        allopathic: List[str] = []
        ayush: List[str] = []
        kitchen: List[str] = []
        lifestyle: List[str] = []

        if triage_level == "EMERGENCY":
            allopathic.append("Immediate 112/911 ambulance transport to tertiary emergency trauma/cardiac unit.")
            allopathic.append("Establish dual large-bore IV access, continuous 12-lead ECG telemetry, and supplemental oxygen if SpO2 < 92%.")
            allopathic.append("Do NOT administer oral medications if aspiration or emergency endoscopy/surgery is possible.")
            ayush.append("Hold traditional formulations until emergency clinical stabilization is achieved.")
            kitchen.append("Nil Per Os (NPO / Nothing by mouth) while awaiting emergency team assessment.")
            lifestyle.append("Complete bed rest in semi-Fowler position (head elevated 30-45 degrees). Loosen tight clothing.")
        else:
            # Calibrated Non-Emergency Recommendations
            if scenario.id == 3:  # Migraine / Headache
                allopathic.append("Oral Paracetamol 650-1000mg or Rizatriptan 10mg (if non-contraindicated) at earliest onset.")
                allopathic.append("Oral Metoclopramide 10mg for gastroprokinesis and anti-emesis.")
                ayush.append("Nasya with 2 drops of lukewarm Anu Taila in each nostril to relieve cranial pressure.")
                ayush.append("Saraswatarishta 15ml with equal water post-meals for neuro-calming.")
                kitchen.append("Cold compress with lavender water across forehead and temples in a dark room.")
                kitchen.append("Warm ginger-clove infusion (Shunthi Kwatha) to relieve gastric stasis and nausea.")
                lifestyle.append("Complete digital screen detox for 24 hours. Hydrate with 2.5L electrolyte-balanced water.")

            elif scenario.id == 5:  # Gout
                if "kidney" in cond_str or "ckd" in cond_str:
                    allopathic.append("Avoid NSAIDs! Use oral Prednisolone 20-30mg daily taper or low-dose Colchicine (0.5mg OD renally adjusted).")
                else:
                    allopathic.append("Clinical screening for Septic Arthritis (fever, chills, skin break, joint effusion) is mandatory prior to confirming pure crystalline gout.")
                ayush.append("Kaishore Guggulu (2 tablets twice daily) — classical Ayurvedic formulation for Vatarakta (Gout).")
                ayush.append("Guduchi (Tinospora cordifolia) decoction 30ml twice daily to accelerate uric acid clearance.")
                kitchen.append("Apply a cool ice pack wrapped in a thin towel for 15-20 minutes; avoid warm water soaking which promotes vasodilation and calor.")
                kitchen.append("Tart cherry juice (200ml) or lemon water (alkalizes urine to solubilize urate crystals).")
                lifestyle.append("Strict elimination of red meat, organ meats, beer, shellfish, and high-fructose corn syrup.")

            elif scenario.id == 7:  # UTI / Pyelonephritis
                allopathic.append("Urgent midstream urine culture + sensitivity. Empirical Nitrofurantoin or Cefixime (avoid Fluoroquinolones if tendonitis history).")
                allopathic.append("Urine alkalizer (Disodium hydrogen citrate 15ml in water TID).")
                ayush.append("Chandraprabha Vati (2 tablets twice daily) — potent Ayurvedic urinary antiseptic and anti-inflammatory.")
                ayush.append("Gokshuradi Guggulu (2 tablets TID) to promote renal diuresis and reduce burning.")
                kitchen.append("Coriander seed water (Dhanyaka Hima): soak 2 tbsp crushed coriander seeds overnight, strain and drink.")
                kitchen.append("Fresh unsweetened tender coconut water 2-3 glasses daily to flush the urinary tract.")
                lifestyle.append("Urinate every 2-3 hours; do not hold urine. Avoid tight synthetic garments.")

            elif scenario.id == 10:  # Gastroenteritis
                allopathic.append("WHO Low-Osmolarity Oral Rehydration Salts (ORS) — 200-400ml after every loose stool. In severe dehydration with postural syncope or anuria (>6h), immediate emergency clinic / IV fluid resuscitation is mandatory.")
                allopathic.append("Oral Zinc sulfate 20mg daily for 14 days + Saccharomyces boulardii probiotic sachet BID.")
                ayush.append("Kutajaghan Vati (2 tablets TID) — supportive astringent for Atisara (used only as adjunct to, never replacement for, WHO-ORS).")
                ayush.append("Mustarishta 15ml with water after meals to normalize digestive Agni.")
                kitchen.append("Thin rice kanji or pomegranate juice with a pinch of rock salt and roasted cumin powder.")
                kitchen.append("Buttermilk (Takra) churned with roasted jeera, curry leaves, and ginger.")
                lifestyle.append("BRAT diet (Banana, Rice khichdi, Applesauce, Toast). Avoid all dairy, fried foods, and caffeine.")

            elif scenario.id == 12:  # Lumbar Disc / Back Spasm
                allopathic.append("Short course Paracetamol 1000mg TID + Thiocolchicoside 4mg BID (muscle relaxant).")
                allopathic.append("Short-term spinal extension protocols (McKenzie method) after acute spasm subsides.")
                ayush.append("Local gentle application of Mahanarayan Taila or Sahacharadi Taila followed by warm fomentation.")
                ayush.append("Yograj Guggulu (2 tablets BID with warm water) for lumbar Vata pacification.")
                kitchen.append("Warm turmeric-black pepper milk (Golden Milk) at bedtime for systemic anti-inflammatory effect.")
                kitchen.append("Warm dry heat fomentation with coarse salt in a cotton cloth pack across sacral area.")
                lifestyle.append("Avoid prolonged sitting or forward bending. Place pillow under knees when sleeping supine.")

            else:
                allopathic.append(f"Targeted clinical evaluation with comprehensive baseline metabolic panel and CBC.")
                allopathic.append("Symptomatic relief tailored to eGFR and hepatic reserve.")
                ayush.append("Balancing tri-dosha regimen: Ashwagandha or Guduchi adaptogenic support.")
                kitchen.append("Warm ginger-tulsi tea with rock salt and honey.")
                lifestyle.append("Adequate physical rest, stress attenuation, and hydration.")

        return SimulationImpactResult(
            persona=persona,
            scenario=scenario,
            triage_level=triage_level,
            triage_color=triage_color,
            red_flag_triggered=red_flag_triggered,
            red_flag_message=red_flag_message,
            bayesian_differentials=final_differentials,
            organ_burden=organ_burden,
            acute_frailty_score=acute_frailty,
            frailty_surge=frailty_surge,
            acute_pain_score=acute_pain,
            functional_mobility=functional_mobility,
            work_disruption=work_disruption,
            ddi_contraindications=ddi_alerts,
            allopathic_management=allopathic,
            ayush_remedies=ayush,
            kitchen_home_remedies=kitchen,
            lifestyle_guidelines=lifestyle
        )


# ─────────────────────────────────────────────────────────────────────────────
# 5. TERMINAL UI & VISUALIZATION ENGINE
# ─────────────────────────────────────────────────────────────────────────────

class TerminalRenderer:
    """
    Renders high-fidelity terminal UI components using Rich.
    """

    @staticmethod
    def print_banner():
        title_text = Text()
        title_text.append("🏥 AROVIA / HEALIO.AI — CLINICAL HEALTH PERSONA ENGINE\n", style="bold cyan")
        title_text.append("Deterministic Multi-Dimensional Disease & Symptom Impact Simulator\n", style="italic white")
        title_text.append("18 Calibrated Personas • Bayesian Prior Shifts • DDI Safety Shield • Ayush Multi-Modal", style="dim green")
        panel = Panel(
            title_text,
            box=box.DOUBLE,
            border_style="cyan",
            padding=(1, 2)
        )
        console.print(panel)

    @staticmethod
    def render_persona_summary_table(personas: List[ClinicalPersona]):
        table = Table(
            title="📋 Arovia Clinical Persona Roster (18 Profiles)",
            box=box.ROUNDED,
            header_style="bold magenta",
            show_lines=True
        )
        table.add_column("ID", justify="center", style="bold cyan", width=4)
        table.add_column("Patient Name", style="bold white", width=18)
        table.add_column("Age/Sex", justify="center", width=8)
        table.add_column("Occupation", width=18)
        table.add_column("BMI & Vitals", width=16)
        table.add_column("Core Diagnosed Conditions", width=26)
        table.add_column("Polypharmacy", justify="center", width=13)
        table.add_column("Frailty", justify="center", width=8)

        for p in personas:
            # Polypharmacy badge
            poly_color = "green"
            if p.polypharmacy_risk == "critical": poly_color = "bold red"
            elif p.polypharmacy_risk == "high": poly_color = "red"
            elif p.polypharmacy_risk == "moderate": poly_color = "yellow"

            # Frailty badge
            frailty_color = "green"
            if p.frailty_index >= 7: frailty_color = "bold red"
            elif p.frailty_index >= 4: frailty_color = "yellow"

            cond_summary = ", ".join(p.conditions[:2])
            if len(p.conditions) > 2:
                cond_summary += f" (+{len(p.conditions)-2} more)"

            table.add_row(
                str(p.id),
                p.name + (" 🤰" if p.is_pregnant else ""),
                f"{p.age}y / {p.sex[:1].upper()}",
                p.occupation,
                f"BMI {p.bmi} ({p.bmi_category[:6]})\nBP {p.resting_bp}",
                cond_summary,
                f"[{poly_color}]{p.polypharmacy_risk.upper()}[/{poly_color}]\n({len(p.medications)} meds)",
                f"[{frailty_color}]{p.frailty_index}/10[/{frailty_color}]"
            )

        console.print(table)

    @staticmethod
    def render_persona_dossier(p: ClinicalPersona):
        console.rule(f"[bold cyan]CLINICAL DOSSIER: #{p.id} — {p.name.upper()} {('🤰 (PREGNANT - 26 WEEKS)' if p.is_pregnant else '')}[/bold cyan]")

        # Profile Grid
        vitals_text = (
            f"[bold]Age:[/bold] {p.age} years | [bold]Sex:[/bold] {p.sex.capitalize()} | [bold]Location:[/bold] {p.location}\n"
            f"[bold]Height:[/bold] {p.height_cm} cm | [bold]Weight:[/bold] {p.weight_kg} kg | [bold]BMI:[/bold] {p.bmi} ({p.bmi_category})\n"
            f"[bold]Resting BP:[/bold] {p.resting_bp} mmHg | [bold]Resting Heart Rate:[/bold] {p.resting_hr} bpm\n"
            f"[bold]Clinical Frailty Index:[/bold] [{'red' if p.frailty_index >= 6 else 'yellow' if p.frailty_index >= 3 else 'green'}]{p.frailty_index}/10[/]\n"
            f"[bold]Polypharmacy Hazard Level:[/bold] [{'red' if p.polypharmacy_risk in ['high','critical'] else 'yellow'}]{p.polypharmacy_risk.upper()}[/] ({len(p.medications)} active drugs)"
        )

        p_vitals = Panel(vitals_text, title="🩺 Biometrics & Baseline Vitals", box=box.ROUNDED, border_style="cyan")

        lifestyle_text = (
            f"[bold]Occupation:[/bold] {p.occupation}\n"
            f"[bold]Diet Pattern:[/bold] {p.diet_profile}\n"
            f"[bold]Physical Activity:[/bold] {p.lifestyle.get('exercise')}\n"
            f"[bold]Sleep Hygiene:[/bold] {p.lifestyle.get('sleep_hours')} hours/night ({p.lifestyle.get('circadian')})\n"
            f"[bold]Smoking Habits:[/bold] {p.lifestyle.get('smoking')}\n"
            f"[bold]Alcohol Intake:[/bold] {p.lifestyle.get('alcohol')}\n"
            f"[bold]Stress Level:[/bold] {p.lifestyle.get('stress_level')}"
        )
        p_lifestyle = Panel(lifestyle_text, title="🌱 Lifestyle & Circadian Profile", box=box.ROUNDED, border_style="green")

        console.print(Columns([p_vitals, p_lifestyle]))

        # Clinical History Grid
        history_table = Table(box=box.SIMPLE_HEAVY, show_header=True, header_style="bold yellow")
        history_table.add_column("Diagnosed Conditions", style="white", width=30)
        history_table.add_column("Current Active Medications", style="cyan", width=32)
        history_table.add_column("Documented Allergies", style="red", width=22)
        history_table.add_column("Family Genetic History", style="magenta", width=24)

        max_len = max(len(p.conditions), len(p.medications), len(p.allergies), len(p.family_history))
        for i in range(max_len):
            cond = p.conditions[i] if i < len(p.conditions) else ""
            med = p.medications[i] if i < len(p.medications) else ""
            alg = p.allergies[i] if i < len(p.allergies) else ""
            fam = p.family_history[i] if i < len(p.family_history) else ""
            history_table.add_row(cond, med, alg, fam)

        console.print(Panel(history_table, title="📋 Medical History & Pharmacological Regimen", box=box.ROUNDED, border_style="yellow"))

        if p.key_quote:
            console.print(Panel(f"[italic cyan]{p.key_quote}[/italic cyan]", title="💬 Patient Voice & Reality", box=box.ROUNDED, border_style="dim white"))

    @staticmethod
    def render_simulation_report(res: SimulationImpactResult):
        p = res.persona
        s = res.scenario

        console.print("\n")
        console.rule(f"[bold {res.triage_color}]SIMULATION REPORT: {p.name.upper()} ➔ {s.title.upper()}[/bold {res.triage_color}]")

        # 1. Triage Banner
        triage_text = Text()
        triage_text.append(f"TRIAGE LEVEL: {res.triage_level}\n", style=f"bold {res.triage_color}")
        if res.red_flag_triggered:
            triage_text.append(f"{res.red_flag_message}\n", style="bold red")
        triage_text.append(f"Chief Complaint: {s.chief_complaint} (Duration: {s.duration})\n", style="white")
        triage_text.append(f"Acute Pain Score: {res.acute_pain_score}/10  |  Functional Status: {res.functional_mobility}\n", style="bold yellow")
        triage_text.append(f"Occupational Impact: {res.work_disruption}", style="dim")

        console.print(Panel(triage_text, box=box.HEAVY, border_style=res.triage_color))

        # 2. Bayesian Differentials Table
        diff_table = Table(
            title=f"🧠 Bayesian Covariate-Shifted Differential Diagnoses (P(Disease | Symptoms, {p.name}))",
            box=box.ROUNDED,
            header_style="bold cyan",
            show_lines=True
        )
        diff_table.add_column("Differential Condition", style="bold white", width=34)
        diff_table.add_column("Base Prior", justify="center", width=12)
        diff_table.add_column("Persona Multiplier (α)", justify="center", width=22)
        diff_table.add_column("Posterior Probability", justify="center", style="bold yellow", width=22)
        diff_table.add_column("Urgency", justify="center", width=14)

        for d in res.bayesian_differentials:
            mult_style = "bold red" if d["multiplier"] >= 2.0 else "bold green" if d["multiplier"] <= 0.6 else "yellow"
            prob_bar = "█" * int(d["posterior_pct"] / 5)
            diff_table.add_row(
                d["disease"],
                f"{d['base_prior_pct']}%",
                f"[{mult_style}]{d['multiplier']}x shift[/{mult_style}]",
                f"{d['posterior_pct']}%  [cyan]{prob_bar}[/cyan]",
                f"[{'red' if d['urgency']=='EMERGENCY' else 'yellow' if d['urgency']=='URGENT' else 'green'}]{d['urgency']}[/]"
            )

        console.print(diff_table)

        # 3. Multi-System Organ Burden Visualization
        ob_table = Table(
            title="⚡ Multi-System Organ Burden Index (0 - 100%)",
            box=box.SIMPLE,
            header_style="bold magenta"
        )
        ob_table.add_column("Organ System", width=22)
        ob_table.add_column("Stress Burden", justify="center", width=14)
        ob_table.add_column("Visual Gauge", width=36)
        ob_table.add_column("Clinical Interpretation", width=36)

        organ_labels = [
            ("cardiovascular", "Cardiovascular", "Heart strain, ischemia, hypertensive crisis"),
            ("renal_metabolic", "Renal & Metabolic", "eGFR stress, fluid retention, acidosis risk"),
            ("respiratory", "Respiratory", "Bronchospasm, hypoxemia, alveolar compromise"),
            ("gastrointestinal", "GI & Hepatic", "Mucosal ulceration, liver transaminitis, bleed"),
            ("neuro_cognitive", "Neuro-Cognitive", "Encephalopathy, stroke, cerebral perfusion")
        ]

        for key, name, desc in organ_labels:
            val = res.organ_burden.get(key, 0)
            bar_len = int(val / 3)
            gauge = "█" * bar_len + "░" * (33 - bar_len)
            gauge_color = "red" if val >= 75 else "yellow" if val >= 50 else "green"
            ob_table.add_row(
                name,
                f"[{gauge_color}]{val}%[/{gauge_color}]",
                f"[{gauge_color}]{gauge}[/{gauge_color}]",
                f"[dim]{desc}[/dim]"
            )

        console.print(ob_table)

        # 4. Drug-Drug & Drug-Disease Interaction (DDI) Shield
        ddi_panel_text = ""
        for alert in res.ddi_contraindications:
            ddi_panel_text += f"{alert}\n"
        console.print(Panel(ddi_panel_text.strip(), title="🛡️ DDI Safety & Contraindication Filter", box=box.ROUNDED, border_style="red" if any("CRITICAL" in a or "CONTRAINDICATION" in a for a in res.ddi_contraindications) else "green"))

        # 5. Multi-Modal Personalized Clinical Recommendations
        rec_table = Table(box=box.ROUNDED, show_header=True, header_style="bold green")
        rec_table.add_column("Allopathic Protocol", style="white", width=28)
        rec_table.add_column("Safe Classical Ayush / Ayurvedic", style="cyan", width=28)
        rec_table.add_column("Kitchen Remedies (Nuskhe)", style="yellow", width=28)
        rec_table.add_column("Lifestyle & Hydration", style="magenta", width=28)

        max_rows = max(len(res.allopathic_management), len(res.ayush_remedies), len(res.kitchen_home_remedies), len(res.lifestyle_guidelines))
        for i in range(max_rows):
            allo = res.allopathic_management[i] if i < len(res.allopathic_management) else ""
            ayu = res.ayush_remedies[i] if i < len(res.ayush_remedies) else ""
            kitch = res.kitchen_home_remedies[i] if i < len(res.kitchen_home_remedies) else ""
            life = res.lifestyle_guidelines[i] if i < len(res.lifestyle_guidelines) else ""
            rec_table.add_row(
                f"• {allo}" if allo else "",
                f"• {ayu}" if ayu else "",
                f"• {kitch}" if kitch else "",
                f"• {life}" if life else ""
            )

        console.print(Panel(rec_table, title="🌿 Personalized Multi-Modal Clinical Management Plan", box=box.ROUNDED, border_style="green"))

    @staticmethod
    def render_cross_persona_matrix(scenario: SymptomScenario, results: List[SimulationImpactResult]):
        """
        Renders side-by-side comparison matrix across multiple personas for a single symptom.
        """
        console.print("\n")
        console.rule(f"[bold cyan]CROSS-PERSONA STRESS TEST: {scenario.title.upper()}[/bold cyan]")
        console.print(f"[italic dim white]Demonstrating how the EXACT SAME disease/symptom affects distinct patient archetypes differently.[/italic dim white]\n")

        matrix_table = Table(
            box=box.ROUNDED,
            header_style="bold magenta",
            show_lines=True
        )
        matrix_table.add_column("Persona", style="bold white", width=16)
        matrix_table.add_column("Profile / Age / Disease", width=22)
        matrix_table.add_column("Triage Level", justify="center", width=14)
        matrix_table.add_column("Top Differential Diagnosis", width=26)
        matrix_table.add_column("Cardio / Renal Burden", justify="center", width=16)
        matrix_table.add_column("Frailty Surge", justify="center", width=13)
        matrix_table.add_column("Top Contraindication / Safety Alert", width=28)

        for res in results:
            p = res.persona
            top_d = res.bayesian_differentials[0]
            top_alert = res.ddi_contraindications[0] if res.ddi_contraindications else "None"
            if len(top_alert) > 85:
                top_alert = top_alert[:82] + "..."

            cardio = res.organ_burden["cardiovascular"]
            renal = res.organ_burden["renal_metabolic"]

            matrix_table.add_row(
                f"#{p.id} {p.name}\n({p.sex[:1].upper()}/{p.age})",
                f"{p.occupation}\n[dim]{p.conditions[0] if p.conditions else 'None'}[/dim]",
                f"[{res.triage_color}]{res.triage_level}[/{res.triage_color}]",
                f"[bold cyan]{top_d['disease']}[/bold cyan]\n({top_d['posterior_pct']}%, mult: {top_d['multiplier']}x)",
                f"C: {cardio}% | R: {renal}%",
                f"{p.frailty_index} ➔ [bold red]{res.acute_frailty_score}[/bold red]\n(+{res.frailty_surge})",
                top_alert
            )

        console.print(matrix_table)

    @staticmethod
    def render_head_to_head(res1: SimulationImpactResult, res2: SimulationImpactResult):
        """
        Renders a detailed side-by-side comparison between two personas.
        """
        p1, p2 = res1.persona, res2.persona
        scenario = res1.scenario

        console.print("\n")
        console.rule(f"[bold cyan]HEAD-TO-HEAD CLINICAL COMPARISON: {p1.name} VS {p2.name}[/bold cyan]")
        console.print(f"[bold yellow]Common Stressor:[/bold yellow] {scenario.title}\n")

        table = Table(box=box.HEAVY, show_lines=True)
        table.add_column("Clinical Metric", style="bold cyan", width=24)
        table.add_column(f"Persona A: {p1.name} ({p1.age}y {p1.sex})", style="white", width=42)
        table.add_column(f"Persona B: {p2.name} ({p2.age}y {p2.sex})", style="white", width=42)

        table.add_row(
            "Primary Archetype",
            f"{p1.occupation}\nConditions: {', '.join(p1.conditions[:2])}",
            f"{p2.occupation}\nConditions: {', '.join(p2.conditions[:2])}"
        )
        table.add_row(
            "Triage Status",
            f"[{res1.triage_color}]{res1.triage_level}[/{res1.triage_color}]",
            f"[{res2.triage_color}]{res2.triage_level}[/{res2.triage_color}]"
        )
        table.add_row(
            "Top Diagnosis Shift",
            f"[bold]{res1.bayesian_differentials[0]['disease']}[/bold]\nPrior Shift: {res1.bayesian_differentials[0]['multiplier']}x  |  Posterior: {res1.bayesian_differentials[0]['posterior_pct']}%",
            f"[bold]{res2.bayesian_differentials[0]['disease']}[/bold]\nPrior Shift: {res2.bayesian_differentials[0]['multiplier']}x  |  Posterior: {res2.bayesian_differentials[0]['posterior_pct']}%"
        )
        table.add_row(
            "Organ Burdens",
            f"Cardio: {res1.organ_burden['cardiovascular']}% | Renal: {res1.organ_burden['renal_metabolic']}%\nResp: {res1.organ_burden['respiratory']}% | Neuro: {res1.organ_burden['neuro_cognitive']}%",
            f"Cardio: {res2.organ_burden['cardiovascular']}% | Renal: {res2.organ_burden['renal_metabolic']}%\nResp: {res2.organ_burden['respiratory']}% | Neuro: {res2.organ_burden['neuro_cognitive']}%"
        )
        table.add_row(
            "Frailty Shift",
            f"Baseline: {p1.frailty_index}/10 ➔ Acute: {res1.acute_frailty_score}/10",
            f"Baseline: {p2.frailty_index}/10 ➔ Acute: {res2.acute_frailty_score}/10"
        )
        table.add_row(
            "DDI Safety Clash",
            res1.ddi_contraindications[0] if res1.ddi_contraindications else "None",
            res2.ddi_contraindications[0] if res2.ddi_contraindications else "None"
        )

        console.print(table)


# ─────────────────────────────────────────────────────────────────────────────
# 6. EXPORT / REPORT GENERATION (MARKDOWN)
# ─────────────────────────────────────────────────────────────────────────────

def export_stress_test_markdown(output_file: Path):
    """
    Simulates key scenarios across all personas and writes an exhaustive clinical report.
    """
    output_file.parent.mkdir(parents=True, exist_ok=True)
    lines = []
    lines.append("# Arovia / Healio.AI — Clinical Health Persona & Disease Impact Analysis Report")
    lines.append(f"> Auto-generated clinical stress-test across 18 calibrated personas.\n")

    lines.append("## 1. Persona Roster Overview")
    lines.append("| ID | Patient | Age/Sex | Occupation | Core Diagnoses | Polypharmacy | Frailty |")
    lines.append("|---|---|---|---|---|---|---|")
    for p in PERSONAS:
        lines.append(f"| {p.id} | {p.name} | {p.age} {p.sex[:1].upper()} | {p.occupation} | {', '.join(p.conditions[:2])} | {p.polypharmacy_risk} | {p.frailty_index}/10 |")

    lines.append("\n---\n")
    lines.append("## 2. Key Disease Simulations & Epidemiological Divergence")

    # Select representative scenarios
    selected_scenarios = [SYMPTOM_SCENARIOS[0], SYMPTOM_SCENARIOS[1], SYMPTOM_SCENARIOS[4], SYMPTOM_SCENARIOS[5], SYMPTOM_SCENARIOS[9]]

    for sc in selected_scenarios:
        lines.append(f"### Scenario: {sc.title}")
        lines.append(f"**Chief Complaint:** {sc.chief_complaint}  \n**Duration:** {sc.duration}\n")
        lines.append("| Persona | Triage | Top Diagnosis | Posterior % | Multiplier | Organ Burden (C/R/Resp) | Primary DDI / Safety Alert |")
        lines.append("|---|---|---|---|---|---|---|")

        for p in PERSONAS:
            res = ClinicalImpactEngine.simulate(p, sc)
            top_d = res.bayesian_differentials[0]
            cardio = res.organ_burden["cardiovascular"]
            renal = res.organ_burden["renal_metabolic"]
            resp = res.organ_burden["respiratory"]
            alert = res.ddi_contraindications[0].replace("|", "\\|") if res.ddi_contraindications else "None"
            lines.append(f"| #{p.id} {p.name} | **{res.triage_level}** | {top_d['disease']} | {top_d['posterior_pct']}% | {top_d['multiplier']}x | C:{cardio}% R:{renal}% Resp:{resp}% | {alert} |")

        lines.append("\n---\n")
    lines.append("## 3. 🗣️ Plain English & Layman Guide: What This Actually Means in Everyday Life\n")
    lines.append("### The Big Picture: Why Does the Same Sickness Act Completely Differently in Different People?\n")
    lines.append("Imagine two vehicles getting a flat tire on a mountain highway:\n")
    lines.append("- **Vehicle A** is a brand-new, well-maintained 4x4 SUV with fresh tires, strong brakes, and an energetic 25-year-old driver.\n")
    lines.append("- **Vehicle B** is an old, heavily loaded 18-wheeler truck with worn-out brakes, low engine oil, and an exhausted driver who hasn't slept in 16 hours.\n\n")
    lines.append("The flat tire is identical. But in **Vehicle A**, it's an annoying 20-minute inconvenience. In **Vehicle B**, that exact same flat tire causes the heavy truck to lose steering, jackknife, and crash.\n\n")
    lines.append("In medicine, **your body is that vehicle**. Your age, your chronic illnesses (like diabetes or kidney weakness), your lifestyle (smoking, diet, sleep), and your current pills are the condition of your brakes and engine. A symptom that is harmless in a healthy person can be life-threatening in someone with underlying organ damage.\n\n")
    lines.append("Here is what really happens in plain English across the 5 scenarios tested above:\n")

    lines.append("### 1. Crushing Chest Pain: Muscle Spasm vs. Real Heart Attack vs. Spicy Food Burn")
    lines.append("- **The 19-Year-Old Athlete (#5 Vik Rathore):** His heart arteries are spotless. His resting heart rate is a calm 46 bpm. When he feels crushing chest pain, there is a **63.2% chance it is Costochondritis**—meaning the cartilage between his ribs and breastbone got inflamed from bench pressing or max-effort sprinting. His heart attack risk is under 5%. Rest and a warm pack will fix him.\n")
    lines.append("- **The 68-Year-Old Retired Clerk (#1 Ramesh Sharma):** He has had high blood sugar and high blood pressure for over 15 years, and smoked in his youth. His coronary arteries have fatty cholesterol build-up (plaques) like rusted water pipes. When he feels chest pressure, there is a **65.9% probability that an artery has blocked off (Acute Heart Attack)**. His risk is **5.7 times higher** than normal! Calling an ambulance immediately is the only safe option.\n")
    lines.append("- **The 28-Year-Old Nightclub Bartender (#8 Koko Roy):** He works nocturnal shifts, drinks alcohol, vapes, and eats spicy street food at 4 AM. His stomach acid splashes up into his esophagus, causing severe chemical burns that feel exactly like a heart attack! For him, acid reflux is the main cause (41.4%). But watch out: because he is allergic to NSAID painkillers, taking an aspirin could trigger a severe asthma attack!\n\n")

    lines.append("### 2. High Fever (103°F) & Purulent Green Cough: Pneumonia & Sepsis")
    lines.append("- **Why does a chest infection feel like a bad cold for a teenager, but hospitalize an elderly grandfather?**\n")
    lines.append("- **The 16-Year-Old High School Swimmer (#12 Zoya):** Her lungs are clean and expansive. Her immune system quickly rallies white blood cells to neutralize bacteria. She feels miserable for a few days, but her vital organs hold steady.\n")
    lines.append("- **The 54-Year-Old Factory Foreman (#11 Anand Joshi):** He has inhaled cotton dust and chemical dye fumes for 30 years and smokes bidis daily. His lungs are already scarred (Byssinosis). When bacteria enter his lungs, they multiply rapidly, spiking his lung burden to **100% max capacity**.\n")
    lines.append("- **The 81-Year-Old Grandpa (#13 Harbans Lal):** His heart is already weak (Ejection Fraction only 32%) and his kidneys operate at 20% capacity. When a high fever strikes, his heart cannot pump fast enough to deliver oxygen, and his blood pressure collapses. Toxins leak into his blood, causing life-threatening **sepsis** and severe confusion (delirium).\n\n")

    lines.append("### 3. Screaming Agony in the Great Toe at 3 AM: The Gout Trap")
    lines.append("- **What is Gout?** When you digest rich foods (like red meat, beer, and organ meats), your body makes uric acid. If your kidneys cannot flush it out fast enough, the excess acid forms microscopic needle-sharp crystals that lodge in your coolest joint—the big toe.\n")
    lines.append("- **The Real Estate Developer (#15 Manish Chawla):** He hosts lavish dinners with tandoori mutton and heavy scotch. His blood is overflowing with uric acid (9.8 mg/dL). When he wakes up screaming from a fiery red toe, his probability of a gout flare-up is **11 times higher** than normal! The pain is so excruciating that even a light bedsheet touching the toe feels like fire.\n")
    lines.append("- **The Fatal Medicine Trap:** If Manish takes an over-the-counter painkiller like Brufen or Combiflam, his stomach might hurt, but he will recover. BUT if **Ramesh Sharma** (#1, who also has kidney disease) gets gout and takes Brufen, that single pill can cause **instant, irreversible kidney shutdown**! For Ramesh, doctors must use safe steroids or low-dose colchicine, never NSAIDs.\n\n")

    lines.append("### 4. Vomiting Coffee-Grounds & Black Tarry Stool: Internal Stomach Bleeding")
    lines.append("- **What does dark vomit and black stool mean?** It means blood has leaked into the stomach, reacted with gastric acid, turned black, and traveled through the gut. It is an internal bleeding emergency.\n")
    lines.append("- **The Long-Haul Truck Driver (#3 Gurpreet):** To endure 14-hour highway driving shifts with back pain, he swallows 600mg Ibuprofen pills daily like candy. Ibuprofen strips away the stomach's protective slime coating. His stomach acid burned a crater into his stomach wall, causing a bleeding ulcer.\n")
    lines.append("- **The Surgeon (#9 Dr. Farooq) & Grandpa (#13 Harbans Lal):** Both take blood thinners (Aspirin, Clopidogrel, Apixaban) to prevent strokes. When someone on blood thinners develops a bleeding ulcer, their blood cannot clot! They can lose several liters of blood internally in a few hours without seeing red blood externally. This is why it is an immediate Code Red emergency.\n\n")

    lines.append("### 5. Severe Watery Diarrhea (12x/day) & Sunken Eyes: Dehydration vs. Kidney Shutdown")
    lines.append("- **Isn't diarrhea just a routine stomach bug?** For a healthy young person, yes. But losing 12 watery stools in 24 hours drains gallons of water and essential salts (potassium and sodium) from your blood vessels.\n")
    lines.append("- **The Organic Farmer (#10 Priyanka):** Her kidneys are strong. With basic Oral Rehydration Salts (ORS), coconut water, and pomegranate juice, her blood volume recovers smoothly.\n")
    lines.append("- **The 68-Year-Old Diabetic Clerk (#1 Ramesh):** His kidneys already filter at half power (Stage 3 CKD). When fluid drains out, his blood pressure crashes. With no blood reaching his kidneys, they completely freeze up (**Pre-Renal Acute Kidney Injury at 73.7% probability**).\n")
    lines.append("- **The Silent Poison in His Medicine Box:** Ramesh takes **Metformin** for diabetes. If a patient keeps taking Metformin while severely dehydrated, the drug cannot clear the kidneys. It builds up in the blood and triggers **Lactic Acidosis**, a toxic state where the blood turns acidic, carrying a **50% death rate**. The golden medical rule: *Stop Metformin immediately whenever severe diarrhea or vomiting strikes!*\n\n")

    lines.append("---\n")
    lines.append("## 4. 🛡️ The 5 Golden Everyday Rules of Thumb for Caregivers & Families\n")
    lines.append("1. **Never Give Common Painkillers (Brufen, Combiflam, Voveran, Diclofenac) to Kidney Patients or Ulcer Sufferers:** They block blood flow to the kidneys and dissolve the stomach lining. Use plain Paracetamol instead.\n")
    lines.append("2. **The Metformin 'Sick Day' Rule:** If someone with diabetes experiences severe vomiting, loose motions, or high fever with shivering, pause Metformin and consult a physician immediately.\n")
    lines.append("3. **Pregnancy is a Drug Shield:** In a pregnant mother (like Meera #4), almost all routine pills (blood pressure medicines, cholesterol statins, strong antibiotics) cross the placenta and can harm the baby. Only take medications explicitly cleared by an obstetrician.\n")
    lines.append("4. **Silent Heart Attacks in Diabetics:** Long-term diabetes damages pain nerves. Elderly diabetics often do not feel sharp chest agony; instead, their heart attack shows up as sudden unexplained cold sweats, breathlessness, or unusual extreme fatigue.\n")
    lines.append("5. **Delirium is the Grandparent's Fever Sign:** In very frail elderly people (like Harbans Lal #13), a chest or urinary infection won't always cause a classic cough. Instead, they suddenly become confused, stop recognizing relatives, or refuse food. Sudden confusion is a medical emergency.\n")

    output_file.write_text("\n".join(lines), encoding="utf-8")
    console.print(f"[bold green]✓ Full Clinical Dossier with Plain English Guide successfully exported to: {output_file}[/bold green]")


# ─────────────────────────────────────────────────────────────────────────────
# 7. INTERACTIVE TERMINAL LOOP & NAVIGATION
# ─────────────────────────────────────────────────────────────────────────────

def render_layman_terminal_guide():
    console.print("\n")
    console.rule("[bold cyan]🗣️ PLAIN ENGLISH & LAYMAN GUIDE: WHAT SICKNESS DOES TO DIFFERENT BODIES[/bold cyan]")
    
    p1 = Panel(
        "[bold yellow]The Mountain Highway Analogy:[/bold yellow]\n"
        "Two vehicles get a flat tire on a mountain road:\n"
        "• [bold green]Vehicle A:[/bold green] Brand-new 4x4 SUV, young alert driver, good brakes ➔ A 20-minute nuisance.\n"
        "• [bold red]Vehicle B:[/bold red] Heavy 18-wheeler truck, worn brakes, exhausted driver who hasn't slept in 16 hours ➔ Catastrophic crash!\n\n"
        "[italic white]In medicine, your body is the vehicle. Your age, chronic diseases, smoking, and medicines are the condition of your brakes and engine.[/italic white]",
        title="🚗 Why Disease Hits People Differently",
        box=box.ROUNDED,
        border_style="cyan"
    )
    console.print(p1)

    stories = [
        ("💔 1. Crushing Chest Pain", 
         "[bold white]Athlete (#5 Vik, 19y):[/bold white] Clean arteries. It's almost certainly [bold green]Costochondritis[/bold green] (inflamed rib cartilage from bench-pressing). Heart attack risk: <5%.\n"
         "[bold white]Diabetic Grandpa (#1 Ramesh, 68y):[/bold white] 15 years of sugar damage + high BP. 65.9% probability of a [bold red]Real Heart Attack[/bold red] (5.7x multiplier). Needs an ambulance immediately!"),

        ("🫁 2. High Fever & Green Phlegm",
         "[bold white]Teen Swimmer (#12 Zoya, 16y):[/bold white] Strong lungs. Immune system rallies white blood cells. Recovers with fluids.\n"
         "[bold white]Mill Foreman (#11 Anand, 54y):[/bold white] 30 years of cotton lint & bidi smoke scarred his lungs. Infection spreads like wildfire.\n"
         "[bold white]Geriatric Grandpa (#13 Harbans, 81y):[/bold white] Weak heart & failing kidneys. High fever crashes BP, causing [bold red]Sepsis & Delirium[/bold red]."),

        ("🦶 3. Screaming Agony in Big Toe (Gout)",
         "[bold white]Real Estate Broker (#15 Manish, 47y):[/bold white] Heavy scotch & mutton feasts spike uric acid to 9.8 mg/dL. Risk is [bold yellow]11x higher[/bold yellow]! Microscopic needle crystals pierce his joint.\n"
         "[bold red]⚠️ The Poison Trap:[/bold red] If Manish takes Brufen, he recovers. If [bold white]Ramesh (#1)[/bold white] takes Brufen, his weak kidneys can shut down completely!"),

        ("🩸 4. Coffee-Ground Vomit & Black Stools",
         "[bold white]Truck Driver (#3 Gurpreet, 42y):[/bold white] Takes 600mg Brufen daily for highway backaches. The pills burned away stomach mucus, causing a bleeding ulcer.\n"
         "[bold white]Heart Stent Patient (#9 Dr. Farooq, 58y):[/bold white] Takes blood thinners. Ulcers won't clot—can bleed out internally in hours!"),

        ("💧 5. Severe Loose Motions (Dehydration)",
         "[bold white]Vegan Farmer (#10 Priyanka, 36y):[/bold white] Rehydrates with ORS & coconut water. Fine in 48 hours.\n"
         "[bold white]Diabetic Clerk (#1 Ramesh, 68y):[/bold white] Kidneys freeze up without fluid (73.7% AKI risk).\n"
         "[bold red]🚨 The Silent Poison:[/bold red] If he takes daily [bold]Metformin[/bold] while dehydrated, it triggers [bold red]Lactic Acidosis (50% mortality)[/bold red]! Always pause Metformin during severe diarrhea.")
    ]

    for title, content in stories:
        console.print(Panel(content, title=title, box=box.ROUNDED, border_style="yellow"))

    rules_text = (
        "1. [bold red]Never give Brufen/Combiflam/Voveran[/bold red] to kidney disease or ulcer patients. Use Paracetamol.\n"
        "2. [bold red]The Metformin Rule:[/bold red] If a diabetic gets severe vomiting or diarrhea, stop Metformin immediately and call a doctor.\n"
        "3. [bold red]Diabetic Heart Attacks are Often Silent:[/bold red] Diabetics may feel cold sweats and sudden breathlessness instead of chest pain.\n"
        "4. [bold red]Pregnancy Drug Shield:[/bold red] Almost all standard BP/cholesterol pills harm the baby. Only take obstetrician-approved meds.\n"
        "5. [bold red]Sudden Confusion in Grandparents:[/bold red] Infections in frail seniors don't show as fever—they show up as sudden confusion or not recognizing family."
    )
    console.print(Panel(rules_text, title="🛡️ 5 Golden Everyday Medical Rules for Families", box=box.DOUBLE, border_style="green"))


def interactive_loop():
    while True:
        TerminalRenderer.print_banner()
        console.print("[bold yellow]MAIN CLINICAL MENU:[/bold yellow]")
        console.print("[1] 📋 Browse & Inspect All 18 Personas (Demographics, Conditions, Frailty, Meds)")
        console.print("[2] 🔬 Single Persona Disease / Symptom Impact Analysis (Run deep simulation)")
        console.print("[3] ⚡ Cross-Persona Disease Stress-Test ('The Matrix' — Compare multiple personas)")
        console.print("[4] ⚔️ Head-to-Head Comparison (Compare 2 Personas facing the same disease)")
        console.print("[5] ➕ Create & Test Custom Persona on the fly")
        console.print("[6] 💾 Export Complete Clinical Stress-Test Report to Markdown")
        console.print("[7] 🗣️ Plain English & Layman Guide (What this means in simple everyday life)")
        console.print("[8] 🚪 Exit")

        choice = Prompt.ask("\nSelect an action", choices=["1", "2", "3", "4", "5", "6", "7", "8"], default="1")

        if choice == "1":
            # Browse & Inspect
            TerminalRenderer.render_persona_summary_table(PERSONAS)
            p_id = Prompt.ask("\nEnter Persona ID to view full dossier (or press Enter to return to menu)", default="")
            if p_id.isdigit():
                found = next((p for p in PERSONAS if p.id == int(p_id)), None)
                if found:
                    TerminalRenderer.render_persona_dossier(found)
                else:
                    console.print("[red]Invalid Persona ID.[/red]")
            Prompt.ask("\nPress Enter to continue...")

        elif choice == "2":
            # Single Persona Simulation
            TerminalRenderer.render_persona_summary_table(PERSONAS)
            p_id = IntPrompt.ask("\nSelect Patient ID (1-18)", default=1)
            persona = next((p for p in PERSONAS if p.id == p_id), PERSONAS[0])

            console.print("\n[bold cyan]Select Symptom / Disease Presentation Scenario:[/bold cyan]")
            for sc in SYMPTOM_SCENARIOS:
                console.print(f"  [{sc.id}] {sc.title} [dim]({sc.category})[/dim]")
            console.print("  [99] ✍️ Type Custom Freeform Symptoms")

            sc_choice = IntPrompt.ask("Choose Scenario ID", default=1)
            if sc_choice == 99:
                custom_complaint = Prompt.ask("Enter custom symptoms")
                custom_dur = Prompt.ask("Enter duration (e.g. 2 days, 4 hours)", default="1 day")
                scenario = SymptomScenario(
                    id=99,
                    title=f"Custom: {custom_complaint[:30]}",
                    category="Custom Clinical Input",
                    chief_complaint=custom_complaint,
                    duration=custom_dur,
                    description=custom_complaint,
                    cardinal_symptoms=[s.strip() for s in custom_complaint.split(",")],
                    vital_signs_impact={"Temp": "Variable", "HR": "+10 bpm"},
                    base_differentials=[
                        {"disease": "Acute Symptomatic Presentation", "base_prior": 0.50, "urgency": "MODERATE"},
                        {"disease": "Atypical Systemic Manifestation", "base_prior": 0.30, "urgency": "ROUTINE"},
                        {"disease": "Underlying Disease Decompensation", "base_prior": 0.20, "urgency": "URGENT"}
                    ],
                    base_organ_burden={"cardio": 40, "renal": 40, "resp": 40, "gi": 40, "neuro": 40}
                )
            else:
                scenario = next((s for s in SYMPTOM_SCENARIOS if s.id == sc_choice), SYMPTOM_SCENARIOS[0])

            res = ClinicalImpactEngine.simulate(persona, scenario)
            TerminalRenderer.render_simulation_report(res)
            Prompt.ask("\nPress Enter to continue...")

        elif choice == "3":
            # Cross-Persona Matrix
            console.print("\n[bold cyan]Select Disease / Symptom Scenario for Matrix Stress-Test:[/bold cyan]")
            for sc in SYMPTOM_SCENARIOS:
                console.print(f"  [{sc.id}] {sc.title} [dim]({sc.category})[/dim]")

            sc_id = IntPrompt.ask("Choose Scenario ID", default=1)
            scenario = next((s for s in SYMPTOM_SCENARIOS if s.id == sc_id), SYMPTOM_SCENARIOS[0])

            subset_choice = Prompt.ask("Compare all 18 personas or select a subset? (all / subset)", default="all")
            if subset_choice.lower() == "subset":
                ids_str = Prompt.ask("Enter Persona IDs separated by commas (e.g. 1, 3, 5, 13, 15)", default="1, 3, 5, 13")
                try:
                    selected_ids = [int(x.strip()) for x in ids_str.split(",") if x.strip()]
                    active_personas = [p for p in PERSONAS if p.id in selected_ids]
                except ValueError:
                    active_personas = PERSONAS[:6]
            else:
                active_personas = PERSONAS

            results = [ClinicalImpactEngine.simulate(p, scenario) for p in active_personas]
            TerminalRenderer.render_cross_persona_matrix(scenario, results)
            Prompt.ask("\nPress Enter to continue...")

        elif choice == "4":
            # Head-to-Head
            TerminalRenderer.render_persona_summary_table(PERSONAS)
            p1_id = IntPrompt.ask("Select Persona A ID", default=5)  # Vik Rathore (Young Athlete)
            p2_id = IntPrompt.ask("Select Persona B ID", default=1)  # Ramesh Sharma (Geriatric Diabetic)

            p1 = next((p for p in PERSONAS if p.id == p1_id), PERSONAS[4])
            p2 = next((p for p in PERSONAS if p.id == p2_id), PERSONAS[0])

            console.print("\n[bold cyan]Select Symptom / Disease Scenario for Comparison:[/bold cyan]")
            for sc in SYMPTOM_SCENARIOS:
                console.print(f"  [{sc.id}] {sc.title}")
            sc_id = IntPrompt.ask("Choose Scenario ID", default=1)
            scenario = next((s for s in SYMPTOM_SCENARIOS if s.id == sc_id), SYMPTOM_SCENARIOS[0])

            res1 = ClinicalImpactEngine.simulate(p1, scenario)
            res2 = ClinicalImpactEngine.simulate(p2, scenario)
            TerminalRenderer.render_head_to_head(res1, res2)
            Prompt.ask("\nPress Enter to continue...")

        elif choice == "5":
            # Custom Persona
            console.rule("[bold cyan]CREATE CUSTOM CLINICAL PERSONA[/bold cyan]")
            name = Prompt.ask("Patient Name", default="Ravi Patel")
            age = IntPrompt.ask("Age", default=50)
            sex = Prompt.ask("Sex (male/female)", choices=["male", "female"], default="male")
            occ = Prompt.ask("Occupation", default="Accountant")
            ht = float(Prompt.ask("Height in cm", default="170"))
            wt = float(Prompt.ask("Weight in kg", default="75"))
            bp = Prompt.ask("Resting Blood Pressure", default="130/85")
            conds_raw = Prompt.ask("Diagnosed Conditions (comma-separated)", default="Type 2 Diabetes, Mild Fatty Liver")
            meds_raw = Prompt.ask("Medications (comma-separated)", default="Metformin 500mg, Vitamin D")
            allergies_raw = Prompt.ask("Allergies (comma-separated)", default="None")
            frailty = IntPrompt.ask("Baseline Clinical Frailty Score (0-10)", default=3)

            custom_p = ClinicalPersona(
                id=len(PERSONAS) + 1,
                name=name,
                age=age,
                sex=sex,
                occupation=occ,
                location="Custom Input",
                height_cm=ht,
                weight_kg=wt,
                resting_bp=bp,
                resting_hr=75,
                diet_profile="Standard mixed diet",
                lifestyle={"exercise": "Moderate", "sleep_hours": 7.0, "smoking": "No", "alcohol": "Social"},
                conditions=[c.strip() for c in conds_raw.split(",") if c.strip()],
                medications=[m.strip() for m in meds_raw.split(",") if m.strip()],
                allergies=[a.strip() for a in allergies_raw.split(",") if a.strip()],
                family_history=["Not documented"],
                frailty_index=frailty,
                polypharmacy_risk="moderate" if len(meds_raw.split(",")) >= 3 else "low",
                key_quote="\"Custom patient generated for clinical testing.\""
            )

            PERSONAS.append(custom_p)
            console.print(f"[bold green]✓ Custom Persona #{custom_p.id} ({custom_p.name}) added to active roster![/bold green]")
            TerminalRenderer.render_persona_dossier(custom_p)
            Prompt.ask("\nPress Enter to continue...")

        elif choice == "6":
            # Export
            out_path = Path("output/persona_clinical_stress_test.md")
            export_stress_test_markdown(out_path)
            Prompt.ask("\nPress Enter to continue...")

        elif choice == "7":
            render_layman_terminal_guide()
            Prompt.ask("\nPress Enter to return to main menu...")

        elif choice == "8":
            console.print("[bold cyan]Exiting Arovia Health Persona Terminal. Stay healthy![/bold cyan]")
            break


# ─────────────────────────────────────────────────────────────────────────────
# 8. CLI ARGUMENT PARSER (NON-INTERACTIVE EXECUTION)
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Arovia / Healio.AI Health Persona Terminal Simulator")
    parser.add_argument("--list", action="store_true", help="List all 18 clinical personas")
    parser.add_argument("--inspect", type=int, metavar="ID", help="Inspect a specific persona dossier by ID")
    parser.add_argument("--simulate", action="store_true", help="Run simulation for specified persona and symptom")
    parser.add_argument("--persona", type=int, default=1, help="Persona ID (1-18)")
    parser.add_argument("--symptom", type=int, default=1, help="Symptom Scenario ID (1-12)")
    parser.add_argument("--matrix", action="store_true", help="Run cross-persona comparison matrix for a symptom")
    parser.add_argument("--compare", action="store_true", help="Run head-to-head comparison between two personas")
    parser.add_argument("--p1", type=int, default=5, help="Persona 1 ID for head-to-head")
    parser.add_argument("--p2", type=int, default=1, help="Persona 2 ID for head-to-head")
    parser.add_argument("--export", action="store_true", help="Export full markdown report to output/persona_clinical_stress_test.md")

    args = parser.parse_args()

    # If no flags passed, launch interactive menu
    if len(sys.argv) == 1:
        interactive_loop()
        return

    TerminalRenderer.print_banner()

    if args.list:
        TerminalRenderer.render_persona_summary_table(PERSONAS)

    elif args.inspect:
        p = next((p for p in PERSONAS if p.id == args.inspect), None)
        if p:
            TerminalRenderer.render_persona_dossier(p)
        else:
            console.print(f"[red]Error: Persona ID {args.inspect} not found.[/red]")

    elif args.simulate:
        p = next((p for p in PERSONAS if p.id == args.persona), PERSONAS[0])
        s = next((s for s in SYMPTOM_SCENARIOS if s.id == args.symptom), SYMPTOM_SCENARIOS[0])
        res = ClinicalImpactEngine.simulate(p, s)
        TerminalRenderer.render_simulation_report(res)

    elif args.matrix:
        s = next((s for s in SYMPTOM_SCENARIOS if s.id == args.symptom), SYMPTOM_SCENARIOS[0])
        results = [ClinicalImpactEngine.simulate(p, s) for p in PERSONAS]
        TerminalRenderer.render_cross_persona_matrix(s, results)

    elif args.compare:
        p1 = next((p for p in PERSONAS if p.id == args.p1), PERSONAS[4])
        p2 = next((p for p in PERSONAS if p.id == args.p2), PERSONAS[0])
        s = next((s for s in SYMPTOM_SCENARIOS if s.id == args.symptom), SYMPTOM_SCENARIOS[0])
        res1 = ClinicalImpactEngine.simulate(p1, s)
        res2 = ClinicalImpactEngine.simulate(p2, s)
        TerminalRenderer.render_head_to_head(res1, res2)

    elif args.export:
        out_path = Path("output/persona_clinical_stress_test.md")
        export_stress_test_markdown(out_path)


if __name__ == "__main__":
    main()
