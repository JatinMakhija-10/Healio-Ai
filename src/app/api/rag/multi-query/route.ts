/**
 * /api/rag/multi-query
 *
 * Multi-Query RAG endpoint for the Healio diagnosis pipeline.
 *
 * Instead of a single symptom-text embedding (which can miss remedy-specific
 * passages), this endpoint:
 *   1. Accepts N query strings (symptoms + per-condition queries)
 *   2. Embeds all queries in parallel using Gemini text-embedding-004
 *   3. Retrieves Boericke chunks for each query in parallel
 *   4. Deduplicates and re-ranks by similarity score
 *   5. Returns a merged context string + list of distinct remedy names found
 *
 * Example request body:
 * {
 *   "queries": [
 *     "headache nausea light sensitivity",
 *     "Migraine homeopathy remedy symptoms",
 *     "Cluster Headache homeopathy remedy"
 *   ],
 *   "matchCount": 3,
 *   "matchThreshold": 0.65
 * }
 */

import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { AI_PHASE_CONFIG, getSupabaseAdmin } from "@/lib/ai/config";
import { rateLimitCheck } from "@/lib/api/rateLimit";

interface BoerickeChunk {
    remedy_name: string;
    chunk_text: string;
    similarity: number;
}

export async function POST(req: Request) {
    try {
        // ── Rate limit: 15 req / 60 s per IP ─────────────────────────────────────
        const limited = rateLimitCheck(req, 'rag', 15, 60_000);
        if (limited) return limited;

        // ── Auth guard — prevent unauthenticated Gemini API usage ────────────────
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(authHeader.slice(7));
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized — invalid token' }, { status: 401 });
        }

        const body = await req.json();
        const {
            queries,
            matchCount = AI_PHASE_CONFIG.rag.matchCountPerQuery,
            matchThreshold = AI_PHASE_CONFIG.rag.matchThreshold,
        } = body;

        if (!queries || !Array.isArray(queries) || queries.length === 0) {
            return NextResponse.json({ error: "queries array is required" }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            console.warn("[RAG Multi-Query] GEMINI_API_KEY not set — returning empty context");
            return NextResponse.json({ combinedContext: "", remediesFound: [], chunkCount: 0 });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // ── Step 1: Embed all queries in parallel ────────────────────────────────
        const embeddingResults = await Promise.allSettled(
            queries.map(async (query: string) => {
                const response = await ai.models.embedContent({
                    model: AI_PHASE_CONFIG.models.embedding,
                    contents: query,
                });
                return response.embeddings?.[0]?.values ?? [];
            })
        );

        const validEmbeddings = embeddingResults
            .filter(
                (r): r is PromiseFulfilledResult<number[]> =>
                    r.status === "fulfilled" && r.value.length > 0
            )
            .map((r) => r.value);

        if (validEmbeddings.length === 0) {
            console.warn("[RAG Multi-Query] All embeddings failed");
            return NextResponse.json({ combinedContext: "", remediesFound: [], chunkCount: 0 });
        }

        // ── Step 2: Query Boericke embeddings for each embedding in parallel ─────
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabase = getSupabaseAdmin() as any;
        const rpcResults = await Promise.allSettled(
            validEmbeddings.map((embedding) =>
                supabase.rpc("match_boericke_embeddings", {
                    query_embedding: embedding,
                    match_threshold: matchThreshold,
                    match_count: matchCount,
                })
            )
        );

        // ── Step 3: Deduplicate and re-rank by similarity ────────────────────────
        const seen = new Set<string>();
        const allChunks: BoerickeChunk[] = [];

        for (const result of rpcResults) {
            if (result.status === "fulfilled" && result.value.data) {
                for (const chunk of result.value.data as BoerickeChunk[]) {
                    // Use first 120 chars as deduplication key
                    const key = `${chunk.remedy_name}::${chunk.chunk_text?.slice(0, 120)}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        allChunks.push(chunk);
                    }
                }
            }
        }

        // Sort by similarity descending, take top N
        allChunks.sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
        const topChunks = allChunks.slice(0, AI_PHASE_CONFIG.rag.maxTotalChunks);

        const remediesFound = [
            ...new Set(topChunks.map((c) => c.remedy_name).filter(Boolean)),
        ];

        const combinedContext =
            topChunks.length > 0
                ? "=== BOERICKE MATERIA MEDICA (Multi-Query RAG) ===\n\n" +
                  topChunks
                      .map(
                          (c, i) =>
                              `[${i + 1}] Remedy: ${c.remedy_name} (relevance: ${((c.similarity ?? 0) * 100).toFixed(0)}%)\n${c.chunk_text}`
                      )
                      .join("\n\n")
                : "";

        return NextResponse.json({
            combinedContext,
            remediesFound,
            chunkCount: topChunks.length,
            queriesProcessed: validEmbeddings.length,
        });
    } catch (error) {
        console.error("[RAG Multi-Query] Unhandled error:", error);
        return NextResponse.json({ combinedContext: "", remediesFound: [], chunkCount: 0 });
    }
}
