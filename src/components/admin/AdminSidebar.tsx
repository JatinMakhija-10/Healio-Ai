"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    UserCheck,
    CreditCard,
    FileText,
    Settings,
    Shield,
    Activity,
    Map,
    Bell,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Zap,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navGroups = [
    {
        label: "Overview",
        items: [
            { label: "The Pulse", href: "/admin", icon: LayoutDashboard },
        ],
    },
    {
        label: "Management",
        items: [
            { label: "Doctor Verification", href: "/admin/doctors", icon: UserCheck, badge: 5 },
            { label: "Users", href: "/admin/users", icon: Users },
            { label: "Transactions", href: "/admin/transactions", icon: CreditCard },
        ],
    },
    {
        label: "Quality & Compliance",
        items: [
            { label: "Flagged Sessions", href: "/admin/compliance", icon: Shield, badge: 3 },
            { label: "Clinical QA", href: "/admin/qa", icon: FileText },
        ],
    },
    {
        label: "Strategic",
        items: [
            { label: "Epidemic Heatmap", href: "/admin/insights", icon: Map },
            { label: "Analytics", href: "/admin/analytics", icon: Activity },
        ],
    },
    {
        label: "System",
        items: [
            { label: "Feature Flags", href: "/admin/features", icon: Zap },
            { label: "Settings", href: "/admin/settings", icon: Settings },
        ],
    },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const initials = user?.user_metadata?.full_name
        ?.split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase() || user?.email?.[0]?.toUpperCase() || "A";

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col h-full border-r transition-all duration-300 ease-in-out",
                "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950",
                collapsed ? "w-20" : "w-72"
            )}
        >
            {/* Logo / Brand */}
            <div className={cn(
                "flex items-center gap-3 p-4 border-b border-slate-800/50",
                collapsed && "justify-center"
            )}>
                <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-950" />
                </div>
                {!collapsed && (
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-white tracking-tight">
                            Healio<span className="text-purple-400">.AI</span>
                        </span>
                        <span className="text-[10px] text-purple-400/70 uppercase tracking-wider font-medium">
                            Admin Control
                        </span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {navGroups.map((group) => (
                    <div key={group.label}>
                        {!collapsed && (
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-3 mb-2">
                                {group.label}
                            </p>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== "/admin" && pathname.startsWith(item.href));

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                                            "hover:bg-white/5",
                                            isActive
                                                ? "bg-gradient-to-r from-purple-600/20 to-purple-500/10 text-purple-400"
                                                : "text-slate-400 hover:text-white",
                                            collapsed && "justify-center px-2"
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "h-5 w-5 shrink-0 transition-transform duration-200",
                                                "group-hover:scale-110",
                                                isActive && "text-purple-400"
                                            )}
                                        />
                                        {!collapsed && (
                                            <>
                                                <span className="text-sm font-medium">{item.label}</span>
                                                {item.badge && (
                                                    <span className="ml-auto bg-purple-500/80 text-white text-[10px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                        {collapsed && item.badge && (
                                            <span className="absolute right-1.5 top-1 w-2 h-2 bg-purple-500 rounded-full" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Section */}
            <div className={cn(
                "p-3 border-t border-slate-800/50",
                collapsed && "flex flex-col items-center"
            )}>
                {/* Collapse Toggle */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        "w-full mb-3 text-slate-400 hover:text-white hover:bg-white/5",
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
                    "flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5",
                    collapsed && "p-1.5"
                )}>
                    <Avatar className="h-9 w-9 ring-2 ring-purple-500/30">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white text-sm font-medium">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user?.user_metadata?.full_name || "Admin"}
                            </p>
                            <p className="text-[10px] text-purple-400/70 truncate">
                                Super Admin
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
