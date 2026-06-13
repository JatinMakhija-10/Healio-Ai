"use client";

import { usePathname } from "next/navigation";
import ErrorBoundary from "@/components/ErrorBoundary";

export function DashboardContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isConsult = pathname === "/dashboard/consult";

    if (isConsult) {
        return (
            <main className="flex-1 overflow-hidden">
                <ErrorBoundary>{children}</ErrorBoundary>
            </main>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="mx-auto max-w-6xl">
                <ErrorBoundary>{children}</ErrorBoundary>
            </div>
        </main>
    );
}
