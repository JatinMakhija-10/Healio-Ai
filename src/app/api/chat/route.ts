import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { AI_PHASE_CONFIG } from '@/lib/ai/config';

// ── Shared: build a Supabase service-role client ─────────────────────────────
function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''
    );
}

// ── Generate embedding via Gemini ─────────────────────────────────────────────
async function generateEmbedding(text: string): Promise<number[] | null> {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || !text) return null;
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const embResp = await ai.models.embedContent({
        model: AI_PHASE_CONFIG.models.embedding,
        contents: text,
    });
    return embResp.embeddings?.[0]?.values ?? null;
}

// ── RAG: Homeopathic (Boericke) ───────────────────────────────────────────────
async function fetchBoerickeContext(embedding: number[]): Promise<string> {
    try {
        const supabase = getServiceClient();
        const { data } = await supabase.rpc('match_boericke_embeddings', {
            query_embedding: embedding,
            match_threshold: 0.75,   // raised from 0.60 — filter low-quality results
            match_count: 5,
        });
        if (!data?.length) return '';
        return (data as any[])
            .filter((c: any) => (c.similarity ?? 0) >= 0.75)
            .map((c: any, i: number) =>
                `[${i + 1}] ${c.remedy_name} (relevance: ${((c.similarity ?? 0) * 100).toFixed(0)}%)\n${c.chunk_text}`
            ).join('\n\n');
    } catch (e) {
        console.error('[RAG] Homeopathic error:', e);
        return '';
    }
}

// ── RAG: Ayurvedic herbs ──────────────────────────────────────────────────────
async function fetchAyurvedicContext(embedding: number[]): Promise<string> {
    try {
        const supabase = getServiceClient();
        // Uses a separate table; falls back gracefully if not yet seeded
        const { data } = await supabase.rpc('match_ayurvedic_embeddings', {
            query_embedding: embedding,
            match_threshold: 0.75,
            match_count: 3,
        });
        if (!data?.length) return '';
        return (data as any[])
            .filter((c: any) => (c.similarity ?? 0) >= 0.75)
            .map((c: any, i: number) =>
                `[${i + 1}] ${c.herb_name} (relevance: ${((c.similarity ?? 0) * 100).toFixed(0)}%)\n${c.chunk_text}`
            ).join('\n\n');
    } catch {
        // Ayurvedic table may not exist yet — silently degrade
        return '';
    }
}

// ── RAG: Home Remedies ────────────────────────────────────────────────────────
async function fetchHomeRemedyContext(embedding: number[]): Promise<string> {
    try {
        const supabase = getServiceClient();
        const { data } = await supabase.rpc('match_home_remedy_embeddings', {
            query_embedding: embedding,
            match_threshold: 0.75,
            match_count: 3,
        });
        if (!data?.length) return '';
        return (data as any[])
            .filter((c: any) => (c.similarity ?? 0) >= 0.75)
            .map((c: any, i: number) =>
                `[${i + 1}] ${c.remedy_name} (relevance: ${((c.similarity ?? 0) * 100).toFixed(0)}%)\n${c.chunk_text}`
            ).join('\n\n');
    } catch {
        // Home remedies table may not exist yet — silently degrade
        return '';
    }
}

