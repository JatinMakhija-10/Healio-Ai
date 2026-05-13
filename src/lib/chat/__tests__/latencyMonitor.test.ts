import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logLatency, alertIfSlow, LATENCY_WARN, type LatencyStage } from '../latencyMonitor';

// ── logLatency ───────────────────────────────────────────────────────────────

describe('logLatency', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('returns a record with the correct stage and ms', () => {
        const record = logLatency('auth', 50);
        expect(record.stage).toBe('auth');
        expect(record.ms).toBe(50);
    });

    it('marks record as NOT slow when under threshold', () => {
        const record = logLatency('auth', LATENCY_WARN.auth - 1);
        expect(record.slow).toBe(false);
    });

    it('marks record as slow when exactly over threshold', () => {
        const record = logLatency('auth', LATENCY_WARN.auth + 1);
        expect(record.slow).toBe(true);
    });

    it('marks record as NOT slow when exactly at threshold', () => {
        const record = logLatency('auth', LATENCY_WARN.auth);
        expect(record.slow).toBe(false);
    });

    it('includes threshold in the returned record', () => {
        const record = logLatency('rag', 100);
        expect(record.threshold).toBe(LATENCY_WARN.rag);
    });

    it('emits a console.log for every call', () => {
        logLatency('dbFetch', 200);
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('[LATENCY]')
        );
    });

    it('includes "SLOW" in log message when over threshold', () => {
        logLatency('groqTTFT', LATENCY_WARN.groqTTFT + 500);
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('SLOW'));
    });

    it('does NOT include "SLOW" in log message when under threshold', () => {
        logLatency('groqTTFT', 10);
        const calls = vi.mocked(console.log).mock.calls;
        const lastCall = calls[calls.length - 1][0] as string;
        expect(lastCall).not.toContain('SLOW');
    });

    it('handles unknown stage gracefully (no threshold defined)', () => {
        const record = logLatency('unknownStage', 9999);
        expect(record.slow).toBe(false);
        expect(record.threshold).toBeUndefined();
    });

    it('handles zero latency', () => {
        const record = logLatency('auth', 0);
        expect(record.ms).toBe(0);
        expect(record.slow).toBe(false);
    });

    it('returns slow=true for all known stages when ms is very high', () => {
        const stages = Object.keys(LATENCY_WARN) as LatencyStage[];
        for (const stage of stages) {
            const record = logLatency(stage, 999_999);
            expect(record.slow).toBe(true);
        }
    });
});

// ── alertIfSlow ──────────────────────────────────────────────────────────────

describe('alertIfSlow', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('does NOT fire console.error when under total threshold', () => {
        alertIfSlow(LATENCY_WARN.total - 1);
        expect(console.error).not.toHaveBeenCalled();
    });

    it('does NOT fire console.error when exactly at total threshold', () => {
        alertIfSlow(LATENCY_WARN.total);
        expect(console.error).not.toHaveBeenCalled();
    });

    it('fires console.error when over total threshold', () => {
        alertIfSlow(LATENCY_WARN.total + 1);
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('ALERT'));
    });

    it('includes the actual ms value in the alert message', () => {
        const testMs = LATENCY_WARN.total + 5000;
        alertIfSlow(testMs);
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(String(testMs))
        );
    });
});

// ── LATENCY_WARN thresholds ──────────────────────────────────────────────────

describe('LATENCY_WARN thresholds', () => {
    it('all thresholds are positive numbers', () => {
        for (const [stage, ms] of Object.entries(LATENCY_WARN)) {
            expect(ms).toBeGreaterThan(0);
            expect(typeof ms).toBe('number');
            expect(stage.length).toBeGreaterThan(0);
        }
    });

    it('auth threshold is stricter than dbFetch (auth should be fastest)', () => {
        expect(LATENCY_WARN.auth).toBeLessThan(LATENCY_WARN.dbFetch);
    });

    it('RAG threshold is stricter than groqTTFT', () => {
        expect(LATENCY_WARN.rag).toBeLessThan(LATENCY_WARN.groqTTFT);
    });

    it('total threshold is the largest threshold', () => {
        const allThresholds = Object.values(LATENCY_WARN);
        const maxThreshold = Math.max(...allThresholds);
        expect(LATENCY_WARN.total).toBe(maxThreshold);
    });

    it('has all 5 expected stages defined', () => {
        expect(LATENCY_WARN).toHaveProperty('auth');
        expect(LATENCY_WARN).toHaveProperty('dbFetch');
        expect(LATENCY_WARN).toHaveProperty('rag');
        expect(LATENCY_WARN).toHaveProperty('groqTTFT');
        expect(LATENCY_WARN).toHaveProperty('total');
    });
});
