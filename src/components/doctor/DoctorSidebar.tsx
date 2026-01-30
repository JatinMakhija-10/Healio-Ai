"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Calendar,
    Users,
    MessageSquare,
    BarChart3,
    Settings,
    Stethoscope,
    LogOut,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
    {
        label: "Dashboard",
        href: "/doctor",
        icon: LayoutDashboard,
    },
    {
        label: "My Schedule",
        href: "/doctor/schedule",
        icon: Calendar,
    },
    {
        label: "Patients",
        href: "/doctor/patients",
        icon: Users,
    },
    {
        label: "Inbox",
        href: "/doctor/inbox",
        icon: MessageSquare,
        badge: 3, // Example unread count
    },
    {
        label: "Analytics",
        href: "/doctor/analytics",
        icon: BarChart3,
    },
    {
        label: "Settings",
        href: "/doctor/settings",
        icon: Settings,
    },
];

export function DoctorSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const initials = user?.user_metadata?.full_name
        ?.split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase() || user?.email?.[0]?.toUpperCase() || "D";

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col h-full border-r transition-all duration-300 ease-in-out",
                "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Logo / Brand */}
            <div className={cn(
                "flex items-center gap-3 p-4 border-b border-slate-800",
                collapsed && "justify-center"
            )}>
                <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <Stethoscope className="h-5 w-5 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-900" />
                </div>
                {!collapsed && (
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-white tracking-tight">
                            Healio<span className="text-teal-400">.AI</span>
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                            Doctor Portal
                        </span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/doctor" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                                "hover:bg-slate-800/60",
                                isActive
                                    ? "bg-gradient-to-r from-teal-600/20 to-teal-500/10 text-teal-400 shadow-inner"
                                    : "text-slate-400 hover:text-white",
                                collapsed && "justify-center px-2"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "h-5 w-5 shrink-0 transition-transform duration-200",
                                    "group-hover:scale-110",
                                    isActive && "text-teal-400"
                                )}
                            />
                            {!collapsed && (
                                <>
                                    <span className="text-sm font-medium">{item.label}</span>
                                    {item.badge && (
                                        <span className="ml-auto bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                            {collapsed && item.badge && (
                                <span className="absolute right-2 top-1 w-2 h-2 bg-teal-500 rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className={cn(
                "p-3 border-t border-slate-800",
                collapsed && "flex flex-col items-center"
            )}>
                {/* Collapse Toggle */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        "w-full mb-3 text-slate-400 hover:text-white hover:bg-slate-800",
                        collapsed && "w-auto"
                    )}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            <span className="text-xs">Collapse</span>
                        </>
                    )}
                </Button>

                {/* Profile */}
                <div className={cn(
                    "flex items-center gap-3 p-2 rounded-xl bg-slate-800/50",
                    collapsed && "p-1.5"
                )}>
                    <Avatar className="h-9 w-9 ring-2 ring-teal-500/30">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white text-sm font-medium">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user?.user_metadata?.full_name || "Doctor"}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                                {user?.email}
                            </p>
                        </div>
                    )}
                    {!collapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={logout}
                            className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </aside>
    );
}
