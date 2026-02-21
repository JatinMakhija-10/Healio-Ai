"use client";

import { useMemo, useCallback, useState } from 'react';
import { Calendar, dateFnsLocalizer, Views, SlotInfo, View } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
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
    Clock,
    Video,
    MapPin,
    User,
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

// Create Drag-and-Drop calendar
const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar);

// Tooltip component for event hover
function EventTooltip({ event, position }: { event: CalendarEvent; position: { x: number; y: number } }) {
    const apt = event.resource;
    const statusColors: Record<string, string> = {
        scheduled: 'bg-blue-500',
        confirmed: 'bg-green-500',
        in_progress: 'bg-purple-500',
        completed: 'bg-slate-400',
    };

    return (
        <div
            className="fixed z-[100] bg-white rounded-xl shadow-2xl border p-4 w-64 pointer-events-none animate-in fade-in zoom-in-95"
            style={{ top: position.y + 10, left: position.x + 10 }}
        >
            {/* Patient */}
            <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-xs font-bold">
                    {apt.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                    <p className="font-semibold text-sm text-slate-900">{apt.patientName}</p>
                    <div className="flex items-center gap-1">
                        <span className={cn("w-2 h-2 rounded-full", statusColors[apt.status] || 'bg-slate-300')} />
                        <span className="text-[10px] text-slate-500 capitalize">{apt.status.replace(/_/g, ' ')}</span>
                    </div>
                </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                <Clock className="h-3 w-3" />
                <span>{format(event.start, 'h:mm a')} – {format(event.end, 'h:mm a')}</span>
                <span className="text-slate-300">•</span>
                <span>{apt.duration}m</span>
            </div>

            {/* Complaint */}
            {apt.chiefComplaint && (
                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border">
                    <span className="font-medium text-slate-700">Chief: </span>
                    {apt.chiefComplaint}
                </div>
            )}

            <div className="text-[10px] text-slate-400 mt-2 text-center">Click to view details</div>
        </div>
    );
}

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

    const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

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

    // Stats
    const stats = useMemo(() => {
        const today = new Date();
        const todayCount = appointments.filter(apt => {
            const d = new Date(apt.scheduledAt);
            return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
                && !apt.status.includes('cancelled');
        }).length;
        const activeCount = appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;
        return { todayCount, activeCount, total: appointments.length };
    }, [appointments]);

    // Event styling based on status
    const eventPropGetter = useCallback((event: CalendarEvent) => {
        const apt = event.resource;
        let className = 'rounded-md border-l-4 text-xs font-medium cursor-pointer';
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
                    style = { backgroundColor: '#fee2e2', borderLeftColor: '#dc2626', color: '#991b1b', textDecoration: 'line-through', opacity: 0.6 };
                }
        }

        if (apt.isUrgent) {
            style.borderLeftWidth = '6px';
            style.borderLeftColor = '#dc2626';
        }

        return { className, style };
    }, []);

    // Drag and drop handler
    const handleEventDrop = useCallback(({ event, start, end }: { event: CalendarEvent; start: string | Date; end: string | Date }) => {
        if (onReschedule) {
            onReschedule(event.id, new Date(start), new Date(end));
        }
    }, [onReschedule]);

    // Resize handler
    const handleEventResize = useCallback(({ event, start, end }: { event: CalendarEvent; start: string | Date; end: string | Date }) => {
        if (onReschedule) {
            onReschedule(event.id, new Date(start), new Date(end));
        }
    }, [onReschedule]);

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
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToToday}
                        className="text-sm font-medium"
                    >
                        Today
                    </Button>
                    <div className="flex items-center border rounded-lg overflow-hidden">
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
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

                    {/* Mini Stats */}
                    <div className="hidden md:flex items-center gap-2 ml-3">
                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200">
                            {stats.todayCount} today
                        </Badge>
                        <Badge variant="outline" className="text-[10px] bg-green-50 text-green-600 border-green-200">
                            {stats.activeCount} active
                        </Badge>
                    </div>
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
            <div className="flex items-center gap-4 px-4 py-2 border-b text-xs flex-wrap">
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
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-slate-100 border-l-4 border-slate-500" />
                    <span className="text-slate-500">Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-red-100 border-l-4 border-red-500" />
                    <span className="text-slate-500">Cancelled</span>
                </div>
                <div className="text-[10px] text-slate-400 ml-auto hidden md:block">
                    Drag events to reschedule
                </div>
            </div>

            {/* Calendar */}
            <CardContent className="p-0 relative">
                <div className="h-[600px]">
                    <DnDCalendar
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
                        onEventDrop={handleEventDrop as any}
                        onEventResize={handleEventResize as any}
                        selectable
                        resizable
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
                                <div
                                    className="p-1 overflow-hidden"
                                    onMouseEnter={(e) => {
                                        setHoveredEvent(event);
                                        setTooltipPos({ x: e.clientX, y: e.clientY });
                                    }}
                                    onMouseLeave={() => setHoveredEvent(null)}
                                >
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

                {/* Tooltip */}
                {hoveredEvent && <EventTooltip event={hoveredEvent} position={tooltipPos} />}
            </CardContent>
        </Card>
    );
}
