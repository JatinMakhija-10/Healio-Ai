import { describe, it, expect } from "vitest";
import { PLANS, type SubscriptionPlan } from "@/lib/subscription/plans";

describe("Subscription Plans", () => {
    it("defines three plans: free, plus, pro", () => {
        expect(Object.keys(PLANS)).toEqual(["free", "plus", "pro"]);
    });

    it("free plan has correct properties", () => {
        const free = PLANS.free;
        expect(free.id).toBe("free");
        expect(free.price).toBe(0);
        expect(free.currency).toBe("INR");
        expect(free.features).toContain("15 consultations/month");
    });

    it("plus plan has correct price and features (v2 ₹149/mo)", () => {
        const plus = PLANS.plus;
        expect(plus.id).toBe("plus");
        expect(plus.price).toBe(149);
        expect(plus.yearlyPrice).toBe(1299);
        expect(plus.features).toContain("Unlimited AI consultations");
        expect(plus.features).toContain("Family profiles (3)");
        expect(plus.features).toContain("PDF medical reports");
    });

    it("pro plan has correct price and features (v2 ₹399/mo, patient)", () => {
        const pro = PLANS.pro;
        expect(pro.id).toBe("pro");
        expect(pro.price).toBe(399);
        expect(pro.yearlyPrice).toBe(3499);
        expect(pro.audience).toBe("patient");
        expect(pro.features).toContain("Everything in Healio Plus");
        expect(pro.features).toContain("4 video consults/month with doctors");
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
