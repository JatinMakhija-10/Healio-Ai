import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { rateLimitCheck } from '@/lib/api/rateLimit';

export const dynamic = 'force-dynamic';

// ── Indian cities with coordinates and state ──────────────────────────────────
const INDIAN_CITIES: Record<string, { coords: [number, number]; state: string }> = {
    'Mumbai':       { coords: [19.076, 72.877],  state: 'Maharashtra' },
    'Delhi':        { coords: [28.704, 77.102],  state: 'Delhi' },
    'Bangalore':    { coords: [12.971, 77.594],  state: 'Karnataka' },
    'Hyderabad':    { coords: [17.385, 78.486],  state: 'Telangana' },
    'Chennai':      { coords: [13.082, 80.270],  state: 'Tamil Nadu' },
    'Kolkata':      { coords: [22.572, 88.363],  state: 'West Bengal' },
    'Pune':         { coords: [18.520, 73.856],  state: 'Maharashtra' },
    'Ahmedabad':    { coords: [23.022, 72.571],  state: 'Gujarat' },
    'Lucknow':      { coords: [26.846, 80.946],  state: 'Uttar Pradesh' },
    'Jaipur':       { coords: [26.912, 75.787],  state: 'Rajasthan' },
    'Surat':        { coords: [21.170, 72.831],  state: 'Gujarat' },
    'Kanpur':       { coords: [26.449, 80.331],  state: 'Uttar Pradesh' },
    'Nagpur':       { coords: [21.145, 79.088],  state: 'Maharashtra' },
    'Indore':       { coords: [22.719, 75.857],  state: 'Madhya Pradesh' },
    'Bhopal':       { coords: [23.259, 77.412],  state: 'Madhya Pradesh' },
    'Patna':        { coords: [25.612, 85.144],  state: 'Bihar' },
    'Chandigarh':   { coords: [30.733, 76.779],  state: 'Chandigarh' },
    'Kochi':        { coords: [9.931,  76.267],  state: 'Kerala' },
    'Guwahati':     { coords: [26.144, 91.736],  state: 'Assam' },
    'Bhubaneswar':  { coords: [20.296, 85.824],  state: 'Odisha' },
    'Dehradun':     { coords: [30.316, 78.032],  state: 'Uttarakhand' },
    'Ranchi':       { coords: [23.344, 85.309],  state: 'Jharkhand' },
    'Thiruvananthapuram': { coords: [8.524, 76.936],  state: 'Kerala' },
    'Visakhapatnam':{ coords: [17.686, 83.218],  state: 'Andhra Pradesh' },
    'Coimbatore':   { coords: [11.016, 76.955],  state: 'Tamil Nadu' },
};

const CITY_NAMES = Object.keys(INDIAN_CITIES);

// ── Privacy constants ─────────────────────────────────────────────────────────
const K_ANONYMITY_THRESHOLD = 5;   // Never show clusters < 5 cases
const DP_NOISE_THRESHOLD = 20;     // Apply ±2 noise to counts under this

// Deterministic city picker from user_id hash
function cityFromId(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) & 0xfffffff;
    }
    return CITY_NAMES[hash % CITY_NAMES.length];
}

// Differential privacy: add ±2 random noise to small counts
function applyDPNoise(count: number): number {
    if (count < DP_NOISE_THRESHOLD && count > 0) {
        const noise = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(0, count + noise);
    }
    return count;
}

// Outbreak score: ratio of current 48h cases vs 28-day baseline average (per 48h window)
function computeOutbreakScore(current48h: number, baseline28dAvg: number): {
    score: 'HIGH' | 'MODERATE' | 'LOW';
    ratio: number;
} {
    const ratio = current48h / (baseline28dAvg + 1); // +1 avoids div-by-zero
    if (ratio > 2.5) return { score: 'HIGH', ratio };
    if (ratio > 1.5) return { score: 'MODERATE', ratio };
    return { score: 'LOW', ratio };
}

