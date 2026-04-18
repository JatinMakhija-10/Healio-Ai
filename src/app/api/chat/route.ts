import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { AI_PHASE_CONFIG } from '@/lib/ai/config';

// ── Vercel: allow up to 60 s for this Serverless Function ─────────────────────
export const maxDuration = 60;

// ── Shared: build a Supabase service-role client ─────────────────────────────
function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''
    );
}

// ── Generate embedding via Gemini (768-dim) — used for Boericke & Ayurvedic ───
// Hardened: internal 8 s abort so a Gemini API stall never hangs the whole request
async function generateEmbedding(text: string): Promise<number[] | null> {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || !text) return null;
    try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const embResp = await Promise.race([
            ai.models.embedContent({ model: AI_PHASE_CONFIG.models.embedding, contents: text }),
            new Promise<never>((_, rej) => setTimeout(() => rej(new Error('embed-768-timeout')), 8_000)),
        ]);
        return (embResp as Awaited<ReturnType<typeof ai.models.embedContent>>).embeddings?.[0]?.values ?? null;
    } catch {
        return null;
    }
}

// ── Generate embedding via Gemini (3072-dim) — used for home_remedy_embeddings ─
// home_remedy_embeddings was ingested with gemini-embedding-001 which produces 3072-dim vectors
async function generateEmbedding3072(text: string): Promise<number[] | null> {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || !text) return null;
    try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        // Hard 3s timeout — this model is slower; fail fast rather than block the stream
        const embResp = await Promise.race([
            ai.models.embedContent({ model: 'gemini-embedding-001', contents: text }),
            new Promise<never>((_, rej) => setTimeout(() => rej(new Error('embed-3072-timeout')), 3_000)),
        ]);
        return (embResp as Awaited<ReturnType<typeof ai.models.embedContent>>).embeddings?.[0]?.values ?? null;
    } catch {
        return null;
    }
}

// ── RAG: Homeopathic (Boericke's Materia Medica) ───────────────────────────
// Deduplicates by remedy_name — keeps only the highest-similarity chunk per remedy
async function fetchBoerickeContext(embedding: number[]): Promise<string> {
    try {
        const supabase = getServiceClient();
        const { data } = await supabase.rpc('match_boericke_embeddings', {
            query_embedding: embedding,
            match_threshold: 0.72,
            match_count: 10,
        });
        if (!data?.length) return '';

        // Deduplicate: keep only the HIGHEST-similarity chunk per remedy
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const seen = new Map<string, any>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const row of data as any[]) {
            const key = (row.remedy_name ?? '').toLowerCase().trim();
            if (!key) continue;
            if (!seen.has(key) || (row.similarity ?? 0) > (seen.get(key).similarity ?? 0)) {
                seen.set(key, row);
            }
        }

        return [...seen.values()]
            .filter(c => (c.similarity ?? 0) >= 0.72)
            .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
            .slice(0, 5)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((c: any, i: number) =>
                `[${i + 1}] REMEDY: ${c.remedy_name} | relevance: ${((c.similarity ?? 0) * 100).toFixed(0)}%\n${c.chunk_text}`
            ).join('\n\n');
    } catch {
        return '';
    }
}

// ── RAG: Ayurvedic Classical Texts ──────────────────────────────────────────
// Sources: Planet Ayurveda books, CCRAS e-books, classical Sanskrit texts
// IMPORTANT: These are FORMAL Ayurvedic medicines — herbs, formulations, decoctions
// that require purchase from an Ayurvedic pharmacy. NOT kitchen shelf items.
async function fetchAyurvedicContext(embedding: number[]): Promise<string> {
    try {
        const supabase = getServiceClient();
        const { data } = await supabase.rpc('search_ayurvedic_knowledge', {
            query_embedding: embedding,
            match_threshold: 0.60,
            match_count: 12,
        });
        if (!data?.length) return '';

        // Deduplicate: keep one entry per unique source+section combination
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const seen = new Map<string, any>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const row of data as any[]) {
            const key = `${row.book ?? ''}|${row.section ?? ''}`.toLowerCase().trim();
            if (!key || key === '|') continue;
            if (!seen.has(key) || (row.similarity ?? 0) > (seen.get(key).similarity ?? 0)) {
                seen.set(key, row);
            }
        }

        return [...seen.values()]
            .filter(c => (c.similarity ?? 0) >= 0.60)
            .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
            .slice(0, 6)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((c: any, i: number) =>
                `[${i + 1}] SOURCE: ${c.book} | SECTION: ${c.section ?? 'General'} | relevance: ${((c.similarity ?? 0) * 100).toFixed(0)}%\n${c.text}`
            ).join('\n\n');
    } catch {
        return '';
    }
}

