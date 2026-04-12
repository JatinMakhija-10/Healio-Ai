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

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // Fetch raw data for charts
        const [
            { data: userRows },
            { data: consultationRows },
            { data: transactionRows },
            { data: diagnosisRows },
            { data: doctorRows },
            { data: roleRows },
        ] = await Promise.all([
            // User signups last 30 days
            supabase.from('profiles').select('created_at').gte('created_at', thirtyDaysAgo),
            // Consultations last 30 days
            supabase.from('consultations').select('created_at').gte('created_at', thirtyDaysAgo),
            // Transactions last 30 days
            supabase.from('transactions').select('created_at, amount').gte('created_at', thirtyDaysAgo),
            // Disease distribution (top diagnoses)
            supabase.from('consultations').select('diagnosis').not('diagnosis', 'is', null),
            // Doctor specializations
            supabase.from('doctors').select('specialization').not('specialization', 'is', null),
            // User role breakdown
            supabase.from('profiles').select('role'),
        ]);

        // Helper: group by day
        const groupByDay = (rows: { created_at: string }[]) => {
            const map: Record<string, number> = {};
            (rows || []).forEach(r => {
                const day = r.created_at.slice(0, 10);
                map[day] = (map[day] || 0) + 1;
            });
            // Fill all 30 days
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

        // Disease distribution
        const diseaseCounts: Record<string, number> = {};
        (diagnosisRows || []).forEach((r: { diagnosis: string }) => {
            const d = (r.diagnosis || 'Unknown').trim();
            // Normalize: take first condition if comma-separated
            const key = d.split(',')[0].trim().substring(0, 40);
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
        const specialtyMix = Object.entries(specialtyCounts)
            .map(([name, count]) => ({ name, count }));

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
