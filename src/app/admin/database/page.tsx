"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Database,
    RefreshCw,
    ShieldCheck,
    FileText,
    Download,
    CheckCircle2,
    AlertCircle,
    Clock,
    Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { initDb } from "@/lib/db";
import { SyncService } from "@/lib/sync";

export default function DatabasePage() {
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [syncStatus, setSyncStatus] = useState<"success" | "warning" | "error">("success");
    const [pensionName, setPensionName] = useState("Pensionsmanager");
    const [loading, setLoading] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);

    const syncService = SyncService.getInstance();

    const refreshSyncStatus = async () => {
        const time = await syncService.getLastSyncTime();
        if (time) {
            setLastSync(new Date(time).toLocaleString('de-DE'));
        }
        const count = await syncService.getPendingCount();
        setPendingCount(count);
        setSyncStatus(count > 0 ? "warning" : "success");
    };

    useEffect(() => {
        const loadSettings = async () => {
            const db = await initDb();
            if (db) {
                const titleRes = await db.select<{ value: string }[]>("SELECT value FROM settings WHERE key = ?", ["branding_title"]);
                if (titleRes.length > 0) setPensionName(titleRes[0].value);
            }
            await refreshSyncStatus();
        };
        loadSettings();
    }, []);

    const handleManualSync = async () => {
        setLoading(true);
        setSyncMessage(null);
        try {
            const result = await syncService.performSync();
            if (result.success) {
                setSyncMessage("Synchronisation erfolgreich!");
                await refreshSyncStatus();
            } else {
                setSyncStatus("error");
                setSyncMessage(`Fehler: ${result.error}`);
            }
        } catch (error) {
            setSyncStatus("error");
            setSyncMessage("Verbindung zum Server fehlgeschlagen.");
        } finally {
            setLoading(false);
            // Hide message after 5 seconds
            setTimeout(() => setSyncMessage(null), 5000);
        }
    };

    const handleLegalClick = (url: string) => {
        if (typeof window !== 'undefined') {
            window.open(url, '_blank');
        }
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 overflow-y-auto h-screen">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Datenbank & Datensicherheit</h2>
                    <p className="text-muted-foreground">
                        Verwalten Sie Ihren Cloud-Sync Status und greifen Sie auf Compliance-Dokumente zu.
                    </p>
                </div>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Sync Status Card */}
                <Card className="col-span-2 shadow-sm border-zinc-200 dark:border-zinc-800">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    syncStatus === "success" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                        syncStatus === "warning" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                )}>
                                    <Database className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle>Cloud-Backup Status</CardTitle>
                                    <CardDescription>Datenabgleich zwischen lokaler DB und Supabase.</CardDescription>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={handleManualSync}
                                disabled={loading}
                            >
                                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                                Synchronisieren
                            </Button>
                        </div>
                        {syncMessage && (
                            <div className={cn(
                                "mt-4 flex items-center gap-2 p-2 rounded text-xs animate-in fade-in slide-in-from-top-1",
                                syncStatus === "error" ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                            )}>
                                {syncStatus === "error" ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                {syncMessage}
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-1 uppercase tracking-wider">
                                    <Clock className="w-3 h-3" />
                                    Letzter Backup
                                </div>
                                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                    {lastSync || "Noch nie"}
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-1 uppercase tracking-wider">
                                    <RefreshCw className={cn("w-3 h-3", pendingCount > 0 && "text-orange-500")} />
                                    Ausstehend
                                </div>
                                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                    {pendingCount} Änderungen
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-1 uppercase tracking-wider">
                                    <ShieldCheck className="w-3 h-3 text-blue-500" />
                                    Verschlüsselung
                                </div>
                                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                    AES-GCM (Lokal)
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-1 uppercase tracking-wider">
                                    <Database className="w-3 h-3" />
                                    DB Engine
                                </div>
                                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                    SQLite (Local)
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800 text-sm flex gap-3">
                            <Lock className="w-5 h-5 flex-shrink-0 text-zinc-400" />
                            <div>
                                <p className="font-semibold mb-1">Datensparsamkeit & Souveränität</p>
                                <p className="text-zinc-500">
                                    Diese App speichert alle sensiblen Daten primär auf Ihrem Gerät. Der Cloud-Sync dient lediglich dem Backup und der Wiederherstellung auf anderen Geräten.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Compliance / Legal Section */}
                <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ShieldCheck className="w-5 h-5 text-blue-500" />
                            GDPR / DSGVO
                        </CardTitle>
                        <CardDescription>Ihre lokal signierten Dokumente.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-1">
                        <div
                            onClick={() => handleLegalClick("/compliance/dpa.pdf")}
                            className="group flex items-center justify-between p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-blue-600 dark:text-blue-400">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium underline-offset-4 group-hover:underline">AV-Vertrag (DPA)</div>
                                    <div className="text-[10px] text-zinc-400">Lokal signierte Version</div>
                                </div>
                            </div>
                            <Download className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500" />
                        </div>

                        <div
                            onClick={() => handleLegalClick("/compliance/tia.pdf")}
                            className="group flex items-center justify-between p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-zinc-50 dark:bg-zinc-800 p-2 rounded text-zinc-600 dark:text-zinc-400">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium underline-offset-4 group-hover:underline">TIA Bewertung</div>
                                    <div className="text-[10px] text-zinc-400">Lokal signierte Version</div>
                                </div>
                            </div>
                            <Download className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500" />
                        </div>

                        <div className="pt-2">
                            <p className="text-[10px] text-zinc-400 leading-tight">
                                <strong>Anleitung:</strong> Ersetzen Sie die Platzhalter unter <code>public/compliance/</code> durch Ihre signierten PDF-Versionen.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Disclaimer */}
            <div className="mt-8 p-4 text-center">
                <p className="text-xs text-zinc-400 max-w-2xl mx-auto">
                    Diese Anwendung nutzt modernste Verschlüsselungstechnologien (AES-GCM), um die Anforderungen der DSGVO zu übertreffen. Daten verlassen Ihren PC nur in verschlüsselter Form.
                </p>
            </div>
        </div>
    );
}
