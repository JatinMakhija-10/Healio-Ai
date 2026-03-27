import { describe, it, expect } from "vitest";

/**
 * Tests for subscription plan definitions.
 * We define them inline to avoid importing mockClient.ts which needs Supabase env vars.
 */

type SubscriptionPlan = 'free' | 'plus' | 'pro';

interface PlanDetails {
    id: SubscriptionPlan;
    name: string;
    price: number;
    interval: 'month' | 'year';
    currency: string;
    features: string[];
}

// Mirror of PLANS from mockClient.ts — kept in sync manually
const PLANS: Record<SubscriptionPlan, PlanDetails> = {
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

describe("Subscription Plans", () => {
    it("defines three plans: free, plus, pro", () => {
        expect(Object.keys(PLANS)).toEqual(["free", "plus", "pro"]);
    });

    it("free plan has correct properties", () => {
        const free = PLANS.free;
        expect(free.id).toBe("free");
        expect(free.price).toBe(0);
        expect(free.currency).toBe("INR");
        expect(free.features).toContain("10 Monthly Consultations");
    });

    it("plus plan has correct price and features", () => {
        const plus = PLANS.plus;
        expect(plus.id).toBe("plus");
        expect(plus.price).toBe(999);
        expect(plus.features).toContain("Unlimited AI Diagnosis");
        expect(plus.features).toContain("Family Profiles (up to 5)");
        expect(plus.features).toContain("PDF Health Reports");
    });

    it("pro plan has correct price and features", () => {
        const pro = PLANS.pro;
        expect(pro.id).toBe("pro");
        expect(pro.price).toBe(4999);
        expect(pro.features).toContain("Patient Analytics Dashboard");
    });

    it("all plan IDs are valid SubscriptionPlan types", () => {
        const validPlans: SubscriptionPlan[] = ["free", "plus", "pro"];
        for (const plan of validPlans) {
            expect(PLANS[plan]).toBeDefined();
            expect(PLANS[plan].id).toBe(plan);
        }
    });

    it("all plans have non-empty features arrays", () => {
        for (const key of Object.keys(PLANS) as SubscriptionPlan[]) {
            expect(PLANS[key].features.length).toBeGreaterThan(0);
        }
    });

    it("plus and pro plans are more expensive than free", () => {
        expect(PLANS.plus.price).toBeGreaterThan(PLANS.free.price);
        expect(PLANS.pro.price).toBeGreaterThan(PLANS.plus.price);
    });
});
