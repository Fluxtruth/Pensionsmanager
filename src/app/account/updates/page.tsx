"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
    Download, 
    RefreshCw, 
    CheckCircle2, 
    Sparkles, 
    ArrowLeft, 
    Search, 
    Tag, 
    Calendar, 
    ShieldCheck, 
    Bug, 
    Wrench, 
    Layers, 
    ChevronDown, 
    ChevronUp,
    Info,
    ExternalLink
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ChangeItem {
    type: "feature" | "improvement" | "fix" | "security";
    text: string;
}

interface ReleaseNote {
    version: string;
    date: string;
    isCurrent?: boolean;
    title: string;
    summary: string;
    changes: ChangeItem[];
}

const RELEASE_NOTES: ReleaseNote[] = [
    {
        version: "v1.11.15",
        date: "21. August 2026",
        isCurrent: true,
        title: "Fenster-Status-Persistierung & E2E-Optimierungen",
        summary: "Automatisches Speichern und Wiederherstellen von Fenstergröße, Position und Vollbildstatus beim Beenden und Neustarten der Desktop-App.",
        changes: [
            { type: "feature", text: "Fensterzustand (Größe, Position, Maximiert) wird über Tauri Window State Plugin dauerhaft gespeichert." },
            { type: "improvement", text: "Standard-Startfenster wird bei Erstinstallation auf maximiert gesetzt." },
            { type: "fix", text: "Stabilität bei Neustarts und Mehrfachbildschirm-Setups verbessert." },
            { type: "security", text: "Compliance- und Rechtsdokumente in Mein Account integriert (AVV, TOMs, Pilotvereinbarung)." }
        ]
    },
    {
        version: "v1.11.14",
        date: "20. August 2026",
        title: "Tauri Updater & Versions-Synchronisation",
        summary: "Harmonisierung der Build-Artefakte und Fehlerbehebung bei Versionsprüfungen im Desktop-Client.",
        changes: [
            { type: "improvement", text: "Versionsnummern-Abgleich zwischen Tauri Config, Cargo.toml und Frontend vereinheitlicht." },
            { type: "fix", text: "Behebung des Versions-Mismatchs beim automatischen Update-Check." }
        ]
    },
    {
        version: "v1.11.13",
        date: "19. August 2026",
        title: "System-Dokumentation & Backlog",
        summary: "Einführung der integrierten System-Dokumentation mit Architekturübersicht und MoSCoW-Priorisierung.",
        changes: [
            { type: "feature", text: "Neue Menüseite 'System-Dokumentation' mit Architekturbeschreibung und Live-Backlog." },
            { type: "improvement", text: "Erweiterte Filter- und Sortiermöglichkeiten für interne Entwickler-Dokumente." }
        ]
    },
    {
        version: "v1.11.12",
        date: "18. August 2026",
        title: "Gästedaten-Validierung & Tabellen-Schutz",
        summary: "Schutz vor Überlauf und Zeilenumbrüchen bei überlangen Gastnamen und Adressfeldern.",
        changes: [
            { type: "improvement", text: "Eingabebeschränkungen und Zeichenzähler in allen Gästedaten-Formularen hinzugefügt." },
            { type: "fix", text: "Automatisches Text-Truncating in der Gästeliste verhindert horizontales Scrollen/Layout-Bruch." },
            { type: "fix", text: "Verhinderung von Dialog-Verzerrungen bei langen Namenseingaben." }
        ]
    },
    {
        version: "v1.11.11",
        date: "15. August 2026",
        title: "Passwort-Reset & Authentifizierungs-Sicherheit",
        summary: "Verbesserte Fehlerbehandlung beim Zurücksetzen des Passworts und robuste Session-Validierung.",
        changes: [
            { type: "security", text: "Sicherer Fallback-Mechanismus beim Supabase-Passwort-Reset implementiert." },
            { type: "improvement", text: "Klar verständliche Fehlermeldungen bei abgelaufenen Auth-Links." }
        ]
    },
    {
        version: "v1.11.6",
        date: "10. August 2026",
        title: "Frühstücksplaner & Synchronisations-Engine",
        summary: "Automatisierte Frühstückslisten, Brötchenbestellungen und Echtzeit-Synchronisation.",
        changes: [
            { type: "feature", text: "Automatischer Frühstücksplaner mit Tages- und Zimmerübersichten." },
            { type: "feature", text: "Echtzeit-Synchronisations-Engine für Multi-Device-Betrieb." },
            { type: "improvement", text: "Offline-First SQLite-Datenbankunterstützung mit Cloud-Fallback." }
        ]
    }
];

