/**
 * /api/rag/multi-query
 *
 * Multi-Query RAG endpoint for the Healio diagnosis pipeline.
 */

import { NextResponse } from "next/server";
import { AI_PHASE_CONFIG, getSupabaseAdmin } from "@/lib/ai/config";
import { getJinaEmbedding } from "@/lib/ai/jina";
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

        // ── Step 1: Embed all queries in parallel ────────────────────────────────
        const embedQuery = async (query: string): Promise<number[]> => {
            try {
                return await getJinaEmbedding(query);
            } catch (error) {
                console.error("[RAG Multi-Query] Jina embedding failed:", error);
                return [];
            }
        };

        const embeddingResults = await Promise.allSettled(
            queries.map((query: string) => embedQuery(query))
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
