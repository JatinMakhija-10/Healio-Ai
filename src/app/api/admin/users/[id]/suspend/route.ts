import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabaseServer';
import { rateLimitCheck } from '@/lib/api/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/users/[id]/suspend
 *
 * Body: { suspend: boolean, reason?: string }
 *
 * Effect:
 *  - Sets `profiles.is_suspended` (+ metadata columns)
 *  - Sets `auth.users.banned_until` so the user cannot sign in
 *
 * Suspension is fully reversible.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const limited = rateLimitCheck(request, 'admin', 30, 60_000);
        if (limited) return limited;

        const { id: targetUserId } = await params;
        if (!targetUserId) {
            return NextResponse.json({ error: 'User id is required' }, { status: 400 });
        }

        // ── AuthN/Z ────────────────────────────────────────────────────────────
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (targetUserId === user.id) {
            return NextResponse.json(
                { error: 'You cannot suspend your own account' },
                { status: 400 }
            );
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json(
                {
                    error: 'Server configuration error',
                    message: 'SUPABASE_SERVICE_ROLE_KEY is not configured. Suspension requires the service role key.',
                },
                { status: 500 }
            );
        }

        // ── Body ──────────────────────────────────────────────────────────────
        const body = await request.json().catch(() => ({}));
        const suspend = Boolean(body.suspend);
        const reason: string | null = typeof body.reason === 'string' ? body.reason.slice(0, 500) : null;

        const service = createServiceClient();

        // Verify the target exists and is not another admin (protect against admin lock-out).
        // Also fetch suspension fields so rollback can restore the exact pre-operation state.
        const { data: targetProfile, error: targetErr } = await service
            .from('profiles')
            .select('id, role, suspended_at, suspended_reason, suspended_by')
            .eq('id', targetUserId)
            .single();

        if (targetErr || !targetProfile) {
            return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
        }
        if (targetProfile.role === 'admin') {
            return NextResponse.json(
                { error: 'Admin accounts cannot be suspended via this endpoint' },
                { status: 400 }
            );
        }

        // ── 1. Update profile metadata ────────────────────────────────────────
        const { error: profileUpdateErr } = await service
            .from('profiles')
            .update({
                is_suspended:     suspend,
                suspended_at:     suspend ? new Date().toISOString() : null,
                suspended_reason: suspend ? reason : null,
                suspended_by:     suspend ? user.id : null,
                updated_at:       new Date().toISOString(),
            })
            .eq('id', targetUserId);

        if (profileUpdateErr) {
            console.error('[suspend] profile update failed:', profileUpdateErr);
            return NextResponse.json(
                { error: 'Failed to update profile', message: profileUpdateErr.message },
                { status: 500 }
            );
        }

        // ── 2. Ban / unban at the auth layer ──────────────────────────────────
        // `ban_duration` accepts strings like "100 years" or "none".
        const banDuration = suspend ? '876000h' : 'none'; // ~100 years
        const { error: banErr } = await service.auth.admin.updateUserById(targetUserId, {
            ban_duration: banDuration,
        });

        if (banErr) {
            console.error('[suspend] auth ban update failed:', banErr);
            // Roll back the profile flag to its exact pre-operation state
            await service
                .from('profiles')
                .update({
                    is_suspended:     !suspend,
                    // When rolling back a suspend: clear fields (user was not suspended before)
                    // When rolling back an unsuspend: restore original values from before the op
                    suspended_at:     suspend ? null : (targetProfile.suspended_at     ?? null),
                    suspended_reason: suspend ? null : (targetProfile.suspended_reason ?? null),
                    suspended_by:     suspend ? null : (targetProfile.suspended_by     ?? null),
                })
                .eq('id', targetUserId);

            return NextResponse.json(
                { error: 'Failed to update auth status', message: banErr.message },
                { status: 500 }
            );
        }

        // ── 3. Audit trail ────────────────────────────────────────────────────
        await service.from('notifications').insert({
            user_id: targetUserId,
            type:    'system',
            title:   suspend ? 'Account suspended' : 'Account reinstated',
            message: suspend
                ? (reason || 'Your account has been suspended by an administrator.')
                : 'Your account has been reinstated. You can sign in again.',
            metadata: { admin_id: user.id, action: suspend ? 'suspend' : 'unsuspend' },
        });

        return NextResponse.json({
            success: true,
            data: { id: targetUserId, is_suspended: suspend },
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[suspend] error:', error);
        return NextResponse.json({ error: 'Internal server error', message: msg }, { status: 500 });
    }
}
