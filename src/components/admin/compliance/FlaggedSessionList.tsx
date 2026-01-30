"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { FlaggedSessionDialog } from "./FlaggedSessionDialog";
import { Search, Filter, AlertTriangle, Eye } from "lucide-react";

interface FlaggedSession {
    id: string;
    consultation_id: string;
    user_id: string;
    flag_type: string;
    severity: 'low' | 'medium' | 'high' | 'urgent';
    description: string;
    flagged_by: string;
    status: string;
    created_at: string;
    user: {
        email: string;
        full_name: string;
    };
}

export function FlaggedSessionList() {
    const [sessions, setSessions] = useState<FlaggedSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>("pending");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSession, setSelectedSession] = useState<FlaggedSession | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('flagged_sessions')
                .select('*')
                .order('created_at', { ascending: false });

            if (filterStatus !== "all") {
                query = query.eq('status', filterStatus);
            }

            const { data: sessionsData, error } = await query;

            if (error) throw error;

            if (sessionsData && sessionsData.length > 0) {
                // Manually fetch profiles to ensure we get user data
                const userIds = Array.from(new Set(sessionsData.map((s: any) => s.user_id)));
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, email, full_name')
                    .in('id', userIds);

                const profileMap = new Map(profiles?.map((p: any) => [p.id, p]));

                const enrichedSessions = sessionsData.map((s: any) => ({
                    ...s,
                    user: profileMap.get(s.user_id) || { email: 'Unknown', full_name: 'Unknown User' }
                }));

                setSessions(enrichedSessions);
            } else {
                setSessions([]);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();

        // Real-time subscription for updates
        const channel = supabase
            .channel('flagged_sessions_list')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'flagged_sessions' },
                () => {
                    fetchSessions();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [filterStatus]);

    const handleReview = (session: FlaggedSession) => {
        setSelectedSession(session);
        setDialogOpen(true);
    };

    const getSeverityBadge = (severity: string) => {
        const styles = {
            urgent: "bg-red-500 hover:bg-red-600 border-red-600 text-white",
            high: "bg-orange-500 hover:bg-orange-600 border-orange-600 text-white",
            medium: "bg-yellow-500 hover:bg-yellow-600 border-yellow-600 text-black",
            low: "bg-blue-500 hover:bg-blue-600 border-blue-600 text-white",
        };
        return (
            <Badge variant="outline" className={`${styles[severity as keyof typeof styles]} capitalize`}>
                {severity}
            </Badge>
        );
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: "bg-slate-100 text-slate-800 border-slate-200",
            reviewing: "bg-purple-100 text-purple-800 border-purple-200",
            resolved: "bg-green-100 text-green-800 border-green-200",
            dismissed: "bg-gray-100 text-gray-800 border-gray-200",
        };
        return (
            <Badge variant="outline" className={`${styles[status as keyof typeof styles]} capitalize`}>
                {status}
            </Badge>
        );
    };

    const filteredSessions = sessions.filter(session =>
        session.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.flag_type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search flags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[180px]">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="reviewing">Reviewing</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="dismissed">Dismissed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline" onClick={fetchSessions}>
                    Refresh List
                </Button>
            </div>

            {/* Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Flagged Sessions
                    </CardTitle>
                    <CardDescription>
                        Monitor and resolve flagged consultations to ensure platform safety.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead className="hidden md:table-cell">Description</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredSessions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No flagged sessions found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSessions.map((session) => (
                                        <TableRow key={session.id}>
                                            <TableCell>{getSeverityBadge(session.severity)}</TableCell>
                                            <TableCell className="font-medium capitalize">{session.flag_type}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{session.user?.full_name || 'Unknown'}</span>
                                                    <span className="text-xs text-muted-foreground">{session.user?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell max-w-[200px] truncate" title={session.description}>
                                                {session.description}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(session.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleReview(session)}
                                                    className="gap-2 hover:bg-slate-100"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Review
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <FlaggedSessionDialog
                session={selectedSession}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onStatusChange={fetchSessions}
            />
        </div>
    );
}
