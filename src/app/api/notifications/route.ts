import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { rateLimitCheck } from '@/lib/api/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications
 * Returns the current authenticated user's notifications.
 * Query params:
 *   ?unread=true   — only unread
 *   ?limit=50      — max results (capped at 100)
 */
export async function GET(request: NextRequest) {
    try {
        const limited = rateLimitCheck(request, 'notifications-get', 60, 60_000);
        if (limited) return limited;

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const unreadOnly = url.searchParams.get('unread') === 'true';
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Notifications GET] Error:', msg);
        return NextResponse.json({ error: 'Internal server error', message: msg }, { status: 500 });
    }
}

/**
 * PATCH /api/notifications
 * Mark notification(s) as read.
 * Body: { id: string }   — mark a single notification
 *    OR { all: true }    — mark all as read
 */
export async function PATCH(request: NextRequest) {
    try {
        const limited = rateLimitCheck(request, 'notifications-patch', 60, 60_000);
        if (limited) return limited;

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const now = new Date().toISOString();

        if (body.all === true) {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true, read_at: now })
                .eq('user_id', user.id)
                .eq('is_read', false);
            if (error) throw error;
            return NextResponse.json({ success: true, updated: 'all' });
        }

        if (!body.id || typeof body.id !== 'string') {
            return NextResponse.json({ error: 'Provide id or all:true' }, { status: 400 });
        }

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: now })
            .eq('id', body.id)
            .eq('user_id', user.id);
        if (error) throw error;

        return NextResponse.json({ success: true, updated: body.id });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Notifications PATCH] Error:', msg);
        return NextResponse.json({ error: 'Internal server error', message: msg }, { status: 500 });
    }
}
