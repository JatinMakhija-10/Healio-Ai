"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
    Search,
    Users,
    ChevronRight,
    Shield,
    Stethoscope,
    UserCircle,
    RefreshCw,
    UserCog,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Profile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    role: "patient" | "doctor" | "admin";
    created_at: string;
    phone?: string;
}

const roleConfig: Record<string, { label: string; className: string; icon: typeof Shield }> = {
    admin: { label: "Admin", className: "bg-purple-50 text-purple-700 border-purple-200", icon: Shield },
    doctor: { label: "Doctor", className: "bg-blue-50 text-blue-700 border-blue-200", icon: Stethoscope },
    patient: { label: "Patient", className: "bg-slate-50 text-slate-700 border-slate-200", icon: UserCircle },
};

export default function UsersListPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [roleChangeTarget, setRoleChangeTarget] = useState<Profile | null>(null);
    const [newRole, setNewRole] = useState<string>("");
    const [changingRole, setChangingRole] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getInitials = (name: string) =>
        name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "U";

    const handleRoleChange = async () => {
        if (!roleChangeTarget || !newRole) return;
        try {
            setChangingRole(true);
            const { error } = await supabase
                .from("profiles")
                .update({ role: newRole })
                .eq("id", roleChangeTarget.id);

            if (error) throw error;

            setUsers((prev) =>
                prev.map((u) =>
                    u.id === roleChangeTarget.id ? { ...u, role: newRole as Profile["role"] } : u
                )
            );
            toast.success(`${roleChangeTarget.full_name || "User"}'s role changed to ${newRole}`);
            setRoleChangeTarget(null);
        } catch (error) {
            console.error("Error changing role:", error);
            toast.error("Failed to change user role");
        } finally {
            setChangingRole(false);
        }
    };

    const roleCounts = {
        patient: users.filter((u) => u.role === "patient").length,
        doctor: users.filter((u) => u.role === "doctor").length,
        admin: users.filter((u) => u.role === "admin").length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <Users className="h-6 w-6 text-purple-600" />
                    User Management
                </h1>
                <p className="text-slate-500 mt-1">
                    View and manage all registered users, change roles, and view detailed profiles.
                </p>
            </div>

            {/* Role Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total", count: users.length, color: "text-slate-900", bg: "bg-slate-50 border-slate-200" },
                    { label: "Patients", count: roleCounts.patient, color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
                    { label: "Doctors", count: roleCounts.doctor, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
                    { label: "Admins", count: roleCounts.admin, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
                ].map((stat) => (
                    <div key={stat.label} className={`border rounded-xl p-3 text-center cursor-pointer ${stat.bg}`}
                        onClick={() => setRoleFilter(stat.label === "Total" ? "all" : stat.label.toLowerCase().slice(0, -1))}>
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.count}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={fetchUsers} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
                <span className="text-sm text-slate-500">{filteredUsers.length} users</span>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="w-[300px] font-semibold">User</TableHead>
                                <TableHead className="font-semibold">Role</TableHead>
                                <TableHead className="font-semibold">Joined</TableHead>
                                <TableHead className="font-semibold">Phone</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading
                                ? Array(6).fill(0).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                                : filteredUsers.length === 0
                                    ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                                No users found.
                                            </TableCell>
                                        </TableRow>
                                    )
                                    : filteredUsers.map((user) => {
                                        const rc = roleConfig[user.role] || roleConfig.patient;
                                        const RoleIcon = rc.icon;
                                        return (
                                            <TableRow key={user.id} className="hover:bg-slate-50/50">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarImage src={user.avatar_url} />
                                                            <AvatarFallback className="bg-purple-100 text-purple-700">
                                                                {getInitials(user.full_name || user.email)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium text-slate-900">
                                                                {user.full_name || "Unnamed User"}
                                                            </div>
                                                            <div className="text-xs text-slate-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`capitalize gap-1 ${rc.className}`}>
                                                        <RoleIcon className="w-3 h-3" />
                                                        {user.role || "patient"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">
                                                    {user.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : "N/A"}
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">
                                                    {user.phone || "—"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="gap-1 text-slate-600"
                                                            onClick={() => {
                                                                setRoleChangeTarget(user);
                                                                setNewRole(user.role);
                                                            }}
                                                        >
                                                            <UserCog className="h-4 w-4" />
                                                            Role
                                                        </Button>
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/admin/users/${user.id}`}>
                                                                Profile
                                                                <ChevronRight className="ml-1 h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Role Change Dialog */}
            <Dialog open={!!roleChangeTarget} onOpenChange={(open) => !open && setRoleChangeTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change User Role</DialogTitle>
                        <DialogDescription>
                            Update the role for <strong>{roleChangeTarget?.full_name || roleChangeTarget?.email}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2 py-2">
                        <Select value={newRole} onValueChange={setNewRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select new role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="patient">Patient</SelectItem>
                                <SelectItem value="doctor">Doctor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        {newRole === "admin" && (
                            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                                ⚠️ Admins have full access to the admin dashboard and all user data.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRoleChangeTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRoleChange}
                            disabled={changingRole || newRole === roleChangeTarget?.role}
                        >
                            {changingRole ? "Updating..." : "Update Role"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
