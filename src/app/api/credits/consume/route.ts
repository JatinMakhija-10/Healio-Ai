import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/ai/config";
import { getAuthedUserId, normalizeRpcJson, type AroviaCreditAction, unauthorized } from "@/lib/credits/server";

type ConsumeResult = {
    success?: boolean;
    error?: string;
    balance?: number;
    balance_after?: number;
    required?: number;
    plan?: string;
};

const VALID_ACTIONS = new Set<AroviaCreditAction>([
    "standard_chat",
    "rag_query",
    "lab_report_analysis",
    "deep_document_analysis",
    "tier3_llm_query",
]);

export async function POST(req: NextRequest) {
    const userId = await getAuthedUserId(req);
    if (!userId) return unauthorized();

    const body = await req.json().catch(() => null);
    const action = body?.action as AroviaCreditAction | undefined;
    if (!action || !VALID_ACTIONS.has(action)) {
        return NextResponse.json({ error: "Invalid credit action" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("consume_arovia_credits", {
        p_user_id: userId,
        p_action: action,
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = normalizeRpcJson<ConsumeResult>(data);
    if (result.error === "insufficient_credits" || result.success === false) {
        return NextResponse.json({
            error: "insufficient_credits",
            balance: result.balance ?? 0,
            required: result.required ?? 1,
            plan: result.plan ?? "free",
        }, { status: 402 });
    }

    return NextResponse.json({
        success: true,
        balance: result.balance_after ?? result.balance ?? 0,
        required: result.required ?? 0,
        plan: result.plan ?? "free",
    });
}
