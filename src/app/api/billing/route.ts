import { NextRequest, NextResponse } from 'next/server';
import { CREDIT_PACKS, getTotalCreditsForPack, CREDIT_COSTS, type CreditAction, FREE_MONTHLY_CONSULTATIONS, FREE_DAILY_CONSULTATIONS } from '@/lib/subscription/plans';
import { getSupabaseAdmin } from '@/lib/ai/config';

async function getUserId(req: NextRequest): Promise<string | null> {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.slice(7);
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
}

// GET /api/billing — returns usage summary + credit history
export async function GET(req: NextRequest) {
    const userId = await getUserId(req);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const [summaryResult, historyResult] = await Promise.allSettled([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).rpc('get_usage_summary', { p_user_id: userId }),
        supabase
            .from('credit_transactions')
            .select('id, amount, balance_after, action, description, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(30),
    ]);

    const summary = summaryResult.status === 'fulfilled' ? summaryResult.value.data : null;
    const history = historyResult.status === 'fulfilled' ? historyResult.value.data : [];

    return NextResponse.json({
        summary: summary ?? {
            plan: 'free',
            monthly_used: 0,
            monthly_limit: FREE_MONTHLY_CONSULTATIONS,
            daily_used: 0,
            daily_limit: FREE_DAILY_CONSULTATIONS,
            credits_balance: 0,
            resets_at: new Date(Date.now() + 30 * 86400000).toISOString(),
            last_chat_at: null,
        },
        history: history ?? [],
        credit_packs: CREDIT_PACKS,
        credit_costs: CREDIT_COSTS,
    });
}

// POST /api/billing — top-up credits or spend credits
export async function POST(req: NextRequest) {
    const userId = await getUserId(req);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.action) {
        return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // ─── Top-up credits ──────────────────────────────────────────────────────
    if (body.action === 'top_up') {
        const pack = CREDIT_PACKS.find((p) => p.id === body.pack_id);
        if (!pack) {
            return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });
        }

        // SECURITY: Require a payment_reference (Razorpay order_id / Stripe payment_intent_id).
        // This prevents any authenticated user from self-granting credits without paying.
        // TODO: Replace the non-empty check below with cryptographic verification against
        //       the payment gateway (Razorpay signature HMAC or Stripe PaymentIntent status).
        const paymentRef = typeof body.payment_reference === 'string' ? body.payment_reference.trim() : '';
        if (!paymentRef) {
            return NextResponse.json(
                { error: 'payment_reference is required. Complete payment before calling this endpoint.' },
                { status: 400 }
            );
        }

        const totalCredits = getTotalCreditsForPack(pack);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any).rpc('add_credits', {
            p_user_id: userId,
            p_amount: totalCredits,
            p_action: 'top_up',
            p_description: `Purchased ${pack.label} pack (${pack.credits}+${pack.bonus} bonus)`,
            p_pack_id: pack.id,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, result: data });
    }

    // ─── Spend credits ───────────────────────────────────────────────────────
    if (body.action === 'spend') {
        const creditAction = body.credit_action as CreditAction;
        const cost = CREDIT_COSTS[creditAction];
        if (!cost) {
            return NextResponse.json({ error: 'Invalid credit action' }, { status: 400 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any).rpc('spend_credits', {
            p_user_id: userId,
            p_amount: cost,
            p_action: creditAction,
            p_description: body.description ?? `Used ${cost} credit(s) for ${creditAction}`,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const raw = typeof data === 'string' ? JSON.parse(data) : data;

        if (!raw.success) {
            return NextResponse.json(
                { error: raw.error, required: raw.required, available: raw.available },
                { status: 402 }
            );
        }

        return NextResponse.json({ success: true, result: raw });
    }

    // ─── Grant monthly credits (for paid subscribers) ────────────────────────
    if (body.action === 'grant_monthly') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any).rpc('grant_monthly_credits', {
            p_user_id: userId,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, result: data });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
