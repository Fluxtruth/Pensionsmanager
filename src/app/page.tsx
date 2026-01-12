"use client";

import React, { useState, useEffect } from "react";
import { MyDayWidget } from "@/components/MyDayWidget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BedDouble, Bed, Home as HomeIcon, Users, User, LogIn, LogOut, CheckCircle2, ChevronRight, Edit2, AlertTriangle, XCircle } from "lucide-react";
import { initDb, type DatabaseMock } from "@/lib/db";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import confetti from 'canvas-confetti';

// Main Dashboard Page - Displays key metrics and today's overview
interface Room {
  id: string;
  name: string;
  type: string;
  status?: string;
}

interface BookingEntry {
  id: string;
  guest_id: string;
  guest_name: string;
  room_id: string;
  room_name?: string;
  status: string;
  date: string;
  estimated_arrival_time?: string;
}

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [arrivals, setArrivals] = useState<BookingEntry[]>([]);
  const [departures, setDepartures] = useState<BookingEntry[]>([]);
  const [isDbReady, setIsDbReady] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const router = useRouter();

  // State for Check-in/out Confirmation
  const [checkInConfirmOpen, setCheckInConfirmOpen] = useState(false);
  const [pendingCheckIn, setPendingCheckIn] = useState<{ id: string, name: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = async (dbInstance?: any) => {
    try {
      const db = (dbInstance || await initDb()) as DatabaseMock | null;
      if (db) {
        setIsDbReady(true);

        // Load Rooms
        const roomResults = await db.select<Room[]>("SELECT * FROM rooms");
        // Calculate Room Statuses
        const todayBookings = await db.select<any[]>(`
          SELECT room_id, status, start_date, end_date 
          FROM bookings 
          WHERE (start_date <= ? AND end_date >= ?)
        `, [today, today]);

        const roomsWithStatus = roomResults.map(room => {
          const roomBooking = todayBookings?.find(b => b.room_id === room.id);
          let status = "Frei";

          if (roomBooking) {
            if (roomBooking.status === "Checked-In") {
              if (roomBooking.end_date === today) {
                status = "Wird heute frei";
              } else {
                status = "Eingecheckt";
              }
            } else if (roomBooking.start_date === today && (roomBooking.status === "Draft" || roomBooking.status === "Hard-Booked")) {
              status = "Wird heute belegt";
            } else if (roomBooking.status === "Checked-Out") {
              // Check if there is another booking starting today for this room
              const nextBooking = todayBookings?.find(b => b.room_id === room.id && b.start_date === today && b.status !== "Checked-Out");
              status = nextBooking ? "Wird heute belegt" : "Frei";
            }
          }

          return { ...room, status };
        });

        setRooms(roomsWithStatus);

        // Load Today's Arrivals
        const arrivalResults = await db.select<BookingEntry[]>(`
          SELECT b.id, b.guest_id, g.name as guest_name, b.room_id, r.name as room_name, b.status, b.start_date as date, b.estimated_arrival_time
          FROM bookings b
          JOIN guests g ON b.guest_id = g.id
          LEFT JOIN rooms r ON b.room_id = r.id
          WHERE b.start_date = ?
        `, [today]);

        if (arrivalResults) {
          const sorted = [...arrivalResults].sort((a, b) => {
            const aVal = a.status === "Checked-In" || a.status === "Checked-Out" || a.status === "Storniert" ? 1 : 0;
            const bVal = b.status === "Checked-In" || b.status === "Checked-Out" || b.status === "Storniert" ? 1 : 0;
            return aVal - bVal;
          });
          setArrivals(sorted);
        }

        // Load Today's Departures
        const departureResults = await db.select<BookingEntry[]>(`
          SELECT b.id, b.guest_id, g.name as guest_name, b.room_id, r.name as room_name, b.status, b.end_date as date
          FROM bookings b
          JOIN guests g ON b.guest_id = g.id
          LEFT JOIN rooms r ON b.room_id = r.id
          WHERE b.end_date = ?
        `, [today]);

        if (departureResults) {
          // Sort Departures: Not yet checked out first
          const sorted = [...departureResults].sort((a, b) => {
            const aVal = a.status === "Checked-Out" || a.status === "Storniert" ? 1 : 0;
            const bVal = b.status === "Checked-Out" || b.status === "Storniert" ? 1 : 0;
            return aVal - bVal;
          });
          setDepartures(sorted);
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [today]);

  const handleQuickCheckIn = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingCheckIn({ id, name });
    setCheckInConfirmOpen(true);
  };

  const confirmCheckIn = async () => {
    if (!pendingCheckIn) return;
    setIsProcessing(true);

    try {
      const db = await initDb();
      if (db) {
        await db.execute("UPDATE bookings SET status = 'Checked-In' WHERE id = ?", [pendingCheckIn.id]);

        // Trigger Confetti!
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b']
        });

        await loadData(db);
        setRefreshKey(prev => prev + 1);
        setCheckInConfirmOpen(false);
        setPendingCheckIn(null);
      }
    } catch (error) {
      console.error("Failed to perform check-in:", error);
      alert("Fehler beim Check-In. Bitte versuchen Sie es erneut.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickCheckOut = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/buchungen?checkout=${id}`);
  };

  const getRoomIcon = (type: string) => {
    const iconClass = "w-5 h-5 text-zinc-500";
    switch (type) {
      case "Einzelzimmer": return <Bed className={iconClass} />;
      case "Doppelzimmer": return <BedDouble className={iconClass} />;
      case "2 Einzelbetten": return <Users className={iconClass} />;
      case "3 Einzelbetten": return <Users className={iconClass} />;
      case "Ferienwohnung": return <HomeIcon className={iconClass} />;
      default: return <BedDouble className={iconClass} />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-zinc-50">Guten Morgen!</h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Hier ist die Übersicht für heute, den {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
          </p>
        </div>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Mein Tag</h3>
          <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <MyDayWidget refreshTrigger={refreshKey} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Arrivals Widget */}
        <Card className="border-none shadow-sm dark:bg-zinc-900/50 overflow-hidden">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-zinc-900 dark:text-zinc-100">Heutige Anreisen</CardTitle>
                <CardDescription className="text-xs">Alle Gäste, die für heute erwartet werden</CardDescription>
              </div>
              <Link href="/buchungen?filter=checkin">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-blue-600">
                  Alle <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {arrivals.length === 0 ? (
                <div className="p-8 text-center">
                  <User className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                  <div className="text-sm text-zinc-400 italic">
                    Keine Anreisen für heute gefunden.
                  </div>
                </div>
              ) : (
                arrivals.map((arrival) => (
                  <div
                    key={arrival.id}
                    className="p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors flex items-center justify-between group cursor-pointer"
                    onClick={() => router.push(`/buchungen?edit=${arrival.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border",
                        (arrival.status === "Checked-In" || arrival.status === "Checked-Out")
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800/30"
                          : arrival.status === "Draft"
                            ? "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800/30"
                            : arrival.status === "Storniert"
                              ? "bg-zinc-50 border-zinc-200 text-zinc-400 dark:bg-zinc-800/50 dark:border-zinc-700"
                              : "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800/30"
                      )}>
                        {(arrival.status === "Checked-In" || arrival.status === "Checked-Out")
                          ? <CheckCircle2 className="w-5 h-5" />
                          : arrival.status === "Draft"
                            ? <AlertTriangle className="w-5 h-5" />
                            : arrival.status === "Storniert"
                              ? <XCircle className="w-5 h-5" />
                              : <LogIn className="w-5 h-5" />}
                      </div>
                      <div className={cn(arrival.status === "Storniert" && "opacity-50")}>
                        <div
                          className={cn(
                            "font-bold text-zinc-900 dark:text-zinc-100",
                            arrival.status === "Storniert" && "line-through text-zinc-400"
                          )}
                        >
                          {arrival.guest_name}
                        </div>
                        <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <BedDouble className="w-3 h-3" /> {arrival.room_name || `Zimmer ${arrival.room_id}`}
                          {arrival.estimated_arrival_time ? (
                            <>
                              <span className="w-1 h-1 rounded-full bg-zinc-300 mx-1" />
                              <span className={cn(
                                "font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/50 flex items-center gap-1",
                                arrival.status === "Storniert" ? "text-zinc-400 border-zinc-200 bg-zinc-50" : "text-blue-600"
                              )}>
                                {arrival.status !== "Storniert" && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                                {arrival.estimated_arrival_time} Uhr
                              </span>
                            </>
                          ) : (
                            arrival.status === "Hard-Booked" && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-zinc-300 mx-1" />
                                <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Zeit fehlt!
                                </span>
                              </>
                            )
                          )}
                          <span className="w-1 h-1 rounded-full bg-zinc-300 mx-1" />
                          <span className={cn(
                            "font-medium",
                            (arrival.status === "Checked-In" || arrival.status === "Checked-Out") ? "text-emerald-600" :
                              arrival.status === "Draft" ? "text-amber-600" :
                                arrival.status === "Storniert" ? "text-red-600 dark:text-red-400" :
                                  "text-blue-600"
                          )}>
                            {arrival.status === "Checked-In" ? "Eingecheckt" :
                              arrival.status === "Checked-Out" ? "Abgereist" :
                                arrival.status === "Draft" ? "Entwurf - Nicht final!" :
                                  arrival.status === "Storniert" ? "Storniert" :
                                    "Noch nicht eingecheckt"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {arrival.status === "Hard-Booked" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-[10px] font-bold"
                          onClick={(e) => handleQuickCheckIn(e, arrival.id, arrival.guest_name)}
                        >
                          Check-In
                        </Button>
                      )}
                      {arrival.status === "Draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-amber-200 text-amber-600 hover:bg-amber-50 text-[10px] font-bold"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/buchungen?edit=${arrival.id}`);
                          }}
                        >
                          Vervollständigen
                        </Button>
                      )}
                    </div>
                  </div>

                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Departures Widget */}
        <Card className="border-none shadow-sm dark:bg-zinc-900/50 overflow-hidden">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-zinc-900 dark:text-zinc-100">Heutige Abreisen</CardTitle>
                <CardDescription className="text-xs">Gäste, die heute auschecken</CardDescription>
              </div>
              <Link href="/buchungen?filter=checkout">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-amber-600">
                  Alle <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {departures.length === 0 ? (
                <div className="p-8 text-center">
                  <User className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                  <div className="text-sm text-zinc-400 italic">
                    Keine Abreisen für heute gefunden.
                  </div>
                </div>
              ) : (
                departures.map((departure) => (
                  <div
                    key={departure.id}
                    className="p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors flex items-center justify-between group cursor-pointer"
                    onClick={() => router.push(`/buchungen?edit=${departure.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border",
                        departure.status === "Checked-Out"
                          ? "bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-800/50 dark:border-zinc-700"
                          : departure.status === "Storniert"
                            ? "bg-zinc-50 border-zinc-200 text-zinc-400 dark:bg-zinc-800/50 dark:border-zinc-700"
                            : "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800/30"
                      )}>
                        {departure.status === "Checked-Out"
                          ? <CheckCircle2 className="w-5 h-5" />
                          : departure.status === "Storniert"
                            ? <XCircle className="w-5 h-5" />
                            : <LogOut className="w-5 h-5" />}
                      </div>
                      <div className={cn(departure.status === "Storniert" && "opacity-50")}>
                        <div
                          className={cn(
                            "font-bold text-zinc-900 dark:text-zinc-100",
                            departure.status === "Storniert" && "line-through text-zinc-400"
                          )}
                        >
                          {departure.guest_name}
                        </div>
                        <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <BedDouble className="w-3 h-3" /> {departure.room_name || `Zimmer ${departure.room_id}`}
                          <span className="w-1 h-1 rounded-full bg-zinc-300 mx-1" />
                          <span className={cn(
                            "font-medium",
                            departure.status === "Checked-Out" ? "text-zinc-400" :
                              departure.status === "Storniert" ? "text-red-600 dark:text-red-400" :
                                "text-amber-600"
                          )}>
                            {departure.status === "Checked-Out" ? "Bereits ausgecheckt" :
                              departure.status === "Storniert" ? "Storniert" :
                                "Noch im Haus"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {departure.status === "Checked-In" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-amber-200 text-amber-600 hover:bg-amber-50 text-[10px] font-bold"
                          onClick={(e) => handleQuickCheckOut(e, departure.id)}
                        >
                          Check-Out
                        </Button>
                      )}
                    </div>
                  </div>

                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Room Overview Widget - Full Width on LG if needed, or keeping grid */}
        <Card className="border-none shadow-sm dark:bg-zinc-900/50 overflow-hidden lg:col-span-2">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-base text-zinc-900 dark:text-zinc-100">Zimmerübersicht</CardTitle>
            <CardDescription className="text-xs">Aktueller Status aller Einheiten</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-x divide-y divide-zinc-100 dark:divide-zinc-800 text-center">
              {rooms.length === 0 ? (
                <div className="p-8 text-center col-span-full">
                  <div className="text-sm text-zinc-500 italic">
                    {isDbReady ? "Keine Zimmer angelegt." : "Wird geladen..."}
                  </div>
                </div>
              ) : (
                rooms.map((room) => (
                  <div key={room.id} className="p-4 flex flex-col items-center justify-center gap-2 border-r border-b">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      {getRoomIcon(room.type)}
                    </div>
                    <span className="font-bold text-sm">{room.name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] border-none px-2 py-0 font-bold",
                        room.status === "Frei" ? "bg-emerald-50 text-emerald-700" :
                          room.status === "Wird heute belegt" ? "bg-blue-50 text-blue-700" :
                            room.status === "Eingecheckt" ? "bg-indigo-50 text-indigo-700" :
                              room.status === "Wird heute frei" ? "bg-amber-50 text-amber-700" :
                                "bg-zinc-50 text-zinc-500"
                      )}
                    >
                      {room.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={checkInConfirmOpen} onOpenChange={setCheckInConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <LogIn className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Check-In bestätigen
            </DialogTitle>
            <DialogDescription className="pt-2">
              Möchten Sie den Check-In für <span className="font-bold text-zinc-900 dark:text-zinc-100">{pendingCheckIn?.name}</span> wirklich jetzt durchführen?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCheckInConfirmOpen(false)}
              disabled={isProcessing}
            >
              Abbrechen
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={confirmCheckIn}
              disabled={isProcessing}
            >
              {isProcessing ? "Verarbeite..." : "Jetzt einchecken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
