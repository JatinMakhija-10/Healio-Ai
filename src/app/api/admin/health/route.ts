import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { rateLimitCheck } from '@/lib/api/rateLimit';

export const dynamic = 'force-dynamic';

// Cache health checks for 10 seconds to avoid overwhelming services
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedHealth: any = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10000; // 10 seconds

async function checkDatabaseHealth(): Promise<'operational' | 'degraded' | 'down'> {
    try {
        const supabase = await createClient();
        const start = Date.now();
        const { error } = await supabase.from('profiles').select('id').limit(1);
        const latency = Date.now() - start;

        if (error) return 'down';
        if (latency > 1000) return 'degraded';
        return 'operational';
    } catch {
        return 'down';
    }
}

async function checkAIServiceHealth(): Promise<'operational' | 'degraded' | 'down'> {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return 'down';
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5_000);
        const res = await fetch('https://api.groq.com/openai/v1/models', {
            method: 'GET',
            headers: { Authorization: `Bearer ${groqKey}` },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) return 'operational';
        if (res.status >= 500) return 'down';
        return 'degraded';
    } catch {
        return 'down';
    }
}

async function checkSupabaseHealth(): Promise<'operational' | 'degraded' | 'down'> {
    // Supabase connectivity is already verified by checkDatabaseHealth above;
    // a separate ping would be a redundant round-trip.
    return checkDatabaseHealth();
}

function aggregateSystemStatus(services: { database: string; aiService: string; supabase: string }): 'operational' | 'degraded' | 'partial_outage' | 'major_outage' {
    const statuses = Object.values(services);

    if (statuses.every(s => s === 'operational')) {
        return 'operational';
    }

    const downCount = statuses.filter(s => s === 'down').length;
    const degradedCount = statuses.filter(s => s === 'degraded').length;

    if (downCount >= 2) {
        return 'major_outage';
    }

    if (downCount === 1) {
        return 'partial_outage';
    }

    if (degradedCount > 0) {
        return 'degraded';
    }

    return 'operational';
}

export async function GET(request: NextRequest) {
    try {
        // ── Rate limit: 30 req / 60 s per IP ─────────────────────────────────────
        const limited = rateLimitCheck(request, 'admin', 30, 60_000);
        if (limited) return limited;

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check cache
        const now = Date.now();
        if (cachedHealth && (now - cacheTimestamp) < CACHE_TTL) {
            return NextResponse.json({
                success: true,
                data: cachedHealth,
                cached: true,
                timestamp: new Date(cacheTimestamp).toISOString(),
            });
        }

        // Perform health checks in parallel
        const [database, aiService, supabaseStatus] = await Promise.all([
            checkDatabaseHealth(),
            checkAIServiceHealth(),
            checkSupabaseHealth(),
        ]);

        const services = {
            database,
            aiService,
            supabase: supabaseStatus,
        };

        const overallStatus = aggregateSystemStatus(services);

        const healthData = {
            status: overallStatus,
            lastChecked: new Date().toISOString(),
            services,
        };

        // Update cache
        cachedHealth = healthData;
        cacheTimestamp = now;

        // Store health check in database for historical tracking
        await supabase.from('system_health').insert([
            { service_name: 'database', status: database === 'operational' ? 'operational' : 'degraded' },
            { service_name: 'ai_service', status: aiService === 'operational' ? 'operational' : 'degraded' },
            { service_name: 'supabase', status: supabaseStatus === 'operational' ? 'operational' : 'degraded' },
        ]);

        return NextResponse.json({
            success: true,
            data: healthData,
            cached: false,
            timestamp: new Date().toISOString(),
        });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('[Health Check API] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Health check failed',
                message: error.message,
                data: {
                    status: 'major_outage',
                    lastChecked: new Date().toISOString(),
                    services: {
                        database: 'down',
                        aiService: 'down',
                        supabase: 'down',
                    },
                },
            },
            { status: 500 }
        );
    }
}
