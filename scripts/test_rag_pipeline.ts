import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Load Environment directly assuming execution from cwd
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// We use the same model as the backend with Key Rotation to avoid 429 errors
const apiKeys = (process.env.GEMINI_API_KEYS?.split(',') || [process.env.GEMINI_API_KEY || '']).map(k => k.trim()).filter(Boolean);
let currentClientIndex = 0;
let ai = new GoogleGenAI({ apiKey: apiKeys[0] });

async function generateEmbedding(text: string): Promise<number[] | null> {
    for (let attempts = 0; attempts < apiKeys.length; attempts++) {
        try {
            const embResp = await ai.models.embedContent({
                model: 'gemini-embedding-2-preview',
                contents: text,
            });
            return embResp.embeddings?.[0]?.values ?? null;
        } catch (e: any) {
            const errString = String(e.message || e);
            if (errString.includes('429') || errString.includes('quota') || errString.includes('limit')) {
                currentClientIndex = (currentClientIndex + 1) % apiKeys.length;
                ai = new GoogleGenAI({ apiKey: apiKeys[currentClientIndex] });
                console.log(`  🔄 Key hit quota limit. Switching to key ${currentClientIndex + 1}/${apiKeys.length}...`);
            } else {
                console.error("Embedding Error Unrelated to Quota:", e);
                return null;
            }
        }
    }
    console.error("🛑 All available API keys have exhausted their daily quota.");
    return null;
}

// Simulated RAG Functions exactly as they run on the server
async function fetchBoerickeContext(embedding: number[]): Promise<string> {
    const { data } = await supabase.rpc('match_boericke_embeddings', {
        query_embedding: embedding,
        match_threshold: 0.70,
        match_count: 3,
    });
    if (!data?.length) return '*No Homeopathic matches found above threshold.*';
    return (data as any[])
        .map((c: any, i: number) => `**[${i + 1}] ${c.remedy_name}** *(Relevance: ${((c.similarity ?? 0) * 100).toFixed(1)}%)*\n> ${c.chunk_text.substring(0, 300).replace(/\\n/g, ' ')}...`)
        .join('\n\n');
}

async function fetchAyurvedicContext(embedding: number[]): Promise<string> {
    const { data } = await supabase.rpc('search_ayurvedic_knowledge', {
        query_embedding: embedding,
        match_threshold: 0.65,
        match_count: 3,
    });
    if (!data?.length) return '*No Ayurvedic matches found above threshold.*';
    return (data as any[])
        .map((c: any, i: number) => `**[${i + 1}] ${c.book} / ${c.category}** *(Relevance: ${((c.similarity ?? 0) * 100).toFixed(1)}%)*\n> ${c.text.substring(0, 300).replace(/\\n/g, ' ')}...`)
        .join('\n\n');
}

