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

export type CreditAction =
    | "consultation"
    | "pdf_report"
    | "priority_booking"
    | "wellness_snapshot"
    | "specialist_opinion"
    | "family_consult"
    | "lab_report_analysis"
    | "video_consult";

export type BillingCycle = "month" | "year";

export interface PlanDetails {
    id: SubscriptionPlan;
    name: string;
    price: number;            // monthly price (INR)
    yearlyPrice: number;      // yearly total (INR) — 0 for free
    interval: BillingCycle;   // default display interval
    currency: string;
    audience: "patient" | "doctor";
    tagline: string;
    features: string[];
}

export interface TierRules {
    monthlyConsultationLimit: number;
    dailyConsultationLimit: number;
    cooldownSeconds: number;
    familyProfileLimit: number;
    monthlyCredits: number;       // auto-granted each cycle
    creditsRolloverCap: number;   // max unused credits that carry over
    platformFeePercentage: number;
    features: Record<SubscriptionFeature, boolean>;
}

export interface CreditPack {
    id: string;
    credits: number;
    bonus: number;
    price: number;
    currency: string;
    label: string;
    popular?: boolean;
}

export const UNLIMITED_USAGE = -1;

// ─── Free tier limits (Aggressive India pricing v2) ──────────────────────────
export const FREE_MONTHLY_CONSULTATIONS = 15;
export const FREE_DAILY_CONSULTATIONS = 4;
export const FREE_COOLDOWN_SECONDS = 60;

// ─── Family profile limits ───────────────────────────────────────────────────
export const PLUS_FAMILY_PROFILE_LIMIT = 3;
export const PRO_FAMILY_PROFILE_LIMIT = 6;

// ─── Platform fees ───────────────────────────────────────────────────────────
export const DEFAULT_PLATFORM_FEE_PERCENTAGE = 20;
export const PRO_PLATFORM_FEE_PERCENTAGE = 0;

// ─── Monthly credit grants ───────────────────────────────────────────────────
export const PLUS_MONTHLY_CREDITS = 40;
export const PRO_MONTHLY_CREDITS = 120;
export const PLUS_ROLLOVER_CAP = 120;   // up to 3 months of credits
export const PRO_ROLLOVER_CAP = 360;

// ─── Yearly discount (annual saves ~27%) ─────────────────────────────────────
export const YEARLY_DISCOUNT_PERCENT = 27;

// ─── Credit costs per action (INR-tuned) ─────────────────────────────────────
export const CREDIT_COSTS: Record<CreditAction, number> = {
    consultation: 1,
    wellness_snapshot: 2,
    pdf_report: 3,
    family_consult: 2,
    priority_booking: 5,
    specialist_opinion: 5,
    lab_report_analysis: 10,
    video_consult: 50,
};

// ─── Credit packs (UPI-friendly price points) ────────────────────────────────
export const CREDIT_PACKS: CreditPack[] = [
    { id: "pack_mini",    credits: 10,  bonus: 0,  price: 29,  currency: "INR", label: "Mini" },
    { id: "pack_starter", credits: 25,  bonus: 0,  price: 59,  currency: "INR", label: "Starter" },
    { id: "pack_popular", credits: 50,  bonus: 10, price: 129, currency: "INR", label: "Popular", popular: true },
    { id: "pack_value",   credits: 125, bonus: 25, price: 279, currency: "INR", label: "Value" },
    { id: "pack_mega",    credits: 325, bonus: 75, price: 599, currency: "INR", label: "Mega" },
];

