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
    room_id: string | null;
    staff_id: string | null;
    date: string;
    status: string;
    comments?: string;
    is_manual?: number;
    source?: string; // 'Auto', 'Manuell', 'Verschoben', 'Vorschlag'
    delayed_from?: string;
    room_name?: string;
    staff_name?: string;
    title?: string;
    task_type?: 'cleaning' | 'checkin';
}

interface CheckInBooking {
    id: string;
    room_id: string;
    dog_count: number;
    extra_bed_count: number;
    has_dog: number;
    estimated_arrival_time: string | null;
    guest_name: string;
    guest_last_name?: string;
    room_name: string;
    stay_type?: string;
    occasion?: string;
    child_count?: number;
}

const getWeekNumber = (date: Date) => {
    const d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};


interface Booking {
    id: string;
    room_id: string;
    end_date: string;
}




interface TaskSuggestion {
    id: string;
    title: string;
    weekday: number; // 0-6 (Sunday-Saturday)
    frequency_weeks: number;
}

const WEEKDAYS = [
    "Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"
];

export default function CleaningPage() {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [tasks, setTasks] = useState<CleaningTask[]>([]);
    const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
    const [checkIns, setCheckIns] = useState<CheckInBooking[]>([]);
    const [checkouts, setCheckouts] = useState<CheckInBooking[]>([]);
    const [needsGeneration, setNeedsGeneration] = useState(false);


    // Dialog States
    const [isStaffOpen, setIsStaffOpen] = useState(false);
    const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [exportType, setExportType] = useState<"Gesamt" | "Einzel">("Gesamt");
    const [exportStaffSelection, setExportStaffSelection] = useState<Record<string, boolean>>({});
    const [downloadSuccess, setDownloadSuccess] = useState(false);

    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const [suggestionFilter, setSuggestionFilter] = useState<string>("all");
    const [newSuggestionWeekday, setNewSuggestionWeekday] = useState<string>("1");
    const [newSuggestionFrequency, setNewSuggestionFrequency] = useState<string>("1");
    const [viewedWeekday, setViewedWeekday] = useState<number>(new Date(selectedDate).getDay());
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);


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

                const suggestionResults = await db.select<TaskSuggestion[]>("SELECT * FROM cleaning_task_suggestions");
                setSuggestions(suggestionResults || []);

                // Load Check-Ins for today
                const checkInResults = await db.select<CheckInBooking[]>(`
                    SELECT b.id, b.room_id, b.dog_count, b.extra_bed_count, b.has_dog, b.estimated_arrival_time, 
                           g.name as guest_name, g.last_name as guest_last_name, r.name as room_name,
                           b.stay_type, b.occasion, b.child_count
                    FROM bookings b
                    LEFT JOIN guests g ON b.guest_id = g.id
                    LEFT JOIN rooms r ON b.room_id = r.id
                    WHERE b.start_date = ? AND b.status != 'Draft' AND b.status != 'Storniert'
                `, [selectedDate]);
                setCheckIns(checkInResults || []);

                // Load Check-Outs for today (Detailed)
                const checkoutResults = await db.select<CheckInBooking[]>(`
                    SELECT b.id, b.room_id, b.dog_count, b.extra_bed_count, b.has_dog, b.estimated_arrival_time, 
                           g.name as guest_name, g.last_name as guest_last_name, r.name as room_name,
                           b.stay_type, b.occasion, b.child_count
                    FROM bookings b
                    LEFT JOIN guests g ON b.guest_id = g.id
                    LEFT JOIN rooms r ON b.room_id = r.id
                    WHERE b.end_date = ? AND b.status != 'Draft'
                `, [selectedDate]);
                setCheckouts(checkoutResults || []);

                // Check if generation is needed (Checkouts or Check-Ins)
                const checkoutsForGen = await db.select<Booking[]>(
                    "SELECT id, room_id FROM bookings WHERE end_date = ? AND status != 'Draft'",
                    [selectedDate]
                );
                const existingTaskRoomIds = (taskResults || []).filter(t => t.room_id && (t.task_type === 'cleaning' || !t.task_type)).map(t => t.room_id);
                const hasMissingCleaningTasks = checkoutsForGen.some(b => !existingTaskRoomIds.includes(b.room_id));

                const checkInsToGenerate = checkInResults.filter(b => {
                    const existingTask = taskResults.find(t => t.room_id === b.room_id && t.date === selectedDate && t.task_type === 'checkin');
                    return !existingTask;
                });

                // Auto-generate missing check-in tasks immediately
                if (checkInsToGenerate.length > 0) {
                    for (const booking of checkInsToGenerate) {
                        await db.execute(
                            "INSERT INTO cleaning_tasks (id, room_id, date, status, is_manual, source, task_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
                            [crypto.randomUUID(), booking.room_id, selectedDate, "Offen", 0, 'Auto', 'checkin']
                        );
                    }
                    // Refetch tasks after generation
                    const updatedTaskResults = await db.select<CleaningTask[]>(`
                        SELECT ct.*, r.name as room_name, s.name as staff_name
                        FROM cleaning_tasks ct
                        LEFT JOIN rooms r ON ct.room_id = r.id
                        LEFT JOIN staff s ON ct.staff_id = s.id
                        WHERE ct.date = ? OR ct.delayed_from = ?
                    `, [selectedDate, selectedDate]);
                    setTasks(updatedTaskResults || []);
                }

                setNeedsGeneration(hasMissingCleaningTasks);
            }
        } catch (error) {
            console.error("Failed to load cleaning data:", error);
        }
    }, [selectedDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        setViewedWeekday(new Date(selectedDate).getDay());
    }, [selectedDate]);

    const toggleCleaning = async (roomId: string, isActive: boolean, type: 'cleaning' | 'checkin' = 'cleaning') => {
        try {
            const db = await initDb();
            if (db) {
                if (isActive) {
                    await db.execute(
                        "INSERT INTO cleaning_tasks (id, room_id, date, status, is_manual, source, task_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        [crypto.randomUUID(), roomId, selectedDate, "Offen", 1, 'Manuell', type]
                    );
                } else {
                    await db.execute(
                        "DELETE FROM cleaning_tasks WHERE room_id = ? AND date = ? AND task_type = ? AND (delayed_from IS NULL OR delayed_from != ?)",
                        [roomId, selectedDate, type, selectedDate]
                    );
                }
                await loadData();
            }
        } catch (error) {
            console.error("Failed to toggle cleaning:", error);
        }
    };

    const addManualTask = async (title: string) => {
        try {
            const db = await initDb();
            if (db) {
                await db.execute(
                    "INSERT INTO cleaning_tasks (id, room_id, date, status, is_manual, source, title) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [crypto.randomUUID(), null, selectedDate, "Offen", 1, 'Manuell', title]
                );
                await loadData();
            }
        } catch (error) {
            console.error("Failed to add manual task:", error);
        }
    };

    const addTaskFromSuggestion = async (suggestion: TaskSuggestion) => {
        try {
            const db = await initDb();
            if (db) {
                await db.execute(
                    "INSERT INTO cleaning_tasks (id, room_id, date, status, is_manual, source, title) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [crypto.randomUUID(), null, selectedDate, "Offen", 1, 'Vorschlag', suggestion.title]
                );
                await loadData();
            }
        } catch (error) {
            console.error("Failed to add logic task:", error);
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
                        "INSERT INTO cleaning_tasks (id, room_id, date, status, is_manual, source, task_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        [crypto.randomUUID(), roomId, selectedDate, "Offen", 0, 'Auto', 'cleaning']
                    );
                }

                // Check-Ins Generation
                const checkInsToGenerate = checkIns.filter(b => {
                    const hasDog = b.dog_count > 0 || b.has_dog === 1;
                    const hasExtraBed = b.extra_bed_count > 0;
                    const existingTask = tasks.find(t => t.room_id === b.room_id && t.date === selectedDate && t.task_type === 'checkin');
                    return (hasDog || hasExtraBed) && !existingTask;
                });

                for (const booking of checkInsToGenerate) {
                    await db.execute(
                        "INSERT INTO cleaning_tasks (id, room_id, date, status, is_manual, source, task_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        [crypto.randomUUID(), booking.room_id, selectedDate, "Offen", 0, 'Auto', 'checkin']
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

    const addSuggestion = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const weekday = parseInt(newSuggestionWeekday);
        const frequency = parseInt(newSuggestionFrequency) || 1;

        try {
            const db = await initDb();
            if (db) {
                await db.execute(
                    "INSERT INTO cleaning_task_suggestions (id, title, weekday, frequency_weeks) VALUES (?, ?, ?, ?)",
                    [crypto.randomUUID(), title, weekday, frequency]
                );
                await loadData();
                (e.target as HTMLFormElement).reset();
                setNewSuggestionWeekday("1");
                setNewSuggestionFrequency("1");
            }
        } catch (error) {
            console.error("Failed to add suggestion:", error);
        }
    };

    const deleteSuggestion = async (id: string) => {
        try {
            const db = await initDb();
            if (db) {
                await db.execute("DELETE FROM cleaning_task_suggestions WHERE id = ?", [id]);
                await loadData();
            }
        } catch (error) {
            console.error("Failed to delete suggestion:", error);
        }
    };

    const updateSuggestion = async (id: string, updates: Partial<TaskSuggestion>) => {
        try {
            const db = await initDb();
            if (db) {
                const keys = Object.keys(updates);
                const values = Object.values(updates);
                const setClause = keys.map(k => `${k} = ?`).join(", ");
                await db.execute(`UPDATE cleaning_task_suggestions SET ${setClause} WHERE id = ?`, [...values, id]);
                await loadData();
            }
        } catch (error) {
            console.error("Failed to update suggestion:", error);
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

            const cleaningTasks = filteredTasks.filter(t => (t.task_type === 'cleaning' || !t.task_type) && t.room_id);
            const additionalTasks = filteredTasks.filter(t => (t.task_type === 'cleaning' || !t.task_type) && !t.room_id);
            const checkInTasks = filteredTasks.filter(t => t.task_type === 'checkin');

            if (exportType === "Gesamt") {
                doc.setFontSize(18);
                doc.text("Reinigungsplan - Gesamtübersicht", 14, 22);
                doc.setFontSize(12);
                doc.text(`Datum: ${new Date(selectedDate).toLocaleDateString()}`, 14, 30);

                let currentY = 40;

                // Section 1: Reinigung (Zimmer)
                if (cleaningTasks.length > 0) {
                    doc.setFontSize(14);
                    doc.text("Reinigungsaufgaben / Check-Outs", 14, currentY);
                    currentY += 5;

                    autoTable(doc, {
                        startY: currentY,
                        head: [["Zimmer", "Gast", "Art", "Hund", "Aufbettung", "Kinder", "Personal", "Notiz"]],
                        body: cleaningTasks.map(t => {
                            const booking = checkouts.find(b => b.room_id === t.room_id);
                            return [
                                t.room_name || `Zimmer ${t.room_id}`,
                                booking?.guest_last_name || booking?.guest_name || "-",
                                booking?.occasion || "-",
                                (booking?.dog_count && booking.dog_count > 0) ? `${booking.dog_count}` : (booking?.has_dog ? "Ja" : "-"),
                                (booking?.extra_bed_count && booking.extra_bed_count > 0) ? `${booking.extra_bed_count}` : "-",
                                (booking?.child_count && booking.child_count > 0) ? `${booking.child_count}` : "-",
                                t.staff_name || "Nicht zugewiesen",
                                t.comments || ""
                            ];
                        }),
                    });
                    currentY = (doc as any).lastAutoTable.finalY + 15;
                }

                // Section 2: Weitere Aufgaben
                if (additionalTasks.length > 0) {
                    doc.setFontSize(14);
                    doc.text("Weitere Aufgaben (Allgemein)", 14, currentY);
                    currentY += 5;

                    autoTable(doc, {
                        startY: currentY,
                        head: [["Aufgabe", "Personal", "Notiz"]],
                        body: additionalTasks.map(t => [
                            t.title || "Unbenannte Aufgabe",
                            t.staff_name || "Nicht zugewiesen",
                            t.comments || ""
                        ]),
                    });
                    currentY = (doc as any).lastAutoTable.finalY + 15;
                }

                // Section 3: Check-Ins
                if (checkInTasks.length > 0) {
                    doc.setFontSize(14);
                    doc.text("Anreise-Vorbereitungen (Check-Ins)", 14, currentY);
                    currentY += 5;

                    autoTable(doc, {
                        startY: currentY,
                        head: [["Zimmer", "Gast", "Art", "Hund", "Aufbettung", "Kinder", "Personal", "Notiz"]],
                        body: checkInTasks.map(t => {
                            const booking = checkIns.find(b => b.room_id === t.room_id);

                            return [
                                t.room_name || `Zimmer ${t.room_id}`,
                                booking?.guest_last_name || booking?.guest_name || "-",
                                booking?.occasion || "-",
                                (booking?.dog_count && booking.dog_count > 0) ? `${booking.dog_count}` : (booking?.has_dog ? "Ja" : "-"),
                                (booking?.extra_bed_count && booking.extra_bed_count > 0) ? `${booking.extra_bed_count}` : "-",
                                (booking?.child_count && booking.child_count > 0) ? `${booking.child_count}` : "-",
                                t.staff_name || "Nicht zugewiesen",
                                t.comments || ""
                            ];
                        }),
                    });
                }

            } else {
                // Individual plans per staff
                // Group by staff first, then split inside
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

                    let currentY = 40;
                    const sCleaning = staffTasks.filter(t => (t.task_type === 'cleaning' || !t.task_type) && t.room_id);
                    const sAdditional = staffTasks.filter(t => (t.task_type === 'cleaning' || !t.task_type) && !t.room_id);
                    const sCheckIn = staffTasks.filter(t => t.task_type === 'checkin');

                    if (sCleaning.length > 0) {
                        doc.setFontSize(14);
                        doc.text("Reinigung (Zimmer)", 14, currentY);
                        currentY += 5;
                        autoTable(doc, {
                            startY: currentY,
                            head: [["Zimmer", "Gast", "Art", "Hund", "Aufbettung", "Kinder", "Notiz"]],
                            body: sCleaning.map(t => {
                                const booking = checkouts.find(b => b.room_id === t.room_id);
                                return [
                                    t.room_name || `Zimmer ${t.room_id}`,
                                    booking?.guest_last_name || booking?.guest_name || "-",
                                    booking?.occasion || "-",
                                    (booking?.dog_count && booking.dog_count > 0) ? `${booking.dog_count}` : (booking?.has_dog ? "Ja" : "-"),
                                    (booking?.extra_bed_count && booking.extra_bed_count > 0) ? `${booking.extra_bed_count}` : "-",
                                    (booking?.child_count && booking.child_count > 0) ? `${booking.child_count}` : "-",
                                    t.comments || ""
                                ];
                            }),
                        });
                        currentY = (doc as any).lastAutoTable.finalY + 15;
                    }

                    if (sAdditional.length > 0) {
                        doc.setFontSize(14);
                        doc.text("Weitere Aufgaben", 14, currentY);
                        currentY += 5;
                        autoTable(doc, {
                            startY: currentY,
                            head: [["Aufgabe", "Notiz"]],
                            body: sAdditional.map(t => [
                                t.title || "Unbenannte Aufgabe",
                                t.comments || ""
                            ]),
                        });
                        currentY = (doc as any).lastAutoTable.finalY + 15;
                    }

                    if (sCheckIn.length > 0) {
                        doc.setFontSize(14);
                        doc.text("Vorbereitung (Check-Ins)", 14, currentY);
                        currentY += 5;
                        autoTable(doc, {
                            startY: currentY,
                            head: [["Zimmer", "Gast", "Art", "Hund", "Aufbettung", "Kinder", "Notiz"]],
                            body: sCheckIn.map(t => {
                                const booking = checkIns.find(b => b.room_id === t.room_id);

                                return [
                                    t.room_name || `Zimmer ${t.room_id}`,
                                    booking?.guest_last_name || booking?.guest_name || "-",
                                    booking?.occasion || "-",
                                    (booking?.dog_count && booking.dog_count > 0) ? `${booking.dog_count}` : (booking?.has_dog ? "Ja" : "-"),
                                    (booking?.extra_bed_count && booking.extra_bed_count > 0) ? `${booking.extra_bed_count}` : "-",
                                    (booking?.child_count && booking.child_count > 0) ? `${booking.child_count}` : "-",
                                    t.comments || ""
                                ];
                            }),
                        });
                    }
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

    const currentWeekday = new Date(selectedDate).getDay();
    const currentWeekNum = getWeekNumber(new Date(selectedDate));
    const suggestionsForViewedWeekday = suggestions.filter(s => {
        let matchesDay = false;
        if (s.weekday === -1) { // Täglich
            matchesDay = true;
        } else if (s.weekday === -2) { // Werktags (Mo-Fr)
            matchesDay = viewedWeekday >= 1 && viewedWeekday <= 5;
        } else {
            matchesDay = s.weekday === viewedWeekday;
        }

        const matchesFreq = (currentWeekNum % (s.frequency_weeks || 1)) === 0;
        return matchesDay && matchesFreq;
    });
    const roomTasks = tasks.filter(t => t.room_id !== null);
    const additionalTasks = tasks.filter(t => t.room_id === null);


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
                <div className="lg:col-span-3 space-y-6">
                    <Card className="border-none shadow-sm bg-white dark:bg-zinc-900/50">
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
                                        <TableHead className="font-bold whitespace-nowrap text-center">Erledigt</TableHead>
                                        <TableHead className="font-bold">Anmerkungen</TableHead>
                                        <TableHead className="text-right pr-6 font-bold"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rooms.map((room) => {
                                        const activeTask = tasks.find(t => t.room_id === room.id && t.date === selectedDate && (t.task_type === 'cleaning' || !t.task_type));
                                        const delayedInfo = tasks.find(t => t.room_id === room.id && t.delayed_from === selectedDate && (t.task_type === 'cleaning' || !t.task_type));
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
                                                        onCheckedChange={(checked) => toggleCleaning(room.id, checked, 'cleaning')}
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
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center">
                                                        {isActive ? (
                                                            <div className="flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={activeTask?.status === "Erledigt"}
                                                                    onChange={(e) => updateTaskStatus(activeTask!.id, e.target.checked ? "Erledigt" : "Offen")}
                                                                    className="w-5 h-5 rounded border-zinc-300 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                                                                />
                                                            </div>
                                                        ) : "-"}
                                                    </div>
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

                    {/* Check-In Preparations Section */}
                    <Card className="border-none shadow-sm bg-white dark:bg-zinc-900/50">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">Anreise-Vorbereitungen</CardTitle>
                            <CardDescription>Aufgaben für heutige Anreisen (z.B. Hunde, Zustellbetten).</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-800/50">
                                    <TableRow>
                                        <TableHead className="font-bold pl-6 w-12 text-center">Plan</TableHead>
                                        <TableHead className="font-bold">Zimmer</TableHead>
                                        <TableHead className="font-bold">Quelle</TableHead>
                                        <TableHead className="font-bold">Personal</TableHead>
                                        <TableHead className="font-bold text-center">Details</TableHead>
                                        <TableHead className="font-bold whitespace-nowrap text-center">Erledigt</TableHead>
                                        <TableHead className="font-bold">Notiz</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rooms.map((room) => {
                                        const activeTask = tasks.find(t => t.room_id === room.id && t.date === selectedDate && t.task_type === 'checkin');
                                        const isActive = !!activeTask;
                                        const booking = checkIns.find(b => b.room_id === room.id);
                                        const hasDog = booking ? (booking.dog_count > 0 || booking.has_dog === 1) : false;
                                        const hasExtraBed = booking ? (booking.extra_bed_count > 0) : false;

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
                                                        onCheckedChange={(checked) => toggleCleaning(room.id, checked, 'checkin')}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-bold text-zinc-900 dark:text-zinc-100">
                                                    {room.name}
                                                    {booking && (
                                                        <div className="text-[10px] text-zinc-500 font-medium">
                                                            {booking.guest_name} ({booking.estimated_arrival_time || "keine Zeit"})
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {isActive ? (
                                                        <span className={cn(
                                                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border whitespace-nowrap",
                                                            activeTask.source === 'Auto' ? "bg-purple-50 text-purple-600 border-purple-100" :
                                                                "bg-zinc-100 text-zinc-600 border-zinc-200"
                                                        )}>
                                                            {activeTask.source || 'Manuell'}
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
                                                    ) : "-"}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center items-center gap-2">
                                                        {hasDog && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                                                {booking!.dog_count > 1 ? `${booking!.dog_count}x ` : ""}Hund
                                                            </span>
                                                        )}
                                                        {hasExtraBed && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                                                                {booking!.extra_bed_count}x Zustellbett
                                                            </span>
                                                        )}
                                                        {!hasDog && !hasExtraBed && booking && (
                                                            <span className="text-[10px] text-zinc-400">Standard</span>
                                                        )}
                                                        {!booking && <span className="text-[10px] text-zinc-300">-</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center">
                                                        {isActive ? (
                                                            <input
                                                                type="checkbox"
                                                                checked={activeTask?.status === "Erledigt"}
                                                                onChange={(e) => updateTaskStatus(activeTask!.id, e.target.checked ? "Erledigt" : "Offen")}
                                                                className="w-5 h-5 rounded border-zinc-300 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                                                            />
                                                        ) : "-"}
                                                    </div>
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
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Weitere Aufgaben Section */}
                    <Card className="border-none shadow-sm bg-white dark:bg-zinc-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-xl font-bold">Weitere Aufgaben</CardTitle>
                                <CardDescription>Zusätzliche Tätigkeiten für heute.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setIsSuggestionsOpen(true)} className="h-8">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Vorschläge verwalten
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setIsAddTaskOpen(true)} className="h-8">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Aufgabe hinzufügen
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Suggestions List */}
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 shrink-0">Vorschläge für</h4>
                                    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
                                        {WEEKDAYS.map((day, i) => (
                                            <Button
                                                key={i}
                                                variant={viewedWeekday === i ? "default" : "ghost"}
                                                size="sm"
                                                className={cn(
                                                    "h-8 text-[11px] font-bold px-3 rounded-full shrink-0 transition-all",
                                                    viewedWeekday === i
                                                        ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200"
                                                        : i === currentWeekday
                                                            ? "text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                                                            : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                )}
                                                onClick={() => setViewedWeekday(i)}
                                            >
                                                {i === currentWeekday && <span className="w-1 h-1 rounded-full bg-current mr-1.5" />}
                                                {day}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {suggestionsForViewedWeekday.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {suggestionsForViewedWeekday.map(s => {
                                            const isAlreadyAdded = additionalTasks.some(t => t.title === s.title && t.date === selectedDate);
                                            return (
                                                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-800/50 group transition-all hover:border-purple-200 hover:shadow-sm">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{s.title}</span>
                                                        <span className="text-[10px] text-zinc-500">
                                                            {s.frequency_weeks === 1 ? "Wöchentlich" : `Alle ${s.frequency_weeks} Wochen`}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        disabled={isAlreadyAdded}
                                                        onClick={() => addTaskFromSuggestion(s)}
                                                        className={cn(
                                                            "h-8 px-2",
                                                            isAlreadyAdded ? "text-emerald-600" : "text-purple-600 hover:bg-purple-50"
                                                        )}
                                                    >
                                                        {isAlreadyAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 px-4 bg-zinc-50/30 dark:bg-zinc-900/30 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl">
                                        <p className="text-zinc-400 text-sm italic">Keine geplanten Vorschläge für {WEEKDAYS[viewedWeekday]}.</p>
                                    </div>
                                )}
                            </div>

                            {/* Active Additional Tasks Table */}
                            <div className="rounded-xl border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-zinc-50/50 dark:bg-zinc-800/50">
                                        <TableRow>
                                            <TableHead className="font-bold pl-6">Aufgabe</TableHead>
                                            <TableHead className="font-bold">Personal</TableHead>
                                            <TableHead className="font-bold text-center">Erledigt</TableHead>
                                            <TableHead className="font-bold">Notiz</TableHead>
                                            <TableHead className="text-right pr-6 font-bold"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {additionalTasks.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-zinc-400 italic text-sm">
                                                    Keine zusätzlichen Aufgaben für heute geplant.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            additionalTasks.map((task) => (
                                                <TableRow key={task.id} className="group">
                                                    <TableCell className="pl-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{task.title || "Zusatzaufgabe"}</span>
                                                            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                                                <span className={cn(
                                                                    "w-1.5 h-1.5 rounded-full",
                                                                    task.source === 'Vorschlag' ? "bg-purple-500" : "bg-zinc-400"
                                                                )} />
                                                                {task.source || 'Manuell'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={task.staff_id || "none"}
                                                            onValueChange={(val: string) => assignStaff(task.id, val)}
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
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex justify-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={task.status === "Erledigt"}
                                                                onChange={(e) => updateTaskStatus(task.id, e.target.checked ? "Erledigt" : "Offen")}
                                                                className="w-5 h-5 rounded border-zinc-300 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            defaultValue={task.comments || ""}
                                                            placeholder="Notiz..."
                                                            className="h-7 text-[11px] border-zinc-200 bg-transparent focus:bg-white transition-all w-full max-w-[150px]"
                                                            onBlur={(e) => updateTaskComments(task.id, e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={async () => {
                                                                if (confirm("Aufgabe wirklich entfernen?")) {
                                                                    const db = await initDb();
                                                                    if (db) {
                                                                        await db.execute("DELETE FROM cleaning_tasks WHERE id = ?", [task.id]);
                                                                        await loadData();
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>                            {/* Personal Sidebar */}
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
                                            <span className="text-xs font-medium text-zinc-500">{assignedCount} / {s.daily_capacity} Aufgaben</span>
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

            {/* Additional Tasks Dialogs */}
            <Dialog open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Vorschläge konfigurieren</DialogTitle>
                        <DialogDescription>Automatisierte Aufgabenvorschläge basierend auf dem Wochentag und der Frequenz.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={addSuggestion} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="title">Aufgabe</Label>
                            <Input id="title" name="title" placeholder="z.B. Fenster putzen" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="weekday">Wochentag</Label>
                            <Select value={newSuggestionWeekday} onValueChange={setNewSuggestionWeekday}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="-1">Täglich</SelectItem>
                                    <SelectItem value="-2">Werktags (Mo-Fr)</SelectItem>
                                    <DropdownMenuSeparator />
                                    {WEEKDAYS.map((day, i) => (
                                        <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="frequency">Frequenz</Label>
                            <Select value={newSuggestionFrequency} onValueChange={setNewSuggestionFrequency}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Wöchentlich</SelectItem>
                                    <SelectItem value="2">Alle 2 Wochen</SelectItem>
                                    <SelectItem value="3">Alle 3 Wochen</SelectItem>
                                    <SelectItem value="4">Alle 4 Wochen</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                            Neu
                        </Button>
                    </form>

                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Bestehende Vorschläge</h3>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="filter-weekday" className="text-xs text-zinc-500">Filtern nach:</Label>
                            <Select value={suggestionFilter} onValueChange={setSuggestionFilter}>
                                <SelectTrigger id="filter-weekday" className="h-8 w-[150px] text-xs">
                                    <SelectValue placeholder="Wochentag..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">Alle Tage</SelectItem>
                                    <SelectItem value="-1" className="text-xs">Täglich</SelectItem>
                                    <SelectItem value="-2" className="text-xs">Werktags (Mo-Fr)</SelectItem>
                                    <DropdownMenuSeparator />
                                    {WEEKDAYS.map((day, i) => (
                                        <SelectItem key={i} value={i.toString()} className="text-xs">{day}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="border rounded-xl overflow-auto max-h-[60vh] shadow-sm">
                        <Table>
                            <TableHeader className="bg-zinc-100/50">
                                <TableRow>
                                    <TableHead className="font-bold">Aufgabe</TableHead>
                                    <TableHead className="font-bold">Intervall</TableHead>
                                    <TableHead className="font-bold">Wochentag</TableHead>
                                    <TableHead className="text-right font-bold pr-6">Aktionen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suggestions
                                    .filter(s => suggestionFilter === "all" || s.weekday.toString() === suggestionFilter)
                                    .length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-6 text-zinc-400 italic">
                                            {suggestionFilter === "all" ? "Keine Vorschläge konfiguriert." : `Keine Vorschläge für ${WEEKDAYS[parseInt(suggestionFilter)]} gefunden.`}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    suggestions
                                        .filter(s => suggestionFilter === "all" || s.weekday.toString() === suggestionFilter)
                                        .map(s => (
                                            <TableRow key={s.id}>
                                                <TableCell className="font-bold">
                                                    <Input
                                                        defaultValue={s.title}
                                                        className="h-8 border-none bg-transparent hover:bg-zinc-100 focus:bg-white transition-all font-bold px-2"
                                                        onBlur={(e) => updateSuggestion(s.id, { title: e.target.value })}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={s.frequency_weeks.toString()}
                                                        onValueChange={(val) => updateSuggestion(s.id, { frequency_weeks: parseInt(val) })}
                                                    >
                                                        <SelectTrigger className="h-8 border-none bg-transparent hover:bg-zinc-100 transition-all text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="1">Wöchentlich</SelectItem>
                                                            <SelectItem value="2">Alle 2 Wochen</SelectItem>
                                                            <SelectItem value="3">Alle 3 Wochen</SelectItem>
                                                            <SelectItem value="4">Alle 4 Wochen</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={s.weekday.toString()}
                                                        onValueChange={(val) => updateSuggestion(s.id, { weekday: parseInt(val) })}
                                                    >
                                                        <SelectTrigger className="h-8 border-none bg-transparent hover:bg-zinc-100 transition-all text-xs uppercase font-medium">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="-1" className="text-xs">Täglich</SelectItem>
                                                            <SelectItem value="-2" className="text-xs">Werktags (Mo-Fr)</SelectItem>
                                                            <DropdownMenuSeparator />
                                                            {WEEKDAYS.map((day, i) => (
                                                                <SelectItem key={i} value={i.toString()} className="text-xs">{day}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button variant="ghost" size="sm" onClick={() => deleteSuggestion(s.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Zusätzliche Aufgabe hinzufügen</DialogTitle>
                        <DialogDescription>Erstelle eine manuelle Aufgabe für heute.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const title = new FormData(e.currentTarget).get('title') as string;
                        if (title) {
                            await addManualTask(title);
                            setIsAddTaskOpen(false);
                        }
                    }} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="manual-title">Aufgabenbezeichnung</Label>
                            <Input id="manual-title" name="title" placeholder="z.B. Terrassenmöbel reinigen" required />
                        </div>
                        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 font-bold">
                            Aufgabe erstellen
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

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
                        <div className="border rounded-xl bg-zinc-50 dark:bg-zinc-900 shadow-inner overflow-y-auto max-h-[40vh]">
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
                                            <TableCell className="text-sm font-medium">{s.daily_capacity} Aufgaben/Tag</TableCell>
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
                            <Label htmlFor="capacity">Kapazität (Aufgaben/Tag)</Label>
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