// ── RAG: Home Remedies (Dadi-Nani ke Nuskhe) ─────────────────────────────────
// Source: nuskhe.json — 1,051 traditional household remedies
// IMPORTANT: These are IMMEDIATE kitchen-shelf remedies — haldi, adrak, tulsi,
// shahad, nimbu, ajwain, jeera, pudina, lahsun. No pharmacy needed.
async function fetchHomeRemedyContext(embedding3072: number[] | null): Promise<string> {
    if (!embedding3072) return '';
    try {
        const supabase = getServiceClient();
        const { data, error } = await supabase.rpc('match_home_remedy_embeddings', {
            query_embedding: embedding3072,
            match_threshold: 0.58,
            match_count: 8,
        });
        if (error) {
            console.error('[RAG] home_remedy_embeddings RPC error:', error.message);
            return '';
        }
        if (!data?.length) return '';

        // Deduplicate by ailment+remedy_name
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const seen = new Map<string, any>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const row of data as any[]) {
            const key = `${row.ailment ?? ''}|${row.remedy_name ?? ''}`.toLowerCase().trim();
            if (!seen.has(key) || (row.similarity ?? 0) > (seen.get(key).similarity ?? 0)) {
                seen.set(key, row);
            }
        }

        return [...seen.values()]
            .filter(c => (c.similarity ?? 0) >= 0.58)
            .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
            .slice(0, 5)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((c: any, i: number) => {
                const nameHindi = c.remedy_name_hindi ? ` / ${c.remedy_name_hindi}` : '';
                const ailmentHindi = c.ailment_hindi ? ` (${c.ailment_hindi})` : '';
                return [
                    `[${i + 1}] AILMENT: ${c.ailment}${ailmentHindi} | NUSKHA: ${c.remedy_name}${nameHindi} | relevance: ${((c.similarity ?? 0) * 100).toFixed(0)}%`,
                    c.chunk_text,
                ].join('\n');
            }).join('\n\n');
    } catch (e) {
        console.error('[RAG] Home remedy fetch error:', e);
        return '';
    }
}


// ── Parallelised multi-source RAG ─────────────────────────────────────────────
async function fetchAllContext(symptomSummary: string, skipHomeRemedies = false): Promise<{ context: string; homeRemediesAvailable: boolean }> {
    try {
        const [embedding, embedding3072] = await Promise.all([
            generateEmbedding(symptomSummary),
            skipHomeRemedies ? Promise.resolve(null) : generateEmbedding3072(symptomSummary),
        ]);
        if (!embedding) return { context: '', homeRemediesAvailable: false };

        const [homeopathicRaw, ayurvedicRaw, homeRemedyRaw] = await Promise.all([
            fetchBoerickeContext(embedding),
            fetchAyurvedicContext(embedding),
            fetchHomeRemedyContext(embedding3072),
        ]);

        // Track whether home remedies RAG data was actually retrieved
        const homeRemediesAvailable = !skipHomeRemedies && !!homeRemedyRaw;

        const sections = [
            homeopathicRaw && [
                '[SECTION A: HOMEOPATHIC — Boerickes Materia Medica]',
                'Use entries below ONLY for homeopathic_remedies JSON array.',
                homeopathicRaw,
            ].join('\n'),
            ayurvedicRaw && [
                '[SECTION B: AYURVEDIC CLASSICAL MEDICINE — Planet Ayurveda / CCRAS / Classical Texts]',
                'FORMAL Ayurvedic herbs & formulations (Ashwagandha, Triphala, Sitopaladi, etc.)',
                'Require Ayurvedic pharmacy. Use ONLY for ayurvedic_remedies JSON array.',
                ayurvedicRaw,
            ].join('\n'),
            homeRemedyRaw && [
                '[SECTION C: DADI-NANI KE NUSKHE — Household Kitchen Remedies]',
                'IMMEDIATE home remedies: haldi, adrak, tulsi, shahad, nimbu, ajwain, jeera, pudina.',
                'NO pharmacy needed. Use ONLY for home_remedies JSON array.',
                homeRemedyRaw,
            ].join('\n'),
        ].filter(Boolean);

        console.log(`[RAG] Sections: Homeopathic=${!!homeopathicRaw}, Ayurvedic=${!!ayurvedicRaw}, HomeRemedies=${homeRemediesAvailable} (skipHomeRemedies=${skipHomeRemedies})`);
        return { context: sections.length ? sections.join('\n\n') : '', homeRemediesAvailable };
    } catch (e) {
        console.error('[RAG] Combined fetch error:', e);
        return { context: '', homeRemediesAvailable: false };
    }
}


// ── Extract symptom summary from conversation for RAG ─────────────────────────
function extractSymptomSummary(messages: { role: string; content: string }[]): string {
    return messages.filter(m => m.role === 'user').map(m => m.content).join(' ').slice(0, 500);
}

// ── Count how many turns have happened ─────────────────────────────────────────
function countUserTurns(messages: { role: string }[]): number {
    return messages.filter(m => m.role === 'user').length;
}

