import { describe, expect, it } from "vitest";
import {
    DEFAULT_PLATFORM_FEE_PERCENTAGE,
    FREE_MONTHLY_CONSULTATIONS,
    FREE_DAILY_CONSULTATIONS,
    FREE_COOLDOWN_SECONDS,
    PLANS,
    PRO_PLATFORM_FEE_PERCENTAGE,
    UNLIMITED_USAGE,
    CREDIT_COSTS,
    CREDIT_PACKS,
    PLUS_MONTHLY_CREDITS,
    PRO_MONTHLY_CREDITS,
    PLUS_ROLLOVER_CAP,
    PRO_ROLLOVER_CAP,
    PLUS_FAMILY_PROFILE_LIMIT,
    PRO_FAMILY_PROFILE_LIMIT,
    getFamilyProfileLimit,
    getMonthlyConsultationLimit,
    getDailyConsultationLimit,
    getCooldownSeconds,
    getPlatformFeePercentage,
    getUpgradePlanForFeature,
    getCreditCost,
    getCreditPackById,
    getTotalCreditsForPack,
    getMonthlyCreditGrant,
    getCreditsRolloverCap,
    getEffectiveMonthlyPrice,
    getYearlySavings,
    formatINR,
    hasFeature,
    normalizeSubscriptionPlan,
} from "../plans";

