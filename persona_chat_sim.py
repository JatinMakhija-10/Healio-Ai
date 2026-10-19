#!/usr/bin/env python3
"""
Arovia / Healio.AI — Multi-Persona Clinical Chat & Pain Perception Simulator
============================================================================
Simulates realistic, multi-turn clinical consultations across all 18 personas,
capturing their unique voices, distinct writing styles, and subjective pain perceptions:

  • Stoic elderly grandfathers downplaying chest agony as "mild gas"
  • Hyper-anxious tech developers citing Apple Watch ECG and HRV in panic
  • Gruff highway truckers popping Brufen daily until their stool turns black
  • Expectant mothers hyper-protective of fetal drug safety
  • Competitive athletes speaking in biomechanical joint physics
  • Frail grandmothers fearing loss of independence and bone fractures
  • Real estate brokers screaming from 3 AM scotch-and-mutton gout attacks
  • Palliative dementia seniors confusing chest tightness with railway engines
  • Fibromyalgia patients experiencing central allodynia where a touch feels bruised

Modes:
  1. Interactive Persona Chat (Watch or participate in multi-turn consultation)
  2. Test All Diseases Person-by-Person (Comprehensive batch simulation)
  3. Roleplay Mode (Chat as Doctor with any Persona, or chat as the Persona)
  4. Export full conversational transcripts to output/persona_chat_transcripts.md

Usage:
  python persona_chat_sim.py
  python persona_chat_sim.py --batch
  python persona_chat_sim.py --persona 1 --symptom 1
  python persona_chat_sim.py --export
"""

import sys
import os
import time
import argparse
from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

# Ensure UTF-8 output on Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, IntPrompt, Confirm
from rich.text import Text
from rich import box

console = Console()

# Import core data models from persona_terminal
ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))
from persona_terminal import PERSONAS, SYMPTOM_SCENARIOS, ClinicalImpactEngine, ClinicalPersona, SymptomScenario


# ─────────────────────────────────────────────────────────────────────────────
# 1. PERSONA DIALOGUE & PAIN PERCEPTION PROFILES
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class PersonaDialogueProfile:
    persona_id: int
    voice_archetype: str
    pain_perception_type: str
    pain_description_style: str
    vocabulary_and_tone: str
    sample_dialogues: Dict[int, List[str]]  # scenario_id -> [Turn 1 opener, Turn 2 reply, Turn 3 reply]


