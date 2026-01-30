"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Mail, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function DoctorPendingPage() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50 p-6">
            <Card className="max-w-lg w-full">
                <CardContent className="pt-12 pb-8 space-y-6 text-center">
                    {/* Animated pending icon */}
                    <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 rounded-full bg-amber-100 animate-ping opacity-30" />
                        <div className="relative w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center">
                            <Clock className="h-12 w-12 text-amber-600" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-slate-900">Verification In Progress</h2>
                        <p className="text-slate-600">
                            Thank you for registering with Healio.AI! Our team is reviewing your credentials.
                        </p>
                    </div>

                    {/* Status Timeline */}
                    <div className="bg-slate-50 rounded-xl p-6 text-left space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Application Received</p>
                                <p className="text-sm text-slate-500">Your profile is submitted</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 animate-pulse">
                                <Clock className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Under Review</p>
                                <p className="text-sm text-slate-500">Verifying credentials (24-48 hrs)</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 opacity-50">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="h-4 w-4 text-slate-400" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-500">Approved</p>
                                <p className="text-sm text-slate-400">Ready to accept patients</p>
                            </div>
                        </div>
                    </div>

                    {/* Email notification */}
                    <div className="flex items-center gap-3 justify-center text-sm text-slate-600">
                        <Mail className="h-4 w-4" />
                        <span>We&apos;ll notify you at <strong>{user?.email}</strong></span>
                    </div>

                    {/* Contact */}
                    <p className="text-xs text-slate-500">
                        Questions? Contact us at{" "}
                        <a href="mailto:support@healio.ai" className="text-teal-600 hover:underline">
                            support@healio.ai
                        </a>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
