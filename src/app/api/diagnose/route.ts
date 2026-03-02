import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { AI_PHASE_CONFIG } from '@/lib/ai/config';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (Admin client for RAG queries)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''
);

// We define our System Instructions
const SYSTEM_PROMPT = `You are Healio, a world-class AI homeopathic physician. Your goal is to provide a single, highly accurate homeopathic diagnosis and 5 precise homeopathic remedies based on the user's symptoms.
Use the Boericke and OpenHomeopath context provided. If no context exists, rely on your extensive pre-trained knowledge of homeopathy.

You MUST respond strictly in the following JSON format. Your entire response must be parsable by JSON.parse():
{
  "conditionName": "String: Name of the condition e.g. Acute Migraine",
  "confidence": "Number: 0 to 100",
  "description": "String: A brief description of why this condition fits the symptoms.",
  "severity": "low" | "medium" | "high",
  "remedies": [
    {
      "name": "String: Homeopathic Remedy Name e.g. Belladonna 30CH",
      "potency": "String: Suggested Potency e.g. 30CH or 200CH",
      "dosage": "String: e.g. 4 pills every 3 hours",
      "indication": "String: Why this exact remedy matches their presentation"
    } 
  ],
  "warnings": [ "String: any immediate medical warnings" ],
  "seekHelp": "Boolean: true if they need an allopathic doctor immediately",
  "reasoningTrace": "String: Step-by-step reasoning linking their symptoms to the diagnosis."
}`;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { symptoms, userProfile, messages } = body;

        if (!symptoms) {
            return NextResponse.json({ error: 'Symptoms data is required' }, { status: 400 });
        }

        // 1. Fetch Boericke Context (RAG)
        let boerickeContext = "";
        try {
            if (process.env.GEMINI_API_KEY) {
                // Get embedding for the symptom text
                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                const symptomText = Object.values(symptoms).join(" ");

                const response = await ai.models.embedContent({
                    model: 'text-embedding-004',
                    contents: symptomText,
                });
                if (!response.embeddings || !response.embeddings[0]) throw new Error("No embedding");
                const userEmbedding = response.embeddings[0].values;

                // Query Supabase for similar chunks
                const { data } = await supabase.rpc('match_boericke_embeddings', {
                    query_embedding: userEmbedding,
                    match_threshold: 0.7,
                    match_count: 3
                });

                if (data && data.length > 0) {
                    boerickeContext = "RAG Context from Boericke Manual:\n" + data.map((d: any) => `Remedy: ${d.remedy_name}\nContext: ${d.chunk_text}`).join("\n\n");
                }
            }
        } catch (error) {
            console.error("RAG Retrieval Error:", error);
            // Fallthrough gracefully
        }

        // Compile prompt text
        const prompt = `
Patient Symptoms:
${JSON.stringify(symptoms, null, 2)}

Patient Profile:
${JSON.stringify(userProfile || {}, null, 2)}

${boerickeContext}

Generate the diagnosis JSON result.
`;

        let aiResponseContent = "";
        let provider = AI_PHASE_CONFIG.primary;

        const start = performance.now();

        // 2. Try Primary Provider (Groq)
        try {
            const groqKey = process.env.GROQ_API_KEY;
            if (!groqKey) throw new Error("Missing GROQ_API_KEY");

            const groq = new OpenAI({
                baseURL: AI_PHASE_CONFIG.endpoints.groq,
                apiKey: groqKey
            });

            const completion = await groq.chat.completions.create({
                model: AI_PHASE_CONFIG.models.groq,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2
            });

            aiResponseContent = completion.choices[0].message.content || "{}";
        } catch (groqError) {
            console.warn("Groq failed, falling back to Gemini:", groqError);
            provider = AI_PHASE_CONFIG.fallback;

            // 3. Try Fallback Provider (Gemini)
            const geminiKey = process.env.GEMINI_API_KEY;
            if (!geminiKey) throw new Error("Missing GEMINI_API_KEY");

            const genai = new GoogleGenAI({ apiKey: geminiKey });

            const response = await genai.models.generateContent({
                model: AI_PHASE_CONFIG.models.gemini,
                contents: [
                    { role: "user", parts: [{ text: "System prompt:\n" + SYSTEM_PROMPT + "\n\n" + prompt }] }
                ],
                config: {
                    temperature: 0.2,
                    responseMimeType: "application/json"
                }
            });

            aiResponseContent = response.text || "{}";
        }

        const latencyMs = performance.now() - start;

        // Parse JSON output
        let jsonResult = {};
        try {
            jsonResult = JSON.parse(aiResponseContent);
        } catch (e) {
            console.error("Failed to parse AI JSON:", aiResponseContent);
            return NextResponse.json({ error: 'AI returned invalid JSON format' }, { status: 500 });
        }

        return NextResponse.json({
            diagnosis: jsonResult,
            meta: {
                provider,
                latencyMs: Math.round(latencyMs),
                ragApplied: boerickeContext.length > 0
            }
        });

    } catch (error) {
        console.error("Diagnose API error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
