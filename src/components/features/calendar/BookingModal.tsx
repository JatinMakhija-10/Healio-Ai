"use client";

import { useState, useMemo, useEffect } from 'react';
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
    MapPin,
    Search,
    CheckCircle2,
    Loader2,
    ArrowLeft,
    ArrowRight,
    Sparkles,
} from 'lucide-react';
import { Appointment } from '@/stores/appointmentStore';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBook: (booking: NewBooking) => Promise<void> | void;
    selectedDate?: Date;
    existingAppointments?: Appointment[];
    patientId?: string;
    patientName?: string;
    patients?: { id: string; full_name: string; avatar_url?: string }[];
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

type ModalStep = 'form' | 'confirm' | 'success';

export function BookingModal({
    isOpen,
    onClose,
    onBook,
    selectedDate,
    existingAppointments = [],
    patientId = '',
    patientName = '',
    patients = [],
}: BookingModalProps) {
    // --- Form State ---
    const [date, setDate] = useState<Date | undefined>(selectedDate || new Date());
    const [time, setTime] = useState('09:00');
    const [duration, setDuration] = useState(30);
    const [type, setType] = useState<'video' | 'in_person'>('video');
    const [notes, setNotes] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringPattern, setRecurringPattern] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
    const [recurringCount, setRecurringCount] = useState(4);
    const [selectedPatientId, setSelectedPatientId] = useState(patientId);
    const [patientNameState, setPatientNameState] = useState(patientName);

    // --- UI State ---
    const [step, setStep] = useState<ModalStep>('form');
    const [patientSearch, setPatientSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Reset all form fields whenever the modal opens
    useEffect(() => {
        if (isOpen) {
            setDate(selectedDate || new Date());
            setTime('09:00');
            setDuration(30);
            setType('video');
            setNotes('');
            setIsRecurring(false);
            setRecurringPattern('weekly');
            setRecurringCount(4);
            setSelectedPatientId(patientId);
            setPatientNameState(patientName);
            setStep('form');
            setPatientSearch('');
            setIsSubmitting(false);
            setValidationErrors({});
        }
    }, [isOpen, selectedDate, patientId, patientName]);

    // Patient filtering
    const filteredPatients = useMemo(() => {
        if (!patientSearch.trim()) return patients;
        const q = patientSearch.toLowerCase();
        return patients.filter(p => p.full_name.toLowerCase().includes(q));
    }, [patients, patientSearch]);

    const handlePatientSelect = (value: string) => {
        setSelectedPatientId(value);
        const p = patients.find(pt => pt.id === value);
        if (p) setPatientNameState(p.full_name);
        setValidationErrors(prev => ({ ...prev, patient: '' }));
    };

    // Appointments on selected day (for the count badge)
    const appointmentsOnSelectedDay = useMemo(() => {
        if (!date) return 0;
        return existingAppointments.filter(apt => {
            if (apt.status.includes('cancelled')) return false;
            return isSameDay(new Date(apt.scheduledAt), date);
        }).length;
    }, [date, existingAppointments]);

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
            if (!isSameDay(aptStart, bookingStart)) return false;
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

    // Slot availability visual helper
    const getSlotStatus = (slot: string) => {
        if (!date) return 'available';
        const [hours, mins] = slot.split(':').map(Number);
        const slotStart = setMinutes(setHours(date, hours), mins);
        const slotEnd = addMinutes(slotStart, duration);

        const conflict = existingAppointments.some((apt) => {
            if (apt.status.includes('cancelled')) return false;
            const aptStart = new Date(apt.scheduledAt);
            const aptEnd = addMinutes(aptStart, apt.duration);
            if (!isSameDay(aptStart, slotStart)) return false;
            return (slotStart < aptEnd && slotEnd > aptStart);
        });

        return conflict ? 'conflict' : 'available';
    };

    // Validation
    const validate = (): boolean => {
        const errors: Record<string, string> = {};
        if (!selectedPatientId && !patientId) errors.patient = 'Please select a patient';
        if (!date) errors.date = 'Please select a date';
        if (hasConflict) errors.conflict = 'Time slot has a conflict';
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleGoToConfirm = () => {
        if (validate()) setStep('confirm');
    };

    const handleSubmit = async () => {
        if (!date) return;
        setIsSubmitting(true);

        const booking: NewBooking = {
            patientId: selectedPatientId,
            patientName: patientNameState,
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

        try {
            await onBook(booking);
            setStep('success');
            // Auto-close after success animation
            setTimeout(() => {
                onClose();
            }, 1800);
        } catch {
            setIsSubmitting(false);
        }
    };

    const selectedPatient = patients.find(p => p.id === selectedPatientId);
    const initials = (patientNameState || 'P')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // ===================== RENDER =====================

    // Success Step
    if (step === 'success') {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[420px]">
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
                                <CheckCircle2 className="h-10 w-10 text-white" />
                            </div>
                            <div className="absolute -top-2 -right-2">
                                <Sparkles className="h-6 w-6 text-amber-400 animate-pulse" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Appointment Booked!</h3>
                        <p className="text-sm text-slate-500 text-center max-w-[280px]">
                            {isRecurring
                                ? `${recurringCount} sessions scheduled with ${patientNameState}`
                                : `Session with ${patientNameState} has been confirmed`}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-teal-600 bg-teal-50 px-4 py-2 rounded-full">
                            <Calendar className="h-4 w-4" />
                            <span>{date ? format(date, 'EEE, MMM d') : ''} at {format(new Date(`2000-01-01T${time}`), 'h:mm a')}</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Confirmation Step
    if (step === 'confirm') {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-teal-600" />
                            Confirm Booking
                        </DialogTitle>
                        <DialogDescription>Review the appointment details before confirming.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Patient Info */}
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-semibold text-sm">
                                {initials}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">{patientNameState}</p>
                                <p className="text-xs text-slate-500">Patient</p>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50 rounded-lg border">
                                <p className="text-xs text-slate-500 mb-1">📅 Date</p>
                                <p className="font-medium text-sm text-slate-900">{date ? format(date, 'EEEE, MMM d, yyyy') : '—'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border">
                                <p className="text-xs text-slate-500 mb-1">🕐 Time</p>
                                <p className="font-medium text-sm text-slate-900">{format(new Date(`2000-01-01T${time}`), 'h:mm a')} ({duration}min)</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border">
                                <p className="text-xs text-slate-500 mb-1">{type === 'video' ? '📹' : '📍'} Type</p>
                                <p className="font-medium text-sm text-slate-900">{type === 'video' ? 'Video Call' : 'In-Person'}</p>
                            </div>
                            {isRecurring && (
                                <div className="p-3 bg-slate-50 rounded-lg border">
                                    <p className="text-xs text-slate-500 mb-1">🔁 Recurring</p>
                                    <p className="font-medium text-sm text-slate-900">{recurringCount}x {recurringPattern}</p>
                                </div>
                            )}
                        </div>

                        {notes && (
                            <div className="p-3 bg-slate-50 rounded-lg border">
                                <p className="text-xs text-slate-500 mb-1">📝 Notes</p>
                                <p className="text-sm text-slate-700">{notes}</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={() => setStep('form')} disabled={isSubmitting}>
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-teal-600 hover:bg-teal-700 min-w-[140px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Booking...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    {isRecurring ? `Book ${recurringCount} Sessions` : 'Confirm Booking'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    // Main Form Step
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-teal-600" />
                        </div>
                        Schedule Appointment
                    </DialogTitle>
                    <DialogDescription>
                        Book a new consultation slot for your patient.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Patient Selection */}
                    <div className="space-y-2">
                        <Label className="flex items-center justify-between">
                            <span>Patient <span className="text-red-500">*</span></span>
                            {patients.length > 0 && (
                                <span className="text-xs text-slate-400">{patients.length} patients</span>
                            )}
                        </Label>

                        {/* Patient Search */}
                        {!patientId && patients.length > 5 && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search patients..."
                                    value={patientSearch}
                                    onChange={(e) => setPatientSearch(e.target.value)}
                                    className="pl-9 h-9 text-sm"
                                />
                            </div>
                        )}

                        <Select value={selectedPatientId} onValueChange={handlePatientSelect} disabled={!!patientId}>
                            <SelectTrigger className={cn("h-14", validationErrors.patient && "border-red-300 ring-1 ring-red-200")}>
                                <div className="flex items-center gap-2 text-left">
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold",
                                        selectedPatientId
                                            ? "bg-gradient-to-br from-teal-500 to-teal-700 text-white"
                                            : "bg-slate-100 text-slate-400"
                                    )}>
                                        {selectedPatientId ? initials : <User className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">
                                            {selectedPatient?.full_name || patientNameState || 'Select Patient'}
                                        </div>
                                    </div>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {filteredPatients.length === 0 ? (
                                    <div className="p-3 text-center text-sm text-slate-500">
                                        {patientSearch ? 'No patients match your search' : 'No patients found. Patients will appear here after they book their first appointment with you.'}
                                    </div>
                                ) : (
                                    filteredPatients.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700">
                                                    {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                {p.full_name}
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {validationErrors.patient && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> {validationErrors.patient}
                            </p>
                        )}
                    </div>

                    {/* Date Picker */}
                    <div className="space-y-2">
                        <Label className="flex items-center justify-between">
                            <span>Select Date <span className="text-red-500">*</span></span>
                            {appointmentsOnSelectedDay > 0 && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs">
                                    {appointmentsOnSelectedDay} appointment{appointmentsOnSelectedDay > 1 ? 's' : ''} on this day
                                </Badge>
                            )}
                        </Label>
                        <div className="border rounded-xl p-3 flex justify-center bg-white">
                            <DayPicker
                                mode="single"
                                selected={date}
                                onSelect={(d) => { setDate(d); setValidationErrors(prev => ({ ...prev, date: '' })); }}
                                disabled={{ before: new Date() }}
                                className="!m-0"
                                modifiersClassNames={{
                                    selected: '!bg-teal-600 !text-white rounded-lg',
                                    today: '!font-bold !text-teal-600',
                                }}
                            />
                        </div>
                        {validationErrors.date && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> {validationErrors.date}
                            </p>
                        )}
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
                                    {TIME_SLOTS.map((slot) => {
                                        const status = getSlotStatus(slot);
                                        return (
                                            <SelectItem
                                                key={slot}
                                                value={slot}
                                                className={cn(status === 'conflict' && "text-red-400")}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        status === 'conflict' ? "bg-red-400" : "bg-green-400"
                                                    )} />
                                                    {format(new Date(`2000-01-01T${slot}`), 'h:mm a')}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
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
                        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-top-2">
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
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                className={cn(
                                    "flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left",
                                    type === 'video'
                                        ? "border-teal-500 bg-teal-50 shadow-sm shadow-teal-100"
                                        : "border-slate-200 hover:border-slate-300 bg-white"
                                )}
                                onClick={() => setType('video')}
                            >
                                <div className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center",
                                    type === 'video' ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"
                                )}>
                                    <Video className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className={cn("font-medium text-sm", type === 'video' ? "text-teal-800" : "text-slate-700")}>
                                        Video Call
                                    </p>
                                    <p className="text-xs text-slate-400">Online consultation</p>
                                </div>
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left",
                                    type === 'in_person'
                                        ? "border-teal-500 bg-teal-50 shadow-sm shadow-teal-100"
                                        : "border-slate-200 hover:border-slate-300 bg-white"
                                )}
                                onClick={() => setType('in_person')}
                            >
                                <div className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center",
                                    type === 'in_person' ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"
                                )}>
                                    <MapPin className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className={cn("font-medium text-sm", type === 'in_person' ? "text-teal-800" : "text-slate-700")}>
                                        In-Person
                                    </p>
                                    <p className="text-xs text-slate-400">Clinic visit</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Notes for Appointment</Label>
                        <Textarea
                            placeholder="Add any relevant notes, symptoms, or context..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                        <p className="text-[11px] text-slate-400">{notes.length}/500 characters</p>
                    </div>

                    {/* Recurring */}
                    <div className="space-y-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center">
                                    <Repeat className="h-3.5 w-3.5 text-slate-600" />
                                </div>
                                <Label className="mb-0 text-sm">Recurring Appointment</Label>
                            </div>
                            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                        </div>

                        {isRecurring && (
                            <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
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

                <DialogFooter className="flex gap-2 sm:gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGoToConfirm}
                        disabled={hasConflict || !date || (!selectedPatientId && !patientId)}
                        className="bg-teal-600 hover:bg-teal-700 min-w-[140px]"
                    >
                        Review & Book
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
