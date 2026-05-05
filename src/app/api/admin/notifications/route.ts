import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { createServiceClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/notifications
 * Fetch all admin-sent notifications (most recent first)
 */
export async function GET(request: NextRequest) {
    void request;
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles').select('role').eq('id', session.user.id).single();
        if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Fetch recent admin-sent notifications (grouped by batch)
        const serviceClient = createServiceClient();
        const { data, error } = await serviceClient
            .from('notifications')
            .select('*')
            .in('type', ['admin_alert', 'system'])
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Internal server error', message: msg }, { status: 500 });
    }
}

/**
 * POST /api/admin/notifications
 * Send notification to users
 *
 * Body: {
 *   title: string,
 *   message: string,
 *   type?: 'admin_alert' | 'system',
 *   target: 'all' | 'patients' | 'doctors' | 'specific',
 *   userIds?: string[],     // Required if target === 'specific'
 *   actionUrl?: string,
 *   metadata?: object,
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles').select('role').eq('id', session.user.id).single();
        if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const {
            title,
            message,
            type = 'admin_alert',
            target = 'all',
            userIds,
            actionUrl,
            metadata = {},
        } = body;

        if (!title || !message) {
            return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
        }

        // Validate type
        if (!['admin_alert', 'system'].includes(type)) {
            return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
        }

        // Service key is required to bypass RLS for cross-user queries
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('[Admin Notifications] SUPABASE_SERVICE_ROLE_KEY is not set — cannot bypass RLS');
            return NextResponse.json(
                { error: 'Server configuration error', message: 'SUPABASE_SERVICE_ROLE_KEY is not configured. Admin notifications require the service role key to bypass RLS.' },
                { status: 500 }
            );
        }

        // Use service client to bypass RLS for inserting notifications
        const serviceClient = createServiceClient();

        // Resolve target user IDs
        let targetUserIds: string[] = [];

        if (target === 'specific') {
            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return NextResponse.json({ error: 'userIds required for specific target' }, { status: 400 });
            }
            targetUserIds = userIds;
        } else {
            // Fetch user IDs based on target
            let query = serviceClient.from('profiles').select('id');

            if (target === 'patients') {
                query = query.eq('role', 'patient');
            } else if (target === 'doctors') {
                query = query.eq('role', 'doctor');
            }
            // 'all' fetches everyone (patients + doctors, excluding admins)
            if (target === 'all') {
                query = query.neq('role', 'admin');
            }

            const { data: users, error: usersError } = await query;
            if (usersError) {
                console.error('[Admin Notifications] Profiles query error:', usersError.message);
                throw new Error(`Failed to fetch target users: ${usersError.message}`);
            }
            targetUserIds = (users || []).map((u: { id: string }) => u.id);
        }

        if (targetUserIds.length === 0) {
            return NextResponse.json({ error: 'No users found for the selected target' }, { status: 400 });
        }

        // Build notification rows
        const notificationRows = targetUserIds.map(userId => ({
            user_id: userId,
            type,
            title,
            message,
            action_url: actionUrl || null,
            metadata: {
                ...metadata,
                sent_by: session.user.id,
                sent_by_email: session.user.email,
                target_group: target,
            },
            is_read: false,
        }));

        // Insert in batches of 500 to avoid payload limits
        const BATCH_SIZE = 500;
        let totalInserted = 0;

        for (let i = 0; i < notificationRows.length; i += BATCH_SIZE) {
            const batch = notificationRows.slice(i, i + BATCH_SIZE);
            const { error: insertError } = await serviceClient
                .from('notifications')
                .insert(batch);

            if (insertError) {
                console.error('[Admin Notifications] Insert error:', insertError.message);
                throw new Error(`Failed to insert notifications: ${insertError.message}`);
            }
            totalInserted += batch.length;
        }

        return NextResponse.json({
            success: true,
            data: {
                sent: totalInserted,
                target,
                title,
            },
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Admin Notifications] Error:', msg);
        return NextResponse.json({ error: 'Internal server error', message: msg }, { status: 500 });
    }
}
