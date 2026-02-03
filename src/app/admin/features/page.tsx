"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Zap, Lock } from "lucide-react";

export default function FeatureFlagsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                    <Zap className="h-8 w-8 text-purple-600" />
                    Feature Flags
                </h1>
                <p className="text-slate-500">
                    Manage system-wide features and experimental capabilities.
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Beta Features</CardTitle>
                        <CardDescription>Enable experimental features for testing.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <div className="font-medium text-slate-900">AI Diagnosis v2</div>
                                <div className="text-sm text-slate-500">Enable the new LLM-based diagnosis engine (Experimental)</div>
                            </div>
                            <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <div className="font-medium text-slate-900">Real-time Translations</div>
                                <div className="text-sm text-slate-500">Auto-translate patient messages in chat</div>
                            </div>
                            <Switch />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>System Maintenance</CardTitle>
                        <CardDescription>Control system availability and maintenance modes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <div className="font-medium text-slate-900">Maintenance Mode</div>
                                <div className="text-sm text-slate-500">Disable all non-admin access to the platform</div>
                            </div>
                            <Switch />
                        </div>
                        <div className="flex items-center justify-between opacity-50">
                            <div className="space-y-0.5">
                                <div className="font-medium text-slate-900 flex items-center gap-2">
                                    ReadOnly Database
                                    <Lock className="h-3 w-3" />
                                </div>
                                <div className="text-sm text-slate-500">Prevent all write operations (System-managed)</div>
                            </div>
                            <Switch disabled checked={false} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
