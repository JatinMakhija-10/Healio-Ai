import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/ai/config";
import { getAuthedUserId, unauthorized } from "@/lib/credits/server";

export async function GET(req: NextRequest) {
    const userId = await getAuthedUserId(req);
    if (!userId) return unauthorized();

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || 30), 100);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from("credit_transactions")
        .select("id, amount, delta, action, reason, description, balance_after, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ history: data ?? [] });
}
