"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    MessageSquarePlus,
    History,
    UserCircle,
    Settings,
    LogOut,
    BookOpen,
    GraduationCap,
    Video,
    CreditCard,
    Crown,
    Leaf,
    Sun,
    Users,
    UserRoundSearch
} from "lucide-react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import { PHASE_CONFIG } from "@/lib/phaseConfig";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const NEW_CONSULTATION_SHORTCUT = "Ctrl+Shift+O";

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
    // PHASE 2 — Wellness Section
    {
        title: "Wellness",
        href: "/dashboard/wellness",
        icon: Leaf,
        visible: PHASE_CONFIG.showWellnessSection,
    },
    {
        title: "Remedies & Routines",
        href: "/dashboard/wellness/library",
        icon: BookOpen,
        visible: PHASE_CONFIG.showWellnessSection,
    },
    {
        title: "Daily Routine",
        href: "/dashboard/wellness/routines",
        icon: Sun,
        visible: PHASE_CONFIG.showWellnessSection,
    },
    // PHASE 2 — Family Profiles
    {
        title: "Family Profiles",
        href: "/dashboard/family",
        icon: Users,
        visible: PHASE_CONFIG.showFamilyProfiles,
    },
    // PHASE 2 — Find Specialist / Doctor Marketplace
    {
        title: "Find Specialist",
        href: "/dashboard/search",
        icon: UserRoundSearch,
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
        icon: GraduationCap,
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
    const router = useRouter();
    const { logout, profile } = useAuth();
    const plan = profile?.subscription_plan || 'free';
    const creditsBalance = Number(profile?.credits_balance ?? 0);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
        } finally {
            setIsLoggingOut(false); // Might unmount before hitting this, which is fine
        }
    };

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const isTyping =
                target?.tagName === "INPUT" ||
                target?.tagName === "TEXTAREA" ||
                target?.isContentEditable;

            if (isTyping) return;

            if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "o") {
                event.preventDefault();
                router.push("/dashboard/consult");
            }
        };

        window.addEventListener("keydown", handleShortcut);
        return () => window.removeEventListener("keydown", handleShortcut);
    }, [router]);

    return (
        <div className="flex h-full flex-col border-r border-slate-200 bg-white w-64 hidden md:flex">
            {/* Logo */}
            <div className="px-6 py-5 flex items-center gap-2.5">
                <div className="bg-teal-600 text-white p-1.5 rounded-lg">
                    <Leaf size={20} strokeWidth={2.5} />
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
                <TooltipProvider delayDuration={150}>
                    <div className="space-y-0.5">
                        {sidebarItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                            const showShortcutTooltip = item.href === "/dashboard/consult";
                            const navLink = (
                                <Link
                                    href={item.href}
                                    aria-keyshortcuts={showShortcutTooltip ? "Control+Shift+O" : undefined}
                                    aria-label={showShortcutTooltip ? `New consultation (${NEW_CONSULTATION_SHORTCUT})` : undefined}
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
                                </Link>
                            );

                            if (!showShortcutTooltip) {
                                return <div key={item.href}>{navLink}</div>;
                            }

                            return (
                                <Tooltip key={item.href}>
                                    <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                                    <TooltipContent
                                        side="right"
                                        sideOffset={12}
                                        className="flex items-center gap-2 whitespace-nowrap rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/10"
                                    >
                                        <span>New consultation</span>
                                        <kbd className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-500">
                                            {NEW_CONSULTATION_SHORTCUT}
                                        </kbd>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                </TooltipProvider>
            </div>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-slate-100 flex flex-col gap-2">
                {/* Plan + credits badge */}
                <Link href="/dashboard/billing">
                    <div className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-150 cursor-pointer ${
                        plan === 'plus' || plan === 'pro'
                            ? 'bg-teal-50 border border-teal-200 hover:bg-teal-100'
                            : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                    }`}>
                        {plan === 'plus' || plan === 'pro' ? (
                            <Crown size={14} className="text-teal-600" />
                        ) : (
                            <CreditCard size={14} className="text-slate-400" />
                        )}
                        <div className="min-w-0 text-[11px] leading-tight">
                            <span className={`font-bold ${
                                plan === 'plus' || plan === 'pro' ? 'text-teal-700' : 'text-slate-500'
                            }`}>
                                {plan === 'pro' ? 'Pro Active' : plan === 'plus' ? 'Plus Active' : 'Free Plan'}
                            </span>
                            <span className="mx-1.5 text-slate-300">·</span>
                            <span className="text-slate-500">
                                {creditsBalance} credits
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
