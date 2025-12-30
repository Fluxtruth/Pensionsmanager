"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Download, Trash2, Plus, Users, Settings, Clock, Timer, CalendarClock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    DialogDescription,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { initDb } from "@/lib/db";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { savePdfNative } from "@/lib/pdf-export";

interface Staff {
    id: string;
    name: string;
    role: string;
    daily_capacity: number;
}

interface Room {
    id: string;
    name: string;
}

interface CleaningTask {
    id: string;
    room_id: string;
    staff_id: string | null;
    date: string;
    status: string;
    comments?: string;
    is_manual?: number;
    source?: string; // 'Auto', 'Manuell', 'Verschoben'
    delayed_from?: string;
    room_name?: string;
    staff_name?: string;
}

interface Booking {
    id: string;
    room_id: string;
    end_date: string;
}

export default function CleaningPage() {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [tasks, setTasks] = useState<CleaningTask[]>([]);
    const [needsGeneration, setNeedsGeneration] = useState(false);

    // Dialog States
    const [isStaffOpen, setIsStaffOpen] = useState(false);
    const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [exportType, setExportType] = useState<"Gesamt" | "Einzel">("Gesamt");
    const [exportStaffSelection, setExportStaffSelection] = useState<Record<string, boolean>>({});
    const [downloadSuccess, setDownloadSuccess] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const db = await initDb();
            if (db) {
                const staffResults = await db.select<Staff[]>("SELECT * FROM staff");
                setStaff(staffResults || []);

                const roomResults = await db.select<Room[]>("SELECT id, name FROM rooms");
                setRooms(roomResults || []);

                const taskResults = await db.select<CleaningTask[]>(`
                    SELECT ct.*, r.name as room_name, s.name as staff_name
                    FROM cleaning_tasks ct
                    LEFT JOIN rooms r ON ct.room_id = r.id
                    LEFT JOIN staff s ON ct.staff_id = s.id
                    WHERE ct.date = ? OR ct.delayed_from = ?
                `, [selectedDate, selectedDate]);
                setTasks(taskResults || []);

                // Check if generation is needed
                const checkouts = await db.select<Booking[]>(
                    "SELECT id, room_id FROM bookings WHERE end_date = ? AND status != 'Draft'",
                    [selectedDate]
                );
                const existingTaskRoomIds = (taskResults || []).map(t => t.room_id);
                const hasMissingTasks = checkouts.some(b => !existingTaskRoomIds.includes(b.room_id));
                setNeedsGeneration(hasMissingTasks);
            }
        } catch (error) {
            console.error("Failed to load cleaning data:", error);
        }
    }, [selectedDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const toggleCleaning = async (roomId: string, isActive: boolean) => {
        try {
            const db = await initDb();
            if (db) {
                if (isActive) {
                    await db.execute(
                        "INSERT INTO cleaning_tasks (id, room_id, date, status, is_manual, source) VALUES (?, ?, ?, ?, ?, ?)",
                        [crypto.randomUUID(), roomId, selectedDate, "Offen", 1, 'Manuell']
                    );
                } else {
                    await db.execute(
                        "DELETE FROM cleaning_tasks WHERE room_id = ? AND date = ? AND (delayed_from IS NULL OR delayed_from != ?)",
                        [roomId, selectedDate, selectedDate]
                    );
                }
                await loadData();
            }
        } catch (error) {
            console.error("Failed to toggle cleaning:", error);
        }
    };

    const delayTask = async (taskId: string, days: number) => {
        try {
            const db = await initDb();
            if (db) {
                const targetDate = new Date(selectedDate);
                targetDate.setDate(targetDate.getDate() + days);
                const dateStr = targetDate.toISOString().split('T')[0];

                await db.execute(
                    "UPDATE cleaning_tasks SET date = ?, delayed_from = ?, source = ? WHERE id = ?",
                    [dateStr, days > 0 ? selectedDate : null, 'Verschoben', taskId]
                );
                await loadData();
            }
        } catch (error) {
            console.error("Failed to delay task:", error);
        }
    };

    const generateCleaningPlan = async () => {
        try {
            const db = await initDb();
            if (db) {
                const checkouts = await db.select<Booking[]>(
                    "SELECT id, room_id FROM bookings WHERE end_date = ? AND status != 'Draft'",
                    [selectedDate]
                );

                if (checkouts.length === 0) {
                    alert("Keine Check-Outs für diesen Tag gefunden.");
                    return;
                }

                const existingTaskRoomIds = tasks.map(t => t.room_id);
                const roomsToClean = checkouts
                    .map(b => b.room_id)
                    .filter(id => !existingTaskRoomIds.includes(id));

                if (roomsToClean.length === 0) {
                    alert("Alle fälligen Zimmer sind bereits im Reinigungsplan.");
                    return;
                }

                for (const roomId of roomsToClean) {
                    await db.execute(
                        "INSERT INTO cleaning_tasks (id, room_id, date, status, is_manual, source) VALUES (?, ?, ?, ?, ?, ?)",
                        [crypto.randomUUID(), roomId, selectedDate, "Offen", 0, 'Auto']
                    );
                }

                await loadData();
            }
        } catch (error) {
            console.error("Failed to generate plan:", error);
        }
    };

    const updateTaskStatus = async (taskId: string, newStatus: string) => {
        try {
            const db = await initDb();
            if (db) {
                await db.execute("UPDATE cleaning_tasks SET status = ? WHERE id = ?", [newStatus, taskId]);
                await loadData();
            }
        } catch (error) {
            console.error("Failed to update task status:", error);
        }
    };

    const assignStaff = async (taskId: string, staffId: string) => {
        try {
            const db = await initDb();
            if (db) {
                await db.execute("UPDATE cleaning_tasks SET staff_id = ? WHERE id = ?", [staffId === "none" ? null : staffId, taskId]);
                await loadData();
            }
        } catch (error) {
            console.error("Failed to assign staff:", error);
        }
    };

    const updateTaskComments = async (taskId: string, comments: string) => {
        try {
            const db = await initDb();
            if (db) {
                await db.execute("UPDATE cleaning_tasks SET comments = ? WHERE id = ?", [comments, taskId]);
            }
        } catch (error) {
            console.error("Failed to update comments:", error);
        }
    };

    const handleAddStaff = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const role = formData.get("role") as string;
        const capacity = parseInt(formData.get("capacity") as string) || 5;

        try {
            const db = await initDb();
            if (db) {
                if (editingStaff) {
                    await db.execute(
                        "UPDATE staff SET name = ?, role = ?, daily_capacity = ? WHERE id = ?",
                        [name, role, capacity, editingStaff.id]
                    );
                } else {
                    await db.execute(
                        "INSERT INTO staff (id, name, role, daily_capacity) VALUES (?, ?, ?, ?)",
                        [crypto.randomUUID(), name, role, capacity]
                    );
                }
                await loadData();
                setIsAddStaffOpen(false);
                setEditingStaff(null);
            }
        } catch (error) {
            console.error("Failed to save staff:", error);
        }
    };

    const deleteStaff = async (id: string) => {
        if (!confirm("Personal wirklich löschen?")) return;
        try {
            const db = await initDb();
            if (db) {
                await db.execute("DELETE FROM staff WHERE id = ?", [id]);
                await loadData();
            }
        } catch (error) {
            console.error("Failed to delete staff:", error);
        }
    };

    const performExport = async () => {
        try {

            const doc = new jsPDF();
            const activeTasksOnly = tasks.filter(t => t.date === selectedDate);

            // Filter tasks based on selection
            const filteredTasks = activeTasksOnly.filter(t =>
                !t.staff_id || exportStaffSelection[t.staff_id] !== false
            );

            if (exportType === "Gesamt") {
                doc.setFontSize(18);
                doc.text("Reinigungsplan - Gesamtübersicht", 14, 22);
                doc.setFontSize(12);
                doc.text(`Datum: ${new Date(selectedDate).toLocaleDateString()}`, 14, 30);

                autoTable(doc, {
                    startY: 40,
                    head: [["Zimmer", "Quelle", "Personal", "Status", "Notiz"]],
                    body: filteredTasks.map(t => [
                        `Zimmer ${t.room_id} (${t.room_name})`,
                        t.source || (t.is_manual ? 'Manuell' : 'Auto'),
                        t.staff_name || "Nicht zugewiesen",
                        t.status,
                        t.comments || ""
                    ]),
                });
            } else {
                // Individual plans per staff
                const staffMap = filteredTasks.reduce((acc, t) => {
                    const key = t.staff_id || "unassigned";
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(t);
                    return acc;
                }, {} as Record<string, CleaningTask[]>);

                Object.entries(staffMap).forEach(([staffId, staffTasks], index) => {
                    if (index > 0) doc.addPage();

                    const name = staffTasks[0].staff_name || "Nicht zugewiesen";
                    doc.setFontSize(18);
                    doc.text(`Reinigungsplan - ${name}`, 14, 22);
                    doc.setFontSize(12);
                    doc.text(`Datum: ${new Date(selectedDate).toLocaleDateString()}`, 14, 30);

                    autoTable(doc, {
                        startY: 40,
                        head: [["Zimmer", "Status", "Notiz"]],
                        body: staffTasks.map(t => [
                            `Zimmer ${t.room_id} (${t.room_name})`,
                            t.status,
                            t.comments || ""
                        ]),
                    });
                });
            }

            const filename = `Reinigungsplan_${exportType}_${selectedDate}.pdf`;
            const success = await savePdfNative(doc, filename);

            if (success) {
                setDownloadSuccess(true);
                setTimeout(() => {
                    setDownloadSuccess(false);
                    setIsExportDialogOpen(false);
                }, 2000);
            }
        } catch (error) {
            console.error("PDF Export failed:", error);
            alert("Der PDF Export ist fehlgeschlagen.");
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Reinigungsplan</h2>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Zimmerstatus und Reinigungsplanung am {new Date(selectedDate).toLocaleDateString()}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-auto h-10 shadow-sm"
                    />
                    <Button variant="outline" onClick={() => setIsStaffOpen(true)} className="h-10">
                        <Users className="w-4 h-4 mr-2" />
                        Personal
                    </Button>
                    <Button variant="outline" onClick={() => setIsExportDialogOpen(true)} className="h-10">
                        <Download className="w-4 h-4 mr-2" />
                        Plan herunterladen
                    </Button>
                    <Button
                        className={cn(
                            "h-10 shadow-lg transition-all",
                            needsGeneration
                                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 animate-pulse ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-zinc-950"
                                : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
                        )}
                        onClick={generateCleaningPlan}
                    >
                        <Clock className="w-4 h-4 mr-2" />
                        {needsGeneration ? "Plan aktualisieren" : "Plan generieren"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-3 border-none shadow-sm bg-white dark:bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Zimmerübersicht</CardTitle>
                        <CardDescription>Alle Zimmer und ihr Reinigungsstatus.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-800/50">
                                <TableRow>
                                    <TableHead className="font-bold pl-6 w-12 text-center">Plan</TableHead>
                                    <TableHead className="font-bold">Zimmer</TableHead>
                                    <TableHead className="font-bold">Quelle</TableHead>
                                    <TableHead className="font-bold">Personal</TableHead>
                                    <TableHead className="font-bold whitespace-nowrap">Status</TableHead>
                                    <TableHead className="font-bold">Anmerkungen</TableHead>
                                    <TableHead className="text-right pr-6 font-bold"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rooms.map((room) => {
                                    const activeTask = tasks.find(t => t.room_id === room.id && t.date === selectedDate);
                                    const delayedInfo = tasks.find(t => t.room_id === room.id && t.delayed_from === selectedDate);
                                    const isActive = !!activeTask;

                                    return (
                                        <TableRow
                                            key={room.id}
                                            className={cn(
                                                "group transition-all",
                                                !isActive && "opacity-40 grayscale-[0.5] hover:opacity-100 hover:grayscale-0"
                                            )}
                                        >
                                            <TableCell className="text-center pl-6">
                                                <Switch
                                                    checked={isActive}
                                                    onCheckedChange={(checked) => toggleCleaning(room.id, checked)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-bold text-zinc-900 dark:text-zinc-100">
                                                {room.name}
                                                <div className="text-[10px] text-zinc-500 font-medium uppercase">Zimmer {room.id}</div>
                                            </TableCell>
                                            <TableCell>
                                                {isActive ? (
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border whitespace-nowrap",
                                                        activeTask.source === 'Auto' ? "bg-purple-50 text-purple-600 border-purple-100" :
                                                            activeTask.source === 'Manuell' ? "bg-zinc-100 text-zinc-600 border-zinc-200" :
                                                                "bg-amber-50 text-amber-600 border-amber-100"
                                                    )}>
                                                        {activeTask.source || (activeTask.is_manual ? 'Manuell' : 'Auto')}
                                                    </span>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell>
                                                {isActive ? (
                                                    <Select
                                                        value={activeTask?.staff_id || "none"}
                                                        onValueChange={(val: string) => assignStaff(activeTask!.id, val)}
                                                    >
                                                        <SelectTrigger className="w-[140px] h-8 border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-xs">
                                                            <SelectValue placeholder="Zuweisen..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none" className="text-xs">Nicht zugewiesen</SelectItem>
                                                            {staff.map(s => (
                                                                <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-zinc-400 italic">Keine Reinigung fällig</span>
                                                        {delayedInfo && (
                                                            <div className="flex items-center gap-1.5 mt-0.5 animate-pulse">
                                                                <CalendarClock className="w-3 h-3 text-amber-600" />
                                                                <span className="text-[10px] text-amber-600 font-bold leading-none">
                                                                    Reinigung verzögert auf {new Date(delayedInfo.date).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isActive ? (
                                                    <Select
                                                        value={activeTask?.status ?? ""}
                                                        onValueChange={(val: string) => updateTaskStatus(activeTask!.id, val)}
                                                    >
                                                        <SelectTrigger className={cn(
                                                            "w-[110px] h-7 text-[10px] font-bold rounded-full border-none",
                                                            activeTask?.status === "Offen" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                                                activeTask?.status === "In Arbeit" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                                                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                        )}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Offen" className="text-xs">Offen</SelectItem>
                                                            <SelectItem value="In Arbeit" className="text-xs">In Arbeit</SelectItem>
                                                            <SelectItem value="Erledigt" className="text-xs">Erledigt</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell>
                                                {isActive ? (
                                                    <Input
                                                        defaultValue={activeTask?.comments || ""}
                                                        placeholder="Notiz..."
                                                        className="h-7 text-[11px] border-zinc-200 bg-transparent focus:bg-white transition-all w-full max-w-[150px]"
                                                        onBlur={(e) => updateTaskComments(activeTask!.id, e.target.value)}
                                                    />
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                {isActive && (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 text-zinc-400 hover:text-purple-600">
                                                                    <Timer className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuLabel className="text-xs font-bold flex items-center gap-2">
                                                                    <CalendarClock className="w-3 h-3" /> Reinig. verschieben
                                                                </DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                {[-3, -2, -1, 1, 2, 3].map(offset => {
                                                                    const date = new Date(selectedDate);
                                                                    date.setDate(date.getDate() + offset);
                                                                    const isPast = date.toISOString().split('T')[0] < today;
                                                                    if (isPast) return null;

                                                                    const dateStr = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
                                                                    const label = offset > 0
                                                                        ? `Um ${offset} ${offset === 1 ? 'Tag' : 'Tage'} verzögern`
                                                                        : `Um ${Math.abs(offset)} ${Math.abs(offset) === 1 ? 'Tag' : 'Tage'} vorziehen`;

                                                                    return (
                                                                        <DropdownMenuItem
                                                                            key={offset}
                                                                            className="text-xs flex justify-between"
                                                                            onClick={() => delayTask(activeTask!.id, offset)}
                                                                        >
                                                                            <span>{label}</span>
                                                                            <span className="text-[10px] text-zinc-450 ml-2">({dateStr})</span>
                                                                        </DropdownMenuItem>
                                                                    );
                                                                })}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 text-zinc-300 hover:text-red-500"
                                                            onClick={async () => {
                                                                if (confirm("Aufgabe wirklich entfernen?")) {
                                                                    const db = await initDb();
                                                                    if (db) {
                                                                        await db.execute("DELETE FROM cleaning_tasks WHERE id = ?", [activeTask!.id]);
                                                                        await loadData();
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Personal Sidebar */}
                <Card className="border-none shadow-sm bg-white dark:bg-zinc-900/50 h-fit sticky top-6">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Personal</CardTitle>
                        <CardDescription>Auslastung am {new Date(selectedDate).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {staff.length === 0 ? (
                            <div className="text-center py-6 text-sm text-zinc-500 italic">
                                Kein Personal angelegt.
                            </div>
                        ) : (
                            staff.map(s => {
                                const assignedCount = tasks.filter(t => t.staff_id === s.id).length;
                                const progress = Math.min((assignedCount / s.daily_capacity) * 100, 100);
                                return (
                                    <div key={s.id} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold text-zinc-700 dark:text-zinc-300">{s.name}</span>
                                            <span className="text-xs font-medium text-zinc-500">{assignedCount} / {s.daily_capacity} Zi.</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-500",
                                                    progress >= 100 ? "bg-red-500" : progress > 70 ? "bg-amber-500" : "bg-purple-500"
                                                )}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Staff Management Dialogs */}
            <Dialog open={isStaffOpen} onOpenChange={setIsStaffOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Personalverwaltung</DialogTitle>
                        <DialogDescription>Dein Reinigungsteam verwalten.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            onClick={() => {
                                setEditingStaff(null);
                                setIsAddStaffOpen(true);
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Personal hinzufügen
                        </Button>
                        <div className="border rounded-xl bg-zinc-50 dark:bg-zinc-900 shadow-inner overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="font-bold">Name</TableHead>
                                        <TableHead className="font-bold">Role</TableHead>
                                        <TableHead className="font-bold">Kapazität</TableHead>
                                        <TableHead className="text-right font-bold pr-6">Aktionen</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staff.map((s) => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-bold">{s.name}</TableCell>
                                            <TableCell className="text-xs text-zinc-500">{s.role}</TableCell>
                                            <TableCell className="text-sm font-medium">{s.daily_capacity} Zi./Tag</TableCell>
                                            <TableCell className="text-right pr-6 space-x-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingStaff(s);
                                                        setIsAddStaffOpen(true);
                                                    }}
                                                >
                                                    <Settings className="w-4 h-4 text-zinc-400" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500"
                                                    onClick={() => deleteStaff(s.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            {editingStaff ? "Personal bearbeiten" : "Neues Personal"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddStaff} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" defaultValue={editingStaff?.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Rolle</Label>
                            <Input id="role" name="role" defaultValue={editingStaff?.role} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="capacity">Kapazität (Zimmer/Tag)</Label>
                            <Input id="capacity" name="capacity" type="number" defaultValue={editingStaff?.daily_capacity || 5} />
                        </div>
                        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 font-bold">
                            Speichern
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Download className="w-6 h-6 text-purple-600" /> PDF Export Vorschau
                        </DialogTitle>
                        <DialogDescription>
                            Wähle das Format und die Inhalte für deinen PDF-Export.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-sm font-bold">Export-Format</Label>
                            <div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                                <button
                                    onClick={() => setExportType("Gesamt")}
                                    className={cn(
                                        "py-2 text-xs font-bold rounded-md transition-all",
                                        exportType === "Gesamt" ? "bg-white dark:bg-zinc-700 shadow-sm text-purple-600" : "text-zinc-500"
                                    )}
                                >
                                    Gesamtplan
                                </button>
                                <button
                                    onClick={() => setExportType("Einzel")}
                                    className={cn(
                                        "py-2 text-xs font-bold rounded-md transition-all",
                                        exportType === "Einzel" ? "bg-white dark:bg-zinc-700 shadow-sm text-purple-600" : "text-zinc-500"
                                    )}
                                >
                                    Einzelpläne
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold">Mitarbeiter auswählen</Label>
                                <button
                                    className="text-[10px] text-purple-600 font-bold hover:underline"
                                    onClick={() => setExportStaffSelection({})}
                                >
                                    Alle wählen
                                </button>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 border rounded-lg p-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                                {Array.from(new Set(tasks.filter(t => t.date === selectedDate).map(t => t.staff_id || "none"))).map(sid => {
                                    const s = staff.find(st => st.id === sid);
                                    const name = s?.name || "Nicht zugewiesen";
                                    const isChecked = exportStaffSelection[sid] !== false;

                                    return (
                                        <div key={sid} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`staff-${sid}`}
                                                checked={isChecked}
                                                onChange={(e) => setExportStaffSelection(prev => ({ ...prev, [sid]: e.target.checked }))}
                                                className="w-4 h-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                                            />
                                            <Label htmlFor={`staff-${sid}`} className="text-xs font-medium cursor-pointer">
                                                {name}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setIsExportDialogOpen(false)}>
                            Abbrechen
                        </Button>
                        <Button
                            className={cn(
                                "flex-1 transition-all duration-300",
                                downloadSuccess ? "bg-emerald-600 hover:bg-emerald-700" : "bg-purple-600 hover:bg-purple-700"
                            )}
                            onClick={performExport}
                        >
                            {downloadSuccess ? (
                                <><Check className="w-4 h-4 mr-2" /> Heruntergeladen</>
                            ) : (
                                <><Download className="w-4 h-4 mr-2" /> Plan herunterladen</>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
