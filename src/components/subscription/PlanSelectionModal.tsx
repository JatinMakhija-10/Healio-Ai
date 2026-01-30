"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Sparkles, Shield, Zap } from "lucide-react";
import { PLANS, createCheckoutSession } from "@/lib/stripe/mockClient";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PlanSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    featureLocked?: string; // Optional: name of the feature user tried to access
}

export function PlanSelectionModal({ open, onOpenChange, featureLocked }: PlanSelectionModalProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const router = useRouter();

    const handleUpgrade = async (planId: string) => {
        setLoading(planId);
        try {
            const { url } = await createCheckoutSession(planId);
            // Simulate redirect delay
            setTimeout(() => {
                onOpenChange(false);
                setLoading(null);
                // In real app: router.push(url);
                alert("This is a mock checkout! In a real app, you would be redirected to Stripe.");
            }, 1000);
        } catch (error) {
            console.error("Upgrade failed:", error);
            setLoading(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50">
                <div className="grid md:grid-cols-2">
                    {/* Left: Value Prop */}
                    <div className="bg-slate-900 p-8 text-white flex flex-col justify-center relative overflow-hidden">
                        {/* Background blobs */}
                        <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-[-20%] left-[-20%] w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

                        <div className="relative z-10 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
                                <Sparkles className="h-3 w-3" />
                                {featureLocked ? `Unlock ${featureLocked}` : "Upgrade Your Health"}
                            </div>

                            <div>
                                <h2 className="text-3xl font-bold tracking-tight mb-2">
                                    Go Beyond <br />
                                    <span className="text-teal-400">Basic Care</span>
                                </h2>
                                <p className="text-slate-400 leading-relaxed">
                                    Get unlimited access to advanced AI diagnosis, detailed health reports, and comprehensive wellness tracking for your whole family.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                        <Shield className="h-5 w-5 text-teal-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Comprehensive Protection</p>
                                        <p className="text-xs text-slate-400">Family coverage up to 5 members</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                        <Zap className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Faster Answers</p>
                                        <p className="text-xs text-slate-400">Instant report generation & priority support</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Plans */}
                    <div className="p-8 flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="text-xl text-slate-900">Choose your plan</DialogTitle>
                            <DialogDescription>Cancel anytime. No questions asked.</DialogDescription>
                        </DialogHeader>

                        <div className="mt-6 space-y-4 flex-1">
                            {/* Plus Plan (Highlighted) */}
                            <div className="relative p-5 rounded-xl border-2 border-teal-500 bg-white shadow-lg shadow-teal-500/10">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    Most Popular
                                </div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">{PLANS.plus.name}</h3>
                                        <p className="text-xs text-slate-500">For health-conscious individuals</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-slate-900">${PLANS.plus.price}</p>
                                        <p className="text-xs text-slate-500">/{PLANS.plus.interval}</p>
                                    </div>
                                </div>
                                <ul className="space-y-2 mb-6">
                                    {PLANS.plus.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                            <Check className="h-4 w-4 text-teal-500 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className="w-full bg-teal-600 hover:bg-teal-700 h-11"
                                    onClick={() => handleUpgrade('plus')}
                                    disabled={loading === 'plus'}
                                >
                                    {loading === 'plus' ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Start 14-Day Free Trial"
                                    )}
                                </Button>
                            </div>

                            {/* Free Plan (Secondary) */}
                            <div className="text-center pt-2">
                                <button
                                    className="text-sm text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-4"
                                    onClick={() => onOpenChange(false)}
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
