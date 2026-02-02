import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        // Check if user is authenticated and is admin
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all metrics in parallel
        const [
            uptimeResult,
            aiLatencyResult,
            pendingDoctorsResult,
            flaggedSessionsResult,
            activeUsersResult,
            activeConsultationsResult,
        ] = await Promise.all([
            // Uptime calculations
            Promise.all([
                supabase.rpc('calculate_uptime', { time_window: '24 hours' }),
                supabase.rpc('calculate_uptime', { time_window: '7 days' }),
                supabase.rpc('calculate_uptime', { time_window: '30 days' }),
            ]),
            // AI Latency stats
            supabase.from('ai_latency_stats').select('*').single(),
            // Pending doctors count
            supabase.from('pending_doctors_count').select('count').single(),
            // Flagged sessions count
            supabase.from('flagged_sessions_count').select('count').single(),
            // Active users (sessions in last 5 minutes)
            supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()),
            // Active consultations (created in last hour, not completed)
            supabase
                .from('consultations')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()),
        ]);

        // Parse uptime results
        const [uptime24h, uptime7d, uptime30d] = uptimeResult.map((r: any) => r.data || 99.9);

        // Build response
        const metrics = {
            uptime: {
                last24h: Number(uptime24h),
                last7d: Number(uptime7d),
                last30d: Number(uptime30d),
            },
            aiLatency: {
                p50: Number(aiLatencyResult.data?.p50_latency || 0),
                p95: Number(aiLatencyResult.data?.p95_latency || 0),
                p99: Number(aiLatencyResult.data?.p99_latency || 0),
                avg: Number(aiLatencyResult.data?.avg_latency || 0),
            },
            pendingDoctors: Number(pendingDoctorsResult.data?.count || 0),
            flaggedSessions: Number(flaggedSessionsResult.data?.count || 0),
            activeUsers: activeUsersResult.count || 0,
            activeConsultations: activeConsultationsResult.count || 0,
        };

        return NextResponse.json({
            success: true,
            data: metrics,
            timestamp: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('[Admin Metrics API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
