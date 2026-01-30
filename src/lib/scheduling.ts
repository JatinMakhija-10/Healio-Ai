import { addMinutes, isSameDay, isWithinInterval } from 'date-fns';
import { Appointment } from '@/stores/appointmentStore';

/**
 * Default buffer time between appointments (in minutes)
 */
export const DEFAULT_BUFFER_MINUTES = 5;

/**
 * Check if a proposed time slot conflicts with existing appointments
 */
export function hasTimeConflict(
    proposedStart: Date,
    proposedDuration: number,
    existingAppointments: Appointment[],
    excludeAppointmentId?: string,
    bufferMinutes: number = DEFAULT_BUFFER_MINUTES
): boolean {
    const proposedEnd = addMinutes(proposedStart, proposedDuration);
    const bufferedStart = addMinutes(proposedStart, -bufferMinutes);
    const bufferedEnd = addMinutes(proposedEnd, bufferMinutes);

    return existingAppointments.some((apt) => {
        // Skip excluded appointment (for rescheduling)
        if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;

        // Skip cancelled appointments
        if (apt.status.includes('cancelled') || apt.status === 'no_show') return false;

        const aptStart = new Date(apt.scheduledAt);
        const aptEnd = addMinutes(aptStart, apt.duration);

        // Check same day first
        if (!isSameDay(aptStart, proposedStart)) return false;

        // Check time overlap with buffer
        return bufferedStart < aptEnd && bufferedEnd > aptStart;
    });
}

/**
 * Get conflicting appointments for a proposed time slot
 */
export function getConflictingAppointments(
    proposedStart: Date,
    proposedDuration: number,
    existingAppointments: Appointment[],
    excludeAppointmentId?: string
): Appointment[] {
    const proposedEnd = addMinutes(proposedStart, proposedDuration);

    return existingAppointments.filter((apt) => {
        if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
        if (apt.status.includes('cancelled') || apt.status === 'no_show') return false;

        const aptStart = new Date(apt.scheduledAt);
        const aptEnd = addMinutes(aptStart, apt.duration);

        if (!isSameDay(aptStart, proposedStart)) return false;

        return proposedStart < aptEnd && proposedEnd > aptStart;
    });
}

/**
 * Generate suggested time slots based on doctor's availability patterns
 * and existing appointments
 */
export function suggestTimeSlots(
    date: Date,
    duration: number,
    existingAppointments: Appointment[],
    workingHours = { start: 9, end: 18 },
    slotInterval = 15
): Date[] {
    const suggestions: Date[] = [];
    const startHour = workingHours.start;
    const endHour = workingHours.end;

    // Generate all possible slots for the day
    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += slotInterval) {
            const slotStart = new Date(date);
            slotStart.setHours(hour, minute, 0, 0);

            // Skip if slot would extend past working hours
            const slotEnd = addMinutes(slotStart, duration);
            if (slotEnd.getHours() > endHour ||
                (slotEnd.getHours() === endHour && slotEnd.getMinutes() > 0)) {
                continue;
            }

            // Check for conflicts
            if (!hasTimeConflict(slotStart, duration, existingAppointments)) {
                suggestions.push(slotStart);
            }
        }
    }

    return suggestions;
}

/**
 * Find the next available slot after a given time
 */
export function findNextAvailableSlot(
    afterTime: Date,
    duration: number,
    existingAppointments: Appointment[],
    workingHours = { start: 9, end: 18 }
): Date | null {
    const maxDays = 30; // Look up to 30 days ahead
    let currentDate = new Date(afterTime);

    for (let day = 0; day < maxDays; day++) {
        const suggestions = suggestTimeSlots(
            currentDate,
            duration,
            existingAppointments,
            workingHours
        );

        // Filter suggestions that are after the requested time
        const validSuggestions = suggestions.filter((slot) => slot > afterTime);

        if (validSuggestions.length > 0) {
            return validSuggestions[0];
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(workingHours.start, 0, 0, 0);
    }

    return null;
}

/**
 * Calculate buffer time recommendations based on appointment patterns
 */
export function calculateOptimalBuffer(appointments: Appointment[]): number {
    if (appointments.length < 5) return DEFAULT_BUFFER_MINUTES;

    // Analyze gaps between appointments
    const gaps: number[] = [];
    const sortedApts = [...appointments].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );

    for (let i = 1; i < sortedApts.length; i++) {
        const prevEnd = addMinutes(
            new Date(sortedApts[i - 1].scheduledAt),
            sortedApts[i - 1].duration
        );
        const currentStart = new Date(sortedApts[i].scheduledAt);

        if (isSameDay(prevEnd, currentStart)) {
            const gap = (currentStart.getTime() - prevEnd.getTime()) / 60000; // minutes
            if (gap > 0 && gap < 60) gaps.push(gap);
        }
    }

    if (gaps.length === 0) return DEFAULT_BUFFER_MINUTES;

    // Return the median gap as optimal buffer
    gaps.sort((a, b) => a - b);
    return gaps[Math.floor(gaps.length / 2)];
}

/**
 * Generate recurring appointment dates
 */
export function generateRecurringDates(
    startDate: Date,
    pattern: 'weekly' | 'biweekly' | 'monthly',
    count: number
): Date[] {
    const dates: Date[] = [new Date(startDate)];

    for (let i = 1; i < count; i++) {
        const lastDate = new Date(dates[dates.length - 1]);

        switch (pattern) {
            case 'weekly':
                lastDate.setDate(lastDate.getDate() + 7);
                break;
            case 'biweekly':
                lastDate.setDate(lastDate.getDate() + 14);
                break;
            case 'monthly':
                lastDate.setMonth(lastDate.getMonth() + 1);
                break;
        }

        dates.push(lastDate);
    }

    return dates;
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
}

/**
 * Calculate appointment statistics
 */
export function getAppointmentStats(appointments: Appointment[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayApts = appointments.filter((apt) => {
        const aptDate = new Date(apt.scheduledAt);
        return isSameDay(aptDate, today);
    });

    const completed = appointments.filter((apt) => apt.status === 'completed').length;
    const cancelled = appointments.filter((apt) => apt.status.includes('cancelled')).length;
    const noShows = appointments.filter((apt) => apt.status === 'no_show').length;
    const urgent = appointments.filter((apt) => apt.isUrgent).length;

    return {
        total: appointments.length,
        today: todayApts.length,
        completed,
        cancelled,
        noShows,
        urgent,
        completionRate: appointments.length > 0
            ? ((completed / appointments.length) * 100).toFixed(1)
            : '0.0',
    };
}
