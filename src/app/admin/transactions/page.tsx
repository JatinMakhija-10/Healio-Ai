"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    CreditCard,
    Search,
    Download,
    ArrowLeft,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    CheckCircle2,
    Clock,
    AlertCircle,
    TrendingUp,
    Users,
    Wallet,
} from "lucide-react";
import Link from "next/link";
import { MetricCard } from "@/components/admin/MetricCard";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";

// Shape from DB (revenue_management migration)
interface DBTransaction {
    id: string;
    transaction_id: string;
    transaction_type: "payment" | "payout" | "refund" | "fee";
    amount: number;
    currency: string;
    payment_method?: string;
    status: "pending" | "processing" | "completed" | "failed" | "refunded";
    processed_at?: string;
    created_at: string;
    doctor_id: string;
    patient_id: string;
    invoice_id: string;
    metadata?: { type?: string };
}

interface EnrichedTransaction extends DBTransaction {
    patientName: string;
    doctorName: string;
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
    pending: { label: "Pending", className: "bg-slate-100 text-slate-700", icon: Clock },
    processing: { label: "Processing", className: "bg-blue-100 text-blue-700", icon: RefreshCw },
    completed: { label: "Completed", className: "bg-green-100 text-green-700", icon: CheckCircle2 },
    failed: { label: "Failed", className: "bg-red-100 text-red-700", icon: AlertCircle },
    refunded: { label: "Refunded", className: "bg-amber-100 text-amber-700", icon: ArrowDownLeft },
};

const typeConfig: Record<string, { label: string; className: string }> = {
    payment: { label: "Payment", className: "bg-purple-100 text-purple-700" },
    payout: { label: "Payout", className: "bg-blue-100 text-blue-700" },
    fee: { label: "Platform Fee", className: "bg-teal-100 text-teal-700" },
    refund: { label: "Refund", className: "bg-orange-100 text-orange-700" },
};

