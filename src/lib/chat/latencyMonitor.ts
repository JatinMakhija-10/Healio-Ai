// ── AI Response Latency Monitor ───────────────────────────────────────────────
// Thresholds, logging helpers, and alerting for the chat API pipeline.

export const LATENCY_WARN = {
    auth:          200,   // JWT verify (cache miss)
    dbFetch:       900,   // parallel: usage + persona + history + profile
    embed768:     1500,   // Gemini gemini-embedding-2-preview (3072-dim, Boericke+Ayurvedic)
    embed3072:    1500,   // Gemini gemini-embedding-001 (3072-dim, Home Remedies)
    ragBoericke:  1000,   // Boericke vector RPC
    ragAyurvedic: 1000,   // Ayurvedic vector RPC
    ragHomeRemedy:1000,   // Home remedy vector RPC
    rag:          2500,   // total embedding + vector search
    promptBuild:   100,   // system prompt assembly
    groqTTFT:     4000,   // time-to-first-token from Groq
    groqTotal:   12000,   // full stream completion
    total:       15000,   // full request wall-clock
} as const;

export type LatencyStage = keyof typeof LATENCY_WARN;

export interface LatencyRecord {
    stage: string;
    ms: number;
    slow: boolean;
    threshold: number | undefined;
}

// ── Per-Request Span Collector ────────────────────────────────────────────────
// Accumulates timing spans for a single request. Call flush() at request end
// to emit a single structured JSON log line with all stages.

export interface RequestTrace {
    spans: Record<string, number>;
    turn: number;
    model: string;
    ragCacheHit: boolean;
    isFinal: boolean;
    timestamp: string;
}

export class SpanCollector {
    private spans: Record<string, number> = {};
    private turn = 0;
    private model = '';
    private ragCacheHit = false;
    private isFinal = false;

    /** Record a completed span (stage name + duration in ms). */
    record(stage: string, ms: number): void {
        this.spans[stage] = ms;
    }

    /** Set request metadata for the trace output. */
    setMeta(meta: { turn?: number; model?: string; ragCacheHit?: boolean; isFinal?: boolean }): void {
        if (meta.turn !== undefined) this.turn = meta.turn;
        if (meta.model !== undefined) this.model = meta.model;
        if (meta.ragCacheHit !== undefined) this.ragCacheHit = meta.ragCacheHit;
        if (meta.isFinal !== undefined) this.isFinal = meta.isFinal;
    }

    /** Emit the full trace as a single structured JSON log line. */
    flush(): RequestTrace {
        const trace: RequestTrace = {
            spans: { ...this.spans },
            turn: this.turn,
            model: this.model,
            ragCacheHit: this.ragCacheHit,
            isFinal: this.isFinal,
            timestamp: new Date().toISOString(),
        };
        console.log(`[TRACE] ${JSON.stringify(trace)}`);
        return trace;
    }
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
