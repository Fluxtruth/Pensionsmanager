"use client";

import React, { useState, useEffect } from "react";
import { LogIn, LogOut, BedDouble, Eraser, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initDb } from "@/lib/db";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function MyDayWidget() {
    const [stats, setStats] = useState({
        checkInsTotal: 0,
        checkInsDone: 0,
        checkOutsTotal: 0,
        checkOutsDone: 0,
        roomCount: 0,
        occupancy: 0,
        cleaningTotal: 0,
        cleaningDone: 0,
        draftsCount: 0,
        breakfastTotal: 0,
        breakfastDone: 0,
        needsCleaningGeneration: false,
    });

    useEffect(() => {
        const loadStats = async () => {
            try {
                const db = await initDb();
                if (db) {
                    const today = new Date().toISOString().split('T')[0];

                    // Total Check-ins expected today (based on start_date)
                    const insTotal = await db.select<any[]>("SELECT COUNT(*) as count FROM bookings WHERE start_date = ?", [today]);
                    // Check-ins already done (today's start_date AND status is Checked-In or later)
                    const insDone = await db.select<any[]>("SELECT COUNT(*) as count FROM bookings WHERE start_date = ? AND status IN ('Checked-In', 'Checked-Out')", [today]);

                    // Total Check-outs expected today (based on end_date)
                    const outsTotal = await db.select<any[]>("SELECT COUNT(*) as count FROM bookings WHERE end_date = ?", [today]);
                    // Check-outs already done (today's end_date AND status is Checked-Out)
                    const outsDone = await db.select<any[]>("SELECT COUNT(*) as count FROM bookings WHERE end_date = ? AND status = 'Checked-Out'", [today]);

                    // Count Total Rooms
                    const rooms = await db.select<any[]>("SELECT COUNT(*) as count FROM rooms");

                    // Count Currently Occupied Rooms (Not specifically today's checkins, but overall state)
                    const occupied = await db.select<any[]>("SELECT COUNT(*) as count FROM bookings WHERE status = 'Checked-In'");

                    // Count Draft Bookings
                    const drafts = await db.select<any[]>("SELECT COUNT(*) as count FROM bookings WHERE status = 'Draft'");

                    // Breakfast Stats
                    const bTotalResult = await db.select<any[]>("SELECT SUM(guest_count) as total FROM breakfast_options WHERE date = ? AND is_included = 1", [today]);
                    const bDoneResult = await db.select<any[]>("SELECT SUM(guest_count) as done FROM breakfast_options WHERE date = ? AND is_included = 1 AND is_prepared = 1", [today]);

                    // Cleaning Stats - Simplified and optimized
                    const cleaningTasks = await db.select<any[]>("SELECT room_id, status FROM cleaning_tasks WHERE date = ?", [today]);
                    const cTotal = cleaningTasks?.length || 0;
                    const cDone = cleaningTasks?.filter(t => t.status === 'Erledigt').length || 0;

                    const checkouts = await db.select<any[]>("SELECT room_id FROM bookings WHERE end_date = ? AND status != 'Draft'", [today]);
                    const existingTaskRoomIds = (cleaningTasks || []).map(t => t.room_id);
                    const hasMissingTasks = (checkouts || []).some(b => !existingTaskRoomIds.includes(b.room_id));

                    setStats({
                        checkInsTotal: insTotal?.[0]?.count || 0,
                        checkInsDone: insDone?.[0]?.count || 0,
                        checkOutsTotal: outsTotal?.[0]?.count || 0,
                        checkOutsDone: outsDone?.[0]?.count || 0,
                        roomCount: rooms?.[0]?.count || 0,
                        occupancy: occupied?.[0]?.count || 0,
                        cleaningTotal: cTotal,
                        cleaningDone: cDone,
                        draftsCount: drafts?.[0]?.count || 0,
                        breakfastTotal: bTotalResult?.[0]?.total || 0,
                        breakfastDone: bDoneResult?.[0]?.done || 0,
                        needsCleaningGeneration: hasMissingTasks,
                    });
                }
            } catch (error) {
                console.error("Failed to load widget stats:", error);
            }
        };
        loadStats();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link href="/buchungen?filter=checkin" className="block transition-transform hover:scale-[1.02]">
                <Card className="overflow-hidden border-none bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 shadow-sm border border-emerald-200/50 dark:border-emerald-800/30 h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-emerald-800 dark:text-emerald-300">
                        <CardTitle className="text-sm font-medium">Check-Ins Heute</CardTitle>
                        <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                            {stats.checkInsDone}/{stats.checkInsTotal}
                        </div>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1 font-medium italic">Anreisende eingecheckt</p>
                    </CardContent>
                </Card>
            </Link>

            <Link href="/buchungen?filter=checkout" className="block transition-transform hover:scale-[1.02]">
                <Card className="overflow-hidden border-none bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 shadow-sm border border-amber-200/50 dark:border-amber-800/30 h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-amber-800 dark:text-amber-300">
                        <CardTitle className="text-sm font-medium">Check-Outs Heute</CardTitle>
                        <LogOut className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                            {stats.checkOutsDone}/{stats.checkOutsTotal}
                        </div>
                        <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1 font-medium italic">Abreisende ausgecheckt</p>
                    </CardContent>
                </Card>
            </Link>

            <Link href="/fruehstueck" className="block transition-transform hover:scale-[1.02]">
                <Card className="overflow-hidden border-none bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 shadow-sm border border-orange-200/50 dark:border-orange-800/30 h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-orange-800 dark:text-orange-300">
                        <CardTitle className="text-sm font-medium">Frühstück</CardTitle>
                        <span className="text-lg">☕</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                            {stats.breakfastDone}/{stats.breakfastTotal}
                        </div>
                        <p className="text-[10px] text-orange-600 dark:text-orange-500 mt-1 font-medium italic">Portionen zubereitet</p>
                    </CardContent>
                </Card>
            </Link>

            <Link href="/buchungen?filter=drafts" className="block transition-transform hover:scale-[1.02]">
                <Card className="overflow-hidden border-none bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950/20 dark:to-zinc-900/20 shadow-sm border border-zinc-200/50 dark:border-zinc-800/30 h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-zinc-800 dark:text-zinc-300">
                        <CardTitle className="text-sm font-medium">Entwürfe</CardTitle>
                        <BedDouble className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                            {stats.draftsCount}
                        </div>
                        <p className="text-[10px] text-zinc-600 dark:text-zinc-500 mt-1 font-medium italic">Offene Entwürfe</p>
                    </CardContent>
                </Card>
            </Link>

            <Card className="overflow-hidden border-none bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 shadow-sm border border-blue-200/50 dark:border-blue-800/30 h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-blue-800 dark:text-blue-300">
                    <CardTitle className="text-sm font-medium">Auslastung</CardTitle>
                    <BedDouble className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.occupancy}/{stats.roomCount}</div>
                    <p className="text-[10px] text-blue-600 dark:text-blue-500 mt-1 font-medium italic">Aktuell belegt</p>
                </CardContent>
            </Card>

            <Link href="/reinigung" className="block transition-transform hover:scale-[1.02]">
                <Card className="overflow-hidden border-none bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 shadow-sm border border-purple-200/50 dark:border-purple-800/30 h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-purple-800 dark:text-purple-300">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            Reinigung
                            {stats.needsCleaningGeneration && (
                                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                            )}
                        </CardTitle>
                        <Eraser className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-900 dark:text-emerald-100">
                            {stats.cleaningDone}/{stats.cleaningTotal}
                        </div>
                        <p className="text-[10px] text-purple-600 dark:text-purple-500 mt-1 font-medium italic flex items-center gap-1">
                            {stats.needsCleaningGeneration ? (
                                <span className="text-amber-600 dark:text-amber-400 font-bold">⚠️ Plan unvollständig!</span>
                            ) : (
                                "Aufgaben erledigt"
                            )}
                        </p>
                    </CardContent>
                </Card>
            </Link>
        </div>
    );
}
