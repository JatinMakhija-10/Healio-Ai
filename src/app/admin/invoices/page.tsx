"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Clock,
    CheckCircle2,
    XCircle,
    FileText,
    DollarSign,
    User,
    Calendar,
    AlertCircle
} from "lucide-react";
import { invoiceService, Invoice } from "@/lib/invoices/invoiceService";
import { paymentService } from "@/lib/payments/paymentService";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminInvoicesPage() {
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(null);
    const [adminId, setAdminId] = useState<string | null>(null);

    // Modal state for rejection reason
    const [rejectingInvoice, setRejectingInvoice] = useState<Invoice | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        loadInvoices();
    }, [filter]);

    async function loadInvoices() {
        try {
            setLoading(true);


            // Get current user (admin)
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                console.error('Error getting user:', userError);
                return;
            }

            setAdminId(user.id);

            // Load all invoices for counts
            const allInvoiceData = await invoiceService.getAllInvoices();
            setAllInvoices(allInvoiceData);

            // Filter for display
            if (filter === 'all') {
                setInvoices(allInvoiceData);
            } else {
                setInvoices(allInvoiceData.filter(i => i.status === filter));
            }
        } catch (error) {
            console.error('Error loading invoices:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(invoice: Invoice) {
        if (!adminId) return;

        try {
            setProcessingInvoiceId(invoice.id);

            // Approve invoice
            await invoiceService.approveInvoice(invoice.id, undefined, adminId);

            // Process payment
            await paymentService.processInvoicePayment(invoice.id);

            toast.success('Invoice approved and payment processed!');

            // Reload invoices
            await loadInvoices();
        } catch (error) {
            console.error('Error approving invoice:', error);
            toast.error('Failed to approve invoice');
        } finally {
            setProcessingInvoiceId(null);
        }
    }

    async function handleReject() {
        if (!adminId || !rejectingInvoice) return;

        if (!rejectionReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        try {
            setProcessingInvoiceId(rejectingInvoice.id);

            await invoiceService.rejectInvoice(rejectingInvoice.id, rejectionReason, adminId);

            toast.success('Invoice rejected');

            // Close modal and reload
            setRejectingInvoice(null);
            setRejectionReason("");
            await loadInvoices();
        } catch (error) {
            console.error('Error rejecting invoice:', error);
            toast.error('Failed to reject invoice');
        } finally {
            setProcessingInvoiceId(null);
        }
    }

    function formatCurrency(amount: number): string {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const filterCounts = {
        all: allInvoices.length,
        pending: allInvoices.filter(i => i.status === 'pending').length,
        approved: allInvoices.filter(i => i.status === 'approved').length,
        rejected: allInvoices.filter(i => i.status === 'rejected').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading invoices...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Invoice Management</h1>
                <p className="text-slate-500">Review and approve doctor invoices</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 font-medium transition-colors relative ${filter === status
                            ? 'text-teal-600 border-b-2 border-teal-600'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <span className="capitalize">{status}</span>
                        <Badge variant="outline" className="ml-2">
                            {status === 'all' ? filterCounts.all :
                                status === 'pending' ? filterCounts.pending :
                                    status === 'approved' ? filterCounts.approved :
                                        filterCounts.rejected}
                        </Badge>
                    </button>
                ))}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Pending</p>
                                <p className="text-xl font-bold text-slate-900">{filterCounts.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Approved</p>
                                <p className="text-xl font-bold text-slate-900">{filterCounts.approved}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <XCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Rejected</p>
                                <p className="text-xl font-bold text-slate-900">{filterCounts.rejected}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total</p>
                                <p className="text-xl font-bold text-slate-900">{filterCounts.all}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Invoice List */}
            <div className="space-y-4">
                {invoices.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No {filter !== 'all' && filter} invoices found</p>
                        </CardContent>
                    </Card>
                ) : (
                    invoices.map((invoice) => (
                        <InvoiceCard
                            key={invoice.id}
                            invoice={invoice}
                            onApprove={handleApprove}
                            onReject={(inv) => {
                                setRejectingInvoice(inv);
                                setRejectionReason("");
                            }}
                            processing={processingInvoiceId === invoice.id}
                        />
                    ))
                )}
            </div>

            {/* Rejection Modal */}
            {rejectingInvoice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-md w-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-5 w-5" />
                                Reject Invoice
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-600">
                                Invoice: <span className="font-mono">{rejectingInvoice.invoice_number}</span>
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Rejection Reason *
                                </label>
                                <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Please provide a detailed reason for rejecting this invoice..."
                                    rows={4}
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setRejectingInvoice(null);
                                        setRejectionReason("");
                                    }}
                                    className="flex-1"
                                    disabled={processingInvoiceId === rejectingInvoice.id}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleReject}
                                    disabled={processingInvoiceId === rejectingInvoice.id || !rejectionReason.trim()}
                                    className="flex-1 bg-red-600 hover:bg-red-700"
                                >
                                    {processingInvoiceId === rejectingInvoice.id ? 'Processing...' : 'Reject Invoice'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

function InvoiceCard({
    invoice,
    onApprove,
    onReject,
    processing
}: {
    invoice: Invoice;
    onApprove: (invoice: Invoice) => void;
    onReject: (invoice: Invoice) => void;
    processing: boolean;
}) {
    const [doctorName, setDoctorName] = useState("Loading...");
    const [patientName, setPatientName] = useState("Loading...");

    useEffect(() => {
        loadNames();
    }, [invoice]);

    async function loadNames() {


        // Get doctor name
        const { data: doctorData } = await supabase
            .from('doctors')
            .select('user_id')
            .eq('id', invoice.doctor_id)
            .single();

        if (doctorData) {
            const { data: doctorProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', doctorData.user_id)
                .single();
            setDoctorName(doctorProfile?.full_name || 'Unknown');
        }

        // Get patient name
        const { data: patientProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', invoice.patient_id)
            .single();
        setPatientName(patientProfile?.full_name || 'Unknown');
    }

    const statusConfig = {
        pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
        approved: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2 },
        rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
        paid: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
        cancelled: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: XCircle },
    };

    const config = statusConfig[invoice.status];
    const StatusIcon = config.icon;

    function formatCurrency(amount: number): string {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-mono text-lg font-bold text-slate-900">
                                {invoice.invoice_number}
                            </h3>
                            <Badge variant="outline" className={config.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <User className="h-4 w-4" />
                                <span>Doctor: <span className="font-medium text-slate-900">{doctorName}</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <User className="h-4 w-4" />
                                <span>Patient: <span className="font-medium text-slate-900">{patientName}</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(invoice.submitted_at)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-sm text-slate-500 mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(invoice.total_amount)}</p>
                    </div>
                </div>

                {/* Financial Breakdown */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg mb-4">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Consultation Fee</p>
                        <p className="font-semibold text-slate-900">{formatCurrency(invoice.consultation_fee)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Platform Fee ({invoice.platform_fee_percentage}%)</p>
                        <p className="font-semibold text-red-600">- {formatCurrency(invoice.platform_fee)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Doctor Payout</p>
                        <p className="font-semibold text-green-600">{formatCurrency(invoice.doctor_payout)}</p>
                    </div>
                </div>

                {/* Admin Notes */}
                {invoice.admin_notes && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Admin Notes:</p>
                        <p className="text-sm text-blue-800">{invoice.admin_notes}</p>
                    </div>
                )}

                {/* Rejection Reason */}
                {invoice.rejection_reason && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-semibold text-red-900 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-800">{invoice.rejection_reason}</p>
                    </div>
                )}

                {/* Actions */}
                {invoice.status === 'pending' && (
                    <div className="flex gap-3 mt-4">
                        <Button
                            onClick={() => onReject(invoice)}
                            variant="outline"
                            disabled={processing}
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                        </Button>
                        <Button
                            onClick={() => onApprove(invoice)}
                            disabled={processing}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            {processing ? 'Processing...' : 'Approve & Pay'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