// ── Message Role Alternation Validator ─────────────────────────────────────────
// Groq/OpenAI APIs enforce strict alternation: [user] → [assistant] → [user] → ...
// If the sliding window creates consecutive same-role messages, this merges them
// rather than dropping — preserving diagnostic symptom context.
function enforceRoleAlternation(
    messages: { role: string; content: string }[]
): { role: string; content: string }[] {
    const result: { role: string; content: string }[] = [];

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const prev = result[result.length - 1];

        if (!prev) {
            if (msg.role === 'assistant') continue; // drop leading assistant
            result.push(msg);
            continue;
        }

        if (prev.role === msg.role && msg.role !== 'system') {
            // Consecutive same role — merge to preserve context
            if (msg.role === 'user') {
                result[result.length - 1] = {
                    ...prev,
                    content: `${prev.content}\n${msg.content}`,
                };
            } else if (msg.role === 'assistant') {
                // For consecutive assistants, keep the more recent one
                result[result.length - 1] = msg;
            }
        } else {
            result.push(msg);
        }
    }

    // Final message must be user role for the API call
    if (result[result.length - 1]?.role === 'assistant') {
        result.pop();
    }

    return result;
}

// ── Safe Sliding Window Builder ───────────────────────────────────────────────
// Preserves messages[0] (user's language register) and messages[1] (assistant's
// tone register) while building a role-safe sliding window from the tail.
function buildSafeWindow(
    messages: { role: string; content: string }[],
    maxMessages: number
): { role: string; content: string }[] {
    if (messages.length <= maxMessages) return messages;

    const anchor0 = messages[0]; // User turn 1 — language register
    const anchor1 = messages[1]; // Assistant turn 1 — tone/persona register

    // Find the slice start: must begin on a User role boundary
    let sliceStart = messages.length - maxMessages + 2; // +2 because we prepend 2 anchors

    // Align to nearest User message boundary
    while (sliceStart < messages.length && messages[sliceStart]?.role !== 'user') {
        sliceStart++;
    }

    const tail = messages.slice(sliceStart);
    const candidate = [anchor0, anchor1, ...tail].filter(Boolean);

    // Validate alternation — catch any edge case the math missed
    return enforceRoleAlternation(candidate);
}

