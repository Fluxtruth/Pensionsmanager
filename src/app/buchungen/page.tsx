"use client";

import React, { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Plus,
    Settings,
    Trash2,
    LogIn,
    LogOut,
    XCircle,
    Calendar,
    Search,
    UserPlus,
    ChevronRight,
    ChevronLeft,
    Check,
    BedDouble,
    Bed,
    Home,
    Users,
    ArrowRight,
    Eye,
    EyeOff
} from "lucide-react";
import { ROOM_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { initDb } from "@/lib/db";
import { Switch } from "@/components/ui/switch";
import { NationalitySelector } from "@/components/NationalitySelector";

interface Booking {
    id: string;
    room_id: string;
    room_name?: string;
    guest_id: string;
    guest_name?: string;
    occasion?: string;
    start_date: string;
    end_date: string;
    status: string;
    payment_status: string;
    estimated_arrival_time?: string;
    guest_phone?: string;
    guest_email?: string;
    group_id?: string;
    group_name?: string;
    is_family_room?: number;
    has_dog?: number;
    is_allergy_friendly?: number;
    has_mobility_impairment?: number;
}

interface BookingGroup {
    id: string;
    name: string;
}

interface Room {
    id: string;
    name: string;
    type: string;
    base_price: number;
}

interface Guest {
    id: string;
    name: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email?: string;
    phone?: string;
    company?: string;
    notes?: string;
    contact_info?: string;
    nationality?: string;
}

interface BreakfastOption {
    id: string;
    booking_id: string;
    date: string;
    is_included: number;
    time: string;
    guest_count: number;
    comments: string;
}

function BookingsList() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const filterParam = searchParams.get("filter");
    const editId = searchParams.get("edit");
    const checkoutId = searchParams.get("checkout");
    const today = new Date().toISOString().split('T')[0];

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [guests, setGuests] = useState<Guest[]>([]);

    // Filter States
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateFromFilter, setDateFromFilter] = useState<string>("");
    const [dateToFilter, setDateToFilter] = useState<string>("");
    const [dateTypeFilter, setDateTypeFilter] = useState<"start" | "end">("start");
    const [showPastBookings, setShowPastBookings] = useState<boolean>(false);
    const [hideCanceled, setHideCanceled] = useState<boolean>(false);
    const [groups, setGroups] = useState<BookingGroup[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [isGroupDeleteOpen, setIsGroupDeleteOpen] = useState(false);
    const [deletingGroup, setDeletingGroup] = useState<BookingGroup | null>(null);
    const [renameValue, setRenameValue] = useState("");

    // UI States
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [editTab, setEditTab] = useState<"details" | "breakfast">("details");
    const [breakfastOptions, setBreakfastOptions] = useState<BreakfastOption[]>([]);
    const [editGroupId, setEditGroupId] = useState<string>("none");
    const [editNewGroupName, setEditNewGroupName] = useState<string>("");
    const [groupSearch, setGroupSearch] = useState<string>("");
    const [editGroupSearch, setEditGroupSearch] = useState<string>("");

    // Check-Out Summary States
    const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
    const [checkOutBooking, setCheckOutBooking] = useState<Booking | null>(null);

    // Guest Mask States
    const [isGuestMaskOpen, setIsGuestMaskOpen] = useState(false);
    const [editingGuestForMask, setEditingGuestForMask] = useState<Guest | null>(null);

    // Wizard States
    const [wizardStep, setWizardStep] = useState(1); // 1: Guest, 1.5: Create Guest, 2: Dates, 3: Rooms
    const [wizardData, setWizardData] = useState({
        guestId: "",
        guestName: "",
        startDate: "",
        endDate: "",
        roomType: "",
        roomId: "",
        occasion: "",
        arrivalTime: "",
        groupId: "",
        newGroupName: "",
        isFamilyRoom: false,
        hasDog: false,
        isAllergyFriendly: false,
        hasMobilityImpairment: false
    });
    const [guestSearch, setGuestSearch] = useState("");
    const [isCreatingGuest, setIsCreatingGuest] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const db = await initDb();
            if (db) {
                const bookingResults = await db.select<Booking[]>(`
                    SELECT b.*, g.name as guest_name, g.phone as guest_phone, g.email as guest_email, r.name as room_name, bg.name as group_name
                    FROM bookings b 
                    LEFT JOIN guests g ON b.guest_id = g.id
                    LEFT JOIN rooms r ON b.room_id = r.id
                    LEFT JOIN booking_groups bg ON b.group_id = bg.id
                `);
                setBookings(bookingResults || []);

                const [roomResults, guestResults, groupResults] = await Promise.all([
                    db.select<Room[]>("SELECT * FROM rooms"),
                    db.select<Guest[]>("SELECT * FROM guests"),
                    db.select<BookingGroup[]>("SELECT * FROM booking_groups")
                ]);

                setRooms(roomResults || []);
                setGuests(guestResults || []);
                setGroups(groupResults || []);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
        }
    }, []);

    const updateGuestInMask = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingGuestForMask) return;

        const formData = new FormData(e.currentTarget);
        const firstName = formData.get("first_name") as string;
        const middleName = formData.get("middle_name") as string;
        const lastName = formData.get("last_name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const company = formData.get("company") as string;
        const notes = formData.get("notes") as string;
        const nationality = formData.get("nationality") as string;

        const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
        const contactInfo = [email, phone].filter(Boolean).join(" / ");

        try {
            const db = await initDb();
            if (db) {
                await db.execute(
                    "UPDATE guests SET name = ?, first_name = ?, middle_name = ?, last_name = ?, email = ?, phone = ?, company = ?, notes = ?, contact_info = ?, nationality = ? WHERE id = ?",
                    [fullName, firstName, middleName, lastName, email, phone, company, notes, contactInfo, nationality, editingGuestForMask.id]
                );
                await loadData();
                setIsGuestMaskOpen(false);
                setEditingGuestForMask(null);
            }
        } catch (error) {
            console.error("Failed to update guest:", error);
            alert("Fehler beim Aktualisieren des Gastes.");
        }
    };

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (filterParam === "checkin") {
            setDateFromFilter(today);
            setDateToFilter(today);
            setDateTypeFilter("start");
            setStatusFilter("all");
        } else if (filterParam === "checkout") {
            setDateFromFilter(today);
            setDateToFilter(today);
            setDateTypeFilter("end");
            setStatusFilter("all");
        } else if (filterParam === "drafts") {
            setStatusFilter("Draft");
            setDateFromFilter("");
            setDateToFilter("");
        }
    }, [filterParam, today]);

    const handleEditClick = useCallback((booking: Booking) => {
        setEditingBooking(booking);
        loadBreakfast(booking.id);
        setEditGroupId(booking.group_id || "none");
        setEditGroupSearch(groups.find(g => g.id === booking.group_id)?.name || "");
        setEditNewGroupName("");
        setIsEditOpen(true);
        setEditTab("details");
    }, [groups]);

    useEffect(() => {
        if (editId && bookings.length > 0) {
            const booking = bookings.find(b => b.id === editId);
            if (booking) {
                handleEditClick(booking);
            }
        }
    }, [editId, bookings, handleEditClick]);

    useEffect(() => {
        if (checkoutId && bookings.length > 0) {
            const booking = bookings.find(b => b.id === checkoutId);
            if (booking) {
                handleCheckOutClick(booking);
            }
        }
    }, [checkoutId, bookings]);

    const loadBreakfast = async (bookingId: string) => {
        setBreakfastOptions([]);
        try {
            const db = await initDb();
            if (db) {
                const results = await db.select<BreakfastOption[]>(
                    "SELECT * FROM breakfast_options WHERE booking_id = ?",
                    [bookingId]
                );
                setBreakfastOptions(results || []);
            }
        } catch (error) {
            console.error("Failed to load breakfast:", error);
        }
    };

    const checkRoomOverlap = useCallback((roomId: string, startDate: string, endDate: string, excludeBookingId?: string) => {
        return bookings.some(b =>
            b.id !== excludeBookingId &&
            b.room_id === roomId &&
            (b.status === "Hard-Booked" || b.status === "Checked-In") &&
            startDate < b.end_date &&
            endDate > b.start_date
        );
    }, [bookings]);

    const updateBookingStatus = async (id: string, newStatus: string) => {
        const booking = bookings.find(b => b.id === id);
        if (booking && (newStatus === "Hard-Booked" || newStatus === "Checked-In")) {
            if (checkRoomOverlap(booking.room_id, booking.start_date, booking.end_date, id)) {
                alert("Fehler: Dieser Raum ist im gewählten Zeitraum bereits fest belegt (hart gebucht oder eingecheckt).");
                return;
            }
        }

        try {
            const db = await initDb();
            if (db) {
                await db.execute("UPDATE bookings SET status = ? WHERE id = ?", [newStatus, id]);
                await loadData();
            }
        } catch (error) {
            console.error("Failed to update booking status:", error);
        }
    };

    const handleCheckOutClick = async (booking: Booking) => {
        setCheckOutBooking(booking);
        await loadBreakfast(booking.id);
        setIsCheckOutOpen(true);
    };

    const confirmCheckOut = async () => {
        if (!checkOutBooking) return;
        const summary = calculateCheckOutSummary(checkOutBooking);

        try {
            const db = await initDb();
            if (db) {
                // 1. Update Guest Revenue
                await db.execute(
                    "UPDATE guests SET total_revenue = COALESCE(total_revenue, 0) + ? WHERE id = ?",
                    [summary.grandTotal, checkOutBooking.guest_id]
                );

                // 2. Update Booking Status
                await db.execute(
                    "UPDATE bookings SET status = 'Checked-Out', actual_checkout_at = ? WHERE id = ?",
                    [new Date().toISOString(), checkOutBooking.id]
                );

                await loadData();
                setIsCheckOutOpen(false);
                setCheckOutBooking(null);
            }
        } catch (error) {
            console.error("Failed to finalize check-out:", error);
            alert("Fehler beim Check-Out.");
        }
    };

    const calculateCheckOutSummary = (booking: Booking) => {
        const room = rooms.find(r => r.id === booking.room_id);
        const start = new Date(booking.start_date);
        const end = new Date(booking.end_date);
        const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        const roomTotal = (room?.base_price || 0) * nights;

        // Breakfasts - already loaded via handleCheckOutClick
        const breakfastCount = breakfastOptions.filter(o => o.is_included === 1).length;
        const breakfastPrice = 12.50; // Mock price
        const breakfastTotal = breakfastCount * breakfastPrice;

        return {
            nights,
            roomPrice: room?.base_price || 0,
            roomTotal,
            breakfastCount,
            breakfastPrice,
            breakfastTotal,
            grandTotal: roomTotal + breakfastTotal
        };
    };

    const updateBooking = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingBooking) return;
        const formData = new FormData(e.currentTarget);
        const updated = {
            room_id: formData.get("room_id") as string,
            guest_id: formData.get("guest_id") as string,
            occasion: formData.get("occasion") as string,
            start_date: formData.get("start_date") as string,
            end_date: formData.get("end_date") as string,
            status: formData.get("status") as string,
            payment_status: formData.get("payment_status") as string,
            estimated_arrival_time: formData.get("estimated_arrival_time") as string,
            is_family_room: formData.get("is_family_room") === "on" ? 1 : 0,
            has_dog: formData.get("has_dog") === "on" ? 1 : 0,
            is_allergy_friendly: formData.get("is_allergy_friendly") === "on" ? 1 : 0,
            has_mobility_impairment: formData.get("has_mobility_impairment") === "on" ? 1 : 0,
        };

        if (updated.status === "Hard-Booked" || updated.status === "Checked-In") {
            if (checkRoomOverlap(updated.room_id, updated.start_date, updated.end_date, editingBooking.id)) {
                alert("Fehler: Dieser Raum ist im gewählten Zeitraum bereits fest belegt.");
                return;
            }
        }

        try {
            const db = await initDb();
            if (db) {
                let finalGroupId = formData.get("group_id") as string;
                if (finalGroupId === "new") {
                    const newName = formData.get("new_group_name") as string;
                    if (newName) {
                        const existingGroup = groups.find(g => g.name.toLowerCase() === newName.toLowerCase());
                        if (existingGroup) {
                            finalGroupId = existingGroup.id;
                        } else {
                            const newId = crypto.randomUUID();
                            await db.execute("INSERT INTO booking_groups (id, name) VALUES (?, ?)", [newId, newName]);
                            finalGroupId = newId;
                        }
                    } else {
                        finalGroupId = "";
                    }
                }

                await db.execute(
                    "UPDATE bookings SET room_id = ?, guest_id = ?, occasion = ?, start_date = ?, end_date = ?, status = ?, payment_status = ?, estimated_arrival_time = ?, group_id = ?, is_family_room = ?, has_dog = ?, is_allergy_friendly = ?, has_mobility_impairment = ? WHERE id = ?",
                    [updated.room_id, updated.guest_id, updated.occasion, updated.start_date, updated.end_date, updated.status, updated.payment_status, updated.estimated_arrival_time, (finalGroupId === "none" || !finalGroupId) ? null : finalGroupId, updated.is_family_room, updated.has_dog, updated.is_allergy_friendly, updated.has_mobility_impairment, editingBooking.id]
                );
                await loadData();
                setIsEditOpen(false);
                setEditingBooking(null);
            }
        } catch (error) {
            console.error("Failed to update booking:", error);
        }
    };

    const deleteBooking = async (id: string) => {
        if (!confirm("Buchung wirklich löschen?")) return;
        try {
            const db = await initDb();
            if (db) {
                await db.execute("DELETE FROM breakfast_options WHERE booking_id = ?", [id]);
                await db.execute("DELETE FROM bookings WHERE id = ?", [id]);
                await loadData();
            }
        } catch (error) {
            console.error("Failed to delete booking:", error);
        }
    };

    const deleteGroup = async (groupId: string, action: 'delete' | 'storno') => {
        try {
            const db = await initDb();
            if (!db) return;

            if (action === 'storno') {
                await db.execute("UPDATE bookings SET status = 'Storniert' WHERE group_id = ?", [groupId]);
            } else {
                // Delete breakfast options for all bookings in group
                const groupBookings = bookings.filter(b => b.group_id === groupId);
                for (const b of groupBookings) {
                    await db.execute("DELETE FROM breakfast_options WHERE booking_id = ?", [b.id]);
                }
                await db.execute("DELETE FROM bookings WHERE group_id = ?", [groupId]);
                await db.execute("DELETE FROM booking_groups WHERE id = ?", [groupId]);
            }
            await loadData();
            setIsGroupDeleteOpen(false);
            setDeletingGroup(null);
        } catch (error) {
            console.error("Failed to process group action:", error);
        }
    };

    const renameGroup = async (groupId: string, newName: string) => {
        if (!newName.trim()) return;
        try {
            const db = await initDb();
            if (!db) return;

            await db.execute("UPDATE booking_groups SET name = ? WHERE id = ?", [newName.trim(), groupId]);
            await loadData();
            setIsGroupDeleteOpen(false);
            setDeletingGroup(null);
            setRenameValue("");
        } catch (error) {
            console.error("Failed to rename group:", error);
        }
    };

    const saveBreakfast = async (date: string, updates: Partial<{ is_included: number, time: string, guest_count: number, comments: string }>, breakfastId?: string) => {
        if (!editingBooking) return;
        try {
            const db = await initDb();
            if (db) {
                const existing = breakfastId ? breakfastOptions.find(o => o.id === breakfastId) : breakfastOptions.find(o => o.date === date);
                if (existing) {
                    const entries = Object.entries(updates);
                    if (entries.length > 0) {
                        const fields = entries.map(([k]) => `${k} = ?`).join(", ");
                        const values = entries.map(([, v]) => v);
                        await db.execute(`UPDATE breakfast_options SET ${fields} WHERE id = ?`, [...values, existing.id]);
                    }
                } else if (updates.is_included !== 0) {
                    await db.execute(
                        "INSERT INTO breakfast_options (id, booking_id, date, is_included, time, guest_count, comments, is_prepared, source, is_manual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        [crypto.randomUUID(), editingBooking.id, date, updates.is_included ?? 0, updates.time ?? "08:00", updates.guest_count ?? 1, updates.comments ?? "", 0, "auto", 0]
                    );
                }
                await loadBreakfast(editingBooking.id);
            }
        } catch (error) {
            console.error("Failed to save breakfast:", error);
        }
    };

    const addPersonToDay = async (date: string) => {
        if (!editingBooking) return;
        try {
            const db = await initDb();
            if (db) {
                await db.execute(
                    "INSERT INTO breakfast_options (id, booking_id, date, is_included, time, guest_count, comments, is_prepared, source, is_manual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [crypto.randomUUID(), editingBooking.id, date, 1, "08:00", 1, "", 0, "manuell", 1]
                );
                await loadBreakfast(editingBooking.id);
            }
        } catch (error) {
            console.error("Failed to add person to day:", error);
        }
    };

    const removePersonFromDay = async (id: string) => {
        if (!editingBooking) return;
        try {
            const db = await initDb();
            if (db) {
                await db.execute("DELETE FROM breakfast_options WHERE id = ?", [id]);
                await loadBreakfast(editingBooking.id);
            }
        } catch (error) {
            console.error("Failed to remove person from day:", error);
        }
    };

    const getDaysArray = (start: string, end: string) => {
        const arr = [];
        const dt = new Date(start);
        const endDt = new Date(end);
        while (dt <= endDt) {
            arr.push(new Date(dt).toISOString().split('T')[0]);
            dt.setDate(dt.getDate() + 1);
        }
        return arr;
    };

    const resetFilters = () => {
        setStatusFilter("all");
        setDateFromFilter("");
        setDateToFilter("");
        setDateTypeFilter("start");
        setHideCanceled(false);
    };

    const setTodayFilter = () => {
        setDateFromFilter(today);
        setDateToFilter(today);
        setDateTypeFilter("start");
    };

    const filteredBookings = bookings.filter(b => {
        // Toggle Past Bookings
        const isPast = b.end_date < today;
        if (!showPastBookings && isPast) return false;

        if (statusFilter !== "all" && b.status !== statusFilter) return false;
        if (hideCanceled && b.status === "Storniert") return false;
        const compareDate = dateTypeFilter === "start" ? b.start_date : b.end_date;
        if (dateFromFilter && compareDate < dateFromFilter) return false;
        if (dateToFilter && compareDate > dateToFilter) return false;
        return true;
    }).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    const groupedData = useMemo(() => {
        const result: { group: BookingGroup | null, bookings: Booking[] }[] = [];
        const individualBookings: Booking[] = [];

        // Group bookings by their group_id
        const bookingsByGroup = new Map<string, Booking[]>();
        filteredBookings.forEach(b => {
            if (b.group_id && b.group_id !== "none") {
                if (!bookingsByGroup.has(b.group_id)) {
                    bookingsByGroup.set(b.group_id, []);
                }
                bookingsByGroup.get(b.group_id)?.push(b);
            } else {
                individualBookings.push(b);
            }
        });

        // Add grouped bookings
        groups.forEach(group => {
            if (bookingsByGroup.has(group.id)) {
                result.push({ group, bookings: bookingsByGroup.get(group.id)! });
                bookingsByGroup.delete(group.id); // Remove processed group
            }
        });

        // Add any remaining grouped bookings whose group might not be in the `groups` state (e.g., if group was deleted but bookings still reference it)
        bookingsByGroup.forEach((bookings, groupId) => {
            result.push({ group: { id: groupId, name: `Unbekannte Gruppe (${groupId.substring(0, 4)}...)` }, bookings });
        });

        // Add individual bookings
        if (individualBookings.length > 0) {
            result.push({ group: null, bookings: individualBookings });
        }

        return result;
    }, [filteredBookings, groups]);

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    };

    // --- WIZARD LOGIC ---

    const filteredWizardGuests = useMemo(() => {
        if (!guestSearch) return guests.slice(0, 5);
        return guests.filter(g =>
            g.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
            g.company?.toLowerCase().includes(guestSearch.toLowerCase())
        ).slice(0, 5);
    }, [guests, guestSearch]);

    const roomTypes = ROOM_TYPES;

    const roomTypeAvailability = useMemo(() => {
        const availability: Record<string, number> = {};

        roomTypes.forEach(type => {
            const roomsOfType = rooms.filter(r => r.type === type);
            if (!wizardData.startDate || !wizardData.endDate) {
                availability[type] = roomsOfType.length;
                return;
            }

            const availableCount = roomsOfType.filter(r => {
                const hasOverlap = bookings.some(b =>
                    b.room_id === r.id &&
                    b.status !== "Checked-Out" &&
                    b.status !== "Storniert" && // Exclude "Storniert" bookings from overlap check
                    b.start_date < wizardData.endDate &&
                    b.end_date > wizardData.startDate
                );
                return !hasOverlap;
            }).length;
            availability[type] = availableCount;
        });
        return availability;
    }, [rooms, bookings, wizardData.startDate, wizardData.endDate, roomTypes]);

    const allRoomsForType = useMemo(() => {
        if (!wizardData.roomType) return [];
        return rooms.filter(r => r.type === wizardData.roomType);
    }, [rooms, wizardData.roomType]);

    const getRoomIcon = (type: string, className?: string) => {
        const iconClass = className || "w-4 h-4 text-zinc-400 group-hover:text-blue-500 transition-colors";
        switch (type) {
            case "Einzelzimmer": return <Bed className={iconClass} />;
            case "Doppelzimmer": return <BedDouble className={iconClass} />;
            case "2 Einzelbetten": return <Users className={iconClass} />;
            case "3 Einzelbetten": return <Users className={iconClass} />;
            case "Ferienwohnung": return <Home className={iconClass} />;
            default: return <BedDouble className={iconClass} />;
        }
    };

    const handleCreateGuest = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const firstName = formData.get("first_name") as string;
        const lastName = formData.get("last_name") as string;
        const fullName = `${firstName} ${lastName}`.trim();
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const company = formData.get("company") as string;
        const id = crypto.randomUUID();

        try {
            const db = await initDb();
            if (db) {
                await db.execute(
                    "INSERT INTO guests (id, name, first_name, last_name, email, phone, company, contact_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [id, fullName, firstName, lastName, email, phone, company, `${email} / ${phone}`]
                );
                await loadData();
                setWizardData(prev => ({ ...prev, guestId: id, guestName: fullName }));
                setIsCreatingGuest(false);
                setWizardStep(2);
            }
        } catch (error) {
            console.error("Failed to create guest:", error);
        }
    };

    const finishWizard = async (status: string = "Draft") => {
        try {
            const db = await initDb();
            if (!db) return;

            let finalGroupId = wizardData.groupId;
            if (finalGroupId === "new" && wizardData.newGroupName) {
                const existingGroup = groups.find(g => g.name.toLowerCase() === wizardData.newGroupName.toLowerCase());
                if (existingGroup) {
                    finalGroupId = existingGroup.id;
                } else {
                    finalGroupId = crypto.randomUUID();
                    await db.execute("INSERT INTO booking_groups (id, name) VALUES (?, ?)", [finalGroupId, wizardData.newGroupName]);
                }
            }

            const booking = {
                id: crypto.randomUUID(),
                room_id: wizardData.roomId,
                guest_id: wizardData.guestId,
                occasion: wizardData.occasion,
                start_date: wizardData.startDate,
                end_date: wizardData.endDate,
                status: status,
                payment_status: "Offen",
                estimated_arrival_time: wizardData.arrivalTime,
                group_id: (finalGroupId === "new" || finalGroupId === "none" || !finalGroupId) ? null : finalGroupId,
                is_family_room: wizardData.isFamilyRoom ? 1 : 0,
                has_dog: wizardData.hasDog ? 1 : 0,
                is_allergy_friendly: wizardData.isAllergyFriendly ? 1 : 0,
                has_mobility_impairment: wizardData.hasMobilityImpairment ? 1 : 0
            };

            if (checkRoomOverlap(booking.room_id, booking.start_date, booking.end_date)) {
                alert("Hinweis: Der Raum ist in diesem Zeitraum bereits belegt oder reserviert.");
                return;
            }

            await db.execute(
                "INSERT INTO bookings (id, room_id, guest_id, occasion, start_date, end_date, status, payment_status, estimated_arrival_time, group_id, is_family_room, has_dog, is_allergy_friendly, has_mobility_impairment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [booking.id, booking.room_id, booking.guest_id, booking.occasion, booking.start_date, booking.end_date, booking.status, booking.payment_status, booking.estimated_arrival_time, booking.group_id, booking.is_family_room, booking.has_dog, booking.is_allergy_friendly, booking.has_mobility_impairment]
            );
            await loadData();
            setIsBookingOpen(false);
            resetWizard();
        } catch (error) {
            console.error("Failed to add booking:", error);
        }
    };

    const resetWizard = () => {
        setWizardStep(1);
        setIsCreatingGuest(false);
        setWizardData({
            guestId: "",
            guestName: "",
            startDate: "",
            endDate: "",
            roomType: "",
            roomId: "",
            occasion: "",
            arrivalTime: "",
            groupId: "", // Added for group selection
            newGroupName: "", // Added for new group creation
            isFamilyRoom: false,
            hasDog: false,
            isAllergyFriendly: false,
            hasMobilityImpairment: false
        });
        setGuestSearch("");
    };

    const renderWizardStep = () => {
        switch (wizardStep) {
            case 1:
                return (
                    <div className="space-y-4 pt-2">
                        <div className="flex flex-col gap-3">
                            <Label className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Schritt 1: Gast auswählen</Label>
                            {isCreatingGuest ? (
                                <form onSubmit={handleCreateGuest} className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-blue-700 dark:text-blue-400">Neuen Gast anlegen</h4>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreatingGuest(false)}>Abbrechen</Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Vorname</Label>
                                            <Input name="first_name" required className="h-9" placeholder="Max" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Nachname</Label>
                                            <Input name="last_name" required className="h-9" placeholder="Mustermann" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">E-Mail</Label>
                                        <Input name="email" type="email" className="h-9" placeholder="max@beispiel.de" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Telefon</Label>
                                        <Input name="phone" type="tel" className="h-9" placeholder="+49 123..." />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Firma</Label>
                                        <Input name="company" className="h-9" placeholder="Firma GmbH" />
                                    </div>
                                    <Button type="submit" className="w-full bg-blue-600 font-bold">Gast anlegen & Weiter</Button>
                                </form>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                        <Input
                                            placeholder="Gast suchen..."
                                            className="pl-9 h-11 bg-white"
                                            value={guestSearch}
                                            onChange={(e) => setGuestSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1 max-h-[250px] overflow-y-auto">
                                        {filteredWizardGuests.map(g => (
                                            <button
                                                key={g.id}
                                                onClick={() => {
                                                    setWizardData(prev => ({ ...prev, guestId: g.id, guestName: g.name }));
                                                    setWizardStep(2);
                                                }}
                                                className="w-full flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left"
                                            >
                                                <div>
                                                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{g.name}</div>
                                                    <div className="text-xs text-zinc-500">{g.company || "Privatgast"}</div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-zinc-300" />
                                            </button>
                                        ))}
                                        {guestSearch.length > 0 && filteredWizardGuests.length === 0 && (
                                            <div className="p-4 text-center text-zinc-500 italic text-sm">Kein Gast mit "{guestSearch}" gefunden.</div>
                                        )}
                                    </div>
                                    <div className="pt-2 border-t border-zinc-100">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-11 border-dashed border-2 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                            onClick={() => setIsCreatingGuest(true)}
                                        >
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Neuen Gast anlegen
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 pt-2">
                        <div className="flex flex-col gap-3">
                            <Label className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Schritt 2: Zeitraum & Gruppe</Label>

                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs">
                                    {wizardData.guestName.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">Gewählter Gast</div>
                                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{wizardData.guestName}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <Label>Anreise</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={wizardData.startDate}
                                        onChange={(e) => setWizardData(prev => ({ ...prev, startDate: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Abreise</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={wizardData.endDate}
                                        onChange={(e) => setWizardData(prev => ({ ...prev, endDate: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2 relative">
                                    <Label>Gruppe wählen oder neu erstellen</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                        <Input
                                            placeholder="Nach Gruppe suchen..."
                                            className="pl-9 h-10"
                                            value={groupSearch}
                                            onChange={(e) => {
                                                setGroupSearch(e.target.value);
                                                if (e.target.value === "") {
                                                    setWizardData(prev => ({ ...prev, groupId: "none", newGroupName: "" }));
                                                } else {
                                                    const match = groups.find(g => g.name.toLowerCase() === e.target.value.toLowerCase());
                                                    if (match) {
                                                        setWizardData(prev => ({ ...prev, groupId: match.id, newGroupName: "" }));
                                                    } else {
                                                        setWizardData(prev => ({ ...prev, groupId: "new", newGroupName: e.target.value }));
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    {groupSearch && !groups.some(g => g.name.toLowerCase() === groupSearch.toLowerCase()) && (
                                        <div className="text-[10px] text-blue-600 font-bold uppercase mt-1">
                                            Neu erstellen: "{groupSearch}"
                                        </div>
                                    )}
                                    {groupSearch && groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()) && g.name.toLowerCase() !== groupSearch.toLowerCase()).length > 0 && (
                                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 max-h-[150px] overflow-y-auto p-1">
                                            {groups
                                                .filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()) && g.name.toLowerCase() !== groupSearch.toLowerCase())
                                                .map(g => (
                                                    <button
                                                        key={g.id}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                                        onClick={() => {
                                                            setGroupSearch(g.name);
                                                            setWizardData(prev => ({ ...prev, groupId: g.id, newGroupName: "" }));
                                                        }}
                                                    >
                                                        {g.name}
                                                    </button>
                                                ))
                                            }
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Buchungstyp</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["Single", "Pärchen", "Familie", "Monteur"].map((opt) => (
                                        <Button
                                            key={opt}
                                            type="button"
                                            variant={wizardData.occasion === opt ? "default" : "outline"}
                                            className={cn(
                                                "h-10 text-sm font-medium transition-all",
                                                wizardData.occasion === opt ? "bg-blue-600 hover:bg-blue-700 shadow-md border-transparent" : "hover:border-blue-300 hover:bg-blue-50 text-zinc-600"
                                            )}
                                            onClick={() => setWizardData(prev => ({ ...prev, occasion: opt }))}
                                        >
                                            {opt}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Geschätzte Ankunft</Label>
                                    <Input
                                        type="time"
                                        value={wizardData.arrivalTime}
                                        onChange={(e) => setWizardData(prev => ({ ...prev, arrivalTime: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Wünsche & Anforderungen</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                        <Switch
                                            id="wizard-dog"
                                            checked={wizardData.hasDog}
                                            onCheckedChange={(val) => setWizardData(prev => ({ ...prev, hasDog: val }))}
                                        />
                                        <Label htmlFor="wizard-dog" className="text-xs font-medium cursor-pointer">Hund dabei</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                        <Switch
                                            id="wizard-allergy"
                                            checked={wizardData.isAllergyFriendly}
                                            onCheckedChange={(val) => setWizardData(prev => ({ ...prev, isAllergyFriendly: val }))}
                                        />
                                        <Label htmlFor="wizard-allergy" className="text-xs font-medium cursor-pointer">Allergiker</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                        <Switch
                                            id="wizard-mobility"
                                            checked={wizardData.hasMobilityImpairment}
                                            onCheckedChange={(val) => setWizardData(prev => ({ ...prev, hasMobilityImpairment: val }))}
                                        />
                                        <Label htmlFor="wizard-mobility" className="text-xs font-medium cursor-pointer">Gehbehindert</Label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button variant="outline" className="flex-1" onClick={() => setWizardStep(1)}>
                                    <ChevronLeft className="w-4 h-4 mr-2" /> Zurück
                                </Button>
                                <Button
                                    disabled={!wizardData.startDate || !wizardData.endDate}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    onClick={() => setWizardStep(3)}
                                >
                                    Weiter <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 pt-2">
                        <div className="flex flex-col gap-3">
                            <Label className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Schritt 3: Zimmer wählen</Label>

                            {!wizardData.roomType ? (
                                <>
                                    <div className="text-sm font-medium mb-1">Zimmertyp wählen</div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {roomTypes.map(type => {
                                            const availableCount = roomTypeAvailability[type] || 0;
                                            const isDisabled = availableCount === 0;
                                            return (
                                                <button
                                                    key={type}
                                                    disabled={isDisabled}
                                                    onClick={() => setWizardData(prev => ({ ...prev, roomType: type }))}
                                                    className={cn(
                                                        "flex items-center justify-between p-4 rounded-xl border transition-all group",
                                                        isDisabled
                                                            ? "opacity-60 cursor-not-allowed bg-zinc-50 border-zinc-200"
                                                            : "border-zinc-200 hover:border-blue-400 hover:bg-blue-50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {getRoomIcon(type, cn("w-5 h-5 transition-colors", isDisabled ? "text-zinc-300" : "text-zinc-400 group-hover:text-blue-500"))}
                                                        <div className="flex flex-col items-start">
                                                            <span className="font-bold">{type}</span>
                                                            <span className={cn("text-[10px] font-bold uppercase", isDisabled ? "text-red-500" : "text-emerald-600")}>
                                                                {isDisabled ? "Keine Zimmer frei" : `${availableCount} verfügbar`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {!isDisabled && <ChevronRight className="w-4 h-4 text-zinc-300" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="text-sm font-medium">Verfügbare {wizardData.roomType}s</div>
                                        <Button variant="ghost" size="sm" onClick={() => setWizardData(prev => ({ ...prev, roomType: "" }))} className="text-xs h-7">Typ ändern</Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {allRoomsForType.map(room => {
                                            const isOccupied = checkRoomOverlap(room.id, wizardData.startDate, wizardData.endDate);
                                            return (
                                                <button
                                                    key={room.id}
                                                    disabled={isOccupied}
                                                    onClick={() => setWizardData(prev => ({ ...prev, roomId: room.id }))}
                                                    className={cn(
                                                        "p-3 rounded-xl border transition-all text-left flex flex-col gap-1 relative overflow-hidden",
                                                        wizardData.roomId === room.id
                                                            ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600/10"
                                                            : isOccupied
                                                                ? "border-red-100 bg-red-50/30 opacity-60 cursor-not-allowed"
                                                                : "border-zinc-200 hover:border-blue-400 hover:bg-blue-50/50"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className={cn("font-bold", isOccupied ? "text-red-900" : "text-zinc-900")}>{room.name}</span>
                                                        {wizardData.roomId === room.id && <Check className="w-4 h-4 text-blue-600" />}
                                                        {isOccupied && <span className="text-[8px] font-black text-red-600 border border-red-200 px-1 rounded bg-white">BELEGT</span>}
                                                    </div>
                                                    <span className="text-[10px] text-zinc-500 font-medium uppercase truncate">Zimmer {room.id}</span>
                                                    {!isOccupied && <span className="text-xs font-bold text-blue-700">{room.base_price} €</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            <div className="space-y-3 pt-4 border-t border-zinc-100 mt-2">
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 h-11" onClick={() => setWizardStep(2)}>
                                        <ChevronLeft className="w-4 h-4 mr-2" /> Zurück
                                    </Button>
                                    <Button
                                        disabled={!wizardData.roomId}
                                        variant="outline"
                                        className="flex-1 h-11 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold"
                                        onClick={() => finishWizard("Draft")}
                                    >
                                        Als Entwurf <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                                <Button
                                    disabled={!wizardData.roomId}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold h-12 shadow-lg shadow-emerald-600/10"
                                    onClick={() => finishWizard("Hard-Booked")}
                                >
                                    Fest buchen (Garantieren) <Check className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {filterParam === "checkin" ? "Heutige Check-Ins" :
                            filterParam === "checkout" ? "Heutige Check-Outs" :
                                filterParam === "drafts" ? "Buchungsentwürfe" :
                                    "Buchungsverwaltung"}
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Verwalte Einzelbuchungen und Frühstückswünsche.
                    </p>
                </div>
                <Dialog open={isBookingOpen} onOpenChange={(val) => {
                    setIsBookingOpen(val);
                    if (!val) resetWizard();
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-6 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]">
                            <Plus className="w-5 h-5 mr-2" /> Neue Buchung
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                    {wizardStep < 1 ? "?" : Math.floor(wizardStep)}
                                </div>
                                Buchungs-Assistent
                            </DialogTitle>
                        </DialogHeader>
                        {renderWizardStep()}
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900/50">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1.5 flex-1 min-w-[150px]">
                            <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</Label>
                            <select
                                value={statusFilter ?? "all"}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-950 shadow-sm"
                            >
                                <option value="all">Alle Status</option>
                                <option value="Draft">Draft (Entwurf)</option>
                                <option value="Hard-Booked">Hart gebucht</option>
                                <option value="Checked-In">Eingecheckt</option>
                                <option value="Checked-Out">Abgereist</option>
                            </select>
                        </div>
                        <div className="space-y-1.5 w-[110px]">
                            <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Datumstyp</Label>
                            <select
                                value={dateTypeFilter ?? "start"}
                                onChange={(e) => setDateTypeFilter(e.target.value as "start" | "end")}
                                className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm"
                            >
                                <option value="start">Anreise</option>
                                <option value="end">Abreise</option>
                            </select>
                        </div>
                        <div className="space-y-1.5 w-[135px]">
                            <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">von</Label>
                            <Input type="date" value={dateFromFilter} onChange={(e) => setDateFromFilter(e.target.value)} className="h-9 text-xs shadow-sm" />
                        </div>
                        <div className="space-y-1.5 w-[135px]">
                            <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">bis</Label>
                            <Input type="date" value={dateToFilter} onChange={(e) => setDateToFilter(e.target.value)} className="h-9 text-xs shadow-sm" />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-9 shadow-sm" onClick={setTodayFilter}>
                                <Calendar className="w-4 h-4 mr-2 text-blue-500" /> Heute
                            </Button>
                            <Button variant="ghost" size="sm" className="h-9 text-zinc-500" onClick={resetFilters}>
                                <XCircle className="w-4 h-4 mr-2" /> Reset
                            </Button>
                        </div>

                        <div className="flex items-center gap-3 pl-4 border-l border-zinc-100 dark:border-zinc-800 h-9">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="show-past"
                                    checked={showPastBookings}
                                    onCheckedChange={setShowPastBookings}
                                />
                                <Label htmlFor="show-past" className="text-xs font-bold text-zinc-500 cursor-pointer flex gap-1.5 items-center">
                                    {showPastBookings ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    Vergangene
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="hide-canceled"
                                    checked={hideCanceled}
                                    onCheckedChange={setHideCanceled}
                                />
                                <Label htmlFor="hide-canceled" className="text-xs font-bold text-zinc-500 cursor-pointer flex gap-1.5 items-center">
                                    <XCircle className="w-3.5 h-3.5" />
                                    Stornos ausblenden
                                </Label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-zinc-50/50 dark:bg-zinc-800/50 border-none">
                            <TableHead className="font-bold h-12">Gast / Gruppe</TableHead>
                            <TableHead className="font-bold h-12">Zimmer</TableHead>
                            <TableHead className="font-bold h-12">Zeitraum</TableHead>
                            <TableHead className="font-bold h-12 text-center">Datenqualität</TableHead>
                            <TableHead className="font-bold h-12">Status</TableHead>
                            <TableHead className="text-right font-bold h-12 px-6">Aktionen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groupedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-16 text-zinc-500 italic">Keine Buchungen gefunden.</TableCell>
                            </TableRow>
                        ) : (
                            groupedData.map(({ group, bookings: groupBookings }) => {
                                const isGroup = !!group;
                                const isExpanded = !group || expandedGroups.has(group.id);

                                return (
                                    <React.Fragment key={group?.id || "individual"}>
                                        {isGroup && (
                                            <TableRow
                                                className="bg-blue-50/50 hover:bg-blue-50 cursor-pointer border-l-4 border-l-blue-500"
                                                onClick={() => toggleGroup(group.id)}
                                            >
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("transition-transform duration-200", isExpanded ? "rotate-90" : "")}>
                                                            <ChevronRight className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Users className="w-4 h-4 text-blue-600" />
                                                            <span className={cn("font-bold text-blue-900", groupBookings.every(b => b.status === "Storniert") && "line-through opacity-50")}>{group.name}</span>
                                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-2 h-5 text-[10px]">
                                                                {groupBookings.length}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    {/* Room placeholder or summarized count */}
                                                    <div className="text-[10px] text-blue-400 font-bold uppercase tracking-tight">Gruppe</div>
                                                </TableCell>
                                                <TableCell className="py-3 text-xs text-blue-700 font-bold whitespace-nowrap">
                                                    {(() => {
                                                        const startDates = groupBookings.map(b => new Date(b.start_date).getTime());
                                                        const endDates = groupBookings.map(b => new Date(b.end_date).getTime());
                                                        const minDate = new Date(Math.min(...startDates));
                                                        const maxDate = new Date(Math.max(...endDates));
                                                        return `${minDate.toLocaleDateString('de-DE')} - ${maxDate.toLocaleDateString('de-DE')}`;
                                                    })()}
                                                </TableCell>
                                                <TableCell className="py-3 text-center">
                                                    {(() => {
                                                        const scores = groupBookings.map(b => {
                                                            const hasArrival = !!b.estimated_arrival_time;
                                                            const hasPhone = !!b.guest_phone;
                                                            const hasEmail = !!b.guest_email;
                                                            return (hasArrival ? 40 : 0) + (hasPhone ? 30 : 0) + (hasEmail ? 30 : 0);
                                                        });
                                                        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                                                        const color = avgScore >= 100 ? "text-emerald-500" : avgScore >= 70 ? "text-blue-500" : avgScore >= 40 ? "text-amber-500" : "text-rose-500";
                                                        const circleColor = avgScore >= 100 ? "stroke-emerald-500" : avgScore >= 70 ? "stroke-blue-500" : avgScore >= 40 ? "stroke-amber-500" : "stroke-rose-500";

                                                        return (
                                                            <div className="flex flex-col items-center justify-center gap-1">
                                                                <div className="relative w-7 h-7">
                                                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-blue-100 dark:stroke-blue-900/30" strokeWidth="4" />
                                                                        <circle
                                                                            cx="18" cy="18" r="16" fill="none"
                                                                            className={cn("transition-all duration-1000", circleColor)}
                                                                            strokeWidth="4"
                                                                            strokeDasharray={`${avgScore}, 100`}
                                                                            strokeLinecap="round"
                                                                        />
                                                                    </svg>
                                                                    <span className={cn("absolute inset-0 flex items-center justify-center text-[7px] font-black", color)}>
                                                                        {avgScore}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    {(() => {
                                                        const statuses = Array.from(new Set(groupBookings.map(b => b.status)));
                                                        if (statuses.length === 1) {
                                                            const status = statuses[0];
                                                            return (
                                                                <Badge variant="outline" className={cn(
                                                                    "text-[9px] h-5 px-2 rounded-full font-bold",
                                                                    status === "Storniert" ? "bg-red-50 border-red-200 text-red-600" :
                                                                        status === "Checked-Out" ? "bg-zinc-100 border-zinc-200 text-zinc-500" :
                                                                            status === "Checked-In" ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                                                                                status === "Hard-Booked" ? "bg-blue-50 border-blue-200 text-blue-600" :
                                                                                    "bg-amber-50 border-amber-200 text-amber-600"
                                                                )}>
                                                                    {status === "Hard-Booked" ? "FEST" :
                                                                        status === "Checked-In" ? "IN" :
                                                                            status === "Checked-Out" ? "OUT" :
                                                                                status.toUpperCase()}
                                                                </Badge>
                                                            );
                                                        }
                                                        return (
                                                            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-600 text-[9px] h-5 px-2 rounded-full font-black">
                                                                GEMISCHT
                                                            </Badge>
                                                        );
                                                    })()}
                                                </TableCell>
                                                <TableCell className="text-right px-6">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeletingGroup(group);
                                                            setRenameValue(group.name);
                                                            setIsGroupDeleteOpen(true);
                                                        }}
                                                    >
                                                        <Settings className="w-3.5 h-3.5 mr-1" /> Verwalten
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {isExpanded && groupBookings.map((booking) => (
                                            <TableRow key={booking.id} className={cn("group hover:bg-zinc-50/50 transition-colors", isGroup ? "bg-white/50" : "")}>
                                                <TableCell className={cn("py-4", isGroup ? "pl-12" : "")}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            onClick={() => {
                                                                const guest = guests.find(g => g.id === booking.guest_id);
                                                                if (guest) {
                                                                    setEditingGuestForMask(guest);
                                                                    setIsGuestMaskOpen(true);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "font-bold text-zinc-900 hover:text-blue-600 transition-colors cursor-pointer decoration-blue-200/50 hover:underline underline-offset-4",
                                                                booking.status === "Storniert" && "line-through text-zinc-400"
                                                            )}
                                                        >
                                                            {booking.guest_name}
                                                        </div>
                                                        {booking.occasion && (
                                                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-zinc-200 text-zinc-500 font-medium">
                                                                {booking.occasion}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 border-none font-bold">
                                                        {booking.room_name || `Zimmer ${booking.room_id}`}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-zinc-500 font-medium whitespace-nowrap">
                                                    {new Date(booking.start_date).toLocaleDateString('de-DE')} - {new Date(booking.end_date).toLocaleDateString('de-DE')}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {(() => {
                                                        const hasArrival = !!booking.estimated_arrival_time;
                                                        const hasPhone = !!booking.guest_phone;
                                                        const hasEmail = !!booking.guest_email;

                                                        const score = (hasArrival ? 40 : 0) + (hasPhone ? 30 : 0) + (hasEmail ? 30 : 0);
                                                        const color = score >= 100 ? "text-emerald-500" : score >= 70 ? "text-blue-500" : score >= 40 ? "text-amber-500" : "text-rose-500";
                                                        const circleColor = score >= 100 ? "stroke-emerald-500" : score >= 70 ? "stroke-blue-500" : score >= 40 ? "stroke-amber-500" : "stroke-rose-500";

                                                        const arrivalDate = new Date(booking.start_date);
                                                        const diffTime = arrivalDate.getTime() - new Date(today).getTime();
                                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                        // Marks rows from 3 days before arrival
                                                        const isCloseToArrival = diffDays >= 0 && diffDays <= 3;
                                                        const isUrgent = isCloseToArrival && score < 100;
                                                        const missingArrivalUrgent = isCloseToArrival && !hasArrival;

                                                        return (
                                                            <div className="flex flex-col items-center justify-center gap-1 group/quality relative h-10">
                                                                <div className={cn(
                                                                    "relative w-8 h-8 rounded-full",
                                                                    isUrgent && "shadow-[0_0_12px_rgba(244,63,94,1.0)] animate-pulse border border-rose-500/20",
                                                                    missingArrivalUrgent && "ring-2 ring-rose-500 ring-offset-1 ring-offset-white dark:ring-offset-zinc-950"
                                                                )}>
                                                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="3" />
                                                                        <circle
                                                                            cx="18" cy="18" r="16" fill="none"
                                                                            className={cn("transition-all duration-1000", circleColor)}
                                                                            strokeWidth="3"
                                                                            strokeDasharray={`${score}, 100`}
                                                                            strokeLinecap="round"
                                                                        />
                                                                    </svg>
                                                                    <span className={cn("absolute inset-0 flex items-center justify-center text-[8px] font-black", color)}>
                                                                        {score}%
                                                                    </span>
                                                                </div>

                                                                {missingArrivalUrgent && (
                                                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center animate-bounce shadow-sm">
                                                                        <span className="text-[8px] text-white font-black">!</span>
                                                                    </div>
                                                                )}

                                                                {/* Tooltip on hover */}
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-white dark:bg-zinc-950 rounded-lg shadow-xl border border-zinc-100 dark:border-zinc-800 opacity-0 group-hover/quality:opacity-100 transition-opacity z-10 pointer-events-none">
                                                                    <div className="text-[10px] space-y-1.5">
                                                                        {isCloseToArrival && score < 100 && (
                                                                            <div className="text-rose-600 font-bold mb-1 border-b border-rose-50 pb-1">
                                                                                Anreise in {diffDays} {diffDays === 1 ? 'Tag' : 'Tagen'}
                                                                            </div>
                                                                        )}
                                                                        {missingArrivalUrgent && (
                                                                            <div className="bg-rose-600 text-white px-2 py-1 rounded font-bold animate-pulse text-center text-[9px] uppercase tracking-tighter shadow-sm mb-2">
                                                                                Ankunftszeit nachtragen!
                                                                            </div>
                                                                        )}
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-zinc-500 font-medium">Ankunftszeit</span>
                                                                            {hasArrival ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />}
                                                                        </div>
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-zinc-500 font-medium">Telefonnummer</span>
                                                                            {hasPhone ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />}
                                                                        </div>
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-zinc-500 font-medium">E-Mail Adresse</span>
                                                                            {hasEmail ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] h-6 px-3 rounded-full font-bold",
                                                        booking.status === "Storniert" ? "bg-red-50 border-red-200 text-red-600" :
                                                            booking.end_date < today ? "bg-zinc-100 border-zinc-300 text-zinc-400" :
                                                                booking.status === "Draft" ? "bg-zinc-50 border-zinc-200 text-zinc-500" :
                                                                    booking.status === "Hard-Booked" ? "bg-blue-50 border-blue-200 text-blue-600" :
                                                                        booking.status === "Checked-In" ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                                                                            "bg-zinc-100 border-zinc-200 text-zinc-400"
                                                    )}>
                                                        {booking.status === "Storniert" ? "STORNIERT" :
                                                            booking.end_date < today ? "ABGESCHLOSSEN" :
                                                                booking.status === "Hard-Booked" ? "FEST GEBUCHT" :
                                                                    booking.status === "Checked-In" ? "EINGECHECKT" :
                                                                        booking.status === "Checked-Out" ? "ABGEREIST" : booking.status.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right px-6">
                                                    <div className="flex justify-end gap-1">
                                                        {booking.start_date === today && booking.status === "Hard-Booked" && (
                                                            <Button variant="outline" size="sm" className="h-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={() => updateBookingStatus(booking.id, "Checked-In")}>
                                                                <LogIn className="w-3.5 h-3.5 mr-1" /> In
                                                            </Button>
                                                        )}
                                                        {booking.end_date === today && booking.status === "Checked-In" && (
                                                            <Button variant="outline" size="sm" className="h-8 border-amber-200 text-amber-600 hover:bg-amber-50" onClick={() => handleCheckOutClick(booking)}>
                                                                <LogOut className="w-3.5 h-3.5 mr-1" /> Out
                                                            </Button>
                                                        )}
                                                        {booking.status === "Draft" && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold"
                                                                onClick={() => handleEditClick(booking)}
                                                            >
                                                                <ArrowRight className="w-3.5 h-3.5 mr-1" /> Fortsetzen
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(booking)}>
                                                            <Settings className="w-4 h-4 text-zinc-500" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => deleteBooking(booking.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isEditOpen} onOpenChange={(open) => {
                setIsEditOpen(open);
                if (!open) {
                    setEditingBooking(null);
                    setEditGroupSearch("");
                    setEditGroupId("none");
                    setEditNewGroupName("");
                    setEditTab("details");
                    router.push('/buchungen', { scroll: false });
                }
            }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Buchung verwalten: {editingBooking?.guest_name}</DialogTitle></DialogHeader>
                    <div className="flex gap-4 border-b border-zinc-100 mb-4">
                        <button onClick={() => setEditTab("details")} className={cn("pb-2 text-sm font-medium transition-colors border-b-2", editTab === "details" ? "border-blue-500 text-blue-600" : "border-transparent text-zinc-400")}>Details</button>
                        <button onClick={() => setEditTab("breakfast")} className={cn("pb-2 text-sm font-medium transition-colors border-b-2", editTab === "breakfast" ? "border-blue-500 text-blue-600" : "border-transparent text-zinc-400")}>Frühstück</button>
                    </div>

                    {editingBooking && (
                        editTab === "details" ? (
                            <form key={editingBooking.id} onSubmit={updateBooking} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 relative">
                                        <Label>Gruppe wählen oder neu erstellen</Label>
                                        <input type="hidden" name="group_id" value={editGroupId} />
                                        <input type="hidden" name="new_group_name" value={editNewGroupName} />
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                            <Input
                                                placeholder="Nach Gruppe suchen..."
                                                className="pl-9 h-10"
                                                value={editGroupSearch}
                                                onChange={(e) => {
                                                    setEditGroupSearch(e.target.value);
                                                    if (e.target.value === "") {
                                                        setEditGroupId("none");
                                                        setEditNewGroupName("");
                                                    } else {
                                                        const match = groups.find(g => g.name.toLowerCase() === e.target.value.toLowerCase());
                                                        if (match) {
                                                            setEditGroupId(match.id);
                                                            setEditNewGroupName("");
                                                        } else {
                                                            setEditGroupId("new");
                                                            setEditNewGroupName(e.target.value);
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                        {editGroupSearch && !groups.some(g => g.name.toLowerCase() === editGroupSearch.toLowerCase()) && (
                                            <div className="text-[10px] text-blue-600 font-bold uppercase mt-1">
                                                Neu erstellen: "{editGroupSearch}"
                                            </div>
                                        )}
                                        {editGroupSearch && groups.filter(g => g.name.toLowerCase().includes(editGroupSearch.toLowerCase()) && g.name.toLowerCase() !== editGroupSearch.toLowerCase()).length > 0 && (
                                            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 max-h-[150px] overflow-y-auto p-1">
                                                {groups
                                                    .filter(g => g.name.toLowerCase().includes(editGroupSearch.toLowerCase()) && g.name.toLowerCase() !== editGroupSearch.toLowerCase())
                                                    .map(g => (
                                                        <button
                                                            key={g.id}
                                                            type="button"
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                                            onClick={() => {
                                                                setEditGroupSearch(g.name);
                                                                setEditGroupId(g.id);
                                                                setEditNewGroupName("");
                                                            }}
                                                        >
                                                            {g.name}
                                                        </button>
                                                    ))
                                                }
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gast</Label>
                                        <select
                                            name="guest_id"
                                            value={editingBooking.guest_id ?? ""}
                                            onChange={(e) => setEditingBooking({ ...editingBooking, guest_id: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                                        >
                                            {guests.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <select
                                            name="status"
                                            value={editingBooking.status ?? ""}
                                            onChange={(e) => setEditingBooking({ ...editingBooking, status: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                                        >
                                            <option value="Draft">Draft</option>
                                            <option value="Hard-Booked">Hart gebucht</option>
                                            <option value="Checked-In">Eingecheckt</option>
                                            <option value="Checked-Out">Abgereist</option>
                                            <option value="Storniert">Storniert</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Zimmer</Label>
                                        <select
                                            name="room_id"
                                            value={editingBooking.room_id ?? ""}
                                            onChange={(e) => setEditingBooking({ ...editingBooking, room_id: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                                        >
                                            {rooms.map(r => {
                                                const isOccupied = checkRoomOverlap(r.id, editingBooking.start_date, editingBooking.end_date, editingBooking.id);
                                                return (
                                                    <option
                                                        key={r.id}
                                                        value={r.id}
                                                        disabled={isOccupied}
                                                        className={isOccupied ? "text-red-500 bg-zinc-50" : ""}
                                                    >
                                                        {r.name} (Zimmer {r.id}) {isOccupied ? "— BELEGT" : ""}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Anreise</Label>
                                        <Input
                                            name="start_date"
                                            type="date"
                                            value={editingBooking.start_date}
                                            onChange={(e) => setEditingBooking({ ...editingBooking, start_date: e.target.value })}
                                            className="shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Abreise</Label>
                                        <Input
                                            name="end_date"
                                            type="date"
                                            value={editingBooking.end_date}
                                            onChange={(e) => setEditingBooking({ ...editingBooking, end_date: e.target.value })}
                                            className="shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Buchungstyp</Label>
                                    <input type="hidden" name="occasion" value={editingBooking.occasion || ""} />
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {["Single", "Pärchen", "Familie", "Monteur"].map((opt) => (
                                            <Button
                                                key={opt}
                                                type="button"
                                                variant={editingBooking.occasion === opt ? "default" : "outline"}
                                                className={cn(
                                                    "h-10 text-sm font-medium transition-all",
                                                    editingBooking.occasion === opt ? "bg-blue-600 hover:bg-blue-700 shadow-md border-transparent" : "hover:border-blue-300 hover:bg-blue-50 text-zinc-600"
                                                )}
                                                onClick={() => setEditingBooking({ ...editingBooking, occasion: opt })}
                                            >
                                                {opt}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Geschätzte Ankunft (am Anreisetag)</Label>
                                    <Input
                                        name="estimated_arrival_time"
                                        type="time"
                                        value={editingBooking.estimated_arrival_time || ""}
                                        onChange={(e) => setEditingBooking({ ...editingBooking, estimated_arrival_time: e.target.value })}
                                        className="shadow-sm"
                                    />
                                </div>
                                <div className="pt-2">
                                    <Label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Wünsche & Anforderungen</Label>
                                    <div className="grid grid-cols-2 gap-3 mt-1">
                                        <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                            <Switch
                                                name="has_dog"
                                                id="edit-dog"
                                                checked={editingBooking.has_dog === 1}
                                                onCheckedChange={(checked) => setEditingBooking({ ...editingBooking, has_dog: checked ? 1 : 0 })}
                                            />
                                            <Label htmlFor="edit-dog" className="text-xs font-medium cursor-pointer">Hund dabei</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                            <Switch
                                                name="is_allergy_friendly"
                                                id="edit-allergy"
                                                checked={editingBooking.is_allergy_friendly === 1}
                                                onCheckedChange={(checked) => setEditingBooking({ ...editingBooking, is_allergy_friendly: checked ? 1 : 0 })}
                                            />
                                            <Label htmlFor="edit-allergy" className="text-xs font-medium cursor-pointer">Allergiker</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                            <Switch
                                                name="has_mobility_impairment"
                                                id="edit-mobility"
                                                checked={editingBooking.has_mobility_impairment === 1}
                                                onCheckedChange={(checked) => setEditingBooking({ ...editingBooking, has_mobility_impairment: checked ? 1 : 0 })}
                                            />
                                            <Label htmlFor="edit-mobility" className="text-xs font-medium cursor-pointer">Gehbehindert</Label>
                                        </div>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 font-bold shadow-lg shadow-blue-600/20">Änderungen speichern</Button>
                            </form>
                        ) : (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                {getDaysArray(editingBooking.start_date, editingBooking.end_date).map(day => {
                                    const dayOptions = breakfastOptions.filter(o => o.date === day);
                                    return (
                                        <div key={day} className="p-4 border rounded-2xl bg-zinc-50 dark:bg-zinc-900 shadow-sm space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 italic">
                                                    {new Date(day).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                                </div>
                                                <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase" onClick={() => addPersonToDay(day)}>
                                                    <Plus className="w-3 h-3 mr-1" /> Person hinzufügen
                                                </Button>
                                            </div>

                                            {dayOptions.length === 0 ? (
                                                <div className="flex items-center justify-center py-4 border-2 border-dashed border-zinc-200 rounded-xl">
                                                    <button onClick={() => addPersonToDay(day)} className="text-xs text-zinc-400 font-medium hover:text-blue-500 transition-colors">
                                                        Kein Frühstück geplant. Klicken zum Hinzufügen.
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {dayOptions.map((opt, idx) => (
                                                        <div key={opt.id} className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-[10px] font-black text-zinc-300 uppercase italic">Person {idx + 1}</div>
                                                                <button onClick={() => removePersonFromDay(opt.id!)} className="text-zinc-300 hover:text-red-500 transition-colors">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px] uppercase font-bold text-zinc-400">Zeit</Label>
                                                                    <Input type="time" className="h-9 text-xs shadow-sm rounded-lg" defaultValue={opt.time || "08:00"} onBlur={(e) => saveBreakfast(day, { time: e.target.value }, opt.id)} />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px] uppercase font-bold text-zinc-400">Hinweise</Label>
                                                                    <Input className="h-9 text-xs shadow-sm rounded-lg" defaultValue={opt.comments || ""} placeholder="Allergien..." onBlur={(e) => saveBreakfast(day, { comments: e.target.value }, opt.id)} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}
                </DialogContent>
            </Dialog>

            {/* Check-Out Summary Dialog */}
            <Dialog open={isCheckOutOpen} onOpenChange={(open) => {
                setIsCheckOutOpen(open);
                if (!open) {
                    setCheckOutBooking(null);
                    router.push('/buchungen', { scroll: false });
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <LogOut className="w-5 h-5 text-amber-500" />
                            Check-Out Bestätigung
                        </DialogTitle>
                    </DialogHeader>

                    {checkOutBooking && (
                        <div className="space-y-6 pt-4">
                            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-3">
                                <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-3">
                                    <div>
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Gast</div>
                                        <div className="font-bold text-lg">{checkOutBooking.guest_name}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Zimmer</div>
                                        <div className="font-bold text-lg">{checkOutBooking.room_id}</div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    {/* Room Calculation */}
                                    {(() => {
                                        const summary = calculateCheckOutSummary(checkOutBooking);
                                        return (
                                            <>
                                                {/* Stay Details */}
                                                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-100/50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-100/50 dark:border-zinc-800/50 mb-4">
                                                    <Calendar className="w-4 h-4 text-blue-500" />
                                                    <span className="font-bold">
                                                        {new Date(checkOutBooking.start_date).toLocaleDateString('de-DE')} - {new Date(checkOutBooking.end_date).toLocaleDateString('de-DE')}
                                                    </span>
                                                </div>

                                                <div className="space-y-2.5">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{summary.nights} Übernachtungen</span>
                                                            <span className="text-[10px] text-zinc-400 font-medium tracking-tight">Preis pro Nacht: {summary.roomPrice.toFixed(2)}€</span>
                                                        </div>
                                                        <span className="font-black text-zinc-900 dark:text-zinc-100">{summary.roomTotal.toFixed(2)} €</span>
                                                    </div>

                                                    {summary.breakfastCount > 0 && (
                                                        <div className="flex justify-between items-center text-sm">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-blue-600">{summary.breakfastCount}x Frühstück</span>
                                                                <span className="text-[10px] text-zinc-400 font-medium tracking-tight">Preis pro Person: {summary.breakfastPrice.toFixed(2)}€</span>
                                                            </div>
                                                            <span className="font-black text-blue-600">{summary.breakfastTotal.toFixed(2)} €</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-700 mt-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">Gesamtsumme</span>
                                                        <div className="text-right">
                                                            <div className="text-3xl font-black text-blue-600 font-mono italic tracking-tighter">
                                                                {summary.grandTotal.toFixed(2)} €
                                                            </div>
                                                            <div className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase mb-1">Endrechnungsbetrag</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-12"
                                    onClick={() => {
                                        if (checkOutBooking) {
                                            handleEditClick(checkOutBooking);
                                            setIsCheckOutOpen(false);
                                        }
                                    }}
                                >
                                    Bearbeiten
                                </Button>
                                <Button
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 h-12 font-bold shadow-lg shadow-amber-600/20"
                                    onClick={confirmCheckOut}
                                >
                                    Abschließen <Check className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* Guest Edit Mask */}
            <Dialog open={isGuestMaskOpen} onOpenChange={setIsGuestMaskOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Gast bearbeiten: {editingGuestForMask?.name}</DialogTitle>
                    </DialogHeader>
                    {editingGuestForMask && (
                        <GuestMaskForm guest={editingGuestForMask} onSubmit={updateGuestInMask} />
                    )}
                </DialogContent>
            </Dialog>

            {/* Group Deletion Dialog */}
            <Dialog open={isGroupDeleteOpen} onOpenChange={setIsGroupDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gruppe "{deletingGroup?.name}" verwalten</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-zinc-500">
                            Was möchten Sie mit dieser Gruppe und den zugehörigen Buchungen tun?
                        </p>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-2 pb-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Gruppe umbenennen</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={renameValue}
                                        onChange={(e) => setRenameValue(e.target.value)}
                                        placeholder="Neuer Gruppenname..."
                                        className="h-10"
                                    />
                                    <Button
                                        onClick={() => deletingGroup && renameGroup(deletingGroup.id, renameValue)}
                                        disabled={!renameValue || renameValue === deletingGroup?.name}
                                        className="bg-blue-600 hover:bg-blue-700 font-bold"
                                    >
                                        Speichern
                                    </Button>
                                </div>
                            </div>

                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">Gefahrenbereich / Status</Label>
                            <Button
                                variant="outline"
                                className="h-14 justify-start px-4 text-left border-red-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                                onClick={() => deletingGroup && deleteGroup(deletingGroup.id, 'delete')}
                            >
                                <Trash2 className="w-5 h-5 mr-3 text-red-500" />
                                <div>
                                    <div className="font-bold">Gruppe & Buchungen löschen</div>
                                    <div className="text-[10px] opacity-80 uppercase tracking-tighter">Unwiderruflich entfernen</div>
                                </div>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-14 justify-start px-4 text-left border-amber-100 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                                onClick={() => deletingGroup && deleteGroup(deletingGroup.id, 'storno')}
                            >
                                <XCircle className="w-5 h-5 mr-3 text-amber-500" />
                                <div>
                                    <div className="font-bold">Alle Buchungen stornieren</div>
                                    <div className="text-[10px] opacity-80 uppercase tracking-tighter">Daten bleiben erhalten, Zimmer werden frei</div>
                                </div>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper component for the guest mask form to handle its own state
function GuestMaskForm({ guest, onSubmit }: { guest: Guest, onSubmit: (e: React.FormEvent<HTMLFormElement>) => void }) {
    const [nat, setNat] = useState(guest.nationality ?? "Deutschland");

    return (
        <form onSubmit={onSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="first_name">Vorname</Label>
                        <Input id="first_name" name="first_name" defaultValue={guest.first_name} placeholder="Max" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="middle_name">Zweitname</Label>
                        <Input id="middle_name" name="middle_name" defaultValue={guest.middle_name} placeholder="Elias" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="last_name">Nachname <span className="text-red-500">*</span></Label>
                        <Input id="last_name" name="last_name" defaultValue={guest.last_name} placeholder="Mustermann" required />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">E-Mail</Label>
                        <Input id="email" name="email" type="email" defaultValue={guest.email} placeholder="max@beispiel.de" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input id="phone" name="phone" type="tel" defaultValue={guest.phone} placeholder="+49 123 456789" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="company">Firma</Label>
                        <Input id="company" name="company" defaultValue={guest.company} placeholder="Muster GmbH" />
                    </div>
                    <div className="space-y-2">
                        <Label>Nationalität</Label>
                        <input type="hidden" name="nationality" value={nat} />
                        <NationalitySelector value={nat} onChange={setNat} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="notes">Notizen / Präferenzen</Label>
                    <Textarea id="notes" name="notes" defaultValue={guest.notes} placeholder="Besondere Wünsche, Allergien, etc." className="min-h-[100px]" />
                </div>
            </div>
            <Button type="submit" className="w-full mt-2 font-bold bg-blue-600">Aktualisieren</Button>
        </form>
    );
}

export default function BookingsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center italic text-zinc-500 text-sm">Wird geladen...</div>}>
            <BookingsList />
        </Suspense>
    );
}
