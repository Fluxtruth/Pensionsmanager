"use client";

import React, { useState, useEffect } from "react";
import { BedDouble, Bed, Home, Users, Settings2, ShieldCheck, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Flower2, Accessibility } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { initDb } from "@/lib/db";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ROOM_TYPES } from "@/lib/constants";

interface Room {
    id: string;
    name: string;
    type: string;
    base_price: number;
    is_allergy_friendly?: number;
    is_accessible?: number;
    status?: string;
    current_booking_id?: string;
    current_guest_name?: string;
    current_group_name?: string;
    current_booking_end_date?: string;
}

export default function RoomsPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isDbReady, setIsDbReady] = useState(false);

    // States for editing
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    // States for Calendar
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [roomBookings, setRoomBookings] = useState<any[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    const getRoomIcon = (type: string) => {
        const iconClass = "w-4 h-4 text-zinc-400 group-hover:text-blue-500 transition-colors";
        switch (type) {
            case "Einzelzimmer": return <Bed className={iconClass} />;
            case "Doppelzimmer": return <BedDouble className={iconClass} />;
            case "2 Einzelbetten": return <Users className={iconClass} />;
            case "3 Einzelbetten": return <Users className={iconClass} />;
            case "Ferienwohnung": return <Home className={iconClass} />;
            default: return <BedDouble className={iconClass} />;
        }
    };

    const loadRooms = async () => {
        try {
            const db = await initDb();
            if (db) {
                const today = new Date().toISOString().split('T')[0];
                const results = await db.select<Room[]>(`
                    SELECT r.*, 
                           (SELECT b.id
                            FROM bookings b 
                            WHERE b.room_id = r.id 
                            AND b.start_date <= ? 
                            AND b.end_date >= ?
                            AND b.status NOT IN ('Draft', 'Checked-Out', 'Storniert')
                            LIMIT 1) as current_booking_id,
                           (SELECT b.status 
                            FROM bookings b 
                            WHERE b.room_id = r.id 
                            AND b.start_date <= ? 
                            AND b.end_date >= ?
                            AND b.status NOT IN ('Draft', 'Checked-Out', 'Storniert')
                            LIMIT 1) as current_booking_status,
                           (SELECT g.name 
                            FROM bookings b 
                            JOIN guests g ON b.guest_id = g.id
                            WHERE b.room_id = r.id 
                            AND b.start_date <= ? 
                            AND b.end_date >= ?
                            AND b.status NOT IN ('Draft', 'Checked-Out', 'Storniert')
                            LIMIT 1) as current_guest_name,
                           (SELECT bg.name 
                            FROM bookings b 
                            JOIN booking_groups bg ON b.group_id = bg.id
                            WHERE b.room_id = r.id 
                            AND b.start_date <= ? 
                            AND b.end_date >= ?
                            AND b.status NOT IN ('Draft', 'Checked-Out', 'Storniert')
                            LIMIT 1) as current_group_name,
                           (SELECT b.end_date 
                            FROM bookings b 
                            WHERE b.room_id = r.id 
                            AND b.start_date <= ? 
                            AND b.end_date >= ?
                            AND b.status NOT IN ('Draft', 'Checked-Out', 'Storniert')
                            LIMIT 1) as current_booking_end_date
                    FROM rooms r
                    ORDER BY CAST(r.id AS INTEGER) ASC
                `, [today, today, today, today, today, today, today, today, today, today]);

                if (results) {
                    const mappedRooms = results.map(room => {
                        let displayStatus = "Verfügbar";
                        const bStatus = (room as any).current_booking_status;

                        if (bStatus) {
                            if (bStatus === "Checked-In") displayStatus = "Belegt";
                            else if (bStatus === "Checked-Out") displayStatus = "Verfügbar";
                            else displayStatus = "Reserviert";
                        }

                        return {
                            ...room,
                            status: displayStatus,
                            current_booking_id: (room as any).current_booking_id,
                            current_guest_name: (room as any).current_guest_name,
                            current_group_name: (room as any).current_group_name,
                            current_booking_end_date: (room as any).current_booking_end_date
                        };
                    });
                    setRooms(mappedRooms);
                }
            }
        } catch (error) {
            console.error("Failed to load rooms:", error);
        }
    };

    useEffect(() => {
        const setup = async () => {
            await loadRooms();
            setIsDbReady(true);
        };
        setup();
    }, []);

    const loadRoomBookings = async (roomId: string) => {
        try {
            const db = await initDb();
            if (db) {
                const results = await db.select<any[]>(`
                    SELECT b.*, g.name as guest_name
                    FROM bookings b
                    JOIN guests g ON b.guest_id = g.id
                    WHERE b.room_id = ? 
                    AND b.status != 'Storniert'
                    ORDER BY b.start_date ASC
                `, [roomId]);
                setRoomBookings(results || []);
            }
        } catch (error) {
            console.error("Failed to load room bookings:", error);
        }
    };

    useEffect(() => {
        if (selectedRoomId) {
            loadRoomBookings(selectedRoomId);
        }
    }, [selectedRoomId]);

    const addRoom = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const id = formData.get("id") as string;
        const name = formData.get("name") as string;
        const type = formData.get("type") as string;
        const price = parseFloat(formData.get("price") as string) || 0;
        const isAllergyFriendly = formData.get("is_allergy_friendly") === "on" ? 1 : 0;
        const isAccessible = formData.get("is_accessible") === "on" ? 1 : 0;

        try {
            const db = await initDb();
            if (db) {
                await db.execute("INSERT INTO rooms (id, name, type, base_price, is_allergy_friendly, is_accessible) VALUES (?, ?, ?, ?, ?, ?)", [
                    id,
                    name,
                    type,
                    price,
                    isAllergyFriendly,
                    isAccessible
                ]);
                await loadRooms();
                setIsOpen(false);
                form.reset();
            }
        } catch (error) {
            console.error("Failed to add room:", error);
            alert("Fehler beim Hinzufügen des Zimmers.");
        }
    };

    const updateRoom = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingRoom) return;

        const form = e.currentTarget;
        const formData = new FormData(form);
        const newId = formData.get("id") as string;
        const name = formData.get("name") as string;
        const type = formData.get("type") as string;
        const price = parseFloat(formData.get("price") as string) || 0;
        const isAllergyFriendly = formData.get("is_allergy_friendly") === "on" ? 1 : 0;
        const isAccessible = formData.get("is_accessible") === "on" ? 1 : 0;

        try {
            const db = await initDb();
            if (db) {
                const idChanged = newId !== editingRoom.id;

                if (idChanged) {
                    // 1. Create the new room record first
                    await db.execute(
                        "INSERT INTO rooms (id, name, type, base_price, is_allergy_friendly, is_accessible) VALUES (?, ?, ?, ?, ?, ?)",
                        [newId, name, type, price, isAllergyFriendly, isAccessible]
                    );

                    // 2. Update all related tables that reference this room_id
                    await db.execute("UPDATE bookings SET room_id = ? WHERE room_id = ?", [newId, editingRoom.id]);
                    await db.execute("UPDATE room_configs SET room_id = ? WHERE room_id = ?", [newId, editingRoom.id]);
                    await db.execute("UPDATE cleaning_tasks SET room_id = ? WHERE room_id = ?", [newId, editingRoom.id]);

                    // 3. Delete the old room record
                    await db.execute("DELETE FROM rooms WHERE id = ?", [editingRoom.id]);
                } else {
                    // Standard update if ID didn't change
                    await db.execute(
                        "UPDATE rooms SET name = ?, type = ?, base_price = ?, is_allergy_friendly = ?, is_accessible = ? WHERE id = ?",
                        [name, type, price, isAllergyFriendly, isAccessible, editingRoom.id]
                    );
                }

                await loadRooms();
                setIsConfigOpen(false);
                setEditingRoom(null);
            }
        } catch (error) {
            console.error("Failed to update room:", error);
            alert("Fehler beim Aktualisieren des Zimmers. Evtl. existiert die Zimmernummer bereits.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Zimmerverwaltung</h2>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Übersicht der Zimmer, Konfigurationen und Preise.
                    </p>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900">
                            <Plus className="w-4 h-4 mr-2" />
                            Zimmer hinzufügen
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Neues Zimmer anlegen</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={addRoom} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="id">Zimmer-Nummer</Label>
                                <Input id="id" name="id" type="number" step="1" placeholder="z.B. 101" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Name / Bezeichnung</Label>
                                <Input id="name" name="name" placeholder="z.B. Seeblick" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Zimmer-Typ</Label>
                                <select
                                    id="type"
                                    name="type"
                                    required
                                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300"
                                >
                                    {ROOM_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Standard-Preis / Nacht (€)</Label>
                                <Input id="price" name="price" type="number" step="0.01" placeholder="85.00" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="flex items-center space-x-2">
                                    <Switch id="new-allergy" name="is_allergy_friendly" />
                                    <Label htmlFor="new-allergy" className="text-sm font-medium flex items-center gap-2">
                                        <Flower2 className="w-4 h-4 text-pink-500" /> Allergiker
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch id="new-accessible" name="is_accessible" />
                                    <Label htmlFor="new-accessible" className="text-sm font-medium flex items-center gap-2">
                                        <Accessibility className="w-4 h-4 text-blue-500" /> Barrierefrei
                                    </Label>
                                </div>
                            </div>
                            <Button type="submit" className="w-full">Speichern</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900/50">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-800/50">
                            <TableRow>
                                <TableHead className="w-20 pl-6 font-bold">Nummer</TableHead>
                                <TableHead className="font-bold">Bezeichnung</TableHead>
                                <TableHead className="font-bold">Typ</TableHead>
                                <TableHead className="font-bold">Preis / Nacht</TableHead>
                                <TableHead className="font-bold text-center">Status</TableHead>
                                <TableHead className="font-bold">Gruppe</TableHead>
                                <TableHead className="font-bold">Frei ab</TableHead>
                                <TableHead className="text-right pr-6 font-bold">Aktuelle Belegung</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rooms.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-zinc-500">
                                        {isDbReady ? "Keine Zimmer gefunden. Lege dein erstes Zimmer an!" : "Datenbank wird initialisiert..."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rooms.map((room) => (
                                    <TableRow
                                        key={room.id}
                                        className={`group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer ${selectedRoomId === room.id ? "bg-blue-50/50 dark:bg-blue-900/10 border-l-2 border-l-blue-600" : ""}`}
                                        onClick={() => setSelectedRoomId(room.id)}
                                    >
                                        <TableCell className="pl-6 font-bold text-zinc-900 dark:text-zinc-100">
                                            {room.id}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center justify-between">
                                                <span>{room.name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingRoom(room);
                                                        setIsConfigOpen(true);
                                                    }}
                                                >
                                                    <Settings2 className="w-3 h-3 text-zinc-400" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-md group-hover:bg-white dark:group-hover:bg-zinc-700 transition-colors">
                                                    {getRoomIcon(room.type)}
                                                </div>
                                                <span className="text-sm text-zinc-600 dark:text-zinc-400">{room.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
                                            {room.base_price || 0} €
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${(room.status || "Verfügbar") === "Verfügbar"
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                : room.status === "Belegt"
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                }`}>
                                                {room.status || "Verfügbar"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm">
                                            {room.current_group_name || "-"}
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">
                                            {room.current_booking_end_date ? (
                                                <span className="text-blue-600 dark:text-blue-400">
                                                    {new Date(room.current_booking_end_date).toLocaleDateString('de-DE')}
                                                </span>
                                            ) : (
                                                <span className="text-emerald-600 dark:text-emerald-500 font-bold">Sofort</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right pr-6 font-bold text-zinc-900 dark:text-zinc-100 italic">
                                            {room.current_booking_id ? (
                                                <Link
                                                    href={`/buchungen?edit=${room.current_booking_id}`}
                                                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                >
                                                    {room.current_guest_name}
                                                </Link>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {selectedRoomId && (
                <Card className="border-none shadow-lg bg-white dark:bg-zinc-900 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="flex flex-row items-center justify-between border-b dark:border-zinc-800 py-2 px-4 bg-zinc-50/10 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-3">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                                    <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                </div>
                                Zimmer {selectedRoomId}
                            </h3>
                            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                                {currentDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} — {new Date(currentDate.getTime() + 13 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-white dark:bg-zinc-950 rounded-md border dark:border-zinc-800 p-0.5 shadow-sm">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    onClick={() => {
                                        const newDate = new Date(currentDate);
                                        newDate.setDate(newDate.getDate() - 7);
                                        setCurrentDate(newDate);
                                    }}
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </Button>

                                <input
                                    type="date"
                                    className="text-[10px] font-bold border-none bg-transparent h-6 focus:ring-0 outline-none w-[110px] text-center dark:color-white dark:invert-[0.9] dark:hue-rotate-180"
                                    value={currentDate.toISOString().split('T')[0]}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val) setCurrentDate(new Date(val));
                                    }}
                                />

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    onClick={() => {
                                        const newDate = new Date(currentDate);
                                        newDate.setDate(newDate.getDate() + 7);
                                        setCurrentDate(newDate);
                                    }}
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-7 text-[10px] font-bold px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                                    onClick={() => setCurrentDate(new Date())}
                                >
                                    Heute
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-zinc-400 hover:text-red-500 transition-colors"
                                    onClick={() => setSelectedRoomId(null)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-4">
                        <div className="grid grid-cols-7 gap-1">
                            {(() => {
                                const days = [];
                                const startPoint = new Date(currentDate);

                                for (let i = 0; i < 14; i++) {
                                    const date = new Date(startPoint.getFullYear(), startPoint.getMonth(), startPoint.getDate() + i);
                                    const dateStr = date.toISOString().split('T')[0];
                                    const isToday = new Date().toISOString().split('T')[0] === dateStr;
                                    const dayName = date.toLocaleString('de-DE', { weekday: 'short' }).toUpperCase();
                                    const dayNum = date.getDate();
                                    const monthNum = date.getMonth() + 1;

                                    const activeBooking = roomBookings.find(b =>
                                        dateStr >= b.start_date && dateStr < b.end_date
                                    );

                                    // Color logic
                                    let cellClass = "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900";
                                    let dotClass = "bg-emerald-600";

                                    if (activeBooking) {
                                        if (activeBooking.status === 'Checked-In') {
                                            cellClass = "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-800";
                                            dotClass = "bg-red-600";
                                        } else if (activeBooking.status === 'Hard-Booked') {
                                            cellClass = "bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-800";
                                            dotClass = "bg-orange-600";
                                        } else if (activeBooking.status === 'Draft') {
                                            cellClass = "bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-800";
                                            dotClass = "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]";
                                        }
                                    }

                                    days.push(
                                        <div
                                            key={i}
                                            className={`h-12 flex flex-col items-center justify-center border rounded-lg transition-all ${cellClass} ${isToday ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-zinc-900" : ""}`}
                                            style={activeBooking?.status === 'Draft' ? {
                                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255, 255, 255, 0.5) 5px, rgba(255, 255, 255, 0.5) 10px)'
                                            } : undefined}
                                        >
                                            <div className="flex flex-col items-center leading-tight">
                                                <span className={`text-[7px] font-bold tracking-tighter ${isToday ? "text-blue-600" : "text-zinc-400"}`}>
                                                    {dayName}
                                                </span>
                                                <span className={`text-[10px] font-bold ${isToday ? "text-blue-600" : "text-zinc-700 dark:text-zinc-300"}`}>
                                                    {dayNum}.{monthNum}.
                                                </span>
                                            </div>
                                            <div className="mt-1">
                                                <div className={`w-2 h-2 rounded-full ${dotClass}`} title={activeBooking ? `${activeBooking.guest_name} (${activeBooking.status})` : "Frei"} />
                                            </div>
                                        </div>
                                    );
                                }

                                return days;
                            })()}
                        </div>
                        <div className="mt-4 flex justify-center gap-5 border-t dark:border-zinc-800 pt-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-sm bg-red-600" />
                                <span className="text-[10px] text-zinc-500">Belegt</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-sm bg-orange-600" />
                                <span className="text-[10px] text-zinc-500">Reserviert</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div
                                    className="w-2.5 h-2.5 rounded-sm bg-yellow-500"
                                    style={{
                                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255, 255, 255, 0.5) 2px, rgba(255, 255, 255, 0.5) 4px)'
                                    }}
                                />
                                <span className="text-[10px] text-zinc-500">Geplant (Entwurf)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                                <span className="text-[10px] text-zinc-500">Frei</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfiguration Zimmer {editingRoom?.id}</DialogTitle>
                        <DialogDescription>Basis-Parameter bearbeiten.</DialogDescription>
                    </DialogHeader>
                    {editingRoom && (
                        <form onSubmit={updateRoom} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-id">Zimmer-Nummer</Label>
                                <Input id="edit-id" name="id" type="number" step="1" defaultValue={editingRoom.id} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Name / Bezeichnung</Label>
                                <Input id="edit-name" name="name" defaultValue={editingRoom.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-type">Zimmer-Typ</Label>
                                <select
                                    name="type"
                                    value={editingRoom.type ?? ""}
                                    onChange={(e) => setEditingRoom({ ...editingRoom, type: e.target.value })}
                                    required
                                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300"
                                >
                                    {ROOM_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-price">Standard-Preis / Nacht (€)</Label>
                                <Input id="edit-price" name="price" type="number" step="0.01" defaultValue={editingRoom.base_price} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="edit-allergy"
                                        name="is_allergy_friendly"
                                        defaultChecked={!!editingRoom.is_allergy_friendly}
                                    />
                                    <Label htmlFor="edit-allergy" className="text-sm font-medium flex items-center gap-2">
                                        <Flower2 className="w-4 h-4 text-pink-500" /> Allergiker
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="edit-accessible"
                                        name="is_accessible"
                                        defaultChecked={!!editingRoom.is_accessible}
                                    />
                                    <Label htmlFor="edit-accessible" className="text-sm font-medium flex items-center gap-2">
                                        <Accessibility className="w-4 h-4 text-blue-500" /> Barrierefrei
                                    </Label>
                                </div>
                            </div>
                            <div className="pt-2">
                                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border mb-4">
                                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        Standard Ausstattung
                                    </h4>
                                    <p className="text-xs text-zinc-500">Automatisch: TV, WLAN, Handtücher</p>
                                </div>
                                <Button type="submit" className="w-full">Änderungen speichern</Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