describe("Arovia subscription tier rules", () => {
    it("defines Basic, Plus, and Pro plans (all patient-facing in v2)", () => {
        expect(Object.keys(PLANS)).toEqual(["free", "plus", "pro"]);
        expect(PLANS.pro.name).toBe("Arovia Pro");
        expect(PLANS.pro.audience).toBe("patient");
        expect(PLANS.plus.audience).toBe("patient");
        expect(PLANS.free.audience).toBe("patient");
    });

    it("uses aggressive India-market pricing (Plus ₹149, Pro ₹399)", () => {
        expect(PLANS.free.price).toBe(0);
        expect(PLANS.plus.price).toBe(149);
        expect(PLANS.plus.yearlyPrice).toBe(1299);
        expect(PLANS.pro.price).toBe(399);
        expect(PLANS.pro.yearlyPrice).toBe(3499);
    });

    it("normalizes unknown plans to free", () => {
        expect(normalizeSubscriptionPlan("plus")).toBe("plus");
        expect(normalizeSubscriptionPlan("pro")).toBe("pro");
        expect(normalizeSubscriptionPlan("enterprise")).toBe("free");
        expect(normalizeSubscriptionPlan(null)).toBe("free");
    });

    it("enforces free monthly consultation limits and paid unlimited usage", () => {
        expect(getMonthlyConsultationLimit("free")).toBe(FREE_MONTHLY_CONSULTATIONS);
        expect(getMonthlyConsultationLimit("plus")).toBe(UNLIMITED_USAGE);
        expect(getMonthlyConsultationLimit("pro")).toBe(UNLIMITED_USAGE);
    });

    it("differentiates family profile limits per tier (Plus=3, Pro=6)", () => {
        expect(getFamilyProfileLimit("free")).toBe(1);
        expect(getFamilyProfileLimit("plus")).toBe(PLUS_FAMILY_PROFILE_LIMIT);
        expect(getFamilyProfileLimit("plus")).toBe(3);
        expect(getFamilyProfileLimit("pro")).toBe(PRO_FAMILY_PROFILE_LIMIT);
        expect(getFamilyProfileLimit("pro")).toBe(6);
        expect(hasFeature("free", "family_profiles")).toBe(false);
        expect(hasFeature("plus", "family_profiles")).toBe(true);
    });

    it("gates Pro-only doctor features", () => {
        expect(hasFeature("plus", "clinical_sandbox")).toBe(false);
        expect(hasFeature("plus", "patient_analytics_dashboard")).toBe(false);
        expect(hasFeature("pro", "clinical_sandbox")).toBe(true);
        expect(hasFeature("pro", "ai_soap_notes")).toBe(true);
        expect(hasFeature("pro", "verified_badge")).toBe(true);
    });

    it("sets platform fees to 0 only for Pro doctors", () => {
        expect(getPlatformFeePercentage("free")).toBe(DEFAULT_PLATFORM_FEE_PERCENTAGE);
        expect(getPlatformFeePercentage("plus")).toBe(DEFAULT_PLATFORM_FEE_PERCENTAGE);
        expect(getPlatformFeePercentage("pro")).toBe(PRO_PLATFORM_FEE_PERCENTAGE);
    });

    it("maps locked features to the right upgrade plan", () => {
        expect(getUpgradePlanForFeature("pdf_health_reports")).toBe("plus");
        expect(getUpgradePlanForFeature("clinical_sandbox")).toBe("pro");
        expect(getUpgradePlanForFeature("zero_platform_fee")).toBe("pro");
    });

    it("enforces daily consultation limits for free tier (v2: 4/day)", () => {
        expect(FREE_DAILY_CONSULTATIONS).toBe(4);
        expect(getDailyConsultationLimit("free")).toBe(FREE_DAILY_CONSULTATIONS);
        expect(getDailyConsultationLimit("plus")).toBe(UNLIMITED_USAGE);
        expect(getDailyConsultationLimit("pro")).toBe(UNLIMITED_USAGE);
    });

    it("enforces cooldown only for free tier (v2: 60s)", () => {
        expect(FREE_COOLDOWN_SECONDS).toBe(60);
        expect(getCooldownSeconds("free")).toBe(FREE_COOLDOWN_SECONDS);
        expect(getCooldownSeconds("plus")).toBe(0);
        expect(getCooldownSeconds("pro")).toBe(0);
    });

    it("defines credit costs for all 8 actions (v2 expanded)", () => {
        expect(CREDIT_COSTS.consultation).toBe(1);
        expect(CREDIT_COSTS.wellness_snapshot).toBe(2);
        expect(CREDIT_COSTS.pdf_report).toBe(3);
        expect(CREDIT_COSTS.family_consult).toBe(2);
        expect(CREDIT_COSTS.priority_booking).toBe(5);
        expect(CREDIT_COSTS.specialist_opinion).toBe(5);
        expect(CREDIT_COSTS.lab_report_analysis).toBe(10);
        expect(CREDIT_COSTS.video_consult).toBe(50);
        expect(getCreditCost("consultation")).toBe(1);
        expect(getCreditCost("video_consult")).toBe(50);
    });

    it("defines 5 credit packs with UPI-friendly INR prices", () => {
        expect(CREDIT_PACKS.length).toBe(5);
        const popular = CREDIT_PACKS.find(p => p.popular);
        expect(popular).toBeDefined();
        expect(popular!.id).toBe("pack_popular");
        expect(popular!.price).toBe(129);
        expect(getTotalCreditsForPack(popular!)).toBe(60);
        // All packs INR-denominated
        expect(CREDIT_PACKS.every(p => p.currency === "INR")).toBe(true);
        // Cheapest at ₹29 (UPI no-PIN friendly)
        expect(Math.min(...CREDIT_PACKS.map(p => p.price))).toBe(29);
    });

    it("looks up credit packs by new ids", () => {
        expect(getCreditPackById("pack_mini")?.credits).toBe(10);
        expect(getCreditPackById("pack_mega")?.price).toBe(599);
        expect(getCreditPackById("nonexistent")).toBeUndefined();
    });

    it("grants Plus=40 and Pro=120 credits per month with rollover caps", () => {
        expect(PLUS_MONTHLY_CREDITS).toBe(40);
        expect(PRO_MONTHLY_CREDITS).toBe(120);
        expect(PLUS_ROLLOVER_CAP).toBe(120);
        expect(PRO_ROLLOVER_CAP).toBe(360);
        expect(getMonthlyCreditGrant("free")).toBe(0);
        expect(getMonthlyCreditGrant("plus")).toBe(40);
        expect(getMonthlyCreditGrant("pro")).toBe(120);
        expect(getCreditsRolloverCap("plus")).toBe(120);
        expect(getCreditsRolloverCap("pro")).toBe(360);
    });

    it("raised free monthly limit from 5 to 15 (v2 aggressive)", () => {
        expect(FREE_MONTHLY_CONSULTATIONS).toBe(15);
        expect(getMonthlyConsultationLimit("free")).toBe(15);
    });

    it("computes effective monthly price for yearly billing", () => {
        expect(getEffectiveMonthlyPrice("plus", "month")).toBe(149);
        expect(getEffectiveMonthlyPrice("plus", "year")).toBe(Math.round(1299 / 12)); // 108
        expect(getEffectiveMonthlyPrice("pro", "year")).toBe(Math.round(3499 / 12));  // 292
        expect(getEffectiveMonthlyPrice("free", "year")).toBe(0);
    });

    it("computes yearly savings vs monthly", () => {
        expect(getYearlySavings("free")).toBe(0);
        expect(getYearlySavings("plus")).toBe(149 * 12 - 1299); // 489
        expect(getYearlySavings("pro")).toBe(399 * 12 - 3499);   // 1289
    });

    it("formats INR using Indian number system", () => {
        expect(formatINR(0)).toBe("\u20B90");
        expect(formatINR(149)).toBe("\u20B9149");
        expect(formatINR(100000)).toBe("\u20B91,00,000");
    });
});
