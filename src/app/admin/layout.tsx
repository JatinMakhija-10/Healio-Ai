"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useRequireRole } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Bell, Search, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type HealthStatus = "operational" | "degraded" | "partial_outage" | "major_outage" | "unknown";

const STATUS_PILL: Record<HealthStatus, { label: string; dot: string; pill: string; text: string }> = {
    operational:    { label: "All Systems Operational", dot: "bg-green-500",  pill: "bg-green-50 border-green-200",   text: "text-green-700"   },
    degraded:       { label: "Degraded Performance",    dot: "bg-amber-500",  pill: "bg-amber-50 border-amber-200",   text: "text-amber-700"   },
    partial_outage: { label: "Partial Outage",          dot: "bg-orange-500", pill: "bg-orange-50 border-orange-200", text: "text-orange-700"  },
    major_outage:   { label: "Major Outage",            dot: "bg-red-500",    pill: "bg-red-50 border-red-200",       text: "text-red-700"     },
    unknown:        { label: "Status Unknown",          dot: "bg-slate-400",  pill: "bg-slate-50 border-slate-200",   text: "text-slate-600"   },
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { loading, isAuthorized } = useRequireRole('admin');
    const router = useRouter();
    const searchRef = useRef<HTMLInputElement>(null);
    const [searchValue, setSearchValue] = useState("");
    const [systemStatus, setSystemStatus] = useState<HealthStatus>("unknown");

    // Global ⌘K / Ctrl+K shortcut to focus the search bar
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchRef.current?.focus();
                searchRef.current?.select();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Best-effort poll the health endpoint so the status pill is live
    useEffect(() => {
        if (!isAuthorized) return;
        let cancelled = false;
        const tick = async () => {
            try {
                const res = await fetch("/api/admin/health");
                const json = await res.json();
                if (cancelled) return;
                const next: HealthStatus = json?.data?.status ?? "unknown";
                setSystemStatus(next);
            } catch {
                if (!cancelled) setSystemStatus("unknown");
            }
        };
        tick();
        const id = setInterval(tick, 30_000);
        return () => { cancelled = true; clearInterval(id); };
    }, [isAuthorized]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchValue.trim();
        router.push(q ? `/admin/users?q=${encodeURIComponent(q)}` : "/admin/users");
    };

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

    const statusPill = STATUS_PILL[systemStatus];

    return (
        <div className="flex h-dvh bg-slate-100">
            <AdminSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Header Bar */}
                <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0 shadow-sm">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Search */}
                        <form onSubmit={handleSearchSubmit} className="relative max-w-md flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                ref={searchRef}
                                type="search"
                                placeholder="Search users by name, email, or role…"
                                className="pl-10 pr-12 bg-slate-50 border-slate-200 focus:bg-white"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-xs text-slate-400 pointer-events-none">
                                <Command className="h-3 w-3" />
                                <span>K</span>
                            </div>
                        </form>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notifications */}
                        <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="relative"
                            title="Open notifications"
                        >
                            <Link href="/admin/notifications" aria-label="Notifications">
                                <Bell className="h-5 w-5 text-slate-600" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            </Link>
                        </Button>

                        {/* Status */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusPill.pill}`}>
                            <span className={`w-2 h-2 rounded-full animate-pulse ${statusPill.dot}`} />
                            <span className={`text-sm font-medium ${statusPill.text}`}>{statusPill.label}</span>
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
