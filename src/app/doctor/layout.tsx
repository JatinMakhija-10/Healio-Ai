"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DoctorSidebar } from "@/components/doctor/DoctorSidebar";
import { useRequireRole } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function DoctorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { loading, isAuthorized, user, role } = useRequireRole('doctor');

    // Check for verification
    const isVerified = user?.user_metadata?.doctor_verified;

    useEffect(() => {
        if (!loading && role === 'doctor' && !isVerified) {
            router.push('/doctor/pending');
        }
    }, [loading, role, isVerified, router]);

    // Show loading skeleton while checking auth
    if (loading) {
        return (
            <div className="flex h-dvh bg-slate-100">
                <div className="w-64 bg-slate-900 p-4 space-y-4">
                    <Skeleton className="h-12 w-full bg-slate-800" />
                    <Skeleton className="h-8 w-full bg-slate-800" />
                    <Skeleton className="h-8 w-full bg-slate-800" />
                    <Skeleton className="h-8 w-full bg-slate-800" />
                </div>
                <div className="flex-1 p-8">
                    <Skeleton className="h-8 w-64 mb-6" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </div>
                </div>
            </div>
        );
    }

    // Redirect handled by useRequireRole or the useEffect above
    if (!isAuthorized || (role === 'doctor' && !isVerified)) {
        return null;
    }

    return (
        <div className="flex h-dvh bg-slate-100">
            <DoctorSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
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

