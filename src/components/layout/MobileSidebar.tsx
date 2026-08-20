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
    Leaf,
    X,
    BookOpen,
    Loader2,
    CreditCard,
    Crown
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { PHASE_CONFIG } from "@/lib/phaseConfig";

const allSidebarItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        visible: true,
    },
    {
        title: "New Consultation",
        href: "/dashboard/consult",
        icon: MessageSquarePlus,
        visible: true,
    },
    {
        title: "History",
        href: "/dashboard/history",
        icon: History,
        visible: true,
    },
    {
        title: "Profile",
        href: "/dashboard/profile",
        icon: UserCircle,
        visible: true,
    },
    {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        visible: true,
    },
    {
        title: "Plan & Credits",
        href: "/dashboard/billing",
        icon: CreditCard,
        visible: true,
    },
    // PHASE 2 — Learn Section
    {
        title: "Learn",
        href: "/dashboard/learn",
        icon: BookOpen,
        visible: PHASE_CONFIG.showLearnSection,
    },
];

const sidebarItems = allSidebarItems.filter(item => item.visible);

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
    const pathname = usePathname();
    const { logout, profile } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const plan = profile?.subscription_plan || "free";
    const creditsBalance = Number(profile?.credits_balance ?? 0);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            onClose(); // Close sidebar after logout
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    />

                    {/* Sidebar Drawer */}
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 md:hidden flex flex-col shadow-xl"
                    >
                        {/* Header */}
                        <div className="p-6 flex items-center justify-between border-b border-slate-100">
                            <Link href="/" onClick={onClose} className="flex items-center gap-2 hover:opacity-90 transition-opacity" aria-label="Healio home">
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
                            </Link>
                            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-500">
                                <X size={20} />
                            </Button>
                        </div>

                        {/* Navigation */}
                        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                            {sidebarItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                                return (
                                    <Link key={item.href} href={item.href} onClick={onClose}>
                                        <Button
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-start gap-3 h-11 text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 mb-0.5 rounded-lg transition-all duration-150 border-l-[3px] border-transparent",
                                                isActive && "border-l-teal-600 bg-teal-50/80 text-teal-700 hover:bg-teal-50 hover:text-teal-800 font-semibold"
                                            )}
                                        >
                                            <item.icon size={18} />
                                            {item.title}
                                        </Button>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
                            <Link href="/dashboard/billing" onClick={onClose}>
                                <div className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-150 ${
                                    plan === "plus" || plan === "pro"
                                        ? "bg-teal-50 border border-teal-200"
                                        : "bg-slate-50 border border-slate-200"
                                }`}>
                                    {plan === "plus" || plan === "pro" ? (
                                        <Crown size={14} className="text-teal-600" />
                                    ) : (
                                        <CreditCard size={14} className="text-slate-400" />
                                    )}
                                    <div className="min-w-0 text-[11px] leading-tight">
                                        <span className={`font-bold ${
                                            plan === "plus" || plan === "pro" ? "text-teal-700" : "text-slate-500"
                                        }`}>
                                            {plan === "pro" ? "Pro Active" : plan === "plus" ? "Plus Active" : "Free Plan"}
                                        </span>
                                        <span className="mx-1.5 text-slate-300">-</span>
                                        <span className="text-slate-500">{creditsBalance} credits</span>
                                    </div>
                                </div>
                            </Link>

                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                                {isLoggingOut ? "Signing Out..." : "Sign Out"}
                            </Button>

                            <div className="flex flex-col gap-2 px-3 mt-4 mb-2">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Legal</p>
                                <div className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
                                    <Link href="/privacy" onClick={onClose} className="hover:text-teal-600 transition-colors">Privacy Policy</Link>
                                    <Link href="/terms" onClick={onClose} className="hover:text-teal-600 transition-colors">Terms of Service</Link>
                                    <Link href="/medical-disclaimer" onClick={onClose} className="hover:text-teal-600 transition-colors">Medical Disclaimer</Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
