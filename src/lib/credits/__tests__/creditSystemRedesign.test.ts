import { describe, it, expect, vi } from 'vitest';
import {
    reserveCredits,
    captureCredits,
    releaseCredits,
    type CreditReserveResult,
    type CreditCaptureResult,
    type CreditReleaseResult,
} from '../server';

// Mock Supabase Admin Client for Unit Tests
vi.mock('@/lib/ai/config', () => ({
    getSupabaseAdmin: () => ({
        rpc: async (fnName: string, args: Record<string, unknown>) => {
            if (fnName === 'reserve_arovia_credits') {
                const action = args.p_action;
                const idempotencyKey = args.p_idempotency_key;

                if (action === 'safety_triage') {
                    return {
                        data: {
                            success: true,
                            reservation_id: 'mock-safety-res-id',
                            held_amount: 0,
                            bypassed: true,
                            plan: 'free',
                        },
                        error: null,
                    };
                }

                if (idempotencyKey === 'duplicate-key-123') {
                    return {
                        data: {
                            success: true,
                            reservation_id: 'mock-existing-res-id',
                            held_amount: 1.0,
                            idempotency_hit: true,
                            status: 'reserved',
                        },
                        error: null,
                    };
                }

                if (args.p_user_id === 'insufficient-user-id') {
                    return {
                        data: {
                            success: false,
                            error: 'insufficient_credits',
                            required: 1.0,
                            balance: 0.0,
                            plan: 'free',
                        },
                        error: null,
                    };
                }

                return {
                    data: {
                        success: true,
                        reservation_id: 'mock-res-id-123',
                        held_amount: 1.0,
                        balance_after: 99.0,
                        plan: 'free',
                    },
                    error: null,
                };
            }

            if (fnName === 'capture_arovia_credits') {
                return {
                    data: {
                        success: true,
                        captured_amount: 1.0,
                        balance_after: 99.0,
                    },
                    error: null,
                };
            }

            if (fnName === 'release_arovia_credits') {
                return {
                    data: {
                        success: true,
                        released_amount: 1.0,
                        balance_after: 100.0,
                    },
                    error: null,
                };
            }

            return { data: null, error: new Error('Unknown RPC') };
        },
    }),
}));

describe('Arovia.AI Credit System Redesign Unit Tests', () => {
    it('Reserves credit hold successfully for standard chat action', async () => {
        const result: CreditReserveResult = await reserveCredits('user-123', 'standard_chat', 'idem-1');
        expect(result.success).toBe(true);
        expect(result.reservation_id).toBe('mock-res-id-123');
        expect(result.held_amount).toBe(1.0);
        expect(result.balance_after).toBe(99.0);
    });

    it('Bypasses credit check for clinical safety_triage (0 cost)', async () => {
        const result: CreditReserveResult = await reserveCredits('user-123', 'safety_triage');
        expect(result.success).toBe(true);
        expect(result.bypassed).toBe(true);
        expect(result.held_amount).toBe(0);
    });

    it('Deduplicates duplicate idempotency key requests', async () => {
        const result: CreditReserveResult = await reserveCredits('user-123', 'standard_chat', 'duplicate-key-123');
        expect(result.success).toBe(true);
        expect(result.idempotency_hit).toBe(true);
        expect(result.reservation_id).toBe('mock-existing-res-id');
    });

    it('Handles insufficient credits error gracefully', async () => {
        const result: CreditReserveResult = await reserveCredits('insufficient-user-id', 'standard_chat');
        expect(result.success).toBe(false);
        expect(result.error).toBe('insufficient_credits');
        expect(result.balance).toBe(0.0);
    });

    it('Captures credit hold upon LLM completion', async () => {
        const result: CreditCaptureResult = await captureCredits('mock-res-id-123');
        expect(result.success).toBe(true);
        expect(result.captured_amount).toBe(1.0);
    });

    it('Releases credit hold on LLM stream error/timeout', async () => {
        const result: CreditReleaseResult = await releaseCredits('mock-res-id-123', 'stream_timeout');
        expect(result.success).toBe(true);
        expect(result.released_amount).toBe(1.0);
        expect(result.balance_after).toBe(100.0);
    });
});
