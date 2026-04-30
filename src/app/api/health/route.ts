/**
 * /api/health — lightweight warm-up + health check endpoint.
 *
 * Fires a no-op (threshold=0.99) probe against each pgvector ivfflat index
 * so the Postgres planner warms the index into shared_buffers before real
 * queries hit it. Call this via Vercel Cron / UptimeRobot every 5 minutes
 * to prevent the 500ms–2s cold-probe penalty on first user query.
 *
 * Returns HTTP 200 {status:"ok"} on success or 503 on failure.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

import { getSupabaseAdmin } from '@/lib/ai/config';

export async function GET() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = getSupabaseAdmin() as any;

        // Zero-vector probes — match_threshold=0.99 returns zero rows
        // but forces the index pages into Postgres buffer cache.
        const zero768  = new Array(768).fill(0);
        const zero3072 = new Array(3072).fill(0);

        await Promise.allSettled([
            db.rpc('match_boericke_embeddings', {
                query_embedding: zero768,
                match_threshold: 0.99,
                match_count: 1,
            }),
            db.rpc('search_ayurvedic_knowledge', {
                query_embedding: zero768,
                match_threshold: 0.99,
                match_count: 1,
            }),
            db.rpc('match_home_remedy_embeddings', {
                query_embedding: zero3072,
                match_threshold: 0.99,
                match_count: 1,
            }),
        ]);

        return new Response(JSON.stringify({ status: 'ok', warmedAt: new Date().toISOString() }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
    } catch (err) {
        console.error('[health] Warm-up probe failed:', err);
        return new Response(JSON.stringify({ status: 'error' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
