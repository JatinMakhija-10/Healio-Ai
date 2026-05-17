import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { rateLimitCheck } from '@/lib/api/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // ── Rate limit: 30 req / 60 s per IP ─────────────────────────────────────
        const limited = rateLimitCheck(request, 'admin', 30, 60_000);
        if (limited) return limited;

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const [
            { count: activeUsers },
            { count: pendingDoctors },
            { count: activeConsultations },
            { count: flaggedSessions },
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true })
                .gte('updated_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()),
            supabase.from('doctors').select('*', { count: 'exact', head: true })
                .eq('verification_status', 'pending'),
            supabase.from('consultations').select('*', { count: 'exact', head: true })
                .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()),
            supabase.from('flagged_sessions').select('*', { count: 'exact', head: true }),
        ]);

        const metrics = {
            // uptime and aiLatency require an external monitoring service (e.g. Upstash, Datadog).
            // They are not computable server-side without a metrics store.
            uptime:             null,
            aiLatency:          null,
            pendingDoctors:     pendingDoctors     || 0,
            flaggedSessions:    flaggedSessions    || 0,
            activeUsers:        activeUsers        || 0,
            activeConsultations: activeConsultations || 0,
        };

        return NextResponse.json({ success: true, data: metrics, timestamp: new Date().toISOString() });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Internal server error', message: msg }, { status: 500 });
    }
}