PERSONA_PROFILES: Dict[int, PersonaDialogueProfile] = {
    1: PersonaDialogueProfile(
        persona_id=1,
        voice_archetype="Stoic Elderly Retired Bank Clerk (Ramesh Sharma, 68M)",
        pain_perception_type="High Pain Threshold / Diabetic Sensory Blunting (Silent Ischemia Risk)",
        pain_description_style="Minimizes severe pain; attributes chest tightness to 'gas' or 'acidity'; apologetic.",
        vocabulary_and_tone="Polite, respectful, Hindi-English fusion ('Beta', 'Chai', 'Ajwain'), hesitant to worry family.",
        sample_dialogues={
            1: [
                "Namaste beta... Actually, my daughter insisted I consult. It is probably just some gas from the samosa I ate at evening tea. But there is a heavy stone-like feeling right in the center of my chest since 45 minutes, and my left shoulder feels slightly tired. Nothing serious, I took some ajwain water already.",
                "Yes beta... When I sit still, the heaviness stays the same. Breathing feels a little bit shallow, and my undershirt is soaked with cold sweat, which is strange because the fan is on. I have been taking my sugar and BP pills regularly for 15 years.",
                "No, no sharp stabbing pain, just a deep pressing heaviness, like someone is sitting on my chest. When I tried to walk to the kitchen, my head felt dizzy and my knees felt weak."
            ],
            5: [
                "Beta, I woke up around 4 AM because my right big toe was burning. It looks quite red and swollen like a small potato. I thought maybe an insect bit me in my sleep, but even the bedsheet touching it hurts.",
                "I haven't eaten any meat because we are pure vegetarians, but we had fried dal kachoris and heavy sweets at my nephew's retirement party two days ago. I was thinking of taking a Brufen tablet from my drawer for the pain.",
                "My kidney doctor told me last year that my creatinine is 1.8, so I wanted to ask if Brufen is safe or if I should just apply some warm mustard oil?"
            ],
            10: [
                "Beta, since yesterday morning my stomach has been completely upset. At least 10 or 12 times I had to rush to the bathroom—just pure water coming out. My mouth is like paper, so dry.",
                "Yes, I took my morning Metformin and BP tablet with a sip of water as usual. But every time I try to stand up from bed, the room spins and I have to grab the wall. My urine is very dark and scanty.",
                "No blood in stool, beta, just watery brown fluid and terrible cramps in my calves. My hands feel cold."
            ]
        }
    ),

    2: PersonaDialogueProfile(
        persona_id=2,
        voice_archetype="Hyper-Anxious Junior Software Dev (Aanya Sen, 23F)",
        pain_perception_type="Hyper-Reactive / Panic-Amplified (Health Anxiety & Somatization)",
        pain_description_style="Catastrophizes; quotes smartwatch biometrics (HRV, BPM); fast, breathless typing.",
        vocabulary_and_tone="Tech/startup slang, fast abbreviations ('omg', 'literally', 'bpm'), hyperventilating tone.",
        sample_dialogues={
            1: [
                "Doctor omg please help me!! My Apple Watch literally just buzzed an alert that my resting heart rate hit 138 bpm and my ECG app says sinus tachycardia! My chest feels so tight, like an iron band is clamping my ribs shut, and my left arm has this weird pins-and-needles tingling. Am I having a heart attack?! I'm literally shaking right now.",
                "It started like 40 minutes ago while I was debugging a production incident for work. I haven't slept more than 4 hours in the last 4 days and I've had 4 iced americanos today. When I take a deep breath it feels sharp right under my left breastbone.",
                "No vomiting or sweating, just extreme dizziness and my fingers feel completely numb! I took my birth control pill this morning. Could this be a blood clot in my lungs?! Please tell me what to do!"
            ],
            3: [
                "Doctor, my left temple is literally pounding like a pneumatic drill! There were zigzag flickering blind spots in my left eye 30 minutes ago, and now any light from my monitor feels like knives stabbing my brain.",
                "I have intense nausea, like I'm going to throw up on my keyboard. I took a melatonin last night at 3 AM because of insomnia, but the pain woke me up at 7 AM. Sound hurts my ears so badly.",
                "I haven't taken any painkillers yet because aspirin upsets my stomach. I'm lying in a dark room with an ice pack on my forehead, typing this with brightness at 0%."
            ]
        }
    ),

    3: PersonaDialogueProfile(
        persona_id=3,
        voice_archetype="Tough Interstate Long-Haul Trucker (Gurpreet Singh, 42M)",
        pain_perception_type="Stoic / Masked by Self-Medication (High Tolerance until Collapse)",
        pain_description_style="Blunt, practical, dismissive of chronic pain; ignores red flags until bleeding or fainting.",
        vocabulary_and_tone="Highway Hindi/Punjabi colloquial ('Paaji', 'Ustaad', 'Dhaba', 'Kamar'), raw, direct.",
        sample_dialogues={
            6: [
                "Ustaad ji, namaste. Listen, I have been driving my 16-wheeler on NH-44 for 3 days straight. My lower back has been killing me with sciatica, so I was popping 600mg Brufen tablets twice a day from the dhaba medical shop. But today morning, my stomach started burning like someone threw battery acid inside, and when I puked at the petrol pump, it looked like dark coffee grounds!",
                "Yes paaji, dark coffee powder type vomit with brown chunks. And just now at the highway dhaba bathroom, my stool was completely black and sticky like tar, smelling terrible. When I climbed down from the truck cabin, my eyes went dark and I almost fell on the gravel.",
                "I smoke about 15-20 bidis during night driving to stay awake, and had some whisky last night with spicy parathas. Is this just bad dhaba acidity or did my stomach tear?"
            ],
            1: [
                "Doctor sahab, there is a heavy stone sitting on the center of my chest since an hour. Feels like someone parked a tyre on my sternum. Breathing feels heavy and sweat is running down my beard even though the truck AC is on.",
                "Pain is radiating into my left shoulder and jaw, like a dull toothache in my neck. I stopped the truck on the highway shoulder. I smoke daily and have high BP, but never got time to take regular medicine.",
                "No, no relief after resting for 20 minutes. My chest is feeling tighter and I feel like throwing up."
            ]
        }
    ),

    4: PersonaDialogueProfile(
        persona_id=4,
        voice_archetype="Expectant Mother & Biology Teacher (Meera Nambiar, 32F, 26w Pregnant)",
        pain_perception_type="Hyper-Protective Fetal Lens (Fear of Teratogenicity & Premature Labor)",
        pain_description_style="Articulate, cautious, highly detailed, anxious about any pharmaceutical harm to baby.",
        vocabulary_and_tone="Gentle, educated, maternal, strictly clarifies pregnancy safety before taking anything.",
        sample_dialogues={
            7: [
                "Doctor, hello. I am 26 weeks pregnant with our first child. Since yesterday evening, every time I urinate it feels like scalding boiling water. And for the last 4 hours, I have developed severe shivering chills and a sharp, throbbing ache deep in my right lower back just below the ribs. I am so worried this might affect my baby.",
                "My temperature just measured 102.4°F on our digital thermometer. The right flank pain pulses with every step I take, and the urine looks cloudy with an unusual smell. The baby kicked 20 minutes ago, but I feel so weak and feverish.",
                "Doctor, I have a severe documented allergy to Penicillin—it gave me full-body hives years ago. And please, I need absolute assurance that whatever is prescribed has zero risk of causing birth defects or premature contractions!"
            ],
            1: [
                "Doctor, I have this intense burning and crushing ache behind my breastbone since after lunch. It climbs right up into my throat. With the baby growing, my stomach is pushed up, but today the heaviness feels different and makes me short of breath.",
                "It gets worse when I lie flat on the bed, and slightly better when I prop myself up on three pillows. My heart is beating around 88 bpm. I don't have radiating jaw pain, but the pressure in my chest is making me panic for the baby.",
                "I am only taking prenatal iron and calcium tablets. Could this be severe pregnancy reflux or something cardiac?"
            ]
        }
    ),

    5: PersonaDialogueProfile(
        persona_id=5,
        voice_archetype="Collegiate 400m Track Athlete (Vikramaditya Rathore, 19M)",
        pain_perception_type="Biomechanical & Anatomical Framing (High Physical Tolerance)",
        pain_description_style="Analyzes symptoms as functional mechanics; objective, measures pulse and respiration.",
        vocabulary_and_tone="Sports kinesiology terms ('intercostal', 'sternal junction', 'SpO2', 'sub-maximal').",
        sample_dialogues={
            1: [
                "Hey doc. During my 400m sprint workout today, right around the 300m bend during max exertion, I got this sudden sharp stitch in my left anterior chest wall. It feels exquisitely tender if I press my fingers directly onto the 4th and 5th costochondral joints. My resting HR is 46 bpm and my pulse oximeter shows 99% SpO2.",
                "When I take a deep diaphragmatic breath or cough, it's a sharp 7/10 pain right at that exact bone-cartilage junction. But if I don't breathe deeply, it's just a dull 2/10 ache. No radiation to my jaw or arm at all, and no cold sweats.",
                "I did heavy bench-presses and explosive dumbbell pull-overs yesterday in the gym. Could this be costochondritis or a pectoral strain? I have national trials in 10 days."
            ],
            8: [
                "Doc, I was doing 800m repeats in cold morning air today. Around lap 3, my bronchi clamped down completely. Loud high-pitched wheezing on expiration, chest feels like it's trapped in a tight rubber band, and I had to stop and use my hands on my knees in a tripod stance.",
                "I used 2 puffs of my Salbutamol inhaler 10 minutes ago. It helped about 40%, but my chest still feels constricted and my peak flow reading dropped from my baseline 620 down to 410 L/min.",
                "No fever, no phlegm. Just acute exercise-induced bronchospasm triggered by the 12°C cold air."
            ]
        }
    ),

    6: PersonaDialogueProfile(
        persona_id=6,
        voice_archetype="Frail Grandmother with Osteoporosis (Devaki Patel, 74F)",
        pain_perception_type="High Functional Vulnerability (Fear of Immobilization & Falling)",
        pain_description_style="Soft, fearful, humble; describes pain through loss of daily household activities.",
        vocabulary_and_tone="Elderly Gujarati/Hindi elder, gentle, repeatedly expresses fear of becoming a burden.",
        sample_dialogues={
            5: [
                "Pranam doctor beta... My right knee and big toe have swollen up like hot red balls since 3 AM. I tried to stand up with my four-prong walking cane to go to the mandir, but the moment my toe touched the floor, the pain was so agonizing I cried out. My daughter-in-law had to hold me.",
                "It feels as if boiling oil was poured inside the joint. It is fiery hot to touch and throbbing with every heartbeat. I have severe osteoporosis and broke my wrist two years ago, so I am terrified that if my knees fail, I will fall on the bathroom marble.",
                "I take calcium, alendronate, and donepezil. My grandson offered me an Ibuprofen tablet, but I remembered my doctor said my stomach is weak, so I haven't taken anything yet."
            ]
        }
    ),

    8: PersonaDialogueProfile(
        persona_id=8,
        voice_archetype="Nocturnal Mixologist & Bartender (Karthik 'Koko' Roy, 28M)",
        pain_perception_type="Irritable / Visceral Hypersensitivity (Aggravated by Circadian Inversion)",
        pain_description_style="Sensory, vivid, street-smart; connects pain to nocturnal shifts and spicy food.",
        vocabulary_and_tone="Casual, nocturnal slang ('Yo doc', 'molten lava', 'post-shift', 'wrecked').",
        sample_dialogues={
            1: [
                "Yo doc, what's up. I just finished my shift at the club at 4:30 AM. Had like 4 tequila shots, vaped, and grabbed extra-spicy shawarma on the drive home. Woke up at 11 AM with this crazy burning agony right behind my sternum, like someone poured molten hot lava down my throat and lit a match in my chest.",
                "Every time I swallow saliva or burp, acid tastes sour and bitter in my mouth. But the chest pressure is intense enough that I wondered if my heart is going crazy. Heart rate is like 86 bpm. No left arm pain though.",
                "Doc, one major thing: I am severely allergic to NSAID painkillers like Aspirin and Brufen—they trigger full-body hives and wheezing. So please don't suggest any Disprin!"
            ]
        }
    ),

    9: PersonaDialogueProfile(
        persona_id=9,
        voice_archetype="Senior Cardiothoracic Surgeon (Dr. Farooq Qureshi, 58M)",
        pain_perception_type="Clinical / Anatomical Self-Audit (Objective, Suppressed Panic)",
        pain_description_style="Uses precise medical terminology, describes radiation and dermatomes accurately.",
        vocabulary_and_tone="Physician-to-physician communication, succinct, authoritative, clinical.",
        sample_dialogues={
            1: [
                "Good day colleague. I am experiencing retrosternal tightness with a crushing quality, approximately 6/10 intensity, with radiation to the left mandibular angle and medial aspect of the left forearm. Onset approximately 50 minutes ago while reviewing patient charts.",
                "Mild cold diaphoresis and slight dyspnea on minimal exertion. Pertinent history: Drug-eluting stent placed in my proximal LAD 4 years ago. Current medications: Clopidogrel 75mg, Metoprolol Succinate 50mg, Ramipril 5mg, Allopurinol 100mg.",
                "Given my prior angiographic anatomy and risk profile, I have already dispatched an assistant to bring the portable 12-lead ECG machine to my office. Likelihood of in-stent restenosis or acute coronary syndrome is high."
            ],
            5: [
                "Colleague, I have developed an acute monoarticular arthropathy of the right 1st metatarsophalangeal joint over the last 10 hours. Marked erythema, calor, and extreme allodynia. Serum uric acid was 8.4 mg/dL three months ago.",
                "Because I am on maintenance Clopidogrel and Ramipril, I must avoid high-dose NSAIDs to prevent renal hemodynamics compromise and gastrointestinal mucosal disruption.",
                "I am considering a short burst of oral Prednisolone or low-dose Colchicine. Please calculate optimal renal dosing."
            ]
        }
    ),

    10: PersonaDialogueProfile(
        persona_id=10,
        voice_archetype="Permaculture Organic Farmer & Yogi (Priyanka Rao, 36F)",
        pain_perception_type="Mindful / Somatic Doshic Lens (Averse to Synthetic Drugs)",
        pain_description_style="Visceral, grounded in digestive fire (Agni), natural cycles, and herbal balance.",
        vocabulary_and_tone="Serene, holistic, mindful, uses Sanskrit terms ('Agni', 'Vata', 'Ama', 'Pitta').",
        sample_dialogues={
            10: [
                "Namaste doctor. My digestive fire (Jatharagni) is severely disturbed. Since yesterday morning, I have had 11 profuse watery evacuations. My stomach is cramping in sharp waves, my tongue is coated white, and my mouth feels completely parched.",
                "I live on our organic farm in Coorg and eat only farm-grown produce, so this was likely a contaminated mountain spring water exposure. I feel lightheaded when I stand up from meditation.",
                "Doctor, I strictly do not consume synthetic pharmaceutical chemicals or antibiotics unless life-threatening. Please guide me with oral rehydration salts, tender coconut water, and classical Ayurvedic herbs like Kutaja or Bilva."
            ]
        }
    ),

    13: PersonaDialogueProfile(
        persona_id=13,
        voice_archetype="Elderly Railway Engineer in Nursing Home (Harbans Lal, 81M, Dementia & CHF)",
        pain_perception_type="Cognitively Distorted / Agitation-Mediated (Cannot Localize Pain Accurately)",
        pain_description_style="Confabulates railway memories; expresses distress through restlessness and confusion.",
        vocabulary_and_tone="Frail, gentle confusion, speaks of trains, tracks, and steam engines; needs family translation.",
        sample_dialogues={
            7: [
                "...Where is my green signal flag? The 4:15 passenger engine is waiting on platform 3... (Nursing staff: 'Babuji, tell the doctor where it hurts')... My belly feels tight, beta. Like the boiler pipes are full of gravel. When I try to pass water, it burns like coal embers. Who locked the carriage doors?",
                "...My daughter said I was shivering all night under three blankets. I couldn't remember where my spectacles were. My legs are swollen and cold. Did the Ambala train arrive yet?",
                "...I take six colored pills every morning in the nursing ward. The nurse crushed them in my porridge. My head feels cloudy, beta. Very cloudy."
            ],
            1: [
                "...The steam valve is stuck on the engine... my chest has a heavy iron coal sack on it. I can't catch my breath to blow the whistle... (Staff notes: Patient is pale, SpO2 88%, pulse irregular, pacing wheelchair restlessly).",
                "...My left shoulder aches from pulling the track levers in the cold wind... Beta, why is the room spinning? Call my daughter, tell her the railway shift is over..."
            ]
        }
    ),

    14: PersonaDialogueProfile(
        persona_id=14,
        voice_archetype="Clinical Psychologist with Fibromyalgia (Radhika Menon, 41F)",
        pain_perception_type="Central Sensitization / Allodynia (Amplified Neuro-Immune Pain Processing)",
        pain_description_style="Clinically articulate, highly descriptive of neuropathic burning, exhaustion, and brain fog.",
        vocabulary_and_tone="Psychological vocabulary, articulate, self-reflective, exhausted by chronic suffering.",
        sample_dialogues={
            3: [
                "Doctor, hello. My central nervous system has entered an acute hyperalgesic storm. What started as my baseline occipital neck tension has migrated into a throbbing 9/10 left temporal migraine. Pulsating behind my left orbit, with extreme photophobia and nausea.",
                "Because of my fibromyalgia, my pain processing is completely sensitized. Even my hair resting against my scalp feels like needles, and the humming of the air conditioner is excruciating.",
                "I am currently on Duloxetine 60mg and Pregabalin 75mg at night. I have Rizatriptan 10mg PRN, but took one 4 hours ago with minimal relief. Please evaluate if an alternative neuro-calming protocol or IV hydration is indicated."
            ]
        }
    ),

    15: PersonaDialogueProfile(
        persona_id=15,
        voice_archetype="High-Powered Real Estate Developer (Manish Chawla, 47M)",
        pain_perception_type="Acute Explosive Agony / Dramatic Expression",
        pain_description_style="Loud, urgent, colorful, expresses agony with physical metaphors ('blowtorch', 'hammer').",
        vocabulary_and_tone="Bravado mixed with genuine panic, Punjabi-Delhi business tone, dramatic.",
        sample_dialogues={
            5: [
                "Doctor sahab! Please save me, I am in absolute agony! Last night I closed a 25-crore land deal in Gurugram, celebrated with tandoori mutton chops, butter chicken, and 4 pegs of Black Label scotch. Woke up at 3 AM screaming—my right big toe is swollen to the size of an apple and glowing fiery purple-red!",
                "I am not a weak man, doctor sahab, but I literally have tears in my eyes! Even the air from the ceiling fan brushing against my toe makes me shriek in pain! It feels like someone poured boiling acid inside the joint and is hitting it with a sledgehammer!",
                "I took two Brufen tablets an hour ago but the pain is laughing at the Brufen! My blood uric acid was 9.8 mg/dL last time. Please give me an injection or whatever it takes to kill this fire!"
            ]
        }
    )
}


