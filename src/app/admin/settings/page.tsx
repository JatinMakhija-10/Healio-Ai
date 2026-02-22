"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import {
    Settings,
    Save,
    RefreshCw,
    Mail,
    Phone,
    MapPin,
    Percent,
    Globe,
    ShieldCheck,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PlatformSettings {
    support_email: string;
    contact_phone: string;
    address: string;
    commission_rate: number;
    platform_name: string;
    help_url: string;
}

const defaultSettings: PlatformSettings = {
    support_email: "support@healio.ai",
    contact_phone: "+91-",
    address: "",
    commission_rate: 20,
    platform_name: "Healio.AI",
    help_url: "https://healio.ai/help",
};

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
    const [original, setOriginal] = useState<PlatformSettings>(defaultSettings);

    const hasChanges = JSON.stringify(settings) !== JSON.stringify(original);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("platform_settings")
                .select("key, value");

            if (error) throw error;

            const map: Record<string, any> = {};
            (data || []).forEach((row) => {
                map[row.key] = row.value;
            });

            const loaded: PlatformSettings = {
                support_email: map.support_email?.email || defaultSettings.support_email,
                contact_phone: map.contact_phone?.phone || defaultSettings.contact_phone,
                address: map.address?.text || defaultSettings.address,
                commission_rate: map.commission_rate?.percentage ?? defaultSettings.commission_rate,
                platform_name: map.platform_name?.name || defaultSettings.platform_name,
                help_url: map.help_url?.url || defaultSettings.help_url,
            };

            setSettings(loaded);
            setOriginal(loaded);
        } catch (error) {
            console.error("Error loading settings:", error);
            toast.error("Failed to load settings – showing defaults");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const upsertSetting = async (key: string, value: object) => {
        const { error } = await supabase
            .from("platform_settings")
            .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
        if (error) throw error;
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await Promise.all([
                upsertSetting("support_email", { email: settings.support_email }),
                upsertSetting("contact_phone", { phone: settings.contact_phone }),
                upsertSetting("address", { text: settings.address }),
                upsertSetting("commission_rate", { percentage: Number(settings.commission_rate) }),
                upsertSetting("platform_name", { name: settings.platform_name }),
                upsertSetting("help_url", { url: settings.help_url }),
            ]);
            setOriginal({ ...settings });
            toast.success("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings. Check your permissions.");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setSettings(original);
        toast.info("Changes discarded");
    };

    const update = (field: keyof PlatformSettings, value: string | number) =>
        setSettings((prev) => ({ ...prev, [field]: value }));

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Settings className="h-6 w-6 text-purple-600" />
                        Platform Settings
                    </h1>
                    <p className="text-slate-500 mt-1">Configure global platform settings stored in the database.</p>
                </div>
                <div className="flex gap-2">
                    {hasChanges && (
                        <Button variant="outline" onClick={handleReset} disabled={saving}>
                            Discard
                        </Button>
                    )}
                    <Button
                        className="bg-purple-600 hover:bg-purple-700 gap-2"
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                    >
                        {saving ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            {/* Contact Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Globe className="h-5 w-5 text-purple-600" />
                        Contact Information
                    </CardTitle>
                    <CardDescription>
                        Displayed in emails, invoices, and support pages.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-2">
                                <Label className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    Support Email
                                </Label>
                                <Input
                                    type="email"
                                    value={settings.support_email}
                                    onChange={(e) => update("support_email", e.target.value)}
                                    placeholder="support@healio.ai"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                    Contact Phone
                                </Label>
                                <Input
                                    type="tel"
                                    value={settings.contact_phone}
                                    onChange={(e) => update("contact_phone", e.target.value)}
                                    placeholder="+91-XXXXXXXXXX"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-slate-400" />
                                    Registered Address
                                </Label>
                                <Input
                                    value={settings.address}
                                    onChange={(e) => update("address", e.target.value)}
                                    placeholder="123 Health Street, Mumbai, India"
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Platform Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-teal-600" />
                        Platform Configuration
                    </CardTitle>
                    <CardDescription>
                        Core financial and branding settings.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-2">
                                <Label className="flex items-center gap-2">
                                    <Percent className="h-4 w-4 text-slate-400" />
                                    Platform Commission Rate (%)
                                </Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        value={settings.commission_rate}
                                        onChange={(e) => update("commission_rate", parseFloat(e.target.value) || 0)}
                                        className="w-32"
                                    />
                                    <p className="text-sm text-slate-500">
                                        Doctors receive <strong>{(100 - settings.commission_rate).toFixed(1)}%</strong> of each consultation fee.
                                    </p>
                                </div>
                            </div>
                            <hr className="border-slate-200" />
                            <div className="grid gap-2">
                                <Label className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-slate-400" />
                                    Platform Name
                                </Label>
                                <Input
                                    value={settings.platform_name}
                                    onChange={(e) => update("platform_name", e.target.value)}
                                    placeholder="Healio.AI"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="flex items-center gap-2">
                                    <Settings className="h-4 w-4 text-slate-400" />
                                    Help Center URL
                                </Label>
                                <Input
                                    type="url"
                                    value={settings.help_url}
                                    onChange={(e) => update("help_url", e.target.value)}
                                    placeholder="https://healio.ai/help"
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Save Button (bottom) */}
            {hasChanges && (
                <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={handleReset} disabled={saving}>
                        Discard Changes
                    </Button>
                    <Button
                        className="bg-purple-600 hover:bg-purple-700 gap-2"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            )}
        </div>
    );
}
