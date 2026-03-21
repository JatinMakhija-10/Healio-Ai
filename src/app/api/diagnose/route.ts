/**
 * /api/diagnose
 *
 * Enhanced diagnosis endpoint — v2 with full Bayesian + RAG + AI pipeline.
 *
 * Accepts:
 *   · symptoms          — UserSymptomData (required)
 *   · userProfile       — patient profile (optional)
 *   · bayesianPriors    — top-K candidates from client Bayesian engine (optional)
 *                          [{ condition, bayesianScore, matchedKeywords }]
 *   · clinicalRuleAlerts — triggered clinical rule names (optional)
 *
 * Server-side pipeline:
 *   1. Multi-Query RAG    — embeds (symptoms + per-candidate condition names)
 *                           → retrieves unique Boericke chunks, ranked by similarity
 *   2. Enriched Prompt    — injects Bayesian priors + RAG context into system prompt
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

const SYSTEM_PROMPT = `You are Healio, a world-class AI homeopathic physician with deep expertise in classical \
homeopathy, Boericke's Materia Medica, and integrative medicine. Your role is to provide a highly accurate, \
evidence-based homeopathic diagnosis and 5 precise, individualised remedies.

INSTRUCTIONS:
- Use the Boericke RAG context (if provided) as your PRIMARY reference for remedy selection.
- Use Bayesian priors (if provided) as a STARTING HYPOTHESIS — confirm or refute them with the symptoms.
- If Bayesian candidates align with symptoms, choose from them; if they do not, override with your best assessment.
- Be specific: link each remedy to exact symptom modalities (worse from, better from, time, side).
- Respond ONLY with valid JSON that can be parsed by JSON.parse().

REQUIRED JSON FORMAT:
{
  "conditionName": "String — clinical name of the primary diagnosis",
  "confidence": Number — 0 to 100 reflecting overall certainty,
  "description": "String — brief explanation of why this diagnosis fits the presentation",
  "severity": "low" | "medium" | "high",
  "differentialDiagnoses": [
    { "name": "String", "likelihood": "low" | "medium" | "high", "rationale": "String" }
  ],
  "remedies": [
    {
      "name": "String — remedy name e.g. Belladonna",
      "potency": "String — e.g. 30C or 200C",
      "dosage": "String — e.g. 4 pills every 3 hours, max 4 doses",
      "indication": "String — specific modalities from this patient's presentation",
      "source": "boericke" | "classical" | "clinical"
    }
  ],
  "indianHomeRemedies": [
    { "remedy": "String", "preparation": "String", "rationale": "String" }
  ],
  "warnings": ["String — any red flags or cautions"],
  "seekHelp": Boolean — true if they need an allopathic doctor,
  "seekHelpReason": "String — if seekHelp is true, explain why",
  "reasoningTrace": "String — step-by-step reasoning: symptoms → Bayesian priors → RAG evidence → diagnosis → remedy selection"
}`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface BayesianPrior {
    condition: string;
    bayesianScore: number;
    matchedKeywords: string[];
    structuredRemedies?: Array<{ name: string; description: string }>;
    mcmcStats?: {
        credibleInterval?: { lower: number; upper: number; width: number };
        converged?: boolean;
        effectiveSampleSize?: number;
    };
}

interface BoerickeChunk {
    remedy_name: string;
    chunk_text: string;
    similarity: number;
}

// ─── RAG Helper ───────────────────────────────────────────────────────────────

/**
 * Multi-Query RAG: embeds multiple queries and fetches deduplicated Boericke chunks.
 * Falls back to single-query if multi-query fails.
 */
