"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, FileText, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
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
import { initDb } from "@/lib/db";

interface TourismData {
    id: string;
    guest_name: string;
    nationality: string;
    start_date: string;
    end_date: string;
}

export default function TourismusmeldungPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [data, setData] = useState<TourismData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const db = await initDb();
            if (db) {
                const year = selectedDate.getFullYear();
                const month = selectedDate.getMonth();

                const monthStart = new Date(year, month, 1);
                const monthEnd = new Date(year, month + 1, 0);

                const startStr = monthStart.toISOString().split('T')[0];
                const endStr = monthEnd.toISOString().split('T')[0];

                // Fetch bookings that overlap with this month
                // Only "Hart-Booked" or "Checked-In" or "Checked-Out" (confirmed bookings)
                // Exclude "Draft" and "Storniert"
                const query = `
                    SELECT b.id, g.name as guest_name, g.nationality, b.start_date, b.end_date
                    FROM bookings b
                    LEFT JOIN guests g ON b.guest_id = g.id
                    WHERE b.status IN ('Hard-Booked', 'Checked-In', 'Checked-Out')
                    AND (
                        (b.start_date BETWEEN ? AND ?) OR
                        (b.end_date BETWEEN ? AND ?) OR
                        (b.start_date <= ? AND b.end_date >= ?)
                    )
                `;
                const params = [startStr, endStr, startStr, endStr, startStr, endStr];

                const results = await db.select<TourismData[]>(query, params);
                setData(results || []);
            }
        } catch (error) {
            console.error("Failed to load tourism data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const nextMonth = () => {
        setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        const [y, m, d] = dateStr.split("-");
        return `${d}.${m}.${y}`;
    };

    const exportCSV = async () => {
        const headers = ["Gast", "Nationalität", "Anreise", "Abreise"];
        const rows = data.map(r => [
            r.guest_name,
            r.nationality || "Unbekannt",
            r.start_date,
            r.end_date
        ]);

        let csvContent = "\uFEFF"; // UTF-8 BOM for Excel
        csvContent += headers.join(";") + "\n";
        csvContent += rows.map(e => e.join(";")).join("\n");

        const monthYear = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}`;
        const fileName = `Tourismusmeldung_${monthYear}.csv`;

        // Check if we are in Tauri environment
        const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

        if (isTauri) {
            try {
                const { save } = await import("@tauri-apps/plugin-dialog");
                const { writeTextFile } = await import("@tauri-apps/plugin-fs");

                const filePath = await save({
                    filters: [{ name: 'CSV', extensions: ['csv'] }],
                    defaultPath: fileName
                });

                if (filePath) {
                    await writeTextFile(filePath, csvContent);
                    console.log("File saved to:", filePath);
                }
            } catch (err) {
                console.error("Tauri export failed, falling back to browser:", err);
                fallbackDownload(csvContent, fileName);
            }
        } else {
            fallbackDownload(csvContent, fileName);
        }
    };

    const fallbackDownload = (content: string, fileName: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const monthName = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(selectedDate);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tourismusmeldung</h2>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Monatliche Übersicht aller belegten Buchungen für das Meldeamt.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-lg border bg-white dark:bg-zinc-950 p-1 shadow-sm">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2 px-3 font-medium min-w-[150px] justify-center text-sm">
                            <Calendar className="w-4 h-4 text-zinc-500" />
                            {monthName}
                        </div>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button onClick={exportCSV} variant="outline" disabled={data.length === 0} className="shadow-sm">
                        <Download className="w-4 h-4 mr-2" />
                        CSV Export
                    </Button>
                </div>
            </div>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-900">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-500" />
                                Meldeliste
                            </CardTitle>
                            <CardDescription>
                                {data.length} Buchung{data.length !== 1 ? 'en' : ''} im {monthName}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 pointer-events-none">
                                    <TableHead className="py-3 px-6">Gast Name</TableHead>
                                    <TableHead className="py-3 px-6">Nationalität</TableHead>
                                    <TableHead className="py-3 px-6">Anreise</TableHead>
                                    <TableHead className="py-3 px-6 text-right">Abreise</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center">
                                            <div className="flex items-center justify-center gap-2 text-zinc-500">
                                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                Lade Daten...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-zinc-500">
                                            Keine Buchungen für diesen Zeitraum gefunden.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.sort((a, b) => a.start_date.localeCompare(b.start_date)).map((row) => (
                                        <TableRow key={row.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-900/30 transition-colors">
                                            <TableCell className="py-4 px-6 font-medium">{row.guest_name}</TableCell>
                                            <TableCell className="py-4 px-6">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 uppercase">
                                                    {row.nationality || "-"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">{formatDate(row.start_date)}</TableCell>
                                            <TableCell className="py-4 px-6 text-right text-zinc-600 dark:text-zinc-400">
                                                {formatDate(row.end_date)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
