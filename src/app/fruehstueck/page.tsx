"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Coffee, Clock, AlertCircle, CheckCircle2, Plus, Trash2, Download, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { initDb } from "@/lib/db";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { savePdfNative } from "@/lib/pdf-export";

interface BreakfastRow {
    room_id: string;
    room_name: string;
    booking_id: string | null;
    guest_name: string | null;
    breakfast_id: string | null;
    time: string | null;
    guest_count: number | null;
    comments: string | null;
    is_prepared: number;
    is_included: number;
    source: string | null;
}

export default function BreakfastPage() {
    const [data, setData] = useState<BreakfastRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const today = new Date().toISOString().split('T')[0];

    const loadData = useCallback(async () => {
        try {
            const db = await initDb();
            if (db) {
                // Fetch all rooms and join with potential bookings and breakfast options for today
                const results = await db.select<BreakfastRow[]>(`
                    SELECT 
                        r.id as room_id, r.name as room_name,
                        b.id as booking_id, g.name as guest_name,
                        bo.id as breakfast_id, bo.time, bo.guest_count, bo.comments, 
                        COALESCE(bo.is_prepared, 0) as is_prepared, 
                        COALESCE(bo.is_included, 0) as is_included,
                        bo.source
                    FROM rooms r
                    LEFT JOIN bookings b ON r.id = b.room_id 
                        AND b.status != 'Checked-Out' 
                        AND b.status != 'Draft'
                        AND ? > b.start_date AND ? <= b.end_date
                    LEFT JOIN guests g ON b.guest_id = g.id
                    LEFT JOIN breakfast_options bo ON b.id = bo.booking_id AND bo.date = ?
                    ORDER BY r.id ASC, bo.time ASC, bo.id ASC
                `, [today, today, today]);
                setData(results || []);
            }
        } catch (error) {
            console.error("Failed to load breakfast data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [today]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const addPerson = async (bookingId: string) => {
        try {
            const db = await initDb();
            if (db) {
                await db.execute(
                    "INSERT INTO breakfast_options (id, booking_id, date, is_included, time, guest_count, is_prepared, comments, source, is_manual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [crypto.randomUUID(), bookingId, today, 1, "08:00", 1, 0, "", "manuell", 1]
                );
                await loadData();
            }
        } catch (error) {
            console.error("Failed to add person:", error);
        }
    };

    const removePerson = async (breakfastId: string) => {
        try {
            const db = await initDb();
            if (db) {
                await db.execute("DELETE FROM breakfast_options WHERE id = ?", [breakfastId]);
                await loadData();
            }
        } catch (error) {
            console.error("Failed to remove person:", error);
        }
    };

    const toggleBreakfast = async (row: BreakfastRow) => {
        if (!row.booking_id) return;
        try {
            const db = await initDb();
            if (db) {
                const newIncluded = row.is_included === 1 ? 0 : 1;
                if (row.breakfast_id) {
                    await db.execute("UPDATE breakfast_options SET is_included = ? WHERE id = ?", [newIncluded, row.breakfast_id]);
                } else {
                    await db.execute(
                        "INSERT INTO breakfast_options (id, booking_id, date, is_included, time, guest_count, is_prepared, comments, source, is_manual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        [crypto.randomUUID(), row.booking_id, today, newIncluded, "08:00", 1, 0, "", "auto", 0]
                    );
                }
                await loadData();
            }
        } catch (error) {
            console.error("Failed to toggle breakfast:", error);
        }
    };

    const updateBreakfastDetails = async (breakfastId: string | null, bookingId: string, field: string, value: any) => {
        try {
            const db = await initDb();
            if (db) {
                if (breakfastId) {
                    await db.execute(`UPDATE breakfast_options SET ${field} = ? WHERE id = ?`, [value, breakfastId]);
                } else {
                    const id = crypto.randomUUID();
                    await db.execute(
                        `INSERT INTO breakfast_options (id, booking_id, date, is_included, time, guest_count, is_prepared, comments, ${field}, source, is_manual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [id, bookingId, today, 1, "08:00", 1, 0, "", value, "auto", 0]
                    );
                }
                await loadData();
            }
        } catch (error) {
            console.error("Failed to update breakfast details:", error);
        }
    };

    const togglePrepared = async (breakfastId: string | null, currentStatus: number) => {
        if (!breakfastId) return;
        try {
            const db = await initDb();
            if (db) {
                const newStatus = currentStatus === 1 ? 0 : 1;
                await db.execute("UPDATE breakfast_options SET is_prepared = ? WHERE id = ?", [newStatus, breakfastId]);
                await loadData();
            }
        } catch (error) {
            console.error("Failed to update prepared status:", error);
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        const dateStr = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

        // Header
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text("Frühstücksliste", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Datum: ${dateStr}`, 14, 28);
        doc.text(`Anzahl Portionen: ${activeBreakfasts.length}`, 14, 33);

        // Horizontal line
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 38, 196, 38);

        // Naming logic for PDF
        let pdfLastRoomId = "";
        const tableData = activeBreakfasts.map(item => {
            const isFirst = item.room_id !== pdfLastRoomId;
            pdfLastRoomId = item.room_id;

            return [
                isFirst ? (item.room_name || `Zimmer ${item.room_id}`) : "",
                isFirst ? (item.guest_name || "-") : "› Weitere Person",
                item.time || "08:00",
                item.comments || "",
                "[  ]" // Checkbox
            ];
        });

        autoTable(doc, {
            startY: 45,
            head: [['Zimmer', 'Gast', 'Uhrzeit', 'Hinweise', 'Fertig']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [59, 130, 246],
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
                1: { cellWidth: 45 },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 'auto' },
                4: { cellWidth: 20, halign: 'center' }
            },
            styles: {
                fontSize: 9,
                cellPadding: 4
            }
        });

        const filename = `Fruehstuecksliste_${dateStr.replace(/\./g, '-')}.pdf`;
        savePdfNative(doc, filename).then(success => {
            if (success) {
                setDownloadSuccess(true);
                setTimeout(() => setDownloadSuccess(false), 3000);
            }
        });
    };

    const activeBreakfasts = data.filter(d => d.is_included === 1);
    const totalPersons = activeBreakfasts.length; // Each row is one person now
    const preparedPersons = activeBreakfasts.filter(d => d.is_prepared === 1).length;

    // Grouping logic to show room info only once or keep it organized
    let lastRoomId = "";

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Frühstücks-Planer</h2>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Individuelle Frühstücksplanung je Person und Zimmer.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-xl border border-orange-100 dark:border-orange-800/30">
                    <Coffee className="w-5 h-5 text-orange-600" />
                    <div className="text-sm font-bold text-orange-900 dark:text-orange-100">
                        {preparedPersons} / {totalPersons} <span className="text-orange-600 dark:text-orange-400 font-medium">Portionen fertig</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card className="border-none shadow-sm dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Heutige Frühstücksliste</CardTitle>
                            <CardDescription>
                                {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </CardDescription>
                        </div>
                        <Button
                            variant={downloadSuccess ? "outline" : "outline"}
                            size="sm"
                            className={cn(
                                "h-9 font-bold transition-all duration-300",
                                downloadSuccess ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800" : "border-zinc-200 hover:bg-zinc-50"
                            )}
                            onClick={exportToPDF}
                        >
                            {downloadSuccess ? (
                                <><Check className="w-4 h-4 mr-2" /> Geladen</>
                            ) : (
                                <><Download className="w-4 h-4 mr-2" /> Liste herunterladen</>
                            )}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="py-12 text-center text-zinc-500 italic">Lade Daten...</div>
                        ) : data.length === 0 ? (
                            <div className="py-12 text-center">
                                <Coffee className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                                <div className="text-zinc-500 italic text-sm">Keine Zimmer gefunden.</div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[60px] text-center">Plan</TableHead>
                                        <TableHead>Zimmer / Gast</TableHead>
                                        <TableHead>Uhrzeit</TableHead>
                                        <TableHead>Hinweise</TableHead>
                                        <TableHead className="w-[50px] text-center">Fertig</TableHead>
                                        <TableHead className="w-[40px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((item, index) => {
                                        const isActive = item.is_included === 1 && !!item.booking_id;
                                        const isFirstInRoom = item.room_id !== lastRoomId;
                                        const isNextSameRoom = index < data.length - 1 && data[index + 1].room_id === item.room_id;
                                        lastRoomId = item.room_id;

                                        return (
                                            <TableRow
                                                key={item.breakfast_id || `empty-${item.room_id}-${index}`}
                                                className={cn(
                                                    "transition-all group border-none",
                                                    !isActive && "opacity-40 grayscale-[0.5] hover:opacity-100 hover:grayscale-0",
                                                    item.is_prepared === 1 && isActive && "bg-emerald-50/20 dark:bg-emerald-900/10",
                                                    isFirstInRoom && index !== 0 && "border-t border-zinc-100 dark:border-zinc-800",
                                                    !isFirstInRoom && "bg-zinc-50/30 dark:bg-white/5"
                                                )}
                                            >
                                                <TableCell className="text-center relative">
                                                    {!isFirstInRoom && (
                                                        <div className="absolute left-[30px] top-0 bottom-0 w-[2px] bg-zinc-200 dark:bg-zinc-700" />
                                                    )}
                                                    <Switch
                                                        checked={item.is_included === 1}
                                                        disabled={!item.booking_id}
                                                        onCheckedChange={() => toggleBreakfast(item)}
                                                        className={cn(!isFirstInRoom && "scale-90")}
                                                    />
                                                </TableCell>
                                                <TableCell className="relative">
                                                    {!isFirstInRoom && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-zinc-200 dark:bg-zinc-700" />
                                                    )}
                                                    {isFirstInRoom ? (
                                                        <div className="flex flex-col">
                                                            <div className="font-bold text-sm">{item.room_name}</div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-zinc-500 font-medium uppercase">Zimmer {item.room_id}</span>
                                                                {isActive && item.source && (
                                                                    <Badge variant="outline" className={cn(
                                                                        "text-[8px] py-0 px-1.5 h-3.5 border-none font-bold uppercase tracking-wider flex items-center justify-center",
                                                                        item.source === 'auto' ? "bg-blue-100/50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                                                                    )}>
                                                                        {item.source}
                                                                    </Badge>
                                                                )}
                                                                <span className="text-xs text-zinc-500 font-medium">
                                                                    {item.guest_name || (
                                                                        <span className="italic text-zinc-400">Keine Belegung</span>
                                                                    )}
                                                                </span>
                                                                {item.booking_id && (
                                                                    <button
                                                                        onClick={() => addPerson(item.booking_id!)}
                                                                        className="w-4 h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-orange-100 hover:text-orange-600 transition-colors"
                                                                        title="Weitere Person hinzufügen"
                                                                    >
                                                                        <Plus className="w-2.5 h-2.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 pl-4 text-zinc-400">
                                                            <div className="w-2 h-2 border-l-2 border-b-2 border-zinc-200 dark:border-zinc-700 -mt-1" />
                                                            <div className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                                Weitere Person
                                                                {isActive && item.source && (
                                                                    <Badge variant="outline" className={cn(
                                                                        "text-[8px] py-0 px-1.5 h-3 border-none font-bold uppercase tracking-wider",
                                                                        item.source === 'auto' ? "bg-blue-100/50 text-blue-600" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                                                                    )}>
                                                                        {item.source}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-2">
                                                    {isActive ? (
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                                            <Input
                                                                type="time"
                                                                defaultValue={item.time || "08:00"}
                                                                className="h-8 w-24 text-xs bg-transparent border-zinc-200 focus:bg-white dark:focus:bg-zinc-800"
                                                                onBlur={(e) => updateBreakfastDetails(item.breakfast_id, item.booking_id!, 'time', e.target.value)}
                                                            />
                                                        </div>
                                                    ) : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {isActive ? (
                                                        <Input
                                                            placeholder="Allergien, Wünsche..."
                                                            defaultValue={item.comments || ""}
                                                            className="h-8 text-xs bg-transparent border-zinc-200 focus:bg-white dark:focus:bg-zinc-800 w-full"
                                                            onBlur={(e) => updateBreakfastDetails(item.breakfast_id, item.booking_id!, 'comments', e.target.value)}
                                                        />
                                                    ) : (
                                                        <span className="text-zinc-300 text-xs">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {isActive && (
                                                        <input
                                                            type="checkbox"
                                                            checked={item.is_prepared === 1}
                                                            onChange={() => togglePrepared(item.breakfast_id, item.is_prepared)}
                                                            className="w-5 h-5 rounded border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {item.breakfast_id && !isFirstInRoom && (
                                                        <button
                                                            onClick={() => removePerson(item.breakfast_id!)}
                                                            className="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
