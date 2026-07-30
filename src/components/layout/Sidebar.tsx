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
    const isPaid = plan === 'plus' || plan === 'pro';
    const planName = plan === 'pro' ? 'Pro Active' : plan === 'plus' ? 'Plus Active' : 'Free Plan';
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
                        Healio.AI
                    </span>
                    <span className="text-[9px] font-semibold tracking-[0.08em] uppercase text-[#0F6E56]">
                        WHERE SCIENCE MEETS SOUL
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
                                        "w-full flex items-center gap-3 rounded-lg text-left transition-all duration-150 px-3 py-2.5 text-[13.5px] tracking-[0.01em]",
                                        isActive
                                            ? "text-teal-700 font-semibold border-l-[3px] border-[#0F6E56] bg-[#E1F5EE]"
                                            : "text-slate-500 font-medium hover:text-slate-900 hover:bg-slate-50 border-l-[3px] border-transparent"
                                    )}
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
                                        className="bg-slate-900 text-slate-100 border-slate-800 text-xs px-2.5 py-1.5 shadow-md flex items-center gap-2"
                                    >
                                        <span>New consultation</span>
                                        <kbd className="bg-slate-800 text-slate-300 rounded px-1.5 py-0.5 text-[10px] font-mono border border-slate-700">
                                            {NEW_CONSULTATION_SHORTCUT}
                                        </kbd>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                </TooltipProvider>
            </div>

            {/* Footer / Account */}
            <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
                <Link href="/dashboard/billing">
                    <div
                        className={cn(
                            "mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all duration-150 border",
                            isPaid
                                ? "bg-teal-50/80 border-teal-200/80 hover:bg-teal-100/60"
                                : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/60"
                        )}
                    >
                        <div
                            className={cn(
                                "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                                isPaid ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
                            )}
                        >
                            {isPaid ? <Crown size={14} /> : <CreditCard size={14} />}
                        </div>
                        <div className="min-w-0 flex-1 text-[11px] leading-tight">
                            <div className="flex items-center justify-between">
                                <span
                                    className={cn(
                                        "font-bold truncate",
                                        isPaid ? "text-teal-900" : "text-slate-700"
                                    )}
                                >
                                    {planName}
                                </span>
                            </div>
                            <span className="text-slate-500">
                                {creditsBalance} credits
                            </span>
                        </div>
                    </div>
                </Link>

                <button
                    className="w-full flex items-center gap-3 rounded-lg text-left text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2.5 text-[13.5px] font-medium"
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
