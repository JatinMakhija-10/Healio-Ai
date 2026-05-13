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
import { supabase } from "@/lib/supabase";
import {
    PLANS,
    CREDIT_PACKS,
    CREDIT_COSTS,
    PLUS_MONTHLY_CREDITS,
    FREE_MONTHLY_CONSULTATIONS,
    FREE_DAILY_CONSULTATIONS,
    FREE_COOLDOWN_SECONDS,
    UNLIMITED_USAGE,
    type SubscriptionPlan,
    type CreditPack,
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
            } else {
                const err = await res.json();
                alert(err.error || "Purchase failed");
            }
        } catch {
            alert("Network error — please try again");
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
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-36 rounded-xl" />
                    <Skeleton className="h-36 rounded-xl" />
                    <Skeleton className="h-36 rounded-xl" />
                </div>
                <Skeleton className="h-64 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl pb-8">
            {/* ─── Page Header ─────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Plan & Credits</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Manage your subscription, usage, and prepaid credits.
                    </p>
                </div>
                {!isPaid && (
                    <Button
                        onClick={() => setShowUpgrade(true)}
                        className="bg-teal-600 hover:bg-teal-700 gap-2"
                    >
                        <Sparkles className="h-4 w-4" />
                        Upgrade to Plus
                    </Button>
                )}
            </div>

            {/* ─── Plan Badge ──────────────────────────────────────── */}
            <Card className="border-teal-200 bg-gradient-to-br from-white to-teal-50/50">
                <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${isPaid ? "bg-teal-100" : "bg-slate-100"}`}>
                                {isPaid ? (
                                    <Crown className="h-5 w-5 text-teal-700" />
                                ) : (
                                    <Shield className="h-5 w-5 text-slate-500" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="font-bold text-lg text-slate-900">
                                        {planDetails.name}
                                    </h2>
                                    {isPaid && (
                                        <Badge className="bg-teal-100 text-teal-800 text-[10px] font-bold uppercase tracking-wider border-0">
                                            Active
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500">
                                    {isPaid
                                        ? `₹${planDetails.price}/${planDetails.interval} · ${PLUS_MONTHLY_CREDITS} credits/month included`
                                        : `${FREE_MONTHLY_CONSULTATIONS} consultations/month · ${FREE_DAILY_CONSULTATIONS}/day · ${FREE_COOLDOWN_SECONDS}s cooldown`}
                                </p>
                            </div>
                        </div>
                        {isPaid && (
                            <Badge variant="outline" className="text-xs text-slate-500">
                                Renews {new Date(summary?.resets_at ?? "").toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ─── Usage Stats Grid ────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Monthly Usage */}
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Activity className="h-4 w-4 text-teal-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Monthly Usage
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 mb-2">
                            <span className="text-3xl font-bold text-slate-900">
                                {summary?.monthly_used ?? 0}
                            </span>
                            <span className="text-sm text-slate-400">
                                / {isUnlimited ? "∞" : monthlyLimit}
                            </span>
                        </div>
                        {!isUnlimited && (
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-teal-500 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.min(100, ((summary?.monthly_used ?? 0) / monthlyLimit) * 100)}%`,
                                    }}
                                />
                            </div>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                            {isUnlimited
                                ? "Unlimited consultations"
                                : `Resets ${new Date(summary?.resets_at ?? "").toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`}
                        </p>
                    </CardContent>
                </Card>

                {/* Daily Usage */}
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="h-4 w-4 text-amber-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Today
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 mb-2">
                            <span className="text-3xl font-bold text-slate-900">
                                {summary?.daily_used ?? 0}
                            </span>
                            <span className="text-sm text-slate-400">
                                / {(summary?.daily_limit ?? FREE_DAILY_CONSULTATIONS) === UNLIMITED_USAGE ? "∞" : summary?.daily_limit ?? FREE_DAILY_CONSULTATIONS}
                            </span>
                        </div>
                        {!isPaid && (
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.min(100, ((summary?.daily_used ?? 0) / (summary?.daily_limit ?? FREE_DAILY_CONSULTATIONS)) * 100)}%`,
                                    }}
                                />
                            </div>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                            {isPaid ? "No daily limit" : "Resets at midnight"}
                        </p>
                    </CardContent>
                </Card>

                {/* Credits Balance */}
                <Card className="border-purple-200 bg-gradient-to-br from-white to-purple-50/30">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap className="h-4 w-4 text-purple-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Credits
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 mb-2">
                            <span className="text-3xl font-bold text-purple-700">
                                {summary?.credits_balance ?? 0}
                            </span>
                            <span className="text-sm text-slate-400">credits</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Use credits when free limits are exceeded
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* ─── Credit Costs Reference ──────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4 text-teal-600" />
                        Credit Costs
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: "AI Consultation", cost: CREDIT_COSTS.consultation, icon: Activity },
                            { label: "PDF Report", cost: CREDIT_COSTS.pdf_report, icon: FileText },
                            { label: "Priority Booking", cost: CREDIT_COSTS.priority_booking, icon: TrendingUp },
                            { label: "Wellness Snapshot", cost: CREDIT_COSTS.wellness_snapshot, icon: Heart },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5"
                            >
                                <item.icon className="h-4 w-4 text-slate-400 shrink-0" />
                                <div>
                                    <p className="text-xs font-medium text-slate-700">{item.label}</p>
                                    <p className="text-[11px] text-slate-400">
                                        {item.cost} credit{item.cost > 1 ? "s" : ""}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ─── Top-Up Packs ────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-teal-600" />
                            Top-Up Credit Packs
                        </CardTitle>
                        <span className="text-xs text-slate-400">Prepaid · No subscription required</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {CREDIT_PACKS.map((pack) => (
                            <div
                                key={pack.id}
                                className={`relative rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${
                                    pack.popular
                                        ? "border-teal-500 bg-teal-50/30 shadow-sm"
                                        : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                            >
                                {pack.popular && (
                                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                                        Popular
                                    </div>
                                )}
                                <div className="text-center mb-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                        {pack.label}
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {pack.credits}
                                        <span className="text-sm font-normal text-slate-400"> credits</span>
                                    </p>
                                    {pack.bonus > 0 && (
                                        <div className="flex items-center justify-center gap-1 mt-1">
                                            <Gift className="h-3 w-3 text-green-600" />
                                            <span className="text-xs font-semibold text-green-700">
                                                +{pack.bonus} bonus
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-center mb-3">
                                    <span className="text-lg font-bold text-slate-900">₹{pack.price}</span>
                                    <span className="text-xs text-slate-400 ml-1">
                                        (₹{(pack.price / (pack.credits + pack.bonus)).toFixed(1)}/credit)
                                    </span>
                                </div>
                                <Button
                                    className={`w-full h-9 text-xs font-semibold ${
                                        pack.popular
                                            ? "bg-teal-600 hover:bg-teal-700"
                                            : "bg-slate-900 hover:bg-slate-800"
                                    }`}
                                    disabled={purchasing === pack.id}
                                    onClick={() => handleTopUp(pack)}
                                >
                                    {purchasing === pack.id ? (
                                        "Processing..."
                                    ) : (
                                        <>
                                            <ArrowUpRight className="h-3 w-3 mr-1" />
                                            Buy Now
                                        </>
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ─── Healio Plus Comparison ──────────────────────────── */}
            {!isPaid && (
                <Card className="border-teal-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Crown className="h-4 w-4 text-teal-600" />
                            Healio Plus — Unlimited Everything
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Free tier */}
                            <div className="rounded-xl border border-slate-200 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Shield className="h-4 w-4 text-slate-400" />
                                    <h3 className="font-bold text-sm text-slate-700">
                                        Healio Basic (Free)
                                    </h3>
                                </div>
                                <ul className="space-y-2.5">
                                    {PLANS.free.features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-slate-500">
                                            <Check className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                    <li className="flex items-center gap-2 text-sm text-slate-400 line-through">
                                        <span className="w-3.5" />
                                        PDF Health Reports
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-slate-400 line-through">
                                        <span className="w-3.5" />
                                        Family Profiles
                                    </li>
                                </ul>
                            </div>

                            {/* Plus tier */}
                            <div className="rounded-xl border-2 border-teal-500 p-5 bg-teal-50/30 relative">
                                <div className="absolute -top-2.5 left-4 bg-teal-500 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                                    Recommended
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Crown className="h-4 w-4 text-teal-600" />
                                        <h3 className="font-bold text-sm text-teal-800">
                                            Healio Plus
                                        </h3>
                                    </div>
                                    <span className="text-lg font-bold text-teal-800">
                                        ₹{PLANS.plus.price}
                                        <span className="text-xs font-normal text-teal-600">/mo</span>
                                    </span>
                                </div>
                                <ul className="space-y-2.5 mb-5">
                                    {PLANS.plus.features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-teal-900">
                                            <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className="w-full bg-teal-600 hover:bg-teal-700 gap-2"
                                    onClick={() => setShowUpgrade(true)}
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Upgrade Now
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ─── Plus Features Grid (for subscribers) ────────────── */}
            {isPaid && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-teal-600" />
                            Your Plus Features
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { label: "Unlimited Consultations", icon: Activity, active: true },
                                { label: "PDF Health Reports", icon: FileText, active: true },
                                { label: "Family Profiles (5)", icon: Users, active: true },
                                { label: "Wellness Tracking", icon: Heart, active: true },
                                { label: "Priority Doctor Access", icon: TrendingUp, active: true },
                                { label: `${PLUS_MONTHLY_CREDITS} Credits/Month`, icon: Zap, active: true },
                            ].map((feat) => (
                                <div
                                    key={feat.label}
                                    className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-lg px-3 py-3"
                                >
                                    <feat.icon className="h-4 w-4 text-teal-600 shrink-0" />
                                    <span className="text-xs font-medium text-teal-800">
                                        {feat.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ─── Credit History ───────────────────────────────────── */}
            {history.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-500" />
                            Recent Transactions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {history.slice(0, 10).map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                tx.amount > 0
                                                    ? "bg-green-50 text-green-600"
                                                    : "bg-red-50 text-red-500"
                                            }`}
                                        >
                                            {tx.amount > 0 ? (
                                                <ArrowUpRight className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 rotate-90" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">
                                                {formatTxAction(tx.action)}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {tx.description ??
                                                    new Date(tx.created_at).toLocaleDateString("en-IN", {
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p
                                            className={`text-sm font-bold ${
                                                tx.amount > 0 ? "text-green-600" : "text-red-500"
                                            }`}
                                        >
                                            {tx.amount > 0 ? "+" : ""}
                                            {tx.amount}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
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