// ── Parallelised multi-source RAG ─────────────────────────────────────────────
async function fetchAllContext(symptomSummary: string): Promise<string> {
    try {
        const embedding = await generateEmbedding(symptomSummary);
        if (!embedding) return '';

        const [homeopathicRaw, ayurvedicRaw, homeRemedyRaw] = await Promise.all([
            fetchBoerickeContext(embedding),
            fetchAyurvedicContext(embedding),
            fetchHomeRemedyContext(embedding),
        ]);

        const sections = [
            homeopathicRaw && `=== HOMEOPATHIC REFERENCE (Boericke's Materia Medica) ===\n${homeopathicRaw}`,
            ayurvedicRaw   && `=== AYURVEDIC REFERENCE ===\n${ayurvedicRaw}`,
            homeRemedyRaw  && `=== HOME REMEDIES (Kitchen / Traditional) ===\n${homeRemedyRaw}`,
        ].filter(Boolean);

        return sections.length ? sections.join('\n\n') : '';
    } catch (e) {
        console.error('[RAG] Combined fetch error:', e);
        return '';
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

// ── System prompt (injected AFTER RAG context for maximum weight) ─────────────
const SYSTEM_PROMPT = `You are Healio, a warm, caring, and knowledgeable holistic health assistant.
You speak in a friendly, supportive tone — like a trusted family doctor who genuinely cares.

LANGUAGE RULES (CRITICAL — follow these strictly):
- DETECT the user's language from their very first message:
  1. Devanagari script (मुझे, दर्द, पेट) → respond ENTIRELY in Hindi (Devanagari)
  2. Romanized Hindi / Hinglish (dard, pet mein, sir dard) → respond in the SAME Hinglish
  3. Pure English → respond in English
- MATCH the user's exact script and style in every message — never switch on your own
- Common Hinglish keywords: dard, taklif, bukhar, kamar, pet, sar, seena, ji machlana, ulti, thakan, neend

CONVERSATION RULES:
- Always ask ONE question at a time — never bombard
- After the opening message: acknowledge with empathy FIRST, then ask your first follow-up
- Keep responses SHORT — maximum 3-4 lines
- Use simple, everyday language — no medical jargon
- Use emojis sparingly — 1-2 per message maximum
- Address user as "aap" in Hindi, "you" in English

=== ADAPTIVE QUESTION ENGINE (CRITICAL) ===
You must reach a diagnosis EFFICIENTLY. Do NOT ask all 9 questions if you have enough data earlier.

MINIMUM questions before diagnosis: 3
MAXIMUM questions before diagnosis: 9

After EVERY user answer, internally evaluate:
- Is the chief complaint, duration, and severity now clear?
- Are there any red flags requiring immediate emergency redirect?
- Can you already identify 1-2 probable conditions with > 70% confidence?
If YES to the last point after question 5: proceed directly to final diagnosis JSON.

QUESTION PRIORITY (ask in this order, SKIP if already answered by the user):
1. Chief complaint — what exactly is the main problem?
2. Duration — how long has this been happening?
3. Severity — how bad is it? (1-10 scale)
4. Location — where exactly? (body area)
5. Sensation / Pain Type — what does it feel like?
6. Associated symptoms — any fever, nausea, dizziness alongside?
7. Triggers (worse from) — what makes it worse?
8. Relief (better from) — what gives relief?
9. History/Stress — how did it start? stress or sleep issues?

EARLY HOME REMEDY INJECTION:
- After question 3, if the condition seems mild and common (cold, indigestion, mild headache),
  add a soft line like: "While we continue evaluating, you can try [home remedy] for some relief."
  Then continue asking questions. Do NOT jump to a full diagnosis yet.
- If a red flag is present: NEVER suggest remedies.

RED FLAG EMERGENCY REDIRECT (CRITICAL — check every message):
If user mentions ANY of these, IMMEDIATELY stop questioning and output ONLY the emergency message:
chest pain, shortness of breath, sudden severe headache, loss of consciousness, coughing blood,
slurred speech, facial drooping, severe abdominal pain, high fever in infant under 3 months,
signs of stroke, suicidal thoughts, self-harm.

Emergency message template:
"⚠️ Based on what you've described, please seek emergency medical care immediately.
Call 112 (India) or 911 (US) or go to the nearest emergency room NOW.
Healio cannot assist with potential emergencies — please do not delay."

=== UI HINT SYSTEM ===
When asking certain structured questions, append a ui_hint JSON object on a new line AFTER your
conversational message. The frontend will use this to render dropdowns or chips instead of a
free-text box. NEVER include ui_hint inside prose — always on its own final line.

Format: {"ui_hint": {"type": "chips"|"dropdown"|"slider", "options": [...], "question_type": "..."}}

Use these hints for the following question types:
- Duration: {"ui_hint": {"type": "chips", "options": ["Today","1-3 days","4-7 days","1-2 weeks","3-4 weeks","1-2 months","3+ months"], "question_type": "duration"}}
- Severity (1-10): {"ui_hint": {"type": "slider", "min": 1, "max": 10, "question_type": "severity"}}
- Sensation/Pain type: {"ui_hint": {"type": "chips", "options": ["Burning 🔥","Sharp/Stabbing 🗡️","Throbbing 💓","Dull/Aching 😔","Cramping","Pressure","Tingling","Itching"], "question_type": "sensation"}}
- Triggers (worse from): {"ui_hint": {"type": "chips", "options": ["Eating","Movement","Cold","Heat","Stress","Morning","Night","Lying down","Touch/Pressure","Bending"], "question_type": "aggravation"}}
- Relief (better from): {"ui_hint": {"type": "chips", "options": ["Rest","Warm water/heat","Cold","Lying down","Eating","Pressure/massage","Walking","Fresh air"], "question_type": "amelioration"}}
- Associated symptoms: {"ui_hint": {"type": "chips", "options": ["Fever","Nausea","Vomiting","Headache","Fatigue","Dizziness","Loose stools","Cough","Runny nose","Loss of appetite"], "question_type": "associated_symptoms"}}
- Location (body area): {"ui_hint": {"type": "chips", "options": ["Head","Throat","Chest","Stomach/Abdomen","Back","Joints/Limbs","Skin","Eyes","Ears","Whole body"], "question_type": "location"}}

WHAT YOU MUST NEVER DO:
- NEVER ask yes/no when you need specific details
- NEVER suggest allopathic medicines (paracetamol, antibiotics, ibuprofen, etc.)
- NEVER make a definitive medical diagnosis — always say "likely" or "seems like"
- NEVER ask more than 9 questions total
- NEVER show a form or numbered list — keep everything conversational

=== FINAL DIAGNOSIS OUTPUT ===
When you have enough information:
1. Tell the user warmly that you have gathered enough information
2. Output the following STRICT JSON wrapped in \`\`\`json and \`\`\` tags
3. If RAG reference material was provided above, USE IT for remedy selection

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
      "name": "Remedy Name",
      "description": "Why it suits their specific symptoms — reference exact modalities",
      "potency": "30C or 200C",
      "method": "4 pills every 3 hours",
      "source": "boericke | classical | clinical"
    }
  ],
  "ayurvedic_remedies": [
    {
      "name": "Tulsi Kadha",
      "indication": "Sore throat, congestion",
      "preparation": "Boil 7 tulsi leaves with ginger and cloves in 2 cups water"
    }
  ],
  "home_remedies": [
    {
      "name": "Haldi Doodh",
      "indication": "Inflammation, immune support",
      "preparation": "Warm milk with 1/4 tsp haldi and black pepper before bedtime"
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
    const timeoutPromise = new Promise<Response>((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 30000)
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

        // ── Usage gating ─────────────────────────────────────────────────────
        const serviceClient = getServiceClient();
        try {
            const { data: usageResult, error: usageError } = await serviceClient
                .rpc('increment_chat_count', { p_user_id: user.id });
            
            if (!usageError && usageResult && !usageResult.allowed) {
                return new Response(JSON.stringify({
                    error: 'Monthly consultation limit reached',
                    code: 'USAGE_LIMIT',
                    current_count: usageResult.current_count,
                    limit: usageResult.limit,
                    plan: usageResult.plan,
                    resets_at: usageResult.resets_at,
                }), {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        } catch (usageErr) {
            // If RPC doesn't exist yet (migration not run), allow the request through
            console.warn('[chat/route] Usage check skipped:', usageErr);
        }

        const { messages, personaId, sessionId } = await req.json() || {};

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Messages array is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // ── Persona injection ────────────────────────────────────────────────
        let personaContext = '';
        if (personaId) {
            try {
                const { data: persona } = await serviceClient
                    .from('personas')
                    .select('name, age, gender, relation, conditions, allergies')
                    .eq('id', personaId)
                    .eq('user_id', user.id)
                    .single();
                
                if (persona) {
                    const parts = [
                        `Patient Profile: ${persona.name}`,
                        persona.age ? `Age: ${persona.age} years` : null,
                        persona.gender ? `Gender: ${persona.gender}` : null,
                        persona.relation ? `Relation: ${persona.relation}` : null,
                        persona.conditions?.length ? `Pre-existing conditions: ${persona.conditions.join(', ')}` : null,
                        persona.allergies ? `Allergies: ${persona.allergies}` : null,
                    ].filter(Boolean).join(', ');
                    
                    personaContext = `\n\n=== PATIENT CONTEXT ===\n${parts}\n`;
                    
                    // Child-safe mode for young patients
                    if (persona.age && persona.age <= 12) {
                        personaContext += `IMPORTANT: This patient is a child (${persona.age} years old). Use gentle, age-appropriate language. Always emphasize consulting a pediatrician. Avoid suggesting any adult-dose remedies.\n`;
                    }
                }
            } catch (personaErr) {
                console.warn('[chat/route] Persona fetch skipped:', personaErr);
            }
        }

        // Token overflow protection: sliding window (last 15 messages)
        const MAX_MESSAGES = 15;
        const processedMessages = messages.length > MAX_MESSAGES 
            ? messages.slice(messages.length - MAX_MESSAGES) 
            : messages;

        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return new Response(JSON.stringify({ error: 'Missing GROQ_API_KEY' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // ── RAG injection: after 3+ user turns, we have enough symptoms to retrieve context ──
        let ragContext = '';
        const userTurns = countUserTurns(processedMessages);

        if (userTurns >= 3) {
            const symptomSummary = extractSymptomSummary(processedMessages);
            ragContext = await fetchAllContext(symptomSummary);
        }

        // RAG injected at TOP — before the role instructions — for maximum LLM weight
        // Persona context appended after system prompt for patient-specific adaptation
        let finalSystemPrompt = ragContext
            ? `MEDICAL KNOWLEDGE BASE (use this to select remedies — prioritise remedies found here):\n\n${ragContext}\n\n---\n\n${SYSTEM_PROMPT}`
            : SYSTEM_PROMPT;
        
        if (personaContext) {
            finalSystemPrompt += personaContext;
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
                        model: AI_PHASE_CONFIG.models.groq,
                        messages: [
                            { role: 'system', content: finalSystemPrompt },
                            ...processedMessages,
                        ],
                        temperature: AI_PHASE_CONFIG.generation.temperature,
                        max_tokens: AI_PHASE_CONFIG.generation.maxTokens,
                        stream: true,
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

            // Return non-streaming response for Gemini fallback
            return new Response(JSON.stringify({ content: text, provider: 'gemini' }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Stream the Groq response back to the client
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const reader = groqResponse.body!.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

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
                            } catch {
                                // Skip malformed JSON
                            }
                        }
                    }
                } catch (err) {
                    console.error('Stream error:', err);
                } finally {
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
