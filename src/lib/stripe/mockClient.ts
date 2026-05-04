import { supabase } from '@/lib/supabase';
export {
    PLANS,
    type PlanDetails,
    type SubscriptionPlan,
    normalizeSubscriptionPlan,
} from '@/lib/subscription/plans';
import { normalizeSubscriptionPlan, type SubscriptionPlan } from '@/lib/subscription/plans';

export async function createCheckoutSession(planId: string): Promise<{ url: string }> {
    // Mock network delay — replace with real Stripe integration later
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`[MOCK STRIPE] Creating checkout session for plan: ${planId}`);
    return {
        url: `/dashboard/billing/success?plan=${planId}`
    };
}

export async function getSubscriptionStatus(): Promise<SubscriptionPlan> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 'free';

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('subscription_plan')
            .eq('id', user.id)
            .single();

        if (error || !profile?.subscription_plan) return 'free';
        return normalizeSubscriptionPlan(profile.subscription_plan);
    } catch {
        // Fallback to free if DB query fails (e.g., column not yet migrated)
        return 'free';
    }
}

export async function cancelSubscription(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from('profiles')
            .update({ subscription_plan: 'free' })
            .eq('id', user.id);

        if (error) {
            console.error('Failed to cancel subscription:', error);
            return false;
        }
        return true;
    } catch {
        console.error('[cancelSubscription] Error');
        return false;
    }
}
