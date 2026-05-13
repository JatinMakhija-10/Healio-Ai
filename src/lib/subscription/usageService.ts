import { supabase } from '@/lib/supabase';
import {
    type SubscriptionPlan,
    type CreditAction,
    type CreditPack,
    normalizeSubscriptionPlan,
    CREDIT_COSTS,
    CREDIT_PACKS,
    getTotalCreditsForPack,
} from './plans';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UsageSummary {
    plan: SubscriptionPlan;
    monthlyUsed: number;
    monthlyLimit: number;
    dailyUsed: number;
    dailyLimit: number;
    creditsBalance: number;
    resetsAt: string;
    lastChatAt: string | null;
}

export interface CreditTransaction {
    id: string;
    amount: number;
    balance_after: number;
    action: string;
    description: string | null;
    pack_id: string | null;
    created_at: string;
}

export interface SpendResult {
    success: boolean;
    error?: string;
    new_balance?: number;
    required?: number;
    available?: number;
}

export interface TopUpResult {
    success: boolean;
    error?: string;
    new_balance?: number;
}

// ─── Service Functions ───────────────────────────────────────────────────────

export async function getUsageSummary(): Promise<UsageSummary | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase.rpc('get_usage_summary', {
            p_user_id: user.id,
        });

        if (error || !data) {
            console.warn('[usageService] get_usage_summary error:', error?.message);
            return null;
        }

        const raw = typeof data === 'string' ? JSON.parse(data) : data;

        return {
            plan: normalizeSubscriptionPlan(raw.plan),
            monthlyUsed: raw.monthly_used ?? 0,
            monthlyLimit: raw.monthly_limit ?? 5,
            dailyUsed: raw.daily_used ?? 0,
            dailyLimit: raw.daily_limit ?? 2,
            creditsBalance: raw.credits_balance ?? 0,
            resetsAt: raw.resets_at ?? new Date().toISOString(),
            lastChatAt: raw.last_chat_at ?? null,
        };
    } catch (err) {
        console.error('[usageService] getUsageSummary failed:', err);
        return null;
    }
}

export async function getCreditsBalance(): Promise<number> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;

        const { data, error } = await supabase
            .from('profiles')
            .select('credits_balance')
            .eq('id', user.id)
            .single();

        if (error || !data) return 0;
        return data.credits_balance ?? 0;
    } catch {
        return 0;
    }
}

export async function spendCredits(
    action: CreditAction,
    description?: string
): Promise<SpendResult> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Not authenticated' };

        const cost = CREDIT_COSTS[action];

        const { data, error } = await supabase.rpc('spend_credits', {
            p_user_id: user.id,
            p_amount: cost,
            p_action: action,
            p_description: description ?? `Used ${cost} credit(s) for ${action}`,
        });

        if (error) return { success: false, error: error.message };

        const raw = typeof data === 'string' ? JSON.parse(data) : data;
        return raw as SpendResult;
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

export async function purchaseCreditPack(packId: string): Promise<TopUpResult> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Not authenticated' };

        const pack = CREDIT_PACKS.find((p: CreditPack) => p.id === packId);
        if (!pack) return { success: false, error: 'Invalid pack ID' };

        const totalCredits = getTotalCreditsForPack(pack);

        const { data, error } = await supabase.rpc('add_credits', {
            p_user_id: user.id,
            p_amount: totalCredits,
            p_action: 'top_up',
            p_description: `Purchased ${pack.label} pack (${pack.credits}+${pack.bonus} bonus credits)`,
            p_pack_id: packId,
        });

        if (error) return { success: false, error: error.message };

        const raw = typeof data === 'string' ? JSON.parse(data) : data;
        return raw as TopUpResult;
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

export async function getCreditHistory(limit = 20): Promise<CreditTransaction[]> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error || !data) return [];
        return data as CreditTransaction[];
    } catch {
        return [];
    }
}

export async function grantMonthlyCredits(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data, error } = await supabase.rpc('grant_monthly_credits', {
            p_user_id: user.id,
        });

        if (error) {
            console.warn('[usageService] grant_monthly_credits error:', error.message);
            return false;
        }

        const raw = typeof data === 'string' ? JSON.parse(data) : data;
        return raw?.granted === true;
    } catch {
        return false;
    }
}
