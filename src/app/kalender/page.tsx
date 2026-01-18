"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragEndEvent,
    DragStartEvent,
    useDraggable,
    useDroppable,
    closestCenter,
    pointerWithin,
    rectIntersection,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { initDb } from "@/lib/db";
import { CalendarRange, Loader2, GripVertical, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
interface Room {
    id: string;
    name: string;
    type: string;
}

interface Booking {
    id: string;
    room_id: string;
    guest_id: string;
    guest_name: string;
    start_date: string;
    end_date: string;
    status: string;
    group_name?: string;
    occasion_title?: string;
}

interface DateCell {
    dateStr: string;
    displayDate: string;
    weekday: string;
}

// --- Helper Functions ---
function getDaysArray(startDate: Date, days: number = 14): DateCell[] {
    const dates: DateCell[] = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const displayDate = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        const weekday = d.toLocaleDateString('de-DE', { weekday: 'short' });
        dates.push({ dateStr, displayDate, weekday });
    }
    return dates;
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'Eingecheckt':
            return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300';
        case 'Ausgecheckt':
            return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300';
        case 'Storniert':
            return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300';
        case 'Fest gebucht':
            return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300';
        default: // 'Entwurf' or others
            return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300';
    }
}

// Check if a booking covers a specific date
function isBookingOnDate(booking: Booking, dateStr: string): boolean {
    return booking.start_date <= dateStr && booking.end_date > dateStr;
}

function getDaysCount(startDateStr: string, endDateStr: string): number {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// --- Components ---

// Resize Handle Component
function ResizeHandle({ id, position }: { id: string, position: 'top' | 'bottom' }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: id,
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={cn(
                "absolute left-0 right-0 h-3 z-20 flex justify-center items-center group cursor-ns-resize touch-none",
                position === 'top' ? "-top-1.5" : "-bottom-1.5"
            )}
        >
            <div className={cn(
                "w-8 h-1 rounded-full transition-colors",
                isDragging ? "bg-blue-500" : "bg-transparent group-hover:bg-blue-400/50"
            )} />
        </div>
    );
}

// Draggable Booking Component
function DraggableBooking({
    booking,
    isOverlay = false,
    durationDays = 1,
    isContinued = false,
    topOffsetDays = 0, // New prop for visual feedback
    isShaking = false // New prop for error feedback
}: {
    booking: Booking;
    isOverlay?: boolean;
    durationDays?: number;
    isContinued?: boolean;
    topOffsetDays?: number;
    isShaking?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: booking.id,
        data: { ...booking, durationDays }
    });

    // Calculate height based on duration. 
    // Row height is 64px (h-16). 
    // We want a small gap between bookings if they were stacked, but here they span.
    // Let's subtract a few pixels for margin.
    const height = durationDays * 64 - 8;

    const isCancelled = booking.status === 'Storniert';

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging && !isOverlay ? 0 : undefined,
        touchAction: 'none',
        height: `${height}px`,
        zIndex: isDragging ? 50 : (isCancelled ? 5 : 10),
        position: 'absolute', // Pin to top-left of cell to allow overlapping without layout shift
        top: 0,
        left: 0,
        width: '100%',
        marginTop: `${topOffsetDays * 64}px`, // Apply visual start date change
        transition: isDragging ? 'none' : 'margin-top 0.2s ease, height 0.2s ease', // Smooth transition when not dragging handles
    };

    // Removed old hardcoded color logic
    const statusColor = getStatusColor(booking.status);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "p-2 border text-xs shadow-sm cursor-grab active:cursor-grabbing select-none w-full truncate flex flex-col justify-start items-start gap-1 py-1",
                isCancelled && "line-through opacity-70", // Keep line-through for cancelled
                statusColor,
                isContinued ? "rounded-b-md border-t-0 border-dashed" : "rounded-md",
                isOverlay && "cursor-grabbing shadow-lg scale-105 z-50 opacity-90 ring-2 ring-blue-500",
                isShaking && "animate-shake ring-2 ring-red-500 z-50" // Apply shake and red ring
            )}
        >
            {/* Resize Handles - Only show if not overlay and not continued (for top) */}
            {!isOverlay && !isContinued && (
                <ResizeHandle id={`resize-top-${booking.id}`} position="top" />
            )}

            {/* Content */}
            <div className="flex items-center gap-1 w-full relative z-10 pointer-events-none">
                {/* Grip only for moving, so we wraps it to catch events if we wanted specific drag area, 
                     but parent is draggable. 
                     Actually, parent catches all events. 
                     The ResizeHandle sits on top (z-20) so it should catch its events first.
                 */}
                {!isOverlay && <GripVertical className="w-3 h-3 text-current opacity-50 flex-shrink-0 pointer-events-auto" />}
                <span className="truncate font-medium">
                    {booking.guest_name || "Unbekannt"}
                </span>
            </div>

            {booking.group_name && <span className="text-[10px] opacity-75 px-4 relative z-10 pointer-events-none">({booking.group_name})</span>}

            {durationDays > 1 && (
                <div className="mt-auto self-end text-[10px] opacity-60 pr-1 pb-1 relative z-10 pointer-events-none">
                    {durationDays} Nächte
                </div>
            )}

            {!isOverlay && (
                <ResizeHandle id={`resize-bottom-${booking.id}`} position="bottom" />
            )}
        </div>
    );
}

