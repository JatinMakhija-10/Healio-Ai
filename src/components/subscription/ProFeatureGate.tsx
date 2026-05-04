"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanSelectionModal } from "@/components/subscription/PlanSelectionModal";
import { getSubscriptionStatus } from "@/lib/stripe/mockClient";
import { hasFeature, type SubscriptionFeature } from "@/lib/subscription/plans";

interface ProFeatureGateProps {
    feature: SubscriptionFeature;
    featureName: string;
    description: string;
    children: ReactNode;
}

export function ProFeatureGate({
    feature,
    featureName,
    description,
    children,
}: ProFeatureGateProps) {
    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
        let mounted = true;
        getSubscriptionStatus()
            .then((status) => {
                if (mounted) setAllowed(hasFeature(status, feature));
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [feature]);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-80 rounded-xl" />
            </div>
        );
    }

    if (allowed) {
        return <>{children}</>;
    }

    return (
        <>
            <div className="min-h-[60vh] flex items-center justify-center">
                <Card className="max-w-xl w-full border-purple-200 bg-white shadow-sm">
                    <CardContent className="p-8 text-center space-y-5">
                        <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                            <Lock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-purple-700 mb-2">
                                Healio Pro
                            </p>
                            <h1 className="text-2xl font-bold text-slate-900">{featureName}</h1>
                            <p className="text-slate-500 mt-2 leading-relaxed">{description}</p>
                        </div>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700 gap-2"
                            onClick={() => setShowUpgradeModal(true)}
                        >
                            <Sparkles className="h-4 w-4" />
                            Upgrade to Healio Pro
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <PlanSelectionModal
                open={showUpgradeModal}
                onOpenChange={setShowUpgradeModal}
                featureLocked={featureName}
                targetPlan="pro"
            />
        </>
    );
}
