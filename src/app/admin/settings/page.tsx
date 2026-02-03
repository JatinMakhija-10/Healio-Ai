"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                    <Settings className="h-8 w-8 text-slate-600" />
                    Admin Settings
                </h1>
                <p className="text-slate-500">
                    Configure global platform settings and admin preferences.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Platform Configuration</CardTitle>
                    <CardDescription>General settings for the Healio.AI platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="support-email">Support Email</Label>
                            <Input id="support-email" defaultValue="support@healio.ai" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact-phone">Contact Phone</Label>
                            <Input id="contact-phone" defaultValue="+91 1800 123 4567" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Registered Address</Label>
                        <Input id="address" defaultValue="123 Innovation Park, Tech City, Bangalore, KA" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Notification Defaults</CardTitle>
                    <CardDescription>Default notification settings for new users.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline">Reset to Defaults</Button>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
