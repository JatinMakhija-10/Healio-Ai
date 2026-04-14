import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    void request;
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles').select('role').eq('id', session.user.id).single();
        if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // ── All stat queries in ONE parallel batch — zero sequential round-trips ──
        const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
        const weekAgo    = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString();
        const fifteenMin = new Date(Date.now() - 15 * 60 * 1000).toISOString();

        const [
            { count: totalUsers },
            { count: totalDoctors },
            { count: pendingDoctors },
            { count: totalConsultations },
            { count: todayConsultations },
            { count: newUsersToday },
            { count: newUsersWeek },
            { count: activeUsers },
            { data: revenueData },
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('doctors').select('*', { count: 'exact', head: true }),
            supabase.from('doctors').select('*', { count: 'exact', head: true })
                .eq('verification_status', 'pending'),
            supabase.from('consultations').select('*', { count: 'exact', head: true }),
            supabase.from('consultations').select('*', { count: 'exact', head: true })
                .gte('created_at', todayStart),
            supabase.from('profiles').select('*', { count: 'exact', head: true })
                .gte('created_at', todayStart),
            supabase.from('profiles').select('*', { count: 'exact', head: true })
                .gte('created_at', weekAgo),
            // Active users (profiles updated in last 15 min) — now in the batch
            supabase.from('profiles').select('*', { count: 'exact', head: true })
                .gte('updated_at', fifteenMin),
            // Fetch only amount column — no row limit so revenue is accurate
            supabase.from('transactions').select('amount'),
        ]);

        const totalRevenue = (revenueData || []).reduce(
            (sum: number, t: { amount: number }) => sum + (t.amount || 0), 0
        );

        return NextResponse.json({
            success: true,
            data: {
                totalUsers:         totalUsers         || 0,
                totalDoctors:       totalDoctors       || 0,
                pendingDoctors:     pendingDoctors     || 0,
                totalConsultations: totalConsultations || 0,
                todayConsultations: todayConsultations || 0,
                newUsersToday:      newUsersToday      || 0,
                newUsersWeek:       newUsersWeek       || 0,
                totalRevenue,
                activeUsers:        activeUsers        || 0,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Internal server error', message: msg }, { status: 500 });
    }
}
