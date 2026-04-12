"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Shield, UserCheck, MoreHorizontal } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UserRow {
    id: string;
    email: string | null;
    full_name: string | null;
    role: string;
    created_at: string;
    updated_at: string;
}

const ROLE_COLORS: Record<string, string> = {
    admin:   "bg-red-100 text-red-700",
    doctor:  "bg-blue-100 text-blue-700",
    patient: "bg-green-100 text-green-700",
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [filtered, setFiltered] = useState<UserRow[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from("profiles")
            .select("id, email, full_name, role, created_at, updated_at")
            .order("created_at", { ascending: false })
            .limit(200);
        setUsers(data || []);
        setFiltered(data || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(
            users.filter(u =>
                (u.email || "").toLowerCase().includes(q) ||
                (u.full_name || "").toLowerCase().includes(q) ||
                u.role.includes(q)
            )
        );
    }, [search, users]);

    const promoteRole = async (userId: string, newRole: string) => {
        setActionLoading(userId);
        await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
        await fetchUsers();
        setActionLoading(null);
    };

    const stats = {
        total:    users.length,
        patients: users.filter(u => u.role === "patient").length,
        doctors:  users.filter(u => u.role === "doctor").length,
        admins:   users.filter(u => u.role === "admin").length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-1">
                    <Users className="h-4 w-4" />
                    <span>User Management</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900">All Users</h1>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Total Users",   value: stats.total,    color: "text-slate-700",  bg: "bg-slate-50" },
                    { label: "Patients",      value: stats.patients, color: "text-green-700",  bg: "bg-green-50" },
                    { label: "Doctors",       value: stats.doctors,  color: "text-blue-700",   bg: "bg-blue-50" },
                    { label: "Admins",        value: stats.admins,   color: "text-red-700",    bg: "bg-red-50" },
                ].map(s => (
                    <Card key={s.label} className={`border-0 ${s.bg}`}>
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-500">{s.label}</p>
                            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{loading ? "—" : s.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle>User Directory</CardTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name, email, or role..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 bg-slate-50"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-y border-slate-100">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-slate-500 font-medium">Name</th>
                                        <th className="text-left px-6 py-3 text-slate-500 font-medium">Email</th>
                                        <th className="text-left px-6 py-3 text-slate-500 font-medium">Role</th>
                                        <th className="text-left px-6 py-3 text-slate-500 font-medium">Joined</th>
                                        <th className="text-left px-6 py-3 text-slate-500 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(user => (
                                        <tr key={user.id} className="border-b last:border-0 hover:bg-slate-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                                                        {(user.full_name || user.email || "?")[0].toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-slate-900">
                                                        {user.full_name || "—"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{user.email || "—"}</td>
                                            <td className="px-6 py-4">
                                                <Badge className={`${ROLE_COLORS[user.role] || "bg-slate-100 text-slate-600"} border-0 text-xs`}>
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(user.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {user.role === "patient" && (
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            className="text-xs h-7 gap-1 text-blue-600 hover:text-blue-700"
                                                            disabled={actionLoading === user.id}
                                                            onClick={() => promoteRole(user.id, "doctor")}
                                                        >
                                                            <UserCheck className="h-3.5 w-3.5" />
                                                            Make Doctor
                                                        </Button>
                                                    )}
                                                    {user.role !== "admin" && (
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            className="text-xs h-7 gap-1 text-red-600 hover:text-red-700"
                                                            disabled={actionLoading === user.id}
                                                            onClick={() => promoteRole(user.id, "admin")}
                                                        >
                                                            <Shield className="h-3.5 w-3.5" />
                                                            Make Admin
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filtered.length === 0 && (
                                <div className="text-center text-slate-400 py-12">No users found</div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
