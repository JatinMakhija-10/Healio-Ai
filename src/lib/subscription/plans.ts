export type SubscriptionPlan = "free" | "plus" | "pro";

export type SubscriptionFeature =
    | "ai_consultations"
    | "pdf_health_reports"
    | "family_profiles"
    | "vikriti_wellness_tracking"
    | "priority_doctor_access"
    | "patient_analytics_dashboard"
    | "clinical_sandbox"
    | "ai_soap_notes"
    | "verified_badge"
    | "zero_platform_fee";

export interface PlanDetails {
    id: SubscriptionPlan;
    name: string;
    price: number;
    interval: "month" | "year";
    currency: string;
    audience: "patient" | "doctor";
    features: string[];
}

export interface TierRules {
    monthlyConsultationLimit: number;
    familyProfileLimit: number;
    platformFeePercentage: number;
    features: Record<SubscriptionFeature, boolean>;
}

export const UNLIMITED_USAGE = -1;
export const FREE_MONTHLY_CONSULTATIONS = 10;
export const PLUS_FAMILY_PROFILE_LIMIT = 5;
export const DEFAULT_PLATFORM_FEE_PERCENTAGE = 20;
export const PRO_PLATFORM_FEE_PERCENTAGE = 0;

export const PLANS: Record<SubscriptionPlan, PlanDetails> = {
    free: {
        id: "free",
        name: "Healio Basic",
        price: 0,
        interval: "month",
        currency: "INR",
        audience: "patient",
        features: [
            "Basic AI Diagnosis",
            "10 Monthly Consultations",
            "Community Support",
        ],
    },
    plus: {
        id: "plus",
        name: "Healio Plus",
        price: 999,
        interval: "month",
        currency: "INR",
        audience: "patient",
        features: [
            "Unlimited AI Diagnosis",
            "PDF Health Reports",
            "Family Profiles (up to 5)",
            "Vikriti Wellness Tracking",
            "Priority Doctor Access",
        ],
    },
    pro: {
        id: "pro",
        name: "Healio Pro",
        price: 4999,
        interval: "month",
        currency: "INR",
        audience: "doctor",
        features: [
            "Everything in Healio Plus",
            "Patient Analytics Dashboard",
            "Clinical Sandbox Access",
            "AI-Enhanced SOAP Notes",
            "Verified Badge",
            "0% Platform Fee",
        ],
    },
};

const noFeatures: Record<SubscriptionFeature, boolean> = {
    ai_consultations: true,
    pdf_health_reports: false,
    family_profiles: false,
    vikriti_wellness_tracking: false,
    priority_doctor_access: false,
    patient_analytics_dashboard: false,
    clinical_sandbox: false,
    ai_soap_notes: false,
    verified_badge: false,
    zero_platform_fee: false,
};

export const TIER_RULES: Record<SubscriptionPlan, TierRules> = {
    free: {
        monthlyConsultationLimit: FREE_MONTHLY_CONSULTATIONS,
        familyProfileLimit: 1,
        platformFeePercentage: DEFAULT_PLATFORM_FEE_PERCENTAGE,
        features: noFeatures,
    },
    plus: {
        monthlyConsultationLimit: UNLIMITED_USAGE,
        familyProfileLimit: PLUS_FAMILY_PROFILE_LIMIT,
        platformFeePercentage: DEFAULT_PLATFORM_FEE_PERCENTAGE,
        features: {
            ...noFeatures,
            pdf_health_reports: true,
            family_profiles: true,
            vikriti_wellness_tracking: true,
            priority_doctor_access: true,
        },
    },
    pro: {
        monthlyConsultationLimit: UNLIMITED_USAGE,
        familyProfileLimit: PLUS_FAMILY_PROFILE_LIMIT,
        platformFeePercentage: PRO_PLATFORM_FEE_PERCENTAGE,
        features: {
            ...noFeatures,
            pdf_health_reports: true,
            family_profiles: true,
            vikriti_wellness_tracking: true,
            priority_doctor_access: true,
            patient_analytics_dashboard: true,
            clinical_sandbox: true,
            ai_soap_notes: true,
            verified_badge: true,
            zero_platform_fee: true,
        },
    },
};

export function normalizeSubscriptionPlan(plan: unknown): SubscriptionPlan {
    return plan === "plus" || plan === "pro" ? plan : "free";
}

export function getTierRules(plan: unknown): TierRules {
    return TIER_RULES[normalizeSubscriptionPlan(plan)];
}

export function getMonthlyConsultationLimit(plan: unknown): number {
    return getTierRules(plan).monthlyConsultationLimit;
}

export function getFamilyProfileLimit(plan: unknown): number {
    return getTierRules(plan).familyProfileLimit;
}

export function getPlatformFeePercentage(plan: unknown): number {
    return getTierRules(plan).platformFeePercentage;
}

export function hasFeature(plan: unknown, feature: SubscriptionFeature): boolean {
    return getTierRules(plan).features[feature];
}

export function isPaidPlan(plan: unknown): boolean {
    return normalizeSubscriptionPlan(plan) !== "free";
}

export function isProPlan(plan: unknown): boolean {
    return normalizeSubscriptionPlan(plan) === "pro";
}

export function getUpgradePlanForFeature(feature: SubscriptionFeature): SubscriptionPlan {
    return [
        "patient_analytics_dashboard",
        "clinical_sandbox",
        "ai_soap_notes",
        "verified_badge",
        "zero_platform_fee",
    ].includes(feature)
        ? "pro"
        : "plus";
}
