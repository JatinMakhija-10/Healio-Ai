"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
    UserCheck,
    Search,
    Filter,
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
} from "lucide-react";
import Link from "next/link";

interface DoctorApplication {
    id: string;
    userId: string;
    fullName: string;
    email: string;
    avatar?: string;
    specialty: string[];
    qualification: string;
    experienceYears: number;
    licenseNumber: string;
    licenseDocumentUrl: string;
    bio: string;
    location: string;
    appliedAt: Date;
    status: "pending" | "approved" | "rejected" | "more_info_required";
}

// Mock data
const mockApplications: DoctorApplication[] = [
    {
        id: "doc-1",
        userId: "usr-1",
        fullName: "Dr. Aisha Patel",
        email: "aisha.patel@email.com",
        specialty: ["General Medicine", "Ayurveda"],
        qualification: "MBBS, MD (Ayurveda)",
        experienceYears: 8,
        licenseNumber: "MH-12345-2020",
        licenseDocumentUrl: "/docs/license.pdf",
        bio: "Experienced physician with focus on holistic healing combining modern medicine with traditional Ayurvedic practices.",
        location: "Mumbai, Maharashtra",
        appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        status: "pending",
    },
    {
        id: "doc-2",
        userId: "usr-2",
        fullName: "Dr. Rajesh Kumar",
        email: "rajesh.kumar@email.com",
        specialty: ["Dermatology"],
        qualification: "MBBS, MD (Dermatology)",
        experienceYears: 12,
        licenseNumber: "DL-67890-2018",
        licenseDocumentUrl: "/docs/license2.pdf",
        bio: "Dermatologist specializing in skin conditions and cosmetic procedures.",
        location: "New Delhi",
        appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        status: "pending",
    },
    {
        id: "doc-3",
        userId: "usr-3",
        fullName: "Dr. Meera Sharma",
        email: "meera.sharma@email.com",
        specialty: ["Orthopedics", "Sports Medicine"],
        qualification: "MBBS, MS (Ortho)",
        experienceYears: 15,
        licenseNumber: "KA-11111-2015",
        licenseDocumentUrl: "/docs/license3.pdf",
        bio: "Orthopedic surgeon with expertise in sports injuries and joint replacements.",
        location: "Bangalore, Karnataka",
        appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
        status: "pending",
    },
];

export default function DoctorVerificationPage() {
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState<DoctorApplication[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorApplication | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [showMoreInfoDialog, setShowMoreInfoDialog] = useState(false);
    const [infoRequest, setInfoRequest] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setApplications(mockApplications);
            setLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    const filteredApplications = applications.filter(
        (app) =>
            app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.specialty.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleApprove = (doctor: DoctorApplication) => {
        setApplications((prev) =>
            prev.map((app) =>
                app.id === doctor.id ? { ...app, status: "approved" } : app
            )
        );
        setSelectedDoctor(null);
    };

    const handleReject = () => {
        if (selectedDoctor) {
            setApplications((prev) =>
                prev.map((app) =>
                    app.id === selectedDoctor.id ? { ...app, status: "rejected" } : app
                )
            );
            setSelectedDoctor(null);
            setShowRejectDialog(false);
            setRejectReason("");
        }
    };

    const handleRequestMoreInfo = () => {
        if (selectedDoctor) {
            setApplications((prev) =>
                prev.map((app) =>
                    app.id === selectedDoctor.id ? { ...app, status: "more_info_required" } : app
                )
            );
            setSelectedDoctor(null);
            setShowMoreInfoDialog(false);
            setInfoRequest("");
        }
    };

    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    };

    const statusConfig = {
        pending: { label: "Pending Review", className: "bg-amber-100 text-amber-700 border-amber-200" },
        approved: { label: "Approved", className: "bg-green-100 text-green-700 border-green-200" },
        rejected: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200" },
        more_info_required: { label: "More Info Needed", className: "bg-blue-100 text-blue-700 border-blue-200" },
    };

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
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {applications.filter((a) => a.status === "pending").length} pending
                        </Badge>
                    </div>
                    <p className="text-slate-500 mt-1">Review and verify doctor credentials</p>
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
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filter
                    </Button>
                </div>
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
                            const initials = doctor.fullName
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
                                                <AvatarImage src={doctor.avatar} />
                                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-slate-900 truncate">
                                                        {doctor.fullName}
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-slate-500 truncate">
                                                    {doctor.specialty.join(", ")}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] ${statusConfig[doctor.status].className}`}
                                                    >
                                                        {statusConfig[doctor.status].label}
                                                    </Badge>
                                                    <span className="text-xs text-slate-400">
                                                        {getTimeAgo(doctor.appliedAt)}
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
                                <UserCheck className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                <p>No applications found</p>
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
                                            <AvatarImage src={selectedDoctor.avatar} />
                                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white text-xl">
                                                {selectedDoctor.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-xl">{selectedDoctor.fullName}</CardTitle>
                                            <p className="text-slate-500">{selectedDoctor.email}</p>
                                            <Badge
                                                variant="outline"
                                                className={`mt-2 ${statusConfig[selectedDoctor.status].className}`}
                                            >
                                                {statusConfig[selectedDoctor.status].label}
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
                                            <p className="text-sm text-slate-900">{selectedDoctor.specialty.join(", ")}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                                        <GraduationCap className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">Qualification</p>
                                            <p className="text-sm text-slate-900">{selectedDoctor.qualification}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                                        <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">Experience</p>
                                            <p className="text-sm text-slate-900">{selectedDoctor.experienceYears} years</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                                        <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">Location</p>
                                            <p className="text-sm text-slate-900">{selectedDoctor.location}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Bio */}
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Bio</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">{selectedDoctor.bio}</p>
                                </div>

                                {/* License Info */}
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-amber-600" />
                                            <div>
                                                <p className="text-sm font-medium text-amber-900">Medical License</p>
                                                <p className="text-xs text-amber-700">{selectedDoctor.licenseNumber}</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-100">
                                            <ExternalLink className="h-4 w-4" />
                                            View Document
                                        </Button>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Calendar className="h-4 w-4" />
                                    <span>Applied {getTimeAgo(selectedDoctor.appliedAt)}</span>
                                </div>

                                {/* Actions */}
                                {selectedDoctor.status === "pending" && (
                                    <div className="flex gap-3 pt-4 border-t">
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                                            onClick={() => handleApprove(selectedDoctor)}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Approve
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                                            onClick={() => setShowMoreInfoDialog(true)}
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            Request Info
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 gap-2 border-red-200 text-red-700 hover:bg-red-50"
                                            onClick={() => setShowRejectDialog(true)}
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Reject
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
                        <DialogTitle>Reject Application</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this application. This will be sent to the applicant.
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
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>
                            Confirm Rejection
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
                        <Button onClick={handleRequestMoreInfo} disabled={!infoRequest.trim()}>
                            Send Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
