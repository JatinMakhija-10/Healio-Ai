import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/ai/config";
import {
    getAuthedUserId,
    normalizeRpcJson,
    reserveCredits,
    captureCredits,
    type AroviaCreditAction,
    unauthorized,
} from "@/lib/credits/server";

type ConsumeResult = {
    success?: boolean;
    error?: string;
    balance?: number;
    balance_after?: number;
    required?: number;
    held_amount?: number;
    plan?: string;
    reservation_id?: string;
};

const VALID_ACTIONS = new Set<AroviaCreditAction>([
    "standard_chat",
    "rag_query",
    "lab_report_analysis",
    "deep_document_analysis",
    "tier3_llm_query",
    "safety_triage",
]);

export async function POST(req: NextRequest) {
    const userId = await getAuthedUserId(req);
    if (!userId) return unauthorized();

    const body = await req.json().catch(() => null);
    const action = body?.action as AroviaCreditAction | undefined;
    const mode = body?.mode as "reserve" | "consume" | undefined;
    const idempotencyKey = (body?.idempotency_key || req.headers.get("x-idempotency-key")) as string | undefined;

    if (!action || !VALID_ACTIONS.has(action)) {
        return NextResponse.json({ error: "Invalid credit action" }, { status: 400 });
    }

    // Step 1: Reserve hold
    const reserveRes = await reserveCredits(userId, action, idempotencyKey);

    if (!reserveRes.success) {
        if (reserveRes.error === "insufficient_credits") {
            return NextResponse.json({
                error: "insufficient_credits",
                balance: reserveRes.balance ?? 0,
                required: reserveRes.required ?? 1,
                plan: reserveRes.plan ?? "free",
            }, { status: 402 });
        }
        return NextResponse.json({ error: reserveRes.error || "reserve_failed" }, { status: 500 });
    }

    // If reserve-only mode was requested, return the reservation_id for client-driven capture
    if (mode === "reserve") {
        return NextResponse.json({
            success: true,
            reservation_id: reserveRes.reservation_id,
            held_amount: reserveRes.held_amount ?? 0,
            balance: reserveRes.balance_after ?? 0,
            plan: reserveRes.plan ?? "free",
            bypassed: reserveRes.bypassed ?? false,
        });
    }

    // Default: Immediate capture after reservation
    if (reserveRes.reservation_id && !reserveRes.bypassed) {
        const captureRes = await captureCredits(reserveRes.reservation_id);
        if (!captureRes.success) {
            return NextResponse.json({ error: captureRes.error || "capture_failed" }, { status: 500 });
        }
        return NextResponse.json({
            success: true,
            balance: captureRes.balance_after ?? reserveRes.balance_after ?? 0,
            required: captureRes.captured_amount ?? reserveRes.held_amount ?? 0,
            plan: reserveRes.plan ?? "free",
        });
    }

    return NextResponse.json({
        success: true,
        balance: reserveRes.balance_after ?? 0,
        required: reserveRes.held_amount ?? 0,
        plan: reserveRes.plan ?? "free",
        bypassed: true,
    });
}
