"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Crown,
    Sparkles,
    Zap,
    ArrowUpRight,
    TrendingUp,
    Clock,
    CreditCard,
    Gift,
    Check,
    ChevronRight,
    Activity,
    FileText,
    Users,
    Heart,
    Shield,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
    PLANS,
    CREDIT_PACKS,
    CREDIT_COSTS,
    FREE_MONTHLY_CONSULTATIONS,
    FREE_DAILY_CONSULTATIONS,
    FREE_COOLDOWN_SECONDS,
    UNLIMITED_USAGE,
    formatINR,
    getEffectiveMonthlyPrice,
    getYearlySavings,
    getMonthlyCreditGrant,
    type SubscriptionPlan,
    type CreditPack,
    type BillingCycle,
} from "@/lib/subscription/plans";
import { PlanSelectionModal } from "@/components/subscription/PlanSelectionModal";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UsageSummary {
    plan: string;
    monthly_used: number;
    monthly_limit: number;
    daily_used: number;
    daily_limit: number;
    credits_balance: number;
    resets_at: string;
    last_chat_at: string | null;
}

interface CreditTx {
    id: string;
    amount: number;
    balance_after: number;
    action: string;
    description: string | null;
    created_at: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BillingPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<UsageSummary | null>(null);
    const [history, setHistory] = useState<CreditTx[]>([]);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [billingCycle, setBillingCycle] = useState<BillingCycle>("month");

