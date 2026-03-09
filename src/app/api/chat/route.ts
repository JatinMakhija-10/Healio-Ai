import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { AI_PHASE_CONFIG } from '@/lib/ai/config';

// Admin Supabase client for RAG queries
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''
);

// ── RAG retrieval helper ─────────────────────────────────────────────────────
async function fetchBoerickeContext(symptomSummary: string): Promise<string> {
    try {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey || !symptomSummary) return '';

        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const embResp = await ai.models.embedContent({
            model: AI_PHASE_CONFIG.models.embedding,
            contents: symptomSummary,
        });
        const embedding = embResp.embeddings?.[0]?.values;
        if (!embedding) return '';

        const { data } = await supabase.rpc('match_boericke_embeddings', {
            query_embedding: embedding,
            match_threshold: 0.60,
            match_count: 5,
        });

        if (!data?.length) return '';

        return '\n=== BOERICKE MATERIA MEDICA (RAG) ===\n' +
            (data as any[]).map((c: any, i: number) =>
                `[${i + 1}] ${c.remedy_name} (relevance: ${((c.similarity ?? 0) * 100).toFixed(0)}%)\n${c.chunk_text}`
            ).join('\n\n');
    } catch (e) {
        console.error('[Chat] RAG error:', e);
        return '';
    }
}

// ── Extract symptom summary from conversation for RAG ─────────────────────────
function extractSymptomSummary(messages: { role: string; content: string }[]): string {
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
    return userMessages.join(' ').slice(0, 500);
}

// ── Count how many turns have happened ─────────────────────────────────────────
function countUserTurns(messages: { role: string }[]): number {
    return messages.filter(m => m.role === 'user').length;
}

