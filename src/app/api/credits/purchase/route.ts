import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/ai/config";
import { CREDIT_PACKS, getTotalCreditsForPack } from "@/lib/subscription/plans";
import { getAuthedUserId, unauthorized } from "@/lib/credits/server";

export async function POST(req: NextRequest) {
    const userId = await getAuthedUserId(req);
    if (!userId) return unauthorized();

    const body = await req.json().catch(() => null);
    const pack = CREDIT_PACKS.find((item) => item.id === body?.pack_id);
    if (!pack) {
        return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
    }

    const paymentReference = typeof body?.payment_reference === "string"
        ? body.payment_reference.trim()
        : "";
    if (!paymentReference) {
        return NextResponse.json({
            error: "payment_reference is required. Complete payment before calling this endpoint.",
        }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("add_credits", {
        p_user_id: userId,
        p_amount: getTotalCreditsForPack(pack),
        p_action: "top_up",
        p_description: `Purchased ${pack.label} pack (${pack.credits}+${pack.bonus} bonus). Ref: ${paymentReference}`,
        p_pack_id: pack.id,
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: data });
}