// ── System prompt (injected AFTER RAG context for maximum weight) ─────────────
const SYSTEM_PROMPT = `
[ROLE IDENTITY]
You are Healio — a senior holistic physician with deep expertise in homeopathy, Ayurveda, and integrative medicine. You speak with clinical authority and deep human warmth, like a trusted family doctor who has studied classical medicine for 30 years. Never break this persona.

[LANGUAGE RULES — CRITICAL, FOLLOW EXACTLY]
Mirror the user's language every single reply. Apply these rules in strict order:

ABSOLUTE RULE: If the user writes in English, you MUST reply in 100% pure English. Zero Hindi words. Zero Hinglish. This overrides everything else in this prompt.

IF user message contains only English words → reply in pure English only. Do NOT use any Hindi words like "aap", "haldi", "adrak", etc.
IF user message contains Hinglish (Hindi + English mixed, e.g. "mujhe pet dard hai") → reply in Hinglish only.
IF user message is in Devanagari script (e.g. "मुझे दर्द है") → reply in Devanagari Hindi only.
DEFAULT: If uncertain, match the script of the majority of the user's words.

FORBIDDEN: Mixing languages. Defaulting to Hindi when user spoke English. Using English when user spoke Devanagari. Using Hindi kitchen remedy names (haldi, adrak, ajwain, etc.) when responding in English — use their English names instead (turmeric, ginger, carom seeds).

[TONE & FORMAT RULES]
- NEVER use emojis. Ever. Not even one.
- Keep every reply to 3-4 lines maximum during Q&A phase.
- Address user as "aap" in Hindi/Hinglish. "you" in English. NEVER use "aap" in English responses.
- Clinical empathy first — acknowledge the symptom before asking your question.
- NEVER show a numbered list, form, or bullet points. Speak conversationally.
- Output structure per turn: [empathy line] + [one question] + [optional ui_hint on new line]

[EMERGENCY ABORT — HIGHEST PRIORITY]
Scan every user message for these red flags BEFORE doing anything else:
chest pain, shortness of breath, sudden severe headache, loss of consciousness, coughing blood, slurred speech, facial drooping, severe abdominal pain, high fever in infant (under 3 months), signs of stroke, suicidal thoughts, seizure.

IF ANY red flag detected → output ONLY this exact string, nothing else:
"WARNING: Based on your symptoms, please seek emergency medical care immediately. Call 112 (India) or 911 (US) or go to the nearest emergency room NOW. Healio cannot assist with potential emergencies."
THEN STOP. Do not ask questions. Do not suggest remedies.

[DIAGNOSTIC STATE MACHINE]
You are running a structured diagnostic interview. Track internally which of the 9 data points below have been answered. Ask the NEXT unanswered question in priority order. Never ask a question whose answer was already given.

QUESTION PRIORITY (ask ONE at a time, skip if already answered):
  Q1: chief_complaint   — What is the main problem?
  Q2: duration          — How long has this been happening?
  Q3: severity          — How bad is it on a scale of 1-10?
  Q4: location          — Where exactly in the body?
  Q5: sensation         — What does it feel like? (throbbing, sharp, dull, burning…)
  Q6: associated        — Any fever, nausea, dizziness, or other symptoms alongside?
  Q7: aggravation       — What makes it worse?
  Q8: amelioration      — What gives relief?
  Q9: history           — How did it start? Any stress, poor sleep, dietary change?

STOPPING RULE: If after Q3 you have identified 1-2 probable conditions with ≥70% confidence → skip remaining questions and proceed to final diagnosis output.
MINIMUM: 3 questions answered before final diagnosis.
MAXIMUM: 9 questions total.

[EARLY HOME REMEDY INJECTION]
After Q3 is answered, IF the condition appears mild (cold, indigestion, mild headache, acidity) AND severity ≤ 5:
Add a soft clinical note at the END of your response (after the next question): "In the meantime, you may try [specific remedy] for temporary relief."
Specific remedy must match the symptom (e.g. adrak + shahad for cough, ajwain pani for indigestion). No generic suggestions.
NEVER inject remedies if any red flag is present or severity ≥ 8.

[UI HINT SYSTEM]
After certain questions, append a ui_hint JSON on a new line AFTER your conversational text. The JSON must be on its own line with no prose around it.

Rules for generating options:
- Options must be SPECIFIC to the patient's exact symptom reported. Never generic.
- Generate 6-8 options per chip question.
- For aggravation/amelioration: derive options from the specific body system affected.

QUESTION → UI_HINT mapping (use exact type values):
  Q2 duration     → {"ui_hint": {"type": "chips", "options": ["Today","1-3 days","4-7 days","1-2 weeks","1-2 months","3+ months"], "question_type": "duration"}}
  Q3 severity     → {"ui_hint": {"type": "slider", "min": 1, "max": 10, "question_type": "severity"}}
  Q5 sensation    → {"ui_hint": {"type": "chips", "options": [<generate 6-8 sensation types specific to their complaint>], "question_type": "sensation"}}
  Q7 aggravation  → {"ui_hint": {"type": "chips", "options": [<generate 6-8 triggers specific to their complaint>], "question_type": "aggravation"}}
  Q8 amelioration → {"ui_hint": {"type": "chips", "options": [<generate 6-8 relief factors specific to their complaint>], "question_type": "amelioration"}}
  Q6 associated   → {"ui_hint": {"type": "chips", "options": [<generate 6-8 associated symptoms specific to their complaint>], "question_type": "associated_symptoms"}}
FALLBACK: If unsure which type applies, default to chips with contextually relevant options. Never skip the ui_hint entirely for Q3, Q5, Q7, Q8.

FEW-SHOT EXAMPLE (headache patient):
User: "I have a headache."
Healio: "I'm sorry you're dealing with this — headaches can be very disruptive. How long have you been experiencing it?
{\"ui_hint\": {\"type\": \"chips\", \"options\": [\"Today\", \"1-3 days\", \"4-7 days\", \"1-2 weeks\", \"1+ month\"], \"question_type\": \"duration\"}}"

User: "Since yesterday."
Healio: "Understood — starting yesterday. How would you rate the intensity of the headache right now, on a scale of 1 to 10?
{\"ui_hint\": {\"type\": \"slider\", \"min\": 1, \"max\": 10, \"question_type\": \"severity\"}}"

User: "Around a 6."
Healio: "A 6 — that's significant but manageable. Can you describe what the pain feels like?
{\"ui_hint\": {\"type\": \"chips\", \"options\": [\"Throbbing\", \"Pressure/tight band\", \"Sharp stabbing\", \"Dull ache\", \"Behind the eyes\", \"One-sided\", \"Whole head\"], \"question_type\": \"sensation\"}}"

[WHAT HEALIO NEVER DOES]
- Never suggest allopathic medicines (paracetamol, ibuprofen, antibiotics, antacids).
- Never make a definitive diagnosis before the final JSON phase — always say "likely" or "this may suggest".
- Never ask yes/no when specific detail is needed.
- Never output more than one question per turn.
- Never use emojis, bullet lists, or numbered lists.
- Never ask a question whose answer was already given earlier in the conversation.
- Never respond in Hindi or Hinglish when the user wrote their message in English. This is the #1 most critical rule.
`;

