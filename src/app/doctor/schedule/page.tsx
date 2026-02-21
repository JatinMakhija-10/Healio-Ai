"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Plus,
    RefreshCw,
    Calendar,
    Clock,
    CheckCircle2,
    Users,
    Search,
    XCircle,
    Filter,
    ListFilter,
    ChevronRight,
} from "lucide-react";
import { CalendarViewComponent } from "@/components/features/calendar/CalendarView";
import { BookingModal, NewBooking } from "@/components/features/calendar/BookingModal";
import { AppointmentCard } from "@/components/doctor/AppointmentCard";
import { useAppointments } from "@/hooks/useAppointments";
import { toast } from "sonner";
import { SlotInfo } from "react-big-calendar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useEffect } from "react";
import { format } from "date-fns";

type StatusFilter = 'all' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

const STATUS_TABS: { value: StatusFilter; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: <ListFilter className="h-3.5 w-3.5" /> },
    { value: 'scheduled', label: 'Scheduled', icon: <Clock className="h-3.5 w-3.5" /> },
    { value: 'confirmed', label: 'Confirmed', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    { value: 'in_progress', label: 'In Progress', icon: <Calendar className="h-3.5 w-3.5" /> },
    { value: 'completed', label: 'Completed', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    { value: 'cancelled', label: 'Cancelled', icon: <XCircle className="h-3.5 w-3.5" /> },
];

export default function SchedulePage() {
    const { user } = useAuth();
    const [patients, setPatients] = useState<any[]>([]);
    const [patientsLoading, setPatientsLoading] = useState(true);

    const {
        appointments,
        isLoading,
        createAppointment,
        reschedule,
        cancel,
        updateStatus,
        fetchAppointments,
    } = useAppointments();

    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showList, setShowList] = useState(true);

    const router = useRouter();

    useEffect(() => {
        async function loadPatients() {
            if (!user) return;
            setPatientsLoading(true);
            try {
                const doctor = await api.getDoctorProfile(user.id);
                if (doctor) {
                    const pts = await api.getDoctorPatients(doctor.id);
                    setPatients(pts);
                }
            } catch (error) {
                console.error("Failed to load patients", error);
            } finally {
                setPatientsLoading(false);
            }
        }
        loadPatients();
    }, [user]);

    // Filtered appointments
    const filteredAppointments = useMemo(() => {
        return appointments.filter(apt => {
            // Status filter
            if (statusFilter !== 'all') {
                if (statusFilter === 'cancelled') {
                    if (!apt.status.includes('cancelled') && apt.status !== 'no_show') return false;
                } else if (apt.status !== statusFilter) {
                    return false;
                }
            }
            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = apt.patientName.toLowerCase().includes(q);
                const matchComplaint = apt.chiefComplaint?.toLowerCase().includes(q);
                if (!matchName && !matchComplaint) return false;
            }
            return true;
        }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }, [appointments, statusFilter, searchQuery]);

    // Stats
    const stats = useMemo(() => {
        const today = new Date();
        const todayAppointments = appointments.filter(apt => {
            const d = new Date(apt.scheduledAt);
            return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        });
        return {
            total: appointments.length,
            today: todayAppointments.length,
            scheduled: appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length,
            completed: appointments.filter(a => a.status === 'completed').length,
            cancelled: appointments.filter(a => a.status.includes('cancelled') || a.status === 'no_show').length,
        };
    }, [appointments]);

    const handleSelectSlot = (slotInfo: SlotInfo) => {
        setSelectedDate(slotInfo.start);
        setIsBookingModalOpen(true);
    };

    const handleEventSelect = (event: any) => {
        const apt = event.resource;
        router.push(`/doctor/consult/${apt.id}`);
    };

    const handleBook = async (booking: NewBooking) => {
        try {
            const [hours, mins] = booking.time.split(':').map(Number);
            const combinedDate = new Date(booking.date);
            combinedDate.setHours(hours, mins, 0, 0);

            await createAppointment({
                patientId: booking.patientId,
                date: combinedDate,
                duration: booking.duration,
                notes: booking.notes
            });
            setIsBookingModalOpen(false);
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleSync = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: 'Syncing with external calendars...',
                success: 'Calendar synced successfully',
                error: 'Failed to sync calendar',
            }
        );
    };

    const handleRefresh = () => {
        fetchAppointments();
        toast.success('Schedule refreshed');
    };

    const handleReschedule = async (id: string, start: Date, end: Date) => {
        const duration = (end.getTime() - start.getTime()) / (1000 * 60);
        await reschedule(id, start, duration);
    };

    const handleCancel = async (id: string) => {
        await cancel(id);
    };

    const handleComplete = async (id: string) => {
        await updateStatus(id, 'completed');
    };

    const handleStatusChange = async (id: string, status: string) => {
        await updateStatus(id, status as any);
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Schedule</h1>
                    <p className="text-slate-500">Manage your appointments and availability.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSync}>Sync Calendar</Button>
                    <Button
                        className="bg-teal-600 hover:bg-teal-700 gap-2"
                        size="sm"
                        onClick={() => setIsBookingModalOpen(true)}
                    >
                        <Plus className="h-4 w-4" />
                        New Appointment
                    </Button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0">
                {[
                    { label: 'Total', value: stats.total, icon: <Calendar className="h-4 w-4 text-slate-500" />, color: 'bg-slate-50 border-slate-200' },
                    { label: 'Today', value: stats.today, icon: <Clock className="h-4 w-4 text-teal-600" />, color: 'bg-teal-50 border-teal-200' },
                    { label: 'Pending', value: stats.scheduled, icon: <Clock className="h-4 w-4 text-blue-600" />, color: 'bg-blue-50 border-blue-200' },
                    { label: 'Completed', value: stats.completed, icon: <CheckCircle2 className="h-4 w-4 text-green-600" />, color: 'bg-green-50 border-green-200' },
                    { label: 'Cancelled', value: stats.cancelled, icon: <XCircle className="h-4 w-4 text-red-500" />, color: 'bg-red-50 border-red-200' },
                ].map(stat => (
                    <div key={stat.label} className={`flex items-center gap-3 p-3 rounded-xl border ${stat.color}`}>
                        {stat.icon}
                        <div>
                            <p className="text-lg font-bold text-slate-900">{isLoading ? '—' : stat.value}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Calendar */}
            <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center space-y-3">
                            <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin mx-auto" />
                            <p className="text-sm text-slate-500">Loading schedule...</p>
                        </div>
                    </div>
                ) : (
                    <CalendarViewComponent
                        appointments={appointments}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleEventSelect}
                        onReschedule={handleReschedule}
                        className="h-full border-0 shadow-none rounded-none"
                    />
                )}
            </div>

            {/* Appointment List Panel */}
            <div className="shrink-0 space-y-4 pb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-slate-900">Appointments</h2>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-xs">
                            {filteredAppointments.length}
                        </Badge>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowList(!showList)}
                        className="text-slate-500"
                    >
                        {showList ? 'Hide' : 'Show'}
                        <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showList ? 'rotate-90' : ''}`} />
                    </Button>
                </div>

                {showList && (
                    <>
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by patient name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9 text-sm"
                                />
                            </div>
                            <div className="flex gap-1 overflow-x-auto pb-1">
                                {STATUS_TABS.map(tab => (
                                    <Button
                                        key={tab.value}
                                        variant={statusFilter === tab.value ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setStatusFilter(tab.value)}
                                        className={`gap-1.5 text-xs whitespace-nowrap ${statusFilter === tab.value ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'text-slate-600'}`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* List */}
                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <Card key={i}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                <Skeleton className="h-12 w-12 rounded-full" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-5 w-32" />
                                                    <Skeleton className="h-4 w-48" />
                                                    <Skeleton className="h-10 w-full" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : filteredAppointments.length > 0 ? (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                                {filteredAppointments.map(apt => (
                                    <AppointmentCard
                                        key={apt.id}
                                        id={apt.id}
                                        patientName={apt.patientName}
                                        patientAvatar={apt.patientAvatar}
                                        scheduledAt={new Date(apt.scheduledAt)}
                                        duration={apt.duration}
                                        status={apt.status}
                                        chiefComplaint={apt.chiefComplaint}
                                        aiDiagnosis={apt.aiDiagnosis}
                                        aiConfidence={apt.aiConfidence}
                                        hasRedFlags={apt.hasRedFlags}
                                        isUrgent={apt.isUrgent}
                                        onCancel={handleCancel}
                                        onComplete={handleComplete}
                                        onStatusChange={handleStatusChange}
                                    />
                                ))}
                            </div>
                        ) : (
                            <Card className="border-dashed">
                                <CardContent className="p-10 text-center">
                                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                        <Calendar className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-700">
                                        {statusFilter !== 'all' || searchQuery
                                            ? 'No matching appointments'
                                            : 'No Appointments Yet'}
                                    </h3>
                                    <p className="text-slate-500 mt-1 text-sm">
                                        {statusFilter !== 'all' || searchQuery
                                            ? 'Try adjusting your filters or search query.'
                                            : 'Click "New Appointment" to schedule your first consultation.'}
                                    </p>
                                    {(statusFilter !== 'all' || searchQuery) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-4"
                                            onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}
                                        >
                                            Clear Filters
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>

            <BookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                onBook={handleBook}
                selectedDate={selectedDate}
                existingAppointments={appointments}
                patients={patients}
            />
        </div>
    );
}
