import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/ai/config";
import { getAuthedUserId, unauthorized } from "@/lib/credits/server";

export const dynamic = "force-dynamic";

async function safeDelete(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any,
    table: string,
    column: string,
    userId: string
) {
    const { error, count } = await supabase
        .from(table)
        .delete({ count: "exact" })
        .eq(column, userId);

    if (error) {
        const message = String(error.message || "");
        if (/does not exist|schema cache|relation .* not found|column .* does not exist/i.test(message)) {
            return { deleted: 0, skipped: message };
        }
        throw error;
    }

    return { deleted: count ?? 0, skipped: null };
}

export async function POST(req: NextRequest) {
    const userId = await getAuthedUserId(req);
    if (!userId) return unauthorized();

    const body = await req.json().catch(() => null) as { confirmation?: string } | null;
    if (body?.confirmation !== "DELETE") {
        return NextResponse.json({ error: "Type DELETE to confirm account deletion." }, { status: 400 });
    }

    try {
        const supabase = getSupabaseAdmin();

        const [
            consultations,
            personas,
            notifications,
            creditTransactions,
            llmRequests,
            appointments,
            clinicalNotes,
            messages,
            doctors,
        ] = await Promise.all([
            safeDelete(supabase, "consultations", "user_id", userId),
            safeDelete(supabase, "personas", "user_id", userId),
            safeDelete(supabase, "notifications", "user_id", userId),
            safeDelete(supabase, "credit_transactions", "user_id", userId),
            safeDelete(supabase, "llm_requests", "user_id", userId),
            safeDelete(supabase, "appointments", "patient_id", userId),
            safeDelete(supabase, "clinical_notes", "patient_id", userId),
            safeDelete(supabase, "messages", "sender_id", userId),
            safeDelete(supabase, "doctors", "user_id", userId),
        ]);

        const profile = await safeDelete(supabase, "profiles", "id", userId);
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
            return NextResponse.json({
                success: true,
                auth_deleted: false,
                warning: authError.message,
                deleted: {
                    consultations,
                    personas,
                    notifications,
                    creditTransactions,
                    llmRequests,
                    appointments,
                    clinicalNotes,
                    messages,
                    doctors,
                    profile,
                },
            });
        }

        return NextResponse.json({
            success: true,
            auth_deleted: true,
            deleted: {
                consultations,
                personas,
                notifications,
                creditTransactions,
                llmRequests,
                appointments,
                clinicalNotes,
                messages,
                doctors,
                profile,
            },
        });
    } catch (error) {
        console.error("Account deletion failed:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete account data." },
            { status: 500 }
        );
    }
}
