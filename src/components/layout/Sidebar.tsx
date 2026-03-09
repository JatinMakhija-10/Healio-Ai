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
    Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { PHASE_CONFIG } from "@/lib/phaseConfig";

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
    const { logout } = useAuth();

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
            <div className="px-4 py-4 border-t border-slate-100">
                <button
                    className="w-full flex items-center gap-3 rounded-lg text-left text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
                    style={{ padding: "10px 12px", fontSize: "13.5px", fontWeight: 500 }}
                    onClick={logout}
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
