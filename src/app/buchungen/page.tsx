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
    EyeOff,
    Flower2,
    Accessibility,
    Download,
    Pencil,
    RotateCcw,
    Clock,
    Mail,
    Phone,
    Building2,
    User,
    Ban,
    Crown
} from "lucide-react";
import { ROOM_TYPES } from "@/lib/constants";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
    DialogFooter,
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
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { BookingSuccessModal } from "@/components/BookingSuccessModal"; // Import the modal


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
    guest_company?: string;
    is_family_room?: number;
    has_dog?: number;
    is_allergy_friendly?: number;
    has_mobility_impairment?: number;
    guests_per_room?: number;
    stay_type?: string;
    dog_count?: number;
    child_count?: number;
    extra_bed_count?: number;
    is_main_guest?: number;
}

interface BookingGroup {
    id: string;
    name: string;
}

interface Room {
    id: string;
    name: string;
    type: string;
    // base_price removed
    is_allergy_friendly?: number;
    is_accessible?: number;
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
    is_prepared?: number;
    source?: string;
    is_manual?: number;
}

interface WizardData {
    guestId: string;
    guestName: string;
    startDate: string;
    endDate: string;
    roomType: string;
    roomId: string;
    occasion: string;
    arrivalTime: string;
    groupId: string;
    newGroupName: string;
    isFamilyRoom: boolean;
    isAllergyFriendly: boolean;
    hasMobilityImpairment: boolean;
    guestsPerRoom: number;
    stayType: string;
    dogCount: number;
    childCount: number;
    extraBedCount: number;
    status: string;
}

const DEFAULT_WIZARD_DATA: WizardData = {
    guestId: "",
    guestName: "",
    startDate: "",
    endDate: "",
    roomType: "",
    roomId: "",
    occasion: "Single",
    arrivalTime: "",
    groupId: "",
    newGroupName: "",
    isFamilyRoom: false,
    isAllergyFriendly: false,
    hasMobilityImpairment: false,
    guestsPerRoom: 1,
    stayType: "",
    dogCount: 0,
    childCount: 0,
    extraBedCount: 0,
    status: "Hard-Booked"
};

interface BookingTab {
    id: string;
    label: string;
    data: WizardData;
    breakfastData: Record<string, { time: string, comments: string, id: string }[]>;
}

