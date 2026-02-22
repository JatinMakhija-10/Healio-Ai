"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    UserCheck,
    Search,
    CheckCircle2,
    XCircle,
    MessageSquare,
    FileText,
    Clock,
    Calendar,
    Stethoscope,
    GraduationCap,
    MapPin,
    ExternalLink,
    ArrowLeft,
    RefreshCw,
    AlertCircle,
    IndianRupee,
    Star,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";

interface DoctorApplication {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    specialty: string[];
    qualification: string;
    experience_years: number;
    license_number?: string;
    license_document_url?: string;
    bio?: string;
    location?: string;
    consultation_fee: number;
    verification_status: "pending" | "approved" | "rejected" | "more_info_required";
    created_at: string;
    rating: number;
    rating_count: number;
    total_consultations: number;
}

const statusConfig = {
    pending: { label: "Pending Review", className: "bg-amber-100 text-amber-700 border-amber-200" },
    approved: { label: "Approved", className: "bg-green-100 text-green-700 border-green-200" },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200" },
    more_info_required: { label: "More Info Needed", className: "bg-blue-100 text-blue-700 border-blue-200" },
};

export default function DoctorVerificationPage() {
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [applications, setApplications] = useState<DoctorApplication[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorApplication | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [showMoreInfoDialog, setShowMoreInfoDialog] = useState(false);
    const [infoRequest, setInfoRequest] = useState("");

    const fetchDoctors = useCallback(async () => {
        try {
            setLoading(true);
            // Join doctors with profiles to get email and avatar
            const { data, error } = await supabase
                .from("doctors")
                .select(`
                    id,
                    user_id,
                    specialty,
                    qualification,
                    experience_years,
                    bio,
                    license_number,
                    license_document_url,
                    consultation_fee,
                    verification_status,
                    created_at,
                    rating,
                    rating_count,
                    total_consultations,
                    profiles!doctors_user_id_fkey (
                        full_name,
                        avatar_url,
                        email,
                        phone
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;

            const mapped = (data || []).map((d: any) => ({
                id: d.id,
                user_id: d.user_id,
                full_name: d.profiles?.full_name || "Unknown Doctor",
                email: d.profiles?.email || "",
                avatar_url: d.profiles?.avatar_url,
                specialty: d.specialty || [],
                qualification: d.qualification || "",
                experience_years: d.experience_years || 0,
                license_number: d.license_number,
                license_document_url: d.license_document_url,
                bio: d.bio,
                location: d.profiles?.phone, // using phone as proxy for location
                consultation_fee: d.consultation_fee || 0,
                verification_status: d.verification_status || "pending",
                created_at: d.created_at,
                rating: d.rating || 0,
                rating_count: d.rating_count || 0,
                total_consultations: d.total_consultations || 0,
            }));

            setApplications(mapped);
        } catch (error) {
            console.error("Error fetching doctors:", error);
            toast.error("Failed to load doctor applications");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    const filteredApplications = applications.filter((app) => {
        const matchesSearch =
            app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.specialty.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = statusFilter === "all" || app.verification_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleApprove = async (doctor: DoctorApplication) => {
        try {
            setActionLoading(true);
            const { error } = await supabase
                .from("doctors")
                .update({
                    verification_status: "approved",
                    verified: true,
                    verified_at: new Date().toISOString(),
                })
                .eq("id", doctor.id);

            if (error) throw error;

            // Update the profile role to 'doctor' if needed
            await supabase
                .from("profiles")
                .update({ role: "doctor" })
                .eq("id", doctor.user_id);

            setApplications((prev) =>
                prev.map((app) =>
                    app.id === doctor.id ? { ...app, verification_status: "approved" } : app
                )
            );
            if (selectedDoctor?.id === doctor.id) {
                setSelectedDoctor({ ...doctor, verification_status: "approved" });
            }
            toast.success(`Dr. ${doctor.full_name} has been approved!`);
        } catch (error) {
            console.error("Error approving doctor:", error);
            toast.error("Failed to approve doctor");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedDoctor) return;
        try {
            setActionLoading(true);
            const { error } = await supabase
                .from("doctors")
                .update({
                    verification_status: "rejected",
                    verified: false,
                    rejection_reason: rejectReason,
                })
                .eq("id", selectedDoctor.id);

            if (error) throw error;

            setApplications((prev) =>
                prev.map((app) =>
                    app.id === selectedDoctor.id ? { ...app, verification_status: "rejected" } : app
                )
            );
            setSelectedDoctor({ ...selectedDoctor, verification_status: "rejected" });
            setShowRejectDialog(false);
            setRejectReason("");
            toast.success("Application has been rejected.");
        } catch (error) {
            console.error("Error rejecting doctor:", error);
            toast.error("Failed to reject application");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRequestMoreInfo = async () => {
        if (!selectedDoctor) return;
        try {
            setActionLoading(true);
            const { error } = await supabase
                .from("doctors")
                .update({
                    verification_status: "more_info_required",
                })
                .eq("id", selectedDoctor.id);

            if (error) throw error;

            setApplications((prev) =>
                prev.map((app) =>
                    app.id === selectedDoctor.id
                        ? { ...app, verification_status: "more_info_required" }
                        : app
                )
            );
            setSelectedDoctor({ ...selectedDoctor, verification_status: "more_info_required" });
            setShowMoreInfoDialog(false);
            setInfoRequest("");
            toast.success("Information request sent to doctor.");
        } catch (error) {
            console.error("Error updating doctor:", error);
            toast.error("Failed to send information request");
        } finally {
            setActionLoading(false);
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    };

    const pendingCount = applications.filter((a) => a.verification_status === "pending").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900">Doctor Verification</h1>
                        {pendingCount > 0 && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                {pendingCount} pending
                            </Badge>
                        )}
                    </div>
                    <p className="text-slate-500 mt-1">Review and verify doctor credentials from the database</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            type="search"
                            placeholder="Search by name or specialty..."
                            className="pl-10 w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Filter status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="more_info_required">More Info</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchDoctors} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total", count: applications.length, color: "text-slate-700", bg: "bg-slate-50" },
                    { label: "Pending", count: applications.filter(a => a.verification_status === "pending").length, color: "text-amber-700", bg: "bg-amber-50" },
                    { label: "Approved", count: applications.filter(a => a.verification_status === "approved").length, color: "text-green-700", bg: "bg-green-50" },
                    { label: "Rejected", count: applications.filter(a => a.verification_status === "rejected").length, color: "text-red-700", bg: "bg-red-50" },
                ].map((stat) => (
                    <div key={stat.label} className={`${stat.bg} rounded-xl p-3 text-center`}>
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.count}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Applications List */}
                <div className="lg:col-span-1 space-y-3">
                    <div className="text-sm font-medium text-slate-500 mb-2">
                        {filteredApplications.length} applications
                    </div>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-24" />
                            ))}
                        </div>
                    ) : filteredApplications.length > 0 ? (
                        filteredApplications.map((doctor) => {
                            const initials = doctor.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2);

                            return (
                                <Card
                                    key={doctor.id}
                                    className={`cursor-pointer transition-all hover:shadow-md ${selectedDoctor?.id === doctor.id
                                        ? "ring-2 ring-purple-500 border-purple-200"
                                        : ""
                                        }`}
                                    onClick={() => setSelectedDoctor(doctor)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex gap-3">
                                            <Avatar className="h-12 w-12">
                                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-slate-900 truncate">
                                                        {doctor.full_name}
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-slate-500 truncate">
                                                    {doctor.specialty.length > 0 ? doctor.specialty.join(", ") : "No specialty set"}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] ${statusConfig[doctor.verification_status].className}`}
                                                    >
                                                        {statusConfig[doctor.verification_status].label}
                                                    </Badge>
                                                    <span className="text-xs text-slate-400">
                                                        {getTimeAgo(doctor.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    ) : (
                        <Card className="border-dashed">
                            <CardContent className="p-8 text-center text-slate-500">
                                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                <p className="font-medium">No applications found</p>
                                <p className="text-sm mt-1">No doctors match your current filters</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Detail Panel */}
                <div className="lg:col-span-2">
                    {selectedDoctor ? (
                        <Card className="sticky top-6">
                            <CardHeader className="border-b pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <Avatar className="h-16 w-16 ring-4 ring-purple-100">
                                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white text-xl">
                                                {selectedDoctor.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-xl">{selectedDoctor.full_name}</CardTitle>
                                            <p className="text-slate-500">{selectedDoctor.email}</p>
                                            <Badge
                                                variant="outline"
                                                className={`mt-2 ${statusConfig[selectedDoctor.verification_status].className}`}
                                            >
                                                {statusConfig[selectedDoctor.verification_status].label}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* Info Grid */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                                        <Stethoscope className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">Specialization</p>
                                            <p className="text-sm text-slate-900">
                                                {selectedDoctor.specialty.length > 0
                                                    ? selectedDoctor.specialty.join(", ")
                                                    : "Not specified"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                                        <GraduationCap className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">Qualification</p>
                                            <p className="text-sm text-slate-900">{selectedDoctor.qualification || "Not specified"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                                        <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">Experience</p>
                                            <p className="text-sm text-slate-900">{selectedDoctor.experience_years} years</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                                        <IndianRupee className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">Consultation Fee</p>
                                            <p className="text-sm text-slate-900">₹{selectedDoctor.consultation_fee}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                                        <Star className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">Rating</p>
                                            <p className="text-sm text-slate-900">
                                                {selectedDoctor.rating > 0
                                                    ? `${selectedDoctor.rating.toFixed(1)} (${selectedDoctor.rating_count} reviews)`
                                                    : "No ratings yet"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                                        <UserCheck className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">Total Consultations</p>
                                            <p className="text-sm text-slate-900">{selectedDoctor.total_consultations}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Bio */}
                                {selectedDoctor.bio && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Bio</h4>
                                        <p className="text-sm text-slate-600 leading-relaxed">{selectedDoctor.bio}</p>
                                    </div>
                                )}

                                {/* License Info */}
                                {selectedDoctor.license_number && (
                                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-amber-600" />
                                                <div>
                                                    <p className="text-sm font-medium text-amber-900">Medical License</p>
                                                    <p className="text-xs text-amber-700">{selectedDoctor.license_number}</p>
                                                </div>
                                            </div>
                                            {selectedDoctor.license_document_url && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                                                    onClick={() => window.open(selectedDoctor.license_document_url, "_blank")}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                    View Document
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Timeline */}
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Calendar className="h-4 w-4" />
                                    <span>Applied {format(new Date(selectedDoctor.created_at), "PPP")}</span>
                                </div>

                                {/* Actions */}
                                {selectedDoctor.verification_status === "pending" && (
                                    <div className="flex gap-3 pt-4 border-t">
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                                            onClick={() => handleApprove(selectedDoctor)}
                                            disabled={actionLoading}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Approve
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                                            onClick={() => setShowMoreInfoDialog(true)}
                                            disabled={actionLoading}
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            Request Info
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 gap-2 border-red-200 text-red-700 hover:bg-red-50"
                                            onClick={() => setShowRejectDialog(true)}
                                            disabled={actionLoading}
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Reject
                                        </Button>
                                    </div>
                                )}

                                {selectedDoctor.verification_status === "approved" && (
                                    <div className="flex gap-3 pt-4 border-t">
                                        <Button
                                            variant="outline"
                                            className="flex-1 gap-2 border-red-200 text-red-700 hover:bg-red-50"
                                            onClick={() => setShowRejectDialog(true)}
                                            disabled={actionLoading}
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Revoke Approval
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="h-96 flex items-center justify-center border-dashed">
                            <div className="text-center text-slate-400">
                                <UserCheck className="h-12 w-12 mx-auto mb-3" />
                                <p className="font-medium">Select an application</p>
                                <p className="text-sm">Click on a doctor to view details</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedDoctor?.verification_status === "approved"
                                ? "Revoke Approval"
                                : "Reject Application"}
                        </DialogTitle>
                        <DialogDescription>
                            Please provide a reason. This will be saved to the doctor&apos;s record.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="e.g., License document is expired or unreadable..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectReason.trim() || actionLoading}
                        >
                            {actionLoading ? "Processing..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Request More Info Dialog */}
            <Dialog open={showMoreInfoDialog} onOpenChange={setShowMoreInfoDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Additional Information</DialogTitle>
                        <DialogDescription>
                            Specify what additional information you need from the applicant.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="e.g., Please provide a clearer copy of your medical license..."
                        value={infoRequest}
                        onChange={(e) => setInfoRequest(e.target.value)}
                        rows={4}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowMoreInfoDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRequestMoreInfo}
                            disabled={!infoRequest.trim() || actionLoading}
                        >
                            {actionLoading ? "Sending..." : "Send Request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