const FINAL_DIAGNOSIS_OUTPUT_RULES = `=== FINAL DIAGNOSIS OUTPUT ===
When you have enough information (at least 3 questions answered):
1. Tell the user warmly: "Based on everything you've shared, here's what I've found."
2. Output the following STRICT JSON wrapped in \`\`\`json and \`\`\` tags.
3. CRITICAL REMEDY POPULATION RULES — Read CAREFULLY and follow EXACTLY.

The knowledge base has 3 DISTINCT sections. Map each to the CORRECT JSON array:

SECTION A -> homeopathic_remedies ONLY:
  Pull from SECTION A (Boericke Materia Medica).
  Homeopathic remedies: Belladonna, Aconite, Bryonia, Nux Vomica, Pulsatilla, etc.
  Match EXACT symptom modalities: aggravations, ameliorations, sensation, time of day.
  Include: remedy name, potency (6C/30C/200C), exact dose, which modalities it fits.

SECTION B -> ayurvedic_remedies ONLY:
  Pull from SECTION B (Planet Ayurveda / CCRAS / Classical Sanskrit Texts).
  CLASSICAL Ayurvedic formulations requiring an Ayurvedic pharmacy:
  Ashwagandha, Triphala, Brahmi, Sitopaladi Churna, Shatavari, Dashmularishta, etc.
  Include: exact herb/formulation name, source text, preparation method, dose + timing.
  NEVER put kitchen items (haldi-doodh, adrak) here — those belong in SECTION C.

SECTION C -> home_remedies ONLY:
  Pull from SECTION C (Dadi-Nani ke Nuskhe — nuskhe.json).
  IMMEDIATE household remedies using kitchen-shelf items ONLY. No pharmacy needed:
  haldi+doodh, adrak+shahad, tulsi+kali mirch, nimbu+pani, ajwain pani,
  jeera water, saunf tea, desi ghee, pudina, lahsun, kala namak, methi seeds.
  Should feel like aapki nani ka nuskha — warm, familiar, instantly doable.
  Include: ingredients with quantities, step-by-step preparation, timing, frequency.
  NEVER put Ashwagandha, Brahmi, Triphala, Sitopaladi or any classical herb here.

MANDATORY RULES (apply to ALL sections):
  - ALWAYS include at least 2 entries per section. NEVER leave any array empty.
  - If RAG data is absent for a section, use authoritative classical fallback knowledge.
  - NEVER duplicate a remedy across sections (e.g. no haldi in both ayurvedic AND home).
  - NEVER list the same remedy twice within one section.
  - NEVER use placeholder text like "Remedy Name" or "herb name".

\`\`\`json
{
  "name": "Condition Name",
  "description": "2-3 line summary of what you understood from their symptoms.",
  "severity": "mild | moderate | severe",
  "confidence": 75,
  "emergency": false,
  "bayesianFactors": "Why this diagnosis fits — symptom pattern, modalities, duration, triggers",
  "differentialDiagnoses": [
    { "name": "Alternate Condition", "likelihood": "low | medium", "rationale": "Why considered" }
  ],
  "homeopathic_remedies": [
    {
      "name": "Belladonna (from Boericke's Materia Medica)",
      "description": "Suits sudden high fever with burning heat, red face, throbbing headache — all symptoms the patient described",
      "potency": "30C",
      "method": "4 pills every 3 hours; reduce frequency as symptoms improve",
      "source": "Boericke's Materia Medica"
    }
  ],
  "ayurvedic_remedies": [
    {
      "name": "Exact herb or formulation from the knowledge base",
      "indication": "Which specific symptom this addresses",
      "preparation": "Exact preparation method — decoction, powder dose, or tablet with timing",
      "source": "Planet Ayurveda / CCRAS / Classical Text (exact source from knowledge base)"
    }
  ],
  "home_remedies": [
    {
      "name": "Traditional remedy using household ingredients",
      "indication": "Which symptom this directly helps",
      "preparation": "Step-by-step: quantities, method, timing, frequency"
    }
  ],
  "lifestyle_advice": ["Rest", "Stay hydrated", "Steam inhalation twice daily"],
  "red_flags": ["If fever exceeds 103°F / 39.4°C", "If symptoms worsen after 5 days"],
  "see_doctor_if": ["Symptoms persist beyond 7 days", "Difficulty breathing"],
  "disclaimer": "This assessment is generated by an AI tool and is not a substitute for professional medical advice. Always consult a qualified physician for serious conditions."
}
\`\`\`
`;