const SYSTEM_PROMPT = `You are Healio, a warm, caring, and knowledgeable homeopathic health assistant.
You speak in a friendly, supportive tone — like a trusted family doctor who genuinely cares.

LANGUAGE RULES (CRITICAL — follow these strictly):
- DETECT the user's language by checking their input:
  1. If the message contains Devanagari characters (Hindi script like मुझे, दर्द, पेट), respond ENTIRELY in Hindi using Devanagari script
  2. If the message is in romanized Hindi / Hinglish (e.g. "mujhe dard hai", "pet mein taklif", "sir dard ho raha"), respond in the SAME Hinglish style — use Roman script with Hindi words
  3. If the message is in pure English (e.g. "I have a headache"), respond in English
- MATCH the user's exact script and style in every response — do NOT translate between Devanagari and Roman unless the user switches first
- Once a language/script is established, maintain it throughout the entire conversation
- Common Hinglish keywords to detect: dard, taklif, bukhar, kamar, pet, sar, seena, ji machlana, ulti, thakan, neend, aram, khana, pani, dawai
- Never ask the user to switch languages — just match whatever they use

CONVERSATION RULES:
- Always ask ONE question at a time — never bombard with multiple questions
- After the user's opening message, acknowledge what they said with empathy FIRST, then ask your FIRST follow-up question
- Keep responses SHORT — maximum 3-4 lines per message
- Use simple, everyday language — no complex medical jargon
- Use emojis sparingly but warmly — 1-2 per message maximum
- Address the user as "aap" in Hindi, "you" in English — always respectful

CRITICAL: STRUCTURED FOLLOW-UP QUESTIONS
You MUST collect all of these in ORDER, one per message. NEVER skip any. NEVER ask yes/no when the answer requires details.

**Question 1 — LOCATION (if not already stated)**:
Ask: "Where exactly is the problem?"
If they said a body area already, ask to be more specific (e.g., "upper abdomen or lower?" / "oopar ya neeche?")

**Question 2 — PAIN TYPE / SENSATION**:
Ask: "What does it feel like?"
Give examples: burning, sharp, dull, throbbing, cramping, pressure
Hindi: "Dard kaisa hai — jalan, tez chubhan, halka dard, ya dhadakta hua?"
NEVER ask this as a yes/no — always ask WHAT TYPE.

**Question 3 — DURATION**:
Ask: "How long have you had this?"
Give options: since today, 1-3 days, 1 week, 2-4 weeks, 1+ month, years
Hindi: "Yeh kab se ho raha hai?"

**Question 4 — INTENSITY (1-10 scale)**:
Ask: "On a scale of 1 to 10, how bad is the pain?"
Hindi: "1 se 10 mein kitna dard hai? 1 matlab halka, 10 matlab sabse zyada"

**Question 5 — WHAT MAKES IT WORSE (Aggravations)**:
Ask: "What makes it worse?"
Give examples: eating, movement, cold, heat, stress, time of day
Hindi: "Kya karne se badh jata hai? — khana, chalna, thand, garmi, ya tension se?"

**Question 6 — WHAT GIVES RELIEF (Ameliorations)**:
Ask: "What makes it better or gives relief?"
Examples: rest, warm water, lying down, pressing, eating
Hindi: "Kya karne se aram milta hai?"

**Question 7 — ASSOCIATED SYMPTOMS**:
Ask: "Any other symptoms along with this?"
Examples: fever, nausea, vomiting, headache, fatigue, dizziness
Hindi: "Aur koi taklif bhi hai saath mein? — bukhar, ji machlana, sar dard, thakan?"

**Question 8 — ONSET / PREVIOUS EPISODES**:
Ask: "How did it start? Has this happened before?"
Hindi: "Yeh kaise shuru hua? Pehle kabhi hua hai?"

**Question 9 — STRESS / EMOTIONAL STATE** (ask gently):
Ask: "How are your stress levels and sleep these days?"
Hindi: "Aajkal tension ya neend mein koi dikkat?"

WHEN YOU HAVE ENOUGH INFORMATION (after 7-9 questions):
- Tell the user you have enough information
- Generate the final diagnosis as a STRICT JSON object wrapped in \`\`\`json and \`\`\` tags.
- IMPORTANT: If Boericke RAG reference material is provided, USE IT to select specific remedies with exact potencies and indications from the materia medica. Match the patient's symptom modalities (worse from / better from / type of pain / time of day) to remedy keynotes from the RAG context.

The JSON object must match this exact structure:
\`\`\`json
{
  "name": "Condition Name",
  "description": "2-3 line summary of what you understood from their symptoms.",
  "severity": "mild" | "moderate" | "severe",
  "confidence": 75,
  "bayesianFactors": "Brief note on why this diagnosis fits (symptom pattern, modalities, duration, triggers)",
  "differentialDiagnoses": [
    { "name": "Alternate Condition", "likelihood": "low" | "medium", "rationale": "Why considered" }
  ],
  "remedies": [
    {
      "name": "Homeopathic Remedy Name",
      "description": "Why it suits their specific symptoms — reference specific modalities",
      "potency": "30C or 200C",
      "method": "How to take e.g. 4 pills every 3 hours",
      "source": "boericke" | "classical" | "clinical"
    }
  ],
  "indianHomeRemedies": [
    {
      "name": "Ginger Tea / Adrak ki Chai",
      "description": "Helps with digestion and nausea",
      "ingredients": ["Adrak", "Paani"],
      "method": "Subah aur shaam"
    }
  ],
  "exercises": [],
  "warnings": ["Lifestyle tips", "Things to avoid"],
  "seekHelp": "When they should see a doctor immediately."
}
\`\`\`

WHAT YOU MUST NEVER DO:
- NEVER ask yes/no questions when you need specific information (location, type, duration)
- NEVER show generic "yes/no" options for questions about WHERE, WHAT TYPE, HOW LONG
- Never recommend allopathic medicines (paracetamol, antibiotics, etc.)
- Never make a definitive medical diagnosis — always say "likely" or "seems like"
- Never suggest Ayurvedic treatments
- Never ask more than 9 questions total
- Never show a form or list of questions — keep it conversational always
- If user describes emergency symptoms (chest pain with sweating, difficulty breathing, loss of consciousness, suicidal thoughts) — immediately say to call emergency services and stop the consultation
`;

export async function POST(req: NextRequest) {
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
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '',
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

        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Messages array is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return new Response(JSON.stringify({ error: 'Missing GROQ_API_KEY' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // ── RAG injection: after 5+ user turns, we have enough symptoms to retrieve context ──
        let ragContext = '';
        const userTurns = countUserTurns(messages);

        if (userTurns >= 5) {
            const symptomSummary = extractSymptomSummary(messages);
            ragContext = await fetchBoerickeContext(symptomSummary);
        }

        // Build the final system prompt — inject RAG if available
        const finalSystemPrompt = ragContext
            ? SYSTEM_PROMPT + '\n\n' + ragContext + '\n\nUse the above Boericke Materia Medica reference to select the most matching remedies when generating the diagnosis JSON.'
            : SYSTEM_PROMPT;

        // Call Groq API with streaming — wrapped in try-catch for network errors
        let groqResponse: Response | null = null;
        try {
            groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: finalSystemPrompt },
                        ...messages,
                    ],
                    temperature: 0.6,
                    max_tokens: 1500,
                    stream: true,
                }),
            });
        } catch (groqError) {
            console.error('Groq connection error:', groqError);
            // Will fall through to Gemini fallback below
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

            const geminiMessages = messages.map((m: { role: string; content: string }) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            }));

            const geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: finalSystemPrompt }] },
                        contents: geminiMessages,
                        generationConfig: { temperature: 0.6, maxOutputTokens: 1500 },
                    }),
                }
            );

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
    } catch (error) {
        console.error('Chat API error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
