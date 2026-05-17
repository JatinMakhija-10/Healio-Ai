import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabaseServer';
import { rateLimitCheck } from '@/lib/api/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/users/[id]/reset-password
 *
 * Generates a password-recovery link and emails it to the target user.
 * The admin never sees the password — Supabase delivers the link directly.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const limited = rateLimitCheck(request, 'admin', 10, 60_000);
        if (limited) return limited;

        const { id: targetUserId } = await params;
        if (!targetUserId) {
            return NextResponse.json({ error: 'User id is required' }, { status: 400 });
        }

        // ── AuthN/Z ───────────────────────────────────────────────────────────
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json(
                {
                    error: 'Server configuration error',
                    message: 'SUPABASE_SERVICE_ROLE_KEY is not configured. Admin password resets require the service role key.',
                },
                { status: 500 }
            );
        }

        const service = createServiceClient();

        // Look up the target's email
        const { data: targetProfile, error: targetErr } = await service
            .from('profiles')
            .select('id, email')
            .eq('id', targetUserId)
            .single();

        if (targetErr || !targetProfile?.email) {
            return NextResponse.json(
                { error: 'Target user not found or has no email on file' },
                { status: 404 }
            );
        }

        // Build the redirect URL — uses the request origin so it works in dev + prod
        const origin = request.headers.get('origin')
            || process.env.NEXT_PUBLIC_SITE_URL
            || new URL(request.url).origin;
        const redirectTo = `${origin}/auth/reset-password`;

        // Trigger Supabase's built-in recovery flow (sends the email)
        const { error: resetErr } = await service.auth.resetPasswordForEmail(
            targetProfile.email,
            { redirectTo }
        );

        if (resetErr) {
            console.error('[reset-password] resetPasswordForEmail failed:', resetErr);
            return NextResponse.json(
                { error: 'Failed to send reset email', message: resetErr.message },
                { status: 500 }
            );
        }

        // Audit trail
        await service.from('notifications').insert({
            user_id: targetUserId,
            type:    'system',
            title:   'Password reset requested',
            message: 'An administrator triggered a password reset on your account. Check your email for the recovery link.',
            metadata: { admin_id: user.id, action: 'reset_password' },
        });

        return NextResponse.json({
            success: true,
            data: { email: targetProfile.email },
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[reset-password] error:', error);
        return NextResponse.json({ error: 'Internal server error', message: msg }, { status: 500 });
    }
}
