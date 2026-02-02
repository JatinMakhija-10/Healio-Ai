import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Prefer Service Role Key for Admin operations to bypass RLS
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. RLS policies may block access to all profiles.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('state')
            .not('state', 'is', null);

        if (error) {
            console.error('Error fetching epidemic data:', error);
            // Return empty array instead of error to prevent frontend crash, but log error
            return NextResponse.json([], { status: 200 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json([]);
        }

        // Aggregate counts by state
        const stateCounts: Record<string, number> = {};

        data.forEach((profile: any) => {
            let state = profile.state;
            if (state) {
                // Normalize state name: trim and ensure consistent casing if needed
                // But for now keeping it simple as we want to match TopoJSON
                stateCounts[state] = (stateCounts[state] || 0) + 1;
            }
        });

        // Convert to array format expected by the frontend
        const heatmapData = Object.entries(stateCounts).map(([state, count]) => {
            let riskLevel = 'Low';
            if (count > 50) riskLevel = 'Critical';
            else if (count > 20) riskLevel = 'High';
            else if (count > 10) riskLevel = 'Moderate';

            // TopoJSON often uses names like "Maharashtra", "Delhi", etc.
            // We pass the full name as 'state' and generate a simple ID.
            return {
                id: state.substring(0, 3).toUpperCase(),
                state: state,
                cases: count,
                riskLevel: riskLevel
            };
        });

        return NextResponse.json(heatmapData);

    } catch (error: any) {
        console.error('Unexpected error in epidemic route:', error);
        return NextResponse.json([], { status: 200 });
    }
}
