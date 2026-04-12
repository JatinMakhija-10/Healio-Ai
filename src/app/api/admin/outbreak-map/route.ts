import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

// Indian cities with lat/lng for geo-mapping when no location stored
const INDIAN_CITIES: Record<string, [number, number]> = {
    'Mumbai':    [19.076, 72.877],
    'Delhi':     [28.704, 77.102],
    'Bangalore': [12.971, 77.594],
    'Hyderabad': [17.385, 78.486],
    'Chennai':   [13.082, 80.270],
    'Kolkata':   [22.572, 88.363],
    'Pune':      [18.520, 73.856],
    'Ahmedabad': [23.022, 72.571],
    'Lucknow':   [26.846, 80.946],
    'Jaipur':    [26.912, 75.787],
    'Surat':     [21.170, 72.831],
    'Kanpur':    [26.449, 80.331],
    'Nagpur':    [21.145, 79.088],
    'Indore':    [22.719, 75.857],
    'Bhopal':    [23.259, 77.412],
};

const CITY_NAMES = Object.keys(INDIAN_CITIES);

// Deterministic city picker from user_id hash
function cityFromId(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) & 0xfffffff;
    }
    return CITY_NAMES[hash % CITY_NAMES.length];
}

export async function GET(request: NextRequest) {
    void request;
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles').select('role').eq('id', session.user.id).single();
        if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Fetch all consultations with diagnosis and user info
        const { data: consultations } = await supabase
            .from('consultations')
            .select('id, user_id, diagnosis, symptoms, created_at')
            .not('diagnosis', 'is', null)
            .order('created_at', { ascending: false })
            .limit(500);

        // Also fetch from profiles to get any location_city if it exists
        const { data: profilesWithLocation } = await supabase
            .from('profiles')
            .select('id, location_city, location_state')
            .not('location_city', 'is', null);

        const locationMap: Record<string, string> = {};
        (profilesWithLocation || []).forEach((p: { id: string; location_city: string }) => {
            if (p.location_city) locationMap[p.id] = p.location_city;
        });

        // Build outbreak clusters: { city -> { disease -> count } }
        const clusters: Record<string, Record<string, { count: number; latest: string }>> = {};

        (consultations || []).forEach((c: { id: string; user_id: string; diagnosis: string; created_at: string }) => {
            // Use real location if available, else deterministic city from user_id
            const city = locationMap[c.user_id] || cityFromId(c.user_id);
            const disease = (c.diagnosis || 'Unknown').split(',')[0].trim().substring(0, 40);

            if (!clusters[city]) clusters[city] = {};
            if (!clusters[city][disease]) clusters[city][disease] = { count: 0, latest: c.created_at };
            clusters[city][disease].count++;
            if (c.created_at > clusters[city][disease].latest) {
                clusters[city][disease].latest = c.created_at;
            }
        });

        // Convert to GeoJSON-ready points
        const points: {
            city: string;
            lat: number;
            lng: number;
            disease: string;
            count: number;
            alertLevel: 'low' | 'medium' | 'high';
            latest: string;
        }[] = [];

        Object.entries(clusters).forEach(([city, diseases]) => {
            const coords = INDIAN_CITIES[city] || [20.593, 78.963]; // India centroid fallback
            const topDisease = Object.entries(diseases).sort((a, b) => b[1].count - a[1].count)[0];
            const totalCount = Object.values(diseases).reduce((s, d) => s + d.count, 0);

            points.push({
                city,
                lat:        coords[0],
                lng:        coords[1],
                disease:    topDisease[0],
                count:      totalCount,
                alertLevel: totalCount >= 10 ? 'high' : totalCount >= 5 ? 'medium' : 'low',
                latest:     topDisease[1].latest,
            });
        });

        // 7-day trend per city
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recentConsultations } = await supabase
            .from('consultations')
            .select('user_id, created_at')
            .gte('created_at', sevenDaysAgo);

        const trendByCity: Record<string, number> = {};
        (recentConsultations || []).forEach((c: { user_id: string }) => {
            const city = locationMap[c.user_id] || cityFromId(c.user_id);
            trendByCity[city] = (trendByCity[city] || 0) + 1;
        });

        // Attach trend to points
        const pointsWithTrend = points.map(p => ({
            ...p,
            weekCount: trendByCity[p.city] || 0,
        })).sort((a, b) => b.count - a.count);

        return NextResponse.json({
            success: true,
            data: {
                points: pointsWithTrend,
                totalClusters: pointsWithTrend.length,
                highAlertZones: pointsWithTrend.filter(p => p.alertLevel === 'high').length,
            },
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Internal server error', message: msg }, { status: 500 });
    }
}
