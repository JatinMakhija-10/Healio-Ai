import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/ai/config";
import { getAuthedUserId, getNextDailyRegenTimestamp, unauthorized } from "@/lib/credits/server";

export async function GET(req: NextRequest) {
    const userId = await getAuthedUserId(req);
    if (!userId) return unauthorized();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from("profiles")
        .select("credits_balance, credits_plan, subscription_plan, credits_granted_at")
        .eq("id", userId)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const profile = data as {
        credits_balance?: number | string | null;
        credits_plan?: string | null;
        subscription_plan?: string | null;
        credits_granted_at?: string | null;
    } | null;
    const plan = profile?.credits_plan || profile?.subscription_plan || "free";
    return NextResponse.json({
        balance: Number(profile?.credits_balance ?? 0),
        plan,
        next_regen_at: getNextDailyRegenTimestamp(),
        last_regen_at: profile?.credits_granted_at ?? null,
    });
}