    const fetchBilling = useCallback(async () => {
        if (!user) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch("/api/billing", {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });

            if (!res.ok) return;
            const data = await res.json();
            setSummary(data.summary);
            setHistory(data.history ?? []);
        } catch (err) {
            console.error("[billing] fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchBilling();
    }, [fetchBilling]);

    const handleTopUp = async (pack: CreditPack) => {
        if (!user) return;
        setPurchasing(pack.id);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch("/api/billing", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ action: "top_up", pack_id: pack.id }),
            });

            if (res.ok) {
                await fetchBilling();
                toast.success("Credits added successfully!");
            } else {
                const err = await res.json();
                toast.error(err.error || "Purchase failed");
            }
        } catch {
            toast.error("Network error — please try again");
        } finally {
            setPurchasing(null);
        }
    };

    const plan = (summary?.plan ?? "free") as SubscriptionPlan;
    const planDetails = PLANS[plan];
    const isPaid = plan !== "free";
    const monthlyLimit = summary?.monthly_limit ?? FREE_MONTHLY_CONSULTATIONS;
    const isUnlimited = monthlyLimit === UNLIMITED_USAGE;

    if (loading) {
        return (
            <div className="space-y-6 max-w-4xl">
                <Skeleton className="h-10 w-64 bg-[#C9C2B2]/30" />
                <Skeleton className="h-36 rounded-lg bg-[#C9C2B2]/30" />
                <Skeleton className="h-64 rounded-lg bg-[#C9C2B2]/30" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl pb-8 text-[#2A2924]">
            {/* ─── Page Header ─────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-normal tracking-[0.02em] text-[#2A2924]">
                        Plan & Credits Ledger
                    </h1>
                    <p className="text-sm text-[#2A2924]/70 mt-0.5 font-sans">
                        Manage your subscription, usage quotas, and prepaid remedy credits.
                    </p>
                </div>
                {!isPaid && (
                    <Button
                        onClick={() => setShowUpgrade(true)}
                        className="bg-[#3E5641] hover:bg-[#2F4232] text-[#EDE8DD] border border-[#3E5641] font-sans text-xs font-semibold px-4 h-9 shadow-none rounded-md"
                    >
                        Upgrade to Plus
                    </Button>
                )}
            </div>

            {/* ─── Plan Badge Card ─────────────────────────────────── */}
            <div className="bg-[#EDE8DD] border border-[#C9C2B2] rounded-lg p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-[#3E5641]/10 border border-[#3E5641]/20 flex items-center justify-center font-serif text-sm text-[#3E5641] font-medium">
                            {isPaid ? "P" : "F"}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-serif text-lg font-normal text-[#2A2924]">
                                    {planDetails.name}
                                </h2>
                                {isPaid && (
                                    <span className="bg-[#3E5641] text-[#EDE8DD] text-[10px] font-mono font-medium px-2 py-0.5 rounded uppercase tracking-wider">
                                        Active
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-[#2A2924]/70 font-sans mt-0.5">
                                {isPaid
                                    ? `${formatINR(planDetails.price)}/${planDetails.interval} · ${getMonthlyCreditGrant(plan)} credits/month included`
                                    : `${FREE_MONTHLY_CONSULTATIONS} consultations/month · ${FREE_DAILY_CONSULTATIONS}/day · ${FREE_COOLDOWN_SECONDS}s cooldown`}
                            </p>
                            <p className="mt-1 text-[11px] text-[#2A2924]/60 font-sans">
                                {isPaid
                                    ? "Unlimited basic AI consultations. Advanced features use 1–5 credits each from your monthly pool."
                                    : "Basic consultations use free monthly quota. Premium add-ons require credits."}
                            </p>
                        </div>
                    </div>
                    {isPaid && (
                        <span className="text-xs font-mono text-[#2A2924]/60 bg-[#2A2924]/5 px-2.5 py-1 rounded border border-[#C9C2B2]">
                            Renews {new Date(summary?.resets_at ?? "").toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                    )}
                </div>
            </div>

            {/* ─── COMPONENT 2: Usage Stats Strip ─────────────────── */}
            <div className="bg-[#EDE8DD] border border-[#C9C2B2] rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#C9C2B2]">
                {/* Monthly Usage */}
                <div className="p-5">
                    <span className="font-serif text-xs font-normal text-[#2A2924]/70 tracking-[0.02em] block mb-2">
                        monthly usage
                    </span>
                    <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="font-mono text-3xl font-semibold text-[#2A2924]">
                            {summary?.monthly_used ?? 0}
                        </span>
                        <span className="font-mono text-sm text-[#2A2924]/60">
                            / {isUnlimited ? "∞" : monthlyLimit}
                        </span>
                    </div>
                    <p className="font-sans text-xs text-[#2A2924]/60 mt-1">
                        {isUnlimited
                            ? "Unlimited consultations"
                            : `Resets ${new Date(summary?.resets_at ?? "").toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`}
                    </p>
                </div>

                {/* Daily Usage */}
                <div className="p-5">
                    <span className="font-serif text-xs font-normal text-[#2A2924]/70 tracking-[0.02em] block mb-2">
                        today
                    </span>
                    <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="font-mono text-3xl font-semibold text-[#2A2924]">
                            {summary?.daily_used ?? 0}
                        </span>
                        <span className="font-mono text-sm text-[#2A2924]/60">
                            / {(summary?.daily_limit ?? FREE_DAILY_CONSULTATIONS) === UNLIMITED_USAGE ? "∞" : summary?.daily_limit ?? FREE_DAILY_CONSULTATIONS}
                        </span>
                    </div>
                    <p className="font-sans text-xs text-[#2A2924]/60 mt-1">
                        {isPaid ? "No daily limit" : "Resets at midnight"}
                    </p>
                </div>

                {/* Credits Balance */}
                <div className="p-5">
                    <span className="font-serif text-xs font-normal text-[#2A2924]/70 tracking-[0.02em] block mb-2">
                        credits
                    </span>
                    <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="font-mono text-3xl font-semibold text-[#C68A2E]">
                            {summary?.credits_balance ?? 0}
                        </span>
                        <span className="font-sans text-xs text-[#2A2924]/60">credits</span>
                    </div>
                    <p className="font-sans text-xs text-[#2A2924]/60 mt-1">
                        Use credits for premium extra features
                    </p>
                </div>
            </div>

            {/* ─── COMPONENT 1: Premium Feature Credit Costs ─────────── */}
            <Card className="bg-[#EDE8DD] border border-[#C9C2B2] rounded-lg shadow-none">
                <CardHeader className="pb-3 border-b border-[#C9C2B2]">
                    <CardTitle className="font-serif text-sm font-normal text-[#2A2924] tracking-[0.02em]">
                        premium feature credit costs
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="space-y-2.5">
                        {[
                            { label: "Specialist AI consultation (add-on)", cost: CREDIT_COSTS.consultation },
                            { label: "Wellness snapshot", cost: CREDIT_COSTS.wellness_snapshot },
                            { label: "Family consult", cost: CREDIT_COSTS.family_consult },
                            { label: "PDF wellness summary", cost: CREDIT_COSTS.pdf_report },
                            { label: "Priority booking", cost: CREDIT_COSTS.priority_booking },
                            { label: "Specialist 2nd opinion", cost: CREDIT_COSTS.specialist_opinion },
                            { label: "Lab report analysis", cost: CREDIT_COSTS.lab_report_analysis },
                            { label: "Video consult (Doctor)", cost: CREDIT_COSTS.video_consult },
                        ].map((item) => (
                            <div key={item.label} className="flex items-baseline text-xs text-[#2A2924]">
                                <span className="font-sans font-medium shrink-0">{item.label}</span>
                                <span className="flex-1 border-b border-dotted border-[#C9C2B2] mx-2 self-baseline relative top-[-4px]" />
                                <span className="font-mono font-semibold text-[#2A2924] shrink-0">
                                    {item.cost} {item.cost === 1 ? "credit" : "credits"}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ─── Top-Up Packs ────────────────────────────────────── */}
            <Card className="bg-[#EDE8DD] border border-[#C9C2B2] rounded-lg shadow-none">
                <CardHeader className="pb-3 border-b border-[#C9C2B2]">
                    <div className="flex items-center justify-between">
                        <CardTitle className="font-serif text-sm font-normal text-[#2A2924] tracking-[0.02em]">
                            top-up credit packs
                        </CardTitle>
                        <span className="text-xs text-[#2A2924]/60 font-sans">Prepaid · No subscription required</span>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {CREDIT_PACKS.map((pack) => (
                            <div
                                key={pack.id}
                                className={`rounded-md border p-4 transition-colors ${
                                    pack.popular
                                        ? "border-[#3E5641] bg-[#3E5641]/5"
                                        : "border-[#C9C2B2] bg-[#EDE8DD]"
                                }`}
                            >
                                {pack.popular && (
                                    <div className="text-center mb-1">
                                        <span className="font-mono text-[9px] font-semibold text-[#3E5641] uppercase tracking-wider border border-[#3E5641]/30 px-2 py-0.5 rounded">
                                            Popular
                                        </span>
                                    </div>
                                )}
                                <div className="text-center mb-3 mt-1">
                                    <p className="text-[11px] font-serif font-normal text-[#2A2924]/70 tracking-[0.02em] mb-1">
                                        {pack.label}
                                    </p>
                                    <p className="text-2xl font-mono font-semibold text-[#C68A2E]">
                                        {pack.credits}
                                        <span className="text-xs font-sans text-[#2A2924]/60 font-normal"> credits</span>
                                    </p>
                                    {pack.bonus > 0 && (
                                        <p className="text-xs font-sans font-medium text-[#3E5641] mt-0.5">
                                            +{pack.bonus} bonus
                                        </p>
                                    )}
                                </div>
                                <div className="text-center mb-3 border-t border-b border-[#C9C2B2]/60 py-2">
                                    <span className="text-base font-mono font-semibold text-[#2A2924]">{formatINR(pack.price)}</span>
                                    <span className="text-[11px] font-mono text-[#2A2924]/60 block mt-0.5">
                                        ₹{(pack.price / (pack.credits + pack.bonus)).toFixed(2)} / credit
                                    </span>
                                </div>
                                <Button
                                    className={`w-full h-8 text-xs font-sans font-semibold rounded-md shadow-none ${
                                        pack.popular
                                            ? "bg-[#3E5641] hover:bg-[#2F4232] text-[#EDE8DD]"
                                            : "bg-[#2A2924] hover:bg-[#1C1C1E] text-[#EDE8DD]"
                                    }`}
                                    disabled={purchasing === pack.id}
                                    onClick={() => handleTopUp(pack)}
                                >
                                    {purchasing === pack.id ? "Processing..." : "Buy Now"}
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ─── Three-Tier Comparison (Free / Plus / Pro) ──────────────── */}
            {!isPaid && (
                <Card className="bg-[#EDE8DD] border border-[#C9C2B2] rounded-lg shadow-none">
                    <CardHeader className="pb-3 border-b border-[#C9C2B2]">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <CardTitle className="font-serif text-sm font-normal text-[#2A2924] tracking-[0.02em]">
                                choose your plan
                            </CardTitle>
                            {/* Monthly / Yearly toggle */}
                            <div className="inline-flex items-center border border-[#C9C2B2] rounded p-0.5 text-xs font-sans">
                                <button
                                    onClick={() => setBillingCycle("month")}
                                    className={`px-3 py-1 rounded transition-colors ${
                                        billingCycle === "month" ? "bg-[#2A2924] text-[#EDE8DD]" : "text-[#2A2924]/70"
                                    }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBillingCycle("year")}
                                    className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                                        billingCycle === "year" ? "bg-[#2A2924] text-[#EDE8DD]" : "text-[#2A2924]/70"
                                    }`}
                                >
                                    Yearly
                                    <span className="font-mono text-[10px] text-[#C68A2E]">Save 27%</span>
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid md:grid-cols-3 gap-4">
                            {(["free", "plus", "pro"] as const).map((tierId) => {
                                const t = PLANS[tierId];
                                const isFree = tierId === "free";
                                const isPlus = tierId === "plus";
                                const monthly = getEffectiveMonthlyPrice(tierId, billingCycle);
                                const savings = getYearlySavings(tierId);
                                return (
                                    <div
                                        key={tierId}
                                        className={`rounded-md border p-5 transition-colors ${
                                            isPlus
                                                ? "border-[#3E5641] bg-[#3E5641]/5"
                                                : "border-[#C9C2B2] bg-[#EDE8DD]"
                                        }`}
                                    >
                                        {isPlus && (
                                            <span className="font-mono text-[9px] font-semibold text-[#3E5641] uppercase tracking-wider border border-[#3E5641]/30 px-2 py-0.5 rounded block w-max mb-2">
                                                Recommended
                                            </span>
                                        )}
                                        <h3 className="font-serif text-base font-normal text-[#2A2924]">
                                            {t.name}
                                        </h3>
                                        <p className="text-xs text-[#2A2924]/70 mt-1 mb-3 min-h-[2.5em] font-sans">{t.tagline}</p>
                                        <div className="mb-4 border-t border-b border-[#C9C2B2]/60 py-2">
                                            <span className="font-mono text-2xl font-semibold text-[#2A2924]">
                                                {isFree ? "Free" : formatINR(monthly)}
                                            </span>
                                            {!isFree && (
                                                <span className="font-mono text-xs text-[#2A2924]/60 ml-1">/mo</span>
                                            )}
                                            {!isFree && billingCycle === "year" && (
                                                <p className="font-mono text-[11px] text-[#3E5641] mt-0.5">
                                                    Billed {formatINR(t.yearlyPrice)}/yr · save {formatINR(savings)}
                                                </p>
                                            )}
                                        </div>
                                        {/* COMPONENT 3 checklist format */}
                                        <ul className="space-y-2 mb-5">
                                            {t.features.map((f, i) => (
                                                <li key={i} className="flex items-start text-xs text-[#2A2924] py-1 border-b border-[#C9C2B2]/40 last:border-0">
                                                    <span className="font-bold text-[#3E5641] mr-2 shrink-0">✓</span>
                                                    <span className="font-sans">{f}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <Button
                                            disabled={isFree}
                                            className={`w-full h-9 text-xs font-sans font-semibold rounded-md shadow-none ${
                                                isPlus
                                                    ? "bg-[#3E5641] hover:bg-[#2F4232] text-[#EDE8DD]"
                                                    : isFree
                                                        ? "bg-[#2A2924]/10 text-[#2A2924]/40"
                                                        : "bg-[#2A2924] hover:bg-[#1C1C1E] text-[#EDE8DD]"
                                            }`}
                                            onClick={() => !isFree && setShowUpgrade(true)}
                                        >
                                            {isFree ? "Current Plan" : `Upgrade to ${t.name.replace("Arovia ", "")}`}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ─── COMPONENT 3: Plus Features Grid (for subscribers) ─── */}
            {isPaid && (
                <Card className="bg-[#EDE8DD] border border-[#C9C2B2] rounded-lg shadow-none">
                    <CardHeader className="pb-3 border-b border-[#C9C2B2]">
                        <CardTitle className="font-serif text-sm font-normal text-[#2A2924] tracking-[0.02em]">
                            Your {planDetails.name} features
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                            {planDetails.features.map((feat, index) => (
                                <div
                                    key={feat}
                                    className={`flex items-center text-xs text-[#2A2924] py-2 ${
                                        index >= 2 ? "border-t border-[#C9C2B2]/60" : "border-t md:border-t-0 border-[#C9C2B2]/60"
                                    }`}
                                >
                                    <span className="font-bold text-[#3E5641] mr-2 shrink-0">✓</span>
                                    <span className="font-sans">{feat}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ─── Credit History ───────────────────────────────────── */}
            {history.length > 0 && (
                <Card className="bg-[#EDE8DD] border border-[#C9C2B2] rounded-lg shadow-none">
                    <CardHeader className="pb-3 border-b border-[#C9C2B2]">
                        <CardTitle className="font-serif text-sm font-normal text-[#2A2924] tracking-[0.02em]">
                            recent transactions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                        <div className="divide-y divide-[#C9C2B2]/60">
                            {history.slice(0, 10).map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between py-2.5 text-xs font-sans"
                                >
                                    <div>
                                        <p className="font-medium text-[#2A2924]">
                                            {formatTxAction(tx.action)}
                                        </p>
                                        <p className="text-[11px] text-[#2A2924]/60 font-mono mt-0.5">
                                            {tx.description ??
                                                new Date(tx.created_at).toLocaleDateString("en-IN", {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                        </p>
                                    </div>
                                    <div className="text-right font-mono">
                                        <p
                                            className={`font-semibold ${
                                                tx.amount > 0 ? "text-[#3E5641]" : "text-[#2A2924]"
                                            }`}
                                        >
                                            {tx.amount > 0 ? "+" : ""}
                                            {tx.amount}
                                        </p>
                                        <p className="text-[10px] text-[#2A2924]/60">
                                            Bal: {tx.balance_after}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ─── Upgrade Modal ────────────────────────────────────── */}
            <PlanSelectionModal
                open={showUpgrade}
                onOpenChange={setShowUpgrade}
                targetPlan="plus"
            />
        </div>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTxAction(action: string): string {
    const map: Record<string, string> = {
        monthly_grant: "Monthly Credit Grant",
        top_up: "Credit Top-Up",
        consultation: "AI Consultation",
        pdf_report: "PDF Report",
        priority_booking: "Priority Booking",
        wellness_snapshot: "Wellness Snapshot",
        refund: "Refund",
        admin_adjust: "Admin Adjustment",
    };
    return map[action] ?? action;
}
