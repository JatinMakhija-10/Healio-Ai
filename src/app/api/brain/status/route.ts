/**
 * GET /api/brain/status
 *
 * Returns health of the Brain knowledge base:
 *   - Row counts per vector table
 *   - Jina API key pool status
 *   - Quick probe embedding round-trip latency
 */

import { NextResponse } from 'next/server';
import { getBrainHealth } from '@/lib/brain';
import { getJinaPoolStatus } from '@/lib/ai/jina';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const t0 = Date.now();
        const health = await getBrainHealth();
        const latencyMs = Date.now() - t0;

        return NextResponse.json({
            ok: true,
            latencyMs,
            tables: {
                boericke_embeddings:           health.boericke,
                home_remedy_embeddings:        health.homeRemedies,
                ayurvedic_knowledge_embeddings: health.ayurvedic,
                total: (health.boericke ?? 0) + (health.homeRemedies ?? 0) + (health.ayurvedic ?? 0),
            },
            jinaPool: getJinaPoolStatus(),
            timestamp: new Date().toISOString(),
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
