import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { rateLimitCheck } from '@/lib/api/rateLimit';
import { getSupabaseAdmin } from '@/lib/ai/config';

export async function POST(req: Request) {
    try {
        // ── Rate limit: 30 req / 60 s per IP ─────────────────────────────────────
        const limited = rateLimitCheck(req, 'embeddings', 30, 60_000);
        if (limited) return limited;

        // ── Auth guard — prevent unauthenticated OpenAI API usage ───────────────
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(authHeader.slice(7));
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized — invalid token' }, { status: 401 });
        }

        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // Check if real key is available
        const hasKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');

        if (hasKey) {
            try {
                const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
                const response = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: text,
                    encoding_format: "float",
                });

                return NextResponse.json({ embedding: response.data[0].embedding });
            } catch (error) {
                console.error("OpenAI API Error:", error);
                // Fallthrough to mock
            }
        }

        // Return empty embedding to signal the retrieval layer to use keyword fallback
        // instead of random vectors that silently degrade diagnosis accuracy
        console.warn("Embedding unavailable (No OpenAI Key or API Error) — keyword fallback will be used");
        return NextResponse.json({
            embedding: [],
            fallback: true,
            message: 'Embedding service unavailable — using keyword matching'
        });

    } catch (error) {
        console.error("Embedding route error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
