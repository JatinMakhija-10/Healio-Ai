"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Plus,
} from "lucide-react";
import { CalendarViewComponent } from "@/components/features/calendar/CalendarView";
import { BookingModal, NewBooking } from "@/components/features/calendar/BookingModal";
import { useAppointments } from "@/hooks/useAppointments";
import { toast } from "sonner";
import { SlotInfo } from "react-big-calendar";
import { useRouter } from "next/navigation";

export default function SchedulePage() {
    const {
        appointments,
        addAppointment, // We need to expose this in hook or use store
        reschedule,
    } = useAppointments();

    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const router = useRouter();

    const handleSelectSlot = (slotInfo: SlotInfo) => {
        setSelectedDate(slotInfo.start);
        setIsBookingModalOpen(true);
    };

    const handleEventSelect = (event: any) => {
        const apt = event.resource;
        // Navigate to consultation
        router.push(`/doctor/consult/${apt.id}`);
    };

    const handleBook = (booking: NewBooking) => {
        const [hours, minutes] = booking.time.split(':').map(Number);
        const scheduledAt = new Date(selectedDate);
        scheduledAt.setHours(hours, minutes, 0, 0);

        const newApt = {
            id: Math.random().toString(),
            patientId: booking.patientId,
            patientName: booking.patientName,
            scheduledAt,
            duration: booking.duration,
            status: 'scheduled' as const,
            chiefComplaint: booking.notes,
            patientAvatar: undefined,
            aiDiagnosis: 'Pending Analysis',
            aiConfidence: 0,
            hasRedFlags: false,
        };
        addAppointment(newApt);
        toast.success("Appointment booked successfully!");
        setIsBookingModalOpen(false);
    };

    const handleReschedule = async (id: string, start: Date, end: Date) => {
        const duration = (end.getTime() - start.getTime()) / (1000 * 60);
        await reschedule(id, start, duration);
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Schedule</h1>
                    <p className="text-slate-500">Manage your appointments and availability.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Sync Calendar</Button>
                    <Button
                        className="bg-teal-600 hover:bg-teal-700 gap-2"
                        onClick={() => setIsBookingModalOpen(true)}
                    >
                        <Plus className="h-4 w-4" />
                        New Appointment
                    </Button>
                </div>
            </div>

            <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <CalendarViewComponent
                    appointments={appointments}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleEventSelect}
                    onReschedule={handleReschedule}
                    className="h-full border-0 shadow-none rounded-none"
                />
            </div>

            <BookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                onBook={handleBook}
                selectedDate={selectedDate}
                existingAppointments={appointments}
            />
        </div>
    );
}

