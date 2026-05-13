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
    getFamilyProfileLimit,
    getMonthlyConsultationLimit,
    getDailyConsultationLimit,
    getCooldownSeconds,
    getPlatformFeePercentage,
    getUpgradePlanForFeature,
    getCreditCost,
    getCreditPackById,
    getTotalCreditsForPack,
    hasFeature,
    normalizeSubscriptionPlan,
} from "../plans";

describe("Healio subscription tier rules", () => {
    it("defines Basic, Plus, and Pro plans", () => {
        expect(Object.keys(PLANS)).toEqual(["free", "plus", "pro"]);
        expect(PLANS.pro.name).toBe("Healio Pro");
        expect(PLANS.pro.audience).toBe("doctor");
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

    it("keeps family profiles to paid tiers", () => {
        expect(getFamilyProfileLimit("free")).toBe(1);
        expect(getFamilyProfileLimit("plus")).toBe(5);
        expect(getFamilyProfileLimit("pro")).toBe(5);
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

    it("enforces daily consultation limits for free tier", () => {
        expect(FREE_DAILY_CONSULTATIONS).toBe(2);
        expect(getDailyConsultationLimit("free")).toBe(FREE_DAILY_CONSULTATIONS);
        expect(getDailyConsultationLimit("plus")).toBe(UNLIMITED_USAGE);
        expect(getDailyConsultationLimit("pro")).toBe(UNLIMITED_USAGE);
    });

    it("enforces cooldown only for free tier", () => {
        expect(FREE_COOLDOWN_SECONDS).toBe(30);
        expect(getCooldownSeconds("free")).toBe(FREE_COOLDOWN_SECONDS);
        expect(getCooldownSeconds("plus")).toBe(0);
        expect(getCooldownSeconds("pro")).toBe(0);
    });

    it("defines credit costs per feature action", () => {
        expect(CREDIT_COSTS.consultation).toBe(1);
        expect(CREDIT_COSTS.pdf_report).toBe(2);
        expect(CREDIT_COSTS.priority_booking).toBe(3);
        expect(CREDIT_COSTS.wellness_snapshot).toBe(1);
        expect(getCreditCost("consultation")).toBe(1);
    });

    it("defines credit packs with correct totals", () => {
        expect(CREDIT_PACKS.length).toBeGreaterThanOrEqual(3);
        const popular = CREDIT_PACKS.find(p => p.popular);
        expect(popular).toBeDefined();
        expect(getTotalCreditsForPack(popular!)).toBe(popular!.credits + popular!.bonus);
    });

    it("looks up credit packs by id", () => {
        expect(getCreditPackById("pack_5")?.credits).toBe(5);
        expect(getCreditPackById("nonexistent")).toBeUndefined();
    });

    it("gives Plus subscribers 50 monthly credits", () => {
        expect(PLUS_MONTHLY_CREDITS).toBe(50);
    });

    it("reduced free monthly limit from 10 to 5", () => {
        expect(FREE_MONTHLY_CONSULTATIONS).toBe(5);
        expect(getMonthlyConsultationLimit("free")).toBe(5);
    });
});
