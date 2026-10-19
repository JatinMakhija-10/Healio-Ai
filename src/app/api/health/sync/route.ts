import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/ai/config';
import { detectClinicalAnomalies } from '@/lib/health/healthSyncEngine';
import { WearableDataSummary } from '@/types/healthSync';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Partial<WearableDataSummary>;

        // Verify/Recalculate clinical anomalies on the server
        const metrics = body.metrics || {};
        const verifiedAnomalies = detectClinicalAnomalies(metrics);

        const wearablePayload: WearableDataSummary = {
            hasConnectedDevice: Boolean(body.hasConnectedDevice ?? (body.connectedSources && body.connectedSources.length > 0)),
            connectedSources: body.connectedSources || ['manual_sync'],
            lastSyncedAt: new Date().toISOString(),
            metrics,
            anomalies: verifiedAnomalies,
        };

        // Extract user token from Authorization header or cookie if present
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.replace(/^Bearer\s+/i, '');

        let userId: string | null = null;
        if (token) {
            try {
                const supabaseAdmin = getSupabaseAdmin();
                const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
                if (!error && user) {
                    userId = user.id;
                }
            } catch (err) {
                console.warn('[health/sync] Auth token verification failed:', err);
            }
        }

        // If authenticated user found, persist to Supabase user_metadata
        if (userId) {
            try {
                const supabaseAdmin = getSupabaseAdmin();
                const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
                const existingMeta = userData.user?.user_metadata || {};
                const existingMedical = existingMeta.medical_profile || {};

                await supabaseAdmin.auth.admin.updateUserById(userId, {
                    user_metadata: {
                        ...existingMeta,
                        wearable_data: wearablePayload,
                        medical_profile: {
                            ...existingMedical,
                            wearable_data: wearablePayload,
                        },
                    },
                });
            } catch (err) {
                console.error('[health/sync] Failed to persist wearable_data to user_metadata:', err);
            }
        }

        return NextResponse.json({
            success: true,
            userId,
            wearableData: wearablePayload,
            anomaliesCount: verifiedAnomalies.length,
            message: 'Health telemetry synchronized successfully',
        });
    } catch (error) {
        console.error('[health/sync] Error processing health sync request:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error processing health sync' },
            { status: 500 }
        );
    }
}