// ─────────────────────────────────────────────────────────────
// TEST CASES  (40 total — 15 original + 25 new)
// Categories: Infectious · GI · Respiratory · Metabolic ·
//             Musculoskeletal · Dermatological · Neurological ·
//             Psychiatric · Cardiovascular · Autoimmune ·
//             Women's Health · Pediatric · Renal · ENT · Eyes
// ─────────────────────────────────────────────────────────────
const TEST_CASES = [
    // ── ORIGINAL 15 ──────────────────────────────────────────
    {
        name: "Severe Dengue Fever",
        symptoms: "High fever 104F, severe bone breaking joint pain, retro-orbital pain behind eyes, scattered petechial rash, severe exhaustion."
    },
    {
        name: "Acute Appendicitis",
        symptoms: "Severe sharp pain starting near the belly button and moving to the lower right abdomen, nausea, inability to pass gas, rebound tenderness at McBurney's point."
    },
    {
        name: "Pneumonia",
        symptoms: "High fever with chills, productive cough with greenish-yellow sputum, sharp pleuritic chest pain when breathing deeply, shortness of breath, profound fatigue."
    },
    {
        name: "Urinary Tract Infection (UTI)",
        symptoms: "Intense burning sensation while passing urine, frequent urge to urinate but only drops come out, cloudy and strong-smelling urine, mild lower pelvic pain."
    },
    {
        name: "Acid Reflux / GERD",
        symptoms: "Burning sensation in the chest behind breastbone usually after eating, sour taste in the back of the throat, frequent burping, worsened when lying down."
    },
    {
        name: "Hypothyroidism",
        symptoms: "Unexplained weight gain, extreme lethargy, feeling constantly cold, dry skin, thinning hair, constipation, brain fog."
    },
    {
        name: "Gout Attack",
        symptoms: "Sudden, severe, extremely painful swelling in the big toe joint. Red, hot, and highly sensitive to even the touch of a bedsheet."
    },
    {
        name: "Polycystic Ovary Syndrome (PCOS)",
        symptoms: "Irregular menstrual cycles, abnormal facial hair growth, sudden acne breakouts along jawline, weight gain around abdomen, male-pattern hair thinning."
    },
    {
        name: "Migraine with Aura",
        symptoms: "Throbbing severe pain on one side of the head, extreme sensitivity to light and sound, preceded by flashing lights in vision, accompanied by nausea."
    },
    {
        name: "Kidney Stones",
        symptoms: "Excruciating colicky pain in the lower back flank radiating to the groin, visible hematuria (blood in urine), inability to find a comfortable position, severe nausea."
    },
    {
        name: "Eczema (Atopic Dermatitis)",
        symptoms: "Intensely itchy, red, inflamed patches of skin on the inside of elbows and backs of knees. Skin is dry, leathery, and sometimes oozes clear fluid when scratched."
    },
    {
        name: "Psoriasis",
        symptoms: "Thick red plaques covered with silvery scales on elbows, knees, and scalp. Joints sometimes feel stiff and swollen."
    },
    {
        name: "Insomnia",
        symptoms: "Difficulty falling asleep, frequently waking up at 3 AM and unable to go back to sleep. Racing mind with anxiety and physical restlessness."
    },
    {
        name: "Liver Cirrhosis / Jaundice",
        symptoms: "Yellowing of the skin and whites of the eyes, dark urine, pale stools, severe abdominal swelling (ascites), chronic fatigue."
    },
    {
        name: "Asthma Attack",
        symptoms: "Severe wheezing on expiration, shortness of breath, tightening of the chest, feeling like breathing through a straw, worsened by cold air."
    },

    // ── NEW 25 ───────────────────────────────────────────────

    // Infectious / Viral
    {
        name: "Typhoid Fever",
        symptoms: "Sustained high-grade fever rising in a step-ladder pattern, relative bradycardia, rose spots on the abdomen, severe headache, constipation followed by diarrhea, coated tongue with red edges."
    },
    {
        name: "Malaria (Plasmodium vivax)",
        symptoms: "Cyclical fever every 48 hours with chills and rigors, profuse sweating after fever breaks, severe headache, nausea, splenomegaly, extreme fatigue between episodes."
    },
    {
        name: "Chickenpox (Varicella)",
        symptoms: "Widespread itchy vesicular rash appearing in crops on the trunk, face, and scalp, low-grade fever, general malaise, lesions at different stages simultaneously — macules, papules, vesicles, and crusts."
    },

    // Gastrointestinal
    {
        name: "Irritable Bowel Syndrome (IBS)",
        symptoms: "Alternating constipation and diarrhea, cramping abdominal pain relieved after defecation, sensation of incomplete bowel emptying, excessive bloating and flatulence, symptoms worsened by stress."
    },
    {
        name: "Acute Gastroenteritis",
        symptoms: "Sudden onset of watery diarrhea multiple times a day, projectile vomiting, severe cramping abdominal pain, mild fever, signs of dehydration such as dry mouth and decreased urination."
    },
    {
        name: "Peptic Ulcer Disease",
        symptoms: "Gnawing or burning epigastric pain that is relieved by eating or antacids, pain worsens on an empty stomach and at night, occasional nausea, loss of appetite, tarry black stools indicating bleeding."
    },

    // Cardiovascular
    {
        name: "Hypertension (High Blood Pressure)",
        symptoms: "Persistent throbbing headache at the back of the head especially in the morning, dizziness, blurred vision, occasional nosebleeds, palpitations, shortness of breath on mild exertion."
    },
    {
        name: "Angina Pectoris",
        symptoms: "Pressure-like chest pain radiating to the left arm and jaw, triggered by physical exertion or emotional stress, relieved within minutes of rest, accompanied by mild breathlessness and sweating."
    },
    {
        name: "Iron-Deficiency Anemia",
        symptoms: "Extreme fatigue and weakness, unusually pale skin and inner eyelids, shortness of breath on exertion, brittle spoon-shaped nails, craving for ice or clay (pica), frequent headaches and dizziness."
    },

    // Neurological
    {
        name: "Epilepsy (Tonic-Clonic Seizure)",
        symptoms: "Sudden loss of consciousness, violent rhythmic jerking of all four limbs, eyes rolling back, jaw clenching, urinary incontinence during event, postictal confusion and deep sleep lasting up to an hour after the episode."
    },
    {
        name: "Vertigo (BPPV)",
        symptoms: "Sudden severe spinning sensation triggered by specific head movements such as rolling over in bed, associated nausea and vomiting, nystagmus, lasts seconds to minutes, no hearing loss."
    },
    {
        name: "Parkinson's Disease (Early Stage)",
        symptoms: "Resting tremor in one hand described as pill-rolling, stiffness and rigidity in the arm and leg on one side, shuffling gait with reduced arm swing, soft monotone voice, loss of facial expression, micrographia."
    },

    // Psychiatric / Mental Health
    {
        name: "Major Depressive Disorder",
        symptoms: "Persistent low mood and hopelessness lasting over two weeks, loss of interest in previously enjoyed activities, significant weight loss, sleeping too much or too little, inability to concentrate, feelings of worthlessness."
    },
    {
        name: "Generalized Anxiety Disorder (GAD)",
        symptoms: "Excessive uncontrollable worry about multiple areas of life, muscle tension, chronic restlessness and edginess, fatigue, irritability, difficulty concentrating, sleep disturbances persisting for months."
    },
    {
        name: "Panic Disorder",
        symptoms: "Sudden intense episodes of heart palpitations, shortness of breath, chest tightness, tingling in hands and face, dizziness, overwhelming sense of impending doom and fear of dying, lasting 5–20 minutes."
    },

    // Autoimmune / Systemic
    {
        name: "Rheumatoid Arthritis",
        symptoms: "Symmetrical swelling, warmth, and tenderness of small joints of both hands and feet, prolonged morning stiffness lasting more than an hour, fatigue, low-grade fever, and deformity of finger joints over time."
    },
    {
        name: "Systemic Lupus Erythematosus (SLE)",
        symptoms: "Butterfly-shaped rash across the cheeks and nose, joint pain and swelling, oral ulcers, sensitivity to sunlight causing skin flares, fatigue, hair loss, and intermittent fever without infection."
    },
    {
        name: "Type 1 Diabetes (Acute Presentation)",
        symptoms: "Extreme thirst and frequent urination, rapid unexplained weight loss despite increased appetite, blurred vision, fruity-smelling breath, persistent fatigue, nausea, abdominal pain."
    },

    // Women's Health
    {
        name: "Endometriosis",
        symptoms: "Severely painful menstrual cramps that worsen over time, chronic pelvic pain, pain during intercourse and bowel movements, heavy menstrual bleeding, infertility, and fatigue."
    },
    {
        name: "Menopause",
        symptoms: "Hot flashes and night sweats, vaginal dryness and discomfort during intercourse, irregular or absent periods, mood swings and irritability, difficulty sleeping, joint aches, and gradual weight gain."
    },

    // Pediatric
    {
        name: "Childhood Asthma",
        symptoms: "Recurrent nighttime or early morning coughing, wheezing, shortness of breath during play or exercise, chest tightness, symptoms worsen in cold air or near allergens like dust and pet dander."
    },
    {
        name: "Hand, Foot and Mouth Disease",
        symptoms: "Painful mouth sores on tongue and inner cheeks making eating difficult, flat red spots progressing to blisters on the palms and soles of feet, low-grade fever, irritability, and reduced appetite in a young child."
    },

    // Renal / Urological
    {
        name: "Chronic Kidney Disease (CKD)",
        symptoms: "Decreased and frothy urine output, persistent puffiness around the eyes and swelling in ankles, high blood pressure, fatigue, loss of appetite, itchy skin, and muscle cramps at night."
    },

    // ENT
    {
        name: "Acute Sinusitis",
        symptoms: "Severe pressure and pain in the forehead and cheekbones, thick yellow-green nasal discharge, nasal congestion, reduced sense of smell, post-nasal drip causing sore throat, toothache in the upper jaw."
    },
    {
        name: "Allergic Rhinitis",
        symptoms: "Repeated sneezing especially in the morning, profuse clear watery nasal discharge, intense itching of the nose, eyes, and roof of the mouth, nasal congestion, and red watery eyes triggered by dust, pollen, or pet dander."
    },

    // Eyes
    {
        name: "Acute Angle-Closure Glaucoma",
        symptoms: "Sudden severe pain in one eye, rapid vision blurring with halos around lights, nausea and vomiting, rock-hard eyeball on palpation, headache on the same side, cornea appears cloudy."
    },
];