export const PLANS: Record<SubscriptionPlan, PlanDetails> = {
    free: {
        id: "free",
        name: "Healio Basic",
        price: 0,
        yearlyPrice: 0,
        interval: "month",
        currency: "INR",
        audience: "patient",
        tagline: "Start your health journey free",
        features: [
            "Basic AI Health Consultation",
            `${FREE_MONTHLY_CONSULTATIONS} consultations/month`,
            `${FREE_DAILY_CONSULTATIONS} per day · ${FREE_COOLDOWN_SECONDS}s cooldown`,
            "1 profile",
            "Community support",
        ],
    },
    plus: {
        id: "plus",
        name: "Healio Plus",
        price: 149,
        yearlyPrice: 1299,
        interval: "month",
        currency: "INR",
        audience: "patient",
        tagline: "Unlimited care for you & your family",
        features: [
            "Unlimited AI consultations",
            "0s cooldown · no daily cap",
            `${PLUS_MONTHLY_CREDITS} credits/month included`,
            "PDF Wellness Summaries",
            `Family profiles (${PLUS_FAMILY_PROFILE_LIMIT})`,
            "Vikriti wellness tracking",
            "Priority doctor booking",
            "Ad-free experience",
        ],
    },
    pro: {
        id: "pro",
        name: "Healio Pro",
        price: 399,
        yearlyPrice: 3499,
        interval: "month",
        currency: "INR",
        audience: "patient",
        tagline: "Premium family health + video consults",
        features: [
            "Everything in Healio Plus",
            `${PRO_MONTHLY_CREDITS} credits/month included`,
            `Family profiles (${PRO_FAMILY_PROFILE_LIMIT})`,
            "4 video consults/month with doctors",
            "AI specialist 2nd opinion",
            "Lab report analysis (OCR + AI)",
            "10-20% off lab tests & meds",
            "Priority support (<2h response)",
            "Longitudinal health record export",
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
        dailyConsultationLimit: FREE_DAILY_CONSULTATIONS,
        cooldownSeconds: FREE_COOLDOWN_SECONDS,
        familyProfileLimit: 1,
        monthlyCredits: 0,
        creditsRolloverCap: 0,
        platformFeePercentage: DEFAULT_PLATFORM_FEE_PERCENTAGE,
        features: noFeatures,
    },
    plus: {
        monthlyConsultationLimit: UNLIMITED_USAGE,
        dailyConsultationLimit: UNLIMITED_USAGE,
        cooldownSeconds: 0,
        familyProfileLimit: PLUS_FAMILY_PROFILE_LIMIT,
        monthlyCredits: PLUS_MONTHLY_CREDITS,
        creditsRolloverCap: PLUS_ROLLOVER_CAP,
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
        dailyConsultationLimit: UNLIMITED_USAGE,
        cooldownSeconds: 0,
        familyProfileLimit: PRO_FAMILY_PROFILE_LIMIT,
        monthlyCredits: PRO_MONTHLY_CREDITS,
        creditsRolloverCap: PRO_ROLLOVER_CAP,
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

export function getCreditCost(action: CreditAction): number {
    return CREDIT_COSTS[action];
}

export function getCreditPackById(id: string): CreditPack | undefined {
    return CREDIT_PACKS.find((p) => p.id === id);
}

export function getTotalCreditsForPack(pack: CreditPack): number {
    return pack.credits + pack.bonus;
}

export function getDailyConsultationLimit(plan: unknown): number {
    return getTierRules(plan).dailyConsultationLimit;
}

export function getCooldownSeconds(plan: unknown): number {
    return getTierRules(plan).cooldownSeconds;
}

export function getMonthlyCreditGrant(plan: unknown): number {
    return getTierRules(plan).monthlyCredits;
}

export function getCreditsRolloverCap(plan: unknown): number {
    return getTierRules(plan).creditsRolloverCap;
}

/** Effective monthly price when billed yearly (rounded). */
export function getEffectiveMonthlyPrice(plan: SubscriptionPlan, cycle: BillingCycle): number {
    const p = PLANS[plan];
    if (cycle === "year" && p.yearlyPrice > 0) {
        return Math.round(p.yearlyPrice / 12);
    }
    return p.price;
}

/** Yearly savings vs paying monthly. */
export function getYearlySavings(plan: SubscriptionPlan): number {
    const p = PLANS[plan];
    if (p.price === 0 || p.yearlyPrice === 0) return 0;
    return p.price * 12 - p.yearlyPrice;
}

/** Indian number formatting (₹1,29,900 style). */
export function formatINR(amount: number): string {
    return "\u20B9" + new Intl.NumberFormat("en-IN").format(amount);
}
