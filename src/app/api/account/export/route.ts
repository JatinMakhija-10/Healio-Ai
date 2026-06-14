import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/ai/config";
import { getAuthedUserId, unauthorized } from "@/lib/credits/server";

export const dynamic = "force-dynamic";

async function safeSelect(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any,
    table: string,
    columns: string,
    filterColumn: string,
    userId: string
) {
    const { data, error } = await supabase
        .from(table)
        .select(columns)
        .eq(filterColumn, userId);

    if (error) {
        const message = String(error.message || "");
        if (/does not exist|schema cache|relation .* not found/i.test(message)) {
            return { data: [], skipped: message };
        }
        throw error;
    }

    return { data: data ?? [], skipped: null };
}

export async function GET(req: NextRequest) {
    const userId = await getAuthedUserId(req);
    if (!userId) return unauthorized();

    try {
        const supabase = getSupabaseAdmin();

        const [
            profileResult,
            consultationsResult,
            personasResult,
            notificationsResult,
            creditsResult,
        ] = await Promise.all([
            supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
            safeSelect(supabase, "consultations", "*", "user_id", userId),
            safeSelect(supabase, "personas", "*", "user_id", userId),
            safeSelect(supabase, "notifications", "*", "user_id", userId),
            safeSelect(supabase, "credit_transactions", "*", "user_id", userId),
        ]);

        if (profileResult.error) {
            return NextResponse.json({ error: profileResult.error.message }, { status: 500 });
        }

        return NextResponse.json({
            exported_at: new Date().toISOString(),
            export_version: "1.0",
            user_id: userId,
            profile: profileResult.data ?? null,
            consultations: consultationsResult.data,
            family_profiles: personasResult.data,
            notifications: notificationsResult.data,
            credit_transactions: creditsResult.data,
            skipped_sources: {
                consultations: consultationsResult.skipped,
                family_profiles: personasResult.skipped,
                notifications: notificationsResult.skipped,
                credit_transactions: creditsResult.skipped,
            },
        });
    } catch (error) {
        console.error("Data export failed:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to export account data." },
            { status: 500 }
        );
    }
}