const getDaysArray = (start: string, end: string) => {
    const arr = [];
    for (let dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
        arr.push(new Date(dt).toISOString().split('T')[0]);
    }
    return arr;
};

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
    const [__legacyBookingState, __setLegacyBookingState] = useState<Booking | null>(null); // Kept for hook order stability

    interface EditTab {
        id: string;
        label: string;
        booking: Booking;
    }
    const [editTabs, setEditTabs] = useState<EditTab[]>([]);
    const [activeEditTabId, setActiveEditTabId] = useState<string>("");

    const editingBookingValue = useMemo(() =>
        editTabs.find(t => t.id === activeEditTabId)?.booking || null
        , [editTabs, activeEditTabId]);

    const setEditingBooking = (update: React.SetStateAction<Booking | null>) => {
        setEditTabs(prev => prev.map(tab => {
            if (tab.id !== activeEditTabId) return tab;
            const currentBooking = tab.booking;
            const newData = typeof update === 'function'
                ? (update as any)(currentBooking)
                : update;

            if (!newData) return tab;
            // Update Booking with new data
            return { ...tab, booking: newData, label: newData.guest_name || tab.label };
        }));
        // Also update legacy state if needed, but we rely on computed. 
        // Actually, we need to replace usages of 'editingBooking' with 'editingBookingValue' in render?
        // Or can I name the computed 'editingBooking'? Yes if I remove the state const.
    };

    // Re-declare editingBooking as the computed value
    const editingBooking = editingBookingValue;
    const [editTab, setEditTab] = useState<"details" | "breakfast">("details");
    const [breakfastOptions, setBreakfastOptions] = useState<BreakfastOption[]>([]);
    const [editGroupId, setEditGroupId] = useState<string>("none");
    const [editNewGroupName, setEditNewGroupName] = useState<string>("");
    const [groupSearch, setGroupSearch] = useState<string>("");
    const [editGroupSearch, setEditGroupSearch] = useState<string>("");
    const [isEditGroupSearchFocused, setIsEditGroupSearchFocused] = useState(false);
    const [editGuestSearch, setEditGuestSearch] = useState<string>("");
    const [isEditGuestSearchFocused, setIsEditGuestSearchFocused] = useState(false);
    const [editRoomType, setEditRoomType] = useState<string>("");

    // Breakfast Save States
    const [pendingBreakfastChanges, setPendingBreakfastChanges] = useState<Record<string, { time?: string, comments?: string }>>({});

    // ... inside existing code ...

    const trackBreakfastChange = (breakfastId: string, field: 'time' | 'comments', value: string) => {
        setPendingBreakfastChanges(prev => ({
            ...prev,
            [breakfastId]: {
                ...prev[breakfastId],
                [field]: value
            }
        }));
    };

    const handleSaveBreakfastChanges = async () => {
        if (Object.keys(pendingBreakfastChanges).length === 0) return;

        try {
            const db = await initDb();
            if (db) {
                // Execute updates sequentially to avoid potential DB lock issues (though rare in mock/sqlite)
                for (const [id, changes] of Object.entries(pendingBreakfastChanges)) {
                    const original = breakfastOptions.find(o => o.id === id);
                    if (original) {
                        const isIncluded = original.is_included;
                        const isPrepared = original.is_prepared ?? 0;
                        const guestCount = original.guest_count ?? 1;
                        const time = changes.time ?? original.time ?? "08:00";
                        const comments = changes.comments ?? original.comments ?? "";
                        const source = original.source ?? "manual";
                        const isManual = original.is_manual ?? 1;

                        await db.execute(
                            `UPDATE breakfast_options SET is_included=?, is_prepared=?, guest_count=?, time=?, comments=?, source=?, is_manual=? WHERE id=?`,
                            [isIncluded, isPrepared, guestCount, time, comments, source, isManual, id]
                        );
                    }
                }

                setPendingBreakfastChanges({});
                if (editingBooking) {
                    await loadBreakfast(editingBooking.id);
                }
                setIsEditOpen(false); // Close dialog on save
            }
        } catch (error) {
            console.error("Failed to save breakfast changes:", error);
            alert("Fehler beim Speichern der Ã„nderungen.");
        }
    };

    // Customer/Group/Company Filter States
    const [customerSearchQuery, setCustomerSearchQuery] = useState<string>("");
    const [searchFilter, setSearchFilter] = useState<{ type: 'guest' | 'group' | 'company', id: string, label: string } | null>(null);
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState<boolean>(false);

    // Check-Out Summary States
    const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
    const [checkOutBooking, setCheckOutBooking] = useState<Booking | null>(null);

    // Guest Mask States
    const [isGuestMaskOpen, setIsGuestMaskOpen] = useState(false);
    const [editingGuestForMask, setEditingGuestForMask] = useState<Guest | null>(null);

    const [deleteConfirm, setDeleteConfirm] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        confirmText?: string;
        variant?: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: "",
        description: "",
        confirmText: "LÃ¶schen",
        variant: "danger",
        onConfirm: () => { },
    });

    // Wizard States

    const [wizardTab, setWizardTab] = useState<"details" | "breakfast">("details");
    const [editingTabId, setEditingTabId] = useState<string | null>(null);
    const [activeWizardTabId, setActiveWizardTabId] = useState<string>("tab-1");
    const [wizardTabs, setWizardTabs] = useState<BookingTab[]>([
        {
            id: "tab-1",
            label: "Hauptgast",
            data: DEFAULT_WIZARD_DATA,
            breakfastData: {}
        }
    ]);

    const wizardData = useMemo(() =>
        wizardTabs.find(t => t.id === activeWizardTabId)?.data || DEFAULT_WIZARD_DATA
        , [wizardTabs, activeWizardTabId]);

    const wizardBreakfastData = useMemo(() =>
        wizardTabs.find(t => t.id === activeWizardTabId)?.breakfastData || {}
        , [wizardTabs, activeWizardTabId]);

    const setWizardData = (update: React.SetStateAction<WizardData>) => {
        setWizardTabs(prevTabs => prevTabs.map((tab, index) => {
            if (tab.id !== activeWizardTabId) return tab;
            const newData = typeof update === 'function'
                ? (update as (prev: WizardData) => WizardData)(tab.data)
                : update;

            // Automatically update label from placeholder to guest name or vice versa
            let newLabel = tab.label;
            const defaultPlaceholder = index === 0 ? "Hauptgast" : `Gast ${index + 1}`;
            const isPlaceholder = tab.label === "Hauptgast" || tab.label.startsWith("Gast ");
            const isPreviousGuestName = tab.label === tab.data.guestName && tab.data.guestName !== "";

            if (newData.guestName) {
                if (isPlaceholder || isPreviousGuestName) {
                    newLabel = newData.guestName;
                }
            } else {
                // If guestName is cleared, revert to default placeholder if it was the guest name
                if (isPreviousGuestName) {
                    newLabel = defaultPlaceholder;
                }
            }

            return { ...tab, data: newData, label: newLabel };
        }));
    };

    const setWizardBreakfastData = (update: React.SetStateAction<Record<string, { time: string, comments: string, id: string }[]>>) => {
        setWizardTabs(prevTabs => prevTabs.map(tab => {
            if (tab.id !== activeWizardTabId) return tab;
            const newData = typeof update === 'function'
                ? (update as (prev: Record<string, any>) => Record<string, any>)(tab.breakfastData)
                : update;
            return { ...tab, breakfastData: newData };
        }));
    };
    const [guestSearch, setGuestSearch] = useState("");
    const [isCreatingGuest, setIsCreatingGuest] = useState(false);
    const [isWizardGroupSearchFocused, setIsWizardGroupSearchFocused] = useState(false);

    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successBookingData, setSuccessBookingData] = useState<{
        guestName: string;
        roomName: string;
        startDate: string;
        endDate: string;
        price?: number;
        guestCount: number;
        childCount: number;
        extraBedCount: number;
        dogCount: number;
        occasion: string;
        stayType: string;
        arrivalTime: string;
        isAllergyFriendly?: boolean;
        hasMobilityImpairment?: boolean;
        hasDog?: boolean;
    } | null>(null);

    const loadData = useCallback(async () => {
        try {
            const db = await initDb();
            if (db) {
                const bookingResults = await db.select<Booking[]>(`
                    SELECT b.*, g.name as guest_name, g.phone as guest_phone, g.email as guest_email, g.company as guest_company, r.name as room_name, bg.name as group_name
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
        // Load all bookings for this group if exists
        let groupBookings: Booking[] = [booking];
        if (booking.group_id) {
            const groupB = bookings.filter(b => b.group_id === booking.group_id);
            if (groupB.length > 0) groupBookings = groupB;
        }

        // Sort by name
        groupBookings.sort((a, b) => (a.guest_name || "").localeCompare(b.guest_name || ""));

        const tabs: EditTab[] = groupBookings.map(b => ({
            id: b.id,
            label: b.guest_name || "Gast",
            booking: b
        }));

        setEditTabs(tabs);
        setActiveEditTabId(booking.id);

        loadBreakfast(booking.id);

        setEditGroupId(booking.group_id || "none");
        setEditGroupSearch(groups.find(g => g.id === booking.group_id)?.name || "");
        setEditNewGroupName("");
        setIsEditOpen(true);
        setEditTab("details");
    }, [bookings, groups]);

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
                alert("Fehler: Dieser Raum ist im gewÃ¤hlten Zeitraum bereits fest belegt (fest gebucht oder eingecheckt).");
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

        try {
            const db = await initDb();
            if (db) {
                // 1. Update Booking Status (Revenue tracking removed)
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
        const start = new Date(booking.start_date);
        const end = new Date(booking.end_date);
        const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

        // Breakfasts
        const breakfastCount = breakfastOptions.filter(o => o.is_included === 1).length;

        return {
            nights,
            breakfastCount
        };
    };

    const updateBooking = async () => {
        if (!editingBooking) return;

        if (editingBooking.status === "Hard-Booked" || editingBooking.status === "Checked-In") {
            if (checkRoomOverlap(editingBooking.room_id, editingBooking.start_date, editingBooking.end_date, editingBooking.id)) {
                alert("Fehler: Dieser Raum ist im gewählten Zeitraum bereits fest belegt.");
                return;
            }
        }

        // New Validation: Every tab must have a room unless it is a Draft
        for (const tab of editTabs) {
            const b = tab.booking;
            if (b.status !== "Draft" && (!b.room_id || b.room_id === "")) {
                alert(`Fehler: Bitte wählen Sie einen Raum für "${b.guest_name || tab.label}" oder setzen Sie den Status auf 'Entwurf' (Draft).`);
                return;
            }
        }

        try {
            const db = await initDb();
            if (db) {
                let finalGroupId = editGroupId;
                if (finalGroupId === "new") {
                    const newName = editNewGroupName;
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
                        // Inherit from current booking if it has one? Or keep empty? 
                        // If user added multiple tabs but didn't give a group name, we might have an issue.
                        // Ideally we force a group name or auto-generate one if multiple tabs exist.
                        if (editTabs.length > 1) {
                            const newId = crypto.randomUUID();
                            const autoName = `Gruppe ${(editingBooking.guest_name || "Gast").split(' ').pop()}`;
                            await db.execute("INSERT INTO booking_groups (id, name) VALUES (?, ?)", [newId, autoName]);
                            finalGroupId = newId;
                        } else {
                            finalGroupId = "";
                        }
                    }
                }

                // Refactored Save Loop with Guest Creation
                for (const tab of editTabs) {
                    const b = tab.booking;
                    let thisGuestId = b.guest_id;
                    const thisGroupId = (finalGroupId === "none" || !finalGroupId) ? null : finalGroupId;

                    // Validate guest
                    if (!thisGuestId && b.guest_name !== "Neuer Gast") { // Allow if name is set but id is new? No, must resolve.
                        // But if guest_id is empty, user might have just typed a name?
                        // If no ID and no Name, error.
                        // If Name but no ID -> Create?
                        // The UI sets guest_id="new" if creating.
                    }

                    // Create Guest if "new" or if we have a name but no ID (and it's not empty)
                    if (thisGuestId === "new") {
                        const newGuestName = b.guest_name || tab.label;
                        const parts = newGuestName.split(' ');
                        const lastName = parts.pop() || "";
                        const firstName = parts.join(' ');

                        const newGuestId = crypto.randomUUID();
                        await db.execute(
                            "INSERT INTO guests (id, name, first_name, last_name) VALUES (?, ?, ?, ?)",
                            [newGuestId, newGuestName, firstName, lastName]
                        );
                        thisGuestId = newGuestId;
                    }

                    // Fallback: If no guest selected, try to inherit from "Main Guest" (first tab)
                    if (!thisGuestId) {
                        const mainTab = editTabs.find(t => t.booking.guest_id && t.booking.guest_id !== "new");
                        if (mainTab && mainTab.booking.guest_id) {
                            thisGuestId = mainTab.booking.guest_id;
                        } else {
                            // Only alert if we REALLY can't find a guest ID (neither direct nor inherited)
                            if (!b.guest_name || b.guest_name === "Neuer Gast") {
                                alert(`Fehler: Bitte wählen Sie einen Gast für Tab "${tab.label}".`);
                                return;
                            }
                        }
                    }

                    // Check existence in DB (reliable) or via bookings list (if fresh)
                    const subExists = bookings.some(existing => existing.id === b.id);

                    if (!subExists) {
                        if (checkRoomOverlap(b.room_id, b.start_date, b.end_date, b.id)) {
                            alert(`Fehler: Raum für ${b.guest_name || "Gast"} ist bereits belegt.`);
                            return; // Abort all
                        }
                    }

                    if (subExists) {
                        await db.execute(
                            "UPDATE bookings SET room_id = ?, guest_id = ?, occasion = ?, start_date = ?, end_date = ?, status = ?, payment_status = ?, estimated_arrival_time = ?, group_id = ?, is_family_room = ?, has_dog = ?, is_allergy_friendly = ?, has_mobility_impairment = ?, guests_per_room = ?, stay_type = ?, dog_count = ?, child_count = ?, extra_bed_count = ? WHERE id = ?",
                            [
                                b.room_id || null,
                                thisGuestId || null,
                                b.occasion,
                                b.start_date,
                                b.end_date,
                                b.status,
                                b.payment_status,
                                b.estimated_arrival_time,
                                thisGroupId, // Already handles null
                                b.is_family_room,
                                b.has_dog,
                                b.is_allergy_friendly,
                                b.has_mobility_impairment,
                                b.guests_per_room,
                                b.stay_type,
                                b.dog_count,
                                b.child_count,
                                b.extra_bed_count,
                                b.id
                            ]
                        );
                    } else {
                        // INSERT
                        await db.execute(
                            "INSERT INTO bookings (id, room_id, guest_id, occasion, start_date, end_date, status, payment_status, estimated_arrival_time, group_id, is_family_room, has_dog, is_allergy_friendly, has_mobility_impairment, guests_per_room, stay_type, dog_count, child_count, extra_bed_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            [
                                b.id,
                                b.room_id || null,
                                thisGuestId || null,
                                b.occasion,
                                b.start_date,
                                b.end_date,
                                b.status,
                                b.payment_status || "Offen",
                                b.estimated_arrival_time,
                                thisGroupId,
                                b.is_family_room,
                                b.has_dog,
                                b.is_allergy_friendly,
                                b.has_mobility_impairment,
                                b.guests_per_room,
                                b.stay_type,
                                b.dog_count,
                                b.child_count,
                                b.extra_bed_count
                            ]
                        );
                    }
                }

                await loadData();
                setIsEditOpen(false);
                setEditingBooking(null);
            }
        } catch (error) {
            console.error("Failed to update booking:", error);
        }
    };

    const cancelBooking = async (id: string) => {
        setDeleteConfirm({
            isOpen: true,
            title: "Buchung stornieren",
            description: "MÃ¶chten Sie diese Buchung wirklich stornieren? Der Termin wird fÃ¼r andere GÃ¤ste freigegeben.",
            confirmText: "Stornieren",
            variant: "warning",
            onConfirm: async () => {
                try {
                    const db = await initDb();
                    if (db) {
                        await db.execute("UPDATE bookings SET status = 'Storniert' WHERE id = ?", [id]);
                        await loadData();
                        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
                    }
                } catch (error) {
                    console.error("Failed to cancel booking:", error);
                }
            }
        });
    };

    const permanentDeleteBooking = async (id: string) => {
        setDeleteConfirm({
            isOpen: true,
            title: "Buchung unwiderruflich lÃ¶schen",
            description: "Diese Aktion kann nicht rÃ¼ckgÃ¤ngig gemacht werden. Alle Daten zu dieser Buchung werden gelÃ¶scht.",
            confirmText: "LÃ¶schen",
            variant: "danger",
            onConfirm: async () => {
                try {
                    const db = await initDb();
                    if (db) {
                        await db.execute("DELETE FROM breakfast_options WHERE booking_id = ?", [id]);
                        await db.execute("DELETE FROM bookings WHERE id = ?", [id]);
                        await loadData();
                        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
                    }
                } catch (error) {
                    console.error("Failed to delete booking:", error);
                }
            }
        });
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
        setCustomerSearchQuery("");
        setSearchFilter(null);
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

        // Search Filter
        if (searchFilter) {
            if (searchFilter.type === 'guest' && b.guest_id !== searchFilter.id) return false;
            if (searchFilter.type === 'group' && b.group_id !== searchFilter.id) return false;
            if (searchFilter.type === 'company' && b.guest_company !== searchFilter.id) return false;
        }

        return true;
    }).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    const groupedData = useMemo(() => {
        const tempResult: { group: BookingGroup | null, bookings: Booking[], sortDate: string }[] = [];
        const bookingsByGroup = new Map<string, Booking[]>();
        const individualBookings: Booking[] = [];

        // 1. Separate bookings into groups and individuals
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

        // 2. Add Groups to result
        // Process known groups
        groups.forEach(group => {
            if (bookingsByGroup.has(group.id)) {
                const groupBookings = bookingsByGroup.get(group.id)!;
                // Determine sort date (earliest booking in group)
                const startDates = groupBookings.map(b => b.start_date);
                const sortDate = startDates.reduce((min, current) => current < min ? current : min, startDates[0] || "9999-99-99");

                tempResult.push({ group, bookings: groupBookings, sortDate });
                bookingsByGroup.delete(group.id);
            }
        });

        // Process remaining (unknown/deleted) groups
        bookingsByGroup.forEach((bookings, groupId) => {
            const startDates = bookings.map(b => b.start_date);
            const sortDate = startDates.reduce((min, current) => current < min ? current : min, startDates[0] || "9999-99-99");

            tempResult.push({
                group: { id: groupId, name: `Unbekannte Gruppe (${groupId.substring(0, 4)}...)` },
                bookings,
                sortDate
            });
        });

        // 3. Add Individual Bookings as separate items
        individualBookings.forEach(b => {
            tempResult.push({ group: null, bookings: [b], sortDate: b.start_date });
        });

        // 4. Sort everything chronologically
        tempResult.sort((a, b) => a.sortDate.localeCompare(b.sortDate));

        // 5. Return clean structure
        return tempResult.map(({ group, bookings }) => ({ group, bookings }));
    }, [filteredBookings, groups]);

    const searchSuggestions = useMemo(() => {
        if (!customerSearchQuery) return [];
        const query = customerSearchQuery.toLowerCase();
        const results: { type: 'guest' | 'group' | 'company', id: string, label: string, subLabel?: string }[] = [];

        // 1. Groups
        groups.filter(g => g.name.toLowerCase().includes(query)).forEach(g => {
            results.push({ type: 'group', id: g.id, label: g.name, subLabel: 'Gruppe' });
        });

        // 2. Companies (Unique)
        const matchingCompanies = new Set<string>();
        guests.forEach(g => {
            if (g.company && g.company.toLowerCase().includes(query)) {
                matchingCompanies.add(g.company);
            }
        });
        Array.from(matchingCompanies).sort().forEach(c => {
            results.push({ type: 'company', id: c, label: c, subLabel: 'Firma' });
        });

        // 3. Guests
        guests.filter(g => g.name.toLowerCase().includes(query)).slice(0, 10).forEach(g => {
            results.push({ type: 'guest', id: g.id, label: g.name, subLabel: g.company || 'Privatgast' });
        });

        return results;
    }, [guests, groups, customerSearchQuery]);

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

    // --- EDIT DIALOG LOGIC ---

    const filteredEditGuests = useMemo(() => {
        if (!editGuestSearch) return guests.slice(0, 5);
        return guests.filter(g =>
            g.name.toLowerCase().includes(editGuestSearch.toLowerCase()) ||
            g.company?.toLowerCase().includes(editGuestSearch.toLowerCase())
        ).slice(0, 5);
    }, [guests, editGuestSearch]);

    const editRoomTypeAvailability = useMemo(() => {
        const availability: Record<string, number> = {};
        if (!editingBooking) return availability;

        roomTypes.forEach(type => {
            const roomsOfType = rooms.filter(r => r.type === type);
            if (!editingBooking.start_date || !editingBooking.end_date) {
                availability[type] = roomsOfType.length;
                return;
            }

            const availableCount = roomsOfType.filter(r => {
                const hasOverlap = bookings.some(b =>
                    b.id !== editingBooking.id && // Exclude current booking
                    b.room_id === r.id &&
                    b.status !== "Checked-Out" &&
                    b.status !== "Storniert" &&
                    b.start_date < editingBooking.end_date &&
                    b.end_date > editingBooking.start_date
                );
                return !hasOverlap;
            }).length;
            availability[type] = availableCount;
        });
        return availability;
    }, [rooms, bookings, editingBooking, roomTypes]);

    const editAllRoomsForType = useMemo(() => {
        if (!editRoomType) return [];
        return rooms.filter(r => r.type === editRoomType);
    }, [rooms, editRoomType]);

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

            }
        } catch (error) {
            console.error("Failed to create guest:", error);
        }
    };

    const finishWizard = async () => {
        try {
            const db = await initDb();
            if (!db) return;

            // 1. Resolve Group ID (Once for all tabs)
            // Use the first tab as the "Main" source for group info
            const mainTabData = wizardTabs[0].data;
            let finalGroupId = mainTabData.groupId;

            if (finalGroupId === "new" && mainTabData.newGroupName) {
                const existingGroup = groups.find(g => g.name.toLowerCase() === mainTabData.newGroupName.toLowerCase());
                if (existingGroup) {
                    finalGroupId = existingGroup.id;
                } else {
                    finalGroupId = crypto.randomUUID();
                    await db.execute("INSERT INTO booking_groups (id, name) VALUES (?, ?)", [finalGroupId, mainTabData.newGroupName]);
                }
            }

            const groupIdToUse = (finalGroupId === "new" || finalGroupId === "none" || !finalGroupId) ? null : finalGroupId;

            // 2. Validate Data and Pre-Check Overlaps for ALL tabs
            for (let i = 0; i < wizardTabs.length; i++) {
                const tab = wizardTabs[i];

                // Main guest MUST be selected
                if (i === 0 && !tab.data.guestId) {
                    setActiveWizardTabId(tab.id);
                    alert(`Bitte wählen Sie einen Gast für "${tab.label}".`);
                    return;
                }

                // Room MUST be selected for all
                if (!tab.data.roomId) {
                    setActiveWizardTabId(tab.id);
                    alert(`Bitte wählen Sie ein Zimmer für "${tab.label}".`);
                    return;
                }

                if (checkRoomOverlap(tab.data.roomId, tab.data.startDate, tab.data.endDate)) {
                    setActiveWizardTabId(tab.id);
                    alert(`Hinweis: Der Raum für "${tab.label}" ist in diesem Zeitraum bereits belegt.`);
                    return;
                }
            }

            // 3. Save Bookings
            const mainGuestId = wizardTabs[0].data.guestId;

            for (const tab of wizardTabs) {
                const data = tab.data;
                const bookingId = crypto.randomUUID();

                // Use selected guest OR fallback to main guest
                const finalGuestId = data.guestId || mainGuestId;

                await db.execute(
                    "INSERT INTO bookings (id, room_id, guest_id, occasion, start_date, end_date, status, payment_status, estimated_arrival_time, group_id, is_family_room, has_dog, is_allergy_friendly, has_mobility_impairment, guests_per_room, stay_type, dog_count, child_count, extra_bed_count, is_main_guest) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [bookingId, data.roomId, finalGuestId, data.occasion, data.startDate, data.endDate, data.status || "Draft", "Offen", data.arrivalTime, groupIdToUse, data.isFamilyRoom ? 1 : 0, data.dogCount > 0 ? 1 : 0, data.isAllergyFriendly ? 1 : 0, data.hasMobilityImpairment ? 1 : 0, data.guestsPerRoom, data.stayType, data.dogCount, data.childCount, data.extraBedCount, tab.id === wizardTabs[0].id ? 1 : 0]
                );

                // Save Breakfast
                const days = getDaysArray(data.startDate, data.endDate);
                const tabBreakfastData = tab.breakfastData || {}; // Use tab specific breakfast data
                for (const day of days) {
                    const dayOptions = tabBreakfastData[day] || [];
                    if (dayOptions.length > 0) {
                        for (const opt of dayOptions) {
                            await db.execute(
                                "INSERT INTO breakfast_options (id, booking_id, date, time, comments, is_included, is_prepared, guest_count, source, is_manual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                                [crypto.randomUUID(), bookingId, day, opt.time || "08:00", opt.comments || "", 1, 0, 1, "manual", 1]
                            );
                        }
                    }
                }
            }

            // 4. Cleanup & Success
            await loadData();
            setIsBookingOpen(false);

            if (wizardTabs.some(t => t.data.status === "Hard-Booked")) {
                const firstTab = wizardTabs[0];
                const roomName = rooms.find(r => r.id === firstTab.data.roomId)?.name || "Unbekanntes Zimmer";
                // Show success for main guest
                setSuccessBookingData({
                    guestName: firstTab.data.guestName,
                    roomName: roomName,
                    startDate: firstTab.data.startDate,
                    endDate: firstTab.data.endDate,
                    guestCount: wizardTabs.reduce((acc, t) => acc + (t.data.guestsPerRoom || 1), 0),
                    childCount: firstTab.data.childCount,
                    extraBedCount: firstTab.data.extraBedCount,
                    dogCount: firstTab.data.dogCount,
                    occasion: firstTab.data.occasion || "Standard",
                    stayType: firstTab.data.stayType || "privat",
                    arrivalTime: firstTab.data.arrivalTime,
                    isAllergyFriendly: firstTab.data.isAllergyFriendly,
                    hasMobilityImpairment: firstTab.data.hasMobilityImpairment,
                    hasDog: firstTab.data.dogCount > 0
                });
                setShowSuccessModal(true);
            }

            resetWizard();
        } catch (error) {
            console.error("Failed to add bookings:", error);
        }
    };

    const resetWizard = () => {

        setIsCreatingGuest(false);
        const initialTab: BookingTab = {
            id: "tab-1",
            label: "Hauptgast",
            data: DEFAULT_WIZARD_DATA,
            breakfastData: {}
        };
        setWizardTabs([initialTab]);
        setActiveWizardTabId("tab-1");

        setWizardTab("details");
        setGuestSearch("");
        setGroupSearch("");
    };

    const handleExport = async () => {
        if (filteredBookings.length === 0) {
            alert("No bookings to export.");
            return;
        }

        const headers = [
            "Buchungs-ID",
            "Gast Name",
            "Gast Email",
            "Gast Telefon",
            "Gast Firma",
            "Zimmer",
            "Anreise",
            "Abreise",
            "Status",
            "Zahlungsstatus",
            "Ankunftszeit",
            "Anlass",
            "Aufenthaltstyp",
            "Erwachsene/Zimmer",
            "Kinder",
            "Hunde",
            "Aufbettungen",
            "Allergikerfreundlich",
            "Barrierefrei",
            "Gruppe"
        ];

        const csvRows = [
            headers.join(";"),
            ...filteredBookings.map(b => {
                const room = rooms.find(r => r.id === b.room_id);
                const guest = guests.find(g => g.id === b.guest_id);
                const group = groups.find(g => g.id === b.group_id);

                return [
                    b.id,
                    `"${(b.guest_name || guest?.name || "").replace(/"/g, '""')}"`,
                    b.guest_email || guest?.email || "",
                    `"${(b.guest_phone || guest?.phone || "").replace(/"/g, '""')}"`,
                    `"${(guest?.company || "").replace(/"/g, '""')}"`,
                    `"${(b.room_name || room?.name || b.room_id).replace(/"/g, '""')}"`,
                    new Date(b.start_date).toLocaleDateString("de-DE"),
                    new Date(b.end_date).toLocaleDateString("de-DE"),
                    b.status,
                    b.payment_status,
                    b.estimated_arrival_time || "",
                    b.occasion || "",
                    b.stay_type || "",
                    b.guests_per_room || 1,
                    b.child_count || 0,
                    b.dog_count || 0,
                    b.extra_bed_count || 0,
                    b.is_allergy_friendly ? "Ja" : "Nein",
                    b.has_mobility_impairment ? "Ja" : "Nein",
                    `"${(b.group_name || group?.name || "").replace(/"/g, '""')}"`
                ].join(";");
            })
        ];

        const csvString = "\ufeff" + csvRows.join("\n");

        // Check if running in Tauri environment
        const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

        if (isTauri) {
            try {
                const filePath = await save({
                    defaultPath: `buchungen_export_${new Date().toISOString().split('T')[0]}.csv`,
                    filters: [{
                        name: 'CSV',
                        extensions: ['csv']
                    }]
                });

                if (filePath) {
                    await writeTextFile(filePath, csvString);
                }
            } catch (error) {
                console.error("Failed to save file via Tauri:", error);
            }
        } else {
            // Web Fallback
            const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `buchungen_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="px-4 border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                        onClick={handleExport}
                    >
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                    <Dialog open={isBookingOpen} onOpenChange={(val) => {
                        setIsBookingOpen(val);
                        if (!val) resetWizard();
                    }}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => resetWizard()}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Neue Buchung
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-full h-[95vh] flex flex-col p-6 overflow-hidden">
                            <DialogHeader className="mb-4 shrink-0">
                                <DialogTitle className="text-2xl font-bold flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-blue-600 rounded-lg text-white">
                                                <Plus className="w-5 h-5" />
                                            </div>
                                            Buchungs-Assistent
                                        </div>
                                        <div className="flex bg-zinc-100 p-1 rounded-lg">
                                            <button
                                                onClick={() => setWizardTab("details")}
                                                className={cn(
                                                    "px-4 py-1.5 text-sm font-bold rounded-md transition-all",
                                                    wizardTab === "details" ? "bg-white text-blue-600 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                                                )}
                                            >
                                                Buchungsdaten
                                            </button>
                                            <button
                                                disabled={!wizardData.startDate || !wizardData.endDate}
                                                onClick={() => setWizardTab("breakfast")}
                                                className={cn(
                                                    "px-4 py-1.5 text-sm font-bold rounded-md transition-all",
                                                    wizardTab === "breakfast" ? "bg-white text-blue-600 shadow-sm" : "text-zinc-500 hover:text-zinc-900",
                                                    (!wizardData.startDate || !wizardData.endDate) && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                Frühstück
                                            </button>
                                        </div>
                                    </div>

                                    {/* Group Booking Tabs */}
                                    <div className="flex items-center gap-2 -mb-2 overflow-x-auto pb-2 scrollbar-thin border-b border-zinc-200">
                                        {wizardTabs.map(tab => (
                                            <div
                                                key={tab.id}
                                                className={cn(
                                                    "px-4 py-2 text-sm font-bold rounded-t-lg border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-2 select-none",
                                                    tab.id === activeWizardTabId
                                                        ? "border-blue-600 text-blue-600 bg-blue-50/50"
                                                        : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
                                                )}
                                                onClick={() => {
                                                    setActiveWizardTabId(tab.id);
                                                    if (editingTabId !== tab.id) setEditingTabId(null);
                                                }}
                                                onDoubleClick={() => setEditingTabId(tab.id)}
                                            >
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    tab.data.status === "Hard-Booked" ? "bg-blue-500" :
                                                        tab.data.status === "Storniert" ? "bg-red-500" :
                                                            "bg-zinc-300"
                                                )} />
                                                {editingTabId === tab.id ? (
                                                    <input
                                                        autoFocus
                                                        className="bg-white border border-blue-300 rounded px-1 py-0.5 text-sm w-24 outline-none text-blue-900"
                                                        value={tab.label}
                                                        onChange={(e) => setWizardTabs(prev => prev.map(t => t.id === tab.id ? { ...t, label: e.target.value } : t))}
                                                        onBlur={() => setEditingTabId(null)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") setEditingTabId(null);
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-1.5">
                                                        {tab.id === wizardTabs[0].id && (
                                                            <Crown className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                                                        )}
                                                        <span className="truncate max-w-[120px]">{tab.label}</span>
                                                        {wizardTabs.length > 1 && (
                                                            <div
                                                                className="p-0.5 rounded-full hover:bg-zinc-200"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (wizardTabs.length > 1) {
                                                                        const newTabs = wizardTabs.filter(t => t.id !== tab.id);
                                                                        setWizardTabs(newTabs);
                                                                        if (activeWizardTabId === tab.id) {
                                                                            setActiveWizardTabId(newTabs[0].id);
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                <XCircle className="w-3.5 h-3.5 opacity-50 hover:opacity-100 hover:text-red-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        <button
                                            disabled={(!wizardTabs[0].data.groupId || wizardTabs[0].data.groupId === "none") && (!wizardTabs[0].data.newGroupName)}
                                            onClick={() => {
                                                const newId = crypto.randomUUID();
                                                const mainTab = wizardTabs[0];
                                                setWizardTabs(prev => [...prev, {
                                                    id: newId,
                                                    label: `Gast ${prev.length + 1}`,
                                                    data: {
                                                        ...DEFAULT_WIZARD_DATA,
                                                        roomId: "",
                                                        guestId: "",
                                                        guestName: "",
                                                        // Inherit Group & Dates
                                                        groupId: mainTab.data.groupId,
                                                        newGroupName: mainTab.data.newGroupName,
                                                        startDate: mainTab.data.startDate,
                                                        endDate: mainTab.data.endDate,
                                                        arrivalTime: mainTab.data.arrivalTime
                                                    },
                                                    breakfastData: {}
                                                }]);
                                                setActiveWizardTabId(newId);
                                            }}
                                            className="p-1 rounded-full hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed ml-2"
                                            title={(!wizardTabs[0].data.groupId && !wizardTabs[0].data.newGroupName) ? "Bitte erst eine Gruppe am Hauptgast festlegen" : "Weiteren Gast hinzufügen"}
                                        >
                                            <Plus className="w-5 h-5 text-zinc-400" />
                                        </button>
                                    </div>
                                </DialogTitle>
                            </DialogHeader>

                            {wizardTab === "details" ? (
                                <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
                                    {/* SPALTE 1: GAST (3 Spalten) */}
                                    <div className={cn(
                                        "col-span-3 transition-all duration-500 min-h-0",
                                        !wizardData.guestId ? "running-border-container shadow-2xl scale-[1.02]" : "border-r border-zinc-100 pr-6 flex flex-col"
                                    )}>
                                        <div className={cn(
                                            "flex flex-col gap-4 overflow-y-auto flex-1",
                                            !wizardData.guestId ? "running-border-content p-4" : ""
                                        )}>
                                            <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 block">1. Gast wählen</Label>

                                            {isCreatingGuest ? (
                                                <form onSubmit={handleCreateGuest} className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-bold text-blue-700 dark:text-blue-400 text-sm">Neuer Gast</h4>
                                                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsCreatingGuest(false)}>
                                                            <XCircle className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px]">Vorname</Label>
                                                            <Input name="first_name" required className="h-8 text-xs" placeholder="Max" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px]">Nachname</Label>
                                                            <Input name="last_name" required className="h-8 text-xs" placeholder="Mustermann" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">E-Mail</Label>
                                                        <Input name="email" type="email" className="h-8 text-xs" placeholder="max@beispiel.de" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">Telefon</Label>
                                                        <Input name="phone" type="tel" className="h-8 text-xs" placeholder="+49..." />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">Firma</Label>
                                                        <Input name="company" className="h-8 text-xs" placeholder="Optional" />
                                                    </div>
                                                    <Button type="submit" size="sm" className="w-full bg-blue-600 font-bold text-xs mt-2">Gast speichern</Button>
                                                </form>
                                            ) : (
                                                <>
                                                    <div className="relative mb-3">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                                        <Input
                                                            placeholder="Gast suchen..."
                                                            className="pl-9 h-10 bg-white shadow-sm"
                                                            value={guestSearch}
                                                            onChange={(e) => setGuestSearch(e.target.value)}
                                                        />
                                                    </div>

                                                    {wizardData.guestId && (
                                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3 mb-4 relative group">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => setWizardData(prev => ({ ...prev, guestId: "", guestName: "" }))}
                                                            >
                                                                <XCircle className="w-4 h-4 text-blue-400 hover:text-blue-600" />
                                                            </Button>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                                                                    {wizardData.guestName.charAt(0)}
                                                                </div>
                                                                <div className="overflow-hidden">
                                                                    <div className="text-[10px] text-blue-600 font-bold uppercase">Ausgewählt</div>
                                                                    <div className="font-bold text-sm truncate">{wizardData.guestName}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="space-y-1 overflow-y-auto max-h-[400px] pr-1">
                                                        {filteredWizardGuests.map(g => (
                                                            <button
                                                                key={g.id}
                                                                onClick={() => setWizardData(prev => ({ ...prev, guestId: g.id, guestName: g.name }))}
                                                                className={cn(
                                                                    "w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all",
                                                                    wizardData.guestId === g.id
                                                                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                                                                        : "border-transparent hover:bg-zinc-50 hover:border-zinc-200"
                                                                )}
                                                            >
                                                                <div className="overflow-hidden">
                                                                    <div className={cn("font-bold text-sm truncate", wizardData.guestId === g.id ? "text-white" : "text-zinc-900")}>{g.name}</div>
                                                                    <div className={cn("text-xs truncate", wizardData.guestId === g.id ? "text-blue-100" : "text-zinc-500")}>{g.company || "Privatgast"}</div>
                                                                </div>
                                                                {wizardData.guestId === g.id && <Check className="w-4 h-4 text-white" />}
                                                            </button>
                                                        ))}

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="w-full h-10 border-dashed border-zinc-300 text-zinc-500 hover:border-blue-500 hover:text-blue-600 mt-2"
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

                                    {/* SPALTE 2: DETAILS (4 Spalten) */}
                                    <div className={cn(
                                        "col-span-4 transition-all duration-500 min-h-0",
                                        wizardData.guestId && (!wizardData.startDate || !wizardData.endDate) ? "running-border-container shadow-2xl scale-[1.02]" : "border-r border-zinc-100 pr-6 flex flex-col"
                                    )}>
                                        <div className={cn(
                                            "flex flex-col gap-4 overflow-y-auto flex-1",
                                            wizardData.guestId && (!wizardData.startDate || !wizardData.endDate) ? "running-border-content p-4" : ""
                                        )}>
                                            <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">2. Zeitraum & Details</Label>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs flex items-center">Anreise <span className="text-red-500 ml-1 font-bold">*</span></Label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                                        <Input
                                                            type="date"
                                                            required
                                                            className={cn(
                                                                "pl-9 h-10 transition-all",
                                                                wizardData.guestId && !wizardData.startDate ? "field-active-highlight" : ""
                                                            )}
                                                            value={wizardData.startDate}
                                                            onChange={(e) => setWizardData(prev => ({ ...prev, startDate: e.target.value }))}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs flex items-center">Abreise <span className="text-red-500 ml-1 font-bold">*</span></Label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                                        <Input
                                                            type="date"
                                                            required
                                                            className={cn(
                                                                "pl-9 h-10 transition-all",
                                                                wizardData.guestId && !wizardData.endDate ? "field-active-highlight" : ""
                                                            )}
                                                            value={wizardData.endDate}
                                                            onChange={(e) => setWizardData(prev => ({ ...prev, endDate: e.target.value }))}
                                                            min={wizardData.startDate}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <Label className="text-xs">Gruppe (Optional)</Label>
                                            <div className="relative group">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                                                <Input
                                                    placeholder="Gruppe suchen oder erstellen..."
                                                    className="pl-9 h-10 shadow-sm transition-all border-zinc-200 focus:border-blue-500 focus:ring-blue-500/20"
                                                    value={groupSearch}
                                                    onFocus={() => setIsWizardGroupSearchFocused(true)}
                                                    onBlur={() => setTimeout(() => setIsWizardGroupSearchFocused(false), 200)}
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

                                                {isWizardGroupSearchFocused && groupSearch && !groups.some(g => g.name.toLowerCase() === groupSearch.toLowerCase()) && (
                                                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-blue-100 dark:border-blue-900 p-2 animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="text-xs text-blue-600 font-bold uppercase mb-1 px-1">Ausgewählt: Neu</div>
                                                        <button
                                                            type="button"
                                                            className="w-full text-left flex items-center gap-2 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md text-blue-700 dark:text-blue-300 font-medium text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                                            onClick={() => {
                                                                setWizardData(prev => ({ ...prev, groupId: "new", newGroupName: groupSearch }));
                                                                setIsWizardGroupSearchFocused(false);
                                                            }}
                                                        >
                                                            <Plus className="w-4 h-4" /> "{groupSearch}" erstellen
                                                        </button>
                                                    </div>
                                                )}
                                                {isWizardGroupSearchFocused && (
                                                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-zinc-950 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 max-h-[150px] overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-200">
                                                        {groups
                                                            .filter(g => !groupSearch || (g.name.toLowerCase().includes(groupSearch.toLowerCase()) && g.name.toLowerCase() !== groupSearch.toLowerCase()))
                                                            .map(g => (
                                                                <button
                                                                    key={g.id}
                                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all flex items-center justify-between group/item"
                                                                    onClick={() => {
                                                                        setGroupSearch(g.name);
                                                                        setWizardData(prev => ({ ...prev, groupId: g.id, newGroupName: "" }));
                                                                    }}
                                                                >
                                                                    <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover/item:text-blue-700 dark:group-hover/item:text-blue-400">{g.name}</span>
                                                                    {groupSearch === g.name && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                                                </button>
                                                            ))
                                                        }
                                                        {groups.length === 0 && (
                                                            <div className="px-3 py-4 text-xs text-zinc-400 italic text-center">Keine Gruppen vorhanden</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Buchungstyp</Label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {["Single", "Pärchen", "Familie", "Monteur"].map((opt) => (
                                                        <Button
                                                            key={opt}
                                                            type="button"
                                                            variant={wizardData.occasion === opt ? "default" : "outline"}
                                                            className={cn(
                                                                "h-8 text-[10px] font-medium px-1",
                                                                wizardData.occasion === opt ? "bg-blue-600 hover:bg-blue-700" : "text-zinc-600"
                                                            )}
                                                            onClick={() => setWizardData(prev => ({ ...prev, occasion: opt }))}
                                                        >
                                                            {opt}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-zinc-500 uppercase">Gäste / Zimmer</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        className="h-9"
                                                        value={wizardData.guestsPerRoom}
                                                        onChange={(e) => setWizardData(prev => ({ ...prev, guestsPerRoom: parseInt(e.target.value) || 1 }))}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-zinc-500 uppercase">Aufenthaltstyp</Label>
                                                    <Select
                                                        value={wizardData.stayType}
                                                        onValueChange={(val) => setWizardData(prev => ({ ...prev, stayType: val }))}
                                                    >
                                                        <SelectTrigger className="h-9">
                                                            <SelectValue placeholder="Wählen..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="privat">Privat</SelectItem>
                                                            <SelectItem value="beruflich">Beruflich</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-zinc-500 uppercase">Hunde</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        className="h-8 text-xs"
                                                        value={wizardData.dogCount}
                                                        onChange={(e) => setWizardData(prev => ({ ...prev, dogCount: parseInt(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-zinc-500 uppercase">Kinder</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        className="h-8 text-xs"
                                                        value={wizardData.childCount}
                                                        onChange={(e) => setWizardData(prev => ({ ...prev, childCount: parseInt(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-zinc-500 uppercase">Aufbett.</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        className="h-8 text-xs"
                                                        value={wizardData.extraBedCount}
                                                        onChange={(e) => setWizardData(prev => ({ ...prev, extraBedCount: parseInt(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold text-zinc-500 uppercase">Ankunft</Label>
                                                    <Input
                                                        type="time"
                                                        className="h-8 text-xs"
                                                        value={wizardData.arrivalTime}
                                                        onChange={(e) => setWizardData(prev => ({ ...prev, arrivalTime: e.target.value }))}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 pt-2">
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        id="wizard-allergy"
                                                        checked={wizardData.isAllergyFriendly}
                                                        onCheckedChange={(val) => setWizardData(prev => ({ ...prev, isAllergyFriendly: val }))}
                                                    />
                                                    <Label htmlFor="wizard-allergy" className="text-xs font-medium">Allergikerfreundlich benötigt</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        id="wizard-mobility"
                                                        checked={wizardData.hasMobilityImpairment}
                                                        onCheckedChange={(val) => setWizardData(prev => ({ ...prev, hasMobilityImpairment: val }))}
                                                    />
                                                    <Label htmlFor="wizard-mobility" className="text-xs font-medium">Barrierefreiheit benötigt</Label>
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                    {/* SPALTE 3: ZIMMER (5 Spalten) */}
                                    <div className={cn(
                                        "col-span-5 transition-all duration-500 min-h-0",
                                        wizardData.guestId && wizardData.startDate && wizardData.endDate && !wizardData.roomId ? "running-border-container shadow-2xl scale-[1.02]" : "flex flex-col"
                                    )}>
                                        <div className={cn(
                                            "flex flex-col gap-4 overflow-y-auto flex-1",
                                            wizardData.guestId && wizardData.startDate && wizardData.endDate && !wizardData.roomId ? "running-border-content p-4" : ""
                                        )}>
                                            <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">3. Zimmer wählen</Label>

                                            <div className="space-y-3">
                                                <div className="text-sm font-medium mb-1">Zimmertyp filtern</div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {roomTypes.map(type => {
                                                        const availableCount = roomTypeAvailability[type] || 0;
                                                        const isDisabled = availableCount === 0;
                                                        return (
                                                            <button
                                                                key={type}
                                                                disabled={isDisabled}
                                                                onClick={() => {
                                                                    setWizardData(prev => ({
                                                                        ...prev,
                                                                        roomType: prev.roomType === type ? "" : type, // Toggle 
                                                                        roomId: "" // Reset selection on change
                                                                    }))
                                                                }}
                                                                className={cn(
                                                                    "flex items-center gap-2 p-1.5 rounded-lg border transition-all text-left",
                                                                    wizardData.roomType === type
                                                                        ? "bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-600/20"
                                                                        : isDisabled
                                                                            ? "opacity-50 cursor-not-allowed bg-zinc-50 border-zinc-200"
                                                                            : "border-zinc-200 hover:border-blue-400 hover:bg-blue-50"
                                                                )}
                                                            >
                                                                <div className="shrink-0">
                                                                    {getRoomIcon(type, cn("w-4 h-4", wizardData.roomType === type ? "text-white" : "text-zinc-400"))}
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className={cn("font-bold text-[10px] truncate", wizardData.roomType === type ? "text-white" : "text-zinc-900")}>{type}</span>
                                                                    <span className={cn("text-[8px] font-bold uppercase",
                                                                        wizardData.roomType === type ? "text-blue-100" : (isDisabled ? "text-red-500" : "text-emerald-600")
                                                                    )}>
                                                                        {(wizardData.startDate && wizardData.endDate) && (
                                                                            isDisabled ? "Voll" : `${availableCount}`
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-h-[200px] bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-4 overflow-y-auto">
                                                {!wizardData.startDate || !wizardData.endDate ? (
                                                    <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400">
                                                        <Calendar className="w-8 h-8 mb-2 opacity-50" />
                                                        <p className="text-sm">Bitte erst Zeitraum wählen</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-xs font-bold text-zinc-500 uppercase">
                                                                Verfügbare Zimmer {wizardData.roomType ? `(${wizardData.roomType})` : ""}
                                                            </div>
                                                            {wizardData.roomType && (
                                                                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setWizardData(prev => ({ ...prev, roomType: "" }))}>
                                                                    Filter löschen
                                                                </Button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2">
                                                            {(wizardData.roomType ? allRoomsForType : rooms).map(room => {
                                                                const isOccupied = checkRoomOverlap(room.id, wizardData.startDate, wizardData.endDate);
                                                                const isSelectedInOtherTab = wizardTabs.some(t => t.id !== activeWizardTabId && t.data.roomId === room.id);

                                                                if (isOccupied && !isSelectedInOtherTab) return null; // Hide normally occupied rooms? Or show them disabled? Current logic seemed to hide them or show specific style. 
                                                                // Logic above was: isOccupied ? "hidden" (if we want to hide) or disabled style. 
                                                                // Let's stick to showing available ones primarily, but for "Other Tab" we want to show and disable.

                                                                return (
                                                                    <button
                                                                        key={room.id}
                                                                        type="button"
                                                                        disabled={isOccupied || isSelectedInOtherTab}
                                                                        onClick={() => setWizardData(prev => ({ ...prev, roomId: room.id }))}
                                                                        className={cn(
                                                                            "p-2 rounded-xl border text-left transition-all relative overflow-hidden",
                                                                            wizardData.roomId === room.id
                                                                                ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-md shadow-emerald-500/10"
                                                                                : isSelectedInOtherTab
                                                                                    ? "bg-amber-50/50 border-amber-200 border-dashed opacity-80"
                                                                                    : isOccupied
                                                                                        ? "opacity-50 grayscale cursor-not-allowed bg-zinc-50 border-zinc-200"
                                                                                        : "border-zinc-100 bg-white hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <div className={cn(
                                                                                "w-7 h-7 shrink-0 rounded-lg flex items-center justify-center",
                                                                                wizardData.roomId === room.id ? "bg-emerald-100 text-emerald-700" :
                                                                                    isSelectedInOtherTab ? "bg-amber-100 text-amber-600" : "bg-zinc-100 text-zinc-500"
                                                                            )}>
                                                                                {getRoomIcon(room.type, "w-3.5 h-3.5")}
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <div className={cn("font-bold text-xs truncate", wizardData.roomId === room.id ? "text-emerald-900" : "text-zinc-900")}>{room.name}</div>
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <div className="text-[9px] text-zinc-500 font-medium uppercase truncate">{room.type}</div>

                                                                                    {(!!room.is_allergy_friendly) && (
                                                                                        <div title="Allergikerfreundlich" className={cn("p-0.5 rounded", wizardData.roomId === room.id ? "bg-emerald-200" : "bg-pink-100")}>
                                                                                            <Flower2 className={cn("w-2.5 h-2.5", wizardData.roomId === room.id ? "text-emerald-700" : "text-pink-500")} />
                                                                                        </div>
                                                                                    )}
                                                                                    {(!!room.is_accessible) && (
                                                                                        <div title="Barrierefrei" className={cn("p-0.5 rounded", wizardData.roomId === room.id ? "bg-emerald-200" : "bg-blue-100")}>
                                                                                            <Accessibility className={cn("w-2.5 h-2.5", wizardData.roomId === room.id ? "text-emerald-700" : "text-blue-600")} />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        {(wizardData.roomId === room.id || isSelectedInOtherTab) && (
                                                                            <div className="text-right mt-0.5">
                                                                                {wizardData.roomId === room.id && (
                                                                                    <div className="text-[8px] font-bold text-emerald-600 flex items-center justify-end gap-0.5">
                                                                                        <Check className="w-2.5 h-2.5" /> Gewählt
                                                                                    </div>
                                                                                )}
                                                                                {isSelectedInOtherTab && (
                                                                                    <div className="text-[8px] font-bold text-amber-600 flex items-center justify-end gap-0.5">
                                                                                        <Ban className="w-2.5 h-2.5" /> Belegt
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                            {(wizardData.roomType ? allRoomsForType : rooms).filter(r => !checkRoomOverlap(r.id, wizardData.startDate, wizardData.endDate)).length === 0 && (
                                                                <div className="text-center py-8 text-zinc-400 text-sm italic">
                                                                    Keine freien Zimmer gefunden.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 min-h-0 flex flex-col pt-4">
                                    <div className="space-y-4 max-h-full overflow-y-auto pr-2 pb-20">
                                        {getDaysArray(wizardData.startDate, wizardData.endDate).map(day => {
                                            const dayOptions = wizardBreakfastData[day] || [];
                                            return (
                                                <div key={day} className="p-4 border rounded-2xl bg-zinc-50 dark:bg-zinc-900 shadow-sm space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 italic">
                                                            {new Date(day).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                                        </div>
                                                        <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase" onClick={() => {
                                                            const newItem = { id: crypto.randomUUID(), time: "08:00", comments: "" };
                                                            setWizardBreakfastData(prev => ({
                                                                ...prev,
                                                                [day]: [...(prev[day] || []), newItem]
                                                            }));
                                                        }}>
                                                            <Plus className="w-3 h-3 mr-1" /> Person hinzufügen
                                                        </Button>
                                                    </div>

                                                    {dayOptions.length === 0 ? (
                                                        <div className="flex items-center justify-center py-4 border-2 border-dashed border-zinc-200 rounded-xl">
                                                            <button onClick={() => {
                                                                const newItem = { id: crypto.randomUUID(), time: "08:00", comments: "" };
                                                                setWizardBreakfastData(prev => ({
                                                                    ...prev,
                                                                    [day]: [...(prev[day] || []), newItem]
                                                                }));
                                                            }} className="text-xs text-zinc-400 font-medium hover:text-blue-500 transition-colors">
                                                                Kein Frühstück geplant. Klicken zum Hinzufügen.
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {dayOptions.map((opt, idx) => (
                                                                <div key={opt.id} className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="text-[10px] font-black text-zinc-300 uppercase italic">Person {idx + 1}</div>
                                                                        <button onClick={() => {
                                                                            setWizardBreakfastData(prev => ({
                                                                                ...prev,
                                                                                [day]: prev[day].filter(item => item.id !== opt.id)
                                                                            }));
                                                                        }} className="text-zinc-300 hover:text-red-500 transition-colors">
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[10px] uppercase font-bold text-zinc-400">Zeit</Label>
                                                                            <Input
                                                                                type="time"
                                                                                className="h-9 text-xs shadow-sm rounded-lg"
                                                                                value={opt.time}
                                                                                onChange={(e) => {
                                                                                    setWizardBreakfastData(prev => ({
                                                                                        ...prev,
                                                                                        [day]: prev[day].map(item => item.id === opt.id ? { ...item, time: e.target.value } : item)
                                                                                    }));
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[10px] uppercase font-bold text-zinc-400">Hinweise</Label>
                                                                            <Input
                                                                                className="h-9 text-xs shadow-sm rounded-lg"
                                                                                value={opt.comments}
                                                                                placeholder="Allergien..."
                                                                                onChange={(e) => {
                                                                                    setWizardBreakfastData(prev => ({
                                                                                        ...prev,
                                                                                        [day]: prev[day].map(item => item.id === opt.id ? { ...item, comments: e.target.value } : item)
                                                                                    }));
                                                                                }}
                                                                            />
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
                                </div>
                            )}

                            <DialogFooter className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between shrink-0">
                                <div className="text-xs text-zinc-500">
                                    {wizardData.startDate && wizardData.endDate && (
                                        <span>
                                            Dauer: <span className="font-bold text-zinc-900">{Math.max(1, Math.ceil((new Date(wizardData.endDate).getTime() - new Date(wizardData.startDate).getTime()) / (1000 * 60 * 60 * 24)))} Nächte</span>
                                        </span>
                                    )}
                                </div>
                                <div className="flex bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1">
                                    <button
                                        onClick={() => setWizardData(prev => ({ ...prev, status: "Draft" }))}
                                        className={cn(
                                            "px-3 py-1 text-xs font-bold rounded-md transition-all",
                                            wizardData.status === "Draft" ? "bg-white dark:bg-zinc-800 text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                                        )}
                                    >
                                        Entwurf
                                    </button>
                                    <button
                                        onClick={() => setWizardData(prev => ({ ...prev, status: "Hard-Booked" }))}
                                        className={cn(
                                            "px-3 py-1 text-xs font-bold rounded-md transition-all",
                                            wizardData.status === "Hard-Booked" ? "bg-emerald-600 text-white shadow-sm" : "text-zinc-500 hover:text-emerald-600"
                                        )}
                                    >
                                        Fest buchen
                                    </button>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="ghost" onClick={() => setIsBookingOpen(false)}>Abbrechen</Button>
                                    <Button
                                        disabled={wizardTabs.some(t => !t.data.guestId && t.id === wizardTabs[0].id) || wizardTabs.some(t => !t.data.roomId || !t.data.startDate)}
                                        className={cn(
                                            "min-w-[200px] font-bold text-white shadow-lg transition-all",
                                            wizardData.status === "Hard-Booked" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-zinc-600 hover:bg-zinc-700 shadow-zinc-500/20"
                                        )}
                                        onClick={() => finishWizard()}
                                    >
                                        {wizardData.status === "Hard-Booked" ? "Buchung abschließen" : "Entwurf speichern"} <Check className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <BookingSuccessModal
                        isOpen={showSuccessModal}
                        onClose={() => setShowSuccessModal(false)}
                        bookingData={successBookingData}
                    />
                </div >
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900/50">
                <CardContent className="py-2.5 px-4 overflow-x-auto scrollbar-none">
                    <div className="flex flex-nowrap items-end gap-4 min-w-max pb-1">
                        {/* Customer Search Filter */}
                        <div className="space-y-0.5 w-[180px] relative">
                            <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Kunde suchen</Label>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder="Gast, Firma oder Gruppe..."
                                    className="pl-9 h-9 text-sm shadow-sm"
                                    value={customerSearchQuery}
                                    onChange={(e) => {
                                        setCustomerSearchQuery(e.target.value);
                                        setShowCustomerSuggestions(true);
                                        if (e.target.value === "") setSearchFilter(null);
                                    }}
                                    onFocus={() => setShowCustomerSuggestions(true)}
                                />
                                {(customerSearchQuery || searchFilter) && (
                                    <button
                                        onClick={() => {
                                            setCustomerSearchQuery("");
                                            setSearchFilter(null);
                                            setShowCustomerSuggestions(false);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                                    >
                                        <XCircle className="w-4 h-4 text-zinc-400" />
                                    </button>
                                )}
                            </div>

                            {/* Suggestions Dropdown */}
                            {showCustomerSuggestions && customerSearchQuery && !searchFilter && (
                                <div className="absolute z-50 w-[240px] mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl max-h-[300px] overflow-y-auto p-1 animate-in fade-in zoom-in duration-200">
                                    {searchSuggestions.map((item, idx) => (
                                        <button
                                            key={`${item.type}-${item.id}-${idx}`}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all flex items-center justify-between group"
                                            onClick={() => {
                                                setCustomerSearchQuery(item.label);
                                                setSearchFilter(item);
                                                setShowCustomerSuggestions(false);
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                                    item.type === 'company' ? "bg-purple-100 text-purple-600" :
                                                        item.type === 'group' ? "bg-blue-100 text-blue-600" :
                                                            "bg-zinc-100 text-zinc-600"
                                                )}>
                                                    {item.type === 'company' ? <Building2 className="w-4 h-4" /> :
                                                        item.type === 'group' ? <Users className="w-4 h-4" /> :
                                                            <User className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                                                        {item.label}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
                                                        {item.subLabel}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5" />
                                        </button>
                                    ))}
                                    {searchSuggestions.length === 0 && (
                                        <div className="px-3 py-4 text-xs text-zinc-500 text-center italic">
                                            Keine Treffer gefunden
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-0.5 w-[140px]">
                            <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</Label>
                            <select
                                value={statusFilter ?? "all"}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-950 shadow-sm"
                            >
                                <option value="all">Alle Status</option>
                                <option value="Draft">Draft (Entwurf)</option>
                                <option value="Hard-Booked">Fest gebucht</option>
                                <option value="Checked-In">Eingecheckt</option>
                                <option value="Checked-Out">Abgereist</option>
                            </select>
                        </div>

                        <div className="space-y-0.5 w-[130px]">
                            <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">von</Label>
                            <Input type="date" value={dateFromFilter} onChange={(e) => setDateFromFilter(e.target.value)} className="h-9 text-xs shadow-sm" />
                        </div>
                        <div className="space-y-0.5 w-[130px]">
                            <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">bis</Label>
                            <Input type="date" value={dateToFilter} onChange={(e) => setDateToFilter(e.target.value)} className="h-9 text-xs shadow-sm" />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-9 shadow-sm" onClick={setTodayFilter}>
                                <Calendar className="w-4 h-4 mr-2 text-blue-500" /> Heute
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
                                    checked={!hideCanceled}
                                    onCheckedChange={(val) => setHideCanceled(!val)}
                                />
                                <Label htmlFor="hide-canceled" className="text-xs font-bold text-zinc-500 cursor-pointer flex gap-1.5 items-center">
                                    {!hideCanceled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    Stornos
                                </Label>
                            </div>
                        </div>

                        <Button variant="ghost" size="sm" className="h-9 text-xs font-bold text-zinc-500 ml-auto" onClick={resetFilters}>
                            <RotateCcw className="w-3.5 h-3.5 mr-2" /> Filter zurücksetzen
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <Table className="table-fixed w-full">
                    <TableHeader>
                        <TableRow className="bg-zinc-50/50 dark:bg-zinc-800/50 border-none">
                            <TableHead className="font-bold h-12 w-[30%]">Gast / Gruppe</TableHead>
                            <TableHead className="font-bold h-12 w-[15%]">Zimmer</TableHead>
                            <TableHead className="font-bold h-12 w-[20%]">Zeitraum</TableHead>
                            <TableHead className="font-bold h-12 w-[10%] text-center">Datenqualität</TableHead>
                            <TableHead className="font-bold h-12 w-[10%]">Status</TableHead>
                            <TableHead className="text-right font-bold h-12 px-6 w-[15%]">Aktionen</TableHead>
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
                                    <React.Fragment key={group ? group.id : groupBookings[0].id}>
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

                                                        return (
                                                            <div className="flex flex-col items-center justify-center gap-1">
                                                                <div className="relative flex items-center justify-center w-10 h-8">
                                                                    <span className={cn("text-xs font-black tracking-tight", color)}>
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
                                                                    "text-[10px] h-6 px-3 rounded-full font-bold",
                                                                    status === "Storniert" ? "bg-red-50 border-red-200 text-red-600" :
                                                                        status === "Checked-Out" ? "bg-zinc-100 border-zinc-200 text-zinc-500" :
                                                                            status === "Checked-In" ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                                                                                status === "Hard-Booked" ? "bg-blue-50 border-blue-200 text-blue-600" :
                                                                                    "bg-amber-50 border-amber-200 text-amber-600"
                                                                )}>
                                                                    {status === "Hard-Booked" ? "FEST" :
                                                                        status === "Checked-In" ? "EINGECHECKT" :
                                                                            status === "Checked-Out" ? "OUT" :
                                                                                status.toUpperCase()}
                                                                </Badge>
                                                            );
                                                        }
                                                        return (
                                                            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-600 text-[10px] h-6 px-3 rounded-full font-black">
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
                                                        <Pencil className="w-3.5 h-3.5 mr-1" /> Verwalten
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {isExpanded && groupBookings.map((booking) => (
                                            <TableRow
                                                key={booking.id}
                                                className={cn(
                                                    "group transition-colors cursor-pointer",
                                                    isGroup ? "bg-white/50" : "",
                                                    booking.status === "Storniert"
                                                        ? "hover:bg-red-50/10 opacity-70 grayscale-[0.6]"
                                                        : "hover:bg-zinc-50/50"
                                                )}
                                                onClick={() => handleEditClick(booking)}
                                            >
                                                <TableCell className={cn("py-4", isGroup ? "pl-12" : "")}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const guest = guests.find(g => g.id === booking.guest_id);
                                                                if (guest) {
                                                                    setEditingGuestForMask(guest);
                                                                    setIsGuestMaskOpen(true);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "font-bold transition-colors cursor-pointer decoration-blue-200/50 hover:underline underline-offset-4 truncate flex items-center",
                                                                booking.status === "Storniert"
                                                                    ? "line-through text-zinc-500 decoration-red-500/70 decoration-2"
                                                                    : "text-zinc-900 hover:text-blue-600"
                                                            )}
                                                        >
                                                            {booking.is_main_guest === 1 && (
                                                                <span title="Hauptgast" className="flex items-center">
                                                                    <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 mr-1.5 shrink-0" />
                                                                </span>
                                                            )}
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
                                                <TableCell className={cn(
                                                    "text-xs font-medium whitespace-nowrap",
                                                    booking.status === "Storniert" ? "line-through text-zinc-400 decoration-red-500/70 decoration-2" : "text-zinc-500"
                                                )}>
                                                    {new Date(booking.start_date).toLocaleDateString('de-DE')} - {new Date(booking.end_date).toLocaleDateString('de-DE')}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {(() => {
                                                        const hasArrival = !!booking.estimated_arrival_time;
                                                        const hasPhone = !!booking.guest_phone;
                                                        const hasEmail = !!booking.guest_email;

                                                        return (
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                {/* Arrival Time */}
                                                                <div
                                                                    title={hasArrival ? `Ankunftszeit: ${booking.estimated_arrival_time}` : (booking.start_date === today ? "DRINGEND: Ankunftszeit fehlt (Heute Anreise!)" : "Ankunftszeit fehlt")}
                                                                    className={cn(
                                                                        "p-1.5 rounded-full transition-all duration-200",
                                                                        hasArrival ? "bg-emerald-100/50 text-emerald-600" :
                                                                            (booking.start_date === today ? "bg-red-100 text-red-600 shadow-sm animate-pulse" : "bg-red-50 text-red-300 opacity-60 grayscale")
                                                                    )}
                                                                >
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                </div>

                                                                {/* Phone */}
                                                                <div
                                                                    title={hasPhone ? `Telefon: ${booking.guest_phone}` : "Telefonnummer fehlt"}
                                                                    className={cn(
                                                                        "p-1.5 rounded-full transition-all duration-200",
                                                                        hasPhone ? "bg-emerald-100/50 text-emerald-600" : "bg-red-50 text-red-300 opacity-60 grayscale"
                                                                    )}
                                                                >
                                                                    <Phone className="w-3.5 h-3.5" />
                                                                </div>

                                                                {/* Email */}
                                                                <div
                                                                    title={hasEmail ? `E-Mail: ${booking.guest_email}` : "E-Mail Adresse fehlt"}
                                                                    className={cn(
                                                                        "p-1.5 rounded-full transition-all duration-200",
                                                                        hasEmail ? "bg-emerald-100/50 text-emerald-600" : "bg-red-50 text-red-300 opacity-60 grayscale"
                                                                    )}
                                                                >
                                                                    <Mail className="w-3.5 h-3.5" />
                                                                </div>

                                                                {/* Allergy Friendly */}
                                                                {(!!booking.is_allergy_friendly) && (
                                                                    <div
                                                                        title="Allergikerfreundlich benötigt"
                                                                        className="p-1.5 rounded-full bg-pink-50 text-pink-500 transition-all duration-200 border border-pink-100"
                                                                    >
                                                                        <Flower2 className="w-3.5 h-3.5" />
                                                                    </div>
                                                                )}

                                                                {/* Accessibility */}
                                                                {(!!booking.has_mobility_impairment) && (
                                                                    <div
                                                                        title="Barrierefreiheit benötigt"
                                                                        className="p-1.5 rounded-full bg-blue-50 text-blue-600 transition-all duration-200 border border-blue-100"
                                                                    >
                                                                        <Accessibility className="w-3.5 h-3.5" />
                                                                    </div>
                                                                )}
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
                                                            <Button variant="outline" size="sm" className="h-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateBookingStatus(booking.id, "Checked-In");
                                                            }}>
                                                                <LogIn className="w-3.5 h-3.5 mr-1" /> Check-In
                                                            </Button>
                                                        )}
                                                        {booking.end_date === today && booking.status === "Checked-In" && (
                                                            <Button variant="outline" size="sm" className="h-8 border-amber-200 text-amber-600 hover:bg-amber-50" onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCheckOutClick(booking);
                                                            }}>
                                                                <LogOut className="w-3.5 h-3.5 mr-1" /> Check-Out
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
                                                        {/* Edit button removed in favor of row click */}
                                                        {booking.status === "Storniert" ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-500 hover:bg-red-50"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    permanentDeleteBooking(booking.id);
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-500 hover:bg-red-50"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    cancelBooking(booking.id);
                                                                }}
                                                                title="Stornieren"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </Button>
                                                        )}
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
                    setPendingBreakfastChanges({}); // Clear pending changes
                    router.push('/buchungen', { scroll: false });
                }
            }}>
                <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-full h-[90vh] flex flex-col p-6">
                    <DialogHeader className="mb-4 shrink-0 flex flex-row items-center justify-between">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            Buchung verwalten
                            {editingBooking?.guest_name && <span className="text-zinc-400 font-normal text-lg">| {editingBooking.guest_name}</span>}
                        </DialogTitle>

                        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                            <button
                                onClick={() => setEditTab("details")}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                                    editTab === "details" ? "bg-white dark:bg-zinc-950 text-blue-600 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                                )}
                            >
                                Details
                            </button>
                            <button
                                onClick={() => setEditTab("breakfast")}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                                    editTab === "breakfast" ? "bg-white dark:bg-zinc-950 text-blue-600 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                                )}
                            >
                                Frühstück
                            </button>
                        </div>
                    </DialogHeader>

                    {/* Group Booking Tabs in Edit Mode */}
                    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin border-b border-zinc-200 px-6 -mx-6">
                        {editTabs.map(tab => (
                            <div
                                key={tab.id}
                                className={cn(
                                    "px-4 py-2 text-sm font-bold rounded-t-lg border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-2 select-none",
                                    tab.id === activeEditTabId
                                        ? "border-blue-600 text-blue-600 bg-blue-50/50"
                                        : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
                                )}
                                onClick={() => {
                                    setActiveEditTabId(tab.id);
                                    loadBreakfast(tab.id); // Reload breakfast for the new tab
                                }}
                            >
                                {tab.label}
                            </div>
                        ))}
                        <button
                            onClick={() => {
                                const newId = crypto.randomUUID();
                                // Determine group ID: use existing, or create new "virtual" one if none exists
                                let groupId = editGroupId;
                                let groupName = editGroupSearch;

                                if (!groupId || groupId === "none") {
                                    // If we are adding a tab to a single booking, we effective create a group
                                    groupId = "new";
                                    // Maybe ask for name? Or default to "Gruppe [First Guest]"?
                                    // For now let's keep it "new" aka pending creation, and maybe auto-set group name if empty
                                    if (!editNewGroupName) {
                                        // If we have a guest name on the first tab, use that?
                                        const firstGuestName = editTabs[0]?.booking?.guest_name?.split(' ').pop() || "Gast";
                                        setEditNewGroupName(`Gruppe ${firstGuestName}`);
                                    }
                                }

                                const newBooking: Booking = {
                                    id: newId,
                                    room_id: "",
                                    guest_id: "",
                                    start_date: editingBooking?.start_date || today, // inherit dates
                                    end_date: editingBooking?.end_date || new Date(Date.now() + 86400000).toISOString().split('T')[0],
                                    status: "Draft",
                                    payment_status: "Offen",
                                    group_id: groupId,
                                    // Inherit other defaults
                                    is_family_room: 0,
                                    has_dog: 0,
                                    is_allergy_friendly: 0,
                                    has_mobility_impairment: 0,
                                    guests_per_room: 1,
                                    stay_type: "privat",
                                    dog_count: 0,
                                    child_count: 0,
                                    extra_bed_count: 0
                                };

                                setEditTabs(prev => [...prev, {
                                    id: newId,
                                    label: "Neuer Gast",
                                    booking: newBooking
                                }]);
                                setActiveEditTabId(newId);

                                // Also update the CURRENT booking's group ID in state if it was "none"
                                if (editGroupId === "none") {
                                    setEditGroupId("new");
                                    // Update all existing tabs in state to have this new group marker? 
                                    // Not strictly necessary for their `booking` object until save, 
                                    // but UI might need to know they are grouped.
                                    // The `editGroupId` state is central for the dialog, so that covers it.
                                }
                            }}
                            disabled={(!editGroupId || editGroupId === "none") && !editNewGroupName}
                            className={`p-1 rounded-full ml-2 ${(!editGroupId || editGroupId === "none") && !editNewGroupName ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-100'}`}
                            title={(!editGroupId || editGroupId === "none") && !editNewGroupName ? "Bitte erstellen Sie zuerst eine Gruppe oder geben Sie einen Gruppennamen ein" : "Weiteren Gast hinzufügen"}
                        >
                            <Plus className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>

                    {editingBooking && (
                        editTab === "details" ? (
                            <div className="flex-1 min-h-0 grid grid-cols-12 gap-6 overflow-hidden">
                                {/* SPALTE 1: GAST (3 Spalten) */}
                                <div className="col-span-3 flex flex-col gap-4 border-r border-zinc-100 pr-6 overflow-y-auto">
                                    <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">1. Gast</Label>

                                    {/* Selected Guest Display */}
                                    {editingBooking.guest_id ? (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3 mb-2 relative group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                                                    {editingBooking.guest_name?.charAt(0) || "G"}
                                                </div>
                                                <div className="overflow-hidden flex-1">
                                                    <div className="text-[10px] text-blue-600 font-bold uppercase">Aktueller Gast</div>
                                                    <div className="font-bold text-sm truncate">{editingBooking.guest_name}</div>
                                                </div>
                                                <button
                                                    onClick={() => setEditingBooking(prev => prev ? ({ ...prev, guest_id: "", guest_name: "", guest_email: "", guest_phone: "" }) : null)}
                                                    className="p-1 rounded-full hover:bg-blue-100 text-blue-400 hover:text-blue-700 transition-colors"
                                                    title="Gast entfernen"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative group mb-4">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                                            <Input
                                                placeholder="Gast suchen oder erstellen..."
                                                className="pl-9 h-10 shadow-sm transition-all border-zinc-200 focus:border-blue-500 focus:ring-blue-500/20"
                                                value={editGuestSearch}
                                                onFocus={() => setIsEditGuestSearchFocused(true)}
                                                onBlur={() => setTimeout(() => setIsEditGuestSearchFocused(false), 200)}
                                                onChange={(e) => {
                                                    setEditGuestSearch(e.target.value);
                                                    if (e.target.value === "") {
                                                        // clear
                                                    }
                                                }}
                                            />
                                            {isEditGuestSearchFocused && (
                                                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-zinc-950 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 max-h-[200px] overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-200">
                                                    {editGuestSearch && !guests.some(g => g.name.toLowerCase() === editGuestSearch.toLowerCase()) && (
                                                        <button
                                                            type="button"
                                                            className="w-full text-left flex items-center gap-2 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md text-blue-700 dark:text-blue-300 font-medium text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors mb-1"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                setEditingBooking(prev => prev ? ({ ...prev, guest_id: "new", guest_name: editGuestSearch }) : null);
                                                                setIsEditGuestSearchFocused(false);
                                                            }}
                                                        >
                                                            <Plus className="w-4 h-4" /> "{editGuestSearch}" neu erstellen
                                                        </button>
                                                    )}
                                                    {guests
                                                        .filter(g => !editGuestSearch || g.name.toLowerCase().includes(editGuestSearch.toLowerCase()))
                                                        .slice(0, 10)
                                                        .map(g => (
                                                            <button
                                                                type="button"
                                                                key={g.id}
                                                                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all flex items-center justify-between group/item"
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    setEditingBooking(prev => prev ? ({ ...prev, guest_id: g.id, guest_name: g.name, guest_email: g.email, guest_phone: g.phone }) : null);
                                                                    setEditGuestSearch("");
                                                                    setIsEditGuestSearchFocused(false);
                                                                }}
                                                            >
                                                                <div>
                                                                    <div className="font-medium text-zinc-700 dark:text-zinc-300 group-hover/item:text-blue-700 dark:group-hover/item:text-blue-400">{g.name}</div>
                                                                    {(g.email || g.phone) && <div className="text-[9px] text-zinc-400">{g.email} {g.phone}</div>}
                                                                </div>
                                                            </button>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-1 mt-4">
                                        <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Status</Label>
                                        <Select
                                            value={editingBooking.status ?? "Draft"}
                                            onValueChange={(val) => setEditingBooking({ ...editingBooking, status: val })}
                                        >
                                            <SelectTrigger
                                                className={cn(
                                                    "h-10 transition-all font-bold border-0 ring-1 ring-inset",
                                                    editingBooking.status === "Draft" && "bg-zinc-100 text-zinc-700 ring-zinc-200 hover:bg-zinc-200",
                                                    editingBooking.status === "Hard-Booked" && "bg-blue-600 text-white ring-blue-600 hover:bg-blue-700",
                                                    editingBooking.status === "Checked-In" && "bg-emerald-600 text-white ring-emerald-600 hover:bg-emerald-700",
                                                    editingBooking.status === "Checked-Out" && "bg-orange-500 text-white ring-orange-500 hover:bg-orange-600",
                                                    editingBooking.status === "Storniert" && "bg-red-600 text-white ring-red-600 hover:bg-red-700",
                                                    !editingBooking.status && "bg-zinc-100 text-zinc-700 ring-zinc-200"
                                                )}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Draft" className="font-medium text-zinc-600">Draft (Entwurf)</SelectItem>
                                                <SelectItem value="Hard-Booked" className="font-bold text-blue-600">Fest gebucht</SelectItem>
                                                <SelectItem value="Checked-In" className="font-bold text-emerald-600">Eingecheckt</SelectItem>
                                                <SelectItem value="Checked-Out" className="font-bold text-orange-600">Abgereist</SelectItem>
                                                <SelectItem value="Storniert" className="font-bold text-red-600">Storniert</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                </div>

                                {/* SPALTE 2: DETAILS (4 Spalten) */}
                                <div className="col-span-4 flex flex-col gap-5 border-r border-zinc-100 pr-6 overflow-y-auto">
                                    <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">2. Details</Label>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Anreise</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                                <Input
                                                    type="date"
                                                    className="pl-9 h-10"
                                                    value={editingBooking.start_date}
                                                    onChange={(e) => setEditingBooking(prev => prev ? ({ ...prev, start_date: e.target.value }) : null)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Abreise</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                                <Input
                                                    type="date"
                                                    className="pl-9 h-10"
                                                    value={editingBooking.end_date}
                                                    onChange={(e) => setEditingBooking(prev => prev ? ({ ...prev, end_date: e.target.value }) : null)}
                                                    min={editingBooking.start_date}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Gruppe (Optional)</Label>
                                        <div className="relative group">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                                            <Input
                                                placeholder="Gruppe suchen oder erstellen..."
                                                className="pl-9 h-10 shadow-sm transition-all border-zinc-200 focus:border-blue-500 focus:ring-blue-500/20"
                                                value={editGroupSearch}
                                                onFocus={() => setIsEditGroupSearchFocused(true)}
                                                onBlur={() => setTimeout(() => setIsEditGroupSearchFocused(false), 200)}
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

                                            {isEditGroupSearchFocused && editGroupSearch && !groups.some(g => g.name.toLowerCase() === editGroupSearch.toLowerCase()) && (
                                                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-blue-100 dark:border-blue-900 p-2 animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="text-xs text-blue-600 font-bold uppercase mb-1 px-1">Ausgewählt: Neu</div>
                                                    <button
                                                        type="button"
                                                        className="w-full text-left flex items-center gap-2 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md text-blue-700 dark:text-blue-300 font-medium text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault(); // Prevent blur
                                                            setEditGroupId("new");
                                                            setEditNewGroupName(editGroupSearch);
                                                            setIsEditGroupSearchFocused(false);
                                                        }}
                                                    >
                                                        <Plus className="w-4 h-4" /> "{editGroupSearch}" erstellen
                                                    </button>
                                                </div>
                                            )}
                                            {isEditGroupSearchFocused && (
                                                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-zinc-950 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 max-h-[150px] overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-200">
                                                    {groups
                                                        .filter(g => !editGroupSearch || (g.name.toLowerCase().includes(editGroupSearch.toLowerCase()) && g.name.toLowerCase() !== editGroupSearch.toLowerCase()))
                                                        .map(g => (
                                                            <button
                                                                type="button"
                                                                key={g.id}
                                                                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all flex items-center justify-between group/item"
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault(); // Prevent blur
                                                                    setEditGroupSearch(g.name);
                                                                    setEditGroupId(g.id);
                                                                    setEditNewGroupName("");
                                                                    setIsEditGroupSearchFocused(false); // Close dropdown
                                                                }}
                                                            >
                                                                <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover/item:text-blue-700 dark:group-hover/item:text-blue-400">{g.name}</span>
                                                                {editGroupSearch === g.name && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                                            </button>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs">Buchungstyp</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {["Single", "Pärchen", "Familie", "Monteur"].map((opt) => (
                                                <Button
                                                    key={opt}
                                                    type="button" // Prevent form submit
                                                    variant={editingBooking.occasion === opt ? "default" : "outline"}
                                                    className={cn(
                                                        "h-8 text-xs font-medium",
                                                        editingBooking.occasion === opt ? "bg-blue-600 hover:bg-blue-700" : "text-zinc-600"
                                                    )}
                                                    onClick={() => setEditingBooking(prev => prev ? ({ ...prev, occasion: opt }) : null)}
                                                >
                                                    {opt}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-bold text-zinc-500 uppercase">Gäste / Zimmer</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                className="h-9"
                                                value={editingBooking.guests_per_room || 1}
                                                onChange={(e) => setEditingBooking(prev => prev ? ({ ...prev, guests_per_room: parseInt(e.target.value) || 1 }) : null)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-bold text-zinc-500 uppercase">Aufenthaltstyp</Label>
                                            <Select
                                                value={editingBooking.stay_type || "privat"}
                                                onValueChange={(val) => setEditingBooking(prev => prev ? ({ ...prev, stay_type: val }) : null)}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="privat">Privat</SelectItem>
                                                    <SelectItem value="beruflich">Beruflich</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-bold text-zinc-500 uppercase">Hunde</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                className="h-8 text-xs"
                                                value={editingBooking.dog_count || 0}
                                                onChange={(e) => setEditingBooking(prev => prev ? ({ ...prev, dog_count: parseInt(e.target.value) || 0 }) : null)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-bold text-zinc-500 uppercase">Kinder</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                className="h-8 text-xs"
                                                value={editingBooking.child_count || 0}
                                                onChange={(e) => setEditingBooking(prev => prev ? ({ ...prev, child_count: parseInt(e.target.value) || 0 }) : null)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-bold text-zinc-500 uppercase">Aufbett.</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                className="h-8 text-xs"
                                                value={editingBooking.extra_bed_count || 0}
                                                onChange={(e) => setEditingBooking(prev => prev ? ({ ...prev, extra_bed_count: parseInt(e.target.value) || 0 }) : null)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-bold text-zinc-500 uppercase">Ankunft</Label>
                                            <Input
                                                type="time"
                                                className="h-8 text-xs"
                                                value={editingBooking.estimated_arrival_time || ""}
                                                onChange={(e) => setEditingBooking(prev => prev ? ({ ...prev, estimated_arrival_time: e.target.value }) : null)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="edit-allergy"
                                                checked={editingBooking.is_allergy_friendly === 1}
                                                onCheckedChange={(val) => setEditingBooking(prev => prev ? ({ ...prev, is_allergy_friendly: val ? 1 : 0 }) : null)}
                                            />
                                            <Label htmlFor="edit-allergy" className="text-xs font-medium">Allergikerfreundlich benötigt</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="edit-mobility"
                                                checked={editingBooking.has_mobility_impairment === 1}
                                                onCheckedChange={(val) => setEditingBooking(prev => prev ? ({ ...prev, has_mobility_impairment: val ? 1 : 0 }) : null)}
                                            />
                                            <Label htmlFor="edit-mobility" className="text-xs font-medium">Barrierefreiheit benötigt</Label>
                                        </div>
                                    </div>

                                </div>

                                {/* SPALTE 3: ZIMMER (5 Spalten) */}
                                <div className="col-span-5 flex flex-col gap-4 overflow-y-auto">
                                    <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">3. Zimmer wählen</Label>

                                    <div className="space-y-3">
                                        <div className="text-sm font-medium mb-1">Zimmertyp filtern</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {roomTypes.map(type => {
                                                const availableCount = editRoomTypeAvailability[type] || 0;
                                                const isDisabled = availableCount === 0;
                                                return (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        // Disable only if 0 available AND not currently selected (so you can see it's full but maybe we want to allow overbooking in admin? No, let's keep it safe. But wait, if *current* room is this type, `availableCount` includes it because we excluded the booking ID in the availability check. So `availableCount` should be > 0 if we are keeping the same room.)
                                                        disabled={isDisabled}
                                                        onClick={() => setEditRoomType(prev => prev === type ? "" : type)}
                                                        className={cn(
                                                            "flex flex-col items-start p-2 rounded-lg border transition-all text-left",
                                                            editRoomType === type
                                                                ? "bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-600/20"
                                                                : isDisabled
                                                                    ? "opacity-50 cursor-not-allowed bg-zinc-50 border-zinc-200"
                                                                    : "border-zinc-200 hover:border-blue-400 hover:bg-blue-50"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {getRoomIcon(type, cn("w-4 h-4", editRoomType === type ? "text-white" : "text-zinc-400"))}
                                                            <span className={cn("font-bold text-xs truncate", editRoomType === type ? "text-white" : "text-zinc-900")}>{type}</span>
                                                        </div>
                                                        <span className={cn("text-[9px] font-bold uppercase",
                                                            editRoomType === type ? "text-blue-100" : (isDisabled ? "text-red-500" : "text-emerald-600")
                                                        )}>
                                                            {isDisabled ? "Voll" : `${availableCount} verfügbar`}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-[200px] bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-4 overflow-y-auto">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="text-xs font-bold text-zinc-500 uppercase">
                                                    Verfügbare Zimmer {editRoomType ? `(${editRoomType})` : ""}
                                                </div>
                                                {editRoomType && (
                                                    <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setEditRoomType("")}>
                                                        Filter löschen
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 gap-2">
                                                {(editRoomType ? editAllRoomsForType : rooms).map(room => {
                                                    const isOccupied = checkRoomOverlap(room.id, editingBooking.start_date, editingBooking.end_date, editingBooking.id);

                                                    // In Admin mode (Booking Edit), we might want to see occupied rooms but disabled?
                                                    // Or just hide them like Assistant.
                                                    // The Assistant logic:
                                                    if (!editRoomType && typeof isOccupied === 'boolean' && isOccupied) return null;

                                                    return (
                                                        <button
                                                            key={room.id}
                                                            type="button"
                                                            disabled={isOccupied}
                                                            onClick={() => setEditingBooking(prev => prev ? ({ ...prev, room_id: room.id, room_name: room.name }) : null)}
                                                            className={cn(
                                                                "p-3 rounded-xl border transition-all text-left flex items-center justify-between group",
                                                                editingBooking.room_id === room.id
                                                                    ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600 shadow-md"
                                                                    : isOccupied
                                                                        ? "hidden"
                                                                        : "border-zinc-100 bg-white hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                                                    editingBooking.room_id === room.id ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                                                                )}>
                                                                    {getRoomIcon(room.type, "w-4 h-4")}
                                                                </div>
                                                                <div>
                                                                    <div className={cn("font-bold text-sm", editingBooking.room_id === room.id ? "text-emerald-900" : "text-zinc-900")}>{room.name}</div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="text-[10px] text-zinc-500 font-medium uppercase">{room.type}</div>
                                                                        {(!!room.is_allergy_friendly) && (
                                                                            <div title="Allergikerfreundlich" className={cn("p-0.5 rounded", editingBooking.room_id === room.id ? "bg-emerald-200" : "bg-pink-100")}>
                                                                                <Flower2 className={cn("w-3 h-3", editingBooking.room_id === room.id ? "text-emerald-700" : "text-pink-500")} />
                                                                            </div>
                                                                        )}
                                                                        {(!!room.is_accessible) && (
                                                                            <div title="Barrierefrei" className={cn("p-0.5 rounded", editingBooking.room_id === room.id ? "bg-emerald-200" : "bg-blue-100")}>
                                                                                <Accessibility className={cn("w-3 h-3", editingBooking.room_id === room.id ? "text-emerald-700" : "text-blue-600")} />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                {/* Price removed */}
                                                                {editingBooking.room_id === room.id && (
                                                                    <div className="text-[10px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                                                                        <Check className="w-3 h-3" /> Gewählt
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                                {(editRoomType ? editAllRoomsForType : rooms).filter(r => !checkRoomOverlap(r.id, editingBooking.start_date, editingBooking.end_date, editingBooking.id)).length === 0 && (
                                                    <div className="text-center py-8 text-zinc-400 text-sm italic">
                                                        Keine freien Zimmer gefunden.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 min-h-0 flex flex-col pt-4">
                                {/* Breakfast Content (Preserved) */}
                                <div className="space-y-4 max-h-full overflow-y-auto pr-2 pb-20">
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
                                                                        <Input
                                                                            type="time"
                                                                            className={cn(
                                                                                "h-9 text-xs shadow-sm rounded-lg",
                                                                                pendingBreakfastChanges[opt.id!]?.time && "border-amber-400 ring-1 ring-amber-400/20"
                                                                            )}
                                                                            defaultValue={pendingBreakfastChanges[opt.id!]?.time ?? opt.time ?? "08:00"}
                                                                            onChange={(e) => trackBreakfastChange(opt.id!, 'time', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[10px] uppercase font-bold text-zinc-400">Hinweise</Label>
                                                                        <Input
                                                                            className={cn(
                                                                                "h-9 text-xs shadow-sm rounded-lg",
                                                                                pendingBreakfastChanges[opt.id!]?.comments !== undefined && "border-amber-400 ring-1 ring-amber-400/20"
                                                                            )}
                                                                            defaultValue={pendingBreakfastChanges[opt.id!]?.comments ?? opt.comments ?? ""}
                                                                            placeholder="Allergien..."
                                                                            onChange={(e) => trackBreakfastChange(opt.id!, 'comments', e.target.value)}
                                                                        />
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
                                <div className="absolute bottom-6 left-6 right-6 pt-4 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
                                    <Button
                                        onClick={handleSaveBreakfastChanges}
                                        disabled={Object.keys(pendingBreakfastChanges).length === 0}
                                        className="w-full bg-blue-600 font-bold shadow-lg shadow-blue-600/20"
                                    >
                                        <Check className="w-4 h-4 mr-2" /> Änderungen speichern
                                    </Button>
                                    {Object.keys(pendingBreakfastChanges).length > 0 && (
                                        <div className="text-center mt-2 text-xs text-amber-600 font-medium animate-pulse">
                                            Ungespeicherte Änderungen
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    )}

                    {editTab === 'details' && (
                        <DialogFooter className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between shrink-0">
                            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Abbrechen</Button>
                            <Button onClick={updateBooking} className="bg-blue-600 font-bold shadow-lg shadow-blue-600/20">
                                <Check className="w-4 h-4 mr-2" />
                                Änderungen speichern
                            </Button>
                        </DialogFooter>
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

                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                                        <span className="font-bold text-zinc-900 dark:text-zinc-100">Übernachtungen</span>
                                                        <Badge variant="outline" className="bg-white dark:bg-zinc-900 font-bold text-base px-3 py-1">
                                                            {summary.nights}x
                                                        </Badge>
                                                    </div>

                                                    {summary.breakfastCount > 0 && (
                                                        <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                                            <span className="font-bold text-zinc-900 dark:text-zinc-100">Frühstück (Anzahl)</span>
                                                            <Badge variant="outline" className="bg-white dark:bg-zinc-900 font-bold text-base px-3 py-1 text-blue-600 border-blue-200">
                                                                {summary.breakfastCount}x
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-4 text-center text-xs text-zinc-400">
                                                    <p>Preise werden nicht mehr berechnet.</p>
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

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, isOpen: open }))}
                onConfirm={deleteConfirm.onConfirm}
                title={deleteConfirm.title}
                description={deleteConfirm.description}
                confirmText={deleteConfirm.confirmText}
                variant={deleteConfirm.variant as any}
            />
        </div >
    );
}

// Helper component for the guest mask form to handle its own state
function GuestMaskForm({ guest, onSubmit }: { guest: Guest, onSubmit: (e: React.FormEvent<HTMLFormElement>) => void }) {
    const [nat, setNat] = useState(guest.nationality ?? "");

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
                        <Input id="middle_name" name="middle_name" defaultValue={guest.middle_name} />
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
