import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Cache health checks for 10 seconds to avoid overwhelming services
let cachedHealth: any = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10000; // 10 seconds

async function checkDatabaseHealth(): Promise<'operational' | 'degraded' | 'down'> {
    try {
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
    try {
        // Check if we have recent AI latency metrics
        // In a real implementation, you'd ping the actual AI service
        // For now, we'll check the metrics table
        const hasRecentMetrics = true; // Placeholder
        return hasRecentMetrics ? 'operational' : 'degraded';
    } catch {
        return 'down';
    }
}

async function checkSupabaseHealth(): Promise<'operational' | 'degraded' | 'down'> {
    try {
        // Supabase health is implied by database connection
        // In production, you might check Supabase status page API
        return 'operational';
    } catch {
        return 'down';
    }
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
        // Check authentication
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
