import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/ai/config";

export type HealioCreditAction =
    | "standard_chat"
    | "rag_query"
    | "lab_report_analysis"
    | "deep_document_analysis"
    | "tier3_llm_query"
    | "purchase";

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
