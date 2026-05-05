"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Send, Users, Stethoscope, UserCircle, Megaphone,
    Clock, CheckCircle2, AlertCircle, RefreshCw,
} from "lucide-react";

type TargetGroup = 'all' | 'patients' | 'doctors';
type NotifType = 'admin_alert' | 'system';

interface SentNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    action_url: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    is_read: boolean;
}

export default function AdminNotificationsPage() {
    // ── Form State ──
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<NotifType>('admin_alert');
    const [target, setTarget] = useState<TargetGroup>('all');
    const [actionUrl, setActionUrl] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    // ── History State ──
    const [history, setHistory] = useState<SentNotification[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const res = await fetch('/api/admin/notifications');
            const json = await res.json();
            if (json.success) {
                setHistory(json.data || []);
            }
        } catch (e) {
            console.error('Failed to fetch notification history:', e);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            setResult({ success: false, message: 'Title and message are required.' });
            return;
        }

        setSending(true);
        setResult(null);

        try {
            const res = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    message: message.trim(),
                    type,
                    target,
                    actionUrl: actionUrl.trim() || undefined,
                }),
            });

            const json = await res.json();

            if (json.success) {
                setResult({
                    success: true,
                    message: `✅ Sent "${json.data.title}" to ${json.data.sent} user${json.data.sent !== 1 ? 's' : ''}`,
                });
                // Reset form
                setTitle('');
                setMessage('');
                setActionUrl('');
                // Refresh history
                fetchHistory();
            } else {
                setResult({
                    success: false,
                    message: json.message || json.error || 'Failed to send notification',
                });
            }
        } catch (error) {
            setResult({
                success: false,
                message: error instanceof Error ? error.message : 'Network error',
            });
        } finally {
            setSending(false);
        }
    };

    const targetOptions: { value: TargetGroup; label: string; icon: React.ElementType; desc: string }[] = [
        { value: 'all', label: 'All Users', icon: Users, desc: 'Patients & doctors' },
        { value: 'patients', label: 'Patients', icon: UserCircle, desc: 'Patients only' },
        { value: 'doctors', label: 'Doctors', icon: Stethoscope, desc: 'Doctors only' },
    ];

    const typeOptions: { value: NotifType; label: string; color: string }[] = [
        { value: 'admin_alert', label: 'Admin Alert', color: 'bg-amber-100 text-amber-700 border-amber-200' },
        { value: 'system', label: 'System Notice', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-amber-600 font-medium">
                        <Megaphone className="h-4 w-4" />
                        <span>Notifications Center</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Send Notifications</h1>
                    <p className="text-slate-500">Broadcast alerts and messages to your users in real-time.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
                {/* ── Compose Panel ── */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="border-0 shadow-md">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Send className="h-5 w-5 text-teal-600" />
                                Compose Notification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Target Group */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Send to</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {targetOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setTarget(opt.value)}
                                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                                                target === opt.value
                                                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                                                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                            }`}
                                        >
                                            <opt.icon className="h-5 w-5" />
                                            <span className="text-sm font-medium">{opt.label}</span>
                                            <span className="text-[10px] text-slate-400">{opt.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notification Type */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Notification Type</label>
                                <div className="flex gap-2">
                                    {typeOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setType(opt.value)}
                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                                                type === opt.value
                                                    ? opt.color + ' ring-2 ring-offset-1 ring-teal-400'
                                                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                                <Input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. Scheduled Maintenance Tonight"
                                    className="border-slate-200 focus:border-teal-400 focus:ring-teal-400"
                                    maxLength={100}
                                />
                                <p className="text-xs text-slate-400 mt-1">{title.length}/100</p>
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Write your notification message here..."
                                    rows={3}
                                    maxLength={500}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none resize-none"
                                />
                                <p className="text-xs text-slate-400 mt-1">{message.length}/500</p>
                            </div>

                            {/* Action URL (optional) */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Action Link <span className="text-slate-400 font-normal">(optional)</span>
                                </label>
                                <Input
                                    value={actionUrl}
                                    onChange={e => setActionUrl(e.target.value)}
                                    placeholder="/dashboard/appointments"
                                    className="border-slate-200 focus:border-teal-400 focus:ring-teal-400"
                                />
                                <p className="text-xs text-slate-400 mt-1">Users will be redirected here when they click the notification</p>
                            </div>

                            {/* Result Banner */}
                            {result && (
                                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
                                    result.success
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                    {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    {result.message}
                                </div>
                            )}

                            {/* Send Button */}
                            <Button
                                onClick={handleSend}
                                disabled={sending || !title.trim() || !message.trim()}
                                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold py-5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {sending ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Sending...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Send className="h-4 w-4" />
                                        Send to {target === 'all' ? 'All Users' : target === 'patients' ? 'Patients' : 'Doctors'}
                                    </div>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Sent History Panel ── */}
                <div className="lg:col-span-2">
                    <Card className="border-0 shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-slate-400" />
                                Recent Broadcasts
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={fetchHistory} className="h-8 w-8">
                                <RefreshCw className={`h-4 w-4 text-slate-400 ${loadingHistory ? 'animate-spin' : ''}`} />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loadingHistory ? (
                                <div className="space-y-3">
                                    {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                                </div>
                            ) : history.length === 0 ? (
                                <div className="py-8 text-center text-slate-400">
                                    <Megaphone className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm font-medium">No notifications sent yet</p>
                                    <p className="text-xs mt-1">Compose your first broadcast</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                    {/* Group by unique title+message+created_at (within 1 second) */}
                                    {deduplicateNotifications(history).map(notif => (
                                        <div key={notif.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">{notif.title}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                                </div>
                                                <Badge variant="secondary" className="text-[10px] shrink-0">
                                                    {notif.type === 'admin_alert' ? 'Alert' : 'System'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] text-slate-400">
                                                    {new Date(notif.created_at).toLocaleString('en-IN', {
                                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                                {typeof notif.metadata?.target_group === 'string' && (
                                                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                                                        → {notif.metadata.target_group}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

/** Deduplicate batch-sent notifications by title+message+timestamp proximity */
function deduplicateNotifications(notifications: SentNotification[]): SentNotification[] {
    const seen = new Map<string, SentNotification>();

    for (const n of notifications) {
        // Create a key from title + message + timestamp rounded to 5 seconds
        const ts = Math.floor(new Date(n.created_at).getTime() / 5000);
        const key = `${n.title}|${n.message}|${ts}`;
        if (!seen.has(key)) {
            seen.set(key, n);
        }
    }

    return Array.from(seen.values());
}