async function fetchMultiQueryRAG(
    symptomText: string,
    bayesianPriors: BayesianPrior[]
): Promise<{ context: string; remediesFound: string[] }> {
    if (!process.env.GEMINI_API_KEY) {
        return { context: "", remediesFound: [] };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Build query set: symptom text + top-3 condition-specific queries
    // SYMPHONY: inject matchedKeywords into each RAG query for precision retrieval
    const queries = [
        symptomText,
        ...bayesianPriors
            .slice(0, 3)
            .map((p) => {
                const keywordHint = p.matchedKeywords?.slice(0, 3).join(" ") || "";
                return `${p.condition} ${keywordHint} homeopathy remedy symptoms indications`.trim();
            }),
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

        // Retrieve Boericke chunks for each embedding in parallel
        const supabase = getSupabaseAdminClient();
        const rpcResults = await Promise.allSettled(
            validEmbeddings.map((embedding) =>
                supabase.rpc("match_boericke_embeddings", {
                    query_embedding: embedding,
                    match_threshold: AI_PHASE_CONFIG.rag.matchThreshold,
                    match_count: AI_PHASE_CONFIG.rag.matchCountPerQuery,
                })
            )
        );

        // Deduplicate and re-rank
        const seen = new Set<string>();
        const allChunks: BoerickeChunk[] = [];

        for (const result of rpcResults) {
            if (result.status === "fulfilled" && result.value.data) {
                for (const chunk of result.value.data as BoerickeChunk[]) {
                    const key = `${chunk.remedy_name}::${chunk.chunk_text?.slice(0, 120)}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        allChunks.push(chunk);
                    }
                }
            }
        }

        allChunks.sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
        const top = allChunks.slice(0, AI_PHASE_CONFIG.rag.maxTotalChunks);
        const remediesFound = [...new Set(top.map((c) => c.remedy_name).filter(Boolean))];

        const context =
            top.length > 0
                ? "=== BOERICKE MATERIA MEDICA (retrieved via multi-query RAG) ===\n\n" +
                top
                    .map(
                        (c, i) =>
                            `[${i + 1}] Remedy: ${c.remedy_name} (relevance ${((c.similarity ?? 0) * 100).toFixed(0)}%)\n${c.chunk_text}`
                    )
                    .join("\n\n")
                : "";

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
            const { data } = await supabase.rpc("match_boericke_embeddings", {
                query_embedding: embedding,
                match_threshold: AI_PHASE_CONFIG.rag.singleQueryThreshold,
                match_count: 4,
            });

            if (!data?.length) return { context: "", remediesFound: [] };

            const remediesFound = [...new Set((data as BoerickeChunk[]).map((c) => c.remedy_name))];
            const context =
                "=== BOERICKE MATERIA MEDICA ===\n\n" +
                (data as BoerickeChunk[])
                    .map((c) => `Remedy: ${c.remedy_name}\n${c.chunk_text}`)
                    .join("\n\n");

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
            bayesianPriors = [] as BayesianPrior[],
            clinicalRuleAlerts = [] as string[],
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
            const rag = await fetchMultiQueryRAG(symptomText, bayesianPriors);
            ragContext = rag.context;
            ragRemediesFound = rag.remediesFound;
        } catch (e) {
            console.error("[Diagnose] RAG retrieval error:", e);
        }

        // ── 2. Build Enriched Prompt (Symphony Knowledge Fusion) ────────────────

        // Bayesian priors section with MCMC uncertainty
        const bayesianSection =
            bayesianPriors.length > 0
                ? `=== BAYESIAN MCMC ENGINE OUTPUT (Metropolis-Hastings posterior inference) ===
Top differential candidates ranked by posterior probability:
${bayesianPriors
                    .map(
                        (p: BayesianPrior, i: number) =>
                            `  ${i + 1}. ${p.condition} — Posterior Score: ${p.bayesianScore}/100` +
                            (p.mcmcStats?.credibleInterval
                                ? `\n     95% Credible Interval: [${(p.mcmcStats.credibleInterval.lower * 100).toFixed(1)}%, ${(p.mcmcStats.credibleInterval.upper * 100).toFixed(1)}%] (Width: ${(p.mcmcStats.credibleInterval.width * 100).toFixed(1)}%)`
                                : "") +
                            (p.mcmcStats?.converged === false
                                ? `\n     ⚠ MCMC chain did NOT converge — treat this score with caution`
                                : "") +
                            (p.matchedKeywords?.length
                                ? `\n     Matched features: ${p.matchedKeywords.join(", ")}`
                                : "")
                    )
                    .join("\n")}

Note: These are MCMC posterior estimates. Wide credible intervals indicate diagnostic uncertainty — consider asking follow-up questions. Narrow intervals mean the statistical engine is confident.\n`
                : "";

        // Structured remedies from conditions database
        const structuredRemedySection =
            bayesianPriors.filter((p: BayesianPrior) => p.structuredRemedies?.length).length > 0
                ? `=== STRUCTURED DATABASE REMEDIES (from conditions database) ===
${bayesianPriors
                    .filter((p: BayesianPrior) => p.structuredRemedies?.length)
                    .map(
                        (p: BayesianPrior) =>
                            `Condition: ${p.condition}\n` +
                            (p.structuredRemedies || []).map((r: { name: string; description: string }, j: number) => `  ${j + 1}. ${r.name}: ${r.description}`).join("\n")
                    )
                    .join("\n\n")}

Note: These are pre-verified remedies from the database. Use them as a strong reference when selecting your final remedy recommendations.\n`
                : "";

        // Clinical rules section
        const clinicalSection =
            clinicalRuleAlerts.length > 0
                ? `=== CLINICAL DECISION RULE ALERTS ===
${clinicalRuleAlerts.map((r: string) => `  ⚠ ${r}`).join("\n")}\n`
                : "";

        const userPrompt = `${bayesianSection}${structuredRemedySection}${clinicalSection}
=== PATIENT PRESENTATION ===

Symptoms:
${JSON.stringify(symptoms, null, 2)}

Patient Profile:
${JSON.stringify(userProfile || {}, null, 2)}

${ragContext}

Based on all of the above, generate the diagnosis JSON.`;

        // ── 3. AI Inference (Symphony: Dynamic Temperature) ─────────────────────

        // SYMPHONY: dynamically adjust LLM temperature based on MCMC confidence
        const topScore = bayesianPriors[0]?.bayesianScore ?? 0;
        const mcmcConverged = bayesianPriors[0]?.mcmcStats?.converged ?? false;
        const dynamicTemperature =
            topScore > 85 && mcmcConverged ? 0.1   // High confidence + converged → strict adherence
                : topScore > 60 ? 0.2   // Moderate confidence → standard
                    : topScore > 40 ? 0.3   // Low confidence → slightly creative
                        : 0.4;  // Very uncertain → let AI explore

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

        let jsonResult: Record<string, any> = {};
        try {
            jsonResult = JSON.parse(aiResponseContent);
        } catch (parseError) {
            console.error("[Diagnose] AI returned invalid JSON:", aiResponseContent.slice(0, 500));
            return NextResponse.json(
                { error: "AI returned invalid JSON format" },
                { status: 500 }
            );
        }

        // ── 5. Smart Question Override (Information Gain) ──────────────────────

        let questionOverridden = false;

        // If the AI is uncertain (confidence < 75) AND we have multiple Bayesian candidates
        if ((jsonResult.confidence || 0) < 75 && bayesianPriors.length >= 2) {
            try {
                // Map priors to InformationGainSelector format
                const candidates = bayesianPriors.map((p: BayesianPrior) => ({
                    conditionName: p.condition,
                    score: p.bayesianScore
                }));

                const knownSymptoms = [
                    ...(symptoms.location || []),
                    ...(symptoms.additionalNotes?.split(',').map((s: string) => s.trim()) || []),
                    symptoms.painType
                ].filter(Boolean);

                const excludedSymptoms = symptoms.excludedSymptoms || [];

                // Get the single best question that maximizes entropy reduction
                const bestQuestion = infoGainSelector.selectBestQuestion(
                    candidates,
                    knownSymptoms,
                    excludedSymptoms,
                    detectedLanguage
                );

                if (bestQuestion) {
                    jsonResult.question = bestQuestion;
                    questionOverridden = true;
                }
            } catch (err) {
                console.warn("[Diagnose] Failed to generate info-gain question:", err);
            }
        }

        return NextResponse.json({
            diagnosis: jsonResult,
            meta: {
                provider,
                latencyMs,
                ragApplied: ragContext.length > 0,
                ragRemediesFound,
                ragChunks: ragContext.length > 0 ? (ragContext.match(/\[\d+\]/g)?.length ?? 1) : 0,
                bayesianPriorsUsed: bayesianPriors.length,
                clinicalRuleAlertsUsed: clinicalRuleAlerts.length,
                dynamicTemperature,
                structuredRemediesInjected: bayesianPriors.filter((p: BayesianPrior) => p.structuredRemedies?.length).length > 0,
                mcmcUncertaintyInjected: bayesianPriors.some((p: BayesianPrior) => p.mcmcStats?.credibleInterval != null),
                questionOverridden,
            },
        });
    } catch (error) {
        console.error("[Diagnose] Unhandled error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

