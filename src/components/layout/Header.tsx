"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Bell, Search, Menu, X, Heart, Droplets, Moon, Activity, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MobileSidebar } from "./MobileSidebar";

// Sample notifications with health tips
const sampleNotifications = [
    {
        id: 1,
        type: 'tip',
        icon: Droplets,
        title: 'Stay Hydrated',
        message: 'Drink warm water in the morning to kickstart your digestion.',
        time: '2 hours ago',
        read: false
    },
    {
        id: 2,
        type: 'reminder',
        icon: Moon,
        title: 'Sleep Reminder',
        message: 'Aim for 7-8 hours of sleep for optimal health.',
        time: '5 hours ago',
        read: false
    },
    {
        id: 3,
        type: 'insight',
        icon: Leaf,
        title: 'Ayurvedic Tip',
        message: 'Practice deep breathing for 5 minutes to balance your doshas.',
        time: '1 day ago',
        read: true
    },
    {
        id: 4,
        type: 'health',
        icon: Activity,
        title: 'Activity Goal',
        message: 'Try a 15-minute walk after meals to improve digestion.',
        time: '2 days ago',
        read: true
    }
];

export function Header() {
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState(sampleNotifications);
    const notificationRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const markAsRead = (id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    return (
        <>
            <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            <header className="h-16 border-b border-slate-200 bg-white/50 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 transition-all duration-200">
                <div className="flex items-center gap-3">
                    {/* Mobile Menu Toggle - visible only on mobile */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-slate-500 hover:text-slate-900 -ml-2"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu size={24} />
                    </Button>

                    {/* Title / Breadcrumb */}
                    <h2 className="text-lg font-semibold text-slate-800">Overview</h2>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800 hidden sm:flex">
                        <Search size={20} />
                    </Button>

                    {/* Notification Button with Dropdown */}
                    <div className="relative" ref={notificationRef}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-500 hover:text-slate-800 relative"
                            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[10px] text-white font-bold flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </Button>

                        {/* Notification Dropdown Panel */}
                        {isNotificationOpen && (
                            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                                    <div className="flex items-center gap-2">
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsNotificationOpen(false)}
                                            className="text-slate-400 hover:text-slate-600"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Notification List */}
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="py-8 text-center text-slate-500">
                                            <Bell className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                            <p>No notifications yet</p>
                                        </div>
                                    ) : (
                                        notifications.map((notif) => {
                                            const IconComponent = notif.icon;
                                            return (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => markAsRead(notif.id)}
                                                    className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.read ? 'bg-teal-50/50' : ''}`}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${!notif.read ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            <IconComponent size={18} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                                    {notif.title}
                                                                </p>
                                                                {!notif.read && (
                                                                    <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1.5"></span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                                            <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
                                    <button className="w-full text-center text-sm text-teal-600 hover:text-teal-700 font-medium py-1">
                                        View all notifications
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-slate-900 leading-none">
                                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User"}
                            </p>
                            <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 mt-1">
                                Free Plan
                            </span>
                        </div>
                        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border border-slate-200 cursor-pointer">
                            <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={user?.email || "User"} />
                            <AvatarFallback className="bg-teal-50 text-teal-700">
                                {user?.email?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </header>
        </>
    );
}
