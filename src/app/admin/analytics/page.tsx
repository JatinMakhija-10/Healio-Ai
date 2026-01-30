"use client";

import { EmergingPatterns, AIHealthDetail } from "@/components/admin/analytics/EmergingPatterns";
import { BarChart, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <BarChart className="h-8 w-8 text-purple-600" />
                        AI Analytics & Health
                    </h1>
                    <p className="text-slate-500">
                        Deep dive into the Prakriti engine performance and predictive diagnostics.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        Last 7 Days
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                        Export Report
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                <EmergingPatterns />
                <AIHealthDetail />
            </div>
        </div>
    );
}
