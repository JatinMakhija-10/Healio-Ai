// ── AI Response Latency Monitor ───────────────────────────────────────────────
// Thresholds, logging helpers, and alerting for the chat API pipeline.

export const LATENCY_WARN = {
    auth:      200,   // JWT verify (cache miss)
    dbFetch:   900,   // parallel: usage + persona + history + profile
    rag:      2500,   // embedding + vector search
    groqTTFT: 4000,   // time-to-first-token from Groq
    total:   15000,   // full request wall-clock
} as const;

export type LatencyStage = keyof typeof LATENCY_WARN;

export interface LatencyRecord {
    stage: string;
    ms: number;
    slow: boolean;
    threshold: number | undefined;
}

/**
 * Logs a single pipeline stage latency.
 * Emits ⚠️ SLOW when the stage exceeds its threshold.
 * Returns the structured record (useful for tests / telemetry).
 */
export function logLatency(stage: string, ms: number): LatencyRecord {
    const threshold = LATENCY_WARN[stage as LatencyStage];
    const slow = !!(threshold && ms > threshold);
    const flag = slow ? '⚠️  SLOW' : '✓';
    console.log(
        `[LATENCY] ${flag} ${stage}: ${ms}ms${
            slow ? ` (threshold: ${threshold}ms)` : ''
        }`
    );
    return { stage, ms, slow, threshold };
}

/**
 * Fires a critical alert when total request time exceeds the total threshold.
 * Separate from logLatency so callers can control when it fires.
 */
export function alertIfSlow(totalMs: number): void {
    if (totalMs > LATENCY_WARN.total) {
        console.error(
            `[LATENCY] 🚨 ALERT total=${totalMs}ms exceeds ${LATENCY_WARN.total}ms threshold — investigate pipeline stages above`
        );
    }
}
