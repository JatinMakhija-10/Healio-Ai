"use client";

import { DoctorSidebar } from "@/components/doctor/DoctorSidebar";
import { useRequireRole } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { loading, isAuthorized, user, role } = useRequireRole('doctor');

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
                    <div className="grid grid-cols-3 gap-6">
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </div>
                </div>
            </div>
        );
    }

    // Redirect handled by useRequireRole, but show nothing if not authorized
    if (!isAuthorized) {
        return null;
    }

    // Check for verification
    const isVerified = user?.user_metadata?.doctor_verified;
    if (role === 'doctor' && !isVerified) {
        // Redirecting directly in the component if they somehow bypass other checks
        window.location.href = '/doctor/pending';
        return null;
    }

    return (
        <div className="flex h-dvh bg-slate-100">
            <DoctorSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Header Bar */}
                <header className="h-16 border-b bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-semibold text-slate-900">Doctor Portal</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Quick Actions - can be expanded */}
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Online
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
