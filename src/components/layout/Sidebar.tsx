"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    MessageSquarePlus,
    History,
    UserCircle,
    Settings,
    LogOut,
    Stethoscope,
    BookOpen,
    Video,
    CreditCard,
    Crown
} from "lucide-react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { PHASE_CONFIG } from "@/lib/phaseConfig";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const allSidebarItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        visible: true, // Always visible
    },
    {
        title: "New Consultation",
        href: "/dashboard/consult",
        icon: MessageSquarePlus,
        visible: true, // Always visible
    },
    {
        title: "History",
        href: "/dashboard/history",
        icon: History,
        visible: true, // Always visible
    },
    {
        title: "Profile",
        href: "/dashboard/profile",
        icon: UserCircle,
        visible: true, // Always visible
    },
    // PHASE 2 — Find Specialist / Doctor Marketplace
    {
        title: "Find Specialist",
        href: "/dashboard/search",
        icon: UserCircle,
        visible: PHASE_CONFIG.showDoctorMarketplace,
    },
    {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        visible: true, // Always visible
    },
    {
        title: "Plan & Credits",
        href: "/dashboard/billing",
        icon: CreditCard,
        visible: true, // Always visible
    },
    // PHASE 2 — Learn Section
    {
        title: "Learn",
        href: "/dashboard/learn",
        icon: BookOpen,
        visible: PHASE_CONFIG.showLearnSection,
    },
    // PHASE 2 — Videos Section
    {
        title: "Videos",
        href: "/dashboard/videos",
        icon: Video,
        visible: PHASE_CONFIG.showVideos,
    },
];

const sidebarItems = allSidebarItems.filter(item => item.visible);

export function Sidebar() {
    const pathname = usePathname();
    const { logout, profile } = useAuth();
    const plan = profile?.subscription_plan || 'free';
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
        } finally {
            setIsLoggingOut(false); // Might unmount before hitting this, which is fine
        }
    };

    return (
        <div className="flex h-full flex-col border-r border-slate-200 bg-white w-64 hidden md:flex">
            {/* Logo */}
            <div className="px-6 py-5 flex items-center gap-2.5">
                <div className="bg-teal-600 text-white p-1.5 rounded-lg">
                    <Stethoscope size={20} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-base text-slate-900 leading-tight tracking-tight">
                        Healio
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#0D9488" }}>
                        HEALTH AI
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto pt-4 pb-6 px-4">
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#9CA3AF", marginBottom: 12, paddingLeft: 8 }}>
                    Navigation
                </p>
                <div className="space-y-0.5">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                        return (
                            <Link key={item.href} href={item.href}>
                                <button
                                    className={cn(
                                        "w-full flex items-center gap-3 rounded-lg text-left transition-all duration-150",
                                        isActive
                                            ? "text-teal-700 font-semibold"
                                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                    style={{
                                        padding: "10px 12px",
                                        fontSize: "13.5px",
                                        fontWeight: isActive ? 600 : 500,
                                        letterSpacing: "0.01em",
                                        borderLeft: isActive ? "3px solid #0D9488" : "3px solid transparent",
                                        background: isActive ? "#F0FDFA" : undefined,
                                    }}
                                >
                                    <item.icon size={18} />
                                    {item.title}
                                </button>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-slate-100 flex flex-col gap-2">
                {/* Plan Badge */}
                <Link href="/dashboard/billing">
                    <div className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 mb-1 transition-all duration-150 cursor-pointer ${
                        plan === 'plus' || plan === 'pro'
                            ? 'bg-teal-50 border border-teal-200 hover:bg-teal-100'
                            : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                    }`}>
                        {plan === 'plus' || plan === 'pro' ? (
                            <Crown size={14} className="text-teal-600" />
                        ) : (
                            <CreditCard size={14} className="text-slate-400" />
                        )}
                        <div className="flex flex-col">
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${
                                plan === 'plus' || plan === 'pro' ? 'text-teal-700' : 'text-slate-500'
                            }`}>
                                {plan === 'pro' ? 'Healio Pro' : plan === 'plus' ? 'Healio Plus' : 'Free Plan'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                                {plan === 'free' ? 'Upgrade for more' : 'Active subscription'}
                            </span>
                        </div>
                    </div>
                </Link>

                <button
                    className="w-full flex items-center gap-3 rounded-lg text-left text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ padding: "10px 12px", fontSize: "13.5px", fontWeight: 500 }}
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                    {isLoggingOut ? "Signing Out..." : "Sign Out"}
                </button>

                <div className="flex flex-col gap-2 px-3 mt-4 mb-2">
                     <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Legal</p>
                     <div className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
                         <Link href="/privacy" className="hover:text-teal-600 transition-colors">Privacy Policy</Link>
                         <Link href="/terms" className="hover:text-teal-600 transition-colors">Terms of Service</Link>
                         <Link href="/medical-disclaimer" className="hover:text-teal-600 transition-colors">Medical Disclaimer</Link>
                     </div>
                </div>
            </div>
        </div>
    );
}
