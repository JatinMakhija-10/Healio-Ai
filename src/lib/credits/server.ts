import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/ai/config";

export type AroviaCreditAction =
    | "standard_chat"
    | "rag_query"
    | "lab_report_analysis"
    | "deep_document_analysis"
    | "tier3_llm_query"
    | "safety_triage"
    | "purchase";

export interface CreditReserveResult {
    success: boolean;
    reservation_id?: string;
    held_amount?: number;
    balance_after?: number;
    plan?: string;
    bypassed?: boolean;
    idempotency_hit?: boolean;
    error?: string;
    required?: number;
    balance?: number;
}

export interface CreditCaptureResult {
    success: boolean;
    captured_amount?: number;
    balance_after?: number;
    status?: string;
    error?: string;
}

export interface CreditReleaseResult {
    success: boolean;
    released_amount?: number;
    balance_after?: number;
    status?: string;
    error?: string;
}

export async function getAuthedUserId(req: NextRequest): Promise<string | null> {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.slice(7);
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
}

export function unauthorized() {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function normalizeRpcJson<T>(value: unknown): T {
    return (typeof value === "string" ? JSON.parse(value) : value) as T;
}

export function getNextDailyRegenTimestamp() {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next.toISOString();
}

/**
 * Phase 1 Hold: Reserve credits for an action before starting LLM processing.
 */
export async function reserveCredits(
    userId: string,
    action: AroviaCreditAction,
    idempotencyKey?: string | null
): Promise<CreditReserveResult> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await (supabase as any).rpc("reserve_arovia_credits", {
        p_user_id: userId,
        p_action: action,
        p_idempotency_key: idempotencyKey ?? null,
    });

    if (error) {
        console.error("[credits] reserve_arovia_credits failed:", error.message);
        // Fallback check if RPC not migrated yet
        if (/function .* does not exist/i.test(error.message)) {
            return { success: true, bypassed: true, held_amount: 0 };
        }
        return { success: false, error: error.message };
    }

    return normalizeRpcJson<CreditReserveResult>(data);
}

/**
 * Phase 2 Success: Finalize the deduction after successful LLM execution.
 */
export async function captureCredits(
    reservationId: string,
    tokenCount?: number | null
): Promise<CreditCaptureResult> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await (supabase as any).rpc("capture_arovia_credits", {
        p_reservation_id: reservationId,
        p_token_count: tokenCount ?? null,
    });

    if (error) {
        console.error("[credits] capture_arovia_credits failed:", error.message);
        return { success: false, error: error.message };
    }

    return normalizeRpcJson<CreditCaptureResult>(data);
}

/**
 * Phase 2 Failure/Timeout: Restore reserved hold if LLM request failed or timed out.
 */
export async function releaseCredits(
    reservationId: string,
    reason: string = "request_failed"
): Promise<CreditReleaseResult> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await (supabase as any).rpc("release_arovia_credits", {
        p_reservation_id: reservationId,
        p_reason: reason,
    });

    if (error) {
        console.error("[credits] release_arovia_credits failed:", error.message);
        return { success: false, error: error.message };
    }

    return normalizeRpcJson<CreditReleaseResult>(data);
}