// Droppable Cell Component
function DroppableCell({
    roomId,
    dateStr,
    children,
    weekday
}: {
    roomId: string;
    dateStr: string;
    children?: React.ReactNode;
    weekday: string
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: `${roomId}::${dateStr}`,
        data: { roomId, dateStr }
    });

    const isWeekend = weekday === 'Sa' || weekday === 'So';

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "w-40 flex-shrink-0 h-16 border-b border-r border-zinc-200 dark:border-zinc-800 p-1 transition-colors relative",
                // Removing overflow-hidden or auto to allow booking to span multiple cells visually
                "overflow-visible",
                isOver ? "bg-blue-50 dark:bg-blue-900/20 ring-inset ring-2 ring-blue-500/50" : "",
                isWeekend && !isOver ? "bg-zinc-50/50 dark:bg-zinc-900/50" : ""
            )}
        >
            {/* 
               We remove flex-col and overflow-y-auto because we want absolute positioning behavior mostly,
               or just standard block flow that spills over. 
               Actually, standard flow with a specific height on the child works best.
            */}
            <div className="relative w-full h-full">
                {children}
            </div>
        </div>
    );
}


export default function KalenderPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [viewDate, setViewDate] = useState(new Date()); // State for date filter
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
    const [resizingState, setResizingState] = useState<{ bookingId: string, newStart: string, newEnd: string } | null>(null);
    const [shakeId, setShakeId] = useState<string | null>(null); // State for shake animation
    const lastScrollTime = useRef<number>(0); // Throttle for auto-scroll

    const dates = getDaysArray(viewDate);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const fetchData = async () => {
        try {
            const db = await initDb();
            if (!db) return;

            const fetchedRooms = await db.select<Room[]>(
                "SELECT id, name, type FROM rooms ORDER BY name"
            );
            setRooms(fetchedRooms);

            // Fetch bookings that overlap with our 14 day window or are just generally active
            // For simplicity, let's fetch active bookings (not far past)
            // Ideally we filter by date range in SQL, but let's fetch all relevant ones for now to be safe with "rolling" view
            const today = new Date().toISOString().split('T')[0];
            const fetchedBookings = await db.select<Booking[]>(`
                SELECT 
                    b.id, b.room_id, b.guest_id, b.start_date, b.end_date, b.status,
                    g.name as guest_name,
                    bg.name as group_name,
                    o.title as occasion_title
                FROM bookings b
                LEFT JOIN guests g ON b.guest_id = g.id
                LEFT JOIN booking_groups bg ON b.group_id = bg.id
                LEFT JOIN occasions o ON b.occasion_id = o.id
                WHERE b.end_date >= ?
                ORDER BY b.start_date
            `, [today]);

            setBookings(fetchedBookings);

        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);

        // If it's a resize handle, find the booking it belongs to
        if ((active.id as string).startsWith('resize-')) {
            const resizeId = active.id as string;
            const isTop = resizeId.startsWith('resize-top-');
            const bookingId = resizeId.replace(isTop ? 'resize-top-' : 'resize-bottom-', '');
            const booking = bookings.find(b => b.id === bookingId);
            if (booking) setActiveBooking(booking);
        } else {
            const booking = bookings.find(b => b.id === active.id);
            if (booking) setActiveBooking(booking);
        }
    };

    const handleDragOver = (event: DragEndEvent) => { // Using DragEndEvent type for convenience as it has active/over
        const { active, over } = event;
        if (!over) return;

        // Parse target
        const [_, targetDateStr] = (over.id as string).split('::');

        // --- Dynamic Auto-Scroll Logic ---
        if (targetDateStr) {
            const now = Date.now();
            if (now - lastScrollTime.current > 400) { // Throttle scroll speed
                const firstDate = dates[0].dateStr;
                const lastDate = dates[dates.length - 1].dateStr;

                if (targetDateStr === firstDate) {
                    // Scroll Up (Backwards)
                    const prevDate = new Date(viewDate);
                    prevDate.setDate(prevDate.getDate() - 1);
                    setViewDate(prevDate);
                    lastScrollTime.current = now;
                } else if (targetDateStr === lastDate) {
                    // Scroll Down (Forwards)
                    const nextDate = new Date(viewDate);
                    nextDate.setDate(nextDate.getDate() + 1);
                    setViewDate(nextDate);
                    lastScrollTime.current = now;
                }
            }
        }

        // Handle Live Resize Feedback
        if ((active.id as string).startsWith('resize-')) {
            const resizeId = active.id as string;
            const isTop = resizeId.startsWith('resize-top-');
            const bookingId = resizeId.replace(isTop ? 'resize-top-' : 'resize-bottom-', '');

            const booking = bookings.find(b => b.id === bookingId);
            if (!booking) return;

            if (!targetDateStr) return;

            const addDays = (dateS: string, days: number) => {
                const d = new Date(dateS);
                d.setDate(d.getDate() + days);
                return d.toISOString().split('T')[0];
            };

            let newStart = booking.start_date;
            let newEnd = booking.end_date;

            if (isTop) {
                newStart = targetDateStr;
                if (newStart >= newEnd) return; // Ignore invalid
            } else {
                newEnd = addDays(targetDateStr, 1);
                if (newEnd <= newStart) return; // Ignore invalid
            }

            // Only update state if changed (optimization)
            if (resizingState?.newStart !== newStart || resizingState?.newEnd !== newEnd) {
                setResizingState({ bookingId, newStart, newEnd });
            }
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveBooking(null);
        setResizingState(null); // Clear resize state

        if (!over) return;

        // Check for Resize Events
        if ((active.id as string).startsWith('resize-')) {
            const resizeId = active.id as string;
            const isTop = resizeId.startsWith('resize-top-');
            const bookingId = resizeId.replace(isTop ? 'resize-top-' : 'resize-bottom-', '');

            // Find booking
            const bookingIndex = bookings.findIndex(b => b.id === bookingId);
            if (bookingIndex === -1) return;
            const booking = bookings[bookingIndex];

            // Parse target
            const [_, targetDateStr] = (over.id as string).split('::');
            if (!targetDateStr) return; // Dropped on something invalid

            let newStart = booking.start_date;
            let newEnd = booking.end_date;

            // Date math helpers
            const addDays = (dateS: string, days: number) => {
                const d = new Date(dateS);
                d.setDate(d.getDate() + days);
                return d.toISOString().split('T')[0];
            };

            if (isTop) {
                // Resize Top: Changing Start Date
                // New start date is the drop target
                newStart = targetDateStr;

                // Validate: newStart must be < end_date
                if (newStart >= newEnd) {
                    // Invalid: Cannot move start past end. 
                    // Could maybe clamp or swap, but for now just ignore/alert?
                    // Ignoring is safer UX than swapping implicitly.
                    return;
                }
            } else {
                // Resize Bottom: Changing End Date
                // The drop target is the NEW "Last Night". 
                // So end_date (checkout) should be target + 1 day
                // Example: Drag to Jan 3. Means staying night of Jan 3. Checkout Jan 4.
                newEnd = addDays(targetDateStr, 1);

                // Validate: newEnd > start_date
                if (newEnd <= newStart) {
                    return;
                }
            }

            // Optimistic Update
            const updatedBooking = {
                ...booking,
                start_date: newStart,
                end_date: newEnd
            };

            const newBookings = [...bookings];
            newBookings[bookingIndex] = updatedBooking;
            setBookings(newBookings);

            // Persist
            try {
                const db = await initDb();
                if (db) {
                    await db.execute(
                        "UPDATE bookings SET start_date = ?, end_date = ? WHERE id = ?",
                        [newStart, newEnd, booking.id]
                    );
                }
            } catch (err) {
                console.error("Failed to resize booking:", err);
                setBookings(bookings); // Revert
                alert("Fehler beim Ändern des Zeitraums.");
            }
            return;
        }

        // --- Standard Move Logic ---

        // Parse target
        const [targetRoomId, targetDateStr] = (over.id as string).split('::');

        // Find booking
        const bookingIndex = bookings.findIndex(b => b.id === active.id);
        if (bookingIndex === -1) return;

        const booking = bookings[bookingIndex];

        // Check if anything actually changed
        if (booking.room_id === targetRoomId && booking.start_date === targetDateStr) {
            return;
        }

        // Calculate new end date based on duration
        const oldStart = new Date(booking.start_date);
        const oldEnd = new Date(booking.end_date);
        const durationMs = oldEnd.getTime() - oldStart.getTime();

        const newStart = new Date(targetDateStr);
        const newEnd = new Date(newStart.getTime() + durationMs);

        const newStartDateStr = targetDateStr;
        const newEndDateStr = newEnd.toISOString().split('T')[0];

        // --- Collision Detection ---
        const overlappingBookings = bookings.filter(b => {
            if (b.id === booking.id) return false;
            if (b.room_id !== targetRoomId) return false;
            // Check intersection: (StartA < EndB) && (EndA > StartB)
            return (newStartDateStr < b.end_date) && (newEndDateStr > b.start_date);
        });

        const isBlocking = overlappingBookings.some(b => {
            // Allow overlap if booking is Storniert or Draft
            const isAllowed = b.status === "Storniert" || b.status === "Draft" || b.status === "Entwurf";
            return !isAllowed;
        });

        if (isBlocking) {
            // Trigger Shake
            setShakeId(booking.id);
            setTimeout(() => setShakeId(null), 500);
            return; // Abort update
        }

        // Optimistic Update
        const updatedBooking = {
            ...booking,
            room_id: targetRoomId,
            start_date: newStartDateStr,
            end_date: newEndDateStr
        };

        const newBookings = [...bookings];
        newBookings[bookingIndex] = updatedBooking;
        setBookings(newBookings);

        // Persist
        try {
            const db = await initDb();
            if (db) {
                await db.execute(
                    "UPDATE bookings SET room_id = ?, start_date = ?, end_date = ? WHERE id = ?",
                    [targetRoomId, newStartDateStr, newEndDateStr, booking.id]
                );
            }
        } catch (err) {
            console.error("Failed to update booking:", err);
            // Revert on error
            setBookings(bookings);
            alert("Fehler beim Verschieben der Buchung.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex flex-col gap-4 sticky top-0 bg-white dark:bg-zinc-950 z-50 pb-2">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                        <CalendarRange className="w-8 h-8 text-blue-600" />
                        Kalender-Übersicht
                    </h1>
                    <div className="flex items-center gap-4">
                        {/* Date Picker */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Datum:</span>
                            <input
                                type="date"
                                className="border rounded p-1 dark:bg-zinc-900 dark:border-zinc-800"
                                value={viewDate.toISOString().split('T')[0]}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setViewDate(new Date(e.target.value));
                                    }
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                            <AlertCircle className="w-4 h-4" />
                            <span>Drag & Drop zum Verschieben</span>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-zinc-100 border border-zinc-200"></div>
                        <span>Entwurf</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
                        <span>Fest gebucht</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
                        <span>Eingecheckt</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-orange-100 border border-orange-200"></div>
                        <span>Ausgecheckt</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>
                        <span>Storniert</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm bg-white dark:bg-zinc-950">
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    autoScroll={{
                        acceleration: 10,
                    }}
                >
                    <div className="min-w-fit inline-block">
                        {/* Header Row: Rooms */}
                        <div className="flex sticky top-0 z-40 bg-white dark:bg-zinc-950 shadow-sm border-b border-zinc-200 dark:border-zinc-800 w-max">
                            {/* Empty corner cell - visual anchor */}
                            <div className="w-24 flex-shrink-0 p-3 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 font-medium text-zinc-500 text-sm sticky left-0 z-50">
                                Datum
                            </div>
                            {/* Room Columns */}
                            {rooms.map(room => (
                                <div key={room.id} className="w-40 flex-shrink-0 p-3 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 font-medium text-zinc-700 dark:text-zinc-300 text-sm truncate" title={room.name}>
                                    {room.name}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Body */}
                        <div className="flex flex-col w-max">
                            {dates.map((date, dateIndex) => (
                                <div key={date.dateStr} className="flex">
                                    {/* Date Column */}
                                    <div className="w-24 flex-shrink-0 sticky left-0 z-30 bg-white dark:bg-zinc-950 p-2 border-r border-b border-zinc-200 dark:border-zinc-800 flex flex-col justify-center items-center">
                                        <span className={cn(
                                            "text-sm font-bold",
                                            (date.weekday === 'Sa' || date.weekday === 'So') ? "text-blue-600" : "text-zinc-700 dark:text-zinc-300"
                                        )}>
                                            {date.displayDate}
                                        </span>
                                        <span className="text-xs text-zinc-500">{date.weekday}</span>
                                    </div>

                                    {/* Room Cells */}
                                    {rooms.map((room) => {
                                        // Logic for rendering bookings:
                                        // 1. If a booking STARTS on this date, render it with full duration.
                                        // 2. If valid booking started BEFORE this window (and is the first date of window), render remaining duration.

                                        const isFirstDateOfView = dateIndex === 0;

                                        // Bookings starting exactly today
                                        const startingBookings = bookings.filter(b => b.room_id === room.id && b.start_date === date.dateStr);

                                        // Bookings that started before but are still ongoing on the first day of view
                                        const continuedBookings = isFirstDateOfView ? bookings.filter(b =>
                                            b.room_id === room.id &&
                                            b.start_date < date.dateStr &&
                                            b.end_date > date.dateStr
                                        ) : [];

                                        return (
                                            <DroppableCell
                                                key={`${room.id}-${date.dateStr}`}
                                                roomId={room.id}
                                                dateStr={date.dateStr}
                                                weekday={date.weekday}
                                            >
                                                {/* Render Continued Bookings (only on first day) */}
                                                {continuedBookings.map(b => {
                                                    const daysRemaining = getDaysCount(date.dateStr, b.end_date);
                                                    return (
                                                        <DraggableBooking
                                                            key={b.id}
                                                            booking={b}
                                                            durationDays={daysRemaining}
                                                            isContinued={true}
                                                            isShaking={shakeId === b.id}
                                                        />
                                                    );
                                                })}

                                                {/* Render New Bookings */}
                                                {startingBookings.map(b => {
                                                    let duration = getDaysCount(b.start_date, b.end_date);
                                                    let topOffset = 0;

                                                    // Apply resize feedback override
                                                    if (resizingState && resizingState.bookingId === b.id) {
                                                        const newDuration = getDaysCount(resizingState.newStart, resizingState.newEnd);

                                                        // Calculate top offset if start date changed
                                                        const diffDays = getDaysCount(b.start_date, resizingState.newStart);
                                                        // Direction check:
                                                        const isLater = resizingState.newStart > b.start_date;
                                                        topOffset = isLater ? diffDays : -diffDays;

                                                        duration = newDuration;
                                                    }

                                                    return (
                                                        <DraggableBooking
                                                            key={b.id}
                                                            booking={b}
                                                            durationDays={duration}
                                                            topOffsetDays={topOffset}
                                                            isShaking={shakeId === b.id}
                                                        />
                                                    );
                                                })}
                                            </DroppableCell>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    <DragOverlay>
                        {activeBooking && !activeId?.startsWith('resize-') ? (
                            <DraggableBooking
                                booking={activeBooking}
                                isOverlay
                                // Best effort guess for overlay duration if we don't have it explicitly stored in activeBooking
                                // Actually we passed it in `active.data.current.durationDays` but here we just have activeBooking state.
                                // Let's recalculate or just default.
                                durationDays={getDaysCount(activeBooking.start_date, activeBooking.end_date)}
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div >
        </div >
    );
}
