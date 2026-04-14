import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    void request;
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // ── Auth role-check and all chart data fetched in ONE parallel batch ──────
        // Previously: auth check was sequential before the data batch (2 serial hops)
        // Now: role check runs in parallel with all chart queries (1 hop total)
        const [
            profileResult,
            { data: userRows },
            { data: consultationRows },
            { data: transactionRows },
            { data: diagnosisRows },
            { data: doctorRows },
            { data: roleRows },
        ] = await Promise.all([
            supabase.from('profiles').select('role').eq('id', session.user.id).single(),
            supabase.from('profiles').select('created_at').gte('created_at', thirtyDaysAgo),
            supabase.from('consultations').select('created_at').gte('created_at', thirtyDaysAgo),
            supabase.from('transactions').select('created_at, amount').gte('created_at', thirtyDaysAgo),
            supabase.from('consultations').select('diagnosis').not('diagnosis', 'is', null),
            supabase.from('doctors').select('specialization').not('specialization', 'is', null),
            supabase.from('profiles').select('role'),
        ]);

        // Guard after the batch — no wasted wait time
        if (profileResult.data?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // ── Compute chart data in JS (CPU-bound, no further DB needed) ───────────

        // Helper: group rows by calendar day, filling all 30 days
        const groupByDay = (rows: { created_at: string }[]) => {
            const map: Record<string, number> = {};
            (rows || []).forEach(r => { map[r.created_at.slice(0, 10)] = (map[r.created_at.slice(0, 10)] || 0) + 1; });
            const result = [];
            for (let i = 29; i >= 0; i--) {
                const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                result.push({ date: d, count: map[d] || 0 });
            }
            return result;
        };

        // Revenue by day
        const revenueByDay = (() => {
            const map: Record<string, number> = {};
            (transactionRows || []).forEach((r: { created_at: string; amount: number }) => {
                const day = r.created_at.slice(0, 10);
                map[day] = (map[day] || 0) + (r.amount || 0);
            });
            const result = [];
            for (let i = 29; i >= 0; i--) {
                const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                result.push({ date: d, amount: map[d] || 0 });
            }
            return result;
        })();

        // Disease distribution (top 10)
        const diseaseCounts: Record<string, number> = {};
        (diagnosisRows || []).forEach((r: { diagnosis: string }) => {
            const key = (r.diagnosis || 'Unknown').trim().split(',')[0].trim().substring(0, 40);
            diseaseCounts[key] = (diseaseCounts[key] || 0) + 1;
        });
        const diseaseDistribution = Object.entries(diseaseCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));

        // Doctor specialty mix
        const specialtyCounts: Record<string, number> = {};
        (doctorRows || []).forEach((r: { specialization: string }) => {
            const s = (r.specialization || 'General').split(',')[0].trim();
            specialtyCounts[s] = (specialtyCounts[s] || 0) + 1;
        });
        const specialtyMix = Object.entries(specialtyCounts).map(([name, count]) => ({ name, count }));

        // Role breakdown
        const roleCounts: Record<string, number> = {};
        (roleRows || []).forEach((r: { role: string }) => {
            const role = r.role || 'patient';
            roleCounts[role] = (roleCounts[role] || 0) + 1;
        });

        return NextResponse.json({
            success: true,
            data: {
                userGrowth:          groupByDay(userRows || []),
                consultationTrend:   groupByDay(consultationRows || []),
                revenueTrend:        revenueByDay,
                diseaseDistribution,
                specialtyMix,
                roleCounts,
            },
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Internal server error', message: msg }, { status: 500 });
    }
}
