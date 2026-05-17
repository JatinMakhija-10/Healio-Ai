/**
 * Server-Side Rate Limiter — Sliding Window (In-Memory)
 *
 * ⚠️  IMPORTANT — SERVERLESS LIMITATION:
 * This in-memory store is scoped to a single lambda instance. Under load, Vercel
 * spins up multiple concurrent instances that do NOT share this Map. A single IP
 * can bypass the limit by hitting different instances simultaneously.
 *
 * For production distributed rate limiting, install Upstash and set:
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *   npm install @upstash/ratelimit @upstash/redis
 * Then replace this module with the @upstash/ratelimit sliding-window adapter.
 *
 * Usage:
 *   const limited = rateLimitCheck(req, 'chat', 20, 60_000);
 *   if (limited) return limited; // returns 429 NextResponse immediately
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitWindow {
    timestamps: number[];
}

const store = new Map<string, RateLimitWindow>();

const MAX_TTL_MS    = 10 * 60 * 1000; // entries older than 10 min are stale
const MAX_STORE_SIZE = 10_000;         // hard cap — evict 10% when breached

function evictStale(): void {
    const now = Date.now();

    // Full stale sweep whenever the store grows past half the cap
    if (store.size > MAX_STORE_SIZE / 2) {
        for (const [key, win] of store.entries()) {
            const lastSeen = win.timestamps[win.timestamps.length - 1] ?? 0;
            if (win.timestamps.length === 0 || now - lastSeen > MAX_TTL_MS) {
                store.delete(key);
            }
        }
    }

    // Hard cap: if still over limit after stale sweep, evict oldest 10%
    if (store.size >= MAX_STORE_SIZE) {
        const toDelete = Math.ceil(MAX_STORE_SIZE * 0.1);
        let deleted = 0;
        for (const key of store.keys()) {
            if (deleted >= toDelete) break;
            store.delete(key);
            deleted++;
        }
    }
}

function getIp(req: NextRequest | Request): string {
    return (
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        req.headers.get('x-real-ip') ||
        'unknown'
    );
}

/**
 * Check rate limit. Returns a 429 NextResponse if exceeded, null if allowed.
 *
 * @param req       - Incoming request (NextRequest or Request)
 * @param endpoint  - Short label for this endpoint (e.g. 'chat')
 * @param max       - Max requests allowed in the window
 * @param windowMs  - Window size in milliseconds
 */
export function rateLimitCheck(
    req: NextRequest | Request,
    endpoint: string,
    max: number,
    windowMs: number
): NextResponse | null {
    evictStale();

    const ip  = getIp(req);
    const key = `${ip}:${endpoint}`;
    const now = Date.now();

    let win = store.get(key);
    if (!win) {
        win = { timestamps: [] };
        store.set(key, win);
    }

    win.timestamps = win.timestamps.filter(ts => now - ts < windowMs);

    const resetAt = win.timestamps.length > 0
        ? Math.ceil((win.timestamps[0] + windowMs - now) / 1000)
        : 0;

    if (win.timestamps.length >= max) {
        return new NextResponse(
            JSON.stringify({
                error: 'Too many requests. Please slow down.',
                retryAfter: resetAt,
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': String(resetAt),
                    'X-RateLimit-Limit': String(max),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(Math.floor((now + resetAt * 1000) / 1000)),
                },
            }
        );
    }

    win.timestamps.push(now);
    return null;
}
