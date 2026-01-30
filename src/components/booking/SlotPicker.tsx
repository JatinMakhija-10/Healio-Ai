"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface Doctor {
    availability: Record<string, string[]>;
    consultation_duration: number;
}

interface SlotPickerProps {
    doctor: Doctor;
    onSlotSelect: (date: Date, time: string) => void;
    existingAppointments?: Array<{ scheduled_at: string }>;
}

export function SlotPicker({ doctor, onSlotSelect, existingAppointments = [] }: SlotPickerProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [weekOffset, setWeekOffset] = useState(0);

    // Generate dates for the current week view
    const getDatesForWeek = () => {
        const dates: Date[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() + weekOffset * 7);

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            dates.push(date);
        }

        return dates;
    };

    const dates = getDatesForWeek();

    // Get available slots for a given date
    const getSlotsForDate = (date: Date): string[] => {
        const dayMap: Record<number, string> = {
            0: "sun",
            1: "mon",
            2: "tue",
            3: "wed",
            4: "thu",
            5: "fri",
            6: "sat",
        };

        const dayKey = dayMap[date.getDay()];
        const availability = doctor.availability[dayKey];

        if (!availability || availability.length === 0) {
            return [];
        }

        const slots: string[] = [];
        const duration = doctor.consultation_duration || 30;

        for (const range of availability) {
            const [start, end] = range.split("-");
            if (!start || !end) continue;

            const [startHour, startMin] = start.split(":").map(Number);
            const [endHour, endMin] = end.split(":").map(Number);

            let currentHour = startHour;
            let currentMin = startMin;

            while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
                const slotTime = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;

                // Check if slot is in the past (for today)
                const now = new Date();
                const isToday = date.toDateString() === now.toDateString();
                if (isToday) {
                    const slotDate = new Date(date);
                    slotDate.setHours(currentHour, currentMin);
                    if (slotDate <= now) {
                        currentMin += duration;
                        if (currentMin >= 60) {
                            currentHour += Math.floor(currentMin / 60);
                            currentMin = currentMin % 60;
                        }
                        continue;
                    }
                }

                // Check if slot is already booked
                const slotDateTime = new Date(date);
                slotDateTime.setHours(currentHour, currentMin, 0, 0);

                const isBooked = existingAppointments.some((apt) => {
                    const aptTime = new Date(apt.scheduled_at);
                    return Math.abs(aptTime.getTime() - slotDateTime.getTime()) < duration * 60 * 1000;
                });

                if (!isBooked) {
                    slots.push(slotTime);
                }

                currentMin += duration;
                if (currentMin >= 60) {
                    currentHour += Math.floor(currentMin / 60);
                    currentMin = currentMin % 60;
                }
            }
        }

        return slots;
    };

    const formatDate = (date: Date) => ({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        date: date.getDate(),
        month: date.toLocaleDateString("en-US", { month: "short" }),
    });

    const isDateAvailable = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today && getSlotsForDate(date).length > 0;
    };

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setSelectedTime(null);
    };

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
        if (selectedDate) {
            onSlotSelect(selectedDate, time);
        }
    };

    return (
        <div className="space-y-6">
            {/* Week Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                    disabled={weekOffset === 0}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-slate-600">
                    {dates[0].toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setWeekOffset(weekOffset + 1)}
                    disabled={weekOffset >= 3} // Max 4 weeks ahead
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Date Selector */}
            <div className="grid grid-cols-7 gap-2">
                {dates.map((date) => {
                    const { day, date: dayNum, month } = formatDate(date);
                    const available = isDateAvailable(date);
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    const isToday = new Date().toDateString() === date.toDateString();

                    return (
                        <button
                            key={date.toISOString()}
                            onClick={() => available && handleDateSelect(date)}
                            disabled={!available}
                            className={cn(
                                "flex flex-col items-center p-2 rounded-xl transition-all",
                                "border-2",
                                available
                                    ? "cursor-pointer hover:border-teal-300 hover:bg-teal-50"
                                    : "cursor-not-allowed opacity-40",
                                isSelected
                                    ? "border-teal-500 bg-teal-50"
                                    : "border-transparent bg-slate-50",
                                isToday && !isSelected && available && "ring-2 ring-teal-200"
                            )}
                        >
                            <span className="text-xs font-medium text-slate-500">{day}</span>
                            <span
                                className={cn(
                                    "text-lg font-bold",
                                    isSelected ? "text-teal-600" : "text-slate-900"
                                )}
                            >
                                {dayNum}
                            </span>
                            <span className="text-[10px] text-slate-400">{month}</span>
                        </button>
                    );
                })}
            </div>

            {/* Time Slots */}
            {selectedDate && (
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700">
                        Available Times for {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                        {getSlotsForDate(selectedDate).map((time) => {
                            const isSelected = selectedTime === time;

                            // Format time for display (12-hour)
                            const [hour, min] = time.split(":").map(Number);
                            const displayTime = `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${String(min).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;

                            return (
                                <button
                                    key={time}
                                    onClick={() => handleTimeSelect(time)}
                                    className={cn(
                                        "py-2.5 px-3 rounded-lg text-sm font-medium transition-all",
                                        "border-2",
                                        isSelected
                                            ? "border-teal-500 bg-teal-500 text-white"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"
                                    )}
                                >
                                    {isSelected && <Check className="h-3 w-3 inline mr-1" />}
                                    {displayTime}
                                </button>
                            );
                        })}
                    </div>
                    {getSlotsForDate(selectedDate).length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-4">
                            No available slots for this date. Please select another day.
                        </p>
                    )}
                </div>
            )}

            {!selectedDate && (
                <p className="text-sm text-slate-500 text-center py-4">
                    Select a date to view available time slots
                </p>
            )}
        </div>
    );
}
