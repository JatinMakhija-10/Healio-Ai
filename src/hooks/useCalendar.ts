import { useState, useCallback, useMemo } from 'react';
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    addDays,
    addWeeks,
    addMonths,
    subDays,
    subWeeks,
    subMonths,
    format,
    isSameDay,
    isToday,
    isWithinInterval
} from 'date-fns';

export type CalendarView = 'day' | 'week' | 'month' | 'agenda';

interface CalendarState {
    currentDate: Date;
    view: CalendarView;
    selectedDate: Date | null;
}

/**
 * Custom hook for calendar navigation and date management
 */
export function useCalendar(initialView: CalendarView = 'week') {
    const [state, setState] = useState<CalendarState>({
        currentDate: new Date(),
        view: initialView,
        selectedDate: null,
    });

    // Navigate to today
    const goToToday = useCallback(() => {
        setState((prev) => ({ ...prev, currentDate: new Date() }));
    }, []);

    // Navigate forward
    const goNext = useCallback(() => {
        setState((prev) => {
            let newDate: Date;
            switch (prev.view) {
                case 'day':
                    newDate = addDays(prev.currentDate, 1);
                    break;
                case 'week':
                    newDate = addWeeks(prev.currentDate, 1);
                    break;
                case 'month':
                case 'agenda':
                    newDate = addMonths(prev.currentDate, 1);
                    break;
                default:
                    newDate = prev.currentDate;
            }
            return { ...prev, currentDate: newDate };
        });
    }, []);

    // Navigate backward
    const goPrev = useCallback(() => {
        setState((prev) => {
            let newDate: Date;
            switch (prev.view) {
                case 'day':
                    newDate = subDays(prev.currentDate, 1);
                    break;
                case 'week':
                    newDate = subWeeks(prev.currentDate, 1);
                    break;
                case 'month':
                case 'agenda':
                    newDate = subMonths(prev.currentDate, 1);
                    break;
                default:
                    newDate = prev.currentDate;
            }
            return { ...prev, currentDate: newDate };
        });
    }, []);

    // Set view
    const setView = useCallback((view: CalendarView) => {
        setState((prev) => ({ ...prev, view }));
    }, []);

    // Select a date
    const selectDate = useCallback((date: Date | null) => {
        setState((prev) => ({
            ...prev,
            selectedDate: date,
            currentDate: date || prev.currentDate,
        }));
    }, []);

    // Navigate to specific date
    const goToDate = useCallback((date: Date) => {
        setState((prev) => ({ ...prev, currentDate: date }));
    }, []);

    // Get visible date range based on current view
    const dateRange = useMemo(() => {
        const { currentDate, view } = state;

        switch (view) {
            case 'day':
                return {
                    start: new Date(currentDate.setHours(0, 0, 0, 0)),
                    end: new Date(currentDate.setHours(23, 59, 59, 999)),
                };
            case 'week':
                return {
                    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
                    end: endOfWeek(currentDate, { weekStartsOn: 0 }),
                };
            case 'month':
            case 'agenda':
                return {
                    start: startOfMonth(currentDate),
                    end: endOfMonth(currentDate),
                };
            default:
                return { start: currentDate, end: currentDate };
        }
    }, [state]);

    // Format title based on current view
    const title = useMemo(() => {
        const { currentDate, view } = state;

        switch (view) {
            case 'day':
                return format(currentDate, 'EEEE, MMMM d, yyyy');
            case 'week':
                const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
                const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
                return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
            case 'month':
            case 'agenda':
                return format(currentDate, 'MMMM yyyy');
            default:
                return format(currentDate, 'MMMM yyyy');
        }
    }, [state]);

    // Helper functions
    const isDateInRange = useCallback((date: Date) => {
        return isWithinInterval(date, dateRange);
    }, [dateRange]);

    const isDateSelected = useCallback((date: Date) => {
        return state.selectedDate ? isSameDay(date, state.selectedDate) : false;
    }, [state.selectedDate]);

    const isDateToday = useCallback((date: Date) => {
        return isToday(date);
    }, []);

    return {
        // State
        currentDate: state.currentDate,
        view: state.view,
        selectedDate: state.selectedDate,
        dateRange,
        title,

        // Navigation
        goToToday,
        goNext,
        goPrev,
        goToDate,

        // View
        setView,

        // Selection
        selectDate,

        // Helpers
        isDateInRange,
        isDateSelected,
        isDateToday,
    };
}
