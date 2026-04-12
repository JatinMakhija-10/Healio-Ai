/**
 * /api/diagnose
 *
 * Enhanced diagnosis endpoint — v2 with full Bayesian + RAG + AI pipeline
 * and convergence-gated safety controls (CP10).
 *
 * Accepts:
 *   · symptoms          — UserSymptomData (required)
 *   · userProfile       — patient profile (optional)
 *   · bayesianPriors    — top-K candidates from client Bayesian engine (optional)
 *                          [{ condition, bayesianScore, matchedKeywords, mcmcStats }]
 *   · clinicalRuleAlerts — triggered clinical rule names (optional)
 *   · posteriorRedFlags — posterior-based escalation alerts from MCMC (optional)
 *
 * Server-side pipeline:
 *   1. Multi-Query RAG    — embeds (symptoms + per-candidate condition names)
 *                           → retrieves unique Boericke chunks, ranked by similarity
 *   2. Enriched Prompt    — injects Bayesian priors + RAG context + convergence
 *                           warnings + posterior red flags into system prompt
 *   3. AI Inference       — Groq (primary) → Gemini (fallback)
 *   4. Response           — structured JSON + metadata
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { AI_PHASE_CONFIG } from "@/lib/ai/config";
import { createClient } from "@supabase/supabase-js";
import { infoGainSelector } from "@/lib/diagnosis/advanced/InformationGainSelector";

// Admin Supabase client factory — created lazily at runtime so build-time env absence doesn't crash
function getSupabaseAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
        ""
    );
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Healio's Natural Language Formatter and Medical Educator.
The core mathematical MCMC engine has ALREADY diagnosed the patient. Your job is NOT to diagnose the patient. Your job is ONLY to act as a bridge—taking the mathematical output and formatting it into a comforting, easy-to-understand explanation for the patient, and formatting the predefined database remedies using the Boericke Materia Medica RAG context.

INSTRUCTIONS:
- DO NOT invent a new condition. Use the PRECISE condition provided in the prompt.
- Write a compassionate description of the diagnosis.
- Write a clear step-by-step reasoning trace (rationale) explaining to the user why the system chose this diagnosis based on their symptoms.
- Take the provided "Structured Remedies" and format them nicely based on the Boericke RAG context.
- Respond ONLY with valid JSON that can be parsed by JSON.parse().

REQUIRED JSON FORMAT:
{
  "description": "String — brief, compassionate explanation of the diagnosis",
  "rationale": "String — step-by-step reasoning explaining why this matches their symptoms",
  "remedies": [
    {
      "name": "String — MUST be one of the provided structured remedies",
      "potency": "String — recommend a standard potency (e.g., 30C or 200C)",
      "dosage": "String — specific dosage instructions",
      "indication": "String — specific modalities for why it helps their specific symptoms",
      "source": "boericke" | "clinical"
    }
  ],
  "indianHomeRemedies": [
    { "remedy": "String", "preparation": "String", "rationale": "String" }
  ],
  "warnings": ["String — any red flags, cautions, or lifestyle advice"],
  "seekHelp": Boolean — true if they need an allopathic doctor urgently,
  "seekHelpReason": "String — if seekHelp is true, explain why (e.g., if posterior red flags were detected)"
}`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrimaryDiagnosis {
    condition: string;
    bayesianScore: number;
    matchedKeywords: string[];
    structuredRemedies?: Array<{ name: string; description: string }>;
}

interface BoerickeChunk {
    remedy_name: string;
    chunk_text: string;
    similarity: number;
}

interface AyurvedicChunk {
    book: string;
    category: string;
    section: string;
    text: string;
    similarity: number;
}

// ─── RAG Helper ───────────────────────────────────────────────────────────────

/**
 * Multi-Query RAG: embeds multiple queries and fetches deduplicated Boericke chunks.
 * Falls back to single-query if multi-query fails.
 */
