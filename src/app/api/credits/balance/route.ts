import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/ai/config";
import { getAuthedUserId, getNextDailyRegenTimestamp, unauthorized } from "@/lib/credits/server";

export async function GET(req: NextRequest) {
    const userId = await getAuthedUserId(req);
    if (!userId) return unauthorized();

    const supabase = getSupabaseAdmin();

    // Trigger daily regeneration lazily before checking balance
    try {
        await (supabase as any).rpc("regenerate_healio_credits", { p_user_id: userId });
    } catch {
        /* ignore if RPC missing */
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("credits_balance, subscription_credits, purchased_credits, credits_plan, subscription_plan, credits_regenerated_at, credits_granted_at")
        .eq("id", userId)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const profile = data as {
        credits_balance?: number | string | null;
        subscription_credits?: number | string | null;
        purchased_credits?: number | string | null;
        credits_plan?: string | null;
        subscription_plan?: string | null;
        credits_regenerated_at?: string | null;
        credits_granted_at?: string | null;
    } | null;

    const subCredits = Number(profile?.subscription_credits ?? profile?.credits_balance ?? 0);
    const purCredits = Number(profile?.purchased_credits ?? 0);
    const totalBalance = subCredits + purCredits;
    const plan = profile?.credits_plan || profile?.subscription_plan || "free";

    return NextResponse.json({
        balance: totalBalance,
        subscription_credits: subCredits,
        purchased_credits: purCredits,
        plan,
        next_regen_at: getNextDailyRegenTimestamp(),
        last_regen_at: profile?.credits_regenerated_at ?? profile?.credits_granted_at ?? null,
    });
}