export default function UpdatesPage() {
    const [appVersion, setAppVersion] = useState("v1.11.15");
    const [isDesktop, setIsDesktop] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string>("all");
    const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({
        "v1.11.15": true
    });
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        const fetchVersion = async () => {
            if (typeof window !== "undefined" && '__TAURI_INTERNALS__' in window) {
                setIsDesktop(true);
                try {
                    const { getVersion } = await import("@tauri-apps/api/app");
                    const version = await getVersion();
                    setAppVersion(`v${version}`);
                } catch (e) {
                    console.error("Failed to fetch app version:", e);
                }
            }
        };
        fetchVersion();
    }, []);

    const toggleExpand = (version: string) => {
        setExpandedVersions(prev => ({
            ...prev,
            [version]: !prev[version]
        }));
    };

    const handleCheckForUpdates = () => {
        if (!isDesktop) {
            alert("Die automatische Update-Prüfung steht exklusiv in der Desktop-App (Windows/macOS) zur Verfügung.");
            return;
        }
        setIsChecking(true);
        window.dispatchEvent(new CustomEvent('check-for-updates'));
        setTimeout(() => setIsChecking(false), 1200);
    };

    const filteredReleases = useMemo(() => {
        return RELEASE_NOTES.filter(release => {
            const matchesSearch = 
                release.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
                release.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                release.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                release.changes.some(c => c.text.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesType = selectedType === "all" || release.changes.some(c => c.type === selectedType);

            return matchesSearch && matchesType;
        });
    }, [searchQuery, selectedType]);

    const getTypeBadge = (type: ChangeItem["type"]) => {
        switch (type) {
            case "feature":
                return (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 text-[11px] gap-1">
                        <Sparkles className="w-3 h-3" /> Feature
                    </Badge>
                );
            case "improvement":
                return (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800 text-[11px] gap-1">
                        <Wrench className="w-3 h-3" /> Verbesserung
                    </Badge>
                );
            case "fix":
                return (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800 text-[11px] gap-1">
                        <Bug className="w-3 h-3" /> Bugfix
                    </Badge>
                );
            case "security":
                return (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800 text-[11px] gap-1">
                        <ShieldCheck className="w-3 h-3" /> Sicherheit
                    </Badge>
                );
        }
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-6xl mx-auto">
            {/* Header mit Zurück-Link */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link 
                            href="/account" 
                            className="inline-flex items-center text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors gap-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Zurück zu Mein Account
                        </Link>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Update & Versionshinweise</h2>
                    <p className="text-muted-foreground">
                        Aktueller Software-Stand, Update-Prüfung und Release-Notes im Überblick.
                    </p>
                </div>
            </div>

            <Separator />

            {/* Software-Update Card */}
            <Card className="shadow-md border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950/50">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                <RefreshCw className={cn("w-6 h-6", isChecking && "animate-spin")} />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Software-Update</CardTitle>
                                <CardDescription>
                                    Prüfen Sie, ob eine neue Version des Pensionsmanagers zur Verfügung steht.
                                </CardDescription>
                            </div>
                        </div>
                        <Button
                            onClick={handleCheckForUpdates}
                            disabled={isChecking}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10 px-5 shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            {isChecking ? "Prüfe..." : "Nach Updates suchen"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                    <div className="grid gap-4 sm:grid-cols-3 p-4 bg-zinc-100/70 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Installierte Version</span>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="font-mono text-sm px-2.5 py-0.5 font-bold bg-white dark:bg-zinc-800 border">
                                    {appVersion}
                                </Badge>
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Aktiv
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Umgebung</span>
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                {isDesktop ? "Tauri Desktop Client" : "Webanwendung (Browser)"}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Auto-Updates</span>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                Bei jedem Start der Desktop-App wird automatisch nach neuen Releases gesucht.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Versionshinweise / Changelog Sektion */}
            <Card className="shadow-md border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-500" />
                                Versionshinweise & Release-Historie
                            </CardTitle>
                            <CardDescription>
                                Alle Änderungen, Neuerungen und Optimierungen vergangener Versionen.
                            </CardDescription>
                        </div>

                        {/* Suchfeld und Typ-Filter */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative w-full sm:w-60">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <Input
                                    placeholder="Suche in Releases..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>

                            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                                {[
                                    { id: "all", label: "Alle" },
                                    { id: "feature", label: "Features" },
                                    { id: "improvement", label: "Verbesserungen" },
                                    { id: "fix", label: "Fixes" }
                                ].map(filter => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setSelectedType(filter.id)}
                                        className={cn(
                                            "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                                            selectedType === filter.id
                                                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                                        )}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                    {filteredReleases.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 text-sm">
                            Keine Versionshinweise gefunden für Ihre Suchkriterien.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredReleases.map((release) => {
                                const isExpanded = !!expandedVersions[release.version];
                                return (
                                    <div
                                        key={release.version}
                                        className={cn(
                                            "rounded-xl border transition-all overflow-hidden",
                                            release.isCurrent
                                                ? "border-blue-200 dark:border-blue-800/80 bg-blue-50/20 dark:bg-blue-950/10"
                                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40"
                                        )}
                                    >
                                        <button
                                            onClick={() => toggleExpand(release.version)}
                                            className="w-full p-4 text-left flex items-start justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-bold text-base font-mono text-zinc-900 dark:text-zinc-100">
                                                        {release.version}
                                                    </span>
                                                    {release.isCurrent && (
                                                        <Badge className="bg-blue-600 text-white text-[10px] uppercase tracking-wide">
                                                            Aktuell
                                                        </Badge>
                                                    )}
                                                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {release.date}
                                                    </span>
                                                </div>
                                                <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                                    {release.title}
                                                </h4>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                    {release.summary}
                                                </p>
                                            </div>
                                            <div className="pt-1 text-zinc-400 shrink-0">
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="px-4 pb-4 pt-1 border-t border-zinc-100 dark:border-zinc-800/60 animate-in fade-in-50 duration-150">
                                                <ul className="space-y-2.5 mt-2">
                                                    {release.changes
                                                        .filter(c => selectedType === "all" || c.type === selectedType)
                                                        .map((change, idx) => (
                                                            <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                                                                <div className="shrink-0 mt-0.5">
                                                                    {getTypeBadge(change.type)}
                                                                </div>
                                                                <span className="leading-relaxed mt-0.5">
                                                                    {change.text}
                                                                </span>
                                                            </li>
                                                        ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
