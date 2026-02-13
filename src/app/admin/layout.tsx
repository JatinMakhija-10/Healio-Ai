"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useRequireRole } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Bell, Search, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { loading, isAuthorized } = useRequireRole('admin');

    // Show loading skeleton while checking auth
    if (loading) {
        return (
            <div className="flex h-dvh bg-slate-950">
                <div className="w-72 p-4 space-y-4 border-r border-slate-800">
                    <Skeleton className="h-12 w-full bg-slate-800" />
                    <Skeleton className="h-8 w-full bg-slate-800" />
                    <Skeleton className="h-8 w-full bg-slate-800" />
                    <Skeleton className="h-8 w-full bg-slate-800" />
                </div>
                <div className="flex-1 bg-slate-100 p-8">
                    <Skeleton className="h-8 w-64 mb-6" />
                    <div className="grid grid-cols-4 gap-6">
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </div>
                </div>
            </div>
        );
    }

    // Redirect handled by useRequireRole
    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="flex h-dvh bg-slate-100">
            <AdminSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Header Bar */}
                <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0 shadow-sm">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Search */}
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                type="search"
                                placeholder="Search users, doctors, transactions..."
                                className="pl-10 pr-12 bg-slate-50 border-slate-200 focus:bg-white"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-xs text-slate-400">
                                <Command className="h-3 w-3" />
                                <span>K</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notifications */}
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5 text-slate-600" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </Button>

                        {/* Status */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-green-700">All Systems Operational</span>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <ErrorBoundary>
                            {children}
                        </ErrorBoundary>
                    </div>
                </main>
            </div>
        </div>
    );
}