export default function TransactionsPage() {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch transactions with doctor and patient profile data
            const { data, error } = await supabase
                .from("transactions")
                .select(`
                    id,
                    transaction_id,
                    transaction_type,
                    amount,
                    currency,
                    payment_method,
                    status,
                    processed_at,
                    created_at,
                    doctor_id,
                    patient_id,
                    invoice_id,
                    metadata
                `)
                .order("created_at", { ascending: false })
                .limit(200);

            if (error) throw error;

            const txns = data || [];

            // Gather unique doctor and patient IDs for name lookup
            const doctorIds = [...new Set(txns.map((t) => t.doctor_id))];
            const patientIds = [...new Set(txns.map((t) => t.patient_id))];

            // Fetch doctor profiles
            const { data: doctorsData } = await supabase
                .from("doctors")
                .select("id, profiles!doctors_user_id_fkey(full_name)")
                .in("id", doctorIds);

            // Fetch patient profiles
            const { data: patientsData } = await supabase
                .from("profiles")
                .select("id, full_name")
                .in("id", patientIds);

            const doctorMap = Object.fromEntries(
                (doctorsData || []).map((d: any) => [d.id, d.profiles?.full_name || "Unknown Doctor"])
            );
            const patientMap = Object.fromEntries(
                (patientsData || []).map((p: any) => [p.id, p.full_name || "Unknown Patient"])
            );

            const enriched: EnrichedTransaction[] = txns.map((t) => ({
                ...(t as DBTransaction),
                patientName: patientMap[t.patient_id] || "Unknown Patient",
                doctorName: doctorMap[t.doctor_id] || "Unknown Doctor",
            }));

            setTransactions(enriched);
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const filteredTransactions = transactions.filter((txn) => {
        const matchesSearch =
            txn.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            txn.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            txn.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || txn.status === statusFilter;
        const matchesType = typeFilter === "all" || txn.transaction_type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    // Calculate stats
    const completedTxns = transactions.filter((t) => t.status === "completed");
    const stats = {
        totalVolume: completedTxns.reduce((sum, t) => sum + t.amount, 0),
        platformRevenue: completedTxns
            .filter((t) => t.transaction_type === "fee")
            .reduce((sum, t) => sum + t.amount, 0),
        pendingPayouts: transactions
            .filter((t) => t.transaction_type === "payout" && t.status === "pending")
            .reduce((sum, t) => sum + t.amount, 0),
        transactionCount: transactions.length,
    };

    const handleExportCSV = () => {
        const headers = ["ID", "Patient", "Doctor", "Type", "Amount", "Status", "Date"].join(",");
        const rows = filteredTransactions.map((t) =>
            [
                t.transaction_id || t.id,
                t.patientName,
                t.doctorName,
                t.transaction_type,
                t.amount,
                t.status,
                format(new Date(t.created_at), "yyyy-MM-dd HH:mm"),
            ].join(",")
        );
        const csv = [headers, ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exported successfully");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">Transaction Ledger</h1>
                    <p className="text-slate-500 mt-1">Real-time view of all platform payments and payouts</p>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2" onClick={handleExportCSV} disabled={loading}>
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button variant="outline" size="icon" onClick={fetchTransactions} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Stats */}
            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total Volume"
                        value={`₹${stats.totalVolume.toLocaleString("en-IN")}`}
                        subtitle="completed transactions"
                        icon={CreditCard}
                        variant="purple"
                    />
                    <MetricCard
                        title="Platform Revenue"
                        value={`₹${stats.platformRevenue.toLocaleString("en-IN")}`}
                        subtitle="commission earned"
                        icon={TrendingUp}
                        variant="teal"
                    />
                    <MetricCard
                        title="Pending Payouts"
                        value={`₹${stats.pendingPayouts.toLocaleString("en-IN")}`}
                        subtitle="to be released"
                        icon={Wallet}
                        variant="amber"
                    />
                    <MetricCard
                        title="Total Records"
                        value={stats.transactionCount}
                        subtitle="transaction entries"
                        icon={Users}
                        variant="blue"
                    />
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                type="search"
                                placeholder="Search by patient, doctor, or ID..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="payment">Payment</SelectItem>
                                <SelectItem value="payout">Payout</SelectItem>
                                <SelectItem value="fee">Platform Fee</SelectItem>
                                <SelectItem value="refund">Refund</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span>Transactions</span>
                        <span className="text-sm font-normal text-slate-500">{filteredTransactions.length} records</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-14" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="font-semibold">Transaction ID</TableHead>
                                        <TableHead className="font-semibold">Patient</TableHead>
                                        <TableHead className="font-semibold">Doctor</TableHead>
                                        <TableHead className="font-semibold">Type</TableHead>
                                        <TableHead className="font-semibold text-right">Amount</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="font-semibold">Date</TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.length > 0 ? (
                                        filteredTransactions.map((txn) => {
                                            const StatusIcon = statusConfig[txn.status]?.icon || Clock;
                                            return (
                                                <TableRow key={txn.id} className="hover:bg-slate-50">
                                                    <TableCell className="font-mono text-xs text-slate-600">
                                                        {txn.transaction_id || txn.id.slice(0, 8) + "…"}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{txn.patientName}</TableCell>
                                                    <TableCell className="text-slate-600">{txn.doctorName}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={typeConfig[txn.transaction_type]?.className}
                                                        >
                                                            {typeConfig[txn.transaction_type]?.label || txn.transaction_type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        ₹{txn.amount.toLocaleString("en-IN")}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={`gap-1 ${statusConfig[txn.status]?.className}`}
                                                        >
                                                            <StatusIcon className="h-3 w-3" />
                                                            {statusConfig[txn.status]?.label || txn.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-slate-500">
                                                        {format(new Date(txn.created_at), "dd MMM yyyy, HH:mm")}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <ArrowUpRight className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                                                {transactions.length === 0
                                                    ? "No transactions found in the database."
                                                    : "No transactions match your filters."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
