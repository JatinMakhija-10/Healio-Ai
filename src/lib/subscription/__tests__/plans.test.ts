import { describe, expect, it } from "vitest";
import {
    DEFAULT_PLATFORM_FEE_PERCENTAGE,
    FREE_MONTHLY_CONSULTATIONS,
    PLANS,
    PRO_PLATFORM_FEE_PERCENTAGE,
    UNLIMITED_USAGE,
    getFamilyProfileLimit,
    getMonthlyConsultationLimit,
    getPlatformFeePercentage,
    getUpgradePlanForFeature,
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
});