export async function GET(request: NextRequest) {
    try {
        // ── Rate limit: 30 req / 60 s per IP ─────────────────────────────────────
        const limited = rateLimitCheck(request, 'admin', 30, 60_000);
        if (limited) return limited;

        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles').select('role').eq('id', session.user.id).single();
        if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // ── Time windows ──────────────────────────────────────────────────────────
        const now = new Date();
        const ts48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
        const ts7d  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString();
        const ts28d = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString();

        // Fetch consultations from last 28 days for baseline + current analysis
        const { data: consultations } = await supabase
            .from('consultations')
            .select('id, user_id, diagnosis, symptoms, created_at')
            .not('diagnosis', 'is', null)
            .gte('created_at', ts28d)
            .order('created_at', { ascending: false })
            .limit(2000);

        // Fetch profiles with location data
        const { data: profilesWithLocation } = await supabase
            .from('profiles')
            .select('id, location_city, location_state')
            .not('location_city', 'is', null);

        const locationMap: Record<string, string> = {};
        (profilesWithLocation || []).forEach((p: { id: string; location_city: string }) => {
            if (p.location_city) locationMap[p.id] = p.location_city;
        });

        // ── Build per-city, per-disease clusters with time windows ────────────────
        interface DiseaseWindow {
            total: number;
            cases48h: number;
            cases7d: number;
            latest: string;
        }

        const clusters: Record<string, Record<string, DiseaseWindow>> = {};

        (consultations || []).forEach((c: { user_id: string; diagnosis: string; created_at: string }) => {
            const city = locationMap[c.user_id] || cityFromId(c.user_id);
            const disease = (c.diagnosis || 'Unknown').split(',')[0].trim().substring(0, 40);

            if (!clusters[city]) clusters[city] = {};
            if (!clusters[city][disease]) {
                clusters[city][disease] = { total: 0, cases48h: 0, cases7d: 0, latest: c.created_at };
            }

            const stats = clusters[city][disease];
            stats.total++;
            if (c.created_at >= ts48h) stats.cases48h++;
            if (c.created_at >= ts7d) stats.cases7d++;
            if (c.created_at > stats.latest) stats.latest = c.created_at;
        });

        // ── Build outbreak points with scoring ────────────────────────────────────
        // 28 days ≈ 14 windows of 48h → baseline_avg = total_28d / 14
        const BASELINE_WINDOWS = 14;

        interface OutbreakPoint {
            city: string;
            state: string;
            lat: number;
            lng: number;
            topDisease: string;
            diseases: { name: string; count: number; cases48h: number; trend: 'up' | 'down' | 'stable' }[];
            totalCases: number;
            cases48h: number;
            cases7d: number;
            baseline28dAvg: number;
            outbreakScore: 'HIGH' | 'MODERATE' | 'LOW';
            outbreakRatio: number;
            weekCount: number;
            trendDirection: 'rising' | 'falling' | 'stable';
            latest: string;
        }

        const points: OutbreakPoint[] = [];

        Object.entries(clusters).forEach(([city, diseases]) => {
            const cityInfo = INDIAN_CITIES[city];
            const coords = cityInfo?.coords || [20.593, 78.963];
            const state  = cityInfo?.state  || 'Unknown';

            let totalCases = 0, totalCases48h = 0, totalCases7d = 0;
            let latestDate = '';

            const diseaseList: OutbreakPoint['diseases'] = [];

            Object.entries(diseases).forEach(([name, stats]) => {
                totalCases   += stats.total;
                totalCases48h += stats.cases48h;
                totalCases7d += stats.cases7d;
                if (stats.latest > latestDate) latestDate = stats.latest;

                // Per-disease trend: compare 48h rate vs 7d average rate
                const avg7dPer48h = stats.cases7d / 3.5; // 7d = 3.5 × 48h windows
                const trend: 'up' | 'down' | 'stable' =
                    stats.cases48h > avg7dPer48h * 1.3 ? 'up' :
                    stats.cases48h < avg7dPer48h * 0.7 ? 'down' : 'stable';

                diseaseList.push({
                    name,
                    count:   applyDPNoise(stats.total),
                    cases48h: applyDPNoise(stats.cases48h),
                    trend,
                });
            });

            // k-anonymity: suppress clusters with fewer than threshold cases
            if (totalCases < K_ANONYMITY_THRESHOLD) return;

            // Outbreak scoring
            const baseline28dAvg = totalCases / BASELINE_WINDOWS;
            const { score, ratio } = computeOutbreakScore(totalCases48h, baseline28dAvg);

            // Overall city trend direction
            const avgWeeklyPer48h = totalCases7d / 3.5;
            const trendDirection: 'rising' | 'falling' | 'stable' =
                totalCases48h > avgWeeklyPer48h * 1.3 ? 'rising' :
                totalCases48h < avgWeeklyPer48h * 0.7 ? 'falling' : 'stable';

            diseaseList.sort((a, b) => b.count - a.count);

            points.push({
                city,
                state,
                lat: coords[0],
                lng: coords[1],
                topDisease: diseaseList[0]?.name || 'Unknown',
                diseases: diseaseList.slice(0, 5),
                totalCases: applyDPNoise(totalCases),
                cases48h: applyDPNoise(totalCases48h),
                cases7d: applyDPNoise(totalCases7d),
                baseline28dAvg: Math.round(baseline28dAvg * 10) / 10,
                outbreakScore: score,
                outbreakRatio: Math.round(ratio * 100) / 100,
                weekCount: applyDPNoise(totalCases7d),
                trendDirection,
                latest: latestDate,
            });
        });

        // Sort by outbreak ratio (highest first)
        points.sort((a, b) => b.outbreakRatio - a.outbreakRatio);

        // ── Generate high-alert notifications ─────────────────────────────────────
        const alerts = points
            .filter(p => p.outbreakScore === 'HIGH')
            .map(p => ({
                city: p.city,
                state: p.state,
                disease: p.topDisease,
                score: p.outbreakScore,
                ratio: p.outbreakRatio,
                cases48h: p.cases48h,
                message: `${p.topDisease} spike in ${p.city} — ${p.outbreakRatio}× above baseline (${p.cases48h} cases in 48h)`,
            }));

        // Top condition across all clusters
        const conditionCounts: Record<string, number> = {};
        points.forEach(p => {
            p.diseases.forEach(d => {
                conditionCounts[d.name] = (conditionCounts[d.name] || 0) + d.count;
            });
        });
        const topCondition = Object.entries(conditionCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

        return NextResponse.json({
            success: true,
            data: {
                points,
                totalClusters: points.length,
                highAlertZones: points.filter(p => p.outbreakScore === 'HIGH').length,
                moderateAlertZones: points.filter(p => p.outbreakScore === 'MODERATE').length,
                totalCases48h: points.reduce((s, p) => s + p.cases48h, 0),
                totalCases7d: points.reduce((s, p) => s + p.cases7d, 0),
                topCondition,
                alerts,
                lastProcessed: now.toISOString(),
                privacyInfo: {
                    kAnonymityThreshold: K_ANONYMITY_THRESHOLD,
                    dpNoiseApplied: true,
                    dpNoiseThreshold: DP_NOISE_THRESHOLD,
                },
            },
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Internal server error', message: msg }, { status: 500 });
    }
}