# ─────────────────────────────────────────────────────────────────────────────
# 2. CLINICAL CHATBOT & INTERACTIVE SIMULATION ENGINE
# ─────────────────────────────────────────────────────────────────────────────

class ClinicalChatSimulator:
    """
    Simulates authentic multi-turn clinical intake, cross-questioning,
    and diagnostic synthesis tailored to persona voice and pain profile.
    """

    @staticmethod
    def generate_doctor_turn_1(persona: ClinicalPersona, patient_msg: str, scenario: SymptomScenario) -> str:
        """Doctor Turn 1: Empathetic validation + focused inquiry into onset, character, and radiation."""
        p_name = persona.name.split()[0]
        
        # Paper-bag rebreathing check (Critical safety intercept per BTS guidelines)
        if "paper bag" in patient_msg.lower() or "rebreath" in patient_msg.lower():
            return (
                f"⚠️ URGENT SAFETY INTERCEPT: {p_name}, please STOP breathing into a paper bag immediately! "
                f"Rebreathing into a paper bag is medically dangerous—it can cause dangerous hypoxemia, hypercapnia, and mask serious organic conditions. "
                f"Take slow, gentle, unassisted breaths. Does your chest pain radiate into your jaw or left arm, and are you feeling faint?"
            )
        
        if scenario.id == 1:  # Chest pain
            if persona.age >= 60 or "coronary" in " ".join(persona.conditions).lower():
                return (
                    f"Hello {persona.name}. Please stay as still as possible and try to take slow, gentle breaths. "
                    f"I hear how heavy and pressing that chest discomfort feels right now. "
                    f"Could you tell me: does this pressure travel anywhere—such as down your left arm, into your jaw, neck, or back? "
                    f"And are you experiencing any cold sweating, dizziness, or shortness of breath?"
                )
            elif persona.age < 25 and persona.frailty_index <= 2:
                return (
                    f"Hello {p_name}. I understand that sudden chest stitch was alarming during your workout today. "
                    f"To pinpoint what's going on: does the pain become sharply worse when you take a deep breath or press with your fingers directly on your ribs? "
                    f"And does it stay strictly on your chest wall, or does it radiate into your shoulder or jaw?"
                )
            else:
                return (
                    f"Hello {p_name}. I can tell how distressing that chest sensation is for you right now. "
                    f"To evaluate this carefully: does the pain feel like a tight crushing pressure, or more like a sharp, burning sensation climbing up toward your throat? "
                    f"And did it start suddenly during exertion, or after eating or resting?"
                )

        elif scenario.id == 5:  # Gout / Toe pain
            return (
                f"Hello {persona.name}. I completely understand how excruciating that joint agony is—gout and acute joint inflammation are notoriously severe. "
                f"Please do not try to walk or bear weight on that foot. "
                f"Can you clarify: have you noticed any fever or chills? And have you taken any medications like Brufen or aspirin in the last few hours?"
            )

        elif scenario.id == 6:  # Upper GI Bleed
            return (
                f"Hello {persona.name}. Please sit or lie down immediately with legs elevated and do not attempt to walk or drive. "
                f"Vomiting dark coffee-ground material and passing black tarry stools are serious signs of acute upper gastrointestinal bleeding. "
                f"Are you feeling lightheaded, clammy, or dizzy? And exactly which painkiller or blood thinner tablets have you taken recently?"
            )

        elif scenario.id == 7:  # Pyelonephritis / UTI
            if persona.is_pregnant:
                return (
                    f"Hello {persona.name}. First, please take comfort that we are keeping you and your baby's complete safety as our top priority. "
                    f"With your high fever, shivering, and right flank pain, this points toward a kidney infection that requires prompt, pregnancy-safe treatment. "
                    f"Are you experiencing any nausea, vomiting, or abdominal contractions? And have you felt normal fetal movements today?"
                )
            else:
                return (
                    f"Hello {persona.name}. Shivering rigors paired with scalding urination and flank tenderness indicate that the infection has moved upward toward the kidney. "
                    f"Can you tell me: is the back pain constant or coming in waves? And are you able to keep oral fluids down without vomiting?"
                )

        elif scenario.id == 10:  # Diarrhea / Dehydration
            return (
                f"Hello {persona.name}. Losing fluids 10 to 12 times in a day places immense strain on your body and kidneys. "
                f"To protect your kidney function: are you experiencing dry mouth, muscle cramps in your calves, or dark, concentrated urine? "
                f"And if you are taking any regular daily prescription pills (especially diabetes or blood pressure medications), did you take them today?"
            )

        else:
            return (
                f"Hello {persona.name}. I hear how much distress these symptoms are causing you today. "
                f"To help narrow down the cause: exactly how long has this been going on, and does anything specific make it better or worse?"
            )

    @staticmethod
    def generate_doctor_turn_2(persona: ClinicalPersona, patient_msg: str, scenario: SymptomScenario) -> str:
        """Doctor Turn 2: Modalities, drug interactions, and red flag screening."""
        cond_str = " ".join(persona.conditions).lower()
        med_str = " ".join(persona.medications).lower()

        if scenario.id == 1:  # Chest pain
            if persona.age >= 60 or "diabetes" in cond_str or "hypertension" in cond_str:
                return (
                    f"Thank you for sharing those details. In someone with vascular risk factors, "
                    f"chest pressure accompanied by cold sweat and dizziness must be treated as a potential Acute Coronary Syndrome requiring hospital evaluation. "
                    f"A normal resting ECG alone cannot rule out acute coronary syndrome. "
                    f"Please do not drive yourself. Is someone nearby who can call 112/911 for an ambulance immediately?"
                )
            else:
                return (
                    f"Thank you for clarifying. While localized tenderness at the costochondral junction is characteristic of costochondritis or chest wall strain, "
                    f"exertional chest symptoms must never be assumed to have zero cardiac risk without a clinical examination and ECG. "
                    f"Rest from strenuous training, avoid lifting, and arrange a medical evaluation if symptoms do not promptly resolve."
                )

        elif scenario.id == 5:  # Gout
            if "kidney" in cond_str or "ckd" in cond_str:
                return (
                    f"This is a vital warning: because you have underlying kidney weakness (CKD), "
                    f"you MUST NOT take Brufen, Combiflam, Diclofenac, or any NSAIDs! They carry a severe hazard of precipitating acute kidney injury. "
                    f"Apply a cool ice pack wrapped in a cloth—avoid warm water soaking. Consult your physician for a renally safe anti-inflammatory."
                )
            else:
                return (
                    f"The acute nocturnal onset, fiery erythema, and exquisite allodynia in the 1st toe joint are classical for an acute gouty flare. "
                    f"Prior to confirming pure gout, we must exclude septic arthritis (screen for fever, skin breaks, or chills). "
                    f"Apply a cool ice pack for 15 minutes, elevate the joint, and avoid warm water soaking."
                )

        elif scenario.id == 6:  # Upper GI Bleed
            return (
                f"The combination of black tarry stool, coffee-ground vomitus, and postural dizziness indicates active internal gastrointestinal bleeding. "
                f"Do not eat, drink, or take oral pain medications right now. "
                f"Call 112 for an emergency ambulance immediately. Do NOT drive yourself, as sudden syncopal collapse from internal blood loss can occur."
            )

        elif scenario.id == 10:  # Diarrhea / Dehydration
            if "metformin" in med_str:
                return (
                    f"CRITICAL SICK-DAY RULE: Please STOP taking your Metformin immediately while you have dehydrating diarrhea! "
                    f"Continuing Metformin during acute dehydration carries an increased risk of serious Metformin-Associated Lactic Acidosis (MALA). "
                    f"With dark, scanty urine and postural dizziness, proceed to an emergency clinic for IV fluid evaluation. Sip WHO-ORS continuously."
                )
            else:
                return (
                    f"With frequent watery fluid loss and postural dizziness, immediate rehydration is critical to prevent pre-renal acute kidney injury. "
                    f"Begin sipping WHO-formula Oral Rehydration Salts (ORS) at 200-400ml after every loose stool. "
                    f"If you cannot keep fluids down or dizziness worsens, visit an urgent care clinic immediately for IV fluid assessment."
                )

        else:
            return (
                f"Thank you. Based on the progression and your medical background, "
                f"I am now cross-referencing your symptoms with your baseline profile to build your personalized assessment and remedy plan."
            )

    @classmethod
    def run_multi_turn_simulation(cls, persona: ClinicalPersona, scenario: SymptomScenario, interactive_pause: bool = True):
        """Executes a realistic 3-turn patient-doctor consultation."""
        profile = PERSONA_PROFILES.get(persona.id, None)

        console.print("\n")
        console.rule(f"[bold cyan]CONSULTATION CHAT: {persona.name.upper()} ➔ {scenario.title.upper()}[/bold cyan]")
        
        # Persona Voice Card
        if profile:
            info_text = (
                f"[bold]Voice Archetype:[/bold] {profile.voice_archetype}\n"
                f"[bold]Pain Perception Lens:[/bold] [yellow]{profile.pain_perception_type}[/yellow]\n"
                f"[bold]Communication Style:[/bold] {profile.pain_description_style}"
            )
            console.print(Panel(info_text, title=f"🎭 Patient Psychological & Somatic Profile", box=box.ROUNDED, border_style="cyan"))

        # Obtain dialogue turns
        dialogues = profile.sample_dialogues.get(scenario.id, None) if profile else None
        if not dialogues:
            # Fallback natural dialogues
            dialogues = [
                f"Doctor, I have been having {scenario.chief_complaint} for {scenario.duration}. It is really bothering me.",
                f"It feels constant and is affecting my daily routine. My pain is about 6 or 7 out of 10.",
                f"I haven't taken any major pills yet. What do you recommend?"
            ]

        # ── TURN 1 ────────────────────────────────────────────────────────────
        console.print(f"\n[bold green]👤 {persona.name} (Patient):[/bold green]")
        console.print(Panel(f"[italic]{dialogues[0]}[/italic]", box=box.ROUNDED, border_style="green"))
        if interactive_pause:
            Prompt.ask("[dim]Press Enter for Doctor's response...[/dim]", default="")

        doc_turn_1 = cls.generate_doctor_turn_1(persona, dialogues[0], scenario)
        console.print(f"\n[bold cyan]🩺 Arovia Health Assistant:[/bold cyan]")
        console.print(Panel(doc_turn_1, box=box.ROUNDED, border_style="cyan"))
        if interactive_pause:
            Prompt.ask("[dim]Press Enter for Patient's follow-up reply...[/dim]", default="")

        # ── TURN 2 ────────────────────────────────────────────────────────────
        console.print(f"\n[bold green]👤 {persona.name} (Patient):[/bold green]")
        console.print(Panel(f"[italic]{dialogues[1]}[/italic]", box=box.ROUNDED, border_style="green"))
        if interactive_pause:
            Prompt.ask("[dim]Press Enter for Doctor's follow-up analysis...[/dim]", default="")

        doc_turn_2 = cls.generate_doctor_turn_2(persona, dialogues[1], scenario)
        console.print(f"\n[bold cyan]🩺 Arovia Health Assistant:[/bold cyan]")
        console.print(Panel(doc_turn_2, box=box.ROUNDED, border_style="cyan"))
        if interactive_pause:
            Prompt.ask("[dim]Press Enter for Patient's final reply & clinical synthesis...[/dim]", default="")

        # ── TURN 3 ────────────────────────────────────────────────────────────
        console.print(f"\n[bold green]👤 {persona.name} (Patient):[/bold green]")
        console.print(Panel(f"[italic]{dialogues[2]}[/italic]", box=box.ROUNDED, border_style="green"))
        if interactive_pause:
            Prompt.ask("[dim]Press Enter to trigger Final Assessment & Multi-Modal Plan...[/dim]", default="")

        # ── FINAL ASSESSMENT SYNTHESIS ────────────────────────────────────────
        res = ClinicalImpactEngine.simulate(persona, scenario)
        from persona_terminal import TerminalRenderer
        TerminalRenderer.render_simulation_report(res)


