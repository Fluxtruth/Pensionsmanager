"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Download, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export interface UpdateInfo {
    version: string;
    body?: string;
}

export type UpdateState = "idle" | "checking" | "available" | "downloading" | "installing" | "ready" | "error" | "uptodate";

interface UpdateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    updateInfo: UpdateInfo | null;
    state: UpdateState;
    progress: number;
    error: string | null;
    onInstall: () => void;
    onCheck: () => void;
}

export function UpdateDialog({
    isOpen,
    onClose,
    updateInfo,
    state,
    progress,
    error,
    onInstall,
    onCheck
}: UpdateDialogProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const renderContent = () => {
        switch (state) {
            case "checking":
                return (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4">
                        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-zinc-600 dark:text-zinc-400">Suche nach Updates...</p>
                    </div>
                );
            case "available":
                return (
                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Version {updateInfo?.version} verfügbar
                            </h3>
                            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 max-h-40 overflow-y-auto">
                                <div className="prose prose-sm dark:prose-invert">
                                    {updateInfo?.body || "Keine Release-Notes verfügbar."}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="ghost" onClick={onClose}>Später</Button>
                            <Button onClick={onInstall}>Jetzt aktualisieren</Button>
                        </div>
                    </div>
                );
            case "downloading":
            case "installing":
                return (
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span>{state === "downloading" ? "Download..." : "Installation..."}</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                        <p className="text-xs text-center text-zinc-500">
                            Bitte schließe die Anwendung nicht während des Updates.
                        </p>
                    </div>
                );
            case "ready":
                return (
                    <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Update erfolgreich!</h3>
                            <p className="text-zinc-500">Die Anwendung muss neu gestartet werden, um das Update abzuschließen.</p>
                        </div>
                        <Button onClick={() => window.location.reload()} className="w-full">Jetzt neu starten</Button>
                    </div>
                );
            case "uptodate":
                return (
                    <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-blue-600 dark:text-blue-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Alles aktuell!</h3>
                            <p className="text-zinc-500 text-sm">Du nutzt bereits die neueste Version des Pensionsmanagers.</p>
                        </div>
                        <Button onClick={onClose} variant="secondary" className="w-full">Schließen</Button>
                    </div>
                );
            case "error":
                return (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                        <div className="space-y-2">
                            <h3 className="font-bold text-red-600">Fehler beim Update</h3>
                            <p className="text-sm text-zinc-500">{error || "Ein unbekannter Fehler ist aufgetreten."}</p>
                        </div>
                        <div className="flex w-full gap-2 mt-4">
                            <Button variant="outline" onClick={onClose} className="flex-1">Abbrechen</Button>
                            <Button onClick={onCheck} className="flex-1">Erneut versuchen</Button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <RefreshCw className={cn("w-4 h-4", state === "checking" && "animate-spin")} />
                        Software Update
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={state === "downloading" || state === "installing"}
                        className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>,
        document.body
    );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
    return classes.filter(Boolean).join(" ");
}
