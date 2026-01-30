"use client";

import { useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, SlotInfo, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    List,
    LayoutGrid,
    Clock
} from 'lucide-react';
import { useCalendar, CalendarView as CalendarViewType } from '@/hooks/useCalendar';
import { Appointment } from '@/stores/appointmentStore';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
    getDay,
    locales,
});

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource: Appointment;
}

interface CalendarViewProps {
    appointments: Appointment[];
    onSelectSlot?: (slotInfo: SlotInfo) => void;
    onSelectEvent?: (event: CalendarEvent) => void;
    onReschedule?: (appointmentId: string, newStart: Date, newEnd: Date) => void;
    className?: string;
}

const viewIcons: Record<CalendarViewType, React.ReactNode> = {
    day: <Clock className="h-4 w-4" />,
    week: <LayoutGrid className="h-4 w-4" />,
    month: <CalendarIcon className="h-4 w-4" />,
    agenda: <List className="h-4 w-4" />,
};

export function CalendarViewComponent({
    appointments,
    onSelectSlot,
    onSelectEvent,
    onReschedule,
    className,
}: CalendarViewProps) {
    const {
        currentDate,
        view,
        title,
        goToToday,
        goNext,
        goPrev,
        setView,
        goToDate,
    } = useCalendar('week');

    // Convert appointments to calendar events
    const events: CalendarEvent[] = useMemo(() => {
        return appointments.map((apt) => ({
            id: apt.id,
            title: `${apt.patientName}${apt.chiefComplaint ? ` - ${apt.chiefComplaint}` : ''}`,
            start: new Date(apt.scheduledAt),
            end: new Date(new Date(apt.scheduledAt).getTime() + apt.duration * 60 * 1000),
            resource: apt,
        }));
    }, [appointments]);

    // Event styling based on status
    const eventPropGetter = useCallback((event: CalendarEvent) => {
        const apt = event.resource;
        let className = 'rounded-md border-l-4 text-xs font-medium';
        let style: React.CSSProperties = {};

        switch (apt.status) {
            case 'confirmed':
                style = { backgroundColor: '#d1fae5', borderLeftColor: '#059669', color: '#065f46' };
                break;
            case 'scheduled':
                style = { backgroundColor: '#dbeafe', borderLeftColor: '#2563eb', color: '#1e40af' };
                break;
            case 'in_progress':
                style = { backgroundColor: '#fae8ff', borderLeftColor: '#9333ea', color: '#6b21a8' };
                break;
            case 'completed':
                style = { backgroundColor: '#f1f5f9', borderLeftColor: '#64748b', color: '#475569' };
                break;
            default:
                if (apt.status.includes('cancelled')) {
                    style = { backgroundColor: '#fee2e2', borderLeftColor: '#dc2626', color: '#991b1b', textDecoration: 'line-through' };
                }
        }

        if (apt.isUrgent) {
            style.borderLeftWidth = '6px';
            style.borderLeftColor = '#dc2626';
        }

        return { className, style };
    }, []);

    // Map view types
    const rbcView = useMemo(() => {
        const viewMap: Record<CalendarViewType, View> = {
            day: Views.DAY,
            week: Views.WEEK,
            month: Views.MONTH,
            agenda: Views.AGENDA,
        };
        return viewMap[view];
    }, [view]);

    return (
        <Card className={cn("overflow-hidden", className)}>
            {/* Custom Toolbar */}
            <div className="flex items-center justify-between p-4 border-b bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToToday}
                        className="text-sm"
                    >
                        Today
                    </Button>
                    <div className="flex items-center border rounded-md overflow-hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goPrev}
                            className="rounded-none h-8 w-8"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goNext}
                            className="rounded-none h-8 w-8"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 ml-2">{title}</h2>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    {(['day', 'week', 'month', 'agenda'] as CalendarViewType[]).map((v) => (
                        <Button
                            key={v}
                            variant={view === v ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView(v)}
                            className={cn(
                                "gap-1.5 capitalize text-xs",
                                view === v && "bg-white shadow-sm"
                            )}
                        >
                            {viewIcons[v]}
                            <span className="hidden sm:inline">{v}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-4 py-2 border-b text-xs">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-100 border-l-4 border-blue-600" />
                    <span className="text-slate-500">Scheduled</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-green-100 border-l-4 border-green-600" />
                    <span className="text-slate-500">Confirmed</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-purple-100 border-l-4 border-purple-600" />
                    <span className="text-slate-500">In Progress</span>
                </div>
            </div>

            {/* Calendar */}
            <CardContent className="p-0">
                <div className="h-[600px]">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        view={rbcView}
                        date={currentDate}
                        onNavigate={goToDate}
                        onView={(v) => setView(v as CalendarViewType)}
                        onSelectSlot={onSelectSlot}
                        onSelectEvent={onSelectEvent}
                        selectable
                        eventPropGetter={eventPropGetter}
                        step={15}
                        timeslots={4}
                        min={new Date(1970, 1, 1, 8, 0, 0)}
                        max={new Date(1970, 1, 1, 20, 0, 0)}
                        formats={{
                            timeGutterFormat: 'h:mm a',
                            eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                                `${localizer?.format(start, 'h:mm a', culture)} - ${localizer?.format(end, 'h:mm a', culture)}`,
                        }}
                        components={{
                            event: ({ event }) => (
                                <div className="p-1 overflow-hidden">
                                    <div className="font-medium truncate">{event.resource.patientName}</div>
                                    {event.resource.chiefComplaint && (
                                        <div className="text-[10px] opacity-75 truncate">
                                            {event.resource.chiefComplaint}
                                        </div>
                                    )}
                                </div>
                            ),
                        }}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