# ─────────────────────────────────────────────────────────────────────────────
# 3. BATCH STRESS-TEST: PERSON-BY-PERSON ACROSS DISEASES
# ─────────────────────────────────────────────────────────────────────────────

def run_person_by_person_suite(export_markdown: bool = False):
    """
    Tests diverse acute diseases person-by-person across all personas,
    highlighting the contrast in pain reporting and writing styles.
    """
    console.print("\n")
    console.rule("[bold cyan]🚀 RUNNING FULL PERSON-BY-PERSON CLINICAL CHAT STRESS TEST[/bold cyan]")
    console.print("[dim white]Simulating realistic patient conversations showing how distinct people perceive pain and describe symptoms differently.[/dim white]\n")

    transcripts_md = [
        "# Arovia / Healio.AI — Multi-Persona Clinical Chat & Pain Perception Transcripts",
        "> Complete conversational test suite demonstrating how diverse patient profiles, pain thresholds, and writing styles interact with the clinical engine.\n"
    ]

    # Select representative pairing of personas and diseases
    test_cases = [
        (1, 1, "Ramesh Sharma (#1, 68M Diabetic) with Crushing Chest Pain (Silent Ischemia / Gas Attribution)"),
        (5, 1, "Vikramaditya Rathore (#5, 19M Athlete) with Crushing Chest Pain (Biomechanical Costochondritis)"),
        (8, 1, "Karthik Roy (#8, 28M Bartender) with Chest Pain (Acid Reflux Lava vs Aspirin Allergy)"),
        (2, 3, "Aanya Sen (#2, 23F Software Dev) with Migraine Aura (Smartwatch Panic & Tech Strain)"),
        (14, 3, "Radhika Menon (#14, 41F Psychologist) with Migraine (Central Sensitization & Allodynia)"),
        (15, 5, "Manish Chawla (#15, 47M Real Estate Broker) with 3 AM Big Toe Agony (Scotch/Mutton Gout)"),
        (1, 5, "Ramesh Sharma (#1, 68M CKD Diabetic) with Big Toe Pain (The Fatal Brufen Trap)"),
        (3, 6, "Gurpreet Singh (#3, 42M Trucker) with Coffee-Ground Vomit (Chronic Ibuprofen Bleeding Ulcer)"),
        (4, 7, "Meera Nambiar (#4, 32F Pregnant 26w) with Pyelonephritis (Fetal Protection & Penicillin Allergy)"),
        (10, 10, "Priyanka Rao (#10, 36F Organic Yogi) with Diarrhea (Natural Agni & Herbal Rehydration)"),
        (1, 10, "Ramesh Sharma (#1, 68M Diabetic) with Diarrhea (Pre-Renal AKI & Metformin Poisoning)"),
        (13, 7, "Harbans Lal (#13, 81M Dementia Grandpa) with Urosepsis (Confusion & Steam Engine Hallucination)"),
        (5, 8, "Vikramaditya (#5, 19M Athlete) with Cold-Air Wheezing (Exercise-Induced Asthma)"),
        (11, 8, "Anand Joshi (#11, 54M Dye Mill Foreman) with Severe Wheezing (30y Byssinosis & Samter's Allergy)")
    ]

    for p_id, sc_id, description in test_cases:
        p = next(pers for pers in PERSONAS if pers.id == p_id)
        sc = next(s for s in SYMPTOM_SCENARIOS if s.id == sc_id)
        prof = PERSONA_PROFILES.get(p_id)

        console.print(f"\n[bold yellow]═══ TEST CASE: {description} ═══[/bold yellow]")
        res = ClinicalImpactEngine.simulate(p, sc)
        top_d = res.bayesian_differentials[0]

        # Extract dialogues
        dialogues = prof.sample_dialogues.get(sc_id, [
            f"Doctor, I have {sc.chief_complaint}.",
            f"It's about 7/10 pain. What should I do?",
            f"Please help me."
        ]) if prof else ["Symptom onset", "Followup", "Treatment request"]

        doc_t1 = ClinicalChatSimulator.generate_doctor_turn_1(p, dialogues[0], sc)
        doc_t2 = ClinicalChatSimulator.generate_doctor_turn_2(p, dialogues[1], sc)

        # Print brief conversational transcript
        console.print(f"[bold green]{p.name} ({p.age}y):[/bold green] [italic]\"{dialogues[0][:110]}...\"[/italic]")
        console.print(f"[bold cyan]AI Doctor:[/bold cyan] \"{doc_t1[:110]}...\"")
        console.print(f"[bold green]{p.name}:[/bold green] [italic]\"{dialogues[1][:110]}...\"[/italic]")
        console.print(f"[bold cyan]AI Doctor:[/bold cyan] \"{doc_t2[:110]}...\"")
        console.print(f"[bold magenta]➔ Triage:[/bold magenta] [{res.triage_color}]{res.triage_level}[/] | [bold]Diagnosis:[/bold] {top_d['disease']} ({top_d['posterior_pct']}%, mult: {top_d['multiplier']}x)")
        if res.ddi_contraindications and "None" not in res.ddi_contraindications[0] and "✓" not in res.ddi_contraindications[0]:
            console.print(f"[bold red]➔ Safety Guard:[/bold red] {res.ddi_contraindications[0]}")

        # Add to Markdown report
        transcripts_md.append(f"## Test Case: {description}")
        transcripts_md.append(f"**Patient Persona:** #{p.id} {p.name} ({p.age}y {p.sex.capitalize()}) — *{p.occupation}*  ")
        transcripts_md.append(f"**Pain Perception Style:** {prof.pain_perception_type if prof else 'Standard'}  ")
        transcripts_md.append(f"**Writing Style:** {prof.pain_description_style if prof else 'Direct'}\n")
        
        transcripts_md.append(f"> **👤 {p.name}:** *\"{dialogues[0]}\"*\n")
        transcripts_md.append(f"> **🩺 AI Doctor:** \"{doc_t1}\"\n")
        transcripts_md.append(f"> **👤 {p.name}:** *\"{dialogues[1]}\"*\n")
        transcripts_md.append(f"> **🩺 AI Doctor:** \"{doc_t2}\"\n")
        transcripts_md.append(f"> **👤 {p.name}:** *\"{dialogues[2]}\"*\n")

        transcripts_md.append(f"### Clinical Synthesis & Engine Results:")
        transcripts_md.append(f"* **Triage Urgency:** **{res.triage_level}**")
        transcripts_md.append(f"* **Top Diagnosis:** {top_d['disease']} (Posterior: **{top_d['posterior_pct']}%**, Covariate Multiplier: **{top_d['multiplier']}x**)")
        transcripts_md.append(f"* **Organ Burden:** Cardio: {res.organ_burden['cardiovascular']}% | Renal: {res.organ_burden['renal_metabolic']}% | Resp: {res.organ_burden['respiratory']}%")
        transcripts_md.append(f"* **Primary Safety / DDI Alert:** `{res.ddi_contraindications[0] if res.ddi_contraindications else 'None'}`\n")
        transcripts_md.append("---\n")

    if export_markdown:
        out_path = ROOT_DIR / "output" / "persona_chat_transcripts.md"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text("\n".join(transcripts_md), encoding="utf-8")
        console.print(f"\n[bold green]✓ Full Chat Transcripts successfully exported to: {out_path}[/bold green]")


