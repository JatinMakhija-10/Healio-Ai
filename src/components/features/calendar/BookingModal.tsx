"use client";

import { useState, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, addMinutes, setHours, setMinutes, isSameDay } from 'date-fns';
import 'react-day-picker/dist/style.css';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    Clock,
    AlertTriangle,
    Repeat,
    User,
    Video,
    MapPin
} from 'lucide-react';
import { Appointment } from '@/stores/appointmentStore';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBook: (booking: NewBooking) => void;
    selectedDate?: Date;
    existingAppointments?: Appointment[];
    patientId?: string;
    patientName?: string;
}

export interface NewBooking {
    patientId: string;
    patientName: string;
    date: Date;
    time: string;
    duration: number;
    type: 'video' | 'in_person';
    notes: string;
    isRecurring: boolean;
    recurringPattern?: 'weekly' | 'biweekly' | 'monthly';
    recurringCount?: number;
}

// Generate time slots from 8 AM to 8 PM
const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 8; hour < 20; hour++) {
        for (let min = 0; min < 60; min += 15) {
            const h = hour.toString().padStart(2, '0');
            const m = min.toString().padStart(2, '0');
            slots.push(`${h}:${m}`);
        }
    }
    return slots;
};

const TIME_SLOTS = generateTimeSlots();
const DURATIONS = [15, 30, 45, 60, 90];

export function BookingModal({
    isOpen,
    onClose,
    onBook,
    selectedDate,
    existingAppointments = [],
    patientId = '',
    patientName = '',
}: BookingModalProps) {
    const [date, setDate] = useState<Date | undefined>(selectedDate || new Date());
    const [time, setTime] = useState('09:00');
    const [duration, setDuration] = useState(30);
    const [type, setType] = useState<'video' | 'in_person'>('video');
    const [notes, setNotes] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringPattern, setRecurringPattern] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
    const [recurringCount, setRecurringCount] = useState(4);
    const [patient, setPatient] = useState({ id: patientId, name: patientName });

    // Check for conflicts
    const hasConflict = useMemo(() => {
        if (!date) return false;

        const [hours, mins] = time.split(':').map(Number);
        const bookingStart = setMinutes(setHours(date, hours), mins);
        const bookingEnd = addMinutes(bookingStart, duration);

        return existingAppointments.some((apt) => {
            if (apt.status.includes('cancelled')) return false;

            const aptStart = new Date(apt.scheduledAt);
            const aptEnd = addMinutes(aptStart, apt.duration);

            // Check if same day first
            if (!isSameDay(aptStart, bookingStart)) return false;

            // Check time overlap
            return (bookingStart < aptEnd && bookingEnd > aptStart);
        });
    }, [date, time, duration, existingAppointments]);

    // Get conflicting appointment details
    const conflictingAppointment = useMemo(() => {
        if (!hasConflict || !date) return null;

        const [hours, mins] = time.split(':').map(Number);
        const bookingStart = setMinutes(setHours(date, hours), mins);
        const bookingEnd = addMinutes(bookingStart, duration);

        return existingAppointments.find((apt) => {
            if (apt.status.includes('cancelled')) return false;
            const aptStart = new Date(apt.scheduledAt);
            const aptEnd = addMinutes(aptStart, apt.duration);
            if (!isSameDay(aptStart, bookingStart)) return false;
            return (bookingStart < aptEnd && bookingEnd > aptStart);
        });
    }, [hasConflict, date, time, duration, existingAppointments]);

    const handleSubmit = () => {
        if (!date) return;

        const booking: NewBooking = {
            patientId: patient.id,
            patientName: patient.name,
            date,
            time,
            duration,
            type,
            notes,
            isRecurring,
            ...(isRecurring && {
                recurringPattern,
                recurringCount,
            }),
        };

        onBook(booking);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-teal-600" />
                        Schedule Appointment
                    </DialogTitle>
                    <DialogDescription>
                        Book a new consultation slot
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Patient Info */}
                    <div className="space-y-2">
                        <Label>Patient</Label>
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                            <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-teal-600" />
                            </div>
                            <div>
                                <div className="font-medium">{patient.name || 'Select Patient'}</div>
                                <div className="text-sm text-slate-500">{patient.id || 'No patient selected'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div className="space-y-2">
                        <Label>Select Date</Label>
                        <div className="border rounded-lg p-2 flex justify-center">
                            <DayPicker
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                disabled={{ before: new Date() }}
                                className="!m-0"
                            />
                        </div>
                    </div>

                    {/* Time and Duration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Time</Label>
                            <Select value={time} onValueChange={setTime}>
                                <SelectTrigger>
                                    <Clock className="h-4 w-4 mr-2 text-slate-400" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {TIME_SLOTS.map((slot) => (
                                        <SelectItem key={slot} value={slot}>
                                            {format(new Date(`2000-01-01T${slot}`), 'h:mm a')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Duration</Label>
                            <Select value={duration.toString()} onValueChange={(v) => setDuration(Number(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DURATIONS.map((d) => (
                                        <SelectItem key={d} value={d.toString()}>
                                            {d} minutes
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Conflict Warning */}
                    {hasConflict && conflictingAppointment && (
                        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <div className="font-medium text-red-800">Time Conflict Detected</div>
                                <div className="text-sm text-red-600">
                                    Overlaps with {conflictingAppointment.patientName} at{' '}
                                    {format(new Date(conflictingAppointment.scheduledAt), 'h:mm a')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Appointment Type */}
                    <div className="space-y-2">
                        <Label>Appointment Type</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant={type === 'video' ? 'default' : 'outline'}
                                className={cn(
                                    "justify-start",
                                    type === 'video' && "bg-teal-600 hover:bg-teal-700"
                                )}
                                onClick={() => setType('video')}
                            >
                                <Video className="h-4 w-4 mr-2" />
                                Video Call
                            </Button>
                            <Button
                                type="button"
                                variant={type === 'in_person' ? 'default' : 'outline'}
                                className={cn(
                                    "justify-start",
                                    type === 'in_person' && "bg-teal-600 hover:bg-teal-700"
                                )}
                                onClick={() => setType('in_person')}
                            >
                                <MapPin className="h-4 w-4 mr-2" />
                                In-Person
                            </Button>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Notes for Appointment</Label>
                        <Textarea
                            placeholder="Add any relevant notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Recurring */}
                    <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Repeat className="h-4 w-4 text-slate-500" />
                                <Label className="mb-0">Recurring Appointment</Label>
                            </div>
                            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                        </div>

                        {isRecurring && (
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs">Pattern</Label>
                                    <Select value={recurringPattern} onValueChange={(v) => setRecurringPattern(v as any)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Number of Sessions</Label>
                                    <Input
                                        type="number"
                                        min={2}
                                        max={52}
                                        value={recurringCount}
                                        onChange={(e) => setRecurringCount(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={hasConflict || !date}
                        className="bg-teal-600 hover:bg-teal-700"
                    >
                        {isRecurring ? `Book ${recurringCount} Sessions` : 'Book Appointment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