export async function POST(req: NextRequest) {
    // Raised to 55 s — safely inside the 60 s maxDuration boundary
    const timeoutPromise = new Promise<Response>((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 55_000)
    );

    const processRequest = async (): Promise<Response> => {
        try {
        // ── Auth guard ───────────────────────────────────────────────────────
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized — missing token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const token = authHeader.slice(7);

        // Create a per-request client that uses the user's JWT to verify identity
        const authClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '',
            {
                global: {
                    headers: { Authorization: `Bearer ${token}` },
                },
            }
        );
        const { data: { user }, error: authError } = await authClient.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized — invalid token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // ── Parse body early so we know personaId before parallel fetches ────
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { messages, personaId, sessionId, resumeContext } = await req.json() || {};

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Messages array is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // ── Usage gating + Persona fetch — RUN IN PARALLEL to save ~400-700 ms ─
        const serviceClient = getServiceClient();

        const [usageResult, personaResult] = await Promise.allSettled([
            // 1. Usage check
            serviceClient.rpc('increment_chat_count', { p_user_id: user.id }),
            // 2. Persona fetch (skip if no personaId)
            personaId
                ? serviceClient
                    .from('personas')
                    .select('name, age, gender, relation, conditions, allergies')
                    .eq('id', personaId)
                    .eq('user_id', user.id)
                    .single()
                : Promise.resolve(null),
        ]);

        // Handle usage gate result
        if (usageResult.status === 'fulfilled') {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { data: usage, error: usageError } = usageResult.value as { data: Record<string, unknown> | null; error: { message: string } | null };
            // Temporarily disabled for testing
            // if (!usageError && usage && !usage.allowed) {
            //     return new Response(JSON.stringify({
            //         error: 'Monthly consultation limit reached',
            //         code: 'USAGE_LIMIT',
            //         current_count: usage.current_count,
            //         limit: usage.limit,
            //         plan: usage.plan,
            //         resets_at: usage.resets_at,
            //     }), {
            //         status: 429,
            //         headers: { 'Content-Type': 'application/json' },
            //     });
            // }
        } else {
            console.warn('[chat/route] Usage check skipped:', usageResult.reason);
        }

        // Handle persona result
        let personaContext = '';
        if (personaResult.status === 'fulfilled' && personaResult.value) {
            const { data: persona } = personaResult.value as { data: Record<string, unknown> | null };
            if (persona) {
                const p = persona as { name?: string; age?: number; gender?: string; relation?: string; conditions?: string[]; allergies?: string };
                const parts = [
                    `Patient Profile: ${p.name}`,
                    p.age    ? `Age: ${p.age} years` : null,
                    p.gender ? `Gender: ${p.gender}` : null,
                    p.relation ? `Relation: ${p.relation}` : null,
                    p.conditions?.length ? `Pre-existing conditions: ${p.conditions.join(', ')}` : null,
                    p.allergies ? `Allergies: ${p.allergies}` : null,
                ].filter(Boolean).join(', ');
                personaContext = `\n\n=== PATIENT CONTEXT ===\n${parts}\n`;
                if (p.age && p.age <= 12) {
                    personaContext += `IMPORTANT: This patient is a child (${p.age} years old). Use gentle language. Always recommend consulting a pediatrician. Avoid adult-dose remedies.\n`;
                }
            }
        } else if (personaResult.status === 'rejected') {
            console.warn('[chat/route] Persona fetch skipped:', personaResult.reason);
        }

        // Token overflow protection: sliding window (last 15 messages)
        // Token overflow protection & dynamic history limit for TTFT
        // Early turns only need the last few messages. Final diagnosis needs more history.
        let dynamicMaxMessages = 15;
        const userTurnsEarly = messages.filter(m => m.role === 'user').length;
        if (userTurnsEarly <= 2) dynamicMaxMessages = 4;        // ~2 turns of history
        else if (userTurnsEarly <= 5) dynamicMaxMessages = 8;   // ~4 turns of history

        // Build role-safe sliding window — preserves language anchors AND enforces
        // strict User↔Assistant alternation to prevent API 400 rejections (Bug 2 fix)
        const processedMessages = buildSafeWindow(messages, dynamicMaxMessages);

        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return new Response(JSON.stringify({ error: 'Missing GROQ_API_KEY' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // ── Turn phase detection ─────────────────────────────────────────────
        // PHASE A (turns 1-2): Pure Q&A — no RAG, 8B model, 200 token cap  → ~100-300ms
        // PHASE B (turns 3-5): Q&A + Boericke/Ayurvedic RAG, 8B model, 350 tokens → ~500-800ms
        // PHASE C (turn 6+ or explicit diagnosis request): Full RAG + home
        //         remedies + 70B model + 2000 tokens → rich, detailed final answer
        const userTurns = countUserTurns(processedMessages);
        const lastUserMsg = (processedMessages as { role: string; content: string }[])
            .filter(m => m.role === 'user')
            .pop()?.content ?? '';

        const isFinalTurn =
            userTurns >= 6 ||
            processedMessages.length >= 10 ||
            /diagnos|summary|what.*wrong|tell.*me|give.*result|remedy|remedies|prescription|treatment|what.*condition|what.*problem|suggest/i
                .test(lastUserMsg);

        // Model + token budget per phase
        const groqModel = isFinalTurn
            ? AI_PHASE_CONFIG.models.groq        // llama-3.3-70b-versatile — rich diagnosis
            : AI_PHASE_CONFIG.models.groqFast;   // llama-3.1-8b-instant — fast Q&A

        const maxTokensForTurn =
            isFinalTurn    ? 2000 :
            userTurns >= 3 ? 350  :
                             200;

        // ── RAG gating ──────────────────────────────────────────────────────
        let ragContext = '';
        let homeRemediesAvailable = true; // assume available unless proven otherwise

        if (userTurns >= 2) {
            const isSubstantive =
                isFinalTurn ||              // always fetch on diagnosis turn
                userTurns === 2 ||          // first time we have symptom context
                lastUserMsg.length >= 60 || // substantial new info
                /diagnos|remedy|treatment|suggest|recommend|medicine|herb|what (is|should|do)|cure|relief|prescri/i
                    .test(lastUserMsg);

            if (isSubstantive) {
                const symptomSummary = extractSymptomSummary(processedMessages);
                // Skip slow 3072-dim home remedy embedding on non-final turns
                const ragResult = await fetchAllContext(symptomSummary, !isFinalTurn);
                ragContext = ragResult.context;
                homeRemediesAvailable = ragResult.homeRemediesAvailable;
                if (ragContext) {
                    console.log(`[RAG] ${ragContext.length} chars at turn ${userTurns}, final=${isFinalTurn}, homeRemedies=${homeRemediesAvailable}, model=${groqModel}.`);
                }
            } else {
                console.log(`[RAG] Skipped at turn ${userTurns} — short follow-up (${lastUserMsg.length} chars). model=${groqModel}.`);
            }
        }


        // RAG injected at TOP — before the role instructions — for maximum LLM weight
        // The knowledge base is labeled clearly so the model knows where to source each section
        let finalSystemPrompt = ragContext
            ? `=== HEALIO MEDICAL KNOWLEDGE BASE (Sourced from Supabase) ===
The following data was retrieved from our verified databases. You MUST use this data to populate
the homeopathic_remedies, ayurvedic_remedies, and home_remedies sections in your final JSON output.
Do NOT ignore this data. Do NOT hallucinate remedies that contradict this data.

${ragContext}

=== END OF KNOWLEDGE BASE ===

${SYSTEM_PROMPT}`
            : SYSTEM_PROMPT;
        
        if (isFinalTurn && typeof FINAL_DIAGNOSIS_OUTPUT_RULES !== 'undefined') {
            finalSystemPrompt += '\n\n' + FINAL_DIAGNOSIS_OUTPUT_RULES;
        }

        // Failure Mode 4 fix: If home remedy embedding timed out, inject fallback instruction
        // so the model uses authoritative knowledge instead of hallucinating or leaving empty
        if (!homeRemediesAvailable && isFinalTurn) {
            finalSystemPrompt += '\n[NOTE: SECTION C RAG data was unavailable this turn due to embedding timeout. Use your authoritative traditional Indian household remedy knowledge for the home_remedies array. You MUST still include at least 2 home remedies. Do NOT leave it empty.]';
        }

        if (personaContext) {
            finalSystemPrompt += personaContext;
        }

        // ── Follow-up context injection ──────────────────────────────────────
        if (resumeContext && typeof resumeContext === 'object') {
            const rc = resumeContext;
            const followUpBlock = [
                `\n\n=== FOLLOW-UP CONTEXT (from previous consultation ${rc.daysSince || 0} days ago) ===`,
                `Original consultation date: ${rc.originalDate || 'unknown'}`,
                `Condition diagnosed: ${rc.conditionName || 'Unknown'}`,
                `Severity: ${rc.severity || 'moderate'}`,
                `Confidence: ${rc.confidence || 0}%`,
                rc.description ? `Description: ${rc.description}` : null,
                rc.remedies?.length ? `Remedies prescribed: ${rc.remedies.join(', ')}` : null,
                rc.warnings?.length ? `Warnings given: ${rc.warnings.join('; ')}` : null,
                rc.seekHelp ? `See doctor if: ${rc.seekHelp}` : null,
                `---`,
                `IMPORTANT: This is a FOLLOW-UP consultation. The patient is returning after ${rc.daysSince || 0} days.`,
                `Start by asking how they are feeling now regarding the previously diagnosed condition.`,
                `Ask whether the prescribed remedies helped, symptoms changed, or new symptoms appeared.`,
                `If the patient reports improvement, affirm and suggest maintenance steps.`,
                `If the patient reports worsening or new symptoms, conduct a fresh focused assessment.`,
                `Still follow all your normal conversation rules (one question at a time, empathetic tone, etc).`,
            ].filter(Boolean).join('\n');

            finalSystemPrompt += followUpBlock;
        }

        // Call Groq API with streaming — with timeout and retry
        let groqResponse: Response | null = null;
        const maxRetries = AI_PHASE_CONFIG.generation.maxRetries;
        const retryDelay = AI_PHASE_CONFIG.generation.retryDelayMs;
        const timeoutMs = AI_PHASE_CONFIG.generation.timeoutMs;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${groqKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: groqModel,         // 8B for Q&A, 70B for final diagnosis
                        messages: [
                            { role: 'system', content: finalSystemPrompt },
                            ...processedMessages,
                        ],
                        temperature: AI_PHASE_CONFIG.generation.temperature,
                        max_tokens: maxTokensForTurn,  // tight per-phase budget
                        stream: true,
                        stop: ["\n\nUser:", "\n\nHuman:"],
                    }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (groqResponse.ok) break; // Success — exit retry loop

                // If response is not ok but attempt < maxRetries, retry
                if (attempt < maxRetries) {
                    const delay = groqResponse.status === 429 ? retryDelay * Math.pow(2, attempt) : retryDelay;
                    console.warn(`Groq attempt ${attempt + 1} failed (${groqResponse.status}), retrying in ${delay}ms...`);
                    groqResponse = null;
                    await new Promise(r => setTimeout(r, delay));
                }
            } catch (groqError) {
                console.error(`Groq attempt ${attempt + 1} error:`, groqError);
                groqResponse = null;
                if (attempt < maxRetries) {
                    await new Promise(r => setTimeout(r, retryDelay));
                }
                // Will fall through to Gemini fallback after all retries
            }
        }

        if (!groqResponse || !groqResponse.ok) {
            // Fallback to Gemini
            const geminiKey = process.env.GEMINI_API_KEY;
            if (!geminiKey) {
                return new Response(JSON.stringify({ error: 'Both Groq and Gemini failed' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            console.log('Falling back to Gemini...');

            const geminiMessages = processedMessages.map((m: { role: string; content: string }) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            }));

            const geminiController = new AbortController();
            const geminiTimeoutId = setTimeout(() => geminiController.abort(), timeoutMs);

            const geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${AI_PHASE_CONFIG.models.gemini}:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: finalSystemPrompt }] },
                        contents: geminiMessages,
                        generationConfig: {
                            temperature: AI_PHASE_CONFIG.generation.temperature,
                            maxOutputTokens: AI_PHASE_CONFIG.generation.maxTokens,
                        },
                    }),
                    signal: geminiController.signal,
                }
            );

            clearTimeout(geminiTimeoutId);

            if (!geminiResponse.ok) {
                const errorText = await geminiResponse.text();
                console.error('Gemini also failed:', geminiResponse.status, errorText);
                return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            const geminiData = await geminiResponse.json();
            const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Normalize Gemini response into SSE format to match Groq stream shape
            // so the frontend useChat hook can parse it identically (Failure Mode 3 fix)
            const geminiSSE = [
                `data: ${JSON.stringify({ content: text })}\n\n`,
                `data: [DONE]\n\n`,
            ].join('');

            return new Response(geminiSSE, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'X-Provider': 'gemini',
                },
            });
        }

        // Stream the Groq response back to the client — with chunk-level idle timeout
        // (Bug 1 fix: prevents indefinite stream hangs that Vercel maxDuration cannot catch)
        const CHUNK_IDLE_TIMEOUT_MS = 10_000; // 10s — covers TTFT and inter-chunk gaps
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const reader = groqResponse!.body!.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let idleTimer: ReturnType<typeof setTimeout> | null = null;
                const chunkAbort = new AbortController();

                const resetIdleTimer = () => {
                    if (idleTimer) clearTimeout(idleTimer);
                    idleTimer = setTimeout(() => {
                        console.warn('[stream] Chunk idle timeout — aborting Groq stream');
                        chunkAbort.abort();
                        reader.cancel('idle-timeout').catch(() => {});
                    }, CHUNK_IDLE_TIMEOUT_MS);
                };

                resetIdleTimer(); // arm on stream open

                try {
                    while (true) {
                        // Race reader.read() against the idle abort signal
                        const readPromise = reader.read();
                        const abortPromise = new Promise<never>((_, rej) => {
                            if (chunkAbort.signal.aborted) {
                                rej(new Error('CHUNK_IDLE_TIMEOUT'));
                                return;
                            }
                            chunkAbort.signal.addEventListener('abort', () =>
                                rej(new Error('CHUNK_IDLE_TIMEOUT')), { once: true }
                            );
                        });

                        const { done, value } = await Promise.race([readPromise, abortPromise]);

                        if (done) {
                            if (idleTimer) clearTimeout(idleTimer);
                            break;
                        }

                        resetIdleTimer(); // reset on every received chunk

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed || !trimmed.startsWith('data: ')) continue;
                            const data = trimmed.slice(6);
                            if (data === '[DONE]') {
                                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                                continue;
                            }
                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices?.[0]?.delta?.content;
                                if (content) {
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                                }
                            } catch { /* skip malformed chunk */ }
                        }
                    }
                } catch (err: unknown) {
                    if (idleTimer) clearTimeout(idleTimer);
                    const msg = err instanceof Error ? err.message : String(err);

                    if (msg === 'CHUNK_IDLE_TIMEOUT') {
                        console.warn('[stream] Emitting stall error to client');
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'STREAM_STALL', fallback: true })}\n\n`));
                    } else {
                        console.error('[stream] Unexpected error:', err);
                    }
                } finally {
                    if (idleTimer) clearTimeout(idleTimer);
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (innerError: any) {
            console.error('[chat/route] Inner error:', innerError);
            return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    };

    try {
        return await Promise.race([processRequest(), timeoutPromise]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error.message === 'timeout') {
            return new Response(JSON.stringify({ error: 'Request timed out. Please try again.' }), {
                status: 504,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        console.error('[chat/route] Unhandled error:', error);
        return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
