"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/lib/hooks/useApiQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Bell, CheckCheck, Info, Calendar, UserCheck, XCircle,
    MessageSquare, Shield, Video, Megaphone, Filter,
} from "lucide-react";

interface DBNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    action_url: string | null;
    metadata: Record<string, unknown>;
    is_read: boolean;
    created_at: string;
}

function getNotificationMeta(type: string) {
    switch (type) {
        case 'appointment_reminder': return { icon: Calendar, color: 'text-blue-600 bg-blue-100' };
        case 'new_booking':         return { icon: UserCheck, color: 'text-emerald-600 bg-emerald-100' };
        case 'booking_confirmed':   return { icon: UserCheck, color: 'text-green-600 bg-green-100' };
        case 'booking_cancelled':   return { icon: XCircle, color: 'text-red-600 bg-red-100' };
        case 'patient_message':
        case 'doctor_message':      return { icon: MessageSquare, color: 'text-purple-600 bg-purple-100' };
        case 'admin_alert':         return { icon: Megaphone, color: 'text-amber-600 bg-amber-100' };
        case 'video_call':          return { icon: Video, color: 'text-teal-600 bg-teal-100' };
        case 'system':
        default:                    return { icon: Info, color: 'text-slate-600 bg-slate-100' };
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
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

type FilterType = 'all' | 'unread';

export default function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [filter, setFilter] = useState<FilterType>('all');

    const { data: notifications = [], isLoading, refetch } = useNotifications(user?.id);
    const markReadMutation = useMarkNotificationRead();
    const markAllReadMutation = useMarkAllNotificationsRead();

    const all = notifications as DBNotification[];
    const displayed = filter === 'unread' ? all.filter(n => !n.is_read) : all;
    const unreadCount = all.filter(n => !n.is_read).length;

    const handleClick = (notif: DBNotification) => {
        if (!notif.is_read) {
            markReadMutation.mutate(notif.id);
        }
        if (notif.action_url) {
            router.push(notif.action_url);
        }
    };

    const handleMarkAllRead = () => {
        if (user?.id) {
            markAllReadMutation.mutate(user.id, { onSuccess: () => refetch() });
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-teal-600 font-medium">
                        <Bell className="h-4 w-4" />
                        <span>Inbox</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
                    <p className="text-slate-500 text-sm">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllRead}
                        disabled={markAllReadMutation.isPending}
                        className="flex items-center gap-2 text-teal-600 border-teal-200 hover:bg-teal-50"
                    >
                        <CheckCheck className="h-4 w-4" />
                        Mark all read
                    </Button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
                <button
                    onClick={() => setFilter('all')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Filter className="h-3.5 w-3.5" />
                    All
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === 'all' ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-500'}`}>
                        {all.length}
                    </span>
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        filter === 'unread' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Unread
                    {unreadCount > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filter === 'unread' ? 'bg-red-100 text-red-600' : 'bg-red-100 text-red-500'}`}>
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Notifications List */}
            <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="border-b border-slate-100 py-3 px-4">
                    <CardTitle className="text-sm font-medium text-slate-500">
                        {filter === 'unread' ? 'Unread notifications' : 'All notifications'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex gap-3">
                                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-3 w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : displayed.length === 0 ? (
                        <div className="py-16 text-center text-slate-400">
                            <Bell className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                            <p className="font-medium text-slate-500">
                                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                            </p>
                            <p className="text-sm mt-1">
                                {filter === 'unread' ? 'Switch to "All" to see past notifications' : "You'll see alerts and updates here"}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {displayed.map((notif) => {
                                const meta = getNotificationMeta(notif.type);
                                const IconComponent = meta.icon;
                                return (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleClick(notif)}
                                        className={`flex gap-4 px-4 py-4 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-teal-50/40' : ''}`}
                                    >
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!notif.is_read ? meta.color : 'bg-slate-100 text-slate-400'}`}>
                                            <IconComponent size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                    {notif.title}
                                                </p>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {!notif.is_read && <span className="w-2 h-2 bg-teal-500 rounded-full" />}
                                                    <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(notif.created_at)}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-500 mt-0.5">{notif.message}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                {notif.type === 'admin_alert' && (
                                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                                                        <Shield size={8} />
                                                        Admin
                                                    </span>
                                                )}
                                                {notif.action_url && (
                                                    <span className="text-[10px] text-teal-600 font-medium">Click to view →</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
