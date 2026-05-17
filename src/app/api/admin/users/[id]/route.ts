import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabaseServer';
import { rateLimitCheck } from '@/lib/api/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users/[id]
 *
 * Returns a complete admin-facing dossier for a single user:
 *   - profile (incl. suspension columns)
 *   - consultations count
 *   - flagged_sessions count (used for the Reports stat)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const limited = rateLimitCheck(request, 'admin', 60, 60_000);
        if (limited) return limited;

        const { id: targetUserId } = await params;
        if (!targetUserId) {
            return NextResponse.json({ error: 'User id is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const service = process.env.SUPABASE_SERVICE_ROLE_KEY
            ? createServiceClient()
            : supabase; // fall back to user-scoped client (RLS may filter)

        const [
            profileResult,
            consultationsResult,
            flaggedResult,
        ] = await Promise.all([
            service
                .from('profiles')
                .select('id, email, full_name, avatar_url, role, phone, created_at, updated_at, is_suspended, suspended_at, suspended_reason, suspended_by')
                .eq('id', targetUserId)
                .single(),
            service
                .from('consultations')
                .select('id', { count: 'exact', head: true })
                .eq('patient_id', targetUserId),
            service
                .from('flagged_sessions')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', targetUserId),
        ]);

        if (profileResult.error || !profileResult.data) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                profile:           profileResult.data,
                consultationCount: consultationsResult.count ?? 0,
                reportCount:       flaggedResult.count ?? 0,
            },
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[admin user dossier] error:', error);
        return NextResponse.json({ error: 'Internal server error', message: msg }, { status: 500 });
    }
}
