"use client";

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, addMinutes, setHours, setMinutes, isBefore, isEqual, parseISO } from 'date-fns';
import 'react-day-picker/dist/style.css';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface PatientBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doctor: any;
}

export function PatientBookingModal({
    isOpen,
    onClose,
    doctor
}: PatientBookingModalProps) {
    const { user } = useAuth();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Reset state when modal opens/closes or doctor changes
    useEffect(() => {
        if (!isOpen) {
            setIsSuccess(false);
            setDate(new Date());
            setTime("");
        }
    }, [isOpen]);

    // Fetch available slots when date changes
    useEffect(() => {
        async function fetchSlots() {
            if (!date || !doctor) return;

            setLoadingSlots(true);
            setAvailableSlots([]);
            setTime("");

            try {
                // 1. Get doctor's existing appointments for this date
                // Ideally this should be a range query for the specific day, but we'll fetch all and filter client-side for now or assume cache
                // optimization: add getDoctorAppointmentsForDate(doctorId, date) in API later
                const appointments = await api.getDoctorAppointments(doctor.user_id);

                const bookedTimes = appointments
                    .filter((appt: any) => {
                        const apptDate = new Date(appt.scheduled_at);
                        return apptDate.getDate() === date.getDate() &&
                            apptDate.getMonth() === date.getMonth() &&
                            apptDate.getFullYear() === date.getFullYear() &&
                            appt.status !== 'cancelled_by_patient' &&
                            appt.status !== 'cancelled_by_doctor';
                    })
                    .map((appt: any) => format(new Date(appt.scheduled_at), 'HH:mm'));

                // 2. Generate slots based on doctor availability (or default 9-5)
                // Defaulting to 09:00 to 17:00 if no availability set
                const startHour = doctor.availability?.start ? parseInt(doctor.availability.start.split(':')[0]) : 9;
                const endHour = doctor.availability?.end ? parseInt(doctor.availability.end.split(':')[0]) : 17;

                const slots = [];
                let currentDate = setHours(setMinutes(date, 0), startHour);
                const endDate = setHours(setMinutes(date, 0), endHour);

                while (isBefore(currentDate, endDate)) {
                    const timeStr = format(currentDate, 'HH:mm');

                    // Filter out past times if it's today
                    const isPast = isBefore(currentDate, new Date());

                    if (!bookedTimes.includes(timeStr) && !isPast) {
                        slots.push(timeStr);
                    }

                    currentDate = addMinutes(currentDate, 30); // 30 min slots
                }

                setAvailableSlots(slots);
            } catch (error) {
                console.error("Error calculating slots", error);
                toast.error("Could not load available slots");
            } finally {
                setLoadingSlots(false);
            }
        }

        fetchSlots();
    }, [date, doctor]);

    const handleConfirm = async () => {
        if (!date || !time || !user) return;

        setIsSubmitting(true);
        try {
            // Construct ISO date string from date + time
            const [hours, minutes] = time.split(':').map(Number);
            let scheduledAt = new Date(date);
            scheduledAt = setHours(scheduledAt, hours);
            scheduledAt = setMinutes(scheduledAt, minutes);
            scheduledAt.setSeconds(0);
            scheduledAt.setMilliseconds(0);

            // Fetch the latest consultation to link the AI context
            const latestConsultation = await api.getLatestConsultation(user.id);

            await api.createAppointment({
                patient_id: user.id,
                doctor_id: doctor.id, // Corrected: Use doctor's PK, not user_id
                scheduled_at: scheduledAt.toISOString(),
                duration_minutes: 30,
                reason: latestConsultation
                    ? `Follow-up on ${latestConsultation.diagnosis?.condition || 'recent consultation'}`
                    : "Initial Consultation",
                diagnosis_ref_id: latestConsultation?.id
            });

            setIsSuccess(true);
            toast.success("Appointment Request Sent!");
        } catch (error: any) {
            console.error("Booking failed detailed:", error);
            console.error("Booking failed message:", error.message || "No message");
            toast.error(`Failed to book: ${error.message || "Unknown error"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[425px]">
                    <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <DialogTitle className="text-xl">Request Sent!</DialogTitle>
                        <p className="text-slate-500">
                            Your request to book <strong>{doctor.profile?.full_name || 'the doctor'}</strong> on {date && format(date, 'MMM do')} at {time} has been sent.
                        </p>
                        <p className="text-xs text-slate-400">
                            You will receive a notification once the doctor confirms.
                        </p>
                        <Button onClick={onClose} className="bg-teal-600 hover:bg-teal-700 w-full mt-4">
                            Done
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Book Appointment</DialogTitle>
                    <DialogDescription>
                        Schedule a consultation with {doctor?.profile?.full_name}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* Summary */}
                    <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center text-sm">
                        <div>
                            <p className="font-medium text-slate-900">{doctor?.specialty?.[0]}</p>
                            <p className="text-slate-500">Video Consultation</p>
                        </div>
                        <div className="font-bold text-slate-900">₹{doctor?.consultation_fee}</div>
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <Calendar className="h-4 w-4 text-teal-600" /> Select Date
                        </div>
                        <div className="border rounded-md p-2 flex justify-center">
                            <DayPicker
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                disabled={{ before: new Date() }}
                                className="!m-0"
                            />
                        </div>
                    </div>

                    {/* Time */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <Clock className="h-4 w-4 text-teal-600" /> Select Time
                        </div>
                        <Select onValueChange={setTime} value={time} disabled={loadingSlots || availableSlots.length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder={
                                    loadingSlots ? "Loading slots..." :
                                        (availableSlots.length === 0 ? "No slots available" : "Choose a slot")
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                {availableSlots.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {loadingSlots && <p className="text-xs text-slate-500 animate-pulse">Checking availability...</p>}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!date || !time || isSubmitting}
                        className="bg-teal-600 hover:bg-teal-700"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isSubmitting ? "Booking..." : "Confirm Booking"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
