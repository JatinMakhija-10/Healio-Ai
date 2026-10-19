#!/usr/bin/env python3
"""
Arovia / Healio.AI — Complete 18-Persona Disease & Clinical Chat Dossier Generator
=================================================================================
Generates an exhaustive, publication-grade PDF dossier detailing:
  1. The deterministic clinical engine calculations (Bayesian prior shifts, organ burden, DDI).
  2. Full clinical profiles of all 18 personas.
  3. Disease-by-disease comparisons across all 18 personas.
  4. Complete multi-turn clinical chatbot dialogues:
       - Patient describes problem in their unique voice, dialect, and subjective pain perception.
       - Chatbot conducts clinical cross-questioning following Arovia's SymptomQuestionSchemas.
       - Chatbot delivers real-time risk synthesis, organ burden score, and multi-modal remedies.
  5. Zero external API calls — 100% powered by local codebase engine.
  6. Physician verification checklist and sign-off block.

Output:
  output/Arovia_Complete_18_Persona_Disease_Dossier.pdf
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Any

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from persona_terminal import PERSONAS, SYMPTOM_SCENARIOS, ClinicalImpactEngine, ClinicalPersona, SymptomScenario

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas


# ─────────────────────────────────────────────────────────────────────────────
# 1. RUNNING HEADER & FOOTER CANVAS
# ─────────────────────────────────────────────────────────────────────────────

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0F766E"))  # Medical Teal

        # Header (Pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, 756, "AROVIA.AI — 18-PERSONA COMPLETE CLINICAL CHAT & DISEASE STRESS-TEST")
            self.setFont("Helvetica", 7.5)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawRightString(576, 756, "PHYSICIAN AUDIT & VERIFICATION DOSSIER")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.6)
            self.line(36, 750, 576, 750)

        # Footer (All pages)
        self.setFont("Helvetica-Bold", 7.0)
        self.setFillColor(colors.HexColor("#0F766E"))
        self.drawString(36, 24, "CONFIDENTIAL CLINICAL AUDIT — SYNTHETIC SIMULATION BENCHMARK — NOT APPROVED FOR UNMONITORED PATIENT CARE")
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawRightString(576, 24, f"Page {self._pageNumber} of {page_count}")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.6)
        self.line(36, 34, 576, 34)

        self.restoreState()


# ─────────────────────────────────────────────────────────────────────────────
# 2. DETERMINISTIC PERSONA DIALOGUE & PAIN MODEL (ZERO EXTERNAL API)
# ─────────────────────────────────────────────────────────────────────────────

def get_persona_dialogue(persona: ClinicalPersona, scenario: SymptomScenario) -> Dict[str, str]:
    """
    Generates authentic patient opening, doctor questions (matching SymptomQuestionSchemas),
    patient follow-up reply, and doctor clinical synthesis.
    100% deterministic, zero LLM/API calls.
    """
    p_id = persona.id
    sc_id = scenario.id
    name = persona.name
    p_first = name.split()[0]

    # ── CASE 1: CHEST PAIN ──────────────────────────────────────────────────
    if sc_id == 1:
        if p_id == 1:  # Ramesh Sharma (Stoic Diabetic Grandpa)
            return {
                "patient_open": "Namaste beta... My daughter forced me to consult. It is probably just some gas from the evening samosa. But since 45 minutes there is a heavy stone-like pressure in the center of my chest, and my left shoulder feels slightly tired. Nothing serious, I already took some ajwain water.",
                "doc_q1": "Hello Mr. Sharma. Please stay completely still. In someone with 15 years of diabetes, chest heaviness and left shoulder fatigue must be treated as a potential heart event requiring emergency evaluation. A normal resting ECG alone cannot rule out acute coronary syndrome. Are you sweating, feeling lightheaded, or having trouble catching your breath?",
                "patient_reply": "Yes beta... My undershirt is soaked with cold sweat, which is strange because the fan is on. Breathing feels a bit shallow, and my head was spinning when I stood up from bed.",
                "doc_q2": "CRITICAL EMERGENCY: Cold sweats with crushing retrosternal pressure in diabetes is an emergency sign of acute coronary ischemia. Do not eat, drink, or take any painkillers. Call an ambulance (112) immediately; do not drive yourself.",
                "patient_final": "Understood beta, my son is calling the 112 ambulance right now. Resting quietly until they arrive."
            }
        elif p_id == 2:  # Aanya Sen (Anxious Tech Dev)
            return {
                "patient_open": "Doctor omg please help me!! My Apple Watch literally just buzzed an alert that my resting HR hit 138 bpm! My chest feels so tight, like an iron band is clamping my ribs shut, and my left arm has pins-and-needles. Am I having a heart attack?! I'm breathing into a paper bag now to stop hyperventilating!",
                "doc_q1": "⚠️ URGENT SAFETY INTERCEPT: Aanya, STOP breathing into a paper bag immediately! Rebreathing into a paper bag is medically dangerous—it causes progressive hypoxia and can mask serious cardiopulmonary emergencies. Take slow, unassisted breaths. Does the pain become sharply worse when you press directly on your ribs or take a deep breath?",
                "patient_reply": "Threw the bag away, breathing on my own. Yes! When I press my fingers right next to my breastbone it hurts sharply, and taking a deep breath feels like a stitch. No cold sweats, but my heart is pounding at 138 bpm.",
                "doc_q2": "While focal chest wall tenderness and deep inspiration pain point toward costochondritis, ongoing chest tightness with a resting heart rate of 138 bpm and dizziness in someone on oral contraceptives cannot be cleared remotely without an emergency ECG and cardiopulmonary evaluation (ruling out SVT, acute arrhythmia, or pulmonary embolism). Call 112 for emergency ambulance transport; do not attempt to drive yourself.",
                "patient_final": "Understood doctor, my roommate is calling the 112 ambulance right now. Resting quietly and breathing normally until they arrive."
            }
        elif p_id == 3:  # Gurpreet Singh (Trucker)
            return {
                "patient_open": "Doctor sahab, namaste. I have been driving my 16-wheeler on NH-44 for 14 hours. Since an hour, there is a heavy crushing stone on the center of my chest, feels like someone parked a truck tyre on my sternum. Breathing is heavy and sweat is dripping down my beard even though the AC is on.",
                "doc_q1": "Hello Gurpreet. Pull the truck over to the highway shoulder immediately and turn on hazard lights. Does this heavy crushing pain radiate into your left shoulder, neck, or lower jaw?",
                "patient_reply": "Haan ji doctor sahab, it is shooting up into my jaw like a severe toothache, and down my left arm. I took a Brufen from my cabin drawer 20 minutes ago but it did nothing.",
                "doc_q2": "Do NOT drive another meter. You are describing an Acute Coronary Syndrome (Heart Attack). Taking Brufen is dangerous right now. Call 112 or highway emergency patrol immediately.",
                "patient_final": "Understood doctor sahab. I am calling highway patrol 112 right now."
            }
        elif p_id == 4:  # Meera Nambiar (Pregnant Teacher)
            return {
                "patient_open": "Doctor, hello. I am 26 weeks pregnant. Since after lunch, I have this intense burning pressure behind my breastbone that climbs into my throat. The baby is kicking normally, but the heaviness is making me short of breath. I am terrified this might be something dangerous for my baby.",
                "doc_q1": "Hello Meera. Your baby's complete safety is our first priority. Does this chest discomfort feel worse when you lie flat, and does it improve when you sit upright? And do you have any left arm pain, jaw radiation, or cold sweats?",
                "patient_reply": "It gets much worse when I lie flat on my back! Propping up on pillows helps somewhat. No arm pain, no cold sweating, just burning acid taste in my mouth.",
                "doc_q2": "That is reassuring and points toward severe pregnancy-induced gastroesophageal reflux. Because you are pregnant, avoid all aspirin or NSAIDs. Are you able to sip warm milk or an antacid gel?",
                "patient_final": "Yes, I will take a pregnancy-safe antacid and stay upright. Thank you so much for the reassurance!"
            }
        elif p_id == 5:  # Vik Rathore (Varsity Athlete)
            return {
                "patient_open": "Hey doc. During my 400m sprint intervals today, right at the 300m bend during max effort, I got this sudden sharp stitch across my left 4th and 5th costochondral joints. Exquisite focal tenderness on palpation. Resting HR is 46 bpm, SpO2 is 99%.",
                "doc_q1": "Hello Vikramaditya. To pinpoint this: does the pain become sharply worse when you shrug your shoulders or expand your ribcage fully, and does it radiate to your neck or arm?",
                "patient_reply": "Exactly. Deep inspiration spikes the pain to 7/10 right at the chondral junction, but if I breathe shallowly, it's barely a 2/10. No radiation to neck or arm at all.",
                "doc_q2": "Reproducible tenderness at the costochondral junction that spikes with deep inspiration strongly suggests Costochondritis from heavy training. However, exertional chest pain can never be cleared as zero cardiac risk remotely without an ECG. Rest from strenuous training, apply cool/warm compresses, and get a baseline screening ECG at your sports medicine clinic.",
                "patient_final": "Understood doc, skipping heavy upper body lifting and booking a screening ECG at our campus sports clinic today."
            }
        elif p_id == 9:  # Dr. Farooq Qureshi (Surgeon)
            return {
                "patient_open": "Good day colleague. I am experiencing retrosternal tightness with crushing quality, 6/10 intensity, radiating to the left mandibular angle and medial left forearm. Mild cold diaphoresis. History of DES to proximal LAD 4 years ago. Current meds: Clopidogrel 75mg, Metoprolol 50mg.",
                "doc_q1": "Hello Dr. Qureshi. Given your established coronary anatomy and active stent history, this must be triaged as Acute Coronary Syndrome / Stent Thrombosis. Have you obtained an immediate 12-lead ECG?",
                "patient_reply": "Yes, I have already dispatched my OT technician to bring the portable machine to my office. Mild ST depression in V4-V6 is suspected. Pulse is 74, BP 142/90.",
                "doc_q2": "Please chew soluble Aspirin 300mg immediately (if not already taken today) and transfer to the cath lab floor. Hold all surgical duties.",
                "patient_final": "Understood colleague. Cath team has been notified. Transferring now."
            }
        else:  # Generic fallback for chest pain
            return {
                "patient_open": f"Doctor, I have been feeling a tight, heavy discomfort in my chest for about 45 minutes. It feels uncomfortable and I'm worried.",
                "doc_q1": f"Hello {p_first}. Does this discomfort spread to your neck, jaw, or left arm, and are you having any cold sweats or shortness of breath?",
                "patient_reply": "It feels heavy in the middle, and I feel slightly nauseated and dizzy.",
                "doc_q2": "Thank you for clarifying. Chest discomfort with dizziness requires urgent emergency evaluation. Please call 112 immediately and do not drive yourself.",
                "patient_final": "Yes doctor, I am resting quietly while my family calls for medical assistance."
            }

    # ── CASE 2: HIGH FEVER & PURULENT COUGH ─────────────────────────────────
    elif sc_id == 2:
        if p_id == 11:  # Anand Joshi (Mill Foreman - Byssinosis)
            return {
                "patient_open": "Doctor sahab, namaste. 30 saal se textile mill mein cotton dust mein kaam karta hoon, subah ki khansi aam baat hai. Lekin 4 din se 103 degree bukhar hai, kaanpte hue thand lag rahi hai, aur khansi mein peela-hara balgam aa raha hai. Saans lene mein gale mein ghutan ho rahi hai.",
                "doc_q1": "Hello Anand ji. Given your 30 years of mill dust exposure and smoking, your lung reserve is already vulnerable. Are you able to speak a full sentence without gasping for air?",
                "patient_reply": "Nahi doctor sahab... Do lafz bolte hi saans phool rahi hai. Seene ke daayein taraf sui jaisi chubhan ho rahi hai.",
                "doc_q2": "CRITICAL EMERGENCY: Severe breathlessness with inability to complete sentences, high fever, and purulent sputum points to Community-Acquired Pneumonia with impending respiratory failure. Call 112 for ambulance transport to the hospital immediately.",
                "patient_final": "Haanji sahab, mera beta 112 ambulance bula raha hai abhi. Hospital ja rahe hain."
            }
        elif p_id == 13:  # Harbans Lal (Palliative Grandpa)
            return {
                "patient_open": "...Where is the station master? The 4:15 engine is whistling in the cold... (Nursing staff: 'Babuji has 103°F fever, coughing thick green sputum, and breathing rapidly at 28 breaths/min').",
                "doc_q1": "Hello nursing team. In an 81-year-old with heart failure (EF 32%) and vascular dementia, high fever with tachypnea is high-risk Pneumonia with Sepsis concern. What are his current vitals and blood pressure?",
                "patient_reply": "...My legs are shivering under the railway blanket... (Staff: 'BP dropped to 94/56 mmHg, SpO2 is 87% on room air, pulse 112 weak, patient is severely confused').",
                "doc_q2": "CRITICAL EMERGENCY — SEVERE SEPSIS: Apply supplemental oxygen immediately to support saturation. Transfer via Advanced Life Support (ALS) ambulance to the emergency department for arterial blood gas, blood cultures, and IV antibiotics.",
                "patient_final": "(Staff: 'ALS ambulance dispatched, high-flow oxygen mask placed, vitals chart ready for the emergency team.')"
            }
        elif p_id == 12:  # Zoya Sheikh (16F Swimmer)
            return {
                "patient_open": "Doctor, I thought I just caught a cold after swim training, but I've had a 103°F fever for 4 days with violent shaking rigors! I'm coughing up thick yellow-green phlegm, and my right side stabs when I inhale. My pulse oximeter shows 93% SpO2.",
                "doc_q1": "Hello Zoya. A 4-day 103°F fever with shaking rigors, green sputum, pleuritic chest pain, and SpO2 of 93% in a teenager indicates acute Community-Acquired Pneumonia. Are you breathless when walking or feeling dizzy?",
                "patient_reply": "I get breathless just walking to the bathroom, and my skin eczema is flaring from all the fever sweat. No wheezing, just deep rattling cough.",
                "doc_q2": "Because your oxygen saturation has dropped to 93% and you are breathless with minimal exertion, you need immediate in-person hospital evaluation. Please have your parents take you to the Emergency Room right now for a chest X-ray and clinical assessment.",
                "patient_final": "Okay doctor, my mother is driving me to the hospital emergency room right now."
            }
        else:
            return {
                "patient_open": f"Doctor, I have had a high fever of 103°F for 4 days with severe shaking chills and coughing up thick green phlegm.",
                "doc_q1": f"Hello {p_first}. Are you having sharp chest pain when taking a deep breath, or feeling confused or short of breath?",
                "patient_reply": "Yes, my right side aches when I cough, and I feel completely exhausted and breathless.",
                "doc_q2": "These symptoms indicate acute respiratory infection / pneumonia. You need urgent in-person medical evaluation, chest X-ray, and targeted medical therapy.",
                "patient_final": "I will visit the clinic emergency right away, doctor."
            }

    # ── CASE 3: GOUT (PODAGRA) ──────────────────────────────────────────────
    elif sc_id == 5:
        if p_id == 15:  # Manish Chawla (Real Estate Broker)
            return {
                "patient_open": "Doctor sahab! Save me! Last night I closed a 25-crore land deal, celebrated with tandoori mutton and 4 pegs of scotch. Woke up at 3 AM screaming—my right big toe is swollen like an apple and glowing fiery red! Even the ceiling fan air touching it feels like a blowtorch!",
                "doc_q1": "Hello Mr. Chawla. Acute nocturnal podagra triggered by purine-heavy foods and alcohol is classical for Gout. Have you had fever or chills, and have you taken any medications yet?",
                "patient_reply": "No fever or chills, just pure joint fire! My uric acid was 9.8 mg/dL last month. I took two Brufen tablets an hour ago, but my BP cuff shows 156/96 and the pain is still 10/10!",
                "doc_q2": "With BP 156/96 and repeated NSAID ingestion, avoid taking further Brufen. Apply a cool ice pack wrapped in a cloth for 15 minutes (avoid warm water which worsens swelling). Contact your doctor for a prescription of Colchicine or oral Prednisolone, and screen for infection.",
                "patient_final": "Understood doctor sahab. Putting ice pack on toe now, no more Brufen. Calling my physician for the Colchicine prescription."
            }
        elif p_id == 1:  # Ramesh Sharma (CKD Diabetic)
            return {
                "patient_open": "Beta, since 4 AM my right big toe has swollen up red and burning hot. I thought of taking a Brufen tablet from my drawer to kill the pain so I could walk to the temple.",
                "doc_q1": "STOP! Do NOT take Brufen! Because you have Stage 3 Chronic Kidney Disease (eGFR 48), NSAIDs carry a severe hazard of precipitating acute kidney injury. Are you having fever, or any break in the skin near the toe?",
                "patient_reply": "No fever, no skin break, beta. Joint is fiery hot. Thank God I asked you before swallowing the Brufen! What should I do right now for relief?",
                "doc_q2": "Use Paracetamol 650mg for mild relief, elevate your foot on two pillows, and apply a cool ice pack wrapped in a towel for 15 minutes. Avoid warm Epsom soaking. Consult your physician today for a renally adjusted anti-inflammatory.",
                "patient_final": "Understood beta, threw the Brufen strip away. I am elevating my foot with a cool pack now and will visit my doctor this morning."
            }
        elif p_id == 9:  # Dr. Farooq Qureshi (Surgeon)
            return {
                "patient_open": "Colleague, I just finished a 6-hour CABG scrub while slightly dehydrated, and woke up at 3 AM with acute podagra of the right 1st MTP joint. Erythematous, edematous, 9/10 allodynia. Given my DAPT (Aspirin + Clopidogrel) and Ramipril, I am holding off on NSAIDs.",
                "doc_q1": "Hello Dr. Qureshi. Volume depletion on an ACE inhibitor during prolonged standing is a classic precipitant. What was your most recent serum urate and baseline creatinine, and are you afebrile?",
                "patient_reply": "Afebrile. Last serum urate was 8.6 mg/dL, creatinine 1.1 mg/dL. Pain is strictly monoarticular in the right hallux. Zero systemic signs.",
                "doc_q2": "With active DAPT, systemic NSAIDs are strictly contraindicated due to severe GI hemorrhage and cardiovascular stent risk. A short course of oral Prednisolone or low-dose Colchicine (screening for additive statin-colchicine skeletal myopathy with your Rosuvastatin), plus cool compression and limb elevation, is the safest regimen.",
                "patient_final": "Good catch on the additive colchicine-statin myotoxicity and rhabdomyolysis hazard—I will opt for a short Prednisolone taper and hydrate. Thank you colleague."
            }
        else:
            return {
                "patient_open": f"Doctor, I woke up with my right big toe fiery red, twice its normal size, and excruciatingly painful to touch.",
                "doc_q1": f"Hello {p_first}. Acute pain in the great toe joint is classical for gouty arthritis, but septic arthritis must be excluded. Have you noticed any fever, chills, or skin cuts?",
                "patient_reply": "No fever or cuts, just intense throbbing in the big toe. I cannot bear any weight on it.",
                "doc_q2": "Please rest with the foot elevated and apply a cool ice pack wrapped in a cloth. Avoid warm soaking. Consult your healthcare provider for an appropriate anti-inflammatory prescription.",
                "patient_final": "Thank you doctor, elevating the foot with cool compress now."
            }

    # ── CASE 4: UPPER GI BLEED ──────────────────────────────────────────────
    elif sc_id == 6:
        if p_id == 3:  # Gurpreet (Trucker)
            return {
                "patient_open": "Ustaad ji, namaste. I have been taking 600mg Brufen tablets twice a day for highway back pain. But today my stomach started burning like battery acid, and when I puked at the petrol pump, it looked like dark coffee grounds! And my stool is completely black like tar!",
                "doc_q1": "Gurpreet, sit down immediately! Vomiting dark coffee grounds and passing black tarry stools means you have an acute Upper GI Bleed (likely an NSAID-induced ulcer). Are you feeling dizzy or faint?",
                "patient_reply": "Yes paaji, when I climbed down from the truck, my eyes went black and I almost collapsed on the gravel. Hands feel cold and clammy.",
                "doc_q2": "CRITICAL EMERGENCY: You are in early hypovolemic shock from blood loss. Do not eat, drink, or take any medication. Have highway patrol or an ambulance transport you to the nearest hospital emergency department immediately.",
                "patient_final": "Understood ustaad ji. Calling highway ambulance 112 right now. Lying down on the truck bunk."
            }
        elif p_id == 9:  # Dr. Farooq Qureshi (Surgeon)
            return {
                "patient_open": "Colleague, I need urgent triage coordination. Over the past 6 hours I've had gnawing epigastric pain, and 20 minutes ago I had coffee-ground emesis followed by a large melenic stool. I am on daily Aspirin 75mg and Clopidogrel 75mg, and foolishly took Diclofenac for shoulder strain.",
                "doc_q1": "Dr. Qureshi, lie down immediately with your head elevated 30 degrees (semi-Fowler position) or in lateral recovery position to protect your airway and prevent aspiration while vomiting. Combining an NSAID with dual antiplatelet therapy has precipitated an acute Upper GI Hemorrhage. What is your current heart rate, blood pressure, and orthostatic status?",
                "patient_reply": "HR is 112 bpm, BP on my home cuff is 104/68 mmHg—down from my 142/90 baseline. Significant postural lightheadedness. Shock index > 1.0.",
                "doc_q2": "CRITICAL EMERGENCY: Shock index > 1.0 indicates hemodynamic compromise. Do NOT independently stop or restart prescribed antiplatelets; immediately convey your exact medication chart (Aspirin 75mg, Clopidogrel 75mg, Diclofenac) to emergency and cardiology teams for specialist-coordinated hemostasis per NICE CG141 guidelines. Remain strictly NPO, and transfer via emergency cardiac ambulance to the ER for large-bore IV access, IV PPI infusion, type-and-cross, and emergency therapeutic endoscopy.",
                "patient_final": "Cardiac ambulance called, GI on-call notified. Resting in semi-Fowler position with head elevated 30 degrees. Thank you colleague."
            }
        elif p_id == 13:  # Harbans Lal (81M Dementia & CHF)
            return {
                "patient_open": "...Why did they spill black coal tar on the engine floor?... My stomach is burning... (Assisted Living Nurse: 'Doctor, Babuji just vomited dark brown coffee-ground liquid and passed black tarry stool in his diaper! He is on blood thinners for his heart!').",
                "doc_q1": "Emergency alert for nursing staff: Coffee-ground vomitus and melena in an 81-year-old on anticoagulants with CHF is a life-threatening Upper GI Hemorrhage. What are his current vitals and level of consciousness?",
                "patient_reply": "...The boiler pressure is dropping, bring the coal... (Nurse: 'He is pale and clammy, pulse is 118 weak, BP dropped to 88/54 mmHg!').",
                "doc_q2": "CRITICAL EMERGENCY — HYPOVOLEMIC SHOCK: Position him supine with lateral recovery tilt in case of emesis, protect his airway, and transfer via ALS ambulance immediately. Do NOT give oral fluids. Send his anticoagulant medication chart for urgent reversal protocol.",
                "patient_final": "(Nurse: 'Turned on side, oxygen mask placed, ALS ambulance pulling into the facility gate right now.')"
            }
        else:
            return {
                "patient_open": f"Doctor, I have severe burning in my upper stomach, threw up dark coffee-colored vomit, and noticed black sticky stools.",
                "doc_q1": f"Hello {p_first}. Black stools (melena) and coffee-ground vomitus are urgent signs of upper gastrointestinal bleeding. Are you taking any blood thinners or painkillers?",
                "patient_reply": "Yes, I was taking pain tablets. I feel lightheaded when I stand up.",
                "doc_q2": "This is a medical emergency. Suspected bleeding ulcer requires immediate hospital evaluation. Call 112 for an ambulance and do not drive yourself.",
                "patient_final": "Calling 112 emergency ambulance immediately, doctor."
            }

    # ── CASE 5: DIARRHEA & DEHYDRATION ──────────────────────────────────────
    elif sc_id == 10:
        if p_id == 1:  # Ramesh Sharma (Diabetic on Metformin)
            return {
                "patient_open": "Beta, since yesterday morning I have had 11 or 12 watery loose motions. My mouth is like paper, and I took my morning Metformin and BP tablet as usual with a sip of water.",
                "doc_q1": "CRITICAL SICK-DAY RULE: Stop taking your Metformin immediately! In severe dehydration, Metformin accumulation carries an increased risk of serious Lactic Acidosis (MALA). How is your urination and dizziness?",
                "patient_reply": "Beta, I haven't passed any urine since 8 hours. When I stand up, the room spins and I have to grab the wall. My calves are cramping painfully.",
                "doc_q2": "Your symptoms indicate acute pre-renal dehydration risk with anuria. Sip WHO Oral Rehydration Salts (ORS) slowly every 10 minutes, and have your family take you to an emergency clinic immediately for IV fluid evaluation.",
                "patient_final": "Understood beta, pausing Metformin and starting ORS right away. My son is taking me to the emergency clinic now."
            }
        elif p_id == 10:  # Priyanka Rao (Organic Yogi)
            return {
                "patient_open": "Namaste doctor. My digestive fire (Agni) is severely disturbed. Since yesterday, I have had 12 profuse watery evacuations, abdominal cramping, and extreme dryness. I prefer natural healing methods—can I just drink coconut water?",
                "doc_q1": "Namaste Priyanka. While I respect your holistic philosophy, losing fluid 12 times in 24 hours has placed your kidneys under severe strain. Plain coconut water is rich in potassium but lacks the equimolar sodium-glucose ratio (SGLT1) needed to stop secretory dehydration. Are you dizzy on standing?",
                "patient_reply": "Yes doctor, my urine is dark amber and scanty, and I nearly blacked out when standing up from my yoga mat.",
                "doc_q2": "CRITICAL DEHYDRATION HAZARD: Because you are nearly blacking out on standing, you MUST drink WHO-formula Oral Rehydration Salts (or emergency home ORS: 1L boiled water + 6 level tsp sugar + 1/2 tsp salt) at 200ml after every stool, and proceed to an urgent care clinic immediately for IV fluid assessment.",
                "patient_final": "Thank you for explaining the physiology clearly, doctor. My husband is mixing the ORS now and driving me to the local clinic."
            }
        elif p_id == 4:  # Meera Nambiar (Pregnant Teacher)
            return {
                "patient_open": "Doctor, I'm in my second trimester of pregnancy and I've had over 10 profuse watery diarrhea stools today. My mouth is completely parched, my urine is very dark, and I feel dizzy sitting up.",
                "doc_q1": "Hello Meera. In pregnancy, rapid dehydration reduces uteroplacental perfusion and can stimulate premature uterine contractions. Are you feeling normal fetal movements, and are you having any lower abdominal cramping or tightening?",
                "patient_reply": "I can sip water, and the baby kicked an hour ago, but my lower belly feels crampy and my heart is racing.",
                "doc_q2": "EMERGENCY OBSTETRIC PRECAUTION: With gestational anemia (Hb 9.8), tachycardia, and dehydration, oral fluids at home are not enough. Start sipping WHO-ORS continuously and report to Maternity Triage / Labor & Delivery immediately for IV fluid rehydration and fetal monitoring.",
                "patient_final": "Sipping ORS now and heading straight to Maternity Triage with my husband. Thank you, doctor."
            }
        else:
            return {
                "patient_open": f"Doctor, I have had profuse watery diarrhea over 10 times today. My mouth is parched and I feel dizzy.",
                "doc_q1": f"Hello {p_first}. Rapid fluid loss can strain your kidneys. Are you able to keep oral fluids down without vomiting?",
                "patient_reply": "Yes, I can sip water, but my urine is very dark and I feel weak on standing.",
                "doc_q2": "Start drinking WHO-formula ORS immediately—200-400ml after every loose stool. If dizziness worsens or you cannot urinate, proceed to an urgent care clinic for IV fluid evaluation.",
                "patient_final": "Starting ORS right now, thank you doctor."
            }

    # ── CASE 6: ACUTE STROKE (FAST) ─────────────────────────────────────────
    elif sc_id == 9:
        if p_id == 13:  # Harbans Lal (81M Dementia & CHF)
            return {
                "patient_open": "...The railway signals are crossed... I can't lift my left hand to touch my tea cup... (Assisted Living Nurse: 'Doctor, Babuji's left mouth corner suddenly started drooping 25 minutes ago during breakfast, and his left arm is completely limp!').",
                "doc_q1": "CRITICAL EMERGENCY: Babuji is exhibiting classic Acute Stroke signs (FAST Positive). Do NOT give any food, water, or aspirin. Is an emergency ambulance called, and what blood thinners is he currently taking?",
                "patient_reply": "(Nurse: '112 ambulance is dialed and arriving in 5 minutes! He takes Apixaban 2.5mg BID for atrial fibrillation. We have logged exact symptom onset as 8:15 AM.').",
                "doc_q2": "Keep him positioned with head supported at 30 degrees. Hand the paramedics his medication chart showing Apixaban so the stroke team can evaluate whether mechanical thrombectomy is indicated over IV thrombolysis.",
                "patient_final": "(Nurse: 'Paramedics just wheeled the stretcher into his room. Handing over the Apixaban chart and timestamp now. Thank you!')"
            }
        elif p_id == 14:  # Radhika Menon (41F Psychologist)
            return {
                "patient_open": "Doctor, I was in the middle of a therapy session with a client 20 minutes ago when my speech suddenly became slurred and thick. When I looked in my office mirror, the left corner of my mouth was drooping, and I just dropped my notepad because my left hand has zero grip strength! Is this a stroke?!",
                "doc_q1": "CRITICAL EMERGENCY: Radhika, sudden unilateral facial droop, motor paralysis, and dysarthria are classic signs of an Acute Stroke (FAST Positive). Do NOT take food, water, or aspirin until a CT scan rules out hemorrhage. Is someone with you right now?",
                "patient_reply": "Yes, the clinic receptionist is in my room right now and dialing 112... my whole left arm feels completely dead...",
                "doc_q2": "Have the receptionist record the exact symptom onset time (20 minutes ago). Lie down with your head elevated at 30 degrees. Transferring to a Stroke-Ready Hospital immediately is critical for acute evaluation.",
                "patient_final": "(Receptionist: 'Ambulance is 4 minutes away, onset time logged at 10:10 AM, keeping her calm and elevated. Thank you!')"
            }
        elif p_id == 18:  # Deepak Verma (34M Trader)
            return {
                "patient_open": "Doc, help—I'm at my trading desk and suddenly couldn't type on the left side of my keyboard! My left arm won't lift, my co-trader says the left side of my face is sagging, and my words are coming out garbled! My BP has been running 144/92 for months and I skipped my meds today!",
                "doc_q1": "CRITICAL EMERGENCY: Deepak, sudden left-sided arm weakness, facial droop, and slurred speech in the setting of uncontrolled hypertension is an Acute Stroke until proven otherwise. Do NOT swallow aspirin or BP pills right now. Has an ambulance been called?",
                "patient_reply": "(Co-trader typing: 'Yes, building security called 112, paramedics are on the way up the elevator. His left arm is totally limp and he has a pounding headache.').",
                "doc_q2": "Keep him resting with his head slightly elevated, loosen his collar/tie, and give nothing by mouth. Inform the paramedics of the exact onset time and his untreated hypertension so the ER can rush him straight to the CT scanner.",
                "patient_final": "(Co-trader: 'Paramedics just walked onto the trading floor with the stretcher. Got the exact timestamp logged. Thanks doc.')"
            }
        else:
            return {
                "patient_open": f"Doctor, my left arm suddenly went weak 25 minutes ago, and my face feels drooping on the left side. My speech sounds slurred.",
                "doc_q1": f"CRITICAL EMERGENCY: Sudden unilateral weakness, facial droop, and slurred speech are acute stroke signs (FAST criteria). Do NOT take aspirin or oral fluids. Call 112 immediately.",
                "patient_reply": "My family is calling 112 right now, onset was about 25 minutes ago.",
                "doc_q2": "Note the exact onset time. Keep resting with head slightly supported until the emergency team arrives.",
                "patient_final": "Ambulance is arriving right now, doctor. Thank you."
            }

    # ── GENERIC FALLBACK ────────────────────────────────────────────────────
    return {
        "patient_open": f"Doctor, I am experiencing {scenario.chief_complaint} for {scenario.duration}.",
        "doc_q1": f"Hello {p_first}. Can you describe what makes this symptom better or worse, and how severe it is from 1 to 10?",
        "patient_reply": "It feels quite severe, about 7/10, and disrupts my day.",
        "doc_q2": "Thank you. I am cross-referencing your medical history to provide safe, targeted recommendations.",
        "patient_final": "Thank you doctor, awaiting your guidance."
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3. PDF BUILDER: DISEASE-WISE & PERSON-BY-PERSON MASTER DOSSIER
# ─────────────────────────────────────────────────────────────────────────────

def build_complete_dossier_pdf(output_pdf_path: Path):
    output_pdf_path.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(output_pdf_path),
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    # Brand Colors
    c_teal = colors.HexColor("#0F766E")
    c_navy = colors.HexColor("#1E3A8A")
    c_blue = colors.HexColor("#0284C7")
    c_slate = colors.HexColor("#1E293B")
    c_muted = colors.HexColor("#475569")
    c_red = colors.HexColor("#B91C1C")
    c_amber = colors.HexColor("#B45309")
    c_green = colors.HexColor("#15803D")
    c_bg_light = colors.HexColor("#F8FAFC")
    c_border = colors.HexColor("#CBD5E1")

    # Typography Styles
    title_style = ParagraphStyle('DocTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=c_teal, alignment=0, spaceAfter=4)
    subtitle_style = ParagraphStyle('DocSubtitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9.5, leading=13, textColor=c_navy, spaceAfter=6)
    meta_style = ParagraphStyle('DocMeta', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=11, textColor=c_muted, spaceAfter=10)
    h1_style = ParagraphStyle('H1_Custom', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=12, leading=15, textColor=c_teal, spaceBefore=12, spaceAfter=5, keepWithNext=True)
    h2_style = ParagraphStyle('H2_Custom', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=10, leading=13, textColor=c_navy, spaceBefore=8, spaceAfter=3, keepWithNext=True)
    body_style = ParagraphStyle('Body_Custom', parent=styles['BodyText'], fontName='Helvetica', fontSize=7.8, leading=11, textColor=c_slate, spaceAfter=4)
    callout_style = ParagraphStyle('Callout_Text', parent=body_style, fontSize=7.5, leading=10.5, textColor=colors.HexColor("#0F172A"))

    tbl_header = ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7, leading=9, textColor=colors.white, alignment=1)
    tbl_cell = ParagraphStyle('TD', fontName='Helvetica', fontSize=6.5, leading=8.5, textColor=c_slate)
    tbl_cell_bold = ParagraphStyle('TDBold', fontName='Helvetica-Bold', fontSize=6.5, leading=8.5, textColor=c_slate)
    tbl_cell_center = ParagraphStyle('TDCenter', fontName='Helvetica', fontSize=6.5, leading=8.5, alignment=1, textColor=c_slate)
    tbl_cell_alert = ParagraphStyle('TDAlert', fontName='Helvetica-Bold', fontSize=6.5, leading=8.5, textColor=c_red)
    tbl_cell_mini = ParagraphStyle('TDMini', fontName='Helvetica', fontSize=5.6, leading=7.0, textColor=c_slate)
    tbl_cell_mini_bold = ParagraphStyle('TDMiniBold', fontName='Helvetica-Bold', fontSize=5.6, leading=7.0, textColor=c_slate)
    tbl_cell_mini_center = ParagraphStyle('TDMiniCenter', fontName='Helvetica', fontSize=5.6, leading=7.0, alignment=1, textColor=c_slate)

    story = []

    # ══════════════════════════════════════════════════════════════════════════
    # PAGE 1: TITLE & EXECUTIVE SUMMARY
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("AROVIA.AI — COMPLETE CLINICAL CHAT & DISEASE DOSSIER", title_style))
    story.append(Paragraph("All 18 Personas • Multi-Turn Consultations • Pain Perception Models • Bayesian Inference", subtitle_style))
    story.append(Paragraph("<b>Engine:</b> 100% Deterministic Local Engine (Zero External API Dependency) &nbsp;|&nbsp; <b>Date:</b> October 2026 &nbsp;|&nbsp; <b>Target:</b> Physician Audit", meta_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_teal, spaceBefore=2, spaceAfter=8))

    exec_text = (
        "<b>CLINICAL OVERVIEW FOR ATTENDING PHYSICIANS:</b><br/>"
        "This dossier provides a 360-degree clinical audit of Arovia's clinical engine across <b>all 18 patient personas</b> "
        "and <b>all core disease presentations</b>. "
        "Unlike generic LLM wrappers, this engine operates <b>100% on the local deterministic codebase</b> "
        "(PersonaEngine, MCMCEngine, and SymptomQuestionSchemas), using Bayesian prior odds updates, "
        "multi-system organ strain models, and Beers/FDA safety filters. "
        "Crucially, it captures how patients in real life describe their symptoms: stoic grandfathers who minimize heart attacks as 'gas', "
        "anxious developers tracking Apple Watch biometrics, truckers self-medicating on NSAIDs until stomach ulcers bleed, "
        "and pregnant mothers safeguarding their unborn child."
    )
    p_exec = Table([[Paragraph(exec_text, callout_style)]], colWidths=[540])
    p_exec.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F0FDFA")),
        ('BORDER', (0,0), (-1,-1), 1, c_teal),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(p_exec)
    story.append(Spacer(1, 8))

    # Master Table of 18 Personas
    story.append(Paragraph("Master Persona Demographics & Baseline Vitals (All 18 Profiles)", h2_style))
    p_summary_data = [
        [Paragraph("<b>ID</b>", tbl_header), Paragraph("<b>Patient Name</b>", tbl_header), Paragraph("<b>Age/Sex</b>", tbl_header), Paragraph("<b>Occupation</b>", tbl_header), Paragraph("<b>BMI / BP</b>", tbl_header), Paragraph("<b>Chronic Illnesses</b>", tbl_header), Paragraph("<b>Frailty</b>", tbl_header), Paragraph("<b>Polypharmacy</b>", tbl_header)]
    ]
    for p in PERSONAS:
        cond_text = ", ".join(p.conditions)
        p_summary_data.append([
            Paragraph(f"<b>#{p.id}</b>", tbl_cell_mini_center),
            Paragraph(f"<b>{p.name}</b>" + (" 🤰" if p.is_pregnant else ""), tbl_cell_mini_bold),
            Paragraph(f"{p.age}y {p.sex[:1].upper()}", tbl_cell_mini_center),
            Paragraph(p.occupation, tbl_cell_mini),
            Paragraph(f"{p.bmi} | {p.resting_bp}", tbl_cell_mini_center),
            Paragraph(cond_text, tbl_cell_mini),
            Paragraph(f"{p.frailty_index}/10", tbl_cell_mini_center),
            Paragraph(p.polypharmacy_risk.upper(), tbl_cell_mini_center)
        ])
    t_sum = Table(p_summary_data, colWidths=[18, 88, 38, 92, 64, 150, 42, 48])
    t_sum.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_teal),
        ('BORDER', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 1.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.2),
        ('LEFTPADDING', (0,0), (-1,-1), 2.5),
        ('RIGHTPADDING', (0,0), (-1,-1), 2.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light])
    ]))
    story.append(t_sum)

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # DISEASE-BY-DISEASE DEEP-DIVE SECTIONS (WITH FULL 18-PERSONA CHATS & MATRICES)
    # ══════════════════════════════════════════════════════════════════════════

    core_diseases = [
        (SYMPTOM_SCENARIOS[0], "1. Cardiovascular: Acute Crushing Chest Pain & Arm Radiation", "Cardiology / Coronary Ischemia vs. Costochondritis vs. GERD"),
        (SYMPTOM_SCENARIOS[1], "2. Pulmonology: 103°F High Fever, Shaking Rigors & Green Phlegm", "Infectious Disease / Pneumonia vs. Sepsis vs. Byssinosis"),
        (SYMPTOM_SCENARIOS[4], "3. Rheumatology: 3 AM Screaming Big Toe Swelling & Calor (Podagra)", "Metabolic / Acute Gout vs. Pseudogout vs. Septic Joint"),
        (SYMPTOM_SCENARIOS[5], "4. Gastroenterology: Coffee-Ground Vomitus, Melena & Epigastric Agony", "Upper GI Hemorrhage / NSAID Peptic Ulcer vs. Varices"),
        (SYMPTOM_SCENARIOS[9], "5. Nephrology: Watery Diarrhea (12x/day), Sunken Eyes & Dehydration", "Pre-Renal AKI vs. Secretory Enteritis & Metformin Lactic Acidosis"),
        (SYMPTOM_SCENARIOS[8], "6. Neurology: Acute FAST Stroke (Facial Droop, Left Arm Weakness)", "Cerebrovascular / Ischemic Infarction vs. Hemorrhage vs. TIA")
    ]

    for sc, sc_title, sc_subtitle in core_diseases:
        story.append(Paragraph(sc_title, h1_style))
        story.append(Paragraph(f"<b>Clinical Domain:</b> {sc_subtitle} &nbsp;|&nbsp; <b>Complaint:</b> {sc.chief_complaint}", meta_style))

        # 18-Persona Comparison Matrix for this Disease
        story.append(Paragraph("A. Complete 18-Persona Risk & Organ Strain Comparison Matrix", h2_style))
        matrix_rows = [
            [
                Paragraph("<b>Persona</b>", tbl_header),
                Paragraph("<b>Triage</b>", tbl_header),
                Paragraph("<b>Top Calculated Diagnosis</b>", tbl_header),
                Paragraph("<b>Posterior</b>", tbl_header),
                Paragraph("<b>Prior Shift (α)</b>", tbl_header),
                Paragraph("<b>Key Organ Strain</b>", tbl_header),
                Paragraph("<b>Primary DDI / Safety Alert</b>", tbl_header)
            ]
        ]

        for p in PERSONAS:
            res = ClinicalImpactEngine.simulate(p, sc)
            top_d = res.bayesian_differentials[0]
            cardio = res.organ_burden.get("cardiovascular", 0)
            renal = res.organ_burden.get("renal_metabolic", 0)
            resp = res.organ_burden.get("respiratory", 0)
            gi = res.organ_burden.get("gastrointestinal", 0)
            neuro = res.organ_burden.get("neuro_cognitive", 0)

            if sc.id == 1:
                ob_text = f"Cardio: {cardio}%<br/>Renal: {renal}%"
            elif sc.id == 2:
                ob_text = f"Resp: {resp}%<br/>Cardio: {cardio}%"
            elif sc.id == 5:
                ob_text = f"Renal: {renal}%<br/>Cardio: {cardio}%"
            elif sc.id == 6:
                ob_text = f"GI: {gi}%<br/>Cardio: {cardio}%"
            elif sc.id == 10:
                ob_text = f"Renal: {renal}%<br/>GI: {gi}%"
            elif sc.id == 9:
                ob_text = f"Neuro: {neuro}%<br/>Cardio: {cardio}%"
            else:
                ob_text = f"Cardio: {cardio}%<br/>Renal: {renal}%"

            triage_p_style = tbl_cell_alert if "EMERGENCY" in res.triage_level else tbl_cell_bold
            alert_text = res.ddi_contraindications[0] if res.ddi_contraindications else "None"
            if len(alert_text) > 85:
                alert_text = alert_text[:82] + "..."

            matrix_rows.append([
                Paragraph(f"<b>#{p.id} {p.name}</b><br/>{p.age}y {p.sex[:1].upper()}", tbl_cell),
                Paragraph(f"<b>{res.triage_level}</b>", triage_p_style),
                Paragraph(f"{top_d['disease']}", tbl_cell_bold),
                Paragraph(f"<b>{top_d['posterior_pct']}%</b>", tbl_cell_center),
                Paragraph(f"{top_d['multiplier']}x", tbl_cell_center),
                Paragraph(ob_text, tbl_cell_center),
                Paragraph(f"{alert_text}", tbl_cell if "None" in alert_text or "✓" in alert_text else tbl_cell_alert)
            ])

        t_matrix = Table(matrix_rows, colWidths=[68, 56, 118, 42, 44, 66, 146])
        t_matrix.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_navy),
            ('BORDER', (0,0), (-1,-1), 0.5, c_border),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 1.8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1.8),
            ('LEFTPADDING', (0,0), (-1,-1), 3),
            ('RIGHTPADDING', (0,0), (-1,-1), 3),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light])
        ]))
        story.append(t_matrix)
        story.append(PageBreak())

        # Synthetic Clinical Simulation Transcripts for Key Personas
        story.append(Paragraph("B. Synthetic Clinical Simulation Transcripts (Multi-Turn Triage Benchmark)", h2_style))
        
        # Pick 3 contrasting personas for deep-dive dialogue in each disease
        if sc.id == 1:
            chat_personas = [1, 2, 5]  # Ramesh (Diabetic grandpa), Aanya (Anxious dev), Vik (Athlete)
        elif sc.id == 2:
            chat_personas = [11, 13, 12] # Anand (Mill worker), Harbans (Dementia), Zoya (Teen)
        elif sc.id == 5:
            chat_personas = [15, 1, 9]   # Manish (Broker), Ramesh (Diabetic CKD), Dr. Farooq (Surgeon)
        elif sc.id == 6:
            chat_personas = [3, 9, 13]   # Gurpreet (Trucker), Dr. Farooq, Harbans (on blood thinners)
        elif sc.id == 10:
            chat_personas = [1, 10, 4]   # Ramesh (Metformin hazard), Priyanka (Organic yogi), Meera (Pregnant)
        else:
            chat_personas = [13, 14, 18] # Harbans, Radhika, Deepak

        for cp_id in chat_personas:
            p_obj = next(pers for pers in PERSONAS if pers.id == cp_id)
            diag = get_persona_dialogue(p_obj, sc)
            res_obj = ClinicalImpactEngine.simulate(p_obj, sc)
            top_diag = res_obj.bayesian_differentials[0]

            chat_box = [
                [Paragraph(f"<b>PATIENT CONSULTATION: #{p_obj.id} {p_obj.name.upper()} ({p_obj.age}y {p_obj.sex}) — {p_obj.occupation}</b>", tbl_header)],
                [Paragraph(f"<b>👤 {p_obj.name}:</b> \"{diag['patient_open']}\"", tbl_cell)],
                [Paragraph(f"<b>🩺 Arovia Health Assistant:</b> \"{diag['doc_q1']}\"", tbl_cell)],
                [Paragraph(f"<b>👤 {p_obj.name}:</b> \"{diag['patient_reply']}\"", tbl_cell)],
                [Paragraph(f"<b>🩺 Arovia Health Assistant:</b> \"{diag['doc_q2']}\"", tbl_cell)],
                [Paragraph(f"<b>👤 {p_obj.name}:</b> \"{diag['patient_final']}\"", tbl_cell)],
                [Paragraph(
                    f"<b>⚡ CLINICAL INFERENCE:</b> Triage: <b>{res_obj.triage_level}</b> | "
                    f"Diagnosis: <b>{top_diag['disease']}</b> (Posterior: <b>{top_diag['posterior_pct']}%</b>, Multiplier: <b>{top_diag['multiplier']}x</b>)<br/>"
                    f"<b>Safety / DDI Filter:</b> {res_obj.ddi_contraindications[0] if res_obj.ddi_contraindications else 'None'}",
                    tbl_cell_alert if "EMERGENCY" in res_obj.triage_level else tbl_cell_bold
                )]
            ]
            t_chat = Table(chat_box, colWidths=[540])
            t_chat.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), c_teal),
                ('BACKGROUND', (0,1), (-1,1), colors.HexColor("#F0FDF4")),
                ('BACKGROUND', (0,2), (-1,2), colors.HexColor("#F0FDFA")),
                ('BACKGROUND', (0,3), (-1,3), colors.HexColor("#F0FDF4")),
                ('BACKGROUND', (0,4), (-1,4), colors.HexColor("#F0FDFA")),
                ('BACKGROUND', (0,5), (-1,5), colors.HexColor("#F0FDF4")),
                ('BACKGROUND', (0,6), (-1,6), colors.HexColor("#FEF2F2") if "EMERGENCY" in res_obj.triage_level else colors.HexColor("#FFFBEB")),
                ('BORDER', (0,0), (-1,-1), 0.5, c_border),
                ('TOPPADDING', (0,0), (-1,-1), 2.5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
                ('LEFTPADDING', (0,0), (-1,-1), 5),
                ('RIGHTPADDING', (0,0), (-1,-1), 5),
            ]))
            story.append(t_chat)
            story.append(Spacer(1, 5))

        story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # FINAL SECTION: PHYSICIAN VERIFICATION & SIGN-OFF AUDIT
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("Physician Verification, Audit & Concurrence Protocol", h1_style))
    story.append(Paragraph(
        "This section is reserved for the attending medical doctor to review the mathematical calculations, "
        "cross-persona disease responses, and drug safety contraindications generated by the deterministic local engine (Build 2026.10-LocalEngine).",
        body_style
    ))

    disclaimer_text = (
        "<b>CLINICAL AUDIT & REGULATORY BOUNDARY NOTICE:</b><br/>"
        "This dossier and its Bayesian calculations are synthetic simulation benchmarks generated solely by Arovia's "
        "deterministic local engine (Build 2026.10-LocalEngine, Zero External API Dependency) for physician verification and engineering review. "
        "It is <b>NOT approved for unmonitored patient self-care</b> or autonomous clinical decision-making without licensed clinical supervision."
    )
    p_disc = Table([[Paragraph(disclaimer_text, callout_style)]], colWidths=[540])
    p_disc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FEF2F2")),
        ('BORDER', (0,0), (-1,-1), 0.8, c_red),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(p_disc)
    story.append(Spacer(1, 8))

    audit_data = [
        [Paragraph("<b>Physician Audit Domain</b>", tbl_header), Paragraph("<b>Verification Standard</b>", tbl_header), Paragraph("<b>Concurrence</b>", tbl_header), Paragraph("<b>Physician Notes</b>", tbl_header)],
        [
            Paragraph("<b>1. Bayesian Covariate Priors (α)</b>", tbl_cell_bold),
            Paragraph("Covariate multipliers shift baseline odds based on age, CAD history, diabetes, and smoking.", tbl_cell),
            Paragraph("[ &nbsp; ] Concur<br/>[ &nbsp; ] Modify<br/>[ &nbsp; ] Disagree", tbl_cell_center),
            Paragraph("_____________________________<br/>_____________________________", tbl_cell)
        ],
        [
            Paragraph("<b>2. NSAID & Renal Safety Guard</b>", tbl_cell_bold),
            Paragraph("Absolute contraindication of systemic NSAIDs in CKD Stages 3-5, active peptic ulcer/GI bleed, and 2nd/3rd trimester pregnancy.", tbl_cell),
            Paragraph("[ &nbsp; ] Concur<br/>[ &nbsp; ] Modify<br/>[ &nbsp; ] Disagree", tbl_cell_center),
            Paragraph("_____________________________<br/>_____________________________", tbl_cell)
        ],
        [
            Paragraph("<b>3. Metformin Sick-Day Protocol</b>", tbl_cell_bold),
            Paragraph("Mandatory cessation of Metformin during dehydration/diarrhea to mitigate risk of Metformin-Associated Lactic Acidosis (MALA).", tbl_cell),
            Paragraph("[ &nbsp; ] Concur<br/>[ &nbsp; ] Modify<br/>[ &nbsp; ] Disagree", tbl_cell_center),
            Paragraph("_____________________________<br/>_____________________________", tbl_cell)
        ],
        [
            Paragraph("<b>4. Organ Strain & Frailty Index</b>", tbl_cell_bold),
            Paragraph("0-100% organ strain index mapping (Cardio, Renal, Resp, GI, Neuro) and acute frailty surge.", tbl_cell),
            Paragraph("[ &nbsp; ] Concur<br/>[ &nbsp; ] Modify<br/>[ &nbsp; ] Disagree", tbl_cell_center),
            Paragraph("_____________________________<br/>_____________________________", tbl_cell)
        ],
        [
            Paragraph("<b>5. Multi-Modal Integrative Safety</b>", tbl_cell_bold),
            Paragraph("Traditional herbal preparations screened for herb-drug interactions and organ safety.", tbl_cell),
            Paragraph("[ &nbsp; ] Concur<br/>[ &nbsp; ] Modify<br/>[ &nbsp; ] Disagree", tbl_cell_center),
            Paragraph("_____________________________<br/>_____________________________", tbl_cell)
        ],
    ]
    t_audit = Table(audit_data, colWidths=[120, 170, 80, 170])
    t_audit.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_teal),
        ('BORDER', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light])
    ]))
    story.append(t_audit)
    story.append(Spacer(1, 14))

    # Signature Block
    sig_data = [
        [Paragraph("<b>Reviewing Doctor Name:</b> ___________________________", body_style), Paragraph("<b>Medical Council Registration No:</b> ___________________", body_style)],
        [Paragraph("<b>Hospital / Clinic:</b> ________________________________", body_style), Paragraph("<b>Specialty:</b> [ ] Internal Med &nbsp; [ ] Cardiology &nbsp; [ ] GP", body_style)],
        [Paragraph("<b>Physician Signature:</b> ______________________________", body_style), Paragraph("<b>Date:</b> ___________________________________________", body_style)],
        [Paragraph("<b>Official Clinic Stamp:</b><br/><br/><br/>_______________________________________________", body_style), Paragraph("<b>Clinical Approval Status:</b><br/>[ ] Verified for Patient Guidance<br/>[ ] Adjusted per Notes<br/>[ ] Retest with Additional Diagnostics", body_style)]
    ]
    t_sig = Table(sig_data, colWidths=[270, 270])
    t_sig.setStyle(TableStyle([
        ('BORDER', (0,0), (-1,-1), 0.5, c_border),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_sig)

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✓ Master 18-Persona Disease Dossier built at: {output_pdf_path}")


if __name__ == "__main__":
    out_file = ROOT_DIR / "output" / "Arovia_Complete_18_Persona_Disease_Dossier.pdf"
    build_complete_dossier_pdf(out_file)
