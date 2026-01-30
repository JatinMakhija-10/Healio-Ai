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
    X,
    BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "New Consultation",
        href: "/dashboard/consult",
        icon: MessageSquarePlus,
    },
    {
        title: "History",
        href: "/dashboard/history",
        icon: History,
    },
    {
        title: "Profile",
        href: "/dashboard/profile",
        icon: UserCircle,
    },
    {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
    {
        title: "Learn",
        href: "/dashboard/learn",
        icon: BookOpen,
    },
];

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();

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
                            <div className="flex items-center gap-2">
                                <div className="bg-teal-600 text-white p-1.5 rounded-lg">
                                    <Stethoscope size={20} strokeWidth={2.5} />
                                </div>
                                <span className="font-bold text-lg text-slate-900 tracking-tight">
                                    Healio.AI
                                </span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-500">
                                <X size={20} />
                            </Button>
                        </div>

                        {/* Navigation */}
                        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                            {sidebarItems.map((item) => (
                                <Link key={item.href} href={item.href} onClick={onClose}>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start gap-3 h-11 text-slate-600 hover:text-slate-900 hover:bg-slate-100 mb-1",
                                            pathname === item.href && "bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800 font-medium"
                                        )}
                                    >
                                        <item.icon size={18} />
                                        {item.title}
                                    </Button>
                                </Link>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100">
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => {
                                    logout();
                                    onClose();
                                }}
                            >
                                <LogOut size={18} />
                                Sign Out
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
