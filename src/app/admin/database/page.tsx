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
    Lock,
    Server,
    Cloud,
    Trash2,
    History,
    Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { initDb } from "@/lib/db";
import { SyncService, Backup, ConnectedDevice } from "@/lib/sync";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function DatabasePage() {
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [syncStatus, setSyncStatus] = useState<"success" | "warning" | "error">("success");
    const [pensionName, setPensionName] = useState("Pensionsmanager");
    const [loading, setLoading] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [syncMessage, setSyncMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);
    const [pensionId, setPensionId] = useState<string | null>(null);
    const [shortPensionId, setShortPensionId] = useState<string | null>(null);
    const [localDbStatus, setLocalDbStatus] = useState<"online" | "offline">("offline");
    const [cloudDbStatus, setCloudDbStatus] = useState<"online" | "offline">("offline");
    const [isAutoSync, setIsAutoSync] = useState(false);
    const [backups, setBackups] = useState<Backup[]>([]);
    const [backupLoading, setBackupLoading] = useState(false);
    const [newBackupName, setNewBackupName] = useState("");
    const [lastRestoredBackupInfo, setLastRestoredBackupInfo] = useState<{ id: string, name: string, date: string } | null>(null);
    const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
    const [pendingDetails, setPendingDetails] = useState<{table: string, count: number}[]>([]);

    const [devices, setDevices] = useState<ConnectedDevice[]>([]);
    const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
    const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<ConnectedDevice | null>(null);


    const syncService = SyncService.getInstance();

    const refreshSyncStatus = async () => {
        const time = await syncService.getLastSyncTime();
        if (time) {
            setLastSync(new Date(time).toLocaleString('de-DE'));
        }
        const count = await syncService.getPendingCount();
        setPendingCount(count);
        setSyncStatus(count > 0 ? "warning" : "success");

        const details = await syncService.getPendingDetails();
        setPendingDetails(details);

        // Status update
        const localDb = await initDb();
        setLocalDbStatus(localDb ? "online" : "offline");
        
        const isCloudOnline = await syncService.getCloudStatus();
        setCloudDbStatus(isCloudOnline ? "online" : "offline");

        const id = await syncService.getPensionId();
        setPensionId(id);

        const shortId = await syncService.getShortPensionId();
        setShortPensionId(shortId);

        const backupList = await syncService.listBackups();
        setBackups(backupList);

        const lastRestored = await syncService.getLastRestoredBackup();
        setLastRestoredBackupInfo(lastRestored);

        setIsAutoSync(syncService.isAutoSyncActive());
        
        const devList = await syncService.getConnectedDevices();
        setDevices(devList);
        setCurrentDeviceId(syncService.getCurrentDeviceId());
    };

    useEffect(() => {
        let isSubscribed = true;
        let pollInterval: NodeJS.Timeout;

        const loadSettings = async () => {
            // Ensure device is registered immediately
            await syncService.registerCurrentDevice().catch(console.error);

            // Start Auto-Sync automatically if not already active
            if (!syncService.isAutoSyncActive()) {
                syncService.startAutoSync(async (result) => {
                    if (!isSubscribed) return;
                    if (!result.success) {
                        setSyncMessage({ text: `Auto-Sync Fehler: ${result.error}`, type: "error" });
                    }
                    await refreshSyncStatus();
                });
            }

            const db = await initDb();
            if (db) {
                const titleRes = await db.select<{ value: string }[]>("SELECT value FROM settings WHERE key = ?", ["branding_title"]);
                if (titleRes.length > 0 && isSubscribed) setPensionName(titleRes[0].value);
            }
            if (isSubscribed) await refreshSyncStatus();

            // Setup polling to update UI if background sync changes the data
            pollInterval = setInterval(async () => {
                if (isSubscribed) {
                    await refreshSyncStatus();
                }
            }, 30000); // 30 seconds
        };
        loadSettings();

        return () => {
            isSubscribed = false;
            if (pollInterval) clearInterval(pollInterval);
        };
    }, []);

    const handleCreateBackup = async () => {
        if (!newBackupName.trim()) return;
        setBackupLoading(true);
        try {
            const result = await syncService.createBackup(newBackupName);
            if (result.success) {
                setSyncMessage({ text: "Backup erfolgreich erstellt!", type: "success" });
                setNewBackupName("");
                await refreshSyncStatus();
            } else {
                setSyncMessage({ text: `Backup-Fehler: ${result.error}`, type: "error" });
            }
        } catch (error) {
            setSyncMessage({ text: "Backup-Fehler", type: "error" });
        } finally {
            setBackupLoading(false);
            setTimeout(() => setSyncMessage(null), 5000);
        }
    };

    const handleRestore = async (id: string, name: string) => {
        setSelectedBackup(backups.find(b => b.id === id) || null);
        setIsRestoreDialogOpen(true);
    };

    const confirmRestore = async () => {
        if (!selectedBackup) return;
        setIsRestoreDialogOpen(false);
        setBackupLoading(true);
        try {
            const result = await syncService.restoreBackup(selectedBackup.id);
            if (result.success) {
                setSyncMessage({ text: "Wiederherstellung erfolgreich!", type: "success" });
                await refreshSyncStatus();
                // Reload page to ensure all components see the new data
                setTimeout(() => window.location.reload(), 1000);
            } else {
                setSyncMessage({ text: `Wiederherstellungs-Fehler: ${result.error}`, type: "error" });
            }
        } catch (error) {
            setSyncMessage({ text: "Wiederherstellungs-Fehler", type: "error" });
        } finally {
            setBackupLoading(false);
            setTimeout(() => setSyncMessage(null), 5000);
        }
    };

    const handleDeleteBackup = async (id: string, name: string) => {
        setSelectedBackup(backups.find(b => b.id === id) || null);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedBackup) return;
        setIsDeleteDialogOpen(false);
        setBackupLoading(true);
        try {
            const result = await syncService.deleteBackup(selectedBackup.id);
            if (result.success) {
                setSyncMessage({ text: "Backup gelöscht.", type: "success" });
                await refreshSyncStatus();
            } else {
                setSyncMessage({ text: `Fehler beim Löschen: ${result.error}`, type: "error" });
            }
        } catch (error) {
            setSyncMessage({ text: "Fehler beim Löschen", type: "error" });
        } finally {
            setBackupLoading(false);
            setTimeout(() => setSyncMessage(null), 5000);
        }
    };

    const handleRevokeDevice = (device: ConnectedDevice) => {
        setSelectedDevice(device);
        setIsRevokeDialogOpen(true);
    };

    const confirmRevokeDevice = async () => {
        if (!selectedDevice) return;
        setIsRevokeDialogOpen(false);
        setLoading(true);
        try {
            const result = await syncService.revokeDevice(selectedDevice.device_id);
            if (result.success) {
                setSyncMessage({ text: "Gerät erfolgreich abgemeldet.", type: "success" });
                await refreshSyncStatus();
            } else {
                setSyncMessage({ text: `Fehler beim Abmelden: ${result.error}`, type: "error" });
            }
        } catch (error) {
            setSyncMessage({ text: "Fehler beim Abmelden", type: "error" });
        } finally {
            setLoading(false);
            setTimeout(() => setSyncMessage(null), 5000);
        }
    };

    const handleSetLeadingDatabase = async () => {
        setLoading(true);
        try {
            const result = await syncService.setAsLeadingDatabase();
            if (result.success) {
                setSyncMessage({ text: "Gerät als führende Datenbank festgelegt.", type: "success" });
                await refreshSyncStatus();
            } else {
                setSyncMessage({ text: `Fehler: ${result.error}`, type: "error" });
            }
        } catch (error) {
            setSyncMessage({ text: "Ein unerwarteter Fehler ist aufgetreten.", type: "error" });
        } finally {
            setLoading(false);
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
                                    <Cloud className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle>Synchronisations-Status</CardTitle>
                                    <CardDescription>Automatische Sicherung zwischen Ihrem Gerät und unserer sicheren Cloud, betrieben am Standort Frankfurt (Main).</CardDescription>
                                </div>
                            </div>
                        </div>
                        {syncMessage && (
                            <div className={cn(
                                "mt-4 flex items-center gap-2 p-2 rounded text-xs animate-in fade-in slide-in-from-top-1",
                                syncMessage.type === "error" ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                            )}>
                                {syncMessage.type === "error" ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                {syncMessage.text}
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
                                {lastRestoredBackupInfo && (
                                    <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                        <div className="text-[10px] text-zinc-400 uppercase tracking-tight">Wiederhergestellt:</div>
                                        <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400 truncate">
                                            {lastRestoredBackupInfo.name} ({new Date(lastRestoredBackupInfo.date).toLocaleDateString()})
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <div className="flex items-center justify-between gap-2 text-zinc-500 text-xs font-medium mb-1 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <RefreshCw className={cn("w-3 h-3", pendingCount > 0 && "text-orange-500")} />
                                        Ausstehend
                                    </div>
                                    {syncService.isAutoSyncActive() && (
                                        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 capitalize normal-case text-[10px]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            Auto-Sync
                                        </div>
                                    )}
                                </div>
                                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex flex-col">
                                    <span>{pendingCount} Änderung{pendingCount !== 1 ? 'en' : ''}</span>
                                    {pendingDetails.length > 0 && (
                                        <span className="mt-1 text-[10px] text-zinc-500 font-normal truncate max-w-[120px] sm:max-w-[200px]" title={pendingDetails.map(d => `${d.table} (${d.count})`).join(', ')}>
                                            {pendingDetails.map(d => `${d.table} (${d.count})`).join(', ')}
                                        </span>
                                    )}
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
                                    <Cloud className={cn("w-3 h-3", cloudDbStatus === "online" ? "text-green-500" : "text-red-500")} />
                                    Cloud DB
                                </div>
                                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                    Status: {cloudDbStatus === "online" ? "Online" : "Offline"}
                                    {cloudDbStatus === "online" ? (
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                    )}
                                </div>
                                <div className="text-sm font-medium mt-1 text-zinc-600 dark:text-zinc-400">
                                    Pensions-ID: <span className="font-bold text-zinc-900 dark:text-zinc-100">{shortPensionId || "Lädt..."}</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-1 uppercase tracking-wider">
                                    <Server className={cn("w-3 h-3", localDbStatus === "online" ? "text-green-500" : "text-red-500")} />
                                    Local DB Engine
                                </div>
                                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                    SQLite (Local) 
                                    {localDbStatus === "online" && (
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                    )}
                                </div>
                                {devices.find(d => d.is_leading_db && d.status === 'active')?.device_id === currentDeviceId && (
                                    <div className="text-[10px] mt-1 text-blue-600 dark:text-blue-400 font-medium">Führende Datenbank ✅</div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800 text-sm flex gap-3">
                            <Lock className="w-5 h-5 flex-shrink-0 text-zinc-400" />
                            <div className="flex-1">
                                <p className="font-semibold mb-1">Datensparsamkeit & Souveränität</p>
                                <p className="text-zinc-500">
                                    Diese App speichert alle sensiblen Daten primär auf Ihrem Gerät. Der Cloud-Sync dient lediglich dem Backup und der Wiederherstellung auf anderen Geräten.
                                </p>
                            </div>

                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <History className="w-5 h-5 text-zinc-500" />
                                    Backups & Wiederherstellung
                                </h3>
                            </div>

                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Backup Name (z.B. Stand vor Update)" 
                                    value={newBackupName}
                                    onChange={(e) => setNewBackupName(e.target.value)}
                                    className="max-w-sm"
                                />
                                <Button 
                                    disabled={backupLoading || !newBackupName.trim()} 
                                    onClick={handleCreateBackup}
                                    className="gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Sicherung erstellen
                                </Button>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b">
                                        <tr>
                                            <th className="text-left p-3 font-medium text-zinc-500">Name</th>
                                            <th className="text-left p-3 font-medium text-zinc-500">Datum</th>
                                            <th className="text-right p-3 font-medium text-zinc-500">Aktion</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {backups.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="p-4 text-center text-zinc-400 italic">
                                                    Keine Backups gefunden.
                                                </td>
                                            </tr>
                                        ) : (
                                            backups.map((backup) => {
                                                const isLastRestored = lastRestoredBackupInfo?.id === backup.id;
                                                return (
                                                    <tr key={backup.id} className={cn(
                                                        "hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors",
                                                        isLastRestored && "bg-blue-50/30 dark:bg-blue-900/10"
                                                    )}>
                                                        <td className="p-3 font-medium flex items-center gap-2">
                                                            {backup.name}
                                                            {isLastRestored && (
                                                                <Badge variant="outline" className="text-[10px] py-0 px-1 border-blue-200 text-blue-600 bg-blue-50">Zuletzt</Badge>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-zinc-500 text-xs">
                                                            {new Date(backup.created_at).toLocaleString('de-DE')}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    className={cn(
                                                                        "text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-1 h-8 px-2",
                                                                        isLastRestored && "bg-blue-50 dark:bg-blue-900/20"
                                                                    )}
                                                                    onClick={() => handleRestore(backup.id, backup.name)}
                                                                    disabled={backupLoading}
                                                                >
                                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                                    Wiederherstellen
                                                                </Button>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                                                                    onClick={() => handleDeleteBackup(backup.id, backup.name)}
                                                                    disabled={backupLoading}
                                                                    title="Backup löschen"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Server className="w-5 h-5 text-zinc-500" />
                                    Verbundene Geräte
                                </h3>
                                {typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined && (
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={handleSetLeadingDatabase}
                                        disabled={loading || devices.find(d => d.device_id === currentDeviceId)?.is_leading_db}
                                    >
                                        Als "Führende Datenbank" markieren
                                    </Button>
                                )}
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b">
                                        <tr>
                                            <th className="text-left p-3 font-medium text-zinc-500">Gerät</th>
                                            <th className="text-left p-3 font-medium text-zinc-500">Zuletzt Online</th>
                                            <th className="text-left p-3 font-medium text-zinc-500">Status</th>
                                            <th className="text-right p-3 font-medium text-zinc-500">Aktionen</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {devices.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-zinc-400 italic">
                                                    Keine Geräte gefunden.
                                                </td>
                                            </tr>
                                        ) : (
                                            devices.map((device) => {
                                                const isCurrent = device.device_id === currentDeviceId;
                                                return (
                                                    <tr key={device.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                                        <td className="p-3">
                                                            <div className="font-medium flex items-center gap-2">
                                                                {device.device_name}
                                                                {isCurrent && (
                                                                    <Badge variant="secondary" className="text-[10px] py-0 px-1">Aktuelles Gerät</Badge>
                                                                )}
                                                                {device.is_leading_db && device.status === 'active' && (
                                                                    <Badge variant="outline" className="text-[10px] py-0 px-1 border-blue-200 text-blue-600 bg-blue-50">Local DB</Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-zinc-400 font-mono mt-0.5" title={device.device_id}>
                                                                {device.device_id.substring(0, 8)}...
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-zinc-500 text-xs">
                                                            {new Date(device.last_seen_at).toLocaleString('de-DE')}
                                                        </td>
                                                        <td className="p-3">
                                                            {device.status === 'active' ? (
                                                                <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400">Aktiv</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400">Abgemeldet</Badge>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            {!isCurrent && device.status === 'active' && (
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8"
                                                                    onClick={() => handleRevokeDevice(device)}
                                                                    disabled={loading}
                                                                >
                                                                    Abmelden
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
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

            <ConfirmDialog 
                isOpen={isRestoreDialogOpen}
                onOpenChange={setIsRestoreDialogOpen}
                onConfirm={confirmRestore}
                title="Backup wiederherstellen"
                description={`Möchten Sie das Backup "${selectedBackup?.name}" wirklich wiederherstellen? Alle lokalen Daten werden durch den Stand vom ${selectedBackup ? new Date(selectedBackup.created_at).toLocaleString('de-DE') : ''} überschrieben.`}
                confirmText="Jetzt Wiederherstellen"
                variant="info"
                isLoading={backupLoading}
            />

            <ConfirmDialog 
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="Backup löschen"
                description={`Möchten Sie das Backup "${selectedBackup?.name}" wirklich unwiderruflich aus der Cloud löschen?`}
                confirmText="Unwiderruflich löschen"
                variant="danger"
                isLoading={backupLoading}
            />

            <ConfirmDialog 
                isOpen={isRevokeDialogOpen}
                onOpenChange={setIsRevokeDialogOpen}
                onConfirm={confirmRevokeDevice}
                title="Gerät abmelden"
                description={`Möchten Sie dem Gerät "${selectedDevice?.device_name}" wirklich den Zugriff entziehen? Das Gerät wird beim nächsten Verbindungsaufbau automatisch ausgeloggt.`}
                confirmText="Gerät abmelden"
                variant="danger"
                isLoading={loading}
            />


        </div>
    );
}
