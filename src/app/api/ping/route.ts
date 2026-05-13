/**
 * /api/ping — minimal liveness probe for external uptime monitors.
 *
 * Designed to be called every 1-5 minutes by UptimeRobot / Better Stack.
 * Does NO database / network / disk work — answers in <5ms so it stays
 * inside the free-tier compute budget on Vercel.
 *
 * For deeper checks (DB warm-up, vector index probe) use /api/health.
 *
 * Returns:
 *   200 { status: "ok", uptime, ts, commit }   — process is alive
 */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const STARTED_AT = Date.now();

export async function GET() {
    return new Response(
        JSON.stringify({
            status: 'ok',
            ts: new Date().toISOString(),
            uptime_ms: Date.now() - STARTED_AT,
            commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
            env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
        }),
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0',
            },
        },
    );
}

// Some uptime monitors prefer HEAD requests (cheaper, no body).
export async function HEAD() {
    return new Response(null, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
