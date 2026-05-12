"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/lib/hooks/useApiQueries";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import {
    Bell, X, Info, Calendar, UserCheck, XCircle,
    MessageSquare, Shield, Video, Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getNotificationMeta(type: string) {
    switch (type) {
        case 'appointment_reminder':
            return { icon: Calendar, color: 'text-blue-600 bg-blue-100' };
        case 'new_booking':
            return { icon: UserCheck, color: 'text-emerald-600 bg-emerald-100' };
        case 'booking_confirmed':
            return { icon: UserCheck, color: 'text-green-600 bg-green-100' };
        case 'booking_cancelled':
            return { icon: XCircle, color: 'text-red-600 bg-red-100' };
        case 'patient_message':
        case 'doctor_message':
            return { icon: MessageSquare, color: 'text-purple-600 bg-purple-100' };
        case 'admin_alert':
            return { icon: Megaphone, color: 'text-amber-600 bg-amber-100' };
        case 'video_call':
            return { icon: Video, color: 'text-teal-600 bg-teal-100' };
        case 'system':
        default:
            return { icon: Info, color: 'text-slate-600 bg-slate-100' };
    }
}

function timeAgo(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

interface DBNotification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    action_url: string | null;
    metadata: Record<string, unknown>;
    is_read: boolean;
    created_at: string;
    read_at: string | null;
}

export function DoctorHeader() {
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    const { data: notifications = [], isLoading } = useNotifications(user?.id);
    const markReadMutation = useMarkNotificationRead();
    const markAllReadMutation = useMarkAllNotificationsRead();

    const typedNotifications = notifications as DBNotification[];
    const unreadCount = typedNotifications.filter(n => !n.is_read).length;

    // Realtime subscription
    useEffect(() => {
        if (!user?.id) return;
        const channel = supabase
            .channel(`doctor-notifications-${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`,
            }, () => {
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`,
            }, () => {
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user?.id, queryClient]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAllRead = useCallback(() => {
        if (user?.id) markAllReadMutation.mutate(user.id);
    }, [user?.id, markAllReadMutation]);

    const handleMarkRead = useCallback((notifId: string, actionUrl?: string | null) => {
        markReadMutation.mutate(notifId);
        if (actionUrl) {
            setIsNotificationOpen(false);
            router.push(actionUrl);
        }
    }, [markReadMutation, router]);

    return (
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 shadow-sm">
            <div />

            <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <div className="relative" ref={notificationRef}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 hover:text-slate-800 relative"
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[10px] text-white font-bold flex items-center justify-center animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Button>

                    {isNotificationOpen && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button onClick={handleMarkAllRead} className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                                            Mark all read
                                        </button>
                                    )}
                                    <button onClick={() => setIsNotificationOpen(false)} className="text-slate-400 hover:text-slate-600">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-80 overflow-y-auto">
                                {isLoading ? (
                                    <div className="py-8 text-center text-slate-500">
                                        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                        <p className="text-sm">Loading…</p>
                                    </div>
                                ) : typedNotifications.length === 0 ? (
                                    <div className="py-8 text-center text-slate-500">
                                        <Bell className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                        <p className="font-medium">All caught up!</p>
                                        <p className="text-xs text-slate-400 mt-1">No notifications yet</p>
                                    </div>
                                ) : (
                                    typedNotifications.slice(0, 20).map((notif) => {
                                        const meta = getNotificationMeta(notif.type);
                                        const IconComponent = meta.icon;
                                        return (
                                            <div
                                                key={notif.id}
                                                onClick={() => handleMarkRead(notif.id, notif.action_url)}
                                                className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-teal-50/50' : ''}`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${!notif.is_read ? meta.color : 'bg-slate-100 text-slate-400'}`}>
                                                        <IconComponent size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className={`text-sm ${!notif.is_read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                                {notif.title}
                                                            </p>
                                                            {!notif.is_read && (
                                                                <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1.5" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <p className="text-xs text-slate-400">{timeAgo(notif.created_at)}</p>
                                                            {notif.type === 'admin_alert' && (
                                                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                                                    <Shield size={8} />
                                                                    Admin
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {typedNotifications.length > 0 && (
                                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
                                    <button
                                        onClick={() => { setIsNotificationOpen(false); router.push('/doctor/notifications'); }}
                                        className="w-full text-center text-sm text-teal-600 hover:text-teal-700 font-medium py-1"
                                    >
                                        View all notifications
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-slate-200" />

                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border border-slate-200">
                        <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={user?.email || "Doctor"} />
                        <AvatarFallback className="bg-teal-50 text-teal-700 text-sm font-semibold">
                            {user?.email?.charAt(0).toUpperCase() || "D"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block">
                        <p className="text-sm font-semibold text-slate-800 leading-none">
                            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Doctor'}
                        </p>
                        <span className="text-[10px] font-bold tracking-wide uppercase text-teal-600">Doctor</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
