import { supabase } from '@/lib/supabase';

export type SubscriptionPlan = 'free' | 'plus' | 'pro';

export interface PlanDetails {
    id: SubscriptionPlan;
    name: string;
    price: number;
    interval: 'month' | 'year';
    currency: string;
    features: string[];
}

export const PLANS: Record<SubscriptionPlan, PlanDetails> = {
    free: {
        id: 'free',
        name: 'Healio Basic',
        price: 0,
        interval: 'month',
        currency: 'INR',
        features: [
            'Basic AI Diagnosis',
            '10 Monthly Consultations',
            'Community Support'
        ]
    },
    plus: {
        id: 'plus',
        name: 'Healio Plus',
        price: 999,
        interval: 'month',
        currency: 'INR',
        features: [
            'Unlimited AI Diagnosis',
            'PDF Health Reports',
            'Family Profiles (up to 5)',
            'Vikriti Wellness Tracking',
            'Priority Doctor Access'
        ]
    },
    pro: {
        id: 'pro',
        name: 'Healio Pro',
        price: 4999,
        interval: 'month',
        currency: 'INR',
        features: [
            'Patient Analytics Dashboard',
            'Clinical Sandbox Access',
            'AI-Enhanced SOAP Notes',
            'Verified Badge',
            '0% Platform Fee'
        ]
    }
};

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
        return profile.subscription_plan as SubscriptionPlan;
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
