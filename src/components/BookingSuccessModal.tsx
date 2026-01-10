"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Calendar, User, Home, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BookingSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingData: {
        guestName: string;
        roomName: string;
        startDate: string;
        endDate: string;
        price?: number;
        guestCount: number;
        childCount: number;
        extraBedCount: number;
        dogCount: number;
        occasion: string; // Booking Type
        stayType: string; // Stay Type
        arrivalTime: string;
        isAllergyFriendly?: boolean;
        hasMobilityImpairment?: boolean;
        hasDog?: boolean;
    } | null;
}

export function BookingSuccessModal({ isOpen, onClose, bookingData }: BookingSuccessModalProps) {
    useEffect(() => {
        if (isOpen) {
            // Trigger confetti
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

            const randomInRange = (min: number, max: number) => {
                return Math.random() * (max - min) + min;
            };

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                });
            }, 250);

            const shoot = () => {
                confetti({
                    ...defaults,
                    particleCount: 40,
                    scalar: 1.2,
                    shapes: ['star']
                });

                confetti({
                    ...defaults,
                    particleCount: 10,
                    scalar: 0.75,
                    shapes: ['circle']
                });
            };

            setTimeout(shoot, 0);
            setTimeout(shoot, 100);
            setTimeout(shoot, 200);

            return () => clearInterval(interval);
        }
    }, [isOpen]);

    if (!bookingData) return null;

    const startDate = new Date(bookingData.startDate).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
    const endDate = new Date(bookingData.endDate).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    // Calculate nights
    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));


    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-md border-0 shadow-2xl overflow-hidden p-0 gap-0">
                <div className="bg-emerald-600 h-24 flex items-center justify-center relative overflow-hidden shrink-0">
                    <div className="absolute top-[-20%] left-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

                    <div className="bg-white p-3 rounded-full shadow-lg relative z-10 animate-in zoom-in duration-500">
                        <Check className="w-8 h-8 text-emerald-600" strokeWidth={4} />
                    </div>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <DialogHeader className="mb-6 text-center">
                        <DialogTitle className="text-2xl font-black text-center text-zinc-900">Buchung erfolgreich!</DialogTitle>
                        <p className="text-zinc-500 text-sm">Die Buchung wurde verbindlich im System angelegt.</p>
                    </DialogHeader>

                    <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100 space-y-4">
                        {/* Section 1: Main Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-zinc-400 mt-0.5 shrink-0" />
                                <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Gast</div>
                                    <div className="font-bold text-zinc-900 text-sm">{bookingData.guestName}</div>
                                    <div className="text-xs text-zinc-500">{bookingData.guestCount} {bookingData.guestCount === 1 ? "Person" : "Personen"}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-zinc-400 mt-0.5 shrink-0" />
                                <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Zeitraum</div>
                                    <div className="font-bold text-zinc-900 text-sm">{startDate} - {endDate}</div>
                                    <div className="text-xs text-zinc-500">{nights} {nights === 1 ? "Nacht" : "Nächte"}</div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-zinc-200"></div>

                        {/* Section 2: Room & Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <Home className="w-5 h-5 text-zinc-400 mt-0.5 shrink-0" />
                                <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Zimmer</div>
                                    <div className="font-bold text-zinc-900 text-sm">{bookingData.roomName}</div>
                                    <div className="flex gap-1 mt-1.5 flex-wrap">
                                        {bookingData.isAllergyFriendly && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[9px] h-4 px-1 rounded hover:bg-emerald-100 border-none">Allergiker</Badge>}
                                        {bookingData.hasMobilityImpairment && <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[9px] h-4 px-1 rounded hover:bg-blue-100 border-none">Barrierefrei</Badge>}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Typ</div>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="text-xs bg-white text-zinc-700 font-normal">{bookingData.occasion}</Badge>
                                        <Badge variant="outline" className="text-xs bg-white text-zinc-700 font-normal capitalize">{bookingData.stayType}</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-zinc-200"></div>

                        {/* Section 3: Details (Kids, Dogs, Extra Beds, Arrival) */}
                        <div className="grid grid-cols-4 gap-2">
                            <div className="text-center p-2 bg-white rounded-lg border border-zinc-100">
                                <div className="text-[9px] font-bold text-zinc-400 uppercase truncate">Kinder</div>
                                <div className="font-bold text-zinc-900">{bookingData.childCount}</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg border border-zinc-100">
                                <div className="text-[9px] font-bold text-zinc-400 uppercase truncate">Hunde</div>
                                <div className="font-bold text-zinc-900">{bookingData.dogCount}</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg border border-zinc-100">
                                <div className="text-[9px] font-bold text-zinc-400 uppercase truncate">Aufbett.</div>
                                <div className="font-bold text-zinc-900">{bookingData.extraBedCount}</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg border border-zinc-100">
                                <div className="text-[9px] font-bold text-zinc-400 uppercase truncate">Ankunft</div>
                                <div className="font-bold text-zinc-900">{bookingData.arrivalTime || "--:--"}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-0 sm:justify-center">
                    <Button className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 font-bold text-white shadow-lg" onClick={onClose}>
                        Fertig
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
