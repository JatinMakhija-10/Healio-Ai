/**
 * Server-Side Rate Limiter — Sliding Window
 *
 * Uses a module-level in-memory Map keyed by `${ip}:${endpoint}`.
 * Persists across warm Vercel lambda invocations (no Redis needed).
 *
 * Usage:
 *   const limited = rateLimitCheck(req, 'chat', 20, 60_000);
 *   if (limited) return limited; // returns 429 NextResponse immediately
 */

import { NextRequest, NextResponse } from 'next/server';

interface Window {
    timestamps: number[];
}

// Module-level store — survives warm restarts
const store = new Map<string, Window>();

// Evict keys older than 10 minutes to prevent unbounded memory growth
const MAX_TTL_MS = 10 * 60 * 1000;
let lastEviction = Date.now();

function evictStale(): void {
    const now = Date.now();
    if (now - lastEviction < 60_000) return; // evict at most once per minute
    lastEviction = now;
    for (const [key, win] of store.entries()) {
        if (win.timestamps.length === 0 || now - win.timestamps[win.timestamps.length - 1] > MAX_TTL_MS) {
            store.delete(key);
        }
    }
}

function getIp(req: NextRequest | Request): string {
    // NextRequest has headers as Headers object
    const headers = req.headers;
    return (
        headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        headers.get('x-real-ip') ||
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

    const ip = getIp(req);
    const key = `${ip}:${endpoint}`;
    const now = Date.now();

    let win = store.get(key);
    if (!win) {
        win = { timestamps: [] };
        store.set(key, win);
    }

    // Slide the window — remove timestamps outside the window
    win.timestamps = win.timestamps.filter(ts => now - ts < windowMs);

    const remaining = Math.max(0, max - win.timestamps.length);
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

    // Allow — record this timestamp
    win.timestamps.push(now);

    return null; // allowed
}