async function runTests() {
    console.log(`🚀 Starting Aggressive RAG Quality Testing Engine...`);
    console.log(`📋 Total test cases: ${TEST_CASES.length}\n`);

    let markdownOutput = `# Healio.AI RAG Detection Quality Report\n\n`;
    markdownOutput += `*Generated automatically by parsing core symptoms through the Vector Brain.*\n\n`;
    markdownOutput += `**Total Test Cases:** ${TEST_CASES.length}\n\n`;
    markdownOutput += `---\n\n`;

    for (const [idx, test] of TEST_CASES.entries()) {
        console.log(`[${idx + 1}/${TEST_CASES.length}] Testing: ${test.name}...`);
        markdownOutput += `## 🩺 Test ${idx + 1}: **${test.name}**\n`;
        markdownOutput += `**User Input (Symptoms):** *"${test.symptoms}"*\n\n`;

        const embedding = await generateEmbedding(test.symptoms);
        if (!embedding) {
            markdownOutput += `> 🛑 **Error:** Failed to generate embedding.\n\n`;
            continue;
        }

        const [boericke, ayurveda] = await Promise.all([
            fetchBoerickeContext(embedding),
            fetchAyurvedicContext(embedding)
        ]);

        markdownOutput += `### 🌿 Ayurvedic & Botanical Matches (Planet Ayurveda / Ancient Texts)\n`;
        markdownOutput += `${ayurveda}\n\n`;

        markdownOutput += `### 💊 Homeopathic Matches (Boericke's Materia Medica)\n`;
        markdownOutput += `${boericke}\n\n`;

        markdownOutput += `---\n\n`;
    }

    const outputPath = 'artifacts/QA_RAG_Test_Results.md';
    fs.mkdirSync('artifacts', { recursive: true });
    fs.writeFileSync(outputPath, markdownOutput, 'utf-8');
    console.log(`\n✅ Fully generated QA Report at: ${outputPath}`);
}

runTests();