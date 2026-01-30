"use client";

import { useEffect, useState } from "react";
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
    Filter,
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

interface Transaction {
    id: string;
    patientName: string;
    doctorName: string;
    grossAmount: number;
    platformFee: number;
    netAmount: number;
    paymentStatus: "pending" | "processing" | "succeeded" | "failed" | "refunded";
    payoutStatus: "held" | "scheduled" | "processing" | "released" | "failed";
    createdAt: Date;
    appointmentDate: Date;
}

// Mock data
const mockTransactions: Transaction[] = [
    {
        id: "txn-001",
        patientName: "Priya Sharma",
        doctorName: "Dr. Aisha Patel",
        grossAmount: 500,
        platformFee: 100,
        netAmount: 400,
        paymentStatus: "succeeded",
        payoutStatus: "released",
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        appointmentDate: new Date(Date.now() - 1000 * 60 * 60),
    },
    {
        id: "txn-002",
        patientName: "Rahul Verma",
        doctorName: "Dr. Rajesh Kumar",
        grossAmount: 750,
        platformFee: 150,
        netAmount: 600,
        paymentStatus: "succeeded",
        payoutStatus: "held",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        appointmentDate: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    {
        id: "txn-003",
        patientName: "Anita Desai",
        doctorName: "Dr. Meera Sharma",
        grossAmount: 1000,
        platformFee: 200,
        netAmount: 800,
        paymentStatus: "succeeded",
        payoutStatus: "scheduled",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
        appointmentDate: new Date(Date.now() - 1000 * 60 * 60 * 6),
    },
    {
        id: "txn-004",
        patientName: "Vikram Singh",
        doctorName: "Dr. Aisha Patel",
        grossAmount: 500,
        platformFee: 100,
        netAmount: 400,
        paymentStatus: "refunded",
        payoutStatus: "failed",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        appointmentDate: new Date(Date.now() - 1000 * 60 * 60 * 25),
    },
    {
        id: "txn-005",
        patientName: "Sneha Gupta",
        doctorName: "Dr. Rajesh Kumar",
        grossAmount: 750,
        platformFee: 150,
        netAmount: 600,
        paymentStatus: "processing",
        payoutStatus: "held",
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
        appointmentDate: new Date(),
    },
];

const paymentStatusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
    pending: { label: "Pending", className: "bg-slate-100 text-slate-700", icon: Clock },
    processing: { label: "Processing", className: "bg-blue-100 text-blue-700", icon: RefreshCw },
    succeeded: { label: "Succeeded", className: "bg-green-100 text-green-700", icon: CheckCircle2 },
    failed: { label: "Failed", className: "bg-red-100 text-red-700", icon: AlertCircle },
    refunded: { label: "Refunded", className: "bg-amber-100 text-amber-700", icon: ArrowDownLeft },
};

const payoutStatusConfig: Record<string, { label: string; className: string }> = {
    held: { label: "Held", className: "bg-amber-100 text-amber-700 border-amber-200" },
    scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 border-blue-200" },
    processing: { label: "Processing", className: "bg-purple-100 text-purple-700 border-purple-200" },
    released: { label: "Released", className: "bg-green-100 text-green-700 border-green-200" },
    failed: { label: "Failed", className: "bg-red-100 text-red-700 border-red-200" },
};

export default function TransactionsPage() {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [payoutFilter, setPayoutFilter] = useState<string>("all");

    useEffect(() => {
        const timer = setTimeout(() => {
            setTransactions(mockTransactions);
            setLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    const filteredTransactions = transactions.filter((txn) => {
        const matchesSearch =
            txn.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            txn.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            txn.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPaymentStatus = statusFilter === "all" || txn.paymentStatus === statusFilter;
        const matchesPayoutStatus = payoutFilter === "all" || txn.payoutStatus === payoutFilter;
        return matchesSearch && matchesPaymentStatus && matchesPayoutStatus;
    });

    // Calculate stats
    const stats = {
        totalGMV: transactions.reduce((sum, t) => sum + t.grossAmount, 0),
        totalRevenue: transactions.reduce((sum, t) => sum + t.platformFee, 0),
        pendingPayouts: transactions
            .filter((t) => t.payoutStatus === "held" || t.payoutStatus === "scheduled")
            .reduce((sum, t) => sum + t.netAmount, 0),
        transactionCount: transactions.length,
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
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
                    <p className="text-slate-500 mt-1">Manage payments, refunds, and doctor payouts</p>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
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
                        title="Total GMV"
                        value={`₹${stats.totalGMV.toLocaleString()}`}
                        subtitle="gross merchandise value"
                        icon={CreditCard}
                        variant="purple"
                    />
                    <MetricCard
                        title="Platform Revenue"
                        value={`₹${stats.totalRevenue.toLocaleString()}`}
                        subtitle="20% commission"
                        icon={TrendingUp}
                        variant="teal"
                    />
                    <MetricCard
                        title="Pending Payouts"
                        value={`₹${stats.pendingPayouts.toLocaleString()}`}
                        subtitle="to be released"
                        icon={Wallet}
                        variant="amber"
                    />
                    <MetricCard
                        title="Transactions"
                        value={stats.transactionCount}
                        subtitle="total count"
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
                                <SelectValue placeholder="Payment Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Payments</SelectItem>
                                <SelectItem value="succeeded">Succeeded</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={payoutFilter} onValueChange={setPayoutFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Payout Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Payouts</SelectItem>
                                <SelectItem value="held">Held</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="released">Released</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Transactions</CardTitle>
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
                                        <TableHead className="font-semibold text-right">Amount</TableHead>
                                        <TableHead className="font-semibold text-right">Fee</TableHead>
                                        <TableHead className="font-semibold">Payment</TableHead>
                                        <TableHead className="font-semibold">Payout</TableHead>
                                        <TableHead className="font-semibold">Date</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.length > 0 ? (
                                        filteredTransactions.map((txn) => {
                                            const PaymentIcon = paymentStatusConfig[txn.paymentStatus].icon;
                                            return (
                                                <TableRow key={txn.id} className="hover:bg-slate-50">
                                                    <TableCell className="font-mono text-sm text-slate-600">
                                                        {txn.id}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{txn.patientName}</TableCell>
                                                    <TableCell className="text-slate-600">{txn.doctorName}</TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        ₹{txn.grossAmount.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-right text-slate-500">
                                                        ₹{txn.platformFee}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={`gap-1 ${paymentStatusConfig[txn.paymentStatus].className}`}
                                                        >
                                                            <PaymentIcon className="h-3 w-3" />
                                                            {paymentStatusConfig[txn.paymentStatus].label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={payoutStatusConfig[txn.payoutStatus].className}
                                                        >
                                                            {payoutStatusConfig[txn.payoutStatus].label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-slate-500">
                                                        {formatDate(txn.createdAt)}
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
                                            <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                                                No transactions found matching your filters.
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
