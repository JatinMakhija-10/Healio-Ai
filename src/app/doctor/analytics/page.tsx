"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DollarSign,
    Users,
    ArrowUpRight,
    Download,
    Clock,
    CheckCircle2,
    FileText
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { invoiceService } from "@/lib/invoices/invoiceService";
import { paymentService, Transaction } from "@/lib/payments/paymentService";
import { appointmentService } from "@/lib/appointments/appointmentService";
import { supabase } from "@/lib/supabase";

interface RevenueSummary {
    totalRevenue: number;
    pendingRevenue: number;
    approvedRevenue: number;
    paidRevenue: number;
    totalInvoices: number;
    pendingInvoices: number;
    approvedInvoices: number;
    paidInvoices: number;
}

export default function DoctorRevenuePage() {
    const [loading, setLoading] = useState(true);
    const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null);
    const [recentPayouts, setRecentPayouts] = useState<Transaction[]>([]);
    const [totalConsultations, setTotalConsultations] = useState(0);
    const [period, setPeriod] = useState("30d");
    const [doctorId, setDoctorId] = useState<string | null>(null);

    useEffect(() => {
        loadDoctorData();
    }, [period]);

    async function loadDoctorData() {
        try {
            setLoading(true);


            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                console.error('Error getting user:', userError);
                return;
            }

            // Get doctor ID from doctors table
            const { data: doctorData, error: doctorError } = await supabase
                .from('doctors')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (doctorError || !doctorData) {
                console.error('Error getting doctor:', doctorError);
                return;
            }

            setDoctorId(doctorData.id);

            // Calculate date range
            const dateRange = getDateRange(period);

            // Load revenue summary
            const summary = await invoiceService.getDoctorRevenueSummary(
                doctorData.id,
                dateRange.startDate,
                dateRange.endDate
            );
            setRevenueSummary(summary);

            // Load recent payouts
            const payouts = await paymentService.getDoctorPayouts(doctorData.id);
            setRecentPayouts(payouts.slice(0, 5)); // Get last 5 payouts

            // Load consultation count
            const appointments = await appointmentService.getCompletedAppointments(
                doctorData.id,
                dateRange.startDate,
                dateRange.endDate
            );
            setTotalConsultations(appointments.length);

        } catch (error) {
            console.error('Error loading revenue data:', error);
        } finally {
            setLoading(false);
        }
    }

    function getDateRange(period: string) {
        const now = new Date();
        const endDate = now.toISOString();
        let startDate = new Date();

        switch (period) {
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(now.getDate() - 90);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear(), 0, 1);
                break;
            default:
                startDate.setDate(now.getDate() - 30);
        }

        return {
            startDate: startDate.toISOString(),
            endDate
        };
    }

    function formatCurrency(amount: number): string {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading revenue data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Revenue & Analytics</h1>
                    <p className="text-slate-500">Track your earnings, invoices, and payouts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[140px] bg-white">
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 3 months</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="gap-2 bg-white">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-teal-100 rounded-xl">
                                <DollarSign className="h-6 w-6 text-teal-600" />
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Paid
                            </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            {formatCurrency(revenueSummary?.paidRevenue || 0)}
                        </h3>
                        <p className="text-xs text-slate-400 mt-2">
                            {revenueSummary?.paidInvoices || 0} paid invoices
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <Clock className="h-6 w-6 text-amber-600" />
                            </div>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                                Pending
                            </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-500">Pending Revenue</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            {formatCurrency(revenueSummary?.pendingRevenue || 0)}
                        </h3>
                        <p className="text-xs text-slate-400 mt-2">
                            {revenueSummary?.pendingInvoices || 0} awaiting approval
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <ArrowUpRight className="h-6 w-6 text-blue-600" />
                            </div>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                                Approved
                            </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-500">Approved Revenue</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            {formatCurrency(revenueSummary?.approvedRevenue || 0)}
                        </h3>
                        <p className="text-xs text-slate-400 mt-2">
                            {revenueSummary?.approvedInvoices || 0} processing
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500">Consultations</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalConsultations}</h3>
                        <p className="text-xs text-slate-400 mt-2">Completed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Invoice Breakdown */}
            <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Invoice Status Overview</CardTitle>
                        <CardDescription>Breakdown of your invoices by status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Paid Invoices</p>
                                        <p className="text-sm text-slate-500">{revenueSummary?.paidInvoices || 0} invoices</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-green-700">
                                        {formatCurrency(revenueSummary?.paidRevenue || 0)}
                                    </p>
                                    <p className="text-xs text-green-600">Revenue received</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <Clock className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Pending Invoices</p>
                                        <p className="text-sm text-slate-500">{revenueSummary?.pendingInvoices || 0} invoices</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-amber-700">
                                        {formatCurrency(revenueSummary?.pendingRevenue || 0)}
                                    </p>
                                    <p className="text-xs text-amber-600">Awaiting approval</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Approved Invoices</p>
                                        <p className="text-sm text-slate-500">{revenueSummary?.approvedInvoices || 0} invoices</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-blue-700">
                                        {formatCurrency(revenueSummary?.approvedRevenue || 0)}
                                    </p>
                                    <p className="text-xs text-blue-600">Being processed</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                        <CardDescription>Performance summary</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-600">Total Invoices</span>
                                <span className="font-bold text-slate-900">{revenueSummary?.totalInvoices || 0}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-teal-500 rounded-full"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-600">Paid Rate</span>
                                <span className="font-bold text-slate-900">
                                    {revenueSummary?.totalInvoices
                                        ? Math.round((revenueSummary.paidInvoices / revenueSummary.totalInvoices) * 100)
                                        : 0}%
                                </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full"
                                    style={{
                                        width: revenueSummary?.totalInvoices
                                            ? `${(revenueSummary.paidInvoices / revenueSummary.totalInvoices) * 100}%`
                                            : '0%'
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-600">Avg per Consult</span>
                                <span className="font-bold text-slate-900">
                                    {formatCurrency(
                                        totalConsultations > 0
                                            ? (revenueSummary?.paidRevenue || 0) / totalConsultations
                                            : 0
                                    )}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Payouts Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Payouts</CardTitle>
                            <CardDescription>Latest transfers to your account</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="text-teal-600">View All</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {recentPayouts.length === 0 ? (
                        <div className="text-center py-8">
                            <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No payouts yet</p>
                            <p className="text-sm text-slate-400 mt-1">
                                Complete consultations and send invoices to start earning
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Transaction ID</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3 rounded-r-lg">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentPayouts.map((payout) => (
                                        <tr key={payout.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-medium text-slate-900">{payout.transaction_id}</td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {payout.processed_at ? formatDate(payout.processed_at) : 'Pending'}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-900">
                                                {formatCurrency(payout.amount)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        payout.status === 'completed'
                                                            ? "bg-green-50 text-green-700 border-green-200"
                                                            : "bg-amber-50 text-amber-700 border-amber-200"
                                                    }
                                                >
                                                    {payout.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
