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

        const [
            { count: activeUsers },
            { count: pendingDoctors },
            { count: activeConsultations },
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true })
                .gte('updated_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()),
            supabase.from('doctors').select('*', { count: 'exact', head: true })
                .eq('verification_status', 'pending'),
            supabase.from('consultations').select('*', { count: 'exact', head: true })
                .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()),
        ]);

        const metrics = {
            uptime:             { last24h: 99.95, last7d: 99.9, last30d: 99.8 },
            aiLatency:          { p50: 420, p95: 850, p99: 1200, avg: 490 },
            pendingDoctors:     pendingDoctors || 0,
            flaggedSessions:    0,
            activeUsers:        activeUsers || 0,
            activeConsultations: activeConsultations || 0,
        };

        return NextResponse.json({ success: true, data: metrics, timestamp: new Date().toISOString() });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Internal server error', message: msg }, { status: 500 });
    }
}
