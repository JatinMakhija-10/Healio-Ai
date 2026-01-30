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
        currency: 'USD',
        features: [
            'Basic AI Diagnosis',
            '3 Daily Consultations',
            'Community Support'
        ]
    },
    plus: {
        id: 'plus',
        name: 'Healio Plus',
        price: 9.99,
        interval: 'month',
        currency: 'USD',
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
        price: 49.99,
        interval: 'month',
        currency: 'USD',
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
    // Mock network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real app, this would call your backend endpoint responsible for 
    // creating a Stripe Checkout Session
    console.log(`[MOCK STRIPE] Creating checkout session for plan: ${planId}`);

    return {
        // For testing, we just simulate a success URL callback
        url: `/dashboard/billing/success?plan=${planId}`
    };
}

export async function getSubscriptionStatus(): Promise<SubscriptionPlan> {
    // Mock network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Randomly return 'free' or 'plus' for demo, or read from localStorage
    // For now, default to free
    return 'free';
}

export async function cancelSubscription(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`[MOCK STRIPE] Subscription cancelled`);
    return true;
}
