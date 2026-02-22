"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Zap,
    Brain,
    Languages,
    Activity,
    WrenchIcon,
    RefreshCw,
    ArrowLeft,
    FlaskConicalIcon,
    AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface FeatureFlag {
    key: string;
    label: string;
    description: string;
    icon: typeof Zap;
    category: "beta" | "maintenance" | "experimental";
    enabled: boolean;
    dangerZone?: boolean;
}

const FLAG_DEFINITIONS: Omit<FeatureFlag, "enabled">[] = [
    {
        key: "flag_ai_diagnosis_v2",
        label: "AI Diagnosis v2",
        description: "Next-gen AI model with improved accuracy for symptom analysis and diagnosis recommendations.",
        icon: Brain,
        category: "beta",
    },
    {
        key: "flag_realtime_translation",
        label: "Real-time Translations",
        description: "Live AI-powered translation during consultations to bridge language barriers between patients and doctors.",
        icon: Languages,
        category: "beta",
    },
    {
        key: "flag_advanced_analytics",
        label: "Advanced Analytics",
        description: "Enhanced analytics dashboard with epidemic prediction modeling and population health insights.",
        icon: Activity,
        category: "experimental",
    },
    {
        key: "flag_ai_clinical_notes",
        label: "AI Clinical Notes",
        description: "Automatically draft SOAP-format clinical notes after each consultation using AI transcription.",
        icon: FlaskConicalIcon,
        category: "experimental",
    },
    {
        key: "flag_maintenance_mode",
        label: "Maintenance Mode",
        description: "Show a maintenance banner to all users. New appointments and signups will be disabled.",
        icon: WrenchIcon,
        category: "maintenance",
        dangerZone: true,
    },
];

const categoryConfig = {
    beta: { label: "Beta", className: "bg-blue-100 text-blue-700" },
    experimental: { label: "Experimental", className: "bg-purple-100 text-purple-700" },
    maintenance: { label: "System", className: "bg-red-100 text-red-700" },
};

export default function FeatureFlagsPage() {
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);
    const [flags, setFlags] = useState<FeatureFlag[]>(
        FLAG_DEFINITIONS.map((f) => ({ ...f, enabled: false }))
    );

    const loadFlags = useCallback(async () => {
        try {
            setLoading(true);
            const keys = FLAG_DEFINITIONS.map((f) => f.key);

            const { data, error } = await supabase
                .from("platform_settings")
                .select("key, value")
                .in("key", keys);

            if (error) throw error;

            const dbMap: Record<string, boolean> = {};
            (data || []).forEach((row) => {
                dbMap[row.key] = row.value?.enabled ?? false;
            });

            setFlags(FLAG_DEFINITIONS.map((f) => ({ ...f, enabled: dbMap[f.key] ?? false })));
        } catch (error) {
            console.error("Error loading feature flags:", error);
            toast.error("Failed to load feature flags");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFlags();
    }, [loadFlags]);

    const handleToggle = async (flag: FeatureFlag) => {
        const newValue = !flag.enabled;

        // Confirm dangerous toggles
        if (flag.dangerZone && newValue) {
            const confirmed = window.confirm(
                `⚠️ Are you sure you want to enable "${flag.label}"? This will affect all users.`
            );
            if (!confirmed) return;
        }

        try {
            setToggling(flag.key);
            // Optimistic update
            setFlags((prev) =>
                prev.map((f) => (f.key === flag.key ? { ...f, enabled: newValue } : f))
            );

            const { error } = await supabase.from("platform_settings").upsert(
                { key: flag.key, value: { enabled: newValue }, updated_at: new Date().toISOString() },
                { onConflict: "key" }
            );

            if (error) {
                // Rollback on error
                setFlags((prev) =>
                    prev.map((f) => (f.key === flag.key ? { ...f, enabled: flag.enabled } : f))
                );
                throw error;
            }

            toast.success(`"${flag.label}" ${newValue ? "enabled" : "disabled"}`);
        } catch (error) {
            console.error("Error toggling feature flag:", error);
            toast.error(`Failed to update "${flag.label}"`);
        } finally {
            setToggling(null);
        }
    };

    const enabledCount = flags.filter((f) => f.enabled).length;
    const betaFlags = flags.filter((f) => f.category === "beta");
    const experimentalFlags = flags.filter((f) => f.category === "experimental");
    const systemFlags = flags.filter((f) => f.category === "maintenance");

    const renderFlagCard = (flag: FeatureFlag) => {
        const IconComponent = flag.icon;
        const catConf = categoryConfig[flag.category];

        return (
            <div
                key={flag.key}
                className={`flex items-start gap-4 p-4 rounded-xl transition-all ${flag.enabled
                    ? "bg-purple-50 border border-purple-200"
                    : "bg-white border border-slate-200"
                    } ${flag.dangerZone && flag.enabled ? "bg-red-50 border-red-200" : ""}`}
            >
                <div className={`p-2.5 rounded-lg ${flag.enabled ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500"} ${flag.dangerZone && flag.enabled ? "bg-red-100 text-red-700" : ""}`}>
                    <IconComponent className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">{flag.label}</span>
                        <Badge variant="outline" className={`text-xs ${catConf.className}`}>
                            {catConf.label}
                        </Badge>
                        {flag.dangerZone && (
                            <Badge variant="outline" className="text-xs bg-red-100 text-red-700">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                High Impact
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{flag.description}</p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                    {toggling === flag.key ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                    ) : (
                        <Switch
                            id={flag.key}
                            checked={flag.enabled}
                            onCheckedChange={() => handleToggle(flag)}
                            disabled={loading}
                            className="data-[state=checked]:bg-purple-600"
                        />
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Zap className="h-6 w-6 text-purple-600" />
                        Feature Flags
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Manage platform features. Changes persist in the database instantly.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">{enabledCount}</div>
                        <div className="text-xs text-slate-500">active features</div>
                    </div>
                    <Button variant="outline" size="icon" onClick={loadFlags} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Beta Features */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-700">Beta</Badge>
                        Beta Features
                    </CardTitle>
                    <CardDescription>
                        Tested features nearing production readiness. Safe to enable.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loading
                        ? [1, 2].map((i) => <Skeleton key={i} className="h-20" />)
                        : betaFlags.map(renderFlagCard)}
                </CardContent>
            </Card>

            {/* Experimental Features */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Badge variant="outline" className="bg-purple-100 text-purple-700">Experimental</Badge>
                        Experimental Features
                    </CardTitle>
                    <CardDescription>
                        Early-stage features under active development. May have known issues.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loading
                        ? [1, 2].map((i) => <Skeleton key={i} className="h-20" />)
                        : experimentalFlags.map(renderFlagCard)}
                </CardContent>
            </Card>

            {/* System / Maintenance */}
            <Card className="border-red-200 bg-red-50/30">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        System Controls
                    </CardTitle>
                    <CardDescription>
                        High-impact switches that affect all users globally. Use with caution.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loading
                        ? [1].map((i) => <Skeleton key={i} className="h-20" />)
                        : systemFlags.map(renderFlagCard)}
                </CardContent>
            </Card>
        </div>
    );
}
