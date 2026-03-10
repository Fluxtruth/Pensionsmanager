"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Delete, X, KeySquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinEntryProps {
    onSuccess: () => void;
    correctPin: string;
    onCancel?: () => void;
    onSwitchToPassword?: () => void;
    title?: string;
    description?: string;
}

export function PinEntry({ onSuccess, correctPin, onCancel, onSwitchToPassword, title = "App gesperrt", description = "Bitte geben Sie Ihre PIN ein" }: PinEntryProps) {
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    const handleNumberClick = (num: string) => {
        if (pin.length < 8) {
            setPin(prev => prev + num);
            setError(false);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    useEffect(() => {
        if (pin.length >= correctPin.length && pin === correctPin) {
            setIsChecking(true);
            setTimeout(() => {
                onSuccess();
            }, 300);
        } else if (pin.length >= correctPin.length && pin !== correctPin) {
            setError(true);
            setTimeout(() => {
                setPin("");
            }, 500);
        }
    }, [pin, correctPin, onSuccess]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-100/80 backdrop-blur-md animate-in fade-in duration-500">
            <Card className="w-full max-w-sm mx-4 bg-white border-zinc-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden rounded-2xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-zinc-900 text-xl font-bold">{title}</CardTitle>
                    <CardDescription className="text-zinc-500">{description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-4 pb-8">
                    {/* PIN Display Dots */}
                    <div className="flex justify-center gap-4">
                        {[...Array(correctPin.length)].map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-4 h-4 rounded-full border-2 transition-all duration-200",
                                    pin.length > i 
                                        ? "bg-blue-600 border-blue-600 scale-110 shadow-[0_0_10px_rgba(37,99,235,0.3)]" 
                                        : "border-zinc-200 bg-white",
                                    error && "border-red-500 bg-red-500 animate-bounce"
                                )}
                            />
                        ))}
                    </div>

                    {/* Numeric Keypad */}
                    <div className="grid grid-cols-3 gap-3 px-4">
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                            <Button
                                key={num}
                                variant="outline"
                                className="h-16 text-xl font-bold bg-zinc-50 border-zinc-100 text-zinc-900 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all hover:shadow-lg rounded-xl"
                                onClick={() => handleNumberClick(num)}
                            >
                                {num}
                            </Button>
                        ))}
                        <div />
                        <Button
                            variant="outline"
                            className="h-16 text-xl font-bold bg-zinc-50 border-zinc-100 text-zinc-900 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all hover:shadow-lg rounded-xl"
                            onClick={() => handleNumberClick("0")}
                        >
                            0
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-16 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
                            onClick={handleDelete}
                        >
                            <Delete className="w-6 h-6" />
                        </Button>
                    </div>

                    {onSwitchToPassword && (
                        <div className="pt-2 px-4 text-center">
                            <Button 
                                variant="ghost" 
                                className="w-full h-12 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 gap-3 text-sm transition-all duration-500 group rounded-xl"
                                onClick={onSwitchToPassword}
                            >
                                <KeySquare className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />
                                Mit Passwort anmelden
                            </Button>
                        </div>
                    )}

                    {onCancel && (
                        <div className="text-center pt-4">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={onCancel}
                                className="text-zinc-400 hover:text-zinc-600 hover:bg-transparent text-[10px] uppercase tracking-[0.2em] font-black transition-colors"
                            >
                                Abbrechen
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
