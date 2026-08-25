"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Sparkles, Shield, Zap } from "lucide-react";
import { PLANS, createCheckoutSession, type SubscriptionPlan } from "@/lib/stripe/mockClient";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PlanSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    featureLocked?: string;
    targetPlan?: Exclude<SubscriptionPlan, "free">;
}

export function PlanSelectionModal({
    open,
    onOpenChange,
    featureLocked,
    targetPlan = "plus",
}: PlanSelectionModalProps) {
    const [loading, setLoading] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const router = useRouter();
    const plan = PLANS[targetPlan];
    const isPro = targetPlan === "pro";

    const handleUpgrade = async (planId: SubscriptionPlan) => {
        setLoading(planId);
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { url } = await createCheckoutSession(planId);
            setTimeout(() => {
                onOpenChange(false);
                setLoading(null);
                // In real app: router.push(url);
                toast.info("This is a mock checkout! In a real app, you would be redirected to Stripe.");
            }, 1000);
        } catch (error) {
            console.error("Upgrade failed:", error);
            setLoading(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden bg-[#EDE8DD] border border-[#C9C2B2] text-[#2A2924] shadow-none rounded-lg">
                <div className="grid md:grid-cols-2">
                    <div className="bg-[#2A2924] p-8 text-[#EDE8DD] flex flex-col justify-center relative overflow-hidden">
                        <div className="relative z-10 space-y-6">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-[#3E5641] bg-[#3E5641]/20 font-serif text-xs text-[#EDE8DD] tracking-[0.02em]">
                                {featureLocked ? `Unlock ${featureLocked}` : "Upgrade Your Health"}
                            </div>

                            <div>
                                <h2 className="font-serif text-2xl font-normal tracking-[0.02em] mb-2 leading-tight">
                                    Go Beyond Basic Care
                                </h2>
                                <p className="text-xs text-[#EDE8DD]/70 font-sans leading-relaxed">
                                    {isPro
                                        ? "Unlock doctor-grade analytics, clinical sandbox access, AI-assisted SOAP notes, and zero platform fees."
                                        : "Get unlimited access to advanced AI diagnosis, detailed health reports, and comprehensive wellness tracking for your whole family."}
                                </p>
                            </div>

                            <div className="space-y-3 font-sans text-xs border-t border-[#C9C2B2]/30 pt-4">
                                <div className="flex items-center gap-2.5">
                                    <span className="font-bold text-[#3E5641] font-mono">✓</span>
                                    <div>
                                        <p className="font-medium">{isPro ? "Practice Growth" : "Comprehensive Protection"}</p>
                                        <p className="text-[11px] text-[#EDE8DD]/60">
                                            {isPro ? "0% platform fee and Pro doctor tools" : "Family coverage up to 5 members"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="font-bold text-[#3E5641] font-mono">✓</span>
                                    <div>
                                        <p className="font-medium">{isPro ? "Clinical Intelligence" : "Faster Answers"}</p>
                                        <p className="text-[11px] text-[#EDE8DD]/60">
                                            {isPro ? "Sandbox analysis and AI-enhanced notes" : "Instant report generation and priority support"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 flex flex-col bg-[#EDE8DD]">
                        <DialogHeader>
                            <DialogTitle className="font-serif text-xl font-normal text-[#2A2924] tracking-[0.02em]">Choose your plan</DialogTitle>
                            <DialogDescription className="text-xs font-sans text-[#2A2924]/70">Cancel anytime. No questions asked.</DialogDescription>
                        </DialogHeader>

                        <div className="mt-6 space-y-4 flex-1">
                            <div className="p-5 rounded-md border border-[#3E5641] bg-[#3E5641]/5">
                                <span className="font-mono text-[9px] font-semibold text-[#3E5641] uppercase tracking-wider border border-[#3E5641]/30 px-2 py-0.5 rounded block w-max mb-2">
                                    {isPro ? "For Doctors" : "Most Popular"}
                                </span>
                                <div className="flex justify-between items-start mb-3 border-b border-[#C9C2B2] pb-3">
                                    <div>
                                        <h3 className="font-serif text-base font-normal text-[#2A2924]">{plan.name}</h3>
                                        <p className="text-xs font-sans text-[#2A2924]/70">
                                            {isPro ? "For verified practitioners" : "For health-conscious individuals"}
                                        </p>
                                    </div>
                                    <div className="text-right font-mono">
                                        <p className="text-xl font-semibold text-[#2A2924]">INR {plan.price}</p>
                                        <p className="text-xs text-[#2A2924]/60">/{plan.interval}</p>
                                    </div>
                                </div>
                                <ul className="space-y-1.5 mb-6">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-xs font-sans text-[#2A2924]">
                                            <span className="font-bold text-[#3E5641] shrink-0">✓</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className="w-full h-10 bg-[#3E5641] hover:bg-[#2F4232] text-[#EDE8DD] font-sans text-xs font-semibold rounded-md shadow-none"
                                    onClick={() => handleUpgrade(targetPlan)}
                                    disabled={loading === targetPlan}
                                >
                                    {loading === targetPlan ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        isPro ? "Upgrade to Arovia Pro" : "Start Free Trial"
                                    )}
                                </Button>
                            </div>

                            <div className="text-center pt-2">
                                <button
                                    className="text-xs font-sans text-[#2A2924]/70 hover:text-[#2A2924] underline decoration-[#C9C2B2] underline-offset-4"
                                    onClick={() => {
                                        localStorage.setItem("paywall_dismissed_at", new Date().toISOString());
                                        onOpenChange(false);
                                    }}
                                >
                                    Continue with {PLANS.free.name}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