async function fetchMultiQueryRAG(
    symptomText: string,
    primaryDiagnosis: PrimaryDiagnosis
): Promise<{ context: string; remediesFound: string[] }> {
    if (!process.env.GEMINI_API_KEY) {
        return { context: "", remediesFound: [] };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Build query set: symptom text + condition-specific query
    const keywordHint = primaryDiagnosis.matchedKeywords?.slice(0, 3).join(" ") || "";
    const queries = [
        symptomText,
        `${primaryDiagnosis.condition} ${keywordHint} homeopathy remedy symptoms indications`.trim(),
    ];

    try {
        // Embed all queries in parallel
        const embeddingResults = await Promise.allSettled(
            queries.map((q) =>
                ai.models.embedContent({
                    model: AI_PHASE_CONFIG.models.embedding,
                    contents: q,
                })
            )
        );

        const validEmbeddings = embeddingResults
            .filter(
                (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof ai.models.embedContent>>> =>
                    r.status === "fulfilled"
            )
            .map((r) => r.value.embeddings?.[0]?.values)
            .filter((e): e is number[] => !!e && e.length > 0);

        if (validEmbeddings.length === 0) throw new Error("No valid embeddings");

        // Retrieve Boericke and Ayurvedic chunks for each embedding in parallel
        const supabase = getSupabaseAdminClient();
        
        const rpcPromises: Promise<any>[] = [];
        validEmbeddings.forEach(embedding => {
            // 1. Fetch Boericke
            rpcPromises.push(
                supabase.rpc("match_boericke_embeddings", {
                    query_embedding: embedding,
                    match_threshold: AI_PHASE_CONFIG.rag.matchThreshold,
                    match_count: Math.ceil(AI_PHASE_CONFIG.rag.matchCountPerQuery / 2),
                }).then(res => ({ type: 'boericke', data: res.data }))
            );
            // 2. Fetch Ayurvedic
            rpcPromises.push(
                supabase.rpc("search_ayurvedic_knowledge", {
                    query_embedding: embedding,
                    match_threshold: 0.65, // slightly more forgiving for general text
                    match_count: Math.ceil(AI_PHASE_CONFIG.rag.matchCountPerQuery / 2),
                }).then(res => ({ type: 'ayurvedic', data: res.data }))
            );
        });

        const rpcResults = await Promise.allSettled(rpcPromises);

        // Deduplicate and re-rank
        const seenBoericke = new Set<string>();
        const seenAyurvedic = new Set<string>();
        const allBoerickeChunks: BoerickeChunk[] = [];
        const allAyurvedicChunks: AyurvedicChunk[] = [];

        for (const result of rpcResults) {
            if (result.status === "fulfilled" && result.value.data) {
                if (result.value.type === 'boericke') {
                    for (const chunk of result.value.data as BoerickeChunk[]) {
                        const key = `${chunk.remedy_name}::${chunk.chunk_text?.slice(0, 120)}`;
                        if (!seenBoericke.has(key)) {
                            seenBoericke.add(key);
                            allBoerickeChunks.push(chunk);
                        }
                    }
                } else if (result.value.type === 'ayurvedic') {
                    for (const chunk of result.value.data as AyurvedicChunk[]) {
                        const key = `${chunk.book}::${chunk.text?.slice(0, 120)}`;
                        if (!seenAyurvedic.has(key)) {
                            seenAyurvedic.add(key);
                            allAyurvedicChunks.push(chunk);
                        }
                    }
                }
            }
        }

        allBoerickeChunks.sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
        allAyurvedicChunks.sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
        
        const topBoericke = allBoerickeChunks.slice(0, Math.ceil(AI_PHASE_CONFIG.rag.maxTotalChunks / 2));
        const topAyurvedic = allAyurvedicChunks.slice(0, Math.ceil(AI_PHASE_CONFIG.rag.maxTotalChunks / 2));
        
        const remediesFound = [...new Set(topBoericke.map((c) => c.remedy_name).filter(Boolean))];

        let context = "";
        
        if (topBoericke.length > 0) {
            context += "=== BOERICKE MATERIA MEDICA (retrieved via multi-query RAG) ===\n\n" +
                topBoericke.map((c, i) =>
                    `[B${i + 1}] Remedy: ${c.remedy_name} (relevance ${((c.similarity ?? 0) * 100).toFixed(0)}%)\n${c.chunk_text}`
                ).join("\n\n") + "\n\n";
        }
        
        if (topAyurvedic.length > 0) {
            context += "=== AYURVEDIC KNOWLEDGE BASE (retrieved via multi-query RAG) ===\n\n" +
                topAyurvedic.map((c, i) =>
                    `[A${i + 1}] Source: ${c.book} / ${c.section} (relevance ${((c.similarity ?? 0) * 100).toFixed(0)}%)\n${c.text}`
                ).join("\n\n");
        }

        return { context, remediesFound };
    } catch (err) {
        console.warn("[RAG] Multi-query failed, trying single-query fallback:", err);

        // ── Single-query fallback ──────────────────────────────────────────────
        try {
            const resp = await ai.models.embedContent({
                model: AI_PHASE_CONFIG.models.embedding,
                contents: symptomText,
            });
            const embedding = resp.embeddings?.[0]?.values;
            if (!embedding) return { context: "", remediesFound: [] };

            const supabase = getSupabaseAdminClient();
            
            // Single query fallback: Fetch both in parallel
            const [boerickeRes, ayurvedicRes] = await Promise.all([
                supabase.rpc("match_boericke_embeddings", {
                    query_embedding: embedding,
                    match_threshold: AI_PHASE_CONFIG.rag.singleQueryThreshold,
                    match_count: 3,
                }),
                supabase.rpc("search_ayurvedic_knowledge", {
                    query_embedding: embedding,
                    match_threshold: 0.65,
                    match_count: 3,
                })
            ]);

            const boerickeData = boerickeRes.data as BoerickeChunk[] | null;
            const ayurvedicData = ayurvedicRes.data as AyurvedicChunk[] | null;

            if (!boerickeData?.length && !ayurvedicData?.length) return { context: "", remediesFound: [] };

            const remediesFound = [...new Set((boerickeData || []).map((c) => c.remedy_name))];
            
            let context = "";
            if (boerickeData?.length) {
                context += "=== BOERICKE MATERIA MEDICA ===\n\n" +
                    boerickeData.map((c) => `Remedy: ${c.remedy_name}\n${c.chunk_text}`).join("\n\n") + "\n\n";
            }
            if (ayurvedicData?.length) {
                context += "=== AYURVEDIC KNOWLEDGE BASE ===\n\n" +
                    ayurvedicData.map((c) => `Source: ${c.book} / ${c.section}\n${c.text}`).join("\n\n");
            }

            return { context, remediesFound };
        } catch {
            return { context: "", remediesFound: [] };
        }
    }
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
    try {
        // ── Auth guard ───────────────────────────────────────────────────────
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized — missing token' }, { status: 401 });
        }
        const token = authHeader.slice(7);
        const supabase = getSupabaseAdminClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized — invalid token' }, { status: 401 });
        }

        const body = await req.json();
        const {
            symptoms,
            userProfile,
            primaryDiagnosis = {} as PrimaryDiagnosis,
            clinicalRuleAlerts = [] as string[],
            posteriorRedFlags = [] as string[],
            detectedLanguage = 'en' as 'en' | 'hi' | 'hinglish',
        } = body;

        if (!symptoms) {
            return NextResponse.json({ error: "Symptoms data is required" }, { status: 400 });
        }

        // ── 1. Multi-Query RAG ─────────────────────────────────────────────────
        const symptomText = [
            ...(symptoms.location ?? []),
            symptoms.painType ?? "",
            symptoms.additionalNotes ?? "",
            symptoms.triggers ?? "",
            symptoms.duration ?? "",
        ]
            .filter(Boolean)
            .join(" ");

        let ragContext = "";
        let ragRemediesFound: string[] = [];

        try {
            if (primaryDiagnosis.condition) {
                const rag = await fetchMultiQueryRAG(symptomText, primaryDiagnosis);
                ragContext = rag.context;
                ragRemediesFound = rag.remediesFound;
            }
        } catch (e) {
            console.error("[Diagnose] RAG retrieval error:", e);
        }

        // ── 2. Build Enriched Prompt (Symphony Knowledge Fusion) ────────────────

        const bayesianSection = primaryDiagnosis.condition ?
            `=== BAYESIAN MCMC ENGINE OUTPUT (AUTHORITATIVE DIAGNOSIS) ===
The MCMC engine has mathematically diagnosed the patient with: ${primaryDiagnosis.condition}
Matched features: ${primaryDiagnosis.matchedKeywords?.join(", ") || "None"}
Posterior Confidence Score: ${primaryDiagnosis.bayesianScore}/100

CRITICAL: You are NOT allowed to change this diagnosis. Do not invent a different condition. You must weave this exact diagnosis into your response description and rationale.\n` : "";

        const structuredRemedySection = primaryDiagnosis.structuredRemedies?.length
            ? `=== STRUCTURED DATABASE REMEDIES (from conditions database) ===
${primaryDiagnosis.structuredRemedies.map((r: { name: string; description: string }, j: number) => `  ${j + 1}. ${r.name}: ${r.description}`).join("\n")}

Note: These are pre-verified remedies from the database. You MUST format and recommend at least one of these remedies as your primary recommendation.\n`
            : "";

        const clinicalSection = clinicalRuleAlerts.length > 0
            ? `=== CLINICAL DECISION RULE ALERTS ===
${clinicalRuleAlerts.map((r: string) => `  ⚠ ${r}`).join("\n")}\n`
            : "";

        const posteriorRedFlagSection = posteriorRedFlags.length > 0
            ? `=== ⚠ POSTERIOR-BASED RED FLAG ALERTS (from MCMC engine) ===
${posteriorRedFlags.map((f: string) => `  ${f}`).join("\n")}

CRITICAL: The MCMC engine detected non-trivial posterior probability for one or more life-threatening conditions.
Include appropriate warnings and set seekHelp=true.\n`
            : "";

        const userPrompt = `${bayesianSection}${structuredRemedySection}${clinicalSection}${posteriorRedFlagSection}
=== PATIENT PRESENTATION ===

Symptoms:
${JSON.stringify(symptoms, null, 2)}

Patient Profile:
${JSON.stringify(userProfile || {}, null, 2)}

${ragContext}

Based on all of the above, generate the formatting JSON.`;

        // ── 3. AI Inference (Symphony Formatter) ──

        const topScore = primaryDiagnosis.bayesianScore || 0;
        const hasPosteriorRedFlags = posteriorRedFlags.length > 0;

        let dynamicTemperature = 0.2;
        if (hasPosteriorRedFlags) {
            dynamicTemperature = 0.1;
        } else if (topScore < 40) {
            dynamicTemperature = 0.3; // Let it explain uncertainty creatively
        }

        let aiResponseContent = "";
        let provider: string = AI_PHASE_CONFIG.primary;
        const start = performance.now();

        // Primary: Groq (Llama 3.3 70B)
        try {
            const groqKey = process.env.GROQ_API_KEY;
            if (!groqKey) throw new Error("Missing GROQ_API_KEY");

            const groq = new OpenAI({
                baseURL: AI_PHASE_CONFIG.endpoints.groq,
                apiKey: groqKey,
            });

            const completion = await groq.chat.completions.create({
                model: AI_PHASE_CONFIG.models.groq,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userPrompt },
                ],
                response_format: { type: "json_object" },
                temperature: dynamicTemperature,
            });

            aiResponseContent = completion.choices[0].message.content || "{}";
        } catch (groqError) {
            console.warn("[Diagnose] Groq failed, falling back to Gemini:", groqError);
            provider = AI_PHASE_CONFIG.fallback;

            // Fallback: Gemini 2.5 Flash
            const geminiKey = process.env.GEMINI_API_KEY;
            if (!geminiKey) throw new Error("Missing GEMINI_API_KEY");

            const genai = new GoogleGenAI({ apiKey: geminiKey });

            const response = await genai.models.generateContent({
                model: AI_PHASE_CONFIG.models.gemini,
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text:
                                    "System Instructions:\n" +
                                    SYSTEM_PROMPT +
                                    "\n\n" +
                                    userPrompt,
                            },
                        ],
                    },
                ],
                config: {
                    temperature: dynamicTemperature,
                    responseMimeType: "application/json",
                },
            });

            aiResponseContent = response.text || "{}";
        }

        const latencyMs = Math.round(performance.now() - start);

        // ── 4. Parse & Return ──────────────────────────────────────────────────

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let jsonResult: Record<string, any> = {};
        try {
            jsonResult = JSON.parse(aiResponseContent);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (parseError) {
            console.error("[Diagnose] AI returned invalid JSON:", aiResponseContent.slice(0, 500));
            return NextResponse.json(
                { error: "AI returned invalid JSON format" },
                { status: 500 }
            );
        }

        // CP8: If posterior red flags exist, force seekHelp
        if (hasPosteriorRedFlags && !jsonResult.seekHelp) {
            jsonResult.seekHelp = true;
            jsonResult.seekHelpReason = jsonResult.seekHelpReason ||
                "The statistical engine detected non-trivial probability for serious conditions. Professional evaluation is recommended.";
        }

        return NextResponse.json({
            diagnosis: jsonResult,
            meta: {
                provider,
                latencyMs,
                ragApplied: ragContext.length > 0,
                ragRemediesFound,
                ragChunks: ragContext.length > 0 ? (ragContext.match(/\[\d+\]/g)?.length ?? 1) : 0,
                clinicalRuleAlertsUsed: clinicalRuleAlerts.length,
                posteriorRedFlagsCount: posteriorRedFlags.length,
                dynamicTemperature,
            },
        });
    } catch (error) {
        console.error("[Diagnose] Unhandled error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