# ─────────────────────────────────────────────────────────────────────────────
# 4. MAIN INTERACTIVE CLI LOOP
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Arovia Multi-Persona Clinical Chat Simulator")
    parser.add_argument("--batch", action="store_true", help="Run full person-by-person disease chat test suite")
    parser.add_argument("--persona", type=int, default=1, help="Persona ID (1-18)")
    parser.add_argument("--symptom", type=int, default=1, help="Symptom Scenario ID (1-12)")
    parser.add_argument("--export", action="store_true", help="Export chat transcripts to output/persona_chat_transcripts.md")
    parser.add_argument("--no-pause", action="store_true", help="Run simulation without turn-by-turn pauses")

    args = parser.parse_args()

    if args.batch or args.export:
        run_person_by_person_suite(export_markdown=True)
        return

    if "--persona" in sys.argv:
        p = next((pers for pers in PERSONAS if pers.id == args.persona), PERSONAS[0])
        s = next((sc for sc in SYMPTOM_SCENARIOS if sc.id == args.symptom), SYMPTOM_SCENARIOS[0])
        ClinicalChatSimulator.run_multi_turn_simulation(p, s, interactive_pause=not args.no_pause)
        return

    # Interactive Menu
    while True:
        console.print("\n")
        console.rule("[bold cyan]💬 AROVIA MULTI-PERSONA CLINICAL CHAT SIMULATOR[/bold cyan]")
        console.print("[bold yellow]CHOOSE AN INTERACTIVE CHAT MODE:[/bold yellow]")
        console.print("[1] 🎭 Live Persona Consultation Chat (Watch Persona talk to AI Doctor turn-by-turn)")
        console.print("[2] 🚀 Run Person-by-Person Disease Test Suite (All personas & distinct pain styles)")
        console.print("[3] 💾 Export All Multi-Turn Chat Transcripts to Markdown")
        console.print("[4] 🚪 Exit")

        c = Prompt.ask("\nSelect Mode", choices=["1", "2", "3", "4"], default="1")

        if c == "1":
            from persona_terminal import TerminalRenderer
            TerminalRenderer.render_persona_summary_table(PERSONAS)
            p_id = IntPrompt.ask("\nSelect Patient ID (1-18)", default=1)
            p = next((pers for pers in PERSONAS if pers.id == p_id), PERSONAS[0])

            console.print("\n[bold cyan]Select Disease / Symptom Scenario:[/bold cyan]")
            for sc in SYMPTOM_SCENARIOS:
                console.print(f"  [{sc.id}] {sc.title}")
            sc_id = IntPrompt.ask("Choose Scenario ID", default=1)
            sc = next((s for s in SYMPTOM_SCENARIOS if s.id == sc_id), SYMPTOM_SCENARIOS[0])

            ClinicalChatSimulator.run_multi_turn_simulation(p, sc, interactive_pause=True)
            Prompt.ask("\nPress Enter to return to menu...")

        elif c == "2":
            run_person_by_person_suite(export_markdown=False)
            Prompt.ask("\nPress Enter to return to menu...")

        elif c == "3":
            run_person_by_person_suite(export_markdown=True)
            Prompt.ask("\nPress Enter to return to menu...")

        elif c == "4":
            console.print("[bold cyan]Exiting Persona Chat Simulator. Goodbye![/bold cyan]")
            break


if __name__ == "__main__":
    main()
